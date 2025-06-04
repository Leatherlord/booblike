import { Entity, LookDirection } from "../../common/interfaces";
import { Buff } from "./buffs";

export type AttackGrid = {
  areaUp: number;
  areaDown: number;
  areaRight: number;
  areaLeft: number
}

export function getAttackGridSize(grid: AttackGrid, direction: LookDirection) {
  const isVertical = direction === LookDirection.Up || direction === LookDirection.Down;
  return {
    x: isVertical 
      ? grid.areaLeft + grid.areaRight + 1 
      : grid.areaUp + grid.areaDown + 1,
    y: isVertical 
      ? grid.areaUp + grid.areaDown + 1 
      : grid.areaLeft + grid.areaRight + 1,
  };
}

export function getOffsets(
  entity: Entity, 
  attack: Attack,
) {
  let xOffset = 0;
  let yOffset = 0;

  switch (entity.lookDir) {
    case LookDirection.Up:
      xOffset = attack.areaSize.areaRight;
      yOffset = attack.areaSize.areaDown;
      break;
    case LookDirection.Down:
      xOffset = attack.areaSize.areaLeft;
      yOffset = attack.areaSize.areaUp;
      break;
    case LookDirection.Left:
      xOffset = attack.areaSize.areaDown;
      yOffset = attack.areaSize.areaLeft;
      break;
    case LookDirection.Right:
      xOffset = attack.areaSize.areaUp;
      yOffset = attack.areaSize.areaRight;
      break;
  }
  return {
    x: xOffset,
    y: yOffset,
  };
}

function rotateMatrixRight(matrix: number[][]): number[][] {
  return matrix[0].map((_, i) => matrix.map(row => row[i]).reverse());
}

function rotateMatrixLeft(matrix: number[][]): number[][] {
  return matrix[0].map((_, i) => matrix.map(row => row[row.length - 1 - i]));
}

function rotateMatrix180(matrix: number[][]): number[][] {
  return matrix.slice().reverse().map(row => row.slice().reverse());
}

function generateAttackGrid(base: number[][]): Record<LookDirection, number[][]> {
  return {
    [LookDirection.Up]: rotateMatrix180(base),
    [LookDirection.Right]: rotateMatrixLeft(base),
    [LookDirection.Down]: base,
    [LookDirection.Left]: rotateMatrixRight(base),
  };
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
  area: generateAttackGrid(
    [
      [1, 1, 1], 
      [1, 0, 1], 
      [1, 1, 1]
    ]
  )
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
  area: generateAttackGrid(
    [
      [0, 0, 0], 
      [0, 0, 0], 
      [0, 1, 0]
    ]
  )
}

export let UnevenAttack: Attack = {
  minDamage: 20,
  maxDamage: 30,
  attackBuffs: [],
  areaSize: {
    areaUp: 0,
    areaDown: 3,
    areaRight: 1,
    areaLeft: 1
  },
  area: generateAttackGrid(
    [
      [1, 0, 1], 
      [1, 1, 1], 
      [1, 1, 1], 
      [1, 1, 1]
    ]
  )
}

export let SuperUnevenAttack: Attack = {
  minDamage: 20,
  maxDamage: 30,
  attackBuffs: [],
  areaSize: {
    areaUp: 1,
    areaDown: 2,
    areaRight: 2,
    areaLeft: 0
  },
  area: generateAttackGrid(
    [
      [1, 1, 1], 
      [0, 1, 1], 
      [1, 1, 1], 
      [1, 1, 1]
    ]
  )

}