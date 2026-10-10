"""Boot-time captcha env snapshot."""

from __future__ import annotations

import os
from collections.abc import Mapping
from dataclasses import dataclass

from octop.infra.auth.captcha.providers import get_provider, parse_slug

_DEFAULT_V3_MIN_SCORE = 0.5

_INSTALLED: CaptchaEnv | None = None


@dataclass(frozen=True)
class CaptchaEnv:
    provider: str
    site_key: str
    secret: str
    v3_min_score: float = _DEFAULT_V3_MIN_SCORE
    cam_secret_id: str = ""
    cam_secret_key: str = ""

    @property
    def pair_complete(self) -> bool:
        return bool(self.site_key) and bool(self.secret)


def snapshot_env(environ: Mapping[str, str] | None = None) -> CaptchaEnv:
    src = os.environ if environ is None else environ

    def pick(suffix: str) -> str:
        """YYC3_CAPTCHA_<suffix> preferred; legacy OCTOP_CAPTCHA_<suffix> fallback."""
        val = src.get(f"YYC3_CAPTCHA_{suffix}")
        if val is None:
            val = src.get(f"OCTOP_CAPTCHA_{suffix}")
        return (val or "").strip()

    raw = pick("PROVIDER")
    if not raw:
        provider = "slider"
    else:
        try:
            provider = parse_slug(raw)
        except ValueError:
            provider = raw.strip().lower()
    score_raw = pick("V3_MIN_SCORE")
    try:
        v3_min_score = float(score_raw) if score_raw else _DEFAULT_V3_MIN_SCORE
    except ValueError:
        v3_min_score = _DEFAULT_V3_MIN_SCORE
    return CaptchaEnv(
        provider=provider,
        site_key=pick("SITE_KEY"),
        secret=pick("SECRET"),
        v3_min_score=v3_min_score,
        cam_secret_id=pick("CAM_SECRET_ID"),
        cam_secret_key=pick("CAM_SECRET_KEY"),
    )


def install_env(env: CaptchaEnv) -> None:
    global _INSTALLED
    _INSTALLED = env


def current_env() -> CaptchaEnv:
    if _INSTALLED is None:
        return snapshot_env({})
    return _INSTALLED


def validate_boot(env: CaptchaEnv, *, has_readable_blob: bool) -> None:
    if has_readable_blob:
        return
    if env.provider == "slider":
        return
    provider = get_provider(env.provider)
    if provider is None or not provider.requires_token:
        raise ValueError(f"unknown or incomplete CAPTCHA_PROVIDER={env.provider!r}")
    missing: list[str] = []
    if not env.site_key:
        missing.append("CAPTCHA_SITE_KEY")
    if not env.secret:
        missing.append("CAPTCHA_SECRET")
    if env.provider == "tencent":
        if not env.cam_secret_id:
            missing.append("CAPTCHA_CAM_SECRET_ID")
        if not env.cam_secret_key:
            missing.append("CAPTCHA_CAM_SECRET_KEY")
    if missing:
        raise ValueError("incomplete captcha env (no settings blob): " + ", ".join(missing))
