import React, { useEffect, useState, useRef, ReactNode } from 'react';
import GameField from './GameField';
import Inventory from './Inventory';
import { useWorld } from '../../common/context/WorldContext';
import { Event } from '../../common/events';
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
  const [damageEffectKey, setDamageEffectKey] = useState(0);

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

        <GameField world={world}>
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
