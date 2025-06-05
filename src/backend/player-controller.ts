import { LookDirection, Point2d, World } from '../common/interfaces';
import { getAttackGridSize, getOffsets } from './behaviour/attacks';
import { createEmptyMask, pointToKey } from '../frontend/utils/utils';

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
      if(entities[pointToKey({x: newWorld.player.x, y: newWorld.player.y - 1})]) break;
      if (
        newWorld.player.y > 0 &&
        (roomMap[newWorld.player.y - 1][newWorld.player.x] === 'floor' ||
          roomMap[newWorld.player.y - 1][newWorld.player.x] === 'door')
      ) {
        newWorld.player.y = newWorld.player.y - 1;
        newWorld.player.lookDir = LookDirection.Up;
      }
      break;
    case 'down':
      if(entities[pointToKey({x: newWorld.player.x, y: newWorld.player.y + 1})]) break;
      if (
        newWorld.player.y < height - 1 &&
        (roomMap[newWorld.player.y + 1][newWorld.player.x] === 'floor' ||
          roomMap[newWorld.player.y + 1][newWorld.player.x] === 'door')
      ) {
        newWorld.player.y = newWorld.player.y + 1;
        newWorld.player.lookDir = LookDirection.Down;
      }
      break;
    case 'left':
      if(entities[pointToKey({x: newWorld.player.x - 1, y: newWorld.player.y})]) break;
      if (
        newWorld.player.x > 0 &&
        (roomMap[newWorld.player.y][newWorld.player.x - 1] === 'floor' ||
          roomMap[newWorld.player.y][newWorld.player.x - 1] === 'door')
      ) {
        newWorld.player.x = newWorld.player.x - 1;
        newWorld.player.lookDir = LookDirection.Left;
      }
      break;
    case 'right':
      if(entities[pointToKey({x: newWorld.player.x  + 1, y: newWorld.player.y})]) break;
      if (
        newWorld.player.x < width - 1 &&
        (roomMap[newWorld.player.y][newWorld.player.x + 1] === 'floor' ||
          roomMap[newWorld.player.y][newWorld.player.x + 1] === 'door')
      ) {
        newWorld.player.x = newWorld.player.x + 1;
        newWorld.player.lookDir = LookDirection.Right;
      }
      break;
  }

  return newWorld;
};

export const attackFromPlayer = (world: World, attackNumber: number) => {
  const player = world.player;
  const center = { x: player.x, y: player.y };

  if (!player.character.attacks[attackNumber]) attackNumber = 1;
  if (!player.character.attacks[1]) {
    return {
      mask: createEmptyMask(player.character.characterSize.width, player.character.characterSize.height),
      center: { x: 0, y: 0 }
    };
  }

  const attack = player.character.attacks[attackNumber];
  const direction = player.lookDir;
  const { x: width, y: height } = getAttackGridSize(attack.areaSize, direction);
  const { x: xOffset, y: yOffset } = getOffsets(player, attack);
  const mask = attack.area[direction];

  const map = world.map.rooms[world.map.currentRoom].map;
  const entities = world.map.rooms[world.map.currentRoom].entities;
  const newMask = createEmptyMask(width, height);
  const attackedTiles: Point2d[] = [];
  const killedEntities: string[] = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (mask[y][x] !== 1) continue;

      const targetX = center.x + x - xOffset;
      const targetY = center.y + y - yOffset;

      if (
        targetY >= 0 && targetY < map.length &&
        targetX >= 0 && targetX < map[0].length
      ) {
        const tile = map[targetY][targetX];
        const pos: Point2d = { x: targetX, y: targetY };
        if (entities[pointToKey(pos)]) {
          console.log("Spotted an entity:", entities[pointToKey(pos)]);
          let attackResult = player.character.attack(entities[pointToKey(pos)], attack);
          if(
            attackResult.status == 'normal'
            &&
            attackResult.finalTarget.character.healthBar <= 0 
          ) 
            console.log("dead");
            killedEntities.push(pointToKey(pos)); 
          // for now only enemy - when we need to add character getting hit
        }

        if (tile === 'floor') {
          newMask[y][x] = 1;
          attackedTiles.push(pos);
        }
      }
    }
  }

  player.lastAttackArray = attackedTiles;

  return {
    mask: newMask,
    center,
    originOffset: { x: xOffset, y: yOffset },
    tiles: attackedTiles,
    killedEntities: killedEntities
  };
};

