import "fake-indexeddb/auto";
import { expect, test } from "vitest";
import { deleteEntry, getEntry, listEntries, saveEntry } from "./db";
import type { Entry } from "../types";

function makeEntry(partial: Partial<Entry> & Pick<Entry, "id" | "createdAt">): Entry {
  return {
    updatedAt: partial.createdAt,
    image: new Blob(["img"]),
    memo: "",
    keywords: [],
    ...partial,
  };
}

test("saves, lists newest first, reads, and deletes", async () => {
  const older = makeEntry({ id: "a", createdAt: 10, memo: "old" });
  const newer = makeEntry({ id: "b", createdAt: 20, memo: "new" });
  await saveEntry(older);
  await saveEntry(newer);

  const listed = await listEntries();
  expect(listed.map((e) => e.id)).toEqual(["b", "a"]);
  expect(listed[0]?.memo).toBe("new");

  const found = await getEntry("a");
  expect(found?.memo).toBe("old");

  await deleteEntry("a");
  expect(await getEntry("a")).toBeUndefined();
  expect((await listEntries()).map((e) => e.id)).toEqual(["b"]);
});
