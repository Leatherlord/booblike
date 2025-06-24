import React, { useState, useRef } from 'react';
import { useWorld } from '../../common/context/WorldContext';

interface SaveGameLoaderProps {
  onStartNewGame: () => void;
  onGameLoaded?: () => void;
}

const SaveGameLoader: React.FC<SaveGameLoaderProps> = ({
  onStartNewGame,
  onGameLoaded,
}) => {
  const { loadGame } = useWorld();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLoadGame = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const text = await file.text();
      loadGame(text);
      onGameLoaded?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load save file');
      console.error('Error loading save file:', err);
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleLoadButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="save-game-loader">
      <div className="save-game-loader-content">
        <h2>Start Game</h2>
        <p>Choose how you want to start playing:</p>

        <div className="game-options">
          <button onClick={onStartNewGame} className="button primary">
            Start New Game
          </button>

          <div className="load-game-section">
            <button
              onClick={handleLoadButtonClick}
              disabled={loading}
              className="button secondary"
            >
              {loading ? 'Loading...' : 'Load Saved Game'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleLoadGame}
              style={{ display: 'none' }}
            />
          </div>
        </div>

        {error && (
          <div className="error-message">
            <strong>Error:</strong> {error}
          </div>
        )}

        <div className="load-instructions">
          <small>
            To load a saved game, select a .json file that was previously saved
            from the game.
          </small>
        </div>
      </div>
    </div>
  );
};

export default SaveGameLoader;
