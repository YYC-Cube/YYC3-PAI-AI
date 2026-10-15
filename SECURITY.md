# Security Policy

## Supported versions

| Version | Supported |
|---------|-----------|
| latest release on `main` | ✅ |
| older releases | best effort |

## Reporting a vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

- **GitHub Security Advisory:** [Create advisory](https://github.com/YYC-Cube/YYC3-PAI-AI/security/advisories/new)
- **Email:** <admin@0379.email>

We aim to acknowledge reports within **3 business days** and provide a fix timeline within **7 business days** for confirmed issues.

## Scope

YYC3-Pai is a self-hosted control plane. Operators are responsible for:

- Securing the host and network exposure of `pai run`
- Rotating JWT secrets and admin credentials
- Reviewing tool guard rules under `~/.yyc3-pai/security/tool_guard/`
- Protecting LLM API keys and IM channel credentials

See [docs/configuration.md](docs/configuration.md) for deployment hardening guidance.
