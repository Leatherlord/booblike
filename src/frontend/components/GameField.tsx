import React, { useRef, useEffect, useState, useLayoutEffect } from 'react';
import { World } from '../../common/interfaces';

interface GameFieldProps {
  world: World | null;
}

const MAX_HORIZONTAL_TILES = 20;
const DEFAULT_TILE_SIZE = 32;

const GameField: React.FC<GameFieldProps> = ({ world }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gamefieldRef = useRef<HTMLDivElement>(null);
  const [tileSize, setTileSize] = useState(DEFAULT_TILE_SIZE);
  const renderCountRef = useRef(0);

  const renderCanvas = () => {
    if (!world || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (canvas.width === 0 || canvas.height === 0) {
      canvas.width =
        canvas.clientWidth || gamefieldRef.current?.clientWidth || 800;
      canvas.height =
        canvas.clientHeight || gamefieldRef.current?.clientHeight || 600;
    }

    const viewportWidth = Math.floor(canvas.width / tileSize);
    const viewportHeight = Math.floor(canvas.height / tileSize);

    const cameraX = world.player.x;
    const cameraY = world.player.y;

    const offsetX = cameraX - Math.floor(viewportWidth / 2);
    const offsetY = cameraY - Math.floor(viewportHeight / 2);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    world.map.forEach((row, y) => {
      row.forEach((tile, x) => {
        const screenX = (x - offsetX) * tileSize;
        const screenY = (y - offsetY) * tileSize;

        if (
          screenX > -tileSize &&
          screenX < canvas.width &&
          screenY > -tileSize &&
          screenY < canvas.height
        ) {
          ctx.fillStyle = tile === 'wall' ? '#666' : '#eee';
          ctx.fillRect(screenX, screenY, tileSize, tileSize);
          ctx.strokeStyle = '#999';
          ctx.strokeRect(screenX, screenY, tileSize, tileSize);

          if (x === cameraX && y === cameraY) {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
            ctx.fillRect(screenX, screenY, tileSize, tileSize);
          }
        }
      });
    });

    renderCountRef.current += 1;
  };

  useLayoutEffect(() => {
    const updateTileSize = () => {
      if (!gamefieldRef.current) return;

      const gameFieldWidth = gamefieldRef.current.clientWidth;
      const calculatedTileSize = Math.floor(
        gameFieldWidth / MAX_HORIZONTAL_TILES
      );

      if (calculatedTileSize > 0) {
        setTileSize(calculatedTileSize);

        if (canvasRef.current) {
          canvasRef.current.width = gameFieldWidth;
          canvasRef.current.height = gamefieldRef.current.clientHeight;

          requestAnimationFrame(renderCanvas);
        }
      }
    };

    updateTileSize();

    window.addEventListener('resize', updateTileSize);

    return () => {
      window.removeEventListener('resize', updateTileSize);
    };
  }, [world]);

  useEffect(() => {
    if (world) {
      renderCanvas();
    }
  }, [world, tileSize]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const observer = new ResizeObserver(() => {
      renderCanvas();
    });

    observer.observe(canvas);
    return () => observer.disconnect();
  }, [world]);

  return (
    <div className="game-field" ref={gamefieldRef}>
      {world && (
        <>
          <canvas
            ref={canvasRef}
            className="game-canvas"
            width={800}
            height={600}
          />
          <div className="camera-info">
            Player position: ({world.player.x}, {world.player.y}) | Tile size:{' '}
            {tileSize}px | Renders: {renderCountRef.current}
          </div>
        </>
      )}
    </div>
  );
};

export default GameField;
