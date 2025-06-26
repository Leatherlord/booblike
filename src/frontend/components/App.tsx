import React, { useEffect, useState, useRef } from 'react';
import GameField from './GameField';
import Inventory from './Inventory';
import TexturePackSelector from './TexturePackSelector';
import SaveGameLoader from './SaveGameLoader';
import UpgradeMenu from './UpgradeMenu';
import DeathModal from './DeathModal';
import { useWorld } from '../../common/context/WorldContext';
import { Event } from '../../common/events';
import { TexturePack } from '../types/texturePack';
import { TexturePackScanner } from '../utils/texturePackScanner';

const App: React.FC = () => {
  const { world, handleEvent, saveGame, restartGame, saveMap } = useWorld();
  const lastEventTimeRef = useRef<number>(0);
  const [selectedTexturePack, setSelectedTexturePack] =
    useState<TexturePack | null>(null);
  const [showTexturePackSelector, setShowTexturePackSelector] = useState(true);
  const [showSaveGameLoader, setShowSaveGameLoader] = useState(false);
  const [isLoadingTexturePacks, setIsLoadingTexturePacks] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [isUpgradeMenuOpen, setIsUpgradeMenuOpen] = useState(false);

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
    setShowSaveGameLoader(true);
  };

  const handleStartNewGame = () => {
    setShowSaveGameLoader(false);
    setGameStarted(true);
  };

  const handleGameLoaded = () => {
    setShowSaveGameLoader(false);
    setGameStarted(true);
  };

  const handleSaveGame = () => {
    try {
      const saveData = saveGame();
      const blob = new Blob([saveData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, '-')
        .slice(0, 19);
      const filename = `booblike-save-${timestamp}.json`;

      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to save game:', error);
      alert('Failed to save game. Please try again.');
    }
  };

  const handleSaveMap = () => {
    try {
      const mapData = saveMap();
      const blob = new Blob([mapData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, '-')
        .slice(0, 19);
      const filename = `booblike-map-${timestamp}.json`;

      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to save map:', error);
      alert('Failed to save map. Please try again.');
    }
  };

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

  const getExperienceProgressPercentage = () => {
    if (!world || world.player.experienceToNext === 0) return 0;
    return (world.player.experience / world.player.experienceToNext) * 100;
  };

  const getHealthPercentage = () => {
    if (!world || world.player.character.maxHealthBar === 0) return 0;
    return (
      (world.player.character.healthBar / world.player.character.maxHealthBar) *
      100
    );
  };

  useEffect(() => {
    if (!world || !gameStarted) return;

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

      if (e.key.toLowerCase() === 'z') {
        handleEvent({
          type: 'inventory_use',
          slotId: world.player.activeSlot,
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
  }, [world, handleEvent, gameStarted, isUpgradeMenuOpen]);

  useEffect(() => {
    if (
      world &&
      !gameStarted &&
      !showTexturePackSelector &&
      !showSaveGameLoader
    ) {
      setGameStarted(true);
    }
  }, [world, gameStarted, showTexturePackSelector, showSaveGameLoader]);

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

  if (showSaveGameLoader) {
    return (
      <SaveGameLoader
        onStartNewGame={handleStartNewGame}
        onGameLoaded={handleGameLoaded}
        onMapLoaded={handleGameLoaded}
      />
    );
  }

  if (!gameStarted || !world) {
    return (
      <div className="loading-screen">
        <h2>Starting Game...</h2>
      </div>
    );
  }

  return (
    <div className="game-container">
      <div className="hud top-hud">
        <div className="hud-content">
          <div className="hud-left-group">
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
                      {Math.ceil(world.player.character.healthBar)}/
                      {Math.ceil(world.player.character.maxHealthBar)}
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
                  FOV:{' '}
                  {world.player.character.areaSize.areaUp +
                    world.player.character.areaSize.areaDown +
                    1}
                  ×
                  {world.player.character.areaSize.areaLeft +
                    world.player.character.areaSize.areaRight +
                    1}
                </span>
                <span className="hud-item">
                  Stats: S:{world.player.character.characteristics.s}(
                  {world.player.character.baseCharacteristics.s}) P:
                  {world.player.character.characteristics.p} E:
                  {world.player.character.characteristics.e} A:
                  {world.player.character.characteristics.a} I:
                  {world.player.character.characteristics.i}
                </span>
                <span className="hud-item">
                  Weapon:{' '}
                  {world.player.slots.find(
                    (slot) => slot.id === world.player.activeSlot
                  )?.item?.name || 'None'}
                </span>
                <span className="hud-item">
                  Player: ({world.player.x}, {world.player.y})
                </span>
              </>
            )}
            {selectedTexturePack && (
              <span className="hud-item">Pack: {selectedTexturePack.name}</span>
            )}
          </div>

          <div className="save-buttons">
            <button
              onClick={handleSaveGame}
              className="save-button"
              title="Save Game"
            >
              💾 Save Game
            </button>
            <button
              onClick={handleSaveMap}
              className="save-button"
              title="Save Map"
            >
              🗺️ Save Map
            </button>
          </div>
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

        <GameField world={world} selectedTexturePack={selectedTexturePack} />

        <div className="hud right-hud">
          <div className="hud-content">
            <button className="upgrade-menu-button" onClick={toggleUpgradeMenu}>
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
          <div className="hud-item">💾 Save Game | 🗺️ Save Map</div>
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
