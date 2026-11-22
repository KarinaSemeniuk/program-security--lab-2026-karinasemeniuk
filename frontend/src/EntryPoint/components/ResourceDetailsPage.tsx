import { useEffect, useRef, useState, type ReactElement } from "react";
import { WorkspaceUC } from "#ui-application/Booking/UseCase/WorkspaceUC";
import { IBookableResource } from "#ui-domain/Booking/Contract/IBookableResource";
/** @param props - Fresh detail lookup, navigation and server-confirmed role. @returns A full resource page with safe plain-text rendering. */
export function ResourceDetailsPage(props: { id: string; admin: boolean; workspace: WorkspaceUC; onBack: () => void; onBook: (id: string) => void; onExpired: () => void }): ReactElement {
  const [resource, setResource] = useState<IBookableResource | null>(null);
  const [message, setMessage] = useState("Завантажуємо інформацію…");
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { let active = true; setResource(null); setMessage("Завантажуємо інформацію…");
    void props.workspace.resourceDetails(props.id, props.admin).then(result => { if (!active) return;
      if (result.status === "ok") { setResource(result.data); setMessage(""); document.title = result.data.name + " — RoomBook"; }
      else { setMessage(result.message); if (result.unauthorized) props.onExpired(); }
    }); return () => { active = false; };
  }, [props.id, props.admin, props.workspace]);
  useEffect(() => { heading.current?.focus(); }, [resource]);
  return <section className="resource-details workspace-panel"><button className="text-button" onClick={props.onBack}>← Назад до просторів</button>
    {message && <p role="status">{message}</p>}
    {resource && <><span className="eyebrow">{resource.type === "DESK" ? "РОБОЧЕ МІСЦЕ" : "КІМНАТА"}</span><h1 ref={heading} tabIndex={-1}>{resource.name}</h1>
      <p className="resource-detail-summary">До {resource.capacity} осіб · інтервал від {resource.minSlotMinutes} хв · {resource.isActive ? "Доступний до бронювання" : "Неактивний"}</p>
      <div className="resource-detail-grid"><div><h2>Про простір</h2><p className="resource-description">{resource.description || "Опис ще не додано."}</p><h2>Години роботи</h2><p className="muted">Часовий пояс: {resource.timeZone}</p><ul>{resource.weekly.map((day,index)=><li key={index}>{["Нд","Пн","Вт","Ср","Чт","Пт","Сб"][index]}: {day.close === day.open ? "Зачинено" : `${String(Math.floor(day.open/60)).padStart(2,"0")}:${String(day.open%60).padStart(2,"0")}–${String(Math.floor(day.close/60)).padStart(2,"0")}:${String(day.close%60).padStart(2,"0")}`}</li>)}</ul>{resource.closedDates.length>0 && <p>Закриті дати: {resource.closedDates.join(", ")}</p>}<h2>Розташування</h2><p>{resource.location || "Розташування ще не вказано."}</p></div>
      <div><h2>Обладнання</h2>{resource.equipment.length ? <ul className="equipment-list">{resource.equipment.map(item => <li key={item}>{item}</li>)}</ul> : <p>Обладнання ще не вказано.</p>}</div></div>
      {resource.isActive ? <button className="primary-button" onClick={() => props.onBook(resource.id)}>Обрати час для бронювання</button> : <p className="muted">Нові бронювання закриті. Історія попередніх бронювань збережена.</p>}
    </>}
  </section>;
}
