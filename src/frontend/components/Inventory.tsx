import React, { useRef, useEffect } from 'react';
import { useWorld } from '../../common/context/WorldContext';

type InventorySlot = {
  id: number;
  item?: {
    name: string;
    icon?: string;
  };
};

type InventoryProps = {
  activeSlot: number;
  slots: InventorySlot[];
  onSelectSlot: (slotId: number) => void;
};

const Inventory: React.FC<InventoryProps> = ({
  activeSlot,
  slots,
  onSelectSlot,
}) => {
  return (
    <div className="inventory">
      {slots.map((slot) => (
        <div
          key={slot.id}
          className={`inventory-slot ${activeSlot === slot.id ? 'active' : ''}`}
          onClick={() => onSelectSlot(slot.id)}
        >
          <div className="slot-number">{slot.id}</div>
          {slot.item ? (
            <div className="slot-item">
              {slot.item.icon || slot.item.name.charAt(0)}
            </div>
          ) : (
            <div className="slot-empty"></div>
          )}
        </div>
      ))}
    </div>
  );
};

export default Inventory;
