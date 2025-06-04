import React, { useEffect, useState, useRef, ReactNode } from 'react';
import GameField from './GameField';
import Inventory from './Inventory';
import TexturePackSelector from './TexturePackSelector';
import { useWorld } from '../../common/context/WorldContext';
import { Event } from '../../common/events';
import { TexturePack } from '../types/texturePack';
import { TexturePackScanner } from '../utils/texturePackScanner';
import { Entity, Point2d, World } from '../../common/interfaces';

export interface AttackTilesProps {
  player?: Entity,
  entity?: Entity,
  tile_size?: number,
  canvas_size?: Point2d
}

const AttackTiles: React.FC<AttackTilesProps> = 
({ player, entity, tile_size = 32, canvas_size = { x: 800, y: 600 } }) => {
  if (!player || !entity || !entity.lastAttackArray) return null;

  return (
    <div 
      className="damage-effect"
    >
      {entity.lastAttackArray.map((tile, i) => {
        const dx =  tile.x;
        const dy = tile.y;

        const screenX = (dx)*tile_size;
        const screenY = (dy)*tile_size;

        return (
          <div 
            key={'attackTile' + i}
            className="attack-tile"
            style={{
              position: 'absolute',
              left: screenX,
              top: screenY,
              width: tile_size,
              height: tile_size,
              backgroundColor: 'rgba(255, 0, 0, 0.5)',
              pointerEvents: 'none',
            }}>
            <p style={{ textAlign: 'center', margin: 0 }}>{dx}, {dy}</p>
          </div>
        );
      })}
    </div>
  );
};

const App: React.FC = () => {
  const { world, handleEvent } = useWorld();
  const lastEventTimeRef = useRef<number>(0);
  const [selectedTexturePack, setSelectedTexturePack] =
    useState<TexturePack | null>(null);
  const [showTexturePackSelector, setShowTexturePackSelector] = useState(true);
  const [isLoadingTexturePacks, setIsLoadingTexturePacks] = useState(true);
  const [damageEffectKey, setDamageEffectKey] = useState(0);

  useEffect(() => {
    const loadDefaultPack = async () => {
      try {
        const scanResult = await TexturePackScanner.scanTexturePacks();
        setIsLoadingTexturePacks(false);
      } catch (error) {
        console.error('Failed to scan texture packs:', error);
        setSelectedTexturePack({
          id: 'default',
          name: 'Default Textures',
          textures: {
            floor: '/resources/floor.png',
            wall: '/resources/wall.png',
            door: '/resources/door.png',
            player: '/resources/player.png',
          },
        });
        setShowTexturePackSelector(false);
        setIsLoadingTexturePacks(false);
      }
    };

    loadDefaultPack();
  }, []);

  const handleTexturePackSelected = (pack: TexturePack) => {
    setSelectedTexturePack(pack);
    setShowTexturePackSelector(false);
  };

  const handleSelectSlot = (slotId: number) => {
    if (!world) return;

    handleEvent({
      type: 'inventory_select',
      slotId,
    });
  };

  useEffect(() => {
    if (!world) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!world) return;
      if (e.key >= '0' && e.key <= '9') {
        const slotNumber = parseInt(e.key, 10);
        handleEvent({
          type: 'inventory_select',
          slotId: slotNumber,
        });
        return;
      }

      const now = Date.now();
      if (now - lastEventTimeRef.current < 100) {
        return;
      }
      
      let event: Event;

      switch (e.key) {
        case 'ArrowUp':
          event = {
            type: 'player_move',
            direction: 'up',
          };
          break;
        case 'ArrowDown':
          event = {
            type: 'player_move',
            direction: 'down',
          };
          break;
        case 'ArrowLeft':
          event = {
            type: 'player_move',
            direction: 'left',
          };
          break;
        case 'ArrowRight':
          event = {
            type: 'player_move',
            direction: 'right',
          };
          break;
        case ' ':
          event = {
            type: 'player_attack',
            timeStarted: Date.now()
          };
          setDamageEffectKey(prev => prev == 1 ? prev + 1 : prev - 1);
          break;
        default:
          return;
      }

      lastEventTimeRef.current = now;
      handleEvent(event);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [world, handleEvent]);

  if (isLoadingTexturePacks) {
    return (
      <div className="loading-screen">
        <h2>Loading Game...</h2>
        <p>Preparing texture pack system...</p>
      </div>
    );
  }

  if (showTexturePackSelector) {
    return (
      <TexturePackSelector
        onPackSelected={handleTexturePackSelected}
        onCancel={() => {
          const defaultPack = {
            id: 'default',
            name: 'Default Textures',
            textures: {
              floor: '/resources/floor.png',
              wall: '/resources/wall.png',
              door: '/resources/door.png',
              player: '/resources/player.png',
            },
          };
          handleTexturePackSelected(defaultPack);
        }}
      />
    );
  }

  return (
    <div className="game-container">

      <div className="hud top-hud">
        <div className="hud-content">
          <span className="hud-item">Score: 0</span>
          <span className="hud-item">Level: {world?.player.level}</span>
          {world && (
            <span className="hud-item">
              Player: ({world.player.x}, {world.player.y})
            </span>
          )}
          {selectedTexturePack && (
            <span className="hud-item">Pack: {selectedTexturePack.name}</span>
          )}
        </div>
      </div>

      <div className="main-area">
        <div className="hud left-hud">
          <div className="hud-content">
            {world && (
              <Inventory
                activeSlot={world.player.activeSlot}
                slots={world.player.slots}
                onSelectSlot={handleSelectSlot}
              />
            )}
          </div>
        </div>

        <GameField world={world} selectedTexturePack={selectedTexturePack}>
            <AttackTiles key = {damageEffectKey}
              player={world?.player}
              entity={world?.player} 
            />
        </GameField>

        <div className="hud right-hud">
          <div className="hud-content"></div>
        </div>
      </div>

      <div className="hud bottom-hud">
        <div className="hud-content">
          <div className="hud-item">Use arrow keys to move the player</div>
          <div className="hud-item">Press 0-9 to select inventory slots</div>
          <div className="hud-item">Press SPACE to attack</div>
        </div>
      </div>
    </div>
  );
};

export default App;
