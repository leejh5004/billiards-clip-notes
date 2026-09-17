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
