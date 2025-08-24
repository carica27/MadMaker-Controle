import React, { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

/**
 * MAD MAKER – CONTROLE DE PRODUÇÃO & ESTOQUE (PREVIEW)
 * ----------------------------------------------------
 * - Login com seleção de usuário + senha
 * - Perfis: Supervisor (Fabiano), Pintura (Vitória), Kits+Materiais (Ana)
 * - Telas: Pintura, Kits Montados, Materiais p/ Repor, Painel (Supervisor)
 * - Filtros (dia/semana/mês/intervalo), edição com trilha de auditoria
 * - Persistência local (localStorage) – sem backend neste preview
 * - Tema simples via CSS variables
 * - NOVO: Exportação Excel (XLSX) e Relatórios PDF (jsPDF + autotable)
 */

/*********************** UTIL ************************/ 
const LS_KEY = "madmaker_app_v1";
const todayISO = () => new Date().toISOString().slice(0, 10);
const uid = () => Math.random().toString(36).slice(2, 9);

const inRange = (dateISO, startISO, endISO) => {
  if (!startISO && !endISO) return true;
  const d = new Date(dateISO);
  const s = startISO ? new Date(startISO) : null;
  const e = endISO ? new Date(endISO) : null;
  if (s && d < s) return false;
  if (e && d > e) return false;
  return true;
};

// Excel (XLSX)
function exportExcel(jsonRows, filename) {
  const ws = XLSX.utils.json_to_sheet(jsonRows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Relatorio");
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

// PDF (jsPDF + autotable)
function exportPDF({ title, subtitle = "", columns, rows, filename }) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  doc.setFontSize(14);
  doc.text(title, 40, 40);
  if (subtitle) {
    doc.setFontSize(10);
    doc.text(subtitle, 40, 58);
  }
  doc.autoTable({
    startY: subtitle ? 72 : 56,
    head: [columns],
    body: rows,
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: [247, 247, 248], textColor: 20 },
    theme: "grid",
  });
  doc.save(`${filename}.pdf`);
}

/*********************** DADOS BASE *******************/
const USERS = [
  { id: "fabiano", nome: "Fabiano (Supervisor)", senha: "fabiano01", role: "SUP" },
  { id: "vitoria", nome: "Vitória (Pintura)", senha: "madvit27", role: "PINT" },
  { id: "ana", nome: "Ana (Kits+Materiais)", senha: "madana01", role: "KITMAT" },
];

const LISTA_MATERIAIS = [
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

const LISTA_KITS = [
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
  "BP (Base + Poço)",
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
  "Temático - Lago dos Sonhos",
  "Temático - Bosque Encantado",
  "Temático - Galinheiro",
  "Temático - Acampamento na Floresta",
  "Temático - Pic-Nick",
  "Temático - Cidade",
  "Temático - Acampamento no Lago dos Sonhos",
  "Temático - Pic-Nick no Lago dos Sonhos",
  "Temático - Pic-Nick na Bosque Encantado",
  "Suporte - 3x Empurrando Preto",
  "Suporte - 2x Capacete",
  "Suporte - 2x Fone de Ouvido",
  "Suporte - 2x Bolas",
  "Suporte - Banheiro",
  "Suporte – Livro Lendo",
  "Suporte – Livro Gato",
  "Suporte – Livro HP",
  "Suporte – Livro Peq. Principe",
  "Suporte - Karatê",
];

const LISTA_PECAS_PINTURA = [
  "sapo",
  "pato",
  "castores",
  "dog",
  "gato",
  "tartarugas",
  "galinhas",
  "pintinhos",
  "joaninhas",
  "abelhas",
  "cisne",
  "coelho",
  "bancoo",
  "ponte",
  "casas",
  "mesa redonda",
  "mesa medieval",
  "galinheiro",
  "lago",
  "passarinhos",
  "fogueira",
];

/*********************** ESTADO INICIAL **************/
const defaultState = {
  theme: {
    accent: "#00a884",
    accentHover: "#008e73",
    bg: "#f7f7f8",
    card: "#ffffff",
    text: "#0f172a",
    muted: "#64748b",
  },
  listas: {
    materiais: LISTA_MATERIAIS,
    kits: LISTA_KITS,
    pecas: LISTA_PECAS_PINTURA,
  },
  materiaisConfig: LISTA_MATERIAIS.reduce((acc, nome) => {
    acc[nome] = { min: 0, precisaComprar: false };
    return acc;
  }, {}),
  registros: {
    pintura: [], // {id, data, peca, qtd, descartado, concluida, verniz, obs, userId}
    kits: [], // {id, data, kit, qtd, obs, userId}
  },
  auditoria: [], // {id, ts, userId, tela, registroId, campo, antes, depois}
};

function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw);
    return { ...defaultState, ...parsed };
  } catch {
    return defaultState;
  }
}

function saveState(state) {
  localStorage.setItem(LS_KEY, JSON.stringify(state));
}

/*********************** COMPONENTES BASE *************/
const Shell = ({ children }) => (
  <div className="min-h-screen" style={{ background: "var(--bg)" }}>
    <div className="max-w-7xl mx-auto px-4 py-6">{children}</div>
  </div>
);

const Card = ({ title, extra, children }) => (
  <div className="rounded-2xl shadow-sm border border-gray-200" style={{ background: "var(--card)" }}>
    <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
      <h2 className="text-lg font-semibold" style={{ color: "var(--text)" }}>{title}</h2>
      {extra}
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const Button = ({ children, onClick, variant = "solid", className = "", ...rest }) => {
  const base =
    "rounded-xl px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2";
  const solid = {
    background: "var(--accent)",
    color: "white",
    border: "1px solid transparent",
  };
  const ghost = { background: "transparent", color: "var(--text)", border: "1px solid #e5e7eb" };
  const styles = variant === "solid" ? solid : ghost;
  return (
    <button
      onClick={onClick}
      className={`${base} ${className}`}
      style={styles}
      onMouseEnter={(e) => {
        if (variant === "solid") e.currentTarget.style.background = "var(--accent-hover)";
      }}
      onMouseLeave={(e) => {
        if (variant === "solid") e.currentTarget.style.background = "var(--accent)";
      }}
      {...rest}
    >
      {children}
    </button>
  );
};

const Input = (props) => (
  <input
    {...props}
    className={`w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--accent)] outline-none ${
      props.className || ""
    }`}
  />
);

const Select = ({ options, value, onChange }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--accent)] outline-none"
  >
    <option value="">— selecione —</option>
    {options.map((o) => (
      <option key={o} value={o}>
        {o}
      </option>
    ))}
  </select>
);

const Pill = ({ children }) => (
  <span className="inline-block rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600">
    {children}
  </span>
);

/*********************** LOGIN ************************/
function Login({ onLogin, theme, setTheme }) {
  const [userId, setUserId] = useState(USERS[0].id);
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");

  const tryLogin = () => {
    const user = USERS.find((u) => u.id === userId);
    if (user && user.senha === senha) {
      onLogin(user);
    } else {
      setError("Senha incorreta. Tente novamente.");
    }
  };

  return (
    <Shell>
      <div className="max-w-md mx-auto">
        <Card title="Mad Maker — Login" extra={<Pill>Preview</Pill>}>
          <div className="space-y-3">
            <label className="text-sm text-gray-600">Usuário</label>
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--accent)] outline-none"
            >
              {USERS.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nome}
                </option>
              ))}
            </select>
            <label className="text-sm text-gray-600">Senha</label>
            <Input type="password" placeholder="••••••••" value={senha} onChange={(e) => setSenha(e.target.value)} />
            {error && <div className="text-red-600 text-sm">{error}</div>}
            <div className="flex items-center gap-2 pt-2">
              <Button onClick={tryLogin}>Entrar</Button>
              <Button variant="ghost" onClick={() => { setSenha(""); setError(""); }}>Limpar</Button>
            </div>
          </div>
        </Card>

        <div className="h-6" />

        <Card title="Ajuste rápido de tema" extra={<Pill>Opcional</Pill>}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(theme).map(([k, v]) => (
              <div key={k}>
                <label className="text-sm text-gray-600">{k}</label>
                <Input
                  value={v}
                  onChange={(e) => setTheme({ ...theme, [k]: e.target.value })}
                />
              </div>
            ))}
          </div>
          <div className="pt-3 text-xs text-gray-500">Dica: use os hex do seu site para casar o visual.</div>
        </Card>
      </div>
    </Shell>
  );
}

/*********************** FILTROS **********************/
function useFiltro(registros, { start, end }) {
  return useMemo(() => {
    return registros.filter((r) => inRange(r.data, start, end));
  }, [registros, start, end]);
}

function QuickFilters({ setRange }) {
  const setPeriodo = (dias) => {
    const end = todayISO();
    const d = new Date();
    d.setDate(d.getDate() - (dias - 1));
    const start = d.toISOString().slice(0, 10);
    setRange({ start, end });
  };
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="ghost" onClick={() => setPeriodo(1)}>Hoje</Button>
      <Button variant="ghost" onClick={() => setPeriodo(7)}>7 dias</Button>
      <Button variant="ghost" onClick={() => setPeriodo(30)}>30 dias</Button>
    </div>
  );
}

/*********************** TELA: PINTURA ****************/
function TelaPintura({ state, setState, user }) {
  const [form, setForm] = useState({ data: todayISO(), peca: "", qtd: 0, descartado: 0, concluida: false, verniz: false, obs: "" });
  const [range, setRange] = useState({ start: todayISO(), end: todayISO() });

  const registrosUser = state.registros.pintura.filter((r) => user.role === "SUP" ? true : r.userId === user.id);
  const filtrados = useFiltro(registrosUser, range);

  const salvar = () => {
    if (!form.peca || form.qtd <= 0) return alert("Selecione a peça e uma quantidade > 0.");
    const novo = { id: uid(), ...form, qtd: Number(form.qtd), descartado: Number(form.descartado), userId: user.id };
    const next = { ...state, registros: { ...state.registros, pintura: [novo, ...state.registros.pintura] } };
    setState(next);
    saveState(next);
    setForm({ data: todayISO(), peca: "", qtd: 0, descartado: 0, concluida: false, verniz: false, obs: "" });
  };

  const editarCampo = (id, campo, valor) => {
    const idx = state.registros.pintura.findIndex((r) => r.id === id);
    if (idx === -1) return;
    const atual = state.registros.pintura[idx];
    const atualizado = { ...atual, [campo]: valor };
    const copia = [...state.registros.pintura];
    copia[idx] = atualizado;
    const aud = {
      id: uid(), ts: new Date().toISOString(), userId: user.id, tela: "PINTURA", registroId: id,
      campo, antes: String(atual[campo]), depois: String(valor)
    };
    const next = { ...state, registros: { ...state.registros, pintura: copia }, auditoria: [aud, ...state.auditoria] };
    setState(next);
    saveState(next);
  };

  const totalQtd = filtrados.reduce((s, r) => s + Number(r.qtd || 0), 0);
  const totalDesc = filtrados.reduce((s, r) => s + Number(r.descartado || 0), 0);

  // Exportações
  const exportarExcelPintura = () => {
    const data = filtrados.map(r => ({
      Data: r.data,
      Peça: r.peca,
      Quantidade: r.qtd,
      Descartado: r.descartado,
      "Pintura concluída": r.concluida ? "Sim" : "Não",
      "Recebeu verniz": r.verniz ? "Sim" : "Não",
      Observação: r.obs || "",
      Usuário: r.userId,
    }));
    exportExcel(data, `Pintura_${range.start || 'inicio'}_${range.end || 'fim'}`);
  };

  const exportarPDFPintura = () => {
    const cols = ["Data","Peça","Qtd","Desc.","Concluída","Verniz","Obs"];
    const rows = filtrados.map(r => [r.data, r.peca, r.qtd, r.descartado, r.concluida?"Sim":"Não", r.verniz?"Sim":"Não", r.obs || ""]);
    rows.push(["","Totais", totalQtd, totalDesc, "","",""]);
    exportPDF({
      title: "Relatório de Pintura",
      subtitle: `Período: ${range.start || '-'} a ${range.end || '-'}`,
      columns: cols,
      rows,
      filename: `Pintura_${range.start || 'inicio'}_${range.end || 'fim'}`,
    });
  };

  return (
    <div className="space-y-4">
      <Card title="Lançar Pintura" extra={<Pill>{user.nome}</Pill>}>
        <div className="grid md:grid-cols-6 gap-3">
          <div className="md:col-span-2">
            <label className="text-sm text-gray-600">Data</label>
            <Input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm text-gray-600">Peça</label>
            <Select options={state.listas.pecas} value={form.peca} onChange={(v) => setForm({ ...form, peca: v })} />
          </div>
          <div>
            <label className="text-sm text-gray-600">Qtd pintada</label>
            <Input type="number" value={form.qtd} onChange={(e) => setForm({ ...form, qtd: e.target.value })} />
          </div>
          <div>
            <label className="text-sm text-gray-600">Descartada</label>
            <Input type="number" value={form.descartado} onChange={(e) => setForm({ ...form, descartado: e.target.value })} />
          </div>
          <div className="md:col-span-2 flex items-center gap-4">
            <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={form.concluida} onChange={(e) => setForm({ ...form, concluida: e.target.checked })} /> Pintura concluída</label>
            <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={form.verniz} onChange={(e) => setForm({ ...form, verniz: e.target.checked })} /> Recebeu verniz</label>
          </div>
          <div className="md:col-span-4">
            <label className="text-sm text-gray-600">Observação</label>
            <Input value={form.obs} onChange={(e) => setForm({ ...form, obs: e.target.value })} placeholder="Opcional" />
          </div>
        </div>
        <div className="pt-4">
          <Button onClick={salvar}>Salvar lançamento</Button>
        </div>
      </Card>

      <Card title="Registros & Filtros">
        <div className="flex flex-wrap items-end gap-3 pb-3">
          <div>
            <label className="text-sm text-gray-600">Início</label>
            <Input type="date" value={range.start || ""} onChange={(e) => setRange((r) => ({ ...r, start: e.target.value }))} />
          </div>
          <div>
            <label className="text-sm text-gray-600">Fim</label>
            <Input type="date" value={range.end || ""} onChange={(e) => setRange((r) => ({ ...r, end: e.target.value }))} />
          </div>
          <QuickFilters setRange={setRange} />
          <div className="ml-auto flex flex-wrap items-center gap-2 text-sm">
            <Pill>Total pintado: {totalQtd}</Pill>
            <Pill>Descartado: {totalDesc}</Pill>
            <Button variant="ghost" onClick={exportarExcelPintura}>Exportar Excel</Button>
            <Button onClick={exportarPDFPintura}>Relatório PDF</Button>
          </div>
        </div>

        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600">
                <th className="py-2 pr-4">Data</th>
                <th className="py-2 pr-4">Peça</th>
                <th className="py-2 pr-4">Qtd</th>
                <th className="py-2 pr-4">Desc.</th>
                <th className="py-2 pr-4">Concluída</th>
                <th className="py-2 pr-4">Verniz</th>
                <th className="py-2 pr-4">Obs</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((r) => (
                <tr key={r.id} className="border-t border-gray-100">
                  <td className="py-2 pr-4"><Input type="date" value={r.data} onChange={(e) => editarCampo(r.id, "data", e.target.value)} /></td>
                  <td className="py-2 pr-4">
                    <select
                      value={r.peca}
                      onChange={(e) => editarCampo(r.id, "peca", e.target.value)}
                      className="rounded-lg border border-gray-300 px-2 py-1"
                    >
                      {state.listas.pecas.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </td>
                  <td className="py-2 pr-4"><Input type="number" value={r.qtd} onChange={(e) => editarCampo(r.id, "qtd", Number(e.target.value))} /></td>
                  <td className="py-2 pr-4"><Input type="number" value={r.descartado} onChange={(e) => editarCampo(r.id, "descartado", Number(e.target.value))} /></td>
                  <td className="py-2 pr-4"><input type="checkbox" checked={r.concluida} onChange={(e) => editarCampo(r.id, "concluida", e.target.checked)} /></td>
                  <td className="py-2 pr-4"><input type="checkbox" checked={r.verniz} onChange={(e) => editarCampo(r.id, "verniz", e.target.checked)} /></td>
                  <td className="py-2 pr-4"><Input value={r.obs} onChange={(e) => editarCampo(r.id, "obs", e.target.value)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/*********************** TELA: KITS *******************/
function TelaKits({ state, setState, user }) {
  const [form, setForm] = useState({ data: todayISO(), kit: "", qtd: 0, obs: "" });
  const [range, setRange] = useState({ start: todayISO(), end: todayISO() });

  const registrosUser = state.registros.kits.filter((r) => user.role === "SUP" ? true : r.userId === user.id);
  const filtrados = useFiltro(registrosUser, range);

  const salvar = () => {
    if (!form.kit || form.qtd <= 0) return alert("Selecione o kit e uma quantidade > 0.");
    const novo = { id: uid(), ...form, qtd: Number(form.qtd), userId: user.id };
    const next = { ...state, registros: { ...state.registros, kits: [novo, ...state.registros.kits] } };
    setState(next);
    saveState(next);
    setForm({ data: todayISO(), kit: "", qtd: 0, obs: "" });
  };

  const editarCampo = (id, campo, valor) => {
    const idx = state.registros.kits.findIndex((r) => r.id === id);
    if (idx === -1) return;
    const atual = state.registros.kits[idx];
    const atualizado = { ...atual, [campo]: valor };
    const copia = [...state.registros.kits];
    copia[idx] = atualizado;
    const aud = {
      id: uid(), ts: new Date().toISOString(), userId: user.id, tela: "KITS", registroId: id,
      campo, antes: String(atual[campo]), depois: String(valor)
    };
    const next = { ...state, registros: { ...state.registros, kits: copia }, auditoria: [aud, ...state.auditoria] };
    setState(next);
    saveState(next);
  };

  const totalQtd = filtrados.reduce((s, r) => s + Number(r.qtd || 0), 0);

  // Exportações
  const exportarExcelKits = () => {
    const data = filtrados.map(r => ({
      Data: r.data,
      Kit: r.kit,
      Quantidade: r.qtd,
      Observação: r.obs || "",
      Usuário: r.userId,
    }));
    exportExcel(data, `Kits_${range.start || 'inicio'}_${range.end || 'fim'}`);
  };
  const exportarPDFKits = () => {
    const cols = ["Data","Kit","Qtd","Obs"];
    const rows = filtrados.map(r => [r.data, r.kit, r.qtd, r.obs || ""]);
    rows.push(["","Total", totalQtd, ""]);
    exportPDF({
      title: "Relatório de Kits Montados",
      subtitle: `Período: ${range.start || '-'} a ${range.end || '-'}`,
      columns: cols,
      rows,
      filename: `Kits_${range.start || 'inicio'}_${range.end || 'fim'}`,
    });
  };

  return (
    <div className="space-y-4">
      <Card title="Lançar Kits Montados" extra={<Pill>{user.nome}</Pill>}>
        <div className="grid md:grid-cols-6 gap-3">
          <div className="md:col-span-2">
            <label className="text-sm text-gray-600">Data</label>
            <Input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} />
          </div>
          <div className="md:col-span-3">
            <label className="text-sm text-gray-600">Kit</label>
            <Select options={state.listas.kits} value={form.kit} onChange={(v) => setForm({ ...form, kit: v })} />
          </div>
          <div>
            <label className="text-sm text-gray-600">Quantidade</label>
            <Input type="number" value={form.qtd} onChange={(e) => setForm({ ...form, qtd: e.target.value })} />
          </div>
          <div className="md:col-span-6">
            <label className="text-sm text-gray-600">Observação</label>
            <Input value={form.obs} onChange={(e) => setForm({ ...form, obs: e.target.value })} placeholder="Opcional" />
          </div>
        </div>
        <div className="pt-4">
          <Button onClick={salvar}>Salvar lançamento</Button>
        </div>
      </Card>

      <Card title="Registros & Filtros">
        <div className="flex flex-wrap items-end gap-3 pb-3">
          <div>
            <label className="text-sm text-gray-600">Início</label>
            <Input type="date" value={range.start || ""} onChange={(e) => setRange((r) => ({ ...r, start: e.target.value }))} />
          </div>
          <div>
            <label className="text-sm text-gray-600">Fim</label>
            <Input type="date" value={range.end || ""} onChange={(e) => setRange((r) => ({ ...r, end: e.target.value }))} />
          </div>
          <QuickFilters setRange={setRange} />
          <div className="ml-auto flex flex-wrap items-center gap-2 text-sm">
            <Pill>Total kits: {totalQtd}</Pill>
            <Button variant="ghost" onClick={exportarExcelKits}>Exportar Excel</Button>
            <Button onClick={exportarPDFKits}>Relatório PDF</Button>
          </div>
        </div>

        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600">
                <th className="py-2 pr-4">Data</th>
                <th className="py-2 pr-4">Kit</th>
                <th className="py-2 pr-4">Qtd</th>
                <th className="py-2 pr-4">Obs</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((r) => (
                <tr key={r.id} className="border-t border-gray-100">
                  <td className="py-2 pr-4"><Input type="date" value={r.data} onChange={(e) => editarCampo(r.id, "data", e.target.value)} /></td>
                  <td className="py-2 pr-4">
                    <select
                      value={r.kit}
                      onChange={(e) => editarCampo(r.id, "kit", e.target.value)}
                      className="rounded-lg border border-gray-300 px-2 py-1"
                    >
                      {state.listas.kits.map((k) => <option key={k} value={k}>{k}</option>)}
                    </select>
                  </td>
                  <td className="py-2 pr-4"><Input type="number" value={r.qtd} onChange={(e) => editarCampo(r.id, "qtd", Number(e.target.value))} /></td>
                  <td className="py-2 pr-4"><Input value={r.obs} onChange={(e) => editarCampo(r.id, "obs", e.target.value)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/*********************** TELA: MATERIAIS *************/
function TelaMateriais({ state, setState, user }) {
  const cfg = state.materiaisConfig;
  const nomes = Object.keys(cfg);

  const setItem = (nome, patch) => {
    const atual = cfg[nome];
    const novo = { ...atual, ...patch };
    const next = { ...state, materiaisConfig: { ...cfg, [nome]: novo } };
    setState(next);
    saveState(next);
  };

  return (
    <Card title="Materiais para Reposição/Compra" extra={<Pill>{user.nome}</Pill>}>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {nomes.map((nome) => (
          <div key={nome} className="border border-gray-200 rounded-xl p-3">
            <div className="font-medium text-sm mb-2" style={{ color: "var(--text)" }}>{nome}</div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-600">Estoque mínimo</label>
              <Input type="number" value={cfg[nome].min} onChange={(e) => setItem(nome, { min: Number(e.target.value) })} style={{ width: 110 }} />
            </div>
            <div className="pt-2">
              <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={cfg[nome].precisaComprar} onChange={(e) => setItem(nome, { precisaComprar: e.target.checked })} /> Precisa comprar</label>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/*********************** TELA: PAINEL (SUPERVISOR) ***/
function sumBy(array, key, pred = () => true) {
  return array.filter(pred).reduce((s, r) => s + Number(r[key] || 0), 0);
}

function lastNDaysISO(n) {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - (n - 1));
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

function PainelSupervisor({ state }) {
  const { start, end } = lastNDaysISO(7);
  const porUser = USERS.map((u) => {
    const pin = state.registros.pintura.filter((r) => r.userId === u.id && inRange(r.data, start, end));
    const kits = state.registros.kits.filter((r) => r.userId === u.id && inRange(r.data, start, end));
    return {
      user: u.nome,
      pintura: sumBy(pin, "qtd"),
      descartado: sumBy(pin, "descartado"),
      kits: sumBy(kits, "qtd"),
    };
  });

  const exportarExcelRendimento = () => {
    const data = porUser.map(r => ({ Funcionária: r.user, "Pintura (Qtd)": r.pintura, Descartado: r.descartado, "Kits montados": r.kits }));
    exportExcel(data, `Rendimento_7dias_${start}_a_${end}`);
  };
  const exportarPDFRendimento = () => {
    const cols = ["Funcionária","Pintura (Qtd)","Descartado","Kits montados"];
    const rows = porUser.map(r => [r.user, r.pintura, r.descartado, r.kits]);
    exportPDF({ title: "Rendimento por Funcionária — Últimos 7 dias", subtitle: `Período: ${start} a ${end}`, columns: cols, rows, filename: `Rendimento_7dias_${start}_a_${end}` });
  };

  const exportarExcelAuditoria = () => {
    const data = state.auditoria.map(a => ({
      Quando: new Date(a.ts).toLocaleString(),
      Usuário: USERS.find(u=>u.id===a.userId)?.nome || a.userId,
      Tela: a.tela,
      Registro: a.registroId,
      Campo: a.campo,
      Antes: a.antes,
      Depois: a.depois,
    }));
    exportExcel(data, `Auditoria`);
  };
  const exportarPDFAuditoria = () => {
    const cols = ["Quando","Usuário","Tela","Registro","Campo","Antes","Depois"];
    const rows = state.auditoria.map(a => [new Date(a.ts).toLocaleString(), USERS.find(u=>u.id===a.userId)?.nome || a.userId, a.tela, a.registroId, a.campo, a.antes, a.depois]);
    exportPDF({ title: "Auditoria de alterações", columns: cols, rows, filename: "Auditoria" });
  };

  return (
    <div className="space-y-4">
      <Card title="Rendimento por funcionária (últimos 7 dias)">
        <div className="flex items-center justify-end pb-3 gap-2">
          <Button variant="ghost" onClick={exportarExcelRendimento}>Exportar Excel</Button>
          <Button onClick={exportarPDFRendimento}>Relatório PDF</Button>
        </div>
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600">
                <th className="py-2 pr-4">Funcionária</th>
                <th className="py-2 pr-4">Pintura (Qtd)</th>
                <th className="py-2 pr-4">Descartado</th>
                <th className="py-2 pr-4">Kits montados</th>
              </tr>
            </thead>
            <tbody>
              {porUser.map((r) => (
                <tr key={r.user} className="border-t border-gray-100">
                  <td className="py-2 pr-4">{r.user}</td>
                  <td className="py-2 pr-4">{r.pintura}</td>
                  <td className="py-2 pr-4">{r.descartado}</td>
                  <td className="py-2 pr-4">{r.kits}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Auditoria de alterações (mais recentes)">
        <div className="flex items-center justify-end pb-3 gap-2">
          <Button variant="ghost" onClick={exportarExcelAuditoria}>Exportar Excel</Button>
          <Button onClick={exportarPDFAuditoria}>Relatório PDF</Button>
        </div>
        <div className="overflow-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="text-left text-gray-600">
                <th className="py-2 pr-4">Quando</th>
                <th className="py-2 pr-4">Usuário</th>
                <th className="py-2 pr-4">Tela</th>
                <th className="py-2 pr-4">Registro</th>
                <th className="py-2 pr-4">Campo</th>
                <th className="py-2 pr-4">Antes</th>
                <th className="py-2 pr-4">Depois</th>
              </tr>
            </thead>
            <tbody>
              {state.auditoria.map((a) => (
                <tr key={a.id} className="border-t border-gray-100">
                  <td className="py-2 pr-4">{new Date(a.ts).toLocaleString()}</td>
                  <td className="py-2 pr-4">{USERS.find((u) => u.id === a.userId)?.nome || a.userId}</td>
                  <td className="py-2 pr-4">{a.tela}</td>
                  <td className="py-2 pr-4">{a.registroId}</td>
                  <td className="py-2 pr-4">{a.campo}</td>
                  <td className="py-2 pr-4">{String(a.antes)}</td>
                  <td className="py-2 pr-4">{String(a.depois)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Gerenciar Listas (somente Supervisor)">
        <div className="grid md:grid-cols-3 gap-4">
          <EditorLista stateKey="pecas" titulo="Peças (pintura)" />
          <EditorLista stateKey="kits" titulo="Kits" />
          <EditorLista stateKey="materiais" titulo="Materiais" />
        </div>
      </Card>
    </div>
  );
}

function EditorLista({ stateKey, titulo }) {
  const [appState, setAppState] = useAppState();
  const [novo, setNovo] = useState("");
  const lista = appState.listas[stateKey];

  const add = () => {
    const v = novo.trim();
    if (!v) return;
    const next = { ...appState, listas: { ...appState.listas, [stateKey]: [...lista, v] } };
    if (stateKey === "materiais") {
      next.materiaisConfig = { ...next.materiaisConfig, [v]: { min: 0, precisaComprar: false } };
    }
    setAppState(next);
    saveState(next);
    setNovo("");
  };

  const remove = (i) => {
    const copia = [...lista];
    const [rem] = copia.splice(i, 1);
    const next = { ...appState, listas: { ...appState.listas, [stateKey]: copia } };
    if (stateKey === "materiais") {
      const cfg = { ...next.materiaisConfig };
      delete cfg[rem];
      next.materiaisConfig = cfg;
    }
    setAppState(next);
    saveState(next);
  };

  return (
    <div className="border border-gray-200 rounded-xl">
      <div className="px-4 py-3 border-b border-gray-100 font-medium">{titulo}</div>
      <div className="p-4 space-y-3">
        <div className="flex gap-2">
          <Input placeholder="Novo item" value={novo} onChange={(e) => setNovo(e.target.value)} />
          <Button onClick={add}>Adicionar</Button>
        </div>
        <div className="max-h-64 overflow-auto text-sm">
          {lista.map((item, i) => (
            <div key={i} className="flex items-center justify-between py-1 border-b border-gray-50">
              <span>{item}</span>
              <button className="text-red-600 text-xs" onClick={() => remove(i)}>remover</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/*********************** APP **************************/
const AppContext = React.createContext(null);
function useAppState() {
  return React.useContext(AppContext);
}

function App() {
  const [appState, setAppState] = useState(loadState());
  const [user, setUser] = useState(null);

  useEffect(() => {
    document.documentElement.style.setProperty("--accent", appState.theme.accent);
    document.documentElement.style.setProperty("--accent-hover", appState.theme.accentHover);
    document.documentElement.style.setProperty("--bg", appState.theme.bg);
    document.documentElement.style.setProperty("--card", appState.theme.card);
    document.documentElement.style.setProperty("--text", appState.theme.text);
    document.documentElement.style.setProperty("--muted", appState.theme.muted);
  }, [appState.theme]);

  const logout = () => setUser(null);

  const [tab, setTab] = useState("pintura");

  const Nav = () => (
    <div className="flex flex-wrap items-center gap-2">
      {(user.role === "SUP" || user.role === "PINT") && (
        <TabBtn id="pintura" tab={tab} setTab={setTab}>Pintura</TabBtn>
      )}
      {(user.role === "SUP" || user.role === "KITMAT") && (
        <TabBtn id="kits" tab={tab} setTab={setTab}>Kits montados</TabBtn>
      )}
      {(user.role === "SUP" || user.role === "KITMAT") && (
        <TabBtn id="materiais" tab={tab} setTab={setTab}>Materiais</TabBtn>
      )}
      {user.role === "SUP" && (
        <TabBtn id="painel" tab={tab} setTab={setTab}>Painel</TabBtn>
      )}
    </div>
  );

  if (!user) {
    return (
      <AppContext.Provider value={[appState, setAppState]}>
        <Login onLogin={setUser} theme={appState.theme} setTheme={(t) => setAppState({ ...appState, theme: t })} />
      </AppContext.Provider>
    );
  }

  return (
    <AppContext.Provider value={[appState, setAppState]}>
      <Shell>
        <div className="flex items-center justify-between pb-4">
          <div className="flex items-center gap-3">
            <div className="text-xl font-bold" style={{ color: "var(--text)" }}>Mad Maker — Produção & Estoque</div>
            <Pill>{USERS.find((u) => u.id === user.id)?.nome}</Pill>
          </div>
          <div className="flex items-center gap-2">
            <Nav />
            <Button variant="ghost" onClick={logout}>Sair</Button>
          </div>
        </div>

        {tab === "pintura" && (user.role === "SUP" || user.role === "PINT") && (
          <TelaPintura state={appState} setState={setAppState} user={user} />
        )}
        {tab === "kits" && (user.role === "SUP" || user.role === "KITMAT") && (
          <TelaKits state={appState} setState={setAppState} user={user} />
        )}
        {tab === "materiais" && (user.role === "SUP" || user.role === "KITMAT") && (
          <TelaMateriais state={appState} setState={setAppState} user={user} />
        )}
        {tab === "painel" && user.role === "SUP" && <PainelSupervisor state={appState} />}

        <div className="pt-8 text-xs text-gray-500">
          * Edição em linha salva automaticamente e gera registro de auditoria (quem, quando, o quê).
        </div>
      </Shell>
    </AppContext.Provider>
  );
}

function TabBtn({ id, tab, setTab, children }) {
  const active = tab === id;
  return (
    <button
      onClick={() => setTab(id)}
      className={`rounded-full px-4 py-2 text-sm border ${active ? "text-white" : "text-gray-700"}`}
      style={{ background: active ? "var(--accent)" : "transparent", borderColor: active ? "var(--accent)" : "#e5e7eb" }}
    >
      {children}
    </button>
  );
}

export default App;
