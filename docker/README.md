# YYC3-Pai Docker Deployment

---

This directory contains the Docker build and deployment assets for YYC3-Pai.

### Files

| File | Description |
|------|-------------|
| `Dockerfile` | Multi-stage image definition (build context is the repo root) |
| `../.dockerignore` | Build context ignore rules (applies to both Podman and BuildKit) |
| `docker_build.sh` | Build image from source (BuildKit cache enabled by default) |
| `docker-compose.yml` | One-command local / self-hosted deployment |
| `docker-compose.postgres.yml` | PostgreSQL (+ pgvector) for dual-backend dev/tests |
| `postgres/init-vector.sql` | Instance-level `CREATE EXTENSION vector` (initdb.d; **not** YYC3-Pai migrations) |
| `docker-entrypoint.sh` | Container entrypoint: first-run init + start server |

### Quick start

**Option 1: Compose (recommended)**

From the repository root:

```bash
docker compose -f docker/docker-compose.yml up -d --build
```

Open `http://localhost:8088`. If `YYC3_DEFAULT_PASSWORD` is unset, a strong random password is generated on first init and written to `/data/.yyc3-pai/credential.txt`; if it is set, it is used as-is (must be ≥8 characters with letters and digits; passwords rejected by the app password policy — e.g. common ones — fall back to a random one automatically). Change the password immediately after first login.

**Option 2: Build script**

```bash
bash docker/docker_build.sh
docker run -d \
  --name yyc3-pai \
  -p 8088:8088 \
  -v yyc3-pai-data:/data/.yyc3-pai \
  -e HOME=/data \
  yyc3-pai:latest
```

### Faster downloads (China mirrors)

Pass mirror env vars when building:

```bash
PIP_INDEX_URL=https://mirrors.cloud.tencent.com/pypi/simple \
PIP_TRUSTED_HOST=mirrors.cloud.tencent.com \
NPM_REGISTRY=https://mirrors.cloud.tencent.com/npm/ \
APT_MIRROR=mirrors.cloud.tencent.com \
bash docker/docker_build.sh
```

### Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `HOME` | `/data` | Must be `/data` so `~/.yyc3-pai` maps to the data volume |
| `YYC3_PORT` | `8088` | HTTP listen port |
| `YYC3_DEFAULT_PASSWORD` | _(unset)_ | First-run admin password (≥8 chars, letters + digits). When unset, a random password is generated and written to `credential.txt` |
| `YYC3_ADMIN_USERNAME` | `admin` | Initial admin username |
| `YYC3_PAI_HOME` | `~/.yyc3-pai` | Data root directory |
| `YYC3_DATABASE_URL` | — | PostgreSQL DSN (or other `YYC3_DATABASE_*`; see [configuration.md](../docs/configuration.md)) |
| `YYC3_DATABASE_DRIVER` | — | `sqlite` \| `postgresql` when overriding defaults via env |
| `OPENAI_API_KEY` | — | OpenAI-compatible API key |
| `DASHSCOPE_API_KEY` | — | Alibaba DashScope API key |

Legacy `OCTOP_*` variables remain supported as fallbacks. For Compose, put these in `docker/.env`. Values only reach the container if listed under `environment:` in `docker-compose.yml` (Compose interpolates `.env`; it does not auto-export every key). Alternatively write the same keys into the mounted data dir as `~/.yyc3-pai/env`.

### Data persistence

- Compose mounts host `~/.yyc3-pai` → container `/data/.yyc3-pai`
- `docker run` example uses named volume `yyc3-pai-data`
- First boot runs `pai init`; credentials are written to `/data/.yyc3-pai/credential.txt`. With `YYC3_DEFAULT_PASSWORD` unset a random password is generated; a specified password that the app password policy rejects falls back to a random one automatically (the container must never fail its first init because of a weak default).

### Health check

The image probes `GET /api/health`:

```bash
curl http://localhost:8088/api/health
```

### Operations

```bash
docker logs -f yyc3-pai
docker exec -it yyc3-pai pai --version
docker compose -f docker/docker-compose.yml down
docker compose -f docker/docker-compose.yml up -d --build
```
