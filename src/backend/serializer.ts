import {
  EntitiesMap,
  ExitMappingEntry,
  GameMap,
  keyToPoint,
  Point2d,
  Room,
  World,
} from '../common/interfaces';
import { Dictionary, PriorityQueue } from 'typescript-collections';
import { prngAlea } from 'ts-seedrandom';
import {
  PlayerCharacter,
  RandomEnemyCharacter,
  BaseCharacter,
} from './behaviour/character';

export function serializeGameMapToString(gameMap: GameMap): string {
  try {
    const serialized = serializeGameMap(gameMap);
    return JSON.stringify(serialized);
  } catch (error) {
    console.error('Map serialization error:', error);
    throw new Error('Failed to serialize map data');
  }
}

export function deserializeGameMapFromString(json: string): GameMap {
  try {
    const parsed = JSON.parse(json);
    return deserializeGameMap(parsed);
  } catch (error) {
    console.error('Map deserialization error:', error);
    throw new Error('Invalid map data');
  }
}

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
  const res: GameMap = {
    rooms: data.rooms.map((roomData: any) => ({
      map: roomData.map,
      exits: createDictionary(roomData.exits),
      reverseExits: createDictionary(roomData.reverseExits),
      entities: deserializeEntitiesMap(roomData.entities),
    })),
    currentRoom: data.currentRoom,
    exitMapping: createDictionary(data.exitMapping),
  };
  return res;
}

export function reconstructCharacter(characterData: any): BaseCharacter {
  if (characterData._isDecorator) {
    const { Decorator } = require('./behaviour/actions');
    return Decorator.deserialize(characterData);
  }

  switch (characterData._characterType) {
    case 'PlayerCharacter':
      return PlayerCharacter.deserialize(characterData);
    case 'RandomEnemyCharacter':
      return RandomEnemyCharacter.deserialize(characterData);
    default:
      return BaseCharacter.deserialize(characterData);
  }
}

export function serializeWorld(world: World): string {
  try {
    const worldCopy = { ...world };

    if (worldCopy.player && worldCopy.player.character) {
      worldCopy.player = {
        ...worldCopy.player,
        character: worldCopy.player.character.serialize(),
      };
    }

    return JSON.stringify({
      ...worldCopy,
      map: serializeGameMap(worldCopy.map),
      onEntityDeath: undefined,
      random: worldCopy.random.state(),
    });
  } catch (error) {
    console.error('Serialization error:', error);
    throw new Error('Failed to serialize world data');
  }
}

export function deserializeWorld(json: string): World {
  const parsed = JSON.parse(json);
  const random = (prngAlea().state = parsed.random);

  let world = {
    ...parsed,
    map: deserializeGameMap(parsed.map),
    onEntityDeath: undefined,
    random: prngAlea(),
  };

  if (world.player && world.player.character) {
    world.player.character = reconstructCharacter(world.player.character);
  }

  if (world.map && world.map.rooms) {
    world.map.rooms.forEach((room: any) => {
      if (room.entities) {
        room.entities.forEach((entity: any) => {
          if (entity.character) {
            entity.character = reconstructCharacter(entity.character);
          }
        });
      }
    });
  }

  return world;
}

function serializeEntitiesMap(entitiesMap: EntitiesMap): any {
  return Object.entries(entitiesMap.entities).reduce(
    (acc, [posStr, entities]) => {
      acc[posStr] = Array.from(entities).map((entity) => {
        const entityCopy = { ...entity };
        if (entityCopy.character) {
          entityCopy.character = entityCopy.character.serialize();
        }
        return entityCopy;
      });
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
  const dict = new Dictionary<TKey, TValue>(JSON.stringify);
  items.forEach(({ key, value }) => {
    dict.setValue(key, value);
    console.log(key, value);
    console.log(dict);
  });

  return dict;
}
