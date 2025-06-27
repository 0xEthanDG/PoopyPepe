# Flappy Pepe Game - Deployment Guide

## ✅ Fixed GitHub Actions Deployment

### Current Status
The GitHub Actions workflow has been fixed and uses the reliable `peaceiris/actions-gh-pages` action for deployment.

### GitHub Pages Setup Instructions

#### Step 1: Configure GitHub Pages
1. Go to your repository: **`https://github.com/0xEthanDG/PoopyPepe`**
2. Click **Settings** → **Pages** (in the left sidebar)
3. Under **"Build and deployment"** → **"Source"**
4. Select **"Deploy from a branch"**
5. Under **"Branch"**, select **"gh-pages"**
6. Select folder: **"/ (root)"**
7. Click **Save**

#### Step 2: Monitor Deployment
1. Go to the **Actions** tab in your repository
2. The workflow will automatically run after each push to main
3. Wait for the "Deploy to GitHub Pages" workflow to complete
4. The workflow will create a `gh-pages` branch with your built site

### 🌐 Your Game URL
Once deployed, your game will be available at:
**`https://0xEthanDG.github.io/PoopyPepe`**

---

## Manual Deployment Alternative

If you prefer manual deployment:

```bash
# Install dependencies
npm install

# Build and deploy manually
npm run deploy
```

---

## GitHub Actions Workflow Details

The current workflow (`.github/workflows/deploy.yml`):
- ✅ Runs on every push to main branch
- ✅ Installs Node.js 18 and dependencies
- ✅ Builds the React app
- ✅ Deploys to `gh-pages` branch using `peaceiris/actions-gh-pages`

### What Was Fixed:
1. **Replaced complex GitHub Pages Actions** with proven `peaceiris/actions-gh-pages`
2. **Combined build and deploy** into single job for reliability
3. **Removed problematic permissions** that were causing deployment failures
4. **Simplified workflow** for consistent deployment

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
   - **Web App URL**: `https://0xEthanDG.github.io/PoopyPepe`

### Step 3: Test Your Mini App
1. Open your bot in Telegram
2. Send `/start` or tap the menu button
3. Select your mini app to launch

---

## Troubleshooting

### GitHub Actions Failing?
1. Check the Actions tab for error logs
2. Ensure the workflow file is in `.github/workflows/deploy.yml`
3. Verify the repository has Actions enabled in Settings → Actions

### 404 Error on GitHub Pages?
1. Ensure GitHub Pages is set to deploy from `gh-pages` branch
2. Wait 5-10 minutes after first deployment
3. Check that `index.html` exists in the `gh-pages` branch

### Game Not Loading?
1. Check browser console for errors
2. Verify all assets load over HTTPS
3. Test on different devices and browsers

---

## Final Checklist

- [x] GitHub Actions workflow fixed and deployed ✅
- [ ] GitHub Pages configured to use `gh-pages` branch
- [ ] Workflow completes successfully (check Actions tab)  
- [ ] Game loads at `https://0xEthanDG.github.io/PoopyPepe`
- [ ] Created Telegram bot with @BotFather
- [ ] Configured mini app with correct URL
- [ ] Tested game launch from Telegram

**Final URL**: `https://0xEthanDG.github.io/PoopyPepe`

This URL should be used as your **Web App URL** when configuring your Telegram Mini App with @BotFather. 