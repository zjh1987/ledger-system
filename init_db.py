# -*- coding: utf-8 -*-
"""
采购代理台账管理系统 - 初始化数据库
- 创建所有表
- 插入示例数据
"""

import os
import sqlite3
import sys
import time

# 将当前目录添加到 path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from schema import (
    TABLES,
    get_fields,
    get_field_keys,
    get_primary_key,
    get_all_create_table_sql,
)

# ============================================================
# 数据库路径 (与 app.py 保持一致)
# ============================================================
_default_db = os.path.join(os.path.dirname(os.path.abspath(__file__)), "tz.db")
DB_PATH = os.environ.get("DB_PATH", _default_db)

# 确保目录存在
_db_dir = os.path.dirname(DB_PATH)
if _db_dir and not os.path.exists(_db_dir):
    try:
        os.makedirs(_db_dir, exist_ok=True)
    except (OSError, PermissionError):
        DB_PATH = _default_db

print(f"数据库路径: {DB_PATH}")


# ============================================================
# 示例数据
# ============================================================

SAMPLE_DATA = {

    # ----------------------------------------------------------
    # 表1: 项目台账
    # ----------------------------------------------------------
    "projects": [
        {
            "id": 1,
            "client_name": "中国电信股份有限公司",
            "contract_period": "2024-2025年",
            "entrust_no": "WT-2024-001",
            "es_project_no": "ES2024-001",
            "project_name": "2024年核心路由器采购项目",
            "current_stage": "采购合同已签署",
            "purchase_manager": "张三",
            "project_category": "货物",
            "purchase_method": "公开招标",
            "is_split_bid": "是",
            "is_split_share": "否",
            "budget_amount": 5000000.00,
            "winning_amount": 4800000.00,
            "agency_fee_amount": 85000.00,
            "deposit_total": 240000.00,
            "review_fee_total": 16000.00,
            "is_on_miit": "是",
            "record_time": "2024-03-15",
            "record_overdue_warning": "正常",
            "record_is_overdue": "否",
            "is_centralized_bid": "否",
            "centralized_completion_date": None,
            "impl_report_record_time": "2024-04-20",
            "impl_report_overdue_warning": "正常",
            "impl_report_is_overdue": "否",
            "bid_eval_deadline": "2024-03-10",
            "candidate_announcement_start": "2024-03-12",
            "candidate_announcement_end": "2024-03-15",
            "result_notice_time": "2024-03-18",
            "latest_contract_sign_time": "2024-04-05",
            "is_archived": "是",
            "archive_receive_time": "2024-05-10",
            "archive_overdue_days": 0,
            "archive_days_from_sign": 35,
            "archive_is_overdue": "否",
            "not_archived_reason": None,
            "archive_no": "DA-2024-001",
            "is_manual_judge": "是",
            "is_full_recording": "是",
            "recording_upload_time": "2024-03-11",
            "recording_upload_warning": "正常",
            "recording_is_clear": "是",
            "audit_has_issues": "否",
            "bid_eval_period": "2024-03-08 至 2024-03-10",
            "es_room_booking_count": 1,
            "electronic_eval_count": 1,
            "is_one_day_remote": "否",
            "not_use_electronic_eval_reason": None,
            "agency_name": "中捷通信有限公司",
            "agency_manager": "李四",
            "check_month": "2024-05",
        },
        {
            "id": 2,
            "client_name": "中国移动通信集团",
            "contract_period": "2024-2025年",
            "entrust_no": "WT-2024-002",
            "es_project_no": "ES2024-002",
            "project_name": "2024年IT运维服务采购项目",
            "current_stage": "采购结果已确认",
            "purchase_manager": "王五",
            "project_category": "服务",
            "purchase_method": "公开比选",
            "is_split_bid": "否",
            "is_split_share": "否",
            "budget_amount": 3000000.00,
            "winning_amount": 2850000.00,
            "agency_fee_amount": 50000.00,
            "deposit_total": 142500.00,
            "review_fee_total": 12000.00,
            "is_on_miit": "是",
            "record_time": "2024-05-10",
            "record_overdue_warning": "正常",
            "record_is_overdue": "否",
            "is_centralized_bid": "是",
            "centralized_completion_date": "2024-12-31",
            "impl_report_record_time": None,
            "impl_report_overdue_warning": "待提交",
            "impl_report_is_overdue": "否",
            "bid_eval_deadline": "2024-05-05",
            "candidate_announcement_start": "2024-05-07",
            "candidate_announcement_end": "2024-05-10",
            "result_notice_time": "2024-05-12",
            "latest_contract_sign_time": None,
            "is_archived": "否",
            "archive_receive_time": None,
            "archive_overdue_days": 0,
            "archive_days_from_sign": 0,
            "archive_is_overdue": "否",
            "not_archived_reason": "合同尚未签署",
            "archive_no": None,
            "is_manual_judge": "否",
            "is_full_recording": "是",
            "recording_upload_time": "2024-05-06",
            "recording_upload_warning": "正常",
            "recording_is_clear": "是",
            "audit_has_issues": "否",
            "bid_eval_period": "2024-05-03 至 2024-05-05",
            "es_room_booking_count": 1,
            "electronic_eval_count": 1,
            "is_one_day_remote": "否",
            "not_use_electronic_eval_reason": None,
            "agency_name": "中捷通信有限公司",
            "agency_manager": "李四",
            "check_month": "2024-05",
        },
        {
            "id": 3,
            "client_name": "中国联通股份有限公司",
            "contract_period": "2024-2025年",
            "entrust_no": "WT-2024-003",
            "es_project_no": "ES2024-003",
            "project_name": "2024年机房改造施工项目",
            "current_stage": "采购方案已决策实施中",
            "purchase_manager": "赵六",
            "project_category": "施工",
            "purchase_method": "邀请招标",
            "is_split_bid": "是",
            "is_split_share": "是",
            "budget_amount": 8000000.00,
            "winning_amount": None,
            "agency_fee_amount": None,
            "deposit_total": None,
            "review_fee_total": None,
            "is_on_miit": "待定",
            "record_time": None,
            "record_overdue_warning": "待备案",
            "record_is_overdue": "否",
            "is_centralized_bid": "否",
            "centralized_completion_date": None,
            "impl_report_record_time": None,
            "impl_report_overdue_warning": None,
            "impl_report_is_overdue": "否",
            "bid_eval_deadline": None,
            "candidate_announcement_start": None,
            "candidate_announcement_end": None,
            "result_notice_time": None,
            "latest_contract_sign_time": None,
            "is_archived": "否",
            "archive_receive_time": None,
            "archive_overdue_days": 0,
            "archive_days_from_sign": 0,
            "archive_is_overdue": "否",
            "not_archived_reason": "项目进行中",
            "archive_no": None,
            "is_manual_judge": "否",
            "is_full_recording": "否",
            "recording_upload_time": None,
            "recording_upload_warning": None,
            "recording_is_clear": "否",
            "audit_has_issues": "否",
            "bid_eval_period": None,
            "es_room_booking_count": 0,
            "electronic_eval_count": 0,
            "is_one_day_remote": "否",
            "not_use_electronic_eval_reason": "项目尚未进入评审阶段",
            "agency_name": "中捷通信有限公司",
            "agency_manager": "李四",
            "check_month": "2024-05",
        },
    ],

    # ----------------------------------------------------------
    # 表2: 代理费台账
    # ----------------------------------------------------------
    "agency_fees": [
        {
            "id": 1,
            "client_name": "中国电信股份有限公司",
            "contract_period": "2024-2025年",
            "plan_no": "CGFA-2024-001",
            "result_no": "CGJG-2024-001",
            "es_project_no": "ES2024-001",
            "project_name": "2024年核心路由器采购项目",
            "bid_section_no": "标段1",
            "purchase_manager": "张三",
            "project_category": "货物",
            "purchase_method": "公开招标",
            "current_stage": "采购合同已签署",
            "winning_supplier": "华为技术有限公司",
            "result_publish_time": "2024-03-18",
            "contract_sign_time": "2024-04-05",
            "fee_base": 4800000.00,
            "fee_amount": 85000.00,
            "fee_received_amount": 85000.00,
            "fee_received_date": "2024-05-20",
            "has_invoice": "是",
            "invoice_no": "FP-2024-0501",
            "invoice_date": "2024-05-15",
            "fee_is_received": "是",
            "received_date": "2024-05-20",
            "fee_diff": 0.00,
            "fee_diff_reason": None,
            "fee_penalty": 0.00,
            "penalty_reason": None,
            "check_month": "2024-05",
        },
        {
            "id": 2,
            "client_name": "中国移动通信集团",
            "contract_period": "2024-2025年",
            "plan_no": "CGFA-2024-002",
            "result_no": "CGJG-2024-002",
            "es_project_no": "ES2024-002",
            "project_name": "2024年IT运维服务采购项目",
            "bid_section_no": "不分标段",
            "purchase_manager": "王五",
            "project_category": "服务",
            "purchase_method": "公开比选",
            "current_stage": "采购结果已确认",
            "winning_supplier": "中软国际有限公司",
            "result_publish_time": "2024-05-12",
            "contract_sign_time": None,
            "fee_base": 2850000.00,
            "fee_amount": 50000.00,
            "fee_received_amount": 0.00,
            "fee_received_date": None,
            "has_invoice": "否",
            "invoice_no": None,
            "invoice_date": None,
            "fee_is_received": "否",
            "received_date": None,
            "fee_diff": 50000.00,
            "fee_diff_reason": "合同尚未签署, 代理费尚未收取",
            "fee_penalty": 0.00,
            "penalty_reason": None,
            "check_month": "2024-05",
        },
    ],

    # ----------------------------------------------------------
    # 表3: 代理人员及账号
    # ----------------------------------------------------------
    "personnel": [
        {
            "id": 1,
            "contract_period": "2024-2025年",
            "agency_name": "中捷通信有限公司",
            "name": "李四",
            "role": "项目经理",
            "es_account": "ES-LISI-001",
            "phone": "13800138001",
            "email": "lisi@zhongjie.com",
            "exam_score": "95",
            "exam_time": "2024-01-15",
            "cert_duration": "2年",
            "cert_is_expired": "否",
            "expired_reason": None,
            "fulltime_education": "本科",
            "highest_education": "硕士",
            "work_experience": "8年",
            "procurement_qualification": "中级",
            "has_intermediate_title": "是",
            "status": "正常",
            "account_effective_date": "2024-01-20",
            "account_frozen_date": None,
            "account_locked_date": None,
            "is_resigned": "否",
            "org_unit": "采购代理一部",
            "miit_account": "MIIT-LISI-001",
            "id_card": "110101199001011234",
        },
        {
            "id": 2,
            "contract_period": "2024-2025年",
            "agency_name": "中捷通信有限公司",
            "name": "王芳",
            "role": "采购专员",
            "es_account": "ES-WANGFANG-002",
            "phone": "13800138002",
            "email": "wangfang@zhongjie.com",
            "exam_score": "88",
            "exam_time": "2023-06-15",
            "cert_duration": "1年",
            "cert_is_expired": "是",
            "expired_reason": "未及时参加2024年集团认证考试",
            "fulltime_education": "本科",
            "highest_education": "本科",
            "work_experience": "5年",
            "procurement_qualification": "初级",
            "has_intermediate_title": "否",
            "status": "冻结",
            "account_effective_date": "2023-06-20",
            "account_frozen_date": "2024-06-20",
            "account_locked_date": None,
            "is_resigned": "否",
            "org_unit": "采购代理一部",
            "miit_account": "MIIT-WANGFANG-002",
            "id_card": "110102199203052345",
        },
        {
            "id": 3,
            "contract_period": "2024-2025年",
            "agency_name": "中捷通信有限公司",
            "name": "刘强",
            "role": "采购专员",
            "es_account": "ES-LIUQIANG-003",
            "phone": "13800138003",
            "email": "liuqiang@zhongjie.com",
            "exam_score": "92",
            "exam_time": "2024-01-15",
            "cert_duration": "2年",
            "cert_is_expired": "否",
            "expired_reason": None,
            "fulltime_education": "硕士",
            "highest_education": "硕士",
            "work_experience": "10年",
            "procurement_qualification": "中级",
            "has_intermediate_title": "是",
            "status": "正常",
            "account_effective_date": "2024-01-20",
            "account_frozen_date": None,
            "account_locked_date": None,
            "is_resigned": "否",
            "org_unit": "采购代理二部",
            "miit_account": "MIIT-LIUQIANG-003",
            "id_card": "110103198505103456",
        },
    ],

    # ----------------------------------------------------------
    # 表4: 专家评审费发放台账
    # ----------------------------------------------------------
    "expert_fees": [
        {
            "id": 1,
            "contract_period": "2024-2025年",
            "agency_name": "中捷通信有限公司",
            "project_name": "2024年核心路由器采购项目",
            "project_no": "ES2024-001",
            "expert_name": "陈专家",
            "eval_start_date": "2024-03-08",
            "eval_end_date": "2024-03-10",
            "result_announcement_time": "2024-03-12",
            "billing_standard": "1000",
            "is_group_purchase": "是",
            "first_day_duration": "8小时",
            "cross_day_duration": "8小时",
            "late_score": "0",
            "total_duration": "16小时",
            "total_fee": 2000.00,
            "payment_time": "2024-03-20",
            "payment_method": "转账",
            "purchase_method": "公开招标",
            "remark": None,
        },
        {
            "id": 2,
            "contract_period": "2024-2025年",
            "agency_name": "中捷通信有限公司",
            "project_name": "2024年核心路由器采购项目",
            "project_no": "ES2024-001",
            "expert_name": "林专家",
            "eval_start_date": "2024-03-08",
            "eval_end_date": "2024-03-10",
            "result_announcement_time": "2024-03-12",
            "billing_standard": "1000",
            "is_group_purchase": "是",
            "first_day_duration": "8小时",
            "cross_day_duration": "8小时",
            "late_score": "0",
            "total_duration": "16小时",
            "total_fee": 2000.00,
            "payment_time": "2024-03-20",
            "payment_method": "转账",
            "purchase_method": "公开招标",
            "remark": None,
        },
        {
            "id": 3,
            "contract_period": "2024-2025年",
            "agency_name": "中捷通信有限公司",
            "project_name": "2024年IT运维服务采购项目",
            "project_no": "ES2024-002",
            "expert_name": "黄专家",
            "eval_start_date": "2024-05-03",
            "eval_end_date": "2024-05-05",
            "result_announcement_time": "2024-05-07",
            "billing_standard": "800",
            "is_group_purchase": "否",
            "first_day_duration": "6小时",
            "cross_day_duration": "6小时",
            "late_score": "5",
            "total_duration": "12小时",
            "total_fee": 1200.00,
            "payment_time": "2024-05-15",
            "payment_method": "现金",
            "purchase_method": "公开比选",
            "remark": "迟到30分钟, 扣5分",
        },
    ],

    # ----------------------------------------------------------
    # 表5: 样品收发台账
    # ----------------------------------------------------------
    "samples": [
        {
            "id": 1,
            "agency_name": "中捷通信有限公司",
            "project_name": "2024年核心路由器采购项目",
            "project_no": "ES2024-001",
            "sample_name": "核心路由器",
            "sample_model": "CR-16000X",
            "supplier_name": "华为技术有限公司",
            "is_winner": "是",
            "sample_quantity": 1,
            "receive_time": "2024-02-20",
            "need_return": "是",
            "notice_time": "2024-03-18",
            "return_requirement": "中标结果公示后30日内退还",
            "should_return_time": "2024-04-17",
            "return_time": "2024-04-10",
            "not_returned_reason": None,
            "remark": "样品完好退还",
            "check_month": "2024-05",
        },
        {
            "id": 2,
            "agency_name": "中捷通信有限公司",
            "project_name": "2024年核心路由器采购项目",
            "project_no": "ES2024-001",
            "sample_name": "核心路由器",
            "sample_model": "CR-8000X",
            "supplier_name": "中兴通讯股份有限公司",
            "is_winner": "否",
            "sample_quantity": 1,
            "receive_time": "2024-02-20",
            "need_return": "是",
            "notice_time": "2024-03-18",
            "return_requirement": "中标结果公示后30日内退还",
            "should_return_time": "2024-04-17",
            "return_time": "2024-04-12",
            "not_returned_reason": None,
            "remark": None,
            "check_month": "2024-05",
        },
    ],

    # ----------------------------------------------------------
    # 表6: 电子评标室使用情况
    # ----------------------------------------------------------
    "eval_rooms": [
        {
            "id": 1,
            "agency_name": "中捷通信有限公司",
            "stat_scope": "2024年1月-6月",
            "total_eval_count": 15,
            "es_booking_count": 14,
            "not_booked_reason": "1次因ES系统维护未能预约, 使用线下评标室",
            "mobile_eval_count": 2,
            "should_use_mobile_count": 3,
            "g_mobile_count": 2,
            "resource_lack_count": 1,
            "other_reason_count": 0,
            "other_reason_desc": None,
            "agency_room_count": 3,
        },
    ],

    # ----------------------------------------------------------
    # 表7: 评审专家履职评议
    # ----------------------------------------------------------
    "expert_evaluation": [
        {
            "id": 1,
            "project_name": "2024年核心路由器采购项目",
            "project_manager": "张三",
            "agency_name": "中捷通信有限公司",
            "agency_project_manager": "李四",
            "eval_date": "2024-03-10",
            "judge_name": "陈专家",
            "phone": "13900139001",
            "final_score": 95.5,
            "deduction_reason": "答辩环节略显紧张, 扣2分",
            "standard_fee": 2000.00,
            "actual_fee": 2000.00,
        },
        {
            "id": 2,
            "project_name": "2024年核心路由器采购项目",
            "project_manager": "张三",
            "agency_name": "中捷通信有限公司",
            "agency_project_manager": "李四",
            "eval_date": "2024-03-10",
            "judge_name": "林专家",
            "phone": "13900139002",
            "final_score": 98.0,
            "deduction_reason": None,
            "standard_fee": 2000.00,
            "actual_fee": 2000.00,
        },
        {
            "id": 3,
            "project_name": "2024年IT运维服务采购项目",
            "project_manager": "王五",
            "agency_name": "中捷通信有限公司",
            "agency_project_manager": "李四",
            "eval_date": "2024-05-05",
            "judge_name": "黄专家",
            "phone": "13900139003",
            "final_score": 88.5,
            "deduction_reason": "迟到30分钟, 扣5分; 评审记录不够详细, 扣2分",
            "standard_fee": 1200.00,
            "actual_fee": 1200.00,
        },
    ],

    # ----------------------------------------------------------
    # 表8: 投标保证金台账
    # ----------------------------------------------------------
    "bid_deposits": [
        {
            "id": 1,
            "client_name": "中国电信股份有限公司",
            "contract_period": "2024-2025年",
            "plan_no": "CGFA-2024-001",
            "result_no": "CGJG-2024-001",
            "es_project_no": "ES2024-001",
            "project_name": "2024年核心路由器采购项目",
            "bid_section_no": "标段1",
            "purchase_manager": "张三",
            "project_category": "货物",
            "purchase_method": "公开招标",
            "current_stage": "采购合同已签署",
            "supplier_name": "华为技术有限公司",
            "is_winning_supplier": "是",
            "candidate_announcement_time": "2024-03-12",
            "result_publish_time": "2024-03-18",
            "contract_sign_time": "2024-04-05",
            "contract_no": "HT-2024-001",
            "is_collected": "是",
            "has_restriction": "否",
            "meets_ratio_requirement": "是",
            "payment_method": "电子保函",
            "receivable_amount": 240000.00,
            "received_amount": 240000.00,
            "received_date": "2024-02-25",
            "is_renewed": "否",
            "renew_reason": None,
            "latest_return_date": "2024-05-05",
            "notify_time": "2024-04-06",
            "actual_return_date": "2024-04-15",
            "notify_to_return_duration": "9天",
            "sign_to_return_duration": "10天",
            "is_overdue": "否",
            "overdue_responsible_party": None,
            "overdue_reason": None,
            "overdue_reason_detail": None,
            "is_confiscated": "否",
            "confiscation_reason": None,
            "refund_interest": 0.00,
            "actual_refund_amount": 240000.00,
            "actual_refund_interest": 0.00,
            "transfer_amount": 0.00,
            "receivable_diff": "0",
            "received_refund_diff": "0",
            "interest_diff": "0",
            "diff_reason": None,
            "agency_name": "中捷通信有限公司",
            "agency_manager": "李四",
            "check_month": "2024-05",
        },
        {
            "id": 2,
            "client_name": "中国电信股份有限公司",
            "contract_period": "2024-2025年",
            "plan_no": "CGFA-2024-001",
            "result_no": "CGJG-2024-001",
            "es_project_no": "ES2024-001",
            "project_name": "2024年核心路由器采购项目",
            "bid_section_no": "标段1",
            "purchase_manager": "张三",
            "project_category": "货物",
            "purchase_method": "公开招标",
            "current_stage": "采购合同已签署",
            "supplier_name": "中兴通讯股份有限公司",
            "is_winning_supplier": "否",
            "candidate_announcement_time": "2024-03-12",
            "result_publish_time": "2024-03-18",
            "contract_sign_time": "2024-04-05",
            "contract_no": None,
            "is_collected": "是",
            "has_restriction": "否",
            "meets_ratio_requirement": "是",
            "payment_method": "电汇",
            "receivable_amount": 240000.00,
            "received_amount": 240000.00,
            "received_date": "2024-02-25",
            "is_renewed": "否",
            "renew_reason": None,
            "latest_return_date": "2024-04-18",
            "notify_time": "2024-03-19",
            "actual_return_date": "2024-03-25",
            "notify_to_return_duration": "6天",
            "sign_to_return_duration": None,
            "is_overdue": "否",
            "overdue_responsible_party": None,
            "overdue_reason": None,
            "overdue_reason_detail": None,
            "is_confiscated": "否",
            "confiscation_reason": None,
            "refund_interest": 0.00,
            "actual_refund_amount": 240000.00,
            "actual_refund_interest": 0.00,
            "transfer_amount": 0.00,
            "receivable_diff": "0",
            "received_refund_diff": "0",
            "interest_diff": "0",
            "diff_reason": None,
            "agency_name": "中捷通信有限公司",
            "agency_manager": "李四",
            "check_month": "2024-05",
        },
    ],

    # ----------------------------------------------------------
    # 表9: 履约保证金台账
    # ----------------------------------------------------------
    "performance_deposits": [
        {
            "id": 1,
            "client_name": "中国电信股份有限公司",
            "contract_period": "2024-2025年",
            "plan_no": "CGFA-2024-001",
            "result_no": "CGJG-2024-001",
            "es_project_no": "ES2024-001",
            "project_name": "2024年核心路由器采购项目",
            "bid_section_no": "标段1",
            "purchase_manager": "张三",
            "project_category": "货物",
            "purchase_method": "公开招标",
            "current_stage": "采购合同已签署",
            "winning_supplier": "华为技术有限公司",
            "result_publish_time": "2024-03-18",
            "contract_sign_time": "2024-04-05",
            "deposit_nature": "履约保证金",
            "collection_method": "电子保函",
            "guarantee_no": "BG-2024-001",
            "contract_no": "HT-2024-001",
            "contract_name": "2024年核心路由器采购合同",
            "guarantee_start_date": "2024-04-05",
            "guarantee_end_date": "2025-04-04",
            "guarantee_bank": "中国工商银行",
            "deposit_amount": 480000.00,
            "is_transferred": "是",
            "is_received": None,
            "contract_end_date": "2025-04-04",
            "is_returned": "否",
            "agency_name": "中捷通信有限公司",
            "agency_manager": "李四",
        },
        {
            "id": 2,
            "client_name": "中国电信股份有限公司",
            "contract_period": "2024-2025年",
            "plan_no": "CGFA-2024-001",
            "result_no": "CGJG-2024-001",
            "es_project_no": "ES2024-001",
            "project_name": "2024年核心路由器采购项目",
            "bid_section_no": "标段1",
            "purchase_manager": "张三",
            "project_category": "货物",
            "purchase_method": "公开招标",
            "current_stage": "采购合同已签署",
            "winning_supplier": "华为技术有限公司",
            "result_publish_time": "2024-03-18",
            "contract_sign_time": "2024-04-05",
            "deposit_nature": "质保金",
            "collection_method": "电汇",
            "guarantee_no": None,
            "contract_no": "HT-2024-001",
            "contract_name": "2024年核心路由器采购合同",
            "guarantee_start_date": "2025-04-05",
            "guarantee_end_date": "2026-04-04",
            "guarantee_bank": None,
            "deposit_amount": 240000.00,
            "is_transferred": None,
            "is_received": "是",
            "contract_end_date": "2026-04-04",
            "is_returned": "否",
            "agency_name": "中捷通信有限公司",
            "agency_manager": "李四",
        },
    ],

    # ----------------------------------------------------------
    # 表10: 项目问题台账
    # ----------------------------------------------------------
    "project_issues": [
        {
            "id": 1,
            "client_name": "中国移动通信集团",
            "contract_period": "2024-2025年",
            "es_project_no": "ES2024-002",
            "project_name": "2024年IT运维服务采购项目",
            "issue_type": "自检",
            "occurrence_stage": "采购文件编制",
            "issue_description": "采购文件中技术参数表述不够清晰, 部分条款存在歧义",
            "is_rectified": "是",
            "remark": "已修改技术参数描述, 重新发布采购文件",
        },
        {
            "id": 2,
            "client_name": "中国电信股份有限公司",
            "contract_period": "2024-2025年",
            "es_project_no": "ES2024-001",
            "project_name": "2024年核心路由器采购项目",
            "issue_type": "日常稽核",
            "occurrence_stage": "评审过程",
            "issue_description": "评审过程中有1位专家迟到, 影响评审进度",
            "is_rectified": "是",
            "remark": "已对迟到专家进行扣分处理, 并提醒后续准时参加",
        },
    ],
}


# ============================================================
# 初始化函数
# ============================================================

def init_database(drop_existing=False):
    """
    初始化数据库: 创建所有表, 插入示例数据。

    Args:
        drop_existing: 是否先删除已有表
    """
    # 如果已存在数据库文件，先做损坏检测，损坏则备份后重建（避免直接删除生产数据）
    if os.path.exists(DB_PATH):
        probe_conn = None
        try:
            probe_conn = sqlite3.connect(DB_PATH)
            # 单纯的 SELECT 1 不会触发 "file is not a database" 错误，
            # 必须读取 sqlite_master 才会触发 page 1 读取校验
            probe_conn.execute("SELECT name FROM sqlite_master LIMIT 1").fetchone()
        except Exception as e:
            # 损坏时：先备份再让后续 connect 重建，保留原始文件以便排查
            if probe_conn is not None:
                try:
                    probe_conn.close()
                except Exception:
                    pass
                probe_conn = None
            broken_path = f"{DB_PATH}.broken.{int(time.time())}"
            print(f"[WARN] 数据库文件无效 ({DB_PATH}): {e}")
            print(f"[WARN] 将损坏文件备份到: {broken_path}")
            try:
                os.rename(DB_PATH, broken_path)
            except OSError:
                # 重命名失败（例如跨设备或 Windows 文件被占用），退化为复制后删除
                try:
                    import shutil
                    shutil.copy2(DB_PATH, broken_path)
                    os.remove(DB_PATH)
                except OSError as ee:
                    print(f"[ERROR] 备份损坏数据库失败: {ee}")
                    raise
        finally:
            if probe_conn is not None:
                try:
                    probe_conn.close()
                except Exception:
                    pass

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # 删除已有表
    if drop_existing:
        for table_name in TABLES.keys():
            cursor.execute(f'DROP TABLE IF EXISTS "{table_name}"')
        conn.commit()
        print("已删除所有旧表")

    # 创建表
    for table_name, sql in get_all_create_table_sql().items():
        cursor.execute(sql)
    conn.commit()
    print(f"已创建 {len(TABLES)} 个表")

    # 插入示例数据（可通过环境变量 SKIP_SAMPLE_DATA=1 跳过）
    skip_sample = os.environ.get('SKIP_SAMPLE_DATA', '').lower() in ('1', 'true', 'yes')
    if skip_sample:
        print("SKIP_SAMPLE_DATA=1, 跳过示例数据插入")
        conn.close()
        print("\n数据库初始化完成(空数据库)!")
        print(f"数据库文件: {DB_PATH}")
        return

    for table_name, records in SAMPLE_DATA.items():
        if not records:
            continue

        fields = get_fields(table_name)
        field_keys = get_field_keys(table_name)
        pk = get_primary_key(table_name)

        # 检查是否已有数据
        cursor.execute(f'SELECT COUNT(*) FROM "{table_name}"')
        existing_count = cursor.fetchone()[0]
        if existing_count > 0:
            print(f"  [{table_name}] 已有 {existing_count} 条数据, 跳过插入示例数据")
            continue

        for record in records:
            # 过滤字段, 只保留在 schema 中定义的
            filtered = {k: v for k, v in record.items() if k in field_keys}
            # 设置 created_by 为 admin
            filtered["created_by"] = "admin"
            columns = list(filtered.keys())
            placeholders = ["?"] * len(columns)
            values = [filtered[c] for c in columns]

            col_list = ", ".join('"' + c + '"' for c in columns)
            sql = (
                f'INSERT INTO "{table_name}" '
                f'({col_list}) '
                f'VALUES ({", ".join(placeholders)})'
            )
            cursor.execute(sql, values)

        conn.commit()
        print(f"  [{table_name}] 插入 {len(records)} 条示例数据")

    conn.close()
    print("\n数据库初始化完成!")
    print(f"数据库文件: {DB_PATH}")


def show_stats():
    """显示数据库统计信息"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    print("\n" + "=" * 60)
    print("  数据库统计信息")
    print("=" * 60)

    total = 0
    for table_name, table_info in TABLES.items():
        try:
            cursor.execute(f'SELECT COUNT(*) FROM "{table_name}"')
            count = cursor.fetchone()[0]
        except sqlite3.Error:
            count = 0
        print(f"  {table_info['name_cn']:20s} ({table_name:25s}): {count:4d} 条记录")
        total += count

    print("-" * 60)
    print(f"  {'总计':20s} ({'':25s}): {total:4d} 条记录")
    print("=" * 60)

    conn.close()


# ============================================================
# 主入口
# ============================================================

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="采购代理台账管理系统 - 数据库初始化")
    parser.add_argument(
        "--drop", action="store_true",
        help="删除已有表后重新创建 (会丢失数据)",
    )
    parser.add_argument(
        "--stats", action="store_true",
        help="仅显示统计信息",
    )
    args = parser.parse_args()

    if args.stats:
        show_stats()
    else:
        print("=" * 60)
        print("  采购代理台账管理系统 - 数据库初始化")
        print("=" * 60)
        init_database(drop_existing=args.drop)
        show_stats()
