import { Entity } from '../../common/interfaces';
import { strategyMap } from './strategy';
import { PlayerClass } from './classes';

export enum EventType {
  Pacify = 'Pacify',
  Anger = 'Anger',
  Damage = 'Damage',
  Heal = 'Heal',
}

export enum states {
  Pacifist = 'Pacifist',
  Normal = 'Normal',
  Panic = 'Panic',
  Angry = 'Angry',
}

function handle(
  context: Entity,
  currentState: states,
  event: EventType
): states {
  const transitions = context.character.charClass.transitions;
  return transitions[currentState]?.[event] || currentState;
}

export function handleStateChange(context: Entity, event: EventType): void {
  let char = context.character;
  let stateChange = char.state;
  switch (event) {
    case EventType.Pacify: // works when pacify buff
      stateChange = handle(context, char.state, event);
      break;
    case EventType.Anger: // works when attacked
      stateChange = handle(context, char.state, event);
      break;
    case EventType.Damage: // works when health reaches 20%
      if (context.character.healthBar / context.character.maxHealthBar <= 0.2)
        stateChange = handle(context, char.state, event);
      break;
    case EventType.Heal: // works when health regenerates to more than 20%
      if (context.character.healthBar / context.character.maxHealthBar > 0.2)
        stateChange = handle(context, char.state, event);
      break;
  }
  char.setState(stateChange);
  char.strategy = char.charClass.strategy[stateChange];
}
