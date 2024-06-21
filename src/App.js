import React, { useState, useEffect, useCallback, useRef } from "react";

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const ROBOT_SIZE = 80;
const PRIZE_SIZE = 20;
const SMALL_ASTEROID_MIN_SIZE = 20;
const SMALL_ASTEROID_MAX_SIZE = 60;
const ROTATION_SPEED = 3;
const MAX_FUEL = 100;
const FUEL_PURCHASE_AMOUNT = 10;
const FUEL_PURCHASE_COST = 10;

const Robot = ({ x, y, rotation, isJetpackActive }) => (
  <g transform={`translate(${x},${y}) rotate(${rotation})`}>
    {/* Main body */}
    <rect
      x="-20"
      y="-30"
      width="40"
      height="60"
      fill="#d3d3d3"
      stroke="#000"
      strokeWidth="2"
    />

    {/* Head */}
    <circle cx="0" cy="-30" r="20" fill="#333" />
    <rect
      x="-15"
      y="-40"
      width="30"
      height="20"
      fill="#d3d3d3"
      stroke="#000"
      strokeWidth="2"
    />

    {/* Arms */}
    <rect
      x="-30"
      y="-20"
      width="10"
      height="40"
      fill="#d3d3d3"
      stroke="#000"
      strokeWidth="2"
    />
    <rect
      x="20"
      y="-20"
      width="10"
      height="40"
      fill="#d3d3d3"
      stroke="#000"
      strokeWidth="2"
    />

    {/* Legs */}
    <rect
      x="-15"
      y="30"
      width="10"
      height="20"
      fill="#d3d3d3"
      stroke="#000"
      strokeWidth="2"
    />
    <rect
      x="5"
      y="30"
      width="10"
      height="20"
      fill="#d3d3d3"
      stroke="#000"
      strokeWidth="2"
    />

    {/* Jetpack flames */}
    {isJetpackActive && (
      <>
        <polygon points="-10,50 -15,60 -5,60" fill="orange" className="flame" />
        <polygon points="10,50 5,60 15,60" fill="orange" className="flame" />
      </>
    )}
  </g>
);

const SmallAsteroid = ({ x, y, size, rotation }) => (
  <g transform={`translate(${x},${y}) rotate(${rotation})`}>
    <path
      d={`M${size / 2},0 L${size},${size / 3} L${(size * 5) / 6},${size} L${
        size / 6
      },${size} L0,${size / 3} Z`}
      fill="#234567"
    />
    <circle cx={size * 0.3} cy={size * 0.3} r={size * 0.1} fill="#111111" />
    <circle cx={size * 0.7} cy={size * 0.7} r={size * 0.15} fill="#123456" />
  </g>
);

const Prize = ({ x, y, type }) => {
  if (type === "gold") {
    return (
      <g transform={`translate(${x},${y})`}>
        <rect width={PRIZE_SIZE} height={PRIZE_SIZE / 2} fill="#ffd700" />
        <polygon
          points={`0,${PRIZE_SIZE / 2} ${PRIZE_SIZE},${PRIZE_SIZE / 2} ${
            PRIZE_SIZE / 2
          },${PRIZE_SIZE}`}
          fill="#ffd700"
        />
      </g>
    );
  } else if (type === "diamond") {
    return (
      <g transform={`translate(${x},${y})`}>
        <polygon
          points={`${PRIZE_SIZE / 2},0 ${PRIZE_SIZE},${PRIZE_SIZE / 2} ${
            PRIZE_SIZE / 2
          },${PRIZE_SIZE} 0,${PRIZE_SIZE / 2}`}
          fill="#b9f2ff"
        />
      </g>
    );
  } else {
    return (
      <circle
        cx={x + PRIZE_SIZE / 2}
        cy={y + PRIZE_SIZE / 2}
        r={PRIZE_SIZE / 2}
        fill="#c0c0c0"
      />
    );
  }
};

const AsteroidMinerBot = () => {
  const [robotPos, setRobotPos] = useState({
    x: GAME_WIDTH / 2,
    y: GAME_HEIGHT - ROBOT_SIZE - 50,
  });
  const [robotVelocity, setRobotVelocity] = useState({ x: 0, y: 0 });
  const [robotRotation, setRobotRotation] = useState(0);
  const [isJetpackActive, setIsJetpackActive] = useState(false);
  const [smallAsteroids, setSmallAsteroids] = useState([]);
  const [prizes, setPrizes] = useState([]);
  const [score, setScore] = useState(0);
  const [fuel, setFuel] = useState(MAX_FUEL);
  const [gameOver, setGameOver] = useState(false);
  const [gravity, setGravity] = useState(0.1);
  const [jetpackForce, setJetpackForce] = useState(0.5);
  const [fuelConsumptionRate, setFuelConsumptionRate] = useState(0.05);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const gameAreaRef = useRef(null);

  useEffect(() => {
    setIsTouchDevice("ontouchstart" in window || navigator.maxTouchPoints > 0);
  }, []);

  const createSmallAsteroid = useCallback(() => {
    const angle = Math.random() * Math.PI * 2;
    const edge = Math.floor(Math.random() * 4);
    let x, y;

    switch (edge) {
      case 0: // top
        x = Math.random() * GAME_WIDTH;
        y = -SMALL_ASTEROID_MAX_SIZE;
        break;
      case 1: // right
        x = GAME_WIDTH + SMALL_ASTEROID_MAX_SIZE;
        y = Math.random() * GAME_HEIGHT;
        break;
      case 2: // bottom
        x = Math.random() * GAME_WIDTH;
        y = GAME_HEIGHT + SMALL_ASTEROID_MAX_SIZE;
        break;
      case 3: // left
        x = -SMALL_ASTEROID_MAX_SIZE;
        y = Math.random() * GAME_HEIGHT;
        break;
    }

    return {
      x,
      y,
      size:
        SMALL_ASTEROID_MIN_SIZE +
        Math.random() * (SMALL_ASTEROID_MAX_SIZE - SMALL_ASTEROID_MIN_SIZE),
      speed: 1 + Math.random() * 3,
      angle: Math.atan2(GAME_HEIGHT / 2 - y, GAME_WIDTH / 2 - x),
      rotation: Math.random() * 360,
    };
  }, []);

  const createPrize = useCallback(
    () => ({
      x: Math.random() * (GAME_WIDTH - PRIZE_SIZE),
      y: Math.random() * (GAME_HEIGHT / 2),
      type: ["gold", "silver", "diamond"][Math.floor(Math.random() * 3)],
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
    }),
    []
  );

  const buyFuel = () => {
    if (score >= FUEL_PURCHASE_COST) {
      setFuel((prev) => Math.min(MAX_FUEL, prev + FUEL_PURCHASE_AMOUNT));
      setScore((prev) => prev - FUEL_PURCHASE_COST);
    }
  };

  const handleTouchStart = useCallback((e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const gameArea = gameAreaRef.current.getBoundingClientRect();
    const touchX = touch.clientX - gameArea.left;

    if (touchX < gameArea.width / 3) {
      setRobotRotation((prev) => (prev - ROTATION_SPEED + 360) % 360);
    } else if (touchX > (gameArea.width * 2) / 3) {
      setRobotRotation((prev) => (prev + ROTATION_SPEED) % 360);
    } else {
      setIsJetpackActive(true);
    }
  }, []);

  const handleTouchEnd = useCallback((e) => {
    e.preventDefault();
    setIsJetpackActive(false);
  }, []);

  useEffect(() => {
    const gameLoop = setInterval(() => {
      if (gameOver) return;

      setRobotPos((prev) => {
        const angle = (robotRotation * Math.PI) / 180;
        return {
          x: Math.max(
            0,
            Math.min(GAME_WIDTH - ROBOT_SIZE, prev.x + robotVelocity.x)
          ),
          y: Math.max(
            0,
            Math.min(GAME_HEIGHT - ROBOT_SIZE - 50, prev.y + robotVelocity.y)
          ),
        };
      });

      setRobotVelocity((prev) => {
        const angle = (robotRotation * Math.PI) / 180;
        if (isJetpackActive && fuel > 0) {
          setFuel((prevFuel) => Math.max(0, prevFuel - fuelConsumptionRate));
          return {
            x: prev.x * 0.95 + Math.sin(angle) * jetpackForce,
            y: prev.y * 0.95 + gravity - Math.cos(angle) * jetpackForce,
          };
        } else {
          return {
            x: prev.x * 0.95,
            y: prev.y * 0.95 + gravity,
          };
        }
      });

      setSmallAsteroids((prev) => {
        let newAsteroids = prev
          .map((a) => ({
            ...a,
            x: a.x + Math.cos(a.angle) * a.speed,
            y: a.y + Math.sin(a.angle) * a.speed,
            rotation: (a.rotation + 1) % 360,
          }))
          .filter(
            (a) =>
              a.x > -a.size &&
              a.x < GAME_WIDTH + a.size &&
              a.y > -a.size &&
              a.y < GAME_HEIGHT + a.size
          );

        if (newAsteroids.length < 5 && Math.random() < 0.02) {
          newAsteroids.push(createSmallAsteroid());
        }

        return newAsteroids;
      });

      setPrizes((prev) => {
        return prev.map((p) => ({
          ...p,
          x: (p.x + p.vx + GAME_WIDTH) % GAME_WIDTH,
          y: (p.y + p.vy + GAME_HEIGHT / 2) % (GAME_HEIGHT / 2),
        }));
      });

      if (prizes.length < 5 && Math.random() < 0.01) {
        setPrizes((prev) => [...prev, createPrize()]);
      }

      smallAsteroids.forEach((asteroid) => {
        const dx = robotPos.x - asteroid.x;
        const dy = robotPos.y - asteroid.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < ROBOT_SIZE / 2 + asteroid.size / 2) {
          setGameOver(true);
        }
      });

      prizes.forEach((prize, index) => {
        const dx = robotPos.x - prize.x;
        const dy = robotPos.y - prize.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < ROBOT_SIZE / 2 + PRIZE_SIZE / 2) {
          setPrizes((prev) => prev.filter((_, i) => i !== index));
          setScore(
            (prev) =>
              prev +
              (prize.type === "diamond" ? 30 : prize.type === "gold" ? 20 : 10)
          );
        }
      });
    }, 20);

    return () => clearInterval(gameLoop);
  }, [
    robotPos,
    robotVelocity,
    robotRotation,
    isJetpackActive,
    smallAsteroids,
    prizes,
    gameOver,
    createSmallAsteroid,
    createPrize,
    fuel,
    gravity,
    jetpackForce,
    fuelConsumptionRate,
  ]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowLeft")
        setRobotRotation((prev) => (prev - ROTATION_SPEED + 360) % 360);
      if (e.key === "ArrowRight")
        setRobotRotation((prev) => (prev + ROTATION_SPEED) % 360);
      if (e.key === "ArrowUp") setIsJetpackActive(true);
      if (e.key === "f" || e.key === "F") buyFuel();
    };
    const handleKeyUp = (e) => {
      if (e.key === "ArrowUp") setIsJetpackActive(false);
    };

    if (!isTouchDevice) {
      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("keyup", handleKeyUp);
    }

    return () => {
      if (!isTouchDevice) {
        window.removeEventListener("keydown", handleKeyDown);
        window.removeEventListener("keyup", handleKeyUp);
      }
    };
  }, [isTouchDevice, buyFuel]);

  const resetGame = () => {
    setRobotPos({ x: GAME_WIDTH / 2, y: GAME_HEIGHT - ROBOT_SIZE - 50 });
    setRobotVelocity({ x: 0, y: 0 });
    setRobotRotation(0);
    setSmallAsteroids([]);
    setPrizes([]);
    setScore(0);
    setFuel(MAX_FUEL);
    setGameOver(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 bg-gray-100 rounded-lg shadow-md">
      <h1 className="text-3xl font-bold mb-4 text-center">
        Asteroid Miner Bot
      </h1>

      {/* Sliding controls */}
      <div className="mb-4">
        <label className="block mb-2">
          Gravity: {gravity.toFixed(2)}
          <input
            type="range"
            min="0"
            max="0.5"
            step="0.01"
            value={gravity}
            onChange={(e) => setGravity(parseFloat(e.target.value))}
            className="w-full"
          />
        </label>
        <label className="block mb-2">
          Jetpack Force: {jetpackForce.toFixed(2)}
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={jetpackForce}
            onChange={(e) => setJetpackForce(parseFloat(e.target.value))}
            className="w-full"
          />
        </label>
        <label className="block mb-2">
          Fuel Consumption Rate: {fuelConsumptionRate.toFixed(3)}
          <input
            type="range"
            min="0.01"
            max="0.1"
            step="0.001"
            value={fuelConsumptionRate}
            onChange={(e) => setFuelConsumptionRate(parseFloat(e.target.value))}
            className="w-full"
          />
        </label>
      </div>

      <div
        ref={gameAreaRef}
        className="relative"
        style={{ touchAction: "none" }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${GAME_WIDTH} ${GAME_HEIGHT}`}
          preserveAspectRatio="xMidYMid meet"
          className="bg-black"
        >
          <rect
            x={0}
            y={0}
            width={GAME_WIDTH}
            height={GAME_HEIGHT}
            fill="#000000"
          />
          <rect
            x={0}
            y={GAME_HEIGHT - ROBOT_SIZE}
            width={GAME_WIDTH}
            height={100}
            fill="#4F1306"
          />

          {smallAsteroids.map((asteroid, index) => (
            <SmallAsteroid key={index} {...asteroid} />
          ))}

          {prizes.map((prize, index) => (
            <Prize key={index} {...prize} />
          ))}

          <Robot
            x={robotPos.x}
            y={robotPos.y}
            rotation={robotRotation}
            isJetpackActive={isJetpackActive && fuel > 0}
          />

          <rect x={10} y={10} width={100} height={20} fill="#333" />
          <rect x={10} y={10} width={fuel} height={20} fill="#0f0" />
          <text x={60} y={25} textAnchor="middle" fill="white" fontSize="12">
            Fuel: {Math.round(fuel)}%
          </text>

          {gameOver && (
            <g>
              <rect
                x={0}
                y={0}
                width={GAME_WIDTH}
                height={GAME_HEIGHT}
                fill="rgba(0,0,0,0.5)"
              />
              <text
                x={GAME_WIDTH / 2}
                y={GAME_HEIGHT / 2}
                textAnchor="middle"
                fill="white"
                fontSize="40"
              >
                Game Over
              </text>
              <text
                x={GAME_WIDTH / 2}
                y={GAME_HEIGHT / 2 + 50}
                textAnchor="middle"
                fill="white"
                fontSize="20"
              >
                Score: {score}
              </text>
            </g>
          )}
        </svg>

        {isTouchDevice && (
          <div className="absolute bottom-0 left-0 right-0 flex justify-between p-4">
            <button
              className="bg-blue-500 text-white p-4 rounded-full"
              onTouchStart={() =>
                setRobotRotation((prev) => (prev - ROTATION_SPEED + 360) % 360)
              }
            >
              ←
            </button>
            <button
              className="bg-green-500 text-white p-4 rounded-full"
              onTouchStart={() => setIsJetpackActive(true)}
              onTouchEnd={() => setIsJetpackActive(false)}
            >
              ↑
            </button>
            <button
              className="bg-blue-500 text-white p-4 rounded-full"
              onTouchStart={() =>
                setRobotRotation((prev) => (prev + ROTATION_SPEED) % 360)
              }
            >
              →
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 text-center">
        <p className="font-bold">Score: {score}</p>
        {isTouchDevice ? (
          <p className="mt-2">
            Touch left to rotate left, right to rotate right, center to activate
            jetpack
          </p>
        ) : (
          <p className="mt-2">
            Use ← → to rotate, ↑ to activate jetpack, F to buy fuel
          </p>
        )}
        <button
          onClick={buyFuel}
          className="mt-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
          disabled={score < FUEL_PURCHASE_COST}
        >
          Buy Fuel ({FUEL_PURCHASE_COST} points)
        </button>
        {gameOver && (
          <button
            onClick={resetGame}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            Play Again
          </button>
        )}
      </div>
    </div>
  );
};

export default AsteroidMinerBot;
