import { type CSSProperties, useState } from "react";
import type { MuscleScore } from "./api";
import { type Locale, t } from "./i18n";

const NO_DATA = "#D3D1C7";
const SKIN = "#D8B48C";
const SHORTS = "#B5D4F4";

// Option A warm heat ramp: high recovery = pale, fatigued = deep red.
function heatColor(pct: number): string {
  if (pct >= 75) return "#FAC775";
  if (pct >= 50) return "#EF9F27";
  if (pct >= 25) return "#D85A30";
  return "#A32D2D";
}

interface MuscleProps {
  onClick: () => void;
  style: CSSProperties;
  role: "button";
  "aria-label": string;
}

export function Mannequin({ locale, scores }: { locale: Locale; scores: MuscleScore[] }) {
  const [view, setView] = useState<"figure" | "list">("figure");
  const [selected, setSelected] = useState<string | null>(null);
  const byMuscle = new Map(scores.map((s) => [s.muscleGroup, s]));
  const colorFor = (mg: string): string => {
    const s = byMuscle.get(mg);
    return s ? heatColor(s.recoveryPct) : NO_DATA;
  };
  const mp = (mg: string): MuscleProps => ({
    onClick: () => setSelected(mg),
    style: { cursor: "pointer" },
    role: "button",
    "aria-label": t(locale, `muscle.${mg}`),
  });
  const sel = selected ? byMuscle.get(selected) : undefined;

  if (scores.length === 0) {
    return (
      <div style={card}>
        <h2>{t(locale, "body.title")}</h2>
        <p style={{ color: "#888" }}>{t(locale, "body.noData")}</p>
      </div>
    );
  }

  return (
    <div style={card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0 }}>{t(locale, "body.title")}</h2>
        <div>
          <button onClick={() => setView("figure")} disabled={view === "figure"}>
            {t(locale, "body.mannequin")}
          </button>{" "}
          <button onClick={() => setView("list")} disabled={view === "list"}>
            {t(locale, "body.list")}
          </button>
        </div>
      </div>

      {view === "figure" ? (
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          <FrontFigure colorFor={colorFor} mp={mp} />
          <BackFigure colorFor={colorFor} mp={mp} />
        </div>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {[...byMuscle.values()]
            .sort((a, b) => a.muscleGroup.localeCompare(b.muscleGroup))
            .map((s) => (
              <li
                key={s.muscleGroup}
                onClick={() => setSelected(s.muscleGroup)}
                style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", cursor: "pointer" }}
              >
                <span>
                  <span
                    style={{
                      display: "inline-block",
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      background: heatColor(s.recoveryPct),
                      marginInlineEnd: 8,
                    }}
                  />
                  {t(locale, `muscle.${s.muscleGroup}`)}
                </span>
                <span style={{ color: "#888" }}>
                  {s.recoveryPct}% {t(locale, "body.recovered")}
                </span>
              </li>
            ))}
        </ul>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "8px 0" }}>
        <span style={{ fontSize: 12, color: "#888" }}>{t(locale, "body.fresh")}</span>
        <div style={{ flex: 1, height: 8, borderRadius: 6, display: "flex", overflow: "hidden" }}>
          <div style={{ flex: 1, background: "#FAC775" }} />
          <div style={{ flex: 1, background: "#EF9F27" }} />
          <div style={{ flex: 1, background: "#D85A30" }} />
          <div style={{ flex: 1, background: "#A32D2D" }} />
        </div>
        <span style={{ fontSize: 12, color: "#888" }}>{t(locale, "body.fatigued")}</span>
      </div>

      {sel && (
        <p style={{ fontSize: 13, color: "#555", margin: 0 }}>
          {t(locale, `muscle.${sel.muscleGroup}`)} — {sel.recoveryPct}% {t(locale, "body.recovered")}
          {sel.lastTrainedHoursAgo != null ? ` · ${sel.lastTrainedHoursAgo}h` : ""}
        </p>
      )}
    </div>
  );
}

function FrontFigure({
  colorFor,
  mp,
}: {
  colorFor: (mg: string) => string;
  mp: (mg: string) => MuscleProps;
}) {
  return (
    <div style={{ textAlign: "center" }}>
      <svg viewBox="0 0 110 196" width="130" height="232" role="img" aria-label="Front muscle map">
        <circle cx="55" cy="9" r="4.5" fill="#5F5E5A" />
        <circle cx="55" cy="19" r="11" fill={SKIN} />
        <rect x="50" y="29" width="10" height="7" rx="3" fill={SKIN} />
        <g {...mp("shoulders")} fill={colorFor("shoulders")}>
          <ellipse cx="40" cy="42" rx="12" ry="8" />
          <ellipse cx="70" cy="42" rx="12" ry="8" />
        </g>
        <g {...mp("chest")} fill={colorFor("chest")}>
          <rect x="39" y="38" width="32" height="19" rx="6" />
        </g>
        <g {...mp("biceps")} fill={colorFor("biceps")}>
          <rect x="21" y="40" width="11" height="30" rx="5" />
          <rect x="78" y="40" width="11" height="30" rx="5" />
        </g>
        <g {...mp("forearms")} fill={colorFor("forearms")}>
          <rect x="19" y="70" width="10" height="26" rx="5" />
          <rect x="81" y="70" width="10" height="26" rx="5" />
        </g>
        <circle cx="24" cy="100" r="4.5" fill={SKIN} />
        <circle cx="86" cy="100" r="4.5" fill={SKIN} />
        <g {...mp("abs")} fill={colorFor("abs")}>
          <rect x="46" y="57" width="18" height="22" rx="4" />
        </g>
        <rect x="40" y="80" width="30" height="24" rx="5" fill={SHORTS} />
        <g {...mp("quadriceps")} fill={colorFor("quadriceps")}>
          <rect x="42" y="104" width="12" height="44" rx="6" />
          <rect x="56" y="104" width="12" height="44" rx="6" />
        </g>
        <rect x="43" y="148" width="10" height="38" rx="5" fill={SKIN} />
        <rect x="57" y="148" width="10" height="38" rx="5" fill={SKIN} />
      </svg>
    </div>
  );
}

function BackFigure({
  colorFor,
  mp,
}: {
  colorFor: (mg: string) => string;
  mp: (mg: string) => MuscleProps;
}) {
  return (
    <div style={{ textAlign: "center" }}>
      <svg viewBox="0 0 110 196" width="130" height="232" role="img" aria-label="Back muscle map">
        <circle cx="55" cy="9" r="4.5" fill="#5F5E5A" />
        <circle cx="55" cy="19" r="11" fill="#9C7B53" />
        <rect x="50" y="29" width="10" height="7" rx="3" fill="#9C7B53" />
        <g {...mp("shoulders")} fill={colorFor("shoulders")}>
          <ellipse cx="40" cy="42" rx="12" ry="8" />
          <ellipse cx="70" cy="42" rx="12" ry="8" />
        </g>
        <g {...mp("back")} fill={colorFor("back")}>
          <rect x="39" y="38" width="32" height="40" rx="6" />
        </g>
        <g {...mp("triceps")} fill={colorFor("triceps")}>
          <rect x="21" y="40" width="11" height="30" rx="5" />
          <rect x="78" y="40" width="11" height="30" rx="5" />
        </g>
        <g {...mp("forearms")} fill={colorFor("forearms")}>
          <rect x="19" y="70" width="10" height="26" rx="5" />
          <rect x="81" y="70" width="10" height="26" rx="5" />
        </g>
        <circle cx="24" cy="100" r="4.5" fill="#9C7B53" />
        <circle cx="86" cy="100" r="4.5" fill="#9C7B53" />
        <rect x="40" y="80" width="30" height="22" rx="5" fill={SHORTS} />
        <g {...mp("glutes")} fill={colorFor("glutes")}>
          <ellipse cx="48" cy="90" rx="8" ry="7" />
          <ellipse cx="62" cy="90" rx="8" ry="7" />
        </g>
        <g {...mp("hamstrings")} fill={colorFor("hamstrings")}>
          <rect x="42" y="104" width="12" height="42" rx="6" />
          <rect x="56" y="104" width="12" height="42" rx="6" />
        </g>
        <g {...mp("calves")} fill={colorFor("calves")}>
          <rect x="43" y="148" width="10" height="38" rx="5" />
          <rect x="57" y="148" width="10" height="38" rx="5" />
        </g>
      </svg>
    </div>
  );
}

const card: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  border: "1px solid #ccc",
  borderRadius: 8,
  padding: 16,
  marginBottom: 12,
};
