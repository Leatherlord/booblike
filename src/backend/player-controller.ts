import { LookDirection, Point2d, World } from '../common/interfaces';
import { getAttackGridSize } from './behaviour/attacks';
import { createEmptyMask, pointToKey } from '../frontend/utils/utils';

export const movePlayer = (
  world: World,
  direction: 'up' | 'down' | 'left' | 'right'
) => {
  const newWorld = { ...world };
  const roomMap = newWorld.map.rooms[newWorld.map.currentRoom].map;
  const width = roomMap.length;
  const height = roomMap[0].length;

  switch (direction) {
    case 'up':
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


function updateAnimationAttack(world: World, ans: Point2d[]) {
  // if (!world) return;
  // let mask = world.player.lastAttackMask;
  // let center = world.player.attackCenter;
  // if(!mask||!center) return;
  // const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
  // const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  // for() {
    
  // }
  // const square = document.getElementById('attackGrid') as HTMLElement;
  // square.style.setProperty('--center-x', `${(world.player.x + center.x) * 32}px`);
  // square.style.setProperty('--center-y', `${(world.player.x + center.y) * 32}px`);
  // square.style.setProperty('--height', `${mask.length * 32}px`);
  // square.style.setProperty('--width', `${mask[0].length * 32}px`);
  // console.log((world.player.x + center.x) * 32, (world.player.x + center.y) * 32)
  // console.log(square.style.getPropertyValue('--center-x'), square.style.getPropertyValue('--center-y'))
  // console.log(square.style.getPropertyValue('--height'), square.style.getPropertyValue('--width'))
}

export const attackFromPlayer = (world: World, attackNumber: number) => {
  const player = world.player;
  const center = { x: world.player.x, y: world.player.y };
  if (!player.character.attacks[attackNumber]) 
    return {
      mask: createEmptyMask(player.character.characterSize.x, player.character.characterSize.y), 
      center: {x: 0, y: 0}
    };

  const attack = player.character.attacks[attackNumber];
  const width = getAttackGridSize(attack.areaSize).x;
  const height = getAttackGridSize(attack.areaSize).y;
  const yOffset = attack.areaSize.areaUp;
  const xOffset = attack.areaSize.areaRight;
  const mask = attack.area[player.lookDir];

  const map = world.map.rooms[world.map.currentRoom].map;
  const entities = world.map.rooms[world.map.currentRoom].entities;
  let newMask = createEmptyMask(height, width);
  let attackedTiles = [];  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (mask[y][x] !== 1) continue;
      const targetX = center.x + x - xOffset;
      const targetY = center.y + y - yOffset;

      if (
        targetY >= 0 &&
        targetY < map.length &&
        targetX >= 0 &&
        targetX < map[0].length
      ) {
        const tile = map[targetY][targetX];
        const pos: Point2d = { x: targetX, y: targetY };

        if (entities[pointToKey(pos)]) {
          console.log("Spotted an entity.");
          entities[pointToKey(pos)].character;
        }

        if (tile == 'floor') {
          newMask[y][x] = 1;
          attackedTiles.push({x: targetX, y: targetY});
        }

      }
    }
  }
  player.lastAttackArray = attackedTiles;
  //player.attackCenter = {x: width - xOffset, y: height - yOffset};
  //updateAnimationAttack(world);
  return {mask: newMask, center: {x: width - xOffset, y: height - yOffset}};
}
