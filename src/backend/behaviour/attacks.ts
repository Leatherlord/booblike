import { Entity, Grid, LookDirection, Point2d, generateGrid, Speed } from "../../common/interfaces";
import { Buff } from "./buffs";

export interface Attack {
  name: string;
  speed: Speed;
  minDamage: number;
  maxDamage: number;
  attackBuffs: Buff[];
  areaSize: Grid;
  area: Record<LookDirection, number[][]>;
}

export let CircleAttack: Attack = {
  name: "CircleAttack",
  speed: Speed.NORMAL,
  minDamage: 1,
  maxDamage: 2,
  attackBuffs: [],
  areaSize: {
    areaUp: 1,
    areaDown: 1,
    areaRight: 1,
    areaLeft: 1
  },
  area: generateGrid(
    [
      [1, 1, 1], 
      [1, 0, 1], 
      [1, 1, 1]
    ]
  )
}

export let StraightAttack: Attack = {
  name: "StraightAttack",
  speed: Speed.FAST,
  minDamage: 1,
  maxDamage: 3,
  attackBuffs: [],
  areaSize: {
    areaUp: 1,
    areaDown: 1,
    areaRight: 1,
    areaLeft: 1
  },
  area: generateGrid(
    [
      [0, 0, 0], 
      [0, 0, 0], 
      [0, 1, 0]
    ]
  )
}