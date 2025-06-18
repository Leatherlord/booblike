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
      }
      break;
  }

  return newWorld;
};

export function createEmptyMask(dimX: number, dimY: number): number[][] {
  return Array.from({ length: dimY }, () => Array(dimX).fill(0));
}

export const attackFromPlayer = (world: World, attackNumber: number) => {
  const character = world.player.character;
  if (!(character.strategy instanceof PlayerStrategy)) return;

  if (!character.attacks[attackNumber]) attackNumber = 0;
  if (!character.attacks[0]) {
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
    character.attacks[attackNumber]
  );
  world.player.animation.lastAttacked = playerAttack.lastAttacked;
  world.player.lastAttackArray = playerAttack.attackedTiles;
};
