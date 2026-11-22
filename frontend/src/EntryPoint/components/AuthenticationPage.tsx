import { useEffect, useState, type FormEvent, type ReactElement } from "react";
import { SessionUC } from "#ui-application/Identity/UseCase/SessionUC";
import { RegisterUserUC } from "#ui-application/Identity/UseCase/RegisterUserUC";
import { ICurrentUser } from "#ui-domain/Identity/Contract/ICurrentUser";
import { RegisterPage } from "#ui-entrypoint/components/RegisterPage";
import { WorkspaceUC } from "#ui-application/Booking/UseCase/WorkspaceUC";
import { WorkspacePage } from "#ui-entrypoint/components/WorkspacePage";
import { RoomBookMark } from "#ui-entrypoint/components/RoomBookMark";

/** @param props - Composed session and registration capabilities. @returns Accessible login, registration or current-profile view. */
export function AuthenticationPage(props: { session: SessionUC; registration: RegisterUserUC; workspace: WorkspaceUC }): ReactElement {
  const [view, setView] = useState<"login" | "register" | "catalog">("catalog");
  const [user, setUser] = useState<ICurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [retryUntil, setRetryUntil] = useState(0);
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    let active = true;
    void props.session.current().then(result => {
      if (!active) return;
      if (result.status === "authenticated") setUser(result.user);
      if (result.status === "failed") setNotice(result.message);
      setLoading(false);
    });
    return () => { active = false; };
  }, [props.session]);
  useEffect(() => {
    if (view === "catalog") return;
    document.title = user ? "Мій профіль — RoomBook" : view === "login" ? "Увійти — RoomBook" : "Реєстрація — RoomBook";
  }, [user, view]);
  useEffect(() => {
    const update = (): void => setRemaining(Math.max(0, Math.ceil((retryUntil - Date.now()) / 1000)));
    update();
    if (!retryUntil) return;
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [retryUntil]);
  // Reload server state at expiry/focus; no token decoding or browser credential storage.
  useEffect(() => {
    if (!user) return;
    let active = true;
    const refresh = (): void => { void props.session.current().then(result => {
      if (!active) return;
      if (result.status === "anonymous") { setUser(null); setNotice("Сеанс завершився. Увійдіть знову."); }
      else if (result.status === "authenticated") setUser(old => old && JSON.stringify(old) === JSON.stringify(result.user) ? old : result.user);
    }); };
    const timer = window.setInterval(refresh, 60_000);
    window.addEventListener("focus", refresh);
    return () => { active = false; window.clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, [user, props.session]);

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (busy || remaining) return;
    setBusy(true); setNotice("");
    try {
      const result = await props.session.signIn(email, password);
      if (result.status === "authenticated") { setUser(result.user); setPassword(""); setView("catalog"); }
      else if (result.status === "failed") {
        setNotice(result.message);
        if (result.retryAfterSeconds) setRetryUntil(Date.now() + result.retryAfterSeconds * 1000);
        window.setTimeout(() => document.getElementById("login-password")?.focus(), 0);
      }
    } finally { setBusy(false); }
  }
  async function logout(): Promise<void> {
    setBusy(true); setNotice("");
    try {
      const result = await props.session.signOut();
      if (result.status === "signedOut") { setUser(null); setPassword(""); setView("catalog"); setNotice("Ви вийшли з облікового запису."); }
      else if (result.status === "failed") setNotice(result.message + " Вихід не підтверджено сервером.");
    } finally { setBusy(false); }
  }
  if (!loading && view === "catalog") return <WorkspacePage workspace={props.workspace} user={user} onLogin={() => { setView("login"); setNotice(""); }} onLogout={logout} onExpired={() => { setUser(null); setView("login"); setNotice("Сеанс завершився. Увійдіть знову."); }} sessionNotice={notice} onPasswordChanged={()=>{setUser(null);setView("login");setNotice("Пароль змінено. Усі сеанси завершено. Увійдіть з новим паролем.");}} />;
  if (!loading && !user && view === "register") return <RegisterPage registration={props.registration} onSignIn={() => { setView("login"); setNotice(""); }} />;
  return <div className="site">
    <header className="site-header"><RoomBookMark /><span className="header-note">Кімнати. Робочі місця. Нові ідеї.</span></header>
    <main className="registration-layout auth-layout">
      <section className="intro"><span className="eyebrow">ВАШ ПРОСТІР У ROOMBOOK</span>
        <h1>Повертайся<br /><em>до своїх планів.</em></h1>
        <p className="intro__text">Увійдіть до свого облікового запису та керуйте власним простором.</p>
      </section>
      <section className="form-card" aria-labelledby="auth-title" aria-busy={loading || busy}>
        <span className="eyebrow">{user ? "ОБЛІКОВИЙ ЗАПИС" : "РАДІ БАЧИТИ ЗНОВУ"}</span>
        <h2 id="auth-title">{loading ? "Перевіряємо сеанс…" : user ? "Мій профіль" : "Увійти в RoomBook"}</h2>
        {!loading && (user ? <>
          <p className="form-card__subtitle">Ви успішно увійшли.</p>
          <dl className="profile-details"><dt>Email</dt><dd>{user.email}</dd><dt>Роль</dt><dd>{user.role === "ADMIN" ? "Адміністратор" : "Користувач"}</dd></dl>
          <p className="privacy-note">Каталог і власні бронювання доступні на головній сторінці.</p>
          <button className="submit-button" disabled={busy} onClick={() => { void logout(); }}>{busy ? "Виходимо…" : "Вийти з облікового запису"}</button>
        </> : <form onSubmit={event => { void submit(event); }}>
          <p className="form-card__subtitle">Ваш email і пароль відкриють доступ до профілю.</p>
          <div className="field"><label htmlFor="login-email">Email</label>
            <input id="login-email" type="email" autoComplete="username" autoCapitalize="none" spellCheck={false} required disabled={busy}
              value={email} onChange={event => setEmail(event.target.value)} placeholder="name@example.com" /></div>
          <div className="field"><label htmlFor="login-password">Пароль</label>
            <div className="password-input"><input id="login-password" type={visible ? "text" : "password"} autoComplete="current-password" required disabled={busy}
              value={password} onChange={event => setPassword(event.target.value)} aria-describedby={notice ? "auth-notice" : undefined} />
              <button className="visibility-button" type="button" aria-label={visible ? "Приховати пароль" : "Показати пароль"} aria-pressed={visible} onClick={() => setVisible(!visible)}>{visible ? "◉" : "◎"}</button></div></div>
          <button className="submit-button" disabled={busy || remaining > 0}>{busy ? "Входимо…" : "Увійти"}</button>
          {remaining > 0 && <p className="retry-note" role="status">Повторна спроба через {remaining} с.</p>}
          <button className="secondary-button auth-switch" type="button" disabled={busy} onClick={() => { setView("catalog"); setPassword(""); setNotice(""); }}>Переглянути каталог без входу</button>
          <button className="secondary-button auth-switch" type="button" disabled={busy} onClick={() => { setView("register"); setPassword(""); setNotice(""); }}>Створити обліковий запис</button>
        </form>)}
        {notice && <p className="form-notice" role="alert" id="auth-notice">{notice}</p>}
      </section>
    </main>
    <footer className="site-footer"><span>© {new Date().getFullYear()} RoomBook</span><span>Простір для того, що має значення.</span></footer>
  </div>;
}
