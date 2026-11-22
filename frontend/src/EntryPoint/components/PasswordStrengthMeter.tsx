import { useEffect, useRef, useState, type ReactElement } from "react";
import { IPasswordStrengthEstimator } from "#ui-domain/Identity/OutsourceContract/IPasswordStrengthEstimator";

/**
 * Presents advisory local strength feedback without retaining a full library result.
 * @param props - Current sensitive field value and public email context.
 * @returns Accessible feedback independent of server acceptance.
 */
export function PasswordStrengthMeter(props: { password: string; email: string }): ReactElement {
  const estimator = useRef<IPasswordStrengthEstimator | null>(null);
  const [state, setState] = useState<"empty" | "loading" | "ready" | "unavailable">("empty");
  const [score, setScore] = useState<0 | 1 | 2 | 3 | 4>(0);
  const characters = Array.from(props.password).length;
  const bytes = new TextEncoder().encode(props.password).byteLength;

  useEffect(() => {
    let cancelled = false;
    if (!props.password) {
      setState("empty");
      setScore(0);
      return;
    }
    if (bytes > 72) { setState("unavailable"); return; }
    setState("loading");
    const timeout = window.setTimeout(() => {
      void import("#ui-infrastructure/Password/PasswordStrengthEstimator")
        .then(({ PasswordStrengthEstimator }) => {
          if (cancelled) return;
          estimator.current ??= new PasswordStrengthEstimator();
          const result = estimator.current.estimate(props.password,
            ["roombook", props.email, props.email.split("@")[0] ?? ""]);
          if (cancelled) return;
          if (result === null) setState("unavailable");
          else { setScore(result); setState("ready"); }
        }).catch(() => { if (!cancelled) setState("unavailable"); });
    }, 180);
    return () => { cancelled = true; window.clearTimeout(timeout); };
  }, [props.password, props.email, bytes]);

  const level = state !== "ready" ? 0 : score <= 1 ? 1 : score === 2 ? 2 : 3;
  const label = state === "empty" ? "Додайте пароль" : state === "loading" ? "Оцінюємо…" :
    state === "unavailable" ? "Оцінка недоступна" : level === 1 ? "Слабкий" : level === 2 ? "Нормальний" : "Міцний";
  const hint = bytes > 72 ? "Скоротіть пароль: він перевищує межу 72 байти." :
    state === "ready" && level === 1 ? "Спробуйте довшу фразу з кількох непов’язаних слів." :
    state === "ready" && level === 2 ? "Ще кілька непередбачуваних слів зроблять пароль кращим." :
    state === "ready" ? "Оцінка орієнтовна. Використовуйте цей пароль лише для RoomBook." :
    "Оцінювання відбувається локально у вашому браузері.";

  return <div className={"strength strength--" + level} id="password-strength">
    <div className="strength__top">
      <span>Міцність пароля</span>
      <strong aria-live="polite">{label}</strong>
    </div>
    <div className="strength__bars" role="meter" aria-label="Орієнтовна міцність пароля"
      aria-valuemin={0} aria-valuemax={4} aria-valuenow={state === "ready" ? score : 0}
      aria-valuetext={label}>
      {[1, 2, 3].map((bar) => <span key={bar} className={bar <= level ? "filled" : ""} />)}
    </div>
    <p className="strength__hint">{hint}</p>
    <div className="password-bounds">
      <span className={characters >= 15 ? "met" : ""}>
        <span aria-hidden="true">{characters >= 15 ? "✓" : "○"}</span> {characters}/15 символів
      </span>
      <span className={bytes > 72 ? "over" : ""}>{bytes}/72 байти</span>
    </div>
  </div>;
}
