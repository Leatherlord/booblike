import React from 'react';
import { UpgradeOption } from '../../common/interfaces';

interface UpgradeMenuProps {
  isOpen: boolean;
  availableExperience: number;
  upgrades: UpgradeOption[];
  onPurchaseUpgrade: (upgradeId: string) => void;
  onClose: () => void;
}

const UpgradeMenu: React.FC<UpgradeMenuProps> = ({
  isOpen,
  availableExperience,
  upgrades,
  onPurchaseUpgrade,
  onClose,
}) => {
  if (!isOpen) return null;

  const handleUpgradeClick = (upgradeId: string, cost: number) => {
    if (availableExperience >= cost) {
      onPurchaseUpgrade(upgradeId);
    }
  };

  return (
    <div className="upgrade-menu-overlay">
      <div className="upgrade-menu">
        <div className="upgrade-menu-header">
          <h2>Character Upgrades</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="upgrade-menu-content">
          <div className="experience-info">
            <span className="experience-amount">
              Available Experience: {availableExperience}
            </span>
          </div>

          <div className="upgrades-list">
            {upgrades.length === 0 ? (
              <div className="no-upgrades">All characteristics maxed out!</div>
            ) : (
              upgrades.map((upgrade) => (
                <div
                  key={upgrade.id}
                  className={`upgrade-item ${availableExperience >= upgrade.cost ? 'affordable' : 'expensive'}`}
                >
                  <div className="upgrade-info">
                    <div className="upgrade-name">{upgrade.name}</div>
                    <div className="upgrade-description">
                      {upgrade.description}
                    </div>
                    <div className="upgrade-stats">
                      Level: {upgrade.currentLevel}/{upgrade.maxLevel}
                    </div>
                  </div>
                  <div className="upgrade-actions">
                    <div className="upgrade-cost">Cost: {upgrade.cost} EXP</div>
                    <button
                      className="upgrade-button"
                      disabled={availableExperience < upgrade.cost}
                      onClick={() =>
                        handleUpgradeClick(upgrade.id, upgrade.cost)
                      }
                    >
                      Upgrade
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradeMenu;
