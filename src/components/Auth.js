// Auth.js
const KEY = 'date_app_user_id';

export function getStoredUser() {
  return localStorage.getItem(KEY);
}

export function setStoredUser(userId) {
  localStorage.setItem(KEY, userId);
}

export function clearStoredUser() {
  localStorage.removeItem(KEY);
}

export function renderLoginScreen(rootElement, onLogin) {
  rootElement.innerHTML = `
    <div class="login-screen fade-in">
      <div class="login-card">
        <h1 class="login-title">日程調整</h1>
        <div class="input-group">
          <input type="text" id="userIdInput" class="input-field" placeholder="ユーザーID" />
        </div>
        <button id="loginBtn" class="btn-primary">ログイン</button>
      </div>
    </div>
  `;

  const btn = rootElement.querySelector('#loginBtn');
  const input = rootElement.querySelector('#userIdInput');

  const handleSubmit = () => {
    const val = input.value.trim();
    if (val) onLogin(val);
  };

  btn.addEventListener('click', handleSubmit);
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSubmit();
  });
}
