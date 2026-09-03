# -*- coding: utf-8 -*-
"""
采购代理台账管理系统 - 校验逻辑

当前版本: 仅校验必填字段是否为空（空值校验）。
后期可按需扩展其他校验规则，扩展方式见文末说明。

校验规则配置: VALIDATION_RULES
  - required_empty: 必填字段空值检查（默认启用）
  - empty_warning:  非必填字段空值提醒（默认启用）
  - 如需启用其他校验，将对应规则设为 True 即可
"""

import re
import sqlite3
from datetime import datetime
from schema import (
    TABLES,
    BUSINESS_RULES,
    CROSS_TABLE_RELATIONS,
    get_fields,
    get_field_by_key,
    get_required_fields,
    get_date_fields,
    get_number_fields,
    get_integer_fields,
    get_primary_key,
)

# ============================================================
# 数据库路径 (优先环境变量 DB_PATH，默认当前目录；app.py 导入时会覆盖为一致的路径)
# ============================================================
import os as _os
DB_PATH = _os.environ.get("DB_PATH", _os.path.join(_os.path.dirname(_os.path.abspath(__file__)), "tz.db"))

# ============================================================
# 校验规则开关 —— 后期扩展只需在此添加规则并设为 True
# ============================================================
VALIDATION_RULES = {
    # --- 当前启用的规则 ---
    "required_empty": True,    # 必填字段空值检查（error）
    "empty_warning": True,     # 非必填字段空值提醒（warning）

    # --- 以下规则已实现但默认关闭，按需开启 ---
    "dropdown_check": False,   # 下拉菜单值合法性检查
    "date_format": False,      # 日期格式检查 (YYYY-MM-DD)
    "number_format": False,    # 金额字段数字格式检查
    "integer_format": False,   # 整数字段格式检查
    "cross_table": False,      # 跨表关联检查
    "business_rules": False,   # 业务逻辑校验
}

# 日期正则: YYYY-MM-DD
DATE_PATTERN = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def _is_empty(value):
    """判断值是否为空"""
    if value is None:
        return True
    if isinstance(value, str) and value.strip() == "":
        return True
    return False


def _is_valid_date(value):
    """检查是否为有效的日期字符串 (YYYY-MM-DD)"""
    if _is_empty(value):
        return True
    if not isinstance(value, str):
        return False
    if not DATE_PATTERN.match(value.strip()):
        return False
    try:
        datetime.strptime(value.strip(), "%Y-%m-%d")
        return True
    except ValueError:
        return False


def _is_valid_number(value):
    """检查是否为有效的数字"""
    if _is_empty(value):
        return True
    if isinstance(value, (int, float)):
        return True
    if isinstance(value, str):
        try:
            float(value.strip())
            return True
        except (ValueError, TypeError):
            return False
    return False


def _is_valid_integer(value):
    """检查是否为有效的正整数"""
    if _is_empty(value):
        return True
    try:
        int_val = int(value)
        return int_val > 0
    except (ValueError, TypeError):
        return False


def _get_field_cn_name(table_name, field_key):
    """获取字段中文名"""
    field = get_field_by_key(table_name, field_key)
    if field:
        return field.get("name_cn", field_key)
    return field_key


def _extract_field_from_message(message, table_name):
    """从校验消息中提取字段key，用于前端定位到具体单元格"""
    if not isinstance(message, str):
        return ""
    match = re.search(r'\(([a-z_][a-z0-9_]*)\)', message)
    if match:
        return match.group(1)
    cn_match = re.search(r'「([^」]+)」', message)
    if cn_match:
        cn_name = cn_match.group(1)
        for field in get_fields(table_name):
            if field.get("name_cn") == cn_name:
                return field["key"]
    return ""


def _get_merged_dropdown_options(table_name, db_path=None):
    """获取合并后的下拉选项: schema 默认选项 + 数据库自定义选项。"""
    merged = {}
    for f in get_fields(table_name):
        opts = f.get("options")
        if opts:
            merged[f["key"]] = list(opts)

    actual_db_path = db_path or DB_PATH
    conn = None
    try:
        conn = sqlite3.connect(actual_db_path)
        cursor = conn.cursor()
        cursor.execute(
            "SELECT field_key, option_value FROM dropdown_options "
            "WHERE table_name = ? ORDER BY field_key, sort_order, id",
            (table_name,),
        )
        for row in cursor.fetchall():
            fk, ov = row[0], row[1]
            if fk not in merged:
                merged[fk] = []
            if ov not in merged[fk]:
                merged[fk].append(ov)
    except sqlite3.Error:
        pass
    finally:
        if conn:
            conn.close()
    return merged


def _check_cross_table_relation(table_name, record, db_path=None):
    """检查跨表关联（需开启 cross_table 规则）。"""
    errors = []
    relations = [r for r in CROSS_TABLE_RELATIONS if r["from_table"] == table_name]
    if not relations:
        return errors

    actual_db_path = db_path or DB_PATH
    conn = None
    try:
        conn = sqlite3.connect(actual_db_path)
        cursor = conn.cursor()
        for rel in relations:
            from_field = rel["from_field"]
            to_table = rel["to_table"]
            to_field = rel["to_field"]
            field_value = record.get(from_field)
            if _is_empty(field_value):
                continue
            cursor.execute(
                f'SELECT COUNT(*) FROM "{to_table}" WHERE "{to_field}" = ?',
                (str(field_value),),
            )
            if cursor.fetchone()[0] == 0:
                field_cn = _get_field_cn_name(table_name, from_field)
                errors.append(
                    f"跨表关联检查失败: 字段「{field_cn}」的值 '{field_value}' "
                    f"在「{TABLES.get(to_table, {}).get('name_cn', to_table)}」中不存在"
                )
    except sqlite3.Error:
        pass
    finally:
        if conn:
            conn.close()
    return errors


def _check_business_rules(table_name, record, db_path=None):
    """检查业务逻辑规则（需开启 business_rules 规则）。"""
    errors = []
    rules = [r for r in BUSINESS_RULES if r["table"] == table_name]
    if not rules:
        return errors

    for rule in rules:
        cond_field = rule["condition_field"]
        cond_value = rule["condition_value"]
        actual_value = record.get(cond_field, "")
        if _is_empty(actual_value) or str(actual_value).strip() != cond_value:
            continue

        if "required_fields" in rule:
            for req_field in rule["required_fields"]:
                if _is_empty(record.get(req_field)):
                    field_cn = _get_field_cn_name(table_name, req_field)
                    errors.append(
                        f"业务逻辑校验失败: {rule['description']} "
                        f"(字段「{field_cn}」为空)"
                    )

        if "cross_table" in rule:
            cross_table = rule["cross_table"]
            match_field = rule.get("match_field", "es_project_no")
            cross_field = rule.get("cross_field", "es_project_no")
            match_value = record.get(match_field)
            if not _is_empty(match_value):
                actual_db_path = db_path or DB_PATH
                conn = None
                try:
                    conn = sqlite3.connect(actual_db_path)
                    cursor = conn.cursor()
                    cursor.execute(
                        f'SELECT COUNT(*) FROM "{cross_table}" WHERE "{cross_field}" = ?',
                        (str(match_value),),
                    )
                    if cursor.fetchone()[0] == 0:
                        errors.append(
                            f"业务逻辑校验失败: {rule['description']} "
                            f"(ES项目编号 '{match_value}' 在项目问题台账中无对应记录)"
                        )
                except sqlite3.Error:
                    pass
                finally:
                    if conn:
                        conn.close()
    return errors


# ============================================================
# 核心校验函数
# ============================================================

def validate_record(table_name, record, db_path=None):
    """
    校验单条记录。

    当前仅校验: 必填字段是否为空。
    如需扩展其他校验，修改文件顶部 VALIDATION_RULES 开关即可。

    Returns:
        {
            "valid": bool,       -- 是否通过所有校验 (无 error)
            "errors": [dict],    -- 严重错误列表 [{message, field}]
            "warnings": [dict],  -- 警告列表 [{message, field}]
        }
    """
    errors = []
    warnings = []

    if table_name not in TABLES:
        return {
            "valid": False,
            "errors": [{"message": f"未知的表名: {table_name}", "field": ""}],
            "warnings": [],
        }

    fields = get_fields(table_name)
    pk = get_primary_key(table_name)

    # ------------------------------------------------------------------
    # 1. 必填字段空值检查 (默认启用)
    # ------------------------------------------------------------------
    if VALIDATION_RULES.get("required_empty"):
        for field in fields:
            if field.get("required") and not field.get("primary_key"):
                key = field["key"]
                if _is_empty(record.get(key)):
                    errors.append({
                        "message": f"必填字段「{field['name_cn']}」未填写",
                        "field": key,
                    })

    # ------------------------------------------------------------------
    # 2. 非必填字段空值提醒 (默认启用, warning)
    # ------------------------------------------------------------------
    if VALIDATION_RULES.get("empty_warning"):
        for field in fields:
            if field.get("primary_key"):
                continue
            key = field["key"]
            if _is_empty(record.get(key)) and not field.get("required"):
                warnings.append({
                    "message": f"「{field['name_cn']}」未填写内容",
                    "field": key,
                })

    # ------------------------------------------------------------------
    # 以下为可选校验规则 (默认关闭，按需在 VALIDATION_RULES 中开启)
    # ------------------------------------------------------------------

    # 3. 下拉菜单值检查
    if VALIDATION_RULES.get("dropdown_check"):
        merged_dropdowns = _get_merged_dropdown_options(table_name, db_path)
        for field in fields:
            key = field["key"]
            options = merged_dropdowns.get(key) or field.get("options")
            if not options:
                continue
            value = record.get(key)
            if _is_empty(value):
                continue
            value_str = str(value).strip()
            if value_str not in options:
                errors.append({
                    "message": f"「{field['name_cn']}」的值 '{value_str}' 不在可选范围中",
                    "field": key,
                })

    # 4. 日期格式检查
    if VALIDATION_RULES.get("date_format"):
        for key in get_date_fields(table_name):
            value = record.get(key)
            if _is_empty(value):
                continue
            if not _is_valid_date(value):
                field = get_field_by_key(table_name, key)
                field_cn = field["name_cn"] if field else key
                errors.append({
                    "message": f"「{field_cn}」的值 '{value}' 不是有效的日期格式 (要求 YYYY-MM-DD)",
                    "field": key,
                })

    # 5. 金额字段数字检查
    if VALIDATION_RULES.get("number_format"):
        for key in get_number_fields(table_name):
            value = record.get(key)
            if _is_empty(value):
                continue
            if not _is_valid_number(value):
                field = get_field_by_key(table_name, key)
                field_cn = field["name_cn"] if field else key
                errors.append({
                    "message": f"「{field_cn}」的值 '{value}' 不是有效的数字",
                    "field": key,
                })

    # 6. 整数字段检查
    if VALIDATION_RULES.get("integer_format"):
        for key in get_integer_fields(table_name):
            if key == pk:
                continue
            value = record.get(key)
            if _is_empty(value):
                continue
            try:
                int(value)
            except (ValueError, TypeError):
                field = get_field_by_key(table_name, key)
                field_cn = field["name_cn"] if field else key
                errors.append({
                    "message": f"「{field_cn}」的值 '{value}' 不是有效的整数",
                    "field": key,
                })

    # 7. 跨表关联检查
    if VALIDATION_RULES.get("cross_table"):
        cross_errors = _check_cross_table_relation(table_name, record, db_path)
        for err in cross_errors:
            errors.append({"message": err, "field": _extract_field_from_message(err, table_name)})

    # 8. 业务逻辑校验
    if VALIDATION_RULES.get("business_rules"):
        biz_errors = _check_business_rules(table_name, record, db_path)
        for err in biz_errors:
            errors.append({"message": err, "field": _extract_field_from_message(err, table_name)})

    return {
        "valid": len(errors) == 0,
        "errors": errors,
        "warnings": warnings,
    }


def validate_batch(table_name, records, db_path=None):
    """
    批量校验多条记录。

    Returns:
        {
            "total": int,
            "valid_count": int,
            "invalid_count": int,
            "results": [validate_record result for each record],
        }
    """
    results = []
    valid_count = 0
    for idx, record in enumerate(records):
        result = validate_record(table_name, record, db_path)
        result["row_index"] = idx + 1
        result["created_by"] = record.get("created_by") or "未知"
        results.append(result)
        if result["valid"]:
            valid_count += 1

    return {
        "total": len(records),
        "valid_count": valid_count,
        "invalid_count": len(records) - valid_count,
        "results": results,
    }


def validate_table(table_name, db_path=None):
    """
    校验整张表的所有记录。

    Returns:
        {
            "total": int,
            "valid_count": int,
            "invalid_count": int,
            "results": [validate_record result for each record, 含 created_by],
        }
    """
    actual_db_path = db_path or DB_PATH
    conn = None
    records = []
    try:
        conn = sqlite3.connect(actual_db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute(f'SELECT * FROM "{table_name}"')
        records = [dict(row) for row in cursor.fetchall()]
    except sqlite3.Error:
        records = []
    finally:
        if conn:
            conn.close()

    results = []
    valid_count = 0
    for idx, record in enumerate(records):
        result = validate_record(table_name, record, actual_db_path)
        result["row_index"] = idx + 1
        result["created_by"] = record.get("created_by") or "未知"
        results.append(result)
        if result["valid"]:
            valid_count += 1

    return {
        "total": len(records),
        "valid_count": valid_count,
        "invalid_count": len(records) - valid_count,
        "results": results,
    }


def validate_field(table_name, field_key, value, db_path=None):
    """
    校验单个字段值（行内编辑时使用）。

    当前仅校验: 必填字段是否为空。
    如需扩展，修改 VALIDATION_RULES 开关。

    Returns:
        {"valid": bool, "error": str or None}
    """
    field = get_field_by_key(table_name, field_key)
    if not field:
        return {"valid": False, "error": f"未知字段: {field_key}"}

    # 必填检查
    if field.get("required") and not field.get("primary_key"):
        if _is_empty(value):
            return {"valid": False, "error": f"「{field['name_cn']}」为必填项，不能为空"}

    if _is_empty(value):
        return {"valid": True, "error": None}

    # 以下为可选校验 (默认关闭)
    if VALIDATION_RULES.get("dropdown_check"):
        merged_dropdowns = _get_merged_dropdown_options(table_name, db_path)
        options = merged_dropdowns.get(field_key) or field.get("options")
        if options and str(value).strip() not in options:
            return {"valid": False, "error": f"值 '{value}' 不在可选范围: {', '.join(options)}"}

    if VALIDATION_RULES.get("date_format"):
        ftype = field.get("type", "string")
        if ftype == "date" and not _is_valid_date(value):
            return {"valid": False, "error": "日期格式错误, 要求 YYYY-MM-DD"}

    if VALIDATION_RULES.get("number_format"):
        ftype = field.get("type", "string")
        if ftype == "number" and not _is_valid_number(value):
            return {"valid": False, "error": "必须是数字"}

    if VALIDATION_RULES.get("integer_format"):
        ftype = field.get("type", "string")
        if ftype == "integer" and not _is_valid_integer(value):
            return {"valid": False, "error": "必须是正整数"}

    return {"valid": True, "error": None}


# ============================================================
# 后期扩展说明
# ============================================================
#
# 当前校验仅检查必填字段是否为空，如需扩展其他校验规则：
#
# 方式一: 修改 VALIDATION_RULES 开关
#   将文件顶部的 VALIDATION_RULES 字典中对应规则设为 True 即可启用：
#     "dropdown_check": True    → 启用下拉菜单值合法性检查
#     "date_format": True       → 启用日期格式检查
#     "number_format": True     → 启用金额数字格式检查
#     "integer_format": True    → 启用整数字段检查
#     "cross_table": True       → 启用跨表关联检查
#     "business_rules": True    → 启用业务逻辑校验
#
# 方式二: 添加新的自定义校验规则
#   在 validate_record() 函数中添加新的校验块，格式如下：
#     if VALIDATION_RULES.get("my_custom_rule"):
#         # 自定义校验逻辑
#         if 检查条件不满足:
#             errors.append({"message": "错误描述", "field": "字段key"})
#
#   然后在 VALIDATION_RULES 中添加:
#     "my_custom_rule": True
#
