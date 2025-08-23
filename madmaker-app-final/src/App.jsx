import React, { useState } from "react";

// ======================================================
// Mad Maker — Controle de Produção & Estoque (v2.0)
// ======================================================

// ---------------------- LISTAS INICIAIS ----------------------
const BASE_MATERIAIS_REPOR = [
  "Caixa 16x11x3 (Pequena Baixa)","Caixa 16x11x6 (Pequena Media)","Caixa 16x11x8 (Pequena Alta)","Caixa 15x15x10 (Livros)",
  "Caixa 27x9x9 (Versalhes)","Caixa 30x10x10 (Madri)","Caixa 25x15x10 (2 Doah)","Caixa carimbo","Caixa Grande",
  "Fita Adesiva Grande","Fita Adesiva - suporte de mesa","Fita Anti-Ruido","Fita Dupla Face 3M",
  "Poste","Pessoas","Arvores","Cogumelos","Joaninhas","Abelhas","Case","Carros","Baterias"
];

const BASE_KITS_DIA = [
  "2x Poste (Montagem)","3x Poste (Montagem)","5x Poste (Montagem)","5x Poste (Caixa)","10x Poste (Caixa)",
  "5x Casas","5x Bancos","Kit Base (Montagem)","Kit Base (Caixa)","BC (Base +Casa)","BP (Base + Poço)","Kit 50","Kit 36",
  "Kit 30","Kit 25","Kit 22","Kit 21","Kit 17","Kit 17-B","Kit 13","Kit 11","Kit 9",
  "Temático - Lago dos Sonhos","Temático - Bosque Encantado","Temático - Galinheiro","Temático - Acampamento na Floresta",
  "Temático - Pic-Nick","Temático - Cidade","Temático - Acampamento no Lago dos Sonhos",
  "Temático - Pic-Nick no Lago dos Sonhos","Temático - Pic-Nick na Bosque Encantado",
  "Suporte - 3x Empurrando Preto","Suporte - 2x Capacete","Suporte - 2x Fone de Ouvido","Suporte - 2x Bolas",
  "Suporte - Banheiro","Suporte – Livro Lendo","Suporte – Livro Gato","Suporte – Livro HP",
  "Suporte – Livro Peq. Principe","Suporte - Karatê"
];

const BASE_PECAS_PINTADAS = [
  "sapo","pato","castores","dog","gato","tartarugas","galinhas","pintinhos","joaninhas","abelhas",
  "cisne","coelho","bancoo","ponte","casas","mesa redonda","mesa medieval","galinheiro",
  "lago","passarinhos","fogueira"
];

// ---------------------- ESTADO ----------------------
const todayISO = () => new Date().toISOString().slice(0, 10);
const initialStore = {
  pintura: [],
  kits: [],
  compras: BASE_MATERIAIS_REPOR.map(nome=>({nome,minimo:0,precisa:false})),
  catalogos: {kits:[...BASE_KITS_DIA], pecas:[...BASE_PECAS_PINTADAS]}
};

// ---------------------- UI ----------------------
const Container = ({ children }) => (
  <div className="mx-auto max-w-screen-2xl px-4 py-4 lg:px-6 lg:py-6">{children}</div>
);
const Card = ({ title, subtitle, children, right }) => (
  <section className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-sm ring-1 ring-stone-200 p-5 lg:p-6">
    <header className="flex items-start justify-between gap-4 mb-3">
      <div>
        <h3 className="text-base lg:text-lg font-semibold text-stone-800 tracking-tight">{title}</h3>
        {subtitle && <p className="text-sm text-stone-500 mt-0.5">{subtitle}</p>}
      </div>
      {right}
    </header>
    <div className="text-stone-800">{children}</div>
  </section>
);
const Button = ({ children, variant="solid", size="md", ...props }) => {
  const base="rounded-xl transition shadow-sm focus:outline-none focus:ring-2 focus:ring-stone-400/50 disabled:opacity-60";
  const sizes={sm:"px-3 py-1.5 text-sm", md:"px-3.5 py-2 text-sm", lg:"px-4 py-2.5 text-base"};
  const variants={solid:"bg-stone-900 text-white hover:bg-stone-800", soft:"bg-stone-100 text-stone-800 hover:bg-stone-200", outline:"border border-stone-300 text-stone-800 hover:bg-stone-50"};
  return <button className={`${base} ${sizes[size]} ${variants[variant]}`} {...props}>{children}</button>
};
const Pill = ({ children }) => (
  <span className="px-2.5 py-1 rounded-full text-xs bg-stone-100 text-stone-700 ring-1 ring-stone-200">{children}</span>
);

// ---------------------- ROLES ----------------------
const ROLES = { ADMIN:"admin", PINTURA:"pintura", KITS_ESTOQUE:"kits_estoque" };

// ---------------------- LOGIN ----------------------
function Login({ onLogin }) {
  return (
    <div className="h-screen w-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl ring-1 ring-stone-200 p-6 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900">Mad Maker</h1>
        <p className="text-stone-600 mt-1">Escolha como deseja entrar:</p>
        <div className="grid grid-cols-1 gap-3 mt-5">
          <Button onClick={()=>onLogin({role:ROLES.ADMIN,nome:"Carica"})}>Entrar como Supervisor</Button>
          <Button variant="soft" onClick={()=>onLogin({role:ROLES.KITS_ESTOQUE,nome:"Ana"})}>Entrar como Ana (Kits & Reposição)</Button>
          <Button variant="soft" onClick={()=>onLogin({role:ROLES.PINTURA,nome:"Vitória"})}>Entrar como Vitória (Pintura)</Button>
        </div>
        <p className="text-xs text-stone-500 mt-4">Wireframe • sem autenticação real.</p>
      </div>
    </div>
  );
}

// ---------------------- HEADER ----------------------
function Header({ title, right }) {
  return (
    <div className="h-16 border-b border-stone-200 flex items-center justify-between px-4 lg:px-6 bg-white/80 backdrop-blur">
      <div className="font-semibold tracking-tight text-stone-800">{title}</div>
      <div>{right}</div>
    </div>
  );
}

// ---------------------- STORE ----------------------
function useStore(){
  const [store,setStore]=useState(initialStore);
  return { store,
    addPintura:(reg)=>setStore(s=>({...s,pintura:[...s.pintura,reg]})),
    addKit:(reg)=>setStore(s=>({...s,kits:[...s.kits,reg]})),
    updateCompra:(idx,patch)=>setStore(s=>{const n=[...s.compras]; n[idx]={...n[idx],...patch}; return {...s,compras:n};}),
    addMaterial:(nome)=>setStore(s=>({...s,compras:[...s.compras,{nome,minimo:0,precisa:false}]})),
    renameMaterial:(idx,nome)=>setStore(s=>{const n=[...s.compras]; n[idx]={...n[idx],nome}; return {...s,compras:n};}),
    addPeca:(nome)=>setStore(s=>({...s,catalogos:{...s.catalogos,pecas:[...s.catalogos.pecas,nome]}})),
    renamePeca:(idx,nome)=>setStore(s=>{const n=[...s.catalogos.pecas]; n[idx]=nome; return {...s,catalogos:{...s.catalogos,pecas:n}};}),
    addKitCatalogo:(nome)=>setStore(s=>({...s,catalogos:{...s.catalogos,kits:[...s.catalogos.kits,nome]}})),
    renameKitCatalogo:(idx,nome)=>setStore(s=>{const n=[...s.catalogos.kits]; n[idx]=nome; return {...s,catalogos:{...s.catalogos,kits:n}};}),
  };
}

// ---------------------- TELAS FUNCIONÁRIAS ----------------------
function TelaPintura({storeApi,usuario,onLogout}){
  const {store}=storeApi;
  const [form,setForm]=useState({peca:store.catalogos.pecas[0]||"",qtd:0,descartada:0,verniz:false,concluida:false,obs:""});
  const salvar=()=>{storeApi.addPintura({data:todayISO(),...form}); alert("Pintura registrada!");};
  return (
    <div className="h-screen w-screen bg-stone-50 flex flex-col">
      <Header title={`Pintura • ${usuario}`} right={<Button variant="outline" onClick={onLogout}>Sair</Button>} />
      <main className="flex-1 overflow-auto">
        <Container>
          <Card title="Registrar pintura">
            <div className="flex flex-col gap-3">
              <select value={form.peca} onChange={e=>setForm({...form,peca:e.target.value})} className="border rounded px-2 py-1">
                {store.catalogos.pecas.map(p=><option key={p}>{p}</option>)}
              </select>
              <input type="number" placeholder="Quantidade pintada" value={form.qtd} onChange={e=>setForm({...form,qtd:Number(e.target.value)})} className="border rounded px-2 py-1"/>
              <input type="number" placeholder="Quantidade descartada" value={form.descartada} onChange={e=>setForm({...form,descartada:Number(e.target.value)})} className="border rounded px-2 py-1"/>
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.concluida} onChange={e=>setForm({...form,concluida:e.target.checked})}/> Pintura concluída</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.verniz} onChange={e=>setForm({...form,verniz:e.target.checked})}/> Recebeu verniz</label>
              <textarea placeholder="Observações" value={form.obs} onChange={e=>setForm({...form,obs:e.target.value})} className="border rounded px-2 py-1"/>
              <Button onClick={salvar}>Salvar</Button>
            </div>
          </Card>
        </Container>
      </main>
    </div>
  );
}

function TelaKitsReposicao({storeApi,usuario,onLogout}){
  const {store}=storeApi;
  const [formKit,setFormKit]=useState({kit:store.catalogos.kits[0]||"",qtd:0,obs:""});
  const salvarKit=()=>{storeApi.addKit({data:todayISO(),...formKit}); alert("Kit registrado!");};
  return (
    <div className="h-screen w-screen bg-stone-50 flex flex-col">
      <Header title={`Kits & Reposição • ${usuario}`} right={<Button variant="outline" onClick={onLogout}>Sair</Button>} />
      <main className="flex-1 overflow-auto">
        <Container>
          <Card title="Registrar kit montado">
            <div className="flex flex-col gap-3">
              <select value={formKit.kit} onChange={e=>setFormKit({...formKit,kit:e.target.value})} className="border rounded px-2 py-1">
                {store.catalogos.kits.map(k=><option key={k}>{k}</option>)}
              </select>
              <input type="number" placeholder="Quantidade" value={formKit.qtd} onChange={e=>setFormKit({...formKit,qtd:Number(e.target.value)})} className="border rounded px-2 py-1"/>
              <textarea placeholder="Observações" value={formKit.obs} onChange={e=>setFormKit({...formKit,obs:e.target.value})} className="border rounded px-2 py-1"/>
              <Button onClick={salvarKit}>Salvar</Button>
            </div>
          </Card>

          <Card title="Materiais para repor/comprar">
            <div className="flex flex-col gap-2">
              {store.compras.map((c,idx)=>(
                <label key={c.nome+idx} className="flex items-center gap-2">
                  <input type="checkbox" checked={c.precisa} onChange={e=>storeApi.updateCompra(idx,{precisa:e.target.checked})}/>
                  {c.nome} (mín: {c.minimo})
                </label>
              ))}
            </div>
          </Card>
        </Container>
      </main>
    </div>
  );
}

// ---------------------- SUPERVISOR ----------------------
function TelaAdmin({storeApi,onLogout}){
  const {store}=storeApi;
  const totalPinturaHoje=store.pintura.filter(r=>r.data===todayISO()).reduce((s,r)=>s+r.qtd,0);
  const totalKitsHoje=store.kits.filter(r=>r.data===todayISO()).reduce((s,r)=>s+r.qtd,0);
  const precisaComprar=store.compras.filter(c=>c.precisa).length;
  const last7=[...Array(7)].map((_,i)=>{
    const d=new Date(); d.setDate(d.getDate()-(6-i));
    const iso=d.toISOString().slice(0,10);
    const p=store.pintura.filter(r=>r.data===iso).reduce((s,r)=>s+r.qtd,0);
    const k=store.kits.filter(r=>r.data===iso).reduce((s,r)=>s+r.qtd,0);
    return {dia:iso.slice(5),Pintura:p,Kits:k};
  });
  return (
    <div className="h-screen w-screen bg-stone-50 text-stone-900 flex flex-col">
      <Header title="Mad Maker • Supervisor" right={<Button variant="outline" onClick={onLogout}>Sair</Button>} />
      <main className="flex-1 overflow-auto">
        <Container>
          {/* Cards de resumo */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 mb-4 lg:mb-6">
            <Card title="Produção de hoje" subtitle="Resumo (pintura + kits)" right={<Pill>{new Date().toLocaleDateString()}</Pill>}>
              <div className="text-3xl lg:text-4xl font-semibold tracking-tight">{totalPinturaHoje + totalKitsHoje} itens</div>
              <p className="text-sm text-stone-500 mt-2">Pintura: {totalPinturaHoje} • Kits: {totalKitsHoje}</p>
            </Card>
            <Card title="Pendências de compra" subtitle="Itens marcados">
              <div className="text-3xl lg:text-4xl font-semibold tracking-tight">{precisaComprar}</div>
              <p className="text-sm text-stone-500 mt-2">Materiais sinalizados como "Precisa Comprar".</p>
            </Card>
            <Card title="Exportações rápidas">
              <div className="flex flex-wrap gap-2 text-sm">
                <Button variant="outline">Pintura (CSV)</Button>
                <Button variant="outline">Kits (CSV)</Button>
                <Button variant="outline">Compras (CSV)</Button>
              </div>
              <p className="text-xs text-stone-500 mt-2">TODO: gerar e baixar CSV.</p>
            </Card>
          </div>

          {/* Histórico últimos 7 dias */}
          <Card title="Últimos 7 dias (visão rápida)">
            <div className="text-sm text-stone-700">
              {last7.map(d=>(
                <div key={d.dia} className="flex items-center gap-3 py-1">
                  <span className="w-16 tabular-nums">{d.dia}</span>
                  <span className="w-28">Pintura: <b>{d.Pintura}</b></span>
                  <span className="w-24">Kits: <b>{d.Kits}</b></span>
                  <div className="flex-1 h-2 bg-stone-100 rounded-lg overflow-hidden">
                    <div className="h-2 bg-stone-800" style={{width:`${Math.min(100,(d.Pintura+d.Kits)*5)}%`}}/>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-stone-500 mt-2">TODO: substituir por gráfico real (Recharts).</p>
          </Card>

          {/* Relatórios e edição de listas */}
          <Card title="Relatórios (wireframe)">
            <ul className="list-disc pl-6 text-sm leading-7 text-stone-700">
              <li>Produção por colaboradora (período)</li>
              <li>Top 10 Kits do mês</li>
              <li>Mapa de consumo vs. estoque mínimo (alertas)</li>
            </ul>
          </Card>

          <Card title="Catálogos — editar listas" subtitle="Somente Supervisor: adicionar/renomear opções que aparecem para Ana/Vitória">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <section>
                <h4 className="font-medium mb-2">Materiais</h4>
                {store.compras.map((c,idx)=>(
                  <div key={c.nome+idx} className="flex gap-2 items-center mb-2">
                    <input defaultValue={c.nome} onBlur={(e)=>storeApi.renameMaterial(idx,e.target.value)} className="border rounded px-2 py-1 text-sm flex-1"/>
                    <input type="number" value={c.minimo} onChange={(e)=>storeApi.updateCompra(idx,{minimo:Number(e.target.value)})} className="border rounded px-2 py-1 w-20"/>
                  </div>
                ))}
                <div className="flex gap-2 mt-2">
                  <input id="novo-mat" placeholder="Novo material" className="border rounded px-2 py-1 text-sm flex-1"/>
                  <Button size="sm" onClick={()=>{const el=document.getElementById('novo-mat'); if(el.value){storeApi.addMaterial(el.value); el.value='';}}}>Adicionar</Button>
                </div>
              </section>

              <section>
                <h4 className="font-medium mb-2">Peças</h4>
                {store.catalogos.pecas.map((p,idx)=>(
                  <div key={p+idx} className="flex gap-2 items-center mb-2">
                    <input defaultValue={p} onBlur={(e)=>storeApi.renamePeca(idx,e.target.value)} className="border rounded px-2 py-1 text-sm flex-1"/>
                  </div>
                ))}
                <div className="flex gap-2 mt-2">
                  <input id="novo-peca" placeholder="Nova peça" className="border rounded px-2 py-1 text-sm flex-1"/>
                  <Button size="sm" onClick={()=>{const el=document.getElementById('novo-peca'); if(el.value){storeApi.addPeca(el.value); el.value='';}}}>Adicionar</Button>
                </div>
              </section>

              <section>
                <h4 className="font-medium mb-2">Kits</h4>
                {store.catalogos.kits.map((k,idx)=>(
                  <div key={k+idx} className="flex gap-2 items-center mb-2">
                    <input defaultValue={k} onBlur={(e)=>storeApi.renameKitCatalogo(idx,e.target.value)} className="border rounded px-2 py-1 text-sm flex-1"/>
                  </div>
                ))}
                <div className="flex gap-2 mt-2">
                  <input id="novo-kit" placeholder="Novo kit" className="border rounded px-2 py-1 text-sm flex-1"/>
                  <Button size="sm" onClick={()=>{const el=document.getElementById('novo-kit'); if(el.value){storeApi.addKitCatalogo(el.value); el.value='';}}}>Adicionar</Button>
                </div>
              </section>
            </div>
          </Card>
        </Container>
      </main>
    </div>
  );
}

// ---------------------- APP ROOT ----------------------
export default function App(){
  const [user,setUser]=useState(null);
  const storeApi=useStore();
  if(!user) return <Login onLogin={setUser}/>;
  if(user.role===ROLES.PINTURA) return <TelaPintura storeApi={storeApi} usuario={user.nome} onLogout={()=>setUser(null)}/>;
  if(user.role===ROLES.KITS_ESTOQUE) return <TelaKitsReposicao storeApi={storeApi} usuario={user.nome} onLogout={()=>setUser(null)}/>;
  if(user.role===ROLES.ADMIN) return <TelaAdmin storeApi={storeApi} onLogout={()=>setUser(null)}/>;
  return null;
}
