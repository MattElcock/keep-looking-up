export interface OrbitalBodyApproach {
  approachDate: string;
  approachTime: string;
  distanceKm: number;
  distanceLunar: number;
  velocityKmPerSec: number;
  orbitalBody: string;
}

export interface BaseAsteroid {
  id: string;
  name: string;
  absoluteMagnitudeH: number;
  estimatedDiameterKm: number;
  isPotentiallyHazardous: boolean;
}
