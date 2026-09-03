# 参与贡献

感谢你愿意为本项目贡献代码！请遵循以下约定。

## 开发环境准备

```bash
pip install -r requirements.txt
python init_db.py        # 初始化数据库与示例数据
python app.py            # 启动服务，默认 http://localhost:5000
```

## 提交 Pull Request

1. 从 `main` 派生自己的分支（`feature/xxx` 或 `fix/xxx`）。
2. 保持改动聚焦：一个 PR 只解决一个问题。
3. 遵循现有代码风格（中文注释、函数/脚本文档字符串、模块分组注释）。
4. 如改动涉及接口行为，同步更新 `README.md` 与 `CHANGELOG.md`。
5. 提交描述尽量清晰，说明"为什么"而非只写"做了什么"。

## 代码约定速查

- 后端新增台账表：在 `schema.py` 的 `TABLES` 添加条目即可，通用 CRUD 自动适配；如需公式列再注册到 `formula_calc.py` 的 `FORMULA_CONFIG`。
- 开启更多校验：在 `validator.py` 顶部的 `VALIDATION_RULES` 将对应开关设为 `True`。
- 新增业务规则 / 跨表关系：写入 `schema.py` 的 `BUSINESS_RULES` / `CROSS_TABLE_RELATIONS`。
- 提交前请勿将运行生成的 `*.db`、`__pycache__/` 纳入版本库（已在 `.gitignore` 排除）。

## 测试

当前以手动冒烟测试为主，合并 PR 前请至少验证：
- 登录、强制改密、登出
- 任一台账的增删改查
- Excel 一键导出 / 导入