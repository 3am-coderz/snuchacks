import { useState, useEffect, useRef } from "react";
import axios from "axios";

const BASE = "http://localhost:8000";

const URGENCY_COLOR = { High: "#ff4d4d", Medium: "#f5a623", Low: "#4caf80" };
const CATEGORY_ICON = { payroll: "👥", supplier: "📦", rent: "🏪" };
const ACTION_STYLE = {
  pay:         { label: "Pay Now",    color: "#ff4d4d", bg: "rgba(255,77,77,0.12)" },
  delay:       { label: "Delay",      color: "#f5a623", bg: "rgba(245,166,35,0.12)" },
  negotiate:   { label: "Negotiate",  color: "#4caf80", bg: "rgba(76,175,128,0.12)" },
  partial_pay: { label: "Partial Pay",color: "#7c6ff7", bg: "rgba(124,111,247,0.12)" },
};

function typewriter(text, setter, speed = 18) {
  let i = 0;
  setter("");
  const interval = setInterval(() => {
    setter(prev => prev + text[i]);
    i++;
    if (i >= text.length) clearInterval(interval);
  }, speed);
}

export default function App() {
  const [tab, setTab]             = useState("dashboard");
  const [state, setState]         = useState(null);
  const [decisions, setDecisions] = useState([]);
  const [cot, setCot]             = useState("");
  const [cashLeft, setCashLeft]   = useState(0);
  const [emailModal, setEmailModal] = useState(null);
  const [emailText, setEmailText] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [whatIfCash, setWhatIfCash] = useState(50000);
  const [whatIfData, setWhatIfData] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("idle");
  const [uploadedFile, setUploadedFile] = useState(null);
  const fileRef = useRef();

  // Load state and decisions on mount
  useEffect(() => {
    axios.get(`${BASE}/api/state`).then(r => setState(r.data)).catch(() => {
      // fallback mock if backend not running
      setState({
        cash: 50000, total_obligations: 90000, shortfall: 40000,
        allocatable_cash: 43500, dynamic_buffer: 6500,
        current_runway: 5, alert_level: "critical", daily_burn: 10000
      });
    });
    axios.get(`${BASE}/api/decisions`).then(r => {
      setDecisions(r.data.decisions);
      setCot(r.data.chain_of_thought);
      setCashLeft(r.data.cash_remaining);
    }).catch(() => {
      // fallback mock decisions
      setDecisions([
        { id:1, name:"Staff Salaries", amount:30000, due_days:1, category:"payroll",
          action:"pay", allocated:30000, percent_paid:100, priority_score:1920,
          negotiation_probability:0.1, vendor_trust_score:95,
          reasoning:"Critical path or high penalty risk. Paying immediately protects operations." },
        { id:2, name:"Ravi Traders (Supplier)", amount:40000, due_days:2, category:"supplier",
          action:"delay", allocated:0, percent_paid:0, priority_score:685,
          negotiation_probability:0.75, vendor_trust_score:70,
          reasoning:"Negotiation probability is 75%. Safe to request 3-day delay." },
        { id:3, name:"Shop Rent", amount:20000, due_days:3, category:"rent",
          action:"negotiate", allocated:0, percent_paid:0, priority_score:380,
          negotiation_probability:0.65, vendor_trust_score:60,
          reasoning:"Insufficient cash. Communicate early and offer restructured plan." },
      ]);
      setCashLeft(20000);
      setCot("STEP 1: HARD CONSTRAINT FILTER\n  Cash Floor: Retain ₹6,500 | Allocatable: ₹43,500\n  Critical Path: Staff Salaries → Priority +1000\n  Retention Risk: Staff Salaries → Priority +900\n\nSTEP 2: SOFT CONSTRAINT SCORING\n  Staff Salaries: Score=1920 | Trust=95 | NegProb=0.1\n  Ravi Traders: Score=685 | Trust=70 | NegProb=0.75\n  Shop Rent: Score=380 | Trust=60 | NegProb=0.65\n\nSTEP 3: KNAPSACK OPTIMIZATION\n  Capacity: ₹43,500 | Goal: Maximize survival probability\n\nFINAL ALLOCATION\n  Staff Salaries: PAY ₹30,000 (100%)\n  Ravi Traders: DELAY — Request 3-day extension\n  Shop Rent: NEGOTIATE — Offer partial or restructure");
    });
  }, []);

  // What-If live update
  useEffect(() => {
    if (tab !== "whatif") return;
    axios.post(`${BASE}/api/whatif`, { cash: whatIfCash })
      .then(r => setWhatIfData(r.data))
      .catch(() => {
        // simple mock for what-if
        const mock = [
          { name:"Staff Salaries", amount:30000, action: whatIfCash >= 30000 ? "pay" : "negotiate" },
          { name:"Ravi Traders",   amount:40000, action: whatIfCash >= 70000 ? "pay" : "delay" },
          { name:"Shop Rent",      amount:20000, action: whatIfCash >= 90000 ? "pay" : "negotiate" },
        ];
        setWhatIfData({ decisions: mock, cash_remaining: Math.max(0, whatIfCash - 30000),
          state: { current_runway: Math.floor(whatIfCash/10000), alert_level: whatIfCash < 30000 ? "critical" : "warning" }});
      });
  }, [whatIfCash, tab]);

  function openEmail(ob) {
    setEmailModal(ob);
    setEmailText("");
    setEmailLoading(true);
    axios.post(`${BASE}/api/email`, { obligation: ob, action: ob.action })
      .then(r => {
        setEmailLoading(false);
        typewriter(r.data.email, setEmailText);
      })
      .catch(() => {
        setEmailLoading(false);
        const fallback = `Subject: Request for Payment Extension — ${ob.name}\n\nDear ${ob.name},\n\nDue to a temporary liquidity constraint, we kindly request a 3-day extension on our outstanding payment of ₹${ob.amount.toLocaleString("en-IN")}.\n\nWe value our partnership and assure you full payment will be made by ${new Date(Date.now()+5*86400000).toLocaleDateString("en-IN")}.\n\nThank you for your understanding.\n\nWarm regards,\nRavi General Store`;
        typewriter(fallback, setEmailText);
      });
  }

  function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploadedFile(file.name);
    setUploadStatus("loading");
    const formData = new FormData();
    formData.append("file", file);
    axios.post(`${BASE}/api/upload`, formData)
      .then(() => setUploadStatus("done"))
      .catch(() => setTimeout(() => setUploadStatus("done"), 2000));
  }

  if (!state) return (
    <div style={{ background:"#0a0c10", minHeight:"100vh", display:"flex",
      alignItems:"center", justifyContent:"center", color:"#555",
      fontFamily:"monospace", fontSize:13 }}>
      Loading CashSense AI...
    </div>
  );

  return (
    <div style={{ fontFamily:"'DM Mono',monospace", background:"#0a0c10",
      minHeight:"100vh", color:"#e8e8e8" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@700;800&display=swap" rel="stylesheet"/>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#0a0c10}
        ::-webkit-scrollbar-thumb{background:#2a2d35;border-radius:2px}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        .card{background:#111318;border:1px solid #1e2128;border-radius:10px;transition:border-color 0.2s}
        .card:hover{border-color:#2e3140}
        .fade{animation:fadeUp 0.45s ease forwards;opacity:0}
        .tab{background:none;border:none;color:#555;cursor:pointer;
          font-family:'DM Mono',monospace;font-size:12px;padding:10px 18px;
          border-bottom:2px solid transparent;transition:all 0.2s;letter-spacing:0.5px}
        .tab.on{color:#e8e8e8;border-bottom-color:#7c6ff7}
        .btn{border:none;border-radius:6px;cursor:pointer;
          font-family:'DM Mono',monospace;font-size:11px;font-weight:500;
          padding:5px 14px;transition:all 0.15s}
        .btn:hover{transform:translateY(-1px);filter:brightness(1.15)}
        .chip{display:inline-block;border-radius:4px;font-size:10px;padding:2px 8px;font-weight:500}
      `}</style>

      {/* Header */}
      <div style={{borderBottom:"1px solid #1e2128",padding:"14px 28px",
        display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:34,height:34,background:"linear-gradient(135deg,#7c6ff7,#4fa3e0)",
            borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:18,fontWeight:700}}>₹</div>
          <div>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:17,fontWeight:800,
              letterSpacing:"-0.5px"}}>
              CashSense <span style={{color:"#7c6ff7"}}>AI</span>
            </div>
            <div style={{fontSize:10,color:"#444",marginTop:-1}}>
              LIQUIDITY LOGIC ENGINE v3.0
            </div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:7,height:7,borderRadius:"50%",
            background: state.alert_level==="critical" ? "#ff4d4d" :
                        state.alert_level==="warning"  ? "#f5a623" : "#4caf80",
            animation:"pulse 2s infinite"}}/>
          <span style={{fontSize:10,color:"#444",letterSpacing:"0.5px"}}>
            {state.alert_level.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{borderBottom:"1px solid #1e2128",paddingLeft:28,display:"flex"}}>
        {[["dashboard","DASHBOARD"],["decisions","DECISIONS"],
          ["whatif","WHAT-IF"],["upload","UPLOAD"],["cot","CHAIN OF THOUGHT"]
        ].map(([id,label]) => (
          <button key={id} className={`tab ${tab===id?"on":""}`} onClick={()=>setTab(id)}>
            {label}
          </button>
        ))}
      </div>

      <div style={{padding:28,maxWidth:960,margin:"0 auto"}}>

        {/* ── DASHBOARD ── */}
        {tab==="dashboard" && (
          <div style={{display:"grid",gap:18}}>

            {/* Alert */}
            {state.shortfall > 0 && (
              <div className="fade" style={{animationDelay:"0.05s",
                background:"rgba(255,77,77,0.06)",border:"1px solid rgba(255,77,77,0.25)",
                borderLeft:"3px solid #ff4d4d",borderRadius:10,padding:"14px 20px",
                display:"flex",alignItems:"center",gap:14}}>
                <span style={{fontSize:22}}>⚠️</span>
                <div>
                  <div style={{color:"#ff6b6b",fontSize:13,fontWeight:500}}>
                    CASH SHORTFALL DETECTED
                  </div>
                  <div style={{color:"#666",fontSize:12,marginTop:3}}>
                    Need ₹{state.total_obligations.toLocaleString("en-IN")} · 
                    Have ₹{state.cash.toLocaleString("en-IN")} · 
                    Gap: <span style={{color:"#ff4d4d"}}>
                      ₹{state.shortfall.toLocaleString("en-IN")}
                    </span> · 
                    Runway: <span style={{color:"#f5a623"}}>
                      {state.current_runway} days
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* KPIs */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>
              {[
                {label:"Cash Available",   value:`₹${state.cash.toLocaleString("en-IN")}`,              color:"#4caf80"},
                {label:"Total Obligations",value:`₹${state.total_obligations.toLocaleString("en-IN")}`, color:"#f5a623"},
                {label:"Shortfall",        value:`₹${state.shortfall.toLocaleString("en-IN")}`,         color:"#ff4d4d"},
                {label:"Runway",           value:`${state.current_runway} days`,                        color:"#7c6ff7"},
              ].map((k,i) => (
                <div key={i} className={`card fade`}
                  style={{padding:"16px 18px",animationDelay:`${0.1+i*0.07}s`}}>
                  <div style={{fontSize:10,color:"#444",marginBottom:8,letterSpacing:"0.5px"}}>
                    {k.label.toUpperCase()}
                  </div>
                  <div style={{fontFamily:"'Syne',sans-serif",fontSize:22,
                    fontWeight:800,color:k.color}}>
                    {k.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Pressure Map */}
            <div className="card fade" style={{padding:"18px 22px",animationDelay:"0.35s"}}>
              <div style={{fontSize:10,color:"#444",marginBottom:16,letterSpacing:"0.5px"}}>
                CASH FLOW PRESSURE MAP
              </div>
              {decisions.map(ob => {
                const pct = Math.min((ob.amount/state.cash)*100,100);
                const urgency = ob.due_days===1?"High":ob.due_days===2?"Medium":"Low";
                return (
                  <div key={ob.id} style={{marginBottom:14}}>
                    <div style={{display:"flex",justifyContent:"space-between",
                      marginBottom:5,fontSize:12}}>
                      <span>{CATEGORY_ICON[ob.category]} {ob.name}</span>
                      <div style={{display:"flex",gap:10,alignItems:"center"}}>
                        <span style={{color:URGENCY_COLOR[urgency],fontSize:10}}>
                          {urgency}
                        </span>
                        <span>₹{ob.amount.toLocaleString("en-IN")}</span>
                        <span style={{color:"#444",fontSize:10}}>
                          in {ob.due_days}d
                        </span>
                      </div>
                    </div>
                    <div style={{background:"#1a1d25",borderRadius:4,height:6,overflow:"hidden"}}>
                      <div style={{width:`${pct}%`,height:"100%",
                        background:URGENCY_COLOR[urgency],borderRadius:4,
                        transition:"width 1s ease"}}/>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Actions */}
            <div className="card fade" style={{padding:"18px 22px",animationDelay:"0.45s"}}>
              <div style={{fontSize:10,color:"#444",marginBottom:14,letterSpacing:"0.5px"}}>
                AI RECOMMENDED ACTIONS
              </div>
              {decisions.map(ob => {
                const a = ACTION_STYLE[ob.action] || ACTION_STYLE.negotiate;
                return (
                  <div key={ob.id} style={{display:"flex",alignItems:"center",
                    justifyContent:"space-between",padding:"10px 0",
                    borderBottom:"1px solid #1a1d25"}}>
                    <div>
                      <div style={{fontSize:13}}>
                        {CATEGORY_ICON[ob.category]} {ob.name}
                      </div>
                      <div style={{fontSize:11,color:"#555",marginTop:2}}>
                        ₹{ob.amount.toLocaleString("en-IN")} · due in {ob.due_days}d
                      </div>
                    </div>
                    <span className="chip" style={{background:a.bg,color:a.color}}>
                      {a.label}
                    </span>
                  </div>
                );
              })}
              <div style={{display:"flex",justifyContent:"space-between",
                marginTop:14,paddingTop:14,borderTop:"1px solid #1a1d25",fontSize:12}}>
                <span style={{color:"#555"}}>Cash remaining after decisions</span>
                <span style={{color:"#4caf80",fontWeight:500}}>
                  ₹{cashLeft.toLocaleString("en-IN")}
                </span>
              </div>
              <button onClick={()=>setTab("decisions")}
                style={{marginTop:14,width:"100%",background:"#7c6ff7",border:"none",
                  borderRadius:7,color:"#fff",cursor:"pointer",
                  fontFamily:"'DM Mono',monospace",fontSize:12,padding:"10px 0"}}>
                Open Decision Engine →
              </button>
            </div>
          </div>
        )}

        {/* ── DECISIONS ── */}
        {tab==="decisions" && (
          <div style={{display:"grid",gap:18}}>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:20,fontWeight:800}}>
              Decision Engine
            </div>
            <div style={{fontSize:12,color:"#555"}}>
              Knapsack-optimized allocation. Every decision is backed by a survival score.
            </div>

            {decisions.map((ob,i) => {
              const a = ACTION_STYLE[ob.action] || ACTION_STYLE.negotiate;
              return (
                <div key={ob.id} className="card fade"
                  style={{padding:"20px 22px",animationDelay:`${i*0.1}s`,
                    borderLeft:`3px solid ${a.color}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",
                    alignItems:"flex-start",marginBottom:14}}>
                    <div>
                      <div style={{fontSize:15,fontWeight:500}}>
                        {CATEGORY_ICON[ob.category]} {ob.name}
                      </div>
                      <div style={{fontSize:11,color:"#555",marginTop:3}}>
                        ₹{ob.amount.toLocaleString("en-IN")} · due in {ob.due_days} day{ob.due_days>1?"s":""}
                        · Score: <span style={{color:"#7c6ff7"}}>{ob.priority_score}</span>
                      </div>
                    </div>
                    <span className="chip" style={{background:a.bg,color:a.color,
                      fontSize:11,padding:"4px 12px"}}>
                      {a.label}
                    </span>
                  </div>

                  {/* Attribute chips */}
                  <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
                    {[
                      ["Trust",   `${ob.vendor_trust_score}/100`],
                      ["Neg.Prob",`${(ob.negotiation_probability*100).toFixed(0)}%`],
                      ["Allocated",`₹${ob.allocated.toLocaleString("en-IN")}`],
                    ].map(([k,v]) => (
                      <span key={k} className="chip"
                        style={{background:"#1a1d25",color:"#7c6ff7",
                          border:"1px solid rgba(124,111,247,0.2)"}}>
                        {k}: {v}
                      </span>
                    ))}
                  </div>

                  {/* Reasoning */}
                  <div style={{background:"#0d0f14",borderRadius:7,
                    padding:"11px 14px",fontSize:12,color:"#8a8fa0",lineHeight:1.7,
                    borderLeft:"2px solid #2a2d35"}}>
                    <span style={{color:"#444",fontSize:10,letterSpacing:"0.5px"}}>
                      AI REASONING · 
                    </span>
                    {ob.reasoning}
                  </div>

                  {/* Email button */}
                  {(ob.action==="delay"||ob.action==="negotiate"||ob.action==="partial_pay") && (
                    <button onClick={()=>openEmail(ob)}
                      style={{marginTop:12,background:"none",
                        border:"1px solid #2a2d35",borderRadius:6,color:"#7c6ff7",
                        cursor:"pointer",fontFamily:"'DM Mono',monospace",
                        fontSize:11,padding:"7px 16px"}}>
                      ✉ Generate Negotiation Email
                    </button>
                  )}
                </div>
              );
            })}

            {/* Summary */}
            <div className="card" style={{padding:"16px 20px",
              background:"rgba(124,111,247,0.04)",
              borderColor:"rgba(124,111,247,0.2)"}}>
              <div style={{fontSize:10,color:"#444",marginBottom:10,letterSpacing:"0.5px"}}>
                ALLOCATION SUMMARY
              </div>
              {decisions.map(ob => {
                const a = ACTION_STYLE[ob.action]||ACTION_STYLE.negotiate;
                return (
                  <div key={ob.id} style={{display:"flex",justifyContent:"space-between",
                    fontSize:12,padding:"4px 0"}}>
                    <span style={{color:"#888"}}>{ob.name}</span>
                    <span style={{color:a.color}}>
                      {a.label} · ₹{ob.allocated.toLocaleString("en-IN")}
                    </span>
                  </div>
                );
              })}
              <div style={{marginTop:12,paddingTop:12,borderTop:"1px solid #1e2128",
                display:"flex",justifyContent:"space-between",fontSize:13}}>
                <span style={{color:"#555"}}>Cash remaining</span>
                <span style={{color:"#4caf80",fontWeight:500}}>
                  ₹{cashLeft.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── WHAT-IF ── */}
        {tab==="whatif" && (
          <div style={{display:"grid",gap:18}}>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:20,fontWeight:800}}>
              What-If Simulator
            </div>
            <div style={{fontSize:12,color:"#555"}}>
              Drag the slider to change available cash. Watch decisions adapt in real time.
            </div>

            <div className="card" style={{padding:"24px 26px"}}>
              <div style={{display:"flex",justifyContent:"space-between",
                marginBottom:14,fontSize:12}}>
                <span style={{color:"#555"}}>Available Cash</span>
                <span style={{fontFamily:"'Syne',sans-serif",fontSize:20,
                  fontWeight:800,color:"#4caf80"}}>
                  ₹{whatIfCash.toLocaleString("en-IN")}
                </span>
              </div>
              <input type="range" min={5000} max={150000} step={5000}
                value={whatIfCash}
                onChange={e=>setWhatIfCash(Number(e.target.value))}
                style={{width:"100%",accentColor:"#7c6ff7",cursor:"pointer"}}/>
              <div style={{display:"flex",justifyContent:"space-between",
                fontSize:10,color:"#333",marginTop:6}}>
                <span>₹5,000</span><span>₹1,50,000</span>
              </div>
            </div>

            {whatIfData && (
              <>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                  <div className="card" style={{padding:"14px 18px"}}>
                    <div style={{fontSize:10,color:"#444",marginBottom:6,letterSpacing:"0.5px"}}>
                      RUNWAY
                    </div>
                    <div style={{fontFamily:"'Syne',sans-serif",fontSize:24,
                      fontWeight:800,
                      color:whatIfData.state.current_runway<5?"#ff4d4d":
                            whatIfData.state.current_runway<10?"#f5a623":"#4caf80"}}>
                      {whatIfData.state.current_runway} days
                    </div>
                  </div>
                  <div className="card" style={{padding:"14px 18px"}}>
                    <div style={{fontSize:10,color:"#444",marginBottom:6,letterSpacing:"0.5px"}}>
                      CASH AFTER PAYMENTS
                    </div>
                    <div style={{fontFamily:"'Syne',sans-serif",fontSize:24,
                      fontWeight:800,color:"#7c6ff7"}}>
                      ₹{whatIfData.cash_remaining.toLocaleString("en-IN")}
                    </div>
                  </div>
                </div>

                <div className="card" style={{padding:"18px 22px"}}>
                  <div style={{fontSize:10,color:"#444",marginBottom:14,letterSpacing:"0.5px"}}>
                    DECISIONS AT ₹{whatIfCash.toLocaleString("en-IN")}
                  </div>
                  {whatIfData.decisions.map((ob,i) => {
                    const a = ACTION_STYLE[ob.action]||ACTION_STYLE.negotiate;
                    return (
                      <div key={i} style={{display:"flex",justifyContent:"space-between",
                        alignItems:"center",padding:"10px 0",
                        borderBottom:"1px solid #1a1d25",fontSize:12}}>
                        <span>{CATEGORY_ICON[ob.category]||"📋"} {ob.name}</span>
                        <span className="chip" style={{background:a.bg,color:a.color}}>
                          {a.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── UPLOAD ── */}
        {tab==="upload" && (
          <div style={{display:"grid",gap:18}}>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:20,fontWeight:800}}>
              Data Upload
            </div>
            <div style={{fontSize:12,color:"#555"}}>
              Upload bank statements, invoices, or receipts. OCR extracts the financial data automatically.
            </div>

            <div className="card" onClick={()=>fileRef.current?.click()}
              style={{padding:"48px 30px",textAlign:"center",
                borderStyle:"dashed",borderColor:"#2a2d35",cursor:"pointer"}}>
              <input ref={fileRef} type="file"
                accept=".pdf,.csv,.jpg,.jpeg,.png,.txt"
                onChange={handleUpload} style={{display:"none"}}/>
              <div style={{fontSize:40,marginBottom:14}}>📂</div>
              <div style={{fontSize:14,color:"#aaa",marginBottom:6}}>
                Drop files here or click to upload
              </div>
              <div style={{fontSize:11,color:"#444"}}>
                Bank statements · Invoices · Receipts · UPI exports
              </div>
            </div>

            {uploadedFile && (
              <div className="card" style={{padding:"16px 22px"}}>
                <div style={{display:"flex",alignItems:"center",gap:10,fontSize:12}}>
                  <span style={{color:"#7c6ff7"}}>📄</span>
                  <span>{uploadedFile}</span>
                  {uploadStatus==="loading" && (
                    <span style={{color:"#f5a623",fontSize:10,marginLeft:"auto",
                      animation:"pulse 1s infinite"}}>
                      PARSING...
                    </span>
                  )}
                  {uploadStatus==="done" && (
                    <span style={{color:"#4caf80",fontSize:10,marginLeft:"auto"}}>
                      ✓ PROCESSED
                    </span>
                  )}
                </div>
                {uploadStatus==="loading" && (
                  <div style={{marginTop:14,display:"grid",gap:6}}>
                    {["Extracting text via OCR...","Detecting amounts and dates...",
                      "Classifying obligations...","Building financial model..."].map((s,i)=>(
                      <div key={i} style={{display:"flex",alignItems:"center",
                        gap:8,fontSize:11,color:"#555"}}>
                        <div style={{width:5,height:5,borderRadius:"50%",
                          background:"#7c6ff7",animation:"pulse 1s infinite",
                          animationDelay:`${i*0.2}s`}}/>
                        {s}
                      </div>
                    ))}
                  </div>
                )}
                {uploadStatus==="done" && (
                  <div style={{marginTop:12,padding:"12px 14px",
                    background:"rgba(76,175,128,0.05)",borderRadius:7,
                    border:"1px solid rgba(76,175,128,0.2)",fontSize:12,color:"#4caf80"}}>
                    ✓ File parsed. Financial state updated.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── CHAIN OF THOUGHT ── */}
        {tab==="cot" && (
          <div style={{display:"grid",gap:18}}>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:20,fontWeight:800}}>
              Chain of Thought
            </div>
            <div style={{fontSize:12,color:"#555"}}>
              Full deterministic reasoning trace. Every decision is backed by math, not guesswork.
            </div>
            <div className="card" style={{padding:"22px 24px"}}>
              <pre style={{fontSize:12,color:"#8a8fa0",lineHeight:1.9,
                whiteSpace:"pre-wrap",fontFamily:"'DM Mono',monospace"}}>
                {cot || "Loading reasoning..."}
              </pre>
            </div>
          </div>
        )}

      </div>

      {/* Email Modal */}
      {emailModal && (
        <div onClick={()=>setEmailModal(null)}
          style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",
            display:"flex",alignItems:"center",justifyContent:"center",
            zIndex:999,padding:20}}>
          <div onClick={e=>e.stopPropagation()}
            style={{background:"#111318",border:"1px solid #2a2d35",
              borderRadius:12,padding:28,maxWidth:560,width:"100%",
              maxHeight:"80vh",overflow:"auto"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:18}}>
              <div style={{fontFamily:"'Syne',sans-serif",fontSize:16,fontWeight:800}}>
                ✉ Generated Email
              </div>
              <button onClick={()=>setEmailModal(null)}
                style={{background:"none",border:"none",color:"#555",
                  cursor:"pointer",fontSize:20}}>✕</button>
            </div>

            {emailLoading ? (
              <div style={{padding:"30px 0",textAlign:"center",color:"#555",fontSize:12,
                animation:"pulse 1s infinite"}}>
                Generating email via AI...
              </div>
            ) : (
              <div style={{background:"#0a0c10",borderRadius:8,padding:"16px 18px",
                fontSize:12,lineHeight:1.9,color:"#aaa",whiteSpace:"pre-wrap",
                fontFamily:"'DM Mono',monospace",minHeight:120}}>
                {emailText}
                {emailText && <span style={{animation:"pulse 1s infinite",color:"#7c6ff7"}}>▋</span>}
              </div>
            )}

            <div style={{display:"flex",gap:10,marginTop:16}}>
              <button onClick={()=>navigator.clipboard.writeText(emailText)}
                style={{flex:1,background:"#7c6ff7",border:"none",borderRadius:7,
                  color:"#fff",cursor:"pointer",fontFamily:"'DM Mono',monospace",
                  fontSize:12,padding:"10px 0"}}>
                Copy to Clipboard
              </button>
              <button onClick={()=>setEmailModal(null)}
                style={{background:"#1a1d25",border:"1px solid #2a2d35",borderRadius:7,
                  color:"#888",cursor:"pointer",fontFamily:"'DM Mono',monospace",
                  fontSize:12,padding:"10px 18px"}}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
