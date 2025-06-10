import React, { useRef, useEffect, useState, useLayoutEffect } from 'react';
import { Point2d, World } from '../../common/interfaces';
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
  const enemyCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const gamefieldRef = useRef<HTMLDivElement>(null);
  const [tileSize, setTileSize] = useState(DEFAULT_TILE_SIZE);
  const renderCountRef = useRef(0);
  const renderOverlayCountRef = useRef(0);
  const renderEnemyCountRef = useRef(0);
  const textureManagerRef = useRef<TextureManager | null>(null);
  const [texturesLoaded, setTexturesLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const fadingTilesRef = useRef<{ x: number; y: number; alpha: number }[]>([]);
  const [attackTrigger, setAttackTrigger] = useState(0);

  // Calculate which tiles are visible based on player's FOV (relative to facing direction)
  const isVisibleTile = (
    tileX: number,
    tileY: number,
    playerX: number,
    playerY: number,
    fov: any,
    lookDir: any
  ) => {
    const deltaX = tileX - playerX;
    const deltaY = tileY - playerY;

    // Transform FOV areas based on player's facing direction
    let forward, backward, left, right;

    switch (lookDir) {
      case 'UP':
        forward = fov.areaUp;
        backward = fov.areaDown;
        left = fov.areaLeft;
        right = fov.areaRight;
        // Check bounds: forward = up (negative Y), backward = down (positive Y)
        return (
          deltaY >= -forward &&
          deltaY <= backward &&
          deltaX >= -left &&
          deltaX <= right
        );

      case 'DOWN':
        forward = fov.areaUp; // "up" in FOV = forward when facing down
        backward = fov.areaDown; // "down" in FOV = backward when facing down
        left = fov.areaRight; // "right" in FOV = left when facing down
        right = fov.areaLeft; // "left" in FOV = right when facing down
        // Check bounds: forward = down (positive Y), backward = up (negative Y)
        return (
          deltaY <= forward &&
          deltaY >= -backward &&
          deltaX >= -left &&
          deltaX <= right
        );

      case 'LEFT':
        forward = fov.areaUp; // "up" in FOV = forward when facing left
        backward = fov.areaDown; // "down" in FOV = backward when facing left
        left = fov.areaLeft; // "left" in FOV = left when facing left (down)
        right = fov.areaRight; // "right" in FOV = right when facing left (up)
        // Check bounds: forward = left (negative X), backward = right (positive X)
        return (
          deltaX >= -forward &&
          deltaX <= backward &&
          deltaY <= left &&
          deltaY >= -right
        );

      case 'RIGHT':
        forward = fov.areaUp; // "up" in FOV = forward when facing right
        backward = fov.areaDown; // "down" in FOV = backward when facing right
        left = fov.areaRight; // "right" in FOV = left when facing right (up)
        right = fov.areaLeft; // "left" in FOV = right when facing right (down)
        // Check bounds: forward = right (positive X), backward = left (negative X)
        return (
          deltaX <= forward &&
          deltaX >= -backward &&
          deltaY >= -left &&
          deltaY <= right
        );

      default:
        // Fallback to UP direction
        return (
          deltaY >= -fov.areaUp &&
          deltaY <= fov.areaDown &&
          deltaX >= -fov.areaLeft &&
          deltaX <= fov.areaRight
        );
    }
  };

  // Calculate fog intensity based on distance from FOV edge (relative to facing direction)
  const getFogIntensity = (
    tileX: number,
    tileY: number,
    playerX: number,
    playerY: number,
    fov: any,
    lookDir: any
  ) => {
    const deltaX = tileX - playerX;
    const deltaY = tileY - playerY;

    let distFromForwardEdge,
      distFromBackwardEdge,
      distFromLeftEdge,
      distFromRightEdge;

    switch (lookDir) {
      case 'UP':
        distFromForwardEdge = Math.abs(deltaY + fov.areaUp); // Distance from forward (up) edge
        distFromBackwardEdge = Math.abs(deltaY - fov.areaDown); // Distance from backward (down) edge
        distFromLeftEdge = Math.abs(deltaX + fov.areaLeft); // Distance from left edge
        distFromRightEdge = Math.abs(deltaX - fov.areaRight); // Distance from right edge
        break;

      case 'DOWN':
        distFromForwardEdge = Math.abs(deltaY - fov.areaUp); // Forward is down (positive Y)
        distFromBackwardEdge = Math.abs(deltaY + fov.areaDown); // Backward is up (negative Y)
        distFromLeftEdge = Math.abs(deltaX - fov.areaRight); // Left is right (positive X)
        distFromRightEdge = Math.abs(deltaX + fov.areaLeft); // Right is left (negative X)
        break;

      case 'LEFT':
        distFromForwardEdge = Math.abs(deltaX + fov.areaUp); // Forward is left (negative X)
        distFromBackwardEdge = Math.abs(deltaX - fov.areaDown); // Backward is right (positive X)
        distFromLeftEdge = Math.abs(deltaY - fov.areaLeft); // Left is down (positive Y)
        distFromRightEdge = Math.abs(deltaY + fov.areaRight); // Right is up (negative Y)
        break;

      case 'RIGHT':
        distFromForwardEdge = Math.abs(deltaX - fov.areaUp); // Forward is right (positive X)
        distFromBackwardEdge = Math.abs(deltaX + fov.areaDown); // Backward is left (negative X)
        distFromLeftEdge = Math.abs(deltaY + fov.areaRight); // Left is up (negative Y)
        distFromRightEdge = Math.abs(deltaY - fov.areaLeft); // Right is down (positive Y)
        break;

      default:
        // Fallback to UP direction
        distFromForwardEdge = Math.abs(deltaY + fov.areaUp);
        distFromBackwardEdge = Math.abs(deltaY - fov.areaDown);
        distFromLeftEdge = Math.abs(deltaX + fov.areaLeft);
        distFromRightEdge = Math.abs(deltaX - fov.areaRight);
    }

    // Find the minimum distance to any edge
    const minDistToEdge = Math.min(
      distFromForwardEdge,
      distFromBackwardEdge,
      distFromLeftEdge,
      distFromRightEdge
    );

    // Create gradient effect: closer to edge = less visibility
    if (minDistToEdge <= 1) {
      return 0.3; // Slightly visible at the very edge
    }

    return 1.0; // Fully visible in center
  };

  // Initialize and load textures
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

  const playerRenderAttack = () => {
    if (!world) return;
    let entity = world?.player;
    if (!entity.lastAttackArray || entity.lastAttackArray.length == 0) return;
    entity.lastAttackArray.map((tile, i) => {
      fadingTilesRef.current.push({
        x: tile.x,
        y: tile.y,
        alpha: 0.5,
      });
    });
    setAttackTrigger((prev) => (prev == 0 ? prev + 1 : prev - 1));
    entity.lastAttackArray = [];
  };

  const animateAttack = () => {
    if (!world) return;
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (fadingTilesRef.current.length == 0) return;

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
      }))
      .filter((tile) => tile.alpha > 0);

    fadingTilesRef.current.map((tile, i) => {
      ctx.globalAlpha = tile.alpha;
      const x = tile.x;
      const y = tile.y;
      const screenX = (x - offsetX) * tileSize;
      const screenY = (y - offsetY) * tileSize;
      ctx.fillStyle = 'rgba(255, 0, 0)';
      ctx.fillRect(screenX, screenY, tileSize, tileSize);
    });
    ctx.globalAlpha = 1.0;
    renderOverlayCountRef.current += 1;
  };

  const renderHealthBar = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    currentHealth: number,
    maxHealth: number,
    width: number = tileSize,
    height: number = 6
  ) => {
    const healthBarY = y - height - 2;
    const healthPercentage = Math.max(0, currentHealth / maxHealth);

    ctx.fillStyle = '#333';
    ctx.fillRect(x, healthBarY, width, height);

    const healthWidth = width * healthPercentage;
    if (healthPercentage > 0.6) {
      ctx.fillStyle = '#4CAF50';
    } else if (healthPercentage > 0.3) {
      ctx.fillStyle = '#FF9800';
    } else {
      ctx.fillStyle = '#F44336';
    }
    ctx.fillRect(x, healthBarY, healthWidth, height);

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, healthBarY, width, height);
  };

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
          const isVisible = isVisibleTile(
            x,
            y,
            cameraX,
            cameraY,
            world.player.character.areaSize,
            world.player.lookDir
          );

          if (isVisible) {
            // Render visible tiles normally
            const texture = textureManagerRef.current?.getTexture(tile);
            const fogIntensity = getFogIntensity(
              x,
              y,
              cameraX,
              cameraY,
              world.player.character.areaSize,
              world.player.lookDir
            );

            if (texture) {
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

            // Apply fog gradient at the edges of vision
            if (fogIntensity < 1.0) {
              ctx.fillStyle = `rgba(20, 20, 40, ${0.7 * (1 - fogIntensity)})`;
              ctx.fillRect(screenX, screenY, tileSize, tileSize);
            }
          } else {
            // Render fog of war for non-visible tiles
            ctx.fillStyle = '#000000';
            ctx.fillRect(screenX, screenY, tileSize, tileSize);

            // Add animated fog texture
            const time = Date.now() * 0.001;
            const fogAnimation = Math.sin(time + x * 0.5 + y * 0.3) * 0.1;
            ctx.fillStyle = `rgba(25, 25, 45, ${0.8 + fogAnimation})`;
            ctx.fillRect(screenX, screenY, tileSize, tileSize);

            // Add subtle noise pattern
            ctx.fillStyle = `rgba(40, 40, 70, ${0.3 + Math.random() * 0.1})`;
            ctx.fillRect(
              screenX + Math.random() * 4,
              screenY + Math.random() * 4,
              tileSize - 8,
              tileSize - 8
            );
          }

          // Render player (always visible)
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

            renderHealthBar(
              ctx,
              screenX,
              screenY,
              world.player.character.healthBar,
              world.player.character.maxHealthBar
            );
          }
        }
      });
    });
    playerRenderAttack();
    renderCountRef.current += 1;
  };

  const enemiesRenderAttack = () => {
    if (!world) return;
    const room = world.map.rooms[world.map.currentRoom];
    room.entities.forEach((entity) => {
      if (!entity.lastAttackArray || entity.lastAttackArray.length == 0) return;
      entity.lastAttackArray.map((tile, i) => {
        fadingTilesRef.current.push({
          x: tile.x,
          y: tile.y,
          alpha: 0.5,
        });
      });
      entity.lastAttackArray = [];
      setAttackTrigger((prev) => (prev == 0 ? prev + 1 : prev - 1));
    });
  };

  const renderEnemies = () => {
    if (!world || !enemyCanvasRef.current || !textureManagerRef.current) return;

    const room = world.map.rooms[world.map.currentRoom];
    if (room.entities.empty()) return;

    const canvas = enemyCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const viewportWidth = Math.floor(canvas.width / tileSize);
    const viewportHeight = Math.floor(canvas.height / tileSize);

    const cameraX = world.player.x;
    const cameraY = world.player.y;

    const offsetX = cameraX - Math.floor(viewportWidth / 2);
    const offsetY = cameraY - Math.floor(viewportHeight / 2);

    room.entities.forEach((entity) => {
      const screenX = (entity.x - offsetX) * tileSize;
      const screenY = (entity.y - offsetY) * tileSize;

      // Check if entity is within screen bounds and player's FOV
      const isOnScreen =
        screenX > -tileSize &&
        screenX < canvas.width &&
        screenY > -tileSize &&
        screenY < canvas.height;

      const isVisible = isVisibleTile(
        entity.x,
        entity.y,
        cameraX,
        cameraY,
        world.player.character.areaSize,
        world.player.lookDir
      );

      if (isOnScreen && isVisible) {
        let texture;
        if (entity.texture) {
          texture = textureManagerRef.current?.getTexture(entity.texture);
        }
        if (texture) {
          ctx.drawImage(texture, screenX, screenY, tileSize, tileSize);
        } else {
          ctx.fillStyle = '#0afa0a';
          ctx.fillRect(screenX, screenY, tileSize, tileSize);
        }

        renderHealthBar(
          ctx,
          screenX,
          screenY,
          entity.character.healthBar,
          entity.character.maxHealthBar
        );
      }
    });
    renderEnemyCountRef.current += 1;
    enemiesRenderAttack();
  };

  useEffect(() => {
    let animationFrameId: number;

    const loop = (timestamp: number) => {
      renderEnemies();
      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [world, attackTrigger]);

  useEffect(() => {
    let animationFrameId: number;

    const loop = (timestamp: number) => {
      animateAttack();
      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [attackTrigger]);

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

        if (enemyCanvasRef.current) {
          enemyCanvasRef.current.width = gameFieldWidth;
          enemyCanvasRef.current.height = gamefieldRef.current.clientHeight;

          requestAnimationFrame(renderEnemies);
        }

        if (overlayCanvasRef.current) {
          overlayCanvasRef.current.width = gameFieldWidth;
          overlayCanvasRef.current.height = gamefieldRef.current.clientHeight;

          requestAnimationFrame(animateAttack);
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
    if (!enemyCanvasRef.current) return;

    const canvas = enemyCanvasRef.current;
    const observer = new ResizeObserver(() => {
      renderEnemies();
    });

    observer.observe(canvas);
    return () => observer.disconnect();
  }, [world]);

  useEffect(() => {
    if (!overlayCanvasRef.current) return;

    const canvas = overlayCanvasRef.current;
    const observer = new ResizeObserver(() => {
      animateAttack();
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
          <canvas ref={enemyCanvasRef} className="overlay-canvas" />
          <canvas ref={overlayCanvasRef} className="overlay-canvas" />
          <div
            style={{
              position: 'absolute',
              left: world.player.x * tileSize,
              top:
                Math.floor((canvasRef.current?.height || 600) / 2) -
                world.player.y * tileSize,
              pointerEvents: 'none',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          ></div>
          <div className="camera-info">
            Player position: ({world.player.x}, {world.player.y}) | Room id:{' '}
            {world.map.currentRoom} | Tile size: {tileSize}px | Renders:{' '}
            {renderCountRef.current} | Overlay renders:{' '}
            {renderOverlayCountRef.current} | Overlay enemy renders:{' '}
            {renderEnemyCountRef.current}
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
