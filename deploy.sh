#!/bin/bash

# Bot Hosting Manager Deployment Script
# This script helps prepare and deploy the application

set -e

echo "🚀 Bot Hosting Manager Deployment Script"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if Node.js is installed
check_nodejs() {
    print_step "Checking Node.js installation..."
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_status "Node.js found: $NODE_VERSION"
    else
        print_error "Node.js is not installed. Please install Node.js 14+ to continue."
        exit 1
    fi
}

# Check if npm is installed
check_npm() {
    print_step "Checking npm installation..."
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        print_status "npm found: $NPM_VERSION"
    else
        print_error "npm is not installed. Please install npm to continue."
        exit 1
    fi
}

# Install dependencies
install_dependencies() {
    print_step "Installing dependencies..."
    npm install
    print_status "Dependencies installed successfully"
}

# Validate configuration files
validate_config() {
    print_step "Validating configuration files..."
    
    if [ ! -f "package.json" ]; then
        print_error "package.json not found"
        exit 1
    fi
    
    if [ ! -f "server.js" ]; then
        print_error "server.js not found"
        exit 1
    fi
    
    if [ ! -f "render.yaml" ]; then
        print_warning "render.yaml not found - deployment will require manual configuration"
    fi
    
    print_status "Configuration files validated"
}

# Test local server
test_local() {
    print_step "Testing local server..."
    print_status "Starting local server on http://localhost:10000"
    print_status "Press Ctrl+C to stop the server"
    print_status "Visit http://localhost:10000/health to check health endpoint"
    
    # Start server in background
    npm start &
    SERVER_PID=$!
    
    # Wait a moment for server to start
    sleep 3
    
    # Test health endpoint
    if curl -s http://localhost:10000/health > /dev/null; then
        print_status "✅ Local server is running correctly"
    else
        print_error "❌ Local server failed to start"
        kill $SERVER_PID 2>/dev/null
        exit 1
    fi
    
    # Keep server running
    wait $SERVER_PID
}

# Prepare for deployment
prepare_deployment() {
    print_step "Preparing for deployment..."
    
    # Create .env.example if it doesn't exist
    if [ ! -f ".env.example" ]; then
        cat > .env.example << EOL
NODE_ENV=production
BOT_HOSTING_API_BASE_URL=https://bot-hosting.net/api/v1
BOT_HOSTING_PANEL_URL=https://control.bot-hosting.net
ALLOWED_ORIGINS=https://your-app.onrender.com
PORT=10000
EOL
        print_status "Created .env.example file"
    fi
    
    # Optimize images and assets (if tools are available)
    if command -v svgo &> /dev/null; then
        print_status "Optimizing SVG files..."
        # Add SVG optimization here if needed
    fi
    
    print_status "Deployment preparation completed"
}

# Git operations
git_operations() {
    print_step "Preparing git repository..."
    
    # Initialize git if not already done
    if [ ! -d ".git" ]; then
        git init
        print_status "Git repository initialized"
    fi
    
    # Add all files
    git add .
    
    # Commit changes
    if git commit -m "Update Bot Hosting Manager for Render deployment" > /dev/null 2>&1; then
        print_status "Changes committed to git"
    else
        print_warning "No changes to commit or git not configured"
    fi
    
    # Show current status
    print_status "Current git status:"
    git status --short
}

# Build verification
verify_build() {
    print_step "Verifying build process..."
    
    # Run build command
    npm run build
    
    # Check if essential files exist
    essential_files=("index.html" "server-script.js" "server-styles.css" "server.js")
    
    for file in "${essential_files[@]}"; do
        if [ -f "$file" ]; then
            print_status "✅ $file exists"
        else
            print_error "❌ $file is missing"
            exit 1
        fi
    done
    
    print_status "Build verification completed"
}

# Show deployment instructions
show_instructions() {
    echo ""
    echo "🎉 Deployment preparation completed!"
    echo "===================================="
    echo ""
    echo "Next steps for Render.com deployment:"
    echo ""
    echo "1. 📁 Push code to GitHub:"
    echo "   git remote add origin https://github.com/yourusername/bot-hosting-manager.git"
    echo "   git push -u origin main"
    echo ""
    echo "2. 🌐 Deploy on Render.com:"
    echo "   - Go to render.com"
    echo "   - Connect your GitHub repository"
    echo "   - Choose 'Node' environment"
    echo "   - Set build command: 'npm install && npm run build'"
    echo "   - Set start command: 'npm start'"
    echo ""
    echo "3. ⚙️ Set environment variables:"
    echo "   - NODE_ENV=production"
    echo "   - BOT_HOSTING_API_BASE_URL=https://bot-hosting.net/api/v1"
    echo "   - BOT_HOSTING_PANEL_URL=https://control.bot-hosting.net"
    echo ""
    echo "4. 🚀 Deploy and access your app at: https://your-app.onrender.com"
    echo ""
    echo "For detailed instructions, see DEPLOYMENT.md"
    echo ""
}

# Main deployment flow
main() {
    echo ""
    print_status "Starting deployment preparation..."
    echo ""
    
    # Check prerequisites
    check_nodejs
    check_npm
    
    # Install and configure
    install_dependencies
    validate_config
    prepare_deployment
    
    # Verify build
    verify_build
    
    # Git operations
    git_operations
    
    # Show next steps
    show_instructions
}

# Handle command line arguments
case "${1:-}" in
    "test")
        print_status "Running local test..."
        check_nodejs
        check_npm
        install_dependencies
        test_local
        ;;
    "build")
        print_status "Building for deployment..."
        check_nodejs
        check_npm
        install_dependencies
        verify_build
        print_status "Build completed successfully"
        ;;
    "deploy")
        main
        ;;
    "help"|"-h"|"--help")
        echo "Bot Hosting Manager Deployment Script"
        echo ""
        echo "Usage: ./deploy.sh [command]"
        echo ""
        echo "Commands:"
        echo "  test    - Test local server"
        echo "  build   - Build for deployment"
        echo "  deploy  - Full deployment preparation"
        echo "  help    - Show this help message"
        echo ""
        echo "Default: ./deploy.sh (runs full deployment preparation)"
        ;;
    "")
        main
        ;;
    *)
        print_error "Unknown command: $1"
        echo "Run './deploy.sh help' for usage information"
        exit 1
        ;;
esac