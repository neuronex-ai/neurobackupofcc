# Step 8 — Gestão Financeira mobile

## Objetivo

Separar definitivamente dois produtos que antes apareciam misturados na mesma tela:

1. **Gestão Financeira** — controle gerencial do consultório, disponível sem conta bancária.
2. **NeuroFinance** — movimentação de dinheiro real, condicionada ao plano e ao onboarding bancário.

A Step 8 não altera os contratos das Edge Functions Asaas, a validação do PIN financeiro ou as regras bancárias já aprovadas. O trabalho é aditivo e mobile-first.

## Arquitetura adotada

### Rotas principais

- `/financeiro` → Gestão Financeira.
- `/financeiro/neurofinance` → página inicial da conta bancária.

### Operações bancárias mobile

- `/financeiro/neurofinance/pix` → central Pix.
- `/financeiro/neurofinance/pix/pagar` → Pix Copia e Cola.
- `/financeiro/neurofinance/pix/qrcode` → QR Code para recebimento.
- `/financeiro/neurofinance/pix/recebidos` → recebimentos e cobranças Pix.
- `/financeiro/neurofinance/pix/chaves` → gerenciamento de chaves.
- `/financeiro/neurofinance/transferir` → transferência Pix.
- `/financeiro/neurofinance/saque` → saque para conta ou chave cadastrada.
- `/financeiro/neurofinance/pagamentos/boleto` → consulta, pagamento ou agendamento de boleto.
- `/financeiro/neurofinance/pagamentos/agendados` → histórico e comprovantes.
- `/financeiro/neurofinance/extrato` → realizado, futuro e recorrências.

As rotas são reais e restauráveis. Atualização da página, botão voltar e deep links preservam o contexto da operação.

## Gestão Financeira

- não depende de conta NeuroFinance;
- permanece acessível para o plano gratuito;
- usa `transactions`, `useFinancialMetrics` e os lançamentos gerenciais existentes;
- mantém criação de receita, despesa e cobrança;
- apresenta módulos futuros como `Próxima etapa`, sem simular sucesso.

## NeuroFinance

- onboarding aparece somente dentro da página inicial bancária;
- bloqueio de plano é aplicado somente ao módulo bancário;
- saldo, pendências cadastrais e operações ficam isolados da Gestão;
- conta não aprovada bloqueia operações e encaminha para Saúde da Conta;
- operações sensíveis ocultam a navegação inferior;
- PIN permanece obrigatório para Pix, transferências, saques e boletos.

## Entrega RC1

- segmentação Gestão / NeuroFinance;
- Gestão como entrada padrão;
- onboarding bancário sem bloquear o caixa gerencial;
- métricas mensais e transações reorganizadas;
- filtros de receitas e despesas funcionais;
- gráfico vazio com estado orientativo;
- status explícito para recursos ativos e próximos;
- suporte a light/dark pelos componentes compartilhados;
- nenhuma alteração nos fluxos Asaas existentes.

## Entrega RC2

- página inicial NeuroFinance própria para mobile;
- central de operações bancárias com rotas protegidas;
- Pix Copia e Cola reutilizando consulta, congelamento dos dados e PIN;
- geração de QR Code Pix com paciente ou pagador identificado;
- listagem de Pix recebidos e cobranças;
- criação, cópia e exclusão de chaves Pix;
- transferência Pix com consulta DICT e confirmação por PIN;
- saque para conta bancária, chave salva ou nova chave Pix;
- pagamento de boleto por linha digitável, imagem ou PDF;
- escolha entre pagamento imediato e agendamento;
- tela de pagamentos agendados com retorno bancário e comprovantes;
- extrato mobile com saldo, entradas, saídas, busca e filtros;
- PIN redimensionado para telas pequenas e protegido por safe area;
- estilos de compatibilidade para componentes bancários preexistentes em telefones;
- build de preview validado na Vercel.

## Proteções mantidas

- nenhuma Edge Function Asaas foi reescrita;
- nenhuma tabela ou coluna foi removida;
- nenhuma operação é executada antes da tela de revisão;
- PIN é solicitado somente depois da consulta ao provedor;
- conta ausente, pendente ou restrita não acessa operações;
- o plano gratuito continua acessando a Gestão Financeira;
- comprovante só é apresentado quando existe retorno ou documento disponível.

## Próximas corridas

1. Polimento específico da listagem Pix e confirmação de estorno.
2. Compartilhamento nativo de comprovantes no PWA.
3. Inadimplência e cobranças gerenciais mobile.
4. Planejamento, metas e ponto de equilíbrio.
5. Relatórios gerenciais e exportação para contador.
6. Testes visuais e funcionais em 360, 390, 412 e 430 px.

## Critérios para conclusão

- usuário sem conta bancária nunca perde acesso à Gestão;
- onboarding só aparece no NeuroFinance;
- nenhuma ação visual afirma sucesso sem backend;
- nenhum fluxo bancário validado é reescrito nesta etapa;
- PIN permanece obrigatório em operações sensíveis;
- formulários críticos usam página, diálogo seguro ou fluxo em etapas;
- erros bancários recebem mensagens específicas;
- light e dark não apresentam contraste quebrado;
- não existe scroll vertical duplo.
