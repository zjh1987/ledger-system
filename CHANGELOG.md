# 变更记录 (Changelog)

本项目版本遵循 [语义化版本](https://semver.org/lang/zh-CN/)。所有显著变更记录于此。

## [Unreleased]

### 新增
- 首次开源发布。

## [2.0.0] - 2026-09-03

初始可发布版本（对应当前源码）。

### 安全与健壮性
- 新增独立的 `POST /api/change-password`，修复"修改密码"功能不可用问题。
- 收紧 CORS：由允许任意来源改为通过 `ALLOWED_ORIGINS` 配置，默认仅同源。
- 默认管理员账号强制首次改密（`must_change_password`）。
- 登录令牌增加 24h 过期时间，过期自动清理。
- 新增登录接口限流：同用户名+IP 连续 5 次失败锁定 15 分钟。
- 500 错误详情仅在调试模式返回；`/api/health` 不再暴露数据库路径。
- 主键改为 SQLite 自增分配，消除并发下 `MAX(pk)+1` 竞争冲突。
- 为可编辑序号表增加 `(序号字段, created_by)` 唯一索引。

### 重构
- 统一 `import` / `import-all` 的 Excel 导入逻辑（抽取共享函数）。
- 移除 `app.py` 内与 `utils.py` 重复的工具函数定义。
- 公式列跨表计算改为基于 `schema` 字段，减少硬编码列名。

### 其他
- 数据分析页 ECharts 由外网 CDN 改为本地 `static/vendor/` 托管。
- 数据库默认文件由 `taiwan.db` 更名为 `tz.db`。

---