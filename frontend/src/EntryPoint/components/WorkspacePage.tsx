import { AccountSettingsPage } from "#ui-entrypoint/components/AccountSettingsPage";
import { AdminAccountsPage } from "#ui-entrypoint/components/AdminAccountsPage";
import { BookingMoveEditor } from "#ui-entrypoint/components/BookingMoveEditor";
import { ResourceCalendarEditor } from "#ui-entrypoint/components/ResourceCalendarEditor";
import { useEffect, useRef, useState, type ReactElement } from "react";
import { ResourceForm } from "#ui-entrypoint/components/ResourceForm";
import { ResourceDetailsPage } from "#ui-entrypoint/components/ResourceDetailsPage";
import { IResourceDraft } from "#ui-domain/Booking/Contract/IResourceDraft";
import { IServiceLicense } from "#ui-domain/Booking/Contract/IServiceLicense";
import { WorkspaceUC } from "#ui-application/Booking/UseCase/WorkspaceUC";
import { ICurrentUser } from "#ui-domain/Identity/Contract/ICurrentUser";
import { IBookableResource } from "#ui-domain/Booking/Contract/IBookableResource";
import { IBookingView } from "#ui-domain/Booking/Contract/IBookingView";
import { IAvailabilitySlot } from "#ui-domain/Booking/Contract/IAvailabilitySlot";
import { WorkspaceResult } from "#ui-domain/Booking/Contract/WorkspaceResult";
import { PrivateNoteEditor } from "#ui-entrypoint/components/PrivateNoteEditor";
import { RoomBookMark } from "#ui-entrypoint/components/RoomBookMark";

const browserTimeZone = ():string => { const zone = Intl.DateTimeFormat().resolvedOptions().timeZone; return zone === "Europe/Kiev" ? "Europe/Kyiv" : zone || "Europe/Kyiv"; };
const utcDay = (): string => new Date().toISOString().slice(0, 10);
const statuses: Record<string, string> = { PENDING: "Очікує", CONFIRMED: "Підтверджено", CANCELLED: "Скасовано", COMPLETED: "Завершено" };

/** @param props - Typed workspace capability and server-confirmed session. @returns Catalog, personal bookings and role-scoped administration. */
export function WorkspacePage(props: { workspace: WorkspaceUC; user: ICurrentUser | null; onLogin: () => void; onLogout: () => Promise<void>; onExpired: () => void; sessionNotice: string; onPasswordChanged?:()=>void }): ReactElement {
  const [timeZone, setTimeZone] = useState(() => browserTimeZone());
  const stamp = (value:string):string => new Intl.DateTimeFormat("uk-UA", {timeZone,day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit",timeZoneName:"shortOffset"}).format(new Date(value));
  const time = (value:string):string => new Intl.DateTimeFormat("uk-UA", {timeZone,hour:"2-digit",minute:"2-digit",timeZoneName:"shortOffset"}).format(new Date(value));
  const today = ():string => { const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA",{timeZone,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date()).map(part=>[part.type,part.value])); return `${parts.year}-${parts.month}-${parts.day}`; };
  const admin = props.user?.role === "ADMIN";
  const [tab, setTab] = useState<"catalog" | "mine" | "admin" | "account" | "accounts">("catalog");
  const [resources, setResources] = useState<IBookableResource[]>([]);
  const [service, setService] = useState<IServiceLicense | null>(null);
  const [search, setSearch] = useState("");
  const [minCapacity, setMinCapacity] = useState(1);
  const [selectedId, setSelectedId] = useState("");
  const [date, setDate] = useState(today());
  const [slots, setSlots] = useState<IAvailabilitySlot[]>([]);
  const [startIndex, setStartIndex] = useState(-1);
  const [units, setUnits] = useState(1);
  const [bookings, setBookings] = useState<IBookingView[]>([]);
  const [total, setTotal] = useState(0);
  const [bookingFilter,setBookingFilter] = useState("upcoming");
  const [page, setPage] = useState(0);
  const [historyStart, setHistoryStart] = useState(utcDay());
  const [historyEnd, setHistoryEnd] = useState(utcDay());
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [detailId, setDetailId] = useState("");
  const [createVersion, setCreateVersion] = useState(0);
  const [confirmation, setConfirmation] = useState<{ kind: "cancel" | "deactivate" | "reactivate"; id: string; label: string; revision?: number } | null>(null);
  const slotVersion = useRef(0);
  const historyVersion = useRef(0);
  const mutationLock = useRef(false);
  const selected = resources.find(resource => resource.id === selectedId);
  const activeResources = resources.filter(resource => resource.isActive);

  const filteredResources = activeResources.filter(resource => resource.capacity >= minCapacity && [resource.name, resource.location, ...resource.equipment].join(" ").toLocaleLowerCase("uk-UA").includes(search.trim().toLocaleLowerCase("uk-UA")));
  useEffect(() => {
    if (tab !== "catalog") return;
    setSelectedId(old => filteredResources.some(resource => resource.id === old) ? old : filteredResources[0]?.id ?? "");
  }, [search, minCapacity, resources, tab]);

  function failure(result: WorkspaceResult<unknown>): boolean {
    if (result.status !== "failed") return false;
    setNotice(result.message); if (result.unauthorized) props.onExpired(); return true;
  }
  useEffect(() => {
    let active = true; setLoading(true);
    void props.workspace.resources(admin).then(result => {
      if (!active) return;
      if (result.status === "ok") {
        setResources(result.data);
        setSelectedId(old => result.data.some(resource => resource.id === old) ? old : result.data.find(resource => resource.isActive)?.id ?? result.data[0]?.id ?? "");
      } else { setNotice(result.message); if (result.unauthorized) props.onExpired(); }
      setLoading(false);
    });
    return () => { active = false; };
  }, [props.workspace, admin, refresh]);
  useEffect(() => {
    const version = ++slotVersion.current;
    setSlots([]); setStartIndex(-1); setUnits(1);
    if (!selected?.isActive || tab !== "catalog" || !date) return;
    void props.workspace.availability(selected.id, date, timeZone).then(result => {
      if (version !== slotVersion.current) return;
      if (result.status === "ok") setSlots(result.data); else failure(result);
    });
    return () => { slotVersion.current++; };
  }, [props.workspace, selectedId, selected?.isActive, date, timeZone, tab, refresh]);
  useEffect(() => {
    const version = ++historyVersion.current;
    setBookings([]); setTotal(0);
    if (!props.user || (tab !== "mine" && tab !== "admin")) return;
    let request;
    if (tab === "mine") request = props.workspace.mine(page,bookingFilter);
    else {
      if (!selectedId || !historyStart || !historyEnd) return;
      const start = new Date(historyStart + "T00:00:00.000Z");
      const end = new Date(new Date(historyEnd + "T00:00:00.000Z").getTime() + 86400_000);
      if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end <= start || end.getTime() - start.getTime() > 31 * 86400_000) {
        setNotice("Оберіть період від 1 до 31 дня."); return;
      }
      request = props.workspace.history(selectedId, start.toISOString(), end.toISOString(), page);
    }
    void request.then(result => {
      if (version !== historyVersion.current) return;
      if (result.status === "ok") { setBookings(result.data.bookings); setTotal(result.data.total); } else failure(result);
    });
    return () => { historyVersion.current++; };
  }, [props.workspace, props.user?.id, tab, selectedId, historyStart, historyEnd, page, bookingFilter, refresh]);
  useEffect(() => { document.title = tab === "account" ? "Обліковий запис — RoomBook" : tab === "accounts" ? "Користувачі — RoomBook" : tab === "mine" ? "Мої бронювання — RoomBook" : tab === "admin" ? "Керування — RoomBook" : "Каталог — RoomBook"; }, [tab, detailId]);

  useEffect(() => { if ((!props.user && tab !== "catalog") || (!admin && (tab === "admin" || tab === "accounts"))) { setTab("catalog"); setBookings([]); setPage(0); } }, [props.user?.id, admin, tab]);

  useEffect(() => {
    let active = true;
    if (!admin || tab !== "admin") { setService(null); return; }
    void props.workspace.serviceLicense().then(result => { if (!active) return; if (result.status === "ok") setService(result.data); else failure(result); });
    return () => { active = false; };
  }, [props.workspace, admin, tab, refresh]);

  function changeTab(value: typeof tab): void { setDetailId(""); setTab(value); setPage(0); setNotice(""); setConfirmation(null); }
  const contiguous = props.workspace.contiguous(slots, startIndex);
  const first = slots[startIndex];
  const last = slots[startIndex + units - 1];

  async function mutate(action: () => Promise<void>): Promise<void> {
    if (mutationLock.current) return;
    mutationLock.current = true; setBusy(true); setNotice("");
    try { await action(); } finally { mutationLock.current = false; setBusy(false); }
  }
  async function book(): Promise<void> {
    if (!props.user) { props.onLogin(); return; }
    const selection = props.workspace.select(slots, startIndex, units);
    if (!selected || selection.status !== "selected") return;
    await mutate(async () => {
      const result = await props.workspace.book(selected.id, selection.startAt, selection.endAt);
      if (!failure(result)) setNotice("Бронювання створено. Воно доступне в розділі «Мої бронювання».");
      setRefresh(value => value + 1);
    });
  }
  async function create(draft: IResourceDraft, minutes: number): Promise<void> {
    await mutate(async () => {
      const result = await props.workspace.createResource(draft.name, draft.capacity, minutes, draft);
      if (result.status === "ok") { setCreateVersion(value => value + 1); setSelectedId(result.data.id); setNotice("Ресурс створено й додано до каталогу."); setRefresh(value => value + 1); }
      else failure(result);
    });
  }
  async function update(draft: IResourceDraft): Promise<void> {
    if (!selected) return; const snapshot = selected;
    await mutate(async () => {
      const result = await props.workspace.updateResource(snapshot.id, draft, snapshot.revision);
      if (result.status === "ok") { setNotice("Інформацію про ресурс збережено. Бронювання залишились без змін."); setRefresh(value => value + 1); } else failure(result);
    });
  }
  async function confirm(): Promise<void> {
    if (!confirmation) return;
    const intent = confirmation; setConfirmation(null);
    await mutate(async () => {
      const result = intent.kind === "cancel" ? await props.workspace.cancel(intent.id) : intent.kind === "reactivate" ? await props.workspace.reactivate(intent.id, intent.revision!) : await props.workspace.deactivate(intent.id);
      if (!failure(result)) { setNotice(intent.kind === "cancel" ? "Бронювання скасовано." : intent.kind === "reactivate" ? "Ресурс знову доступний для бронювання." : "Ресурс деактивовано. Історія бронювань збережена."); setRefresh(value => value + 1); }
    });
  }
  function bookingList(): ReactElement {
    return <div className="booking-list">
      {bookings.length === 0 ? <div className="empty-state"><span aria-hidden="true">◷</span><h3>Бронювань поки немає</h3><p>{tab === "mine" ? "Оберіть простір у каталозі та заплануйте свій час." : "За вибраний період бронювань не знайдено."}</p></div> : bookings.map(booking => {
        const canCancel = ["PENDING", "CONFIRMED"].includes(booking.status) && (admin || new Date(booking.startAt).getTime() - Date.now() >= 7200_000);
        return <article className="booking-row" key={booking.id}>
          <div><span className={"status status--" + booking.status.toLowerCase()}>{statuses[booking.status]}</span>
            <h3>{booking.resourceName || resources.find(resource => resource.id === booking.resourceId)?.name || "Ресурс " + booking.resourceId.slice(0, 8)}</h3>
            <p>{stamp(booking.startAt)} — {stamp(booking.endAt)} </p>
            {tab === "admin" && <small className="muted">Користувач: {booking.userId}</small>}
            {!admin && booking.status === "CONFIRMED" && !canCancel && <small className="muted">Скасування закрите: до початку менше двох годин.</small>}
          </div>
          {["PENDING","CONFIRMED"].includes(booking.status) && Date.parse(booking.startAt)>Date.now() && (admin||Date.parse(booking.startAt)-Date.now()>=7200_000) && <BookingMoveEditor key={booking.id+":"+(booking.revision??0)} booking={booking} workspace={props.workspace} timeZone={timeZone} onExpired={props.onExpired} onSaved={()=>{setNotice("Бронювання перенесено. Приватну нотатку збережено.");setRefresh(value=>value+1);}} />}
          {tab === "mine" && props.user?.id === booking.userId && <PrivateNoteEditor bookingId={booking.id} workspace={props.workspace} onExpired={props.onExpired} />}
          {canCancel && <button className="secondary-button" disabled={busy} onClick={() => setConfirmation({ kind: "cancel", id: booking.id, label: `${booking.resourceName || "Бронювання"} · ${stamp(booking.startAt)}` })}>Скасувати бронювання</button>}
        </article>;
      })}
      {total > 50 && <div className="pagination"><button className="secondary-button" disabled={page === 0 || busy} onClick={() => setPage(value => value - 1)}>Назад</button><span>Сторінка {page + 1} із {Math.ceil(total / 50)}</span><button className="secondary-button" disabled={(page + 1) * 50 >= total || busy} onClick={() => setPage(value => value + 1)}>Далі</button></div>}
    </div>;
  }
  return <div className="workspace-site">
    <header className="workspace-header"><RoomBookMark />
      <nav aria-label="Основна навігація"><button className={tab === "catalog" ? "nav-active" : ""} onClick={() => changeTab("catalog")}>Каталог</button>
        {props.user && <button className={tab === "mine" ? "nav-active" : ""} onClick={() => changeTab("mine")}>Мої бронювання</button>}
        {props.user && <button className={tab === "account" ? "nav-active" : ""} onClick={()=>changeTab("account")}>Обліковий запис</button>}
        {admin && <button className={tab === "accounts" ? "nav-active" : ""} onClick={()=>changeTab("accounts")}>Користувачі</button>}
        {admin && <button className={tab === "admin" ? "nav-active" : ""} onClick={() => changeTab("admin")}>Керування</button>}</nav>
      <div className="account-controls">{props.user ? <><span title={props.user.email}>{props.user.email}<small>{admin ? "Адміністратор" : "Користувач"}</small></span><button className="secondary-button" disabled={busy} onClick={() => { void mutate(props.onLogout); }}>Вийти</button></> : <button className="secondary-button" onClick={props.onLogin}>Увійти</button>}</div>
    </header>
    <main className="workspace-main">
      {detailId ? <ResourceDetailsPage id={detailId} admin={admin} workspace={props.workspace} onExpired={props.onExpired} onBack={() => setDetailId("")} onBook={id => { setSearch(""); setMinCapacity(1); setSelectedId(id); setDetailId(""); setTab("catalog"); setRefresh(value => value + 1); }} /> : <>
      <section className="workspace-hero"><span className="eyebrow">ПРОСТІР ДЛЯ ВАШИХ ПЛАНІВ</span>
        <h1>{tab === "account" ? <>Твій обліковий запис.</> : tab === "accounts" ? <>Керування користувачами.</> : tab === "catalog" ? <>Знайди місце<br /><em>для важливого.</em></> : tab === "mine" ? <>Твій час.<br /><em>Твої бронювання.</em></> : <>Простори<br /><em>під контролем.</em></>}</h1>
        <p>{tab === "account" ? "Керуйте паролем і сеансами на інших пристроях." : tab === "accounts" ? "Переглядайте облікові записи та керуйте доступом до сервісу." : tab === "catalog" ? "Кімната для зустрічі чи місце для фокусу — оберіть ресурс і зручний час." : tab === "mine" ? "Усі заплановані зустрічі та історія ваших бронювань в одному місці." : "Створюйте ресурси, керуйте їх доступністю та переглядайте бронювання."}</p>
        <div className="field timezone-choice"><label htmlFor="display-zone">Часовий пояс перегляду</label><select id="display-zone" value={timeZone} onChange={event=>{setTimeZone(event.target.value);setStartIndex(-1);}}>{Array.from(new Set([browserTimeZone(),"Europe/Kyiv","UTC",timeZone])).map(zone=><option key={zone} value={zone}>{zone}</option>)}</select></div>
      </section>
      {(notice || props.sessionNotice) && <div className="workspace-notice" role="status">{notice || props.sessionNotice}</div>}
      {confirmation && <section className="confirmation-box" role="alertdialog" aria-labelledby="confirm-title" aria-describedby="confirm-description"><h2 id="confirm-title">{confirmation.kind === "cancel" ? "Скасувати бронювання?" : confirmation.kind === "reactivate" ? "Активувати ресурс?" : "Деактивувати ресурс?"}</h2><p id="confirm-description">{confirmation.label}. {confirmation.kind === "deactivate" ? "Нові бронювання будуть закриті. Історія залишиться доступною." : confirmation.kind === "reactivate" ? "Простір знову з’явиться в каталозі й прийматиме бронювання." : "Цей час знову стане доступним іншим користувачам."}</p><div><button className="primary-button" onClick={() => { void confirm(); }}>Підтвердити</button><button className="secondary-button" onClick={() => setConfirmation(null)}>Залишити без змін</button></div></section>}
      {loading ? <p role="status">Завантажуємо каталог…</p> : tab === "account" && props.user ? <AccountSettingsPage user={props.user} workspace={props.workspace} onExpired={props.onExpired} onChanged={props.onPasswordChanged??props.onExpired} /> : tab === "accounts" && admin ? <AdminAccountsPage workspace={props.workspace} onExpired={props.onExpired} /> : tab === "mine" ? <section className="workspace-panel"><div className="panel-title"><h2>Мої бронювання</h2><button className="secondary-button" disabled={busy} onClick={() => setRefresh(value => value + 1)}>Оновити</button></div><div className="field"><label htmlFor="booking-filter">Показати бронювання</label><select id="booking-filter" value={bookingFilter} onChange={event=>{setBookingFilter(event.target.value);setPage(0);}}><option value="upcoming">Майбутні й поточні</option><option value="past">Минулі</option><option value="cancelled">Скасовані</option><option value="all">Усі</option></select></div>{bookingList()}</section> : tab === "admin" ? <div className="admin-layout">
        <section className="workspace-panel"><span className="eyebrow">НОВИЙ РЕСУРС</span><h2>Додати простір</h2><ResourceForm key={createVersion} busy={busy} onSubmit={create} /><aside className="service-license"><h3>Можливості сервісу</h3>{service ? <><p className="muted">{service.active ? "Інсталяцію активовано" : "Активацію не підтверджено"}</p>{service.expiresAt && <p className="muted">До {stamp(service.expiresAt)}</p>}<ul>{service.features.map(feature => <li key={feature}>{{ booking: "Створення бронювань", "private-notes": "Приватні нотатки", "resource-admin": "Керування ресурсами" }[feature] ?? feature}</li>)}</ul></> : <p className="muted">Завантажуємо стан…</p>}</aside></section>
        <section className="workspace-panel"><h2>Ресурси та історія</h2>
          <div className="field"><label htmlFor="admin-resource">Ресурс</label><select id="admin-resource" value={selectedId} onChange={event => { setSelectedId(event.target.value); setPage(0); }} disabled={busy}>{resources.length === 0 && <option value="">Спершу додайте ресурс</option>}{resources.map(resource => <option key={resource.id} value={resource.id}>{resource.name}{resource.isActive ? "" : " · неактивний"}</option>)}</select></div>
          {selected && <><div className="admin-resource-info"><p>Місць: {selected.capacity} · {selected.minSlotMinutes} хв · {selected.isActive ? "Активний" : "Деактивований"}</p>{selected.isActive && <button className="secondary-button" disabled={busy} onClick={() => setConfirmation({ kind: "deactivate", id: selected.id, label: selected.name })}>Деактивувати ресурс</button>}{!selected.isActive && <button className="secondary-button" disabled={busy} onClick={() => setConfirmation({ kind: "reactivate", id: selected.id, label: selected.name, revision: selected.revision })}>Активувати ресурс</button>}
          <button className="text-button" disabled={busy} onClick={() => setDetailId(selected.id)}>Докладна сторінка</button></div>
          <details className="resource-edit-section"><summary>Редагувати інформацію про простір</summary><p className="muted">Зміни не змінюють час і стан наявних бронювань. Перезавантаження замінить незбережені поля актуальними даними.</p>
          <button className="text-button" disabled={busy} onClick={() => setRefresh(value => value + 1)}>Перезавантажити дані</button>
          <ResourceForm key={selected.id + ":" + selected.revision} initial={selected} busy={busy} onSubmit={update} /></details><details className="resource-edit-section"><summary>Години роботи й закриті дати</summary><button className="text-button" disabled={busy} onClick={()=>setRefresh(value=>value+1)}>Перезавантажити дані</button>
          <ResourceCalendarEditor key={selected.id+":"+selected.revision} resource={selected} busy={busy} onSave={async calendar=>{const snapshot=selected;await mutate(async()=>{const result=await props.workspace.setCalendar(snapshot.id,calendar,snapshot.revision);if(result.status==="ok"){setNotice("Розклад збережено. Наявні бронювання залишаються чинними.");setRefresh(value=>value+1);}else failure(result);});}} /></details></>}
          <div className="date-range"><div className="field"><label htmlFor="history-from">Від дати (UTC)</label><input id="history-from" type="date" value={historyStart} onInput={event => { setHistoryStart(event.currentTarget.value); setPage(0); }} onChange={event => { setHistoryStart(event.target.value); setPage(0); }} /></div><div className="field"><label htmlFor="history-to">До дати включно (UTC)</label><input id="history-to" type="date" value={historyEnd} onInput={event => { setHistoryEnd(event.currentTarget.value); setPage(0); }} onChange={event => { setHistoryEnd(event.target.value); setPage(0); }} /></div></div>
          <p className="muted">Період до 31 дня. Неактивні ресурси зберігають історію.</p>{bookingList()}
        </section>
      </div> : <div className="catalog-layout">
        <section className="resource-section" aria-labelledby="catalog-title"><div className="panel-title"><h2 id="catalog-title">Доступні простори <span>{filteredResources.length} / {activeResources.length}</span></h2><button className="text-button" disabled={busy} onClick={() => setRefresh(value => value + 1)}>Оновити</button></div>
          <div className="catalog-filters"><div className="field"><label htmlFor="resource-search">Знайти простір</label><input id="resource-search" type="search" value={search} disabled={busy} onChange={event => setSearch(event.target.value)} placeholder="Назва, розташування або обладнання" /></div><div className="field"><label htmlFor="capacity-filter">Потрібно місць</label><input id="capacity-filter" type="number" min={1} max={1000} value={minCapacity} disabled={busy} onChange={event => setMinCapacity(Math.max(1, Number(event.target.value) || 1))} /></div></div>
          {activeResources.length === 0 ? <div className="empty-state"><span aria-hidden="true">⌂</span><h3>Простори ще готуються</h3><p>Адміністратор може додати перший ресурс у розділі керування.</p></div> : filteredResources.length === 0 ? <div className="empty-state"><h3>Нічого не знайдено</h3><p>Змініть назву або потрібну кількість місць.</p><button className="secondary-button" onClick={() => { setSearch(""); setMinCapacity(1); }}>Скинути фільтри</button></div> : <div className="resource-grid">{filteredResources.map((resource, index) => <div key={resource.id} className="resource-card-wrap"><button className={"resource-card " + (selectedId === resource.id ? "resource-card--selected" : "")} onClick={() => { setSelectedId(resource.id); setNotice(""); }} disabled={busy} aria-pressed={selectedId === resource.id}>
            <span className={"resource-art resource-art--" + index % 3} aria-hidden="true"><span>▤</span><i /><i /><i /></span>
            <span className="resource-card-body"><span className="resource-tag">{resource.type === "DESK" ? "РОБОЧЕ МІСЦЕ" : "КІМНАТА"}</span><strong>{resource.name}</strong>{resource.location && <span className="muted">{resource.location}</span>}<span>Місць: {resource.capacity} <b>·</b> від {resource.minSlotMinutes} хв</span><span className="resource-card-link">Переглянути час ↗</span></span>
          </button><button className="text-button resource-details-link" disabled={busy} onClick={() => setDetailId(resource.id)} aria-label={"Докладніше про " + resource.name}>Докладніше про простір ↗</button></div>)}</div>}
        </section>
        <section className="workspace-panel availability-panel" aria-labelledby="availability-title"><span className="eyebrow">СПЛАНУЙТЕ СВІЙ ЧАС</span><h2 id="availability-title">{selected?.isActive ? selected.name : "Оберіть простір"}</h2>
          {selected?.isActive && <><div className="field"><label htmlFor="booking-date">Дата ({timeZone})</label><input id="booking-date" type="date" min={today()} value={date} disabled={busy} onInput={event => setDate(event.currentTarget.value)} onChange={event => setDate(event.target.value)} /></div>
            <p className="muted">Один інтервал — {selected.minSlotMinutes} хв. Сірі інтервали зайняті, закриті або вже минули.</p>
            <div className="slots-grid" aria-label="Доступний час">{slots.map((slot, index) => <button className={"slot " + (startIndex === index ? "slot--selected" : "")} key={slot.startAt} disabled={!slot.available || busy} aria-pressed={startIndex === index} onClick={() => { setStartIndex(index); setUnits(1); }}>{time(slot.startAt)}</button>)}</div>
            {first && <div className="booking-summary"><div className="field"><label htmlFor="booking-duration">Тривалість</label><select id="booking-duration" value={units} disabled={busy} onChange={event => setUnits(Number(event.target.value))}>{Array.from({ length: contiguous }, (_, index) => <option value={index + 1} key={index}>{(index + 1) * selected.minSlotMinutes} хв</option>)}</select></div><p><strong>{time(first.startAt)} — {last ? stamp(last.endAt) : ""}</strong></p><button className="primary-button" disabled={busy} onClick={() => { void book(); }}>{busy ? "Бронюємо…" : props.user ? "Забронювати" : "Увійти й забронювати"}</button></div>}
            {!props.user && <p className="muted">Перегляд відкритий усім. Для бронювання потрібен вхід.</p>}
          </>}
        </section>
      </div>}
      </>}
    </main><footer className="workspace-footer">RoomBook · Простір для того, що має значення.</footer>
  </div>;
}
