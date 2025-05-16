import React from 'react';

const App: React.FC = () => {
  return (
    <div className="game-container">
      <div className="hud top-hud">
        <div className="hud-content">
          <span className="hud-item">Score: 0</span>
          <span className="hud-item">Level: 1</span>
        </div>
      </div>

      <div className="main-area">
        <div className="hud left-hud">
          <div className="hud-content"></div>
        </div>

        <div className="game-field"></div>

        <div className="hud right-hud">
          <div className="hud-content"></div>
        </div>
      </div>

      <div className="hud bottom-hud">
        <div className="hud-content"></div>
      </div>
    </div>
  );
};

export default App;
