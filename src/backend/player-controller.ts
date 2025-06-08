import { LookDirection, World } from '../common/interfaces';
import { createEmptyMask } from '../frontend/utils/utils';
import { PlayerState } from './behaviour/state';

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
      if(entities.get({x: newWorld.player.x, y: newWorld.player.y - 1})) break;
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
      if(entities.get({x: newWorld.player.x, y: newWorld.player.y + 1})) break;
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
      if(entities.get({x: newWorld.player.x - 1, y: newWorld.player.y})) break;
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
      if(entities.get({x: newWorld.player.x  + 1, y: newWorld.player.y})) break;
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

export const attackFromPlayer = (world: World, attackNumber: number) => {
  const character = world.player.character;
  if(!(character.state instanceof PlayerState)) return;

  if (!character.attacks[attackNumber]) attackNumber = 1;
  if (!character.attacks[1]) {
    return {
      mask: createEmptyMask(character.characterSize.width, character.characterSize.height),
      center: { x: 0, y: 0 }
    };
  }
  const playerAttack = world.player.character.state.attack({
    from: { x: world.player.x, y: world.player.y },
    lookDir: world.player.lookDir,
    character: character,
    world: world
  }, character.attacks[attackNumber]);
  world.player.lastAttackArray = playerAttack.attackedTiles;
};