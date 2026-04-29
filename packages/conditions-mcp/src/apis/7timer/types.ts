export type ConditionRating = "excellent" | "good" | "fair" | "poor";

export interface AtmosphericConditions {
  datetime: string;
  seeing: number;
  seeingLabel: ConditionRating;
  transparency: number;
  transparencyLabel: ConditionRating;
  cloudCoverPercent: number;
  precipitation: "none" | "rain" | "snow" | "other";
  conditions: ConditionRating;
}
