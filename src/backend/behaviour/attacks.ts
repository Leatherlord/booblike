import { LookDirection, Point2d } from "../../common/interfaces";
import { Buff } from "./buffs";
import { Character } from "./character";

export type AttackGrid = {
  /* Specifies an attack grid
  000000
  000000
  0*0000
  areaUp: 2;
  areaDown: 0;
  areaRight: 4;
  areaLeft: 1
  */
  areaUp: number;
  areaDown: number;
  areaRight: number;
  areaLeft: number
}

export function getAttackGridSize(grid: AttackGrid) {
  return {
    x : grid.areaRight + grid.areaLeft + 1, 
    y: grid.areaUp + grid.areaDown + 1
  }
}

export interface Attack {
  minDamage: number;
  maxDamage: number;
  attackBuffs: Buff[];
  areaSize: AttackGrid;
  area: Record<LookDirection, number[][]>;
}

export let CircleAttack: Attack = {
  minDamage: 1,
  maxDamage: 2,
  attackBuffs: [],
  areaSize: {
    areaUp: 1,
    areaDown: 1,
    areaRight: 1,
    areaLeft: 1
  },
  area: {
    [LookDirection.Up]: [[1, 1, 1], [1, 0, 1], [1, 1, 1]],
    [LookDirection.Down]: [[1, 1, 1], [1, 0, 1], [1, 1, 1]],
    [LookDirection.Left]: [[1, 1, 1], [1, 0, 1], [1, 1, 1]],
    [LookDirection.Right]: [[1, 1, 1], [1, 0, 1], [1, 1, 1]],
  }
}

export let StraightAttack: Attack = {
  minDamage: 1,
  maxDamage: 3,
  attackBuffs: [],
  areaSize: {
    areaUp: 1,
    areaDown: 1,
    areaRight: 1,
    areaLeft: 1
  },
  area: {
    [LookDirection.Up]: [[0, 1, 0], [0, 0, 0], [0, 0, 0]],
    [LookDirection.Down]: [[0, 0, 0], [0, 0, 0], [0, 1, 0]],
    [LookDirection.Left]: [[0, 0, 0], [1, 0, 0], [0, 0, 0]],
    [LookDirection.Right]: [[0, 0, 0], [0, 0, 1], [0, 0, 0]],
  }
}