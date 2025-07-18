import React, { useRef, useEffect, useState, useLayoutEffect } from 'react';
import { Point2d, World } from '../../common/interfaces';
import { TextureManager } from '../utils/TextureManager';
import { TexturePack } from '../types/texturePack';
import FloatingText from './FloatingText';

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

    let forward, backward, left, right;

    switch (lookDir) {
      case 'UP':
        forward = fov.areaUp;
        backward = fov.areaDown;
        left = fov.areaLeft;
        right = fov.areaRight;
        return (
          deltaY >= -forward &&
          deltaY <= backward &&
          deltaX >= -left &&
          deltaX <= right
        );

      case 'DOWN':
        forward = fov.areaUp;
        backward = fov.areaDown;
        left = fov.areaRight;
        right = fov.areaLeft;

        return (
          deltaY <= forward &&
          deltaY >= -backward &&
          deltaX >= -left &&
          deltaX <= right
        );

      case 'LEFT':
        forward = fov.areaUp;
        backward = fov.areaDown;
        left = fov.areaLeft;
        right = fov.areaRight;

        return (
          deltaX >= -forward &&
          deltaX <= backward &&
          deltaY <= left &&
          deltaY >= -right
        );

      case 'RIGHT':
        forward = fov.areaUp;
        backward = fov.areaDown;
        left = fov.areaRight;
        right = fov.areaLeft;

        return (
          deltaX <= forward &&
          deltaX >= -backward &&
          deltaY >= -left &&
          deltaY <= right
        );

      default:
        return (
          deltaY >= -fov.areaUp &&
          deltaY <= fov.areaDown &&
          deltaX >= -fov.areaLeft &&
          deltaX <= fov.areaRight
        );
    }
  };

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
        distFromForwardEdge = Math.abs(deltaY + fov.areaUp);
        distFromBackwardEdge = Math.abs(deltaY - fov.areaDown);
        distFromLeftEdge = Math.abs(deltaX + fov.areaLeft);
        distFromRightEdge = Math.abs(deltaX - fov.areaRight);
        break;

      case 'DOWN':
        distFromForwardEdge = Math.abs(deltaY - fov.areaUp);
        distFromBackwardEdge = Math.abs(deltaY + fov.areaDown);
        distFromLeftEdge = Math.abs(deltaX - fov.areaRight);
        distFromRightEdge = Math.abs(deltaX + fov.areaLeft);
        break;

      case 'LEFT':
        distFromForwardEdge = Math.abs(deltaX + fov.areaUp);
        distFromBackwardEdge = Math.abs(deltaX - fov.areaDown);
        distFromLeftEdge = Math.abs(deltaY - fov.areaLeft);
        distFromRightEdge = Math.abs(deltaY + fov.areaRight);
        break;

      case 'RIGHT':
        distFromForwardEdge = Math.abs(deltaX - fov.areaUp);
        distFromBackwardEdge = Math.abs(deltaX + fov.areaDown);
        distFromLeftEdge = Math.abs(deltaY + fov.areaRight);
        distFromRightEdge = Math.abs(deltaY - fov.areaLeft);
        break;

      default:
        distFromForwardEdge = Math.abs(deltaY + fov.areaUp);
        distFromBackwardEdge = Math.abs(deltaY - fov.areaDown);
        distFromLeftEdge = Math.abs(deltaX + fov.areaLeft);
        distFromRightEdge = Math.abs(deltaX - fov.areaRight);
    }

    const minDistToEdge = Math.min(
      distFromForwardEdge,
      distFromBackwardEdge,
      distFromLeftEdge,
      distFromRightEdge
    );

    if (minDistToEdge <= 1) {
      return 0.3;
    }

    return 1.0;
  };

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

  const renderPlayerHalo = () => {
    if (!world) return;
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const viewportWidth = Math.floor(canvas.width / tileSize);
    const viewportHeight = Math.floor(canvas.height / tileSize);
    const cameraX = world.player.x;
    const cameraY = world.player.y;
    const offsetX = cameraX - Math.floor(viewportWidth / 2);
    const offsetY = cameraY - Math.floor(viewportHeight / 2);

    const screenX = (world.player.x - offsetX) * tileSize;
    const screenY = (world.player.y - offsetY) * tileSize;

    const centerX = screenX + tileSize / 2;
    const centerY = screenY + tileSize / 2;
    const haloRadius = tileSize * 0.6;

    // Base halo
    ctx.beginPath();
    ctx.arc(centerX, centerY, haloRadius, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(100, 150, 255, 0.1)';
    ctx.lineWidth = 8;
    ctx.stroke();

    let directionAngle = 0;
    switch (world.player.lookDir) {
      case 'UP':
        directionAngle = -Math.PI / 2;
        break;
      case 'DOWN':
        directionAngle = Math.PI / 2;
        break;
      case 'LEFT':
        directionAngle = Math.PI;
        break;
      case 'RIGHT':
        directionAngle = 0;
        break;
      default:
        directionAngle = -Math.PI / 2;
    }

    // Draw arc
    ctx.beginPath();
    ctx.arc(
      centerX,
      centerY,
      haloRadius,
      directionAngle - Math.PI / 3,
      directionAngle + Math.PI / 3
    );
    ctx.strokeStyle = 'rgba(255, 100, 221, 0.3)';
    ctx.lineWidth = 10;
    ctx.stroke();
  };

  const renderOverlay = () => {
    if (!world) return;
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    renderPlayerHalo();

    if (fadingTilesRef.current.length > 0) {
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

        const attackTexture = textureManagerRef.current?.getTexture('attack');
        if (attackTexture) {
          ctx.drawImage(attackTexture, screenX, screenY, tileSize, tileSize);
        } else {
          ctx.fillStyle = 'rgba(255, 0, 0)';
          ctx.fillRect(screenX, screenY, tileSize, tileSize);
        }
      });
      ctx.globalAlpha = 1.0;
    }

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

            // Render items on the floor
            const itemKey = `${x},${y}`;
            const item =
              world.map.rooms[world.map.currentRoom].items.get(itemKey);
            if (item && tile === 'floor') {
              let itemTexture;
              itemTexture = textureManagerRef.current?.getTexture(item.id);

              if (itemTexture) {
                ctx.drawImage(
                  itemTexture,
                  screenX,
                  screenY,
                  tileSize,
                  tileSize
                );
              } else {
                ctx.fillStyle = '#FFD700';
                ctx.fillRect(
                  screenX + 4,
                  screenY + 4,
                  tileSize - 8,
                  tileSize - 8
                );
                ctx.fillStyle = '#000';
                ctx.font = `${Math.floor(tileSize * 0.5)}px Arial`;
                ctx.textAlign = 'center';
                ctx.fillText(
                  item.name.charAt(0).toUpperCase(),
                  screenX + tileSize / 2,
                  screenY + tileSize / 2 + tileSize * 0.1
                );
              }
            }

            if (fogIntensity < 1.0) {
              ctx.fillStyle = `rgba(20, 20, 40, ${0.7 * (1 - fogIntensity)})`;
              ctx.fillRect(screenX, screenY, tileSize, tileSize);
            }
          } else {
            ctx.fillStyle = '#000000';
            ctx.fillRect(screenX, screenY, tileSize, tileSize);

            const time = Date.now() * 0.001;
            const fogAnimation = Math.sin(time + x * 0.5 + y * 0.3) * 0.1;
            ctx.fillStyle = `rgba(25, 25, 45, ${0.8 + fogAnimation})`;
            ctx.fillRect(screenX, screenY, tileSize, tileSize);

            ctx.fillStyle = `rgba(40, 40, 70, ${0.3 + Math.random() * 0.1})`;
            ctx.fillRect(
              screenX + Math.random() * 4,
              screenY + Math.random() * 4,
              tileSize - 8,
              tileSize - 8
            );
          }

          if (x === cameraX && y === cameraY) {
            const playerTexture = textureManagerRef.current?.getTexture(
              world.player.character.getTexture()
            );
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
    let hasAttacks = false;

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
      hasAttacks = true;
    });

    // Trigger overlay animation if there were any attacks
    if (hasAttacks) {
      setAttackTrigger((prev) => (prev == 0 ? prev + 1 : prev - 1));
    }
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
        if (entity.character.getTexture()) {
          texture = textureManagerRef.current?.getTexture(
            entity.character.getTexture()
          );
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
      if (fadingTilesRef.current.length > 0) {
        renderOverlay();
        animationFrameId = requestAnimationFrame(loop);
      } else {
        renderOverlay();
      }
    };

    if (fadingTilesRef.current.length > 0 || attackTrigger !== 0) {
      animationFrameId = requestAnimationFrame(loop);
    } else {
      renderOverlay();
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [world, tileSize, texturesLoaded, attackTrigger]);

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

          requestAnimationFrame(renderOverlay);
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
      renderOverlay();
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
      renderOverlay();
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
            className="floating-text-container"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
            }}
          >
            {world.floatingTexts?.map((text) => {
              const now = Date.now();
              if (now - text.startTime > text.duration) return null;

              const viewportWidth = Math.floor(
                (canvasRef.current?.width || 800) / tileSize
              );
              const viewportHeight = Math.floor(
                (canvasRef.current?.height || 600) / tileSize
              );
              const cameraX = world.player.x;
              const cameraY = world.player.y;
              const offsetX = cameraX - Math.floor(viewportWidth / 2);
              const offsetY = cameraY - Math.floor(viewportHeight / 2);

              return (
                <FloatingText
                  key={text.id}
                  text={text}
                  tileSize={tileSize}
                  offsetX={offsetX}
                  offsetY={offsetY}
                />
              );
            })}
          </div>

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
