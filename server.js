const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 8050;

// Serve static files
app.use(express.static(__dirname));

// Handle specific routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/home', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/products', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/contact', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🛍️ Ntandostore server running on port ${PORT}`);
    console.log(`📍 Open http://localhost:${PORT} in your browser`);
});

// Export for testing
module.exports = app;