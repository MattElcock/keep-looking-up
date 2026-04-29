import type { AtmosphericConditions, ConditionRating } from "./types.js";

interface SevenTimerDataPoint {
  timepoint: number;
  cloudcover: number;
  seeing: number;
  transparency: number;
  lifted_index: number;
  rh2m: number;
  wind10m: { direction: string; speed: number };
  temp2m: number;
  prec_type: "none" | "rain" | "snow" | "frzr" | "icep";
}

interface SevenTimerApiResponse {
  product: string;
  init: string;
  dataseries: SevenTimerDataPoint[];
}

const CLOUD_COVER_PERCENT: Record<number, number> = {
  1: 3, 2: 12, 3: 25, 4: 37, 5: 50, 6: 62, 7: 75, 8: 87, 9: 97,
};

const RATING_ORDER: Record<ConditionRating, number> = {
  excellent: 0, good: 1, fair: 2, poor: 3,
};

const seeingLabel = (seeing: number): ConditionRating => {
  if (seeing <= 2) return "excellent";
  if (seeing <= 4) return "good";
  if (seeing <= 6) return "fair";
  return "poor";
};

const transparencyLabel = (transparency: number): ConditionRating => {
  if (transparency <= 2) return "excellent";
  if (transparency <= 4) return "good";
  if (transparency <= 6) return "fair";
  return "poor";
};

const cloudCoverLabel = (cloudCoverPercent: number): ConditionRating => {
  if (cloudCoverPercent < 10) return "excellent";
  if (cloudCoverPercent <= 30) return "good";
  if (cloudCoverPercent <= 60) return "fair";
  return "poor";
};

const worstRating = (...ratings: ConditionRating[]): ConditionRating =>
  ratings.reduce((worst, r) => (RATING_ORDER[r] > RATING_ORDER[worst] ? r : worst));

const parseInitDate = (init: string): Date =>
  new Date(
    `${init.slice(0, 4)}-${init.slice(4, 6)}-${init.slice(6, 8)}T${init.slice(8, 10)}:00:00Z`,
  );

export const processFetchedData = (data: SevenTimerApiResponse): AtmosphericConditions[] => {
  const initDate = parseInitDate(data.init);

  return data.dataseries.map((entry) => {
    const dt = new Date(initDate.getTime() + entry.timepoint * 3_600_000);
    const cloudCoverPercent = CLOUD_COVER_PERCENT[entry.cloudcover] ?? 50;
    const seenLabel = seeingLabel(entry.seeing);
    const transLabel = transparencyLabel(entry.transparency);
    const cloudLabel = cloudCoverLabel(cloudCoverPercent);
    const precipitation: AtmosphericConditions["precipitation"] =
      entry.prec_type === "none"
        ? "none"
        : entry.prec_type === "rain"
          ? "rain"
          : entry.prec_type === "snow"
            ? "snow"
            : "other";
    const precipRating: ConditionRating = precipitation === "none" ? "excellent" : "poor";

    return {
      datetime: dt.toISOString(),
      seeing: entry.seeing,
      seeingLabel: seenLabel,
      transparency: entry.transparency,
      transparencyLabel: transLabel,
      cloudCoverPercent,
      precipitation,
      conditions: worstRating(seenLabel, transLabel, cloudLabel, precipRating),
    };
  });
};

const fetchForecast = async (latitude: number, longitude: number): Promise<SevenTimerApiResponse> => {
  const url = `http://www.7timer.info/bin/astro.php?lon=${longitude}&lat=${latitude}&ac=0&unit=metric&output=json&tzoffset=0`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`7timer API returned ${response.status}: ${response.statusText}`);
  }
  return response.json() as Promise<SevenTimerApiResponse>;
};

export const getAtmosphericConditions = async (
  latitude: number,
  longitude: number,
  datetime: string,
  end_datetime?: string,
): Promise<AtmosphericConditions | AtmosphericConditions[]> => {
  const raw = await fetchForecast(latitude, longitude);
  const all = processFetchedData(raw);

  if (all.length === 0) {
    throw new Error("No forecast data available for this location");
  }

  if (!end_datetime) {
    const target = new Date(datetime).getTime();
    return all.reduce((closest, entry) => {
      const diff = Math.abs(new Date(entry.datetime).getTime() - target);
      const bestDiff = Math.abs(new Date(closest.datetime).getTime() - target);
      return diff < bestDiff ? entry : closest;
    });
  }

  const start = new Date(datetime).getTime();
  const end = new Date(end_datetime).getTime();
  return all.filter((entry) => {
    const t = new Date(entry.datetime).getTime();
    return t >= start && t <= end;
  });
};
