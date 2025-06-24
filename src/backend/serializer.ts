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
import { PlayerClass, getCharacteristicsFromClass } from './behaviour/classes';
import { strategyMap } from './behaviour/strategy';
import { states } from './behaviour/state';

// Create reverse mapping from strategy instance to name
const strategyToNameMap = new Map();
Object.entries(strategyMap).forEach(([name, strategy]) => {
  strategyToNameMap.set(strategy, name);
});

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

function reconstructPriorityQueue(
  queueData: any,
  comparatorFn?: (a: any, b: any) => number
): PriorityQueue<any> {
  const queue = new PriorityQueue<any>(comparatorFn);

  if (queueData) {
    let elements: any[] = [];

    if (queueData._elements && Array.isArray(queueData._elements)) {
      elements = queueData._elements;
    } else if (queueData.heap && Array.isArray(queueData.heap)) {
      elements = queueData.heap;
    } else if (queueData.data && Array.isArray(queueData.data)) {
      elements = queueData.data;
    } else if (Array.isArray(queueData)) {
      elements = queueData;
    }

    elements.forEach((element: any) => {
      if (element !== null && element !== undefined) {
        queue.enqueue(element);
      }
    });
  }

  return queue;
}

function reconstructBuffAddOns(buffsData: any): any {
  if (!buffsData) return buffsData;

  const durationComparator = (a: any, b: any): number => {
    const durationA = a.duration + a.startTime;
    const durationB = b.duration + b.startTime;
    return durationA - durationB;
  };

  const reconstructed: any = {};

  Object.keys(buffsData).forEach((statType) => {
    reconstructed[statType] = {};

    Object.keys(buffsData[statType]).forEach((modifierType) => {
      if (statType === 'ATTRIBUTE') {
        reconstructed[statType][modifierType] = {};
        Object.keys(buffsData[statType][modifierType]).forEach((attrType) => {
          reconstructed[statType][modifierType][attrType] =
            reconstructPriorityQueue(
              buffsData[statType][modifierType][attrType],
              durationComparator
            );
        });
      } else {
        reconstructed[statType][modifierType] = reconstructPriorityQueue(
          buffsData[statType][modifierType],
          durationComparator
        );
      }
    });
  });

  return reconstructed;
}

function reconstructCharacter(characterData: any): BaseCharacter {
  let char: BaseCharacter;

  if (characterData._characterType === 'PlayerCharacter') {
    char = new PlayerCharacter(
      characterData.name,
      characterData.baseCharacteristics,
      characterData.texture
    );
  } else if (characterData._characterType === 'RandomEnemyCharacter') {
    char = new RandomEnemyCharacter(characterData.charClass);
  } else {
    char = new BaseCharacter();
  }

  const { strategy, _characterType, _strategyName, ...dataWithoutStrategy } =
    characterData;
  Object.assign(char, dataWithoutStrategy);

  if (characterData._characterType === 'PlayerCharacter') {
    const currentState = (characterData.state as states) || states.Normal;
    char.strategy = PlayerClass.strategy[currentState];
  } else if (characterData._characterType === 'RandomEnemyCharacter') {
    const strategyName = characterData._strategyName || 'Aggresive';
    char.strategy = strategyMap[strategyName] || strategyMap['Aggresive'];
  }

  const durationComparator = (a: any, b: any): number => {
    const durationA = a.duration + a.startTime;
    const durationB = b.duration + b.startTime;
    return durationA - durationB;
  };

  if (characterData.allBuffs) {
    char.allBuffs = reconstructPriorityQueue(
      characterData.allBuffs,
      durationComparator
    );
  }

  if (characterData.buffsBonus) {
    char.buffsBonus = reconstructBuffAddOns(characterData.buffsBonus);
  }

  return char;
}

export function serializeWorld(world: World): string {
  if (world.player && world.player.character) {
    (world.player.character as any)._characterType = 'PlayerCharacter';
  }

  try {
    return JSON.stringify({
      ...world,
      map: serializeGameMap(world.map),
      onEntityDeath: undefined,
      random: world.random.state(),
    });
  } catch (error) {
    console.error('Serialization error:', error);
    throw new Error('Failed to serialize world data');
  }
}

export function deserializeWorld(json: string): World {
  const parsed = JSON.parse(json);
  const random = (prngAlea().state = parsed.random);

  const world = {
    ...parsed,
    map: deserializeGameMap(parsed.map),
    onEntityDeath: undefined,
    random,
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
          entityCopy.character = { ...entityCopy.character };
          (entityCopy.character as any)._characterType = 'RandomEnemyCharacter';

          const strategyName =
            strategyToNameMap.get(entityCopy.character.strategy) || 'Aggresive';
          (entityCopy.character as any)._strategyName = strategyName;
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
  const dict = new Dictionary<TKey, TValue>();
  items.forEach(({ key, value }) => dict.setValue(key, value));
  return dict;
}
