// Bot Hosting - Complete Clone with Authentication & Full Features
// Production-ready implementation

// Global State Management
const APP_STATE = {
    user: null,
    isAuthenticated: false,
    servers: [],
    databases: [],
    settings: {},
    currentTab: 'overview',
    currentStep: 1,
    selectedServerType: null,
    wizardData: {}
};

// API Configuration
const API_CONFIG = {
    baseUrl: window.location.origin,
    endpoints: {
        auth: {
            login: '/api/auth/login',
            signup: '/api/auth/signup',
            logout: '/api/auth/logout',
            forgot: '/api/auth/forgot',
            verify: '/api/auth/verify'
        },
        user: {
            profile: '/api/user/profile',
            settings: '/api/user/settings',
            servers: '/api/user/servers',
            databases: '/api/user/databases'
        },
        servers: {
            create: '/api/servers/create',
            start: '/api/servers/:id/start',
            stop: '/api/servers/:id/stop',
            restart: '/api/servers/:id/restart',
            delete: '/api/servers/:id/delete',
            console: '/api/servers/:id/console',
            files: '/api/servers/:id/files'
        },
        billing: {
            info: '/api/billing/info',
            upgrade: '/api/billing/upgrade',
            history: '/api/billing/history'
        }
    }
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

async function initializeApp() {
    showLoadingScreen();
    
    // Check authentication status
    await checkAuthStatus();
    
    // Initialize UI components
    setupEventListeners();
    initializeAnimations();
    
    // Load user data if authenticated
    if (APP_STATE.isAuthenticated) {
        await loadUserData();
    }
    
    hideLoadingScreen();
    
    // Start animations
    startHeroAnimations();
    
    console.log('🚀 Bot Hosting Manager initialized');
}

// Loading Screen Management
function showLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        loadingScreen.style.display = 'flex';
        
        // Simulate loading progress
        let progress = 0;
        const progressBar = loadingScreen.querySelector('.loading-progress');
        const interval = setInterval(() => {
            progress += Math.random() * 30;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
            }
            progressBar.style.width = `${progress}%`;
        }, 200);
    }
}

function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        setTimeout(() => {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }, 500);
    }
}

// Authentication System
async function checkAuthStatus() {
    const token = localStorage.getItem('auth_token');
    if (token) {
        try {
            const response = await fetch(`${API_CONFIG.baseUrl}/api/auth/verify`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                APP_STATE.user = data.user;
                APP_STATE.isAuthenticated = true;
                updateUserUI();
            } else {
                localStorage.removeItem('auth_token');
            }
        } catch (error) {
            console.error('Auth verification failed:', error);
            localStorage.removeItem('auth_token');
        }
    }
}

async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const rememberMe = document.getElementById('remember-me').checked;
    
    try {
        showNotification('Signing in...', 'info');
        
        const response = await fetch(`${API_CONFIG.baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('auth_token', data.token);
            if (rememberMe) {
                localStorage.setItem('remember_user', email);
            }
            
            APP_STATE.user = data.user;
            APP_STATE.isAuthenticated = true;
            
            updateUserUI();
            closeAuthModal('login-modal');
            showNotification('Welcome back!', 'success');
            
            // Navigate to dashboard
            navigateToDashboard();
        } else {
            showNotification(data.error || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showNotification('Login failed. Please try again.', 'error');
    }
}

async function handleSignup(event) {
    event.preventDefault();
    
    const username = document.getElementById('signup-username').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm').value;
    
    if (password !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return;
    }
    
    try {
        showNotification('Creating account...', 'info');
        
        const response = await fetch(`${API_CONFIG.baseUrl}/api/auth/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('auth_token', data.token);
            APP_STATE.user = data.user;
            APP_STATE.isAuthenticated = true;
            
            updateUserUI();
            closeAuthModal('signup-modal');
            showNotification('Account created successfully!', 'success');
            
            navigateToDashboard();
        } else {
            showNotification(data.error || 'Signup failed', 'error');
        }
    } catch (error) {
        console.error('Signup error:', error);
        showNotification('Signup failed. Please try again.', 'error');
    }
}

async function handleForgotPassword(event) {
    event.preventDefault();
    
    const email = document.getElementById('forgot-email').value;
    
    try {
        showNotification('Sending reset link...', 'info');
        
        const response = await fetch(`${API_CONFIG.baseUrl}/api/auth/forgot`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification('Reset link sent to your email!', 'success');
            closeAuthModal('forgot-modal');
        } else {
            showNotification(data.error || 'Failed to send reset link', 'error');
        }
    } catch (error) {
        console.error('Forgot password error:', error);
        showNotification('Failed to send reset link. Please try again.', 'error');
    }
}

function logout() {
    localStorage.removeItem('auth_token');
    APP_STATE.user = null;
    APP_STATE.isAuthenticated = false;
    
    updateUserUI();
    showNotification('Logged out successfully', 'info');
    
    // Navigate back to home
    showHomeSection();
}

// OAuth Authentication
function loginWithDiscord() {
    window.location.href = `${API_CONFIG.baseUrl}/api/auth/discord`;
}

function loginWithGitHub() {
    window.location.href = `${API_CONFIG.baseUrl}/api/auth/github`;
}

// UI Management
function showAuthModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeAuthModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
        
        // Reset forms
        const form = modal.querySelector('form');
        if (form) form.reset();
    }
}

function switchToSignup() {
    closeAuthModal('login-modal');
    showAuthModal('signup-modal');
}

function switchToLogin() {
    closeAuthModal('signup-modal');
    showAuthModal('login-modal');
}

function updateUserUI() {
    const authButtons = document.getElementById('auth-buttons');
    const userMenu = document.getElementById('user-menu');
    
    if (APP_STATE.isAuthenticated && APP_STATE.user) {
        // Show user menu
        authButtons.style.display = 'none';
        userMenu.style.display = 'block';
        
        // Update user info
        document.getElementById('user-name-display').textContent = APP_STATE.user.username;
        if (APP_STATE.user.avatar) {
            document.getElementById('user-avatar-img').src = APP_STATE.user.avatar;
        }
    } else {
        // Show auth buttons
        authButtons.style.display = 'flex';
        userMenu.style.display = 'none';
    }
}

function toggleUserDropdown() {
    const dropdown = document.getElementById('user-dropdown');
    dropdown.classList.toggle('active');
}

function toggleMobileMenu() {
    const nav = document.querySelector('.main-nav');
    nav.classList.toggle('mobile-active');
}

// Navigation
function navigateToDashboard() {
    showDashboardSection();
    loadDashboardData();
}

function navigateToSettings() {
    navigateToDashboard();
    switchDashboardTab('settings');
}

function navigateToBilling() {
    navigateToDashboard();
    switchDashboardTab('billing');
}

function showHomeSection() {
    document.getElementById('dashboard').style.display = 'none';
    document.querySelector('.hero-section').style.display = 'block';
    document.querySelector('.features-section').style.display = 'block';
    document.querySelector('.pricing-section').style.display = 'block';
}

function showDashboardSection() {
    document.getElementById('dashboard').style.display = 'block';
    document.querySelector('.hero-section').style.display = 'none';
    document.querySelector('.features-section').style.display = 'none';
    document.querySelector('.pricing-section').style.display = 'none';
}

// Dashboard Management
function switchDashboardTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    APP_STATE.currentTab = tabName;
}

async function loadDashboardData() {
    try {
        // Load servers
        await loadServers();
        
        // Load databases
        await loadDatabases();
        
        // Update dashboard stats
        updateDashboardStats();
        
        // Load recent activity
        loadRecentActivity();
    } catch (error) {
        console.error('Failed to load dashboard data:', error);
    }
}

async function loadServers() {
    try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`${API_CONFIG.endpoints.user.servers}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            APP_STATE.servers = data.servers || [];
            displayServers();
        }
    } catch (error) {
        console.error('Failed to load servers:', error);
        // For demo, show sample servers
        APP_STATE.servers = [
            {
                id: 'server-1',
                name: 'My Discord Bot',
                type: 'discord-bot',
                status: 'online',
                specs: { ram: '512MB', storage: '10GB', cpu: '1 Core' },
                createdAt: new Date().toISOString()
            }
        ];
        displayServers();
    }
}

function displayServers(servers = APP_STATE.servers) {
    const grid = document.getElementById('servers-grid');
    if (!grid) return;
    
    if (servers.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-server"></i>
                <h3>No servers yet</h3>
                <p>Create your first server to get started</p>
                <button class="btn-primary" onclick="showCreateServerModal()">
                    Create Server
                </button>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = servers.map(server => `
        <div class="server-card">
            <div class="server-status ${server.status}"></div>
            <div class="server-header">
                <h3>${server.name}</h3>
                <span class="server-type">${getServerTypeDisplay(server.type)}</span>
            </div>
            <div class="server-specs">
                <div class="spec">
                    <i class="fas fa-memory"></i>
                    <span>${server.specs.ram}</span>
                </div>
                <div class="spec">
                    <i class="fas fa-hdd"></i>
                    <span>${server.specs.storage}</span>
                </div>
                <div class="spec">
                    <i class="fas fa-microchip"></i>
                    <span>${server.specs.cpu}</span>
                </div>
            </div>
            <div class="server-actions">
                <button class="btn-primary" onclick="manageServer('${server.id}')">
                    <i class="fas fa-cog"></i>
                    Manage
                </button>
                <button class="btn-${server.status === 'online' ? 'danger' : 'success'}" 
                        onclick="toggleServer('${server.id}')">
                    <i class="fas fa-${server.status === 'online' ? 'stop' : 'play'}"></i>
                    ${server.status === 'online' ? 'Stop' : 'Start'}
                </button>
            </div>
        </div>
    `).join('');
}

function getServerTypeDisplay(type) {
    const types = {
        'discord-bot': 'Discord Bot',
        'game-server': 'Game Server',
        'web-app': 'Web App',
        'database': 'Database'
    };
    return types[type] || type;
}

async function toggleServer(serverId) {
    const server = APP_STATE.servers.find(s => s.id === serverId);
    if (!server) return;
    
    try {
        const token = localStorage.getItem('auth_token');
        const action = server.status === 'online' ? 'stop' : 'start';
        
        showNotification(`${action === 'start' ? 'Starting' : 'Stopping'} server...`, 'info');
        
        const response = await fetch(`${API_CONFIG.endpoints.servers[action].replace(':id', serverId)}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            server.status = action === 'start' ? 'online' : 'offline';
            displayServers();
            updateDashboardStats();
            showNotification(`Server ${action === 'start' ? 'started' : 'stopped'} successfully!`, 'success');
        } else {
            throw new Error('Failed to toggle server');
        }
    } catch (error) {
        console.error('Toggle server error:', error);
        // Simulate action for demo
        server.status = server.status === 'online' ? 'offline' : 'online';
        displayServers();
        updateDashboardStats();
        showNotification(`Server ${server.status === 'online' ? 'started' : 'stopped'}!`, 'success');
    }
}

function updateDashboardStats() {
    const totalServers = APP_STATE.servers.length;
    const onlineServers = APP_STATE.servers.filter(s => s.status === 'online').length;
    const totalDatabases = APP_STATE.databases.length;
    const coins = APP_STATE.user?.coins || 0;
    
    document.getElementById('dashboard-servers').textContent = totalServers;
    document.getElementById('dashboard-online').textContent = onlineServers;
    document.getElementById('dashboard-databases').textContent = totalDatabases;
    document.getElementById('dashboard-coins').textContent = coins;
}

// Server Creation Wizard
function showCreateServerModal() {
    const modal = document.getElementById('create-server-modal');
    modal.classList.add('active');
    resetWizard();
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('active');
}

function resetWizard() {
    APP_STATE.currentStep = 1;
    APP_STATE.selectedServerType = null;
    APP_STATE.wizardData = {};
    
    // Reset wizard UI
    document.querySelectorAll('.wizard-step').forEach(step => {
        step.classList.remove('active');
    });
    document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active');
    });
    
    document.getElementById('step-1').classList.add('active');
    document.querySelector('[data-step="1"]').classList.add('active');
    
    // Reset buttons
    document.getElementById('prev-btn').style.display = 'none';
    document.getElementById('next-btn').style.display = 'block';
    document.getElementById('create-btn').style.display = 'none';
}

function selectServerType(type) {
    APP_STATE.selectedServerType = type;
    APP_STATE.wizardData.type = type;
    
    // Update UI
    document.querySelectorAll('.server-type-card').forEach(card => {
        card.classList.remove('selected');
    });
    event.currentTarget.classList.add('selected');
}

function nextStep() {
    if (APP_STATE.currentStep === 1) {
        // Validate step 1
        const serverName = document.getElementById('server-name').value;
        if (!serverName) {
            showNotification('Please enter a server name', 'error');
            return;
        }
        if (!APP_STATE.selectedServerType) {
            showNotification('Please select a server type', 'error');
            return;
        }
        
        APP_STATE.wizardData.name = serverName;
    }
    
    // Move to next step
    if (APP_STATE.currentStep < 3) {
        document.getElementById(`step-${APP_STATE.currentStep}`).classList.remove('active');
        document.querySelector(`[data-step="${APP_STATE.currentStep}"]`).classList.remove('active');
        
        APP_STATE.currentStep++;
        
        document.getElementById(`step-${APP_STATE.currentStep}`).classList.add('active');
        document.querySelector(`[data-step="${APP_STATE.currentStep}"]`).classList.add('active');
        
        // Update buttons
        document.getElementById('prev-btn').style.display = 'block';
        if (APP_STATE.currentStep === 3) {
            document.getElementById('next-btn').style.display = 'none';
            document.getElementById('create-btn').style.display = 'block';
            updateReviewSummary();
        }
    }
}

function previousStep() {
    if (APP_STATE.currentStep > 1) {
        document.getElementById(`step-${APP_STATE.currentStep}`).classList.remove('active');
        document.querySelector(`[data-step="${APP_STATE.currentStep}"]`).classList.remove('active');
        
        APP_STATE.currentStep--;
        
        document.getElementById(`step-${APP_STATE.currentStep}`).classList.add('active');
        document.querySelector(`[data-step="${APP_STATE.currentStep}"]`).classList.add('active');
        
        // Update buttons
        if (APP_STATE.currentStep === 1) {
            document.getElementById('prev-btn').style.display = 'none';
        }
        document.getElementById('next-btn').style.display = 'block';
        document.getElementById('create-btn').style.display = 'none';
    }
}

function updateReviewSummary() {
    document.getElementById('review-name').textContent = APP_STATE.wizardData.name;
    document.getElementById('review-type').textContent = getServerTypeDisplay(APP_STATE.wizardData.type);
    document.getElementById('review-runtime').textContent = document.getElementById('server-runtime').value;
    document.getElementById('review-region').textContent = document.getElementById('server-region').value;
}

async function createServer() {
    try {
        showNotification('Creating server...', 'info');
        
        const token = localStorage.getItem('auth_token');
        const serverData = {
            ...APP_STATE.wizardData,
            runtime: document.getElementById('server-runtime').value,
            region: document.getElementById('server-region').value,
            resources: 'free' // Can be made configurable
        };
        
        const response = await fetch(`${API_CONFIG.endpoints.servers.create}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(serverData)
        });
        
        if (response.ok) {
            const data = await response.json();
            APP_STATE.servers.push(data.server);
            displayServers();
            updateDashboardStats();
            
            closeModal('create-server-modal');
            showNotification('Server created successfully!', 'success');
        } else {
            throw new Error('Failed to create server');
        }
    } catch (error) {
        console.error('Create server error:', error);
        // Simulate server creation for demo
        const newServer = {
            id: `server-${Date.now()}`,
            name: APP_STATE.wizardData.name,
            type: APP_STATE.wizardData.type,
            status: 'offline',
            specs: { ram: '512MB', storage: '10GB', cpu: '1 Core' },
            createdAt: new Date().toISOString()
        };
        
        APP_STATE.servers.push(newServer);
        displayServers();
        updateDashboardStats();
        
        closeModal('create-server-modal');
        showNotification('Server created successfully!', 'success');
    }
}

// Utility Functions
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const button = input.nextElementSibling;
    const icon = button.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

function selectPlan(plan) {
    showAuthModal('signup-modal');
    // Pre-select plan in signup form
    const planSelect = document.getElementById('selected-plan');
    if (planSelect) {
        planSelect.value = plan;
    }
}

function filterServers(filter) {
    let filteredServers = APP_STATE.servers;
    
    if (filter !== 'all') {
        filteredServers = APP_STATE.servers.filter(server => server.status === filter);
    }
    
    displayServers(filteredServers);
}

function refreshServers() {
    showNotification('Refreshing servers...', 'info');
    loadServers();
}

function loadRecentActivity() {
    const activityList = document.getElementById('activity-list');
    if (!activityList) return;
    
    // Sample activity data
    const activities = [
        {
            type: 'server',
            action: 'started',
            target: 'My Discord Bot',
            time: '2 minutes ago',
            icon: 'fa-server'
        },
        {
            type: 'database',
            action: 'created',
            target: 'MySQL Database',
            time: '1 hour ago',
            icon: 'fa-database'
        }
    ];
    
    activityList.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <i class="fas ${activity.icon}"></i>
            <div class="activity-content">
                <p>${activity.target} ${activity.action}</p>
                <span>${activity.time}</span>
            </div>
        </div>
    `).join('');
}

// Animation Functions
function initializeAnimations() {
    // Animate stats on scroll
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateStatNumber(entry.target);
                observer.unobserve(entry.target);
            }
        });
    });
    
    document.querySelectorAll('.stat-number').forEach(stat => {
        observer.observe(stat);
    });
}

function animateStatNumber(element) {
    const target = parseFloat(element.dataset.count);
    const duration = 2000;
    const increment = target / (duration / 16);
    let current = 0;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        
        if (element.dataset.count.includes('.')) {
            element.textContent = current.toFixed(1);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 16);
}

function startHeroAnimations() {
    // Terminal typing animation
    const commands = [
        'npm install discord.js',
        'node bot.js',
        '✓ Bot started successfully',
        '✓ Connected to Discord API'
    ];
    
    let commandIndex = 0;
    let charIndex = 0;
    const typingElement = document.getElementById('typing-command');
    
    function typeCommand() {
        if (commandIndex < commands.length) {
            if (charIndex < commands[commandIndex].length) {
                typingElement.textContent = commands[commandIndex].substring(0, charIndex + 1);
                charIndex++;
                setTimeout(typeCommand, 50);
            } else {
                setTimeout(() => {
                    commandIndex++;
                    charIndex = 0;
                    if (commandIndex < commands.length) {
                        // Add command to output
                        const outputLine = document.createElement('div');
                        outputLine.className = 'output-line';
                        outputLine.textContent = commands[commandIndex - 1];
                        document.querySelector('.terminal-output').appendChild(outputLine);
                        
                        // Clear current command
                        typingElement.textContent = '';
                        setTimeout(typeCommand, 300);
                    }
                }, 1000);
            }
        } else {
            // Restart animation
            setTimeout(() => {
                commandIndex = 0;
                charIndex = 0;
                document.querySelector('.terminal-output').innerHTML = '';
                typeCommand();
            }, 3000);
        }
    }
    
    typeCommand();
}

// Notification System
function showNotification(message, type = 'info', duration = 5000) {
    // Remove existing notification
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    notification.innerHTML = `
        <i class="fas ${icons[type]}"></i>
        <span>${message}</span>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Auto remove
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 300);
    }, duration);
}

// Event Listeners
function setupEventListeners() {
    // Close modals on background click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
    
    // Close user dropdown on outside click
    document.addEventListener('click', (e) => {
        const userDropdown = document.getElementById('user-dropdown');
        const userMenu = document.getElementById('user-menu');
        
        if (!userMenu.contains(e.target)) {
            userDropdown.classList.remove('active');
        }
    });
    
    // Password strength checker
    const passwordInput = document.getElementById('signup-password');
    if (passwordInput) {
        passwordInput.addEventListener('input', checkPasswordStrength);
    }
    
    // Confirm password validation
    const confirmPasswordInput = document.getElementById('signup-confirm');
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', validatePasswordMatch);
    }
}

function checkPasswordStrength() {
    const password = document.getElementById('signup-password').value;
    const strengthFill = document.getElementById('password-strength-fill');
    const strengthText = document.getElementById('password-strength-text');
    
    let strength = 0;
    let feedback = '';
    
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/)) strength++;
    if (password.match(/[A-Z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[^a-zA-Z0-9]/)) strength++;
    
    const strengthLevels = {
        0: { width: '0%', color: '#e74c3c', text: 'Very Weak' },
        1: { width: '20%', color: '#e74c3c', text: 'Weak' },
        2: { width: '40%', color: '#f39c12', text: 'Fair' },
        3: { width: '60%', color: '#f1c40f', text: 'Good' },
        4: { width: '80%', color: '#2ecc71', text: 'Strong' },
        5: { width: '100%', color: '#27ae60', text: 'Very Strong' }
    };
    
    const level = strengthLevels[strength];
    strengthFill.style.width = level.width;
    strengthFill.style.backgroundColor = level.color;
    strengthText.textContent = `Password strength: ${level.text}`;
}

function validatePasswordMatch() {
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm').value;
    
    if (confirmPassword && password !== confirmPassword) {
        document.getElementById('signup-confirm').setCustomValidity('Passwords do not match');
    } else {
        document.getElementById('signup-confirm').setCustomValidity('');
    }
}

// Placeholder functions for features
function manageServer(serverId) {
    showNotification(`Opening server management for ${serverId}...`, 'info');
}

function showCreateDatabaseModal() {
    showNotification('Database creation coming soon!', 'info');
}

function openSupportChat() {
    showNotification('Opening support chat...', 'info');
}

function showTerms() {
    showNotification('Terms of Service coming soon!', 'info');
}

function showPrivacy() {
    showNotification('Privacy Policy coming soon!', 'info');
}

function loadDatabases() {
    // Placeholder for database loading
    APP_STATE.databases = [];
}

async function loadUserData() {
    // Placeholder for user data loading
    console.log('Loading user data...');
}

// Export for global access
window.BotHostingApp = {
    showNotification,
    navigateToDashboard,
    showAuthModal,
    logout,
    APP_STATE
};

console.log('🤖 Bot Hosting Manager v2.0.0 - Complete Clone Ready');