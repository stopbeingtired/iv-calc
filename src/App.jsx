import { useState, useEffect } from "react";

const APP_VERSION = "1.0.0";

const globalCss = `
@keyframes fall {
  0% { transform: translateY(0px); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { transform: translateY(52px); opacity: 0; }
}
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
input[type=range] {
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
  cursor: pointer;
}
input[type=range]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: linear-gradient(135deg, #38bdf8, #0ea5e9);
  box-shadow: 0 0 0 3px rgba(56,189,248,0.25), 0 2px 8px rgba(14,165,233,0.4);
  cursor: pointer;
  border: none;
}
input[type=range]::-moz-range-thumb {
  width: 22px;
  height: 22px;
  border: none;
  border-radius: 50%;
  background: linear-gradient(135deg, #38bdf8, #0ea5e9);
  cursor: pointer;
}
input.num-input {
  background: transparent;
  border: none;
  color: inherit;
  font-family: 'DM Mono', monospace;
  font-weight: 600;
  text-align: center;
  outline: none;
  width: 100%;
  font-size: inherit;
}
button {
  font-family: inherit;
}
* {
  -webkit-tap-highlight-color: transparent;
  box-sizing: border-box;
}
`;

const themes = {
  dark: {
    bg: "#030712", card: "#0f172a", cardBorder: "#1e293b",
    text: "#f1f5f9", textDim: "#94a3b8", textMute: "#475569", textFaint: "#334155",
    accent: "#38bdf8", accentDark: "#0ea5e9",
    divider: "#1e293b", track: "#1e293b",
    inputBg: "rgba(56,189,248,0.08)", inputBorder: "rgba(56,189,248,0.2)",
  },
  light: {
    bg: "#f1f5f9", card: "#ffffff", cardBorder: "#e2e8f0",
    text: "#0f172a", textDim: "#475569", textMute: "#64748b", textFaint: "#94a3b8",
    accent: "#0284c7", accentDark: "#0369a1",
    divider: "#e2e8f0", track: "#e2e8f0",
    inputBg: "rgba(2,132,199,0.08)", inputBorder: "rgba(2,132,199,0.25)",
  },
};

// Встроенные пресеты по препаратам — на основе инструкций по применению (РЛС)
// и российских клинических протоколов. ВНИМАНИЕ: значения справочные,
// окончательную дозу и скорость определяет врач.
const BUILTIN_PRESETS = [
  {
    id: "b-saline",
    category: "Растворы",
    name: "Натрия хлорид 0.9% — 500 мл",
    volume: 500, timeH: 2, timeM: 0, dropFactor: 20,
    note: "Стандартная инфузия. Скорость варьирует от назначения.",
  },
  {
    id: "b-glucose5",
    category: "Растворы",
    name: "Глюкоза 5% — 500 мл",
    volume: 500, timeH: 2, timeM: 0, dropFactor: 20,
    note: "Поддерживающая инфузия.",
  },
  {
    id: "b-ringer",
    category: "Растворы",
    name: "Раствор Рингера — 500 мл",
    volume: 500, timeH: 2, timeM: 0, dropFactor: 20,
    note: "Сбалансированный кристаллоид.",
  },
  {
    id: "b-eufillin",
    category: "Бронхолитики",
    name: "Эуфиллин 2.4% — 10 мл в 150 мл NaCl",
    volume: 160, timeH: 0, timeM: 50, dropFactor: 20,
    note: "Инструкция: 30–50 кап/мин. Расчёт даёт ~40 кап/мин.",
  },
  {
    id: "b-kcl",
    category: "Электролиты",
    name: "Калия хлорид 0.4% — 400 мл",
    volume: 400, timeH: 4, timeM: 0, dropFactor: 20,
    note: "Не быстрее 20 ммоль К⁺/час (0.3 ммоль/кг/час). 20–30 кап/мин.",
  },
  {
    id: "b-magnesium",
    category: "Электролиты",
    name: "Магния сульфат 25% — 10 мл в 250 мл",
    volume: 260, timeH: 1, timeM: 30, dropFactor: 20,
    note: "Инструкция: 15–40 кап/мин при гипомагниемии.",
  },
  {
    id: "b-ceftriaxone",
    category: "Антибиотики",
    name: "Цефтриаксон 2 г в 100 мл NaCl",
    volume: 100, timeH: 0, timeM: 30, dropFactor: 20,
    note: "Высокие дозы (>50 мг/кг) — не менее 30 минут.",
  },
  {
    id: "b-metronidazole",
    category: "Антибиотики",
    name: "Метронидазол 5 мг/мл — 100 мл",
    volume: 100, timeH: 0, timeM: 30, dropFactor: 20,
    note: "Стандартно 100 мл за 20–30 минут.",
  },
  {
    id: "b-albumin",
    category: "Коллоиды",
    name: "Альбумин 10% — 100 мл",
    volume: 100, timeH: 1, timeM: 0, dropFactor: 20,
    note: "Медленно. Контроль ЦВД и диуреза.",
  },
];

// Дозовые пресеты для режима по массе (мкг/кг/мин)
const BUILTIN_WEIGHT_PRESETS = [
  {
    id: "w-dopamine-low",
    category: "Вазопрессоры",
    name: "Дофамин — почечная доза",
    doseMcgKgMin: 3, concMgMl: 4,
    note: "2–5 мкг/кг/мин — улучшение почечного кровотока.",
  },
  {
    id: "w-dopamine-mid",
    category: "Вазопрессоры",
    name: "Дофамин — инотропная доза",
    doseMcgKgMin: 7, concMgMl: 4,
    note: "5–10 мкг/кг/мин — увеличение СВ.",
  },
  {
    id: "w-dopamine-high",
    category: "Вазопрессоры",
    name: "Дофамин — вазопрессорная доза",
    doseMcgKgMin: 15, concMgMl: 4,
    note: "10–20 мкг/кг/мин — повышение АД.",
  },
  {
    id: "w-dobutamine",
    category: "Вазопрессоры",
    name: "Добутамин",
    doseMcgKgMin: 5, concMgMl: 5,
    note: "Обычно 2.5–10 мкг/кг/мин. Кардиогенный шок.",
  },
  {
    id: "w-noradrenaline",
    category: "Вазопрессоры",
    name: "Норадреналин",
    doseMcgKgMin: 0.1, concMgMl: 0.064,
    note: "Обычно 0.05–0.5 мкг/кг/мин (4 мг в 250 мл = 16 мкг/мл).",
  },
];

function loadJSON(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function saveJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

function DripAnimation({ dropsPerMin, theme }) {
  const interval = dropsPerMin > 0 ? Math.max(150, 60000 / dropsPerMin) : 0;
  const [drops, setDrops] = useState([]);

  useEffect(() => {
    if (!interval) { setDrops([]); return; }
    const timer = setInterval(() => {
      const id = Date.now() + Math.random();
      setDrops(prev => [...prev.slice(-3), { id }]);
    }, interval);
    return () => clearInterval(timer);
  }, [interval]);

  return (
    <div style={{ position: "relative", width: 40, height: 80, margin: "0 auto" }}>
      <div style={{
        position: "absolute", left: "50%", transform: "translateX(-50%)",
        width: 4, height: "100%",
        background: `linear-gradient(to bottom, ${theme.accent}80, ${theme.accent}20)`,
        borderRadius: 2,
      }} />
      {drops.map(d => (
        <div key={d.id} style={{
          position: "absolute", top: 4, left: 0, right: 0,
          display: "flex", justifyContent: "center", pointerEvents: "none",
        }}>
          <div style={{
            width: 10, height: 14,
            borderRadius: "50% 50% 50% 50% / 40% 40% 60% 60%",
            background: `linear-gradient(135deg, ${theme.accent}, ${theme.accentDark})`,
            animation: `fall 0.6s ease-in forwards`,
            boxShadow: `0 0 8px ${theme.accent}cc`,
          }} />
        </div>
      ))}
    </div>
  );
}

function NumberInput({ value, setValue, min, max, unit, step = 1, theme }) {
  const [editing, setEditing] = useState(false);
  const [temp, setTemp] = useState(String(value));

  useEffect(() => { setTemp(String(value)); }, [value]);

  const commit = () => {
    let n = Number(temp);
    if (isNaN(n)) n = value;
    n = Math.max(min, Math.min(max, n));
    setValue(n);
    setEditing(false);
  };

  return (
    <div
      onClick={() => !editing && setEditing(true)}
      style={{
        color: theme.text, fontSize: 20,
        fontFamily: "'DM Mono', monospace", fontWeight: 600,
        background: theme.inputBg,
        padding: "4px 12px", borderRadius: 8,
        border: `1px solid ${theme.inputBorder}`,
        cursor: "pointer", display: "flex",
        alignItems: "center", gap: 4, minWidth: 70,
      }}
    >
      {editing ? (
        <input
          className="num-input" type="number" autoFocus
          value={temp}
          onChange={e => setTemp(e.target.value)}
          onBlur={commit}
          onKeyDown={e => { if (e.key === "Enter") commit(); }}
          style={{ color: theme.text }}
          inputMode="decimal"
          step={step}
        />
      ) : (
        <span>{value}</span>
      )}
      <span style={{ fontSize: 11, color: theme.textMute }}>{unit}</span>
    </div>
  );
}

function RangeSlider({ label, value, setValue, min, max, unit, step = 1, theme }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, gap: 12 }}>
        <span style={{ color: theme.textDim, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>{label}</span>
        <NumberInput value={value} setValue={setValue} min={min} max={max} unit={unit} step={step} theme={theme} />
      </div>
      <div style={{ position: "relative", height: 28, display: "flex", alignItems: "center" }}>
        <div style={{
          position: "absolute", left: 0, right: 0,
          height: 4, borderRadius: 2,
          background: theme.track, overflow: "hidden",
        }}>
          <div style={{
            width: `${((value - min) / (max - min)) * 100}%`,
            height: "100%",
            background: `linear-gradient(to right, ${theme.accentDark}, ${theme.accent})`,
            borderRadius: 2,
          }} />
        </div>
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={e => setValue(Number(e.target.value))}
          style={{ position: "absolute", width: "100%", margin: 0 }}
        />
      </div>
    </div>
  );
}

function Select({ value, onChange, options, theme, label }) {
  return (
    <div style={{ marginBottom: 18 }}>
      {label && (
        <div style={{ color: theme.textDim, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace", marginBottom: 8 }}>
          {label}
        </div>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {options.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{
              background: value === opt.value ? theme.inputBg : "transparent",
              border: `1px solid ${value === opt.value ? theme.inputBorder : theme.divider}`,
              color: value === opt.value ? theme.accent : theme.textDim,
              padding: "7px 12px", borderRadius: 8,
              fontSize: 12, fontFamily: "'DM Mono', monospace",
              cursor: "pointer", fontWeight: 500,
              transition: "all 0.15s",
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function IconBtn({ onClick, children, theme, title }) {
  return (
    <button
      onClick={onClick} title={title}
      style={{
        background: "transparent",
        border: `1px solid ${theme.divider}`,
        color: theme.textDim,
        width: 36, height: 36, borderRadius: 10,
        cursor: "pointer", display: "flex",
        alignItems: "center", justifyContent: "center",
        fontSize: 16, padding: 0,
      }}
    >{children}</button>
  );
}

function Disclaimer({ onAccept, theme }) {
  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(3,7,18,0.92)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20, zIndex: 100,
    }}>
      <div style={{
        background: theme.card, border: `1px solid ${theme.cardBorder}`,
        borderRadius: 20, padding: 28, maxWidth: 400,
        animation: "fadeUp 0.4s ease both",
      }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>⚕</div>
        <h2 style={{ color: theme.text, fontSize: 20, margin: "0 0 12px", fontWeight: 600 }}>
          Прежде чем начать
        </h2>
        <p style={{ color: theme.textDim, fontSize: 14, lineHeight: 1.6, margin: "0 0 8px" }}>
          Этот калькулятор — вспомогательный инструмент для расчёта скорости инфузии.
        </p>
        <p style={{ color: theme.textDim, fontSize: 14, lineHeight: 1.6, margin: "0 0 8px" }}>
          Окончательное решение по назначению и скорости введения препаратов принимает врач.
        </p>
        <p style={{ color: theme.textDim, fontSize: 14, lineHeight: 1.6, margin: "0 0 20px" }}>
          Всегда сверяйся с назначением, инструкцией к препарату и фактором капельной системы (указан на упаковке).
        </p>
        <button
          onClick={onAccept}
          style={{
            width: "100%",
            background: `linear-gradient(135deg, ${theme.accent}, ${theme.accentDark})`,
            color: "#ffffff", border: "none", padding: "14px",
            borderRadius: 12, fontSize: 15, fontWeight: 600,
            cursor: "pointer", letterSpacing: "0.02em",
          }}
        >
          Понятно, продолжить
        </button>
      </div>
    </div>
  );
}

export default function IVCalculator() {
  const [themeName, setThemeName] = useState(() => loadJSON("iv:theme", "dark"));
  const theme = themes[themeName];
  useEffect(() => { saveJSON("iv:theme", themeName); }, [themeName]);

  const [showDisclaimer, setShowDisclaimer] = useState(() => !loadJSON("iv:disclaimer-accepted", false));
  const acceptDisclaimer = () => { saveJSON("iv:disclaimer-accepted", true); setShowDisclaimer(false); };

  const [mode, setMode] = useState("rate");

  const [volume, setVolume] = useState(500);
  const [timeH, setTimeH] = useState(2);
  const [timeM, setTimeM] = useState(0);
  const [dropFactor, setDropFactor] = useState(20);
  const [targetRate, setTargetRate] = useState(40);
  const [weight, setWeight] = useState(70);
  const [doseMcgKgMin, setDoseMcgKgMin] = useState(5);
  const [concMgMl, setConcMgMl] = useState(1);

  const [history, setHistory] = useState(() => loadJSON("iv:history", []));
  const [presets, setPresets] = useState(() => loadJSON("iv:presets", []));
  const [showHistory, setShowHistory] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [showProtocols, setShowProtocols] = useState(false);
  const [toast, setToast] = useState(null);

  const totalMinutes = timeH * 60 + timeM;
  const drops = (mode === "rate" && totalMinutes > 0) ? Math.round((volume * dropFactor) / totalMinutes) : 0;
  const mlPerHour = (mode === "rate" && totalMinutes > 0) ? Math.round((volume / totalMinutes) * 60) : 0;

  const minutesNeeded = (mode === "time" && targetRate > 0) ? Math.round((volume * dropFactor) / targetRate) : 0;
  const hoursNeeded = Math.floor(minutesNeeded / 60);
  const minsNeeded = minutesNeeded % 60;

  const weightMlPerHour = (mode === "weight" && weight > 0 && concMgMl > 0)
    ? (doseMcgKgMin * weight * 60) / (1000 * concMgMl) : 0;
  const weightDrops = weightMlPerHour > 0 ? Math.round((weightMlPerHour * dropFactor) / 60) : 0;

  const currentRate = mode === "weight" ? weightDrops : drops;
  const rateCategory =
    currentRate === 0 ? null :
    currentRate < 20 ? { label: "Медленно", color: "#34d399" } :
    currentRate < 40 ? { label: "Умеренно", color: theme.accent } :
    currentRate < 60 ? { label: "Быстро", color: "#fbbf24" } :
                       { label: "Очень быстро", color: "#f87171" };

  const isWarn = (mode !== "time") && (currentRate > 60 || (currentRate > 0 && currentRate < 5));

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  };

  const saveToHistory = () => {
    let entry;
    if (mode === "rate") {
      if (totalMinutes === 0) { showToast("Укажи время"); return; }
      entry = { id: Date.now(), text: `${volume}мл / ${timeH}ч${timeM}м · ${dropFactor}кап/мл = ${drops} кап/мин` };
    } else if (mode === "time") {
      entry = { id: Date.now(), text: `${volume}мл @ ${targetRate}кап/мин · ${dropFactor}кап/мл = ${hoursNeeded}ч${minsNeeded}м` };
    } else {
      entry = { id: Date.now(), text: `${doseMcgKgMin}мкг/кг/мин × ${weight}кг · ${concMgMl}мг/мл = ${weightMlPerHour.toFixed(1)} мл/ч` };
    }
    const next = [entry, ...history].slice(0, 15);
    setHistory(next);
    saveJSON("iv:history", next);
    showToast("В историю");
  };

  const copyResult = () => {
    let text;
    if (mode === "rate") text = `${volume} мл за ${timeH}ч ${timeM}мин = ${drops} кап/мин ≈ ${mlPerHour} мл/ч`;
    else if (mode === "time") text = `${volume} мл при ${targetRate} кап/мин = ${hoursNeeded}ч ${minsNeeded}мин`;
    else text = `Доза ${doseMcgKgMin} мкг/кг/мин при массе ${weight} кг, концентрация ${concMgMl} мг/мл = ${weightMlPerHour.toFixed(1)} мл/ч (${weightDrops} кап/мин)`;
    try { navigator.clipboard?.writeText(text); showToast("Скопировано"); }
    catch { showToast("Не удалось"); }
  };

  const savePreset = () => {
    if (mode !== "rate") { showToast("Пресеты для основного режима"); return; }
    const name = prompt("Название пресета:");
    if (!name) return;
    const next = [...presets, { id: Date.now(), name, volume, timeH, timeM, dropFactor }];
    setPresets(next);
    saveJSON("iv:presets", next);
    showToast("Пресет сохранён");
  };

  const applyPreset = (p) => {
    setMode("rate");
    setVolume(p.volume); setTimeH(p.timeH); setTimeM(p.timeM); setDropFactor(p.dropFactor);
    setShowPresets(false);
  };

  const applyBuiltin = (p) => {
    setMode("rate");
    setVolume(p.volume); setTimeH(p.timeH); setTimeM(p.timeM); setDropFactor(p.dropFactor);
    setShowProtocols(false);
    showToast(p.name.split(" — ")[0]);
  };

  const applyBuiltinWeight = (p) => {
    setMode("weight");
    setDoseMcgKgMin(p.doseMcgKgMin); setConcMgMl(p.concMgMl);
    setShowProtocols(false);
    showToast(p.name);
  };

  const deletePreset = (id) => {
    const next = presets.filter(p => p.id !== id);
    setPresets(next);
    saveJSON("iv:presets", next);
  };

  const reset = () => {
    setVolume(500); setTimeH(2); setTimeM(0);
    setTargetRate(40); setWeight(70); setDoseMcgKgMin(5); setConcMgMl(1);
    setDropFactor(20);
    showToast("Сброшено");
  };

  return (
    <>
      <style>{globalCss}</style>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500;600&display=swap" rel="stylesheet" />

      {showDisclaimer && <Disclaimer onAccept={acceptDisclaimer} theme={theme} />}

      <div style={{
        minHeight: "100vh", background: theme.bg,
        padding: "20px 16px 80px", fontFamily: "'DM Sans', sans-serif",
        transition: "background 0.3s",
      }}>
        <div style={{ maxWidth: 480, margin: "0 auto", animation: "fadeUp 0.5s ease both" }}>

          {/* HEADER */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, gap: 10 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: theme.inputBg, border: `1px solid ${theme.inputBorder}`,
                borderRadius: 100, padding: "5px 12px", marginBottom: 8,
              }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: theme.accent, animation: "pulse-dot 1.5s ease-in-out infinite" }} />
                <span style={{ color: theme.accent, fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>
                  Инфузионная терапия
                </span>
              </div>
              <h1 style={{ color: theme.text, fontSize: 22, fontWeight: 600, margin: 0, letterSpacing: "-0.02em" }}>
                Капельный калькулятор
              </h1>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <IconBtn theme={theme} onClick={() => setThemeName(themeName === "dark" ? "light" : "dark")} title="Тема">
                {themeName === "dark" ? "☀" : "☾"}
              </IconBtn>
              <IconBtn theme={theme} onClick={() => { setShowProtocols(!showProtocols); setShowHistory(false); setShowPresets(false); }} title="Справочник препаратов">
                ℞
              </IconBtn>
              <IconBtn theme={theme} onClick={() => { setShowHistory(!showHistory); setShowPresets(false); setShowProtocols(false); }} title="История">
                ⟲
              </IconBtn>
              <IconBtn theme={theme} onClick={() => { setShowPresets(!showPresets); setShowHistory(false); setShowProtocols(false); }} title="Мои пресеты">
                ★
              </IconBtn>
            </div>
          </div>

          {/* PROTOCOLS — встроенный справочник */}
          {showProtocols && (
            <div style={{
              background: theme.card, border: `1px solid ${theme.cardBorder}`,
              borderRadius: 16, padding: 16, marginBottom: 12,
              animation: "fadeUp 0.2s ease both",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ color: theme.textDim, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>
                  Справочник препаратов
                </span>
              </div>

              <div style={{ maxHeight: 380, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
                {/* Группировка по категориям — режим скорости */}
                {["Растворы", "Бронхолитики", "Электролиты", "Антибиотики", "Коллоиды"].map(cat => {
                  const items = BUILTIN_PRESETS.filter(p => p.category === cat);
                  if (items.length === 0) return null;
                  return (
                    <div key={cat}>
                      <div style={{ color: theme.textMute, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace", marginTop: 8, marginBottom: 6, paddingLeft: 4 }}>
                        {cat}
                      </div>
                      {items.map(p => (
                        <div key={p.id}
                          onClick={() => applyBuiltin(p)}
                          style={{
                            padding: "10px 12px", background: theme.bg,
                            borderRadius: 8, cursor: "pointer", marginBottom: 4,
                          }}>
                          <div style={{ color: theme.text, fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{p.name}</div>
                          <div style={{ color: theme.textMute, fontSize: 11, lineHeight: 1.4 }}>
                            {p.note}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}

                {/* Вазопрессоры — режим по массе */}
                <div>
                  <div style={{ color: theme.textMute, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace", marginTop: 10, marginBottom: 6, paddingLeft: 4 }}>
                    Вазопрессоры (режим «По массе»)
                  </div>
                  {BUILTIN_WEIGHT_PRESETS.map(p => (
                    <div key={p.id}
                      onClick={() => applyBuiltinWeight(p)}
                      style={{
                        padding: "10px 12px", background: theme.bg,
                        borderRadius: 8, cursor: "pointer", marginBottom: 4,
                      }}>
                      <div style={{ color: theme.text, fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{p.name}</div>
                      <div style={{ color: theme.textMute, fontSize: 11, lineHeight: 1.4 }}>
                        {p.note}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{
                marginTop: 12, padding: "8px 10px",
                background: "rgba(251,191,36,0.06)",
                border: "1px solid rgba(251,191,36,0.2)",
                borderRadius: 8,
                color: "#fbbf24", fontSize: 10, lineHeight: 1.5,
              }}>
                ⓘ Справочные данные из инструкций РЛС. Окончательная скорость определяется врачом с учётом состояния пациента и совместимости препаратов.
              </div>
            </div>
          )}

          {/* HISTORY */}
          {showHistory && (
            <div style={{
              background: theme.card, border: `1px solid ${theme.cardBorder}`,
              borderRadius: 16, padding: 16, marginBottom: 12,
              animation: "fadeUp 0.2s ease both",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ color: theme.textDim, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>
                  История
                </span>
                {history.length > 0 && (
                  <button
                    onClick={() => { setHistory([]); saveJSON("iv:history", []); }}
                    style={{ background: "none", border: "none", color: theme.textMute, fontSize: 11, cursor: "pointer", fontFamily: "'DM Mono', monospace" }}
                  >
                    очистить
                  </button>
                )}
              </div>
              {history.length === 0 ? (
                <div style={{ color: theme.textMute, fontSize: 13, textAlign: "center", padding: "12px 0" }}>
                  Пока пусто
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 260, overflowY: "auto" }}>
                  {history.map(h => (
                    <div key={h.id} style={{
                      padding: "8px 10px", background: theme.bg,
                      borderRadius: 8, fontSize: 12,
                      color: theme.text, fontFamily: "'DM Mono', monospace",
                    }}>
                      {h.text}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PRESETS */}
          {showPresets && (
            <div style={{
              background: theme.card, border: `1px solid ${theme.cardBorder}`,
              borderRadius: 16, padding: 16, marginBottom: 12,
              animation: "fadeUp 0.2s ease both",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ color: theme.textDim, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>
                  Пресеты
                </span>
                <button
                  onClick={savePreset}
                  style={{ background: "none", border: "none", color: theme.accent, fontSize: 11, cursor: "pointer", fontFamily: "'DM Mono', monospace" }}
                >
                  + сохранить текущее
                </button>
              </div>
              {presets.length === 0 ? (
                <div style={{ color: theme.textMute, fontSize: 13, textAlign: "center", padding: "12px 0" }}>
                  Сохраняй частые расчёты
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {presets.map(p => (
                    <div key={p.id} style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "10px 12px", background: theme.bg, borderRadius: 8,
                    }}>
                      <div style={{ flex: 1, cursor: "pointer" }} onClick={() => applyPreset(p)}>
                        <div style={{ color: theme.text, fontSize: 13, fontWeight: 500 }}>{p.name}</div>
                        <div style={{ color: theme.textMute, fontSize: 11, fontFamily: "'DM Mono', monospace" }}>
                          {p.volume}мл · {p.timeH}ч{p.timeM}м · {p.dropFactor}кап/мл
                        </div>
                      </div>
                      <button
                        onClick={() => deletePreset(p.id)}
                        style={{ background: "none", border: "none", color: theme.textMute, cursor: "pointer", fontSize: 18, padding: 4 }}
                      >×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* MODE */}
          <div style={{
            background: theme.card, border: `1px solid ${theme.cardBorder}`,
            borderRadius: 16, padding: 6, marginBottom: 12,
            display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4,
          }}>
            {[
              { v: "rate", label: "Скорость" },
              { v: "time", label: "Время" },
              { v: "weight", label: "По массе" },
            ].map(m => (
              <button
                key={m.v}
                onClick={() => setMode(m.v)}
                style={{
                  background: mode === m.v ? `linear-gradient(135deg, ${theme.accent}, ${theme.accentDark})` : "transparent",
                  color: mode === m.v ? "#fff" : theme.textDim,
                  border: "none", padding: "10px 8px",
                  borderRadius: 12, fontSize: 13, fontWeight: 500,
                  cursor: "pointer", transition: "all 0.15s",
                }}
              >{m.label}</button>
            ))}
          </div>

          {/* MAIN CARD */}
          <div style={{
            background: theme.card, border: `1px solid ${theme.cardBorder}`,
            borderRadius: 20, padding: 22,
          }}>

            <Select
              theme={theme}
              label="Размер капли (фактор системы)"
              value={dropFactor}
              onChange={setDropFactor}
              options={[
                { value: 20, label: "20 (станд.)" },
                { value: 60, label: "60 (микро)" },
                { value: 15, label: "15 (кровь)" },
                { value: 10, label: "10" },
              ]}
            />

            {mode === "rate" && (
              <>
                <RangeSlider theme={theme} label="Объём раствора" value={volume} setValue={setVolume} min={50} max={2000} step={10} unit="мл" />
                <RangeSlider theme={theme} label="Время — часы" value={timeH} setValue={setTimeH} min={0} max={24} unit="ч" />
                <RangeSlider theme={theme} label="Время — минуты" value={timeM} setValue={setTimeM} min={0} max={59} unit="мин" />
              </>
            )}

            {mode === "time" && (
              <>
                <RangeSlider theme={theme} label="Объём раствора" value={volume} setValue={setVolume} min={50} max={2000} step={10} unit="мл" />
                <RangeSlider theme={theme} label="Целевая скорость" value={targetRate} setValue={setTargetRate} min={1} max={120} unit="кап/мин" />
              </>
            )}

            {mode === "weight" && (
              <>
                <RangeSlider theme={theme} label="Масса пациента" value={weight} setValue={setWeight} min={1} max={200} unit="кг" />
                <RangeSlider theme={theme} label="Доза" value={doseMcgKgMin} setValue={setDoseMcgKgMin} min={0.1} max={50} step={0.1} unit="мкг/кг/мин" />
                <RangeSlider theme={theme} label="Концентрация" value={concMgMl} setValue={setConcMgMl} min={0.01} max={50} step={0.01} unit="мг/мл" />
              </>
            )}

            <div style={{ height: 1, background: `linear-gradient(to right, transparent, ${theme.divider}, transparent)`, margin: "6px 0 18px" }} />

            {/* RESULT */}
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <DripAnimation dropsPerMin={currentRate} theme={theme} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: theme.textMute, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>
                  {mode === "time" ? "Время инфузии" : "Скорость введения"}
                </div>

                {mode === "rate" && (
                  <>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
                      <span style={{
                        fontSize: 46, fontWeight: 700,
                        fontFamily: "'DM Mono', monospace",
                        color: rateCategory ? rateCategory.color : theme.text,
                        lineHeight: 1,
                      }}>{drops}</span>
                      <span style={{ color: theme.textMute, fontSize: 13, fontFamily: "'DM Mono', monospace" }}>кап/мин</span>
                    </div>
                    <div style={{ color: theme.textDim, fontSize: 13, fontFamily: "'DM Mono', monospace", marginTop: 4 }}>
                      ≈ {mlPerHour} мл/час
                    </div>
                  </>
                )}

                {mode === "time" && (
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4, flexWrap: "wrap" }}>
                    <span style={{
                      fontSize: 42, fontWeight: 700,
                      fontFamily: "'DM Mono', monospace",
                      color: theme.text, lineHeight: 1,
                    }}>
                      {hoursNeeded}<span style={{ color: theme.textMute, fontSize: 18 }}>ч</span> {minsNeeded}<span style={{ color: theme.textMute, fontSize: 18 }}>м</span>
                    </span>
                  </div>
                )}

                {mode === "weight" && (
                  <>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
                      <span style={{
                        fontSize: 42, fontWeight: 700,
                        fontFamily: "'DM Mono', monospace",
                        color: rateCategory ? rateCategory.color : theme.text,
                        lineHeight: 1,
                      }}>{weightMlPerHour.toFixed(1)}</span>
                      <span style={{ color: theme.textMute, fontSize: 13, fontFamily: "'DM Mono', monospace" }}>мл/час</span>
                    </div>
                    <div style={{ color: theme.textDim, fontSize: 13, fontFamily: "'DM Mono', monospace", marginTop: 4 }}>
                      ≈ {weightDrops} кап/мин
                    </div>
                  </>
                )}

                {rateCategory && mode !== "time" && (
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    marginTop: 8,
                    background: `${rateCategory.color}15`,
                    border: `1px solid ${rateCategory.color}40`,
                    borderRadius: 6, padding: "3px 10px",
                  }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: rateCategory.color }} />
                    <span style={{ color: rateCategory.color, fontSize: 11, fontFamily: "'DM Mono', monospace" }}>
                      {rateCategory.label}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* WARNING */}
            {isWarn && (
              <div style={{
                marginTop: 14,
                background: "rgba(248,113,113,0.08)",
                border: "1px solid rgba(248,113,113,0.3)",
                borderRadius: 10, padding: "10px 12px",
                color: "#fca5a5", fontSize: 12, lineHeight: 1.5,
              }}>
                ⚠ Скорость нетипична (вне 5–60 кап/мин). Перепроверь параметры.
              </div>
            )}

            {/* ACTIONS */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 18 }}>
              <button onClick={copyResult} style={{
                background: theme.inputBg, border: `1px solid ${theme.inputBorder}`,
                color: theme.accent, padding: "10px",
                borderRadius: 10, fontSize: 12, cursor: "pointer",
                fontFamily: "'DM Mono', monospace", fontWeight: 500,
              }}>Копировать</button>
              <button onClick={saveToHistory} style={{
                background: theme.inputBg, border: `1px solid ${theme.inputBorder}`,
                color: theme.accent, padding: "10px",
                borderRadius: 10, fontSize: 12, cursor: "pointer",
                fontFamily: "'DM Mono', monospace", fontWeight: 500,
              }}>В историю</button>
              <button onClick={reset} style={{
                background: "transparent", border: `1px solid ${theme.divider}`,
                color: theme.textDim, padding: "10px",
                borderRadius: 10, fontSize: 12, cursor: "pointer",
                fontFamily: "'DM Mono', monospace", fontWeight: 500,
              }}>Сбросить</button>
            </div>
          </div>

          {/* FORMULA */}
          <div style={{
            marginTop: 12,
            background: theme.card, border: `1px solid ${theme.cardBorder}`,
            borderRadius: 12, padding: "10px 16px", textAlign: "center",
          }}>
            <span style={{ color: theme.textFaint, fontSize: 11, fontFamily: "'DM Mono', monospace", letterSpacing: "0.03em" }}>
              {mode === "rate" && "V × фактор ÷ t(мин) = кап/мин"}
              {mode === "time" && "V × фактор ÷ скорость = время (мин)"}
              {mode === "weight" && "доза × масса × 60 ÷ 1000 ÷ конц = мл/час"}
            </span>
          </div>

          {/* FOOTER */}
          <div style={{ textAlign: "center", marginTop: 24 }}>
            <span style={{ color: theme.textFaint, fontSize: 10, fontFamily: "'DM Mono', monospace" }}>
              v{APP_VERSION} · работает офлайн
            </span>
          </div>
        </div>

        {toast && (
          <div style={{
            position: "fixed", bottom: 30, left: "50%",
            transform: "translateX(-50%)",
            background: theme.text, color: theme.bg,
            padding: "10px 20px", borderRadius: 100,
            fontSize: 13, fontWeight: 500,
            animation: "fadeUp 0.3s ease both",
            zIndex: 200,
            boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
          }}>{toast}</div>
        )}
      </div>
    </>
  );
}
