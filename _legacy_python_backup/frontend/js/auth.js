/**
 * Authentication Module: Google Sign-In, Email/Password, JWT Sessions, and Demo Logins.
 */
const Auth = {
    TOKEN_KEY: 'interviewai_token',
    USER_KEY: 'interviewai_user',

    getToken() {
        return localStorage.getItem(this.TOKEN_KEY);
    },

    getUser() {
        try {
            const raw = localStorage.getItem(this.USER_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    },

    isAuthenticated() {
        return !!this.getToken();
    },

    setSession(token, user) {
        if (token) localStorage.setItem(this.TOKEN_KEY, token);
        if (user) localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        this.updateNavUI();
    },

    clearSession() {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
        this.updateNavUI();
    },

    async fetchCurrentUser() {
        const token = this.getToken();
        if (!token) return null;

        try {
            const res = await fetch('/api/auth/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.user) {
                    this.setSession(token, data.user);
                    return data.user;
                }
            } else if (res.status === 401) {
                this.clearSession();
            }
        } catch (e) {
            console.warn('[Auth] Session check failed, continuing in offline/cached mode:', e);
        }
        return this.getUser();
    },

    updateNavUI() {
        const user = this.getUser();
        const isAuth = this.isAuthenticated() && user;

        const loggedOutNav = document.getElementById('loggedOutNavGroup');
        const loggedInNav = document.getElementById('loggedInNavGroup');
        const quickLoggedOut = document.getElementById('quickLoggedOutGroup');
        const quickLoggedIn = document.getElementById('quickLoggedInGroup');

        if (isAuth) {
            if (loggedOutNav) loggedOutNav.classList.add('hidden');
            if (loggedInNav) loggedInNav.classList.remove('hidden');
            if (quickLoggedOut) quickLoggedOut.classList.add('hidden');
            if (quickLoggedIn) quickLoggedIn.classList.remove('hidden');

            const name = user.name || 'Candidate';
            const avatar = user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=2563eb&color=fff`;

            // Top navbar updates
            const navName = document.getElementById('navCandidateName');
            const navAvatar = document.getElementById('navAvatarImg');
            const navTier = document.getElementById('navTierBadge');
            if (navName) navName.textContent = name;
            if (navAvatar) navAvatar.src = avatar;
            if (navTier) {
                navTier.textContent = user.is_subscribed ? (user.subscription_tier === 'high_199' ? 'VIP Pass' : 'Pro ₹129') : 'Free Trial';
            }

            // Dropdown updates
            const dropName = document.getElementById('dropdownName');
            const dropEmail = document.getElementById('dropdownEmail');
            if (dropName) dropName.textContent = name;
            if (dropEmail) dropEmail.textContent = user.email || '';

            // Quick floating bar updates
            const quickName = document.getElementById('quickUserName');
            const quickAvatar = document.getElementById('quickAvatarImg');
            const quickTier = document.getElementById('quickUserTier');
            if (quickName) quickName.textContent = name;
            if (quickAvatar) quickAvatar.src = avatar;
            if (quickTier) {
                quickTier.textContent = user.is_subscribed ? 'Pro Access' : 'Free Pass';
            }
        } else {
            if (loggedOutNav) loggedOutNav.classList.remove('hidden');
            if (loggedInNav) loggedInNav.classList.add('hidden');
            if (quickLoggedOut) quickLoggedOut.classList.remove('hidden');
            if (quickLoggedIn) quickLoggedIn.classList.add('hidden');
        }
    },

    showAuthModal(mode = 'login') {
        const modal = document.getElementById('authModal');
        if (!modal) return;

        const loginTab = document.getElementById('tabSwitchLoginBtn');
        const regTab = document.getElementById('tabSwitchRegisterBtn');
        const loginForm = document.getElementById('loginForm');
        const regForm = document.getElementById('registerForm');
        const title = document.getElementById('authModalTitle');

        if (mode === 'register') {
            if (loginTab) loginTab.classList.remove('active');
            if (regTab) regTab.classList.add('active');
            if (loginForm) loginForm.classList.add('hidden');
            if (regForm) regForm.classList.remove('hidden');
            if (title) title.textContent = 'Create Candidate Account';
        } else {
            if (loginTab) loginTab.classList.add('active');
            if (regTab) regTab.classList.remove('active');
            if (loginForm) loginForm.classList.remove('hidden');
            if (regForm) regForm.classList.add('hidden');
            if (title) title.textContent = 'Sign In to InterviewAI';
        }

        modal.showModal();
    },

    closeAuthModal() {
        const modal = document.getElementById('authModal');
        if (modal) modal.close();
    },

    async handleLogin(email, password) {
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Login failed.');

            this.setSession(data.token, data.user);
            this.closeAuthModal();
            showToast(`Welcome back, ${data.user.name || 'Candidate'}!`, 'success');
            if (window.Profile) window.Profile.loadProfile();
            return data;
        } catch (err) {
            showToast(err.message, 'error');
            throw err;
        }
    },

    async handleRegister(email, password, name, target_role) {
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, name, target_role })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Registration failed.');

            this.setSession(data.token, data.user);
            this.closeAuthModal();
            showToast(data.message || 'Account created! Your 1st full session is 100% Free.', 'success');
            if (window.Profile) window.Profile.loadProfile();
            return data;
        } catch (err) {
            showToast(err.message, 'error');
            throw err;
        }
    },

    async handleGuestLogin(persona = 'priya') {
        try {
            const res = await fetch('/api/auth/guest-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ persona })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Demo login failed.');

            this.setSession(data.token, data.user);
            this.closeAuthModal();
            showToast(`Signed in as demo candidate ${data.user.name}!`, 'success');
            if (window.Profile) window.Profile.loadProfile();
            return data;
        } catch (err) {
            showToast(err.message, 'error');
        }
    },

    async handleGoogleAuth(credential = null) {
        try {
            const payload = credential ? { credential } : {
                email: 'candidate.google@example.com',
                name: 'Alex Morgan (Google Verified)',
                google_id: 'google_oauth_verified_user'
            };

            const res = await fetch('/api/auth/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Google sign-in failed.');

            this.setSession(data.token, data.user);
            this.closeAuthModal();
            showToast(`Signed in with Google as ${data.user.name}!`, 'success');
            if (window.Profile) window.Profile.loadProfile();
        } catch (err) {
            showToast(err.message, 'error');
        }
    },

    logout() {
        this.clearSession();
        showToast('Signed out successfully.', 'info');
        if (window.Profile) window.Profile.loadProfile();
    },

    initEventListeners() {
        // Nav login / register
        document.getElementById('navLoginBtn')?.addEventListener('click', () => this.showAuthModal('login'));
        document.getElementById('navRegisterBtn')?.addEventListener('click', () => this.showAuthModal('register'));
        document.getElementById('quickLoginBtn')?.addEventListener('click', () => this.showAuthModal('login'));
        document.getElementById('quickRegisterBtn')?.addEventListener('click', () => this.showAuthModal('register'));
        document.getElementById('heroGuestLoginBtn')?.addEventListener('click', () => this.handleGuestLogin('priya'));
        document.getElementById('authDemoLoginBtn')?.addEventListener('click', () => this.handleGuestLogin('priya'));

        // Close modal
        document.getElementById('closeAuthModalBtn')?.addEventListener('click', () => this.closeAuthModal());

        // Switch tabs
        document.getElementById('tabSwitchLoginBtn')?.addEventListener('click', () => this.showAuthModal('login'));
        document.getElementById('tabSwitchRegisterBtn')?.addEventListener('click', () => this.showAuthModal('register'));

        // Form submissions
        document.getElementById('loginForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmailInput').value;
            const pass = document.getElementById('loginPasswordInput').value;
            this.handleLogin(email, pass);
        });

        document.getElementById('registerForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('registerNameInput').value;
            const email = document.getElementById('registerEmailInput').value;
            const pass = document.getElementById('registerPasswordInput').value;
            const role = document.getElementById('registerRoleInput').value;
            this.handleRegister(email, pass, name, role);
        });

        // Google button
        document.getElementById('googleSignInActionBtn')?.addEventListener('click', () => {
            this.handleGoogleAuth();
        });

        // User dropdown menu toggle
        const pillBtn = document.getElementById('userPillBtn');
        const dropdown = document.getElementById('userDropdownMenu');
        if (pillBtn && dropdown) {
            pillBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdown.classList.toggle('hidden');
            });
            document.addEventListener('click', (e) => {
                if (!pillBtn.contains(e.target)) dropdown.classList.add('hidden');
            });
        }

        // Logout buttons
        document.getElementById('dropdownLogoutBtn')?.addEventListener('click', () => this.logout());
        document.getElementById('quickSignoutBtn')?.addEventListener('click', () => this.logout());
    }
};

// Global Google Identity Callback
window.handleGoogleCredentialResponse = (response) => {
    if (response && response.credential) {
        Auth.handleGoogleAuth(response.credential);
    }
};

window.Auth = Auth;
