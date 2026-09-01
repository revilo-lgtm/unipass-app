const PDF_API_BASE_URL = window.location.origin;

if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

function showPdfStatus(message, isError = false) {
    const status = document.getElementById('pdf-status');
    if (!status) return;
    status.innerHTML = message;
    status.classList.toggle('error', isError);
}

let selectedPdfPlan = { id: 'semester', name: 'Gói Nửa Năm (Học Kỳ)', price: '149.000đ', amount: 149000 };
let pdfPaymentTimerInterval = null;
let paymentApprovalPoller = null;

async function showPaymentWall() {
    const wall = document.getElementById('payment-wall');
    if (wall) wall.classList.add('show');
    showPdfStatus('', false);
    const statusEl = document.getElementById('pdf-status');
    if (statusEl) statusEl.style.display = 'none';

    let userId = 'GUEST';
    try {
        const user = JSON.parse(localStorage.getItem('unipass_user') || '{}');
        if (user.User_ID) userId = user.User_ID;
    } catch (e) {}

    const memoCode = `UNIPASS_${userId}`;
    const syntaxSpan = document.getElementById('transfer-syntax');
    if (syntaxSpan) syntaxSpan.textContent = memoCode;

    // Tải cấu hình cổng thanh toán động từ Settings (VietQR / MoMo / SĐT)
    let paymentConfig = { vietqr_active: 'true', momo_active: 'true', momo_phone: '0903768871' };
    try {
        const cfgRes = await fetch(`${PDF_API_BASE_URL}/api/payment/config`);
        if (cfgRes.ok) {
            paymentConfig = await cfgRes.json();
        }
    } catch (e) {}

    const tabVietQR = document.getElementById('tab-vietqr');
    const tabMoMo = document.getElementById('tab-momo');
    const tabsContainer = document.getElementById('pay-methods-tabs');
    const qrCard = document.getElementById('pay-qr-card');
    const countdownBar = document.getElementById('pay-countdown-bar');
    const btnVerifyTx = document.getElementById('btn-mock-verify');
    const maintenanceBox = document.getElementById('payment-maintenance-box');

    const isVietQRActive = (paymentConfig.vietqr_active === 'true' || paymentConfig.vietqr_active === true || paymentConfig.vietqr_active === undefined);
    const isMomoActive = (paymentConfig.momo_active === 'true' || paymentConfig.momo_active === true);
    const momoPhone = paymentConfig.momo_phone || '0903768871';

    // 1. Trường hợp cả 2 cổng đều TẮT -> Hiển thị thông báo bảo trì thanh toán
    if (!isVietQRActive && !isMomoActive) {
        if (tabsContainer) tabsContainer.style.display = 'none';
        if (qrCard) qrCard.style.display = 'none';
        if (countdownBar) countdownBar.style.display = 'none';
        if (btnVerifyTx) btnVerifyTx.style.display = 'none';
        if (maintenanceBox) maintenanceBox.style.display = 'block';
    } else {
        if (tabsContainer) tabsContainer.style.display = 'flex';
        if (qrCard) qrCard.style.display = 'block';
        if (countdownBar) countdownBar.style.display = 'flex';
        if (btnVerifyTx) btnVerifyTx.style.display = 'flex';
        if (maintenanceBox) maintenanceBox.style.display = 'none';

        // 2. Trường hợp tắt 1 trong 2: Cái nào còn mở thì hiển thị tab và hiện QR code first
        if (tabVietQR) tabVietQR.style.display = isVietQRActive ? 'flex' : 'none';
        if (tabMoMo) tabMoMo.style.display = isMomoActive ? 'flex' : 'none';

        if (!isVietQRActive && isMomoActive) {
            // Tắt VietQR, mở MoMo -> MoMo active & hiện MoMo QR first
            tabMoMo?.classList.add('active');
            tabVietQR?.classList.remove('active');
        } else if (isVietQRActive && !isMomoActive) {
            // Tắt MoMo, mở VietQR -> VietQR active & hiện VietQR first
            tabVietQR?.classList.add('active');
            tabMoMo?.classList.remove('active');
        } else {
            // Cả 2 đều mở -> Mặc định chọn VietQR 24/7 first
            tabVietQR?.classList.add('active');
            tabMoMo?.classList.remove('active');
        }
    }

    function refreshQRDisplay() {
        if (!isVietQRActive && !isMomoActive) return;

        const activeTab = document.querySelector('.pay-tab-btn.active');
        const activeMethod = activeTab?.dataset.method || (isMomoActive && !isVietQRActive ? 'momo' : 'vietqr');

        const bankQrUrl = `https://img.vietqr.io/image/tpbank-trunglnm-compact2.png?amount=${selectedPdfPlan.amount}&addInfo=${encodeURIComponent(memoCode)}&accountName=LE%20NGUYEN%20MINH%20TRUNG`;
        const momoRawData = `2|99|${momoPhone}|||0|0|${selectedPdfPlan.amount}|${memoCode}`;
        const momoQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(momoRawData)}`;

        const qrImg = document.getElementById('qr-code-img');
        if (qrImg) {
            qrImg.src = (activeMethod === 'momo') ? momoQrUrl : bankQrUrl;
        }

        const nameEl = document.getElementById('pay-plan-name');
        const priceEl = document.getElementById('pay-plan-price');
        if (nameEl) nameEl.textContent = selectedPdfPlan.name;
        if (priceEl) priceEl.textContent = selectedPdfPlan.price;

        const bankName = document.getElementById('pay-bank-name');
        const labelAcc = document.getElementById('pay-label-acc');
        const valAcc = document.getElementById('pay-val-acc');

        if (activeMethod === 'momo') {
            if (bankName) bankName.textContent = 'Ví MoMo (MoMo QR)';
            if (labelAcc) labelAcc.textContent = 'Số điện thoại Ví:';
            if (valAcc) valAcc.textContent = momoPhone;
        } else {
            if (bankName) bankName.textContent = 'VietQR 24/7 (TPBank)';
            if (labelAcc) labelAcc.textContent = 'Số tài khoản:';
            if (valAcc) valAcc.textContent = 'trunglnm';
        }
    }

    // Plan selector buttons
    document.querySelectorAll('.plan-select-btn').forEach(btn => {
        btn.onclick = function() {
            document.querySelectorAll('.plan-select-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            selectedPdfPlan = {
                id: this.dataset.plan,
                name: this.dataset.name,
                price: this.dataset.price,
                amount: parseInt(this.dataset.amount) || 149000
            };
            refreshQRDisplay();
        };
    });

    // Payment method tabs
    if (tabVietQR) {
        tabVietQR.onclick = function() {
            document.querySelectorAll('.pay-tab-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            refreshQRDisplay();
        };
    }
    if (tabMoMo) {
        tabMoMo.onclick = function() {
            document.querySelectorAll('.pay-tab-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            refreshQRDisplay();
        };
    }

    // Copy buttons
    const btnCopyStk = document.getElementById('btn-copy-stk');
    if (btnCopyStk) {
        btnCopyStk.onclick = () => {
            const activeMethod = document.querySelector('.pay-tab-btn.active')?.dataset.method || 'vietqr';
            const acc = activeMethod === 'momo' ? momoPhone : 'trunglnm';
            navigator.clipboard.writeText(acc);
            window.showAlert(`Đã sao chép: ${acc}`, 'success');
        };
    }
    const btnCopyMemo = document.getElementById('btn-copy-memo');
    if (btnCopyMemo) {
        btnCopyMemo.onclick = () => {
            navigator.clipboard.writeText(memoCode);
            window.showAlert(`Đã sao chép Nội dung CK: ${memoCode}`, 'success');
        };
    }

    // Countdown timer 10:00
    let secondsLeft = 600;
    if (pdfPaymentTimerInterval) clearInterval(pdfPaymentTimerInterval);
    const timerEl = document.getElementById('pay-timer');
    pdfPaymentTimerInterval = setInterval(() => {
        secondsLeft--;
        if (secondsLeft <= 0) {
            clearInterval(pdfPaymentTimerInterval);
            if (timerEl) timerEl.innerText = "Hết hạn";
        } else if (timerEl) {
            const m = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
            const s = String(secondsLeft % 60).padStart(2, '0');
            timerEl.innerText = `${m}:${s}`;
        }
    }, 1000);

    refreshQRDisplay();

    // Verify & Send pending transaction for Admin Approval
    const btnMock = document.getElementById('btn-mock-verify');
    const failedActionsBox = document.getElementById('payment-failed-actions');
    const btnRecheck = document.getElementById('btn-recheck-pay');
    const btnSendAdmin = document.getElementById('btn-send-admin-request');
    const failedBtnGroup = document.getElementById('pay-failed-btn-group');
    const pendingWaitingBanner = document.getElementById('pay-pending-waiting-banner');

    async function handlePaymentSuccess(data) {
        try {
            const userStr = localStorage.getItem('unipass_user');
            if (userStr) {
                const userObj = JSON.parse(userStr);
                userObj.Status = data.Status;
                userObj.Expiry_Date = data.Expiry_Date;
                localStorage.setItem('unipass_user', JSON.stringify(userObj));
            }
        } catch(e) {}
        
        await window.showAlert(`🎉 Thanh toán thành công! ${selectedPdfPlan.name} đã được kích hoạt.`, 'success');
        window.location.reload();
    }

    function startAutoPolling() {
        if (!paymentApprovalPoller) {
            const token = localStorage.getItem('unipass_token');
            paymentApprovalPoller = setInterval(async () => {
                try {
                    const pollRes = await fetch(`${PDF_API_BASE_URL}/api/payment/mock-verify`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({ planId: selectedPdfPlan.id, checkOnly: true, isTrial: false })
                    });
                    const pollData = await pollRes.json();
                    if (pollRes.ok && pollData.success) {
                        clearInterval(paymentApprovalPoller);
                        await window.showAlert('🎉 Admin đã duyệt thanh toán thành công! Tài liệu đang được mở khóa...', 'success');
                        window.location.reload();
                    }
                } catch(e) {}
            }, 3500);
        }
    }

    // 1. Khi bấm "Tôi đã chuyển khoản xong (Kích hoạt)"
    if (btnMock) {
        btnMock.onclick = async () => {
            btnMock.disabled = true;
            btnMock.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang kiểm tra giao dịch...';

            try {
                const token = localStorage.getItem('unipass_token');
                
                // Bước 1: Check API xem giao dịch đã thành công chưa
                const checkRes = await fetch(`${PDF_API_BASE_URL}/api/payment/mock-verify`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}` 
                    },
                    body: JSON.stringify({
                        planId: selectedPdfPlan.id,
                        checkOnly: true,
                        isTrial: false
                    })
                });
                const checkData = await checkRes.json();

                if (checkRes.ok && checkData.success) {
                    await handlePaymentSuccess(checkData);
                    return;
                }

                // Bước 2: Check API không có giao dịch hoặc không thành công -> Hiện giao diện Thử lại & Gửi xác thực Admin
                btnMock.style.display = 'none';
                if (failedActionsBox) failedActionsBox.style.display = 'flex';
                if (failedBtnGroup) failedBtnGroup.style.display = 'grid';
                if (pendingWaitingBanner) pendingWaitingBanner.style.display = 'none';

                if (window.showToast) {
                    window.showToast(`⚠️ Hệ thống chưa ghi nhận tiền tự động cho mã ${memoCode}. Bạn có thể thử kiểm tra lại hoặc gửi yêu cầu cho Admin duyệt.`, 'warning', 5000);
                } else if (window.showAlert) {
                    await window.showAlert(`⚠️ Hệ thống ngân hàng chưa ghi nhận tiền tự động cho mã ${memoCode}.\n\nBạn hãy kiểm tra lại hoặc bấm nút "Gửi xác thực Admin" bên dưới để Admin duyệt thủ công.`, 'warning');
                }
            } catch (error) {
                await window.showAlert('Lỗi kết nối: ' + error.message, 'error');
                btnMock.disabled = false;
                btnMock.innerHTML = '<i class="fa-solid fa-circle-check"></i> Tôi đã chuyển khoản xong (Kích hoạt)';
            }
        };
    }

    // 2. Khi bấm "Thử kiểm tra lại"
    if (btnRecheck) {
        btnRecheck.onclick = async () => {
            btnRecheck.disabled = true;
            btnRecheck.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang kiểm tra...';

            try {
                const token = localStorage.getItem('unipass_token');
                const checkRes = await fetch(`${PDF_API_BASE_URL}/api/payment/mock-verify`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}` 
                    },
                    body: JSON.stringify({
                        planId: selectedPdfPlan.id,
                        checkOnly: true,
                        isTrial: false
                    })
                });
                const checkData = await checkRes.json();

                if (checkRes.ok && checkData.success) {
                    await handlePaymentSuccess(checkData);
                    return;
                }

                if (window.showToast) {
                    window.showToast(`⚠️ Vẫn chưa nhận diện được chuyển khoản. Nếu bạn đã trừ tiền, hãy bấm "Gửi xác thực Admin".`, 'warning', 4500);
                }
            } catch (e) {
                if (window.showToast) window.showToast('Lỗi kết nối kiểm tra: ' + e.message, 'error');
            } finally {
                btnRecheck.disabled = false;
                btnRecheck.innerHTML = '<i class="fa-solid fa-rotate-right"></i> Thử kiểm tra lại';
            }
        };
    }

    // 3. Khi bấm "Gửi xác thực Admin"
    if (btnSendAdmin) {
        btnSendAdmin.onclick = async () => {
            const activeTab = document.querySelector('.pay-tab-btn.active');
            const activeMethodName = activeTab?.dataset.method === 'momo' ? 'Ví MoMo' : 'VietQR 24/7';

            btnSendAdmin.disabled = true;
            btnSendAdmin.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang gửi...';

            try {
                const token = localStorage.getItem('unipass_token');
                const submitRes = await fetch(`${PDF_API_BASE_URL}/api/payment/mock-verify`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}` 
                    },
                    body: JSON.stringify({
                        planId: selectedPdfPlan.id,
                        planName: selectedPdfPlan.name,
                        amount: selectedPdfPlan.amount,
                        method: activeMethodName,
                        submitPending: true,
                        isTrial: false
                    })
                });
                const submitData = await submitRes.json();

                if (submitRes.status === 202 || submitData.isPending) {
                    await window.showAlert(`📨 Đã gửi yêu cầu xác thực giao dịch (${memoCode} - ${selectedPdfPlan.amount.toLocaleString('vi-VN')}đ) tới Quản trị viên! Vui lòng chờ Admin duyệt kích hoạt trong mục Quản lý thanh toán.`, 'info');
                    if (failedBtnGroup) failedBtnGroup.style.display = 'none';
                    if (pendingWaitingBanner) pendingWaitingBanner.style.display = 'block';

                    // Bắt đầu tự động kiểm tra định kỳ (Auto-polling)
                    startAutoPolling();
                } else if (submitRes.ok && submitData.success) {
                    await handlePaymentSuccess(submitData);
                } else {
                    await window.showAlert(submitData.message || '⚠️ Không thể gửi yêu cầu xác thực. Vui lòng thử lại!', 'error');
                    btnSendAdmin.disabled = false;
                    btnSendAdmin.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Gửi xác thực Admin';
                }
            } catch (error) {
                await window.showAlert('Lỗi kết nối: ' + error.message, 'error');
                btnSendAdmin.disabled = false;
                btnSendAdmin.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Gửi xác thực Admin';
            }
        };
    }

    // Trial button
    const btnTrial = document.getElementById('btn-pdf-trial');
    if (btnTrial) {
        btnTrial.onclick = async () => {
            btnTrial.disabled = true;
            btnTrial.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang kích hoạt dùng thử...';
            try {
                const token = localStorage.getItem('unipass_token');
                const res = await fetch(`${PDF_API_BASE_URL}/api/payment/mock-verify`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}` 
                    },
                    body: JSON.stringify({ isTrial: true })
                });
                const data = await res.json();
                if (res.ok) {
                    try {
                        const userStr = localStorage.getItem('unipass_user');
                        if (userStr) {
                            const userObj = JSON.parse(userStr);
                            userObj.Status = data.Status;
                            userObj.Expiry_Date = data.Expiry_Date;
                            localStorage.setItem('unipass_user', JSON.stringify(userObj));
                        }
                    } catch(e) {}
                    
                    await window.showAlert('🎁 Kích hoạt dùng thử 1 ngày miễn phí thành công! Mời bạn xem tài liệu.', 'success');
                    window.location.reload();
                } else {
                    alert('Lỗi: ' + data.message);
                    btnTrial.disabled = false;
                    btnTrial.innerHTML = '<i class="fa-solid fa-gift" style="color: var(--secondary);"></i> Hoặc Kích hoạt dùng thử 1 ngày miễn phí';
                }
            } catch (error) {
                alert('Lỗi kết nối. Vui lòng thử lại.');
                btnTrial.disabled = false;
                btnTrial.innerHTML = '<i class="fa-solid fa-gift" style="color: var(--secondary);"></i> Hoặc Kích hoạt dùng thử 1 ngày miễn phí';
            }
        };
    }
}


let currentPdfDoc = null;
let currentScaleMultiplier = 1.0;
let currentPageNumber = 1;
let totalPagesCount = 0;
let isUserTypingPage = false;
let isScrollingProgrammatically = false;
let scrollRafId = null;
const BASE_CONTAINER_WIDTH = 880;

function updateNavButtons() {
    const btnPrev = document.getElementById('btn-prev-page');
    const btnNext = document.getElementById('btn-next-page');
    if (btnPrev) btnPrev.disabled = (currentPageNumber <= 1);
    if (btnNext) btnNext.disabled = (currentPageNumber >= totalPagesCount);
}

function detectCurrentPageOnScroll() {
    if (isUserTypingPage || isScrollingProgrammatically) return;
    const wrappers = document.querySelectorAll('.pdf-page-wrapper');
    if (!wrappers.length) return;

    const scrollThreshold = window.scrollY + 120; // 120px from top of viewport
    let activePage = 1;

    for (let i = 0; i < wrappers.length; i++) {
        const el = wrappers[i];
        const pageTop = el.offsetTop;
        const pageBottom = pageTop + el.offsetHeight;

        if (scrollThreshold >= pageTop && scrollThreshold < pageBottom) {
            activePage = parseInt(el.dataset.pageNumber) || (i + 1);
            break;
        } else if (scrollThreshold < pageTop) {
            break;
        } else {
            activePage = parseInt(el.dataset.pageNumber) || (i + 1);
        }
    }

    if (activePage !== currentPageNumber) {
        currentPageNumber = activePage;
        const pageInput = document.getElementById('page-search-input');
        if (pageInput && document.activeElement !== pageInput) {
            pageInput.value = activePage;
        }
        updateNavButtons();
    }
}

function onPdfScrollThrottled() {
    if (isScrollingProgrammatically) return;
    if (scrollRafId) cancelAnimationFrame(scrollRafId);
    scrollRafId = requestAnimationFrame(detectCurrentPageOnScroll);
}

function jumpToPage(pageNum, smooth = false) {
    if (!currentPdfDoc || totalPagesCount === 0) return;
    const target = Math.max(1, Math.min(pageNum, totalPagesCount));
    currentPageNumber = target;

    const pageInput = document.getElementById('page-search-input');
    if (pageInput) {
        pageInput.value = target;
    }

    const pageEl = document.getElementById(`pdf-page-${target}`);
    if (pageEl) {
        isScrollingProgrammatically = true;
        const headerOffset = 75;
        const elementPosition = pageEl.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
            top: Math.max(0, offsetPosition),
            behavior: smooth ? 'smooth' : 'auto'
        });

        setTimeout(() => {
            isScrollingProgrammatically = false;
        }, smooth ? 600 : 120);
    }

    updateNavButtons();
}

function setZoom(newScale) {
    const clamped = Math.max(0.5, Math.min(2.5, Math.round(newScale * 100) / 100));
    currentScaleMultiplier = clamped;

    const zoomText = document.getElementById('zoom-level-text');
    if (zoomText) {
        zoomText.textContent = `${Math.round(clamped * 100)}%`;
    }

    const container = document.getElementById('pdf-container');
    if (container) {
        container.style.maxWidth = `${Math.round(BASE_CONTAINER_WIDTH * clamped)}px`;
    }
}

function fitWidth() {
    const mainEl = document.querySelector('main');
    const availableWidth = (mainEl ? mainEl.clientWidth : window.innerWidth) - 40;
    const fitScale = Math.max(0.6, Math.min(2.2, availableWidth / BASE_CONTAINER_WIDTH));
    setZoom(fitScale);
}

async function renderAllPdfPages(pdf) {
    const container = document.getElementById('pdf-container');
    if (!container) return;

    container.replaceChildren();
    container.style.maxWidth = `${Math.round(BASE_CONTAINER_WIDTH * currentScaleMultiplier)}px`;

    const dpr = Math.max(window.devicePixelRatio || 1, 2); // 2x crisp DPI

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        const page = await pdf.getPage(pageNumber);
        const baseViewport = page.getViewport({ scale: 1 });
        const scale = (BASE_CONTAINER_WIDTH / baseViewport.width) * dpr;
        const viewport = page.getViewport({ scale });

        const pageWrapper = document.createElement('div');
        pageWrapper.className = 'pdf-page-wrapper';
        pageWrapper.id = `pdf-page-${pageNumber}`;
        pageWrapper.dataset.pageNumber = pageNumber;
        pageWrapper.style.width = '100%';
        pageWrapper.style.aspectRatio = `${baseViewport.width} / ${baseViewport.height}`;

        const canvas = document.createElement('canvas');
        canvas.className = 'pdf-page';
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = '100%';
        canvas.style.height = 'auto';

        pageWrapper.appendChild(canvas);
        container.appendChild(pageWrapper);

        const canvasContext = canvas.getContext('2d');
        await page.render({ canvasContext, viewport }).promise;
    }

    window.removeEventListener('scroll', onPdfScrollThrottled);
    window.addEventListener('scroll', onPdfScrollThrottled, { passive: true });
    detectCurrentPageOnScroll();
}

function initViewerControls(totalPages) {
    totalPagesCount = totalPages;
    const totalEl = document.getElementById('page-count-total');
    if (totalEl) totalEl.textContent = totalPages;

    const pageInput = document.getElementById('page-search-input');
    if (pageInput) {
        pageInput.value = currentPageNumber || 1;

        let isComposing = false;
        pageInput.addEventListener('compositionstart', () => { isComposing = true; });
        pageInput.addEventListener('compositionend', () => { isComposing = false; });

        function commitPageJump(inputEl) {
            isUserTypingPage = false;
            const digits = (inputEl.value || '').replace(/[^0-9]/g, '').trim();
            let val = parseInt(digits, 10);
            
            if (isNaN(val) || val < 1) {
                val = parseInt(inputEl.dataset.previousPage, 10) || currentPageNumber || 1;
            }
            if (val > totalPagesCount) val = totalPagesCount;
            
            inputEl.value = val;
            inputEl.placeholder = '';
            
            if (val !== currentPageNumber) {
                jumpToPage(val, false);
            }
        }

        // Khi click / focus vào ô tìm trang: Tự động xóa ô và đặt placeholder là trang hiện tại
        pageInput.addEventListener('focus', function() { 
            isUserTypingPage = true; 
            const currentVal = this.value || String(currentPageNumber || 1);
            this.dataset.previousPage = currentVal;
            this.placeholder = currentVal;
            this.value = '';
        });

        // Xử lý phím Enter không bị chèn lặp số khi gõ VNI
        pageInput.addEventListener('keydown', function(e) {
            if (e.isComposing || e.keyCode === 229 || isComposing) {
                return;
            }
            if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                commitPageJump(this);
                this.blur();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                this.value = this.dataset.previousPage || String(currentPageNumber || 1);
                this.blur();
            }
        });

        // Khi click ra ngoài (blur)
        pageInput.addEventListener('blur', function() {
            commitPageJump(this);
        });
    }

    const btnPrev = document.getElementById('btn-prev-page');
    if (btnPrev) {
        btnPrev.onclick = () => jumpToPage(currentPageNumber - 1, true);
    }

    const btnNext = document.getElementById('btn-next-page');
    if (btnNext) {
        btnNext.onclick = () => jumpToPage(currentPageNumber + 1, true);
    }

    const btnZoomIn = document.getElementById('btn-zoom-in');
    if (btnZoomIn) {
        btnZoomIn.onclick = () => setZoom(currentScaleMultiplier + 0.15);
    }

    const btnZoomOut = document.getElementById('btn-zoom-out');
    if (btnZoomOut) {
        btnZoomOut.onclick = () => setZoom(currentScaleMultiplier - 0.15);
    }

    const btnZoomReset = document.getElementById('btn-zoom-reset');
    if (btnZoomReset) {
        btnZoomReset.onclick = () => setZoom(1.0);
    }

    const btnFitWidth = document.getElementById('btn-fit-width');
    if (btnFitWidth) {
        btnFitWidth.onclick = () => fitWidth();
    }

    updateNavButtons();
}

async function loadSecurePDF(documentId) {
    const token = localStorage.getItem('unipass_token');
    if (!token) {
        await window.showAlert('Vui lòng đăng nhập để xem tài liệu.', 'warning');
        window.location.href = 'login.html';
        return;
    }

    if (!documentId) {
        showPdfStatus('<i class="fa-solid fa-triangle-exclamation"></i> Không tìm thấy mã tài liệu PDF.', true);
        return;
    }

    try {
        showPdfStatus('<i class="fa-solid fa-spinner fa-spin"></i> Đang tải và giải mã luồng tài liệu PDF an toàn...');
        const response = await fetch(`${PDF_API_BASE_URL}/api/documents/stream/${encodeURIComponent(documentId)}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (response.status === 503) {
            localStorage.setItem('unipass_session_notice', 'Hệ thống đang bảo trì, Tạm thời đóng hệ thống để nâng cấp server.');
            if (window.Auth && typeof window.Auth.logout === 'function') window.Auth.logout();
            window.location.href = 'login.html?session=revoked';
            return;
        }
        if (response.status === 403) {
            showPaymentWall();
            return;
        }
        if (response.status === 401) {
            if (window.Auth && typeof window.Auth.logout === 'function') window.Auth.logout();
            window.location.href = 'login.html?session=revoked';
            throw new Error('unauthorized');
        }
        if (!response.ok) {
            throw new Error(`Tài liệu không tồn tại hoặc đã bị xóa.`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        currentPdfDoc = pdf;
        totalPagesCount = pdf.numPages;

        initViewerControls(pdf.numPages);
        await renderAllPdfPages(pdf, currentScaleMultiplier);

        const status = document.getElementById('pdf-status');
        if (status) status.style.display = 'none';

        // Ghi nhận lịch sử đọc tài liệu cho Tủ sách gần đây
        try {
            const token = localStorage.getItem('unipass_token');
            if (token) {
                fetch(`${PDF_API_BASE_URL}/api/user/recent-reads`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        documentId,
                        documentTitle: docTitle ? decodeURIComponent(docTitle) : undefined
                    })
                }).catch(() => {});
            }
        } catch (e) {}
    } catch (error) {
        console.error('Không thể tải PDF:', error);
        showPdfStatus(`<i class="fa-solid fa-circle-xmark"></i> ${error.message || 'Không thể mở tài liệu.'}`, true);
    }
}

const queryParams = new URLSearchParams(window.location.search);
const documentId = queryParams.get('docId') || queryParams.get('id');
const courseParam = queryParams.get('course');
const chapterParam = queryParams.get('chapter');
const lessonParam = queryParams.get('lesson');
const titleParam = queryParams.get('title');

let displayTitle = '';
if (titleParam && !titleParam.toLowerCase().endsWith('.pdf')) {
    displayTitle = decodeURIComponent(titleParam);
} else if (lessonParam && !lessonParam.toLowerCase().endsWith('.pdf')) {
    displayTitle = chapterParam ? `${decodeURIComponent(chapterParam)}: ${decodeURIComponent(lessonParam)}` : decodeURIComponent(lessonParam);
} else if (titleParam) {
    displayTitle = decodeURIComponent(titleParam);
}

const titleEl = document.getElementById('viewer-title');
if (titleEl && displayTitle) {
    titleEl.textContent = displayTitle;
    document.title = `${displayTitle} - UniPass`;
}

loadSecurePDF(documentId);

// Chặn lưu, sao chép, chuột phải và hỗ trợ phím tắt Zoom/Chuyển trang
document.addEventListener('contextmenu', event => {
    event.preventDefault();
    reportBlockedAction('Cố gắng mở menu chuột phải trên tài liệu');
});

document.addEventListener('keydown', event => {
    const hasModifier = event.ctrlKey || event.metaKey;
    const key = event.key.toLowerCase();

    // Hỗ trợ phím tắt Zoom (Ctrl + / Ctrl - / Ctrl 0)
    if (hasModifier && (key === '=' || key === '+')) {
        event.preventDefault();
        setZoom(currentScaleMultiplier + 0.15);
        return;
    }
    if (hasModifier && (key === '-' || key === '_')) {
        event.preventDefault();
        setZoom(currentScaleMultiplier - 0.15);
        return;
    }
    if (hasModifier && key === '0') {
        event.preventDefault();
        setZoom(1.0);
        return;
    }

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
    }).catch(error => {});
}

function setPdfContainerBlur(isBlurred) {
    const container = document.getElementById('pdf-container');
    if (container) container.style.filter = isBlurred ? 'blur(15px)' : 'none';
}

window.addEventListener('blur', () => setPdfContainerBlur(true));
window.addEventListener('focus', () => setPdfContainerBlur(false));
document.addEventListener('visibilitychange', () => setPdfContainerBlur(document.visibilityState !== 'visible'));
