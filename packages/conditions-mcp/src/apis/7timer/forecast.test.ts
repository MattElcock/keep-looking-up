import { describe, it, expect } from "vitest";
import { processFetchedData } from "./forecast.js";

const makeDataPoint = (overrides: Partial<{
  timepoint: number;
  cloudcover: number;
  seeing: number;
  transparency: number;
  prec_type: "none" | "rain" | "snow" | "frzr" | "icep";
}> = {}) => ({
  timepoint: 1,
  cloudcover: 1,
  seeing: 1,
  transparency: 1,
  lifted_index: 10,
  rh2m: 3,
  wind10m: { direction: "NW", speed: 2 },
  temp2m: 10,
  prec_type: "none" as const,
  ...overrides,
});

const makeFixture = (dataPoints: ReturnType<typeof makeDataPoint>[]) => ({
  product: "astro",
  init: "2026042800",
  dataseries: dataPoints,
});

describe("processFetchedData", () => {
  it("computes datetime from init and timepoint", () => {
    const result = processFetchedData(makeFixture([makeDataPoint({ timepoint: 1 })]));
    expect(result[0].datetime).toBe("2026-04-28T01:00:00.000Z");
  });

  it("computes datetime for later timepoints", () => {
    const result = processFetchedData(makeFixture([makeDataPoint({ timepoint: 7 })]));
    expect(result[0].datetime).toBe("2026-04-28T07:00:00.000Z");
  });

  it("maps cloudcover 1 to 3%", () => {
    const result = processFetchedData(makeFixture([makeDataPoint({ cloudcover: 1 })]));
    expect(result[0].cloudCoverPercent).toBe(3);
  });

  it("maps cloudcover 5 to 50%", () => {
    const result = processFetchedData(makeFixture([makeDataPoint({ cloudcover: 5 })]));
    expect(result[0].cloudCoverPercent).toBe(50);
  });

  it("maps cloudcover 9 to 97%", () => {
    const result = processFetchedData(makeFixture([makeDataPoint({ cloudcover: 9 })]));
    expect(result[0].cloudCoverPercent).toBe(97);
  });

  it("labels seeing 1 as excellent and passes raw value through", () => {
    const result = processFetchedData(makeFixture([makeDataPoint({ seeing: 1 })]));
    expect(result[0].seeing).toBe(1);
    expect(result[0].seeingLabel).toBe("excellent");
  });

  it("labels seeing 2 as excellent", () => {
    const result = processFetchedData(makeFixture([makeDataPoint({ seeing: 2 })]));
    expect(result[0].seeingLabel).toBe("excellent");
  });

  it("labels seeing 3 as good", () => {
    const result = processFetchedData(makeFixture([makeDataPoint({ seeing: 3 })]));
    expect(result[0].seeingLabel).toBe("good");
  });

  it("labels seeing 4 as good", () => {
    const result = processFetchedData(makeFixture([makeDataPoint({ seeing: 4 })]));
    expect(result[0].seeingLabel).toBe("good");
  });

  it("labels seeing 5 as fair", () => {
    const result = processFetchedData(makeFixture([makeDataPoint({ seeing: 5 })]));
    expect(result[0].seeingLabel).toBe("fair");
  });

  it("labels seeing 6 as fair", () => {
    const result = processFetchedData(makeFixture([makeDataPoint({ seeing: 6 })]));
    expect(result[0].seeingLabel).toBe("fair");
  });

  it("labels seeing 7 as poor", () => {
    const result = processFetchedData(makeFixture([makeDataPoint({ seeing: 7 })]));
    expect(result[0].seeingLabel).toBe("poor");
  });

  it("labels seeing 8 as poor", () => {
    const result = processFetchedData(makeFixture([makeDataPoint({ seeing: 8 })]));
    expect(result[0].seeingLabel).toBe("poor");
  });

  it("labels transparency 1 as excellent", () => {
    const result = processFetchedData(makeFixture([makeDataPoint({ transparency: 1 })]));
    expect(result[0].transparencyLabel).toBe("excellent");
  });

  it("labels transparency 2 as excellent", () => {
    const result = processFetchedData(makeFixture([makeDataPoint({ transparency: 2 })]));
    expect(result[0].transparencyLabel).toBe("excellent");
  });

  it("labels transparency 3 as good", () => {
    const result = processFetchedData(makeFixture([makeDataPoint({ transparency: 3 })]));
    expect(result[0].transparencyLabel).toBe("good");
  });

  it("labels transparency 4 as good", () => {
    const result = processFetchedData(makeFixture([makeDataPoint({ transparency: 4 })]));
    expect(result[0].transparencyLabel).toBe("good");
  });

  it("labels transparency 5 as fair", () => {
    const result = processFetchedData(makeFixture([makeDataPoint({ transparency: 5 })]));
    expect(result[0].transparencyLabel).toBe("fair");
  });

  it("labels transparency 6 as fair", () => {
    const result = processFetchedData(makeFixture([makeDataPoint({ transparency: 6 })]));
    expect(result[0].transparencyLabel).toBe("fair");
  });

  it("labels transparency 7 as poor", () => {
    const result = processFetchedData(makeFixture([makeDataPoint({ transparency: 7 })]));
    expect(result[0].transparencyLabel).toBe("poor");
  });

  it("labels transparency 8 as poor", () => {
    const result = processFetchedData(makeFixture([makeDataPoint({ transparency: 8 })]));
    expect(result[0].transparencyLabel).toBe("poor");
  });

  it("maps prec_type none to precipitation none", () => {
    const result = processFetchedData(makeFixture([makeDataPoint({ prec_type: "none" })]));
    expect(result[0].precipitation).toBe("none");
  });

  it("maps prec_type rain to precipitation rain", () => {
    const result = processFetchedData(makeFixture([makeDataPoint({ prec_type: "rain" })]));
    expect(result[0].precipitation).toBe("rain");
  });

  it("maps prec_type snow to precipitation snow", () => {
    const result = processFetchedData(makeFixture([makeDataPoint({ prec_type: "snow" })]));
    expect(result[0].precipitation).toBe("snow");
  });

  it("maps prec_type frzr to precipitation other", () => {
    const result = processFetchedData(makeFixture([makeDataPoint({ prec_type: "frzr" })]));
    expect(result[0].precipitation).toBe("other");
  });

  it("maps prec_type icep to precipitation other", () => {
    const result = processFetchedData(makeFixture([makeDataPoint({ prec_type: "icep" })]));
    expect(result[0].precipitation).toBe("other");
  });

  it("rates conditions excellent when all factors are excellent", () => {
    const result = processFetchedData(makeFixture([
      makeDataPoint({ cloudcover: 1, seeing: 1, transparency: 1, prec_type: "none" }),
    ]));
    expect(result[0].conditions).toBe("excellent");
  });

  it("rates conditions good when seeing is good and rest excellent", () => {
    const result = processFetchedData(makeFixture([
      makeDataPoint({ cloudcover: 1, seeing: 3, transparency: 1, prec_type: "none" }),
    ]));
    expect(result[0].conditions).toBe("good");
  });

  it("rates conditions poor when seeing is poor", () => {
    const result = processFetchedData(makeFixture([
      makeDataPoint({ cloudcover: 1, seeing: 8, transparency: 1, prec_type: "none" }),
    ]));
    expect(result[0].conditions).toBe("poor");
  });

  it("rates conditions poor when there is precipitation", () => {
    const result = processFetchedData(makeFixture([
      makeDataPoint({ cloudcover: 1, seeing: 1, transparency: 1, prec_type: "rain" }),
    ]));
    expect(result[0].conditions).toBe("poor");
  });

  it("rates conditions fair when cloud cover is 50% and rest excellent", () => {
    const result = processFetchedData(makeFixture([
      makeDataPoint({ cloudcover: 5, seeing: 1, transparency: 1, prec_type: "none" }),
    ]));
    expect(result[0].conditions).toBe("fair");
  });

  it("processes multiple dataseries entries", () => {
    const result = processFetchedData(makeFixture([
      makeDataPoint({ timepoint: 1 }),
      makeDataPoint({ timepoint: 4 }),
      makeDataPoint({ timepoint: 7 }),
    ]));
    expect(result).toHaveLength(3);
  });
});
