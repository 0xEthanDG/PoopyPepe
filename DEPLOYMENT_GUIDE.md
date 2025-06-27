# Flappy Pepe Game - Deployment Guide

## GitHub Pages Deployment

### Prerequisites
- GitHub account
- Repository pushed to GitHub
- Node.js and npm installed locally

### Step 1: Update Repository URL
1. Replace `USERNAME` in `package.json` with your actual GitHub username:
   ```json
   "homepage": "https://YOUR_GITHUB_USERNAME.github.io/flappypepegametg"
   ```

### Step 2: Install Dependencies and Deploy
```bash
# Install dependencies (including gh-pages)
npm install

# Build and deploy to GitHub Pages
npm run deploy
```

### Step 3: Configure GitHub Pages
1. Go to your repository on GitHub
2. Navigate to **Settings** → **Pages**
3. Under **Source**, select **Deploy from a branch**
4. Select branch: `gh-pages`
5. Select folder: `/ (root)`
6. Click **Save**

### Step 4: Access Your Game
Your game will be available at: `https://YOUR_GITHUB_USERNAME.github.io/flappypepegametg`

---

## Alternative: GitHub Actions Deployment

For automated deployment on every push to main:

### Step 1: Enable GitHub Actions
1. The workflow file `.github/workflows/deploy.yml` is already configured
2. Go to repository **Settings** → **Pages**
3. Under **Source**, select **GitHub Actions**

### Step 2: Push to Main Branch
The deployment will happen automatically on every push to the main branch.

---

## Telegram Mini App Integration

### Step 1: Create Telegram Bot
1. Message [@BotFather](https://t.me/BotFather) on Telegram
2. Create a new bot with `/newbot`
3. Get your bot token

### Step 2: Configure Mini App
1. Send `/newapp` to @BotFather
2. Select your bot
3. Provide the following details:
   - **Title**: `Flappy Pepe Game`
   - **Description**: `A fun flappy bird style game with Pepe`
   - **Photo**: Upload game screenshot (optional)
   - **Web App URL**: `https://YOUR_GITHUB_USERNAME.github.io/flappypepegametg`

### Step 3: Test Your Mini App
1. Open your bot in Telegram
2. Send `/start` or tap the menu button
3. Select your mini app to launch

---

## Mobile Optimization Features

### ✅ Implemented Features
- **Touch Controls**: Game responds to touch/tap input
- **Responsive Design**: Adapts to different screen sizes
- **Mobile Viewport**: Optimized for mobile browsers
- **Telegram Integration**: Full Telegram Mini App SDK support
- **Performance**: Optimized for mobile devices
- **Fullscreen Display**: Immersive gaming experience

### Technical Features
- **HTTPS Ready**: All assets served over HTTPS
- **Mobile-First CSS**: Responsive design patterns
- **Touch Optimization**: Prevents zoom, scrolling, and selection
- **High DPI Support**: Crisp graphics on retina displays
- **Orientation Support**: Works in both portrait and landscape

---

## Troubleshooting

### Common Issues

**Issue**: Game doesn't load in Telegram
- **Solution**: Ensure your GitHub Pages URL is working and serving over HTTPS

**Issue**: Touch controls don't work
- **Solution**: Make sure the site is served over HTTPS (required for touch events in Telegram)

**Issue**: Game is cut off on mobile
- **Solution**: The CSS includes responsive scaling - if issues persist, check browser developer tools

**Issue**: Deploy command fails
- **Solution**: Make sure you've committed all changes and have the correct repository permissions

### Testing Locally
```bash
# Start development server
npm start

# Build production version
npm run build

# Serve build locally (install serve globally: npm install -g serve)
serve -s build
```

---

## Final Checklist

- [ ] Updated `homepage` in `package.json` with correct GitHub username
- [ ] Ran `npm install` to install gh-pages dependency
- [ ] Deployed with `npm run deploy` or set up GitHub Actions
- [ ] Confirmed game loads at GitHub Pages URL
- [ ] Created Telegram bot with @BotFather
- [ ] Configured mini app with correct URL
- [ ] Tested game launch from Telegram

**Final URL Format**: `https://YOUR_GITHUB_USERNAME.github.io/flappypepegametg`

This URL should be used as your **Web App URL** when configuring your Telegram Mini App with @BotFather. 