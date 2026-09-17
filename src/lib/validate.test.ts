import { expect, test } from "vitest";
import { photoMissing } from "./validate";

test("rejects missing photo for a new entry", () => {
  expect(photoMissing(null)).toBe(true);
  expect(photoMissing(undefined)).toBe(true);
  expect(photoMissing(new Blob([]))).toBe(true);
});

test("accepts a non-empty photo blob", () => {
  expect(photoMissing(new Blob(["img"]))).toBe(false);
});
