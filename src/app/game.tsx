import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  Platform,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Game World Constants
const GAME_WIDTH = 800;
const GAME_HEIGHT = 450;
const GRAVITY = 0.55;
const PLAYER_SPEED = 4.2;
const JUMP_FORCE = -11.5;
const DASH_SPEED = 9.0;
const MAX_JUMPS = 2;

// Audio Synthesizer for Web / Fallback
const playSound = (type: 'jump' | 'coin' | 'stomp' | 'hit' | 'win' | 'spring') => {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'jump') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.15);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'coin') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880, now + 0.08); // A5
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'stomp') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.12);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === 'hit') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(40, now + 0.2);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'spring') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.25);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'win') {
      const notes = [261.63, 329.63, 392.0, 523.25];
      notes.forEach((freq, index) => {
        const noteOsc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        noteOsc.connect(noteGain);
        noteGain.connect(ctx.destination);
        noteOsc.type = 'triangle';
        noteOsc.frequency.setValueAtTime(freq, now + index * 0.1);
        noteGain.gain.setValueAtTime(0.2, now + index * 0.1);
        noteGain.gain.exponentialRampToValueAtTime(0.01, now + index * 0.1 + 0.2);
        noteOsc.start(now + index * 0.1);
        noteOsc.stop(now + index * 0.1 + 0.2);
      });
    }
  } catch (e) {
    // Audio context play error handled gracefully
  }
};

// Level definitions
interface PlatformDef {
  x: number;
  y: number;
  w: number;
  h: number;
  type?: 'normal' | 'moving' | 'spring' | 'hazard';
  moveRange?: { minX?: number; maxX?: number; minY?: number; maxY?: number };
  speed?: number;
}

interface CollectibleDef {
  id: string;
  x: number;
  y: number;
  type: 'coin' | 'star' | 'heart';
}

interface EnemyDef {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minX: number;
  maxX: number;
  speed: number;
}

interface LevelData {
  id: number;
  title: string;
  subtitle: string;
  theme: string;
  bgGradient: string;
  platforms: PlatformDef[];
  collectibles: CollectibleDef[];
  enemies: EnemyDef[];
  portal: { x: number; y: number; w: number; h: number };
  playerStart: { x: number; y: number };
}

const LEVELS: LevelData[] = [
  {
    id: 1,
    title: 'Level 1: Green Meadows',
    subtitle: 'Learn the controls! Collect coins and jump over hazards.',
    theme: '#059669',
    bgGradient: '#ECFDF5',
    playerStart: { x: 30, y: 320 },
    portal: { x: 730, y: 100, w: 36, h: 50 },
    platforms: [
      { x: 0, y: 390, w: 800, h: 60, type: 'normal' }, // Ground floor
      { x: 120, y: 310, w: 100, h: 16, type: 'normal' },
      { x: 260, y: 250, w: 110, h: 16, type: 'normal' },
      { x: 420, y: 210, w: 90, h: 16, type: 'normal' },
      { x: 560, y: 160, w: 120, h: 16, type: 'normal' },
      { x: 710, y: 150, w: 80, h: 16, type: 'normal' },
      // Hazards
      { x: 320, y: 374, w: 50, h: 16, type: 'hazard' },
    ],
    collectibles: [
      { id: 'c1', x: 150, y: 270, type: 'coin' },
      { id: 'c2', x: 290, y: 210, type: 'coin' },
      { id: 'c3', x: 450, y: 170, type: 'coin' },
      { id: 'c4', x: 600, y: 120, type: 'star' },
      { id: 'c5', x: 500, y: 350, type: 'heart' },
    ],
    enemies: [
      { id: 'e1', x: 450, y: 362, w: 26, h: 26, minX: 400, maxX: 600, speed: 1.5 },
    ],
  },
  {
    id: 2,
    title: 'Level 2: Cloud Peaks',
    subtitle: 'Moving platforms and high jumps! Watch your step!',
    theme: '#2563EB',
    bgGradient: '#EFF6FF',
    playerStart: { x: 30, y: 320 },
    portal: { x: 730, y: 80, w: 36, h: 50 },
    platforms: [
      { x: 0, y: 390, w: 200, h: 60, type: 'normal' },
      { x: 250, y: 330, w: 90, h: 16, type: 'spring' }, // Launch spring
      {
        x: 380,
        y: 270,
        w: 90,
        h: 16,
        type: 'moving',
        moveRange: { minX: 350, maxX: 520 },
        speed: 2,
      },
      { x: 580, y: 200, w: 100, h: 16, type: 'normal' },
      { x: 430, y: 140, w: 90, h: 16, type: 'normal' },
      { x: 700, y: 130, w: 90, h: 16, type: 'normal' },
      { x: 200, y: 374, w: 600, h: 16, type: 'hazard' }, // Spikes pit
    ],
    collectibles: [
      { id: 'c1', x: 280, y: 280, type: 'coin' },
      { id: 'c2', x: 410, y: 220, type: 'coin' },
      { id: 'c3', x: 620, y: 160, type: 'star' },
      { id: 'c4', x: 460, y: 90, type: 'star' },
      { id: 'c5', x: 740, y: 80, type: 'heart' },
    ],
    enemies: [
      { id: 'e1', x: 600, y: 174, w: 26, h: 26, minX: 580, maxX: 660, speed: 1.8 },
    ],
  },
  {
    id: 3,
    title: 'Level 3: Lava Castle',
    subtitle: 'The ultimate challenge! Avoid the deadly fiery pit!',
    theme: '#DC2626',
    bgGradient: '#FEF2F2',
    playerStart: { x: 30, y: 320 },
    portal: { x: 740, y: 70, w: 36, h: 50 },
    platforms: [
      { x: 0, y: 390, w: 150, h: 60, type: 'normal' },
      { x: 180, y: 320, w: 80, h: 16, type: 'normal' },
      {
        x: 290,
        y: 260,
        w: 80,
        h: 16,
        type: 'moving',
        moveRange: { minX: 280, maxX: 420 },
        speed: 2.5,
      },
      { x: 480, y: 210, w: 70, h: 16, type: 'spring' },
      { x: 590, y: 140, w: 90, h: 16, type: 'normal' },
      { x: 720, y: 120, w: 70, h: 16, type: 'normal' },
      { x: 150, y: 410, w: 650, h: 40, type: 'hazard' }, // Lava
    ],
    collectibles: [
      { id: 'c1', x: 210, y: 280, type: 'star' },
      { id: 'c2', x: 340, y: 210, type: 'coin' },
      { id: 'c3', x: 510, y: 160, type: 'star' },
      { id: 'c4', x: 630, y: 90, type: 'heart' },
    ],
    enemies: [
      { id: 'e1', x: 600, y: 114, w: 26, h: 26, minX: 590, maxX: 660, speed: 2.2 },
    ],
  },
];

export default function PlatformerGameScreen() {
  const router = useRouter();

  // Game state variables
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const currentLevel = LEVELS[currentLevelIndex];

  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'paused' | 'gameover' | 'victory'>('start');

  // Input states (touch & keyboard)
  const keys = useRef<{ left: boolean; right: boolean; jump: boolean; dash: boolean }>({
    left: false,
    right: false,
    jump: false,
    dash: false,
  });

  // Dynamic entity positions
  const player = useRef({
    x: 30,
    y: 320,
    vx: 0,
    vy: 0,
    w: 24,
    h: 32,
    isGrounded: false,
    jumpsLeft: MAX_JUMPS,
    facing: 'right' as 'left' | 'right',
    isDashing: false,
    dashCooldown: 0,
    invulnerableFrames: 0,
  });

  const platformsState = useRef<(PlatformDef & { currX?: number; dir?: number })[]>([]);
  const collectiblesState = useRef<CollectibleDef[]>([]);
  const enemiesState = useRef<(EnemyDef & { currX?: number; dir?: number; alive?: boolean })[]>([]);

  // UI state force update tick
  const [, setFrameCount] = useState(0);

  // Load High Score
  useEffect(() => {
    AsyncStorage.getItem('PLATFORMER_HIGH_SCORE').then((val) => {
      if (val) setHighScore(parseInt(val, 10));
    });
  }, []);

  // Keyboard controls listener (Web / Desktop)
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) keys.current.left = true;
      if (['ArrowRight', 'KeyD'].includes(e.code)) keys.current.right = true;
      if (['ArrowUp', 'KeyW', 'Space'].includes(e.code)) {
        if (!keys.current.jump) {
          triggerJump();
        }
        keys.current.jump = true;
      }
      if (['ShiftLeft', 'ShiftRight', 'KeyK'].includes(e.code)) {
        if (!keys.current.dash) {
          triggerDash();
        }
        keys.current.dash = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) keys.current.left = false;
      if (['ArrowRight', 'KeyD'].includes(e.code)) keys.current.right = false;
      if (['ArrowUp', 'KeyW', 'Space'].includes(e.code)) keys.current.jump = false;
      if (['ShiftLeft', 'ShiftRight', 'KeyK'].includes(e.code)) keys.current.dash = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState]);

  // Reset/Initialize Level
  const initLevel = useCallback((lvlIndex: number) => {
    const lvl = LEVELS[lvlIndex];
    player.current = {
      x: lvl.playerStart.x,
      y: lvl.playerStart.y,
      vx: 0,
      vy: 0,
      w: 24,
      h: 32,
      isGrounded: false,
      jumpsLeft: MAX_JUMPS,
      facing: 'right',
      isDashing: false,
      dashCooldown: 0,
      invulnerableFrames: 0,
    };

    platformsState.current = lvl.platforms.map((p) => ({
      ...p,
      currX: p.x,
      dir: 1,
    }));

    collectiblesState.current = [...lvl.collectibles];

    enemiesState.current = lvl.enemies.map((e) => ({
      ...e,
      currX: e.x,
      dir: 1,
      alive: true,
    }));

    setTimeRemaining(60);
  }, []);

  // Jump action
  const triggerJump = () => {
    const p = player.current;
    if (p.jumpsLeft > 0) {
      p.vy = JUMP_FORCE;
      p.isGrounded = false;
      p.jumpsLeft -= 1;
      playSound('jump');
    }
  };

  // Dash action
  const triggerDash = () => {
    const p = player.current;
    if (p.dashCooldown <= 0) {
      p.isDashing = true;
      p.dashCooldown = 30; // 30 frames cooldown
      p.vx = (p.facing === 'right' ? 1 : -1) * DASH_SPEED;
    }
  };

  // Start / Restart game
  const startGame = (lvlIndex = 0) => {
    setCurrentLevelIndex(lvlIndex);
    setScore(0);
    setLives(3);
    initLevel(lvlIndex);
    setGameState('playing');
  };

  // Main Game Loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    let animId: number;
    let timerInterval: any;

    // Timer logic
    timerInterval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handlePlayerDeath();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    const loop = () => {
      const p = player.current;

      // 1. Cooldowns & Timers
      if (p.dashCooldown > 0) p.dashCooldown -= 1;
      if (p.invulnerableFrames > 0) p.invulnerableFrames -= 1;

      // 2. Horizontal Movement
      if (keys.current.left) {
        p.vx = -PLAYER_SPEED;
        p.facing = 'left';
      } else if (keys.current.right) {
        p.vx = PLAYER_SPEED;
        p.facing = 'right';
      } else if (!p.isDashing) {
        p.vx *= 0.7; // friction
      }

      if (p.isDashing) {
        p.vx *= 0.92;
        if (Math.abs(p.vx) < PLAYER_SPEED) p.isDashing = false;
      }

      // 3. Apply Gravity
      p.vy += GRAVITY;

      // Apply displacements
      p.x += p.vx;
      p.y += p.vy;

      // Bound player within world x
      if (p.x < 0) p.x = 0;
      if (p.x + p.w > GAME_WIDTH) p.x = GAME_WIDTH - p.w;

      // 4. Update Moving Platforms
      platformsState.current.forEach((plat) => {
        if (plat.type === 'moving' && plat.moveRange) {
          const min = plat.moveRange.minX ?? plat.x;
          const max = plat.moveRange.maxX ?? plat.x + 100;
          const spd = plat.speed ?? 2;
          plat.currX = (plat.currX ?? plat.x) + (plat.dir ?? 1) * spd;

          if (plat.currX > max) {
            plat.currX = max;
            plat.dir = -1;
          } else if (plat.currX < min) {
            plat.currX = min;
            plat.dir = 1;
          }
        }
      });

      // 5. Update Enemies
      enemiesState.current.forEach((enemy) => {
        if (!enemy.alive) return;
        enemy.currX = (enemy.currX ?? enemy.x) + (enemy.dir ?? 1) * enemy.speed;
        if (enemy.currX > enemy.maxX) {
          enemy.currX = enemy.maxX;
          enemy.dir = -1;
        } else if (enemy.currX < enemy.minX) {
          enemy.currX = enemy.minX;
          enemy.dir = 1;
        }

        // Enemy collision check
        const ex = enemy.currX;
        const ey = enemy.y;
        if (
          p.x < ex + enemy.w &&
          p.x + p.w > ex &&
          p.y < ey + enemy.h &&
          p.y + p.h > ey
        ) {
          // Player jumping down on top of enemy
          if (p.vy > 0 && p.y + p.h - p.vy <= ey + 10) {
            enemy.alive = false;
            p.vy = -8; // Bounce!
            setScore((s) => s + 200);
            playSound('stomp');
          } else if (p.invulnerableFrames <= 0) {
            // Player got damaged
            handlePlayerHit();
          }
        }
      });

      // 6. Platform Collisions
      p.isGrounded = false;
      platformsState.current.forEach((plat) => {
        const platX = plat.currX ?? plat.x;
        const platY = plat.y;

        // Check AABB Overlap
        if (
          p.x < platX + plat.w &&
          p.x + p.w > platX &&
          p.y < platY + plat.h &&
          p.y + p.h > platY
        ) {
          if (plat.type === 'hazard') {
            if (p.invulnerableFrames <= 0) {
              handlePlayerDeath();
            }
          } else if (plat.type === 'spring') {
            p.vy = -16; // Super Spring Jump!
            p.isGrounded = false;
            p.jumpsLeft = MAX_JUMPS;
            playSound('spring');
          } else {
            // Normal / Moving platform top landing
            const prevPlayerBottom = p.y - p.vy + p.h;
            if (prevPlayerBottom <= platY + 8 && p.vy >= 0) {
              p.y = platY - p.h;
              p.vy = 0;
              p.isGrounded = true;
              p.jumpsLeft = MAX_JUMPS;

              // Move player with moving platform
              if (plat.type === 'moving') {
                p.x += (plat.dir ?? 1) * (plat.speed ?? 2);
              }
            }
          }
        }
      });

      // 7. Collectibles Collisions
      collectiblesState.current = collectiblesState.current.filter((item) => {
        if (
          p.x < item.x + 20 &&
          p.x + p.w > item.x &&
          p.y < item.y + 20 &&
          p.y + p.h > item.y
        ) {
          if (item.type === 'coin') {
            setScore((s) => s + 100);
            playSound('coin');
          } else if (item.type === 'star') {
            setScore((s) => s + 500);
            playSound('coin');
          } else if (item.type === 'heart') {
            setLives((l) => Math.min(l + 1, 5));
            playSound('coin');
          }
          return false; // Remove item
        }
        return true;
      });

      // 8. Portal / Level Finish Collision
      const portal = currentLevel.portal;
      if (
        p.x < portal.x + portal.w &&
        p.x + p.w > portal.x &&
        p.y < portal.y + portal.h &&
        p.y + p.h > portal.y
      ) {
        handleLevelComplete();
        return;
      }

      // Fall off bottom of screen
      if (p.y > GAME_HEIGHT + 50) {
        handlePlayerDeath();
      }

      setFrameCount((f) => f + 1);
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
      clearInterval(timerInterval);
    };
  }, [gameState, currentLevelIndex]);

  // Handle player taking a hit
  const handlePlayerHit = () => {
    playSound('hit');
    const p = player.current;
    p.invulnerableFrames = 45; // Invulnerable for ~0.75s
    p.vy = -6;
    p.vx = p.facing === 'right' ? -6 : 6;

    setLives((l) => {
      const nextLives = l - 1;
      if (nextLives <= 0) {
        setGameState('gameover');
      }
      return nextLives;
    });
  };

  // Handle player death/respawn
  const handlePlayerDeath = () => {
    playSound('hit');
    setLives((l) => {
      const nextLives = l - 1;
      if (nextLives <= 0) {
        setGameState('gameover');
      } else {
        // Respawn at level start
        initLevel(currentLevelIndex);
      }
      return nextLives;
    });
  };

  // Handle level completion
  const handleLevelComplete = () => {
    playSound('win');
    setGameState('victory');

    // Update high score
    setScore((s) => {
      const finalScore = s + timeRemaining * 10;
      if (finalScore > highScore) {
        setHighScore(finalScore);
        AsyncStorage.setItem('PLATFORMER_HIGH_SCORE', finalScore.toString());
      }
      return finalScore;
    });
  };

  // Scale ratio for responsive rendering inside container
  const scale = Math.min(SCREEN_WIDTH / GAME_WIDTH, (SCREEN_HEIGHT - 120) / GAME_HEIGHT);

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header Controls */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          <Text style={styles.backBtnText}>Exit Game</Text>
        </TouchableOpacity>

        <View style={styles.headerStats}>
          <View style={styles.statBadge}>
            <Ionicons name="star" size={16} color="#F59E0B" />
            <Text style={styles.statText}>{score}</Text>
          </View>

          <View style={styles.statBadge}>
            <Ionicons name="trophy" size={16} color="#EC4899" />
            <Text style={styles.statText}>High: {highScore}</Text>
          </View>

          <View style={styles.statBadge}>
            <Ionicons name="time" size={16} color="#3B82F6" />
            <Text style={styles.statText}>{timeRemaining}s</Text>
          </View>

          <View style={styles.livesRow}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Ionicons
                key={i}
                name={i < lives ? 'heart' : 'heart-outline'}
                size={18}
                color={i < lives ? '#EF4444' : '#64748B'}
              />
            ))}
          </View>
        </View>

        {gameState === 'playing' && (
          <TouchableOpacity
            style={styles.pauseBtn}
            onPress={() => setGameState('paused')}
          >
            <Ionicons name="pause" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Main Platformer Game Canvas / World View */}
      <View style={[styles.gameViewport, { backgroundColor: currentLevel.bgGradient }]}>
        <View
          style={[
            styles.gameStage,
            {
              width: GAME_WIDTH,
              height: GAME_HEIGHT,
              transform: [{ scale }],
            },
          ]}
        >
          {/* Level Header Info Overlay */}
          <View style={styles.levelTitleOverlay}>
            <Text style={[styles.levelTitleText, { color: currentLevel.theme }]}>
              {currentLevel.title}
            </Text>
          </View>

          {/* Platforms */}
          {platformsState.current.map((p, idx) => {
            const px = p.currX ?? p.x;
            const isHazard = p.type === 'hazard';
            const isSpring = p.type === 'spring';
            const isMoving = p.type === 'moving';

            return (
              <View
                key={idx}
                style={[
                  styles.platform,
                  {
                    left: px,
                    top: p.y,
                    width: p.w,
                    height: p.h,
                    backgroundColor: isHazard
                      ? '#DC2626'
                      : isSpring
                      ? '#8B5CF6'
                      : isMoving
                      ? '#2563EB'
                      : '#10B981',
                    borderColor: isHazard
                      ? '#991B1B'
                      : isSpring
                      ? '#6D28D9'
                      : isMoving
                      ? '#1D4ED8'
                      : '#047857',
                  },
                ]}
              >
                {isHazard && (
                  <Text style={styles.spikePattern}>▲▲▲▲▲▲▲▲▲▲▲▲</Text>
                )}
                {isSpring && (
                  <View style={styles.springCore}>
                    <Ionicons name="arrow-up" size={12} color="#FFFFFF" />
                  </View>
                )}
              </View>
            );
          })}

          {/* Collectibles */}
          {collectiblesState.current.map((item) => (
            <View
              key={item.id}
              style={[
                styles.collectible,
                {
                  left: item.x,
                  top: item.y,
                },
              ]}
            >
              {item.type === 'coin' && (
                <View style={styles.coinBadge}>
                  <Ionicons name="disc" size={18} color="#F59E0B" />
                </View>
              )}
              {item.type === 'star' && (
                <View style={styles.starBadge}>
                  <Ionicons name="star" size={18} color="#EAB308" />
                </View>
              )}
              {item.type === 'heart' && (
                <View style={styles.heartBadge}>
                  <Ionicons name="heart" size={18} color="#EF4444" />
                </View>
              )}
            </View>
          ))}

          {/* Enemies */}
          {enemiesState.current.map((enemy) => {
            if (!enemy.alive) return null;
            const ex = enemy.currX ?? enemy.x;
            return (
              <View
                key={enemy.id}
                style={[
                  styles.enemy,
                  {
                    left: ex,
                    top: enemy.y,
                    width: enemy.w,
                    height: enemy.h,
                  },
                ]}
              >
                <View style={styles.enemyEyes}>
                  <View style={styles.eyeDot} />
                  <View style={styles.eyeDot} />
                </View>
              </View>
            );
          })}

          {/* Goal Portal Flag */}
          <View
            style={[
              styles.portal,
              {
                left: currentLevel.portal.x,
                top: currentLevel.portal.y,
                width: currentLevel.portal.w,
                height: currentLevel.portal.h,
              },
            ]}
          >
            <Ionicons name="flag" size={28} color="#10B981" />
            <View style={styles.portalGlow} />
          </View>

          {/* Player Character */}
          {gameState === 'playing' && (
            <View
              style={[
                styles.player,
                {
                  left: player.current.x,
                  top: player.current.y,
                  width: player.current.w,
                  height: player.current.h,
                  opacity:
                    player.current.invulnerableFrames % 4 < 2 &&
                    player.current.invulnerableFrames > 0
                      ? 0.3
                      : 1.0,
                },
              ]}
            >
              {/* Player Body Details */}
              <View
                style={[
                  styles.playerBody,
                  player.current.isDashing && styles.playerDashing,
                ]}
              >
                <View
                  style={[
                    styles.playerFace,
                    player.current.facing === 'left' ? styles.faceLeft : styles.faceRight,
                  ]}
                >
                  <View style={styles.playerEye} />
                </View>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* On-Screen Mobile / Touch Controls */}
      <View style={styles.controlsBar}>
        <View style={styles.dPad}>
          <TouchableOpacity
            style={styles.controlBtn}
            onPressIn={() => (keys.current.left = true)}
            onPressOut={() => (keys.current.left = false)}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={26} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlBtn}
            onPressIn={() => (keys.current.right = true)}
            onPressOut={() => (keys.current.right = false)}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-forward" size={26} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.actionPad}>
          <TouchableOpacity
            style={[styles.controlBtn, styles.dashBtn]}
            onPress={() => triggerDash()}
            activeOpacity={0.7}
          >
            <Text style={styles.dashBtnText}>DASH</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlBtn, styles.jumpBtn]}
            onPress={() => triggerJump()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-up" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Start Screen Modal */}
      {gameState === 'start' && (
        <Modal transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Ionicons name="game-controller" size={48} color="#2563EB" />
                <Text style={styles.modalTitle}>2D Platformer Adventure</Text>
                <Text style={styles.modalSubtitle}>
                  Run, Double Jump & Dash your way through challenging platforms!
                </Text>
              </View>

              <View style={styles.instructionsBox}>
                <Text style={styles.instructionsHeading}>Controls / Control Keys:</Text>
                <Text style={styles.instructionLine}>
                  • Mobile: On-screen Arrow buttons & JUMP / DASH buttons
                </Text>
                <Text style={styles.instructionLine}>
                  • Web/PC: WASD or Arrow Keys + Space to Jump + Shift to Dash
                </Text>
              </View>

              <View style={styles.levelSelectionBox}>
                <Text style={styles.selectLevelTitle}>Select Level:</Text>
                <View style={styles.levelBtnRow}>
                  {LEVELS.map((lvl, index) => (
                    <TouchableOpacity
                      key={lvl.id}
                      style={[
                        styles.levelSelectCard,
                        { borderColor: lvl.theme },
                      ]}
                      onPress={() => startGame(index)}
                    >
                      <Text style={[styles.levelSelectNum, { color: lvl.theme }]}>
                        Lvl {lvl.id}
                      </Text>
                      <Text style={styles.levelSelectName}>{lvl.title.split(': ')[1]}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                style={styles.primaryModalBtn}
                onPress={() => startGame(0)}
              >
                <Ionicons name="play" size={22} color="#FFFFFF" />
                <Text style={styles.primaryModalBtnText}>Start Playing Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Pause Screen Modal */}
      {gameState === 'paused' && (
        <Modal transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Ionicons name="pause-circle" size={54} color="#3B82F6" />
              <Text style={styles.modalTitle}>Game Paused</Text>

              <View style={{ gap: 12, width: '100%', marginTop: 16 }}>
                <TouchableOpacity
                  style={styles.primaryModalBtn}
                  onPress={() => setGameState('playing')}
                >
                  <Ionicons name="play" size={20} color="#FFFFFF" />
                  <Text style={styles.primaryModalBtnText}>Resume Game</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryModalBtn}
                  onPress={() => startGame(currentLevelIndex)}
                >
                  <Ionicons name="refresh" size={20} color="#334155" />
                  <Text style={styles.secondaryModalBtnText}>Restart Level</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryModalBtn}
                  onPress={() => setGameState('start')}
                >
                  <Ionicons name="list" size={20} color="#334155" />
                  <Text style={styles.secondaryModalBtnText}>Level Select Menu</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Game Over Modal */}
      {gameState === 'gameover' && (
        <Modal transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Ionicons name="close-circle" size={54} color="#EF4444" />
              <Text style={[styles.modalTitle, { color: '#EF4444' }]}>Game Over!</Text>
              <Text style={styles.modalSubtitle}>
                You ran out of lives. Don't give up, try again!
              </Text>

              <Text style={styles.finalScoreText}>Score: {score}</Text>

              <View style={{ gap: 12, width: '100%', marginTop: 16 }}>
                <TouchableOpacity
                  style={styles.primaryModalBtn}
                  onPress={() => startGame(currentLevelIndex)}
                >
                  <Ionicons name="refresh" size={20} color="#FFFFFF" />
                  <Text style={styles.primaryModalBtnText}>Try Again</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryModalBtn}
                  onPress={() => setGameState('start')}
                >
                  <Ionicons name="menu" size={20} color="#334155" />
                  <Text style={styles.secondaryModalBtnText}>Main Menu</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Victory Modal */}
      {gameState === 'victory' && (
        <Modal transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Ionicons name="trophy" size={56} color="#F59E0B" />
              <Text style={[styles.modalTitle, { color: '#10B981' }]}>
                Level Cleared! 🎉
              </Text>
              <Text style={styles.modalSubtitle}>
                Awesome job! You conquered {currentLevel.title}!
              </Text>

              <View style={styles.victoryScoreBox}>
                <Text style={styles.victoryScoreLabel}>Final Score</Text>
                <Text style={styles.victoryScoreValue}>{score}</Text>
              </View>

              <View style={{ gap: 12, width: '100%', marginTop: 16 }}>
                {currentLevelIndex < LEVELS.length - 1 ? (
                  <TouchableOpacity
                    style={styles.primaryModalBtn}
                    onPress={() => startGame(currentLevelIndex + 1)}
                  >
                    <Text style={styles.primaryModalBtnText}>Next Level →</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.allClearedBadge}>
                    <Text style={styles.allClearedText}>
                      👑 You Beat All Levels! Master Platformer!
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.secondaryModalBtn}
                  onPress={() => setGameState('start')}
                >
                  <Ionicons name="apps" size={20} color="#334155" />
                  <Text style={styles.secondaryModalBtnText}>Level Select</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#1E293B',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  headerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0F172A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  livesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  pauseBtn: {
    backgroundColor: '#334155',
    padding: 8,
    borderRadius: 8,
  },
  gameViewport: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  gameStage: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#334155',
  },
  levelTitleOverlay: {
    position: 'absolute',
    top: 12,
    left: 16,
    zIndex: 10,
  },
  levelTitleText: {
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  platform: {
    position: 'absolute',
    borderRadius: 4,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  spikePattern: {
    color: '#FCA5A5',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: -1,
  },
  springCore: {
    backgroundColor: '#A78BFA',
    borderRadius: 10,
    padding: 2,
  },
  collectible: {
    position: 'absolute',
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coinBadge: {
    shadowColor: '#F59E0B',
    shadowRadius: 4,
    shadowOpacity: 0.8,
  },
  starBadge: {
    shadowColor: '#EAB308',
    shadowRadius: 4,
    shadowOpacity: 0.8,
  },
  heartBadge: {
    shadowColor: '#EF4444',
    shadowRadius: 4,
    shadowOpacity: 0.8,
  },
  enemy: {
    position: 'absolute',
    backgroundColor: '#EF4444',
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#B91C1C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  enemyEyes: {
    flexDirection: 'row',
    gap: 4,
  },
  eyeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
  portal: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  portalGlow: {
    position: 'absolute',
    width: 40,
    height: 50,
    borderRadius: 20,
    backgroundColor: '#10B981',
    opacity: 0.2,
  },
  player: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerBody: {
    width: '100%',
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#1D4ED8',
    justifyContent: 'flex-start',
    paddingTop: 4,
  },
  playerDashing: {
    backgroundColor: '#F59E0B',
    borderColor: '#B45309',
  },
  playerFace: {
    flexDirection: 'row',
    paddingHorizontal: 4,
  },
  faceLeft: {
    justifyContent: 'flex-start',
  },
  faceRight: {
    justifyContent: 'flex-end',
  },
  playerEye: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  controlsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#1E293B',
  },
  dPad: {
    flexDirection: 'row',
    gap: 12,
  },
  actionPad: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  controlBtn: {
    backgroundColor: '#334155',
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#475569',
  },
  jumpBtn: {
    backgroundColor: '#2563EB',
    borderColor: '#3B82F6',
  },
  dashBtn: {
    backgroundColor: '#D97706',
    borderColor: '#F59E0B',
    width: 60,
    borderRadius: 16,
  },
  dashBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
  },
  modalHeader: {
    alignItems: 'center',
    gap: 6,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  instructionsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    width: '100%',
    gap: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  instructionsHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 2,
  },
  instructionLine: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  levelSelectionBox: {
    width: '100%',
    gap: 8,
  },
  selectLevelTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  levelBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  levelSelectCard: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    borderWidth: 2,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
  },
  levelSelectNum: {
    fontSize: 14,
    fontWeight: '800',
  },
  levelSelectName: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  primaryModalBtn: {
    backgroundColor: '#2563EB',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  primaryModalBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryModalBtn: {
    backgroundColor: '#F1F5F9',
    width: '100%',
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  secondaryModalBtnText: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '700',
  },
  finalScoreText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginVertical: 4,
  },
  victoryScoreBox: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 8,
  },
  victoryScoreLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
    textTransform: 'uppercase',
  },
  victoryScoreValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#D97706',
  },
  allClearedBadge: {
    backgroundColor: '#ECFDF5',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  allClearedText: {
    color: '#059669',
    fontWeight: '700',
    fontSize: 14,
  },
});
