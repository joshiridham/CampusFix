document.addEventListener('DOMContentLoaded', () => {
  renderNavbar();
  initLoginForm();
  initRegisterForm();
  initLogout();
});

function renderNavbar() {
  const user = API.getUser();
  const navUserContainer = document.getElementById('navUserContainer');
  const navRoleLink = document.getElementById('navRoleLink');

  if (navUserContainer) {
    if (user) {
      let dashboardUrl = 'student-dashboard.html';
      if (user.role === 'admin') dashboardUrl = 'admin-dashboard.html';
      if (user.role === 'staff') dashboardUrl = 'staff-dashboard.html';

      if (navRoleLink) {
        navRoleLink.href = dashboardUrl;
      }

      navUserContainer.innerHTML = `
        <li class="nav-item dropdown">
          <a class="nav-link dropdown-toggle text-white d-flex align-items-center gap-2" href="#" role="button" data-bs-toggle="dropdown">
            <span class="avatar-circle bg-primary text-white rounded-circle d-inline-flex justify-content-center align-items-center" style="width:32px; height:32px; font-weight:700; font-size:0.85rem;">
              ${escapeHtml(user.name ? user.name.charAt(0).toUpperCase() : 'U')}
            </span>
            <span class="d-none d-md-inline fw-semibold">${escapeHtml(user.name)}</span>
            <span class="badge bg-secondary text-capitalize" style="font-size:0.7rem;">${escapeHtml(user.role)}</span>
          </a>
          <ul class="dropdown-menu dropdown-menu-end shadow border-0">
            <li><a class="dropdown-item" href="${dashboardUrl}"><i class="bi bi-speedometer2 me-2"></i>Dashboard</a></li>
            <li><a class="dropdown-item" href="profile.html"><i class="bi bi-person me-2"></i>My Profile</a></li>
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item text-danger" href="#" id="btnLogout"><i class="bi bi-box-arrow-right me-2"></i>Logout</a></li>
          </ul>
        </li>
      `;
    } else {
      navUserContainer.innerHTML = `
        <li class="nav-item">
          <a class="nav-link text-white me-2" href="login.html">Login</a>
        </li>
        <li class="nav-item">
          <a class="btn btn-sm btn-primary-custom" href="register.html">Register Student</a>
        </li>
      `;
    }
  }
}

function initLoginForm() {
  const loginForm = document.getElementById('loginForm');
  if (!loginForm) return;

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const alertBox = document.getElementById('loginAlert');
    const submitBtn = document.getElementById('btnLoginSubmit');

    if (!email || !password) {
      showAlert(alertBox, 'Please enter email address and password.', 'danger');
      return;
    }

    try {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Signing in...';

      const data = await API.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      API.setSession(data.token, data.user);

      showAlert(alertBox, 'Sign in successful! Redirecting...', 'success');

      setTimeout(() => {
        if (data.user.role === 'admin') {
          window.location.href = 'admin-dashboard.html';
        } else if (data.user.role === 'staff') {
          window.location.href = 'staff-dashboard.html';
        } else {
          window.location.href = 'student-dashboard.html';
        }
      }, 700);

    } catch (err) {
      showAlert(alertBox, err.message || 'Login failed. Please verify credentials.', 'danger');
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Sign In';
    }
  });
}

function initRegisterForm() {
  const regForm = document.getElementById('registerForm');
  if (!regForm) return;

  regForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const phone = document.getElementById('phone') ? document.getElementById('phone').value.trim() : '';

    const alertBox = document.getElementById('regAlert');
    const submitBtn = document.getElementById('btnRegSubmit');

    if (!name || !email || !password) {
      showAlert(alertBox, 'Please fill in all required fields.', 'danger');
      return;
    }

    try {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Creating account...';

      const data = await API.request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, phone })
      });

      API.setSession(data.token, data.user);
      showAlert(alertBox, 'Student account created successfully! Redirecting...', 'success');

      setTimeout(() => {
        window.location.href = 'student-dashboard.html';
      }, 700);

    } catch (err) {
      showAlert(alertBox, err.message || 'Registration failed.', 'danger');
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Create Student Account';
    }
  });
}

function initLogout() {
  document.addEventListener('click', (e) => {
    if (e.target && (e.target.id === 'btnLogout' || e.target.closest('#btnLogout'))) {
      e.preventDefault();
      API.clearSession();
      window.location.href = 'login.html';
    }
  });
}

function requireAuth(allowedRoles = []) {
  const user = API.getUser();
  if (!user) {
    window.location.href = 'login.html?auth=required';
    return false;
  }
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    alert(`Access Denied: Your account role '${user.role}' is not authorized to view this portal.`);
    if (user.role === 'admin') window.location.href = 'admin-dashboard.html';
    else if (user.role === 'staff') window.location.href = 'staff-dashboard.html';
    else window.location.href = 'student-dashboard.html';
    return false;
  }
  return user;
}
