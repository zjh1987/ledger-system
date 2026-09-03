/* ============================================================
 * 采购代理台账管理系统 - 前端交互逻辑 app.js
 * 功能: API调用封装 / 表格渲染 / 行内编辑 / 校验 / 搜索 / 分页 / 导入导出
 * ============================================================ */

(function () {
    'use strict';

    /* ============ 配置与常量 ============ */
    const CONFIG = {
        apiBase: '/api',
        defaultPageSize: 20,
        debounceSearchMs: 300,
        toastDuration: 3000,
        // 新增行的临时ID前缀，用于区分未保存行
        tempIdPrefix: 'temp_',
    };

    /* ============ 全局状态 ============ */
    const state = {
        currentTable: 'projects',
        currentTableName: '项目台账',
        columns: [],            // 当前列定义
        rawData: [],            // 后端返回的原始数据
        displayData: [],        // 经搜索过滤后的数据
        currentPage: 1,
        pageSize: 20,
        totalRecords: 0,
        searchKeyword: '',
        // 编辑状态: { rowId, fieldName, originalValue }
        editing: null,
        // 标记新增行的临时ID集合
        newRowIds: new Set(),
        // 修改过的行: Map(rowId -> Set(fieldName))
        modifiedRows: new Map(),
        // 待保存的修改(行内编辑后未提交): Map(rowId -> {field: value})
        pendingChanges: new Map(),
        // 校验结果
        validationErrors: [],   // [{rowId, fieldName, message, type:'error'|'warning'}]
        // 行状态: Map(rowId -> 'new'|'modified'|'error'|'warning')
        rowStatus: new Map(),
        // 是否正在加载
        loading: false,
        // 拖拽导入
        dragOver: false,
        // 认证状态
        authToken: localStorage.getItem('authToken') || null,
        currentUser: null,
        // 表头列筛选: { fieldName: { type: 'text'|'select', value: string|string[], matchMode: 'contains'|'exact'|'notEmpty'|'empty' } }
        columnFilters: {},
    };

    /* ============ DOM 引用 ============ */
    const dom = {};

    function cacheDom() {
        dom.sidebar = document.getElementById('sidebar');
        dom.sidebarToggle = document.getElementById('sidebarToggle');
        dom.tabList = document.getElementById('tabList');
        dom.currentTableTitle = document.getElementById('currentTableTitle');
        dom.recordCount = document.getElementById('recordCount');
        dom.searchInput = document.getElementById('searchInput');
        dom.searchClear = document.getElementById('searchClear');
        dom.validateBtn = document.getElementById('validateBtn');
        dom.refreshBtn = document.getElementById('refreshBtn');
        dom.addBtn = document.getElementById('addBtn');
        dom.exportBtn = document.getElementById('exportBtn');
        dom.importBtn = document.getElementById('importBtn');
        dom.importFileInput = document.getElementById('importFileInput');
        dom.tableHead = document.getElementById('tableHead');
        dom.tableBody = document.getElementById('tableBody');
        dom.dataTable = document.getElementById('dataTable');
        dom.loadingOverlay = document.getElementById('loadingOverlay');
        dom.pagination = document.getElementById('pagination');
        dom.pageInfo = document.getElementById('pageInfo');
        dom.pageSizeSelect = document.getElementById('pageSizeSelect');
        dom.pageNumbers = document.getElementById('pageNumbers');
        dom.firstPageBtn = document.getElementById('firstPageBtn');
        dom.prevPageBtn = document.getElementById('prevPageBtn');
        dom.nextPageBtn = document.getElementById('nextPageBtn');
        dom.lastPageBtn = document.getElementById('lastPageBtn');
        dom.validationPanel = document.getElementById('validationPanel');
        dom.validationBody = document.getElementById('validationBody');
        dom.validationSummary = document.getElementById('validationSummary');
        dom.errorCount = document.getElementById('errorCount');
        dom.warningCount = document.getElementById('warningCount');
        dom.validationToggle = document.getElementById('validationToggle');
        dom.validationClear = document.getElementById('validationClear');
        dom.toastContainer = document.getElementById('toastContainer');
        dom.apiStatus = document.getElementById('apiStatus');
        // 导入弹窗
        dom.importModal = document.getElementById('importModal');
        dom.importTableName = document.getElementById('importTableName');
        dom.importDropzone = document.getElementById('importDropzone');
        dom.importSelectBtn = document.getElementById('importSelectBtn');
        dom.importProgress = document.getElementById('importProgress');
        dom.progressFill = document.getElementById('progressFill');
        dom.progressText = document.getElementById('progressText');
        dom.importResult = document.getElementById('importResult');
        dom.importModalClose = document.getElementById('importModalClose');
        dom.importCancelBtn = document.getElementById('importCancelBtn');
        // 确认弹窗
        dom.confirmModal = document.getElementById('confirmModal');
        dom.confirmTitle = document.getElementById('confirmTitle');
        dom.confirmMessage = document.getElementById('confirmMessage');
        dom.confirmOkBtn = document.getElementById('confirmOkBtn');
        dom.confirmCancelBtn = document.getElementById('confirmCancelBtn');
        // 登录页面
        dom.loginPage = document.getElementById('loginPage');
        dom.loginForm = document.getElementById('loginForm');
        dom.loginUsername = document.getElementById('loginUsername');
        dom.loginPassword = document.getElementById('loginPassword');
        dom.loginError = document.getElementById('loginError');
        dom.loginBtn = document.getElementById('loginBtn');
        dom.mainApp = document.getElementById('mainApp');
        // 用户菜单
        dom.userMenu = document.getElementById('userMenu');
        dom.userAvatar = document.getElementById('userAvatar');
        dom.userName = document.getElementById('userName');
        dom.userDropdown = document.getElementById('userDropdown');
        dom.menuUserInfo = document.getElementById('menuUserInfo');
        dom.menuUserManage = document.getElementById('menuUserManage');
        dom.menuChangePassword = document.getElementById('menuChangePassword');
        dom.menuLogout = document.getElementById('menuLogout');
        dom.permissionHint = document.getElementById('permissionHint');
        // 用户管理弹窗
        dom.userManageModal = document.getElementById('userManageModal');
        dom.userManageClose = document.getElementById('userManageClose');
        dom.userList = document.getElementById('userList');
        dom.formUsername = document.getElementById('formUsername');
        dom.formDisplayName = document.getElementById('formDisplayName');
        dom.formPassword = document.getElementById('formPassword');
        dom.formRole = document.getElementById('formRole');
        dom.userFormSubmit = document.getElementById('userFormSubmit');
        dom.userFormCancel = document.getElementById('userFormCancel');
        // 修改密码弹窗
        dom.changePwdModal = document.getElementById('changePwdModal');
        dom.changePwdClose = document.getElementById('changePwdClose');
        dom.pwdUsername = document.getElementById('pwdUsername');
        dom.pwdOld = document.getElementById('pwdOld');
        dom.pwdOldGroup = document.getElementById('pwdOldGroup');
        dom.pwdNew = document.getElementById('pwdNew');
        dom.pwdConfirm = document.getElementById('pwdConfirm');
        dom.pwdForceHint = document.getElementById('pwdForceHint');
        dom.changePwdCancel = document.getElementById('changePwdCancel');
        dom.changePwdSubmit = document.getElementById('changePwdSubmit');
        // 一键导入/导出全部
        dom.importAllBtn = document.getElementById('importAllBtn');
        dom.exportAllBtn = document.getElementById('exportAllBtn');
        dom.clearAllBtn = document.getElementById('clearAllBtn');
        dom.importAllFileInput = document.getElementById('importAllFileInput');
        // 下拉选项管理
        dom.menuDropdownManage = document.getElementById('menuDropdownManage');
        dom.dropdownManageModal = document.getElementById('dropdownManageModal');
        dom.dropdownManageClose = document.getElementById('dropdownManageClose');
        dom.ddTableSelect = document.getElementById('ddTableSelect');
        dom.ddFieldSelect = document.getElementById('ddFieldSelect');
        dom.ddOptionValue = document.getElementById('ddOptionValue');
        dom.ddAddBtn = document.getElementById('ddAddBtn');
        dom.ddOptionList = document.getElementById('ddOptionList');
        // 导入模板下载
        dom.downloadTemplateBtn = document.getElementById('downloadTemplateBtn');
        // 表头列管理
        dom.menuColumnManage = document.getElementById('menuColumnManage');
        dom.columnManageModal = document.getElementById('columnManageModal');
        dom.columnManageClose = document.getElementById('columnManageClose');
        dom.colTableSelect = document.getElementById('colTableSelect');
        dom.colNameInput = document.getElementById('colNameInput');
        dom.colTypeSelect = document.getElementById('colTypeSelect');
        dom.colDropdownSelect = document.getElementById('colDropdownSelect');
        dom.colPositionSelect = document.getElementById('colPositionSelect');
        dom.colAddBtn = document.getElementById('colAddBtn');
        dom.colList = document.getElementById('colList');
    }

    /* ============ API 调用封装 ============ */
    const api = {
        /**
         * 通用 fetch 封装
         */
        async request(url, options = {}) {
            const defaultHeaders = {};
            // 添加认证 token
            if (state.authToken) {
                defaultHeaders['Authorization'] = 'Bearer ' + state.authToken;
            }
            // 非 FormData 请求设置 JSON content-type
            if (!(options.body instanceof FormData) && options.body && typeof options.body === 'object') {
                defaultHeaders['Content-Type'] = 'application/json';
                options.body = JSON.stringify(options.body);
            }
            const response = await fetch(url, {
                ...options,
                headers: { ...defaultHeaders, ...options.headers },
            });

            // 401 未授权 - 跳转登录
            if (response.status === 401) {
                state.authToken = null;
                localStorage.removeItem('authToken');
                showLogin();
                throw new Error('登录已过期，请重新登录');
            }

            // 处理文件下载(导出Excel)
            const contentType = response.headers.get('content-type') || '';
            if (contentType.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') ||
                contentType.includes('application/vnd.ms-excel') ||
                contentType.includes('application/octet-stream')) {
                const blob = await response.blob();
                return { _blob: blob, _response: response };
            }

            if (!response.ok) {
                let errMsg = `请求失败 (${response.status})`;
                try {
                    const errData = await response.json();
                    errMsg = errData.message || errData.error || errData.detail || errMsg;
                } catch (e) { /* 忽略解析错误 */ }
                const error = new Error(errMsg);
                error.status = response.status;
                throw error;
            }

            // 空响应
            const text = await response.text();
            if (!text) return null;
            try {
                return JSON.parse(text);
            } catch (e) {
                return text;
            }
        },

        get(url) {
            return this.request(url, { method: 'GET' });
        },

        post(url, data) {
            return this.request(url, { method: 'POST', body: data });
        },

        put(url, data) {
            return this.request(url, { method: 'PUT', body: data });
        },

        delete(url, data) {
            const opts = { method: 'DELETE' };
            if (data !== undefined) opts.body = data;
            return this.request(url, opts);
        },

        upload(url, formData, onProgress) {
            return new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('POST', url, true);
                // 添加认证 token（修复导入全部时未登录问题）
                if (state.authToken) {
                    xhr.setRequestHeader('Authorization', 'Bearer ' + state.authToken);
                }
                if (onProgress) {
                    xhr.upload.addEventListener('progress', (e) => {
                        if (e.lengthComputable) {
                            onProgress(Math.round((e.loaded / e.total) * 100));
                        }
                    });
                }
                xhr.onload = () => {
                    if (xhr.status === 401) {
                        state.authToken = null;
                        localStorage.removeItem('authToken');
                        showLogin();
                        reject(new Error('登录已过期，请重新登录'));
                        return;
                    }
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            resolve(JSON.parse(xhr.responseText));
                        } catch (e) {
                            resolve(xhr.responseText);
                        }
                    } else {
                        let errMsg = `上传失败 (${xhr.status})`;
                        try {
                            const errData = JSON.parse(xhr.responseText);
                            errMsg = errData.message || errData.error || errMsg;
                        } catch (e) { /* 忽略 */ }
                        reject(new Error(errMsg));
                    }
                };
                xhr.onerror = () => reject(new Error('网络错误，上传失败'));
                xhr.send(formData);
            });
        },
    };

    /* ============ Toast 提示 ============ */
    function showToast(message, type = 'info', duration = CONFIG.toastDuration) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        const iconMap = { success: '✓', error: '✕', warning: '!', info: 'i' };
        toast.innerHTML = `
            <span class="toast-icon">${iconMap[type] || 'i'}</span>
            <span class="toast-message"></span>
            <button class="toast-close">×</button>
        `;
        toast.querySelector('.toast-message').textContent = message;
        dom.toastContainer.appendChild(toast);

        const removeToast = () => {
            toast.classList.add('toast-out');
            setTimeout(() => toast.remove(), 250);
        };

        toast.querySelector('.toast-close').addEventListener('click', removeToast);
        if (duration > 0) {
            setTimeout(removeToast, duration);
        }
    }

    /* ============ 加载遮罩 ============ */
    function showLoading(text = '加载中...') {
        dom.loadingOverlay.style.display = 'flex';
        const p = dom.loadingOverlay.querySelector('p');
        if (p) p.textContent = text;
        state.loading = true;
    }

    function hideLoading() {
        dom.loadingOverlay.style.display = 'none';
        state.loading = false;
    }

    /* ============ API 状态指示 ============ */
    function setApiStatus(status, text) {
        dom.apiStatus.className = `status-indicator ${status}`;
        dom.apiStatus.querySelector('.status-text').textContent = text;
    }

    /* ============ 确认弹窗 ============ */
    function confirmDialog(title, message) {
        return new Promise((resolve) => {
            dom.confirmTitle.textContent = title;
            dom.confirmMessage.textContent = message;
            dom.confirmModal.style.display = 'flex';

            const cleanup = () => {
                dom.confirmModal.style.display = 'none';
                dom.confirmOkBtn.removeEventListener('click', onOk);
                dom.confirmCancelBtn.removeEventListener('click', onCancel);
            };
            const onOk = () => { cleanup(); resolve(true); };
            const onCancel = () => { cleanup(); resolve(false); };
            dom.confirmOkBtn.addEventListener('click', onOk);
            dom.confirmCancelBtn.addEventListener('click', onCancel);
        });
    }

    /* ============ 工具函数 ============ */
    function escapeHtml(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function debounce(fn, delay) {
        let timer = null;
        return function (...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        };
    }

    function getRowId(row) {
        // 优先用 id 字段，其次 row._id，最后用数组索引
        if (row.id !== undefined && row.id !== null && row.id !== '') return String(row.id);
        if (row._id !== undefined) return String(row._id);
        return null;
    }

    function getRowInternalKey(row, index) {
        // 优先使用 _tempId（新增行）
        if (row._tempId) return row._tempId;
        const id = getRowId(row);
        return id !== null ? id : `idx_${index}`;
    }

    function formatCellValue(value, column) {
        if (value === null || value === undefined || value === '') return '';
        if (column && column.type === 'date' && value) {
            // 尝试格式化日期
            const d = new Date(value);
            if (!isNaN(d.getTime())) {
                return d.toISOString().split('T')[0];
            }
        }
        if (column && column.type === 'number') {
            return value;
        }
        return String(value);
    }

    function getColumnByName(name) {
        return state.columns.find(c => c.name === name);
    }

    function getTotalPages() {
        return Math.max(1, Math.ceil(state.displayData.length / state.pageSize));
    }

    function getPagedData() {
        const start = (state.currentPage - 1) * state.pageSize;
        const end = start + state.pageSize;
        return state.displayData.slice(start, end);
    }

    /* ============ 标签页切换 ============ */
    function switchTable(tableName, tableLabel) {
        if (state.loading) return;
        // 如果有未保存修改，提示
        if (state.pendingChanges.size > 0) {
            if (!window.confirm('当前有未保存的修改，切换标签页将丢失修改，确定继续吗？')) {
                return;
            }
        }

        state.currentTable = tableName;
        state.currentTableName = tableLabel;
        state.currentPage = 1;
        state.searchKeyword = '';
        state.editing = null;
        state.newRowIds.clear();
        state.modifiedRows.clear();
        state.pendingChanges.clear();
        state.validationErrors = [];
        state.rowStatus.clear();

        // 更新UI
        dom.currentTableTitle.textContent = tableLabel;
        dom.searchInput.value = '';
        dom.searchClear.style.display = 'none';
        dom.importTableName.textContent = tableLabel;

        // 更新激活标签
        document.querySelectorAll('.tab-item').forEach(item => {
            item.classList.toggle('active', item.dataset.table === tableName);
        });

        // 清空校验面板
        renderValidationResults();

        // 清空列筛选
        state.columnFilters = {};

        // 加载数据
        loadTableData();
    }

    /* ============ 加载列定义和数据 ============ */
    async function loadTableData() {
        showLoading('加载列定义...');
        try {
            await loadColumns(state.currentTable);
            setApiStatus('online', 'API 已连接');
        } catch (err) {
            setApiStatus('offline', 'API 连接失败');
            // 列定义加载失败时使用默认列
            state.columns = getDefaultColumns(state.currentTable);
            showToast('列定义加载失败，使用默认列: ' + err.message, 'warning');
        }

        showLoading('加载数据...');
        try {
            await loadData(state.currentTable);
            setApiStatus('online', 'API 已连接');
        } catch (err) {
            setApiStatus('offline', '数据加载失败');
            state.rawData = [];
            state.displayData = [];
            state.totalRecords = 0;
            renderTable();
            renderPagination();
            updateRecordCount();
            showToast('数据加载失败: ' + err.message, 'error');
        } finally {
            hideLoading();
        }
    }

    async function loadColumns(tableName) {
        const result = await api.get(`${CONFIG.apiBase}/columns/${tableName}`);
        // 兼容多种返回格式
        let columns = result;
        let dropdowns = {};
        if (result && Array.isArray(result.columns)) columns = result.columns;
        else if (result && Array.isArray(result.data)) columns = result.data;
        else if (result && result.data && Array.isArray(result.data.columns)) columns = result.data.columns;
        else if (result && Array.isArray(result.fields)) columns = result.fields;

        if (result && result.dropdowns) dropdowns = result.dropdowns;

        if (!Array.isArray(columns) || columns.length === 0) {
            columns = getDefaultColumns(tableName);
        }
        // 规范化列定义
        state.columns = columns.map(col => {
            const normalized = normalizeColumn(col);
            // 合并下拉选项
            const key = col.key || col.name || col.field;
            if (key && dropdowns[key] && dropdowns[key].options) {
                normalized.options = dropdowns[key].options;
            }
            return normalized;
        });
    }

    function normalizeColumn(col) {
        const hidden = !!(col.hidden || col.is_hidden);
        return {
            name: col.name || col.field || col.key || col.prop || '',
            label: col.label || col.title || col.name_cn || col.name || col.field || '',
            type: (col.type || col.dataType || 'text').replace('integer', 'number'),
            required: !!(col.required || col.notNull),
            editable: col.editable !== false && !col.primary_key,
            options: col.options || col.choices || col.enum || null,
            width: col.width || null,
            format: col.format || null,
            description: col.description || col.comment || col.name_cn || '',
            hidden: hidden,
            editableSeq: !!col.editable_seq,
        };
    }

    /**
     * 获取可见字段列表（过滤掉 hidden 字段）
     * 用于渲染表头和单元格，但 state.columns 仍保留全部字段（含 hidden）供内部使用
     */
    function getVisibleFields() {
        return state.columns.filter(c => !c.hidden);
    }

    async function loadData(tableName) {
        // 一次性加载全部数据（per_page=10000），由前端客户端分页处理
        // 修复：之前不传 per_page，后端默认只返回 20 条，导致看不到后面的数据
        const result = await api.get(`${CONFIG.apiBase}/${tableName}?per_page=10000&page=1`);
        let data = [];
        let total = 0;

        if (Array.isArray(result)) {
            data = result;
            total = result.length;
        } else if (result && Array.isArray(result.data)) {
            data = result.data;
            total = result.total !== undefined ? result.total : data.length;
        } else if (result && result.data && Array.isArray(result.data.items)) {
            data = result.data.items;
            total = result.data.total || data.length;
        } else if (result && Array.isArray(result.items)) {
            data = result.items;
            total = result.total || data.length;
        }

        state.rawData = data;
        state.totalRecords = total;
        applySearchFilter();
    }

    /* ============ 默认列定义(兜底) ============ */
    function getDefaultColumns(tableName) {
        const commonCols = [
            { name: 'id', label: 'ID', type: 'number', editable: false, required: false, hidden: true },
            { name: 'seq_no', label: '序号', type: 'integer', required: true, editable_seq: true },
            { name: 'project_name', label: '项目名称', type: 'text', required: true },
            { name: 'project_no', label: '项目编号', type: 'text', required: true },
            { name: 'remark', label: '备注', type: 'text', required: false },
        ];
        return commonCols;
    }

    /* ============ 搜索过滤 ============ */
    function applySearchFilter() {
        const keyword = state.searchKeyword.trim().toLowerCase();

        // 分离出新增的未保存行（始终显示，不受筛选影响）
        const newRows = state.rawData.filter(r => r._tempId && state.newRowIds.has(r._tempId));
        const existingRows = state.rawData.filter(r => !(r._tempId && state.newRowIds.has(r._tempId)));

        const filteredRows = existingRows.filter(row => {
            // 1. 全局搜索
            if (keyword) {
                const matchGlobal = state.columns.some(col => {
                    const val = row[col.name];
                    if (val === null || val === undefined) return false;
                    return String(val).toLowerCase().includes(keyword);
                });
                if (!matchGlobal) return false;
            }

            // 2. 列筛选（多列AND，同列多值OR）
            for (const [fieldName, filter] of Object.entries(state.columnFilters)) {
                if (!filter) continue;
                const val = row[fieldName];
                const valStr = (val === null || val === undefined) ? '' : String(val).trim();

                if (filter.matchMode === 'empty') {
                    if (valStr !== '') return false;
                } else if (filter.matchMode === 'notEmpty') {
                    if (valStr === '') return false;
                } else {
                    // contains 或 exact 模式
                    const filterVal = String(filter.value || '').toLowerCase();
                    const selectedValues = filter.selectedValues || [];

                    let matched = false;

                    // 检查选中的checkbox值（OR逻辑）
                    if (selectedValues.length > 0) {
                        for (const sv of selectedValues) {
                            if (sv === '(空)') {
                                if (valStr === '') { matched = true; break; }
                            } else if (filter.matchMode === 'exact') {
                                if (valStr.toLowerCase() === sv.toLowerCase()) { matched = true; break; }
                            } else {
                                if (valStr.toLowerCase().includes(sv.toLowerCase())) { matched = true; break; }
                            }
                        }
                    }

                    // 如果有文本输入但没有选中值，用文本筛选
                    if (selectedValues.length === 0 && filterVal) {
                        if (filter.matchMode === 'exact') {
                            if (valStr.toLowerCase() === filterVal) matched = true;
                        } else {
                            if (valStr.toLowerCase().includes(filterVal)) matched = true;
                        }
                    }

                    // 如果有文本也有选中值，文本也参与（OR扩展）
                    if (selectedValues.length > 0 && filterVal) {
                        if (filter.matchMode === 'exact') {
                            if (valStr.toLowerCase() === filterVal) matched = true;
                        } else {
                            if (valStr.toLowerCase().includes(filterVal)) matched = true;
                        }
                    }

                    // 如果设置了筛选条件但没有匹配，排除
                    if (filterVal || selectedValues.length > 0) {
                        if (!matched) return false;
                    }
                }
            }

            return true;
        });

        // 合并：筛选后的已有数据 + 新增行（始终显示在末尾）
        state.displayData = [...filteredRows, ...newRows];

        // 调整当前页
        const totalPages = getTotalPages();
        if (state.currentPage > totalPages) state.currentPage = totalPages;
        renderTable();
        renderPagination();
        updateRecordCount();
    }

    const debouncedSearch = debounce(() => {
        applySearchFilter();
    }, CONFIG.debounceSearchMs);

    function handleSearch() {
        state.searchKeyword = dom.searchInput.value;
        dom.searchClear.style.display = state.searchKeyword ? 'block' : 'none';
        debouncedSearch();
    }

    /* ============ 渲染表格 ============ */
    function renderTable() {
        renderTableHead();
        renderTableBody();
    }

    function renderTableHead() {
        const visibleFields = getVisibleFields();
        let html = '';
        html += '<tr>';
        html += '<th class="col-actions">操作</th>';
        html += '<th class="col-idx">#</th>';
        visibleFields.forEach(col => {
            const requiredClass = col.required ? ' required' : '';
            const widthStyle = col.width ? ` style="min-width:${col.width}px"` : '';
            const cf = state.columnFilters[col.name];
            const hasFilter = cf && (cf.value || (cf.selectedValues && cf.selectedValues.length > 0));
            const filterActive = hasFilter ? ' filter-active' : '';
            const filterBadge = hasFilter && cf.selectedValues && cf.selectedValues.length > 1
                ? `<span class="th-filter-badge">${cf.selectedValues.length}</span>` : '';
            html += `<th class="col-${escapeHtml(col.name)}${requiredClass}${filterActive}"${widthStyle} data-field="${escapeHtml(col.name)}">`;
            html += `<div class="th-content">`;
            html += `<span class="th-label">${escapeHtml(col.label)}</span>`;
            html += `<span class="th-filter-icon" data-field="${escapeHtml(col.name)}" title="筛选">${hasFilter ? '▼' : ' filt'}</span>`;
            html += filterBadge;
            html += `</div>`;
            html += `</th>`;
        });
        html += '</tr>';
        dom.tableHead.innerHTML = html;
    }

    function renderTableBody() {
        const visibleFields = getVisibleFields();
        const pagedData = getPagedData();
        if (pagedData.length === 0 && !state.loading) {
            const msg = state.searchKeyword ? '没有匹配的记录' : '暂无数据，点击"新增"添加记录';
            dom.tableBody.innerHTML = `<tr class="empty-row"><td colspan="${visibleFields.length + 2}" class="empty-cell">${escapeHtml(msg)}</td></tr>`;
            return;
        }

        let html = '';
        const startIndex = (state.currentPage - 1) * state.pageSize;
        pagedData.forEach((row, i) => {
            const rowKey = getRowInternalKey(row, startIndex + i);
            const isNew = state.newRowIds.has(rowKey);
            const isModified = state.modifiedRows.has(rowKey);
            const rowErrors = state.validationErrors.filter(e => e.rowKey === rowKey && e.type === 'error');
            const rowWarnings = state.validationErrors.filter(e => e.rowKey === rowKey && e.type === 'warning');
            const hasError = rowErrors.length > 0;
            const hasWarning = rowWarnings.length > 0;

            let rowClass = '';
            if (isNew) rowClass = 'row-new';
            else if (hasError) rowClass = 'row-error';
            else if (hasWarning) rowClass = 'row-warning';
            else if (isModified) rowClass = 'row-modified';

            html += `<tr class="${rowClass}" data-row-key="${escapeHtml(rowKey)}" data-row-index="${startIndex + i}">`;

            // 操作列
            html += '<td class="cell-actions">';
            if (isNew || isModified || state.pendingChanges.has(rowKey)) {
                html += `<button class="btn btn-save" data-action="save" data-row-key="${escapeHtml(rowKey)}">保存</button>`;
                html += `<button class="btn btn-cancel-row" data-action="cancel" data-row-key="${escapeHtml(rowKey)}">取消</button>`;
                // 新增未保存的行也可以直接删除
                if (isNew) {
                    html += `<button class="btn btn-delete" data-action="delete" data-row-key="${escapeHtml(rowKey)}" title="删除此新增行">删除</button>`;
                }
            } else {
                // 根据权限控制删除按钮
                if (canDeleteRecord(row)) {
                    html += `<button class="btn btn-delete" data-action="delete" data-row-key="${escapeHtml(rowKey)}">删除</button>`;
                } else {
                    html += `<span style="color:#9ca3af;font-size:12px;" title="此记录由 ${escapeHtml(row.created_by || '未知')} 创建，您无权删除">—</span>`;
                }
            }
            html += '</td>';

            // 序号列
            html += `<td class="cell-idx">${startIndex + i + 1}</td>`;

            // 数据列（只渲染可见字段）
            const editable = canEditRecord(row);
            const createdBy = row.created_by || '未知';
            visibleFields.forEach(col => {
                // 如果当前正在编辑此单元格
                if (state.editing && state.editing.rowKey === rowKey && state.editing.fieldName === col.name) {
                    html += `<td data-field="${escapeHtml(col.name)}">${renderEditControl(col, row, rowKey)}</td>`;
                } else {
                    const cellErrors = rowErrors.filter(e => e.fieldName === col.name);
                    const cellWarnings = rowWarnings.filter(e => e.fieldName === col.name);
                    let cellClass = 'cell';
                    if (cellErrors.length > 0) cellClass += ' cell-error';
                    else if (cellWarnings.length > 0) cellClass += ' cell-warning';
                    if (!editable) cellClass += ' cell-readonly';

                    const displayValue = formatCellValue(row[col.name], col);
                    // "待更新"标记样式
                    if (displayValue === '待更新') cellClass += ' cell-pending-update';
                    const isEmpty = displayValue === '' || displayValue === null || displayValue === undefined;
                    const displayHtml = isEmpty
                        ? '<span class="cell-empty">—</span>'
                        : escapeHtml(displayValue);

                    // 只读单元格不响应点击编辑
                    if (editable) {
                        html += `<td data-field="${escapeHtml(col.name)}"><div class="${cellClass}" data-action="edit" data-row-key="${escapeHtml(rowKey)}" data-field-name="${escapeHtml(col.name)}">${displayHtml}</div></td>`;
                    } else {
                        html += `<td data-field="${escapeHtml(col.name)}"><div class="${cellClass}" title="此记录由 ${escapeHtml(createdBy)} 创建，您无权编辑">${displayHtml}</div></td>`;
                    }
                }
            });

            html += '</tr>';
        });
        dom.tableBody.innerHTML = html;
    }

    function renderEditControl(col, row, rowKey) {
        const currentValue = row[col.name] !== undefined ? row[col.name] : '';
        const val = formatCellValue(currentValue, col);
        const fieldName = escapeHtml(col.name);

        // 下拉选择
        if (col.options && Array.isArray(col.options) && col.options.length > 0) {
            let optionsHtml = '<option value="">请选择</option>';
            col.options.forEach(opt => {
                const optVal = typeof opt === 'object' ? (opt.value !== undefined ? opt.value : opt.id) : opt;
                const optLabel = typeof opt === 'object' ? (opt.label !== undefined ? opt.label : opt.name || optVal) : opt;
                const selected = String(val) === String(optVal) ? ' selected' : '';
                optionsHtml += `<option value="${escapeHtml(optVal)}"${selected}>${escapeHtml(optLabel)}</option>`;
            });
            return `<select class="cell-edit-select" data-field="${fieldName}" data-row-key="${escapeHtml(rowKey)}">${optionsHtml}</select>`;
        }

        // 日期
        if (col.type === 'date') {
            return `<input type="date" class="cell-edit-date" data-field="${fieldName}" data-row-key="${escapeHtml(rowKey)}" value="${escapeHtml(val)}">`;
        }

        // 数字
        if (col.type === 'number' || col.type === 'integer' || col.type === 'float' || col.type === 'decimal') {
            return `<input type="number" class="cell-edit-number" data-field="${fieldName}" data-row-key="${escapeHtml(rowKey)}" value="${escapeHtml(val)}" step="any">`;
        }

        // 文本
        return `<input type="text" class="cell-edit-input" data-field="${fieldName}" data-row-key="${escapeHtml(rowKey)}" value="${escapeHtml(val)}">`;
    }

    /* ============ 公式列自动计算 ============ */

    // 公式配置：各表的公式列及其输入字段
    const FORMULA_CONFIG = {
        projects: {
            // 输入字段 → 依赖的公式输出字段
            inputFields: ['current_stage', 'result_notice_time', 'latest_contract_sign_time',
                          'archive_receive_time', 'is_archived', 'recording_upload_time'],
            outputFields: ['archive_overdue_days', 'archive_days_from_sign', 'recording_upload_warning'],
            calc: calcProjects,
        },
        agency_fees: {
            inputFields: ['system_amount', 'receivable_total'],
            outputFields: ['system_receivable_diff'],
            calc: calcAgencyFees,
        },
        personnel: {
            inputFields: ['exam_time'],
            outputFields: ['cert_duration'],
            calc: calcPersonnel,
        },
        bid_deposits: {
            inputFields: ['contract_sign_time', 'is_collected', 'actual_return_date'],
            outputFields: ['latest_return_date', 'sign_to_return_duration'],
            calc: calcBidDeposits,
        },
        eval_rooms: {
            // eval_rooms: should_use_mobile_count = G(H+I+J) 同行计算
            // total_eval_count, es_booking_count, mobile_eval_count 需要跨表查询(通过API)
            inputFields: ['stat_scope', 'g_mobile_count', 'resource_lack_count', 'other_reason_count'],
            outputFields: ['total_eval_count', 'es_booking_count', 'mobile_eval_count', 'should_use_mobile_count'],
            calc: calcEvalRoomsLocal,  // 仅计算同行公式(G=H+I+J)，跨表部分异步处理
        },
    };

    // 记录每行中手动修改过的公式列（避免自动覆盖）
    // key: rowKey, value: Set of field names
    const manuallyModifiedFormulaFields = new Map();

    // ============ 自动保存基础设施 ============
    // debounce timers: rowKey -> setTimeout id
    const autoSaveTimers = new Map();
    // 正在保存中的行集合，防止自动保存与手动保存冲突
    const savingRows = new Set();
    // 自动保存重试计数: rowKey -> retry count
    const autoSaveRetryCount = new Map();
    const AUTO_SAVE_DELAY = 800;       // debounce 延迟 ms
    const AUTO_SAVE_MAX_RETRY = 2;     // 最大重试次数

    function parseDateJS(val) {
        if (val === null || val === undefined || val === '') return null;
        const s = String(val).trim();
        if (s === '' || s === '/' || s === '未反馈' || s === '未发布通知书' ||
            s === '未归档' || s === '纸质合同尚未签署' || s === '尚未退款' || s === '待定') return null;
        // 尝试 YYYY-MM-DD 或 YYYY/MM/DD
        const m = s.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
        if (m) return new Date(parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3]));
        const d = new Date(s);
        return isNaN(d.getTime()) ? null : d;
    }

    function parseNumJS(val) {
        if (val === null || val === undefined || val === '') return null;
        const n = Number(val);
        return isNaN(n) ? null : n;
    }

    function dateDiffDaysJS(d1, d2) {
        if (!d1 || !d2) return null;
        return Math.round((d1 - d2) / (1000 * 60 * 60 * 24));
    }

    function fmtDateJS(d) {
        if (!d) return '';
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }

    function todayStrJS() {
        return fmtDateJS(new Date());
    }

    // === 项目台账公式 ===
    function calcProjects(row) {
        const result = {};
        const stage = String(row.current_stage || '').trim();
        const ad = String(row.result_notice_time || '').trim();
        const ae = String(row.latest_contract_sign_time || '').trim();
        const ag = String(row.archive_receive_time || '').trim();
        const ao = String(row.recording_upload_time || '').trim();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // archive_overdue_days
        try {
            if (stage === '项目取消') {
                result.archive_overdue_days = '项目取消';
            } else {
                const adEmpty = (ad === '' || ad === '未发布通知书');
                const aeEmpty = (ae === '' || ae === '未反馈');
                const agEmpty = (ag === '' || ag === '未归档');
                const adDate = parseDateJS(ad);
                const aeDate = parseDateJS(ae);
                const agDate = parseDateJS(ag);

                if (adEmpty || !adDate) {
                    result.archive_overdue_days = aeEmpty ? '未签署合同' : '注意更新采购结果出具时间';
                } else {
                    if (agEmpty || !agDate) {
                        result.archive_overdue_days = aeDate ? dateDiffDaysJS(today, aeDate) - 60 : '根据项目情况自行修改确认是否需归档';
                    } else {
                        result.archive_overdue_days = aeDate ? dateDiffDaysJS(agDate, aeDate) - 60 : '根据项目情况自行修改确认是否需归档';
                    }
                }
            }
        } catch (e) { result.archive_overdue_days = '根据项目情况自行修改确认是否需归档'; }

        // archive_days_from_sign
        try {
            if (stage === '项目取消') {
                result.archive_days_from_sign = '项目取消';
            } else {
                const adDate = parseDateJS(ad);
                const aeDate = parseDateJS(ae);
                const agDate = parseDateJS(ag);

                if (ad === '未发布通知书' || !adDate) {
                    const aeEmpty = (ae === '' || ae === '未反馈');
                    result.archive_days_from_sign = aeEmpty ? '未签署合同' : '填写有误或公式计算错误，请手动修改';
                } else {
                    const agEmpty = (ag === '' || ag === '未归档');
                    if (agEmpty || !agDate) {
                        result.archive_days_from_sign = aeDate ? dateDiffDaysJS(today, aeDate) : '根据项目情况自行手动修改确认是否需归档';
                    } else {
                        result.archive_days_from_sign = aeDate ? dateDiffDaysJS(agDate, aeDate) : '根据项目情况自行手动修改确认是否需归档';
                    }
                }
            }
        } catch (e) { result.archive_days_from_sign = '根据项目情况自行手动修改确认是否需归档'; }

        // recording_upload_warning
        try {
            const adDate = parseDateJS(ad);
            if (ao === '待定') {
                result.recording_upload_warning = adDate ? dateDiffDaysJS(today, adDate) : '';
            } else {
                const aoDate = parseDateJS(ao);
                result.recording_upload_warning = (aoDate && adDate) ? dateDiffDaysJS(aoDate, adDate) : '';
            }
        } catch (e) { result.recording_upload_warning = ''; }

        return result;
    }

    // === 代理费台账公式 ===
    function calcAgencyFees(row) {
        const sys = parseNumJS(row.system_amount);
        const recv = parseNumJS(row.receivable_total);
        return { system_receivable_diff: (sys !== null && recv !== null) ? Math.round((sys - recv) * 100) / 100 : '' };
    }

    // === 代理人员公式 ===
    function calcPersonnel(row) {
        const examDate = parseDateJS(row.exam_time);
        if (!examDate) return { cert_duration: '' };
        const today = new Date(); today.setHours(0, 0, 0, 0);
        return { cert_duration: dateDiffDaysJS(today, examDate) };
    }

    // === 投标保证金公式 ===
    function calcBidDeposits(row) {
        const result = {};
        const q = String(row.contract_sign_time || '').trim();
        const s = String(row.is_collected || '').trim();
        const ad = String(row.actual_return_date || '').trim();
        const qDate = parseDateJS(q);

        // latest_return_date = Q + 5
        if (qDate) {
            const d = new Date(qDate);
            d.setDate(d.getDate() + 5);
            result.latest_return_date = fmtDateJS(d);
        } else {
            result.latest_return_date = '';
        }

        // sign_to_return_duration
        try {
            if (q === '/' || q === '') {
                result.sign_to_return_duration = '纸质合同签署时间列填写有误';
            } else if (s === '待定') {
                result.sign_to_return_duration = '待定';
            } else if (s === '否') {
                result.sign_to_return_duration = '不收取保证金';
            } else if (q === '纸质合同尚未签署') {
                result.sign_to_return_duration = '无合同签署时间';
            } else if (!qDate) {
                result.sign_to_return_duration = '纸质合同签署时间列填写有误';
            } else {
                const adEmpty = (ad === '' || ad === '尚未退款');
                const adDate = parseDateJS(ad);
                if (adEmpty || !adDate) {
                    result.sign_to_return_duration = '尚未退款';
                } else {
                    result.sign_to_return_duration = dateDiffDaysJS(adDate, qDate);
                }
            }
        } catch (e) {
            result.sign_to_return_duration = '是否收取保证金列或实际退款/保函退还日期列填写有误';
        }

        return result;
    }

    // === 电子评标室公式（同行部分） ===
    function calcEvalRoomsLocal(row) {
        const result = {};
        // should_use_mobile_count (G) = H + I + J
        const toInt = (v) => {
            if (v === null || v === undefined || v === '') return 0;
            const n = parseInt(v);
            return isNaN(n) ? 0 : n;
        };
        const h = toInt(row.g_mobile_count);
        const i = toInt(row.resource_lack_count);
        const j = toInt(row.other_reason_count);
        result.should_use_mobile_count = h + i + j;
        // 跨表部分不在此处计算（需要后端API）
        return result;
    }

    /**
     * 异步计算 eval_rooms 跨表公式（通过后端API查询 projects 表）
     */
    async function recalcEvalRoomsCrossTable(rowKey) {
        const rowIndex = findRowIndexByKey(rowKey);
        if (rowIndex === -1) return;
        const row = state.rawData[rowIndex];
        const statScope = String(row.stat_scope || '').trim();
        if (!statScope) return;

        const manualSet = manuallyModifiedFormulaFields.get(rowKey) || new Set();
        const crossFields = ['total_eval_count', 'es_booking_count', 'mobile_eval_count'];
        // 如果所有跨表字段都被手动修改了，不需要查询
        if (crossFields.every(f => manualSet.has(f))) return;

        try {
            const token = localStorage.getItem('authToken');
            const resp = await fetch(`${CONFIG.apiBase}/eval_rooms/calc`, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    stat_scope: statScope,
                    g_mobile_count: row.g_mobile_count || 0,
                    resource_lack_count: row.resource_lack_count || 0,
                    other_reason_count: row.other_reason_count || 0,
                }),
            });
            const data = await resp.json();
            if (data.success) {
                let changed = false;
                const updates = {
                    total_eval_count: data.total_eval_count,
                    es_booking_count: data.es_booking_count,
                    mobile_eval_count: data.mobile_eval_count,
                };
                for (const [fkey, fval] of Object.entries(updates)) {
                    if (manualSet.has(fkey)) continue;
                    const oldValue = row[fkey];
                    if (String(oldValue ?? '') !== String(fval ?? '')) {
                        row[fkey] = fval;
                        if (!state.modifiedRows.has(rowKey)) {
                            state.modifiedRows.set(rowKey, new Set());
                        }
                        state.modifiedRows.get(rowKey).add(fkey);
                        if (!state.pendingChanges.has(rowKey)) {
                            state.pendingChanges.set(rowKey, {});
                        }
                        state.pendingChanges.get(rowKey)[fkey] = fval;
                        changed = true;
                    }
                }
                if (changed) {
                    renderTableBody();
                }
            }
        } catch (e) {
            console.error('eval_rooms cross-table calc error:', e);
        }
    }

    /**
     * 当某个输入字段被修改后，自动重新计算依赖的公式列。
     * 只更新未被用户手动修改过的公式列。
     */
    function recalcFormulaFields(rowKey, editedFieldName) {
        const config = FORMULA_CONFIG[state.currentTable];
        if (!config) return;

        // 检查编辑的字段是否是公式输入字段
        if (!config.inputFields.includes(editedFieldName)) {
            // 如果编辑的是公式输出字段本身，标记为手动修改
            if (config.outputFields.includes(editedFieldName)) {
                if (!manuallyModifiedFormulaFields.has(rowKey)) {
                    manuallyModifiedFormulaFields.set(rowKey, new Set());
                }
                manuallyModifiedFormulaFields.get(rowKey).add(editedFieldName);
            }
            return;
        }

        // 获取行数据
        const rowIndex = findRowIndexByKey(rowKey);
        if (rowIndex === -1) return;
        const row = state.rawData[rowIndex];

        // 计算公式
        const calcValues = config.calc(row);
        const manualSet = manuallyModifiedFormulaFields.get(rowKey) || new Set();

        let changed = false;
        for (const [fkey, fval] of Object.entries(calcValues)) {
            // 跳过用户手动修改过的字段
            if (manualSet.has(fkey)) continue;

            const oldValue = row[fkey];
            if (String(oldValue ?? '') !== String(fval ?? '')) {
                row[fkey] = fval;
                // 记录修改
                if (!state.modifiedRows.has(rowKey)) {
                    state.modifiedRows.set(rowKey, new Set());
                }
                state.modifiedRows.get(rowKey).add(fkey);
                if (!state.pendingChanges.has(rowKey)) {
                    state.pendingChanges.set(rowKey, {});
                }
                state.pendingChanges.get(rowKey)[fkey] = fval;
                changed = true;
            }
        }

        // eval_rooms 跨表公式异步计算
        if (state.currentTable === 'eval_rooms' && editedFieldName === 'stat_scope') {
            recalcEvalRoomsCrossTable(rowKey);
        }

        return changed;
    }

    /* ============ 行内编辑 ============ */
    function startEdit(rowKey, fieldName) {
        // 切换编辑单元格前，先保存当前正在编辑的值到 state（不渲染）
        // 避免 renderTableBody 销毁含用户输入的 input 导致数据丢失
        if (state.editing) {
            const { rowKey: prevRowKey, fieldName: prevFieldName } = state.editing;
            // 点击的就是当前正在编辑的单元格，无需操作
            if (prevRowKey === rowKey && prevFieldName === fieldName) return;
            // 先把上一个编辑单元格 DOM 中的值保存到 state
            commitEditValue(prevRowKey, prevFieldName);
        }
        const col = getColumnByName(fieldName);
        if (!col || !col.editable) return;

        // 找到行数据
        const rowIndex = findRowIndexByKey(rowKey);
        if (rowIndex === -1) return;
        const row = state.rawData[rowIndex];
        // 编辑权限检查
        if (!canEditRecord(row)) {
            const createdBy = row.created_by || '未知';
            showToast(`此记录由 ${createdBy} 创建，您无权编辑`, 'warning');
            return;
        }
        state.editing = {
            rowKey,
            fieldName,
            originalValue: row ? row[fieldName] : '',
        };
        renderTableBody();

        // 自动聚焦
        setTimeout(() => {
            const input = dom.tableBody.querySelector(
                `[data-field="${CSS.escape(fieldName)}"][data-row-key="${CSS.escape(rowKey)}"]`
            );
            if (input) {
                input.focus();
                if (input.select) input.select();
            }
        }, 0);
    }

    // 仅将编辑控件中的值保存到 state（不触发渲染），供 startEdit 切换单元格时调用
    function commitEditValue(rowKey, fieldName) {
        const input = dom.tableBody.querySelector(
            `[data-field="${CSS.escape(fieldName)}"][data-row-key="${CSS.escape(rowKey)}"]`
        );
        if (!input) {
            // input 已被渲染销毁，无法获取值，仅清理 editing 状态
            state.editing = null;
            return;
        }

        const newValue = input.value;
        const col = getColumnByName(fieldName);
        if (!col) {
            state.editing = null;
            return;
        }

        // 类型转换
        let typedValue = newValue;
        if (col.type === 'number' || col.type === 'integer' || col.type === 'float' || col.type === 'decimal') {
            typedValue = newValue === '' ? '' : Number(newValue);
            if (newValue !== '' && isNaN(typedValue)) typedValue = newValue;
        }

        // 找到行数据
        const rowIndex = findRowIndexByKey(rowKey);
        if (rowIndex === -1) {
            state.editing = null;
            return;
        }
        const row = state.rawData[rowIndex];
        const oldValue = row[fieldName];

        state.editing = null;

        // 值有变化才记录
        if (String(oldValue ?? '') !== String(typedValue ?? '')) {
            row[fieldName] = typedValue;
            // 记录修改
            if (!state.modifiedRows.has(rowKey)) {
                state.modifiedRows.set(rowKey, new Set());
            }
            state.modifiedRows.get(rowKey).add(fieldName);

            // 记录待保存
            if (!state.pendingChanges.has(rowKey)) {
                state.pendingChanges.set(rowKey, {});
            }
            state.pendingChanges.get(rowKey)[fieldName] = typedValue;

            // 清除该字段的校验错误
            state.validationErrors = state.validationErrors.filter(
                e => !(e.rowKey === rowKey && e.fieldName === fieldName)
            );

            // 自动重新计算公式列
            recalcFormulaFields(rowKey, fieldName);

            // 触发自动保存（debounce，不阻塞用户操作）
            autoSaveRow(rowKey);
        }
    }

    function confirmEdit(rowKey, fieldName) {
        commitEditValue(rowKey, fieldName);
        renderTableBody();
        renderValidationResults();
    }

    function cancelEdit(rowKey, fieldName) {
        state.editing = null;
        renderTableBody();
    }

    function findRowIndexByKey(rowKey) {
        // 临时行
        if (rowKey.startsWith(CONFIG.tempIdPrefix)) {
            return state.rawData.findIndex(r => getRowInternalKey(r, -1) === rowKey);
        }
        // 普通行: rowKey 可能是 id 或 idx_N
        for (let i = 0; i < state.rawData.length; i++) {
            if (getRowInternalKey(state.rawData[i], i) === rowKey) return i;
        }
        return -1;
    }

    /* ============ 新增行 ============ */
    function addNewRow() {
        const tempId = CONFIG.tempIdPrefix + Date.now();
        const newRow = {};
        state.columns.forEach(col => {
            if (col.type === 'number' || col.type === 'integer' || col.type === 'float' || col.type === 'decimal') {
                newRow[col.name] = '';
            } else {
                newRow[col.name] = '';
            }
        });
        newRow._tempId = tempId;

        // 添加到原始数据末尾
        state.rawData.push(newRow);
        state.newRowIds.add(tempId);

        // 重新过滤并跳到最后一页
        applySearchFilter();
        const totalPages = getTotalPages();
        state.currentPage = totalPages;
        renderTable();
        renderPagination();
        updateRecordCount();

        // 滚动到底部
        setTimeout(() => {
            const scroll = document.querySelector('.table-scroll');
            if (scroll) scroll.scrollTop = scroll.scrollHeight;
            // 自动进入第一个可编辑字段编辑
            const firstEditableCol = getVisibleFields().find(c => c.editable);
            if (firstEditableCol) {
                startEdit(tempId, firstEditableCol.name);
            }
        }, 50);

        showToast('已添加新行，请填写数据后点击保存', 'info');
    }

    /* ============ 删除行 ============ */
    async function deleteRow(rowKey) {
        const rowIndex = findRowIndexByKey(rowKey);
        if (rowIndex === -1) return;

        const row = state.rawData[rowIndex];

        // 未保存的新增行（有 _tempId 或在 newRowIds 中），直接从前端删除，不需要调用后端 API
        if (row._tempId || state.newRowIds.has(rowKey)) {
            const confirmed = await confirmDialog('确认删除', '确定要删除这一行新增数据吗？');
            if (!confirmed) return;
            state.rawData.splice(rowIndex, 1);
            state.newRowIds.delete(rowKey);
            state.modifiedRows.delete(rowKey);
            state.pendingChanges.delete(rowKey);
            manuallyModifiedFormulaFields.delete(rowKey);
            state.validationErrors = state.validationErrors.filter(e => e.rowKey !== rowKey);
            applySearchFilter();
            renderTable();
            showToast('已删除新增行', 'success');
            return;
        }

        const confirmed = await confirmDialog('确认删除', '确定要删除这一行数据吗？此操作不可撤销。');
        if (!confirmed) return;

        // 已保存行: 调用后端删除
        try {
            showLoading('删除中...');
            const rowId = getRowId(row);
            await api.delete(`${CONFIG.apiBase}/${state.currentTable}/${encodeURIComponent(rowId)}`);
            state.rawData.splice(rowIndex, 1);
            state.modifiedRows.delete(rowKey);
            state.pendingChanges.delete(rowKey);
            state.validationErrors = state.validationErrors.filter(e => e.rowKey !== rowKey);
            applySearchFilter();
            showToast('删除成功', 'success');
        } catch (err) {
            showToast('删除失败: ' + err.message, 'error');
        } finally {
            hideLoading();
        }
    }

    /* ============ 自动保存 ============ */

    /**
     * debounce 触发自动保存（延迟 800ms，避免连续编辑频繁请求）
     */
    function autoSaveRow(rowKey) {
        // 手动保存正在进行，不触发自动保存
        if (savingRows.has(rowKey)) return;
        // 清除之前的 timer
        if (autoSaveTimers.has(rowKey)) {
            clearTimeout(autoSaveTimers.get(rowKey));
        }
        autoSaveTimers.set(rowKey, setTimeout(() => {
            autoSaveTimers.delete(rowKey);
            doAutoSave(rowKey);
        }, AUTO_SAVE_DELAY));
    }

    /**
     * 取消某行的自动保存 timer（手动保存前调用）
     */
    function cancelAutoSave(rowKey) {
        if (autoSaveTimers.has(rowKey)) {
            clearTimeout(autoSaveTimers.get(rowKey));
            autoSaveTimers.delete(rowKey);
        }
    }

    /**
     * 异步执行自动保存（后台执行，不阻塞用户操作）
     */
    async function doAutoSave(rowKey) {
        const rowIndex = findRowIndexByKey(rowKey);
        if (rowIndex === -1) return;
        const row = state.rawData[rowIndex];
        const pending = state.pendingChanges.get(rowKey) || {};

        // 没有变更则跳过
        if (Object.keys(pending).length === 0) return;

        // 权限检查
        if (!canEditRecord(row)) return;

        // 标记为保存中
        savingRows.add(rowKey);
        showAutoSaveIndicator('saving');

        const isNew = state.newRowIds.has(rowKey);
        const rowId = getRowId(row);
        const effectiveIsNew = isNew || !rowId;
        const dataToSave = effectiveIsNew ? { ...row } : { ...pending };
        delete dataToSave._tempId;

        try {
            let result;
            if (effectiveIsNew) {
                result = await api.post(`${CONFIG.apiBase}/${state.currentTable}`, dataToSave);
                if (result && result.id !== undefined) {
                    row.id = result.id;
                }
                state.newRowIds.delete(rowKey);
            } else {
                result = await api.put(
                    `${CONFIG.apiBase}/${state.currentTable}/${encodeURIComponent(rowId)}`,
                    dataToSave
                );
            }

            // 保存成功，清理状态
            state.modifiedRows.delete(rowKey);
            state.pendingChanges.delete(rowKey);
            manuallyModifiedFormulaFields.delete(rowKey);
            autoSaveRetryCount.delete(rowKey);
            showAutoSaveIndicator('saved');
        } catch (err) {
            // 401 等认证错误不重试
            if (err.status === 401) {
                showAutoSaveIndicator('error');
                return;
            }
            // 重试逻辑
            const retries = autoSaveRetryCount.get(rowKey) || 0;
            if (retries < AUTO_SAVE_MAX_RETRY) {
                autoSaveRetryCount.set(rowKey, retries + 1);
                showAutoSaveIndicator('saving');
                setTimeout(() => {
                    savingRows.delete(rowKey);
                    doAutoSave(rowKey);
                }, 1000 * (retries + 1));
                return;
            }
            // 超过重试次数，提示失败，保留 pending 供手动保存
            showAutoSaveIndicator('error');
            showToast('自动保存失败，请手动保存', 'warning', 3000);
            autoSaveRetryCount.delete(rowKey);
        } finally {
            savingRows.delete(rowKey);
        }
    }

    /**
     * 自动保存状态指示器（短暂显示）
     */
    let autoSaveIndicatorTimer = null;
    function showAutoSaveIndicator(status) {
        let el = document.getElementById('autoSaveIndicator');
        if (!el) {
            el = document.createElement('div');
            el.id = 'autoSaveIndicator';
            el.className = 'auto-save-indicator';
            document.body.appendChild(el);
        }
        const map = {
            saving: { text: '保存中...', cls: 'saving' },
            saved:  { text: '已保存', cls: 'saved' },
            error:  { text: '保存失败', cls: 'error' },
        };
        const cfg = map[status] || map.saved;
        el.textContent = cfg.text;
        el.className = `auto-save-indicator ${cfg.cls}`;
        el.style.display = 'block';

        if (autoSaveIndicatorTimer) clearTimeout(autoSaveIndicatorTimer);
        if (status !== 'saving') {
            autoSaveIndicatorTimer = setTimeout(() => {
                el.style.display = 'none';
            }, 2000);
        }
    }

    /**
     * 获取当前表的公式输出字段集合
     */
    function getFormulaOutputFields() {
        const config = FORMULA_CONFIG[state.currentTable];
        return config ? new Set(config.outputFields) : new Set();
    }

    /* ============ 保存行 ============ */
    async function saveRow(rowKey) {
        const rowIndex = findRowIndexByKey(rowKey);
        if (rowIndex === -1) return;
        const row = state.rawData[rowIndex];
        const isNew = state.newRowIds.has(rowKey);
        const pending = state.pendingChanges.get(rowKey) || {};

        // 取消该行的自动保存 timer，避免与手动保存冲突
        cancelAutoSave(rowKey);

        // 编辑权限检查（新增行不受此限制，canEditRecord 已对 _tempId 行放行）
        if (!canEditRecord(row)) {
            const createdBy = row.created_by || '未知';
            showToast(`此记录由 ${createdBy} 创建，您无权编辑`, 'warning');
            return;
        }

        // 合并修改到行数据
        const dataToSave = isNew ? { ...row } : { ...pending };

        // 手动保存预填充：空白非公式列自动填充"待更新"
        const formulaOutputFields = getFormulaOutputFields();
        const visibleFields = getVisibleFields();
        for (const col of visibleFields) {
            // 跳过主键、不可编辑、公式输出字段
            if (col.name === 'id' || !col.editable) continue;
            if (formulaOutputFields.has(col.name)) continue;
            // 空白单元格预填充
            const currentVal = dataToSave[col.name];
            if (currentVal === null || currentVal === undefined || currentVal === '') {
                dataToSave[col.name] = '待更新';
                // 同步到 state.rawData 以便 UI 显示
                row[col.name] = '待更新';
            }
        }

        // 清理临时字段
        delete dataToSave._tempId;

        // 如果不是新行但没有有效ID，当作新增处理
        const rowId = getRowId(row);
        const effectiveIsNew = isNew || !rowId;

        try {
            showLoading('保存中...');
            let result;
            if (effectiveIsNew) {
                // 新增: POST
                result = await api.post(`${CONFIG.apiBase}/${state.currentTable}`, dataToSave);
                // 更新行ID
                if (result && result.id !== undefined) {
                    row.id = result.id;
                }
                state.newRowIds.delete(rowKey);
            } else {
                // 更新: PUT
                result = await api.put(
                    `${CONFIG.apiBase}/${state.currentTable}/${encodeURIComponent(rowId)}`,
                    dataToSave
                );
            }

            // 清理状态
            state.modifiedRows.delete(rowKey);
            state.pendingChanges.delete(rowKey);
            manuallyModifiedFormulaFields.delete(rowKey);
            // 清除该行的校验错误
            state.validationErrors = state.validationErrors.filter(e => e.rowKey !== rowKey);

            renderTableBody();
            renderValidationResults();
            showToast(effectiveIsNew ? '新增成功' : '保存成功', 'success');
        } catch (err) {
            // 序号唯一性校验错误提示
            if (err.status === 400 && err.message && err.message.indexOf('序号') >= 0) {
                showToast('序号校验失败: ' + err.message, 'error', 5000);
            } else {
                showToast('保存失败: ' + err.message, 'error');
            }
        } finally {
            hideLoading();
        }
    }

    /* ============ 取消行修改 ============ */
    async function cancelRowChanges(rowKey) {
        const rowIndex = findRowIndexByKey(rowKey);
        if (rowIndex === -1) return;
        const row = state.rawData[rowIndex];

        // 取消自动保存 timer
        cancelAutoSave(rowKey);

        if (state.newRowIds.has(rowKey)) {
            // 取消新增行 = 删除
            const confirmed = await confirmDialog('取消新增', '确定要放弃此新增行吗？');
            if (!confirmed) return;
            state.rawData.splice(rowIndex, 1);
            state.newRowIds.delete(rowKey);
            state.pendingChanges.delete(rowKey);
            state.validationErrors = state.validationErrors.filter(e => e.rowKey !== rowKey);
            applySearchFilter();
            showToast('已取消新增', 'info');
        } else {
            // 取消修改: 重新加载数据
            state.modifiedRows.delete(rowKey);
            state.pendingChanges.delete(rowKey);
            try {
                showLoading('恢复数据...');
                await loadData(state.currentTable);
                showToast('已取消修改', 'info');
            } catch (err) {
                showToast('恢复失败: ' + err.message, 'error');
            } finally {
                hideLoading();
            }
        }
    }

    /* ============ 校验逻辑 ============ */
    async function validateTable() {
        showLoading('校验中...');
        state.validationErrors = [];

        // 1. 客户端基础校验
        clientSideValidate();

        // 2. 尝试服务端校验
        try {
            const result = await api.post(`${CONFIG.apiBase}/${state.currentTable}/validate`, { records: state.rawData });
            // 兼容多种返回格式
            let results = [];
            const topLevelCreatedBy = (result && result.created_by) || '';
            if (result && Array.isArray(result.results)) {
                results = result.results;
            } else if (result && Array.isArray(result.errors)) {
                results = result.errors.map(e => ({
                    valid: false,
                    errors: [e],
                    warnings: [],
                    created_by: (typeof e === 'object' && e.created_by) || topLevelCreatedBy,
                }));
            } else if (result && result.data && Array.isArray(result.data.results)) {
                results = result.data.results;
            }

            results.forEach((item, idx) => {
                if (!item) return;
                const row = state.rawData[idx];
                const rowKey = row ? getRowInternalKey(row, idx) : String(idx);
                const rowCreatedBy = (row && row.created_by) || (item.created_by) || '';
                // errors
                if (Array.isArray(item.errors)) {
                    item.errors.forEach(err => {
                        const isStr = typeof err === 'string';
                        const errCreatedBy = isStr ? rowCreatedBy : (err.created_by || rowCreatedBy);
                        state.validationErrors.push({
                            rowKey,
                            fieldName: isStr ? '' : (err.field || err.fieldName || err.column || ''),
                            message: isStr ? err : (err.message || err.msg || ''),
                            type: 'error',
                            createdBy: errCreatedBy || '',
                        });
                    });
                }
                // warnings
                if (Array.isArray(item.warnings)) {
                    item.warnings.forEach(warn => {
                        const isStr = typeof warn === 'string';
                        const warnCreatedBy = isStr ? rowCreatedBy : (warn.created_by || rowCreatedBy);
                        state.validationErrors.push({
                            rowKey,
                            fieldName: isStr ? '' : (warn.field || warn.fieldName || warn.column || ''),
                            message: isStr ? warn : (warn.message || warn.msg || ''),
                            type: 'warning',
                            createdBy: warnCreatedBy || '',
                        });
                    });
                }
            });
            setApiStatus('online', 'API 已连接');
        } catch (err) {
            // 服务端校验不可用时，仅使用客户端校验
            showToast('服务端校验不可用，仅使用本地校验', 'warning');
            setApiStatus('offline', '校验API不可用');
        }

        hideLoading();
        renderTableBody();
        renderValidationResults();

        const errorCount = state.validationErrors.filter(e => e.type === 'error').length;
        const warningCount = state.validationErrors.filter(e => e.type === 'warning').length;

        if (errorCount === 0 && warningCount === 0) {
            showToast('校验通过，未发现问题', 'success');
        } else {
            showToast(`校验完成: ${errorCount} 个错误, ${warningCount} 个警告`, warningCount > 0 ? 'warning' : 'error');
        }
    }

    function clientSideValidate() {
        // 客户端校验：仅检查必填字段是否为空（与后端 validator.py 保持一致）
        // 如需扩展其他校验（日期格式、数字、下拉选项等），在后端 VALIDATION_RULES 中开启
        state.rawData.forEach((row, index) => {
            const rowKey = getRowInternalKey(row, index);
            state.columns.forEach(col => {
                if (!col.editable || col.hidden) return;
                const value = row[col.name];
                const isEmpty = value === null || value === undefined || value === '';

                // 必填字段空值检查（error）
                if (col.required && isEmpty) {
                    state.validationErrors.push({
                        rowKey,
                        fieldName: col.name,
                        message: `必填字段「${col.label}」未填写`,
                        type: 'error',
                    });
                }
            });
        });
    }

    /* ============ 表头列筛选 ============ */
    let activeFilterDropdown = null;

    function toggleFilterDropdown(fieldName, anchorEl) {
        // 关闭已打开的下拉
        if (activeFilterDropdown) {
            const prevField = activeFilterDropdown._fieldName;
            activeFilterDropdown.remove();
            activeFilterDropdown = null;
            // 如果点击的是同一个字段，仅关闭
            if (prevField === fieldName) return;
        }

        // 获取该列的唯一值
        const col = state.columns.find(c => c.name === fieldName);
        if (!col) return;

        const uniqueValues = [...new Set(
            state.rawData.map(r => {
                const v = r[fieldName];
                return (v === null || v === undefined || v === '') ? '(空)' : String(v).trim();
            })
        )].sort().slice(0, 200); // 最多200个选项

        const currentFilter = state.columnFilters[fieldName] || { value: '', matchMode: 'contains', selectedValues: [] };

        // 创建下拉容器
        const dropdown = document.createElement('div');
        dropdown.className = 'filter-dropdown';
        dropdown._fieldName = fieldName;

        // 定位
        const rect = anchorEl.getBoundingClientRect();
        dropdown.style.position = 'fixed';
        dropdown.style.top = (rect.bottom + 2) + 'px';
        dropdown.style.left = rect.left + 'px';
        dropdown.style.zIndex = '9999';

        // 当前已选中的值集合
        const selectedSet = new Set(currentFilter.selectedValues || []);

        dropdown.innerHTML = `
            <div class="filter-dropdown-content">
                <div class="filter-row">
                    <input type="text" class="filter-text-input" placeholder="输入筛选文字（支持多选叠加）..." value="${escapeHtml(currentFilter.value === '(空)' ? '' : currentFilter.value)}" />
                </div>
                <div class="filter-row">
                    <select class="filter-mode-select">
                        <option value="contains" ${currentFilter.matchMode === 'contains' ? 'selected' : ''}>包含</option>
                        <option value="exact" ${currentFilter.matchMode === 'exact' ? 'selected' : ''}>等于</option>
                        <option value="notEmpty" ${currentFilter.matchMode === 'notEmpty' ? 'selected' : ''}>非空</option>
                        <option value="empty" ${currentFilter.matchMode === 'empty' ? 'selected' : ''}>空值</option>
                    </select>
                </div>
                ${uniqueValues.length > 0 && uniqueValues.length <= 200 ? `
                <div class="filter-values-header">
                    <label class="filter-select-all-item">
                        <input type="checkbox" class="filter-select-all" />
                        <span>全选/反选</span>
                    </label>
                    <span class="filter-selected-count">已选 0 项</span>
                </div>
                <div class="filter-values-list">
                    ${uniqueValues.map(v => `
                        <label class="filter-value-item" title="${escapeHtml(v)}">
                            <input type="checkbox" value="${escapeHtml(v)}" ${selectedSet.has(v) ? 'checked' : ''} />
                            <span>${escapeHtml(v).substring(0, 40)}</span>
                        </label>
                    `).join('')}
                </div>
                ` : ''}
                <div class="filter-actions">
                    <button class="btn btn-cancel filter-clear-btn">清除</button>
                    <button class="btn btn-primary filter-apply-btn">应用</button>
                </div>
            </div>
        `;

        document.body.appendChild(dropdown);
        activeFilterDropdown = dropdown;

        // 调整位置防止溢出
        const ddRect = dropdown.getBoundingClientRect();
        if (ddRect.right > window.innerWidth) {
            dropdown.style.left = (window.innerWidth - ddRect.width - 10) + 'px';
        }
        if (ddRect.bottom > window.innerHeight) {
            dropdown.style.top = (rect.top - ddRect.height - 2) + 'px';
        }

        // 事件绑定
        const textInput = dropdown.querySelector('.filter-text-input');
        const modeSelect = dropdown.querySelector('.filter-mode-select');
        const applyBtn = dropdown.querySelector('.filter-apply-btn');
        const clearBtn = dropdown.querySelector('.filter-clear-btn');
        const checkboxes = dropdown.querySelectorAll('.filter-value-item input[type="checkbox"]');
        const selectAllCb = dropdown.querySelector('.filter-select-all');
        const selectedCountEl = dropdown.querySelector('.filter-selected-count');

        // 更新已选计数
        function updateSelectedCount() {
            const checked = dropdown.querySelectorAll('.filter-value-item input[type="checkbox"]:checked');
            if (selectedCountEl) {
                selectedCountEl.textContent = `已选 ${checked.length} 项`;
            }
            if (selectAllCb) {
                selectAllCb.checked = checked.length === checkboxes.length && checkboxes.length > 0;
                selectAllCb.indeterminate = checked.length > 0 && checked.length < checkboxes.length;
            }
        }

        // 多选模式：允许多个checkbox同时选中
        checkboxes.forEach(cb => {
            cb.addEventListener('change', () => {
                updateSelectedCount();
            });
        });

        // 全选/反选
        if (selectAllCb) {
            selectAllCb.addEventListener('change', () => {
                checkboxes.forEach(cb => { cb.checked = selectAllCb.checked; });
                updateSelectedCount();
            });
        }

        // 文本输入时搜索checkbox列表（过滤显示，不清除选中）
        textInput.addEventListener('input', () => {
            const searchText = textInput.value.trim().toLowerCase();
            dropdown.querySelectorAll('.filter-value-item').forEach(item => {
                const cb = item.querySelector('input[type="checkbox"]');
                const label = item.querySelector('span').textContent;
                if (!searchText || label.toLowerCase().includes(searchText)) {
                    item.style.display = '';
                } else {
                    item.style.display = 'none';
                }
            });
        });

        // 模式切换时禁用/启用相关控件
        modeSelect.addEventListener('change', () => {
            const mode = modeSelect.value;
            const isSpecialMode = mode === 'empty' || mode === 'notEmpty';
            textInput.disabled = isSpecialMode;
            checkboxes.forEach(cb => { cb.disabled = isSpecialMode; });
            if (selectAllCb) selectAllCb.disabled = isSpecialMode;
        });
        // 触发一次以设置初始状态
        modeSelect.dispatchEvent(new Event('change'));

        applyBtn.addEventListener('click', () => {
            const val = textInput.value.trim();
            const mode = modeSelect.value;

            if (mode === 'empty') {
                state.columnFilters[fieldName] = { value: '(empty)', matchMode: 'empty', selectedValues: [] };
            } else if (mode === 'notEmpty') {
                state.columnFilters[fieldName] = { value: '(notEmpty)', matchMode: 'notEmpty', selectedValues: [] };
            } else {
                // 收集选中的checkbox值
                const selectedValues = [];
                checkboxes.forEach(cb => {
                    if (cb.checked) selectedValues.push(cb.value);
                });
                state.columnFilters[fieldName] = {
                    value: val,
                    matchMode: mode,
                    selectedValues: selectedValues,
                };
                // 如果没有文本也没有选中值，删除筛选
                if (!val && selectedValues.length === 0) {
                    delete state.columnFilters[fieldName];
                }
            }

            state.currentPage = 1;
            applySearchFilter();
            closeFilterDropdown();
        });

        clearBtn.addEventListener('click', () => {
            delete state.columnFilters[fieldName];
            state.currentPage = 1;
            applySearchFilter();
            closeFilterDropdown();
        });

        // 初始化计数
        updateSelectedCount();

        // 点击外部关闭
        setTimeout(() => {
            document.addEventListener('click', onOutsideClick);
        }, 0);

        function onOutsideClick(e) {
            if (!dropdown.contains(e.target) && e.target !== anchorEl) {
                closeFilterDropdown();
            }
        }

        function closeFilterDropdown() {
            dropdown.remove();
            activeFilterDropdown = null;
            document.removeEventListener('click', onOutsideClick);
        }

        // 聚焦输入框
        textInput.focus();
    }

    function renderValidationResults() {
        const errors = state.validationErrors.filter(e => e.type === 'error');
        const warnings = state.validationErrors.filter(e => e.type === 'warning');

        dom.errorCount.textContent = `错误 ${errors.length}`;
        dom.warningCount.textContent = `警告 ${warnings.length}`;

        if (state.validationErrors.length === 0) {
            dom.validationBody.innerHTML = '<div class="validation-empty">校验通过，未发现问题</div>';
            return;
        }

        let html = '';
        // 错误优先
        [...errors, ...warnings].forEach((item, idx) => {
            const typeClass = item.type === 'error' ? 'error' : 'warning';
            const iconChar = item.type === 'error' ? '!' : '?';
            const rowInfo = item.rowKey ? `行 ${item.rowKey}` : '';
            const fieldInfo = item.fieldName ? ` / ${item.fieldName}` : '';
            const accountInfo = item.createdBy ? `[${escapeHtml(item.createdBy)}] ` : '';
            const metaParts = [];
            if (item.createdBy) metaParts.push(`归属: ${item.createdBy}`);
            if (rowInfo) metaParts.push(rowInfo);
            if (fieldInfo) metaParts.push(fieldInfo.replace(' / ', ''));
            const metaText = metaParts.join(' / ');
            html += `
                <div class="validation-item ${typeClass}" data-row-key="${escapeHtml(item.rowKey || '')}" data-field-name="${escapeHtml(item.fieldName || '')}" data-index="${idx}">
                    <span class="validation-item-icon">${iconChar}</span>
                    <div class="validation-item-content">
                        <div class="validation-item-message">${accountInfo}${escapeHtml(item.message)}</div>
                        <div class="validation-item-meta">${escapeHtml(metaText)}</div>
                    </div>
                    ${item.rowKey ? '<span class="validation-item-locate">定位</span>' : ''}
                </div>
            `;
        });
        dom.validationBody.innerHTML = html;
    }

    function locateError(rowKey, fieldName) {
        // 找到行在 displayData 中的位置
        let displayIndex = -1;
        for (let i = 0; i < state.displayData.length; i++) {
            if (getRowInternalKey(state.displayData[i], i) === rowKey) {
                displayIndex = i;
                break;
            }
        }
        if (displayIndex === -1) {
            showToast('无法定位该行，可能已被过滤', 'warning');
            return;
        }

        // 跳转到对应页
        const targetPage = Math.floor(displayIndex / state.pageSize) + 1;
        if (state.currentPage !== targetPage) {
            state.currentPage = targetPage;
            renderTableBody();
            renderPagination();
        }

        // 高亮目标单元格
        setTimeout(() => {
            const row = dom.tableBody.querySelector(`tr[data-row-key="${CSS.escape(rowKey)}"]`);
            if (!row) return;

            let targetCell = null;
            if (fieldName) {
                // 通过 data-field 属性直接查找对应单元格
                const cellDiv = row.querySelector(`td[data-field="${CSS.escape(fieldName)}"] .cell`);
                if (cellDiv) {
                    targetCell = cellDiv;
                } else {
                    // 回退: 通过可见字段列索引查找
                    const visibleFields = getVisibleFields();
                    const colIdx = visibleFields.findIndex(f => f.name === fieldName);
                    if (colIdx >= 0) {
                        const cells = row.querySelectorAll('td');
                        // +2 偏移: 操作列和序号列
                        if (cells[colIdx + 2]) {
                            targetCell = cells[colIdx + 2].querySelector('.cell') || cells[colIdx + 2];
                        }
                    }
                }
            }
            if (!targetCell) {
                targetCell = row.querySelector('td .cell') || row.querySelector('td');
            }

            if (targetCell) {
                targetCell.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
                // 添加高亮闪烁样式
                targetCell.classList.add('cell-highlight');
                setTimeout(() => targetCell.classList.remove('cell-highlight'), 3000);

                // 如果是 .cell 元素，也进入编辑模式
                if (fieldName && targetCell.classList.contains('cell')) {
                    setTimeout(() => startEdit(rowKey, fieldName), 300);
                }
            } else {
                row.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 300);
    }

    /* ============ 分页 ============ */
    function goToPage(page) {
        const totalPages = getTotalPages();
        if (page < 1 || page > totalPages) return;
        state.currentPage = page;
        // 取消编辑
        state.editing = null;
        renderTableBody();
        renderPagination();
    }

    function renderPagination() {
        const totalPages = getTotalPages();
        dom.pageInfo.textContent = `第 ${state.currentPage} / ${totalPages} 页，共 ${state.displayData.length} 条`;

        dom.firstPageBtn.disabled = state.currentPage <= 1;
        dom.prevPageBtn.disabled = state.currentPage <= 1;
        dom.nextPageBtn.disabled = state.currentPage >= totalPages;
        dom.lastPageBtn.disabled = state.currentPage >= totalPages;

        // 渲染页码
        let html = '';
        const maxButtons = 7;
        let start = Math.max(1, state.currentPage - 3);
        let end = Math.min(totalPages, start + maxButtons - 1);
        if (end - start + 1 < maxButtons) {
            start = Math.max(1, end - maxButtons + 1);
        }

        if (start > 1) {
            html += `<button class="page-btn" data-page="1">1</button>`;
            if (start > 2) html += `<span class="page-ellipsis">...</span>`;
        }
        for (let p = start; p <= end; p++) {
            html += `<button class="page-btn ${p === state.currentPage ? 'active' : ''}" data-page="${p}">${p}</button>`;
        }
        if (end < totalPages) {
            if (end < totalPages - 1) html += `<span class="page-ellipsis">...</span>`;
            html += `<button class="page-btn" data-page="${totalPages}">${totalPages}</button>`;
        }
        dom.pageNumbers.innerHTML = html;
    }

    function updateRecordCount() {
        dom.recordCount.textContent = `共 ${state.displayData.length} 条记录` +
            (state.searchKeyword ? ` (过滤自 ${state.rawData.length} 条)` : '');
    }

    /* ============ 导出 Excel ============ */
    async function handleExport() {
        try {
            showToast('正在导出 Excel...', 'info');
            const result = await api.get(`${CONFIG.apiBase}/export/${state.currentTable}`);
            // 处理 blob 下载
            if (result && result._blob) {
                downloadBlob(result._blob, `${state.currentTableName}_${formatDateForFile()}.xlsx`);
                showToast('导出成功', 'success');
            } else {
                showToast('导出返回数据格式异常', 'error');
            }
        } catch (err) {
            showToast('导出失败: ' + err.message, 'error');
        }
    }

    function downloadBlob(blob, filename) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    function formatDateForFile() {
        const d = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
    }

    /* ============ 导入 Excel ============ */
    function openImportModal() {
        dom.importModal.style.display = 'flex';
        dom.importProgress.style.display = 'none';
        dom.importResult.style.display = 'none';
        dom.progressFill.style.width = '0%';
        dom.progressText.textContent = '导入中...';
    }

    function closeImportModal() {
        dom.importModal.style.display = 'none';
    }

    async function handleImportFile(file) {
        if (!file) return;
        const ext = file.name.split('.').pop().toLowerCase();
        if (!['xlsx', 'xls'].includes(ext)) {
            showToast('请选择 .xlsx 或 .xls 格式的文件', 'error');
            return;
        }

        dom.importProgress.style.display = 'block';
        dom.importResult.style.display = 'none';
        dom.progressFill.style.width = '0%';
        dom.progressText.textContent = '导入中...';

        const formData = new FormData();
        formData.append('file', file);
        formData.append('table', state.currentTable);

        try {
            const result = await api.upload(
                `${CONFIG.apiBase}/import`,
                formData,
                (percent) => {
                    dom.progressFill.style.width = percent + '%';
                    dom.progressText.textContent = `导入中... ${percent}%`;
                }
            );

            dom.progressFill.style.width = '100%';
            dom.progressText.textContent = '导入完成';

            // 显示结果
            let resultMsg = '';
            let resultType = 'success';
            if (result && typeof result === 'object') {
                const imported = result.imported || result.count || result.success_count || 0;
                const skipped = result.skipped || result.failed || result.error_count || 0;
                resultMsg = `导入完成！成功 ${imported} 条`;
                if (skipped > 0) resultMsg += `，失败 ${skipped} 条`;
                if (result.message) resultMsg = result.message;
                if (result.errors && result.errors.length > 0) {
                    resultType = 'error';
                    resultMsg += '<br><br>错误详情:<br>' + result.errors.slice(0, 5).map(e => '• ' + escapeHtml(e.message || e)).join('<br>');
                    if (result.errors.length > 5) resultMsg += `<br>...等 ${result.errors.length} 条`;
                }
            } else {
                resultMsg = '导入完成';
            }

            dom.importResult.style.display = 'block';
            dom.importResult.className = `import-result ${resultType}`;
            dom.importResult.innerHTML = resultMsg;

            showToast('导入完成', 'success');

            // 重新加载数据
            setTimeout(() => {
                closeImportModal();
                loadTableData();
            }, 1500);
        } catch (err) {
            dom.importResult.style.display = 'block';
            dom.importResult.className = 'import-result error';
            dom.importResult.textContent = '导入失败: ' + err.message;
            showToast('导入失败: ' + err.message, 'error');
        }
    }

    /* ============ 一键导出/导入全部 ============ */
    async function exportAllExcel() {
        try {
            showLoading('正在导出全部数据...');
            const resp = await fetch(CONFIG.apiBase + '/export-all', {
                headers: { 'Authorization': 'Bearer ' + state.authToken }
            });
            if (!resp.ok) {
                let errMsg = '导出失败 (' + resp.status + ')';
                try {
                    const errData = await resp.json();
                    errMsg = errData.message || errData.error || errData.detail || errMsg;
                } catch (e) { /* 忽略解析错误 */ }
                throw new Error(errMsg);
            }
            const blob = await resp.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `全表导出_${new Date().toISOString().slice(0, 10)}.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast('导出成功', 'success');
        } catch (err) {
            showToast('导出失败: ' + err.message, 'error');
        } finally {
            hideLoading();
        }
    }

    /* ============ 清空台账（强制先导出） ============ */
    async function clearAllData() {
        // 第1步：强制导出全部数据
        dom.confirmTitle.textContent = '清空台账 - 第1步/共3步：导出数据';
        dom.confirmMessage.innerHTML =
            '<div style="line-height:2;">' +
            '<strong style="color:#ef4444;">⚠️ 清空操作将删除全部10张台账中的所有数据，此操作不可撤销！</strong><br><br>' +
            '按照系统要求，清空前<strong>必须先导出全部数据</strong>作为备份。<br>' +
            '点击「确定」开始导出全部数据，导出完成后将进入下一步确认。' +
            '</div>';
        dom.confirmOkBtn.textContent = '确定，开始导出';
        dom.confirmCancelBtn.textContent = '取消';
        dom.confirmModal.style.display = 'flex';

        const step1Result = await new Promise(resolve => {
            const onOk = () => { cleanup(); resolve('ok'); };
            const onCancel = () => { cleanup(); resolve('cancel'); };
            const onOverlay = (e) => { if (e.target === dom.confirmModal) { cleanup(); resolve('cancel'); } };
            const onEsc = (e) => { if (e.key === 'Escape') { cleanup(); resolve('cancel'); } };
            function cleanup() {
                dom.confirmOkBtn.removeEventListener('click', onOk);
                dom.confirmCancelBtn.removeEventListener('click', onCancel);
                dom.confirmModal.removeEventListener('click', onOverlay);
                document.removeEventListener('keydown', onEsc);
                dom.confirmModal.style.display = 'none';
            }
            dom.confirmOkBtn.addEventListener('click', onOk);
            dom.confirmCancelBtn.addEventListener('click', onCancel);
            dom.confirmModal.addEventListener('click', onOverlay);
            document.addEventListener('keydown', onEsc);
        });

        if (step1Result !== 'ok') return;

        // 执行导出
        let exportSuccess = false;
        try {
            showLoading('正在导出全部数据（清空前备份）...');
            const resp = await fetch(CONFIG.apiBase + '/export-all', {
                headers: { 'Authorization': 'Bearer ' + state.authToken }
            });
            if (!resp.ok) throw new Error('导出失败 (' + resp.status + ')');
            const blob = await resp.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `清空前备份_${new Date().toISOString().slice(0, 10)}.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            exportSuccess = true;
            showToast('数据已导出备份', 'success');
        } catch (err) {
            showToast('导出失败: ' + err.message + '，清空操作已取消', 'error');
        } finally {
            hideLoading();
        }

        if (!exportSuccess) return;

        // 第2步：确认清空（需输入"确认清空"）
        dom.confirmTitle.textContent = '清空台账 - 第2步/共3步：确认清空';
        dom.confirmMessage.innerHTML =
            '<div style="line-height:2;">' +
            '✅ 数据已导出备份。<br><br>' +
            '<strong style="color:#ef4444;">即将删除全部10张台账中的所有数据！</strong><br>' +
            '此操作不可撤销，请谨慎确认。<br><br>' +
            '请在下方输入框中输入 <code style="background:#f0f0f0;padding:2px 6px;border-radius:3px;">确认清空</code> 以继续：' +
            '<input type="text" id="clearConfirmInput" style="width:100%;margin-top:8px;padding:8px;border:1px solid #ccc;border-radius:4px;font-size:14px;" placeholder="请输入「确认清空」四个字" />' +
            '</div>';
        dom.confirmOkBtn.textContent = '执行清空';
        dom.confirmCancelBtn.textContent = '取消';
        dom.confirmModal.style.display = 'flex';

        const step2Result = await new Promise(resolve => {
            const onOk = () => {
                const inputVal = document.getElementById('clearConfirmInput')?.value.trim();
                cleanup();
                resolve(inputVal === '确认清空' ? 'confirmed' : 'mismatch');
            };
            const onCancel = () => { cleanup(); resolve('cancel'); };
            const onOverlay = (e) => { if (e.target === dom.confirmModal) { cleanup(); resolve('cancel'); } };
            const onEsc = (e) => { if (e.key === 'Escape') { cleanup(); resolve('cancel'); } };
            function cleanup() {
                dom.confirmOkBtn.removeEventListener('click', onOk);
                dom.confirmCancelBtn.removeEventListener('click', onCancel);
                dom.confirmModal.removeEventListener('click', onOverlay);
                document.removeEventListener('keydown', onEsc);
                dom.confirmModal.style.display = 'none';
            }
            dom.confirmOkBtn.addEventListener('click', onOk);
            dom.confirmCancelBtn.addEventListener('click', onCancel);
            dom.confirmModal.addEventListener('click', onOverlay);
            document.addEventListener('keydown', onEsc);
        });

        if (step2Result === 'cancel') return;
        if (step2Result === 'mismatch') {
            showToast('输入内容不匹配，清空操作已取消', 'warning');
            return;
        }

        // 第3步：执行清空
        showLoading('正在清空全部台账数据...');
        try {
            const formData = new FormData();
            formData.append('confirm', 'DELETE_ALL_DATA');
            const result = await api.upload(`${CONFIG.apiBase}/clear-all`, formData);

            hideLoading();

            // 显示清空结果
            let details = [];
            if (result.cleared_tables) {
                result.cleared_tables.forEach(t => {
                    if (t.deleted !== undefined) {
                        details.push(`• ${t.table}: 已删除 ${t.deleted} 条`);
                    } else if (t.error) {
                        details.push(`• ${t.table}: 错误 - ${t.error}`);
                    }
                });
            }

            dom.confirmTitle.textContent = '清空台账 - 完成';
            dom.confirmMessage.innerHTML =
                `<div style="line-height:1.8;">✅ ${result.message}<br><br>${details.join('<br>')}</div>`;
            dom.confirmOkBtn.textContent = '确定';
            dom.confirmCancelBtn.textContent = '';
            dom.confirmCancelBtn.style.display = 'none';
            dom.confirmModal.style.display = 'flex';

            const onClose = () => {
                cleanup();
                dom.confirmCancelBtn.style.display = '';
                dom.confirmCancelBtn.textContent = '取消';
            };
            const onOverlay = (e) => { if (e.target === dom.confirmModal) onClose(); };
            const onEsc = (e) => { if (e.key === 'Escape') onClose(); };
            function cleanup() {
                dom.confirmOkBtn.removeEventListener('click', onClose);
                dom.confirmModal.removeEventListener('click', onOverlay);
                document.removeEventListener('keydown', onEsc);
                dom.confirmModal.style.display = 'none';
            }
            dom.confirmOkBtn.addEventListener('click', onClose);
            dom.confirmModal.addEventListener('click', onOverlay);
            document.addEventListener('keydown', onEsc);

            showToast(result.message, 'success');
            // 重新加载当前表数据
            loadTableData();
        } catch (err) {
            hideLoading();
            showToast('清空失败: ' + err.message, 'error');
        }
    }

    async function importAllExcel(file) {
        if (!file) return;
        const ext = file.name.split('.').pop().toLowerCase();
        if (!['xlsx', 'xls'].includes(ext)) {
            showToast('请选择 .xlsx 或 .xls 格式的文件', 'error');
            return;
        }

        showLoading('正在导入全部数据...');
        const formData = new FormData();
        formData.append('file', file);

        try {
            const result = await api.upload(`${CONFIG.apiBase}/import-all`, formData);
            hideLoading();

            // 显示每个 Sheet 的导入结果
            let summaryMsg = '导入完成！';
            let resultType = 'success';
            let details = [];

            if (result && typeof result === 'object') {
                const imported = result.imported || result.total_imported || result.success_count || 0;
                const failed = result.failed || result.error_count || 0;
                summaryMsg = `导入完成！成功 ${imported} 条`;
                if (failed > 0) {
                    summaryMsg += `，失败 ${failed} 条`;
                    resultType = 'warning';
                }
                if (result.message) summaryMsg = result.message;

                // 处理每个 Sheet 的结果
                const sheets = result.results || result.sheets || result.details || [];
                if (Array.isArray(sheets) && sheets.length > 0) {
                    sheets.forEach(sheet => {
                        const sheetName = sheet.table || sheet.sheet || sheet.name || '未知表';
                        const cnt = sheet.imported !== undefined ? sheet.imported
                            : (sheet.count !== undefined ? sheet.count
                                : (sheet.success_count !== undefined ? sheet.success_count : 0));
                        const fail = sheet.failed !== undefined ? sheet.failed
                            : (sheet.error_count !== undefined ? sheet.error_count : 0);
                        let line = `• ${escapeHtml(sheetName)}: 成功 ${cnt} 条`;
                        if (fail > 0) line += `，失败 ${fail} 条`;
                        details.push(line);
                        if (fail > 0 || sheet.errors) resultType = 'warning';
                        // 显示每个 Sheet 的详细错误（行号和原因）
                        if (sheet.errors && Array.isArray(sheet.errors) && sheet.errors.length > 0) {
                            sheet.errors.slice(0, 10).forEach(e => {
                                const isStr = typeof e === 'string';
                                const errMsg = isStr ? e : (e.message || e.error || e.msg || JSON.stringify(e));
                                const rowNum = !isStr && (e.row !== undefined || e.row_num !== undefined || e.line !== undefined)
                                    ? (e.row !== undefined ? e.row : (e.row_num !== undefined ? e.row_num : e.line))
                                    : '';
                                const rowInfo = rowNum !== '' ? `第${rowNum}行: ` : '';
                                details.push(`&nbsp;&nbsp;&nbsp;&nbsp;${rowInfo}${escapeHtml(errMsg)}`);
                            });
                            if (sheet.errors.length > 10) {
                                details.push(`&nbsp;&nbsp;&nbsp;&nbsp;...等 ${sheet.errors.length} 条错误`);
                            }
                        }
                    });
                }

                if (result.errors && Array.isArray(result.errors) && result.errors.length > 0) {
                    resultType = 'error';
                    result.errors.slice(0, 5).forEach(e => {
                        details.push('• ' + escapeHtml(e.message || e));
                    });
                    if (result.errors.length > 5) {
                        details.push(`...等 ${result.errors.length} 条错误`);
                    }
                }
            }

            let fullMsg = summaryMsg;
            if (details.length > 0) {
                fullMsg += '<br><br>' + details.join('<br>');
            }

            // 用确认弹窗展示详细结果（复用确认弹窗的遮罩/Esc 关闭逻辑）
            dom.confirmTitle.textContent = '一键导入全部结果';
            dom.confirmMessage.innerHTML = fullMsg;
            dom.confirmModal.style.display = 'flex';
            // 确定/取消按钮点击后关闭弹窗（一次性，遮罩和 Esc 已有持久关闭逻辑）
            const onCloseResult = () => {
                dom.confirmModal.style.display = 'none';
                dom.confirmOkBtn.removeEventListener('click', onCloseResult);
                dom.confirmCancelBtn.removeEventListener('click', onCloseResult);
            };
            dom.confirmOkBtn.addEventListener('click', onCloseResult);
            dom.confirmCancelBtn.addEventListener('click', onCloseResult);

            showToast(summaryMsg, resultType);

            // 重新加载当前表数据
            loadTableData();
        } catch (err) {
            hideLoading();
            showToast('导入失败: ' + err.message, 'error');
        }
    }

    /* ============ 事件绑定 ============ */
    function bindEvents() {
        // 侧边栏折叠
        dom.sidebarToggle.addEventListener('click', () => {
            dom.sidebar.classList.toggle('collapsed');
        });

        // 标签页切换
        dom.tabList.addEventListener('click', (e) => {
            const item = e.target.closest('.tab-item');
            if (!item) return;
            switchTable(item.dataset.table, item.dataset.name);
        });

        // 搜索
        dom.searchInput.addEventListener('input', handleSearch);
        dom.searchClear.addEventListener('click', () => {
            dom.searchInput.value = '';
            state.searchKeyword = '';
            dom.searchClear.style.display = 'none';
            applySearchFilter();
            dom.searchInput.focus();
        });

        // 校验
        dom.validateBtn.addEventListener('click', validateTable);

        // 刷新
        dom.refreshBtn.addEventListener('click', () => {
            state.columnFilters = {};
            state.searchKeyword = '';
            if (dom.searchInput) dom.searchInput.value = '';
            loadTableData();
        });

        // 新增
        dom.addBtn.addEventListener('click', addNewRow);

        // 表头筛选
        dom.tableHead.addEventListener('click', (e) => {
            if (e.target.classList.contains('th-filter-icon')) {
                e.stopPropagation();
                const fieldName = e.target.dataset.field;
                toggleFilterDropdown(fieldName, e.target);
            }
        });

        // 导出
        dom.exportBtn.addEventListener('click', handleExport);

        // 导入
        dom.importBtn.addEventListener('click', openImportModal);
        dom.importSelectBtn.addEventListener('click', () => dom.importFileInput.click());
        dom.importFileInput.addEventListener('change', (e) => {
            if (e.target.files[0]) handleImportFile(e.target.files[0]);
            e.target.value = '';
        });
        dom.importDropzone.addEventListener('click', () => dom.importFileInput.click());
        dom.importDropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dom.importDropzone.classList.add('dragover');
        });
        dom.importDropzone.addEventListener('dragleave', () => {
            dom.importDropzone.classList.remove('dragover');
        });
        dom.importDropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dom.importDropzone.classList.remove('dragover');
            if (e.dataTransfer.files[0]) handleImportFile(e.dataTransfer.files[0]);
        });
        dom.importModalClose.addEventListener('click', closeImportModal);
        dom.importCancelBtn.addEventListener('click', closeImportModal);
        dom.importModal.addEventListener('click', (e) => {
            if (e.target === dom.importModal) closeImportModal();
        });

        // 一键导入/导出全部
        if (dom.exportAllBtn) {
            dom.exportAllBtn.addEventListener('click', exportAllExcel);
        }
        if (dom.clearAllBtn) {
            dom.clearAllBtn.addEventListener('click', clearAllData);
        }
        if (dom.importAllBtn) {
            dom.importAllBtn.addEventListener('click', () => {
                dom.importAllFileInput.click();
            });
        }
        if (dom.importAllFileInput) {
            dom.importAllFileInput.addEventListener('change', (e) => {
                if (e.target.files[0]) importAllExcel(e.target.files[0]);
                e.target.value = '';
            });
        }

        // 校验面板折叠
        dom.validationToggle.addEventListener('click', () => {
            dom.validationPanel.classList.toggle('collapsed');
        });
        dom.validationClear.addEventListener('click', () => {
            state.validationErrors = [];
            state.rowStatus.clear();
            renderTableBody();
            renderValidationResults();
        });

        // 校验结果点击定位
        dom.validationBody.addEventListener('click', (e) => {
            const item = e.target.closest('.validation-item');
            if (!item) return;
            const rowKey = item.dataset.rowKey;
            const fieldName = item.dataset.fieldName;
            if (rowKey) locateError(rowKey, fieldName);
        });

        // 分页
        dom.firstPageBtn.addEventListener('click', () => goToPage(1));
        dom.prevPageBtn.addEventListener('click', () => goToPage(state.currentPage - 1));
        dom.nextPageBtn.addEventListener('click', () => goToPage(state.currentPage + 1));
        dom.lastPageBtn.addEventListener('click', () => goToPage(getTotalPages()));
        dom.pageNumbers.addEventListener('click', (e) => {
            if (e.target.classList.contains('page-btn')) {
                goToPage(parseInt(e.target.dataset.page, 10));
            }
        });
        dom.pageSizeSelect.addEventListener('change', (e) => {
            state.pageSize = parseInt(e.target.value, 10);
            state.currentPage = 1;
            renderTableBody();
            renderPagination();
        });

        // 表格事件委托: 编辑、保存、取消、删除
        dom.tableBody.addEventListener('click', (e) => {
            const target = e.target;

            // 操作按钮
            const actionBtn = target.closest('[data-action]');
            if (actionBtn && actionBtn.tagName === 'BUTTON') {
                const action = actionBtn.dataset.action;
                const rowKey = actionBtn.dataset.rowKey;
                if (action === 'save') saveRow(rowKey);
                else if (action === 'cancel') cancelRowChanges(rowKey);
                else if (action === 'delete') deleteRow(rowKey);
                return;
            }

            // 点击单元格编辑
            const cell = target.closest('[data-action="edit"]');
            if (cell) {
                const rowKey = cell.dataset.rowKey;
                const fieldName = cell.dataset.fieldName;
                startEdit(rowKey, fieldName);
                return;
            }
        });

        // 编辑控件事件
        dom.tableBody.addEventListener('keydown', (e) => {
            const target = e.target;
            if (!target.classList.contains('cell-edit-input') &&
                !target.classList.contains('cell-edit-select') &&
                !target.classList.contains('cell-edit-date') &&
                !target.classList.contains('cell-edit-number')) return;

            const rowKey = target.dataset.rowKey;
            const fieldName = target.dataset.field;

            // Enter 确认
            if (e.key === 'Enter') {
                e.preventDefault();
                confirmEdit(rowKey, fieldName);
            }
            // Escape 取消
            else if (e.key === 'Escape') {
                e.preventDefault();
                cancelEdit(rowKey, fieldName);
            }
            // Tab 跳到下一个可编辑字段
            else if (e.key === 'Tab') {
                e.preventDefault();
                confirmEdit(rowKey, fieldName);
                // 找到下一个可编辑字段
                const visibleFields = getVisibleFields();
                const colIndex = visibleFields.findIndex(c => c.name === fieldName);
                const nextCols = e.shiftKey
                    ? visibleFields.slice(0, colIndex).filter(c => c.editable).reverse()
                    : visibleFields.slice(colIndex + 1).filter(c => c.editable);
                if (nextCols.length > 0) {
                    startEdit(rowKey, nextCols[0].name);
                }
            }
        });

        // 编辑控件失焦确认
        dom.tableBody.addEventListener('focusout', (e) => {
            const target = e.target;
            if (!target.classList.contains('cell-edit-input') &&
                !target.classList.contains('cell-edit-select') &&
                !target.classList.contains('cell-edit-date') &&
                !target.classList.contains('cell-edit-number')) return;

            const rowKey = target.dataset.rowKey;
            const fieldName = target.dataset.field;
            // 延迟确认，避免与点击其他单元格冲突
            setTimeout(() => {
                if (state.editing && state.editing.rowKey === rowKey && state.editing.fieldName === fieldName) {
                    // 检查焦点是否已移到其他编辑控件（覆盖所有编辑控件类型）
                    const active = document.activeElement;
                    const isEditControl = active && (
                        active.classList.contains('cell-edit-input') ||
                        active.classList.contains('cell-edit-select') ||
                        active.classList.contains('cell-edit-date') ||
                        active.classList.contains('cell-edit-number')
                    );
                    if (!isEditControl) {
                        confirmEdit(rowKey, fieldName);
                    }
                }
            }, 100);
        });

        // 下拉选择 change 立即确认
        dom.tableBody.addEventListener('change', (e) => {
            if (e.target.classList.contains('cell-edit-select')) {
                const rowKey = e.target.dataset.rowKey;
                const fieldName = e.target.dataset.field;
                confirmEdit(rowKey, fieldName);
            }
        });

        // 确认弹窗点击遮罩关闭
        dom.confirmModal.addEventListener('click', (e) => {
            if (e.target === dom.confirmModal) {
                dom.confirmModal.style.display = 'none';
            }
        });

        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            // Ctrl+S 保存当前编辑
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                if (state.editing) {
                    confirmEdit(state.editing.rowKey, state.editing.fieldName);
                }
            }
            // Esc 关闭弹窗
            if (e.key === 'Escape') {
                if (dom.importModal.style.display === 'flex') closeImportModal();
                if (dom.confirmModal.style.display === 'flex') {
                    dom.confirmModal.style.display = 'none';
                }
            }
        });

        // 窗口大小变化时重新渲染分页
        window.addEventListener('resize', debounce(() => {
            renderPagination();
        }, 200));

        // ========== 认证相关事件 ==========

        // 登录表单提交
        if (dom.loginForm) {
            dom.loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const username = dom.loginUsername.value.trim();
                const password = dom.loginPassword.value;
                if (!username || !password) return;
                dom.loginBtn.disabled = true;
                dom.loginBtn.textContent = '登录中...';
                dom.loginError.style.display = 'none';
                try {
                    await doLogin(username, password);
                } catch (err) {
                    dom.loginError.textContent = err.message;
                    dom.loginError.style.display = 'block';
                } finally {
                    dom.loginBtn.disabled = false;
                    dom.loginBtn.textContent = '登 录';
                }
            });
        }

        // 用户菜单下拉
        if (dom.userMenu) {
            dom.userMenu.addEventListener('click', (e) => {
                e.stopPropagation();
                dom.userDropdown.style.display = dom.userDropdown.style.display === 'none' ? 'block' : 'none';
            });
            document.addEventListener('click', () => {
                dom.userDropdown.style.display = 'none';
            });
        }

        // 退出登录
        if (dom.menuLogout) {
            dom.menuLogout.addEventListener('click', () => {
                dom.userDropdown.style.display = 'none';
                doLogout();
            });
        }

        // 用户管理
        if (dom.menuUserManage) {
            dom.menuUserManage.addEventListener('click', () => {
                dom.userDropdown.style.display = 'none';
                dom.userManageModal.style.display = 'flex';
                resetUserForm();
                loadUsers();
            });
        }
        if (dom.userManageClose) {
            dom.userManageClose.addEventListener('click', () => {
                dom.userManageModal.style.display = 'none';
            });
            dom.userManageModal.addEventListener('click', (e) => {
                if (e.target === dom.userManageModal) dom.userManageModal.style.display = 'none';
            });
        }
        if (dom.userFormSubmit) {
            dom.userFormSubmit.addEventListener('click', submitUserForm);
        }
        if (dom.userFormCancel) {
            dom.userFormCancel.addEventListener('click', resetUserForm);
        }
        // 用户列表事件委托
        if (dom.userList) {
            dom.userList.addEventListener('click', async (e) => {
                const editBtn = e.target.closest('[data-edit-user]');
                const delBtn = e.target.closest('[data-delete-user]');
                if (editBtn) {
                    const userId = editBtn.dataset.editUser;
                    try {
                        const resp = await api.get(CONFIG.apiBase + '/users');
                        const users = resp.users || resp.data || [];
                        const user = users.find(u => String(u.id) === userId);
                        if (user) {
                            editingUserId = user.id;
                            dom.formUsername.value = user.username;
                            dom.formUsername.disabled = true;
                            dom.formDisplayName.value = user.display_name || '';
                            dom.formPassword.value = '';
                            dom.formRole.value = user.role || 'user';
                            dom.userFormSubmit.textContent = '保存修改';
                            dom.userFormCancel.style.display = 'inline-block';
                        }
                    } catch (err) {
                        showToast('加载用户信息失败', 'error');
                    }
                }
                if (delBtn) {
                    const userId = delBtn.dataset.deleteUser;
                    showConfirm('确认删除', '确定要删除该用户吗？', async () => {
                        try {
                            await api.delete(CONFIG.apiBase + '/users/' + userId);
                            showToast('用户已删除', 'success');
                            loadUsers();
                        } catch (err) {
                            showToast('删除失败: ' + err.message, 'error');
                        }
                    });
                }
            });
        }

        // 下拉选项管理
        if (dom.menuDropdownManage) {
            dom.menuDropdownManage.addEventListener('click', () => {
                dom.userDropdown.style.display = 'none';
                openDropdownManageModal();
            });
        }
        if (dom.dropdownManageClose) {
            dom.dropdownManageClose.addEventListener('click', closeDropdownManageModal);
            dom.dropdownManageModal.addEventListener('click', (e) => {
                if (e.target === dom.dropdownManageModal) closeDropdownManageModal();
            });
        }
        if (dom.ddTableSelect) {
            dom.ddTableSelect.addEventListener('change', (e) => {
                loadDropdownFields(e.target.value);
            });
        }
        if (dom.ddFieldSelect) {
            dom.ddFieldSelect.addEventListener('change', (e) => {
                const tableName = dom.ddTableSelect.value;
                loadDropdownOptions(tableName, e.target.value);
            });
        }
        if (dom.ddAddBtn) {
            dom.ddAddBtn.addEventListener('click', addDropdownOption);
        }
        if (dom.ddOptionList) {
            dom.ddOptionList.addEventListener('click', (e) => {
                const delBtn = e.target.closest('.dd-option-delete');
                if (!delBtn) return;
                const optionId = delBtn.dataset.ddId;
                if (optionId) deleteDropdownOption(optionId);
            });
        }

        // 导入模板下载
        if (dom.downloadTemplateBtn) {
            dom.downloadTemplateBtn.addEventListener('click', async () => {
                try {
                    showToast('正在下载模板...', 'info');
                    const resp = await fetch(CONFIG.apiBase + '/import-template', {
                        headers: { 'Authorization': 'Bearer ' + state.authToken }
                    });
                    if (!resp.ok) {
                        let errMsg = '下载失败 (' + resp.status + ')';
                        try {
                            const errData = await resp.json();
                            errMsg = errData.message || errData.error || errMsg;
                        } catch (e) { /* 忽略解析错误 */ }
                        throw new Error(errMsg);
                    }
                    const blob = await resp.blob();
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = '导入模板.xlsx';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    showToast('模板下载成功', 'success');
                } catch (err) {
                    showToast('下载失败: ' + err.message, 'error');
                }
            });
        }

        // 表头列管理
        if (dom.menuColumnManage) {
            dom.menuColumnManage.addEventListener('click', () => {
                dom.userDropdown.style.display = 'none';
                openColumnManageModal();
            });
        }
        if (dom.columnManageClose) {
            dom.columnManageClose.addEventListener('click', () => {
                dom.columnManageModal.style.display = 'none';
            });
            dom.columnManageModal.addEventListener('click', (e) => {
                if (e.target === dom.columnManageModal) dom.columnManageModal.style.display = 'none';
            });
        }
        if (dom.colTableSelect) {
            dom.colTableSelect.addEventListener('change', (e) => {
                loadAllColumns(e.target.value);
            });
        }
        if (dom.colAddBtn) {
            dom.colAddBtn.addEventListener('click', addCustomColumn);
        }
        if (dom.colList) {
            dom.colList.addEventListener('click', (e) => {
                const delBtn = e.target.closest('[data-delete-col]');
                if (delBtn) {
                    const colId = delBtn.dataset.deleteCol;
                    if (colId) deleteCustomColumn(colId);
                    return;
                }
                const hideBtn = e.target.closest('[data-hide-col]');
                if (hideBtn) {
                    const tableName = hideBtn.dataset.tableName;
                    const fieldKey = hideBtn.dataset.hideCol;
                    if (tableName && fieldKey) hideBaseColumn(tableName, fieldKey);
                    return;
                }
                const restoreBtn = e.target.closest('[data-restore-col]');
                if (restoreBtn) {
                    const tableName = restoreBtn.dataset.tableName;
                    const fieldKey = restoreBtn.dataset.restoreCol;
                    if (tableName && fieldKey) restoreBaseColumn(tableName, fieldKey);
                    return;
                }
                const renameBtn = e.target.closest('[data-rename-col]');
                if (renameBtn) {
                    const tableName = renameBtn.dataset.tableName;
                    const fieldKey = renameBtn.dataset.renameCol;
                    if (tableName && fieldKey) startInlineRename(tableName, fieldKey, renameBtn);
                    return;
                }
                const resetBtn = e.target.closest('[data-reset-name-col]');
                if (resetBtn) {
                    const tableName = resetBtn.dataset.tableName;
                    const fieldKey = resetBtn.dataset.resetNameCol;
                    if (tableName && fieldKey) resetColumnName(tableName, fieldKey);
                    return;
                }
            });
        }

        // 修改密码
        // 强制改密标志：首次登录（初始密码）时置为 true，改密成功前不允许关闭弹窗
        let _forcePasswordChange = false;

        function openChangePasswordModal(isForced) {
            _forcePasswordChange = !!isForced;
            dom.pwdUsername.value = state.currentUser
                ? (state.currentUser.display_name || state.currentUser.username)
                : '';
            const mustChange = !!(state.currentUser && state.currentUser.must_change_password);
            // 强制改密（初始密码）可免填原密码
            if (mustChange) {
                dom.pwdOldGroup.style.display = 'none';
                dom.pwdForceHint.style.display = 'block';
            } else {
                dom.pwdOldGroup.style.display = '';
                dom.pwdForceHint.style.display = 'none';
            }
            dom.pwdOld.value = '';
            dom.pwdNew.value = '';
            dom.pwdConfirm.value = '';
            dom.changePwdModal.style.display = 'flex';
        }

        if (dom.menuChangePassword) {
            dom.menuChangePassword.addEventListener('click', () => {
                dom.userDropdown.style.display = 'none';
                openChangePasswordModal(false);
            });
        }
        if (dom.changePwdClose) {
            dom.changePwdClose.addEventListener('click', () => {
                if (_forcePasswordChange) { showToast('请先修改初始密码，才能继续使用系统', 'warning'); return; }
                dom.changePwdModal.style.display = 'none';
            });
            dom.changePwdModal.addEventListener('click', (e) => {
                if (e.target === dom.changePwdModal && !_forcePasswordChange) dom.changePwdModal.style.display = 'none';
            });
        }
        if (dom.changePwdCancel) {
            dom.changePwdCancel.addEventListener('click', () => {
                if (_forcePasswordChange) { showToast('请先修改初始密码，才能继续使用系统', 'warning'); return; }
                dom.changePwdModal.style.display = 'none';
            });
        }
        if (dom.changePwdSubmit) {
            dom.changePwdSubmit.addEventListener('click', changePassword);
        }
    }

    /* ============ 认证相关 ============ */

    function showLogin() {
        if (dom.loginPage) dom.loginPage.style.display = 'flex';
        if (dom.mainApp) dom.mainApp.style.display = 'none';
        state.currentUser = null;
    }

    function showMainApp() {
        if (dom.loginPage) dom.loginPage.style.display = 'none';
        if (dom.mainApp) dom.mainApp.style.display = 'block';
    }

    async function doLogin(username, password) {
        try {
            const resp = await fetch(CONFIG.apiBase + '/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            const data = await resp.json();
            if (!data.success) {
                throw new Error(data.error || '登录失败');
            }
            state.authToken = data.token;
            state.currentUser = data.user;
            localStorage.setItem('authToken', data.token);
            updateUserUI();
            showMainApp();
            if (data.user && data.user.must_change_password) {
                // 首次登录使用初始密码，强制引导修改密码后再使用
                openChangePasswordModal(true);
            } else {
                // 加载数据
                loadTableData();
            }
            return true;
        } catch (err) {
            throw err;
        }
    }

    function doLogout() {
        if (state.authToken) {
            api.post(CONFIG.apiBase + '/logout', {}).catch(() => {});
        }
        state.authToken = null;
        state.currentUser = null;
        localStorage.removeItem('authToken');
        showLogin();
    }

    async function checkAuth() {
        if (!state.authToken) {
            showLogin();
            return false;
        }
        try {
            const resp = await fetch(CONFIG.apiBase + '/me', {
                headers: { 'Authorization': 'Bearer ' + state.authToken },
            });
            if (!resp.ok) {
                state.authToken = null;
                localStorage.removeItem('authToken');
                showLogin();
                return false;
            }
            const data = await resp.json();
            if (data.success) {
                state.currentUser = data.user;
                updateUserUI();
                return true;
            }
        } catch (e) {
            showLogin();
            return false;
        }
        showLogin();
        return false;
    }

    function updateUserUI() {
        if (!state.currentUser) return;
        const name = state.currentUser.display_name || state.currentUser.username;
        dom.userName.textContent = name;
        dom.userAvatar.textContent = name.charAt(0).toUpperCase();
        const role = state.currentUser.role;
        const isAdminUser = role === 'admin';
        dom.menuUserInfo.textContent = '当前角色：' + (isAdminUser ? '管理员' : '普通用户');
        // 管理员才显示用户管理
        dom.menuUserManage.style.display = isAdminUser ? 'block' : 'none';
        // 管理员才显示下拉选项管理
        if (dom.menuDropdownManage) {
            dom.menuDropdownManage.style.display = isAdminUser ? 'block' : 'none';
        }
        // 管理员才显示一键导入/导出全部按钮
        if (dom.importAllBtn) {
            dom.importAllBtn.style.display = isAdminUser ? 'inline-flex' : 'none';
        }
        if (dom.exportAllBtn) {
            dom.exportAllBtn.style.display = isAdminUser ? 'inline-flex' : 'none';
        }
        if (dom.clearAllBtn) {
            dom.clearAllBtn.style.display = isAdminUser ? 'inline-flex' : 'none';
        }
        // 管理员才显示导入模板下载按钮
        if (dom.downloadTemplateBtn) {
            dom.downloadTemplateBtn.style.display = isAdminUser ? 'inline-flex' : 'none';
        }
        // 管理员才显示表头列管理
        if (dom.menuColumnManage) {
            dom.menuColumnManage.style.display = isAdminUser ? 'block' : 'none';
        }
        // 管理员才显示数据分析入口
        const analyticsLink = document.getElementById('analyticsLink');
        if (analyticsLink) {
            analyticsLink.style.display = isAdminUser ? '' : 'none';
        }
        // 普通用户显示权限提示
        dom.permissionHint.style.display = isAdminUser ? 'none' : 'flex';
    }

    function isAdmin() {
        return state.currentUser && state.currentUser.role === 'admin';
    }

    function canDeleteRecord(record) {
        if (!state.currentUser) return false;
        if (state.currentUser.role === 'admin') return true;
        // 普通用户只能删除自己创建的记录
        return record.created_by === state.currentUser.username;
    }

    function canEditRecord(record) {
        if (!state.currentUser) return false;
        if (state.currentUser.role === 'admin') return true;
        // 新增未保存的行（带临时ID），当前用户可编辑
        if (record && record._tempId) return true;
        // 普通用户只能编辑自己创建的记录
        return record.created_by === state.currentUser.username;
    }

    /* ============ 用户管理 ============ */

    async function loadUsers() {
        try {
            const data = await api.get(CONFIG.apiBase + '/users');
            const users = data.users || data.data || [];
            renderUserList(users);
        } catch (err) {
            showToast('加载用户列表失败: ' + err.message, 'error');
        }
    }

    function renderUserList(users) {
        if (!dom.userList) return;
        if (!users || users.length === 0) {
            dom.userList.innerHTML = '<p style="text-align:center;color:#6b7280;padding:20px;">暂无用户</p>';
            return;
        }
        let html = '';
        users.forEach(u => {
            const roleBadge = u.role === 'admin'
                ? '<span class="user-role-badge admin">管理员</span>'
                : '<span class="user-role-badge user">普通用户</span>';
            const isSelf = state.currentUser && u.username === state.currentUser.username;
            html += `
                <div class="user-list-item">
                    <div class="user-list-info">
                        <div class="user-list-name">${escapeHtml(u.display_name || u.username)} ${roleBadge} ${isSelf ? '<span style="color:#6b7280;font-size:12px;">（当前用户）</span>' : ''}</div>
                        <div class="user-list-detail">用户名: ${escapeHtml(u.username)}</div>
                    </div>
                    <div class="user-list-actions">
                        <button class="btn btn-cancel" data-edit-user="${u.id}">编辑</button>
                        ${isSelf ? '' : `<button class="btn btn-danger" data-delete-user="${u.id}">删除</button>`}
                    </div>
                </div>
            `;
        });
        dom.userList.innerHTML = html;
    }

    let editingUserId = null;

    async function submitUserForm() {
        const username = dom.formUsername.value.trim();
        const displayName = dom.formDisplayName.value.trim();
        const password = dom.formPassword.value;
        const role = dom.formRole.value;

        if (!username) { showToast('请输入用户名', 'error'); return; }
        if (!editingUserId && !password) { showToast('请输入密码', 'error'); return; }

        try {
            if (editingUserId) {
                const payload = { display_name: displayName, role };
                if (password) payload.password = password;
                await api.put(CONFIG.apiBase + '/users/' + editingUserId, payload);
                showToast('用户已更新', 'success');
            } else {
                await api.post(CONFIG.apiBase + '/users', { username, password, display_name: displayName, role });
                showToast('用户已添加', 'success');
            }
            resetUserForm();
            loadUsers();
        } catch (err) {
            showToast('操作失败: ' + err.message, 'error');
        }
    }

    function resetUserForm() {
        editingUserId = null;
        dom.formUsername.value = '';
        dom.formDisplayName.value = '';
        dom.formPassword.value = '';
        dom.formRole.value = 'user';
        dom.formUsername.disabled = false;
        dom.userFormSubmit.textContent = '添加用户';
        dom.userFormCancel.style.display = 'none';
    }

    async function changePassword() {
        const oldPwd = dom.pwdOld.value || '';
        const newPwd = dom.pwdNew.value;
        const confirmPwd = dom.pwdConfirm.value;
        if (!newPwd) { showToast('请输入新密码', 'error'); return; }
        if (newPwd.length < 4) { showToast('新密码长度至少为 4 位', 'error'); return; }
        if (newPwd !== confirmPwd) { showToast('两次输入的密码不一致', 'error'); return; }
        try {
            // 调用独立改密接口（普通用户可用），强制改密（初始密码）时免填原密码
            const data = await api.post(CONFIG.apiBase + '/change-password', {
                old_password: oldPwd,
                new_password: newPwd,
            });
            if (!data || !data.success) {
                throw new Error((data && data.error) || '修改密码失败');
            }
            showToast('密码已修改', 'success');
            if (state.currentUser) state.currentUser.must_change_password = false;
            _forcePasswordChange = false;
            dom.changePwdModal.style.display = 'none';
            dom.pwdOld.value = '';
            dom.pwdNew.value = '';
            dom.pwdConfirm.value = '';
            if (state.authToken) loadTableData();
        } catch (err) {
            showToast('修改失败: ' + err.message, 'error');
        }
    }

    /* ============ 下拉选项管理 ============ */

    function getTableList() {
        // 从侧边栏标签读取全部表
        const tables = [];
        document.querySelectorAll('.tab-item').forEach(item => {
            const name = item.dataset.table;
            const label = item.dataset.name;
            if (name) tables.push({ name, label: label || name });
        });
        return tables;
    }

    function loadDropdownTables() {
        const tables = getTableList();
        let html = '<option value="">请选择表</option>';
        tables.forEach(t => {
            html += `<option value="${escapeHtml(t.name)}">${escapeHtml(t.label)}</option>`;
        });
        dom.ddTableSelect.innerHTML = html;
        dom.ddFieldSelect.innerHTML = '<option value="">请先选择表</option>';
        dom.ddOptionList.innerHTML = '';
    }

    async function loadDropdownFields(tableName) {
        if (!tableName) {
            dom.ddFieldSelect.innerHTML = '<option value="">请先选择表</option>';
            dom.ddOptionList.innerHTML = '';
            return;
        }
        dom.ddFieldSelect.innerHTML = '<option value="">加载中...</option>';
        dom.ddOptionList.innerHTML = '';
        try {
            const result = await api.get(`${CONFIG.apiBase}/columns/${tableName}`);
            let columns = result;
            let dropdowns = {};
            if (result && Array.isArray(result.columns)) columns = result.columns;
            else if (result && Array.isArray(result.data)) columns = result.data;
            else if (result && result.data && Array.isArray(result.data.columns)) columns = result.data.columns;
            else if (result && Array.isArray(result.fields)) columns = result.fields;
            if (result && result.dropdowns) dropdowns = result.dropdowns;

            // 加载所有可见字段（包括非下拉字段），标记哪些已有下拉选项
            const allFields = [];
            if (Array.isArray(columns)) {
                columns.forEach(col => {
                    const key = col.key || col.name || col.field;
                    const isHidden = col.hidden || col.is_hidden;
                    if (!key || isHidden) return;
                    const hasDropdown = (col.options && Array.isArray(col.options) && col.options.length > 0)
                        || (key && dropdowns[key]);
                    allFields.push({
                        key,
                        label: col.label || col.title || col.name_cn || col.name || key,
                        hasDropdown: !!hasDropdown,
                    });
                });
            }

            if (allFields.length === 0) {
                dom.ddFieldSelect.innerHTML = '<option value="">该表无可编辑字段</option>';
            } else {
                let html = '<option value="">请选择字段</option>';
                allFields.forEach(f => {
                    const label = f.hasDropdown ? f.label : `${f.label} (非下拉)`;
                    html += `<option value="${escapeHtml(f.key)}">${escapeHtml(label)}</option>`;
                });
                dom.ddFieldSelect.innerHTML = html;
            }
        } catch (err) {
            dom.ddFieldSelect.innerHTML = '<option value="">加载失败</option>';
            showToast('加载字段列表失败: ' + err.message, 'error');
        }
    }

    async function loadDropdownOptions(tableName, fieldKey) {
        if (!tableName || !fieldKey) {
            dom.ddOptionList.innerHTML = '';
            return;
        }
        dom.ddOptionList.innerHTML = '<p style="text-align:center;color:#6b7280;padding:20px;">加载中...</p>';
        try {
            const result = await api.get(`${CONFIG.apiBase}/dropdowns/${encodeURIComponent(tableName)}`);
            // 兼容多种返回格式
            let options = [];
            if (Array.isArray(result)) {
                options = result;
            } else if (result && Array.isArray(result.options)) {
                options = result.options;
            } else if (result && result.data && Array.isArray(result.data.options)) {
                options = result.data.options;
            } else if (result && result.data && Array.isArray(result.data)) {
                options = result.data;
            } else if (result && result.data && typeof result.data === 'object' && Array.isArray(result.data[fieldKey])) {
                // 格式: { data: { field_key: ["选项1", "选项2", ...] } }
                options = result.data[fieldKey];
            } else if (result && result.dropdowns) {
                // dropdowns 是按字段分组的对象
                const fieldOpts = result.dropdowns[fieldKey];
                if (Array.isArray(fieldOpts)) options = fieldOpts;
            } else if (result && result.options && result.options[fieldKey]) {
                options = result.options[fieldKey];
            }

            // 过滤出当前字段的选项（若返回的是全部字段的选项）
            const fieldOptions = options.filter(opt => {
                if (!opt) return false;
                const optField = opt.field_key || opt.field || opt.table_field;
                if (optField && optField !== fieldKey) return false;
                return true;
            }).map(opt => {
                if (typeof opt === 'object') {
                    return {
                        id: opt.id !== undefined ? opt.id : opt.value,
                        value: opt.value !== undefined ? opt.value : (opt.label !== undefined ? opt.label : opt.option_value),
                        label: opt.label !== undefined ? opt.label : (opt.value !== undefined ? opt.value : opt.option_value),
                    };
                }
                return { id: opt, value: opt, label: opt };
            });

            if (fieldOptions.length === 0) {
                dom.ddOptionList.innerHTML = '<p style="text-align:center;color:#6b7280;padding:20px;">暂无选项，请在上方添加</p>';
                return;
            }

            let html = '';
            fieldOptions.forEach(opt => {
                html += `
                    <div class="dd-option-item">
                        <span class="dd-option-value">${escapeHtml(opt.label)}</span>
                        <button class="btn btn-delete dd-option-delete" data-dd-id="${escapeHtml(String(opt.id))}">删除</button>
                    </div>
                `;
            });
            dom.ddOptionList.innerHTML = html;
        } catch (err) {
            dom.ddOptionList.innerHTML = '<p style="text-align:center;color:#ef4444;padding:20px;">加载失败: ' + escapeHtml(err.message) + '</p>';
        }
    }

    async function addDropdownOption() {
        const tableName = dom.ddTableSelect.value;
        const fieldKey = dom.ddFieldSelect.value;
        const optionValue = dom.ddOptionValue.value.trim();
        if (!tableName) { showToast('请选择表', 'error'); return; }
        if (!fieldKey) { showToast('请选择字段', 'error'); return; }
        if (!optionValue) { showToast('请输入选项值', 'error'); return; }

        try {
            await api.post(`${CONFIG.apiBase}/dropdowns`, {
                table_name: tableName,
                field_key: fieldKey,
                option_value: optionValue,
            });
            showToast('选项已添加', 'success');
            dom.ddOptionValue.value = '';
            // 刷新选项列表
            await loadDropdownOptions(tableName, fieldKey);
        } catch (err) {
            showToast('添加失败: ' + err.message, 'error');
        }
    }

    async function deleteDropdownOption(optionId) {
        try {
            await api.delete(`${CONFIG.apiBase}/dropdowns/${encodeURIComponent(optionId)}`);
            showToast('选项已删除', 'success');
            // 刷新选项列表
            const tableName = dom.ddTableSelect.value;
            const fieldKey = dom.ddFieldSelect.value;
            await loadDropdownOptions(tableName, fieldKey);
        } catch (err) {
            showToast('删除失败: ' + err.message, 'error');
        }
    }

    function openDropdownManageModal() {
        dom.dropdownManageModal.style.display = 'flex';
        dom.ddOptionValue.value = '';
        loadDropdownTables();
    }

    function closeDropdownManageModal() {
        dom.dropdownManageModal.style.display = 'none';
    }

    /* ============ 表头列管理 ============ */

    function openColumnManageModal() {
        dom.columnManageModal.style.display = 'flex';
        dom.colNameInput.value = '';
        dom.colTypeSelect.value = 'string';
        dom.colDropdownSelect.value = '否';
        if (dom.colPositionSelect) dom.colPositionSelect.innerHTML = '<option value="">末尾</option>';
        // 加载表列表
        const tables = getTableList();
        let html = '<option value="">请选择表</option>';
        tables.forEach(t => {
            html += `<option value="${escapeHtml(t.name)}">${escapeHtml(t.label)}</option>`;
        });
        dom.colTableSelect.innerHTML = html;
        dom.colList.innerHTML = '';
    }

    async function loadAllColumns(tableName) {
        if (!tableName) {
            dom.colList.innerHTML = '';
            if (dom.colPositionSelect) dom.colPositionSelect.innerHTML = '<option value="">末尾</option>';
            return;
        }
        dom.colList.innerHTML = '<p style="text-align:center;color:#6b7280;padding:20px;">加载中...</p>';
        try {
            const result = await api.get(`${CONFIG.apiBase}/columns/all/${encodeURIComponent(tableName)}`);
            let allColumns = [];
            if (Array.isArray(result)) {
                allColumns = result;
            } else if (result && Array.isArray(result.columns)) {
                allColumns = result.columns;
            } else if (result && Array.isArray(result.data)) {
                allColumns = result.data;
            } else if (result && result.data && Array.isArray(result.data.columns)) {
                allColumns = result.data.columns;
            }

            // 更新位置下拉框
            if (dom.colPositionSelect) {
                let posHtml = '<option value="">末尾</option>';
                allColumns.forEach(col => {
                    if (col.is_hidden) return;
                    const name = col.name_cn || col.field_name_cn || col.key || '';
                    const key = col.key || col.field_key || '';
                    if (key) posHtml += `<option value="${escapeHtml(key)}">${escapeHtml(name)}</option>`;
                });
                dom.colPositionSelect.innerHTML = posHtml;
            }

            // 渲染列列表
            if (allColumns.length === 0) {
                dom.colList.innerHTML = '<p style="text-align:center;color:#6b7280;padding:20px;">暂无列信息</p>';
                return;
            }

            let html = '';
            allColumns.forEach((col, idx) => {
                const key = col.key || col.field_key || '';
                const name = col.name_cn || col.field_name_cn || key || '';
                const type = col.type || col.field_type || 'string';
                const isBase = col.is_base === true;
                const isCustom = col.is_custom === true;
                const isHidden = col.is_hidden === true;
                const isSystem = col.is_system === true;
                const isDropdown = col.is_dropdown === true || col.is_dropdown === '是' || col.is_dropdown === 1;
                const colId = col.id !== undefined ? col.id : '';

                const badges = [];
                badges.push(`<span class="col-badge col-badge-type">${escapeHtml(type)}</span>`);
                if (isDropdown) badges.push('<span class="col-badge col-badge-dropdown">下拉</span>');
                if (isBase) badges.push('<span class="col-badge" style="background:#e0e7ff;color:#3730a3;">基础</span>');
                if (isCustom) badges.push('<span class="col-badge" style="background:#dcfce7;color:#166534;">自定义</span>');
                if (isSystem) badges.push('<span class="col-badge" style="background:#fee2e2;color:#991b1b;">系统</span>');

                const isRenamed = col.is_renamed === true;
                const originalName = col.original_name_cn || '';

                let actions = '';
                if (isHidden) {
                    // 已隐藏的基础列 -> 显示恢复按钮
                    actions = `<button class="btn btn-primary" style="padding:4px 12px;font-size:12px;" data-restore-col="${escapeHtml(key)}" data-table-name="${escapeHtml(tableName)}">恢复</button>`;
                } else if (isCustom) {
                    // 自定义列 -> 删除 + 重命名
                    actions = `<button class="btn btn-danger" style="padding:4px 12px;font-size:12px;" data-delete-col="${escapeHtml(String(colId))}">删除</button>`;
                } else if (isBase && !isSystem) {
                    // 基础列（非系统）-> 隐藏
                    actions = `<button class="btn btn-warning" style="padding:4px 12px;font-size:12px;background:#f59e0b;color:white;border:none;" data-hide-col="${escapeHtml(key)}" data-table-name="${escapeHtml(tableName)}">隐藏</button>`;
                } else if (isSystem) {
                    actions = '<span style="color:#9ca3af;font-size:12px;">不可操作</span>';
                }

                // 所有非隐藏列都显示重命名按钮（系统列除外）
                if (!isHidden && !isSystem) {
                    if (isRenamed) {
                        // 已重命名的列显示重命名+恢复原名
                        actions = `<button class="btn" style="padding:4px 10px;font-size:12px;background:#6366f1;color:white;border:none;" data-rename-col="${escapeHtml(key)}" data-table-name="${escapeHtml(tableName)}">重命名</button>` +
                                  `<button class="btn" style="padding:4px 10px;font-size:12px;background:#6b7280;color:white;border:none;margin-left:4px;" data-reset-name-col="${escapeHtml(key)}" data-table-name="${escapeHtml(tableName)}">原名</button>` +
                                  (isCustom ? `<button class="btn btn-danger" style="padding:4px 12px;font-size:12px;margin-left:4px;" data-delete-col="${escapeHtml(String(colId))}">删除</button>` : '') +
                                  (isBase && !isSystem ? `<button class="btn btn-warning" style="padding:4px 10px;font-size:12px;background:#f59e0b;color:white;border:none;margin-left:4px;" data-hide-col="${escapeHtml(key)}" data-table-name="${escapeHtml(tableName)}">隐藏</button>` : '');
                    } else {
                        actions = `<button class="btn" style="padding:4px 10px;font-size:12px;background:#6366f1;color:white;border:none;" data-rename-col="${escapeHtml(key)}" data-table-name="${escapeHtml(tableName)}">重命名</button>` + actions;
                    }
                }

                const opacity = isHidden ? 'opacity:0.5;' : '';
                const hiddenTag = isHidden ? ' <span style="color:#ef4444;font-size:11px;">[已隐藏]</span>' : '';
                const renamedTag = isRenamed ? ` <span style="color:#6366f1;font-size:11px;" title="原名: ${escapeHtml(originalName)}">[已重命名]</span>` : '';

                html += `
                    <div class="col-list-item" style="${opacity}">
                        <div class="col-list-info">
                            <div class="col-list-name" data-col-name="${escapeHtml(key)}">${escapeHtml(name)}${hiddenTag}${renamedTag}
                                ${badges.join('')}
                            </div>
                            <div class="col-list-detail">字段: ${escapeHtml(key)}${isRenamed ? ' / 原名: ' + escapeHtml(originalName) : ''}</div>
                        </div>
                        <div class="user-list-actions">${actions}</div>
                    </div>
                `;
            });
            dom.colList.innerHTML = html;
        } catch (err) {
            dom.colList.innerHTML = '<p style="text-align:center;color:#ef4444;padding:20px;">加载失败: ' + escapeHtml(err.message) + '</p>';
        }
    }

    async function hideBaseColumn(tableName, fieldKey) {
        const confirmed = await confirmDialog('确认隐藏', `确定要隐藏列「${fieldKey}」吗？\n隐藏后该列将从表格中移除，但数据仍保留，可随时恢复。`);
        if (!confirmed) return;
        try {
            await api.post(`${CONFIG.apiBase}/columns/hide`, { table_name: tableName, field_key: fieldKey });
            showToast('列已隐藏', 'success');
            await loadAllColumns(tableName);
            if (state.currentTable === tableName) {
                await loadColumns(tableName);
                renderTable();
            }
        } catch (err) {
            showToast('隐藏失败: ' + err.message, 'error');
        }
    }

    async function restoreBaseColumn(tableName, fieldKey) {
        try {
            await api.post(`${CONFIG.apiBase}/columns/restore`, { table_name: tableName, field_key: fieldKey });
            showToast('列已恢复', 'success');
            await loadAllColumns(tableName);
            if (state.currentTable === tableName) {
                await loadColumns(tableName);
                renderTable();
            }
        } catch (err) {
            showToast('恢复失败: ' + err.message, 'error');
        }
    }

    function startInlineRename(tableName, fieldKey, btnEl) {
        const colItem = btnEl.closest('.col-list-item');
        const nameDiv = colItem.querySelector('.col-list-name');
        // 获取纯文本名称（排除徽章span的文本）
        const nameText = nameDiv.firstChild;
        let currentName = '';
        if (nameText && nameText.nodeType === Node.TEXT_NODE) {
            currentName = nameText.textContent.trim();
        } else {
            // 回退：取整个文本内容并清理
            currentName = nameDiv.textContent.replace(/\[已隐藏\]|\[已重命名\]/g, '').trim();
        }

        // 创建内联编辑输入框
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentName;
        input.style.cssText = 'width:200px;padding:4px 8px;font-size:13px;border:1px solid #6366f1;border-radius:4px;';

        const saveBtn = document.createElement('button');
        saveBtn.textContent = '保存';
        saveBtn.style.cssText = 'padding:4px 10px;font-size:12px;background:#6366f1;color:white;border:none;border-radius:4px;margin-left:4px;cursor:pointer;';

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = '取消';
        cancelBtn.style.cssText = 'padding:4px 10px;font-size:12px;background:#6b7280;color:white;border:none;border-radius:4px;margin-left:4px;cursor:pointer;';

        // 保存原始内容
        const originalHTML = nameDiv.innerHTML;

        nameDiv.innerHTML = '';
        nameDiv.appendChild(input);
        nameDiv.appendChild(saveBtn);
        nameDiv.appendChild(cancelBtn);
        input.focus();
        input.select();

        const doSave = async () => {
            const newName = input.value.trim();
            if (!newName) {
                showToast('名称不能为空', 'error');
                return;
            }
            if (newName === currentName) {
                nameDiv.innerHTML = originalHTML;
                return;
            }
            try {
                await api.post(`${CONFIG.apiBase}/columns/rename`, {
                    table_name: tableName,
                    field_key: fieldKey,
                    custom_name: newName,
                });
                showToast('重命名成功', 'success');
                await loadAllColumns(tableName);
                if (state.currentTable === tableName) {
                    await loadColumns(tableName);
                    renderTable();
                }
            } catch (err) {
                showToast('重命名失败: ' + err.message, 'error');
                nameDiv.innerHTML = originalHTML;
            }
        };

        saveBtn.addEventListener('click', doSave);
        cancelBtn.addEventListener('click', () => { nameDiv.innerHTML = originalHTML; });
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') doSave();
            else if (e.key === 'Escape') nameDiv.innerHTML = originalHTML;
        });
    }

    async function resetColumnName(tableName, fieldKey) {
        const confirmed = await confirmDialog('确认恢复原名', '确定要恢复该列的原始名称吗？');
        if (!confirmed) return;
        try {
            await api.delete(`${CONFIG.apiBase}/columns/rename`, {
                table_name: tableName,
                field_key: fieldKey,
            });
            showToast('已恢复原始名称', 'success');
            await loadAllColumns(tableName);
            if (state.currentTable === tableName) {
                await loadColumns(tableName);
                renderTable();
            }
        } catch (err) {
            showToast('恢复失败: ' + err.message, 'error');
        }
    }

    async function addCustomColumn() {
        const tableName = dom.colTableSelect.value;
        const colName = dom.colNameInput.value.trim();
        const colType = dom.colTypeSelect.value;
        const isDropdown = dom.colDropdownSelect.value;
        const afterField = dom.colPositionSelect ? dom.colPositionSelect.value : '';

        if (!tableName) { showToast('请选择表', 'error'); return; }
        if (!colName) { showToast('请输入列名称', 'error'); return; }

        try {
            await api.post(`${CONFIG.apiBase}/custom-columns`, {
                table_name: tableName,
                column_name: colName,
                column_type: colType,
                is_dropdown: isDropdown,
                after_field: afterField || undefined,
            });
            showToast('列添加成功', 'success');
            dom.colNameInput.value = '';
            // 刷新列信息和列列表
            await loadAllColumns(tableName);
            // 如果当前正在查看该表，刷新列定义
            if (state.currentTable === tableName) {
                await loadColumns(tableName);
                renderTable();
            }
        } catch (err) {
            showToast('添加列失败: ' + err.message, 'error');
        }
    }

    async function deleteCustomColumn(colId) {
        const tableName = dom.colTableSelect.value;
        const confirmed = await confirmDialog('确认删除', '确定要删除此自定义列吗？该列的数据将被清除，此操作不可撤销。');
        if (!confirmed) return;
        try {
            await api.delete(`${CONFIG.apiBase}/custom-columns/${encodeURIComponent(colId)}`);
            showToast('列已删除', 'success');
            // 刷新列列表
            await loadAllColumns(tableName);
            // 如果当前正在查看该表，刷新列定义
            if (state.currentTable === tableName) {
                await loadColumns(tableName);
                renderTable();
            }
        } catch (err) {
            showToast('删除失败: ' + err.message, 'error');
        }
    }

    /* ============ 初始化 ============ */
    async function init() {
        cacheDom();
        bindEvents();

        // 设置默认页大小
        state.pageSize = parseInt(dom.pageSizeSelect.value, 10) || CONFIG.defaultPageSize;

        // 初始 API 状态
        setApiStatus('offline', '正在连接...');

        // 检查认证状态
        const authed = await checkAuth();
        if (authed) {
            showMainApp();
            loadTableData();
            // 显示从其他页面跳转带来的提示消息
            const params = new URLSearchParams(window.location.search);
            const msg = params.get('msg');
            if (msg) {
                showToast(msg, 'warning', 4000);
                // 清除URL中的msg参数，避免刷新时重复显示
                const url = new URL(window.location.href);
                url.searchParams.delete('msg');
                window.history.replaceState({}, document.title, url.toString());
            }
        } else {
            showLogin();
        }
    }

    // DOM 就绪后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
