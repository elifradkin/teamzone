import { type CSSProperties, type FormEvent, useEffect, useState } from "react";
import { api, type BaselinePlan, type Profile, type User, type Workout } from "./api";
import { dir, type Locale, t } from "./i18n";

const GOALS = ["build_muscle", "lose_fat", "gain_strength", "maintain", "improve_endurance"] as const;

export function App() {
  const [locale, setLocale] = useState<Locale>("en");
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir(locale);
  }, [locale]);

  useEffect(() => {
    api
      .me()
      .then(async (u) => {
        setUser(u);
        setProfile(await api.getProfile());
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function handleAuthed(u: User) {
    setUser(u);
    setProfile(await api.getProfile());
  }

  if (loading) return <main style={wrap}>…</main>;

  const onboarded = profile != null && profile.age != null;

  return (
    <main style={wrap} dir={dir(locale)}>
      <header style={headerRow}>
        <strong>{t(locale, "app.name")}</strong>
        <button onClick={() => setLocale(locale === "en" ? "he" : "en")}>
          {t(locale, "lang.toggle")}
        </button>
      </header>
      {!user ? (
        <AuthForm locale={locale} onAuthed={handleAuthed} />
      ) : !onboarded ? (
        <Onboarding locale={locale} onDone={setProfile} />
      ) : (
        <Dashboard
          locale={locale}
          user={user}
          onLogout={() => void api.logout().then(() => setUser(null))}
        />
      )}
    </main>
  );
}

function AuthForm({ locale, onAuthed }: { locale: Locale; onAuthed: (u: User) => void }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const u =
        mode === "login" ? await api.login(email, password) : await api.signup(email, password);
      onAuthed(u);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }

  return (
    <form onSubmit={submit} style={card}>
      <h1>{t(locale, mode === "login" ? "auth.signIn" : "auth.signUp")}</h1>
      <label style={field}>
        {t(locale, "auth.email")}
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </label>
      <label style={field}>
        {t(locale, "auth.password")}
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
        />
      </label>
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      <button type="submit">{t(locale, mode === "login" ? "auth.signIn" : "auth.signUp")}</button>
      <button type="button" onClick={() => setMode(mode === "login" ? "signup" : "login")}>
        {t(locale, mode === "login" ? "auth.noAccount" : "auth.haveAccount")}
      </button>
    </form>
  );
}

function Onboarding({ locale, onDone }: { locale: Locale; onDone: (p: Profile) => void }) {
  const [age, setAge] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [sex, setSex] = useState<"" | "male" | "female">("");
  const [bodyType, setBodyType] = useState<"" | "lean" | "average" | "muscular">("");
  const [goals, setGoals] = useState<string[]>([]);
  const [foodPreferences, setFoodPreferences] = useState("");
  const [currentWeight, setCurrentWeight] = useState("");
  const [targetWeight, setTargetWeight] = useState("");
  const [error, setError] = useState<string | null>(null);

  const num = (s: string): number | undefined => (s.trim() === "" ? undefined : Number(s));
  const toggleGoal = (g: string) =>
    setGoals((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const updated = await api.updateProfile({
        age: num(age),
        heightCm: num(heightCm),
        sex: sex || undefined,
        bodyType: bodyType || undefined,
        goals,
        foodPreferences: foodPreferences || undefined,
        currentWeightKg: num(currentWeight),
        targetWeightKg: num(targetWeight),
      });
      onDone(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }

  return (
    <form onSubmit={submit} style={card}>
      <h1>{t(locale, "onb.title")}</h1>
      <label style={field}>
        {t(locale, "onb.age")}
        <input type="number" min={13} max={120} value={age} onChange={(e) => setAge(e.target.value)} required />
      </label>
      <label style={field}>
        {t(locale, "onb.height")}
        <input type="number" min={50} max={260} value={heightCm} onChange={(e) => setHeightCm(e.target.value)} />
      </label>
      <label style={field}>
        {t(locale, "onb.sex")}
        <select value={sex} onChange={(e) => setSex(e.target.value as typeof sex)}>
          <option value="">—</option>
          <option value="male">{t(locale, "onb.male")}</option>
          <option value="female">{t(locale, "onb.female")}</option>
        </select>
      </label>
      <label style={field}>
        {t(locale, "onb.bodyType")}
        <select value={bodyType} onChange={(e) => setBodyType(e.target.value as typeof bodyType)}>
          <option value="">—</option>
          <option value="lean">{t(locale, "onb.lean")}</option>
          <option value="average">{t(locale, "onb.average")}</option>
          <option value="muscular">{t(locale, "onb.muscular")}</option>
        </select>
      </label>
      <fieldset style={{ border: "1px solid #ddd", borderRadius: 8 }}>
        <legend>{t(locale, "onb.goals")}</legend>
        {GOALS.map((g) => (
          <label key={g} style={{ display: "block" }}>
            <input type="checkbox" checked={goals.includes(g)} onChange={() => toggleGoal(g)} />{" "}
            {t(locale, `goal.${g}`)}
          </label>
        ))}
      </fieldset>
      <label style={field}>
        {t(locale, "onb.foodPrefs")}
        <textarea value={foodPreferences} onChange={(e) => setFoodPreferences(e.target.value)} rows={2} />
      </label>
      <label style={field}>
        {t(locale, "onb.currentWeight")}
        <input type="number" min={30} max={400} step={0.1} inputMode="decimal" value={currentWeight} onChange={(e) => setCurrentWeight(e.target.value)} />
      </label>
      <label style={field}>
        {t(locale, "onb.targetWeight")}
        <input type="number" min={30} max={400} step={0.1} inputMode="decimal" value={targetWeight} onChange={(e) => setTargetWeight(e.target.value)} />
      </label>
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      <button type="submit">{t(locale, "onb.finish")}</button>
    </form>
  );
}

function Dashboard({
  locale,
  user,
  onLogout,
}: {
  locale: Locale;
  user: User;
  onLogout: () => void;
}) {
  const [plan, setPlan] = useState<BaselinePlan | null>(null);
  const [sets, setSets] = useState(3);
  const [workouts, setWorkouts] = useState<Workout[]>([]);

  function refresh() {
    void api.listWorkouts().then(setWorkouts).catch(() => undefined);
  }

  useEffect(() => {
    void api.getBaselinePlan().then(setPlan).catch(() => undefined);
    refresh();
  }, []);

  async function addWorkout() {
    await api.createWorkout([{ muscleGroup: "chest", sets, volume: sets * 800 }]);
    refresh();
  }

  return (
    <section style={card}>
      <p>
        {t(locale, "dash.welcome")}, {user.email}
      </p>

      {plan && (
        <div>
          <h2>{t(locale, "plan.title")}</h2>
          <p>
            {t(locale, "plan.daily")}: {plan.dailyTargets.kcal} {t(locale, "common.kcal")} · P
            {plan.dailyTargets.proteinG} C{plan.dailyTargets.carbsG} F{plan.dailyTargets.fatG}
          </p>
          {plan.meals.map((meal) => (
            <div key={meal.slot} style={{ marginBottom: 8 }}>
              <strong>{t(locale, `meal.${meal.slot}`)}</strong>
              <ul style={{ margin: "4px 0" }}>
                {meal.items.map((it, i) => (
                  <li key={i}>
                    {locale === "he" ? it.nameHe : it.nameEn} · {it.kcal} {t(locale, "common.kcal")}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <h2>{t(locale, "workout.log")}</h2>
      <label style={field}>
        {t(locale, "workout.sets")}
        <input type="number" min={1} value={sets} onChange={(e) => setSets(Number(e.target.value))} />
      </label>
      <button onClick={() => void addWorkout()}>{t(locale, "workout.add")}</button>
      <h3>{t(locale, "workout.recent")}</h3>
      <ul>
        {workouts.map((w) => (
          <li key={w.id}>
            {new Date(w.occurredAt).toLocaleDateString(locale)} · {w.efforts.length}{" "}
            {t(locale, "common.muscles")}
          </li>
        ))}
      </ul>
      <button onClick={onLogout}>{t(locale, "auth.logOut")}</button>
    </section>
  );
}

const wrap: CSSProperties = {
  maxWidth: 460,
  margin: "2rem auto",
  fontFamily: "system-ui, sans-serif",
  padding: "0 1rem",
};
const headerRow: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "1rem",
};
const card: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  border: "1px solid #ccc",
  borderRadius: 8,
  padding: 16,
};
const field: CSSProperties = { display: "flex", flexDirection: "column", gap: 4 };
