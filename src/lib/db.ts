import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import { sortByNewest } from "./sortEntries";
import type { Entry } from "../types";

interface NotesDB extends DBSchema {
  entries: {
    key: string;
    value: Entry;
  };
}

const DB_NAME = "billiards-notes";
const STORE = "entries";

let dbPromise: Promise<IDBPDatabase<NotesDB>> | undefined;

export function openNotesDb(): Promise<IDBPDatabase<NotesDB>> {
  if (!dbPromise) {
    dbPromise = openDB<NotesDB>(DB_NAME, 1, {
      upgrade(db) {
        db.createObjectStore(STORE, { keyPath: "id" });
      },
    });
  }
  return dbPromise;
}

export async function saveEntry(entry: Entry): Promise<void> {
  const db = await openNotesDb();
  await db.put(STORE, entry);
}

export async function getEntry(id: string): Promise<Entry | undefined> {
  const db = await openNotesDb();
  return db.get(STORE, id);
}

export async function listEntries(): Promise<Entry[]> {
  const db = await openNotesDb();
  const all = await db.getAll(STORE);
  return sortByNewest(all);
}

export async function deleteEntry(id: string): Promise<void> {
  const db = await openNotesDb();
  await db.delete(STORE, id);
}
