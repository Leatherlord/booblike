import { LookDirection, World } from '../common/interfaces';
import { PlayerStrategy } from './behaviour/strategy';

export const movePlayer = (
  world: World,
  direction: 'up' | 'down' | 'left' | 'right'
) => {
  const newWorld = { ...world };
  const roomMap = newWorld.map.rooms[newWorld.map.currentRoom].map;
  const width = roomMap.length;
  const height = roomMap[0].length;

  const entities = newWorld.map.rooms[newWorld.map.currentRoom].entities;
  const room = newWorld.map.rooms[newWorld.map.currentRoom];

  let moved = false;

  switch (direction) {
    case 'up':
      newWorld.player.lookDir = LookDirection.Up;
      if (entities.get({ x: newWorld.player.x, y: newWorld.player.y - 1 }))
        break;
      if (
        newWorld.player.y > 0 &&
        (roomMap[newWorld.player.y - 1][newWorld.player.x] === 'floor' ||
          roomMap[newWorld.player.y - 1][newWorld.player.x] === 'door')
      ) {
        newWorld.player.y = newWorld.player.y - 1;
        moved = true;
      }
      break;
    case 'down':
      newWorld.player.lookDir = LookDirection.Down;
      if (entities.get({ x: newWorld.player.x, y: newWorld.player.y + 1 }))
        break;
      if (
        newWorld.player.y < height - 1 &&
        (roomMap[newWorld.player.y + 1][newWorld.player.x] === 'floor' ||
          roomMap[newWorld.player.y + 1][newWorld.player.x] === 'door')
      ) {
        newWorld.player.y = newWorld.player.y + 1;
        moved = true;
      }
      break;
    case 'left':
      newWorld.player.lookDir = LookDirection.Left;
      if (entities.get({ x: newWorld.player.x - 1, y: newWorld.player.y }))
        break;
      if (
        newWorld.player.x > 0 &&
        (roomMap[newWorld.player.y][newWorld.player.x - 1] === 'floor' ||
          roomMap[newWorld.player.y][newWorld.player.x - 1] === 'door')
      ) {
        newWorld.player.x = newWorld.player.x - 1;
        moved = true;
      }
      break;
    case 'right':
      newWorld.player.lookDir = LookDirection.Right;
      if (entities.get({ x: newWorld.player.x + 1, y: newWorld.player.y }))
        break;
      if (
        newWorld.player.x < width - 1 &&
        (roomMap[newWorld.player.y][newWorld.player.x + 1] === 'floor' ||
          roomMap[newWorld.player.y][newWorld.player.x + 1] === 'door')
      ) {
        newWorld.player.x = newWorld.player.x + 1;
        moved = true;
      }
      break;
  }

  if (moved) {
    const itemKey = `${newWorld.player.x},${newWorld.player.y}`;
    const item = room.items.get(itemKey);

    if (item) {
      const activeSlot = newWorld.player.slots.find(
        (slot) => slot.id === newWorld.player.activeSlot
      );

      if (activeSlot && !activeSlot.item) {
        room.items.delete(itemKey);
        activeSlot.item = item;

        if (item.type === 'weapon') {
          newWorld.player.character.equipWeapon(item, newWorld.player);
        }
      } else {
        const emptySlot = newWorld.player.slots.find((slot) => !slot.item);
        if (emptySlot) {
          room.items.delete(itemKey);
          emptySlot.item = item;
        }
      }
    }
  }

  return newWorld;
};

export function createEmptyMask(dimX: number, dimY: number): number[][] {
  return Array.from({ length: dimY }, () => Array(dimX).fill(0));
}

export const attackFromPlayer = (world: World, attackNumber: number) => {
  const character = world.player.character;
  if (!(character.strategy instanceof PlayerStrategy)) return;

  const attackIndex = 0;

  if (!character.attacks[attackIndex]) {
    return {
      mask: createEmptyMask(
        character.characterSize.width,
        character.characterSize.height
      ),
      center: { x: 0, y: 0 },
    };
  }
  const playerAttack = world.player.character.strategy.attack(
    world.player,
    world,
    character.attacks[attackIndex]
  );
  world.player.animation.lastAttacked = playerAttack.lastAttacked;
  world.player.lastAttackArray = playerAttack.attackedTiles;
};
