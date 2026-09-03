;(function(){
  const USERS_KEY = 'unipass_users_v1';
  const CURR_KEY = 'unipass_current_v1';
  const TOKEN_KEY = 'unipass_token';
  const USER_KEY = 'unipass_user';
  const DEVICE_KEY = 'unipass_device_id';
  const SESSION_CACHE_KEY = 'unipass_session_cache';
  const SESSION_CHECK_INTERVAL = 3000;
  const UNIVERSITY_DOMAINS = {
    'st.ueh.edu.vn': 'UEH',
    'hcmut.edu.vn': 'BK',
    'ftu.edu.vn': 'FTU',
    'st.neu.edu.vn': 'NEU',
    'hcmus.edu.vn': 'HCMUS',
    'tdtu.edu.vn': 'TDTU',
    'unipass.edu.vn': 'UniPass',
  };

  function isStaffLoginEmail(email){
    const normalized = String(email || '').trim().toLowerCase();
    return normalized === 'admin'
      || normalized.endsWith('@unipass.app')
      || normalized.endsWith('@unipass.edu.vn');
  }

  function isStaffUser(user){
    const role = user && (user.Role || user.role || '');
    const email = String((user && (user.Email || user.email)) || '').trim().toLowerCase();
    return role === 'admin' || role === 'Giảng viên' || isStaffLoginEmail(email);
  }

  function universityFromEmail(email){
    const domain = String(email || '').toLowerCase().split('@')[1];
    return UNIVERSITY_DOMAINS[domain] || null;
  }

  function getUsers(){
    try{ return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); }catch(e){ return []; }
  }

  async function registerUser({fullname,email,password,university,isPaid,isTrial,planId}){
    if(!email || !password) return {ok:false, msg:'Email và mật khẩu là bắt buộc.'};

    try {
      const apiUrl = window.location.protocol === 'file:'
        ? 'http://localhost:3000/api/register'
        : '/api/register';
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({fullname, email, password, university, isPaid, isTrial, planId}),
      });
      const data = await response.json();
      if(!response.ok) return {ok:false, msg: data.message || 'Đăng ký thất bại.'};
      return loginUser(email, password);
    } catch(error) {
      console.error('Lỗi đăng ký API:', error);
      return {ok:false, msg:'Không thể kết nối đến máy chủ Backend.'};
    }
  }

  async function loginUser(email,password){
    if(!email || password === undefined || password === null) return {ok:false, msg:'Email và mật khẩu là bắt buộc.'};
    const normalizedEmail = email.trim().toLowerCase();
    if(!isStaffLoginEmail(normalizedEmail) && !universityFromEmail(normalizedEmail)){
      return {ok:false, msg:'Email chưa thuộc trường được hỗ trợ.'};
    }

    try {
      const apiUrl = window.location.protocol === 'file:'
        ? 'http://localhost:3000/api/login'
        : '/api/login';
      let deviceId = localStorage.getItem(DEVICE_KEY);
      if(!deviceId){
        deviceId = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
        localStorage.setItem(DEVICE_KEY, deviceId);
      }
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email: normalizedEmail, password, deviceId}),
      });
      const data = await response.json();

      if(!response.ok || !data.token){
        return {ok:false, msg: data.message || 'Email hoặc mật khẩu không đúng.'};
      }

      const user = {
        User_ID: data.user && data.user.User_ID,
        email: data.user && data.user.Email,
        fullname: data.user && data.user.Fullname,
        role: data.user && data.user.Role,
        university: universityFromEmail(data.user && data.user.Email),
      };
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      localStorage.setItem(CURR_KEY, user.email);
      if(data.session) {
        localStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(data.session));
      }
      if (data.requires_password_change) {
        localStorage.setItem('unipass_force_pwd_change', '1');
      } else {
        localStorage.removeItem('unipass_force_pwd_change');
      }

      syncUserHeader();
      updateAuthUI();
      return {ok:true, user, requires_password_change: data.requires_password_change};
      
    } catch (error) {
      console.error("Lỗi kết nối API:", error);
      return {ok:false, msg:'Không thể kết nối đến máy chủ Backend. Vui lòng kiểm tra lại server.'};
    }
  }

  function logout(){
    const token = localStorage.getItem(TOKEN_KEY);
    if(token){
      const apiUrl = window.location.protocol === 'file:'
        ? 'http://localhost:3000/api/logout'
        : '/api/logout';
      fetch(apiUrl, {
        method: 'POST',
        headers: {Authorization: `Bearer ${token}`},
        keepalive: true,
      }).catch(() => {});
    }
    localStorage.removeItem(CURR_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('unipass_user');
    localStorage.removeItem(SESSION_CACHE_KEY);
    localStorage.removeItem('unipass_force_pwd_change');
    updateAuthUI();
  }

  async function verifyCurrentSession(redirectOnFailure = false){
    const token = localStorage.getItem(TOKEN_KEY);
    if(!token) return false;

    try {
      const apiUrl = window.location.protocol === 'file:'
        ? 'http://localhost:3000/api/verify-token'
        : '/api/verify-token';
      const response = await fetch(apiUrl, {
        headers: {Authorization: `Bearer ${token}`},
      });
      const sessionData = await response.json().catch(() => ({}));
      if(response.ok){
        if(sessionData.session) {
          updateSessionStatus(sessionData.session);
        }
        
        // Cập nhật lại Status và Expiry_Date từ Backend
        if (sessionData.Status) {
            try {
                const userStr = localStorage.getItem(USER_KEY);
                if (userStr) {
                    const userObj = JSON.parse(userStr);
                    let changed = false;
                    if (userObj.Status !== sessionData.Status || userObj.Expiry_Date !== sessionData.Expiry_Date) {
                        changed = true;
                    }
                    userObj.Status = sessionData.Status;
                    userObj.Expiry_Date = sessionData.Expiry_Date;
                    localStorage.setItem(USER_KEY, JSON.stringify(userObj));
                    
                    if (changed && window.location.pathname.includes('dashboard')) {
                        // Reload if on dashboard to reflect new expiry date
                        window.location.reload();
                    }
                }
            } catch(e) {}
        }
        
        return true;
      }
      const errorData = sessionData;
      if(errorData.code === 'SESSION_REPLACED') {
        localStorage.setItem('unipass_session_notice', 'Tài khoản đang được đăng nhập trên thiết bị khác. Phiên trên thiết bị này đã đăng xuất.');
      } else if (errorData.code === 'MAINTENANCE' || response.status === 503) {
        localStorage.setItem('unipass_session_notice', errorData.message || 'Hệ thống đang bảo trì, Tạm thời đóng hệ thống để nâng cấp server.');
      }
    } catch(error) {
      return true;
    }

    logout();
    if(redirectOnFailure && !window.location.pathname.endsWith('login.html')) {
      window.location.href = 'login.html?session=revoked';
    }
    return false;
  }

  function updateSessionStatus(session){
    if(!session || typeof session.active !== 'number' || typeof session.limit !== 'number') return;
    localStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(session));
    document.querySelectorAll('.session-status').forEach(element => {
      element.textContent = `Thiết bị đang hoạt động: ${session.active}/${session.limit}`;
    });
  }

  function getCurrentUser(){
    const email = localStorage.getItem(CURR_KEY);
    if(!email) return null;
    try{
      const sessionUser = JSON.parse(localStorage.getItem(USER_KEY) || 'null');
      if(sessionUser && (sessionUser.email || '').toLowerCase() === email.toLowerCase()) return sessionUser;
      if(sessionUser && sessionUser.fullname) return sessionUser;
    }catch(e){}
    return getUsers().find(u=>u.email === email) || null;
  }

  function updateAuthUI(){
    const area = document.getElementById('auth-area');
    if(!area) return;
    const user = getCurrentUser();
    if(user){
      const role = user.Role || user.role || '';
      const isStaff = isStaffUser(user);
      const targetDashboard = isStaff ? 'admin-dashboard.html' : 'dashboard.html';
      const btnLabel = isStaff ? 'Trang Quản trị' : 'Vào học ngay';
      const btnIcon = isStaff ? 'fa-shield-halved' : 'fa-gauge-high';

      let greetingText = '';
      if (role === 'admin' || isStaffLoginEmail(user.email)) {
        greetingText = 'Xin chào Admin';
      } else if (role === 'Giảng viên') {
        greetingText = 'Xin chào Giảng viên';
      } else {
        const parts = (user.fullname || user.email || 'Sinh viên').trim().split(/\s+/);
        const lastName = parts[parts.length - 1] || 'Sinh viên';
        greetingText = `Xin chào, ${escapeHtml(lastName)}`;
      }

      area.innerHTML = `
        <div style="display:flex; align-items:center; gap:10px;">
          <span style="font-weight:700; font-size:13.5px; color:var(--text-main);">${isStaff ? '<i class="fa-solid fa-crown" style="color:#F59E0B; margin-right:4px;"></i>' : ''}${greetingText}</span>
          <a href="${targetDashboard}" class="btn btn-gradient" style="padding:8px 18px; font-size:13px; border-radius:30px; display:inline-flex; align-items:center; gap:6px;">
            <i class="fa-solid ${btnIcon}"></i> ${btnLabel}
          </a>
        </div>
      `;

      // Cập nhật nút Hero nếu có trên index.html
      const heroBtn = document.querySelector('.hero-actions a.btn-gradient');
      if (heroBtn) {
        heroBtn.href = targetDashboard;
        heroBtn.innerHTML = `<i class="fa-solid ${btnIcon}"></i> ${isStaff ? 'Quản lý Hệ thống' : 'Tiếp tục học tập'}`;
      }

      // ẨN HOÀN TOÀN MỤC BẢNG GIÁ & ĐĂNG KÝ GÓI KHI LÀ ADMIN HOẶC ĐÃ ĐĂNG NHẬP
      const pricingSection = document.getElementById('pricing');
      if (pricingSection) {
        pricingSection.style.setProperty('display', 'none', 'important');
      }
      const checkoutModal = document.getElementById('checkout-modal');
      if (checkoutModal) {
        checkoutModal.style.setProperty('display', 'none', 'important');
      }

      document.querySelectorAll('a[href="#pricing"], a[href*="pricing"], .checkout-btn').forEach(el => {
        const li = el.closest('li');
        if (li) li.style.setProperty('display', 'none', 'important');
        else el.style.setProperty('display', 'none', 'important');
      });
    } else {
      area.innerHTML = `<a href="login.html" style="font-weight:600; color:var(--text-main); text-decoration:none; margin-right:12px; font-size:14px;">Đăng nhập</a><a href="#pricing" class="btn btn-gradient" style="padding:9px 20px; font-size:13.5px;">Tham gia ngay</a>`;
    }
  }

  function escapeHtml(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  function syncUserHeader(){
    const user = getCurrentUser();
    if(!user){
      return;
    }
    const name = user.fullname || user.email || 'Sinh viên';
    const initial = name.charAt(0).toUpperCase();
    
    document.querySelectorAll('#display-name').forEach(element => {
      element.textContent = name;
    });
    document.querySelectorAll('#user-avatar, #panel-avatar').forEach(element => {
      element.textContent = initial;
    });
    const welcomeName = document.getElementById('welcome-name');
    if(welcomeName) welcomeName.textContent = name;
    const panelName = document.getElementById('panel-name');
    if(panelName) panelName.textContent = `${name} (Bạn)`;

    // Lấy thông tin session cache tức thì (tránh giật lag)
    try {
      const cachedSession = JSON.parse(localStorage.getItem(SESSION_CACHE_KEY) || 'null');
      if(cachedSession && typeof cachedSession.active === 'number') {
        document.querySelectorAll('.session-status').forEach(element => {
          element.textContent = `Thiết bị đang hoạt động: ${cachedSession.active}/${cachedSession.limit}`;
        });
      }
    } catch(e){}

    document.querySelectorAll('.user-header-logout').forEach(button => {
      if(button.dataset.logoutBound) return;
      button.dataset.logoutBound = 'true';
      button.addEventListener('click', event => {
        event.preventDefault();
        logout();
        window.location.href = 'login.html';
      });
    });
  }

  async function adminRequest(path, options){
    const token = localStorage.getItem(TOKEN_KEY);
    const isFormData = options && options.body instanceof FormData;
    const response = await fetch(path, {
      ...options,
      headers: {
        ...(isFormData ? {} : {'Content-Type': 'application/json'}),
        ...(options && options.headers),
        Authorization: `Bearer ${token || ''}`,
      },
    });
    
    if(response.status === 401){
      logout();
      if(!window.location.pathname.endsWith('login.html')) window.location.href = 'login.html?session=revoked';
    }

    let data = {};
    const text = await response.text();
    try {
      data = text ? JSON.parse(text) : {};
    } catch(err) {
      if (!response.ok) {
        throw new Error(`Máy chủ phản hồi lỗi ${response.status}. Vui lòng khởi động lại server.`);
      }
      data = { raw: text };
    }

    if(!response.ok) throw new Error(data.message || `Lỗi kết nối máy chủ (${response.status})`);
    return data;
  }

  // Public API
  window.Auth = {
    register: registerUser,
    login: loginUser,
    logout: logout,
    adminRequest: adminRequest,
    universityFromEmail: universityFromEmail,
    current: getCurrentUser,
    updateUI: updateAuthUI,
    verifySession: verifyCurrentSession,
    syncHeader: syncUserHeader
  };

  // Change Password logic
  function injectChangePasswordModal() {
    if (document.getElementById('change-password-modal')) return;
    const isForced = localStorage.getItem('unipass_force_pwd_change') === '1';
    
    const modalHtml = `
      <div id="change-password-modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); z-index:9999; justify-content:center; align-items:center; backdrop-filter:blur(6px);">
        <div style="background:var(--surface, #fff); color:var(--text-main, #333); padding:30px; border-radius:16px; width:400px; max-width:90%; box-shadow:0 10px 25px rgba(0,0,0,0.2);">
          <h2 id="cp-title" style="margin-bottom:20px; font-size:20px;">${isForced ? 'Bắt buộc đổi mật khẩu' : 'Đổi mật khẩu'}</h2>
          
          <div id="cp-old-container" style="margin-bottom:15px; ${isForced ? 'display:none;' : ''}">
            <label style="display:block; margin-bottom:5px; font-weight:600; font-size:14px;">Mật khẩu hiện tại</label>
            <input type="password" id="cp-old" style="width:100%; padding:10px; border:1px solid #ccc; border-radius:8px;" placeholder="Nhập mật khẩu hiện tại...">
          </div>
          
          <div style="margin-bottom:20px;">
            <label style="display:block; margin-bottom:5px; font-weight:600; font-size:14px;">Mật khẩu mới</label>
            <input type="password" id="cp-new" style="width:100%; padding:10px; border:1px solid #ccc; border-radius:8px;" placeholder="Nhập mật khẩu mới...">
          </div>
          <div style="display:flex; justify-content:flex-end; gap:10px;">
            ${isForced ? `<button id="cp-logout" style="padding:10px 15px; border:none; background:#eee; color:#333; border-radius:8px; cursor:pointer; font-weight:600;">Đăng xuất</button>` : `<button id="cp-cancel" style="padding:10px 15px; border:none; background:#eee; color:#333; border-radius:8px; cursor:pointer; font-weight:600;">Hủy</button>`}
            <button id="cp-submit" style="padding:10px 15px; border:none; background:var(--primary, #4F46E5); color:#fff; border-radius:8px; cursor:pointer; font-weight:600;">Xác nhận</button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    if (document.getElementById('cp-cancel')) {
      document.getElementById('cp-cancel').addEventListener('click', () => {
        document.getElementById('change-password-modal').style.display = 'none';
        document.getElementById('cp-old').value = '';
        document.getElementById('cp-new').value = '';
      });
    }

    if (document.getElementById('cp-logout')) {
      document.getElementById('cp-logout').addEventListener('click', () => {
        logout();
        window.location.href = 'login.html';
      });
    }
    
    document.getElementById('cp-submit').addEventListener('click', async () => {
      const oldPassword = document.getElementById('cp-old').value;
      const newPassword = document.getElementById('cp-new').value;
      const btn = document.getElementById('cp-submit');
      
      if((oldPassword === undefined || oldPassword === null) || !newPassword) {
        if(window.showAlert) window.showAlert('Vui lòng nhập đầy đủ thông tin', 'error');
        else alert('Vui lòng nhập đầy đủ thông tin');
        return;
      }

      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
      if (!passwordRegex.test(newPassword)) {
        const msg = 'Mật khẩu mới phải dài ít nhất 8 ký tự, bao gồm ít nhất 1 chữ hoa, 1 chữ thường, 1 chữ số và 1 ký tự đặc biệt (VD: Pass@123).';
        if(window.showAlert) window.showAlert(msg, 'error');
        else alert(msg);
        return;
      }
      
      btn.innerText = 'Đang xử lý...';
      btn.disabled = true;
      
      try {
        const res = await fetch('/api/user/change-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + localStorage.getItem(TOKEN_KEY)
          },
          body: JSON.stringify({ oldPassword, newPassword })
        });
        const data = await res.json();
        
        if(res.ok) {
          if(window.showAlert) window.showAlert(data.message, 'success');
          else alert(data.message);
          if(document.getElementById('cp-cancel')) {
            document.getElementById('cp-cancel').click();
          } else {
            document.getElementById('change-password-modal').style.display = 'none';
            localStorage.removeItem('unipass_force_pwd_change');
            window.location.reload();
          }
        } else {
          throw new Error(data.message);
        }
      } catch(err) {
        if(window.showAlert) window.showAlert(err.message, 'error');
        else alert(err.message);
      } finally {
        btn.innerText = 'Xác nhận';
        btn.disabled = false;
      }
    });
  }

  
  // Injects Device Manager Modal
  function injectDeviceManagerModal() {
    if (document.getElementById('device-manager-modal')) return;
    
    const modalHtml = `
      <div id="device-manager-modal" style="display: none; position: fixed; inset: 0; background: rgba(15, 23, 42, 0.65); backdrop-filter: blur(8px); z-index: 999999; align-items: center; justify-content: center; padding: 20px;">
        <div style="background: var(--surface, #ffffff); border: 1px solid var(--border-color, #e2e8f0); border-radius: 20px; width: 100%; max-width: 480px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); overflow: hidden; animation: popIn 0.25s ease-out;">
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid var(--border-color, #e2e8f0); background: var(--bg-color, #f8fafc);">
            <div style="font-weight: 800; font-size: 16.5px; color: var(--text-main, #1e293b); display: flex; align-items: center; gap: 8px;">
              <i class="fa-solid fa-laptop-medical" style="color: var(--primary, #4F46E5);"></i> Quản lý Thiết bị Đăng nhập
            </div>
            <button type="button" id="dm-close" style="background: transparent; border: none; font-size: 18px; color: var(--text-muted, #64748b); cursor: pointer; padding: 4px 8px; border-radius: 8px;"><i class="fa-solid fa-xmark"></i></button>
          </div>
          
          <div style="padding: 24px;">
            <div style="font-size: 13.5px; color: var(--text-muted, #64748b); margin-bottom: 16px; line-height: 1.5;">
              Tài khoản UniPass cho phép đăng nhập tối đa <strong style="color: var(--text-main, #1e293b);">2 thiết bị đồng thời</strong> để bảo vệ bản quyền tài liệu.
            </div>

            <div id="dm-sessions-list" style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px;">
              <div style="text-align: center; padding: 20px; color: var(--text-muted, #64748b);">
                <i class="fa-solid fa-spinner fa-spin"></i> Đang kiểm tra thiết bị...
              </div>
            </div>

            <div style="background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 12px; padding: 12px 16px; margin-bottom: 20px; font-size: 12.5px; color: var(--danger, #ef4444); display: flex; gap: 10px; align-items: flex-start;">
              <i class="fa-solid fa-shield-halved" style="margin-top: 2px; font-size: 14px;"></i>
              <div>Nếu bạn nghi ngờ có phiên đăng nhập lạ hoặc bị treo session cũ, hãy bấm nút đăng xuất bên dưới.</div>
            </div>

            <div style="display: flex; gap: 12px; justify-content: flex-end;">
              <button type="button" id="dm-btn-close-footer" class="btn btn-outline" style="padding: 8px 16px; border-radius: 10px; font-weight: 700; cursor: pointer; border: 1px solid var(--border-color, #e2e8f0); background: transparent; color: var(--text-main, #1e293b);">Đóng</button>
              <button type="button" id="dm-btn-logout-others" class="btn" style="padding: 8px 18px; border-radius: 10px; font-weight: 700; cursor: pointer; border: none; background: #EF4444; color: #ffffff; display: inline-flex; align-items: center; gap: 6px;">
                <i class="fa-solid fa-arrow-right-from-bracket"></i> Đăng xuất thiết bị khác
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const modal = document.getElementById('device-manager-modal');
    const closeBtn = document.getElementById('dm-close');
    const closeFooter = document.getElementById('dm-btn-close-footer');
    const logoutOthersBtn = document.getElementById('dm-btn-logout-others');

    const closeModal = () => { modal.style.display = 'none'; };
    closeBtn.addEventListener('click', closeModal);
    closeFooter.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    logoutOthersBtn.addEventListener('click', async () => {
      logoutOthersBtn.disabled = true;
      logoutOthersBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang xử lý...';

      try {
        const token = localStorage.getItem(TOKEN_KEY);
        const res = await fetch('/api/auth/logout-other-devices', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          }
        });
        const data = await res.json();
        if (res.ok) {
          updateSessionStatus(data.session || { active: 1, limit: 2 });
          if (window.showToast) window.showToast('Đã đăng xuất khỏi tất cả các thiết bị khác thành công!', 'success');
          else if (window.showAlert) window.showAlert('Đã đăng xuất khỏi tất cả các thiết bị khác thành công!', 'success');
          else alert('Đã đăng xuất khỏi tất cả các thiết bị khác thành công!');
          closeModal();
        } else {
          throw new Error(data.message || 'Lỗi xử lý');
        }
      } catch (err) {
        if (window.showAlert) window.showAlert(err.message, 'error');
        else alert(err.message);
      } finally {
        logoutOthersBtn.disabled = false;
        logoutOthersBtn.innerHTML = '<i class="fa-solid fa-arrow-right-from-bracket"></i> Đăng xuất thiết bị khác';
      }
    });
  }

  async function openDeviceManagerModal() {
    injectDeviceManagerModal();
    const modal = document.getElementById('device-manager-modal');
    modal.style.display = 'flex';

    const listContainer = document.getElementById('dm-sessions-list');
    listContainer.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--text-muted, #64748b);"><i class="fa-solid fa-spinner fa-spin"></i> Đang kiểm tra thiết bị...</div>';

    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const res = await fetch('/api/auth/sessions', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (!res.ok) throw new Error('Không thể tải danh sách thiết bị');
      const data = await res.json();
      const sessions = data.sessions || [];

      updateSessionStatus({ active: sessions.length, limit: data.limit || 2 });

      if (sessions.length === 0) {
        listContainer.innerHTML = '<div style="color: var(--text-muted); font-size: 13px;">Chưa có thông tin thiết bị.</div>';
        return;
      }

      let html = '';
      sessions.forEach(s => {
        const isCurrent = s.isCurrent;
        html += `
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; border: 1px solid ${isCurrent ? 'var(--primary, #4F46E5)' : 'var(--border-color, #e2e8f0)'}; border-radius: 12px; background: ${isCurrent ? 'rgba(79, 70, 229, 0.05)' : 'var(--bg-color, #f8fafc)'};">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 36px; height: 36px; border-radius: 10px; background: ${isCurrent ? 'var(--primary, #4F46E5)' : '#94A3B8'}; color: white; display: flex; align-items: center; justify-content: center; font-size: 16px;">
                <i class="fa-solid ${isCurrent ? 'fa-laptop' : 'fa-mobile-screen'}"></i>
              </div>
              <div>
                <div style="font-weight: 700; font-size: 13.5px; color: var(--text-main, #1e293b);">
                  ${isCurrent ? 'Thiết bị này (Trình duyệt hiện tại)' : 'Thiết bị khác (Phiên đăng nhập khác)'}
                </div>
                <div style="font-size: 11.5px; color: var(--text-muted, #64748b);">
                  ${isCurrent ? 'Đang hoạt động trực tiếp' : 'Đã đăng nhập trước đó'}
                </div>
              </div>
            </div>
            ${isCurrent ? '<span style="font-size: 11.5px; font-weight: 700; color: #10B981; background: rgba(16, 185, 129, 0.1); padding: 4px 10px; border-radius: 20px;">Hiện tại</span>' : '<span style="font-size: 11.5px; font-weight: 700; color: var(--text-muted, #64748b); background: rgba(100, 116, 139, 0.1); padding: 4px 10px; border-radius: 20px;">Đang mở</span>'}
          </div>
        `;
      });

      listContainer.innerHTML = html;
    } catch (err) {
      listContainer.innerHTML = `<div style="color: var(--danger); font-size: 13px;">Lỗi: ${err.message}</div>`;
    }
  }

  window.openDeviceManagerModal = openDeviceManagerModal;
  window.setupUserProfileDropdown = setupUserProfileDropdown;

  // Injects Floating User Profile Dropdown
  function setupUserProfileDropdown() {
    // Add dropdown CSS styles
    if (!document.getElementById('user-profile-dropdown-styles')) {
      const style = document.createElement('style');
      style.id = 'user-profile-dropdown-styles';
      style.textContent = `
        .user-profile, #user-profile {
          position: relative;
          cursor: pointer;
          user-select: none;
          transition: all 0.2s ease;
        }
        .user-profile:hover, #user-profile:hover {
          opacity: 0.9;
        }
        .user-profile .fa-chevron-down, #user-profile .fa-chevron-down {
          transition: transform 0.2s ease;
        }
        .user-profile.dropdown-open .fa-chevron-down, #user-profile.dropdown-open .fa-chevron-down {
          transform: rotate(180deg);
        }
        .user-profile-dropdown-menu {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          min-width: 240px;
          background: var(--surface, #ffffff);
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 16px;
          box-shadow: 0 20px 35px -8px rgba(0, 0, 0, 0.18), 0 8px 16px -4px rgba(0, 0, 0, 0.1);
          padding: 8px;
          z-index: 99999;
          display: none;
          flex-direction: column;
          gap: 4px;
          backdrop-filter: blur(16px);
          animation: dropFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        [data-theme="dark"] .user-profile-dropdown-menu {
          background: rgba(30, 41, 59, 0.95);
          border-color: rgba(255, 255, 255, 0.1);
          box-shadow: 0 20px 40px -8px rgba(0, 0, 0, 0.5);
        }
        @keyframes dropFadeIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .user-profile-dropdown-menu.show {
          display: flex;
        }
        .dropdown-menu-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          border-radius: 10px;
          color: var(--text-main, #1e293b);
          font-size: 13.5px;
          font-weight: 600;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.15s ease;
          border: none;
          background: transparent;
          width: 100%;
          text-align: left;
        }
        .dropdown-menu-item:hover {
          background: var(--surface-hover, rgba(79, 70, 229, 0.08));
          color: var(--primary, #4F46E5);
          transform: translateX(2px);
        }
        .dropdown-menu-item i {
          font-size: 15px;
          width: 20px;
          text-align: center;
          color: var(--primary, #4F46E5);
        }
        .dropdown-item-badge {
          margin-left: auto;
          font-size: 11px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 12px;
          background: rgba(16, 185, 129, 0.12);
          color: #10B981;
        }
      `;
      document.head.appendChild(style);
    }

    document.querySelectorAll('.user-profile, #user-profile').forEach(profileEl => {
      if (profileEl.dataset.dropdownBound) return;
      profileEl.dataset.dropdownBound = 'true';

      // Create Dropdown Menu
      let dropdown = profileEl.querySelector('.user-profile-dropdown-menu');
      if (!dropdown) {
        dropdown = document.createElement('div');
        dropdown.className = 'user-profile-dropdown-menu';
        dropdown.innerHTML = `
          <button type="button" class="dropdown-menu-item" id="menu-btn-change-pwd">
            <i class="fa-solid fa-key"></i>
            <span>Đổi mật khẩu</span>
          </button>
          <button type="button" class="dropdown-menu-item" id="menu-btn-devices">
            <i class="fa-solid fa-laptop-medical"></i>
            <span>Quản lý thiết bị</span>
            <span class="dropdown-item-badge" id="menu-device-count">1/2</span>
          </button>
        `;
        profileEl.appendChild(dropdown);
      }

      profileEl.addEventListener('click', (e) => {
        // Prevent click inside dropdown items from triggering profile toggle
        if (e.target.closest('#menu-btn-change-pwd')) {
          e.stopPropagation();
          dropdown.classList.remove('show');
          profileEl.classList.remove('dropdown-open');
          injectChangePasswordModal();
          document.getElementById('change-password-modal').style.display = 'flex';
          return;
        }

        if (e.target.closest('#menu-btn-devices')) {
          e.stopPropagation();
          dropdown.classList.remove('show');
          profileEl.classList.remove('dropdown-open');
          openDeviceManagerModal();
          return;
        }

        if (e.target.closest('.user-header-logout, #admin-logout')) return;

        e.stopPropagation();
        const isOpen = dropdown.classList.contains('show');
        // Close all other dropdowns
        document.querySelectorAll('.user-profile-dropdown-menu').forEach(d => d.classList.remove('show'));
        document.querySelectorAll('.user-profile, #user-profile').forEach(p => p.classList.remove('dropdown-open'));

        if (!isOpen) {
          dropdown.classList.add('show');
          profileEl.classList.add('dropdown-open');
          // Update device badge in dropdown
          try {
            const cached = JSON.parse(localStorage.getItem(SESSION_CACHE_KEY) || 'null');
            const badge = dropdown.querySelector('#menu-device-count');
            if (badge && cached && typeof cached.active === 'number') {
              badge.textContent = `${cached.active}/${cached.limit}`;
            }
          } catch(err){}
        }
      });
    });

    // Close dropdown on outside click
    document.addEventListener('click', () => {
      document.querySelectorAll('.user-profile-dropdown-menu').forEach(d => d.classList.remove('show'));
      document.querySelectorAll('.user-profile, #user-profile').forEach(p => p.classList.remove('dropdown-open'));
    });
  }


  // Run header sync immediately (if elements present) and on DOMContentLoaded
  syncUserHeader();
  document.addEventListener('DOMContentLoaded', () => {
    syncUserHeader();
    updateAuthUI();
    injectChangePasswordModal();
    
    if (localStorage.getItem('unipass_force_pwd_change') === '1') {
      document.getElementById('change-password-modal').style.display = 'flex';
    }
    
    setupUserProfileDropdown();
    if(localStorage.getItem(TOKEN_KEY)) {
      verifyCurrentSession(true);
      window.setInterval(() => verifyCurrentSession(true), SESSION_CHECK_INTERVAL);
    }
    window.addEventListener('pageshow', () => {
      syncUserHeader();
      verifyCurrentSession(true);
    });
  });
})();
