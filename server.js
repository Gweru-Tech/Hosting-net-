const express = require('express');
const compression = require('compression');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 10000;

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'bot-hosting-secret-key-2025';

// In-memory user storage (in production, use a database)
const users = new Map();
const servers = new Map();
const databases = new Map();

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https://picsum.photos"],
            connectSrc: ["'self'"],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"]
        }
    },
    crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : true,
    credentials: false
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again later.'
    }
});
app.use('/api/', limiter);

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('dev'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Helper Functions
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

function generateToken(user) {
    return jwt.sign({ 
        userId: user.id, 
        username: user.username,
        email: user.email 
    }, JWT_SECRET, { expiresIn: '7d' });
}

function verifyToken(req, res, next) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: '2.0.0',
        users: users.size,
        servers: servers.size
    });
});

// Configuration endpoint
app.get('/api/config', (req, res) => {
    res.json({
        apiBaseUrl: process.env.BOT_HOSTING_API_BASE_URL || 'https://bot-hosting.net/api/v1',
        panelUrl: process.env.BOT_HOSTING_PANEL_URL || 'https://control.bot-hosting.net',
        environment: process.env.NODE_ENV || 'development',
        version: '2.0.0',
        features: {
            authentication: true,
            serverManagement: true,
            databases: true,
            billing: true,
            oauth: true
        }
    });
});

// Authentication Routes
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        
        // Find user by email or username
        const user = Array.from(users.values()).find(u => 
            u.email === email || u.username === email
        );
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Verify password
        const hashedPassword = hashPassword(password);
        if (user.password !== hashedPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Generate token
        const token = generateToken(user);
        
        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                avatar: user.avatar,
                plan: user.plan,
                coins: user.coins,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/auth/signup', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        // Check if user already exists
        const existingUser = Array.from(users.values()).find(u => 
            u.email === email || u.username === username
        );
        
        if (existingUser) {
            return res.status(409).json({ error: 'User already exists' });
        }
        
        // Validate username
        if (username.length < 3) {
            return res.status(400).json({ error: 'Username must be at least 3 characters' });
        }
        
        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email address' });
        }
        
        // Validate password
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }
        
        // Create new user
        const userId = crypto.randomUUID();
        const hashedPassword = hashPassword(password);
        const newUser = {
            id: userId,
            username,
            email,
            password: hashedPassword,
            plan: 'free',
            coins: 100,
            avatar: `https://picsum.photos/seed/${userId}/100/100.jpg`,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
        };
        
        users.set(userId, newUser);
        
        // Generate token
        const token = generateToken(newUser);
        
        // Create welcome server
        const welcomeServerId = crypto.randomUUID();
        const welcomeServer = {
            id: welcomeServerId,
            userId: userId,
            name: 'Welcome Server',
            type: 'discord-bot',
            status: 'offline',
            specs: { ram: '512MB', storage: '10GB', cpu: '1 Core' },
            runtime: 'nodejs',
            region: 'us-east',
            createdAt: new Date().toISOString()
        };
        servers.set(welcomeServerId, welcomeServer);
        
        res.status(201).json({
            success: true,
            token,
            user: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
                avatar: newUser.avatar,
                plan: newUser.plan,
                coins: newUser.coins,
                createdAt: newUser.createdAt
            }
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/auth/logout', verifyToken, (req, res) => {
    // In a real app, you might want to blacklist the token
    res.json({ success: true, message: 'Logged out successfully' });
});

app.post('/api/auth/forgot', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }
        
        // Find user
        const user = Array.from(users.values()).find(u => u.email === email);
        
        // Always return success to prevent email enumeration
        if (user) {
            // In a real app, send reset email
            console.log(`Password reset requested for: ${email}`);
        }
        
        res.json({ success: true, message: 'If an account exists, a reset link has been sent' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/auth/verify', verifyToken, (req, res) => {
    const user = users.get(req.user.userId);
    if (!user) {
        return res.status(401).json({ error: 'User not found' });
    }
    
    res.json({
        success: true,
        user: {
            id: user.id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            plan: user.plan,
            coins: user.coins,
            createdAt: user.createdAt
        }
    });
});

// OAuth Routes (placeholders)
app.get('/api/auth/discord', (req, res) => {
    // In a real app, implement Discord OAuth
    res.redirect('https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&response_type=code&scope=identify');
});

app.get('/api/auth/github', (req, res) => {
    // In a real app, implement GitHub OAuth
    res.redirect('https://github.com/login/oauth/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&scope=user:email');
});

// User Routes
app.get('/api/user/profile', verifyToken, (req, res) => {
    const user = users.get(req.user.userId);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
        success: true,
        user: {
            id: user.id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            plan: user.plan,
            coins: user.coins,
            createdAt: user.createdAt,
            lastLogin: user.lastLogin
        }
    });
});

app.get('/api/user/settings', verifyToken, (req, res) => {
    const user = users.get(req.user.userId);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
        success: true,
        settings: user.settings || {
            notifications: true,
            darkMode: false,
            language: 'en'
        }
    });
});

app.put('/api/user/settings', verifyToken, (req, res) => {
    const user = users.get(req.user.userId);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    user.settings = { ...user.settings, ...req.body };
    users.set(req.user.userId, user);
    
    res.json({
        success: true,
        settings: user.settings
    });
});

// Server Routes
app.get('/api/user/servers', verifyToken, (req, res) => {
    const userServers = Array.from(servers.values()).filter(s => s.userId === req.user.userId);
    
    res.json({
        success: true,
        servers: userServers
    });
});

app.post('/api/servers/create', verifyToken, (req, res) => {
    try {
        const { name, type, runtime, region, resources } = req.body;
        
        if (!name || !type) {
            return res.status(400).json({ error: 'Name and type are required' });
        }
        
        // Check user's server limit based on plan
        const user = users.get(req.user.userId);
        const userServers = Array.from(servers.values()).filter(s => s.userId === req.user.userId);
        const maxServers = user.plan === 'free' ? 3 : user.plan === 'premium' ? 10 : 50;
        
        if (userServers.length >= maxServers) {
            return res.status(403).json({ error: 'Server limit reached for your plan' });
        }
        
        // Create server
        const serverId = crypto.randomUUID();
        const newServer = {
            id: serverId,
            userId: req.user.userId,
            name,
            type,
            status: 'offline',
            runtime: runtime || 'nodejs',
            region: region || 'us-east',
            specs: getServerSpecs(resources || 'free'),
            createdAt: new Date().toISOString()
        };
        
        servers.set(serverId, newServer);
        
        res.status(201).json({
            success: true,
            server: newServer
        });
    } catch (error) {
        console.error('Create server error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/servers/:id/start', verifyToken, (req, res) => {
    const server = servers.get(req.params.id);
    
    if (!server || server.userId !== req.user.userId) {
        return res.status(404).json({ error: 'Server not found' });
    }
    
    server.status = 'starting';
    servers.set(req.params.id, server);
    
    // Simulate server startup
    setTimeout(() => {
        server.status = 'online';
        servers.set(req.params.id, server);
    }, 3000);
    
    res.json({ success: true, message: 'Server starting...' });
});

app.post('/api/servers/:id/stop', verifyToken, (req, res) => {
    const server = servers.get(req.params.id);
    
    if (!server || server.userId !== req.user.userId) {
        return res.status(404).json({ error: 'Server not found' });
    }
    
    server.status = 'stopping';
    servers.set(req.params.id, server);
    
    // Simulate server shutdown
    setTimeout(() => {
        server.status = 'offline';
        servers.set(req.params.id, server);
    }, 2000);
    
    res.json({ success: true, message: 'Server stopping...' });
});

app.post('/api/servers/:id/restart', verifyToken, (req, res) => {
    const server = servers.get(req.params.id);
    
    if (!server || server.userId !== req.user.userId) {
        return res.status(404).json({ error: 'Server not found' });
    }
    
    server.status = 'restarting';
    servers.set(req.params.id, server);
    
    // Simulate server restart
    setTimeout(() => {
        server.status = 'online';
        servers.set(req.params.id, server);
    }, 4000);
    
    res.json({ success: true, message: 'Server restarting...' });
});

app.delete('/api/servers/:id', verifyToken, (req, res) => {
    const server = servers.get(req.params.id);
    
    if (!server || server.userId !== req.user.userId) {
        return res.status(404).json({ error: 'Server not found' });
    }
    
    servers.delete(req.params.id);
    
    res.json({ success: true, message: 'Server deleted' });
});

// Database Routes
app.get('/api/user/databases', verifyToken, (req, res) => {
    const userDatabases = Array.from(databases.values()).filter(d => d.userId === req.user.userId);
    
    res.json({
        success: true,
        databases: userDatabases
    });
});

// Billing Routes
app.get('/api/billing/info', verifyToken, (req, res) => {
    const user = users.get(req.user.userId);
    
    res.json({
        success: true,
        billing: {
            plan: user.plan,
            coins: user.coins,
            nextBilling: user.plan === 'free' ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            usage: {
                servers: Array.from(servers.values()).filter(s => s.userId === req.user.userId).length,
                databases: Array.from(databases.values()).filter(d => d.userId === req.user.userId).length,
                storage: '2.1GB',
                bandwidth: '15.3GB'
            }
        }
    });
});

app.post('/api/billing/upgrade', verifyToken, (req, res) => {
    const { plan } = req.body;
    const user = users.get(req.user.userId);
    
    if (!plan || !['premium', 'enterprise'].includes(plan)) {
        return res.status(400).json({ error: 'Invalid plan' });
    }
    
    // In a real app, process payment
    user.plan = plan;
    users.set(req.user.userId, user);
    
    res.json({
        success: true,
        message: `Successfully upgraded to ${plan} plan`,
        plan
    });
});

// Helper function to get server specs
function getServerSpecs(plan) {
    const specs = {
        free: { ram: '512MB', storage: '10GB', cpu: '1 Core' },
        premium: { ram: '4GB', storage: '50GB', cpu: '4 Cores' },
        enterprise: { ram: '8GB', storage: '200GB', cpu: '8 Cores' }
    };
    return specs[plan] || specs.free;
}

// Serve static files
app.use(express.static(path.join(__dirname, '.'), {
    maxAge: process.env.NODE_ENV === 'production' ? '1y' : '0',
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('X-Frame-Options', 'DENY');
        }
        
        if (filePath.endsWith('.js') || filePath.endsWith('.css')) {
            res.setHeader('Cache-Control', 'public, max-age=31536000');
        } else if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'public, max-age=3600');
        }
    }
}));

// Handle client-side routing
app.get(['/dashboard', '/servers', '/databases', '/billing', '/settings'], (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API proxy routes (placeholder)
app.all('/api/proxy/*', async (req, res) => {
    res.status(404).json({ error: 'Proxy not implemented' });
});

// 404 handler
app.use((req, res) => {
    if (req.path.includes('.')) {
        res.status(404).json({ error: 'File not found' });
    } else {
        res.sendFile(path.join(__dirname, 'index.html'));
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    
    const message = process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : err.message;
    
    res.status(err.status || 500).json({
        error: message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
});

// Create sample data
function createSampleData() {
    // Create sample users
    const sampleUsers = [
        {
            id: 'demo-user-1',
            username: 'demo_user',
            email: 'demo@example.com',
            password: hashPassword('demo123'),
            plan: 'premium',
            coins: 500,
            avatar: 'https://picsum.photos/seed/demo-user/100/100.jpg',
            createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        }
    ];
    
    sampleUsers.forEach(user => {
        users.set(user.id, user);
    });
    
    // Create sample servers
    const sampleServers = [
        {
            id: 'demo-server-1',
            userId: 'demo-user-1',
            name: 'My Discord Bot',
            type: 'discord-bot',
            status: 'online',
            specs: { ram: '512MB', storage: '10GB', cpu: '1 Core' },
            runtime: 'nodejs',
            region: 'us-east',
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            id: 'demo-server-2',
            userId: 'demo-user-1',
            name: 'Minecraft Server',
            type: 'game-server',
            status: 'offline',
            specs: { ram: '4GB', storage: '50GB', cpu: '4 Cores' },
            runtime: 'java',
            region: 'eu',
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        }
    ];
    
    sampleServers.forEach(server => {
        servers.set(server.id, server);
    });
}

// Initialize sample data
createSampleData();

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Process terminated');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    server.close(() => {
        console.log('Process terminated');
        process.exit(0);
    });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Bot Hosting Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📱 Health check: http://localhost:${PORT}/health`);
    console.log(`🏠 Application: http://localhost:${PORT}/`);
    console.log(`👥 Sample Users: ${users.size}`);
    console.log(`🖥️ Sample Servers: ${servers.size}`);
    console.log(`📊 Ready for production deployment!`);
});

module.exports = app;