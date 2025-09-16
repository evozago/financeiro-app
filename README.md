# FinanceiroLB — Sistema Financeiro e Comercial

Aplicação web para gestão financeira e comercial de varejo multimarcas. Centraliza Contas a Pagar (corporativas e parcelas), cadastros (filiais, entidades), NFe/Compras, Vendas/Metas e Relatórios/BI com segurança por RLS (Supabase).

- Demo (GitHub Pages): https://evozago.github.io/financeiro-app/
- Frontend: React + TypeScript (Vite, Tailwind, shadcn/ui, React Query)
- Backend de dados: Supabase (PostgreSQL, Auth, Storage) via SDK no cliente
- Segurança: RLS (Row Level Security) segmentando acesso por Organização → Filiais → Usuários

## Sumário rápido
- [Stack e requisitos](#stack-e-requisitos)
- [Executar localmente](#executar-localmente)
- [Build e preview de produção](#build-e-preview-de-produção)
- [Deploy (GitHub Pages)](#deploy-github-pages)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Manual completo](#manual-completo)
- [Roadmap](#roadmap)

## Stack e requisitos
- Node.js 20 (recomendado usar nvm)
- npm
- Supabase (URL e anon key)

## Executar localmente
1. Clone o repositório e instale dependências:
   ```bash
   git clone https://github.com/evozago/financeiro-app.git
   cd financeiro-app
   npm ci
   ```
2. Configure variáveis de ambiente:
   - Copie `.env.example` para `.env` e preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
3. Suba o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
4. Acesse a URL do terminal (geralmente http://localhost:5173).

## Build e preview de produção
Para simular exatamente a publicação no GitHub Pages (base /financeiro-app/):
```bash
npm run build:pages
npm run preview
```
Abra: http://localhost:4173/financeiro-app/ (ou a porta indicada).

Notas:
- O projeto também suporta `npm run build` (Vite gera `dist/`).
- Para Pages usamos `--base=/financeiro-app/` (já contemplado no script `build:pages`).

## Deploy (GitHub Pages)
- Automatizado via GitHub Actions em todo push na branch `main` e manual via `workflow_dispatch`.
- Workflow: `.github/workflows/deploy-pages.yml`
- Permissões mínimas: `contents: read`, `pages: write`, `id-token: write`
- Concurrency: `pages` (evita deploys concorrentes)
- O job "deploy" expõe a URL em `steps.deployment.outputs.page_url`.

URL esperada após o merge: https://evozago.github.io/financeiro-app/

## Estrutura do projeto
- `src/` — aplicação React
  - `pages/` e `features/` — telas e módulos (Financeiro, Vendas etc.)
  - `integrations/supabase/` — cliente Supabase e tipagens
  - `components/` — UI compartilhada (tabelas, modais, formulários)
  - `hooks/` — lógica de dados (ex.: vendas, metas)
- `supabase/` — migrations, policies e scripts (opcional)
- `public/` — assets estáticos
- `.github/workflows/` — CI/CD (deploy para Pages)
- `docs/` — documentação

## Manual completo
A documentação funcional e técnica detalhada está em:
- [docs/Manual-Completo-Sistema-FinanceiroLB-v2-2025-09-15.md](docs/Manual-Completo-Sistema-FinanceiroLB-v2-2025-09-15.md)

Cobre: RLS, cadastros, Contas a Pagar, Recorrentes, NFe/Compras, Vendas/Metas/Comparativos (YoY/MoM), Relatórios (views), Administração do banco, SOPs e troubleshooting.

## Roadmap
- CRUD completo de Vendedoras (modal criar/editar + persistência Supabase)
- Comparativo MoM e indicadores visuais na tabela
- Automação de recorrentes (scheduler mensal com logs no Supabase)
- Conciliação NFe ↔ Parcelas com telas de auditoria
- Dashboards: KPIs por filial (AP em aberto, aging, metas, conversão)
- Testes E2E para fluxos críticos (contas, pagamento, NFe, metas/vendas)

Contribuições e sugestões são bem-vindas via Issues/PRs.
