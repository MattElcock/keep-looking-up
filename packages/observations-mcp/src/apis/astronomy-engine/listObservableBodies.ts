import {Body, Equator, Horizon, Illumination, MoonPhase, Observer, SearchRiseSet} from 'astronomy-engine';

const PLANETS = ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune'] as const;

type PlanetName = typeof PLANETS[number];

interface ObservableBody {
  name: string;
  altitudeDeg: number;
  azimuthDeg: number;
  magnitude: number;
  setsAt: string | null;
  isAboveHorizon: boolean;
}

interface ObservableMoon extends ObservableBody {
  phaseAngleDeg: number;
  phaseName: string;
  illuminationPct: number;
}

export interface ObservableBodies {
  observationTime: string;
  bodies: (ObservableMoon | ObservableBody)[];
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

const getBodyPosition = (body: Body, name: string, date: Date, observer: Observer) => {
  const equator = Equator(body, date, observer, true, true);
  const horizontal = Horizon(date, observer, equator.ra, equator.dec, 'normal');
  const illum = Illumination(body, date);
  const setEvent = SearchRiseSet(body, observer, -1, date, 1);

  return {
    name,
    altitudeDeg: Math.round(horizontal.altitude * 10) / 10,
    azimuthDeg: Math.round(horizontal.azimuth * 10) / 10,
    magnitude: Math.round(illum.mag * 10) / 10,
    isAboveHorizon: horizontal.altitude > 0,
    setsAt: setEvent ? setEvent.date.toISOString() : null,
  };
};

export const listObservableBodies = (
  latitude: number,
  longitude: number,
  datetime: string
): ObservableBodies => {
  const date = new Date(datetime);
  const observer = new Observer(latitude, longitude, 0);

  const planets = PLANETS
    .map(name => getBodyPosition(Body[name as PlanetName], name, date, observer))

  const moonPos = getBodyPosition(Body.Moon, 'Moon', date, observer);
  const phaseAngle = MoonPhase(date);
  const moonIllum = Illumination(Body.Moon, date);

  const moon: ObservableMoon = {
    name: moonPos.name,
    altitudeDeg: moonPos.altitudeDeg,
    azimuthDeg: moonPos.azimuthDeg,
    magnitude: moonPos.magnitude,
    setsAt: moonPos.setsAt,
    phaseAngleDeg: Math.round(phaseAngle * 10) / 10,
    phaseName: getMoonPhaseName(phaseAngle),
    illuminationPct: Math.round(moonIllum.phase_fraction * 100),
    isAboveHorizon: moonPos.isAboveHorizon,
  };

  const observableBodies = [moon, ...planets].filter(body => body.isAboveHorizon);

  return {
    observationTime: date.toISOString(),
    bodies: observableBodies
  };
};