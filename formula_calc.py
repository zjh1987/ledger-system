"""
公式列自动计算模块
根据附件Excel中的公式逻辑，在新增/更新记录时自动计算公式列的初始值。
"""
from datetime import datetime, date
from datetime import timezone, timedelta
from schema import get_field_keys

# 北京时间
BEIJING_TZ = timezone(timedelta(hours=8))

def today_beijing():
    """返回今天日期 (date对象, 北京时间)"""
    return datetime.now(BEIJING_TZ).date()

def parse_date(val):
    """
    尝试解析日期值，返回 date 对象或 None。
    支持: '2024-01-15', '2024/1/15', '2024-01-15 10:30:00', datetime 对象, date 对象
    """
    if val is None or val == '':
        return None
    if isinstance(val, datetime):
        return val.date()
    if isinstance(val, date):
        return val
    s = str(val).strip()
    if s == '' or s == '/' or s == '未反馈' or s == '未发布通知书' or s == '未归档' or s == '纸质合同尚未签署' or s == '尚未退款' or s == '待定':
        return None
    # Try common date formats
    for fmt in ['%Y-%m-%d %H:%M:%S', '%Y-%m-%d', '%Y/%m/%d', '%Y/%m/%d %H:%M:%S', '%Y.%m.%d']:
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
    except ValueError:
        return None

def date_diff_days(d1, d2):
    """计算 d1 - d2 的天数差 (返回 int)"""
    if d1 is None or d2 is None:
        return None
    return (d1 - d2).days

def fmt_date(d):
    """格式化 date 为 YYYY-MM-DD 字符串"""
    if d is None:
        return ''
    return d.strftime('%Y-%m-%d')


# ============================================================
# 各表的公式计算函数
# ============================================================

def calc_projects(row):
    """
    项目台账 - 3个公式列
    输入字段: current_stage, result_notice_time, latest_contract_sign_time,
              archive_receive_time, is_archived, recording_upload_time
    输出字段: archive_overdue_days, archive_days_from_sign, recording_upload_warning
    """
    result = {}
    current_stage = str(row.get('current_stage', '') or '').strip()
    result_notice = str(row.get('result_notice_time', '') or '').strip()
    contract_sign = str(row.get('latest_contract_sign_time', '') or '').strip()
    archive_recv = str(row.get('archive_receive_time', '') or '').strip()
    is_archived = str(row.get('is_archived', '') or '').strip()
    recording_upload = str(row.get('recording_upload_time', '') or '').strip()

    today = today_beijing()

    # --- archive_overdue_days (AH) ---
    # =IF(G="项目取消","项目取消",
    #   IFERROR(
    #     IF(OR(AD="",AD="未发布通知书"),
    #       IF(AE="未反馈","未签署合同","注意更新采购结果出具时间"),
    #       IF(OR(AG="",AG="未归档"), TODAY()-AE-60, AG-AE-60)
    #     ),
    #     "根据项目情况自行修改确认是否需归档"
    #   ))
    try:
        if current_stage == '项目取消':
            result['archive_overdue_days'] = '项目取消'
        else:
            ad_date = parse_date(result_notice) if result_notice not in ('', '未发布通知书') else None
            ae_date = parse_date(contract_sign) if contract_sign not in ('', '未反馈') else None
            ag_date = parse_date(archive_recv) if archive_recv not in ('', '未归档') else None

            if result_notice in ('', '未发布通知书') or ad_date is None:
                # AD is empty or "未发布通知书"
                if contract_sign in ('', '未反馈') or ae_date is None:
                    result['archive_overdue_days'] = '未签署合同'
                else:
                    result['archive_overdue_days'] = '注意更新采购结果出具时间'
            else:
                # AD has a valid date
                if archive_recv in ('', '未归档') or ag_date is None:
                    # AG empty or "未归档" -> TODAY() - AE - 60
                    if ae_date is not None:
                        result['archive_overdue_days'] = (today - ae_date).days - 60
                    else:
                        result['archive_overdue_days'] = '根据项目情况自行修改确认是否需归档'
                else:
                    # AG has a valid date -> AG - AE - 60
                    if ae_date is not None:
                        result['archive_overdue_days'] = (ag_date - ae_date).days - 60
                    else:
                        result['archive_overdue_days'] = '根据项目情况自行修改确认是否需归档'
    except Exception:
        result['archive_overdue_days'] = '根据项目情况自行修改确认是否需归档'

    # --- archive_days_from_sign (AI) ---
    # =IF(G="项目取消","项目取消",
    #   IFERROR(
    #     IF(AD="未发布通知书",
    #       IF(AE="未反馈","未签署合同","填写有误或公式计算错误，请手动修改"),
    #       IF(OR(AG="",AG="未归档"), TODAY()-AE, AG-AE)
    #     ),
    #     "根据项目情况自行手动修改确认是否需归档"
    #   ))
    try:
        if current_stage == '项目取消':
            result['archive_days_from_sign'] = '项目取消'
        else:
            ad_date = parse_date(result_notice) if result_notice not in ('', '未发布通知书') else None
            ae_date = parse_date(contract_sign) if contract_sign not in ('', '未反馈') else None
            ag_date = parse_date(archive_recv) if archive_recv not in ('', '未归档') else None

            if result_notice == '未发布通知书' or ad_date is None:
                if contract_sign in ('', '未反馈') or ae_date is None:
                    result['archive_days_from_sign'] = '未签署合同'
                else:
                    result['archive_days_from_sign'] = '填写有误或公式计算错误，请手动修改'
            else:
                if archive_recv in ('', '未归档') or ag_date is None:
                    if ae_date is not None:
                        result['archive_days_from_sign'] = (today - ae_date).days
                    else:
                        result['archive_days_from_sign'] = '根据项目情况自行手动修改确认是否需归档'
                else:
                    if ae_date is not None:
                        result['archive_days_from_sign'] = (ag_date - ae_date).days
                    else:
                        result['archive_days_from_sign'] = '根据项目情况自行手动修改确认是否需归档'
    except Exception:
        result['archive_days_from_sign'] = '根据项目情况自行手动修改确认是否需归档'

    # --- recording_upload_warning (AP) ---
    # =IF(AO="待定", TODAY()-AD, AO-AD)
    try:
        ad_date = parse_date(result_notice)
        if recording_upload == '待定':
            if ad_date is not None:
                result['recording_upload_warning'] = (today - ad_date).days
            else:
                result['recording_upload_warning'] = ''
        else:
            ao_date = parse_date(recording_upload)
            if ao_date is not None and ad_date is not None:
                result['recording_upload_warning'] = (ao_date - ad_date).days
            else:
                result['recording_upload_warning'] = ''
    except Exception:
        result['recording_upload_warning'] = ''

    return result


def calc_agency_fees(row):
    """
    代理费台账 - 1个公式列
    输入字段: system_amount, receivable_total
    输出字段: system_receivable_diff
    """
    result = {}
    sys_amt = parse_number(row.get('system_amount'))
    recv_total = parse_number(row.get('receivable_total'))

    if sys_amt is not None and recv_total is not None:
        result['system_receivable_diff'] = round(sys_amt - recv_total, 2)
    else:
        result['system_receivable_diff'] = ''

    return result


def calc_personnel(row):
    """
    代理人员及账号 - 1个公式列
    输入字段: exam_time
    输出字段: cert_duration
    """
    result = {}
    exam_date = parse_date(row.get('exam_time'))
    today = today_beijing()

    if exam_date is not None:
        result['cert_duration'] = (today - exam_date).days
    else:
        result['cert_duration'] = ''

    return result


def calc_bid_deposits(row):
    """
    投标保证金台账 - 2个公式列
    输入字段: contract_sign_time, is_collected, actual_return_date
    输出字段: latest_return_date, sign_to_return_duration
    """
    result = {}
    contract_sign = str(row.get('contract_sign_time', '') or '').strip()
    is_collected = str(row.get('is_collected', '') or '').strip()
    actual_return = str(row.get('actual_return_date', '') or '').strip()
    today = today_beijing()

    # --- latest_return_date (AB) ---
    # =Q+5 (合同签署时间 + 5天)
    q_date = parse_date(contract_sign)
    if q_date is not None:
        result['latest_return_date'] = fmt_date(q_date + timedelta(days=5))
    else:
        result['latest_return_date'] = ''

    # --- sign_to_return_duration (AF) ---
    # =IF(AB="纸质合同签署时间列填写有误","纸质合同签署时间列填写有误",
    #   IFERROR(
    #     IF(S="待定","待定",
    #       IF(S="否","不收取保证金",
    #         IF(Q="纸质合同尚未签署","无合同签署时间",
    #           IF(OR(Q="/",Q=""),"纸质合同签署时间列填写有误",
    #             IF(OR(AD="",AD="尚未退款"),"尚未退款", AD-Q)
    #           )
    #         )
    #       )
    #     ),
    #     "是否收取保证金列或实际退款/保函退还日期列填写有误"
    #   ))
    try:
        # First check if latest_return_date calc indicated an error
        # (In our case, if Q can't be parsed and is not a special value, it's an error)
        ab_val = result.get('latest_return_date', '')

        if contract_sign in ('/', ''):
            result['sign_to_return_duration'] = '纸质合同签署时间列填写有误'
        elif is_collected == '待定':
            result['sign_to_return_duration'] = '待定'
        elif is_collected == '否':
            result['sign_to_return_duration'] = '不收取保证金'
        elif contract_sign == '纸质合同尚未签署':
            result['sign_to_return_duration'] = '无合同签署时间'
        elif q_date is None:
            result['sign_to_return_duration'] = '纸质合同签署时间列填写有误'
        else:
            ad_date = parse_date(actual_return) if actual_return not in ('', '尚未退款') else None
            if actual_return in ('', '尚未退款') or ad_date is None:
                result['sign_to_return_duration'] = '尚未退款'
            else:
                result['sign_to_return_duration'] = (ad_date - q_date).days
    except Exception:
        result['sign_to_return_duration'] = '是否收取保证金列或实际退款/保函退还日期列填写有误'

    return result


# ============================================================
# 公共接口
# ============================================================

# 各表的公式计算配置
FORMULA_CONFIG = {
    'projects': {
        'calc_func': calc_projects,
        'output_fields': ['archive_overdue_days', 'archive_days_from_sign', 'recording_upload_warning'],
        'input_fields': ['current_stage', 'result_notice_time', 'latest_contract_sign_time',
                         'archive_receive_time', 'is_archived', 'recording_upload_time'],
    },
    'agency_fees': {
        'calc_func': calc_agency_fees,
        'output_fields': ['system_receivable_diff'],
        'input_fields': ['system_amount', 'receivable_total'],
    },
    'personnel': {
        'calc_func': calc_personnel,
        'output_fields': ['cert_duration'],
        'input_fields': ['exam_time'],
    },
    'bid_deposits': {
        'calc_func': calc_bid_deposits,
        'output_fields': ['latest_return_date', 'sign_to_return_duration'],
        'input_fields': ['contract_sign_time', 'is_collected', 'actual_return_date'],
    },
    # eval_rooms 的跨表公式单独处理（需要DB连接）
    'eval_rooms': {
        'calc_func': None,  # 跨表计算使用 calc_eval_rooms_cross
        'output_fields': ['total_eval_count', 'es_booking_count', 'mobile_eval_count', 'should_use_mobile_count'],
        'input_fields': ['stat_scope', 'g_mobile_count', 'resource_lack_count', 'other_reason_count'],
    },
}


def calc_eval_rooms_cross(row_data, db_conn=None):
    """
    电子评标室使用情况 - 跨表公式计算
    需要查询 projects 表数据。

    公式：
    - total_eval_count (C): SUMIF(projects.bid_eval_period == stat_scope, projects.electronic_eval_count)
    - es_booking_count (D): SUMIF(projects.bid_eval_period == stat_scope, projects.es_room_booking_count)
    - mobile_eval_count (F): SUMIF(projects.bid_eval_period == stat_scope, projects.electronic_eval_count) [同C]
    - should_use_mobile_count (G): g_mobile_count + resource_lack_count + other_reason_count
    """
    result = {}
    stat_scope = str(row_data.get('stat_scope', '') or '').strip()

    # --- should_use_mobile_count (G) = H + I + J ---
    # 同行求和，不需要DB
    def to_int(val):
        if val is None or val == '':
            return 0
        try:
            return int(float(val))
        except (ValueError, TypeError):
            return 0

    h_val = to_int(row_data.get('g_mobile_count'))
    i_val = to_int(row_data.get('resource_lack_count'))
    j_val = to_int(row_data.get('other_reason_count'))
    result['should_use_mobile_count'] = h_val + i_val + j_val

    # --- 跨表 SUMIF 计算 ---
    if not stat_scope:
        result['total_eval_count'] = ''
        result['es_booking_count'] = ''
        result['mobile_eval_count'] = ''
        return result

    if db_conn is None:
        # 无DB连接时只计算同行公式
        result.setdefault('total_eval_count', '')
        result.setdefault('es_booking_count', '')
        result.setdefault('mobile_eval_count', '')
        return result

    try:
        cursor = db_conn.cursor()

        # 从 schema 获取 projects 表的字段 key，避免硬编码列名导致结构变更时失配
        proj_keys = set(get_field_keys('projects'))

        def _safe_sum(col):
            if col not in proj_keys:
                return 0
            cursor.execute(
                f'SELECT COALESCE(SUM(CAST("[{col}]" AS REAL)), 0) '
                f'FROM "projects" WHERE "bid_eval_period" = ?',
                (stat_scope,),
            )
            row = cursor.fetchone()
            return int(row[0] or 0) if row else 0

        # total_eval_count (C): SUM electronic_eval_count WHERE bid_eval_period = stat_scope
        result['total_eval_count'] = _safe_sum('electronic_eval_count')
        # es_booking_count (D): SUM es_room_booking_count WHERE bid_eval_period = stat_scope
        result['es_booking_count'] = _safe_sum('es_room_booking_count')
        # mobile_eval_count (F): same formula as C
        result['mobile_eval_count'] = result['total_eval_count']

    except Exception as e:
        print(f"[formula_calc] Error in calc_eval_rooms_cross: {e}")
        result['total_eval_count'] = ''
        result['es_booking_count'] = ''
        result['mobile_eval_count'] = ''

    return result


def compute_formula_fields(table_name, row_data, db_conn=None):
    """
    根据表名和行数据，计算公式列的值。
    返回 {field_name: calculated_value} 字典。
    如果表没有公式列配置，返回空字典。
    对于跨表公式（如 eval_rooms），需要传入 db_conn。
    """
    config = FORMULA_CONFIG.get(table_name)
    if not config:
        return {}

    try:
        # eval_rooms 使用跨表计算函数
        if table_name == 'eval_rooms':
            return calc_eval_rooms_cross(row_data, db_conn=db_conn)

        return config['calc_func'](row_data)
    except Exception as e:
        print(f"[formula_calc] Error computing for {table_name}: {e}")
        return {}


def should_recalc_on_update(table_name, update_fields):
    """
    检查更新字段中是否包含公式列的输入字段。
    如果包含，返回需要重新计算的公式列列表。
    """
    config = FORMULA_CONFIG.get(table_name)
    if not config:
        return []

    input_set = set(config['input_fields'])
    if input_set & set(update_fields.keys()):
        return config['output_fields']
    return []


def get_dependent_eval_rooms(db_conn, table_name, old_row=None, new_row=None):
    """
    当 projects 表的记录被修改/新增/删除时，找出需要重新计算的 eval_rooms 记录。
    返回 eval_rooms 表中 stat_scope 匹配的记录 ID 列表。

    参数:
    - db_conn: 数据库连接
    - table_name: 被修改的表名（如 'projects'）
    - old_row: 修改前的行数据（dict，含 bid_eval_period）
    - new_row: 修改后的行数据（dict，含 bid_eval_period）

    返回: [(record_id, stat_scope), ...] 需要重新计算的 eval_rooms 记录
    """
    if table_name != 'projects':
        return []

    scopes = set()
    if old_row and old_row.get('bid_eval_period'):
        scopes.add(str(old_row['bid_eval_period']).strip())
    if new_row and new_row.get('bid_eval_period'):
        scopes.add(str(new_row['bid_eval_period']).strip())

    if not scopes:
        return []

    result = []
    try:
        cursor = db_conn.cursor()
        placeholders = ','.join(['?'] * len(scopes))
        cursor.execute(
            f'SELECT id, stat_scope FROM eval_rooms WHERE stat_scope IN ({placeholders})',
            list(scopes)
        )
        for row in cursor.fetchall():
            result.append((row[0], row[1]))
    except Exception as e:
        print(f"[formula_calc] Error finding dependent eval_rooms: {e}")

    return result
