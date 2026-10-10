# YYC³ Developer Task Entry · 开发任务统一入口
.PHONY: lint test coverage fmt security build docs clean hooks

PYTHON ?= python3

## 本地门禁（与 CI 同款 same gates as CI）
lint:            ## 静态检查 ruff + mypy
	$(PYTHON) -m ruff check .
	$(PYTHON) -m mypy --strict 13-YYC3-企业蓝图-代码示例/1300-代码示例-核心基础设施

test:            ## 单元测试（覆盖率门禁 80%）
	$(PYTHON) -m pytest --cov=13-YYC3-企业蓝图-代码示例 --cov-fail-under=80 -q

coverage:        ## 生成覆盖率 HTML 报告
	$(PYTHON) -m pytest --cov=13-YYC3-企业蓝图-代码示例 --cov-report=html
	@echo "coverage report → htmlcov/index.html"

fmt:             ## 自动格式化
	$(PYTHON) -m ruff check --fix .
	$(PYTHON) -m ruff format .

security:        ## 本地安全扫描（需安装 gitleaks/trivy）
	gitleaks detect --no-git -v || true
	trivy fs --severity HIGH,CRITICAL . || true

build:           ## 构建发布制品
	$(PYTHON) -m build

docs:            ## 本地文档站点预览 → http://127.0.0.1:8000
	$(PYTHON) -m mkdocs serve

docs-build:      ## 文档严格构建（零死链门禁）
	$(PYTHON) -m mkdocs build --strict --clean

hooks:           ## 安装 git 钩子
	$(PYTHON) -m pre_commit install

clean:           ## 清理构建产物
	rm -rf dist build site htmlcov .pytest_cache .mypy_cache .ruff_cache coverage.xml

## 首次上手 First-time setup:
##   make hooks && make lint && make test && make docs
