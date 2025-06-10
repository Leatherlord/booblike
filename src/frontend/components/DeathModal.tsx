import React from 'react';

interface DeathModalProps {
  isOpen: boolean;
  onRestart: () => void;
}

const DeathModal: React.FC<DeathModalProps> = ({ isOpen, onRestart }) => {
  if (!isOpen) return null;

  return (
    <div className="death-modal-overlay">
      <div className="death-modal">
        <div className="death-modal-content">
          <h2 className="death-title">💀 YOU DIED 💀</h2>
          <p className="death-message">
            Your adventure has come to an end, but death is not the final chapter.
          </p>
          <p className="death-encouragement">
            Rise again, hero. The dungeon awaits your return.
          </p>
          <button className="restart-button" onClick={onRestart}>
            RESTART
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeathModal; 