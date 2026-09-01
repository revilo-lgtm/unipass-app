// ui-alerts.js - Hệ thống Toast & Modal

// Icon Mapping
const iconMap = {
    success: 'fa-check-circle',
    error: 'fa-circle-xmark',
    warning: 'fa-triangle-exclamation',
    info: 'fa-circle-info'
};

const titleMap = {
    success: 'Thành công',
    error: 'Lỗi',
    warning: 'Cảnh báo',
    info: 'Thông báo'
};

// Khởi tạo container cho Toast nếu chưa có
function initToastContainer() {
    let container = document.getElementById('ui-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'ui-toast-container';
        document.body.appendChild(container);
    }
    return container;
}

// Khởi tạo overlay cho Modal nếu chưa có
function initModalOverlay() {
    let overlay = document.getElementById('ui-alert-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'ui-alert-overlay';
        
        const box = document.createElement('div');
        box.className = 'ui-alert-box';
        
        const iconWrapper = document.createElement('div');
        iconWrapper.className = 'ui-alert-icon-wrapper';
        const icon = document.createElement('i');
        icon.className = 'fa-solid';
        iconWrapper.appendChild(icon);
        
        const title = document.createElement('div');
        title.className = 'ui-alert-title';
        
        const message = document.createElement('div');
        message.className = 'ui-alert-message';
        
        const btn = document.createElement('button');
        btn.className = 'ui-alert-btn';
        btn.textContent = 'OK';
        
        box.appendChild(iconWrapper);
        box.appendChild(title);
        box.appendChild(message);
        box.appendChild(btn);
        
        overlay.appendChild(box);
        document.body.appendChild(overlay);
    }
    return overlay;
}

/**
 * Hiển thị Toast Notification (Không chặn luồng)
 * @param {string} message - Nội dung thông báo
 * @param {string} type - 'success', 'error', 'warning', 'info'
 * @param {number} duration - Thời gian hiển thị (ms)
 */
window.showToast = function(message, type = 'info', duration = 4000) {
    const container = initToastContainer();
    
    // Validate type
    if (!['success', 'error', 'warning', 'info'].includes(type)) {
        type = 'info';
    }

    const toast = document.createElement('div');
    toast.className = `ui-toast ${type}`;
    
    const iconClass = iconMap[type];
    const defaultTitle = titleMap[type];

    toast.innerHTML = `
        <div class="ui-toast-icon">
            <i class="fa-solid ${iconClass}"></i>
        </div>
        <div class="ui-toast-content">
            <div class="ui-toast-title">${defaultTitle}</div>
            <div class="ui-toast-message">${message}</div>
        </div>
        <div class="ui-toast-progress">
            <div class="ui-toast-progress-bar"></div>
        </div>
    `;

    container.appendChild(toast);

    // Bắt đầu hiệu ứng thanh tiến trình
    const progressBar = toast.querySelector('.ui-toast-progress-bar');
    progressBar.style.transition = `transform ${duration}ms linear`;
    
    // Kích hoạt animation slide in
    requestAnimationFrame(() => {
        toast.classList.add('show');
        progressBar.style.transform = 'scaleX(0)';
    });

    // Tự động ẩn
    setTimeout(() => {
        toast.classList.remove('show');
        toast.classList.add('hide');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 400); // Đợi animation CSS kết thúc
    }, duration);
};

/**
 * Hiển thị Modal Alert (Chờ người dùng nhấn OK)
 * Thay thế cho window.alert() truyền thống
 * @param {string} message 
 * @param {string} type 
 * @returns {Promise<void>}
 */
window.showAlert = function(message, type = 'info') {
    return new Promise((resolve) => {
        const overlay = initModalOverlay();
        const box = overlay.querySelector('.ui-alert-box');
        const icon = overlay.querySelector('.ui-alert-icon-wrapper i');
        const title = overlay.querySelector('.ui-alert-title');
        const msgElement = overlay.querySelector('.ui-alert-message');
        const btn = overlay.querySelector('.ui-alert-btn');
        
        // Reset classes
        box.className = `ui-alert-box ${type}`;
        icon.className = `fa-solid ${iconMap[type] || iconMap.info}`;
        title.textContent = titleMap[type] || titleMap.info;
        msgElement.textContent = message;
        
        // Setup listener
        const closeAlert = () => {
            overlay.classList.remove('show');
            btn.removeEventListener('click', closeAlert);
            setTimeout(resolve, 300); // Đợi CSS animation
        };
        
        btn.addEventListener('click', closeAlert);
        
        // Show
        requestAnimationFrame(() => {
            overlay.classList.add('show');
            btn.focus();
        });
    });
};

// Khởi tạo overlay cho Prompt nếu chưa có
function initPromptOverlay() {
    let overlay = document.getElementById('ui-prompt-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'ui-prompt-overlay';
        
        const box = document.createElement('div');
        box.className = 'ui-alert-box';
        
        const iconWrapper = document.createElement('div');
        iconWrapper.className = 'ui-alert-icon-wrapper';
        const icon = document.createElement('i');
        icon.className = 'fa-solid';
        iconWrapper.appendChild(icon);
        
        const title = document.createElement('div');
        title.className = 'ui-alert-title';
        
        const message = document.createElement('div');
        message.className = 'ui-alert-message';
        
        const input = document.createElement('input');
        input.className = 'ui-prompt-input';
        
        const btnGroup = document.createElement('div');
        btnGroup.className = 'ui-prompt-btn-group';
        
        const btnCancel = document.createElement('button');
        btnCancel.className = 'ui-alert-btn cancel';
        btnCancel.textContent = 'Hủy';
        
        const btnOk = document.createElement('button');
        btnOk.className = 'ui-alert-btn';
        btnOk.textContent = 'Xác nhận';
        
        btnGroup.appendChild(btnCancel);
        btnGroup.appendChild(btnOk);
        
        box.appendChild(iconWrapper);
        box.appendChild(title);
        box.appendChild(message);
        box.appendChild(input);
        box.appendChild(btnGroup);
        
        overlay.appendChild(box);
        document.body.appendChild(overlay);
    }
    return overlay;
}

// Khởi tạo overlay cho Confirm nếu chưa có
function initConfirmOverlay() {
    let overlay = document.getElementById('ui-confirm-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'ui-confirm-overlay';
        
        const box = document.createElement('div');
        box.className = 'ui-alert-box';
        
        const iconWrapper = document.createElement('div');
        iconWrapper.className = 'ui-alert-icon-wrapper';
        const icon = document.createElement('i');
        icon.className = 'fa-solid';
        iconWrapper.appendChild(icon);
        
        const title = document.createElement('div');
        title.className = 'ui-alert-title';
        
        const message = document.createElement('div');
        message.className = 'ui-alert-message';
        message.style.whiteSpace = 'pre-line'; // Cho phép xuống dòng
        
        const btnGroup = document.createElement('div');
        btnGroup.className = 'ui-prompt-btn-group';
        
        const btnCancel = document.createElement('button');
        btnCancel.className = 'ui-alert-btn cancel';
        btnCancel.textContent = 'Hủy';
        
        const btnOk = document.createElement('button');
        btnOk.className = 'ui-alert-btn';
        btnOk.textContent = 'Đồng ý';
        
        btnGroup.appendChild(btnCancel);
        btnGroup.appendChild(btnOk);
        
        box.appendChild(iconWrapper);
        box.appendChild(title);
        box.appendChild(message);
        box.appendChild(btnGroup);
        
        overlay.appendChild(box);
        document.body.appendChild(overlay);
    }
    return overlay;
}

/**
 * Hiển thị Modal Confirm (Chờ người dùng xác nhận Có/Không)
 * Thay thế cho window.confirm() truyền thống
 */
window.showConfirm = function(message, type = 'warning', titleText = 'Xác nhận', okText = 'Đồng ý') {
    return new Promise((resolve) => {
        const overlay = initConfirmOverlay();
        const box = overlay.querySelector('.ui-alert-box');
        const icon = overlay.querySelector('.ui-alert-icon-wrapper i');
        const title = overlay.querySelector('.ui-alert-title');
        const msgElement = overlay.querySelector('.ui-alert-message');
        const btnOk = overlay.querySelector('.ui-alert-btn:not(.cancel)');
        const btnCancel = overlay.querySelector('.ui-alert-btn.cancel');
        
        // Reset classes
        box.className = `ui-alert-box ${type}`;
        icon.className = `fa-solid ${iconMap[type] || iconMap.warning}`;
        title.textContent = titleText;
        msgElement.textContent = message;
        btnOk.textContent = okText;
        
        // Setup listener
        const closeConfirm = (val) => {
            overlay.classList.remove('show');
            btnOk.removeEventListener('click', onOk);
            btnCancel.removeEventListener('click', onCancel);
            setTimeout(() => resolve(val), 300); // Đợi CSS animation
        };
        
        const onOk = () => closeConfirm(true);
        const onCancel = () => closeConfirm(false);
        
        btnOk.addEventListener('click', onOk);
        btnCancel.addEventListener('click', onCancel);
        
        // Show
        requestAnimationFrame(() => {
            overlay.classList.add('show');
            btnCancel.focus(); // Default focus on Cancel for safety
        });
    });
};

/**
 * Hiển thị Modal Prompt (Chờ người dùng nhập liệu)
 * Thay thế cho window.prompt() truyền thống
 */
window.showPrompt = function(message, inputType = 'text', type = 'info') {
    return new Promise((resolve) => {
        const overlay = initPromptOverlay();
        const box = overlay.querySelector('.ui-alert-box');
        const icon = overlay.querySelector('.ui-alert-icon-wrapper i');
        const title = overlay.querySelector('.ui-alert-title');
        const msgElement = overlay.querySelector('.ui-alert-message');
        const input = overlay.querySelector('.ui-prompt-input');
        const btnOk = overlay.querySelector('.ui-alert-btn:not(.cancel)');
        const btnCancel = overlay.querySelector('.ui-alert-btn.cancel');
        
        // Reset classes
        box.className = `ui-alert-box ${type}`;
        icon.className = `fa-solid ${iconMap[type] || iconMap.info}`;
        title.textContent = titleMap[type] || titleMap.info;
        msgElement.textContent = message;
        
        // Cấu hình Input
        input.type = inputType;
        input.value = '';
        
        // Setup listener
        const closePrompt = (val) => {
            overlay.classList.remove('show');
            btnOk.removeEventListener('click', onOk);
            btnCancel.removeEventListener('click', onCancel);
            input.removeEventListener('keydown', onEnter);
            setTimeout(() => resolve(val), 300); // Đợi CSS animation
        };
        
        const onOk = () => closePrompt(input.value);
        const onCancel = () => closePrompt(null);
        const onEnter = (e) => { if (e.key === 'Enter') onOk(); };
        
        btnOk.addEventListener('click', onOk);
        btnCancel.addEventListener('click', onCancel);
        input.addEventListener('keydown', onEnter);
        
        // Show
        requestAnimationFrame(() => {
            overlay.classList.add('show');
            input.focus();
        });
    });
};

// Ghi đè alert truyền thống để đề phòng những nơi quên thay bằng showToast/showAlert.
// Lưu ý: window.alert bị ghi đè sẽ không chặn luồng nữa.
window.originalAlert = window.alert;
window.alert = function(msg) {
    console.warn("Đang sử dụng window.alert. Khuyên dùng showToast hoặc await showAlert thay thế.");
    // Đoán type dựa trên nội dung message
    const str = String(msg).toLowerCase();
    let type = 'info';
    if (str.includes('thành công')) type = 'success';
    else if (str.includes('lỗi') || str.includes('thất bại') || str.includes('không hợp lệ')) type = 'error';
    
    // Mặc định gọi modal nếu dài, gọi toast nếu ngắn
    if (str.length > 50 || str.includes('\\n') || str.includes('\n')) {
        window.showAlert(msg, type);
    } else {
        window.showToast(msg, type);
    }
};
