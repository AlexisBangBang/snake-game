import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw } from "lucide-react";

/**
 * Design Philosophy: Retro Gaming Arcade
 * - Bold, high-contrast colors reminiscent of classic arcade games
 * - Pixelated aesthetic with clean grid-based layout
 * - Smooth animations and responsive feedback
 * - High visibility and clear game state indicators
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

  // Initialize canvas and draw
  const draw = (state: GameState) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = "#0f172a"; // Dark slate background
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = "#1e293b";
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

    // Draw snake
    state.snake.forEach((segment, index) => {
      if (index === 0) {
        // Head - bright green
        ctx.fillStyle = "#22c55e";
        ctx.shadowColor = "#16a34a";
        ctx.shadowBlur = 8;
      } else {
        // Body - darker green
        ctx.fillStyle = "#16a34a";
        ctx.shadowColor = "transparent";
      }
      ctx.fillRect(
        segment.x * CELL_SIZE + 1,
        segment.y * CELL_SIZE + 1,
        CELL_SIZE - 2,
        CELL_SIZE - 2
      );
    });

    // Draw food - bright red
    ctx.fillStyle = "#ef4444";
    ctx.shadowColor = "#dc2626";
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(
      state.food.x * CELL_SIZE + CELL_SIZE / 2,
      state.food.y * CELL_SIZE + CELL_SIZE / 2,
      CELL_SIZE / 2 - 2,
      0,
      Math.PI * 2
    );
    ctx.fill();

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
      ctx.fillStyle = "#ef4444";
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600 mb-2">
          🐍 SNAKE GAME
        </h1>
        <p className="text-slate-400 text-lg">经典贪吃蛇游戏</p>
      </div>

      {/* Game Container */}
      <div className="bg-slate-800 rounded-lg shadow-2xl border-2 border-slate-700 overflow-hidden mb-8">
        <canvas
          ref={canvasRef}
          width={GRID_SIZE * CELL_SIZE}
          height={GRID_SIZE * CELL_SIZE}
          className="block bg-slate-950"
        />
      </div>

      {/* Score Display */}
      <div className="flex gap-8 mb-8 text-center">
        <div className="bg-slate-800 rounded-lg px-6 py-4 border border-slate-700">
          <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider">当前分数</p>
          <p className="text-3xl font-bold text-green-400 mt-1">{gameState.score}</p>
        </div>
        <div className="bg-slate-800 rounded-lg px-6 py-4 border border-slate-700">
          <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider">最高分</p>
          <p className="text-3xl font-bold text-amber-400 mt-1">{highScore}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-4 mb-8">
        <Button
          onClick={togglePause}
          disabled={gameState.gameOver}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg flex items-center gap-2 transition-all"
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
          className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2 rounded-lg flex items-center gap-2 transition-all"
        >
          <RotateCcw size={20} /> 重新开始
        </Button>
      </div>

      {/* Instructions */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 max-w-md text-center">
        <p className="text-slate-300 text-sm mb-4">
          <span className="font-semibold text-green-400">方向键</span> 或{" "}
          <span className="font-semibold text-green-400">WASD</span> 控制蛇的移动
        </p>
        <p className="text-slate-300 text-sm mb-4">
          按 <span className="font-semibold text-blue-400">空格</span> 暂停/继续游戏
        </p>
        <p className="text-slate-400 text-xs">
          吃掉红色食物增加长度和分数，撞到墙壁或自身则游戏结束
        </p>
      </div>
    </div>
  );
}
