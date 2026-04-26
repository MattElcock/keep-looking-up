import {Body, Equator, Horizon, Illumination, Observer, SearchRiseSet} from "astronomy-engine";

export const getBodyPosition = (body: Body, name: string, date: Date, observer: Observer) => {
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