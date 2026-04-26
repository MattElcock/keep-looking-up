import {Body, Illumination, MoonPhase, Observer} from "astronomy-engine";
import {getBodyPosition} from "./utils.js";

interface Moon {
  name: string;
  altitudeDeg: number;
  azimuthDeg: number;
  magnitude: number;
  setsAt: string | null;
  isAboveHorizon: boolean;
  phaseAngleDeg: number;
  phaseName: string;
  illuminationPct: number;
}

const getMoonPhaseName = (angleDeg: number): string => {
  if (angleDeg < 22.5 || angleDeg >= 337.5) return 'new moon';
  if (angleDeg < 67.5) return 'waxing crescent';
  if (angleDeg < 112.5) return 'first quarter';
  if (angleDeg < 157.5) return 'waxing gibbous';
  if (angleDeg < 202.5) return 'full moon';
  if (angleDeg < 247.5) return 'waning gibbous';
  if (angleDeg < 292.5) return 'last quarter';
  return 'waning crescent';
};

const getMoon = (observer: Observer, date: Date): Moon => {

  const moonPos = getBodyPosition(Body.Moon, 'Moon', date, observer);
  const phaseAngle = MoonPhase(date);
  const moonIllum = Illumination(Body.Moon, date);

  return {
    name: moonPos.name,
    altitudeDeg: moonPos.altitudeDeg,
    azimuthDeg: moonPos.azimuthDeg,
    magnitude: moonPos.magnitude,
    setsAt: moonPos.setsAt,
    phaseAngleDeg: Math.round(phaseAngle * 10) / 10,
    phaseName: getMoonPhaseName(phaseAngle),
    illuminationPct: Math.round(moonIllum.phase_fraction * 100),
    isAboveHorizon: moonPos.isAboveHorizon,
  }
};

export default getMoon;