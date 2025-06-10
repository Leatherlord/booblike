export enum states {
  Pacifist = 'Pacifist',
  Normal = 'Normal',
  Panic = 'Panic',
  Angry = 'Angry',
}

export interface State {}

export class Pacifist implements State {}

export class Normal implements State {}

export class Angry implements State {}

export class Panic implements State {}
