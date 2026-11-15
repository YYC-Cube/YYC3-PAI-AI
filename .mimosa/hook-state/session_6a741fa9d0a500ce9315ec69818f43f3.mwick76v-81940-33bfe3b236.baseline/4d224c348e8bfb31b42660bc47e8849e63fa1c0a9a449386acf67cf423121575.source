#!/usr/bin/env python3
"""
批量修复Markdown文档标头脚本
"""

import os
import sys
from pathlib import Path

YAML_TEMPLATE = '''---
file: {filepath}
description: {description}
author: YanYuCloudCube Team <admin@0379.email>
version: v1.0.0
created: 2026-03-06
updated: 2026-04-09
status: stable
tags: {tags}
category: technical
language: zh-CN
---

> ***YanYuCloudCube***
> *言启象限 | 语枢未来*
> ***Words Initiate Quadrants, Language Serves as Core for Future***
> *万象归元于云枢 | 深栈智启新纪元*
> ***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***

---

'''

def get_description_and_tags(filepath: str) -> tuple:
    """根据文件路径生成描述和标签"""
    path_lower = filepath.lower()
    
    # 根据路径关键词生成描述和标签
    if 'p5' in path_lower or '审核' in path_lower:
        return '项目审核交付报告', '[P5],[audit],[delivery],[report]'
    elif 'p6' in path_lower or 'mvp' in path_lower:
        return 'MVP功能拓展规划文档', '[P6],[mvp],[feature],[planning]'
    elif 'p7' in path_lower or '实施' in path_lower:
        return '项目实施进度报告', '[P7],[implementation],[progress],[report]'
    elif 'vscode' in path_lower or '对标' in path_lower:
        return 'VSCode功能对标分析文档', '[vscode],[benchmark],[analysis]'
    elif '变量' in path_lower or '词库' in path_lower:
        return '项目变量词库定义', '[variable],[dictionary],[config]'
    elif '团队' in path_lower or '规范' in path_lower:
        return '团队开发规范标准文档', '[team],[standard],[specification]'
    elif '项目' in path_lower:
        return '项目设计文档', '[project],[design],[documentation]'
    elif '技术' in path_lower:
        return '技术文档', '[technical],[documentation],[guide]'
    elif '设计' in path_lower:
        return '设计文档', '[design],[documentation],[guide]'
    elif '开发' in path_lower:
        return '开发规范文档', '[development],[standard],[guide]'
    else:
        return '项目文档', '[documentation],[guide]'

def fix_md_file(filepath: str) -> bool:
    """修复单个Markdown文件"""
    try:
        # 路径守卫：仅允许处理本仓库根目录内的文件（阻断 ../ 逃逸）
        repo_root = Path(__file__).resolve().parent.parent
        safe_path = Path(filepath).resolve()
        if not safe_path.is_relative_to(repo_root):
            print(f"❌ 路径越界，已拒绝: {filepath}")
            return False
        filepath = str(safe_path)

        # 读取文件内容
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # 检查是否已经有YAML Front Matter
        if content.startswith('---\n'):
            print(f"✅ 已修复: {filepath}")
            return False

        # 获取描述和标签
        description, tags = get_description_and_tags(filepath)

        # 生成YAML头部
        yaml_header = YAML_TEMPLATE.format(
            filepath=filepath,
            description=description,
            tags=tags
        )

        # 写入新内容
        Path(filepath).write_text(yaml_header + content, encoding='utf-8')
        
        print(f"✅ 已修复: {filepath}")
        return True
    except Exception as e:
        print(f"❌ 错误: {filepath} - {e}")
        return False

def main():
    """主函数"""
    # 获取项目根目录（以脚本自身位置为准，避免硬编码个人机器路径）
    project_root = Path(__file__).resolve().parent.parent
    
    # 需要修复的文件列表 - 扩展列表
    files_to_fix = [
        # VSCode对齐文档
        'docs/VSCode对齐/Week1-Day1-工作总结.md',
        'docs/VSCode对齐/Week1-Day2-工作总结.md',
        'docs/VSCode对齐/Week1-Day3-工作总结.md',
        'docs/VSCode对齐/Week1-Day4-工作总结.md',
        'docs/VSCode对齐/Week1-Day5-工作总结.md',
        'docs/VSCode对齐/P6-季度完善计划-对标VSCode.md',
        'docs/VSCode对齐/P6-季度执行看板.md',
        'docs/VSCode对齐/P6-VSCode功能对标检查清单.md',
        'docs/VSCode对齐/Q2-01-Monaco性能诊断报告.md',
        'docs/VSCode对齐/Q2-01阶段1验收报告.md',
        'docs/VSCode对齐/Q2-01完成总结.md',
        'docs/VSCode对齐/汇总大纲.md',
        'docs/VSCode对齐/遗留问题解决报告.md',
        # 项目文档
        'docs/YYC3-AI-项目文档/YYC3-AI-项目-设置配置.md',
        'docs/YYC3-AI-项目文档/YYC3-AI-项目-左侧面板设计.md',
        'docs/YYC3-AI-项目文档/YYC3-AI-项目-设置主页面.md',
        'docs/YYC3-AI-项目文档/YYC3-AI-项目-FigmaAI提示词.md',
        'docs/YYC3-AI-项目文档/YYC3-AI-项目-项目评审计划.md',
        'docs/YYC3-AI-项目文档/YYC3-AI-项目-项目标准化.md',
        'docs/YYC3-AI-项目文档/YYC3-AI-项目-设置页面设计.md',
        'docs/YYC3-AI-项目文档/YYC3-AI-项目-多实例设计.md',
        'docs/YYC3-AI-项目文档/YYC3-AI-项目-AI任务板交互设计.md',
        'docs/YYC3-AI-项目文档/YYC3-AI-项目-核心功能与技术方案.md',
        # 技术文档
        'docs/YYC3-AI-技术文档/YYC3-AI-技术-安全API文档.md',
        # P5审核交付
        'docs/P5-审核交付/第一阶段实施进度报告-20260324-最终版.md',
        'docs/P5-审核交付/第二阶段实施进度报告-20260324.md',
        'docs/P5-审核交付/技术核心拓展分析与建议.md',
        'docs/P5-审核交付/MVPD终极高技术集成功能建议.md',
        'docs/P5-审核交付/P5-性能优化报告-v2.md',
        'docs/P5-审核交付/P5-业务逻辑测试报告-v2.md',
        'docs/P5-审核交付/P5-功能完整性检查与逻辑优化报告-v2.md',
        'docs/P5-审核交付/P5-最终完成总结报告.md',
        'docs/P5-审核交付/P5-项目现状全面审核报告.md',
        'docs/P5-审核交付/P5-存储架构设计与实施现状报告.md',
        'docs/P5-审核交付/P5-全项12类细度审核报告.md',
        'docs/P5-审核交付/YYC3-AI-PAI-阶段性落地方案.md',
        'docs/P5-审核交付/YYC3-AI-PAI-深度代码审核报告.md',
        # P6 MVP功能拓展
        'docs/P6-MVP功能拓展/2026-多端智能Agent一体MVP功能规划.md',
        'docs/P6-MVP功能拓展/2026-智能行业与人机协同MVP华章.md',
        'docs/P6-MVP功能拓展/全局技术拓展与MVP新功能总结.md',
        # P7实施进度
        'docs/P7-实施进度/P0级功能实施进度报告-20260324.md',
        'docs/P7-实施进度/P1级智能工作流完成报告-20260324.md',
        # 其他文档
        'docs/YYC3-AI-自定义主题系统.md',
        'docs/YYC3-团队通用-标准规范/YYC3-核心机制-五高五标五化五维.md',
    ]
    
    fixed_count = 0
    for file_path in files_to_fix:
        target = (project_root / file_path).resolve()
        if not target.is_relative_to(project_root):
            print(f"❌ 路径越界，跳过: {file_path}")
            continue
        if target.exists():
            if fix_md_file(str(target)):
                fixed_count += 1
        else:
            print(f"⚠️  文件不存在: {file_path}")
    
    print(f"\n总计修复: {fixed_count} 个文件")

if __name__ == '__main__':
    main()
