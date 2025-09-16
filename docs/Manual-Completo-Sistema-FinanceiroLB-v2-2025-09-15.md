# Manual Completo — Sistema FinanceiroLB
Versão: 1.0  
Última atualização: 15/09/2025  
Plataforma: Web (React + TypeScript) com backend de dados no Supabase (PostgreSQL/Auth/Storage)

## Sumário
1. Visão geral e objetivos  
2. Arquitetura e tecnologias  
3. Instalação e configuração (macOS)  
4. Perfis de acesso, organização e segurança (RLS)  
5. Cadastros mestres (Filiais, Entidades, Categorias, Contas)  
6. Financeiro — Contas a Pagar (corporativas e parcelas)  
7. Recorrentes (lançamento mensal automático)  
8. NFe/Compras — Entrada, vinculação e conferência  
9. Vendas — Gestão de Vendas, Metas e Comparativos (YoY/MoM)  
10. Relatórios e BI (views e análises)  
11. Administração do banco (migrations, backups, auditoria)  
12. Operação do dia a dia (SOPs)  
13. Monitoramento, logs e troubleshooting  
14. Changelog resumido (o que foi feito)  
15. Roadmap sugerido (próximos passos)  
16. Anexos (glossário, dicionário de dados e consultas úteis)

---

## 1) Visão geral e objetivos
O FinanceiroLB é um sistema de gestão financeira e comercial voltado para varejo multimarcas. Ele centraliza Contas a Pagar, cadastros (filiais, fornecedores, clientes, funcionários), entrada de NFe, metas e desempenho de vendas, e fornece relatórios analíticos via views otimizadas no banco.

Principais metas do produto:
- Padronizar o contas a pagar (titular e parcelas) com rastreabilidade por filial e entidade credora.
- Facilitar a importação de NFe e o vínculo com títulos/parcelas.
- Disponibilizar um painel de Gestão de Vendas com metas, comparativos ano a ano (YoY) e evolução mês a mês (MoM).
- Garantir segurança por RLS (Row Level Security) segmentando acesso por Organização → Filiais → Usuários.

## 2) Arquitetura e tecnologias
- **Frontend**: React + TypeScript, Vite, Tailwind, shadcn/ui (componentes), React Query (dados), Sonner/Toaster (notificações), ícones via lucide-react.
- **Backend de dados**: Supabase (PostgreSQL, Auth, Storage). O frontend acessa diretamente o Supabase via SDK.
- **Autenticação**: Supabase Auth (JWT). Regra: administradores (is_admin()) têm acesso total; demais usuários são filtrados por RLS conforme filiais/organizações mapeadas.
- **Relatórios**: Views de BI (ex.: vw_fato_parcelas, vw_dim_entidade, vw_dim_categoria_financeira, vw_dim_filial).

### Stack técnico detalhado:
```
Frontend:
├── React 19.1.1 + TypeScript 5.6.2
├── Vite 7.1.5 (build/dev server)
├── Tailwind CSS (estilização)
├── shadcn/ui (componentes reutilizáveis)
├── React Query (cache/sync de dados)
├── Lucide React (ícones)
└── Sonner (notificações toast)

Backend:
├── Supabase (PostgreSQL + Auth + Storage)
├── Row Level Security (RLS) para multi-tenancy
├── Views de BI para relatórios
└── Migrations SQL versionadas
```

## 3) Instalação e configuração (macOS)

### Pré-requisitos:
- Node.js 20+ (recomendado usar nvm)
- npm ou yarn
- Conta no Supabase (para URL e anon key)

### Passos:
1. **Clone o repositório**:
   ```bash
   git clone https://github.com/evozago/financeiro-app.git
   cd financeiro-app
   ```

2. **Instale dependências**:
   ```bash
   npm ci
   ```

3. **Configure variáveis de ambiente**:
   ```bash
   cp .env.example .env
   # Edite .env com suas credenciais do Supabase
   ```

4. **Execute em desenvolvimento**:
   ```bash
   npm run dev
   # Aplicação disponível em http://localhost:5173
   ```

5. **Build para produção**:
   ```bash
   npm run build        # Build normal
   npm run build:pages  # Build para GitHub Pages
   npm run preview      # Preview do build
   ```

## 4) Perfis de acesso, organização e segurança (RLS)

### Estrutura hierárquica:
```
Organização (ex: "LB Group")
└── Filiais (ex: "Loja Centro", "Loja Shopping")
    └── Usuários (vendedores, gerentes, admin)
```

### Row Level Security (RLS):
- **Administradores** (`is_admin() = true`): Acesso total, podem ver todas as organizações/filiais.
- **Usuários regulares**: Filtrados por `user_filiais` (tabela de mapeamento usuário ↔ filial).
- **Políticas RLS**: Aplicadas automaticamente em todas as tabelas principais (contas, parcelas, vendas, metas).

### Exemplo de política RLS:
```sql
-- Política para tabela 'contas_pagar'
CREATE POLICY "Users can view own organization data" ON contas_pagar
  FOR SELECT USING (
    is_admin() OR 
    filial_id IN (SELECT filial_id FROM user_filiais WHERE user_id = auth.uid())
  );
```

## 5) Cadastros mestres (Filiais, Entidades, Categorias, Contas)

### 5.1) Filiais
- **Tabela**: `filiais`
- **Campos principais**: nome, codigo, endereco, telefone, email, status_ativo
- **Uso**: Segmentação de dados por unidade de negócio

### 5.2) Entidades (Fornecedores/Clientes)
- **Tabela**: `entidades`
- **Tipos**: Fornecedor, Cliente, Funcionário, Outros
- **Campos**: nome, documento (CNPJ/CPF), email, telefone, endereco
- **Integração**: Usada em contas a pagar, NFe, vendas

### 5.3) Categorias Financeiras
- **Tabela**: `categorias_financeiras`
- **Estrutura**: Hierárquica (categoria pai → subcategorias)
- **Exemplos**: Operacional > Aluguel, Administrativo > Contabilidade
- **Uso**: Classificação de contas a pagar para relatórios

### 5.4) Contas Bancárias
- **Tabela**: `contas_bancarias`
- **Campos**: banco, agencia, conta, pix, saldo_inicial
- **Uso**: Controle de fluxo de caixa e conciliação

## 6) Financeiro — Contas a Pagar (corporativas e parcelas)

### 6.1) Estrutura de dados:
```
contas_pagar (conta titular/principal)
└── parcelas (divisões da conta, se parcelada)
```

### 6.2) Fluxo operacional:
1. **Criação da conta**: Valor total, fornecedor, categoria, vencimento
2. **Parcelamento** (opcional): Divisão automática em N parcelas
3. **Pagamento**: Baixa individual de parcelas com data e forma de pagamento
4. **Conciliação**: Vínculo com extratos bancários

### 6.3) Status de parcelas:
- `pendente`: Aguardando pagamento
- `paga`: Quitada
- `cancelada`: Cancelada/estornada
- `vencida`: Em atraso

### 6.4) Campos principais:
```sql
-- Conta principal
contas_pagar:
  id, filial_id, entidade_id, categoria_id
  descricao, valor_total, data_vencimento
  observacoes, created_at, updated_at

-- Parcelas
parcelas:
  id, conta_id, numero_parcela, valor_parcela
  data_vencimento, data_pagamento, status
  forma_pagamento, conta_bancaria_id
```

## 7) Recorrentes (lançamento mensal automático)

### 7.1) Conceito:
Contas que se repetem mensalmente (ex: aluguel, telefone, software).

### 7.2) Implementação:
- **Tabela**: `contas_recorrentes`
- **Campos**: template da conta, dia_vencimento, ativo, proxima_geracao
- **Automação**: Job mensal que cria novas contas baseadas no template

### 7.3) Fluxo:
1. Cadastro do template recorrente
2. Job executa no dia 1 de cada mês
3. Verifica recorrentes ativos
4. Cria nova conta em `contas_pagar` baseada no template
5. Atualiza `proxima_geracao` para o próximo mês

## 8) NFe/Compras — Entrada, vinculação e conferência

### 8.1) Importação de NFe:
- **Upload**: XML da NFe via interface web
- **Parsing**: Extração de dados (fornecedor, itens, valores, impostos)
- **Armazenamento**: Tabela `notas_fiscais` + `itens_nfe`

### 8.2) Vinculação com Contas a Pagar:
- **Manual**: Usuário associa NFe → Conta/Parcela
- **Automática**: Matching por valor + fornecedor + data próxima
- **Validação**: Conferência de divergências

### 8.3) Estrutura de dados:
```sql
notas_fiscais:
  id, numero, serie, chave_acesso, fornecedor_id
  data_emissao, valor_total, status_vinculacao

itens_nfe:
  id, nfe_id, codigo_produto, descricao
  quantidade, valor_unitario, valor_total
```

## 9) Vendas — Gestão de Vendas, Metas e Comparativos (YoY/MoM)

### 9.1) Estrutura de vendas:
- **Tabela**: `vendas`
- **Campos**: filial_id, vendedora_id, data_venda, valor, tipo_pagamento
- **Agregações**: Por dia, mês, vendedora, filial

### 9.2) Metas:
- **Tabela**: `metas_vendas`
- **Dimensões**: Por filial, vendedora, mês/ano
- **Acompanhamento**: % atingimento, valor realizado vs meta

### 9.3) Comparativos:
- **YoY (Year over Year)**: Crescimento anual (2024 vs 2023)
- **MoM (Month over Month)**: Evolução mensal (Jan vs Dez)
- **Indicadores visuais**: Cores (verde/vermelho) conforme performance

### 9.4) Views de BI:
```sql
-- Fato de vendas agregado
vw_fato_vendas:
  filial, vendedora, ano, mes, valor_realizado
  meta_valor, percentual_atingimento

-- Comparativo YoY
vw_vendas_yoy:
  periodo_atual, periodo_anterior
  valor_atual, valor_anterior, variacao_percentual
```

## 10) Relatórios e BI (views e análises)

### 10.1) Views principais:
- `vw_fato_parcelas`: Análise de contas a pagar
- `vw_dim_entidade`: Dimensão de fornecedores/clientes
- `vw_dim_categoria_financeira`: Hierarquia de categorias
- `vw_fluxo_caixa`: Projeção de entradas/saídas
- `vw_aging_contas`: Aging de contas em aberto

### 10.2) Dashboards:
- **Financeiro**: Contas em aberto, aging, fluxo de caixa
- **Vendas**: Metas vs realizado, ranking vendedoras, tendências
- **Operacional**: NFe pendentes, conciliações pendentes

### 10.3) Exportações:
- CSV/Excel para relatórios tabulares
- PDF para demonstrativos formatados
- API endpoints para integrações

## 11) Administração do banco (migrations, backups, auditoria)

### 11.1) Migrations:
- Versionamento via arquivos SQL numerados
- Aplicação via Supabase CLI ou interface web
- Rollback manual quando necessário

### 11.2) Backups:
- **Automático**: Supabase faz backup diário
- **Manual**: Export via pg_dump quando necessário
- **Restore**: Via Supabase interface ou CLI

### 11.3) Auditoria:
- **Logs de acesso**: Supabase Auth logs
- **Audit trails**: Triggers em tabelas críticas
- **Monitoring**: Alertas para operações sensíveis

## 12) Operação do dia a dia (SOPs)

### 12.1) Rotina diária:
1. **Conferir contas vencidas**: Dashboard aging
2. **Processar NFe**: Upload e vinculação pendentes
3. **Lançar vendas**: Input diário por vendedora
4. **Atualizar metas**: Ajustes conforme necessário

### 12.2) Rotina mensal:
1. **Fechar mês anterior**: Validar todos os lançamentos
2. **Gerar recorrentes**: Executar job automático
3. **Analisar performance**: Relatórios YoY/MoM
4. **Backup manual**: Se necessário

### 12.3) Troubleshooting comum:
- **Lentidão**: Verificar queries complexas no Dashboard
- **Erros de RLS**: Validar mapeamento user_filiais
- **NFe não vincula**: Conferir dados do fornecedor

## 13) Monitoramento, logs e troubleshooting

### 13.1) Logs disponíveis:
- **Supabase**: Auth, Database, API logs
- **Frontend**: Console errors, network requests
- **Performance**: React DevTools, Lighthouse

### 13.2) Métricas importantes:
- Tempo de resposta das queries
- Taxa de erro em uploads de NFe
- % de contas pagas no prazo
- Utilização de storage

### 13.3) Alertas configurados:
- Contas vencidas há > 7 dias
- NFe pendentes de vinculação > 3 dias
- Queries com timeout > 30s

## 14) Changelog resumido (o que foi feito)

### v1.0 (Inicial - 2025):
- ✅ Setup básico React + TypeScript + Vite
- ✅ Integração com Supabase
- ✅ Estrutura de RLS multi-tenant
- ✅ CRUD básico de entidades
- ✅ Sistema de contas a pagar e parcelas
- ✅ Upload e parsing básico de NFe
- ✅ Módulo de vendas e metas
- ✅ Views de BI iniciais
- ✅ Deploy automatizado via GitHub Pages

## 15) Roadmap sugerido (próximos passos)

### 🔥 Prioridade Alta:
- [ ] **CRUD completo de Vendedoras**: Modal criar/editar + persistência Supabase
- [ ] **Comparativo MoM**: Indicadores visuais na tabela de vendas
- [ ] **Automação de recorrentes**: Scheduler mensal com logs no Supabase

### 📊 Prioridade Média:
- [ ] **Conciliação NFe ↔ Parcelas**: Telas de auditoria e matching automático
- [ ] **Dashboards avançados**: KPIs por filial (AP em aberto, aging, metas, conversão)
- [ ] **Relatórios PDF**: Demonstrativos formatados para impressão

### 🧪 Prioridade Baixa:
- [ ] **Testes E2E**: Playwright para fluxos críticos (contas, pagamento, NFe, metas/vendas)
- [ ] **Mobile app**: React Native ou PWA
- [ ] **Integrações**: ERP, bancos, e-commerce

## 16) Anexos (glossário, dicionário de dados e consultas úteis)

### 16.1) Glossário:
- **RLS**: Row Level Security - segurança a nível de linha no PostgreSQL
- **YoY**: Year over Year - comparação ano a ano
- **MoM**: Month over Month - comparação mês a mês  
- **Aging**: Análise de vencimento de contas por período
- **NFe**: Nota Fiscal Eletrônica

### 16.2) Consultas úteis:

#### Contas vencidas por filial:
```sql
SELECT f.nome as filial, COUNT(*) as total_vencidas, SUM(p.valor_parcela) as valor_total
FROM parcelas p
JOIN contas_pagar c ON p.conta_id = c.id
JOIN filiais f ON c.filial_id = f.id
WHERE p.status = 'pendente' AND p.data_vencimento < CURRENT_DATE
GROUP BY f.id, f.nome
ORDER BY valor_total DESC;
```

#### Performance de vendas por mês:
```sql
SELECT 
  DATE_TRUNC('month', v.data_venda) as mes,
  f.nome as filial,
  SUM(v.valor) as vendas_realizadas,
  m.meta_valor,
  ROUND((SUM(v.valor) / m.meta_valor * 100), 2) as percentual_meta
FROM vendas v
JOIN filiais f ON v.filial_id = f.id
LEFT JOIN metas_vendas m ON v.filial_id = m.filial_id 
  AND DATE_TRUNC('month', v.data_venda) = DATE_TRUNC('month', m.periodo)
WHERE v.data_venda >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY mes, f.id, f.nome, m.meta_valor
ORDER BY mes DESC, percentual_meta DESC;
```

#### NFe sem vinculação:
```sql
SELECT nf.numero, nf.serie, e.nome as fornecedor, nf.valor_total, nf.data_emissao
FROM notas_fiscais nf
JOIN entidades e ON nf.fornecedor_id = e.id
WHERE nf.status_vinculacao = 'pendente'
  AND nf.data_emissao >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY nf.data_emissao DESC;
```

---

*Este manual é um documento vivo e será atualizado conforme evolução do sistema. Para dúvidas técnicas, consulte o repositório GitHub ou entre em contato com a equipe de desenvolvimento.*