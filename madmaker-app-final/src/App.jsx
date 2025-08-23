import React, { useState } from "react";

/* Mad Maker - Controle de Producao & Estoque (wireframe ASCII) */

/* LISTAS INICIAIS */
const BASE_MATERIAIS_REPOR = [
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
  "Poste",
  "Pessoas",
  "Arvores",
  "Cogumelos",
  "Joaninhas",
  "Abelhas",
  "Case",
  "Carros",
  "Baterias",
];

const BASE_KITS_DIA = [
  "2x Poste (Montagem)",
  "3x Poste (Montagem)",
  "5x Poste (Montagem)",
  "5x Poste (Caixa)",
  "10x Poste (Caixa)",
  "5x Casas",
  "5x Bancos",
  "Kit Base (Montagem)",
  "Kit Base (Caixa)",
  "BC (Base +Casa)",
  "BP (Base + Poco)",
  "Kit 50",
  "Kit 36",
  "Kit 30",
  "Kit 25",
  "Kit 22",
  "Kit 21",
  "Kit 17",
  "Kit 17-B",
  "Kit 13",
  "Kit 11",
  "Kit 9",
  "Tematico - Lago dos Sonhos",
  "Tematico - Bosque Encantado",
  "Tematico - Galinheiro",
  "Tematico - Acampamento na Floresta",
  "Tematico - Pic-Nick",
  "Tematico - Cidade",
  "Tematico - Acampamento no Lago dos Sonhos",
  "Tematico - Pic-Nick no Lago dos Sonhos",
  "Tematico - Pic-Nick na Bosque Encantado",
  "Suporte - 3x Empurrando Preto",
  "Suporte - 2x Capacete",
  "Suporte - 2x Fone de Ouvido",
  "Suporte - 2x Bolas",
  "Suporte - Banheiro",
  "Suporte - Livro Lendo",
  "Suporte - Livro Gato",
  "Suporte - Livro HP",
  "Suporte - Livro Peq. Principe",
  "Suporte - Karate",
];

const BASE_PECAS_PINTADAS = [
  "sapo","pato","castores","dog","gato","tartarugas","galinhas","pintinhos",
  "joaninhas","abelhas","cisne","coelho","bancoo","ponte","casas",
  "mesa redonda","mesa medieval","galinheiro","lago","passarinhos","fogueira"
];

/* ESTADO */
const todayISO = () => new Date().toISOString().slice(0, 10);

const initialStore = {
  pintura: [],
  kits: [],
  compras: BASE_MATERIAIS_REPOR.map((nome) => ({ nome, minimo: 0, precisa: false })),
  catalogos: { kits: [...BASE_KITS_DIA], pecas: [...BASE_PECAS_PINTADAS] },
};

/* UI */
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
const Button = ({ children, variant = "solid", size = "md", ...props }) => {
  const base =
    "rounded-xl transition shadow-sm focus:outline-none focus:ring-2 focus:ring-stone-400/50 disabled:opacity-60";
  const sizes = { sm: "px-3 py-1.5 text-sm", md: "px-3.5 py-2 text-sm", lg: "px-4 py-2.5 text-base" };
  const variants = {
    solid: "bg-stone-900 text-white hover:bg-stone-800",
    soft: "bg-stone-100 text-stone-800 hover:bg-stone-200",
    outline: "border border-stone-300 text-stone-800 hover:bg-stone-50",
  };
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]}`} {...props}>
      {children}
    </button>
  );
};
const Pill = ({ children }) => (
  <span className="px-2.5 py-1 rounded-full text-xs bg-stone-100 text-stone-700 ring-1 ring-stone-200">
    {children}
  </span>
);

/* ROLES */
const ROLES = { ADMIN: "admin", PINTURA: "pintura", KITS_ESTOQUE: "kits_estoque" };

/* LOGIN SIMPLES */
function Login({ onLogin }) {
  return (
    <div className="h-screen w-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl ring-1 ring-stone-200 p-6 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900">Mad Maker</h1>
        <p className="text-stone-600 mt-1">Escolha como deseja entrar:</p>
        <div className="grid grid-cols-1 gap-3 mt-5">
          <Button onClick={() => onLogin({ role: ROLES.ADMIN, nome: "Carica" })}>
            Entrar como Supervisor
          </Button>
          <Button variant="soft" onClick={() => onLogin({ role: ROLES.KITS_ESTOQUE, nome: "Ana" })}>
            Entrar como Ana (Kits & Reposicao)
          </Button>
          <Button variant="soft" onClick={() => onLogin({ role: ROLES.PINTURA, nome: "Vitoria" })}>
            Entrar como Vitoria (Pintura)
          </Button>
        </div>
        <p className="text-xs text-stone-500 mt-4">Wireframe - sem autenticacao real.</p>
      </div>
    </div>
  );
}

/* HEADER */
function Header({ title, right }) {
  return (
    <div className="h-16 border-b border-stone-200 flex items-center justify-between px-4 lg:px-6 bg-white/80 backdrop-blur">
      <div className="font-semibold tracking-tight text-stone-800">{title}</div>
      <div>{right}</div>
    </div>
  );
}

/* STORE EM MEMORIA */
function useStore() {
  const [store, setStore] = useState(initialStore);
  return {
    store,
    addPintura: (reg) => setStore((s) => ({ ...s, pintura: [...s.pintura, reg] })),
    addKit: (reg) => setStore((s) => ({ ...s, kits: [...s.kits, reg] })),
    updateCompra: (idx, patch) =>
      setStore((s) => {
        const n = [...s.compras];
        n[idx] = { ...n[idx], ...patch };
        return { ...s, compras: n };
      }),
  };
}

/* HELPERS */
function inPeriod(dateISO, mode) {
  const d = new Date(dateISO);
  const now = new Date();
  if (mode === "tudo") return true;
  if (mode === "dia") return d.toDateString() === now.toDateString();
  if (mode === "semana") {
    const diff = (now - d) / (1000 * 60 * 60 * 24);
    return diff <= 7 && now.getFullYear() === d.getFullYear();
  }
  if (mode === "mes") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  if (mode === "ano") return d.getFullYear() === now.getFullYear();
  return true;
}

/* TELAS */
function TelaPintura({ storeApi, usuario, onLogout }) {
  const { store, addPintura } = storeApi;
  const [data, setData] = useState(todayISO());
  const [peca, setPeca] = useState(store.catalogos.pecas[0] || "");
  const [qtd, setQtd] = useState("");
  const [descartada, setDescartada] = useState(0);
  const [concluida, setConcluida] = useState(false);
  const [verniz, setVerniz] = useState(false);
  const [obs, setObs] = useState("");
  const [periodo, setPeriodo] = useState("dia");

  const salvar = () => {
    if (!peca || !qtd) return alert("Selecione a peca e informe a quantidade.");
    addPintura({
      data,
      peca,
      qtd: Number(qtd),
      descartada: Number(descartada) || 0,
      concluida,
      verniz,
      obs,
      usuario,
    });
    setPeca(store.catalogos.pecas[0] || "");
    setQtd("");
    setDescartada(0);
    setConcluida(false);
    setVerniz(false);
    setObs("");
    alert("Registro salvo.");
  };

  const historico = store.pintura.filter((r) => r.usuario === usuario && inPeriod(r.data, periodo));

  return (
    <div className="h-screen w-screen bg-stone-50 text-stone-900 flex flex-col">
      <Header title={`Mad Maker - Pintura — ${usuario}`} right={<Button variant="outline" onClick={onLogout}>Sair</Button>} />
      <main className="flex-1 overflow-auto">
        <Container>
          <Card title="Novo registro de pintura" subtitle="Preencha e clique em Salvar">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <label className="flex flex-col gap-1.5">
                <span className="text-stone-600">Data</span>
                <input type="date" value={data} onChange={(e)=>setData(e.target.value)} className="border border-stone-300 rounded-xl px-3.5 py-2" />
              </label>

              <label className="flex flex-col gap-1.5 md:col-span-2">
                <span className="text-stone-600">Peca pintada</span>
                <select value={peca} onChange={(e)=>setPeca(e.target.value)} className="border border-stone-300 rounded-xl px-3.5 py-2 bg-white">
                  {store.catalogos.pecas.map((p) => (<option key={p} value={p}>{p}</option>))}
                </select>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-stone-600">Quantidade pintada</span>
                <input type="number" value={qtd} onChange={(e)=>setQtd(e.target.value)} className="border border-stone-300 rounded-xl px-3.5 py-2" placeholder="ex.: 15" />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-stone-600">Quantidade descartada</span>
                <input type="number" value={descartada} onChange={(e)=>setDescartada(e.target.value)} className="border border-stone-300 rounded-xl px-3.5 py-2" placeholder="ex.: 1" />
              </label>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={concluida} onChange={(e)=>setConcluida(e.target.checked)} />
                  Pintura concluida
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={verniz} onChange={(e)=>setVerniz(e.target.checked)} />
                  Recebeu verniz
                </label>
              </div>

              <label className="flex flex-col gap-1.5 md:col-span-3">
                <span className="text-stone-600">Observacao do dia</span>
                <textarea value={obs} onChange={(e)=>setObs(e.target.value)} className="border border-stone-300 rounded-xl px-3.5 py-2" rows={2} placeholder="Opcional" />
              </label>
            </div>

            <div className="mt-4 flex gap-2">
              <Button onClick={salvar}>Salvar</Button>
              <Button variant="outline" onClick={()=>{ setPeca(store.catalogos.pecas[0] || ""); setQtd(""); setDescartada(0); setConcluida(false); setVerniz(false); setObs(""); }}>
                Limpar
              </Button>
            </div>
          </Card>
        </Container>
      </main>
    </div>
  );
}

function TelaKitsReposicao({ storeApi, usuario, onLogout }) {
  const { store, addKit, updateCompra } = storeApi;

  const [dataK, setDataK] = useState(todayISO());
  const [kit, setKit] = useState(store.catalogos.kits[0] || "");
  const [qtdK, setQtdK] = useState("");
  const [obsK, setObsK] = useState("");
  const [periodoK, setPeriodoK] = useState("dia");
  const [filtroMat, setFiltroMat] = useState("");

  const salvarKit = () => {
    if (!kit || !qtdK) return alert("Selecione o kit e informe a quantidade.");
    addKit({ data: dataK, kit, qtd: Number(qtdK), obs: obsK, usuario });
    setKit(store.catalogos.kits[0] || "");
    setQtdK("");
    setObsK("");
    alert("Registro de kit salvo.");
  };

  const historicoK = store.kits.filter((r) => r.usuario === usuario && inPeriod(r.data, periodoK));

  return (
    <div className="h-screen w-screen bg-stone-50 text-stone-900 flex flex-col">
      <Header title={`Mad Maker - Kits & Reposicao — ${usuario}`} right={<Button variant="outline" onClick={onLogout}>Sair</Button>} />
      <main className="flex-1 overflow-auto">
        <Container>
          <Card title="Kits montados" subtitle="Selecione o kit, informe a quantidade e salve">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <label className="flex flex-col gap-1.5">
                <span className="text-stone-600">Data</span>
                <input type="date" value={dataK} onChange={(e)=>setDataK(e.target.value)} className="border border-stone-300 rounded-xl px-3.5 py-2" />
              </label>

              <label className="flex flex-col gap-1.5 md:col-span-2">
                <span className="text-stone-600">Kit</span>
                <select value={kit} onChange={(e)=>setKit(e.target.value)} className="border border-stone-300 rounded-xl px-3.5 py-2 bg-white">
                  {store.catalogos.kits.map((k) => (<option key={k} value={k}>{k}</option>))}
                </select>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-stone-600">Quantidade</span>
                <input type="number" value={qtdK} onChange={(e)=>setQtdK(e.target.value)} className="border border-stone-300 rounded-xl px-3.5 py-2" placeholder="ex.: 10" />
              </label>

              <label className="flex flex-col gap-1.5 md:col-span-2">
                <span className="text-stone-600">Observacao</span>
                <input value={obsK} onChange={(e)=>setObsK(e.target.value)} className="border border-stone-300 rounded-xl px-3.5 py-2" placeholder="Opcional" />
              </label>
            </div>

            <div className="mt-4 flex gap-2">
              <Button onClick={salvarKit}>Salvar</Button>
              <Button variant="outline" onClick={()=>{ setKit(store.catalogos.kits[0] || ""); setQtdK(""); setObsK(""); }}>
                Limpar
              </Button>
            </div>
          </Card>

          <Card title="Materiais para repor/comprar" subtitle="Defina minimo, marque 'Precisa Comprar' e desmarque quando comprar">
            <div className="mb-3 flex items-center gap-2">
              <input value={filtroMat} onChange={(e)=>setFiltroMat(e.target.value)} placeholder="Filtrar por nome..." className="border border-stone-300 rounded-xl px-3.5 py-2 text-sm w-full md:w-80" />
              <Pill>
                Total: {store.compras.filter((c)=>c.nome.toLowerCase().includes(filtroMat.toLowerCase())).length}
              </Pill>
            </div>

            <div className="overflow-auto rounded-xl ring-1 ring-stone-200">
              <table className="w-full text-sm">
                <thead className="bg-stone-50">
                  <tr className="text-left text-stone-500">
                    <th className="py-3 px-3">Item</th>
                    <th className="px-3">Minimo</th>
                    <th className="px-3">Precisa Comprar</th>
                  </tr>
                </thead>
                <tbody>
                  {store.compras.map((c, idx) =>
                    c.nome.toLowerCase().includes(filtroMat.toLowerCase()) && (
                      <tr key={c.nome} className={`border-t ${idx % 2 ? "bg-white" : "bg-stone-50/40"}`}>
                        <td className="py-3 px-3">{c.nome}</td>
                        <td className="px-3">
                          <input type="number" value={c.minimo}
                            onChange={(e)=>updateCompra(idx, { minimo: Number(e.target.value) })}
                            className="border border-stone-300 rounded-lg px-2 py-1 w-24" />
                        </td>
                        <td className="px-3">
                          <input type="checkbox" checked={c.precisa}
                            onChange={(e)=>updateCompra(idx, { precisa: e.target.checked })} />
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </Container>
      </main>
    </div>
  );
}

/* SUPERVISOR (dashboard leve) */
function TelaAdmin({ storeApi, onLogout }) {
  const { store } = storeApi;

  const totalPinturaHoje = store.pintura.filter((r)=>r.data===todayISO()).reduce((s,r)=>s+r.qtd,0);
  const totalKitsHoje = store.kits.filter((r)=>r.data===todayISO()).reduce((s,r)=>s+r.qtd,0);
  const precisaComprar = store.compras.filter((c
