import React, { useEffect, useMemo, useState } from "react";

// ==========================
// Mad Maker — App Preview
// ==========================
// Observações:
// - Este é um protótipo 100% front-end com dados salvos no localStorage.
// - Usuários (fixos neste preview):
//   * Supervisor: login "fabiano", senha "fabiano01"
//   * Pintura:    login "vitoria", senha "madvit27"
//   * Kits+Mat.:  login "ana",     senha "madana01"
// - Você pode editar listas (Supervisor) em ⚙️ Configurar Listas.
// - Toda edição gera registro em "Auditoria" (Supervisor).
// - Filtros rápidos: Hoje / Semana / Mês / Ano / Intervalo personalizado.

// ==========================
// Utilidades
// ==========================
const LS_KEY = "madmaker-app-v1";
const nowISO = () => new Date().toISOString();

function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) { return null; }
}
function saveState(state) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch {}
}

function startOfWeek(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay(); // 0=Dom
  const diff = (day === 0 ? -6 : 1 - day); // Início na segunda
  d.setDate(d.getDate() + diff);
  d.setHours(0,0,0,0);
  return d;
}
function endOfWeek(date = new Date()) {
  const s = startOfWeek(date);
  const e = new Date(s);
  e.setDate(e.getDate() + 7);
  e.setMilliseconds(-1);
  return e;
}
function startOfMonth(date = new Date()) {
  const d = new Date(date.getFullYear(), date.getMonth(), 1);
  d.setHours(0,0,0,0);
  return d;
}
function endOfMonth(date = new Date()) {
  const d = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  d.setMilliseconds(-1);
  return d;
}
function startOfYear(date = new Date()) {
  const d = new Date(date.getFullYear(), 0, 1);
  d.setHours(0,0,0,0);
  return d;
}
function endOfYear(date = new Date()) {
  const d = new Date(date.getFullYear()+1, 0, 1);
  d.setMilliseconds(-1);
  return d;
}

function formatDateInput(dt) {
  const d = new Date(dt);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// ==========================
// Dados Iniciais
// ==========================
const defaultData = {
  users: [
    { username: "fabiano", name: "Fabiano (Supervisor)", role: "supervisor", password: "fabiano01" },
    { username: "vitoria", name: "Vitória (Pintura)",   role: "pintura",    password: "madvit27" },
    { username: "ana",     name: "Ana (Kits/Mat)",     role: "kitsmat",    password: "madana01" },
  ],
  lists: {
    materiais: [
      "Caixa 16x11x3 (Pequena Baixa)",
      "Caixa 16x11x6 (Pequena Media)",
      "Caixa 16x11x8 (Pequena Alta)",
      "Caixa 15x15x10 (Livros)",
      "Caixa 27x9x9 (Versalhes)",
      "Caixa 30x10x10 (Madri)",
      "Caixa 25x15x10 (2 Doah)",
      "Caixa carimbo",
      "Caixa Grande",
      "Fita Adesiva Grande",
      "Fita Adesiva - suporte de mesa",
      "Fita Anti-Ruido",
      "Fita Dupla Face 3M",
      "Poste","Pessoas","Arvores","Cogumelos","Joaninhas","Abelhas","Case","Carros","Baterias"
    ],
    kits: [
      "2x Poste (Montagem)","3x Poste (Montagem)","5x Poste (Montagem)","5x Poste (Caixa)","10x Poste (Caixa)",
      "5x Casas","5x Bancos","Kit Base (Montagem)","Kit Base (Caixa)","BC (Base +Casa)","BP (Base + Poço)",
      "Kit 50","Kit 36","Kit 30","Kit 25","Kit 22","Kit 21","Kit 17","Kit 17-B","Kit 13","Kit 11","Kit 9",
      "Temático - Lago dos Sonhos","Temático - Bosque Encantado","Temático - Galinheiro","Temático - Acampamento na Floresta",
      "Temático - Pic-Nick","Temático - Cidade","Temático - Acampamento no Lago dos Sonhos","Temático - Pic-Nick no Lago dos Sonhos",
      "Temático - Pic-Nick na Bosque Encantado",
      "Suporte - 3x Empurrando Preto","Suporte - 2x Capacete","Suporte - 2x Fone de Ouvido","Suporte - 2x Bolas",
      "Suporte - Banheiro","Suporte – Livro Lendo","Suporte – Livro Gato","Suporte – Livro HP","Suporte – Livro Peq. Principe","Suporte - Karatê"
    ],
    pecas: [
      "sapo","pato","castores","dog","gato","tartarugas","galinhas","pintinhos","joaninhas","abelhas","cisne","coelho",
      "bancoo","ponte","casas","mesa redonda","mesa medieval","galinheiro","lago","passarinhos","fogueira"
    ]
  },
  // Tabela de mínimos e flags de compra
  materiaisConfig: {}, // { [nome]: { minimo: number, precisaComprar: boolean } }
  // Lançamentos
  pintura: [], // { id, date, peca, qtyOk, qtyDesc, concl, verniz, obs, user }
  kits: [],    // { id, date, kit, qty, obs, user }
  audit: []    // { id, ts, user, action, entity, entityId, field, from, to }
};

// Pré-preenche mínimos = 0 e precisaComprar=false
function ensureMateriaisConfig(state) {
  const s = { ...state };
  const cfg = { ...s.materiaisConfig };
  s.lists.materiais.forEach(n => {
    if (!cfg[n]) cfg[n] = { minimo: 0, precisaComprar: false };
  });
  s.materiaisConfig = cfg;
  return s;
}

// ==========================
// App
// ==========================
export default function App() {
  const [state, setState] = useState(() => ensureMateriaisConfig(loadState() || defaultData));
  const [user, setUser] = useState(null);
  const [route, setRoute] = useState("home");
  const [showConfig, setShowConfig] = useState(false);
  const [showAudit, setShowAudit] = useState(false);

  useEffect(() => { saveState(state); }, [state]);

  const doLogin = (username, password) => {
    const u = state.users.find(x => x.username === username && x.password === password);
    if (u) { setUser(u); setRoute(u.role === "supervisor" ? "pintura" : (u.role === "pintura" ? "pintura" : "kits")); }
    else alert("Login inválido");
  };
  const doLogout = () => { setUser(null); setRoute("home"); };

  const addAudit = (entry) => {
    setState(s => ({...s, audit: [...s.audit, { id: crypto.randomUUID(), ts: nowISO(), user: user?.username || "system", ...entry }]}));
  };

  const canEditLists = user?.role === "supervisor";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="px-4 py-3 bg-white border-b sticky top-0 z-30">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <div className="text-2xl font-bold">Mad Maker — Controle</div>
          <div className="ml-auto flex items-center gap-2">
            {user && (
              <>
                {user.role === 'supervisor' && (
                  <button className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300" onClick={() => setShowAudit(true)}>Auditoria</button>
                )}
                {canEditLists && (
                  <button className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300" onClick={() => setShowConfig(true)}>⚙️ Configurar Listas</button>
                )}
                <span className="text-sm px-2 py-1 bg-slate-100 rounded">{user.name}</span>
                <button className="px-3 py-1.5 rounded-lg bg-black text-white" onClick={doLogout}>Sair</button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4">
        {!user ? (
          <Login onLogin={doLogin} />
        ) : (
          <div>
            <Nav route={route} setRoute={setRoute} role={user.role} />
            {route === 'pintura' && (
              <PinturaScreen state={state} setState={setState} addAudit={addAudit} currentUser={user} canEdit={true} supervisor={user.role==='supervisor'} />
            )}
            {route === 'kits' && (
              <KitsScreen state={state} setState={setState} addAudit={addAudit} currentUser={user} supervisor={user.role==='supervisor'} />
            )}
            {route === 'materiais' && (
              <MateriaisScreen state={state} setState={setState} addAudit={addAudit} currentUser={user} canEditMin={user.role!=='pintura'} supervisor={user.role==='supervisor'} />
            )}
          </div>
        )}
      </main>

      {showConfig && (
        <ConfigModal state={state} setState={setState} onClose={() => setShowConfig(false)} addAudit={addAudit} />
      )}
      {showAudit && (
        <AuditModal audit={state.audit} onClose={() => setShowAudit(false)} />
      )}
    </div>
  );
}

// ==========================
// Componentes
// ==========================
function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  return (
    <div className="max-w-md mx-auto mt-16 p-6 bg-white rounded-2xl shadow">
      <h2 className="text-xl font-semibold mb-4">Entrar</h2>
      <div className="space-y-3">
        <input className="w-full border rounded-lg px-3 py-2" placeholder="Usuário (fabiano / vitoria / ana)" value={username} onChange={e=>setUsername(e.target.value)} />
        <input className="w-full border rounded-lg px-3 py-2" type="password" placeholder="Senha" value={password} onChange={e=>setPassword(e.target.value)} />
        <button className="w-full py-2 rounded-lg bg-black text-white" onClick={()=>onLogin(username, password)}>Acessar</button>
        <p className="text-xs text-slate-500">Senhas: fabiano01 · madvit27 · madana01</p>
      </div>
    </div>
  );
}

function Nav({ route, setRoute, role }) {
  return (
    <div className="flex gap-2 mb-4">
      <Tab label="Pintura" active={route==='pintura'} onClick={()=>setRoute('pintura')} />
      <Tab label="Kits montados" active={route==='kits'} onClick={()=>setRoute('kits')} />
      <Tab label="Materiais" active={route==='materiais'} onClick={()=>setRoute('materiais')} />
      <div className="ml-auto text-sm text-slate-500">Acesso: {role}</div>
    </div>
  );
}
function Tab({ label, active, onClick }) {
  return (
    <button onClick={onClick} className={`px-3 py-2 rounded-xl border ${active? 'bg-black text-white border-black':'bg-white hover:bg-slate-100'}`}>{label}</button>
  );
}

function DateFilters({ range, setRange }) {
  const [mode, setMode] = useState("mes");
  const [custom, setCustom] = useState({ from: formatDateInput(new Date()), to: formatDateInput(new Date()) });

  useEffect(()=>{
    // atualizar quando troca modo
    const today = new Date();
    if (mode === 'hoje') setRange({ from: new Date(today.setHours(0,0,0,0)), to: new Date(today.setHours(23,59,59,999)) });
    if (mode === 'semana') setRange({ from: startOfWeek(), to: endOfWeek() });
    if (mode === 'mes') setRange({ from: startOfMonth(), to: endOfMonth() });
    if (mode === 'ano') setRange({ from: startOfYear(), to: endOfYear() });
    if (mode === 'intervalo') setRange({ from: new Date(custom.from), to: new Date(new Date(custom.to).setHours(23,59,59,999)) });
  // eslint-disable-next-line
  }, [mode, custom.from, custom.to]);

  return (
    <div className="flex flex-wrap items-end gap-2">
      {['hoje','semana','mes','ano','intervalo'].map(m => (
        <button key={m} className={`px-3 py-1.5 rounded-lg border ${mode===m? 'bg-slate-900 text-white border-slate-900':'bg-white hover:bg-slate-100'}`} onClick={()=>setMode(m)}>
          {m === 'hoje' ? 'Hoje' : m === 'semana' ? 'Esta semana' : m === 'mes' ? 'Este mês' : m === 'ano' ? 'Este ano' : 'Intervalo'}
        </button>
      ))}
      {mode === 'intervalo' && (
        <>
          <div className="flex items-center gap-2">
            <label className="text-sm">De</label>
            <input type="date" className="border rounded-lg px-2 py-1" value={custom.from} onChange={e=>setCustom({...custom, from: e.target.value})} />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm">Até</label>
            <input type="date" className="border rounded-lg px-2 py-1" value={custom.to} onChange={e=>setCustom({...custom, to: e.target.value})} />
          </div>
        </>
      )}
    </div>
  );
}

function SectionCard({ title, children, right }) {
  return (
    <div className="bg-white rounded-2xl shadow p-4 mb-4">
      <div className="flex items-center mb-3">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="ml-auto">{right}</div>
      </div>
      {children}
    </div>
  );
}

// ----------- PINTURA -----------
function PinturaScreen({ state, setState, addAudit, currentUser, supervisor }) {
  const [form, setForm] = useState({ date: formatDateInput(new Date()), peca: state.lists.pecas[0] || "", qtyOk: 0, qtyDesc: 0, concl: false, verniz: false, obs: "" });
  const [range, setRange] = useState({ from: startOfMonth(), to: endOfMonth() });
  const entries = state.pintura.filter(r => {
    const d = new Date(r.date);
    return d >= range.from && d <= range.to && (supervisor || r.user === currentUser.username);
  });

  const add = () => {
    const id = crypto.randomUUID();
    const rec = { id, date: form.date, peca: form.peca, qtyOk: Number(form.qtyOk||0), qtyDesc: Number(form.qtyDesc||0), concl: !!form.concl, verniz: !!form.verniz, obs: form.obs?.trim()||"", user: currentUser.username };
    setState(s => ({...s, pintura: [rec, ...s.pintura]}));
    addAudit({ action:'create', entity:'pintura', entityId:id, field:'*', from:null, to:JSON.stringify(rec) });
    setForm({ ...form, qtyOk: 0, qtyDesc: 0, obs: "" });
  };

  const updateField = (id, field, value) => {
    setState(s => {
      const idx = s.pintura.findIndex(x => x.id === id);
      if (idx === -1) return s;
      const old = s.pintura[idx];
      const updated = { ...old, [field]: value };
      const arr = [...s.pintura]; arr[idx] = updated;
      addAudit({ action:'update', entity:'pintura', entityId:id, field, from:String(old[field]), to:String(value) });
      return { ...s, pintura: arr };
    });
  };

  return (
    <div className="space-y-4">
      <SectionCard title="Novo lançamento — Pintura" right={<DateFilters range={range} setRange={setRange} />}>
        <div className="grid md:grid-cols-6 gap-3">
          <div>
            <label className="text-sm">Data</label>
            <input type="date" className="w-full border rounded-lg px-2 py-1" value={form.date} onChange={e=>setForm({...form, date:e.target.value})} />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm">Peça</label>
            <select className="w-full border rounded-lg px-2 py-2" value={form.peca} onChange={e=>setForm({...form, peca:e.target.value})}>
              {state.lists.pecas.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm">Qtde pintada</label>
            <input type="number" min="0" className="w-full border rounded-lg px-2 py-1" value={form.qtyOk} onChange={e=>setForm({...form, qtyOk:e.target.value})} />
          </div>
          <div>
            <label className="text-sm">Qtde descartada</label>
            <input type="number" min="0" className="w-full border rounded-lg px-2 py-1" value={form.qtyDesc} onChange={e=>setForm({...form, qtyDesc:e.target.value})} />
          </div>
          <div className="flex items-end gap-2">
            <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={form.concl} onChange={e=>setForm({...form, concl:e.target.checked})}/> Pintura concluída</label>
            <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={form.verniz} onChange={e=>setForm({...form, verniz:e.target.checked})}/> Recebeu verniz</label>
          </div>
          <div className="md:col-span-6">
            <label className="text-sm">Observação</label>
            <input className="w-full border rounded-lg px-2 py-2" placeholder="Anotações do dia" value={form.obs} onChange={e=>setForm({...form, obs:e.target.value})} />
          </div>
          <div className="md:col-span-6 flex justify-end">
            <button className="px-4 py-2 rounded-xl bg-emerald-600 text-white" onClick={add}>Salvar lançamento</button>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Registros" right={<span className="text-sm text-slate-500">{entries.length} itens</span>}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2">Data</th>
                <th>Peça</th>
                <th>OK</th>
                <th>Desc.</th>
                <th>Concl.</th>
                <th>Verniz</th>
                <th>Obs</th>
                <th>Usuário</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(r => (
                <tr key={r.id} className="border-b">
                  <td className="py-1"><input type="date" className="border rounded px-2 py-1" value={formatDateInput(new Date(r.date))} onChange={e=>updateField(r.id,'date', e.target.value)} /></td>
                  <td>
                    <select className="border rounded px-2 py-1" value={r.peca} onChange={e=>updateField(r.id,'peca', e.target.value)}>
                      {state.lists.pecas.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </td>
                  <td><input type="number" className="border rounded px-2 py-1 w-20" value={r.qtyOk} onChange={e=>updateField(r.id,'qtyOk', Number(e.target.value))} /></td>
                  <td><input type="number" className="border rounded px-2 py-1 w-20" value={r.qtyDesc} onChange={e=>updateField(r.id,'qtyDesc', Number(e.target.value))} /></td>
                  <td className="text-center"><input type="checkbox" checked={r.concl} onChange={e=>updateField(r.id,'concl', e.target.checked)} /></td>
                  <td className="text-center"><input type="checkbox" checked={r.verniz} onChange={e=>updateField(r.id,'verniz', e.target.checked)} /></td>
                  <td><input className="border rounded px-2 py-1 w-full" value={r.obs} onChange={e=>updateField(r.id,'obs', e.target.value)} /></td>
                  <td className="text-slate-500">{r.user}</td>
                </tr>
              ))}
              {entries.length === 0 && (
                <tr><td colSpan={8} className="py-6 text-center text-slate-500">Sem lançamentos no período.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}

// ----------- KITS -----------
function KitsScreen({ state, setState, addAudit, currentUser, supervisor }) {
  const [form, setForm] = useState({ date: formatDateInput(new Date()), kit: state.lists.kits[0] || "", qty: 0, obs: "" });
  const [range, setRange] = useState({ from: startOfMonth(), to: endOfMonth() });
  const entries = state.kits.filter(r => {
    const d = new Date(r.date);
    return d >= range.from && d <= range.to && (supervisor || r.user === currentUser.username);
  });

  const add = () => {
    const id = crypto.randomUUID();
    const rec = { id, date: form.date, kit: form.kit, qty: Number(form.qty||0), obs: form.obs?.trim()||"", user: currentUser.username };
    setState(s => ({...s, kits: [rec, ...s.kits]}));
    addAudit({ action:'create', entity:'kits', entityId:id, field:'*', from:null, to:JSON.stringify(rec) });
    setForm({ ...form, qty: 0, obs: "" });
  };
  const updateField = (id, field, value) => {
    setState(s => {
      const idx = s.kits.findIndex(x => x.id === id);
      if (idx === -1) return s;
      const old = s.kits[idx];
      const updated = { ...old, [field]: value };
      const arr = [...s.kits]; arr[idx] = updated;
      addAudit({ action:'update', entity:'kits', entityId:id, field, from:String(old[field]), to:String(value) });
      return { ...s, kits: arr };
    });
  };

  return (
    <div className="space-y-4">
      <SectionCard title="Novo lançamento — Kits" right={<DateFilters range={range} setRange={setRange} />}>
        <div className="grid md:grid-cols-5 gap-3">
          <div>
            <label className="text-sm">Data</label>
            <input type="date" className="w-full border rounded-lg px-2 py-1" value={form.date} onChange={e=>setForm({...form, date:e.target.value})} />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm">Kit</label>
            <select className="w-full border rounded-lg px-2 py-2" value={form.kit} onChange={e=>setForm({...form, kit:e.target.value})}>
              {state.lists.kits.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm">Quantidade</label>
            <input type="number" min="0" className="w-full border rounded-lg px-2 py-1" value={form.qty} onChange={e=>setForm({...form, qty:e.target.value})} />
          </div>
          <div className="md:col-span-5">
            <label className="text-sm">Observação</label>
            <input className="w-full border rounded-lg px-2 py-2" placeholder="Anotações do dia" value={form.obs} onChange={e=>setForm({...form, obs:e.target.value})} />
          </div>
          <div className="md:col-span-5 flex justify-end">
            <button className="px-4 py-2 rounded-xl bg-emerald-600 text-white" onClick={add}>Salvar lançamento</button>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Registros" right={<span className="text-sm text-slate-500">{entries.length} itens</span>}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2">Data</th>
                <th>Kit</th>
                <th>Qtde</th>
                <th>Obs</th>
                <th>Usuário</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(r => (
                <tr key={r.id} className="border-b">
                  <td className="py-1"><input type="date" className="border rounded px-2 py-1" value={formatDateInput(new Date(r.date))} onChange={e=>updateField(r.id,'date', e.target.value)} /></td>
                  <td>
                    <select className="border rounded px-2 py-1" value={r.kit} onChange={e=>updateField(r.id,'kit', e.target.value)}>
                      {state.lists.kits.map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                  </td>
                  <td><input type="number" className="border rounded px-2 py-1 w-24" value={r.qty} onChange={e=>updateField(r.id,'qty', Number(e.target.value))} /></td>
                  <td><input className="border rounded px-2 py-1 w-full" value={r.obs} onChange={e=>updateField(r.id,'obs', e.target.value)} /></td>
                  <td className="text-slate-500">{r.user}</td>
                </tr>
              ))}
              {entries.length === 0 && (
                <tr><td colSpan={5} className="py-6 text-center text-slate-500">Sem lançamentos no período.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}

// ----------- MATERIAIS -----------
function MateriaisScreen({ state, setState, addAudit, currentUser, canEditMin, supervisor }) {
  const items = state.lists.materiais;

  const toggleCompra = (nome, val) => {
    setState(s => {
      const prev = s.materiaisConfig[nome] || { minimo: 0, precisaComprar: false };
      const cfg = { ...s.materiaisConfig, [nome]: { ...prev, precisaComprar: val } };
      addAudit({ action:'update', entity:'materialFlag', entityId:nome, field:'precisaComprar', from:String(prev.precisaComprar), to:String(val) });
      return { ...s, materiaisConfig: cfg };
    });
  };
  const updateMin = (nome, minimo) => {
    setState(s => {
      const prev = s.materiaisConfig[nome] || { minimo: 0, precisaComprar: false };
      const cfg = { ...s.materiaisConfig, [nome]: { ...prev, minimo: Number(minimo||0) } };
      addAudit({ action:'update', entity:'materialMin', entityId:nome, field:'minimo', from:String(prev.minimo), to:String(minimo) });
      return { ...s, materiaisConfig: cfg };
    });
  };

  return (
    <SectionCard title="Materiais para reposição/compra">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2">Item</th>
              <th>Estoque mínimo</th>
              <th>Precisa comprar</th>
            </tr>
          </thead>
          <tbody>
            {items.map(nome => {
              const cfg = state.materiaisConfig[nome] || { minimo: 0, precisaComprar: false };
              return (
                <tr key={nome} className="border-b">
                  <td className="py-1 pr-2">{nome}</td>
                  <td className="py-1">
                    <input type="number" className="border rounded px-2 py-1 w-28" disabled={!canEditMin} value={cfg.minimo} onChange={e=>updateMin(nome, e.target.value)} />
                  </td>
                  <td className="py-1">
                    <label className="inline-flex items-center gap-2">
                      <input type="checkbox" checked={cfg.precisaComprar} onChange={e=>toggleCompra(nome, e.target.checked)} />
                      <span>{cfg.precisaComprar? 'Sim':'Não'}</span>
                    </label>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

// ----------- CONFIG LISTAS -----------
function ConfigModal({ state, setState, onClose, addAudit }) {
  const [local, setLocal] = useState(JSON.parse(JSON.stringify(state.lists)));
  const addItem = (field) => setLocal({ ...local, [field]: [...local[field], "Novo item"] });
  const updateItem = (field, idx, val) => setLocal({ ...local, [field]: local[field].map((x,i)=> i===idx? val: x) });
  const removeItem = (field, idx) => setLocal({ ...local, [field]: local[field].filter((_,i)=> i!==idx) });

  const save = () => {
    // gerar auditoria por mudanças
    const before = state.lists;
    ["materiais","kits","pecas"].forEach(field => {
      const b = before[field];
      const a = local[field];
      if (JSON.stringify(b) !== JSON.stringify(a)) {
        addAudit({ action:'update', entity:'lista', entityId:field, field, from:JSON.stringify(b), to:JSON.stringify(a) });
      }
    });
    setState(s => ensureMateriaisConfig({ ...s, lists: local }));
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[85vh] overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center">
          <h3 className="font-semibold">⚙️ Configurar Listas</h3>
          <button className="ml-auto px-3 py-1 rounded-lg bg-slate-200" onClick={onClose}>Fechar</button>
        </div>
        <div className="p-4 grid md:grid-cols-3 gap-4">
          <ListEditor title="Materiais" items={local.materiais} onAdd={()=>addItem('materiais')} onChange={(i,v)=>updateItem('materiais',i,v)} onRemove={(i)=>removeItem('materiais',i)} />
          <ListEditor title="Kits" items={local.kits} onAdd={()=>addItem('kits')} onChange={(i,v)=>updateItem('kits',i,v)} onRemove={(i)=>removeItem('kits',i)} />
          <ListEditor title="Peças (pintura)" items={local.pecas} onAdd={()=>addItem('pecas')} onChange={(i,v)=>updateItem('pecas',i,v)} onRemove={(i)=>removeItem('pecas',i)} />
        </div>
        <div className="p-4 border-t flex justify-end gap-2">
          <button className="px-4 py-2 rounded-xl bg-slate-200" onClick={onClose}>Cancelar</button>
          <button className="px-4 py-2 rounded-xl bg-emerald-600 text-white" onClick={save}>Salvar alterações</button>
        </div>
      </div>
    </div>
  );
}
function ListEditor({ title, items, onAdd, onChange, onRemove }) {
  return (
    <div>
      <div className="flex items-center mb-2">
        <h4 className="font-medium">{title}</h4>
        <button className="ml-auto px-2 py-1 rounded-lg bg-slate-100" onClick={onAdd}>+ Adicionar</button>
      </div>
      <div className="space-y-2 max-h-72 overflow-auto pr-1">
        {items.map((it, idx) => (
          <div key={idx} className="flex gap-2 items-center">
            <input className="flex-1 border rounded px-2 py-1" value={it} onChange={e=>onChange(idx, e.target.value)} />
            <button className="px-2 py-1 rounded-lg bg-rose-100 text-rose-700" onClick={()=>onRemove(idx)}>remover</button>
          </div>
        ))}
        {items.length === 0 && <div className="text-sm text-slate-500">Lista vazia</div>}
      </div>
    </div>
  );
}

// ----------- AUDITORIA -----------
function AuditModal({ audit, onClose }) {
  const rows = [...audit].reverse();
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[85vh] overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center">
          <h3 className="font-semibold">📜 Auditoria</h3>
          <button className="ml-auto px-3 py-1 rounded-lg bg-slate-200" onClick={onClose}>Fechar</button>
        </div>
        <div className="p-4 overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2">Quando</th>
                <th>Usuário</th>
                <th>Ação</th>
                <th>Entidade</th>
                <th>Campo</th>
                <th>De</th>
                <th>Para</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(a => (
                <tr key={a.id} className="border-b">
                  <td className="py-1">{new Date(a.ts).toLocaleString()}</td>
                  <td>{a.user}</td>
                  <td>{a.action}</td>
                  <td>{a.entity}#{a.entityId?.toString().slice(0,6)}</td>
                  <td>{a.field}</td>
                  <td className="max-w-[280px] truncate" title={a.from}>{a.from}</td>
                  <td className="max-w-[280px] truncate" title={a.to}>{a.to}</td>
                </tr>
              ))}
              {rows.length===0 && <tr><td colSpan={7} className="py-6 text-center text-slate-500">Sem registros ainda.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
