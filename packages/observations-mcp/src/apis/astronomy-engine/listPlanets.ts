import { Body, Observer } from "astronomy-engine";
import { getBodyPosition } from "./utils.js";

const PlanetNames = [
  "Mercury",
  "Venus",
  "Mars",
  "Jupiter",
  "Saturn",
  "Uranus",
  "Neptune",
] as const;

export const listPlanets = (observer: Observer, date: Date) => {
  return PlanetNames.map((name) =>
    getBodyPosition(Body[name], name, date, observer),
  );
};
