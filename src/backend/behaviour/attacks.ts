import {
  Grid,
  LookDirection,
  generateGrid,
  Speed,
} from '../../common/interfaces';
import { Buff } from './buffs';

export interface Attack {
  name: string;
  speed: Speed;
  minDamage: number;
  maxDamage: number;
  attackBuffs: Buff[];
  areaSize: Grid;
  area: Record<LookDirection, number[][]>;
}
