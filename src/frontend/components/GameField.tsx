import React, { useRef, useEffect, useState, useLayoutEffect } from 'react';
import { World } from '../../common/interfaces';
import { TextureManager } from '../utils/TextureManager';
import { TexturePack } from '../types/texturePack';

interface GameFieldProps {
  world: World | null;
  selectedTexturePack: TexturePack | null;
}

const MAX_HORIZONTAL_TILES = 20;
const DEFAULT_TILE_SIZE = 32;

const GameField: React.FC<GameFieldProps> = ({
  world,
  selectedTexturePack,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const gamefieldRef = useRef<HTMLDivElement>(null);
  const [tileSize, setTileSize] = useState(DEFAULT_TILE_SIZE);
  const renderCountRef = useRef(0);
  const textureManagerRef = useRef<TextureManager | null>(null);
  const [texturesLoaded, setTexturesLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const fadingTilesRef = useRef<{ x: number; y: number; alpha: number }[]>([]);

  useEffect(() => {
    if (!selectedTexturePack) return;

    const textureManager = new TextureManager();
    textureManagerRef.current = textureManager;
    setTexturesLoaded(false);
    setLoadingProgress(0);

    textureManager.loadTexturePack(selectedTexturePack).then(() => {
      setTexturesLoaded(true);
      setLoadingProgress(100);
    });

    const progressInterval = setInterval(() => {
      if (textureManager.isFullyLoaded()) {
        clearInterval(progressInterval);
      } else {
        setLoadingProgress(textureManager.getLoadingProgress());
      }
    }, 100);

    return () => {
      clearInterval(progressInterval);
    };
  }, [selectedTexturePack]);

  const renderAttack = () => {
    if (!world) return;
    let entity = world?.player;
    if (!entity.lastAttackArray) return;
    //for each entity
    entity.lastAttackArray.map((tile, i) => {
      fadingTilesRef.current.push({
        x: tile.x,
        y: tile.y,
        alpha: 0.5,
      });
    })
    entity.lastAttackArray = [];
  };

  const animateAttack = () => {
    if (!world) return;
    let entity = world?.player;
    if (!entity.lastAttackArray) return;
    const canvas = overlayCanvasRef.current;
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if(fadingTilesRef.current.length == 0) return;

    const viewportWidth = Math.floor(canvas.width / tileSize);
    const viewportHeight = Math.floor(canvas.height / tileSize);
    const cameraX = world.player.x;
    const cameraY = world.player.y;
    const offsetX = cameraX - Math.floor(viewportWidth / 2);
    const offsetY = cameraY - Math.floor(viewportHeight / 2);

    fadingTilesRef.current = fadingTilesRef.current
    .map((tile) => ({
      ...tile,
      alpha: tile.alpha - 0.05,
    })).filter((tile) => tile.alpha > 0);
    
    fadingTilesRef.current.map((tile, i) => {
      ctx.globalAlpha = tile.alpha;
      const x =  tile.x;
      const y = tile.y;
      const screenX = (x - offsetX) * tileSize;
      const screenY = (y - offsetY) * tileSize;
      ctx.fillStyle = 'rgba(255, 0, 0)';
      ctx.fillRect(screenX, screenY, tileSize, tileSize);
    })
    ctx.globalAlpha = 1.0;
    renderCountRef.current += 1;
    requestAnimationFrame(animateAttack);
  }

  useEffect(() => {
    let animationFrameId = requestAnimationFrame(animateAttack);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [world]);

  const renderCanvas = () => {
    if (!world || !canvasRef.current || !textureManagerRef.current) return;

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

    world.map.rooms[world.map.currentRoom].map.forEach((row, y) => {
      row.forEach((tile, x) => {
        const screenX = (x - offsetX) * tileSize;
        const screenY = (y - offsetY) * tileSize;

        if (
          screenX > -tileSize &&
          screenX < canvas.width &&
          screenY > -tileSize &&
          screenY < canvas.height
        ) {
          const texture = textureManagerRef.current?.getTexture(tile);

          if (texture) {
            // Draw the texture if available
            ctx.drawImage(texture, screenX, screenY, tileSize, tileSize);

            ctx.strokeStyle = '#121212';
            ctx.strokeRect(screenX, screenY, tileSize, tileSize);
          } else if (tile && tile !== 'empty') {
            ctx.fillStyle = tile === 'wall' ? '#666' : '#eee';
            ctx.fillRect(screenX, screenY, tileSize, tileSize);

            ctx.strokeStyle = '#121212';
            ctx.strokeRect(screenX, screenY, tileSize, tileSize);
          } else {
            ctx.fillStyle = '#0a0a0a';
            ctx.fillRect(screenX, screenY, tileSize, tileSize);
          }

          if (x === cameraX && y === cameraY) {
            const playerTexture =
              textureManagerRef.current?.getTexture('player');
            if (playerTexture) {
              ctx.drawImage(
                playerTexture,
                screenX,
                screenY,
                tileSize,
                tileSize
              );
            } else {
              ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
              ctx.fillRect(screenX, screenY, tileSize, tileSize);
            }
          }
        }
      });
    });
    renderAttack();
    renderEnemies();
    renderCountRef.current += 1;
  };

  const renderEnemies = () => {
    if (!world || !canvasRef.current || !textureManagerRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const viewportWidth = Math.floor(canvas.width / tileSize);
    const viewportHeight = Math.floor(canvas.height / tileSize);

    const cameraX = world.player.x;
    const cameraY = world.player.y;

    const offsetX = cameraX - Math.floor(viewportWidth / 2);
    const offsetY = cameraY - Math.floor(viewportHeight / 2);
    const room = world.map.rooms[world.map.currentRoom];
    Object.values(room.entities).forEach((entity) => {
      const screenX = (entity.x - offsetX) * tileSize;
      const screenY = (entity.y - offsetY) * tileSize;

      if (
        screenX > -tileSize &&
        screenX < canvas.width &&
        screenY > -tileSize &&
        screenY < canvas.height
      ) {
        let texture;
        if (entity.texture) // cache textures perhaps
          texture = textureManagerRef.current?.getTexture(entity.texture);
        if(texture) {
          ctx.drawImage(
              texture,
              screenX,
              screenY,
              tileSize,
              tileSize
          );
        } else {
          ctx.fillStyle = '#0a0a0a';
          ctx.fillRect(screenX, screenY, tileSize, tileSize);
        }
      }
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

        if (overlayCanvasRef.current) {
          overlayCanvasRef.current.width = gameFieldWidth;
          overlayCanvasRef.current.height = gamefieldRef.current.clientHeight;
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
  }, [world, tileSize, texturesLoaded]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const observer = new ResizeObserver(() => {
      renderCanvas();
    });

    observer.observe(canvas);
    return () => observer.disconnect();
  }, [world]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const observer = new ResizeObserver(() => {
      renderCanvas();
    });

    observer.observe(canvas);
    return () => observer.disconnect();
  }, [world]);

  useEffect(() => {
    if (!overlayCanvasRef.current) return;

    const canvas = overlayCanvasRef.current;
    const observer = new ResizeObserver(() => {
      renderCanvas();
    });

    observer.observe(canvas);
    return () => observer.disconnect();
  }, [world]);


  if (!selectedTexturePack) {
    return (
      <div className="game-field">
        <div className="loading">Loading texture pack...</div>
      </div>
    );
  }

  return (
    <div className="game-field" ref={gamefieldRef}>
      {world ? (
        <>
          <canvas
            ref={canvasRef}
            className="game-canvas"
            id="gameCanvas"
            width={800}
            height={600}
          />
          <canvas
            ref={overlayCanvasRef}
            className="overlay-canvas"
            style={{ position: 'absolute', top: 0, left: 0, zIndex: 1, pointerEvents: 'none' }}
          />
          <div style={{
            position: 'absolute',
            left: world.player.x * tileSize,
            top: Math.floor((canvasRef.current?.height || 600)/2) - world.player.y * tileSize,
            pointerEvents: 'none',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          </div>
          <div className="camera-info">
            Player position: ({world.player.x}, {world.player.y}) | Room id:{' '}
            {world.map.currentRoom} | Tile size: {tileSize}px | Renders:{' '}
            {renderCountRef.current}
            {!texturesLoaded && (
              <span> | Loading textures: {Math.round(loadingProgress)}%</span>
            )}
          </div>
        </>
      ) : (
        <div className="loading">Loading world...</div>
      )}
    </div>
  );
};

export default GameField;
