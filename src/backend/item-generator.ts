import { InventoryItem, Point2d } from '../common/interfaces';
import { WEAPONS } from './data/weapons';
import { ITEMS } from './data/items';
import { prngAlea } from 'ts-seedrandom';

export interface ItemPlacement {
  item: InventoryItem;
  position: Point2d;
}

export function generateStartingRoomItems(roomSize: number): ItemPlacement[] {
  const items: ItemPlacement[] = [];

  const centerX = Math.trunc(roomSize / 2);
  const centerY = Math.trunc(roomSize / 2);

  items.push({
    item: WEAPONS.sword as InventoryItem,
    position: { x: centerX, y: centerY },
  });
  items.push({
    item: ITEMS.HealthPotion as InventoryItem,
    position: { x: centerX, y: centerY - 2 },
  });

  return items;
}

export function generateDungeonRoomItems(
  roomSize: number,
  level: number
): ItemPlacement[] {
  const items: ItemPlacement[] = [];
  const rng = prngAlea(level * 1000);
  const itemCount = 3 + Math.floor(rng() * 3);

  const allItems = [...Object.values(WEAPONS), ...Object.values(ITEMS)];

  for (let i = 0; i < itemCount; i++) {
    const item = allItems[Math.floor(rng() * allItems.length)];
    const pos = {
      x: Math.max(1, Math.min(roomSize - 2, Math.floor(rng() * roomSize))),
      y: Math.max(1, Math.min(roomSize - 2, Math.floor(rng() * roomSize))),
    };
    items.push({ item, position: pos });
  }

  return items;
}

export function createItemsMap(
  itemPlacements: ItemPlacement[]
): Map<string, InventoryItem> {
  const itemsMap = new Map<string, InventoryItem>();

  itemPlacements.forEach((placement) => {
    const key = `${placement.position.x},${placement.position.y}`;
    itemsMap.set(key, placement.item);
  });

  return itemsMap;
}
