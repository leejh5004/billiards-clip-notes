import { expect, test } from "vitest";
import { filterByKeyword, frequentKeywords } from "./classify";

test("only words in two or more entries become chips", () => {
  const chips = frequentKeywords([
    { keywords: ["짧게", "끌어치기"] },
    { keywords: ["끌어치기"] },
    { keywords: ["배치", "보고", "쳤음"] },
  ]);
  expect(chips).toEqual(["끌어치기"]);
});

test("duplicate inside one entry still counts as one document", () => {
  const chips = frequentKeywords([
    { keywords: ["끌어치기"] },
    { keywords: ["배치"] },
  ]);
  expect(chips).toEqual([]);
});

test("a word on many entries still appears once in the chip list", () => {
  const chips = frequentKeywords([
    { keywords: ["배치", "끌어치기"] },
    { keywords: ["배치"] },
    { keywords: ["배치"] },
  ]);
  expect(chips).toEqual(["배치"]);
});

test("filter keeps entries that contain the selected keyword", () => {
  const entries = [
    { id: "1", keywords: ["끌어치기"] },
    { id: "2", keywords: ["배치"] },
    { id: "3", keywords: ["끌어치기", "배치"] },
  ];
  expect(filterByKeyword(entries, "끌어치기").map((e) => e.id)).toEqual([
    "1",
    "3",
  ]);
});

test("null keyword returns all entries", () => {
  const entries = [{ id: "1", keywords: ["배치"] }];
  expect(filterByKeyword(entries, null)).toEqual(entries);
});
