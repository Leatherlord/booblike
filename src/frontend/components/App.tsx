import React, { useEffect, useState, useRef } from 'react';
import GameField from './GameField';
import Inventory from './Inventory';
import { useWorld } from '../../common/context/WorldContext';
import { Event } from '../../common/events';

const App: React.FC = () => {
  const { world, handleEvent } = useWorld();
  const lastEventTimeRef = useRef<number>(0);

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

        <GameField world={world} />

        <div className="hud right-hud">
          <div className="hud-content"></div>
        </div>
      </div>

      <div className="hud bottom-hud">
        <div className="hud-content">
          <div className="hud-item">Use arrow keys to move the player</div>
          <div className="hud-item">Press 0-9 to select inventory slots</div>
        </div>
      </div>
    </div>
  );
};

export default App;
