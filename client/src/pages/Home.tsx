import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw } from "lucide-react";

/**
 * Design Philosophy: Nature-Inspired Gaming
 * - Realistic snake with smooth curves and natural coloring
 * - Organic bean-like food design with visual depth
 * - Lush green garden background aesthetic
 * - Smooth animations and visual feedback
 */

const GRID_SIZE = 20;
const CELL_SIZE = 25;
const INITIAL_SPEED = 100;

interface Position {
  x: number;
  y: number;
}

interface GameState {
  snake: Position[];
  food: Position;
  direction: Position;
  nextDirection: Position;
  score: number;
  gameOver: boolean;
  isPaused: boolean;
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameStateRef = useRef<GameState>({
    snake: [{ x: 10, y: 10 }],
    food: { x: 15, y: 15 },
    direction: { x: 1, y: 0 },
    nextDirection: { x: 1, y: 0 },
    score: 0,
    gameOver: false,
    isPaused: false,
  });
  const [gameState, setGameState] = useState(gameStateRef.current);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem("snakeHighScore");
    return saved ? parseInt(saved, 10) : 0;
  });
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

  // Draw snake segment with smooth edges
  const drawSnakeSegment = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    isHead: boolean,
    direction: Position
  ) => {
    const centerX = x * CELL_SIZE + CELL_SIZE / 2;
    const centerY = y * CELL_SIZE + CELL_SIZE / 2;
    const radius = CELL_SIZE / 2 - 2;

    if (isHead) {
      // Draw snake head with gradient
      const gradient = ctx.createRadialGradient(
        centerX - 2,
        centerY - 2,
        0,
        centerX,
        centerY,
        radius
      );
      gradient.addColorStop(0, "#4ade80"); // Bright green
      gradient.addColorStop(1, "#15803d"); // Dark green

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();

      // Draw snake eyes
      ctx.fillStyle = "#000000";
      const eyeOffset = radius * 0.4;
      const eyeRadius = radius * 0.2;

      // Calculate eye positions based on direction
      let eyeX1 = centerX;
      let eyeY1 = centerY;
      let eyeX2 = centerX;
      let eyeY2 = centerY;

      if (direction.x === 1) {
        // Moving right
        eyeX1 = centerX + eyeOffset;
        eyeY1 = centerY - eyeOffset * 0.5;
        eyeX2 = centerX + eyeOffset;
        eyeY2 = centerY + eyeOffset * 0.5;
      } else if (direction.x === -1) {
        // Moving left
        eyeX1 = centerX - eyeOffset;
        eyeY1 = centerY - eyeOffset * 0.5;
        eyeX2 = centerX - eyeOffset;
        eyeY2 = centerY + eyeOffset * 0.5;
      } else if (direction.y === -1) {
        // Moving up
        eyeX1 = centerX - eyeOffset * 0.5;
        eyeY1 = centerY - eyeOffset;
        eyeX2 = centerX + eyeOffset * 0.5;
        eyeY2 = centerY - eyeOffset;
      } else if (direction.y === 1) {
        // Moving down
        eyeX1 = centerX - eyeOffset * 0.5;
        eyeY1 = centerY + eyeOffset;
        eyeX2 = centerX + eyeOffset * 0.5;
        eyeY2 = centerY + eyeOffset;
      }

      ctx.beginPath();
      ctx.arc(eyeX1, eyeY1, eyeRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(eyeX2, eyeY2, eyeRadius, 0, Math.PI * 2);
      ctx.fill();

      // Add shine effect
      ctx.fillStyle = "#ffffff";
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.arc(centerX - radius * 0.3, centerY - radius * 0.3, radius * 0.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    } else {
      // Draw snake body with gradient
      const gradient = ctx.createRadialGradient(
        centerX - 1,
        centerY - 1,
        0,
        centerX,
        centerY,
        radius
      );
      gradient.addColorStop(0, "#22c55e"); // Medium green
      gradient.addColorStop(1, "#16a34a"); // Dark green

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();

      // Add subtle shine
      ctx.fillStyle = "#ffffff";
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.arc(centerX - radius * 0.3, centerY - radius * 0.3, radius * 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  };

  // Draw bean-like food
  const drawFood = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    const centerX = x * CELL_SIZE + CELL_SIZE / 2;
    const centerY = y * CELL_SIZE + CELL_SIZE / 2;
    const radiusX = CELL_SIZE / 2.5;
    const radiusY = CELL_SIZE / 3;

    // Draw bean shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    ctx.beginPath();
    ctx.ellipse(centerX + 1, centerY + 2, radiusX - 1, radiusY - 1, 0, 0, Math.PI * 2);
    ctx.fill();

    // Draw bean with gradient
    const gradient = ctx.createRadialGradient(
      centerX - radiusX * 0.3,
      centerY - radiusY * 0.3,
      0,
      centerX,
      centerY,
      Math.max(radiusX, radiusY)
    );
    gradient.addColorStop(0, "#fbbf24"); // Bright yellow
    gradient.addColorStop(0.5, "#f59e0b"); // Orange
    gradient.addColorStop(1, "#d97706"); // Dark orange

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.fill();

    // Add shine effect to bean
    ctx.fillStyle = "#ffffff";
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.ellipse(centerX - radiusX * 0.4, centerY - radiusY * 0.4, radiusX * 0.3, radiusY * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Draw bean indent line
    ctx.strokeStyle = "rgba(0, 0, 0, 0.2)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(centerX, centerY, Math.min(radiusX, radiusY) * 0.6, Math.PI * 0.3, Math.PI * 1.7);
    ctx.stroke();
  };

  // Initialize canvas and draw
  const draw = (state: GameState) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw background with gradient
    const bgGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    bgGradient.addColorStop(0, "#1a4d2e"); // Dark green
    bgGradient.addColorStop(0.5, "#2d6a4f"); // Medium green
    bgGradient.addColorStop(1, "#1a4d2e"); // Dark green

    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw subtle grass pattern
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, canvas.height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE);
      ctx.lineTo(canvas.width, i * CELL_SIZE);
      ctx.stroke();
    }

    // Draw food first (behind snake)
    drawFood(ctx, state.food.x, state.food.y);

    // Draw snake
    state.snake.forEach((segment, index) => {
      const isHead = index === 0;
      drawSnakeSegment(ctx, segment.x, segment.y, isHead, state.direction);
    });

    // Draw pause overlay
    if (state.isPaused && !state.gameOver) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 32px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("PAUSED", canvas.width / 2, canvas.height / 2);
    }

    // Draw game over overlay
    if (state.gameOver) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#fbbf24";
      ctx.font = "bold 40px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 40);
      ctx.fillStyle = "#ffffff";
      ctx.font = "20px Arial";
      ctx.fillText(`Final Score: ${state.score}`, canvas.width / 2, canvas.height / 2 + 20);
    }
  };

  // Generate random food position
  const generateFood = (): Position => {
    let newFood: Position = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
    let isOnSnake = true;

    while (isOnSnake) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      isOnSnake = gameStateRef.current.snake.some(
        (segment) => segment.x === newFood.x && segment.y === newFood.y
      );
    }

    return newFood;
  };

  // Game logic
  const updateGame = () => {
    const state = gameStateRef.current;

    if (state.gameOver || state.isPaused) return;

    // Update direction
    state.direction = state.nextDirection;

    // Calculate new head position
    const head = state.snake[0];
    const newHead: Position = {
      x: (head.x + state.direction.x + GRID_SIZE) % GRID_SIZE,
      y: (head.y + state.direction.y + GRID_SIZE) % GRID_SIZE,
    };

    // Check collision with self
    if (state.snake.some((segment) => segment.x === newHead.x && segment.y === newHead.y)) {
      state.gameOver = true;
      if (state.score > highScore) {
        setHighScore(state.score);
        localStorage.setItem("snakeHighScore", state.score.toString());
      }
      setGameState({ ...state });
      return;
    }

    // Add new head
    state.snake.unshift(newHead);

    // Check if food is eaten
    if (newHead.x === state.food.x && newHead.y === state.food.y) {
      state.score += 10;
      state.food = generateFood();
    } else {
      // Remove tail if no food eaten
      state.snake.pop();
    }

    setGameState({ ...state });
  };

  // Handle keyboard input
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const state = gameStateRef.current;
      const key = e.key.toLowerCase();

      // Direction controls
      if (key === "arrowup" || key === "w") {
        if (state.direction.y === 0) {
          state.nextDirection = { x: 0, y: -1 };
          e.preventDefault();
        }
      } else if (key === "arrowdown" || key === "s") {
        if (state.direction.y === 0) {
          state.nextDirection = { x: 0, y: 1 };
          e.preventDefault();
        }
      } else if (key === "arrowleft" || key === "a") {
        if (state.direction.x === 0) {
          state.nextDirection = { x: -1, y: 0 };
          e.preventDefault();
        }
      } else if (key === "arrowright" || key === "d") {
        if (state.direction.x === 0) {
          state.nextDirection = { x: 1, y: 0 };
          e.preventDefault();
        }
      } else if (key === " ") {
        // Pause/unpause
        state.isPaused = !state.isPaused;
        setGameState({ ...state });
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  // Game loop
  useEffect(() => {
    gameLoopRef.current = setInterval(updateGame, INITIAL_SPEED);
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, []);

  // Draw on state change
  useEffect(() => {
    draw(gameState);
  }, [gameState]);

  // Reset game
  const resetGame = () => {
    const newState: GameState = {
      snake: [{ x: 10, y: 10 }],
      food: { x: 15, y: 15 },
      direction: { x: 1, y: 0 },
      nextDirection: { x: 1, y: 0 },
      score: 0,
      gameOver: false,
      isPaused: false,
    };
    gameStateRef.current = newState;
    setGameState(newState);
  };

  // Toggle pause
  const togglePause = () => {
    if (!gameState.gameOver) {
      gameStateRef.current.isPaused = !gameStateRef.current.isPaused;
      setGameState({ ...gameStateRef.current });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-green-800 to-emerald-900 flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-400 mb-2 drop-shadow-lg">
          🐍 贪吃蛇
        </h1>
        <p className="text-emerald-100 text-lg font-medium">吃掉所有的豆子！</p>
      </div>

      {/* Game Container */}
      <div className="bg-emerald-950 rounded-2xl shadow-2xl border-4 border-emerald-700 overflow-hidden mb-8 hover:shadow-emerald-500/50 transition-shadow">
        <canvas
          ref={canvasRef}
          width={GRID_SIZE * CELL_SIZE}
          height={GRID_SIZE * CELL_SIZE}
          className="block bg-gradient-to-br from-emerald-900 to-green-900"
        />
      </div>

      {/* Score Display */}
      <div className="flex gap-8 mb-8 text-center">
        <div className="bg-gradient-to-br from-emerald-800 to-emerald-900 rounded-xl px-6 py-4 border-2 border-emerald-600 shadow-lg">
          <p className="text-emerald-200 text-sm font-semibold uppercase tracking-wider">当前分数</p>
          <p className="text-4xl font-bold text-yellow-300 mt-2">{gameState.score}</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-800 to-emerald-900 rounded-xl px-6 py-4 border-2 border-emerald-600 shadow-lg">
          <p className="text-emerald-200 text-sm font-semibold uppercase tracking-wider">最高分</p>
          <p className="text-4xl font-bold text-amber-300 mt-2">{highScore}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-4 mb-8">
        <Button
          onClick={togglePause}
          disabled={gameState.gameOver}
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold px-6 py-3 rounded-lg flex items-center gap-2 transition-all shadow-lg disabled:opacity-50"
        >
          {gameState.isPaused ? (
            <>
              <Play size={20} /> 继续
            </>
          ) : (
            <>
              <Pause size={20} /> 暂停
            </>
          )}
        </Button>
        <Button
          onClick={resetGame}
          className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold px-6 py-3 rounded-lg flex items-center gap-2 transition-all shadow-lg"
        >
          <RotateCcw size={20} /> 重新开始
        </Button>
      </div>

      {/* Instructions */}
      <div className="bg-gradient-to-br from-emerald-800 to-emerald-900 rounded-xl p-6 border-2 border-emerald-600 max-w-md text-center shadow-lg">
        <p className="text-emerald-100 text-sm mb-4">
          <span className="font-bold text-yellow-300">方向键</span> 或{" "}
          <span className="font-bold text-yellow-300">WASD</span> 控制蛇的移动
        </p>
        <p className="text-emerald-100 text-sm mb-4">
          按 <span className="font-bold text-blue-300">空格</span> 暂停/继续游戏
        </p>
        <p className="text-emerald-200 text-xs">
          🐍 吃掉黄色豆子增加长度和分数，撞到墙壁或自身则游戏结束
        </p>
      </div>
    </div>
  );
}
