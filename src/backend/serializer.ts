import {
  EntitiesMap,
  ExitMappingEntry,
  GameMap,
  keyToPoint,
  Point2d,
  Room,
  World,
} from '../common/interfaces';
import { Dictionary } from 'typescript-collections';
import { prngAlea } from 'ts-seedrandom';

export function serializeGameMap(gameMap: GameMap): any {
  return {
    rooms: gameMap.rooms.map((room) => ({
      map: room.map,
      exits: Array.from(room.exits.keys()).map((key) => ({
        key,
        value: room.exits.getValue(key),
      })),
      reverseExits: Array.from(room.reverseExits.keys()).map((key) => ({
        key,
        value: room.reverseExits.getValue(key),
      })),
      entities: serializeEntitiesMap(room.entities),
    })),
    currentRoom: gameMap.currentRoom,
    exitMapping: gameMap.exitMapping
      .keys()
      .map((key) => ({ key, value: gameMap.exitMapping.getValue(key) })),
  };
}

export function deserializeGameMap(data: any): GameMap {
  return {
    rooms: data.rooms.map((roomData: any) => ({
      map: roomData.map,
      exits: createDictionary(roomData.exits),
      reverseExits: createDictionary(roomData.reverseExits),
      entities: deserializeEntitiesMap(roomData.entities),
    })),
    currentRoom: data.currentRoom,
    exitMapping: createDictionary(data.exitMapping),
  };
}

export function serializeWorld(world: World): string {
  return JSON.stringify({
    ...world,
    map: serializeGameMap(world.map),
    onEntityDeath: undefined,
    random: world.random.state(), // Сохраняем состояние генератора
  });
}

export function deserializeWorld(json: string): World {
  const parsed = JSON.parse(json);
  const random = (prngAlea().state = parsed.random);

  return {
    ...parsed,
    map: deserializeGameMap(parsed.map),
    onEntityDeath: undefined,
    random,
  };
}

function serializeEntitiesMap(entitiesMap: EntitiesMap): any {
  return Object.entries(entitiesMap.entities).reduce(
    (acc, [posStr, entities]) => {
      acc[posStr] = Array.from(entities).map((entity) => ({ ...entity }));
      return acc;
    },
    {} as Record<string, any>
  );
}

function deserializeEntitiesMap(data: any): EntitiesMap {
  const entitiesMap = new EntitiesMap();
  for (const [posStr, entities] of Object.entries(data) as [string, any[]][]) {
    entities.forEach((entity) => entitiesMap.add(keyToPoint(posStr), entity));
  }
  return entitiesMap;
}

function createDictionary<TKey, TValue>(
  items: { key: TKey; value: TValue }[]
): Dictionary<TKey, TValue> {
  const dict = new Dictionary<TKey, TValue>();
  items.forEach(({ key, value }) => dict.setValue(key, value));
  return dict;
}
