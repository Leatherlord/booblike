import React, { useEffect } from 'react';
import GameField from './GameField';
import { useWorld } from '../../common/context/WorldContext';

const App: React.FC = () => {
  const { world, updateWorld } = useWorld();

  useEffect(() => {
    if (!world) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!world) return;

      const newWorld = { ...world };
      const player = { ...world.player };

      switch (e.key) {
        case 'ArrowUp':
          if (player.y > 0 && world.map[player.y - 1][player.x] !== 'wall') {
            player.y = Math.max(0, player.y - 1);
          }
          break;
        case 'ArrowDown':
          if (
            player.y < world.height - 1 &&
            world.map[player.y + 1][player.x] !== 'wall'
          ) {
            player.y = player.y + 1;
          }
          break;
        case 'ArrowLeft':
          if (player.x > 0 && world.map[player.y][player.x - 1] !== 'wall') {
            player.x = Math.max(0, player.x - 1);
          }
          break;
        case 'ArrowRight':
          if (
            player.x < world.width - 1 &&
            world.map[player.y][player.x + 1] !== 'wall'
          ) {
            player.x = player.x + 1;
          }
          break;
        default:
          return;
      }

      newWorld.player = player;
      updateWorld(newWorld);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [world, updateWorld]);

  return (
    <div className="game-container">
      <div className="hud top-hud">
        <div className="hud-content">
          <span className="hud-item">Score: 0</span>
          <span className="hud-item">Level: 1</span>
          {world && (
            <span className="hud-item">
              Player: ({world.player.x}, {world.player.y})
            </span>
          )}
        </div>
      </div>

      <div className="main-area">
        <div className="hud left-hud">
          <div className="hud-content"></div>
        </div>

        <GameField world={world} />

        <div className="hud right-hud">
          <div className="hud-content"></div>
        </div>
      </div>

      <div className="hud bottom-hud">
        <div className="hud-content">
          <div className="hud-item">Use arrow keys to move the player</div>
        </div>
      </div>
    </div>
  );
};

export default App;
