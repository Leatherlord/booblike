import { World } from '../common/interfaces';

export class WorldManager {
  private world: World | null = null;
  private updateCallback: (world: World) => void;

  constructor(updateCallback: (world: World) => void) {
    this.updateCallback = updateCallback;
  }

  public updateWorld(world: World) {
    this.world = world;
    this.updateCallback(world);
  }

  public exampleUpdate() {
    if (!this.world) return;
    const newWorld = { ...this.world };

    // Update newWorld

    this.updateWorld(newWorld);
  }

  public generateStubWorld() {
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

    this.updateWorld(stubWorld);
  }
}
