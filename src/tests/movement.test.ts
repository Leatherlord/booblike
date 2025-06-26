import { getCharClass } from '../backend/data/classes';
import {
  World,
  LookDirection,
  Entity,
  Tile,
  ExitMappingEntry,
} from '../common/interfaces';
import { WorldManager } from '../backend/world-manager';
import {
  PlayerCharacter,
  RandomEnemyCharacter,
} from '../backend/behaviour/character';
import {
  aggressiveMovement,
  cowardMovement,
  neutralMovement,
} from '../backend/behaviour/movement';
import { Dictionary } from 'typescript-collections';
import { getStartingRoom } from '../backend/map-generator';

describe('Movement Test', () => {
  const originalRandom = Math.random;

  beforeAll(() => {
    Math.random = () => 0.2;
    jest.useFakeTimers();
  });

  beforeEach(() => {
    const shutCallBack = (world: World) => {};
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  afterAll(() => {
    Math.random = originalRandom;
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  // SETTING UP
  let shutCallBack = (world: World) => {};
  let world: World = {
    map: {
      rooms: [getStartingRoom()],
      currentRoom: 0,
      exitMapping: new Dictionary<ExitMappingEntry, ExitMappingEntry>(),
    },
    player: {
      id: 'player',
      x: 8,
      y: 8,
      character: new PlayerCharacter('Sanya', {
        s: 5,
        p: 5,
        e: 5,
        i: 5,
        a: 5,
      }),
      lookDir: LookDirection.Right,
      level: 1,
      experience: 0,
      experienceToNext: 1000,
      slots: [],
      activeSlot: 1,
      availableExperience: 10000,
      spentExperience: 0,
      upgradesBought: {},
      animation: {
        lastAttacked: 0,
        lastMoved: 0,
      },
    },
    random: 1,
    availableUpgrades: [],
  };

  // CREATING A TYPICAL CHARACTER TO TEST
  let _class = getCharClass('MiddleClass');
  let entity: Entity;
  if (_class) {
    entity = {
      x: 1,
      y: 1,
      lookDir: LookDirection.Up,
      character: new RandomEnemyCharacter(_class),
      level: 0,
      experience: 0,
      experienceToNext: 0,
      animation: {
        lastAttacked: 0,
        lastMoved: 0,
      },
    };
  }

  // tests
  test('should only move to a position with floor', () => {
    const worldClosed: World = {
      ...world,
    };
    const entityClosed: Entity = {
      ...entity,
    };
    let room1by1: Tile[][] = [
      ['wall', 'wall', 'wall'],
      ['empty', 'floor', 'wall'],
      ['wall', 'door', 'wall'],
    ];
    worldClosed.map.rooms[worldClosed.map.currentRoom].map = room1by1;
    const result = neutralMovement(entityClosed, worldClosed);
    expect(result.to).toEqual({ x: 1, y: 1 });
    expect(result.lookDir).toBe(LookDirection.Right);
  });

  test('should not move when player occupies target position', () => {
    const worldClosed: World = {
      ...world,
      player: { x: 1, y: 2 } as any,
    };
    const entityClosed: Entity = {
      ...entity,
    };
    let room1by2: Tile[][] = [
      ['wall', 'wall', 'wall', 'wall'],
      ['empty', 'floor', 'floor', 'wall'],
      ['wall', 'door', 'wall', 'wall'],
    ];
    worldClosed.map.rooms[worldClosed.map.currentRoom].map = room1by2;
    const result = neutralMovement(entityClosed, worldClosed);

    expect(result.to).toEqual({ x: 1, y: 1 });
  });

  test('should handle all possible movement shifts', () => {
    const worldClosed: World = {
      ...world,
      player: { x: 100000, y: 200000 } as any,
    };
    const entityClosed: Entity = {
      ...entity,
    };
    let roomFloors: Tile[][] = [
      ['floor', 'floor', 'floor'],
      ['floor', 'floor', 'floor'],
      ['floor', 'floor', 'floor'],
    ];
    worldClosed.map.rooms[worldClosed.map.currentRoom].map = roomFloors;
    const testCases = [
      { randomValue: 0.0, expectedPosition: { x: 0, y: 2 } },
      { randomValue: 0.15, expectedPosition: { x: 2, y: 0 } },
      { randomValue: 0.3, expectedPosition: { x: 1, y: 2 } },
      { randomValue: 0.45, expectedPosition: { x: 1, y: 0 } },
      { randomValue: 0.6, expectedPosition: { x: 2, y: 1 } },
      { randomValue: 0.75, expectedPosition: { x: 0, y: 1 } },
      { randomValue: 0.9, expectedPosition: { x: 2, y: 2 } },
    ];

    testCases.forEach(({ randomValue, expectedPosition }) => {
      jest.spyOn(global.Math, 'random').mockReturnValueOnce(randomValue);
      const result = neutralMovement(entityClosed, worldClosed);
      expect(result.to).toEqual(expectedPosition);
    });
  });

  test('aggressive moves to player', () => {
    const worldClosed: World = {
      ...world,
      player: { x: 2, y: 2 } as any,
    };
    const entityClosed: Entity = {
      ...entity,
      x: 0,
      y: 0,
    };
    let roomFloors: Tile[][] = [
      ['floor', 'floor', 'floor'],
      ['floor', 'floor', 'floor'],
      ['floor', 'floor', 'floor'],
    ];
    worldClosed.map.rooms[worldClosed.map.currentRoom].map = roomFloors;
    const testCases = [
      { randomValue: 0.0, expectedPosition: { x: 0, y: 2 } },
      { randomValue: 0.15, expectedPosition: { x: 2, y: 0 } },
      { randomValue: 0.3, expectedPosition: { x: 1, y: 2 } },
      { randomValue: 0.45, expectedPosition: { x: 1, y: 0 } },
      { randomValue: 0.6, expectedPosition: { x: 2, y: 1 } },
      { randomValue: 0.75, expectedPosition: { x: 0, y: 1 } },
      { randomValue: 0.9, expectedPosition: { x: 2, y: 2 } },
    ];
    const before =
      Math.abs(worldClosed.player.x - entityClosed.x) +
      Math.abs(worldClosed.player.y - entityClosed.y);
    const result = aggressiveMovement(entityClosed, worldClosed);
    const after =
      Math.abs(worldClosed.player.x - result.to.x) +
      Math.abs(worldClosed.player.y - result.to.y);
    expect(before > after).toEqual(true);
  });
  test('panic moves away from player', () => {
    const worldClosed: World = {
      ...world,
      player: { x: 0, y: 0 } as any,
    };
    const entityClosed: Entity = {
      ...entity,
      x: 1,
      y: 1,
    };
    let roomFloors: Tile[][] = [
      ['floor', 'floor', 'floor'],
      ['floor', 'floor', 'floor'],
      ['floor', 'floor', 'floor'],
    ];
    worldClosed.map.rooms[worldClosed.map.currentRoom].map = roomFloors;
    const before =
      Math.abs(worldClosed.player.x - entityClosed.x) +
      Math.abs(worldClosed.player.y - entityClosed.y);
    const result = cowardMovement(entityClosed, worldClosed);
    const after =
      Math.abs(worldClosed.player.x - result.to.x) +
      Math.abs(worldClosed.player.y - result.to.y);
    expect(before < after).toEqual(true);
  });
});
