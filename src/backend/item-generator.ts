import { InventoryItem, Point2d } from '../common/interfaces';
import { WEAPONS } from './data/weapons';

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

  return items;
}

export function generateDungeonRoomItems(
  roomSize: number,
  level: number
): ItemPlacement[] {
  const items: ItemPlacement[] = [];

  // TODO: Add random item generation

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
