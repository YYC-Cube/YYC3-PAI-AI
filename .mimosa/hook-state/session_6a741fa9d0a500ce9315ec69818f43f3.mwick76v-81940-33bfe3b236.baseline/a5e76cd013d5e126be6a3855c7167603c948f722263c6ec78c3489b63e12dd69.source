#!/bin/bash

# YYC3-AI 版本追溯系统
# 用于跟踪和管理代码文件的版本变更

set -euo pipefail

# 配置
VERSION_TRACKER_FILE=".version-tracker.json"
CHANGELOG_FILE="CHANGELOG.md"
GIT_LOG_FILE=".git-versions.log"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_version() {
    echo -e "${BLUE}[VERSION]${NC} $1"
}

# 初始化版本追踪器
init_version_tracker() {
    if [ ! -f "$VERSION_TRACKER_FILE" ]; then
        log_info "初始化版本追踪器..."
        cat > "$VERSION_TRACKER_FILE" << EOF
{
  "project": "YYC3 AI Code",
  "version": "v1.0.0",
  "created": "2026-03-19",
  "lastUpdated": "2026-03-19",
  "files": {}
}
EOF
        log_info "✓ 版本追踪器已初始化"
    fi
}

# 提取文件标头信息
extract_header_info() {
    local file_path=$1
    local filename=$(basename "$file_path")
    
    local file_info=$(cat << EOF
{
  "path": "$file_path",
  "name": "$filename",
  "version": "v1.0.0",
  "created": "2026-03-19",
  "updated": "2026-03-19",
  "status": "stable",
  "author": "YanYuCloudCube Team",
  "tags": []
}
EOF
)
    
    # 尝试从文件中提取标头信息
    if [ -f "$file_path" ]; then
        local header=$(sed -n '/^\/\*\*/,/^ *\*\//p' "$file_path" 2>/dev/null || echo "")
        
        if [ -n "$header" ]; then
            # 提取版本号
            local version=$(echo "$header" | grep -o '@version [^*]*' | sed 's/@version //' | head -1)
            if [ -n "$version" ]; then
                file_info=$(echo "$file_info" | sed "s/\"version\": \"v1.0.0\"/\"version\": \"$version\"/")
            fi
            
            # 提取创建日期
            local created=$(echo "$header" | grep -o '@created [^*]*' | sed 's/@created //' | head -1)
            if [ -n "$created" ]; then
                file_info=$(echo "$file_info" | sed "s/\"created\": \"2026-03-19\"/\"created\": \"$created\"/")
            fi
            
            # 提取更新日期
            local updated=$(echo "$header" | grep -o '@updated [^*]*' | sed 's/@updated //' | head -1)
            if [ -n "$updated" ]; then
                file_info=$(echo "$file_info" | sed "s/\"updated\": \"2026-03-19\"/\"updated\": \"$updated\"/")
            fi
            
            # 提取状态
            local status=$(echo "$header" | grep -o '@status [^*]*' | sed 's/@status //' | head -1)
            if [ -n "$status" ]; then
                file_info=$(echo "$file_info" | sed "s/\"status\": \"stable\"/\"status\": \"$status\"/")
            fi
            
            # 提取标签
            local tags=$(echo "$header" | grep -o '@tags [^*]*' | sed 's/@tags //' | head -1)
            if [ -n "$tags" ]; then
                # 将标签转换为 JSON 数组
                local tags_json=$(echo "$tags" | awk -F',' '{for(i=1;i<=NF;i++) printf "\"%s\"%s", $i, (i<NF?", ":"")}' | sed 's/,$//')
                file_info=$(echo "$file_info" | sed "s/\"tags\": \[\]/\"tags\": [$tags_json]/")
            fi
        fi
    fi
    
    echo "$file_info"
}

# 更新文件版本信息
update_file_version() {
    local file_path=$1
    local new_version=$2
    local change_type=$3
    
    if [ ! -f "$file_path" ]; then
        log_error "文件不存在: $file_path"
        return 1
    fi
    
    log_info "更新文件版本: $file_path -> $new_version"
    
    # 读取当前版本追踪器
    local tracker_content=$(cat "$VERSION_TRACKER_FILE")
    
    # 提取文件信息
    local file_info=$(extract_header_info "$file_path")
    
    # 更新文件版本
    local updated_info=$(echo "$file_info" | sed "s/\"version\": \"[^\"]*\"/\"version\": \"$new_version\"/")
    updated_info=$(echo "$updated_info" | sed "s/\"updated\": \"[^\"]*\"/\"updated\": \"$(date +%Y-%m-%d)\"/")
    
    # 使用 jq 更新 JSON（如果可用）
    if command -v jq &> /dev/null; then
        local filename=$(basename "$file_path")
        local relative_path=${file_path#./}
        
        # 更新或添加文件信息
        local new_tracker=$(echo "$tracker_content" | jq --arg path "$relative_path" --arg info "$updated_info" '
            if .files[$path] then
                .files[$path] = ($info | fromjson)
            else
                .files += {($path): ($info | fromjson)}
            end
        ')
        
        echo "$new_tracker" > "$VERSION_TRACKER_FILE"
    else
        log_warn "jq 未安装，使用简单文本处理"
        # 简单处理：追加文件信息到日志
        echo "$(date +%Y-%m-%d) $file_path $new_version $change_type" >> "$GIT_LOG_FILE"
    fi
    
    # 更新文件标头
    update_file_header "$file_path" "$new_version"
    
    log_version "✓ 文件版本已更新: $file_path -> $new_version"
}

# 更新文件标头中的版本号
update_file_header() {
    local file_path=$1
    local new_version=$2
    local current_date=$(date +%Y-%m-%d)
    
    if [ ! -f "$file_path" ]; then
        return 1
    fi
    
    # 更新 @version 字段
    sed -i '' "s/@version [^*]*/@version $new_version/" "$file_path"
    
    # 更新 @updated 字段
    sed -i '' "s/@updated [^*]*/@updated $current_date/" "$file_path"
    
    log_info "✓ 文件标头已更新: $file_path"
}

# 生成版本报告
generate_version_report() {
    log_info "生成版本报告..."
    
    echo ""
    echo "=========================================="
    echo "  YYC3-AI 版本追踪报告"
    echo "=========================================="
    echo ""
    
    if command -v jq &> /dev/null; then
        # 使用 jq 生成格式化报告
        echo "项目版本: $(cat "$VERSION_TRACKER_FILE" | jq -r '.version')"
        echo "创建日期: $(cat "$VERSION_TRACKER_FILE" | jq -r '.created')"
        echo "最后更新: $(cat "$VERSION_TRACKER_FILE" | jq -r '.lastUpdated')"
        echo ""
        echo "追踪文件数: $(cat "$VERSION_TRACKER_FILE" | jq '.files | length')"
        echo ""
        
        echo "文件列表:"
        echo "----------------------------------------"
        cat "$VERSION_TRACKER_FILE" | jq -r '.files | to_entries[] | "\(.key) - \(.value.version) - \(.value.status)"' | while read -r line; do
            echo "  $line"
        done
    else
        # 简单文本报告
        echo "项目版本: v1.0.0"
        echo "创建日期: 2026-03-19"
        echo "最后更新: $(date +%Y-%m-%d)"
        echo ""
        echo "追踪文件数: $(find src -type f \( -name "*.ts" -o -name "*.tsx" \) | wc -l)"
        echo ""
        
        echo "文件列表:"
        echo "----------------------------------------"
        find src -type f \( -name "*.ts" -o -name "*.tsx" \) | head -20 | while read -r file; do
            echo "  $file"
        done
    fi
    
    echo ""
    echo "=========================================="
}

# 批量更新版本
batch_update_versions() {
    local version=$1
    local change_type=$2
    
    if [ -z "$version" ]; then
        log_error "请指定版本号"
        return 1
    fi
    
    log_info "批量更新所有文件到版本: $version"
    
    find src -type f \( -name "*.ts" -o -name "*.tsx" \) | while read -r file; do
        update_file_version "$file" "$version" "$change_type"
    done
    
    # 更新项目版本
    if command -v jq &> /dev/null; then
        local tracker_content=$(cat "$VERSION_TRACKER_FILE")
        local new_tracker=$(echo "$tracker_content" | jq --arg version "$version" --arg date "$(date +%Y-%m-%d)" '
            .version = $version |
            .lastUpdated = $date
        ')
        echo "$new_tracker" > "$VERSION_TRACKER_FILE"
    fi
    
    log_version "✓ 批量更新完成: $version"
}

# 生成变更日志
generate_changelog() {
    log_info "生成变更日志..."
    
    cat > "$CHANGELOG_FILE" << EOF
# YYC3-AI 变更日志

本文档记录 YYC3-AI 项目的所有重要变更。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [未发布]

### 新增
- 项目初始化
- 添加代码标头规范
- 实现版本追溯系统

### 变更
- 标准化所有代码文件标头
- 建立文件分类和标签系统

### 修复
- 修复文件版本追踪问题

## [v1.0.0] - 2026-03-19

### 新增
- 初始版本发布
- 核心功能实现
- 基础UI组件
- 状态管理系统
- AI集成功能

### 变更
- 建立项目架构
- 实现多面板布局
- 添加主题系统

### 修复
- 修复初始bug

---

## 版本说明

### 版本号格式

版本号遵循 **MAJOR.MINOR.PATCH** 格式：

- **MAJOR**: 不兼容的 API 修改
- **MINOR**: 向下兼容的功能性新增
- **PATCH**: 向下兼容的问题修正

### 变更类型

- **新增**: 新功能或新特性
- **变更**: 现有功能的改进或优化
- **修复**: Bug 修复
- **移除**: 移除的功能或特性
- **安全**: 安全相关的修复

## 联系方式

- **维护团队**: YanYuCloudCube Team
- **联系邮箱**: admin@0379.email
- **项目地址**: https://github.com/YYC3/
EOF

    log_info "✓ 变更日志已生成: $CHANGELOG_FILE"
}

# 显示帮助信息
show_help() {
    cat << EOF
YYC3-AI 版本追溯系统

用法:
  $0 <command> [options]

命令:
  init              初始化版本追踪器
  update <file> <version> [type]
                    更新指定文件的版本
  batch <version> [type]
                    批量更新所有文件版本
  report            生成版本报告
  changelog         生成变更日志
  help              显示此帮助信息

选项:
  type              变更类型 (patch/minor/major)
                    默认: patch

示例:
  $0 init
  $0 update src/app/store/app-store.ts v1.1.0 minor
  $0 batch v1.2.0 patch
  $0 report
  $0 changelog

EOF
}

# 主函数
main() {
    local command=${1:-help}
    
    case "$command" in
        init)
            init_version_tracker
            ;;
        update)
            if [ -z "$2" ] || [ -z "$3" ]; then
                log_error "用法: $0 update <file> <version> [type]"
                exit 1
            fi
            update_file_version "$2" "$3" "${4:-patch}"
            ;;
        batch)
            if [ -z "$2" ]; then
                log_error "用法: $0 batch <version> [type]"
                exit 1
            fi
            batch_update_versions "$2" "${3:-patch}"
            ;;
        report)
            generate_version_report
            ;;
        changelog)
            generate_changelog
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            log_error "未知命令: $command"
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"
