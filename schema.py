# -*- coding: utf-8 -*-
"""
采购代理台账管理系统 - 数据库 Schema 定义
定义所有表的字段名(中文)、字段key(英文)、数据类型、是否必填、下拉菜单选项
"""

# ============================================================
# 通用下拉菜单选项
# ============================================================
YES_NO = ["是", "否"]

# ============================================================
# 所有表的 Schema 定义
# ============================================================
TABLES = {

    # ----------------------------------------------------------
    # 表1: 项目台账
    # ----------------------------------------------------------
    "projects": {
        "name_cn": "项目台账",
        "fields": [
            {"key": "id",                              "name_cn": "ID",                                                          "type": "integer", "required": True,  "primary_key": True, "hidden": True},
            {"key": "seq_no",                          "name_cn": "序号",                                                        "type": "string",  "required": False, "editable_seq": True},
            {"key": "client_name",                     "name_cn": "委托单位名称",                                                  "type": "string",  "required": False},
            {"key": "contract_period",                 "name_cn": "合同期",                                                       "type": "string",  "required": False, "options": ["2020-2021年", "2022-2023年", "2024-2025年"]},
            {"key": "entrust_no",                      "name_cn": "委托单编号（SCM系统）",                                          "type": "string",  "required": False},
            {"key": "es_project_no",                   "name_cn": "ES项目编号",                                                   "type": "string",  "required": False},
            {"key": "project_name",                    "name_cn": "项目名称（ES系统项目全称）",                                     "type": "string",  "required": False},
            {"key": "current_stage",                   "name_cn": "当前采购环节",                                                  "type": "string",  "required": False, "options": ["未启动", "已启动", "采购方案编制完成待决策", "采购方案已决策实施中", "采购结果已确认", "采购合同已签署", "项目取消"]},
            {"key": "purchase_manager",                "name_cn": "采购经理",                                                     "type": "string",  "required": False},
            {"key": "project_category",                "name_cn": "项目类别",                                                     "type": "string",  "required": False, "options": ["货物", "服务", "施工"]},
            {"key": "purchase_method",                 "name_cn": "采购方式",                                                     "type": "string",  "required": False, "options": ["公开招标", "公开比选", "邀请招标", "竞争性谈判", "单一来源", "询比"]},
            {"key": "is_split_bid",                    "name_cn": "是否分标段",                                                   "type": "string",  "required": False, "options": YES_NO},
            {"key": "is_split_share",                  "name_cn": "是否分份额",                                                   "type": "string",  "required": False, "options": YES_NO},
            {"key": "budget_amount",                   "name_cn": "项目预算金额（含税）",                                          "type": "number",  "required": False},
            {"key": "winning_amount",                  "name_cn": "项目中标金额（含税）",                                          "type": "number",  "required": False},
            {"key": "agency_fee_amount",               "name_cn": "代理服务费金额",                                               "type": "number",  "required": False},
            {"key": "deposit_total",                   "name_cn": "项目保证金总额",                                               "type": "number",  "required": False},
            {"key": "review_fee_total",                "name_cn": "项目评审费用总额",                                             "type": "number",  "required": False},
            {"key": "is_on_miit",                      "name_cn": "是否上工信部平台",                                             "type": "string",  "required": False, "options": ["是", "否", "待定", "项目取消"]},
            {"key": "record_time",                     "name_cn": "备案时间",                                                     "type": "date",    "required": False},
            {"key": "record_overdue_warning",          "name_cn": "备案超时预警（中标通知书发布15日内）",                           "type": "string",  "required": False},
            {"key": "record_is_overdue",               "name_cn": "备案是否超期",                                                 "type": "string",  "required": False, "options": YES_NO},
            {"key": "is_centralized_bid",              "name_cn": "是否为集中招标",                                               "type": "string",  "required": False, "options": ["是", "否", "待定", "项目取消"]},
            {"key": "centralized_completion_date",     "name_cn": "集中招标所有项目实施完成日期",                                  "type": "date",    "required": False},
            {"key": "impl_report_record_time",         "name_cn": "实施报告备案时间",                                             "type": "date",    "required": False},
            {"key": "impl_report_overdue_warning",     "name_cn": "实施报告超时预警（项目实施完成30日内）",                        "type": "string",  "required": False},
            {"key": "impl_report_is_overdue",          "name_cn": "实施报告备案是否超期",                                         "type": "string",  "required": False, "options": YES_NO},
            {"key": "bid_eval_deadline",               "name_cn": "评标截止时间",                                                 "type": "date",    "required": False},
            {"key": "candidate_announcement_start",    "name_cn": "中标候选人公示发布时间",                                       "type": "date",    "required": False},
            {"key": "candidate_announcement_end",      "name_cn": "中标候选人公示结束时间",                                       "type": "date",    "required": False},
            {"key": "result_notice_time",              "name_cn": "采购结果/中标通知书发布时间",                                  "type": "date",    "required": False},
            {"key": "latest_contract_sign_time",       "name_cn": "最晚纸质合同签署时间",                                        "type": "date",    "required": False},
            {"key": "is_archived",                     "name_cn": "是否已归档",                                                   "type": "string",  "required": False, "options": ["是", "否", "待定", "项目取消"]},
            {"key": "archive_receive_time",            "name_cn": "档案室接收时间",                                              "type": "date",    "required": False},
            {"key": "archive_overdue_days",            "name_cn": "按照中标通知书发布时间计算的归档超时天数",                      "type": "integer", "required": False},
            {"key": "archive_days_from_sign",          "name_cn": "归档时间距合同签署的天数",                                     "type": "integer", "required": False},
            {"key": "archive_is_overdue",              "name_cn": "归档是否超时",                                                "type": "string",  "required": False, "options": YES_NO},
            {"key": "not_archived_reason",             "name_cn": "未及时归档原因",                                              "type": "string",  "required": False},
            {"key": "archive_no",                      "name_cn": "归档编号",                                                    "type": "string",  "required": False},
            {"key": "is_manual_judge",                 "name_cn": "是否涉及人工抽取评委",                                         "type": "string",  "required": False, "options": YES_NO},
            {"key": "is_full_recording",               "name_cn": "是否对评委抽取、公开唱价和评审关键进行全程录音录像",            "type": "string",  "required": False},
            {"key": "recording_upload_time",           "name_cn": "录像上传时间（中选结果通知书后7个工作日内（不计当日）上传）",    "type": "date",    "required": False},
            {"key": "recording_upload_warning",        "name_cn": "录像上传预警",                                                "type": "string",  "required": False},
            {"key": "recording_is_clear",              "name_cn": "录像是否清晰、完整",                                          "type": "string",  "required": False, "options": YES_NO},
            {"key": "audit_has_issues",                "name_cn": "项目稽核、检查是否存在问题",                                   "type": "string",  "required": False, "options": YES_NO},
            {"key": "bid_eval_period",                 "name_cn": "评标时间段",                                                  "type": "string",  "required": False},
            {"key": "es_room_booking_count",           "name_cn": "在ES系统预约会议室次数",                                      "type": "integer", "required": False},
            {"key": "electronic_eval_count",           "name_cn": "电子评标系统评审次数",                                        "type": "integer", "required": False},
            {"key": "is_one_day_remote",               "name_cn": "是否一天评标且有异地评委项目",                                 "type": "string",  "required": False},
            {"key": "not_use_electronic_eval_reason",  "name_cn": "未使用电子评标系统评审原因",                                  "type": "string",  "required": False},
            {"key": "agency_name",                     "name_cn": "代理机构名称",                                                "type": "string",  "required": False},
            {"key": "agency_manager",                  "name_cn": "代理负责人（必须与ES系统及实际人员保持一致）",                  "type": "string",  "required": False},
            {"key": "check_month",                     "name_cn": "检查月份",                                                    "type": "string",  "required": False},
        ],
    },

    # ----------------------------------------------------------
    # 表2: 代理费台账
    # ----------------------------------------------------------
    "agency_fees": {
        "name_cn": "代理费台账",
        "fields": [
            {"key": "id",                          "name_cn": "ID",                                                                                          "type": "integer", "required": True,  "primary_key": True, "hidden": True},
            {"key": "seq_no",                      "name_cn": "序号",                                                                                        "type": "string",  "required": False, "editable_seq": True},
            {"key": "client_name",                 "name_cn": "客户名称（全称）",                                                                            "type": "string",  "required": False},
            {"key": "contract_period",             "name_cn": "合同期",                                                                                      "type": "string",  "required": False, "options": ["2020-2021年", "2022-2023年", "2024-2025年"]},
            {"key": "entrust_no",                  "name_cn": "委托单编号（SCM系统）",                                                                        "type": "string",  "required": False},
            {"key": "receive_entrust_time",        "name_cn": "收到委托单时间",                                                                              "type": "date",    "required": False},
            {"key": "plan_no",                     "name_cn": "采购方案编号",                                                                                "type": "string",  "required": False},
            {"key": "result_no",                   "name_cn": "采购结果编号",                                                                                "type": "string",  "required": False},
            {"key": "es_project_no",               "name_cn": "ES项目编号",                                                                                  "type": "string",  "required": False},
            {"key": "es_create_time",              "name_cn": "ES系统建项时间",                                                                              "type": "date",    "required": False},
            {"key": "project_name",                "name_cn": "项目名称（ES系统项目全称）",                                                                   "type": "string",  "required": False},
            {"key": "bid_section_no",              "name_cn": "标包/标段号",                                                                                 "type": "string",  "required": False},
            {"key": "purchase_manager",            "name_cn": "采购经理",                                                                                    "type": "string",  "required": False},
            {"key": "project_category",            "name_cn": "项目类别",                                                                                    "type": "string",  "required": False, "options": ["货物", "服务", "施工"]},
            {"key": "purchase_method",             "name_cn": "采购方式",                                                                                    "type": "string",  "required": False, "options": ["公开招标", "公开比选", "邀请招标", "竞争性谈判", "单一来源", "询比"]},
            {"key": "current_stage",               "name_cn": "当前采购环节",                                                                                "type": "string",  "required": False, "options": ["未启动", "已启动", "采购方案编制完成待决策", "采购方案已决策实施中", "采购结果已确认", "采购合同已签署", "项目取消"]},
            {"key": "winning_supplier",            "name_cn": "中标供应商名称",                                                                              "type": "string",  "required": False},
            {"key": "candidate_announcement_time", "name_cn": "中标候选人公示发布时间",                                                                      "type": "date",    "required": False},
            {"key": "result_notice_time",          "name_cn": "采购结果/中标通知书发布时间",                                                                 "type": "date",    "required": False},
            {"key": "has_eval_room",               "name_cn": "代理机构是否提供评标室",                                                                      "type": "string",  "required": False, "options": YES_NO},
            {"key": "system_amount",               "name_cn": "系统金额（按项目合计，如有多个供应商填写到第一个中标供应商处）",                                "type": "number",  "required": False},
            {"key": "receivable_total",            "name_cn": "应收金额合计（按项目合计，如有多个供应商填写到第一个中标供应商处）",                            "type": "number",  "required": False},
            {"key": "receivable_amount",           "name_cn": "应收金额（按供应商填写）",                                                                    "type": "number",  "required": False},
            {"key": "system_receivable_diff",      "name_cn": "系统与应收金额差额（公式列，需保留公式）",                                                     "type": "string",  "required": False},
            {"key": "diff_reason",                 "name_cn": "差额原因",                                                                                    "type": "string",  "required": False},
            {"key": "diff_found_time",             "name_cn": "发现存在差额时间（发现存在差额至消除差异时间不得超过一周）",                                    "type": "date",    "required": False},
            {"key": "actual_received_fee",         "name_cn": "实收代理费",                                                                                  "type": "number",  "required": False},
            {"key": "receivable_actual_diff",      "name_cn": "应收与实收金额差额",                                                                          "type": "number",  "required": False},
            {"key": "need_refund",                 "name_cn": "是否需回退代理费，需回退金额（下拉菜单）",                                                     "type": "string",  "required": False, "options": YES_NO},
            {"key": "is_refunded",                 "name_cn": "是否已回退（下拉菜单）",                                                                      "type": "string",  "required": False, "options": YES_NO},
            {"key": "need_deduct",                 "name_cn": "是否需扣代理费（下拉菜单）",                                                                  "type": "string",  "required": False, "options": YES_NO},
            {"key": "is_deducted",                 "name_cn": "是否已支付需扣除的代理费（下拉菜单）",                                                        "type": "string",  "required": False, "options": YES_NO},
            {"key": "agency_name",                 "name_cn": "代理机构名称",                                                                                "type": "string",  "required": False},
            {"key": "agency_manager",              "name_cn": "代理负责人（必须与ES系统及实际人员保持一致）",                                                "type": "string",  "required": False},
            {"key": "check_month",                 "name_cn": "检查月份",                                                                                    "type": "string",  "required": False},
        ],
    },

    # ----------------------------------------------------------
    # 表3: 代理人员及账号
    # ----------------------------------------------------------
    "personnel": {
        "name_cn": "代理人员及账号",
        "fields": [
            {"key": "id",                            "name_cn": "ID",                   "type": "integer", "required": True,  "primary_key": True, "hidden": True},
            {"key": "contract_period",               "name_cn": "合同期",                "type": "string",  "required": False, "options": ["2020-2021年", "2022-2023年", "2024-2025年"]},
            {"key": "agency_name",                   "name_cn": "代理机构名称",           "type": "string",  "required": False},
            {"key": "name",                          "name_cn": "姓名",                  "type": "string",  "required": False},
            {"key": "role",                          "name_cn": "角色",                  "type": "string",  "required": False},
            {"key": "es_account",                    "name_cn": "ES账号",               "type": "string",  "required": False},
            {"key": "phone",                         "name_cn": "手机号码",              "type": "string",  "required": False},
            {"key": "email",                         "name_cn": "邮箱",                  "type": "string",  "required": False},
            {"key": "exam_score",                    "name_cn": "最近一次认证考试成绩",    "type": "string",  "required": False},
            {"key": "exam_time",                     "name_cn": "最近一次集团认证考试时间", "type": "date",   "required": False},
            {"key": "cert_duration",                 "name_cn": "认证时长",              "type": "string",  "required": False},
            {"key": "cert_is_expired",               "name_cn": "认证是否过期",           "type": "string",  "required": False, "options": YES_NO},
            {"key": "expired_reason",                "name_cn": "过期未认证原因",         "type": "string",  "required": False},
            {"key": "fulltime_education",            "name_cn": "全日制最高学历",         "type": "string",  "required": False},
            {"key": "highest_education",             "name_cn": "最高学历",              "type": "string",  "required": False},
            {"key": "work_experience",               "name_cn": "从业经验",              "type": "string",  "required": False},
            {"key": "procurement_qualification",     "name_cn": "招采资质",              "type": "string",  "required": False, "options": ["初级", "中级"]},
            {"key": "has_intermediate_title",        "name_cn": "是否具备中级职称",      "type": "string",  "required": False, "options": YES_NO},
            {"key": "status",                        "name_cn": "状态",                  "type": "string",  "required": False, "options": ["正常", "冻结", "锁定"]},
            {"key": "account_effective_date",        "name_cn": "账号生效日期",          "type": "date",    "required": False},
            {"key": "account_frozen_date",           "name_cn": "账号冻结日期",          "type": "date",    "required": False},
            {"key": "account_locked_date",           "name_cn": "账号锁定日期",          "type": "date",    "required": False},
            {"key": "is_resigned",                   "name_cn": "是否已离职",             "type": "string",  "required": False, "options": YES_NO},
            {"key": "org_unit",                      "name_cn": "所属组织单位",           "type": "string",  "required": False},
            {"key": "miit_account",                  "name_cn": "工信部账号",            "type": "string",  "required": False},
            {"key": "id_card",                       "name_cn": "身份证号",              "type": "string",  "required": False},
        ],
    },

    # ----------------------------------------------------------
    # 表4: 专家评审费发放台账
    # ----------------------------------------------------------
    "expert_fees": {
        "name_cn": "专家评审费发放台账",
        "fields": [
            {"key": "id",                        "name_cn": "ID",                    "type": "integer", "required": True,  "primary_key": True, "hidden": True},
            {"key": "seq_no",                    "name_cn": "序号",                  "type": "string",  "required": False, "editable_seq": True},
            {"key": "contract_period",           "name_cn": "合同期",                "type": "string",  "required": False, "options": ["2024-2025年", "2022-2023年"]},
            {"key": "agency_name",               "name_cn": "代理机构名称",           "type": "string",  "required": False},
            {"key": "project_name",              "name_cn": "项目名称",              "type": "string",  "required": False},
            {"key": "project_no",                "name_cn": "项目编号",              "type": "string",  "required": False},
            {"key": "expert_name",               "name_cn": "评审专家姓名",           "type": "string",  "required": False},
            {"key": "eval_start_date",           "name_cn": "评标开始日期",           "type": "date",    "required": False},
            {"key": "eval_end_date",             "name_cn": "评标结束日期",           "type": "date",    "required": False},
            {"key": "result_announcement_time",  "name_cn": "采购结果公示时间",       "type": "date",    "required": False},
            {"key": "billing_standard",          "name_cn": "计费标准(元/人天）",     "type": "string",  "required": False, "options": ["800", "1000"]},
            {"key": "is_group_purchase",         "name_cn": "是否集团一采项目",       "type": "string",  "required": False, "options": YES_NO},
            {"key": "first_day_duration",        "name_cn": "首日评审时长（小时）",   "type": "string",  "required": False},
            {"key": "cross_day_duration",        "name_cn": "跨天（超8小时）评审时长（小时）", "type": "string",  "required": False},
            {"key": "late_score",                "name_cn": "迟到分数（分钟）",       "type": "string",  "required": False},
            {"key": "total_duration",            "name_cn": "评审总时长",             "type": "string",  "required": False},
            {"key": "total_fee",                 "name_cn": "总评标费（元）",         "type": "number",  "required": False},
            {"key": "payment_time",              "name_cn": "发放时间（年/月/日）",   "type": "date",    "required": False},
            {"key": "payment_method",            "name_cn": "发放方式（现金/转账/微信等）", "type": "string",  "required": False, "options": ["现金", "转账", "微信"]},
            {"key": "purchase_method",           "name_cn": "采购方式",              "type": "string",  "required": False, "options": ["公开招标", "公开比选", "邀请招标", "竞争性谈判", "单一来源", "询比"]},
            {"key": "remark",                    "name_cn": "备注",                  "type": "string",  "required": False},
        ],
    },

    # ----------------------------------------------------------
    # 表5: 样品收发台账
    # ----------------------------------------------------------
    "samples": {
        "name_cn": "样品收发台账",
        "fields": [
            {"key": "id",                   "name_cn": "ID",                      "type": "integer", "required": True,  "primary_key": True, "hidden": True},
            {"key": "seq_no",               "name_cn": "序号",                    "type": "string",  "required": False, "editable_seq": True},
            {"key": "agency_name",          "name_cn": "代理机构名称",             "type": "string",  "required": False},
            {"key": "project_name",         "name_cn": "采购项目名称",             "type": "string",  "required": False},
            {"key": "project_no",           "name_cn": "采购项目编号",             "type": "string",  "required": False},
            {"key": "sample_name",          "name_cn": "样品名称",                "type": "string",  "required": False},
            {"key": "sample_model",         "name_cn": "样品型号",                "type": "string",  "required": False},
            {"key": "supplier_name",        "name_cn": "供应商名称",              "type": "string",  "required": False},
            {"key": "is_winner",            "name_cn": "是否中选人",              "type": "string",  "required": False, "options": YES_NO},
            {"key": "sample_quantity",      "name_cn": "样品数量",                "type": "integer", "required": False},
            {"key": "receive_time",         "name_cn": "收取时间（年/月/日）",     "type": "date",    "required": False},
            {"key": "need_return",          "name_cn": "是否需要退还",            "type": "string",  "required": False, "options": YES_NO},
            {"key": "notice_time",          "name_cn": "中标通知书发放时间",       "type": "date",    "required": False},
            {"key": "return_requirement",   "name_cn": "采购文件对退还时间的要求", "type": "string",  "required": False},
            {"key": "should_return_time",   "name_cn": "应退还时间（年/月/日）",   "type": "date",    "required": False},
            {"key": "return_time",          "name_cn": "退还时间（年/月/日）",     "type": "date",    "required": False},
            {"key": "not_returned_reason",  "name_cn": "未按时退还原因",          "type": "string",  "required": False},
            {"key": "remark",               "name_cn": "备注",                    "type": "string",  "required": False},
            {"key": "check_month",          "name_cn": "检查月份",                "type": "string",  "required": False},
        ],
    },

    # ----------------------------------------------------------
    # 表6: 电子评标室使用情况
    # ----------------------------------------------------------
    "eval_rooms": {
        "name_cn": "电子评标室使用情况",
        "fields": [
            {"key": "id",                      "name_cn": "ID",                                              "type": "integer", "required": True,  "primary_key": True, "hidden": True},
            {"key": "agency_name",             "name_cn": "代理机构名称",                                     "type": "string",  "required": False},
            {"key": "stat_scope",              "name_cn": "统计范围",                                        "type": "string",  "required": False},
            {"key": "total_eval_count",        "name_cn": "评标总次数",                                      "type": "integer", "required": False},
            {"key": "es_booking_count",        "name_cn": "在ES系统预约会议室次数",                           "type": "integer", "required": False},
            {"key": "not_booked_reason",       "name_cn": "未在系统预约会议室原因",                           "type": "string",  "required": False},
            {"key": "mobile_eval_count",       "name_cn": "使用移动电子评标室的次数",                         "type": "integer", "required": False},
            {"key": "should_use_mobile_count", "name_cn": "应使用移动电子评标室（一天完成评标且有异地评委）的次数", "type": "integer", "required": False},
            {"key": "g_mobile_count",          "name_cn": "G列中项目使用移动电子评标室的次数",                "type": "integer", "required": False},
            {"key": "resource_lack_count",     "name_cn": "因资源不足应使用未使用移动电子评标室次数",          "type": "integer", "required": False},
            {"key": "other_reason_count",      "name_cn": "其他原因应使用未使用移动电子评标室次数",            "type": "integer", "required": False},
            {"key": "other_reason_desc",       "name_cn": "J列如不为0说明具体原因",                           "type": "string",  "required": False},
            {"key": "agency_room_count",       "name_cn": "招标代理评标室数量",                               "type": "integer", "required": False},
        ],
    },

    # ----------------------------------------------------------
    # 表7: 评审专家履职评议
    # ----------------------------------------------------------
    "expert_evaluation": {
        "name_cn": "评审专家履职评议",
        "fields": [
            {"key": "id",                       "name_cn": "ID",                "type": "integer", "required": True,  "primary_key": True, "hidden": True},
            {"key": "seq_no",                   "name_cn": "序号",              "type": "string",  "required": False, "editable_seq": True},
            {"key": "project_name",             "name_cn": "采购项目名称",       "type": "string",  "required": False},
            {"key": "project_manager",          "name_cn": "采购项目经理",       "type": "string",  "required": False},
            {"key": "agency_name",              "name_cn": "代理机构",           "type": "string",  "required": False},
            {"key": "agency_project_manager",   "name_cn": "代理机构项目经理",   "type": "string",  "required": False},
            {"key": "eval_date",                "name_cn": "评审日期",           "type": "date",    "required": False},
            {"key": "judge_name",               "name_cn": "评委姓名",           "type": "string",  "required": False},
            {"key": "phone",                    "name_cn": "电话号码",           "type": "string",  "required": False},
            {"key": "final_score",              "name_cn": "评委履职评议最终得分", "type": "number",  "required": False},
            {"key": "deduction_reason",         "name_cn": "履职评议扣分具体原因", "type": "string",  "required": False},
            {"key": "standard_fee",             "name_cn": "应发的标准评审费",   "type": "number",  "required": False},
            {"key": "actual_fee",               "name_cn": "实发评审费",         "type": "number",  "required": False},
        ],
    },

    # ----------------------------------------------------------
    # 表8: 投标保证金台账
    # ----------------------------------------------------------
    "bid_deposits": {
        "name_cn": "投标保证金台账",
        "fields": [
            {"key": "id",                          "name_cn": "ID",                                                                                "type": "integer", "required": True,  "primary_key": True, "hidden": True},
            {"key": "agency_manager",              "name_cn": "代理负责人（必须与ES系统及实际人员保持一致）",                                       "type": "string",  "required": False},
            {"key": "client_name",                 "name_cn": "客户名称（全称）",                                                                  "type": "string",  "required": False},
            {"key": "contract_period",             "name_cn": "合同期",                                                                            "type": "string",  "required": False, "options": ["2020-2021年", "2022-2023年", "2024-2025年"]},
            {"key": "plan_no",                     "name_cn": "采购方案编号",                                                                      "type": "string",  "required": False},
            {"key": "result_no",                   "name_cn": "采购结果编号",                                                                      "type": "string",  "required": False},
            {"key": "es_project_no",               "name_cn": "ES项目编号",                                                                        "type": "string",  "required": False},
            {"key": "project_name",                "name_cn": "项目名称（ES系统项目全称）",                                                         "type": "string",  "required": False},
            {"key": "bid_section_no",              "name_cn": "标包/标段号",                                                                       "type": "string",  "required": False},
            {"key": "purchase_manager",            "name_cn": "采购经理",                                                                          "type": "string",  "required": False},
            {"key": "project_category",            "name_cn": "项目类别",                                                                          "type": "string",  "required": False, "options": ["货物", "服务", "施工"]},
            {"key": "purchase_method",             "name_cn": "采购方式",                                                                          "type": "string",  "required": False, "options": ["公开招标", "公开比选", "邀请招标", "竞争性谈判", "单一来源", "询比"]},
            {"key": "current_stage",               "name_cn": "当前采购环节",                                                                      "type": "string",  "required": False, "options": ["未启动", "已启动", "采购方案编制完成待决策", "采购方案已决策实施中", "采购结果已确认", "采购合同已签署", "项目取消"]},
            {"key": "supplier_name",               "name_cn": "应答供应商名称",                                                                    "type": "string",  "required": False},
            {"key": "is_winning_supplier",         "name_cn": "是否中选供应商",                                                                    "type": "string",  "required": False, "options": YES_NO},
            {"key": "candidate_announcement_time", "name_cn": "中标候选人公示发布时间",                                                            "type": "date",    "required": False},
            {"key": "result_publish_time",         "name_cn": "采购结果/中标通知书发布时间",                                                       "type": "date",    "required": False},
            {"key": "contract_sign_time",          "name_cn": "纸质合同签署时间（2023年11月7日后以合同系统签约时间为准）",                           "type": "date",    "required": False},
            {"key": "contract_no",                 "name_cn": "合同编号",                                                                          "type": "string",  "required": False},
            {"key": "is_collected",                "name_cn": "是否收取保证金（下拉菜单）",                                                        "type": "string",  "required": False, "options": ["是", "否", "待定", "不收取保证金"]},
            {"key": "has_restriction",             "name_cn": "采购文件中是否存在限制保证金缴纳只能以现金形式缴纳的情形（下拉菜单）",                 "type": "string",  "required": False},
            {"key": "meets_ratio_requirement",     "name_cn": "是否符合收取比例和上限要求（下拉菜单）",                                             "type": "string",  "required": False},
            {"key": "payment_method",              "name_cn": "保证金缴纳方式（下拉菜单）",                                                        "type": "string",  "required": False, "options": ["纸质保函", "电子保函", "电汇", "尚未收取"]},
            {"key": "receivable_amount",           "name_cn": "应收金额（元）",                                                                    "type": "number",  "required": False},
            {"key": "received_amount",             "name_cn": "实收金额（元）",                                                                    "type": "number",  "required": False},
            {"key": "received_date",               "name_cn": "收款日期",                                                                          "type": "date",    "required": False},
            {"key": "is_renewed",                  "name_cn": "保证金是否续保",                                                                    "type": "string",  "required": False},
            {"key": "renew_reason",                "name_cn": "续保原因",                                                                          "type": "string",  "required": False},
            {"key": "latest_return_date",          "name_cn": "最迟应退日期（以最晚纸质合同签署时间计算）",                                         "type": "date",    "required": False},
            {"key": "notify_time",                 "name_cn": "采购经办人邮件通知退保时间",                                                        "type": "date",    "required": False},
            {"key": "actual_return_date",          "name_cn": "实际退款/保函退还日期",                                                             "type": "date",    "required": False},
            {"key": "notify_to_return_duration",   "name_cn": "收到退款通知与实际退款时长",                                                        "type": "string",  "required": False},
            {"key": "sign_to_return_duration",     "name_cn": "合同签署和实际退款时长",                                                            "type": "string",  "required": False},
            {"key": "is_overdue",                  "name_cn": "保证金退款是否超期",                                                                "type": "string",  "required": False, "options": YES_NO},
            {"key": "overdue_responsible_party",   "name_cn": "未按时退款责任方",                                                                  "type": "string",  "required": False, "options": ["委托方", "代理机构", "供应商"]},
            {"key": "overdue_reason",              "name_cn": "未按时退款原因（下拉菜单）",                                                        "type": "string",  "required": False},
            {"key": "overdue_reason_detail",       "name_cn": "未按时退款原因详细说明",                                                            "type": "string",  "required": False},
            {"key": "is_confiscated",              "name_cn": "是否没收保证金（下拉菜单）",                                                        "type": "string",  "required": False, "options": YES_NO},
            {"key": "confiscation_reason",         "name_cn": "没收保证金原因",                                                                    "type": "string",  "required": False},
            {"key": "refund_interest",             "name_cn": "应退款利息（元）",                                                                  "type": "number",  "required": False},
            {"key": "actual_refund_amount",        "name_cn": "实退金额（元，不含利息）",                                                          "type": "number",  "required": False},
            {"key": "actual_refund_interest",      "name_cn": "实际退款利息（元）",                                                                "type": "number",  "required": False},
            {"key": "transfer_amount",             "name_cn": "转移动账户金额",                                                                    "type": "number",  "required": False},
            {"key": "receivable_diff",             "name_cn": "应收与实收差异（公式列，需保留公式）",                                               "type": "string",  "required": False},
            {"key": "received_refund_diff",        "name_cn": "实收和实退保证金金额差异（公式列，需保留公式）",                                     "type": "string",  "required": False},
            {"key": "interest_diff",               "name_cn": "应退和实退保证金利息金额差异（公式列，需保留公式）",                                 "type": "string",  "required": False},
            {"key": "diff_reason",                 "name_cn": "差异原因",                                                                          "type": "string",  "required": False},
            {"key": "agency_name",                 "name_cn": "代理机构名称",                                                                      "type": "string",  "required": False},
            {"key": "check_month",                 "name_cn": "保证金检查月份",                                                                    "type": "string",  "required": False},
        ],
    },

    # ----------------------------------------------------------
    # 表9: 履约保证金台账
    # ----------------------------------------------------------
    "performance_deposits": {
        "name_cn": "履约保证金台账",
        "fields": [
            {"key": "id",                    "name_cn": "ID",                                                          "type": "integer", "required": True,  "primary_key": True, "hidden": True},
            {"key": "seq_no",                "name_cn": "序号",                                                        "type": "string",  "required": False, "editable_seq": True},
            {"key": "client_name",           "name_cn": "客户名称（全称）",                                            "type": "string",  "required": False},
            {"key": "contract_period",       "name_cn": "合同期",                                                      "type": "string",  "required": False, "options": ["2020-2021年", "2022-2023年", "2024-2025年"]},
            {"key": "plan_no",               "name_cn": "采购方案编号",                                                "type": "string",  "required": False},
            {"key": "result_no",             "name_cn": "采购结果编号",                                                "type": "string",  "required": False},
            {"key": "es_project_no",         "name_cn": "ES项目编号",                                                  "type": "string",  "required": False},
            {"key": "project_name",          "name_cn": "项目名称（ES系统项目全称）",                                   "type": "string",  "required": False},
            {"key": "bid_section_no",        "name_cn": "标包/标段号",                                                 "type": "string",  "required": False},
            {"key": "purchase_manager",      "name_cn": "采购经理",                                                    "type": "string",  "required": False},
            {"key": "project_category",      "name_cn": "项目类别",                                                    "type": "string",  "required": False, "options": ["货物", "服务", "施工"]},
            {"key": "purchase_method",       "name_cn": "采购方式",                                                    "type": "string",  "required": False, "options": ["公开招标", "公开比选", "邀请招标", "竞争性谈判", "单一来源", "询比"]},
            {"key": "current_stage",         "name_cn": "当前采购环节",                                                "type": "string",  "required": False, "options": ["未启动", "已启动", "采购方案编制完成待决策", "采购方案已决策实施中", "采购结果已确认", "采购合同已签署", "项目取消"]},
            {"key": "winning_supplier",      "name_cn": "中选供应商名称",                                              "type": "string",  "required": False},
            {"key": "result_publish_time",   "name_cn": "采购结果/中标通知书发布时间",                                 "type": "date",    "required": False},
            {"key": "contract_sign_time",    "name_cn": "纸质合同签署时间（2023年11月7日后以合同系统签约时间为准）",     "type": "date",    "required": False},
            {"key": "deposit_nature",        "name_cn": "保证金性质",                                                  "type": "string",  "required": False, "options": ["履约保证金", "农民工工资保证金", "质保金"]},
            {"key": "collection_method",     "name_cn": "收取方式（下拉菜单）",                                        "type": "string",  "required": False, "options": ["纸质保函", "电子保函", "电汇", "保险"]},
            {"key": "guarantee_no",          "name_cn": "保函编号",                                                    "type": "string",  "required": False},
            {"key": "contract_no",           "name_cn": "合同编号",                                                    "type": "string",  "required": False},
            {"key": "contract_name",         "name_cn": "对应合同名称",                                                "type": "string",  "required": False},
            {"key": "guarantee_start_date",  "name_cn": "保函开立日期",                                                "type": "date",    "required": False},
            {"key": "guarantee_end_date",    "name_cn": "保函到期日",                                                  "type": "date",    "required": False},
            {"key": "guarantee_bank",        "name_cn": "保函办理银行",                                                "type": "string",  "required": False},
            {"key": "deposit_amount",        "name_cn": "保证金金额（元）",                                            "type": "number",  "required": False},
            {"key": "is_transferred",        "name_cn": "保函是否已移交采购经办人",                                    "type": "string",  "required": False, "options": YES_NO},
            {"key": "is_received",           "name_cn": "电汇是否已到账",                                              "type": "string",  "required": False, "options": YES_NO},
            {"key": "contract_end_date",     "name_cn": "合同到期日",                                                  "type": "date",    "required": False},
            {"key": "is_returned",           "name_cn": "是否已退还",                                                  "type": "string",  "required": False, "options": YES_NO},
            {"key": "agency_name",           "name_cn": "代理机构名称",                                                "type": "string",  "required": False},
            {"key": "agency_manager",        "name_cn": "代理负责人（必须与ES系统及实际人员保持一致）",                "type": "string",  "required": False},
        ],
    },

    # ----------------------------------------------------------
    # 表10: 项目问题台账
    # ----------------------------------------------------------
    "project_issues": {
        "name_cn": "项目问题台账",
        "fields": [
            {"key": "id",                "name_cn": "ID",                        "type": "integer", "required": True,  "primary_key": True, "hidden": True},
            {"key": "seq_no",            "name_cn": "序号",                      "type": "string",  "required": False, "editable_seq": True},
            {"key": "client_name",       "name_cn": "客户名称（全称）",          "type": "string",  "required": False},
            {"key": "contract_period",   "name_cn": "合同期",                    "type": "string",  "required": False, "options": ["2020-2021年", "2022-2023年", "2024-2025年"]},
            {"key": "es_project_no",     "name_cn": "ES项目编号",                "type": "string",  "required": False},
            {"key": "project_name",      "name_cn": "项目名称（ES系统项目全称）", "type": "string",  "required": False},
            {"key": "issue_type",        "name_cn": "问题类型",                  "type": "string",  "required": False, "options": ["自检", "省内检查", "集团检查", "外部检查", "日常稽核"]},
            {"key": "occurrence_stage",  "name_cn": "发生环节",                  "type": "string",  "required": False, "options": ["采购文件编制", "评审过程", "合同编制"]},
            {"key": "issue_description", "name_cn": "问题说明",                  "type": "string",  "required": False},
            {"key": "is_rectified",      "name_cn": "是否完成整改",              "type": "string",  "required": False, "options": YES_NO},
        ],
    },

    # ----------------------------------------------------------
    # 内部表: 自定义列管理
    # ----------------------------------------------------------
    "_custom_columns": {
        "name_cn": "自定义列管理",
        "fields": [
            {"key": "id",            "name_cn": "ID",         "type": "integer", "required": True,  "primary_key": True, "hidden": True},
            {"key": "table_name",    "name_cn": "表名",       "type": "string",  "required": True},
            {"key": "field_key",     "name_cn": "字段Key",    "type": "string",  "required": True},
            {"key": "field_name_cn", "name_cn": "字段中文名", "type": "string",  "required": True},
            {"key": "field_type",    "name_cn": "字段类型",   "type": "string",  "required": True, "options": ["string", "number", "integer", "date"]},
            {"key": "is_dropdown",   "name_cn": "是否下拉选项", "type": "string",  "required": False, "options": YES_NO},
            {"key": "sort_order",    "name_cn": "排序",       "type": "integer", "required": False},
            {"key": "after_field",   "name_cn": "插入位置(在哪个字段后)", "type": "string",  "required": False},
            {"key": "created_at",    "name_cn": "创建时间",   "type": "string",  "required": False},
        ],
        "internal": True,
    },

    # ----------------------------------------------------------
    # 内部表: 隐藏列管理 (基础列的逻辑隐藏)
    # ----------------------------------------------------------
    "_hidden_columns": {
        "name_cn": "隐藏列管理",
        "fields": [
            {"key": "id",         "name_cn": "ID",     "type": "integer", "required": True,  "primary_key": True, "hidden": True},
            {"key": "table_name", "name_cn": "表名",   "type": "string",  "required": True},
            {"key": "field_key",  "name_cn": "字段Key", "type": "string",  "required": True},
            {"key": "hidden_at",  "name_cn": "隐藏时间", "type": "string",  "required": False},
        ],
        "internal": True,
    },
}


# ============================================================
# 业务逻辑校验规则
# ============================================================
BUSINESS_RULES = [
    {
        "table": "projects",
        "description": "如果是否已归档=是, 则档案室接收时间不能为空",
        "condition_field": "is_archived",
        "condition_value": "是",
        "required_fields": ["archive_receive_time"],
        "type": "error",
    },
    {
        "table": "bid_deposits",
        "description": "如果是否收取保证金=是, 则应收金额不能为空",
        "condition_field": "is_collected",
        "condition_value": "是",
        "required_fields": ["receivable_amount"],
        "type": "error",
    },
    {
        "table": "bid_deposits",
        "description": "如果保证金退款是否超期=是, 则未按时退款原因不能为空",
        "condition_field": "is_overdue",
        "condition_value": "是",
        "required_fields": ["overdue_reason"],
        "type": "error",
    },
    {
        "table": "projects",
        "description": "如果项目稽核检查是否存在问题=是, 则必须在项目问题台账中有对应记录",
        "condition_field": "audit_has_issues",
        "condition_value": "是",
        "cross_table": "project_issues",
        "cross_field": "es_project_no",
        "match_field": "es_project_no",
        "type": "error",
    },
    {
        "table": "personnel",
        "description": "认证是否过期=是时, 过期未认证原因不能为空",
        "condition_field": "cert_is_expired",
        "condition_value": "是",
        "required_fields": ["expired_reason"],
        "type": "error",
    },
]


# ============================================================
# 跨表关联定义
# ============================================================
CROSS_TABLE_RELATIONS = [
    {
        "from_table": "agency_fees",
        "from_field": "es_project_no",
        "to_table": "projects",
        "to_field": "es_project_no",
        "description": "代理费台账的ES项目编号应在项目台账中存在",
    },
    {
        "from_table": "bid_deposits",
        "from_field": "es_project_no",
        "to_table": "projects",
        "to_field": "es_project_no",
        "description": "投标保证金台账的ES项目编号应在项目台账中存在",
    },
    {
        "from_table": "performance_deposits",
        "from_field": "es_project_no",
        "to_table": "projects",
        "to_field": "es_project_no",
        "description": "履约保证金台账的ES项目编号应在项目台账中存在",
    },
    {
        "from_table": "project_issues",
        "from_field": "es_project_no",
        "to_table": "projects",
        "to_field": "es_project_no",
        "description": "项目问题台账的ES项目编号应在项目台账中存在",
    },
]


# ============================================================
# 辅助函数
# ============================================================

def get_table_names():
    """获取所有表名"""
    return list(TABLES.keys())


def get_table_cn_name(table_name):
    """获取表中文名"""
    if table_name in TABLES:
        return TABLES[table_name]["name_cn"]
    return None


def get_fields(table_name):
    """获取表的字段列表"""
    if table_name in TABLES:
        return TABLES[table_name]["fields"]
    return []


def get_field_keys(table_name):
    """获取表的字段key列表"""
    return [f["key"] for f in get_fields(table_name)]


def get_field_cn_names(table_name):
    """获取表的字段中文名列表"""
    return [f["name_cn"] for f in get_fields(table_name)]


def get_primary_key(table_name):
    """获取表的主键字段key"""
    for f in get_fields(table_name):
        if f.get("primary_key"):
            return f["key"]
    return "id"


def get_field_by_key(table_name, key):
    """根据key获取字段定义"""
    for f in get_fields(table_name):
        if f["key"] == key:
            return f
    return None


def get_dropdown_fields(table_name):
    """获取表中有下拉菜单的字段"""
    result = {}
    for f in get_fields(table_name):
        if "options" in f and f["options"]:
            result[f["key"]] = {
                "name_cn": f["name_cn"],
                "options": f["options"],
            }
    return result


def get_required_fields(table_name):
    """获取表的必填字段列表"""
    return [f["key"] for f in get_fields(table_name) if f.get("required") and not f.get("primary_key")]


def get_date_fields(table_name):
    """获取表中的日期字段列表"""
    return [f["key"] for f in get_fields(table_name) if f["type"] == "date"]


def get_number_fields(table_name):
    """获取表中的数字字段列表"""
    return [f["key"] for f in get_fields(table_name) if f["type"] == "number"]


def get_integer_fields(table_name):
    """获取表中的整数字段列表"""
    return [f["key"] for f in get_fields(table_name) if f["type"] == "integer"]


def get_sqlite_type(field_type):
    """将字段类型映射为SQLite类型"""
    mapping = {
        "integer": "INTEGER",
        "number": "REAL",
        "string": "TEXT",
        "date": "TEXT",
    }
    return mapping.get(field_type, "TEXT")


def get_create_table_sql(table_name):
    """生成建表SQL"""
    fields = get_fields(table_name)
    if not fields:
        return None

    columns = []
    for f in fields:
        col_type = get_sqlite_type(f["type"])
        col_def = f'"{f["key"]}" {col_type}'
        if f.get("primary_key"):
            col_def += " PRIMARY KEY"
            if f["type"] == "integer":
                col_def += " AUTOINCREMENT"
        columns.append(col_def)

    # 添加 created_by 和 created_at 列（用于权限控制和审计）
    if not table_name.startswith("_"):
        columns.append('"created_by" TEXT')
        columns.append('"created_at" TEXT DEFAULT (datetime(\'now\', \'localtime\'))')

    sql = f'CREATE TABLE IF NOT EXISTS "{table_name}" (\n  ' + ",\n  ".join(columns) + "\n)"
    return sql


def get_all_create_table_sql():
    """获取所有表的建表SQL"""
    return {name: get_create_table_sql(name) for name in TABLES.keys()}


def get_table_info(table_name):
    """获取表的完整信息(用于API返回)"""
    if table_name not in TABLES:
        return None
    return {
        "table_name": table_name,
        "name_cn": TABLES[table_name]["name_cn"],
        "fields": get_fields(table_name),
        "field_count": len(get_fields(table_name)),
    }


def get_all_tables_info():
    """获取所有表的完整信息"""
    return {name: get_table_info(name) for name in TABLES.keys()}


def get_visible_fields(table_name):
    """获取表的可见字段（非hidden）"""
    return [f for f in get_fields(table_name) if not f.get("hidden")]


def get_seq_fields(table_name):
    """获取表中的可编辑序号字段"""
    return [f for f in get_fields(table_name) if f.get("editable_seq")]


def is_internal_table(table_name):
    """判断是否为内部表"""
    return TABLES.get(table_name, {}).get("internal", False)


def get_user_tables():
    """获取用户可见的表（非内部表）"""
    return {k: v for k, v in TABLES.items() if not v.get("internal")}
