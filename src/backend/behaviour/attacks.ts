import { Entity, Grid, LookDirection, Point2d, generateGrid, Speed } from "../../common/interfaces";
import { Buff } from "./buffs";

export interface Attack {
  speed: Speed;
  minDamage: number;
  maxDamage: number;
  attackBuffs: Buff[];
  areaSize: Grid;
  area: Record<LookDirection, number[][]>;
}

export let CircleAttack: Attack = {
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

export let UnevenAttack: Attack = {
  speed: Speed.SLOW,
  minDamage: 20,
  maxDamage: 30,
  attackBuffs: [],
  areaSize: {
    areaUp: 0,
    areaDown: 3,
    areaRight: 1,
    areaLeft: 1
  },
  area: generateGrid(
    [
      [1, 0, 1], 
      [1, 1, 1], 
      [1, 1, 1], 
      [1, 1, 1]
    ]
  )
}

export let SuperUnevenAttack: Attack = {
  speed: Speed.SLOW,
  minDamage: 20,
  maxDamage: 30,
  attackBuffs: [],
  areaSize: {
    areaUp: 1,
    areaDown: 2,
    areaRight: 2,
    areaLeft: 0
  },
  area: generateGrid(
    [
      [1, 1, 1], 
      [0, 1, 1], 
      [1, 1, 1], 
      [1, 1, 1]
    ]
  )

}