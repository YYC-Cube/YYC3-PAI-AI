#!/usr/bin/env bash
# =============================================================================
# YYC3-Pai 容器入口脚本
#
# 环境变量:
#   HOME                      — 必须为 /data，使 ~/.yyc3-pai 映射到数据卷
#   YYC3_DEFAULT_PASSWORD     — 首次管理员密码（须 ≥8 位且含字母和数字；
#                               不设置则自动生成随机密码，凭据写入
#                               /data/.yyc3-pai/credential.txt）
#   YYC3_ADMIN_USERNAME       — 首次管理员用户名（默认: admin）
#   YYC3_ADMIN_DISPLAY_NAME   — 可选显示名
#   YYC3_PORT                 — 服务端口（默认: 8088）
#   YYC3_PAI_HOME             — 数据根目录（默认: /data/.yyc3-pai）
#
# 旧变量 OCTOP_* 与 OCTOP_HOME 仍作为兜底兼容。
#
# 密码兜底：应用侧密码策略带常见弱密码黑名单，旧版默认密码会让 pai init 报
# "password is too common" 退出、容器反复重启。现在：未设置密码时自动生成随机
# 强密码；指定的密码被策略拒绝时也自动改用随机密码重试，保证容器一定能完成
# 首次初始化。
# =============================================================================
set -euo pipefail

export HOME="${HOME:-/data}"
PAI_HOME="${YYC3_PAI_HOME:-${OCTOP_HOME:-${HOME}/.yyc3-pai}}"
export YYC3_PAI_HOME="$PAI_HOME"
DB_FILE="${PAI_HOME}/yyc3-pai.db"
[ -f "${PAI_HOME}/octop.db" ] && DB_FILE="${PAI_HOME}/octop.db"
CREDENTIAL_FILE="${PAI_HOME}/credential.txt"
ADMIN_USERNAME="${YYC3_ADMIN_USERNAME:-${OCTOP_ADMIN_USERNAME:-admin}}"
ADMIN_DISPLAY_NAME="${YYC3_ADMIN_DISPLAY_NAME:-${OCTOP_ADMIN_DISPLAY_NAME:-Admin}}"
PORT="${YYC3_PORT:-${OCTOP_PORT:-8088}}"

# 生成随机密码（首字符字母、末字符数字，避开易混淆字符）。
random_password() {
    local letters='abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ'
    local digits='23456789'
    local all="${letters}${digits}" n=16 out="" i b
    b="$(od -An -N1 -tu1 /dev/urandom 2>/dev/null | tr -d '[:space:]')"
    out="${letters:$((b % ${#letters})):1}"
    for ((i = 1; i < n - 1; i++)); do
        b="$(od -An -N1 -tu1 /dev/urandom 2>/dev/null | tr -d '[:space:]')"
        out+="${all:$((b % ${#all})):1}"
    done
    b="$(od -An -N1 -tu1 /dev/urandom 2>/dev/null | tr -d '[:space:]')"
    out+="${digits:$((b % ${#digits})):1}"
    printf '%s' "$out"
}

DEFAULT_PASSWORD="${YYC3_DEFAULT_PASSWORD:-${OCTOP_DEFAULT_PASSWORD:-}}"

if [ ! -f "$DB_FILE" ]; then
    echo "[entrypoint] 首次启动，正在初始化 YYC3-Pai..."

    if [ -z "$DEFAULT_PASSWORD" ]; then
        DEFAULT_PASSWORD="$(random_password)"
        echo "[entrypoint] 未设置 YYC3_DEFAULT_PASSWORD，已自动生成随机密码。"
    fi

    init_log="$(mktemp)"
    run_init() {
        pai init \
            --yes \
            --admin-username "$ADMIN_USERNAME" \
            --admin-password "$DEFAULT_PASSWORD" \
            ${ADMIN_DISPLAY_NAME:+--admin-display-name "$ADMIN_DISPLAY_NAME"} \
            >"$init_log" 2>&1
    }
    if ! run_init; then
        if grep -qiE 'password is too common|password too short|password must include' "$init_log"; then
            echo "[entrypoint] 指定的初始密码未通过应用密码策略（过弱或过于常见），改用随机密码重试 ..."
            DEFAULT_PASSWORD="$(random_password)"
            if ! run_init; then
                cat "$init_log" >&2 || true
                rm -f "$init_log"
                echo "[entrypoint] 初始化失败，请检查上方日志。" >&2
                exit 1
            fi
        else
            cat "$init_log" >&2 || true
            rm -f "$init_log"
            echo "[entrypoint] 初始化失败（不是密码策略问题）。若数据目录已有文件但没有 yyc3-pai.db / octop.db，请检查卷挂载。" >&2
            exit 1
        fi
    fi
    rm -f "$init_log"

    cat > "$CREDENTIAL_FILE" << EOF
YYC3-Pai Login Credential
=========================
URL:      http://<host>:${PORT}
Username: ${ADMIN_USERNAME}
Password: ${DEFAULT_PASSWORD}

Please change this password after first login!
  - Via Web: avatar menu → Change password
  - Via CLI: docker exec -it <container> pai user passwd --username $ADMIN_USERNAME

This file is rewritten whenever the initial password is (re)generated here.
If you changed the password inside the Web console, that password wins.
EOF
    chmod 600 "$CREDENTIAL_FILE"
    echo "[entrypoint] 凭据已保存至: $CREDENTIAL_FILE"
fi

if [ $# -eq 0 ]; then
    echo "[entrypoint] 正在启动 YYC3-Pai，端口 $PORT..."
    exec pai run --host 0.0.0.0 --port "$PORT"
fi

if [ "$1" = "pai" ]; then
    echo "[entrypoint] 执行命令: $*"
    exec "$@"
fi

echo "[entrypoint] 执行命令: $*"
exec "$@"
