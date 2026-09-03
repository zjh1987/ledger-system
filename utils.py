# -*- coding: utf-8 -*-
"""
采购代理台账管理系统 - 通用工具函数

集中放跨模块复用的小工具，避免散落在多个文件导致不一致：
- 北京时间（UTC+8）相关
- 值解析（日期/数字）
- 值序列化/反序列化
- 记录清洗
- 行 ↔ dict 转换
"""

from datetime import datetime, timezone, timedelta


# ============================================================
# 北京时间（UTC+8）—— 不依赖容器时区
# ============================================================
BEIJING_TZ = timezone(timedelta(hours=8))


def now_beijing():
    """返回当前北京时间字符串 (YYYY-MM-DD HH:MM:SS)"""
    return datetime.now(BEIJING_TZ).strftime("%Y-%m-%d %H:%M:%S")


def today_beijing():
    """返回今天日期 (date 对象，北京时间)"""
    return datetime.now(BEIJING_TZ).date()


# ============================================================
# 值解析
# ============================================================
def parse_date(val):
    """
    尝试解析日期值，返回 date 对象或 None。
    支持:
      - '2024-01-15', '2024/1/15', '2024-01-15 10:30:00', '2024.1.15'
      - datetime 对象 / date 对象
    业务占位字符串（未反馈/未发布通知书等）视为 None。
    """
    if val is None or val == '':
        return None
    if isinstance(val, datetime):
        return val.date()
    # 兼容 openpyxl 读到的 date 对象（无 datetime 继承）
    if hasattr(val, 'year') and hasattr(val, 'month') and hasattr(val, 'day') \
            and not isinstance(val, type(None)):
        try:
            return datetime(val.year, val.month, val.day).date()
        except Exception:
            return None
    s = str(val).strip()
    if s == '' or s == '/' or s == '未反馈' or s == '未发布通知书' \
            or s == '未归档' or s == '纸质合同尚未签署' or s == '尚未退款' or s == '待定':
        return None
    for fmt in ('%Y-%m-%d %H:%M:%S', '%Y-%m-%d', '%Y/%m/%d',
                '%Y/%m/%d %H:%M:%S', '%Y.%m.%d'):
        try:
            return datetime.strptime(s, fmt).date()
        except ValueError:
            continue
    return None


def parse_number(val):
    """尝试解析数字，返回 float 或 None。"""
    if val is None or val == '':
        return None
    if isinstance(val, (int, float)):
        return float(val)
    s = str(val).strip()
    if s == '':
        return None
    try:
        return float(s)
    except (ValueError, TypeError):
        return None


def to_int(val, default=0):
    """尝试解析为 int，失败返回 default（默认 0）。用于 SUMIF 等计算。"""
    if val is None or val == '':
        return default
    try:
        return int(float(val))
    except (ValueError, TypeError):
        return default


# ============================================================
# 值序列化/反序列化
# ============================================================
def serialize_value(value):
    """序列化值，处理 datetime 等特殊类型，便于 JSON 响应。"""
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.strftime("%Y-%m-%d %H:%M:%S")
    if isinstance(value, (int, float)):
        return value
    return str(value)


def row_to_dict(row):
    """将 sqlite3.Row 转为字典；row 为 None 时返回 None。"""
    if row is None:
        return None
    return {key: row[key] for key in row.keys()}


def clean_record(record):
    """清理记录中的空字符串 -> None（让数据库 NULL 语义一致）。"""
    if not record:
        return {}
    cleaned = {}
    for k, v in record.items():
        if isinstance(v, str) and v.strip() == "":
            cleaned[k] = None
        else:
            cleaned[k] = v
    return cleaned