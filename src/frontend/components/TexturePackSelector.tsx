import React, { useState, useEffect } from 'react';
import { TexturePack } from '../types/texturePack';
import { TexturePackScanner } from '../utils/texturePackScanner';

interface TexturePackSelectorProps {
  onPackSelected: (pack: TexturePack) => void;
  onCancel?: () => void;
}

const TexturePackSelector: React.FC<TexturePackSelectorProps> = ({
  onPackSelected,
  onCancel,
}) => {
  const [packs, setPacks] = useState<TexturePack[]>([]);
  const [selectedPack, setSelectedPack] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [packNameInput, setPackNameInput] = useState<string>('');
  const [loadingCustomPack, setLoadingCustomPack] = useState(false);
  const [customPackError, setCustomPackError] = useState<string | null>(null);

  useEffect(() => {
    const loadTexturePacks = async () => {
      try {
        setLoading(true);
        const scanResult = await TexturePackScanner.scanTexturePacks();
        setPacks(scanResult.available);
        setSelectedPack(scanResult.default);
        setError(null);
      } catch (err) {
        setError('Failed to load default texture pack');
        console.error('Error loading default texture pack:', err);
      } finally {
        setLoading(false);
      }
    };

    loadTexturePacks();
  }, []);

  const handleLoadCustomPack = async () => {
    if (!packNameInput.trim()) {
      setCustomPackError('Please enter a pack name');
      return;
    }

    setLoadingCustomPack(true);
    setCustomPackError(null);

    try {
      const customPack = await TexturePackScanner.loadTexturePackByName(
        packNameInput.trim()
      );

      if (customPack) {
        const existingPack = packs.find((p) => p.id === customPack.id);
        if (existingPack) {
          setCustomPackError('This texture pack is already loaded');
        } else {
          setPacks((prevPacks) => [...prevPacks, customPack]);
          setSelectedPack(customPack.id);
          setPackNameInput('');
          setCustomPackError(null);
        }
      } else {
        setCustomPackError(
          'Texture pack not found. The folder /resources/[pack-name]/ should exist and contain at least one texture file.'
        );
      }
    } catch (err) {
      setCustomPackError(
        err instanceof Error ? err.message : 'Failed to load texture pack'
      );
      console.error('Error loading custom texture pack:', err);
    } finally {
      setLoadingCustomPack(false);
    }
  };

  const handleInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLoadCustomPack();
    }
  };

  const handleSelect = () => {
    const pack = packs.find((p) => p.id === selectedPack);
    if (pack) {
      onPackSelected(pack);
    }
  };

  if (loading) {
    return (
      <div className="texture-pack-selector-overlay">
        <div className="texture-pack-selector">
          <h2>Loading Texture Packs...</h2>
          <div className="loading-spinner">⚙️</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="texture-pack-selector-overlay">
        <div className="texture-pack-selector">
          <h2>Error</h2>
          <p>{error}</p>
          <div className="button-group">
            {onCancel && (
              <button onClick={onCancel} className="button">
                Continue with default
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="texture-pack-selector-overlay">
      <div className="texture-pack-selector">
        <h2>Select Texture Pack</h2>
        <p>Choose a texture pack for your game or load a custom one:</p>

        <div className="custom-pack-loader">
          <h3>Load Custom Texture Pack</h3>
          <div className="pack-input-group">
            <input
              type="text"
              value={packNameInput}
              onChange={(e) => setPackNameInput(e.target.value)}
              onKeyPress={handleInputKeyPress}
              placeholder="Enter pack name (e.g., 'retro', 'pixel')"
              className="pack-name-input"
              disabled={loadingCustomPack}
            />
            <button
              onClick={handleLoadCustomPack}
              disabled={loadingCustomPack || !packNameInput.trim()}
              className="button secondary"
            >
              {loadingCustomPack ? 'Loading...' : 'Try Load'}
            </button>
          </div>
          {customPackError && (
            <div className="error-message">{customPackError}</div>
          )}
          <small className="pack-hint">
            Pack folder: /resources/[pack-name]/. Include any of: floor.png,
            wall.png, door.png, player.png. Missing textures will use defaults.
          </small>
        </div>

        <div className="texture-packs-list">
          {packs.map((pack) => (
            <div
              key={pack.id}
              className={`texture-pack-item ${selectedPack === pack.id ? 'selected' : ''}`}
              onClick={() => setSelectedPack(pack.id)}
            >
              <div className="pack-info">
                <h3>{pack.name}</h3>
                {pack.description && (
                  <p className="pack-description">{pack.description}</p>
                )}
                {pack.author && (
                  <small className="pack-author">by {pack.author}</small>
                )}
                {pack.version && (
                  <small className="pack-version">v{pack.version}</small>
                )}
              </div>
              <div className="pack-preview">
                <div className="preview-grid">
                  {Object.entries(pack.textures)
                    .slice(0, 4)
                    .map(([type, path]) => (
                      <img
                        key={type}
                        src={path}
                        alt={type}
                        className="preview-texture"
                        title={type}
                      />
                    ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="button-group">
          <button
            onClick={handleSelect}
            disabled={!selectedPack}
            className="button primary"
          >
            Select Pack
          </button>
          {onCancel && (
            <button onClick={onCancel} className="button secondary">
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TexturePackSelector;
