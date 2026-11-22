import { useRef, useState, type ReactElement } from "react";
import { SealedNotesUC } from "#ui-application/Booking/UseCase/SealedNotesUC";
/** Per-booking key import/export; key material is cleared when this component unmounts. */
export function SealedNoteEditor(props: { service: SealedNotesUC; ownerId: string; bookingId: string }): ReactElement {
  const [open, setOpen] = useState(false), [key, setKey] = useState(""), [text, setText] = useState("");
  const [revision, setRevision] = useState(0), [ready, setReady] = useState(false), [busy, setBusy] = useState(false), [notice, setNotice] = useState("");
  const lock = useRef(false);
  async function load(raw: string): Promise<void> {
    if (lock.current) return; lock.current = true; setBusy(true); setReady(false); setText("");
    try { const note = await props.service.read(raw, props.ownerId, props.bookingId); setKey(raw); setText(note.text); setRevision(note.revision); setReady(true); setNotice("Нотатку відкрито на цьому пристрої."); }
    catch { setKey(""); setNotice("Не вдалося відкрити нотатку. Перевірте файл ключа та цілісність даних."); }
    finally { lock.current = false; setBusy(false); }
  }
  async function generate(): Promise<void> {
    const raw = props.service.createKey();
    const blob = new Blob([JSON.stringify({ version: 1, bookingId: props.bookingId, key: raw })], { type: "application/json" });
    const url = URL.createObjectURL(blob), link = document.createElement("a"); link.href = url; link.download = "roombook-note-" + props.bookingId + "-key.json"; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    await load(raw);
  }
  async function save(): Promise<void> {
    if (lock.current || !ready) return; lock.current = true; setBusy(true);
    try { setRevision(await props.service.save(key, props.ownerId, props.bookingId, text, revision)); setNotice("Зашифровану нотатку збережено."); }
    catch (error: unknown) { setReady(false); setNotice(error instanceof Error ? error.message : "Не вдалося зберегти нотатку."); }
    finally { lock.current = false; setBusy(false); }
  }
  if (!open) return <button className="text-button" onClick={() => setOpen(true)}>Наскрізно зашифрована нотатка</button>;
  return <section className="private-note-editor" aria-label="Наскрізно зашифрована нотатка"><strong>Наскрізно зашифрована нотатка</strong>
    <p className="muted">Сервер не має ключа. Збережіть файл ключа в надійному місці: він потрібен після закриття сторінки та на іншому пристрої.</p>
    <div className="note-actions"><button className="secondary-button" disabled={busy} onClick={() => { void generate(); }}>Створити та завантажити ключ</button>
    <label>Відкрити файл ключа<input type="file" accept=".json" disabled={busy} onChange={event => { const file = event.target.files?.[0]; if (!file) return;
      if (file.size > 4096) { setNotice("Некоректний файл ключа."); return; }
      void file.text().then(content => { const parsed: unknown = JSON.parse(content); if (typeof parsed !== "object" || !parsed || !("version" in parsed) || parsed.version !== 1 || !("bookingId" in parsed) || parsed.bookingId !== props.bookingId || !("key" in parsed) || typeof parsed.key !== "string" || !/^[A-Za-z0-9+/]{43}=$/.test(parsed.key)) throw new Error(); return load(parsed.key); }).catch(() => setNotice("Некоректний файл ключа."));
    }} /></label></div>
    <textarea aria-label="Текст наскрізно зашифрованої нотатки" rows={4} disabled={!ready || busy} value={text} onChange={e => setText(e.target.value)} />
    <div className="note-actions"><button className="primary-button" disabled={!ready || busy || [...text].length > 2000} onClick={() => { void save(); }}>Зберегти зашифровану нотатку</button>
    <button className="secondary-button" disabled={busy} onClick={() => { setOpen(false); setKey(""); setText(""); setReady(false); setNotice(""); }}>Закрити</button></div>
    <p role="status">{notice}</p></section>;
}
