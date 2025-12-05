// Bot Hosting Server Management System - Real API Integration
// Integration with bot-hosting.net API

// Global Variables
let currentSection = 'dashboard';
let globalSession = null;
let servers = [];
let users = [];
let marketplaceItems = [];

// Real API Configuration
const API_CONFIG = {
    botHosting: {
        baseUrl: window.BOT_HOSTING_API_BASE_URL || 'https://bot-hosting.net/api/v1',
        panelUrl: window.BOT_HOSTING_PANEL_URL || 'https://control.bot-hosting.net',
        accountUrl: window.BOT_HOSTING_API_BASE_URL || 'https://bot-hosting.net/api',
        timeout: 10000
    },
    local: {
        serversKey: 'botHostingServers',
        usersKey: 'botHostingUsers',
        sessionKey: 'botHostingSession',
        settingsKey: 'botHostingSettings'
    }
};

// Load configuration from environment
async function loadConfig() {
    try {
        const response = await fetch('/api/config');
        if (response.ok) {
            const config = await response.json();
            API_CONFIG.botHosting.baseUrl = config.apiBaseUrl;
            API_CONFIG.botHosting.panelUrl = config.panelUrl;
            console.log('✅ Configuration loaded from server');
        }
    } catch (error) {
        console.warn('⚠️ Using default configuration (fallback mode)');
    }
}

// API Endpoints
const ENDPOINTS = {
    // Account endpoints
    accountInfo: '/account',
    validateAuth: '/account/validate',
    coinsAmount: '/account/coins',
    claimable: '/account/claimable',
    
    // Server endpoints  
    serverList: '/servers',
    serverInfo: '/server/{id}',
    serverStart: '/server/{id}/start',
    serverStop: '/server/{id}/stop',
    serverRestart: '/server/{id}/restart',
    serverDelete: '/server/{id}/delete',
    serverCreate: '/servers/create',
    serverLanguage: '/server/{id}/language',
    
    // Panel endpoints
    panelServers: '/api/client/servers',
    panelServerInfo: '/api/client/servers/{server}/resources',
    panelDirectory: '/api/client/servers/{server}/files/list',
    
    // Billing endpoints
    billingInfo: '/billing',
    usageStats: '/billing/usage'
};

// Initialize Application
document.addEventListener('DOMContentLoaded', async () => {
    await loadConfig();
    initializeApp();
    loadStoredData();
    checkExistingSession();
    setupEventListeners();
    loadMarketplaceItems();
});

// Initialize App
function initializeApp() {
    showSection('dashboard');
    updateStats();
    if (globalSession) {
        loadRealServers();
    } else {
        loadServers();
    }
    showNotification('Welcome to Bot Hosting Manager!', 'info');
}

// Real API Functions
class BotHostingAPI {
    constructor(authId, apiKey) {
        this.authId = authId;
        this.apiKey = apiKey;
        this.baseUrl = API_CONFIG.botHosting.baseUrl;
        this.panelUrl = API_CONFIG.botHosting.panelUrl;
    }

    async makeRequest(endpoint, options = {}) {
        const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'BotHostingManager/1.0.0'
        };

        if (this.authId) {
            headers['Authorization'] = `Bearer ${this.authId}`;
        }
        if (this.apiKey) {
            headers['X-API-Key'] = this.apiKey;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers,
                timeout: API_CONFIG.botHosting.timeout
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`API Error (${endpoint}):`, error);
            throw error;
        }
    }

    // Account methods
    async getAccountInfo() {
        return this.makeRequest(ENDPOINTS.accountInfo);
    }

    async validateAuth() {
        return this.makeRequest(ENDPOINTS.validateAuth);
    }

    async getCoinsAmount() {
        return this.makeRequest(ENDPOINTS.coinsAmount);
    }

    async getClaimableStatus() {
        return this.makeRequest(ENDPOINTS.claimable);
    }

    // Server methods
    async getServerList() {
        try {
            // Try panel API first
            const panelServers = await this.makeRequest(`${this.panelUrl}${ENDPOINTS.panelServers}`);
            return panelServers.data || [];
        } catch (error) {
            // Fallback to legacy API
            return this.makeRequest(ENDPOINTS.serverList);
        }
    }

    async getServerInfo(serverId) {
        try {
            // Try panel API
            const serverInfo = await this.makeRequest(
                `${this.panelUrl}${ENDPOINTS.panelServerInfo.replace('{server}', serverId)}`
            );
            return serverInfo.attributes || {};
        } catch (error) {
            // Fallback to legacy API
            return this.makeRequest(ENDPOINTS.serverInfo.replace('{id}', serverId));
        }
    }

    async startServer(serverId) {
        try {
            return await this.makeRequest(`${this.panelUrl}/api/client/servers/${serverId}/power`, {
                method: 'POST',
                body: JSON.stringify({ signal: 'start' })
            });
        } catch (error) {
            return this.makeRequest(ENDPOINTS.serverStart.replace('{id}', serverId), {
                method: 'POST'
            });
        }
    }

    async stopServer(serverId) {
        try {
            return await this.makeRequest(`${this.panelUrl}/api/client/servers/${serverId}/power`, {
                method: 'POST',
                body: JSON.stringify({ signal: 'stop' })
            });
        } catch (error) {
            return this.makeRequest(ENDPOINTS.serverStop.replace('{id}', serverId), {
                method: 'POST'
            });
        }
    }

    async restartServer(serverId) {
        try {
            return await this.makeRequest(`${this.panelUrl}/api/client/servers/${serverId}/power`, {
                method: 'POST',
                body: JSON.stringify({ signal: 'restart' })
            });
        } catch (error) {
            return this.makeRequest(ENDPOINTS.serverRestart.replace('{id}', serverId), {
                method: 'POST'
            });
        }
    }

    async deleteServer(serverId) {
        return this.makeRequest(ENDPOINTS.serverDelete.replace('{id}', serverId), {
            method: 'DELETE'
        });
    }

    async changeServerLanguage(serverId, language) {
        return this.makeRequest(ENDPOINTS.serverLanguage.replace('{id}', serverId), {
            method: 'POST',
            body: JSON.stringify({ language })
        });
    }

    async getServerDirectory(serverId, directory = '/') {
        return this.makeRequest(
            `${this.panelUrl}${ENDPOINTS.panelDirectory.replace('{server}', serverId)}?directory=${encodeURIComponent(directory)}`
        );
    }

    // Billing methods
    async getBillingInfo() {
        return this.makeRequest(ENDPOINTS.billingInfo);
    }

    async getUsageStats() {
        return this.makeRequest(ENDPOINTS.usageStats);
    }
}

// Setup Event Listeners
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.getAttribute('href').substring(1);
            showSection(sectionId);
            
            // Update active state
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });

    // Mobile Menu
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // Global Login/Logout
    document.getElementById('global-login-btn').addEventListener('click', showGlobalLoginModal);
    document.getElementById('global-logout-btn').addEventListener('click', globalLogout);

    // Server Filter
    document.getElementById('server-filter').addEventListener('change', filterServers);

    // Settings Tabs
    document.querySelectorAll('.settings-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            showSettingsPanel(tabName);
            
            document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
        });
    });

    // Admin Tabs
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            showAdminPanel(tabName);
            
            document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
        });
    });

    // Marketplace Categories
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const category = btn.dataset.category;
            filterMarketplace(category);
            
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // Form Submissions
    document.getElementById('create-server-form').addEventListener('submit', (e) => {
        e.preventDefault();
        createServer();
    });

    document.getElementById('global-login-form').addEventListener('submit', (e) => {
        e.preventDefault();
        globalLogin();
    });
}

// Section Management
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        currentSection = sectionId;
        
        // Load section-specific data
        switch(sectionId) {
            case 'servers':
                loadServers();
                break;
            case 'marketplace':
                loadMarketplaceItems();
                break;
            case 'admin':
                loadAdminData();
                break;
            case 'billing':
                if (globalSession && globalSession.api) {
                    loadBillingInfo();
                }
                break;
        }
    }
}

// Global Session Management
function checkExistingSession() {
    const session = localStorage.getItem(API_CONFIG.local.sessionKey);
    if (session) {
        try {
            globalSession = JSON.parse(session);
            updateSessionStatus(true, globalSession.username);
            
            // Initialize API instance
            if (globalSession.authId || globalSession.apiKey) {
                globalSession.api = new BotHostingAPI(globalSession.authId, globalSession.apiKey);
            }
        } catch (error) {
            console.error('Invalid session:', error);
            localStorage.removeItem(API_CONFIG.local.sessionKey);
        }
    }
}

function showGlobalLoginModal() {
    document.getElementById('global-login-modal').classList.querySelector('active');
}

async function globalLogin() {
    const username = document.getElementById('global-username').value;
    const authId = document.getElementById('global-apikey').value;
    const sharedAccess = document.getElementById('shared-access').checked;

    if (!username || !authId) {
        showNotification('Please fill in all fields', 'error');
        return;
    }

    showNotification('Connecting to Bot Hosting.net...', 'info');

    try {
        // Test the connection with provided credentials
        const api = new BotHostingAPI(authId, null);
        await api.validateAuth();
        
        // Create session
        globalSession = {
            username: username,
            authId: authId,
            apiKey: null, // Can be added later for advanced features
            sharedAccess: sharedAccess,
            connectedAt: new Date().toISOString(),
            lastActivity: Date.now(),
            api: api
        };

        // Save session
        localStorage.setItem(API_CONFIG.local.sessionKey, JSON.stringify(globalSession));

        // Update UI
        updateSessionStatus(true, username);
        closeModal('global-login-modal');
        
        showNotification(`Successfully connected as ${username}!`, 'success');
        
        // Load real data
        await loadRealServers();
        await loadAccountInfo();
        
    } catch (error) {
        console.error('Login failed:', error);
        showNotification('Failed to connect. Please check your credentials.', 'error');
    }
}

function globalLogout() {
    if (confirm('Are you sure you want to disconnect from Bot Hosting.net?')) {
        globalSession = null;
        localStorage.removeItem(API_CONFIG.local.sessionKey);
        updateSessionStatus(false);
        
        // Reload mock data when disconnected
        loadServers();
        showNotification('Disconnected from Bot Hosting.net', 'info');
    }
}

function updateSessionStatus(connected, username = null) {
    const sessionText = document.getElementById('session-text');
    const loginBtn = document.getElementById('global-login-btn');
    const logoutBtn = document.getElementById('global-logout-btn');

    if (connected && username) {
        sessionText.textContent = `Connected as ${username}`;
        loginBtn.style.display = 'none';
        logoutBtn.style.display = 'flex';
    } else {
        sessionText.textContent = 'Not Connected';
        loginBtn.style.display = 'flex';
        logoutBtn.style.display = 'none';
    }
}

// Real Server Management
async function loadRealServers() {
    if (!globalSession || !globalSession.api) {
        loadServers();
        return;
    }

    try {
        showNotification('Loading servers from Bot Hosting.net...', 'info');
        const serverList = await globalSession.api.getServerList();
        
        // Transform API response to our format
        servers = serverList.map((server, index) => ({
            id: server.identifier || `server-${index}`,
            name: server.name || `Server ${index + 1}`,
            type: determineServerType(server),
            status: mapServerStatus(server),
            plan: determineServerPlan(server),
            specs: extractServerSpecs(server),
            region: server.location || 'unknown',
            createdAt: server.created_at || new Date().toISOString(),
            uuid: server.uuid,
            identifier: server.identifier
        }));
        
        displayServers();
        updateStats();
        showNotification('Servers loaded successfully!', 'success');
        
    } catch (error) {
        console.error('Failed to load real servers:', error);
        showNotification('Failed to load servers. Using demo data.', 'warning');
        loadServers(); // Fallback to demo data
    }
}

function determineServerType(server) {
    // Try to determine server type based on container or metadata
    if (server.container) {
        const image = server.container.image.toLowerCase();
        if (image.includes('discord') || image.includes('bot')) return 'discord-bot';
        if (image.includes('minecraft') || image.includes('game')) return 'game-server';
        if (image.includes('nginx') || image.includes('apache')) return 'web-server';
        if (image.includes('mysql') || (image.includes('postgres'))) return 'database';
    }
    return 'custom';
}

function mapServerStatus(server) {
    // Map API status to our status format
    if (server.attributes) {
        const state = server.attributes.state;
        if (state === 'running') return 'online';
        if (state === 'stopped') return 'offline';
        if (state === 'starting' || state === 'stopping') return 'loading';
    }
    return server.status || 'offline';
}

function determineServerPlan(server) {
    // Determine plan based on limits or features
    if (server.limits) {
        const memory = server.limits.memory || 0;
        if (memory >= 4096) return 'premium';
        if (memory >= 1024) return 'standard';
    }
    return 'free';
}

function extractServerSpecs(server) {
    const limits = server.limits || {};
    const featureLimits = server.feature_limits || {};
    
    return {
        ram: limits.memory ? `${Math.round(limits.memory / 1024)}MB` : '512MB',
        storage: limits.disk ? `${Math.round(limits.disk / 1024)}GB` : '10GB',
        cpu: limits.cpu ? `${limits.cpu} Core${limits.cpu > 1 ? 's' : ''}` : '1 Core',
        databases: featureLimits.databases || 0,
        allocations: featureLimits.allocations || 1
    };
}

// Fallback Server Management (when not connected)
function loadServers() {
    const storedServers = localStorage.getItem(API_CONFIG.local.serversKey);
    if (storedServers) {
        servers = JSON.parse(storedServers);
    } else {
        // Initialize with sample servers
        servers = [
            {
                id: 'server-1',
                name: 'My Discord Bot',
                type: 'discord-bot',
                status: 'online',
                plan: 'free',
                specs: { ram: '512MB', storage: '10GB', cpu: '1 Core' },
                region: 'us-east',
                createdAt: new Date().toISOString()
            },
            {
                id: 'server-2',
                name: 'Game Server',
                type: 'game-server',
                status: 'offline',
                plan: 'premium',
                specs: { ram: '4GB', storage: '50GB', 'cpu': '4 Cores' },
                region: 'eu',
                createdAt: new Date().toISOString()
            }
        ];
        saveServers();
    }
    
    displayServers();
    updateStats();
}

function displayServers(serversToDisplay = servers) {
    const serverGrid = document.getElementById('server-grid');
    const serverList = document.getElementById('server-list');
    
    if (!serverGrid && !serverList) return;

    const serversHTML = serversToDisplay.map(server => `
        <div class="server-card">
            <div class="server-status ${server.status}"></div>
            <h3 class="server-name">${server.name}</h3>
            <p class="server-type">${getServerTypeDisplay(server.type)}</p>
            <div class="server-specs">
                <div class="spec-item">
                    <i class="fas fa-memory"></i>
                    ${server.specs.ram}
                </div>
                <div class="spec-item">
                    <i class="fas fa-hdd"></i>
                    ${server.specs.storage}
                </div>
                <div class="spec-item">
                    <i class="fas fa-microchip"></i>
                    ${server.specs.cpu}
                </div>
            </div>
            <div class="server-actions">
                <button class="server-btn primary" onclick="manageServer('${server.id}')">
                    Manage
                </button>
                <button class="server-btn ${server.status === 'online' ? 'danger' : 'primary'}" 
                        onclick="toggleServer('${server.id}')">
                    ${server.status === 'online' ? 'Stop' : 'Start'}
                </button>
            </div>
        </div>
    `).join('');

    if (serverGrid) serverGrid.innerHTML = serversHTML;
    if (serverList) serverList.innerHTML = serversHTML;
}

function getServerTypeDisplay(type) {
    const types = {
        'discord-bot': 'Discord Bot',
        'game-server': 'Game Server',
        'web-server': 'Web Server',
        'database': 'Database',
        'custom': 'Custom Server'
    };
    return types[type] || type;
}

async function toggleServer(serverId) {
    const server = servers.find(s => s.id === serverId);
    if (!server) return;

    if (globalSession && globalSession.api) {
        try {
            showNotification(`${server.status === 'online' ? 'Stopping' : 'Starting'} server...`, 'info');
            
            if (server.status === 'online') {
                await globalSession.api.stopServer(server.uuid || server.id);
            } else {
                await globalSession.api.startServer(server.uuid || server.id);
            }
            
            // Wait a moment and refresh server status
            setTimeout(async () => {
                try {
                    const updatedInfo = await globalSession.api.getServerInfo(server.uuid || server.id);
                    server.status = mapServerStatus({ attributes: updatedInfo });
                    displayServers();
                    updateStats();
                    showNotification(`Server ${server.name} ${server.status === 'online' ? 'started' : 'stopped'}!`, 'success');
                } catch (error) {
                    console.error('Failed to update server status:', error);
                }
            }, 2000);
            
        } catch (error) {
            console.error('Failed to toggle server:', error);
            showNotification('Failed to toggle server. Please try again.', 'error');
        }
    } else {
        // Fallback to demo mode
        server.status = server.status === 'online' ? 'offline' : 'online';
        saveServers();
        displayServers();
        updateStats();
        showNotification(`Server ${server.name} ${server.status === 'online' ? 'started' : 'stopped'}`, 'success');
    }
}

// Account Information
async function loadAccountInfo() {
    if (!globalSession || !globalSession.api) return;

    try {
        const accountInfo = await globalSession.api.getAccountInfo();
        const coinsAmount = await globalSession.api.getCoinsAmount();
        const claimableStatus = await globalSession.api.getClaimableStatus();

        // Update UI with real account data
        document.getElementById('total-users').textContent = accountInfo.total_servers || '1';
        
        // Update billing section if available
        if (accountInfo.plan) {
            updateBillingInfo(accountInfo);
        }
        
    } catch (error) {
        console.error('Failed to load account info:', error);
    }
}

// Enhanced Statistics
function updateStats() {
    const totalServers = servers.length;
    const onlineServers = servers.filter(s => s.status === 'online').length;
    const premiumServers = servers.filter(s => s.plan === 'premium').length;
    
    // Update stat displays
    const statElements = {
        'total-servers': totalServers,
        'online-servers': onlineServers,
        'total-users': users.length || 1, // At least the current user
        'premium-servers': premiumServers
    };
    
    Object.entries(statElements).forEach(([id, value]) => {
        const 'element'.id;
        if (element) {
            element.textContent = value;
        }
    });
}

// Server Creation (Demo - real creation would be more complex)
function showCreateServerModal() {
    if (!globalSession) {
        showNotification('Please connect to Bot Hosting.net first.', 'warning');
        return;
    }
    document.getElementById('create-server-modal').classList.add('active');
}

function createServer() {
    const name = document.getElementById('server-name').value;
    const type = document.getElementById('server-type').value;
    const plan = document.querySelector('input[name="plan"]:checked').value;
    const region = document.getElementById('server-region').value;

    if (!name) {
        showNotification('Please enter a server name', 'error');
        return;
    }

    // For now, this creates a demo server
    // Real server creation would involve complex API calls
    const newServer = {
        id: `server-${Date.now()}`,
        name: name,
        type: type,
        status: 'offline',
        plan: plan,
        specs: getServerSpecs(plan),
        region: region,
        createdAt: new Date().toISOString()
    };

    servers.push(newServer);
    saveServers();
    displayServers();
    updateStats();

    closeModal('create-server-modal');
    document.getElementById('create-server-form').reset();
    
    showNotification(`Server "${name}" created successfully!`, 'success');
}

// Utility Functions
function getServerSpecs(plan) {
    const specs = {
        'free': { ram: '512MB', storage: '10GB', cpu: '1 Core' },
        'premium': { ram: '4GB', storage: '50GB', 'cpu': '4 Cores' }
    };
    return specs[plan] || specs.free;
}

function saveServers() {
    localStorage.setItem(API_CONFIG.local.serversKey, JSON.stringify(servers));
}

function filterServers() {
    const filter = document.getElementById('server-filter').value;
    let filteredServers = servers;

    switch(filter) {
        case 'free':
            filteredServers = servers.filter(s => s.plan === 'free');
            break;
        case 'premium':
            filteredServers = servers.filter(s => s.plan === 'premium');
            break;
        case 'online':
            filteredServers = servers.filter(s => s.status === 'online');
            break;
        case 'offline':
            filteredServers = servers.filter((s) => s.status === 'offline');
            break;
    }

    displayServers(filteredServers);
}

function refreshAllServers() {
    if (globalSession && globalSession.api) {
        loadRealServers();
    } else {
        showNotification('Refreshing server status...', 'info');
        
        setTimeout(() => {
            servers.forEach(server => {
                if (Math.random() > 0.5) {
                    server.status = 'online';
                }
            });
            
            saveServers();
            displayServers();
            updateStats();
            showNotification('Server status updated!', 'success');
        }, 1500);
    }
}

// Marketplace (Demo data - would integrate with real marketplace)
function loadMarketplaceItems() {
    marketplaceItems = [
        {
            id: 'discord-music',
            name: 'Discord Music Bot',
            category: 'bot',
            description: 'Pre-configured music bot with YouTube and Spotify support',
            price: '$5/month',
            icon: 'fas fa-music'
        },
        {
            id: 'minecraft-server',
            name: 'Minecraft Server',
            category: 'game',
            description: 'Vanilla Minecraft server with plugins support',
            price: '$10/month',
            icon: 'fas fa-cube'
        },
        {
            id: 'nodejs-app',
            name: 'Node.js Web App',
            category: 'web',
            description: 'Perfect for Discord bots and web applications',
            price: 'Free',
            icon: 'fab fa-node-js'
        },
        {
            id: 'mysql-database',
            name: 'MySQL Database',
            category: 'database',
            description: 'Reliable MySQL database hosting',
            price: '$8/month',
            icon: 'fas fa-database'
        },
        {
            id: 'moderation-bot',
            name: 'Discord Moderation Bot',
            category: 'bot',
            description: 'Advanced moderation and logging bot',
            price: '$3/month',
            icon: 'fas fa-shield-alt'
        },
        {
            id: 'rust-server',
            name: 'Rust Game Server',
            category: 'game',
            description: 'High-performance Rust server hosting',
            price: '$15/month',
            icon: 'fas fa-gamepad'
        }
    ];
    
    displayMarketplaceItems();
}

function displayMarketplaceItems(items = marketplaceItems) {
    const marketplaceGrid = document.getElementById('marketplace-grid');
    if (!marketplaceGrid) return;

    const itemsHTML = items.map(item => `
        <div class="marketplace-card">
            <div class="marketplace-image">
                <i class="${item.icon}"></i>
            </div>
            <div class="marketplace-content">
                <h3 class="marketplace-title">${item.name}</h3>
                <p class="marketplace-desc">${item.description}</p>
div>
                <button class="btn-primary" onclick="deployFromMarketplace('${item.id}')">
                    Deploy Now
                </button>
            </div>
        </div>
    `).join('');

    marketplaceGrid.innerHTML = itemsHTML;
}

function filterMarketplace(category) {
    if (category === 'all') {
        displayMarketplaceItems();
    } else {
        const filtered = marketplaceItems.filter(item => item.category === category);
        displayMarketplaceItems(filtered);
    }
}

function deployFromMarketplace(itemId) {
    const item = marketplaceItems.find(i => i.id === itemId);
    if (item) {
        showNotification(`Deploying ${item.name}...`, 'info');
        
        // Simulate deployment
        setTimeout(() => {
            showCreateServerModal();
            document.getElementById('server-name').value = item.name;
            document.getElementById('server-type').value = item.category === 'bot' ? 'discord-bot' : 'custom';
            showNotification(`${item.name} ready to configure!`, 'success');
        }, 1000);
    }
}

function showMarketplace() {
    showSection('marketplace');
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    document.querySelector('a[href="#marketplace"]').classList.add('active');
}

// Settings
function showSettingsPanel(panelName) {
    document.querySelectorAll('.settings-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    
    const targetPanel = document.getElementById(`${panelName}-panel`);
    if (targetPanel) {
        targetPanel.classList.add('active');
    }
}

function saveSettings() {
    const username = document.getElementById('settings-username').value;
    const email = document.getElementById('settings-email').value;
    
    // Save settings
    const settings = {
        username: username,
        email: email,
        updatedAt: new Date().toISOString()
    };
    
    localStorage.setItem(API_CONFIG.local.settingsKey, JSON.stringify(settings));
    showNotification('Settings saved successfully!', 'success');
}

// Admin Functions
function showAdminPanel(panelName) {
    document.querySelectorAll('.admin-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    
    const targetPanel = document.getElementById(`${panelName}-panel`);
    if (targetPanel) {
        targetPanel.classList.add('active');
    }
}

function loadAdminData() {
    // Load users for admin panel
    loadUsers();
}

function loadUsers() {
    // Sample users - in real app this would come from API
    users = [
        {
            id: 'user-1',
            username: 'john_doe',
            email: 'john@example.com',
            plan: 'premium',
            servers: 3,
            joinedAt: new Date().toISOString()
        },
        {
            id: 'user-2',
            username: 'jane_smith',
            email: 'jane@example.com',
            plan: 'free',
            servers: 1,
            joinedAt: new Date().toISOString()
        }
    ];
    
    displayUsers();
}

function displayUsers() {
    const userList = document.getElementById('user-list');
    if (!userList) return;

    const usersHTML = users.map(user => `
        <div class="user-card">
            <div class="user-info">
                <h4>${user.username}</h4>
                <p>${user.email}</p>
                <span class="user-plan ${user.plan}">${user.plan}</span>
            </div>
            <div class="-user-stats">
                <span>${user.servers} servers</span>
            </div>
            <div class="user-actions">
                <button class="btn-secondary" onclick="editUser('${user.id}')">Edit</button>
                <button class="server-btn danger" onclick="deleteUser('${user.id}')">Delete</button>
            </div>
        </div>
    `).join('');

    userList.innerHTML = usersHTML;
}

// Billing Functions
function showUpgradeModal() {
    showNotification('Upgrade to Premium for more servers and features!', 'info');
}

// Utility Functions
function loadStoredData() {
    // Load any stored data
    const settings = localStorage.getItem(API_CONFIG.local.settingsKey);
    if (settings) {
        try {
            const parsedSettings = JSON.parse(settings);
            if (parsedSettings.username) {
                document.getElementById('settings-username').value = parsedSettings.username;
            }
            if (parsedSettings.email) {
                document.getElementById('settings-email').value = parsedSettings.email;
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    }
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function manageServer(serverId) {
    const server = servers.find(s => s.id === serverId);
    if (server) {
        showNotification(`Managing server: ${server.name}`, 'info');
        // Here you would open a detailed server management interface
    }
}

// Billing Integration
async function loadBillingInfo() {
    if (!globalSession || !globalSession.api) {
        showNotification('Please connect to load billing info.', 'warning');
        return;
    }
    
    try {
        const billingInfo = await globalSession.api.getBillingInfo();
        const usageStats = await globalSession.api.getUsageStats();
        
        // Update billing UI with real data
        if (billingInfo.plan || billingInfo.current_plan) {
            updateBillingPlan(billingInfo);
        }

        if (usageStats.current_usage) {
            updateUsageStats(usageStats);
        }
        
    } catch (error) {
        console.error('Failed to load billing info:', error);
        showNotification('Failed to load billing info.', 'error');
    }
}

function updateBillingPlan(billingData) {
    // Update current plan display
    const currentPlan = document.querySelector('.current-plan h4');
    const planPrice = document.querySelector('.plan-price');
    
    if (currentPlan && billingData.plan_name) {
        currentPlan.textContent = billingData.plan_name;
    }
    if (planPrice && billingData.price) {
        planPrice.textContent = `$${billingData.price}/month`;
    }
    
    // Update features
    const featuresList = document.querySelector('.plan-features');
    if (featuresList && billingData.features) {
        featuresList.innerHTML = billingData.features.map(feature => 
            `<li><i class="fas fa-check"></i> ${feature}</li>`
        ).join('');
    }
}

function updateUsageStats(usageData) {
    // Update usage bars with real data
    if (usageData.memory) {
        const memoryUsage = usageData.memory;
        const memoryBar = document.querySelector('.usage-bar');
        if (memoryBar) {
            const percentage = (memoryUsage.used / memoryUsage.total) * 100;
            memoryBar.style.width = `${percentage}%`;
        }
    }
}

// Notification System
function showNotification(message, type = 'info', duration = 5000) {
    // Remove existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        info: 'fas fa-info-circle',
        warning: 'fas fa-exclamation-triangle'
    };
    
    notification.innerHTML = `
        <div class="notification-content">
            <i class="${icons[type] || icons.info}"></i>
            <span>${message}</span>
        </div>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 10000;
        min-width: 300px;
        padding: 1rem;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        animation: slideInRight 0.5s ease;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    `;
    
    // Set background based on type
    const backgrounds = {
        success: 'linear-gradient(135deg, #10b981, #059669)',
        error: 'linear-gradient(135deg, #ef4444, #dc2626)',
        info: 'linear-gradient(135deg, #6366f1, #4f46e5)',
        warning: 'linear-gradient(135deg, #f59e0b, #d97706)'
    };
    
    notification.style.background = backgrounds[type] || backgrounds.info;
    notification.style.color = 'white';
    
    document.body.appendChild(notification);
    
    // Auto remove after duration
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOutRight 0.5s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 500);
        }
    }, duration);
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translate: translateX(100%);
        }
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 0.0.5rem;
    }
    
    .user-card {
        background: var(--bg-light);
        padding: 1rem;
        border-radius: 8px;
        margin-bottom: 1rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .user-plan {
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.8rem;
        font-weight: 600;
    }
    
    .user-plan.premium {
        background: var(--warning-color);
        color: white;
    }
    
    .user-plan.free {
        background: var(--success-color);
        color: white;
    }
    
    .user-actions {
        display: flex;
        gap: 0.5rem;
    }
`;
document.head.appendChild(style);

// Export functions for external access
window.botHostingManager = {
    showNotification,
    createServer,
    globalLogin,
    globalLogout,
    refreshAllServers,
    servers: () => servers,
    users: () => users,
    session: () => globalSession
};

console.log('%c🤖 Bot Hosting Manager v2.0.0', 'font-size: 20px; font-weight: bold; color: #6366.f1;');
console.log('%cServer Management System Ready', 'font-size: 14px; color: #8b5cf6;');