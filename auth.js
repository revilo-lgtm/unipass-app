;(function(){
  const USERS_KEY = 'unipass_users_v1';
  const CURR_KEY = 'unipass_current_v1';
  const TOKEN_KEY = 'unipass_token';
  const USER_KEY = 'unipass_user';
  const DEVICE_KEY = 'unipass_device_id';
  const SESSION_CHECK_INTERVAL = 5000;
  const UNIVERSITY_DOMAINS = {
    'st.ueh.edu.vn': 'UEH',
    'hcmut.edu.vn': 'BK',
    'ftu.edu.vn': 'FTU',
    'st.neu.edu.vn': 'NEU',
    'hcmus.edu.vn': 'HCMUS',
    'tdtu.edu.vn': 'TDTU',
  };

  function universityFromEmail(email){
    const domain = String(email || '').toLowerCase().split('@')[1];
    return UNIVERSITY_DOMAINS[domain] || null;
  }

  function getUsers(){
    try{ return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); }catch(e){ return []; }
  }
  function saveUsers(users){ localStorage.setItem(USERS_KEY, JSON.stringify(users)); }

  async function registerUser({fullname,email,password,university}){
    if(!email || !password) return {ok:false, msg:'Email và mật khẩu là bắt buộc.'};

    try {
      const apiUrl = window.location.protocol === 'file:'
        ? 'http://localhost:3000/api/register'
        : '/api/register';
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({fullname, email, password, university}),
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
    if(!email || !password) return {ok:false, msg:'Email và mật khẩu là bắt buộc.'};
    const normalizedEmail = email.trim().toLowerCase();
    if(normalizedEmail !== 'admin' && !universityFromEmail(normalizedEmail)){
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
      updateAuthUI();
      return {ok:true, user};
      
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
        updateSessionStatus(sessionData.session);
        return true;
      }
      const errorData = sessionData;
      if(errorData.code === 'SESSION_REPLACED') localStorage.setItem('unipass_session_notice', 'Tài khoản đang được đăng nhập trên thiết bị khác. Phiên trên thiết bị này đã đăng xuất.');
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
    }catch(e){
      // Fall back to the legacy user store below.
    }
    return getUsers().find(u=>u.email === email) || null;
  }

  function updateAuthUI(){
    const area = document.getElementById('auth-area');
    if(!area) return;
    const user = getCurrentUser();
    if(user){
      const short = (user.fullname||user.email).split(' ')[0];
      area.innerHTML = `<span style="font-weight:700; margin-right:12px">Xin chào, ${escapeHtml(short)}</span><button id="logout-btn" class="btn btn-outline">Đăng xuất</button>`;
      const btn = document.getElementById('logout-btn');
      if(btn) btn.addEventListener('click', ()=>{ logout(); window.location.href = 'index.html'; });
    } else {
      area.innerHTML = `<a href="login.html" style="font-weight:600; color:var(--text-main); text-decoration:none; margin-right:10px">Đăng nhập</a><a href="#pricing" class="btn btn-gradient">Tham gia ngay</a>`;
    }
  }

  function escapeHtml(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  function syncUserHeader(){
    const user = getCurrentUser();
    if(!user){
      document.querySelectorAll('#display-name').forEach(element => element.classList.add('is-ready'));
      return;
    }
    const name = user.fullname || user.email || 'Sinh viên';
    const initial = name.charAt(0).toUpperCase();
    document.querySelectorAll('#display-name').forEach(element => {
      if(element.textContent !== name) element.textContent = name;
      element.classList.add('is-ready');
    });
    document.querySelectorAll('#user-avatar, #panel-avatar').forEach(element => {
      if(element.textContent !== initial) element.textContent = initial;
    });
    const welcomeName = document.getElementById('welcome-name');
    if(welcomeName) welcomeName.textContent = name;
    const panelName = document.getElementById('panel-name');
    if(panelName) panelName.textContent = `${name} (Bạn)`;

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
    const data = await response.json();
    if(response.status === 401){
      logout();
      if(!window.location.pathname.endsWith('login.html')) window.location.href = 'login.html?session=revoked';
    }
    if(!response.ok) throw new Error(data.message || 'Không thể thực hiện thao tác.');
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
  };

  syncUserHeader();
  document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    if(localStorage.getItem(TOKEN_KEY)) {
      verifyCurrentSession(true);
      window.setInterval(() => verifyCurrentSession(true), SESSION_CHECK_INTERVAL);
    }
    window.addEventListener('pageshow', () => verifyCurrentSession(true));
  });
})();
