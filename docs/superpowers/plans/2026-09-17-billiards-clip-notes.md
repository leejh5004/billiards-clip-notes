# 당구 캡처 메모 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 폰에서 당구 영상 캡처를 고르고 사진 아래에 메모를 남기며, 여러 기록에 반복된 단어만 자동 분류 버튼으로 보여주는 로컬 PWA를 만든다.

**Architecture:** Vite + React 단일 페이지. 목록(`/`)·새 글(`/new`)·편집(`/entry/:id`)만 둔다. 사진과 메모는 IndexedDB(`billiards-notes` / `entries`)에만 저장한다. 단어 추출·빈도 분류·이미지 축소는 UI와 분리된 순수 모듈이다.

**Tech Stack:** Vite, TypeScript, React, React Router, `idb`, `vite-plugin-pwa`, Vitest, jsdom, fake-indexeddb

**Spec:** `docs/superpowers/specs/2026-09-17-billiards-clip-notes-design.md`

---

## File structure

| Path | Responsibility |
| --- | --- |
| `package.json` | 스크립트와 의존성 |
| `vite.config.ts` | Vite, PWA, Vitest |
| `index.html` | 엔트리 HTML |
| `src/main.tsx` | React 마운트, 라우터 |
| `src/App.tsx` | 라우트 정의 |
| `src/index.css` | 폰 폭 레이아웃, 줄노트 메모칸 |
| `src/types.ts` | `Entry` 타입 |
| `src/lib/wordExtract.ts` | 메모 → 단어 집합 |
| `src/lib/classify.ts` | 2회 이상 단어, 단어 필터 |
| `src/lib/sortEntries.ts` | `createdAt` 내림차순 |
| `src/lib/validate.ts` | 새 기록 사진 필수 |
| `src/lib/imageResize.ts` | 긴 변 1280, JPEG 0.8 |
| `src/lib/db.ts` | IndexedDB CRUD |
| `src/lib/*.test.ts` | 단위 테스트 |
| `src/pages/ListPage.tsx` | 목록, 분류 버튼, 썸네일 |
| `src/pages/EditorPage.tsx` | 새 글·편집·삭제 |
| `public/icon.svg` | PWA 아이콘 |

테스트는 `src/lib`에 둔다. 화면은 로직 모듈을 호출만 한다.

---

### Task 1: 프로젝트 뼈대

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.app.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/vite-env.d.ts`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `.gitignore`

- [ ] **Step 1: git 저장소가 없으면 초기화하고 `.gitignore`를 만든다**

```gitignore
node_modules
dist
.DS_Store
*.local
```

Run (PowerShell, repo root `C:\Users\hoons\태훈`):

```powershell
if (-not (Test-Path .git)) { git init }
```

Expected: `.git` 폴더가 있다. 이미 있으면 그대로 둔다.

- [ ] **Step 2: `package.json`을 작성한다**

```json
{
  "name": "billiards-clip-notes",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run"
  }
}
```

- [ ] **Step 3: 의존성을 설치한다**

```powershell
npm install react react-dom react-router-dom idb
npm install -D typescript vite @vitejs/plugin-react vite-plugin-pwa vitest jsdom fake-indexeddb @types/react @types/react-dom
```

Expected: `node_modules`가 생기고 오류 없이 끝난다.

- [ ] **Step 4: TypeScript 설정을 작성한다**

`tsconfig.json`:

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

`tsconfig.app.json`:

```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
  },
  "include": ["src"]
}
```

`tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.node.tsbuildinfo",
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
  },
  "include": ["vite.config.ts"]
}
```

`src/vite-env.d.ts`:

```ts
/// <reference types="vite/client" />
```

- [ ] **Step 5: Vite + Vitest 설정을 작성한다**

`vite.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
  },
});
```

PWA 플러그인은 Task 11에서 붙인다.

- [ ] **Step 6: HTML과 빈 앱을 작성한다**

`index.html`:

```html
<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="theme-color" content="#1a1a1a" />
    <title>당구 캡처 메모</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`src/App.tsx`:

```tsx
export default function App() {
  return <p>당구 캡처 메모</p>;
}
```

`src/main.tsx`:

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
```

- [ ] **Step 7: 테스트 러너가 도는지 확인한다**

`src/smoke.test.ts`:

```ts
import { expect, test } from "vitest";

test("vitest runs", () => {
  expect(1 + 1).toBe(2);
});
```

Run:

```powershell
npm test
```

Expected: PASS `vitest runs`. 그다음 `src/smoke.test.ts`를 삭제한다.

- [ ] **Step 8: Commit**

```powershell
git add package.json package-lock.json tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts index.html src/main.tsx src/App.tsx src/vite-env.d.ts .gitignore
git commit -m "chore: scaffold vite react app for clip notes"
```

---

### Task 2: `Entry` 타입

**Files:**
- Create: `src/types.ts`

- [ ] **Step 1: 타입을 작성한다**

```ts
export type Entry = {
  id: string;
  createdAt: number;
  updatedAt: number;
  image: Blob;
  memo: string;
  keywords: string[];
};
```

스펙 필드와 이름을 맞춘다. 이후 모듈은 이 타입만 쓴다.

- [ ] **Step 2: Commit**

```powershell
git add src/types.ts
git commit -m "feat: add Entry type"
```

---

### Task 3: 단어 추출

**Files:**
- Create: `src/lib/wordExtract.test.ts`
- Create: `src/lib/wordExtract.ts`

- [ ] **Step 1: Write the failing test**

```ts
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
  expect(extractKeywords("Draw! Draw 샷")).toEqual(["draw", "샷"]);
});

test("empty memo yields no keywords", () => {
  expect(extractKeywords("")).toEqual([]);
  expect(extractKeywords("   ")).toEqual([]);
});
```

- [ ] **Step 2: Run test to verify it fails**

```powershell
npx vitest run src/lib/wordExtract.test.ts
```

Expected: FAIL — `extractKeywords` is not defined (또는 모듈을 찾을 수 없음).

- [ ] **Step 3: Write minimal implementation**

`src/lib/wordExtract.ts`:

```ts
const JOSA = [
  "에서",
  "으로",
  "부터",
  "까지",
  "한테",
  "은",
  "는",
  "이",
  "가",
  "을",
  "를",
  "의",
  "에",
  "로",
  "와",
  "과",
  "도",
  "만",
  "께",
];

const STOPWORDS = new Set([
  "그리고",
  "그래서",
  "근데",
  "그러나",
  "너무",
  "아주",
  "조금",
  "그냥",
  "정말",
  "진짜",
  "이거",
  "저거",
  "그것",
  "이것",
  "오늘",
  "지금",
  "하다",
  "있다",
  "없다",
  "같다",
  "되다",
  "이다",
  "않다",
]);

function stripJosa(token: string): string {
  let result = token;
  let changed = true;
  while (changed && result.length > 0) {
    changed = false;
    for (const josa of JOSA) {
      if (result.endsWith(josa)) {
        result = result.slice(0, -josa.length);
        changed = true;
        break;
      }
      if (result.startsWith(josa)) {
        result = result.slice(josa.length);
        changed = true;
        break;
      }
    }
  }
  return result;
}

export function extractKeywords(memo: string): string[] {
  const parts = memo.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  const seen = new Set<string>();
  const keywords: string[] = [];

  for (const part of parts) {
    const stripped = stripJosa(part).toLowerCase();
    if (!stripped) continue;
    if (!/^[\p{L}\p{N}]+$/u.test(stripped)) continue;
    if ([...stripped].length < 2) continue;
    if (STOPWORDS.has(stripped)) continue;
    if (seen.has(stripped)) continue;
    seen.add(stripped);
    keywords.push(stripped);
  }

  return keywords;
}
```

한글 한 글자 길이는 `[...stripped].length`로 센다.

- [ ] **Step 4: Run test to verify it passes**

```powershell
npx vitest run src/lib/wordExtract.test.ts
```

Expected: PASS 전체.

- [ ] **Step 5: Commit**

```powershell
git add src/lib/wordExtract.ts src/lib/wordExtract.test.ts
git commit -m "feat: extract keywords from memo text"
```

---

### Task 4: 빈도 분류와 필터

**Files:**
- Create: `src/lib/classify.test.ts`
- Create: `src/lib/classify.ts`

- [ ] **Step 1: Write the failing test**

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

```powershell
npx vitest run src/lib/classify.test.ts
```

Expected: FAIL — `frequentKeywords` is not defined.

- [ ] **Step 3: Write minimal implementation**

```ts
export function frequentKeywords(
  entries: { keywords: string[] }[],
): string[] {
  const counts = new Map<string, number>();
  for (const entry of entries) {
    const unique = new Set(entry.keywords);
    for (const word of unique) {
      counts.set(word, (counts.get(word) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ko"))
    .map(([word]) => word);
}

export function filterByKeyword<T extends { keywords: string[] }>(
  entries: T[],
  keyword: string | null,
): T[] {
  if (!keyword) return entries;
  return entries.filter((entry) => entry.keywords.includes(keyword));
}
```

- [ ] **Step 4: Run test to verify it passes**

```powershell
npx vitest run src/lib/classify.test.ts
```

Expected: PASS 전체.

- [ ] **Step 5: Commit**

```powershell
git add src/lib/classify.ts src/lib/classify.test.ts
git commit -m "feat: classify repeated keywords across notes"
```

---

### Task 5: 최신순 정렬과 사진 필수 검사

**Files:**
- Create: `src/lib/sortEntries.test.ts`
- Create: `src/lib/sortEntries.ts`
- Create: `src/lib/validate.test.ts`
- Create: `src/lib/validate.ts`

- [ ] **Step 1: Write the failing tests**

`src/lib/sortEntries.test.ts`:

```ts
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
```

`src/lib/validate.test.ts`:

```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

```powershell
npx vitest run src/lib/sortEntries.test.ts src/lib/validate.test.ts
```

Expected: FAIL — 모듈 없음.

- [ ] **Step 3: Write minimal implementation**

`src/lib/sortEntries.ts`:

```ts
export function sortByNewest<T extends { createdAt: number }>(entries: T[]): T[] {
  return [...entries].sort((a, b) => b.createdAt - a.createdAt);
}
```

`src/lib/validate.ts`:

```ts
export function photoMissing(image: Blob | null | undefined): boolean {
  return !image || image.size === 0;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```powershell
npx vitest run src/lib/sortEntries.test.ts src/lib/validate.test.ts
```

Expected: PASS 전체.

- [ ] **Step 5: Commit**

```powershell
git add src/lib/sortEntries.ts src/lib/sortEntries.test.ts src/lib/validate.ts src/lib/validate.test.ts
git commit -m "feat: sort notes by newest and require a photo"
```

---

### Task 6: 이미지 축소 크기 계산

**Files:**
- Create: `src/lib/imageResize.test.ts`
- Create: `src/lib/imageResize.ts`

캔버스 인코딩은 브라우저에 맡긴다. 단위 테스트는 긴 변 1280 규칙을 고정한다.

- [ ] **Step 1: Write the failing test**

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

```powershell
npx vitest run src/lib/imageResize.test.ts
```

Expected: FAIL — `fitWithin` is not defined.

- [ ] **Step 3: Write implementation including file resize**

```ts
export function fitWithin(
  width: number,
  height: number,
  maxEdge = 1280,
): { width: number; height: number } {
  const longEdge = Math.max(width, height);
  if (longEdge <= maxEdge) return { width, height };
  const scale = maxEdge / longEdge;
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}

export function resizeImageFile(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const { width, height } = fitWithin(img.width, img.height);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("canvas"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("toBlob"));
            return;
          }
          resolve(blob);
        },
        "image/jpeg",
        0.8,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("load"));
    };
    img.src = url;
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

```powershell
npx vitest run src/lib/imageResize.test.ts
```

Expected: PASS 전체.

- [ ] **Step 5: Commit**

```powershell
git add src/lib/imageResize.ts src/lib/imageResize.test.ts
git commit -m "feat: resize captures to 1280px jpeg"
```

---

### Task 7: IndexedDB

**Files:**
- Create: `src/lib/db.test.ts`
- Create: `src/lib/db.ts`

- [ ] **Step 1: Write the failing test**

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

```powershell
npx vitest run src/lib/db.test.ts
```

Expected: FAIL — `saveEntry` is not defined.

- [ ] **Step 3: Write minimal implementation**

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

```powershell
npx vitest run src/lib/db.test.ts
```

Expected: PASS.

`verbatimModuleSyntax` 때문에 `Entry` 타입 import는 `import type`을 유지한다.

- [ ] **Step 5: Commit**

```powershell
git add src/lib/db.ts src/lib/db.test.ts
git commit -m "feat: persist notes in indexeddb"
```

---

### Task 8: 공통 스타일과 라우트 껍데기

**Files:**
- Create: `src/index.css`
- Create: `src/pages/ListPage.tsx`
- Create: `src/pages/EditorPage.tsx`
- Modify: `src/main.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: 글로벌 CSS를 작성한다**

`src/index.css`:

```css
:root {
  font-family: "Apple SD Gothic Neo", "Noto Sans KR", sans-serif;
  color: #1a1a1a;
  background: #f4f1ea;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
}

#root {
  min-height: 100dvh;
}

.app-shell {
  width: min(100%, 28rem);
  margin: 0 auto;
  min-height: 100dvh;
  background: #fbfaf6;
  padding: 1rem 1rem 2rem;
}

h1 {
  font-size: 1.15rem;
  margin: 0;
}

header.bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

a,
button,
label.button {
  font: inherit;
}

button,
a.button,
label.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 999px;
  background: #1a1a1a;
  color: #fff;
  text-decoration: none;
  padding: 0.45rem 0.9rem;
  cursor: pointer;
}

button.ghost,
a.ghost {
  background: transparent;
  color: #1a1a1a;
  padding: 0.45rem 0.2rem;
}

button.danger {
  background: #b42318;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 0.75rem;
}

.chip {
  background: #ece7dc;
  color: #1a1a1a;
  border-radius: 999px;
  padding: 0.35rem 0.75rem;
}

.chip.active {
  background: #1a1a1a;
  color: #fff;
}

.entry-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.entry-list a {
  display: grid;
  grid-template-columns: 4.5rem 1fr;
  gap: 0.75rem;
  color: inherit;
  text-decoration: none;
  background: #fff;
  border-radius: 0.75rem;
  overflow: hidden;
  min-height: 4.5rem;
}

.entry-list img {
  width: 4.5rem;
  height: 4.5rem;
  object-fit: cover;
  background: #ddd;
}

.entry-list p {
  margin: 0.7rem 0.7rem 0.7rem 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-size: 0.92rem;
}

.muted {
  color: #7a756c;
}

.error {
  color: #b42318;
  font-size: 0.9rem;
}

.photo {
  width: 100%;
  border-radius: 0.75rem;
  display: block;
  background: #ddd;
}

.lined {
  width: 100%;
  min-height: 12rem;
  margin: 0.75rem 0;
  border: 0;
  resize: vertical;
  line-height: 1.9;
  padding: 0.2rem 0.4rem;
  background-image: repeating-linear-gradient(
    to bottom,
    transparent,
    transparent 1.85em,
    #d7d1c4 1.85em,
    #d7d1c4 calc(1.85em + 1px)
  );
  background-color: transparent;
}

.file-input {
  display: none;
}

.stack {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
```

- [ ] **Step 2: 빈 페이지와 라우트를 연결한다**

`src/pages/ListPage.tsx`:

```tsx
export default function ListPage() {
  return (
    <div className="app-shell">
      <header className="bar">
        <h1>당구 캡처 메모</h1>
      </header>
    </div>
  );
}
```

`src/pages/EditorPage.tsx`:

```tsx
export default function EditorPage() {
  return (
    <div className="app-shell">
      <header className="bar">
        <h1>메모</h1>
      </header>
    </div>
  );
}
```

`src/App.tsx`:

```tsx
import { Route, Routes } from "react-router-dom";
import EditorPage from "./pages/EditorPage";
import ListPage from "./pages/ListPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ListPage />} />
      <Route path="/new" element={<EditorPage />} />
      <Route path="/entry/:id" element={<EditorPage />} />
    </Routes>
  );
}
```

`src/main.tsx` 맨 위에 `import "./index.css";`를 추가한다.

- [ ] **Step 3: 개발 서버로 라우트가 열리는지 확인한다**

```powershell
npm run dev
```

Expected: `/`에 제목 “당구 캡처 메모”. `/new`에 “메모”. 확인 후 서버를 끄지 않아도 된다. 다음 작업에서 페이지를 채운다.

- [ ] **Step 4: Commit**

```powershell
git add src/index.css src/pages/ListPage.tsx src/pages/EditorPage.tsx src/App.tsx src/main.tsx
git commit -m "feat: add mobile shell and routes"
```

---

### Task 9: 목록 화면

**Files:**
- Modify: `src/pages/ListPage.tsx`

- [ ] **Step 1: 목록·칩·빈 분류줄을 구현한다**

`src/pages/ListPage.tsx` 전체를 아래로 교체한다.

```tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { filterByKeyword, frequentKeywords } from "../lib/classify";
import { listEntries } from "../lib/db";
import type { Entry } from "../types";

type LocationState = { notice?: string };

export default function ListPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [keyword, setKeyword] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const state = location.state as LocationState | null;
    if (state?.notice) {
      setNotice(state.notice);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  useEffect(() => {
    let cancelled = false;
    const objectUrls: string[] = [];
    void listEntries().then((rows) => {
      if (cancelled) return;
      setEntries(rows);
      const next: Record<string, string> = {};
      for (const row of rows) {
        const url = URL.createObjectURL(row.image);
        objectUrls.push(url);
        next[row.id] = url;
      }
      setUrls(next);
    });
    return () => {
      cancelled = true;
      for (const url of objectUrls) URL.revokeObjectURL(url);
    };
  }, []);

  const chips = useMemo(() => frequentKeywords(entries), [entries]);
  const visible = useMemo(
    () => filterByKeyword(entries, keyword),
    [entries, keyword],
  );

  function toggleChip(word: string) {
    setKeyword((current) => (current === word ? null : word));
  }

  return (
    <div className="app-shell">
      <header className="bar">
        <h1>당구 캡처 메모</h1>
        <Link className="button" to="/new">
          +
        </Link>
      </header>
      {notice ? <p className="error">{notice}</p> : null}
      {chips.length > 0 ? (
        <div className="chips">
          {chips.map((word) => (
            <button
              key={word}
              type="button"
              className={keyword === word ? "chip active" : "chip"}
              onClick={() => toggleChip(word)}
            >
              {word}
            </button>
          ))}
        </div>
      ) : null}
      {visible.length === 0 ? (
        <p className="muted">아직 기록이 없습니다. + 로 캡처를 남기세요.</p>
      ) : (
        <ul className="entry-list">
          {visible.map((entry) => (
            <li key={entry.id}>
              <Link to={`/entry/${entry.id}`}>
                <img src={urls[entry.id]} alt="" />
                <p className={entry.memo.trim() ? undefined : "muted"}>
                  {entry.memo.trim() ? entry.memo : "메모 없음"}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

분류 단어가 없으면 `chips` 블록 자체를 렌더하지 않는다. 칩은 한 번에 하나만 켜진다. 같은 칩을 다시 누르면 `keyword`가 `null`이 되어 전체 목록으로 돌아간다. `listEntries`가 이미 최신순이다.

- [ ] **Step 2: Commit**

```powershell
git add src/pages/ListPage.tsx
git commit -m "feat: show chronological notes and keyword chips"
```

---

### Task 10: 새 기록·편집·삭제

**Files:**
- Modify: `src/pages/EditorPage.tsx`

메시지 문자열은 스펙 그대로 쓴다.

- 사진 없음: `캡처를 먼저 고르세요`
- 갤러리 실패: `설정에서 사진 접근을 허용하세요`
- 축소 실패: `다른 캡처를 고르세요`
- 할당량: `저장 공간이 부족합니다. 이 앱 데이터를 비우거나 기록을 지우세요`
- 없는 id: 목록으로 보내며 `기록을 찾을 수 없습니다`

- [ ] **Step 1: EditorPage 전체를 아래 코드로 작성한다**

새 글만 파일 입력이 있다. 편집은 사진 교체가 없다. 메모는 비어 있어도 저장된다. 삭제는 `confirm`이 취소되면 아무 것도 하지 않는다. 파일 목록 접근이 던지면 갤러리 권한 안내, 이미지 축소가 실패하면 다른 캡처 안내를 띄운다.

```tsx
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { deleteEntry, getEntry, saveEntry } from "../lib/db";
import { resizeImageFile } from "../lib/imageResize";
import { photoMissing } from "../lib/validate";
import { extractKeywords } from "../lib/wordExtract";

function quotaMessage(error: unknown): string | null {
  if (
    error instanceof DOMException &&
    (error.name === "QuotaExceededError" || error.name === "NS_ERROR_DOM_QUOTA_REACHED")
  ) {
    return "저장 공간이 부족합니다. 이 앱 데이터를 비우거나 기록을 지우세요";
  }
  return null;
}

export default function EditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id;
  const [memo, setMemo] = useState("");
  const [image, setImage] = useState<Blob | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [createdAt, setCreatedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!isNew);

  useEffect(() => {
    if (isNew || !id) return;
    let cancelled = false;
    let objectUrl: string | undefined;
    void getEntry(id).then((entry) => {
      if (cancelled) return;
      if (!entry) {
        navigate("/", { state: { notice: "기록을 찾을 수 없습니다" } });
        return;
      }
      setMemo(entry.memo);
      setImage(entry.image);
      setCreatedAt(entry.createdAt);
      objectUrl = URL.createObjectURL(entry.image);
      setPreview(objectUrl);
      setLoading(false);
    });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id, isNew, navigate]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  async function onPickFile(event: ChangeEvent<HTMLInputElement>) {
    setError(null);
    let file: File | undefined;
    try {
      file = event.target.files?.[0];
    } catch {
      setError("설정에서 사진 접근을 허용하세요");
      return;
    } finally {
      event.target.value = "";
    }
    if (!file) return;
    try {
      const blob = await resizeImageFile(file);
      setPreview((current) => {
        if (current) URL.revokeObjectURL(current);
        return URL.createObjectURL(blob);
      });
      setImage(blob);
    } catch {
      setError("다른 캡처를 고르세요");
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (isNew && photoMissing(image)) {
      setError("캡처를 먼저 고르세요");
      return;
    }
    if (!image) {
      setError("캡처를 먼저 고르세요");
      return;
    }
    const now = Date.now();
    const entryId = id ?? crypto.randomUUID();
    try {
      await saveEntry({
        id: entryId,
        createdAt: createdAt ?? now,
        updatedAt: now,
        image,
        memo,
        keywords: extractKeywords(memo),
      });
      navigate("/");
    } catch (saveError) {
      setError(quotaMessage(saveError) ?? "다른 캡처를 고르세요");
    }
  }

  async function onDelete() {
    if (!id) return;
    const ok = window.confirm("이 기록을 삭제할까요?");
    if (!ok) return;
    await deleteEntry(id);
    navigate("/");
  }

  if (loading) {
    return (
      <div className="app-shell">
        <p className="muted">불러오는 중</p>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="bar">
        <Link className="ghost" to="/">
          뒤로
        </Link>
        <h1>{isNew ? "새 메모" : "메모"}</h1>
        <span />
      </header>
      <form className="stack" onSubmit={(event) => void onSubmit(event)}>
        {isNew ? (
          <label className="button">
            캡처 고르기
            <input
              className="file-input"
              type="file"
              accept="image/*"
              onChange={(event) => void onPickFile(event)}
            />
          </label>
        ) : null}
        {preview ? <img className="photo" src={preview} alt="" /> : null}
        <textarea
          className="lined"
          value={memo}
          onChange={(event) => setMemo(event.target.value)}
          placeholder="이 장면에서 뭘 봤는지 적기"
        />
        {error ? <p className="error">{error}</p> : null}
        <div className="actions">
          <button type="submit">저장</button>
          {!isNew ? (
            <button type="button" className="danger" onClick={() => void onDelete()}>
              삭제
            </button>
          ) : null}
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: 단위 테스트가 아직 통과하는지 확인한다**

```powershell
npm test
```

Expected: 기존 lib 테스트 전부 PASS.

- [ ] **Step 3: Commit**

```powershell
git add src/pages/EditorPage.tsx
git commit -m "feat: add capture memo editor and delete"
```

---

### Task 11: PWA

**Files:**
- Create: `public/icon.svg`
- Modify: `vite.config.ts`
- Modify: `index.html`

- [ ] **Step 1: 아이콘을 추가한다**

`public/icon.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <rect width="128" height="128" rx="28" fill="#1a1a1a"/>
  <circle cx="64" cy="64" r="28" fill="#f4f1ea"/>
  <circle cx="64" cy="64" r="8" fill="#1a1a1a"/>
</svg>
```

- [ ] **Step 2: `vite-plugin-pwa`를 켠다**

`vite.config.ts` 전체를 아래로 교체한다.

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon.svg"],
      manifest: {
        name: "당구 캡처 메모",
        short_name: "당구메모",
        lang: "ko",
        start_url: "/",
        display: "standalone",
        background_color: "#fbfaf6",
        theme_color: "#1a1a1a",
        icons: [
          {
            src: "icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,ico,woff2}"],
      },
    }),
  ],
  test: {
    environment: "jsdom",
  },
});
```

테스트 환경에서 서비스워커가 필요 없다. Vitest는 이 설정을 로드만 한다.

- [ ] **Step 3: 빌드가 되는지 확인한다**

```powershell
npm test
npm run build
```

Expected: 테스트 PASS. `dist`에 빌드 산출물. PWA 플러그인이 service worker를 만든다.

- [ ] **Step 4: Commit**

```powershell
git add public/icon.svg vite.config.ts
git commit -m "feat: installable pwa for offline saved notes"
```

---

### Task 12: 스펙 대조 점검

**Files:** 없음 (검증만)

- [ ] **Step 1: 자동 테스트 한 번 더 돌린다**

```powershell
npm test
```

Expected: PASS. 커버 범위:

- 조사·불용어 제거 (`wordExtract.test.ts`)
- 한 글자 제외 (`wordExtract.test.ts`)
- 서로 다른 기록 2회 이상만 칩 (`classify.test.ts`)
- 한 기록 안 중복은 문서 1회 (`classify.test.ts` + `wordExtract.test.ts`)
- `createdAt` 내림차순 (`sortEntries.test.ts`, `db.test.ts`)
- 빈 사진 거절 (`validate.test.ts`)
- 단어 필터 (`classify.test.ts`)

- [ ] **Step 2: 폰 또는 브라우저 모바일 폭에서 수동 확인한다**

```powershell
npm run dev
```

체크:

- 캡처 선택 → 메모 → 저장 → 목록 맨 위
- 같은 단어 두 기록 → 칩 생성
- 칩 on/off 필터
- 메모 수정으로 단어가 1회로 떨어지면 칩 사라짐
- 삭제 확인 후 목록에서 사라짐
- 사진 없이 저장하면 `캡처를 먼저 고르세요`
- `/entry/not-real` 이면 목록에서 `기록을 찾을 수 없습니다`
- 빌드 미리보기(`npm run build` 후 `npm run preview`)에서 홈 화면 추가 후 비행기 모드로 기존 기록이 열리는지 (실제 폰에서)

이 단계에서는 코드를 바꾸지 않는다. 실패하면 해당 Task로 돌아가 고친다.

---

## Self-review vs spec

| Spec | Task |
| --- | --- |
| 목록 최신순, 썸네일, 2줄, 메모 없음 | Task 5, 7, 9 |
| `+` 새 글, 행 탭 편집 | Task 8, 9, 10 |
| 2회 이상 단어 칩, 없으면 줄 없음, 토글 하나 | Task 4, 9 |
| 사진 위 메모 아래, 사진 필수, 메모 선택 | Task 5, 10 |
| 편집 시 사진 교체 없음, 삭제 confirm | Task 10 |
| 단어 추출 규칙 | Task 3 |
| IndexedDB 이름/필드, 이미지 1280 JPEG | Task 2, 6, 7 |
| 로그인/Firebase 없음 | 전 과제에 서버 없음 |
| PWA 오프라인 기존 기록 | Task 11 |
| 오류 문구 | Task 10 |
| Vitest 항목 | Task 3–7, 12 |
| 제외 기능 (검색, 공유시트, 그리기 등) | 계획에 없음 |
