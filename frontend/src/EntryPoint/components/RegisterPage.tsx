import { useEffect, useState, type FormEvent, type ReactElement } from "react";
import { RegisterUserUC } from "#ui-application/Identity/UseCase/RegisterUserUC";
import { RegisterUserAC } from "#ui-application/Identity/Command/RegisterUserAC";
import { RegistrationFieldErrors } from "#ui-domain/Identity/Contract/RegistrationFieldErrors";
import { IRegisteredAccount } from "#ui-domain/Identity/Contract/IRegisteredAccount";
import { PasswordStrengthMeter } from "#ui-entrypoint/components/PasswordStrengthMeter";
import { RoomBookMark } from "#ui-entrypoint/components/RoomBookMark";

function EyeIcon(props: { visible: boolean }): ReactElement {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" stroke="currentColor" strokeWidth="1.6" />
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
    {!props.visible && <path d="m4 3 16 18" stroke="currentColor" strokeWidth="1.6" />}
  </svg>;
}

function SpaceIllustration(): ReactElement {
  return <div className="space-illustration" aria-hidden="true">
    <div className="space-illustration__top"><span>ПРОСТІР ДЛЯ ВАШИХ ПЛАНІВ</span><span>↗</span></div>
    <svg viewBox="0 0 520 280" className="floor-plan">
      <defs><pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
        <circle cx="1" cy="1" r="0.7" fill="#a2b9ae" opacity=".4" />
      </pattern></defs>
      <rect width="520" height="280" fill="url(#grid)" />
      <path d="M45 45h430v190H45Z" fill="#edf0e2" stroke="#58766a" strokeWidth="2" />
      <path d="M215 45v115m0 43v32M335 45v190M45 170h125m43 0h122" stroke="#58766a" strokeWidth="2" />
      <path d="M213 160a43 43 0 0 1-43 43m165-46a36 36 0 0 1 36 36" stroke="#93a99c" fill="none" strokeWidth="1.5" />
      <rect x="87" y="79" width="85" height="53" rx="16" fill="#d8e4b0" stroke="#70885c" />
      <path d="M105 68h48M105 143h48" stroke="#70885c" strokeWidth="8" strokeLinecap="round" />
      <rect x="248" y="83" width="52" height="29" rx="5" fill="#c6d9d5" stroke="#6c9084" />
      <rect x="248" y="158" width="52" height="29" rx="5" fill="#c6d9d5" stroke="#6c9084" />
      <circle cx="274" cy="122" r="8" fill="#6c9084" />
      <circle cx="274" cy="197" r="8" fill="#6c9084" />
      <rect x="367" y="94" width="76" height="102" rx="9" fill="#e5d3bb" stroke="#a18b71" />
      <path d="M379 86h51m-51 118h51" stroke="#a18b71" strokeWidth="8" strokeLinecap="round" />
      <circle cx="89" cy="205" r="13" fill="#819e75" /><circle cx="89" cy="205" r="6" fill="#d8e4b0" />
      <path d="M115 45h55M379 45h53M475 94v45" stroke="#b2c9c1" strokeWidth="7" />
      <text x="130" y="113" textAnchor="middle" fill="#3e543b" fontSize="12">Зустрічі</text>
      <text x="404" y="151" textAnchor="middle" fill="#6b5948" fontSize="12">Ідеї</text>
    </svg>
    <div className="space-illustration__bottom"><span><i /> Кімнати для зустрічей</span><span><i /> Місця для фокусу</span></div>
  </div>;
}

/**
 * Presents the complete registration interaction and its accessible feedback.
 * @param props - Registration capability composed by Framework.
 * @returns The responsive registration page or its public success confirmation.
 */
export function RegisterPage(props: { registration: Pick<RegisterUserUC, "execute">; onSignIn?: () => void }): ReactElement {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [visible, setVisible] = useState(false);
  const [errors, setErrors] = useState<RegistrationFieldErrors>({});
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<IRegisteredAccount | null>(null);
  const [retryUntil, setRetryUntil] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [focusField, setFocusField] = useState<"email" | "password" | "confirmation" | null>(null);

  useEffect(() => {
    if (!submitting && focusField) {
      document.getElementById("register-" + focusField)?.focus();
      setFocusField(null);
    }
  }, [submitting, focusField]);

  useEffect(() => {
    if (!retryUntil) return;
    const update = (): void => setRemaining(Math.max(0, Math.ceil((retryUntil - Date.now()) / 1000)));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [retryUntil]);

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (submitting || remaining > 0) return;
    setSubmitting(true);
    setNotice("");
    setErrors({});
    try {
      const result = await props.registration.execute(new RegisterUserAC(email, password, confirmation));
      if (result.status === "created") {
        setCreated(result.user);
        setPassword("");
        setConfirmation("");
        document.title = "Обліковий запис створено — RoomBook";
      } else if (result.status === "invalid") {
        setErrors(result.errors);
        const first = (["email", "password", "confirmation"] as const).find((field) => result.errors[field]);
        if (first) setFocusField(first);
      } else {
        if (result.field) {
          setErrors({ [result.field]: result.message });
          setFocusField(result.field);
        } else setNotice(result.message);
        if (result.retryAfterSeconds) setRetryUntil(Date.now() + result.retryAfterSeconds * 1000);
      }
    } catch {
      setNotice("Не вдалося завершити дію. Спробуйте ще раз.");
    } finally { setSubmitting(false); }
  }

  function reset(): void {
    setCreated(null); setEmail(""); setErrors({}); setNotice("");
    document.title = "Створити обліковий запис — RoomBook";
  }

  return <div className="site">
    <header className="site-header"><RoomBookMark /><span className="header-note">Кімнати. Робочі місця. Нові ідеї.</span></header>
    <main className="registration-layout">
      <section className="intro" aria-labelledby="intro-title">
        <span className="eyebrow"><span /> ПРОСТІР, ЩО ПРАЦЮЄ ДЛЯ ВАС</span>
        <h1 id="intro-title">Твій простір.<br /><em>Твій ритм.</em></h1>
        <p className="intro__text">Кімната для великої ідеї чи тихе місце для фокусу — почніть із власного облікового запису.</p>
        <SpaceIllustration />
        <div className="intro__foot"><span className="intro__spark">✳</span><p>Менше організаційних дрібниць.<br /><strong>Більше уваги важливому.</strong></p></div>
      </section>

      <section className="form-card" aria-labelledby={created ? "success-title" : "register-title"}>
        {created ? <div className="success-panel" role="status">
          <span className="success-icon" aria-hidden="true">✓</span>
          <span className="eyebrow">ГОТОВО ДО НОВИХ ПЛАНІВ</span>
          <h2 id="success-title">Обліковий запис створено</h2>
          <p>Ваша адреса в RoomBook:</p>
          <strong className="success-email">{created.email}</strong>
          <p className="success-description">Реєстрацію успішно завершено. Дякуємо, що приєдналися.</p>
          <button className="secondary-button" type="button" onClick={props.onSignIn ?? reset}>{props.onSignIn ? "Перейти до входу" : "Повернутися до форми"}</button>
        </div> : <>
          <div className="form-heading"><span className="form-heading__icon" aria-hidden="true">↗</span><span className="eyebrow">ВАШ ROOMBOOK ПОЧИНАЄТЬСЯ ТУТ</span></div>
          <h2 id="register-title">Створити обліковий запис</h2>
          <p className="form-card__subtitle">Лише email і пароль — решту сплануєте потім.</p>
          <form noValidate onSubmit={(event) => { void submit(event); }} aria-busy={submitting}>
            <div className="field">
              <label htmlFor="register-email">Email</label>
              <input id="register-email" name="email" type="email" inputMode="email" autoComplete="username"
                autoCapitalize="none" spellCheck={false} value={email} disabled={submitting}
                placeholder="name@example.com" aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "email-error" : undefined}
                onChange={(event) => { setEmail(event.target.value); setErrors((old) => ({ ...old, email: undefined })); }} />
              {errors.email && <p className="field-error" id="email-error">{errors.email}</p>}
            </div>
            <div className="field">
              <label htmlFor="register-password">Пароль</label>
              <div className="password-input">
                <input id="register-password" name="password" type={visible ? "text" : "password"} autoComplete="new-password"
                  value={password} disabled={submitting} placeholder="Ваша унікальна довга фраза"
                  aria-invalid={Boolean(errors.password)} aria-describedby={"password-strength" + (errors.password ? " password-error" : "")}
                  onChange={(event) => { setPassword(event.target.value); setErrors((old) => ({ ...old, password: undefined })); }} />
                <button className="visibility-button" type="button" onClick={() => setVisible(!visible)}
                  aria-label={visible ? "Приховати пароль" : "Показати пароль"} aria-pressed={visible}>
                  <EyeIcon visible={visible} />
                </button>
              </div>
              {errors.password && <p className="field-error" id="password-error">{errors.password}</p>}
              <PasswordStrengthMeter password={password} email={email} />
            </div>
            <div className="field">
              <label htmlFor="register-confirmation">Повторіть пароль</label>
              <input id="register-confirmation" name="confirmation" type={visible ? "text" : "password"} autoComplete="new-password"
                value={confirmation} disabled={submitting} placeholder="Ще раз, щоб упевнитися"
                aria-invalid={Boolean(errors.confirmation)} aria-describedby={errors.confirmation ? "confirmation-error" : undefined}
                onChange={(event) => { setConfirmation(event.target.value); setErrors((old) => ({ ...old, confirmation: undefined })); }} />
              {errors.confirmation && <p className="field-error" id="confirmation-error">{errors.confirmation}</p>}
            </div>
            {notice && <div className="form-notice" role="alert">{notice}</div>}
            {remaining > 0 && <p className="retry-note" role="status">Наступна спроба через {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")}.</p>}
            <button className="submit-button" type="submit" disabled={submitting || remaining > 0}>
              <span>{submitting ? "Створюємо обліковий запис…" : "Створити обліковий запис"}</span>
              <span className={submitting ? "spinner" : ""} aria-hidden="true">{submitting ? "" : "↗"}</span>
            </button>
            <p className="privacy-note"><svg width="14" height="16" viewBox="0 0 14 16" fill="none" aria-hidden="true"><rect x="2" y="7" width="10" height="8" rx="2" stroke="currentColor" /><path d="M4 7V4a3 3 0 0 1 6 0v3" stroke="currentColor" /></svg> Пароль оцінюється локально у браузері.</p>
          </form>
          {props.onSignIn && <button className="secondary-button auth-switch" type="button" disabled={submitting} onClick={props.onSignIn}>Уже є обліковий запис? Увійти</button>}
        </>}
      </section>
    </main>
    <footer className="site-footer"><span>© {new Date().getFullYear()} RoomBook</span><span>Простір для того, що має значення.</span></footer>
  </div>;
}
