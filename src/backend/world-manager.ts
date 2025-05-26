import { World, InventorySlot, GameMap, Room, Point2d, ExitMappingEntry } from '../common/interfaces';
import { Event, PlayerMoveEvent, InventorySelectEvent } from '../common/events';
import { movePlayer } from './player-controller';
import { generateRoom, getStartingRoom } from './map-generator';
import { Dictionary } from 'typescript-collections';

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
      map: this.generateStubMap(),
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

  private generateStubMap(): GameMap {
    const stubRoom: Room = {
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
      exits: new Dictionary(JSON.stringify),
      reverseExits: new Dictionary()
    }
    const seed = Math.round(Math.random() * 100000000);
    const generatedRoom = generateRoom(seed);
    let defaultExitMapping: Dictionary<ExitMappingEntry, ExitMappingEntry> = new Dictionary(JSON.stringify);
    defaultExitMapping.setValue({roomId: 0, exitId: 0}, {roomId: 1, exitId: 0});
    defaultExitMapping.setValue({roomId: 1, exitId: 0}, {roomId: 0, exitId: 0})
    const stubMap: GameMap = {
      rooms: [getStartingRoom(), generatedRoom],
      currentRoom: 0,
      exitMapping: defaultExitMapping
    };
    return stubMap;
  }

  public processTransition(pos: Point2d): World {
    let gameMap = this.world!.map!;
    const currentRoomId: number = gameMap!.currentRoom;
    if (gameMap.rooms[currentRoomId].map[pos.y][pos.x] != 'door') {
      return {...this.world!};
    }
    const exitId = gameMap.rooms[currentRoomId].exits.getValue(pos);
    if (!exitId) {
      console.log("failed to perform transition, no mapping for exit", pos);
      console.log(gameMap.rooms[currentRoomId].exits);
      return {...this.world!};
    }
    const currentEntry: ExitMappingEntry = {roomId: currentRoomId, exitId: exitId};
    const nextRoomEntry = gameMap.exitMapping.getValue(currentEntry);
    if (nextRoomEntry == undefined) {
      // TODO: generate new room
      return {...this.world!};
    }
    const newPosition = gameMap.rooms[nextRoomEntry.roomId].reverseExits.getValue(nextRoomEntry.exitId);
    if (newPosition == undefined) {
      console.log("failed to perform transition, no reverse mapping for exit", nextRoomEntry.exitId);
      return {...this.world!};
    }
    return {
      ...this.world!,
      map: {...gameMap, currentRoom: nextRoomEntry.roomId},
      player: {...this.world!.player, x: newPosition.x, y: newPosition.y}
     };
  }

  public handleEvent(event: Event) {
    if (!this.world) return;

    switch (event.type) {
      case 'player_move':
        const playerMovedWorld = movePlayer(this.world, event.direction);
        const player = playerMovedWorld.player;
        const playerPos: Point2d = {
          x: player.x,
          y: player.y
        };
        const transitionHandledWorld = this.processTransition(playerPos);
        this.updateWorld(transitionHandledWorld);
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
