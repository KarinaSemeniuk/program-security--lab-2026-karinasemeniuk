import { useState, type ReactElement } from "react";
import { IBookableResource } from "#ui-domain/Booking/Contract/IBookableResource";
/** @param props - Revision-bound calendar snapshot and explicit save. @returns Weekly hours and holiday editor. */
export function ResourceCalendarEditor(props: {resource:IBookableResource;busy:boolean;onSave:(calendar:{timeZone:string;weekly:{open:number;close:number}[];closedDates:string[]})=>Promise<void>}): ReactElement {
  const [zone,setZone] = useState(props.resource.timeZone);
  const [weekly,setWeekly] = useState(props.resource.weekly.map(day=>({...day})));
  const [closed,setClosed] = useState(props.resource.closedDates.join("\n"));
  const names = ["Неділя","Понеділок","Вівторок","Середа","Четвер","П’ятниця","Субота"];
  const label = (minute:number) => String(Math.floor(minute/60)).padStart(2,"0")+":"+String(minute%60).padStart(2,"0");
  const update = (index:number,open:number,close:number) => setWeekly(old=>old.map((day,i)=>i===index?{open,close}:day));
  return <form className="resource-form" onSubmit={event=>{event.preventDefault(); void props.onSave({timeZone:zone,weekly,closedDates:closed.split(/\r?\n/).map(value=>value.trim()).filter(Boolean)});}}>
    <div className="field"><label htmlFor="calendar-zone">Часовий пояс простору</label><input id="calendar-zone" value={zone} disabled={props.busy} required onChange={event=>setZone(event.target.value)} placeholder="Europe/Kyiv" /></div>
    <p className="muted">Години й закриті дати нижче — у часовому поясі простору. Наявні бронювання зберігаються. Нічний розклад розділіть між двома днями.</p>
    {weekly.map((day,index)=><fieldset className="opening-row" key={index} disabled={props.busy}><legend>{names[index]}</legend>
      <label><input type="checkbox" checked={day.close>day.open} onChange={event=>update(index,event.target.checked?540:0,event.target.checked?1080:0)} /> Відчинено</label>
      {day.close>day.open && <div className="date-range"><div className="field"><label htmlFor={"open-"+index}>Від</label><select id={"open-"+index} value={day.open} onChange={event=>update(index,Number(event.target.value),day.close)}>{Array.from(new Set([...Array.from({length:96},(_,i)=>i*15),day.open])).sort((a,b)=>a-b).map(value=><option key={value} value={value}>{label(value)}</option>)}</select></div>
      <div className="field"><label htmlFor={"close-"+index}>До</label><select id={"close-"+index} value={day.close} onChange={event=>update(index,day.open,Number(event.target.value))}>{Array.from(new Set([...Array.from({length:96},(_,i)=>(i+1)*15),day.close])).sort((a,b)=>a-b).map(value=><option key={value} value={value}>{label(value)}</option>)}</select></div></div>}
    </fieldset>)}
    <div className="field"><label htmlFor="closed-dates">Закриті дати, кожна з нового рядка</label><textarea id="closed-dates" rows={4} value={closed} disabled={props.busy} placeholder="2026-12-25" onChange={event=>setClosed(event.target.value)} /><small className="muted">Формат РРРР-ММ-ДД, до 366 різних дат.</small></div>
    <button className="primary-button" disabled={props.busy}>Зберегти розклад</button>
  </form>;
}
