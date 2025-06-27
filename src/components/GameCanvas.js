import React, { useRef, useEffect, useState } from 'react';
import '../styles/GameCanvas.css';
// Import the PlushPepe sprite (high-resolution version for optimal quality)
import plushpepeSprite from '../assets/plushpepe.png';
// Import the new Pipe assets
import pipeShaftSprite from '../assets/pipeshaft.png';
import pipeCapSprite from '../assets/pipecap.png';
// Import the Ground, Grass, Cloud, and Fart sprites
import groundSprite from '../assets/ground.png';
import grassSprite from '../assets/grass.png';
import cloudSprite from '../assets/cloud.png';
import fartSprite from '../assets/fart.png';

/* ====== Constants (tuned to original physics) ====== */
const V_WIDTH = 576;    // virtual canvas size (px) - 2x resolution
const V_HEIGHT = 1024;  // 2x resolution for better sprite quality

// Global score variable for debugging
let globalScore = 0;

// Physics Constants - Realistic Earth-like gravity simulation
// Scale: ~100px = 1 meter, 60fps = real-time
// Earth gravity: 9.8 m/s² = 9.8 * 100px/m ÷ (60fps)² = 0.272 px/frame²
// Increased slightly for better game feel while staying realistic
const GRAVITY = 0.4;   // px/frame² at 60 fps (realistic Earth-like gravity + game feel)
const JUMP_VELOCITY = -6.5; // upward impulse (px/frame, increased to match stronger gravity)
const MAX_FALL_SPEED = 12;   // terminal velocity downward (realistic for a small bird)

// Synchronized scroll system - single speed for perfect alignment
const SCROLL_SPEED = 4.025; // horizontal px / frame (scaled 2x) - increased by 15% for smoother gameplay
const PIPE_INTERVAL = 350; // distance between pipes (reduced for more frequent obstacles)
const PIPE_GAP = 162.5;   // vertical gap size (increased by 25% for better balance)
const CLOUD_SPEED = 1.84; // cloud scroll speed (increased proportionally with scroll speed)

const PLUSHPEPE_X = 160;     // fixed horizontal plushpepe position (scaled 2x)
const PLUSHPEPE_SIZE = 96;   // PlushPepe sprite size (scaled 2x for high resolution)
const PLUSHPEPE_HITBOX = 48; // PlushPepe collision box (scaled 2x)
const PIPE_WIDTH = 104; // sprite width (scaled 2x)
// PIPE_CAP_HEIGHT removed - dynamically calculated from image aspect ratio

// Game constants: PLUSHPEPE_X=160, PIPE_WIDTH=104
// Ground height will be calculated from the actual sprite dimensions
let GROUND_HEIGHT = 224; // default fallback, will be updated when ground sprite loads

// Fart effect constants
const FART_DURATION = 30; // frames (0.5 seconds at 60fps)
const FART_FADE_IN_DURATION = 6; // frames (0.1 seconds at 60fps)
const FART_FADE_OUT_DURATION = 6; // frames (0.1 seconds at 60fps)
// FART_FULL_OPACITY_DURATION removed - calculated inline for better performance
const FART_SIZE_RATIO = 0.8; // 80% of Pepe's size
const FART_OFFSET_X = -15; // pixels behind Pepe's visible edge (left side)
const FART_OFFSET_Y = 35;  // pixels below Pepe's center (bottom-left area)

/* ====== Helper: calculate fart opacity based on timer ====== */
function getFartOpacity(timeRemaining) {
  // Clamp timeRemaining to valid range
  timeRemaining = Math.max(0, Math.min(FART_DURATION, timeRemaining));
  
  const timeElapsed = FART_DURATION - timeRemaining;
  
  if (timeElapsed < FART_FADE_IN_DURATION) {
    // Fade in phase (0.0 to 1.0 over first 0.1 seconds)
    const fadeInProgress = timeElapsed / FART_FADE_IN_DURATION;
    return Math.max(0, Math.min(1, fadeInProgress));
  } else if (timeRemaining > FART_FADE_OUT_DURATION) {
    // Full opacity phase (1.0 for middle 0.3 seconds)
    return 1.0;
  } else {
    // Fade out phase (1.0 to 0.0 over last 0.1 seconds)
    const fadeOutProgress = timeRemaining / FART_FADE_OUT_DURATION;
    return Math.max(0, Math.min(1, fadeOutProgress));
  }
}

// Removed unused helper functions to clean up build warnings

/* ====== Helper: Calculate Pepe's 3-flap maneuverability in 1.5 seconds ====== */
function calculatePepeManeuverability() {
  const oneAndHalfSecondFrames = 90; // 1.5 seconds at 60fps
  const optimalFlapInterval = 18; // frames between flaps (0.3 seconds)
  const maxFlaps = 3; // exactly 3 flaps as specified
  
  // Simulate 3 flaps over 1.5 seconds
  let maxUpwardTravel = 0;
  let maxDownwardTravel = 0;
  let position = 0;
  let velocity = 0;
  let flapsUsed = 0;
  
  for (let frame = 0; frame < oneAndHalfSecondFrames; frame++) {
    // Apply flap at optimal intervals, max 3 flaps
    if (frame % optimalFlapInterval === 0 && flapsUsed < maxFlaps) {
      velocity = JUMP_VELOCITY;
      flapsUsed++;
    }
    
    // Apply physics
    velocity += GRAVITY;
    if (velocity > MAX_FALL_SPEED) velocity = MAX_FALL_SPEED;
    position += velocity;
    
    // Track maximum travel in both directions
    if (position < maxUpwardTravel) maxUpwardTravel = position;
    if (position > maxDownwardTravel) maxDownwardTravel = position;
  }
  
  const climbRange = Math.abs(maxUpwardTravel) * 0.85; // 85% safety margin
  const fallRange = Math.abs(maxDownwardTravel) * 0.9; // 90% safety margin
  
  console.log(`🧮 Pepe maneuverability: 3 flaps in 1.5s = climb ${climbRange.toFixed(0)}px, fall ${fallRange.toFixed(0)}px`);
  return { climb: climbRange, fall: fallRange };
}

/* ====== Helper: Enhanced pipe gap generation with proper height constraints ====== */
function randomGapY(previousGapY = null) {
  // Calculate safe pipe gap positioning to ensure full pipe rendering
  const SCREEN_HEIGHT = 1024; // V_HEIGHT
  const FIXED_GROUND_HEIGHT = 224;
  const ACTUAL_GROUND_Y = SCREEN_HEIGHT - FIXED_GROUND_HEIGHT; // 800px
  
  // Define minimum pipe shaft height for visual balance (at least one full shaft segment + cap)
  const MIN_PIPE_SHAFT_HEIGHT = 80; // Ensures at least one visible shaft tile + cap
  const SAFE_MARGIN = 50; // Additional margin for gameplay fairness
  
  // Calculate safe Y-range for gap center to ensure both pipes render fully
  const minGapY = MIN_PIPE_SHAFT_HEIGHT + SAFE_MARGIN; // ~130px from top
  const maxGapY = ACTUAL_GROUND_Y - PIPE_GAP - MIN_PIPE_SHAFT_HEIGHT - SAFE_MARGIN; // ~550px from top
  
  console.log(`🔧 Safe gap range: ${minGapY}px to ${maxGapY}px (ensures ${MIN_PIPE_SHAFT_HEIGHT}px+ shaft on both pipes)`);
  
  // Get Pepe's 3-flap maneuverability constraints
  const maneuverability = calculatePepeManeuverability();
  const MAX_UPWARD_DELTA = Math.min(95, maneuverability.climb); // Cap at 95px for balance
  const MAX_DOWNWARD_DELTA = Math.min(100, maneuverability.fall); // Cap at 100px for balance
  
  let targetGapY;
  
  if (previousGapY !== null) {
    // Calculate reachable range from previous gap with maneuverability constraints
    const minReachableY = Math.max(minGapY, previousGapY - MAX_UPWARD_DELTA);
    const maxReachableY = Math.min(maxGapY, previousGapY + MAX_DOWNWARD_DELTA);
    
    // Enhanced variation system with MINIMUM 40px delta requirement
    // 10% small (±30px), 30% medium (±60px), 60% large (full reachable range)
    const variationType = Math.random();
    let finalRange;
    
    if (variationType < 0.1) {
      // Small variation - subtle changes
      const smallDelta = 30;
      finalRange = {
        min: Math.max(minReachableY, previousGapY - smallDelta),
        max: Math.min(maxReachableY, previousGapY + smallDelta)
      };
    } else if (variationType < 0.4) {
      // Medium variation - moderate changes
      const mediumDelta = 60;
      finalRange = {
        min: Math.max(minReachableY, previousGapY - mediumDelta),
        max: Math.min(maxReachableY, previousGapY + mediumDelta)
      };
    } else {
      // Large variation - use full reachable range for maximum diversity
      finalRange = {
        min: minReachableY,
        max: maxReachableY
      };
    }
    
    // Generate position with minimum 40px delta requirement
    let attempts = 0;
    const maxAttempts = 20;
    
    do {
      const rangeSize = finalRange.max - finalRange.min;
      targetGapY = Math.floor(finalRange.min + Math.random() * rangeSize);
      attempts++;
    } while (Math.abs(targetGapY - previousGapY) < 40 && attempts < maxAttempts);
    
    // If we couldn't meet the 40px requirement, force it
    if (Math.abs(targetGapY - previousGapY) < 40) {
      // Try to move 40px up or down from previous position
      const moveUp = previousGapY - 40;
      const moveDown = previousGapY + 40;
      
      if (moveUp >= minReachableY) {
        targetGapY = moveUp;
      } else if (moveDown <= maxReachableY) {
        targetGapY = moveDown;
      } else {
        // Use the furthest possible position
        targetGapY = Math.abs(minReachableY - previousGapY) > Math.abs(maxReachableY - previousGapY) 
          ? minReachableY : maxReachableY;
      }
    }
    
    const deltaDirection = targetGapY > previousGapY ? 'DOWN' : 'UP';
    const deltaAmount = Math.abs(targetGapY - previousGapY);
    const variationTypeStr = variationType < 0.1 ? 'SMALL' : variationType < 0.4 ? 'MEDIUM' : 'LARGE';
    const screenPercent = ((targetGapY / SCREEN_HEIGHT) * 100).toFixed(1);
    console.log(`🎯 Safe gap: prev=${previousGapY}, new=${targetGapY} (${screenPercent}% screen), ${deltaDirection} ${deltaAmount}px (${variationTypeStr})`);
  } else {
    // First gap - use safe middle range to ensure full pipe rendering
    const safeRangeSize = maxGapY - minGapY;
    const middleStart = minGapY + safeRangeSize * 0.25; // 25% into safe range
    const middleEnd = minGapY + safeRangeSize * 0.75;   // 75% into safe range
    
    // Generate first gap in safe middle range
    targetGapY = Math.floor(middleStart + Math.random() * (middleEnd - middleStart));
    
    const screenPercent = ((targetGapY / SCREEN_HEIGHT) * 100).toFixed(1);
    console.log(`🎯 Safe initial gap at Y=${targetGapY} (${screenPercent}% screen height, range=${Math.floor(middleStart)}-${Math.floor(middleEnd)})`);
  }
  
  // Clamp to absolute safe bounds (no micro-variation that could break bounds)
  const finalGapY = Math.max(minGapY, Math.min(maxGapY, targetGapY));
  
  // Verify the bottom pipe will render properly
  const bottomPipeHeight = ACTUAL_GROUND_Y - (finalGapY + PIPE_GAP);
  const topPipeHeight = finalGapY;
  console.log(`🔍 Pipe heights: top=${topPipeHeight}px, bottom=${bottomPipeHeight}px (both > ${MIN_PIPE_SHAFT_HEIGHT}px required)`);
  
  return finalGapY;
}

/* ====== Helper: Draw pipe with shaft and cap assets ====== */
function drawPipeWithAssets(ctx, shaftImg, capImg, x, y, width, height, isTopPipe = false) {
  if (!shaftImg || !capImg) return;
  
  ctx.save();
  ctx.imageSmoothingEnabled = false; // Disable smoothing for pixel-perfect rendering
  
  // Calculate cap dimensions - keep original aspect ratio, scale to fit pipe width
  const capAspectRatio = capImg.height / capImg.width;
  const capWidth = width;
  const capHeight = Math.round(capWidth * capAspectRatio);
  
  // Calculate shaft height - fill remaining space after cap
  const shaftHeight = Math.max(0, height - capHeight);
  
  if (isTopPipe) {
    // Top pipe: cap at bottom (towards gap), shaft above it (both upside down)
    
    // Draw the shaft above the cap (tiled, upside down)
    if (shaftHeight > 0) {
      ctx.save();
      ctx.translate(x + width/2, y + shaftHeight/2);
      ctx.rotate(Math.PI); // Flip upside down
      ctx.translate(-width/2, -shaftHeight/2);
      
      // Always tile the shaft for consistent pixel art look
      const shaftAspectRatio = shaftImg.height / shaftImg.width;
      const scaledShaftHeight = Math.round(width * shaftAspectRatio);
      const tileCount = Math.ceil(shaftHeight / scaledShaftHeight);
      
      for (let i = 0; i < tileCount; i++) {
        const tileY = i * scaledShaftHeight;
        const remainingHeight = shaftHeight - tileY;
        const currentTileHeight = Math.min(scaledShaftHeight, remainingHeight);
        
        // Calculate source rectangle for partial tiles
        const sourceHeight = currentTileHeight === scaledShaftHeight ? 
          shaftImg.height : 
          Math.round((currentTileHeight / scaledShaftHeight) * shaftImg.height);
        
        ctx.drawImage(
          shaftImg, 
          0, 0, shaftImg.width, sourceHeight,  // source
          0, tileY, width, currentTileHeight   // destination
        );
      }
      ctx.restore();
    }
    
    // Draw the cap at the bottom of the top pipe (towards the gap, upside down)
    ctx.save();
    ctx.translate(x + width/2, y + height - capHeight/2);
    ctx.rotate(Math.PI); // Flip upside down
    ctx.translate(-width/2, -capHeight/2);
    ctx.drawImage(capImg, 0, 0, capImg.width, capImg.height, 0, 0, capWidth, capHeight);
    ctx.restore();
    
  } else {
    // Bottom pipe: cap at top (towards gap), shaft below it (normal orientation)
    
    // Draw the cap at the top of the bottom pipe (towards the gap)
    ctx.drawImage(capImg, 0, 0, capImg.width, capImg.height, x, y, capWidth, capHeight);
    
    // Draw the shaft below the cap (tiled)
    if (shaftHeight > 0) {
      const shaftY = y + capHeight;
      
      // Always tile the shaft for consistent pixel art look
      const shaftAspectRatio = shaftImg.height / shaftImg.width;
      const scaledShaftHeight = Math.round(width * shaftAspectRatio);
      const tileCount = Math.ceil(shaftHeight / scaledShaftHeight);
      
      for (let i = 0; i < tileCount; i++) {
        const tileY = shaftY + i * scaledShaftHeight;
        const remainingHeight = shaftHeight - i * scaledShaftHeight;
        const currentTileHeight = Math.min(scaledShaftHeight, remainingHeight);
        
        // Calculate source rectangle for partial tiles
        const sourceHeight = currentTileHeight === scaledShaftHeight ? 
          shaftImg.height : 
          Math.round((currentTileHeight / scaledShaftHeight) * shaftImg.height);
        
        ctx.drawImage(
          shaftImg, 
          0, 0, shaftImg.width, sourceHeight,  // source
          x, tileY, width, currentTileHeight   // destination
        );
      }
    }
  }
  
  ctx.restore();
}

/* ====== Helper: Get precise pipe collision bounds ====== */
function getPipeCollisionBounds(pipe) {
  // Minimal margin for seamless pipe collision detection
  const margin = 2; // reduced margin for more precise collision with seamless pipes
  
  // Calculate exact ground position for seamless pipe-ground connection
  const FIXED_GROUND_HEIGHT = 224;
  const groundStartY = V_HEIGHT - FIXED_GROUND_HEIGHT;
  
  return {
    // Top pipe bounds - seamless connection
    topPipe: {
      left: pipe.x + margin,
      right: pipe.x + PIPE_WIDTH - margin,
      top: 0,
      bottom: pipe.gapY - margin
    },
    // Bottom pipe bounds - extends exactly to ground level
    bottomPipe: {
      left: pipe.x + margin,
      right: pipe.x + PIPE_WIDTH - margin,
      top: pipe.gapY + PIPE_GAP + margin,
      bottom: groundStartY
    }
  };
}

/* ====== React Component ====== */
export default function GameCanvas() {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('ready'); // ready | playing | gameover
  const gameStateRef = useRef('ready'); // Keep ref for access in handlers
  const [, setScore] = useState(0); // score display handled by globalScore
  const [, setHighScore] = useState(() => {
    // Load existing high score from localStorage
    const saved = localStorage.getItem('best');
    const loadedScore = saved ? parseInt(saved, 10) : 0;
    console.log('🎮 Loading game - High score from localStorage:', loadedScore);
    return loadedScore;
  });

  // Image loading
  const plushpepeImg = useRef(null);
  const pipeShaftImg = useRef(null);
  const pipeCapImg = useRef(null);
  const groundImg = useRef(null);
  const grassImg = useRef(null);
  const cloudImg = useRef(null);
  const fartImg = useRef(null);
  const imagesLoaded = useRef(false);

  // Load images
  useEffect(() => {
    console.log('🔄 Starting to load sprites...');
    
    let loadedCount = 0;
    const totalImages = 7; // Loading PlushPepe, Pipe shaft, Pipe cap, Ground, Grass, Cloud, and Fart
    
    const checkAllLoaded = () => {
      loadedCount++;
      if (loadedCount === totalImages) {
        imagesLoaded.current = true;
        console.log('✅ All sprites loaded successfully');
      }
    };
    
    // Load PlushPepe sprite
    const plushpepeImage = new Image();
    plushpepeImage.onload = () => {
      console.log('✅ PlushPepe sprite loaded');
      plushpepeImg.current = plushpepeImage;
      checkAllLoaded();
    };
    plushpepeImage.onerror = (error) => {
      console.error('❌ Failed to load PlushPepe sprite');
    };
    plushpepeImage.src = plushpepeSprite;
    
    // Load Pipe shaft sprite
    const pipeShaftImage = new Image();
    pipeShaftImage.onload = () => {
      console.log('✅ Pipe shaft sprite loaded');
      pipeShaftImg.current = pipeShaftImage;
      checkAllLoaded();
    };
    pipeShaftImage.onerror = (error) => {
      console.error('❌ Failed to load Pipe shaft sprite');
    };
    pipeShaftImage.src = pipeShaftSprite;
    
    // Load Pipe cap sprite
    const pipeCapImage = new Image();
    pipeCapImage.onload = () => {
      console.log('✅ Pipe cap sprite loaded');
      pipeCapImg.current = pipeCapImage;
      checkAllLoaded();
    };
    pipeCapImage.onerror = (error) => {
      console.error('❌ Failed to load Pipe cap sprite');
    };
    pipeCapImage.src = pipeCapSprite;
    
    // Load Ground sprite
    const groundImage = new Image();
    groundImage.onload = () => {
      console.log('✅ Ground sprite loaded');
      groundImg.current = groundImage;
      
      // Use the ground sprite's natural height (should be 224px as specified)
      GROUND_HEIGHT = groundImage.height;
      
      console.log(`🏞️ Ground dimensions: ${groundImage.width}x${groundImage.height}, using natural height: ${GROUND_HEIGHT}`);
      console.log(`📏 Canvas dimensions: ${V_WIDTH}x${V_HEIGHT}, ground will be positioned at Y: ${V_HEIGHT - GROUND_HEIGHT}`);
      checkAllLoaded();
    };
    groundImage.onerror = (error) => {
      console.error('❌ Failed to load Ground sprite');
      checkAllLoaded();
    };
    groundImage.src = groundSprite;
    
    // Load Grass sprite
    const grassImage = new Image();
    grassImage.onload = () => {
      console.log('✅ Grass sprite loaded');
      grassImg.current = grassImage;
      console.log(`🌱 Grass dimensions: ${grassImage.width}x${grassImage.height}`);
      checkAllLoaded();
    };
    grassImage.onerror = (error) => {
      console.error('❌ Failed to load Grass sprite');
      checkAllLoaded();
    };
    grassImage.src = grassSprite;
    
    // Load Cloud sprite
    const cloudImage = new Image();
    cloudImage.onload = () => {
      console.log('✅ Cloud sprite loaded');
      cloudImg.current = cloudImage;
      console.log(`☁️ Cloud dimensions: ${cloudImage.width}x${cloudImage.height}`);
      checkAllLoaded();
    };
    cloudImage.onerror = (error) => {
      console.error('❌ Failed to load Cloud sprite');
      checkAllLoaded();
    };
    cloudImage.src = cloudSprite;
    
    // Load Fart sprite
    const fartImage = new Image();
    fartImage.onload = () => {
      console.log('✅ Fart sprite loaded');
      fartImg.current = fartImage;
      console.log(`💨 Fart dimensions: ${fartImage.width}x${fartImage.height}`);
      checkAllLoaded();
    };
    fartImage.onerror = (error) => {
      console.error('❌ Failed to load Fart sprite');
      checkAllLoaded();
    };
    fartImage.src = fartSprite;
  }, []);

  // Update ref when state changes
  gameStateRef.current = gameState;

  // Function to handle game over and save high score
  const handleGameOver = () => {
    console.log('💀 Game Over! Current score:', globalScore);
    
    // Test localStorage directly
    localStorage.setItem('test', 'working');
    console.log('🧪 localStorage test - saved "test", retrieved:', localStorage.getItem('test'));
    
    // Save high score immediately when game ends
    const currentScore = globalScore;
    setHighScore((prev) => {
      console.log('🏆 Checking high score - Current:', currentScore, 'Previous best:', prev);
      if (currentScore > prev) {
        localStorage.setItem('best', currentScore.toString());
        console.log('✅ New high score saved to localStorage:', currentScore);
        // Verify it was saved
        console.log('🔍 Verification - Retrieved from localStorage:', localStorage.getItem('best'));
        return currentScore;
      } else {
        console.log('📊 Score not higher than previous best');
        return prev;
      }
    });
    setGameState('gameover');
  };

  // PlushPepe physics - start at a safe position above ground
  const plushpepe = useRef({ y: V_HEIGHT / 2 - 100, vel: 0, rot: 0 }); // Safe position in upper half of screen
  
  // Debug: Log initial spawn position
  console.log(`🐸 PlushPepe spawn position: Y=${V_HEIGHT / 2 - 100} (Canvas: ${V_WIDTH}x${V_HEIGHT})`);
  // Pipes array (recycled) - start with constrained gaps for playability
  const firstGapY = randomGapY(); // First gap is unconstrained
  const pipes = useRef([
    { x: V_WIDTH + 50, gapY: firstGapY, scored: false }, // First gap
    { x: V_WIDTH + 50 + PIPE_INTERVAL, gapY: randomGapY(firstGapY), scored: false }, // Constrained to first
    { x: V_WIDTH + 50 + PIPE_INTERVAL * 2, gapY: randomGapY(randomGapY(firstGapY)), scored: false } // Constrained to second
  ]);
  
  // Clouds array for background parallax effect
  const clouds = useRef([]);
  const cloudSpawnTimer = useRef(0);
  const CLOUD_SPAWN_INTERVAL = 420; // frames between cloud spawns (7 seconds at 60fps)
  const CLOUD_SPAWN_VARIANCE = 0; // no variance - exactly every 7 seconds
  const CLOUD_SIZE = 64; // cloud display size (64x64 pixels)
  
  // Shared scroll system for perfect synchronization
  const sharedScrollPosition = useRef(0); // Master scroll position for all elements
  
  // Ground scrolling animation
  const groundOffset = useRef(0);
  
  // Fart effect state
  const fartTimer = useRef(0); // frames remaining for fart visibility
  const fartVisible = useRef(false);

  /* ========= Main Game Loop ========= */
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // scale canvas to fit container while preserving aspect ratio
    function resizeCanvas() {
      const scale = Math.min(window.innerWidth / V_WIDTH, window.innerHeight / V_HEIGHT);
      canvas.style.width = `${V_WIDTH * scale}px`;
      canvas.style.height = `${V_HEIGHT * scale}px`;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let lastTime = 0;
    // Optimize for Telegram Mini App performance
    let frameCount = 0;
    let lastFpsCheck = performance.now();
    
    function loop(timestamp) {
      const now = timestamp || performance.now();
      const delta = Math.min(now - lastTime, 32); // Cap at 32ms (30fps minimum)
      lastTime = now;
      
      // Use time-based movement for consistent speed across devices
      const timeStep = delta / 16.67; // Normalize to 60fps baseline
      
      update(timeStep);
      draw(ctx);
      
      // FPS monitoring for Telegram Mini App optimization
      frameCount++;
      if (now - lastFpsCheck >= 1000) {
        const currentFps = frameCount / ((now - lastFpsCheck) / 1000);
        if (currentFps < 45) {
          console.log(`⚠️ Low FPS detected: ${currentFps.toFixed(1)} - Telegram Mini App optimization active`);
        }
        frameCount = 0;
        lastFpsCheck = now;
      }
      
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);

    /* ===== Input Handlers ===== */
    function flap() {
      if (gameStateRef.current === 'ready') {
        setGameState('playing');
        plushpepe.current.vel = JUMP_VELOCITY; // Give initial jump when starting
        // Trigger fart effect
        fartTimer.current = FART_DURATION;
        fartVisible.current = true;
      } else if (gameStateRef.current === 'playing') {
        plushpepe.current.vel = JUMP_VELOCITY;
        // Trigger fart effect
        fartTimer.current = FART_DURATION;
        fartVisible.current = true;
      } else if (gameStateRef.current === 'gameover') {
        resetGame();
      }
    }

    window.addEventListener('pointerdown', flap);
    window.addEventListener('keydown', (e) => {
      if ([' ', 'ArrowUp'].includes(e.key)) flap();
    });

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('pointerdown', flap);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps  
  }, []); // Remove gameState dependency to prevent re-initialization

  /* ===== Update ===== */
  function update(step) {
    // Update fart effect timer regardless of game state
    if (fartVisible.current) {
      fartTimer.current -= step;
      if (fartTimer.current <= 0) {
        fartVisible.current = false;
        fartTimer.current = 0;
      }
    }
    
    if (gameStateRef.current !== 'playing') return;

    // Shared scroll system - update master scroll position
    sharedScrollPosition.current += SCROLL_SPEED * step;

    // PlushPepe physics
    plushpepe.current.vel += GRAVITY * step;
    if (plushpepe.current.vel > MAX_FALL_SPEED) plushpepe.current.vel = MAX_FALL_SPEED;
    plushpepe.current.y += plushpepe.current.vel * step;

    // PlushPepe rotation for aesthetics
    plushpepe.current.rot = Math.max(-30, Math.min(90, plushpepe.current.vel * 7));

    // Ground collision (using smaller hitbox for fair collision)
    const FIXED_GROUND_HEIGHT = 224;
    const actualGroundY = V_HEIGHT - FIXED_GROUND_HEIGHT;
    
    if (plushpepe.current.y + PLUSHPEPE_HITBOX >= actualGroundY) {
      handleGameOver();
      return; // Stop processing this frame
    }

    // Ceiling collision
    if (plushpepe.current.y < 0) {
      handleGameOver();
      return; // Stop processing this frame
    }

    // Ground scrolling - synchronized with shared scroll position
    // Calculate ground tile dimensions for precise looping
    let effectiveTileWidth = V_WIDTH; // fallback
    if (imagesLoaded.current && groundImg.current) {
      const sourceWidth = groundImg.current.width;
      const sourceHeight = groundImg.current.height;
      const scaledWidth = Math.floor((sourceWidth / sourceHeight) * 224);
      const TILE_OVERLAP = 2;
      effectiveTileWidth = scaledWidth - TILE_OVERLAP;
    }
    
    // Use shared scroll position with precise modulo for seamless looping
    // Round to prevent floating-point drift and ensure pixel-perfect alignment
    const preciseScrollPosition = Math.round(sharedScrollPosition.current * 100) / 100; // Round to 2 decimal places
    groundOffset.current = -(preciseScrollPosition % effectiveTileWidth);

    // Cloud spawning and updates
    cloudSpawnTimer.current += step;
    const nextSpawnTime = CLOUD_SPAWN_INTERVAL + (Math.random() * CLOUD_SPAWN_VARIANCE - CLOUD_SPAWN_VARIANCE/2);
    
    if (cloudSpawnTimer.current >= nextSpawnTime) {
      // Spawn a new cloud at a random position in upper half, at least 100px above ground
      const FIXED_GROUND_HEIGHT = 224;
      const groundLevel = V_HEIGHT - FIXED_GROUND_HEIGHT; // Y=800
      const maxCloudY = groundLevel - 100 - CLOUD_SIZE; // At least 100px above ground
      const cloudY = Math.random() * (maxCloudY - 50) + 50; // From Y=50 to maxCloudY
      
      clouds.current.push({
        x: V_WIDTH + 100, // Start off-screen to the right
        y: cloudY,
        speed: CLOUD_SPEED + (Math.random() * 0.4 - 0.2) // Slight speed variation
      });
      cloudSpawnTimer.current = 0;
    }
    
    // Update existing clouds
    clouds.current.forEach((cloud, index) => {
      cloud.x -= cloud.speed * step;
    });
    
    // Remove clouds that have moved off-screen
    clouds.current = clouds.current.filter(cloud => cloud.x > -200);

    // Pipe updates - synchronized with shared scroll position
    pipes.current.forEach((pipe, index) => {
      // Update pipe position using shared scroll speed (already applied above)
      pipe.x -= SCROLL_SPEED * step;
      
      // Score - check if plushpepe has passed through pipe
      if (!pipe.scored && pipe.x < PLUSHPEPE_X - PLUSHPEPE_HITBOX/2) {
        pipe.scored = true;
        globalScore = globalScore + 1;
        setScore(globalScore);
      }
      
      // Recycle pipe
      if (pipe.x + PIPE_WIDTH < 0) {
        pipe.x += PIPE_INTERVAL * pipes.current.length;
        
        // Find the rightmost pipe to get its gap Y for constrained generation
        const rightmostPipe = pipes.current.reduce((rightmost, p) => 
          p.x > rightmost.x ? p : rightmost, pipes.current[0]);
        
        pipe.gapY = randomGapY(rightmostPipe.gapY); // Use constrained gap generation
        pipe.scored = false;
      }
    });

    // Collision with pipes (precise visual collision detection)
    pipes.current.forEach((pipe) => {
      // Center the hitbox on the visual sprite
      const hitboxOffsetX = (PLUSHPEPE_SIZE - PLUSHPEPE_HITBOX) / 2;
      const hitboxOffsetY = (PLUSHPEPE_SIZE - PLUSHPEPE_HITBOX) / 2;
      
      const plushpepeLeft = PLUSHPEPE_X + hitboxOffsetX;
      const plushpepeRight = PLUSHPEPE_X + hitboxOffsetX + PLUSHPEPE_HITBOX;
      const plushpepeTop = plushpepe.current.y + hitboxOffsetY;
      const plushpepeBottom = plushpepe.current.y + hitboxOffsetY + PLUSHPEPE_HITBOX;
      
      // Get precise pipe collision bounds
      const pipeBounds = getPipeCollisionBounds(pipe);
      
      // Check collision with top pipe
      const topPipeCollision = (
        plushpepeRight > pipeBounds.topPipe.left &&
        plushpepeLeft < pipeBounds.topPipe.right &&
        plushpepeBottom > pipeBounds.topPipe.top &&
        plushpepeTop < pipeBounds.topPipe.bottom
      );
      
      // Check collision with bottom pipe
      const bottomPipeCollision = (
        plushpepeRight > pipeBounds.bottomPipe.left &&
        plushpepeLeft < pipeBounds.bottomPipe.right &&
        plushpepeBottom > pipeBounds.bottomPipe.top &&
        plushpepeTop < pipeBounds.bottomPipe.bottom
      );
      
      if (topPipeCollision || bottomPipeCollision) {
        handleGameOver();
      }
    });
  }

  /* ===== Draw ===== */
  function draw(ctx) {
    // Performance optimization for Telegram Mini App
    ctx.save();
    
    // Clear with optimized method
    ctx.clearRect(0, 0, V_WIDTH, V_HEIGHT);
    
    // Set global rendering optimizations for Telegram webview
    ctx.imageSmoothingEnabled = false; // Disable for all draws - better performance
    
    // Background (placeholder sky already set in CSS)

    // RENDERING ORDER: Clouds → Ground → Grass → Pipes → Player

    // 1. CLOUDS - Background layer with parallax effect (optimized)
    if (imagesLoaded.current && cloudImg.current) {
      // Only draw visible clouds to improve performance
      clouds.current.forEach((cloud) => {
        // Cull off-screen clouds for better performance
        if (cloud.x + CLOUD_SIZE > 0 && cloud.x < V_WIDTH) {
          ctx.drawImage(
            cloudImg.current,
            0, 0, cloudImg.current.width, cloudImg.current.height, // source (full sprite)
            Math.round(cloud.x), Math.round(cloud.y), CLOUD_SIZE, CLOUD_SIZE // destination (rounded for performance)
          );
        }
      });
    }

    // 2. GROUND LAYER - Base dirt layer (optimized for Telegram)
    if (imagesLoaded.current && groundImg.current) {
      // Anchor ground to the very bottom edge of canvas
      const FIXED_GROUND_HEIGHT = 224;
      const groundY = V_HEIGHT - FIXED_GROUND_HEIGHT; // Ground starts at Y=800
      
      // Calculate tile dimensions with better precision for seamless scrolling
      const sourceWidth = groundImg.current.width;
      const sourceHeight = groundImg.current.height;
      
      // Use precise scaling to maintain exact pixel alignment
      const scaledWidth = Math.floor((sourceWidth / sourceHeight) * FIXED_GROUND_HEIGHT);
      const tilesNeeded = Math.ceil(V_WIDTH / scaledWidth) + 2; // Reduced safety margin for performance
      const TILE_OVERLAP = 2; // Overlap tiles by 2px to prevent gaps
      
      // Optimized single-pass ground rendering
      for (let i = 0; i < tilesNeeded; i++) {
        const tileX = Math.round(groundOffset.current + (i * (scaledWidth - TILE_OVERLAP)));
        ctx.drawImage(
          groundImg.current, 
          0, 0, sourceWidth, sourceHeight,    // source (full sprite)
          tileX, groundY, scaledWidth + TILE_OVERLAP, FIXED_GROUND_HEIGHT  // destination with overlap
        );
      }
    } else {
      // Fallback to placeholder rectangle while loading
      const FIXED_GROUND_HEIGHT = 224;
      ctx.fillStyle = '#ded895';
      ctx.fillRect(0, V_HEIGHT - FIXED_GROUND_HEIGHT, V_WIDTH, FIXED_GROUND_HEIGHT); // Perfect alignment
    }

    // 3. GRASS LAYER - Optimized for Telegram performance  
    if (imagesLoaded.current && grassImg.current) {
      // Position grass to sit flush on top of the existing dirt layer
      const FIXED_GROUND_HEIGHT = 224;
      const dirtTopY = V_HEIGHT - FIXED_GROUND_HEIGHT; // Y=800, top of dirt layer
      
      // Use grass sprite's natural dimensions
      const grassSourceWidth = grassImg.current.width;
      const grassSourceHeight = grassImg.current.height;
      
      // Calculate grass position - sit ON TOP of the dirt (not floating above)
      const grassY = dirtTopY; // Start grass right at the top edge of dirt
      
      // Calculate how many grass tiles we need across the width
      const tilesNeeded = Math.ceil(V_WIDTH / grassSourceWidth) + 1; // Reduced for performance
      
      for (let i = 0; i < tilesNeeded; i++) {
        const tileX = Math.round(groundOffset.current + (i * grassSourceWidth));
        ctx.drawImage(
          grassImg.current,
          0, 0, grassSourceWidth, grassSourceHeight,    // source (full sprite)
          tileX, grassY, grassSourceWidth, grassSourceHeight  // positioned at top of dirt
        );
      }
    }

    // 4. PIPES - Optimized rendering for Telegram performance
    if (imagesLoaded.current && pipeShaftImg.current && pipeCapImg.current) {
      pipes.current.forEach((p) => {
        // Only render visible pipes for better performance
        if (p.x + PIPE_WIDTH > 0 && p.x < V_WIDTH) {
          // Calculate pipe heights - bottom pipes connect to ground level
          const FIXED_GROUND_HEIGHT = 224;
          const actualGroundY = V_HEIGHT - FIXED_GROUND_HEIGHT; // Ground starts at Y=800
          
          const topPipeHeight = p.gapY;
          const bottomPipeHeight = Math.max(0, actualGroundY - (p.gapY + PIPE_GAP));
          
          // Draw top pipe (upside down) with rounded position
          drawPipeWithAssets(ctx, pipeShaftImg.current, pipeCapImg.current, Math.round(p.x), 0, PIPE_WIDTH, topPipeHeight, true);
          
          // Draw bottom pipe (normal orientation) - connects to ground level
          if (bottomPipeHeight > 0) {
            drawPipeWithAssets(ctx, pipeShaftImg.current, pipeCapImg.current, Math.round(p.x), p.gapY + PIPE_GAP, PIPE_WIDTH, bottomPipeHeight, false);
          }
        }
      });
    } else {
      // Fallback to placeholder rectangles while loading
      ctx.fillStyle = '#3cb043'; // green pipes
      pipes.current.forEach((p) => {
        const FIXED_GROUND_HEIGHT = 224;
        const groundStartY = V_HEIGHT - FIXED_GROUND_HEIGHT;
        
        // top pipe
        ctx.fillRect(p.x, 0, PIPE_WIDTH, p.gapY);
        // bottom pipe - extends exactly to ground level
        const bottomPipeHeight = groundStartY - (p.gapY + PIPE_GAP);
        if (bottomPipeHeight > 0) {
          ctx.fillRect(p.x, p.gapY + PIPE_GAP, PIPE_WIDTH, bottomPipeHeight);
        }
      });
    }

    // 5. FART EFFECT - Optimized for Telegram performance
    if (fartVisible.current && imagesLoaded.current && fartImg.current) {
      // Calculate opacity based on current timer
      const opacity = getFartOpacity(fartTimer.current);
      
      // Only render if opacity is greater than 0
      if (opacity > 0.05) { // Skip rendering for very low opacity to improve performance
        // Apply opacity/alpha efficiently
        ctx.globalAlpha = opacity;
        
        // Calculate fart size (80% of Pepe's size, maintaining aspect ratio)
        const fartBaseSize = PLUSHPEPE_SIZE * FART_SIZE_RATIO; // 80% of Pepe size
        const fartAspectRatio = fartImg.current.width / fartImg.current.height;
        
        let fartWidth, fartHeight;
        if (fartAspectRatio > 1) {
          // Landscape orientation - constrain by width
          fartWidth = fartBaseSize;
          fartHeight = fartBaseSize / fartAspectRatio;
        } else {
          // Portrait orientation - constrain by height
          fartHeight = fartBaseSize;
          fartWidth = fartBaseSize * fartAspectRatio;
        }
        
        // Calculate fart position relative to Pepe's bottom-left visible area
        // Position from Pepe's center, accounting for sprite centering
        const pepeLeft = PLUSHPEPE_X; // Pepe's left edge
        const pepeBottom = plushpepe.current.y + PLUSHPEPE_SIZE; // Pepe's bottom edge
        
        // Position fart at bottom-left of Pepe's visible area with rounded coordinates
        const fartX = Math.round(pepeLeft + FART_OFFSET_X); // Behind and to the left
        const fartY = Math.round(pepeBottom + FART_OFFSET_Y - fartHeight); // Bottom-aligned with Pepe
        
        // Draw fart effect behind Pepe with opacity
        ctx.drawImage(
          fartImg.current,
          0, 0, fartImg.current.width, fartImg.current.height, // source (full sprite)
          fartX, fartY, fartWidth, fartHeight // destination (scaled and positioned)
        );
        
        // Reset alpha for next operations
        ctx.globalAlpha = 1.0;
      }
    }

    // 6. PEPE PLAYER - High-resolution optimized rendering
    const shouldDrawSprite = imagesLoaded.current && plushpepeImg.current;
    
    if (shouldDrawSprite) {
      // Calculate rounded positions for pixel-perfect rendering
      const centerX = Math.round(PLUSHPEPE_X + PLUSHPEPE_SIZE/2);
      const centerY = Math.round(plushpepe.current.y + PLUSHPEPE_SIZE/2);
      
      ctx.save();
      ctx.translate(centerX, centerY); // center
      ctx.rotate((plushpepe.current.rot * Math.PI) / 180);
      
      // Enhanced rendering for high-resolution sprites
      // Temporarily enable smoothing for HD sprite scaling, then disable for pixel-perfect edges
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high'; // Use highest quality scaling for HD sprites
      
      // Draw the high-resolution PlushPepe sprite with optimized scaling
      ctx.drawImage(
        plushpepeImg.current, 
        0, 0, plushpepeImg.current.width, plushpepeImg.current.height, // source (full HD sprite)
        -PLUSHPEPE_SIZE/2, -PLUSHPEPE_SIZE/2, PLUSHPEPE_SIZE, PLUSHPEPE_SIZE // destination (scaled to game size)
      );
      
      // Restore pixel-perfect rendering for other elements
      ctx.imageSmoothingEnabled = false;
      ctx.restore();
    } else {
      // Fallback placeholder while loading
      const centerX = Math.round(PLUSHPEPE_X + PLUSHPEPE_SIZE/2);
      const centerY = Math.round(plushpepe.current.y + PLUSHPEPE_SIZE/2);
      
      ctx.save();
      ctx.translate(centerX, centerY); // center
      ctx.rotate((plushpepe.current.rot * Math.PI) / 180);
      ctx.fillStyle = '#ffca28';
      ctx.fillRect(-PLUSHPEPE_SIZE/2, -PLUSHPEPE_SIZE/2, PLUSHPEPE_SIZE, PLUSHPEPE_SIZE); // fallback
      ctx.restore();
    }

    // Debug: Show pipe gaps (uncomment to visualize)
    // pipes.current.forEach((p) => {
    //   ctx.strokeStyle = 'yellow';
    //   ctx.lineWidth = 3;
    //   ctx.strokeRect(p.x, p.gapY, PIPE_WIDTH, PIPE_GAP); // Show the gap area
    // });

    // Debug: Uncomment to visualize the hitbox if needed
    // const hitboxOffsetX = (PLUSHPEPE_SIZE - PLUSHPEPE_HITBOX) / 2;
    // const hitboxOffsetY = (PLUSHPEPE_SIZE - PLUSHPEPE_HITBOX) / 2;
    // ctx.strokeStyle = 'red';
    // ctx.lineWidth = 2;
    // ctx.strokeRect(PLUSHPEPE_X + hitboxOffsetX, plushpepe.current.y + hitboxOffsetY, PLUSHPEPE_HITBOX, PLUSHPEPE_HITBOX);

    // Clean game display - no debug lines

    // Score (use ref value for real-time display)
    ctx.fillStyle = '#fff';
    ctx.font = '64px monospace'; // scaled 2x
    ctx.textAlign = 'center';
    // Display current score
    ctx.fillText(globalScore, V_WIDTH / 2, 100); // scaled 2x

    // Temporary debug text for smooth patch verification
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '24px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('v2.2', 10, V_HEIGHT - 10); // Bottom-left build indicator
    ctx.textAlign = 'center'; // Reset text align

    // Ready / GameOver overlays
    if (gameStateRef.current === 'ready') {
      ctx.fillStyle = '#fff';
      ctx.font = '40px monospace'; // scaled 2x
      ctx.fillText('Tap to Start', V_WIDTH / 2, V_HEIGHT / 2);
    } else if (gameStateRef.current === 'gameover') {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);
      ctx.fillStyle = '#fff';
      ctx.font = '56px monospace'; // scaled 2x
      ctx.fillText('Game Over', V_WIDTH / 2, V_HEIGHT / 2 - 40); // scaled 2x
      ctx.font = '40px monospace'; // scaled 2x
      ctx.fillText(`Score: ${globalScore}`, V_WIDTH / 2, V_HEIGHT / 2 + 20); // scaled 2x
      // Get fresh high score from localStorage for display
      const currentBest = localStorage.getItem('best') || '0';
      ctx.fillText(`Best: ${currentBest}`, V_WIDTH / 2, V_HEIGHT / 2 + 68); // scaled 2x
      ctx.fillText('Tap to Restart', V_WIDTH / 2, V_HEIGHT / 2 + 128); // scaled 2x
    }
    
    // Restore initial canvas state for Telegram optimization
    ctx.restore();
  }

  /* ===== Reset ===== */
  function resetGame() {
    // Reset plushpepe to safe starting position above ground
    plushpepe.current = { y: V_HEIGHT / 2 - 100, vel: 0, rot: 0 }; // Safe position in upper half of screen
    
    // Reset pipes with constrained gaps for playability
    const resetFirstGapY = randomGapY(); // First gap is unconstrained
    const resetSecondGapY = randomGapY(resetFirstGapY); // Second constrained to first
    pipes.current = [
      { x: V_WIDTH + 50, gapY: resetFirstGapY, scored: false },
      { x: V_WIDTH + 50 + PIPE_INTERVAL, gapY: resetSecondGapY, scored: false },
      { x: V_WIDTH + 50 + PIPE_INTERVAL * 2, gapY: randomGapY(resetSecondGapY), scored: false }
    ];
    
    // Reset clouds
    clouds.current = [];
    cloudSpawnTimer.current = 0;
    
    // Reset shared scroll system and ground animation
    sharedScrollPosition.current = 0;
    groundOffset.current = 0;
    
    // Reset fart effect
    fartVisible.current = false;
    fartTimer.current = 0;
    
    // Reset score and state
    globalScore = 0;
    setScore(0);
    setGameState('ready');
  }

  return (
    <canvas
      ref={canvasRef}
      width={V_WIDTH}
      height={V_HEIGHT}
      aria-label="Flappy PlushPepe Canvas"
    />
  );
} 