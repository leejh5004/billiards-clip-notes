import { expect, test } from "vitest";
import { extractKeywords } from "./wordExtract";

test("strips josa and stopwords and keeps unique words", () => {
  expect(extractKeywords("짧게 끌어치기")).toEqual(["짧게", "끌어치기"]);
  expect(extractKeywords("끌어치기 각이 큼")).toEqual(["끌어치기"]);
  expect(extractKeywords("배치만 보고 쳤음")).toEqual(["배치", "보고", "쳤음"]);
});

test("counts a repeated word once inside one memo", () => {
  expect(extractKeywords("끌어치기 끌어치기")).toEqual(["끌어치기"]);
});

test("drops one-character tokens", () => {
  expect(extractKeywords("각 큼")).toEqual([]);
});

test("drops listed stopwords", () => {
  expect(extractKeywords("너무 그냥 배치")).toEqual(["배치"]);
});

test("lowercases english and splits on punctuation", () => {
  expect(extractKeywords("Draw! Draw 샷")).toEqual(["draw"]);
});

test("empty memo yields no keywords", () => {
  expect(extractKeywords("")).toEqual([]);
  expect(extractKeywords("   ")).toEqual([]);
});

test("strips josa at most once per side", () => {
  expect(extractKeywords("각도가 안 맞았다")).toEqual(["각도", "맞았다"]);
});

test("treats foreign characters as separators", () => {
  expect(extractKeywords("끌어치기ㅋㅋ 배치")).toEqual(["끌어치기", "배치"]);
  expect(extractKeywords("café배치 끌어치기")).toEqual(["caf", "배치", "끌어치기"]);
  expect(extractKeywords("прямо ドロー 漢字 café 배치")).toEqual(["caf", "배치"]);
});

test("does not strip leading syllables that look like josa", () => {
  expect(extractKeywords("와이드 밀어치기")).toEqual(["와이드", "밀어치기"]);
});

test("normalizes nfd hangul so apple-style input still extracts", () => {
  const nfd = "배치".normalize("NFD");
  expect(extractKeywords(nfd + " 끌어치기")).toEqual(["배치", "끌어치기"]);
});

test("keeps billiards nouns that look like they end in josa", () => {
  expect(extractKeywords("두께 각도 속도")).toEqual(["두께", "각도", "속도"]);
  expect(extractKeywords("두께를 두껍게")).toEqual(["두께", "두껍게"]);
});
