# Mad Maker — Controle de Produção & Estoque

Preview em React (Vite) com Tailwind, exportação Excel (XLSX) e relatórios em PDF (jsPDF).

## Rodar localmente

```bash
npm install
npm run dev
```

Acesse: http://localhost:5173

## Build

```bash
npm run build
npm run preview
```

## Login (usuarios de teste)
- Fabiano (Supervisor): `fabiano01`
- Vitória (Pintura): `madvit27`
- Ana (Kits+Materiais): `madana01`

## Estrutura
- `src/App.jsx` — app principal (login, pintura, kits, materiais, painel)
- `src/main.jsx` — bootstrap React
- `src/index.css` — Tailwind
- `tailwind.config.js`, `postcss.config.js` — configuração do Tailwind
- `index.html` — HTML principal

## Observações
- Persistência local via `localStorage` (sem backend).
- Para publicar no GitHub:
  1. Crie um repositório no GitHub.
  2. Rode `git init` neste diretório, depois `git add . && git commit -m "primeiro commit"`.
  3. `git branch -M main` (se necessário) e `git remote add origin <URL_DO_REPO>`.
  4. `git push -u origin main`.

## Licença
MIT — ajuste conforme necessidade.
