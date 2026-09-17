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
    try {
      const entryId = id ?? crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
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
