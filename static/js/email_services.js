/**
 * 邮箱服务页面 JavaScript
 */

// 状态
let outlookServices = [];
let customServices = [];
let selectedOutlook = new Set();
let selectedCustom = new Set();

// DOM 元素
const elements = {
    // 统计
    outlookCount: document.getElementById('outlook-count'),
    customCount: document.getElementById('custom-count'),
    tempmailStatus: document.getElementById('tempmail-status'),
    totalEnabled: document.getElementById('total-enabled'),

    // Outlook 导入
    toggleOutlookImport: document.getElementById('toggle-outlook-import'),
    outlookImportBody: document.getElementById('outlook-import-body'),
    outlookImportData: document.getElementById('outlook-import-data'),
    outlookImportEnabled: document.getElementById('outlook-import-enabled'),
    outlookImportPriority: document.getElementById('outlook-import-priority'),
    outlookImportBtn: document.getElementById('outlook-import-btn'),
    clearImportBtn: document.getElementById('clear-import-btn'),
    importResult: document.getElementById('import-result'),

    // Outlook 列表
    outlookTable: document.getElementById('outlook-accounts-table'),
    selectAllOutlook: document.getElementById('select-all-outlook'),
    batchDeleteOutlookBtn: document.getElementById('batch-delete-outlook-btn'),

    // 自定义域名
    customTable: document.getElementById('custom-services-table'),
    addCustomBtn: document.getElementById('add-custom-btn'),
    selectAllCustom: document.getElementById('select-all-custom'),

    // 临时邮箱
    tempmailForm: document.getElementById('tempmail-form'),
    tempmailApi: document.getElementById('tempmail-api'),
    tempmailEnabled: document.getElementById('tempmail-enabled'),
    testTempmailBtn: document.getElementById('test-tempmail-btn'),

    // 添加自定义域名模态框
    addCustomModal: document.getElementById('add-custom-modal'),
    addCustomForm: document.getElementById('add-custom-form'),
    closeCustomModal: document.getElementById('close-custom-modal'),
    cancelAddCustom: document.getElementById('cancel-add-custom'),

    // 编辑自定义域名模态框
    editCustomModal: document.getElementById('edit-custom-modal'),
    editCustomForm: document.getElementById('edit-custom-form'),
    closeEditCustomModal: document.getElementById('close-edit-custom-modal'),
    cancelEditCustom: document.getElementById('cancel-edit-custom'),

    // 编辑 Outlook 模态框
    editOutlookModal: document.getElementById('edit-outlook-modal'),
    editOutlookForm: document.getElementById('edit-outlook-form'),
    closeEditOutlookModal: document.getElementById('close-edit-outlook-modal'),
    cancelEditOutlook: document.getElementById('cancel-edit-outlook'),

    // Temp-Mail 服务
    tempMailTable: document.getElementById('tempmail-services-table'),
    addTempMailBtn: document.getElementById('add-tempmail-btn'),
    addTempMailModal: document.getElementById('add-tempmail-modal'),
    addTempMailForm: document.getElementById('add-tempmail-form'),
    closeAddTempMailModal: document.getElementById('close-add-tempmail-modal'),
    cancelAddTempMail: document.getElementById('cancel-add-tempmail'),
    editTempMailModal: document.getElementById('edit-tempmail-modal'),
    editTempMailForm: document.getElementById('edit-tempmail-form'),
    closeEditTempMailModal: document.getElementById('close-edit-tempmail-modal'),
    cancelEditTempMail: document.getElementById('cancel-edit-tempmail')
};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    loadStats();
    loadOutlookServices();
    loadCustomServices();
    loadTempMailServices();
    loadTempmailConfig();
    initEventListeners();
});

// 事件监听
function initEventListeners() {
    // Outlook 导入展开/收起
    elements.toggleOutlookImport.addEventListener('click', () => {
        const isHidden = elements.outlookImportBody.style.display === 'none';
        elements.outlookImportBody.style.display = isHidden ? 'block' : 'none';
        elements.toggleOutlookImport.textContent = isHidden ? '收起' : '展开';
    });

    // Outlook 导入
    elements.outlookImportBtn.addEventListener('click', handleOutlookImport);
    elements.clearImportBtn.addEventListener('click', () => {
        elements.outlookImportData.value = '';
        elements.importResult.style.display = 'none';
    });

    // Outlook 全选
    elements.selectAllOutlook.addEventListener('change', (e) => {
        const checkboxes = elements.outlookTable.querySelectorAll('input[type="checkbox"][data-id]');
        checkboxes.forEach(cb => {
            cb.checked = e.target.checked;
            const id = parseInt(cb.dataset.id);
            if (e.target.checked) {
                selectedOutlook.add(id);
            } else {
                selectedOutlook.delete(id);
            }
        });
        updateBatchButtons();
    });

    // Outlook 批量删除
    elements.batchDeleteOutlookBtn.addEventListener('click', handleBatchDeleteOutlook);

    // 添加自定义域名
    elements.addCustomBtn.addEventListener('click', () => {
        elements.addCustomModal.classList.add('active');
    });

    elements.closeCustomModal.addEventListener('click', () => {
        elements.addCustomModal.classList.remove('active');
    });

    elements.cancelAddCustom.addEventListener('click', () => {
        elements.addCustomModal.classList.remove('active');
    });

    elements.addCustomForm.addEventListener('submit', handleAddCustom);

    // 编辑自定义域名模态框
    elements.closeEditCustomModal.addEventListener('click', () => {
        elements.editCustomModal.classList.remove('active');
    });

    elements.cancelEditCustom.addEventListener('click', () => {
        elements.editCustomModal.classList.remove('active');
    });

    elements.editCustomForm.addEventListener('submit', handleEditCustom);

    // 编辑 Outlook 模态框
    elements.closeEditOutlookModal.addEventListener('click', () => {
        elements.editOutlookModal.classList.remove('active');
    });

    elements.cancelEditOutlook.addEventListener('click', () => {
        elements.editOutlookModal.classList.remove('active');
    });

    elements.editOutlookForm.addEventListener('submit', handleEditOutlook);

    // 自定义域名全选
    elements.selectAllCustom.addEventListener('change', (e) => {
        const checkboxes = elements.customTable.querySelectorAll('input[type="checkbox"][data-id]');
        checkboxes.forEach(cb => {
            cb.checked = e.target.checked;
            const id = parseInt(cb.dataset.id);
            if (e.target.checked) {
                selectedCustom.add(id);
            } else {
                selectedCustom.delete(id);
            }
        });
    });

    // 临时邮箱配置
    elements.tempmailForm.addEventListener('submit', handleSaveTempmail);
    elements.testTempmailBtn.addEventListener('click', handleTestTempmail);

    // Temp-Mail 服务
    elements.addTempMailBtn.addEventListener('click', () => {
        elements.addTempMailModal.classList.add('active');
    });
    elements.closeAddTempMailModal.addEventListener('click', () => {
        elements.addTempMailModal.classList.remove('active');
    });
    elements.cancelAddTempMail.addEventListener('click', () => {
        elements.addTempMailModal.classList.remove('active');
    });
    elements.addTempMailForm.addEventListener('submit', handleAddTempMail);

    elements.closeEditTempMailModal.addEventListener('click', () => {
        elements.editTempMailModal.classList.remove('active');
    });
    elements.cancelEditTempMail.addEventListener('click', () => {
        elements.editTempMailModal.classList.remove('active');
    });
    elements.editTempMailForm.addEventListener('submit', handleEditTempMail);
}

// 加载统计信息
async function loadStats() {
    try {
        const data = await api.get('/email-services/stats');
        elements.outlookCount.textContent = data.outlook_count || 0;
        elements.customCount.textContent = data.custom_count || 0;
        elements.tempmailStatus.textContent = data.tempmail_available ? '可用' : '不可用';
        elements.totalEnabled.textContent = data.enabled_count || 0;
    } catch (error) {
        console.error('加载统计信息失败:', error);
    }
}

// 加载 Outlook 服务
async function loadOutlookServices() {
    try {
        const data = await api.get('/email-services?service_type=outlook');
        outlookServices = data.services || [];

        if (outlookServices.length === 0) {
            elements.outlookTable.innerHTML = `
                <tr>
                    <td colspan="7">
                        <div class="empty-state">
                            <div class="empty-state-icon">📭</div>
                            <div class="empty-state-title">暂无 Outlook 账户</div>
                            <div class="empty-state-description">请使用上方导入功能添加账户</div>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        elements.outlookTable.innerHTML = outlookServices.map(service => `
            <tr data-id="${service.id}">
                <td>
                    <input type="checkbox" data-id="${service.id}"
                        ${selectedOutlook.has(service.id) ? 'checked' : ''}>
                </td>
                <td>${escapeHtml(service.config?.email || service.name)}</td>
                <td>
                    <span class="status-badge ${service.config?.has_oauth ? 'active' : 'pending'}">
                        ${service.config?.has_oauth ? 'OAuth' : '密码'}
                    </span>
                </td>
                <td>
                    <span class="status-badge ${service.enabled ? 'active' : 'disabled'}">
                        ${service.enabled ? '启用' : '禁用'}
                    </span>
                </td>
                <td>${service.priority}</td>
                <td>${format.date(service.last_used)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-ghost btn-sm" onclick="editOutlookService(${service.id})" title="编辑">
                            ✏️
                        </button>
                        <button class="btn btn-ghost btn-sm" onclick="toggleService(${service.id}, ${!service.enabled})" title="${service.enabled ? '禁用' : '启用'}">
                            ${service.enabled ? '🔇' : '🔊'}
                        </button>
                        <button class="btn btn-ghost btn-sm" onclick="testService(${service.id})" title="测试">
                            🔌
                        </button>
                        <button class="btn btn-ghost btn-sm" onclick="deleteService(${service.id}, '${escapeHtml(service.name)}')" title="删除">
                            🗑️
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        // 绑定复选框事件
        elements.outlookTable.querySelectorAll('input[type="checkbox"][data-id]').forEach(cb => {
            cb.addEventListener('change', (e) => {
                const id = parseInt(e.target.dataset.id);
                if (e.target.checked) {
                    selectedOutlook.add(id);
                } else {
                    selectedOutlook.delete(id);
                }
                updateBatchButtons();
            });
        });

    } catch (error) {
        console.error('加载 Outlook 服务失败:', error);
        elements.outlookTable.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="empty-state">
                        <div class="empty-state-icon">❌</div>
                        <div class="empty-state-title">加载失败</div>
                    </div>
                </td>
            </tr>
        `;
    }
}

// 加载自定义域名服务
async function loadCustomServices() {
    try {
        const data = await api.get('/email-services?service_type=custom_domain');
        customServices = data.services || [];

        if (customServices.length === 0) {
            elements.customTable.innerHTML = `
                <tr>
                    <td colspan="7">
                        <div class="empty-state">
                            <div class="empty-state-icon">📭</div>
                            <div class="empty-state-title">暂无自定义域名服务</div>
                            <div class="empty-state-description">点击"添加服务"按钮创建新服务</div>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        elements.customTable.innerHTML = customServices.map(service => `
            <tr data-id="${service.id}">
                <td>
                    <input type="checkbox" data-id="${service.id}"
                        ${selectedCustom.has(service.id) ? 'checked' : ''}>
                </td>
                <td>${escapeHtml(service.name)}</td>
                <td style="font-size: 0.75rem;">${escapeHtml(service.config?.base_url || '-')}</td>
                <td>
                    <span class="status-badge ${service.enabled ? 'active' : 'disabled'}">
                        ${service.enabled ? '启用' : '禁用'}
                    </span>
                </td>
                <td>${service.priority}</td>
                <td>${format.date(service.last_used)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-ghost btn-sm" onclick="editCustomService(${service.id})" title="编辑">
                            ✏️
                        </button>
                        <button class="btn btn-ghost btn-sm" onclick="toggleService(${service.id}, ${!service.enabled})" title="${service.enabled ? '禁用' : '启用'}">
                            ${service.enabled ? '🔇' : '🔊'}
                        </button>
                        <button class="btn btn-ghost btn-sm" onclick="testService(${service.id})" title="测试">
                            🔌
                        </button>
                        <button class="btn btn-ghost btn-sm" onclick="deleteService(${service.id}, '${escapeHtml(service.name)}')" title="删除">
                            🗑️
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        // 绑定复选框事件
        elements.customTable.querySelectorAll('input[type="checkbox"][data-id]').forEach(cb => {
            cb.addEventListener('change', (e) => {
                const id = parseInt(e.target.dataset.id);
                if (e.target.checked) {
                    selectedCustom.add(id);
                } else {
                    selectedCustom.delete(id);
                }
            });
        });

    } catch (error) {
        console.error('加载自定义域名服务失败:', error);
    }
}

// 加载临时邮箱配置
async function loadTempmailConfig() {
    try {
        const settings = await api.get('/settings');
        if (settings.tempmail) {
            elements.tempmailApi.value = settings.tempmail.api_url || '';
            elements.tempmailEnabled.checked = settings.tempmail.enabled !== false;
        }
    } catch (error) {
        // 忽略错误
    }
}

// Outlook 导入
async function handleOutlookImport() {
    const data = elements.outlookImportData.value.trim();
    if (!data) {
        toast.error('请输入导入数据');
        return;
    }

    elements.outlookImportBtn.disabled = true;
    elements.outlookImportBtn.textContent = '导入中...';

    try {
        const result = await api.post('/email-services/outlook/batch-import', {
            data: data,
            enabled: elements.outlookImportEnabled.checked,
            priority: parseInt(elements.outlookImportPriority.value) || 0
        });

        elements.importResult.style.display = 'block';
        elements.importResult.innerHTML = `
            <div class="import-stats">
                <span>✅ 成功导入: <strong>${result.success || 0}</strong></span>
                <span>❌ 失败: <strong>${result.failed || 0}</strong></span>
            </div>
            ${result.errors?.length ? `
                <div class="import-errors" style="margin-top: var(--spacing-sm);">
                    <strong>错误详情：</strong>
                    <ul>
                        ${result.errors.map(e => `<li>${escapeHtml(e)}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
        `;

        if (result.success > 0) {
            toast.success(`成功导入 ${result.success} 个账户`);
            loadOutlookServices();
            loadStats();
            elements.outlookImportData.value = '';
        }

    } catch (error) {
        toast.error('导入失败: ' + error.message);
    } finally {
        elements.outlookImportBtn.disabled = false;
        elements.outlookImportBtn.textContent = '📥 开始导入';
    }
}

// 添加自定义域名服务
async function handleAddCustom(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const data = {
        service_type: 'custom_domain',
        name: formData.get('name'),
        config: {
            base_url: formData.get('api_url'),
            api_key: formData.get('api_key'),
            default_domain: formData.get('domain')
        },
        enabled: formData.get('enabled') === 'on',
        priority: parseInt(formData.get('priority')) || 0
    };

    try {
        await api.post('/email-services', data);
        toast.success('服务添加成功');
        elements.addCustomModal.classList.remove('active');
        e.target.reset();
        loadCustomServices();
        loadStats();
    } catch (error) {
        toast.error('添加失败: ' + error.message);
    }
}

// 切换服务状态
async function toggleService(id, enabled) {
    try {
        await api.patch(`/email-services/${id}`, { enabled });
        toast.success(enabled ? '已启用' : '已禁用');
        loadOutlookServices();
        loadCustomServices();
        loadStats();
    } catch (error) {
        toast.error('操作失败: ' + error.message);
    }
}

// 测试服务
async function testService(id) {
    try {
        const result = await api.post(`/email-services/${id}/test`);
        if (result.success) {
            toast.success('测试成功');
        } else {
            toast.error('测试失败: ' + (result.error || '未知错误'));
        }
    } catch (error) {
        toast.error('测试失败: ' + error.message);
    }
}

// 删除服务
async function deleteService(id, name) {
    const confirmed = await confirm(`确定要删除 "${name}" 吗？`);
    if (!confirmed) return;

    try {
        await api.delete(`/email-services/${id}`);
        toast.success('已删除');
        selectedOutlook.delete(id);
        selectedCustom.delete(id);
        loadOutlookServices();
        loadCustomServices();
        loadStats();
    } catch (error) {
        toast.error('删除失败: ' + error.message);
    }
}

// 批量删除 Outlook
async function handleBatchDeleteOutlook() {
    if (selectedOutlook.size === 0) return;

    const confirmed = await confirm(`确定要删除选中的 ${selectedOutlook.size} 个账户吗？`);
    if (!confirmed) return;

    try {
        const result = await api.request('/email-services/outlook/batch', {
            method: 'DELETE',
            body: Array.from(selectedOutlook)
        });
        toast.success(`成功删除 ${result.deleted || selectedOutlook.size} 个账户`);
        selectedOutlook.clear();
        loadOutlookServices();
        loadStats();
    } catch (error) {
        toast.error('删除失败: ' + error.message);
    }
}

// 保存临时邮箱配置
async function handleSaveTempmail(e) {
    e.preventDefault();

    try {
        await api.post('/settings/tempmail', {
            api_url: elements.tempmailApi.value,
            enabled: elements.tempmailEnabled.checked
        });
        toast.success('配置已保存');
    } catch (error) {
        toast.error('保存失败: ' + error.message);
    }
}

// 测试临时邮箱
async function handleTestTempmail() {
    elements.testTempmailBtn.disabled = true;
    elements.testTempmailBtn.textContent = '测试中...';

    try {
        const result = await api.post('/email-services/test-tempmail', {
            api_url: elements.tempmailApi.value
        });

        if (result.success) {
            toast.success('临时邮箱连接正常');
        } else {
            toast.error('连接失败: ' + (result.error || '未知错误'));
        }
    } catch (error) {
        toast.error('测试失败: ' + error.message);
    } finally {
        elements.testTempmailBtn.disabled = false;
        elements.testTempmailBtn.textContent = '🔌 测试连接';
    }
}

// 更新批量按钮
function updateBatchButtons() {
    const count = selectedOutlook.size;
    elements.batchDeleteOutlookBtn.disabled = count === 0;
    elements.batchDeleteOutlookBtn.textContent = count > 0 ? `🗑️ 删除选中 (${count})` : '🗑️ 批量删除';
}

// HTML 转义
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============== 编辑功能 ==============

// 编辑自定义域名服务
async function editCustomService(id) {
    try {
        // 获取完整的服务详情
        const service = await api.get(`/email-services/${id}/full`);

        // 填充表单
        document.getElementById('edit-custom-id').value = service.id;
        document.getElementById('edit-custom-name').value = service.name || '';
        document.getElementById('edit-custom-api-url').value = service.config?.base_url || '';
        document.getElementById('edit-custom-api-key').value = service.config?.api_key || '';
        document.getElementById('edit-custom-domain').value = service.config?.domain || '';
        document.getElementById('edit-custom-priority').value = service.priority || 0;
        document.getElementById('edit-custom-enabled').checked = service.enabled;

        // 清空密码提示
        document.getElementById('edit-custom-api-key').placeholder = service.config?.has_api_key ? '已设置，留空保持不变' : 'API Key';

        // 显示模态框
        elements.editCustomModal.classList.add('active');

    } catch (error) {
        toast.error('获取服务信息失败: ' + error.message);
    }
}

// 保存编辑自定义域名服务
async function handleEditCustom(e) {
    e.preventDefault();

    const id = document.getElementById('edit-custom-id').value;
    const formData = new FormData(e.target);

    // 构建更新数据
    const updateData = {
        name: formData.get('name'),
        priority: parseInt(formData.get('priority')) || 0,
        enabled: formData.get('enabled') === 'on'
    };

    // 构建配置
    const config = {
        base_url: formData.get('api_url'),
        default_domain: formData.get('domain')
    };

    // 只有在填写了 API Key 时才更新
    const apiKey = formData.get('api_key');
    if (apiKey && apiKey.trim()) {
        config.api_key = apiKey.trim();
    }

    updateData.config = config;

    try {
        await api.patch(`/email-services/${id}`, updateData);
        toast.success('服务更新成功');
        elements.editCustomModal.classList.remove('active');
        loadCustomServices();
        loadStats();
    } catch (error) {
        toast.error('更新失败: ' + error.message);
    }
}

// 编辑 Outlook 服务
async function editOutlookService(id) {
    try {
        // 获取完整的服务详情
        const service = await api.get(`/email-services/${id}/full`);

        // 填充表单
        document.getElementById('edit-outlook-id').value = service.id;
        document.getElementById('edit-outlook-email').value = service.config?.email || service.name || '';
        document.getElementById('edit-outlook-password').value = '';
        document.getElementById('edit-outlook-password').placeholder = service.config?.password ? '已设置，留空保持不变' : '请输入密码';
        document.getElementById('edit-outlook-client-id').value = service.config?.client_id || '';
        document.getElementById('edit-outlook-refresh-token').value = '';
        document.getElementById('edit-outlook-refresh-token').placeholder = service.config?.refresh_token ? '已设置，留空保持不变' : 'OAuth Refresh Token';
        document.getElementById('edit-outlook-priority').value = service.priority || 0;
        document.getElementById('edit-outlook-enabled').checked = service.enabled;

        // 显示模态框
        elements.editOutlookModal.classList.add('active');

    } catch (error) {
        toast.error('获取服务信息失败: ' + error.message);
    }
}

// 保存编辑 Outlook 服务
async function handleEditOutlook(e) {
    e.preventDefault();

    const id = document.getElementById('edit-outlook-id').value;
    const formData = new FormData(e.target);

    // 获取当前服务信息以保留未修改的敏感字段
    let currentService;
    try {
        currentService = await api.get(`/email-services/${id}/full`);
    } catch (error) {
        toast.error('获取服务信息失败');
        return;
    }

    // 构建更新数据
    const updateData = {
        name: formData.get('email'),  // 使用邮箱作为名称
        priority: parseInt(formData.get('priority')) || 0,
        enabled: formData.get('enabled') === 'on'
    };

    // 构建配置，保留未修改的敏感字段
    const config = {
        email: formData.get('email'),
        password: formData.get('password')?.trim() || currentService.config?.password || '',
        client_id: formData.get('client_id')?.trim() || currentService.config?.client_id || '',
        refresh_token: formData.get('refresh_token')?.trim() || currentService.config?.refresh_token || ''
    };

    updateData.config = config;

    try {
        await api.patch(`/email-services/${id}`, updateData);
        toast.success('账户更新成功');
        elements.editOutlookModal.classList.remove('active');
        loadOutlookServices();
        loadStats();
    } catch (error) {
        toast.error('更新失败: ' + error.message);
    }
}


// ============== Temp-Mail 服务功能 ==============

// 加载 Temp-Mail 服务列表
async function loadTempMailServices() {
    try {
        const data = await api.get('/email-services?service_type=temp_mail');
        const services = data.services || [];

        if (services.length === 0) {
            elements.tempMailTable.innerHTML = `
                <tr><td colspan="6">
                    <div class="empty-state" style="padding: var(--spacing-md);">
                        <div class="empty-state-icon">📮</div>
                        <div class="empty-state-title">暂无 Temp-Mail 服务</div>
                        <div class="empty-state-desc">点击「添加服务」配置自部署 Cloudflare Worker 临时邮箱</div>
                    </div>
                </td></tr>
            `;
            return;
        }

        elements.tempMailTable.innerHTML = services.map(service => {
            const config = service.config || {};
            return `
                <tr>
                    <td><strong>${escapeHtml(service.name)}</strong></td>
                    <td style="font-size: 0.8rem; color: var(--text-muted);">${escapeHtml(config.base_url || '-')}</td>
                    <td>${escapeHtml(config.domain || '-')}</td>
                    <td>
                        <span class="status-badge ${service.enabled ? 'completed' : 'disabled'}">
                            ${service.enabled ? '已启用' : '已禁用'}
                        </span>
                    </td>
                    <td>${service.priority || 0}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-ghost btn-sm" onclick="editTempMailService(${service.id})" title="编辑">✏️</button>
                            <button class="btn btn-ghost btn-sm" onclick="testService(${service.id})" title="测试">🔌</button>
                            <button class="btn btn-ghost btn-sm" onclick="toggleService(${service.id}, ${!service.enabled})" title="${service.enabled ? '禁用' : '启用'}">
                                ${service.enabled ? '⏸️' : '▶️'}
                            </button>
                            <button class="btn btn-ghost btn-sm" onclick="deleteService(${service.id})" title="删除">🗑️</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        console.error('加载 Temp-Mail 服务失败:', error);
    }
}

// 添加 Temp-Mail 服务
async function handleAddTempMail(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
        service_type: 'temp_mail',
        name: formData.get('name'),
        config: {
            base_url: formData.get('base_url'),
            admin_password: formData.get('admin_password'),
            domain: formData.get('domain'),
            enable_prefix: true
        },
        enabled: formData.get('enabled') === 'on',
        priority: parseInt(formData.get('priority')) || 0
    };
    try {
        await api.post('/email-services', data);
        toast.success('服务添加成功');
        elements.addTempMailModal.classList.remove('active');
        e.target.reset();
        loadTempMailServices();
        loadStats();
    } catch (error) {
        toast.error('添加失败: ' + error.message);
    }
}

// 编辑 Temp-Mail 服务
async function editTempMailService(id) {
    try {
        const service = await api.get(`/email-services/${id}/full`);
        document.getElementById('edit-tm-id').value = service.id;
        document.getElementById('edit-tm-name').value = service.name || '';
        document.getElementById('edit-tm-base-url').value = service.config?.base_url || '';
        document.getElementById('edit-tm-admin-password').value = '';
        document.getElementById('edit-tm-admin-password').placeholder = service.config?.admin_password ? '已设置，留空保持不变' : '请输入 Admin 密码';
        document.getElementById('edit-tm-domain').value = service.config?.domain || '';
        document.getElementById('edit-tm-priority').value = service.priority || 0;
        document.getElementById('edit-tm-enabled').checked = service.enabled;
        elements.editTempMailModal.classList.add('active');
    } catch (error) {
        toast.error('获取服务信息失败: ' + error.message);
    }
}

// 保存编辑 Temp-Mail 服务
async function handleEditTempMail(e) {
    e.preventDefault();
    const id = document.getElementById('edit-tm-id').value;
    const formData = new FormData(e.target);
    const config = {
        base_url: formData.get('base_url'),
        domain: formData.get('domain'),
        enable_prefix: true
    };
    // 只有填写了密码才更新
    const pwd = formData.get('admin_password');
    if (pwd && pwd.trim()) {
        config.admin_password = pwd.trim();
    }
    const updateData = {
        name: formData.get('name'),
        priority: parseInt(formData.get('priority')) || 0,
        enabled: formData.get('enabled') === 'on',
        config
    };
    try {
        await api.patch(`/email-services/${id}`, updateData);
        toast.success('服务更新成功');
        elements.editTempMailModal.classList.remove('active');
        loadTempMailServices();
        loadStats();
    } catch (error) {
        toast.error('更新失败: ' + error.message);
    }
}
