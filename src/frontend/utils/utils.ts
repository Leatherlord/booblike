import { Point2d } from "../../common/interfaces";

export function pointToKey(p: Point2d): string {
  return `${p.x},${p.y}`;
}

export function createEmptySquareMask(dim: number): number[][] {
  return Array<number[]>(dim).fill(Array<number>(dim).fill(0));
}

export function createEmptyMask(dimX: number, dimY: number): number[][] {
  return Array.from({ length: dimY }, () => Array(dimX).fill(0));
}

