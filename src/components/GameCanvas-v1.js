import React, { useRef, useEffect, useState } from 'react';
import '../styles/GameCanvas.css';

/* ====== Constants (tuned to original physics) ====== */
const V_WIDTH = 288;    // virtual canvas size (px)
const V_HEIGHT = 512;

// Global score variable for debugging
let globalScore = 0;

const GRAVITY = 0.2;    // px / frame^2 at 60 fps (easier)
const JUMP_VELOCITY = -4.5; // upward impulse (px / frame, gentler)
const MAX_FALL_SPEED = 6;   // terminal velocity downward (slower)

const PIPE_SPEED = 1.0; // horizontal px / frame (≈60 px/s, much slower)
const PIPE_INTERVAL = 200; // distance between pipes (more space)
const PIPE_GAP = 120;   // vertical gap size (bigger gap for easier play)

const BIRD_X = 80;      // fixed horizontal bird position (moved right for scoring)
const PIPE_WIDTH = 52;  // sprite width (placeholder)

// Game constants: BIRD_X=80, PIPE_WIDTH=52
const GROUND_HEIGHT = 112; // ground sprite height

/* ====== Helper: random Y for pipe gap ====== */
function randomGapY() {
  const minGapTop = 60;   // min distance from top (reduced for more variation)
  const maxGapTop = V_HEIGHT - GROUND_HEIGHT - PIPE_GAP - 60; // 512 - 112 - 120 - 60 = 220
  return Math.floor(Math.random() * (maxGapTop - minGapTop + 1)) + minGapTop;
}

/* ====== React Component ====== */
export default function GameCanvas() {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('ready'); // ready | playing | gameover
  const gameStateRef = useRef('ready'); // Keep ref for access in handlers
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    // Load existing high score from localStorage
    const saved = localStorage.getItem('best');
    const loadedScore = saved ? parseInt(saved, 10) : 0;
    console.log('🎮 Loading game - High score from localStorage:', loadedScore);
    return loadedScore;
  });

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

  // Bird physics - start at a safe position
  const bird = useRef({ y: 200, vel: 0, rot: 0 }); // Fixed position around middle-ish
  // Pipes array (recycled) - start with random gaps for variety
  const pipes = useRef([
    { x: V_WIDTH + 50, gapY: randomGapY(), scored: false }, // Random gap
    { x: V_WIDTH + 50 + PIPE_INTERVAL, gapY: randomGapY(), scored: false }, // Random gap
    { x: V_WIDTH + 50 + PIPE_INTERVAL * 2, gapY: randomGapY(), scored: false } // Random gap
  ]);

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
    function loop(timestamp) {
      const delta = (timestamp - lastTime) || 16; // ms
      lastTime = timestamp;
      update(delta / (1000 / 60)); // convert to ~frames
      draw(ctx);
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);

    /* ===== Input Handlers ===== */
    function flap() {
      if (gameStateRef.current === 'ready') {
        setGameState('playing');
        bird.current.vel = JUMP_VELOCITY; // Give initial jump when starting
      } else if (gameStateRef.current === 'playing') {
        bird.current.vel = JUMP_VELOCITY;
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
    if (gameStateRef.current !== 'playing') return;

    // Simplified update function

    // Bird physics
    bird.current.vel += GRAVITY * step;
    if (bird.current.vel > MAX_FALL_SPEED) bird.current.vel = MAX_FALL_SPEED;
    bird.current.y += bird.current.vel * step;

    // Bird rotation for aesthetics
    bird.current.rot = Math.max(-30, Math.min(90, bird.current.vel * 7));

    // Ground collision (updated for smaller bird)
    if (bird.current.y + 20 >= V_HEIGHT - GROUND_HEIGHT) {
      handleGameOver();
      return; // Stop processing this frame
    }

    // Ceiling collision
    if (bird.current.y < 0) {
      handleGameOver();
      return; // Stop processing this frame
    }

    // Pipe updates
    pipes.current.forEach((pipe, index) => {
      pipe.x -= PIPE_SPEED * step;
      
      // Score - check if bird has passed through pipe
      if (!pipe.scored && pipe.x < BIRD_X - 30) {
        pipe.scored = true;
        globalScore = globalScore + 1;
        setScore(globalScore);
      }
      
      // Recycle pipe
      if (pipe.x + PIPE_WIDTH < 0) {
        pipe.x += PIPE_INTERVAL * pipes.current.length;
        pipe.gapY = randomGapY(); // Only use random gaps when recycling
        pipe.scored = false;
      }
    });

    // Collision with pipes (updated for smaller bird)
    pipes.current.forEach((pipe) => {
      const inXRange = BIRD_X + 28 > pipe.x && BIRD_X < pipe.x + PIPE_WIDTH;
      if (inXRange) {
        const inGap = bird.current.y > pipe.gapY && bird.current.y + 20 < pipe.gapY + PIPE_GAP;
        if (!inGap) {
          handleGameOver();
        }
      }
    });
  }

  /* ===== Draw ===== */
  function draw(ctx) {
    // Clear
    ctx.clearRect(0, 0, V_WIDTH, V_HEIGHT);

    // Background (placeholder sky already set in CSS)

    // Pipes
    ctx.fillStyle = '#3cb043'; // green pipes
    pipes.current.forEach((p) => {
      // top pipe
      ctx.fillRect(p.x, 0, PIPE_WIDTH, p.gapY);
      // bottom pipe
      ctx.fillRect(p.x, p.gapY + PIPE_GAP, PIPE_WIDTH, V_HEIGHT - GROUND_HEIGHT - (p.gapY + PIPE_GAP));
      
      // No debug visuals needed
    });
    ctx.fillStyle = '#3cb043'; // reset color

    // Ground
    ctx.fillStyle = '#ded895';
    ctx.fillRect(0, V_HEIGHT - GROUND_HEIGHT, V_WIDTH, GROUND_HEIGHT);

    // Bird (placeholder square + rotation) - 33% smaller
    ctx.save();
    ctx.translate(BIRD_X + 14, bird.current.y + 10); // center
    ctx.rotate((bird.current.rot * Math.PI) / 180);
    ctx.fillStyle = '#ffca28';
    ctx.fillRect(-14, -10, 28, 20); // 33% smaller (34x24 → 28x20)
    ctx.restore();

    // Clean game display - no debug lines

    // Score (use ref value for real-time display)
    ctx.fillStyle = '#fff';
    ctx.font = '32px monospace';
    ctx.textAlign = 'center';
    // Display current score
    ctx.fillText(globalScore, V_WIDTH / 2, 50);

    // Ready / GameOver overlays
    if (gameStateRef.current === 'ready') {
      ctx.fillStyle = '#fff';
      ctx.font = '20px monospace';
      ctx.fillText('Tap to Start', V_WIDTH / 2, V_HEIGHT / 2);
    } else if (gameStateRef.current === 'gameover') {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);
      ctx.fillStyle = '#fff';
      ctx.font = '28px monospace';
      ctx.fillText('Game Over', V_WIDTH / 2, V_HEIGHT / 2 - 20);
      ctx.font = '20px monospace';
      ctx.fillText(`Score: ${globalScore}`, V_WIDTH / 2, V_HEIGHT / 2 + 10);
      // Get fresh high score from localStorage for display
      const currentBest = localStorage.getItem('best') || '0';
      ctx.fillText(`Best: ${currentBest}`, V_WIDTH / 2, V_HEIGHT / 2 + 34);
      ctx.fillText('Tap to Restart', V_WIDTH / 2, V_HEIGHT / 2 + 64);
    }
  }

  /* ===== Reset ===== */
  function resetGame() {
    // Reset bird to safe starting position
    bird.current = { y: 200, vel: 0, rot: 0 };
    
    // Reset pipes with random gaps for variety
    pipes.current = pipes.current.map((_, idx) => ({
      x: V_WIDTH + 50 + PIPE_INTERVAL * idx,
      gapY: randomGapY(), // Use random gaps from the start
      scored: false,
    }));
    
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
      aria-label="Flappy Bird Canvas"
    />
  );
} 