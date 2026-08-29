const PDF_API_BASE_URL = '';

if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

function showPdfStatus(message, isError = false) {
    const status = document.getElementById('pdf-status');
    if (!status) return;
    status.textContent = message;
    status.classList.toggle('error', isError);
}

function showPaymentBanner() {
    const banner = document.getElementById('payment-banner');
    if (banner) banner.classList.add('show');
    showPdfStatus('Tài liệu đang khóa vì tài khoản chờ thanh toán.', true);
}

function getWatermarkLines(viewerIp) {
    try {
        const user = JSON.parse(localStorage.getItem('unipass_user') || '{}');
        const identity = user.email || user.Email || user.fullname || user.Fullname || user.User_ID || 'Người dùng UniPass';
        const timestamp = new Intl.DateTimeFormat('vi-VN', {
            dateStyle: 'short',
            timeStyle: 'short',
        }).format(new Date());
        return [`UniPass - ${identity}`, `IP: ${viewerIp || 'Không xác định'} | ${timestamp}`];
    } catch (error) {
        return ['UniPass - Tài liệu bảo mật', `IP: ${viewerIp || 'Không xác định'}`];
    }
}

function drawDynamicWatermark(canvas, viewerIp) {
    const context = canvas.getContext('2d');
    if (!context) return;

    const watermarkLines = getWatermarkLines(viewerIp);
    context.save();
    context.globalAlpha = 0.34;
    context.fillStyle = '#0f172a';
    let fontSize = Math.min(32, Math.max(18, Math.round(canvas.width / 30)));
    const rotation = -Math.PI / 6;
    const maxRotatedWidth = canvas.width * 0.82;
    const maxRotatedHeight = canvas.height * 0.5;
    do {
        context.font = `600 ${fontSize}px sans-serif`;
        const lineGap = fontSize * 1.35;
        const widestLine = Math.max(...watermarkLines.map(line => context.measureText(line).width));
        const blockHeight = lineGap * watermarkLines.length;
        const rotatedWidth = widestLine * Math.cos(rotation) + blockHeight * Math.abs(Math.sin(rotation));
        const rotatedHeight = widestLine * Math.abs(Math.sin(rotation)) + blockHeight * Math.cos(rotation);
        if (rotatedWidth <= maxRotatedWidth && rotatedHeight <= maxRotatedHeight || fontSize <= 12) break;
        fontSize -= 1;
    } while (fontSize > 12);
    const lineGap = fontSize * 1.35;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.translate(canvas.width / 2, canvas.height / 2);
    context.rotate(rotation);
    watermarkLines.forEach((line, index) => {
        context.fillText(line, 0, (index - (watermarkLines.length - 1) / 2) * lineGap);
    });
    context.restore();
}

async function loadSecurePDF(documentId) {
    const token = localStorage.getItem('unipass_token');
    if (!token) {
        alert('Vui lòng đăng nhập để xem tài liệu.');
        window.location.href = 'login.html';
        return;
    }

    if (!documentId || typeof pdfjsLib === 'undefined') {
        showPdfStatus('Không thể tải tài liệu.', true);
        return;
    }

    try {
        const response = await fetch(`${PDF_API_BASE_URL}/api/documents/stream/${encodeURIComponent(documentId)}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (response.status === 403) {
            const errorData = await response.json().catch(() => ({}));
            if (errorData.code === 'PAYMENT_REQUIRED') {
                showPaymentBanner();
                return;
            }
        }
        if (response.status === 401) {
            if (window.Auth && typeof window.Auth.logout === 'function') window.Auth.logout();
            window.location.href = 'login.html?session=revoked';
            throw new Error('unauthorized');
        }
        if (!response.ok) {
            throw new Error(`PDF request failed with status ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const viewerIp = response.headers.get('X-Viewer-IP') || '';
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const container = document.getElementById('pdf-container');
        const status = document.getElementById('pdf-status');
        if (!container) throw new Error('PDF container not found');
        container.replaceChildren();
        showPdfStatus('Đang tải tài liệu...');

        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
            const page = await pdf.getPage(pageNumber);
            const canvas = document.createElement('canvas');
            canvas.className = 'pdf-page';
            const pageWrapper = document.createElement('div');
            pageWrapper.className = 'pdf-page-wrapper';
            const textLayer = document.createElement('div');
            textLayer.className = 'textLayer';
            pageWrapper.append(canvas, textLayer);
            container.appendChild(pageWrapper);

            const baseViewport = page.getViewport({ scale: 1 });
            const availableWidth = Math.max(container.clientWidth - 40, 240);
            const scale = Math.min(1.5, availableWidth / baseViewport.width);
            const viewport = page.getViewport({ scale });
            const canvasContext = canvas.getContext('2d');

            canvas.height = viewport.height;
            canvas.width = viewport.width;
            await page.render({ canvasContext, viewport }).promise;
            drawDynamicWatermark(canvas, viewerIp);
            const textContent = await page.getTextContent();
            await pdfjsLib.renderTextLayer({ textContent, container: textLayer, viewport }).promise;
        }

        if (status) status.hidden = true;
    } catch (error) {
        console.error('Không thể tải PDF:', error);
        showPdfStatus('Bạn không có quyền truy cập tài liệu này.', true);
    }
}

const queryParams = new URLSearchParams(window.location.search);
const documentId = queryParams.get('docId') || queryParams.get('id');
loadSecurePDF(documentId);

document.addEventListener('contextmenu', event => {
    event.preventDefault();
    reportBlockedAction('Cố gắng mở menu chuột phải trên tài liệu');
});

document.addEventListener('keydown', event => {
    const hasModifier = event.ctrlKey || event.metaKey;
    const key = event.key.toLowerCase();
    const blockedAction = hasModifier && key === 's'
        ? 'Cố gắng lưu tài liệu bằng phím tắt (Ctrl/Cmd+S)'
        : hasModifier && key === 'p'
            ? 'Cố gắng in tài liệu bằng phím tắt (Ctrl/Cmd+P)'
            : hasModifier && key === 'c'
                ? 'Cố gắng sao chép nội dung tài liệu (Ctrl/Cmd+C)'
                : event.key === 'F12'
                    ? 'Cố gắng mở Developer Tools (F12/Inspect Element)'
                    : hasModifier && event.shiftKey && ['i', 'j'].includes(key)
                        ? 'Cố gắng mở Developer Tools (F12/Inspect Element)'
                        : null;
    if (blockedAction) {
        event.preventDefault();
        reportBlockedAction(blockedAction);
        console.warn('Tính năng này đã bị khóa');
    }
});

function reportBlockedAction(action) {
    const token = localStorage.getItem('unipass_token');
    if (!token) return;
    fetch(`${PDF_API_BASE_URL}/api/forensic-events`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action }),
    }).catch(error => console.warn('Không thể ghi nhận hành vi bảo mật:', error));
}

function setPdfContainerBlur(isBlurred) {
    const container = document.getElementById('pdf-container');
    if (container) container.style.filter = isBlurred ? 'blur(15px)' : 'none';
}

window.addEventListener('blur', () => setPdfContainerBlur(true));
window.addEventListener('focus', () => setPdfContainerBlur(false));
document.addEventListener('visibilitychange', () => setPdfContainerBlur(document.visibilityState !== 'visible'));
