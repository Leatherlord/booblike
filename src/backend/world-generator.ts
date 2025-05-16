import { World } from '../common/interfaces';

export const generateWorld = (): World => {
  const stubWorld: World = {
    width: 20,
    height: 20,
    map: Array(20)
      .fill(null)
      .map(() =>
        Array(20)
          .fill(null)
          .map((_, colIndex) => {
            if (colIndex === 0 || colIndex === 19) return 'wall';
            return 'floor';
          })
      )
      .map((row, rowIndex) => {
        if (rowIndex === 0 || rowIndex === 19) {
          return Array(20).fill('wall');
        }
        return row;
      }),
    entities: [],
    player: {
      id: 'player',
      x: 10,
      y: 10,
    },
  };
  return stubWorld;
};
