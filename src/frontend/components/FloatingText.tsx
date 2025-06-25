import React, { useEffect, useState } from 'react';
import { FloatingText as FloatingTextType } from '../../common/interfaces';

interface FloatingTextProps {
  text: FloatingTextType;
  tileSize: number;
  offsetX: number;
  offsetY: number;
}

const FloatingText: React.FC<FloatingTextProps> = ({
  text,
  tileSize,
  offsetX,
  offsetY,
}) => {
  const [opacity, setOpacity] = useState(1);
  const [yOffset, setYOffset] = useState(0);

  useEffect(() => {
    const startTime = text.startTime;
    const duration = text.duration;

    const animationInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      setOpacity(1 - progress);
      setYOffset(-progress * 30);

      if (progress >= 1) {
        clearInterval(animationInterval);
      }
    }, 16);

    return () => clearInterval(animationInterval);
  }, [text.startTime, text.duration]);

  const pixelX = (text.x - offsetX) * tileSize + tileSize / 2;
  const pixelY = (text.y - offsetY) * tileSize + tileSize / 2 + yOffset;

  return (
    <div
      className={`floating-text floating-text-${text.type}`}
      style={{
        position: 'absolute',
        left: pixelX,
        top: pixelY,
        opacity: opacity,
        color: text.color,
        fontSize: '14px',
        fontWeight: 'bold',
        textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)',
        pointerEvents: 'none',
        transform: 'translateX(-50%)',
        zIndex: 1000,
      }}
    >
      {text.text}
    </div>
  );
};

export default FloatingText;
