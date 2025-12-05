# Bot Hosting Manager

A comprehensive third-party management interface for bot-hosting.net that provides real-time server management, API integration, and enhanced user experience.

## 🚀 Features

### ✅ **Real API Integration**
- Connect directly to bot-hosting.net API endpoints
- Real-time server status monitoring
- Actual server start/stop/restart functionality
- Live data synchronization with official panel

### 📊 **Dashboard & Analytics**
- Real-time server statistics
- Performance monitoring
- Usage tracking and reporting
- Connection status indicators

### 🔧 **Server Management**
- Create and manage multiple servers
- Start/stop/restart controls
- Server specifications display
- Region and language selection
- Status monitoring and alerts

### 💰 **Billing Integration**
- Current plan information
- Usage statistics
- Payment history
- Upgrade options linking to official site

### 🎯 **Marketplace**
- Pre-configured server templates
- One-click deployment setup
- Categories for different server types
- Popular applications and tools

### ⚙️ **Settings & Configuration**
- Account management
- API key configuration
- Preferences and notifications
- Security settings

### 👥 **Admin Panel**
- User management
- System administration
- Billing oversight
- Advanced controls

## 🛠️ Installation & Setup

### **Prerequisites**
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Valid bot-hosting.net account
- Auth ID from bot-hosting.net panel

### **Getting Your Auth ID**
1. Log in to your [bot-hosting.net](https://bot-hosting.net/panel/) account
2. Open browser developer tools (F12)
3. Navigate to the **Console** tab
4. Run: `var token = localStorage.getItem('token');`
5. Run: `console.log('Your Auth ID:', token);`
6. Copy the displayed Auth ID

### **Local Setup**
1. Clone or download the project files
2. Open `index.html` in your web browser
3. Click the "Connect" button in the top status bar
4. Enter your username and Auth ID
5. Click "Connect" to link your account

### **Server Deployment**
1. Upload files to your web server
2. Ensure HTTPS is configured (recommended)
3. Access through your domain
4. Connect with your Auth ID

## 🔌 API Endpoints

The system connects to multiple bot-hosting.net API endpoints:

### **Account APIs**
- `GET /api/v1/account` - Account information
- `GET /api/v1/account/validate` - Validate Auth ID
- `GET /api/v1/account/coins` - Coin balance
- `GET /api/v1/account/claimable` - Claim status

### **Server APIs**
- `GET /api/client/servers` - Server list
- `GET /api/client/servers/{id}/resources` - Server resources
- `POST /api/client/servers/{id}/power` - Power control
- `GET /api/client/servers/{id}/files/list` - File listing

### **Billing APIs**
- `GET /api/v1/billing` - Billing information
- `GET /api/v1/billing/usage` - Usage statistics

## 📋 User Guide

### **Connecting to Your Account**
1. Launch the application
2. Click "Connect" in the top status bar
3. Enter your bot-hosting.net username
4. Paste your Auth ID
5. Check "Enable shared access" if needed
6. Click "Connect"

### **Managing Servers**
1. **View Servers**: Navigate to "My Servers" or Dashboard
2. **Create Server**: Click "Create New Server" and fill details
3. **Start/Stop**: Use the power buttons on server cards
4. **Monitor**: Check real-time status and resources

### **Using the Marketplace**
1. Go to "Marketplace" section
2. Browse categories (Bots, Games, Web, Database)
3. Click "Deploy Now" on desired template
4. Customize server details
5. Create and configure your server

### **Billing & Plans**
1. Visit "Billing" section
2. View current plan and usage
3. Check payment history
4. Click upgrade link for premium features

## 🛠️ Configuration

### **API Settings**
The application can be configured with custom API endpoints:

```javascript
const API_CONFIG = {
    botHosting: {
        baseUrl: 'https://bot-hosting.net/api/v1',
        panelUrl: 'https://control.bot-hosting.net',
        timeout: 10000
    }
};
```

### **Session Management**
Sessions are stored locally in `localStorage`:
- Session key: `botHostingSession`
- Auto-refresh on page load
- Secure Auth ID storage

## 🚨 Troubleshooting

### **Common Issues**

**"Connection Failed" Error**
- Verify your Auth ID is correct
- Check internet connection
- Ensure Auth ID hasn't expired (expires every 2 weeks)
- Try refreshing the Auth ID from the official panel

**Server Status Not Updating**
- Refresh servers using the "Refresh All" button
- Check API connection status
- Verify server permissions in your account

**Can't Find Auth ID**
- Make sure you're logged into bot-hosting.net
- Use browser console as described in setup
- Contact support if issues persist

### **Debug Mode**
Enable debug logging by opening browser console:
```javascript
window.botHostingManager.servers() // View current servers
window.botHostingManager.session() // View session info
```

## 🔒 Security

- **Auth ID Storage**: Stored securely in browser localStorage
- **API Communication**: Encrypted HTTPS connections
- **No Password Storage**: Only Auth ID tokens are used
- **Session Management**: Automatic cleanup on logout
- **Shared Access**: Optional control over session visibility

## 🌟 Features Roadmap

### **Phase 3 - Enhanced Billing**
- [ ] Real-time usage calculations
- [ ] Automated alerts for limits
- [ ] Plan comparison tools
- [ ] Invoice generation

### **Phase 4 - Advanced Features**
- [ ] Server backups and snapshots
- [ ] Custom domain management
- [] Advanced monitoring and alerts
- [ ] SSH/SFTP integration

### **Phase 5 - Mobile App**
- [ ] Native iOS/Android apps
- [ ] Push notifications
- [ ] Offline mode
- [ ] Touch controls

## 📞 Support

### **Get Help**
- **Discord**: [Official Server](https://discord.gg/6FKKj4qEM6)
- **Documentation**: [Wiki](https://wiki.bot-hosting.net)
- **Issues**: Report via GitHub Issues
- **Email**: support@bot-hosting.net

### **Community**
- Join the Discord server for live support
- Browse the wiki for detailed guides
- Check the FAQ for common questions
- Contribute to the project development

## ⚠️ Disclaimer

**Bot Hosting Manager** is a third-party application and is **not officially affiliated** with bot-hosting.net. This tool is provided as-is for convenience and enhanced user experience.

- **No Warranty**: No guarantees are provided
- **Use at Risk**: Users assume all responsibility
- **Official Source**: Always verify with official bot-hosting.net panel
- **Data Privacy**: No data is stored on external servers

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

### **Guidelines**
- Follow existing code style
- Add documentation for new features
- Test thoroughly before submitting
- Be respectful in discussions

## 📊 Version History

### **v2.0.0 (Current)**
- ✅ Real API integration
- ✅ Enhanced UI/UX
- ✅ Mobile responsive
- ✅ Admin panel
- ✅ Billing integration

### **v1.0.0**
- Basic dashboard
- Mock data
- Simple UI
- No API connection

---

**Built with ❤️ for the bot-hosting.net community**