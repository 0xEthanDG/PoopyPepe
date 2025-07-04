﻿# 🐸 Flappy Pepe Game - Telegram Mini App

A fun flappy bird style game featuring Pepe, optimized for Telegram Mini Apps and mobile devices.

## 📱 Features

- **Touch Controls**: Tap to make Pepe jump
- **Mobile Optimized**: Responsive design for all screen sizes
- **Telegram Integration**: Full Telegram Mini App SDK support
- **High Performance**: Smooth 60fps gameplay
- **Pixel Art Style**: Crisp retro graphics with pixel-perfect rendering

## 🎮 How to Play

- **Tap/Click** to make Pepe jump
- Avoid hitting the pipes
- Try to get the highest score possible!

## 🛠️ Deployment Setup

This project is configured for easy deployment to GitHub Pages and integration with Telegram Mini Apps.

### Quick Deploy
```bash
# Install dependencies
npm install

# Deploy to GitHub Pages
npm run deploy
```

### Full Setup Guide
See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for complete step-by-step instructions.

## 🔧 Development

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build

# Deploy to GitHub Pages
npm run deploy
```

## 📋 Telegram Mini App Configuration

1. Create a bot with [@BotFather](https://t.me/BotFather)
2. Use `/newapp` to create a Mini App
3. Set Web App URL to: `https://YOUR_GITHUB_USERNAME.github.io/flappypepegametg`

## 🎯 Technical Features

- **React 19** with functional components
- **Canvas-based rendering** for smooth gameplay
- **Mobile-first responsive design**
- **Touch event optimization**
- **HTTPS ready** for Telegram compatibility
- **Automated GitHub Pages deployment**

## 📱 Mobile Optimizations

- Prevents zoom and scrolling
- Optimized touch controls
- Responsive canvas sizing
- High DPI display support
- Fullscreen mobile experience

## 🔧 Project Structure

```
src/
├── components/
│   └── GameCanvas.js      # Main game component
├── styles/
│   └── GameCanvas.css     # Mobile-optimized styles
├── assets/
│   └── *.png             # Game sprites
└── App.js                # Root component
```

## 📄 License

MIT License - Feel free to use this project as a template for your own Telegram Mini Apps!

---

**Ready to deploy?** Follow the [Deployment Guide](DEPLOYMENT_GUIDE.md) to get your game live!
