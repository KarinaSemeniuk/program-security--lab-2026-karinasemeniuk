import { useEffect, useRef, useState, type ReactElement } from "react";
import { WorkspaceUC } from "#ui-application/Booking/UseCase/WorkspaceUC";
/** @param props - Owned booking and typed note capability. @returns Lazy owner-only note editor, clearing private memory when closed/unmounted. */
export function PrivateNoteEditor(props: { bookingId: string; workspace: WorkspaceUC; onExpired: () => void }): ReactElement {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [savedText, setSavedText] = useState("");
  const [revision, setRevision] = useState(0);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [reload, setReload] = useState(0);
  const generation = useRef(0);
  const lock = useRef(false);
  useEffect(() => {
    const current = ++generation.current;
    if (!open) return;
    setReady(false); setLoading(true); setNotice("");
    void props.workspace.getNote(props.bookingId).then(result => {
      if (current !== generation.current) return;
      if (result.status === "ok") { setText(result.data.text); setSavedText(result.data.text); setRevision(result.data.revision); setReady(true); }
      else { setNotice(result.message); if (result.unauthorized) props.onExpired(); }
      setLoading(false);
    });
    return () => { generation.current++; };
  }, [open, props.bookingId, props.workspace, reload]);
  async function save(): Promise<void> {
    if (!ready || lock.current || [...text].length > 2000) return;
    lock.current = true; setBusy(true); setNotice("");
    const current = generation.current;
    try {
      const result = await props.workspace.saveNote(props.bookingId, text, revision);
      if (current !== generation.current) return;
      if (result.status === "ok") { setSavedText(result.data.text); setRevision(result.data.revision); setNotice("Нотатку збережено."); }
      else { setNotice(result.message); setReady(false); if (result.unauthorized) props.onExpired(); }
    } finally { lock.current = false; setBusy(false); }
  }
  function close(): void { setOpen(false); setText(""); setSavedText(""); setRevision(0); setReady(false); setNotice(""); }
  if (!open) return <button className="text-button private-note-toggle" onClick={() => setOpen(true)}>Приватна нотатка</button>;
  return <section className="private-note-editor" aria-label="Приватна нотатка" aria-busy={loading || busy}>
    <label htmlFor={"private-note-" + props.bookingId}>Ваша приватна нотатка</label>
    <p className="muted">Доступна лише вам. Зберігається на сервері у зашифрованому вигляді.</p>
    {loading ? <p role="status">Завантажуємо нотатку…</p> : <>
      <textarea id={"private-note-" + props.bookingId} rows={4} value={text} maxLength={4000} disabled={!ready || busy}
        onChange={event => setText(event.target.value)} placeholder="План зустрічі чи нагадування для себе" />
      <p className="muted">{[...text].length} / 2000 символів</p>
      <div className="note-actions"><button className="primary-button" disabled={!ready || busy || [...text].length > 2000 || text === savedText} onClick={() => { void save(); }}>{busy ? "Зберігаємо…" : "Зберегти нотатку"}</button>
        {!ready && <button className="secondary-button" disabled={busy} onClick={() => setReload(value => value + 1)}>Завантажити актуальну версію</button>}
        <button className="secondary-button" disabled={busy} onClick={close}>{text !== savedText ? "Закрити без збереження" : "Закрити"}</button></div>
    </>}
    {notice && <p role="status" className="note-notice">{notice}</p>}
  </section>;
}
