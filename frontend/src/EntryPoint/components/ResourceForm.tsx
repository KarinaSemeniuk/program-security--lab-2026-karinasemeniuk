import { useState, type ReactElement } from "react";
import { IBookableResource } from "#ui-domain/Booking/Contract/IBookableResource";
import { IResourceDraft } from "#ui-domain/Booking/Contract/IResourceDraft";
/** @param props - Snapshot-bound form. Parent remounts explicitly after successful writes or reload. @returns Accessible create/edit form with plain-text metadata. */
export function ResourceForm(props: { initial?: IBookableResource; busy: boolean; onSubmit: (draft: IResourceDraft, minutes: number) => Promise<void> }): ReactElement {
  const [draft, setDraft] = useState<IResourceDraft>(props.initial ? { name: props.initial.name, capacity: props.initial.capacity, type: props.initial.type, description: props.initial.description, location: props.initial.location, equipment: [...props.initial.equipment] } : { name: "", capacity: 4, type: "ROOM", description: "", location: "", equipment: [] });
  const [equipment, setEquipment] = useState(draft.equipment.join("\n"));
  const [minutes, setMinutes] = useState(props.initial?.minSlotMinutes ?? 30);
  const [error, setError] = useState("");
  const prefix = props.initial ? "edit" : "create";
  return <form className="resource-form" onSubmit={event => { event.preventDefault();
    const labels = equipment.split(/\r?\n/).map(item => item.trim()).filter(Boolean);
    if (labels.length > 20 || labels.some(item => [...item].length > 60) || new Set(labels.map(item => item.toLocaleLowerCase("uk-UA"))).size !== labels.length) { setError("Вкажіть до 20 різних назв обладнання, кожна — до 60 символів."); return; }
    setError(""); void props.onSubmit({ ...draft, equipment: labels }, minutes);
  }}>
    <div className="field"><label htmlFor={prefix + "-name"}>Назва</label><input id={prefix + "-name"} required maxLength={100} value={draft.name} disabled={props.busy} onChange={event => setDraft({ ...draft, name: event.target.value })} /></div>
    <div className="date-range"><div className="field"><label htmlFor={prefix + "-type"}>Тип простору</label><select id={prefix + "-type"} value={draft.type} disabled={props.busy} onChange={event => setDraft({ ...draft, type: event.target.value as "ROOM" | "DESK" })}><option value="ROOM">Кімната</option><option value="DESK">Робоче місце</option></select></div>
    <div className="field"><label htmlFor={prefix + "-capacity"}>Місткість, осіб</label><input id={prefix + "-capacity"} type="number" min={1} max={1000} required value={draft.capacity} disabled={props.busy} onChange={event => setDraft({ ...draft, capacity: Number(event.target.value) })} /></div></div>
    <div className="field"><label htmlFor={prefix + "-location"}>Розташування</label><input id={prefix + "-location"} maxLength={200} value={draft.location} disabled={props.busy} placeholder="Поверх, зона або адреса" onChange={event => setDraft({ ...draft, location: event.target.value })} /></div>
    <div className="field"><label htmlFor={prefix + "-description"}>Опис</label><textarea id={prefix + "-description"} rows={4} value={draft.description} disabled={props.busy} aria-describedby={prefix + "-count"} onChange={event => setDraft({ ...draft, description: event.target.value })} /><small id={prefix + "-count"} className="muted">{[...draft.description].length} / 2000 символів</small></div>
    <div className="field"><label htmlFor={prefix + "-equipment"}>Обладнання — кожна назва з нового рядка</label><textarea id={prefix + "-equipment"} rows={3} value={equipment} disabled={props.busy} placeholder={"Wi-Fi\nЕкран\nМаркерна дошка"} onChange={event => setEquipment(event.target.value)} /><small className="muted">До 20 назв, кожна до 60 символів.</small></div>
    <div className="field"><label htmlFor={prefix + "-minutes"}>Мінімальний інтервал</label><select id={prefix + "-minutes"} value={minutes} disabled={props.busy || !!props.initial} onChange={event => setMinutes(Number(event.target.value))}>{[1,5,10,15,20,30,60,90,120,180,240,360,480,720,1440].map(value => <option value={value} key={value}>{value} хв</option>)}</select>{props.initial && <small className="muted">Визначено під час створення. Для іншого кроку розкладу створіть новий ресурс.</small>}</div>
    {error && <p role="alert">{error}</p>}
    <button className="primary-button" disabled={props.busy || [...draft.description].length > 2000}>{props.busy ? "Зберігаємо…" : props.initial ? "Зберегти зміни" : "Створити ресурс"}</button>
  </form>;
}
