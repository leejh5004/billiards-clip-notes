import { expect, test } from "vitest";
import { sortByNewest } from "./sortEntries";

test("sorts by createdAt descending", () => {
  const sorted = sortByNewest([
    { id: "old", createdAt: 1 },
    { id: "new", createdAt: 3 },
    { id: "mid", createdAt: 2 },
  ]);
  expect(sorted.map((e) => e.id)).toEqual(["new", "mid", "old"]);
});
