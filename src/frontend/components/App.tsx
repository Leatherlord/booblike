import React, { useEffect, useState, useRef, ReactNode } from 'react';
import GameField from './GameField';
import Inventory from './Inventory';
import UpgradeMenu from './UpgradeMenu';
import DeathModal from './DeathModal';
import { useWorld } from '../../common/context/WorldContext';
import { Event } from '../../common/events';

const App: React.FC = () => {
  const { world, handleEvent, restartGame } = useWorld();
  const lastEventTimeRef = useRef<number>(0);
  const [isUpgradeMenuOpen, setIsUpgradeMenuOpen] = useState(false);

  const handleSelectSlot = (slotId: number) => {
    if (!world) return;

    handleEvent({
      type: 'inventory_select',
      slotId,
    });
  };

  const handlePurchaseUpgrade = (upgradeId: string) => {
    handleEvent({
      type: 'purchase_upgrade',
      upgradeId,
    });
  };

  const toggleUpgradeMenu = () => {
    setIsUpgradeMenuOpen(!isUpgradeMenuOpen);
  };

  useEffect(() => {
    if (!world) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!world) return;
      
      if (world.player.character.healthBar <= 0) return;
      
      if (e.key >= '0' && e.key <= '9') {
        const slotNumber = parseInt(e.key, 10);
        handleEvent({
          type: 'inventory_select',
          slotId: slotNumber,
        });
        return;
      }

      if (e.key.toLowerCase() === 'u') {
        toggleUpgradeMenu();
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
            weaponChosen: world.player.activeSlot,
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
  }, [world, handleEvent, isUpgradeMenuOpen]);

  const getExperienceProgressPercentage = () => {
    if (!world || world.player.experienceToNext === 0) return 0;
    return (world.player.experience / world.player.experienceToNext) * 100;
  };

  const getHealthPercentage = () => {
    if (!world || world.player.character.maxHealthBar === 0) return 0;
    return (world.player.character.healthBar / world.player.character.maxHealthBar) * 100;
  };

  return (
    <div className="game-container">
      <div className="hud top-hud">
        <div className="hud-content">
          <span className="hud-item">Score: 0</span>
          <span className="hud-item">Level: {world?.player.level}</span>
          {world && (
            <>
              <div className="health-bar-container">
                <div className="health-label">Health</div>
                <div className="health-bar">
                  <div 
                    className="health-fill"
                    style={{ width: `${getHealthPercentage()}%` }}
                  />
                  <div className="health-text">
                    {Math.ceil(world.player.character.healthBar)}/{Math.ceil(world.player.character.maxHealthBar)}
                  </div>
                </div>
              </div>
              <span className="hud-item">
                EXP: {world.player.experience}/{world.player.experienceToNext}
              </span>
              <span className="hud-item">
                Available EXP: {world.player.availableExperience}
              </span>
              <span className="hud-item">
                FOV: {world.player.character.areaSize.areaUp + world.player.character.areaSize.areaDown + 1}×{world.player.character.areaSize.areaLeft + world.player.character.areaSize.areaRight + 1}
              </span>
              <span className="hud-item">
                Player: ({world.player.x}, {world.player.y})
              </span>
            </>
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
          <div className="hud-content">
            <button 
              className="upgrade-menu-button"
              onClick={toggleUpgradeMenu}
            >
              Upgrades (U)
            </button>
            {world && (
              <div className="experience-bar-container">
                <div className="experience-label">Experience Progress</div>
                <div className="experience-bar">
                  <div 
                    className="experience-fill"
                    style={{ width: `${getExperienceProgressPercentage()}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="hud bottom-hud">
        <div className="hud-content">
          <div className="hud-item">Use arrow keys to move the player</div>
          <div className="hud-item">Press 0-9 to select inventory slots</div>
          <div className="hud-item">Press SPACE to attack</div>
          <div className="hud-item">Press U to open upgrades menu</div>
        </div>
      </div>

      {world && (
        <UpgradeMenu
          isOpen={isUpgradeMenuOpen}
          availableExperience={world.player.availableExperience}
          upgrades={world.availableUpgrades}
          onPurchaseUpgrade={handlePurchaseUpgrade}
          onClose={() => setIsUpgradeMenuOpen(false)}
        />
      )}

      {world && (
        <DeathModal
          isOpen={world.player.character.healthBar <= 0}
          onRestart={restartGame}
        />
      )}
    </div>
  );
};

export default App;
