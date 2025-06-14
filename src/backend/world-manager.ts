import {
  World,
  InventorySlot,
  GameMap,
  Room,
  Point2d,
  ExitMappingEntry,
} from '../common/interfaces';
import { Event, PlayerMoveEvent, InventorySelectEvent } from '../common/events';
import { movePlayer } from './player-controller';
import { generateRoom, getStartingRoom } from './map-generator';
import { Dictionary } from 'typescript-collections';
import { prngAlea } from 'ts-seedrandom';

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
      { id: 0, item: { id: 'test-item', name: 'Test Item' } },
    ];
  }

  public generateStubWorld() {
    const worldSeed = Math.trunc(Math.random() * 1000000);
    let worldRandom = prngAlea(worldSeed);
    const stubWorld: World = {
      map: this.generateStubMap(worldSeed),
      entities: [],
      player: {
        id: 'player',
        x: 8,
        y: 8,
        slots: this.createEmptyInventory(),
        activeSlot: 1,
        level: 1,
      },
      random: worldRandom,
    };

    this.updateWorld(stubWorld);
  }

  private generateStubMap(seed: number): GameMap {
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
      reverseExits: new Dictionary(),
    };
    let defaultExitMapping: Dictionary<ExitMappingEntry, ExitMappingEntry> =
      new Dictionary(JSON.stringify);
    const stubMap: GameMap = {
      rooms: [getStartingRoom()],
      currentRoom: 0,
      exitMapping: defaultExitMapping,
    };
    return stubMap;
  }

  private countUnlinkedExits(): number {
    const totalExits = this.world?.map.rooms
      .map((r) => r.exits.size())
      .reduce((sum, cur) => sum + cur, 0);
    const linkedExits = this.world?.map.exitMapping.size()!;
    return totalExits! - linkedExits;
  }

  public processTransition(curWorld: World): World {
    const pos: Point2d = { x: curWorld.player.x, y: curWorld.player.y };
    let gameMap = curWorld.map;
    const currentRoomId: number = gameMap!.currentRoom;
    if (gameMap.rooms[currentRoomId].map[pos.y][pos.x] != 'door') {
      return curWorld;
    }
    const exitId = gameMap.rooms[currentRoomId].exits.getValue(pos);
    if (!exitId && exitId != 0) {
      console.log('failed to perform transition, no mapping for exit', pos);
      console.log(gameMap.rooms[currentRoomId].exits);
      return curWorld;
    }
    const currentEntry: ExitMappingEntry = {
      roomId: currentRoomId,
      exitId: exitId,
    };
    let nextRoomEntry = gameMap.exitMapping.getValue(currentEntry);
    if (!nextRoomEntry) {
      const roomSeed = Math.round(1000000 * curWorld.random());
      const unlinkedExits = this.countUnlinkedExits();
      const newRoom = generateRoom(
        roomSeed,
        curWorld.player.level,
        unlinkedExits < 2
      );
      const newRoomId = gameMap.rooms.length;
      gameMap.rooms.push(newRoom);
      nextRoomEntry = { roomId: newRoomId, exitId: 0 };
      gameMap.exitMapping.setValue(currentEntry, nextRoomEntry);
      gameMap.exitMapping.setValue(nextRoomEntry, currentEntry);
    }
    const newPosition = gameMap.rooms[
      nextRoomEntry.roomId
    ].reverseExits.getValue(nextRoomEntry.exitId);
    if (!newPosition) {
      console.log(
        'failed to perform transition, no reverse mapping for exit',
        nextRoomEntry.exitId
      );
      return curWorld;
    }
    return {
      ...this.world!,
      map: { ...gameMap, currentRoom: nextRoomEntry.roomId },
      player: { ...curWorld.player, x: newPosition.x, y: newPosition.y },
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
          y: player.y,
        };
        const transitionHandledWorld = this.processTransition(playerMovedWorld);
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
      },
    };

    this.updateWorld(newWorld);
  }
}
