import { BaseAsteroid, OrbitalBodyApproach } from "./types.js";

const NEO_FEED_API_URL = "https://api.nasa.gov/neo/rest/v1/feed";

interface FeedAsteroid extends BaseAsteroid {
  orbitalBodyApproach: OrbitalBodyApproach;
}

interface AsteroidsOnDate {
  date: string;
  objects: FeedAsteroid[];
}

interface ApiResponse {
  "near_earth_objects": Record<string, Array<{
    id: string;
    name: string;
    "absolute_magnitude_h": number;
    "estimated_diameter": {
      kilometers: {
        "estimated_diameter_min": number;
        "estimated_diameter_max": number;
      };
    };
    "is_potentially_hazardous_asteroid": boolean;
    "close_approach_data": Array<{
      "close_approach_date": string;
      "close_approach_date_full": string;
      "miss_distance": {
        kilometers: string;
        lunar: string;
      };
      "relative_velocity": {
        "kilometers_per_second": string;
      };
      "orbiting_body": string;
    }>;
  }>>;
}

const fetchData = async (url: URL) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch data");
  }

  const data: ApiResponse = await response.json();

  return data;
}

const processFetchedData = (data: ApiResponse): AsteroidsOnDate[] => {
  const dates = Object.keys(data.near_earth_objects);

  return dates.map(date => {
    const objects = data.near_earth_objects[date];

    const parsedObjects: FeedAsteroid[] = objects.map(obj => {
      const closeApproachDateFull = obj["close_approach_data"][0]["close_approach_date_full"];
      const [closeApproachDate, closeApproachTime] = closeApproachDateFull.split(" ");

      return {
        id: obj.id,
        name: obj.name,
        absoluteMagnitudeH: obj["absolute_magnitude_h"],
        estimatedDiameterKm: obj["estimated_diameter"]["kilometers"]["estimated_diameter_min"],
        isPotentiallyHazardous: obj["is_potentially_hazardous_asteroid"],
        orbitalBodyApproach: {
          approachDate: closeApproachDate,
          approachTime: closeApproachTime,
          distanceKm: parseFloat(obj["close_approach_data"][0]["miss_distance"]["kilometers"]),
          distanceLunar: parseFloat(obj["close_approach_data"][0]["miss_distance"]["lunar"]),
          velocityKmPerSec: parseFloat(obj["close_approach_data"][0]["relative_velocity"]["kilometers_per_second"]),
          orbitalBody: obj["close_approach_data"][0]["orbiting_body"],
        }
      }
    })

    const neoObjectsOnDate: AsteroidsOnDate = {
      date: date,
      objects: parsedObjects
    }

    return neoObjectsOnDate
  })

}

const listAsteroids = async (start_date: string, end_date: string): Promise<AsteroidsOnDate[]> => {
  const api_key = process.env.NASA_API_KEY;
  const url = new URL(NEO_FEED_API_URL);

  if(!api_key) throw new Error(
    "env var NASA_API_KEY is not set"
  )

  url.searchParams.append("start_date", start_date);
  url.searchParams.append("end_date", end_date);
  url.searchParams.append("api_key", api_key);

  try {
    const data = await fetchData(url);

    return processFetchedData(data);
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
}

export default listAsteroids;