# Ntandostore - Premium Fashion & Lifestyle E-commerce Website

A modern, responsive e-commerce website built with HTML, CSS, and JavaScript, optimized for deployment on Render.com.

## 🛍️ Features

- **Modern Design**: Clean, professional layout with smooth animations
- **Fully Responsive**: Works perfectly on desktop, tablet, and mobile devices
- **Interactive Elements**: 
  - Shopping cart functionality
  - Product showcase with hover effects
  - Contact form with validation
  - Newsletter subscription
  - Smooth scrolling navigation
- **Performance Optimized**: Fast loading with optimized assets
- **SEO Friendly**: Semantic HTML5 structure
- **Secure**: Implemented security headers

## 🚀 Quick Start

### Option 1: Local Development

1. **Clone or download the project files**
2. **Install Node.js** (version 14 or higher)
3. **Navigate to the project directory**:
   ```bash
   cd ntandostore
   ```
4. **Install dependencies**:
   ```bash
   npm install
   ```
5. **Start the development server**:
   ```bash
   npm start
   ```
6. **Open your browser** and visit `http://localhost:8050`

### Option 2: Static File Server

If you prefer using Python's built-in server:

```bash
python -m http.server 8050
```

Then visit `http://localhost:8050` in your browser.

## 🌐 Deployment on Render.com

### Step 1: Prepare Your Repository

1. **Create a GitHub repository** for your project
2. **Push all files** to the repository (including `render.yaml`)
3. **Ensure your repository is public** or has Render access

### Step 2: Deploy to Render

1. **Sign up** or **log in** to [Render.com](https://render.com)
2. **Click "New +"** and select **"Static Site"**
3. **Connect your GitHub repository**
4. **Configure deployment settings**:
   - **Name**: `ntandostore` (or your preferred name)
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: `.` (leave empty for root)
   - **Build Command**: `npm run build`
   - **Publish Directory**: `.`
   - **Node Version**: `14.x` (or latest)

5. **Click "Create Static Site"**

### Step 3: Automatic Deployment

Render will automatically:
- Build your site
- Deploy it to a global CDN
- Provide you with a live URL
- Set up SSL certificates
- Deploy updates when you push to GitHub

### Alternative: Using render.yaml

The included `render.yaml` file pre-configures all deployment settings. Simply:
1. Push your code to GitHub
2. Connect the repository to Render
3. Render will automatically use the configuration

## 📁 Project Structure

```
ntandostore/
├── index.html          # Main HTML file
├── css/
│   └── style.css       # Complete styling
├── js/
│   └── script.js       # Interactive functionality
├── images/             # Image assets (add your product images here)
├── server.js           # Express server for deployment
├── package.json        # Node.js configuration
├── render.yaml         # Render.com deployment config
└── README.md           # This file
```

## 🎨 Customization

### Adding Product Images

1. Place your product images in the `images/` folder
2. Update the `index.html` file to reference your images:
   ```html
   <div class="product-image">
       <img src="images/your-product.jpg" alt="Product Name">
   </div>
   ```

### Updating Colors

Edit the CSS variables in `css/style.css`:
```css
:root {
    --primary-color: #e74c3c;
    --secondary-color: #2c3e50;
    --accent-color: #667eea;
}
```

### Adding New Products

Copy and modify the product card structure in `index.html`:
```html
<div class="product-card">
    <div class="product-image">
        <img src="images/product.jpg" alt="Product Name">
        <div class="product-overlay">
            <button class="btn-add-cart">Add to Cart</button>
        </div>
    </div>
    <div class="product-info">
        <h3>Product Name</h3>
        <p class="product-price">$99.99</p>
        <div class="product-rating">
            <!-- Rating stars -->
        </div>
    </div>
</div>
```

## 🔧 Configuration

### Environment Variables

You can customize the site using environment variables in Render:

- `NODE_ENV`: Set to `production` for production builds
- `PORT`: Server port (default: 8050)

### Security Headers

The site includes security headers configured in `render.yaml`:
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Content-Security-Policy: Strict CSP policy

## 🌍 SEO Optimization

The site includes:
- Semantic HTML5 structure
- Meta tags for description and viewport
- Open Graph tags ready for social media
- Clean URLs for all sections
- Mobile-responsive design

## 📱 Mobile Responsiveness

The website is fully responsive with:
- Mobile-first design approach
- Touch-friendly navigation
- Optimized images for mobile
- Hamburger menu for mobile devices

## 🚀 Performance Features

- Optimized CSS and JavaScript
- Lazy loading ready for images
- Minimal external dependencies
- Fast loading times
- CDN-friendly structure

## 🔄 Continuous Deployment

With Render's GitHub integration:
1. Push changes to your repository
2. Render automatically detects changes
3. Site rebuilds and deploys
4. Updates are live within minutes

## 📞 Support

If you need help with deployment or customization:

1. Check the [Render.com documentation](https://render.com/docs)
2. Review the troubleshooting section below
3. Contact our support team at support@ntandostore.com

## 🐛 Troubleshooting

### Common Issues

**Build fails on Render:**
- Check that all files are committed to Git
- Verify `package.json` is valid
- Ensure Node.js version is compatible

**Site doesn't load:**
- Check the Render logs for errors
- Verify the build command is correct
- Ensure all assets are properly referenced

**Styles not loading:**
- Check CSS file paths in `index.html`
- Verify files exist in the correct directories
- Check for CSS syntax errors

**JavaScript not working:**
- Check browser console for errors
- Verify script paths in `index.html`
- Ensure JavaScript syntax is valid

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

**Made with ❤️ by the Ntandostore Team**