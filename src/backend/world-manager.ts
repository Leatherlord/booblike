import { World, InventorySlot } from '../common/interfaces';
import { Event, PlayerMoveEvent, InventorySelectEvent } from '../common/events';
import { movePlayer } from './player-controller';

export class WorldManager {
  private world: World | null = null;
  private updateCallback: (world: World) => void;

  constructor(updateCallback: (world: World) => void) {
    this.updateCallback = updateCallback;
  }

  private updateWorld(world: World) {
    this.world = world;
    this.updateCallback(world);
  }

  public exampleUpdate() {
    if (!this.world) return;
    const newWorld = { ...this.world };

    // Update newWorld

    this.updateWorld(newWorld);
  }

  private createEmptyInventory(): InventorySlot[] {
    return [
      { id: 1 },
      { id: 2 },
      { id: 3 },
      { id: 4 },
      { id: 5 },
      { id: 6 },
      { id: 7 },
      { id: 8 },
      { id: 9 },
      { id: 0, item: { id: 'test-item', name: 'Test Item' } }
    ];
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
          if (rowIndex === 10) {
            const r = Array(20).fill('floor');
            for (let i = 5; i < 15; i++) {
              r[i] = 'empty';
            }
            r[10] = 'door';
            r[0] = 'wall';
            r[19] = 'wall';
            return r;
          }
          return row;
        }),
      entities: [],
      player: {
        id: 'player',
        x: 8,
        y: 8,
        slots: this.createEmptyInventory(),
        activeSlot: 1,
      },
    };

    this.updateWorld(stubWorld);
  }

  public handleEvent(event: Event) {
    if (!this.world) return;

    switch (event.type) {
      case 'player_move':
        this.updateWorld(movePlayer(this.world, event.direction));
        return;
      case 'player_attack':
        // TODO: implement
        break;
      case 'inventory_select':
        this.handleInventorySelect(event);
        break;
    }
  }

  private handleInventorySelect(event: InventorySelectEvent) {
    if (!this.world) return;

    const newWorld = {
      ...this.world,
      player: {
        ...this.world.player,
        activeSlot: event.slotId,
      }
    };

    this.updateWorld(newWorld);
  }
}
