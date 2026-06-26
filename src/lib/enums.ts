import { z } from "zod";

export const Direction = ["IN", "OUT"] as const;
export type Direction = (typeof Direction)[number];
export const DirectionSchema = z.enum(Direction);

export const Scope = ["FARM", "PERSONAL"] as const;
export type Scope = (typeof Scope)[number];
export const ScopeSchema = z.enum(Scope);

export const Unit = ["KG", "L"] as const;
export type Unit = (typeof Unit)[number];
export const UnitSchema = z.enum(Unit);

export const LedgerSource = ["EXPENSE", "SALE", "SALARY", "ADJUSTMENT"] as const;
export type LedgerSource = (typeof LedgerSource)[number];
export const LedgerSourceSchema = z.enum(LedgerSource);

export const directionLabels: Record<Direction, string> = {
  IN: "وارد",
  OUT: "صادر",
};

export const scopeLabels: Record<Scope, string> = {
  FARM: "المزرعة",
  PERSONAL: "شخصي",
};

export const unitLabels: Record<Unit, string> = {
  KG: "كغم",
  L: "لتر",
};

export const ledgerSourceLabels: Record<LedgerSource, string> = {
  EXPENSE: "مصروف",
  SALE: "مبيع",
  SALARY: "أجور",
  ADJUSTMENT: "تسوية",
};
