import { BaseAsteroid, OrbitalBodyApproach } from "./types.js";

const NEO_LOOKUP_API_URL = "https://api.nasa.gov/neo/rest/v1/neo/";

interface DetailedAsteroid extends BaseAsteroid {
  designation: string;
  orbitalBodyApproaches: OrbitalBodyApproach[];
  orbitFirstObserved: string;
  orbitLastObserved: string;
  orbitUncertainty: number;
  minimumOrbitIntersectionAU: number;
  eccentricity: number;
  inclination: number;
  timeToOrbitSunDays: number;
  averageDistanceToSunAU: number;
  closestPointToSunAU: number;
  farthestPointFromSunAU: number;
  orbitClass: string;
}

interface ApiResponse {
  id: string;
  name: string;
  designation: string;
  absolute_magnitude_h: number;
  estimated_diameter: {
    kilometers: {
      estimated_diameter_min: number;
      estimated_diameter_max: number;
    };
  };
  is_potentially_hazardous_asteroid: boolean;
  close_approach_data: Array<{
    close_approach_date_full: string;
    miss_distance: {
      kilometers: string;
      lunar: string;
    };
    relative_velocity: {
      kilometers_per_second: string;
    };
    orbiting_body: string;
  }>;
  orbital_data: {
    first_observation_date: string;
    last_observation_date: string;
    orbit_uncertainty: string;
    minimum_orbit_intersection: string;
    eccentricity: string;
    inclination: string;
    orbital_period: string;
    semi_major_axis: string;
    perihelion_distance: string;
    aphelion_distance: string;
    orbit_class: {
      orbit_class_description: string;
    };
  };
}

const fetchData = async (url: URL): Promise<ApiResponse> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch data");
  }
  return response.json();
};

const processFetchedData = (data: ApiResponse): DetailedAsteroid => {
  const orbitalBodyApproaches: OrbitalBodyApproach[] =
    data.close_approach_data.map((approach) => {
      const [approachDate, approachTime] =
        approach.close_approach_date_full.split(" ");
      return {
        approachDate,
        approachTime,
        distanceKm: parseFloat(approach.miss_distance.kilometers),
        distanceLunar: parseFloat(approach.miss_distance.lunar),
        velocityKmPerSec: parseFloat(
          approach.relative_velocity.kilometers_per_second,
        ),
        orbitalBody: approach.orbiting_body,
      };
    });

  return {
    id: data.id,
    name: data.name,
    designation: data.designation,
    absoluteMagnitudeH: data.absolute_magnitude_h,
    estimatedDiameterKm:
      data.estimated_diameter.kilometers.estimated_diameter_min,
    isPotentiallyHazardous: data.is_potentially_hazardous_asteroid,
    orbitalBodyApproaches,
    orbitFirstObserved: data.orbital_data.first_observation_date,
    orbitLastObserved: data.orbital_data.last_observation_date,
    orbitUncertainty: parseInt(data.orbital_data.orbit_uncertainty),
    minimumOrbitIntersectionAU: parseFloat(
      data.orbital_data.minimum_orbit_intersection,
    ),
    eccentricity: parseFloat(data.orbital_data.eccentricity),
    inclination: parseFloat(data.orbital_data.inclination),
    timeToOrbitSunDays: parseFloat(data.orbital_data.orbital_period),
    averageDistanceToSunAU: parseFloat(data.orbital_data.semi_major_axis),
    closestPointToSunAU: parseFloat(data.orbital_data.perihelion_distance),
    farthestPointFromSunAU: parseFloat(data.orbital_data.aphelion_distance),
    orbitClass: data.orbital_data.orbit_class.orbit_class_description,
  };
};

const getDetailedAsteroid = async (
  asteroidId: string,
): Promise<DetailedAsteroid> => {
  const api_key = process.env.NASA_API_KEY;
  const url = new URL(asteroidId, NEO_LOOKUP_API_URL);

  if (!api_key) throw new Error("env var NASA_API_KEY is not set");

  url.searchParams.append("api_key", api_key);

  try {
    const data = await fetchData(url);

    return processFetchedData(data);
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
};

export default getDetailedAsteroid;
