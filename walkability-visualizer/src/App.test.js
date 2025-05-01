import fs from "fs";
import path from "path";
import React from "react";
import { render, screen } from "@testing-library/react";
import USMap from "./components/USMap";
import { distance, point } from "@turf/turf";
import { expect, test, describe, beforeAll } from "@jest/globals";

const csvPath = path.join(__dirname, "../public/walk_scores.csv");

describe("walk_scores.csv integrity", () => {
  it("should exist", () => {
    expect(fs.existsSync(csvPath)).toBe(true);
  });

  it("should contain valid CSV format", () => {
    const content = fs.readFileSync(csvPath, "utf8").trim();
    const rows = content.split("\n");
    const header = rows[0].split(",");
    expect(header).toEqual(["lat", "lon", "walk_score"]);

    for (let i = 1; i < rows.length; i++) {
      const [lat, lon, score] = rows[i].split(",");
      expect(!isNaN(parseFloat(lat))).toBe(true);
      expect(!isNaN(parseFloat(lon))).toBe(true);
      expect(!isNaN(parseInt(score))).toBe(true);
    }
  });
});

describe("USMap component", () => {
  it("renders without crashing for EPA model", () => {
    const { container } = render(<USMap model="EPA" />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders without crashing for 15MIN model", () => {
    const { container } = render(<USMap model="15MIN" />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders without crashing for WALK_SCORE model", () => {
    const { container } = render(<USMap model="WALK_SCORE" />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});

const cityPath = path.resolve("public/us-cities.json");
const walkScorePath = path.resolve("public/walk_scores.csv");
const ndaPath = path.resolve("public/nda_index.csv");

let cities = [];
beforeAll(() => {
  if (fs.existsSync(cityPath)) {
    const raw = fs.readFileSync(cityPath, "utf8");
    cities = JSON.parse(raw);
  }
});

describe("City dataset validation", () => {
  test("City data should exist and be valid JSON", () => {
    expect(Array.isArray(cities)).toBe(true);
    expect(cities.length).toBeGreaterThan(0);
  });

  test("Each city should have lat, lon, name, population, coordinates", () => {
    cities.forEach(city => {
      expect(city).toHaveProperty("name");
      expect(city).toHaveProperty("population");
      expect(city).toHaveProperty("coordinates");
      expect(city.coordinates).toHaveProperty("lat");
      expect(city.coordinates).toHaveProperty("lon");
      expect(typeof city.coordinates.lat).toBe("number");
      expect(typeof city.coordinates.lon).toBe("number");
    });
  });
});

describe("walk_scores.csv format validation", () => {
  test("walk_scores.csv should exist", () => {
    expect(fs.existsSync(walkScorePath)).toBe(true);
  });

  test("Each line should contain lat, lon, walk_score", () => {
    const rows = fs.readFileSync(walkScorePath, "utf8").trim().split("\n");
    const header = rows[0].split(",");
    expect(header).toEqual(["lat", "lon", "walk_score"]);
    rows.slice(1).forEach(row => {
      const [lat, lon, score] = row.split(",");
      expect(!isNaN(+lat)).toBe(true);
      expect(!isNaN(+lon)).toBe(true);
      expect(!isNaN(+score)).toBe(true);
      expect(+score).toBeGreaterThanOrEqual(0);
      expect(+score).toBeLessThanOrEqual(100);
    });
  });
});

describe("nda_index.csv format validation", () => {
  test("nda_index.csv should exist", () => {
    expect(fs.existsSync(ndaPath)).toBe(true);
  });

  test("Each row should have correct NDAI format", () => {
    const rows = fs.readFileSync(ndaPath, "utf8").trim().split("\n");
    const header = rows[0].split(",");
    expect(header).toEqual(["lat", "lon", "name", "state", "nda_index"]);
    rows.slice(1).forEach(row => {
      const [lat, lon, name, state, index] = row.split(",");
      expect(!isNaN(+lat)).toBe(true);
      expect(!isNaN(+lon)).toBe(true);
      expect(name.length).toBeGreaterThan(0);
      expect(state.length).toBeGreaterThan(0);
      expect(!isNaN(+index)).toBe(true);
    });
  });
});

describe("Geo distance utility test", () => {
  test("Turf distance between identical points is 0", () => {
    const pt = point([0, 0]);
    const d = distance(pt, pt, { units: "meters" });
    expect(d).toBeCloseTo(0);
  });

  test("Turf distance between different points is positive", () => {
    const pt1 = point([-122.335167, 47.608013]);
    const pt2 = point([-122.3355, 47.609]);
    const d = distance(pt1, pt2, { units: "meters" });
    expect(d).toBeGreaterThan(0);
  });
});
describe("Geo distance calculation", () => {
  test("Distance between two points should be positive", () => {
    const pt1 = point([-122.335167, 47.608013]);
    const pt2 = point([-122.3355, 47.609]);
    const d = distance(pt1, pt2, { units: "meters" });
    expect(d).toBeGreaterThan(0);
  });

  test("Distance between identical points should be zero", () => {
    const pt = point([0, 0]);
    const d = distance(pt, pt, { units: "meters" });
    expect(d).toBeCloseTo(0);
  });
});
