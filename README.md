# 采购代理台账管理系统 (Ledger System)

一个面向采购代理业务团队的台账数据管理 Web 应用，基于 Flask + SQLite 构建，提供 10 类台账（项目、代理费、代理人员、评审费、样品、评标室、专家评议、投标保证金、履约保证金、项目问题）的一站式管理。

- **后端**：Flask REST API
- **前端**：原生 HTML / CSS / JavaScript（服务端渲染页面 + 异步 API）
- **数据**：SQLite（单文件，WAL 模式，支持 Docker 持久化）
- **可视化**：ECharts（数据分析页，本地托管）

> 系统当前版本 **v2.0.0**，接口与数据模型稳定，可直接用于内网部署。

---

## ✨ 功能特性

- **10 类台账管理**：CRUD、分页、搜索、排序
- **Excel 导入 / 导出**：单表导出、一键全表导出/导入、导入模板下载
- **公式列自动计算**：忠实还原原 Excel 公式逻辑（归档超时天数、认证时长、跨表 SUMIF 等）
- **列灵活配置**：自定义列增删、基础列隐藏/恢复、表头重命名、下拉选项管理
- **数据质量校验**：必填项校验 + 可扩展的业务/跨表/格式校验规则
- **多用户与权限**：登录（Bearer Token）、管理员 / 普通用户两级权限、数据级归属控制
- **数据分析**：总览 / 项目 / 财务 / 人员四类统计图表

---

## 🧱 技术栈

| 层 | 技术 |
|----|------|
| 后端框架 | Flask |
| 数据库 | SQLite（WAL + busy_timeout） |
| Excel | openpyxl |
| 认证 | Werkzeug `pbkdf2:sha256` + 内存 Token（24h 过期） |
| 前端 | 原生 HTML / CSS / JS（IIFE 单页） |
| 图表 | ECharts 5.5.0（本地 `static/vendor/` 托管） |
| 部署 | Docker / docker-compose（`python:3.11-slim`） |

依赖见 [`requirements.txt`](requirements.txt)：`flask`、`openpyxl`、`flask-cors`。

---

## 🚀 快速开始

### 方式一：Docker Compose（推荐）

```bash
docker compose up -d --build
# 打开 http://localhost:5000
```

- 数据卷 `./data:/app/data`，数据库持久化到 `tz.db`。
- 环境变量 `SKIP_SAMPLE_DATA=1` 跳过示例数据。

### 方式二：本地直接运行

```bash
pip install -r requirements.txt
python init_db.py        # 初始化数据库（可选，创建表 + 示例数据）
python app.py            # 默认监听 0.0.0.0:5000
```

访问 `http://localhost:5000`。

### 默认账号

| 账号 | 密码 | 说明 |
|------|------|------|
| `admin` | `admin123` | 管理员，**首次登录会强制引导修改初始密码** |

> ⚠️ 生产/公网部署请务必修改初始密码。

---

## ⚙️ 环境变量

| 变量 | 说明 | 默认 |
|------|------|------|
| `DB_PATH` | SQLite 文件路径 | 当前目录 `tz.db` |
| `SKIP_SAMPLE_DATA` | `1` 时跳过示例数据 | 空 |
| `FLASK_DEBUG` | `1` 开启调试模式 | `0` |
| `FLASK_SECRET_KEY` | Flask 密钥 | 随机生成 |
| `ALLOWED_ORIGINS` | 允许跨域来源（逗号分隔），为空仅同源 | 空 |

---

## 🏗️ 项目结构

```
ledger-system/
├── app.py                 # Flask 主应用：全部 REST API 与路由
├── schema.py              # 数据字典：表/字段/下拉选项/业务规则/跨表关系
├── formula_calc.py        # 公式列自动计算（还原 Excel 公式逻辑）
├── validator.py           # 数据校验模块
├── init_db.py             # 数据库初始化 + 示例数据
├── utils.py               # 通用工具（北京时间、值解析、序列化）
├── requirements.txt       # Python 依赖
├── Dockerfile             # 容器打包
├── docker-compose.yml     # 容器编排
├── templates/             # 页面模板（index.html / analytics.html）
└── static/                # 前端资源（style.css / app.js / vendor/echarts.min.js）
```

**架构速览**：`schema.py` 是唯一数据字典，`app.py` 通过"表驱动 + 通用 CRUD"动态路由覆盖全部台账表；`formula_calc.py` 负责公式列，`validator.py` 负责导入批量校验。

---

## 🗃️ 数据模型（10 张业务表）

| # | 表 key | 中文名 | 要点 |
|---|--------|--------|------|
| 1 | `projects` | 项目台账 | 金额、归档/备案/录像等 3 个公式列 |
| 2 | `agency_fees` | 代理费台账 | 应收/实收/差额 |
| 3 | `personnel` | 代理人员及账号 | 认证时长/过期 |
| 4 | `expert_fees` | 专家评审费发放台账 | 计费与发放 |
| 5 | `samples` | 样品收发台账 | 收取/退还 |
| 6 | `eval_rooms` | 电子评标室使用情况 | 跨表 SUMIF 公式 |
| 7 | `expert_evaluation` | 评审专家履职评议 | 履职得分 |
| 8 | `bid_deposits` | 投标保证金台账 | 收取/退还/利息 |
| 9 | `performance_deposits` | 履约保证金台账 | 履约/质保金 |
| 10 | `project_issues` | 项目问题台账 | 稽核问题 |

系统表：`users`、`_custom_columns`、`_hidden_columns`、`_column_renames`、`dropdown_options`。

---

## 🔌 API 概览

所有 `/api/*` 接口返回 JSON，需在请求头携带 `Authorization: Bearer <token>`（标注外的除外）。

- 认证：`POST /api/login`、`POST /api/logout`、`POST /api/change-password`、`GET /api/me`
- 用户管理（admin）：`GET/POST/DELETE /api/users[/<id>]`
- 表结构与列管理：`GET /api/tables`、`GET /api/columns/<table>`、`/api/columns/{hide|restore|rename}`、`/api/dropdowns`、`/api/custom-columns`
- 台账 CRUD：`GET/POST /api/<table>`、`GET/PUT/DELETE /api/<table>/<id>`、`/api/<table>/validate`、`/api/<table>/batch`
- Excel：`GET /api/export/<table>`、`/api/export-all`、`POST /api/import`、`/api/import-all`、`GET /api/import-template`
- 运维：`GET /api/stats`、`GET /api/health`
- 分析（admin）：`GET /api/analytics/{overview|projects|financial|personnel}`

---

## 🤝 参与贡献

欢迎提交 Issue 与 Pull Request，请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 🔐 安全

如发现安全问题，请勿在公开渠道透露，参见 [SECURITY.md](SECURITY.md)。

## 📄 许可证

本项目基于 [MIT License](LICENSE) 开源。

示例数据中的人物姓名、证件号、电话等均为**虚构占位数据**，仅用于演示。