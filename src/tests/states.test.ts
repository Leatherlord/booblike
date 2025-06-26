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
import {
  EventType,
  handleStateChange,
  states,
} from '../backend/behaviour/state';
import { strategyMap } from '../backend/behaviour/strategy';

describe('States Test', () => {
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

  const createEntity = (
    state: states,
    healthPercentage: number,
    transitions: any,
    strategy: any
  ): Entity => {
    let newEntity = {
      ...entity,
      character: Object.create(entity.character),
    };
    newEntity.character.setState(state);
    newEntity.character.healthBar =
      healthPercentage * newEntity.character.healthBar;
    newEntity.character.strategy = strategy;
    if (_class) _class.transitions = transitions;
    return newEntity;
  };

  // tests
  const testTransitions = {
    [states.Normal]: {
      [EventType.Pacify]: states.Pacifist,
      [EventType.Anger]: states.Angry,
      [EventType.Damage]: states.Panic,
    },
    [states.Pacifist]: {
      [EventType.Anger]: states.Normal,
    },
    [states.Angry]: {
      [EventType.Pacify]: states.Normal,
    },
    [states.Panic]: {
      [EventType.Heal]: states.Normal,
    },
  };

  const testStrategy = {
    [states.Normal]: strategyMap.Neutral,
    [states.Pacifist]: strategyMap.Neutral,
    [states.Angry]: strategyMap.Aggresive,
    [states.Panic]: strategyMap.Coward,
  };
  describe('State Handler', () => {
    describe('handleStateChange function', () => {
      test('should transition to Pacifist on Pacify event', () => {
        const entity = createEntity(
          states.Normal,
          0.5,
          testTransitions,
          testStrategy
        );
        handleStateChange(entity, EventType.Pacify);
        expect(entity.character.state).toBe(states.Pacifist);
        expect(entity.character.strategy).toBe(strategyMap.Neutral);
      });

      test('should transition to Normal from Pacifist on Anger event', () => {
        const entity = createEntity(
          states.Pacifist,
          0.5,
          testTransitions,
          testStrategy
        );
        handleStateChange(entity, EventType.Anger);
        expect(entity.character.state).toBe(states.Normal);
        expect(entity.character.strategy).toBe(strategyMap.Neutral);
      });

      test('should transition to Panic on Damage event when health <= 20%', () => {
        const entity = createEntity(
          states.Normal,
          0.2,
          testTransitions,
          testStrategy
        );
        handleStateChange(entity, EventType.Damage);
        expect(entity.character.state).toBe(states.Panic);
        expect(entity.character.strategy).toBe(strategyMap.Coward);
      });

      test('should NOT transition to Panic on Damage event when health > 20%', () => {
        const entity = createEntity(
          states.Normal,
          0.3,
          testTransitions,
          testStrategy
        );
        handleStateChange(entity, EventType.Damage);
        expect(entity.character.state).toBe(states.Normal);
      });

      test('should transition to Normal from Panic on Heal event when health > 20%', () => {
        const entity = createEntity(
          states.Panic,
          0.3,
          testTransitions,
          testStrategy
        );
        handleStateChange(entity, EventType.Heal);
        expect(entity.character.state).toBe(states.Normal);
        expect(entity.character.strategy).toBe(strategyMap.Neutral);
      });

      test('should NOT transition to Normal from Panic on Heal event when health <= 20%', () => {
        const entity = createEntity(
          states.Panic,
          0.2,
          testTransitions,
          testStrategy
        );
        handleStateChange(entity, EventType.Heal);
        expect(entity.character.state).toBe(states.Panic);
      });

      test('should transition to Normal from Angry on Pacify event', () => {
        const entity = createEntity(
          states.Angry,
          0.5,
          testTransitions,
          testStrategy
        );
        handleStateChange(entity, EventType.Pacify);
        expect(entity.character.state).toBe(states.Normal);
        expect(entity.character.strategy).toBe(strategyMap.Neutral);
      });

      test('should handle multiple consecutive transitions', () => {
        const entity = createEntity(
          states.Normal,
          0.5,
          testTransitions,
          testStrategy
        );

        // Normal -> Angry
        handleStateChange(entity, EventType.Anger);
        expect(entity.character.state).toBe(states.Angry);

        // Angry -> Normal
        handleStateChange(entity, EventType.Pacify);
        expect(entity.character.state).toBe(states.Normal);

        // Normal -> Pacifist
        handleStateChange(entity, EventType.Pacify);
        expect(entity.character.state).toBe(states.Pacifist);

        // Pacifist -> Normal
        handleStateChange(entity, EventType.Anger);
        expect(entity.character.state).toBe(states.Normal);
      });

      test('should not change state for undefined transitions', () => {
        const entity = createEntity(
          states.Normal,
          0.5,
          testTransitions,
          testStrategy
        );
        handleStateChange(entity, EventType.Heal);
        expect(entity.character.state).toBe(states.Normal);
      });
    });

    describe('Edge Cases', () => {
      test('should handle missing transition definitions', () => {
        const minimalTransitions = {
          [states.Normal]: {
            [EventType.Anger]: states.Angry,
          },
        };

        const entity = createEntity(
          states.Normal,
          0.5,
          minimalTransitions,
          testStrategy
        );

        // Defined transition
        handleStateChange(entity, EventType.Anger);
        expect(entity.character.state).toBe(states.Angry);

        // Undefined transition
        handleStateChange(entity, EventType.Pacify);
        expect(entity.character.state).toBe(states.Angry);
      });

      test('should handle zero max health', () => {
        const entity = createEntity(
          states.Normal,
          0,
          testTransitions,
          testStrategy
        );
        entity.character.maxHealthBar = 0;

        handleStateChange(entity, EventType.Damage);
        expect(entity.character.state).toBe(states.Normal);

        handleStateChange(entity, EventType.Heal);
        expect(entity.character.state).toBe(states.Normal);
      });
    });
  });
});
