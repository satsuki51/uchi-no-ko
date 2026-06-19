import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, onSnapshot, doc, setDoc, getDoc } from "firebase/firestore";

// Firebase設定
const firebaseConfig = {
  apiKey: "AIzaSyC_AMdxSV370MiXR-1qF-e7NVXG9uzCruE",
  authDomain: "uchi-no-ko.firebaseapp.com",
  projectId: "uchi-no-ko",
  storageBucket: "uchi-no-ko.firebasestorage.app",
  messagingSenderId: "469488530962",
  appId: "1:469488530962:web:0e6504f9e8e758b4738acb",
  measurementId: "G-XQWYKHTJGQ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const COLORS = {
  coral: "#FF6B6B", mint: "#4ECDC4", yellow: "#FFE66D",
  purple: "#A78BFA", orange: "#FF9F43", blue: "#54A0FF",
  pink: "#FF9FF3", green: "#5FD068", brown: "#8B4513",
  bg: "#FFF9F0", card: "#FFFFFF", text: "#2D2D2D", sub: "#888",
};

const TABS = [
  { id: "home", label: "ホーム", emoji: "🏠" },
  { id: "daily", label: "毎日", emoji: "📅" },
  { id: "hospital", label: "病院・薬", emoji: "💊" },
  { id: "cert", label: "証明書", emoji: "📋" },
  { id: "album", label: "アルバム", emoji: "📸" },
  { id: "settings", label: "設定", emoji: "⚙️" },
];

const today = new Date().toISOString().split("T")[0];
const thisMonth = today.slice(0, 7);

function Card({ children, style = {} }) {
  return (
    <div style={{ background: COLORS.card, borderRadius: 20, padding: "18px 20px", boxShadow: "0 4px 16px rgba(0,0,0,0.07)", marginBottom: 14, ...style }}>
      {children}
    </div>
  );
}

function Tag({ color, children }) {
  return (
    <span style={{ background: color + "22", color, borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: 700 }}>
      {children}
    </span>
  );
}

function Btn({ children, color = COLORS.coral, onClick, small, outline, style = {} }) {
  return (
    <button onClick={onClick} style={{
      background: outline ? "transparent" : color,
      color: outline ? color : "#fff",
      border: outline ? `2px solid ${color}` : "none",
      borderRadius: 50, padding: small ? "6px 16px" : "12px 28px",
      fontWeight: 700, fontSize: small ? 13 : 15, cursor: "pointer",
      boxShadow: outline ? "none" : "0 3px 10px " + color + "55", ...style,
    }}>
      {children}
    </button>
  );
}

function Input({ label, value, onChange, type = "text", placeholder }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.sub, marginBottom: 5 }}>{label}</div>}
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: "100%", padding: "11px 16px", borderRadius: 14, border: "2px solid #EEE", fontSize: 15, outline: "none", background: "#FAFAFA", boxSizing: "border-box" }}
        onFocus={e => e.target.style.border = "2px solid " + COLORS.mint}
        onBlur={e => e.target.style.border = "2px solid #EEE"}
      />
    </div>
  );
}

// ─── HOME ────────────────────────────────────────────────────────────────────
function HomeTab({ dogName, weightLogs, settings }) {
  // 月別体重
  const monthlyWeights = {};
  weightLogs.forEach(l => {
    const m = l.date.slice(0, 7);
    if (!monthlyWeights[m] || l.date > monthlyWeights[m].date) {
      monthlyWeights[m] = l;
    }
  });
  const sortedMonths = Object.keys(monthlyWeights).sort().slice(-6);

  // お薬アラート
  const today2 = today;
  const upcomingMeds = (settings.meds || []).filter(m => m.nextDate >= today2).sort((a, b) => a.nextDate.localeCompare(b.nextDate));
  const expiredMeds = (settings.meds || []).filter(m => m.nextDate && m.nextDate < today2);

  return (
    <div>
      {/* わんこ名前カード */}
      <Card style={{ background: `linear-gradient(135deg, ${COLORS.coral}22, ${COLORS.yellow}33)`, border: `2px solid ${COLORS.coral}44` }}>
        <div style={{ fontSize: 28, fontWeight: 900, color: COLORS.text }}>{dogName || "わんこの名前を設定してね"}</div>
        <div style={{ fontSize: 13, color: COLORS.sub, marginTop: 4 }}>大切な家族の記録</div>
      </Card>

      {/* 体重推移 */}
      <Card>
        <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 12 }}>📊 毎月の体重</div>
        {sortedMonths.length === 0 ? (
          <div style={{ textAlign: "center", color: COLORS.sub, padding: "20px 0" }}>体重を記録してね</div>
        ) : (
          <div>
            {sortedMonths.map(m => {
              const log = monthlyWeights[m];
              return (
                <div key={m} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #F0F0F0" }}>
                  <span style={{ fontSize: 13, color: COLORS.sub }}>{m.replace("-", "年")}月</span>
                  <span style={{ fontSize: 18, fontWeight: 900, color: COLORS.coral }}>{log.weight}kg</span>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* お薬アラート */}
      {expiredMeds.length > 0 && (
        <Card style={{ border: `2px solid ${COLORS.coral}`, background: COLORS.coral + "11" }}>
          <div style={{ fontWeight: 800, color: COLORS.coral, marginBottom: 8 }}>⚠️ 期限切れのお薬</div>
          {expiredMeds.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 4 }}>
              <span>{m.name}</span>
              <Tag color={COLORS.coral}>期限切れ</Tag>
            </div>
          ))}
        </Card>
      )}

      {upcomingMeds.length > 0 && (
        <Card style={{ borderLeft: `4px solid ${COLORS.purple}` }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: COLORS.purple, marginBottom: 10 }}>💊 次回お薬予定</div>
          {upcomingMeds.map((m, i) => {
            const diff = Math.ceil((new Date(m.nextDate) - new Date(today)) / (1000 * 60 * 60 * 24));
            const isNear = diff <= 7;
            return (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 14, marginBottom: 6 }}>
                <span>{m.name}</span>
                <Tag color={isNear ? COLORS.orange : COLORS.purple}>{m.nextDate}（あと{diff}日）</Tag>
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}

// ─── DAILY ───────────────────────────────────────────────────────────────────
function DailyTab({ dailyLogs, setDailyLogs, db }) {
  const [date, setDate] = useState(today);
  const [walkMin, setWalkMin] = useState("");
  const [walkKm, setWalkKm] = useState("");
  const [poopCount, setPoopCount] = useState("0");
  const [poopHard, setPoopHard] = useState("");
  const [peeCount, setPeeCount] = useState("0");
  const [snackName, setSnackName] = useState("");
  const [snackType, setSnackType] = useState("");
  const [snackAmount, setSnackAmount] = useState("");
  const [note, setNote] = useState("");
  const [showForm, setShowForm] = useState(false);

  const HARDNESS = [
    { label: "カチカチ", emoji: "🪨", color: "#8B6914" },
    { label: "ふつう", emoji: "💩", color: "#8B4513" },
    { label: "やわらかい", emoji: "🍦", color: "#D2691E" },
    { label: "下痢", emoji: "💧", color: "#4169E1" },
  ];

  const logs = [...dailyLogs].reverse();
  const todayLog = dailyLogs.find(l => l.date === today);

  const save = async () => {
    const data = {
      date, walkMin, walkKm,
      poopCount: parseInt(poopCount) || 0,
      poopHard, peeCount: parseInt(peeCount) || 0,
      snackName, snackType, snackAmount, note,
      createdAt: new Date().toISOString()
    };
    try {
      await addDoc(collection(db, "dailyLogs"), data);
      setWalkMin(""); setWalkKm(""); setPoopCount("0"); setPoopHard("");
      setPeeCount("0"); setSnackName(""); setSnackType(""); setSnackAmount(""); setNote("");
      setShowForm(false);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 20, fontWeight: 900 }}>📅 毎日の記録</div>
        <Btn color={COLORS.mint} small onClick={() => setShowForm(!showForm)}>{showForm ? "閉じる" : "+ 記録"}</Btn>
      </div>

      {/* 今日のサマリー */}
      {todayLog && (
        <Card style={{ background: `linear-gradient(135deg, ${COLORS.mint}22, ${COLORS.blue}22)` }}>
          <div style={{ fontWeight: 800, fontSize: 13, color: COLORS.sub, marginBottom: 8 }}>今日</div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {todayLog.walkMin && <Tag color={COLORS.mint}>🐾 {todayLog.walkMin}分</Tag>}
            {todayLog.poopCount > 0 && <Tag color={COLORS.brown}>💩 {todayLog.poopCount}回</Tag>}
            {todayLog.peeCount > 0 && <Tag color={COLORS.blue}>💧 {todayLog.peeCount}回</Tag>}
            {todayLog.snackName && <Tag color={COLORS.orange}>🦴 {todayLog.snackName}</Tag>}
          </div>
        </Card>
      )}

      {showForm && (
        <Card style={{ border: `2px solid ${COLORS.mint}44` }}>
          <Input label="日付" type="date" value={date} onChange={setDate} />

          <div style={{ fontWeight: 800, fontSize: 14, color: COLORS.mint, marginBottom: 10 }}>🐾 散歩</div>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1 }}><Input label="時間（分）" type="number" value={walkMin} onChange={setWalkMin} placeholder="30" /></div>
            <div style={{ flex: 1 }}><Input label="距離（km）" type="number" value={walkKm} onChange={setWalkKm} placeholder="1.5" /></div>
          </div>

          <div style={{ fontWeight: 800, fontSize: 14, color: COLORS.brown, margin: "10px 0" }}>💩 うんち</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            {["0","1","2","3","4","5"].map(n => (
              <button key={n} onClick={() => setPoopCount(n)} style={{
                width: 40, height: 40, borderRadius: "50%", border: "2px solid",
                borderColor: poopCount === n ? COLORS.brown : "#DDD",
                background: poopCount === n ? COLORS.brown + "22" : "#FFF",
                color: poopCount === n ? COLORS.brown : COLORS.sub,
                fontWeight: 700, cursor: "pointer",
              }}>{n}</button>
            ))}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
            {HARDNESS.map(h => (
              <button key={h.label} onClick={() => setPoopHard(h.label)} style={{
                padding: "6px 12px", borderRadius: 20, border: "2px solid",
                borderColor: poopHard === h.label ? h.color : "#DDD",
                background: poopHard === h.label ? h.color + "22" : "#FFF",
                color: poopHard === h.label ? h.color : COLORS.sub,
                fontWeight: 700, fontSize: 13, cursor: "pointer",
              }}>{h.emoji} {h.label}</button>
            ))}
          </div>

          <div style={{ fontWeight: 800, fontSize: 14, color: COLORS.blue, margin: "10px 0" }}>💧 おしっこ</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            {["0","1","2","3","4","5","6","7","8"].map(n => (
              <button key={n} onClick={() => setPeeCount(n)} style={{
                width: 36, height: 36, borderRadius: "50%", border: "2px solid",
                borderColor: peeCount === n ? COLORS.blue : "#DDD",
                background: peeCount === n ? COLORS.blue + "22" : "#FFF",
                color: peeCount === n ? COLORS.blue : COLORS.sub,
                fontWeight: 700, fontSize: 13, cursor: "pointer",
              }}>{n}</button>
            ))}
          </div>

          <div style={{ fontWeight: 800, fontSize: 14, color: COLORS.orange, margin: "10px 0" }}>🦴 おやつ</div>
          <Input label="おやつ名" value={snackName} onChange={setSnackName} placeholder="例: 鶏ジャーキー" />
          <Input label="種類" value={snackType} onChange={setSnackType} placeholder="例: ジャーキー・ガム" />
          <Input label="量" value={snackAmount} onChange={setSnackAmount} placeholder="例: 1枚 / 5g" />

          <Input label="メモ" value={note} onChange={setNote} placeholder="その他気になること" />
          <Btn color={COLORS.mint} onClick={save} style={{ width: "100%" }}>保存する</Btn>
        </Card>
      )}

      {logs.length === 0 && !showForm && (
        <div style={{ textAlign: "center", padding: "40px 0", color: COLORS.sub }}>
          <div style={{ fontSize: 40 }}>📅</div>
          <div style={{ marginTop: 8 }}>まだ記録がないよ</div>
        </div>
      )}

      {logs.map(l => {
        const hard = HARDNESS.find(h => h.label === l.poopHard);
        return (
          <Card key={l.id || l.date}>
            <div style={{ fontSize: 13, color: COLORS.sub, marginBottom: 6 }}>{l.date}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {l.walkMin && <Tag color={COLORS.mint}>🐾 散歩 {l.walkMin}分{l.walkKm ? ` ${l.walkKm}km` : ""}</Tag>}
              {l.poopCount > 0 && <Tag color={hard?.color || COLORS.brown}>💩 {l.poopHard || ""} {l.poopCount}回</Tag>}
              {l.peeCount > 0 && <Tag color={COLORS.blue}>💧 おしっこ {l.peeCount}回</Tag>}
              {l.snackName && <Tag color={COLORS.orange}>🦴 {l.snackName}{l.snackAmount ? ` ${l.snackAmount}` : ""}</Tag>}
            </div>
            {l.note && <div style={{ fontSize: 13, color: COLORS.sub, marginTop: 6 }}>{l.note}</div>}
          </Card>
        );
      })}
    </div>
  );
}

// ─── HOSPITAL ────────────────────────────────────────────────────────────────
function HospitalTab({ hospitalLogs, db }) {
  const [date, setDate] = useState(today);
  const [type, setType] = useState("");
  const [clinic, setClinic] = useState("");
  const [nextDate, setNextDate] = useState("");
  const [note, setNote] = useState("");
  const [showForm, setShowForm] = useState(false);

  const TYPES = ["ワクチン", "フィラリア予防", "ノミダニ予防", "健康診断", "診察", "歯磨き", "その他"];
  const logs = [...hospitalLogs].reverse();

  const save = async () => {
    if (!type) return;
    try {
      await addDoc(collection(db, "hospitalLogs"), { date, type, clinic, nextDate, note, createdAt: new Date().toISOString() });
      setType(""); setClinic(""); setNextDate(""); setNote(""); setShowForm(false);
    } catch (e) { console.error(e); }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 20, fontWeight: 900 }}>💊 病院・投薬</div>
        <Btn color={COLORS.purple} small onClick={() => setShowForm(!showForm)}>{showForm ? "閉じる" : "+ 記録"}</Btn>
      </div>
      {showForm && (
        <Card style={{ border: `2px solid ${COLORS.purple}44` }}>
          <Input label="日付" type="date" value={date} onChange={setDate} />
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.sub, marginBottom: 8 }}>種類</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {TYPES.map(t => (
                <button key={t} onClick={() => setType(t)} style={{
                  padding: "6px 14px", borderRadius: 20, border: "2px solid",
                  borderColor: type === t ? COLORS.purple : "#DDD",
                  background: type === t ? COLORS.purple + "22" : "#FFF",
                  color: type === t ? COLORS.purple : COLORS.sub,
                  fontWeight: 700, fontSize: 13, cursor: "pointer",
                }}>{t}</button>
              ))}
            </div>
          </div>
          <Input label="病院名" value={clinic} onChange={setClinic} placeholder="例: ○○動物病院" />
          <Input label="次回予定日" type="date" value={nextDate} onChange={setNextDate} />
          <Input label="メモ" value={note} onChange={setNote} placeholder="処方内容・金額など" />
          <Btn color={COLORS.purple} onClick={save} style={{ width: "100%" }}>保存する</Btn>
        </Card>
      )}
      {logs.length === 0 && !showForm && (
        <div style={{ textAlign: "center", padding: "40px 0", color: COLORS.sub }}>
          <div style={{ fontSize: 40 }}>💊</div>
          <div style={{ marginTop: 8 }}>まだ記録がないよ</div>
        </div>
      )}
      {logs.map(l => (
        <Card key={l.id} style={{ borderLeft: `4px solid ${COLORS.purple}` }}>
          <div style={{ fontSize: 13, color: COLORS.sub }}>{l.date}</div>
          <div style={{ fontSize: 17, fontWeight: 800, color: COLORS.purple, margin: "4px 0" }}>{l.type}</div>
          {l.clinic && <div style={{ fontSize: 14 }}>🏥 {l.clinic}</div>}
          {l.nextDate && <div style={{ marginTop: 6 }}><Tag color={COLORS.orange}>次回 {l.nextDate}</Tag></div>}
          {l.note && <div style={{ fontSize: 13, color: COLORS.sub, marginTop: 6 }}>{l.note}</div>}
        </Card>
      ))}
    </div>
  );
}

// ─── CERT ────────────────────────────────────────────────────────────────────
function CertTab({ certs, db }) {
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState("");
  const [issueDate, setIssueDate] = useState(today);
  const [expireDate, setExpireDate] = useState("");
  const [clinic, setClinic] = useState("");
  const [note, setNote] = useState("");
  const [imgData, setImgData] = useState(null);
  const [preview, setPreview] = useState(null);

  const CERT_TYPES = ["狂犬病予防注射済票", "混合ワクチン証明書", "マイクロチップ証明書", "登録証明書", "健康証明書", "その他"];
  const isExpired = (d) => d && d < today;
  const isNear = (d) => { if (!d || d < today) return false; return (new Date(d) - new Date(today)) / 86400000 <= 30; };
  const statusColor = (c) => isExpired(c.expireDate) ? COLORS.coral : isNear(c.expireDate) ? COLORS.orange : COLORS.green;
  const statusLabel = (c) => { if (!c.expireDate) return null; if (isExpired(c.expireDate)) return "期限切れ"; if (isNear(c.expireDate)) return "もうすぐ期限"; return "有効"; };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setImgData(ev.target.result);
    reader.readAsDataURL(file);
  };

  const save = async () => {
    if (!type) return;
    try {
      await addDoc(collection(db, "certs"), { type, issueDate, expireDate, clinic, note, imgData, createdAt: new Date().toISOString() });
      setType(""); setIssueDate(today); setExpireDate(""); setClinic(""); setNote(""); setImgData(null); setShowForm(false);
    } catch (e) { console.error(e); }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 20, fontWeight: 900 }}>📋 証明書・書類</div>
        <Btn color={COLORS.blue} small onClick={() => setShowForm(!showForm)}>{showForm ? "閉じる" : "+ 追加"}</Btn>
      </div>
      {showForm && (
        <Card style={{ border: `2px solid ${COLORS.blue}44` }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.sub, marginBottom: 8 }}>種類</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {CERT_TYPES.map(t => (
                <button key={t} onClick={() => setType(t)} style={{
                  padding: "6px 14px", borderRadius: 20, border: "2px solid",
                  borderColor: type === t ? COLORS.blue : "#DDD",
                  background: type === t ? COLORS.blue + "22" : "#FFF",
                  color: type === t ? COLORS.blue : COLORS.sub,
                  fontWeight: 700, fontSize: 13, cursor: "pointer",
                }}>{t}</button>
              ))}
            </div>
          </div>
          <Input label="発行日" type="date" value={issueDate} onChange={setIssueDate} />
          <Input label="有効期限" type="date" value={expireDate} onChange={setExpireDate} />
          <Input label="発行機関・病院名" value={clinic} onChange={setClinic} placeholder="例: ○○動物病院" />
          <Input label="メモ" value={note} onChange={setNote} />
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.sub, marginBottom: 8 }}>証明書の画像</div>
            <label style={{ display: "block", padding: "20px", border: "2px dashed " + COLORS.blue, borderRadius: 14, textAlign: "center", cursor: "pointer", background: COLORS.blue + "11" }}>
              {imgData ? <img src={imgData} alt="" style={{ maxHeight: 180, maxWidth: "100%", borderRadius: 10 }} /> : <span style={{ color: COLORS.blue, fontWeight: 700 }}>📄 タップして選択</span>}
              <input type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
            </label>
          </div>
          <Btn color={COLORS.blue} onClick={save} style={{ width: "100%" }}>保存する</Btn>
        </Card>
      )}
      {certs.length === 0 && !showForm && (
        <div style={{ textAlign: "center", padding: "40px 0", color: COLORS.sub }}>
          <div style={{ fontSize: 40 }}>📋</div>
          <div style={{ marginTop: 8 }}>証明書を登録しておこう</div>
        </div>
      )}
      {[...certs].reverse().map(c => (
        <Card key={c.id} style={{ borderLeft: `4px solid ${statusColor(c)}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <div style={{ fontSize: 16, fontWeight: 800 }}>{c.type}</div>
            {statusLabel(c) && <Tag color={statusColor(c)}>{statusLabel(c)}</Tag>}
          </div>
          <div style={{ fontSize: 13, color: COLORS.sub }}>
            <div>📅 {c.issueDate}</div>
            {c.expireDate && <div>⏳ {c.expireDate}まで</div>}
            {c.clinic && <div>🏥 {c.clinic}</div>}
          </div>
          {c.imgData && <img src={c.imgData} alt="" onClick={() => setPreview(c.imgData)} style={{ width: "100%", maxHeight: 160, objectFit: "cover", borderRadius: 12, marginTop: 10, cursor: "pointer" }} />}
        </Card>
      ))}
      {preview && (
        <div onClick={() => setPreview(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 20 }}>
          <img src={preview} alt="" style={{ maxWidth: "100%", maxHeight: "90vh", borderRadius: 16 }} />
        </div>
      )}
    </div>
  );
}

// ─── ALBUM ───────────────────────────────────────────────────────────────────
function AlbumTab({ photos, db }) {
  const [date, setDate] = useState(today);
  const [caption, setCaption] = useState("");
  const [imgData, setImgData] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [preview, setPreview] = useState(null);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setImgData(ev.target.result);
    reader.readAsDataURL(file);
  };

  const save = async () => {
    if (!imgData) return;
    try {
      await addDoc(collection(db, "photos"), { date, caption, imgData, createdAt: new Date().toISOString() });
      setCaption(""); setImgData(null); setShowForm(false);
    } catch (e) { console.error(e); }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 20, fontWeight: 900 }}>📸 フォトアルバム</div>
        <Btn color={COLORS.pink} small onClick={() => setShowForm(!showForm)}>{showForm ? "閉じる" : "+ 追加"}</Btn>
      </div>
      {showForm && (
        <Card style={{ border: `2px solid ${COLORS.pink}44` }}>
          <Input label="日付" type="date" value={date} onChange={setDate} />
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", padding: "20px", border: "2px dashed " + COLORS.pink, borderRadius: 14, textAlign: "center", cursor: "pointer", background: COLORS.pink + "11" }}>
              {imgData ? <img src={imgData} alt="" style={{ maxHeight: 160, maxWidth: "100%", borderRadius: 10 }} /> : <span style={{ color: COLORS.pink, fontWeight: 700 }}>📷 タップして選択</span>}
              <input type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
            </label>
          </div>
          <Input label="コメント" value={caption} onChange={setCaption} placeholder="例: トリミング後" />
          <Btn color={COLORS.pink} onClick={save} style={{ width: "100%" }}>保存する</Btn>
        </Card>
      )}
      {photos.length === 0 && !showForm && (
        <div style={{ textAlign: "center", padding: "40px 0", color: COLORS.sub }}>
          <div style={{ fontSize: 40 }}>📸</div>
          <div style={{ marginTop: 8 }}>写真を追加してね</div>
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {[...photos].reverse().map(p => (
          <div key={p.id} onClick={() => setPreview(p)} style={{ borderRadius: 16, overflow: "hidden", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", cursor: "pointer" }}>
            <img src={p.imgData} alt={p.caption} style={{ width: "100%", aspectRatio: "1", objectFit: "cover", display: "block" }} />
            <div style={{ padding: "8px 10px", background: "#FFF" }}>
              <div style={{ fontSize: 11, color: COLORS.sub }}>{p.date}</div>
              {p.caption && <div style={{ fontSize: 13, fontWeight: 700 }}>{p.caption}</div>}
            </div>
          </div>
        ))}
      </div>
      {preview && (
        <div onClick={() => setPreview(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 20, flexDirection: "column", gap: 10 }}>
          <img src={preview.imgData} alt="" style={{ maxWidth: "100%", maxHeight: "80vh", borderRadius: 16 }} />
          {preview.caption && <div style={{ color: "#FFF", fontWeight: 700 }}>{preview.caption}</div>}
        </div>
      )}
    </div>
  );
}

// ─── SETTINGS ────────────────────────────────────────────────────────────────
function SettingsTab({ settings, setSettings, weightLogs, db }) {
  const [dogName, setDogName] = useState(settings.dogName || "");
  const [food, setFood] = useState(settings.food || "");
  const [foodAmount, setFoodAmount] = useState(settings.foodAmount || "");
  const [weight, setWeight] = useState("");
  const [weightDate, setWeightDate] = useState(thisMonth);
  const [medName, setMedName] = useState("");
  const [medNext, setMedNext] = useState("");
  const [saved, setSaved] = useState(false);

  const saveSettings = async () => {
    const data = { dogName, food, foodAmount, meds: settings.meds || [] };
    try {
      await setDoc(doc(db, "settings", "main"), data);
      setSettings(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { console.error(e); }
  };

  const addWeight = async () => {
    if (!weight) return;
    try {
      await addDoc(collection(db, "weightLogs"), { date: weightDate + "-01", month: weightDate, weight: parseFloat(weight), createdAt: new Date().toISOString() });
      setWeight("");
    } catch (e) { console.error(e); }
  };

  const addMed = async () => {
    if (!medName) return;
    const newMeds = [...(settings.meds || []), { name: medName, nextDate: medNext }];
    const data = { ...settings, meds: newMeds };
    try {
      await setDoc(doc(db, "settings", "main"), data);
      setSettings(data);
      setMedName(""); setMedNext("");
    } catch (e) { console.error(e); }
  };

  const removeMed = async (idx) => {
    const newMeds = (settings.meds || []).filter((_, i) => i !== idx);
    const data = { ...settings, meds: newMeds };
    try {
      await setDoc(doc(db, "settings", "main"), data);
      setSettings(data);
    } catch (e) { console.error(e); }
  };

  return (
    <div>
      <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 16 }}>⚙️ 設定</div>

      <Card>
        <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 12 }}>🐶 わんこの情報</div>
        <Input label="名前" value={dogName} onChange={setDogName} placeholder="例: クマテツ" />
        <Input label="フード名" value={food} onChange={setFood} placeholder="例: ロイヤルカナン" />
        <Input label="1回の量（g）" type="number" value={foodAmount} onChange={setFoodAmount} placeholder="例: 80" />
        <Btn color={COLORS.mint} onClick={saveSettings} style={{ width: "100%" }}>
          {saved ? "✅ 保存しました" : "保存する"}
        </Btn>
      </Card>

      <Card>
        <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 12 }}>📊 体重を記録</div>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1 }}><Input label="年月" type="month" value={weightDate} onChange={setWeightDate} /></div>
          <div style={{ flex: 1 }}><Input label="体重（kg）" type="number" value={weight} onChange={setWeight} placeholder="4.2" /></div>
        </div>
        <Btn color={COLORS.coral} onClick={addWeight} style={{ width: "100%" }}>記録する</Btn>
        {weightLogs.length > 0 && (
          <div style={{ marginTop: 12 }}>
            {[...weightLogs].reverse().slice(0, 6).map(l => (
              <div key={l.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 14, padding: "6px 0", borderBottom: "1px solid #F0F0F0" }}>
                <span style={{ color: COLORS.sub }}>{l.month}</span>
                <span style={{ fontWeight: 800, color: COLORS.coral }}>{l.weight}kg</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 12 }}>💊 お薬・次回予定</div>
        <Input label="お薬・予防の名前" value={medName} onChange={setMedName} placeholder="例: フィラリア予防薬" />
        <Input label="次回予定日" type="date" value={medNext} onChange={setMedNext} />
        <Btn color={COLORS.purple} onClick={addMed} style={{ width: "100%", marginBottom: 12 }}>追加する</Btn>
        {(settings.meds || []).map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #F0F0F0" }}>
            <div>
              <div style={{ fontWeight: 700 }}>{m.name}</div>
              {m.nextDate && <div style={{ fontSize: 12, color: COLORS.sub }}>次回: {m.nextDate}</div>}
            </div>
            <button onClick={() => removeMed(i)} style={{ background: "none", border: "none", color: COLORS.coral, fontSize: 18, cursor: "pointer" }}>✕</button>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("home");
  const [dailyLogs, setDailyLogs] = useState([]);
  const [hospitalLogs, setHospitalLogs] = useState([]);
  const [certs, setCerts] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [weightLogs, setWeightLogs] = useState([]);
  const [settings, setSettings] = useState({ dogName: "", food: "", foodAmount: "", meds: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubs = [];

    unsubs.push(onSnapshot(collection(db, "dailyLogs"), snap => {
      setDailyLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.date.localeCompare(b.date)));
    }));

    unsubs.push(onSnapshot(collection(db, "hospitalLogs"), snap => {
      setHospitalLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.date.localeCompare(b.date)));
    }));

    unsubs.push(onSnapshot(collection(db, "certs"), snap => {
      setCerts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }));

    unsubs.push(onSnapshot(collection(db, "photos"), snap => {
      setPhotos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }));

    unsubs.push(onSnapshot(collection(db, "weightLogs"), snap => {
      setWeightLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.month?.localeCompare(b.month)));
    }));

    // 設定読み込み
    getDoc(doc(db, "settings", "main")).then(d => {
      if (d.exists()) setSettings(d.data());
      setLoading(false);
    }).catch(() => setLoading(false));

    return () => unsubs.forEach(u => u());
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#FFF9F0", flexDirection: "column", gap: 16 }}>
        <div style={{ fontSize: 48 }}>🐾</div>
        <div style={{ fontWeight: 800, color: COLORS.sub }}>読み込み中...</div>
      </div>
    );
  }

  const accentColors = { home: COLORS.coral, daily: COLORS.mint, hospital: COLORS.purple, cert: COLORS.blue, album: COLORS.pink, settings: COLORS.green };

  return (
    <div style={{ background: "#FFF9F0", minHeight: "100vh", fontFamily: "'Hiragino Sans', sans-serif", maxWidth: 480, margin: "0 auto" }}>
      <div style={{ padding: "20px 20px 0" }}>
        <div style={{ fontSize: 24, fontWeight: 900, color: COLORS.text }}>🐾 うちの子ノート</div>
        <div style={{ fontSize: 12, color: COLORS.sub }}>大切な記録をまとめておこ</div>
      </div>

      <div style={{ padding: "20px 20px 100px" }}>
        {tab === "home" && <HomeTab dogName={settings.dogName} weightLogs={weightLogs} settings={settings} />}
        {tab === "daily" && <DailyTab dailyLogs={dailyLogs} setDailyLogs={setDailyLogs} db={db} />}
        {tab === "hospital" && <HospitalTab hospitalLogs={hospitalLogs} db={db} />}
        {tab === "cert" && <CertTab certs={certs} db={db} />}
        {tab === "album" && <AlbumTab photos={photos} db={db} />}
        {tab === "settings" && <SettingsTab settings={settings} setSettings={setSettings} weightLogs={weightLogs} db={db} />}
      </div>

      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: "#FFF", borderTop: "2px solid #F0F0F0", display: "flex", boxShadow: "0 -4px 20px rgba(0,0,0,0.08)" }}>
        {TABS.map(t => {
          const active = tab === t.id;
          const color = accentColors[t.id];
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: "10px 4px 12px", border: "none", background: "transparent", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer" }}>
              <div style={{ fontSize: 20, background: active ? color + "22" : "transparent", borderRadius: 12, padding: "4px 8px" }}>{t.emoji}</div>
              <div style={{ fontSize: 9, fontWeight: active ? 800 : 500, color: active ? color : COLORS.sub }}>{t.label}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
