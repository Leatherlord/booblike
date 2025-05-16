import { World } from '../common/interfaces';

export const movePlayer = (
  world: World,
  direction: 'up' | 'down' | 'left' | 'right'
) => {
  const newWorld = { ...world };

  switch (direction) {
    case 'up':
      if (
        newWorld.player.y > 0 &&
        newWorld.map[newWorld.player.y - 1][newWorld.player.x] !== 'wall'
      ) {
        newWorld.player.y = newWorld.player.y - 1;
      }
      break;
    case 'down':
      if (
        newWorld.player.y < newWorld.height - 1 &&
        newWorld.map[newWorld.player.y + 1][newWorld.player.x] !== 'wall'
      ) {
        newWorld.player.y = newWorld.player.y + 1;
      }
      break;
    case 'left':
      if (
        newWorld.player.x > 0 &&
        newWorld.map[newWorld.player.y][newWorld.player.x - 1] !== 'wall'
      ) {
        newWorld.player.x = newWorld.player.x - 1;
      }
      break;
    case 'right':
      if (
        newWorld.player.x < newWorld.width - 1 &&
        newWorld.map[newWorld.player.y][newWorld.player.x + 1] !== 'wall'
      ) {
        newWorld.player.x = newWorld.player.x + 1;
      }
      break;
  }

  return newWorld;
};
