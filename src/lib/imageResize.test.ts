import { expect, test } from "vitest";
import { fitWithin } from "./imageResize";

test("leaves small images unchanged", () => {
  expect(fitWithin(800, 600)).toEqual({ width: 800, height: 600 });
});

test("scales landscape so the long edge is 1280", () => {
  expect(fitWithin(2560, 1440)).toEqual({ width: 1280, height: 720 });
});

test("scales portrait so the long edge is 1280", () => {
  expect(fitWithin(1080, 2160)).toEqual({ width: 640, height: 1280 });
});
