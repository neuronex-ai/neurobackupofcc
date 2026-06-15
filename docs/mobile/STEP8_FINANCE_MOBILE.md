# Step 8 — Gestão Financeira mobile

## Objetivo

Separar definitivamente dois produtos que antes apareciam misturados na mesma tela:

1. **Gestão Financeira** — controle gerencial do consultório, disponível sem conta bancária.
2. **NeuroFinance** — movimentação de dinheiro real, condicionada ao plano e ao onboarding bancário.

A Step 8 não altera os hooks bancários, Edge Functions Asaas, PIN financeiro ou regras já validadas. O trabalho é aditivo e mobile-first.

## Problemas encontrados no ponto de partida

- o cabeçalho dizia `NeuroFinance` e `Gestão de Caixa` ao mesmo tempo;
- o onboarding bancário substituía toda a página e bloqueava a gestão gerencial;
- ações ainda não adaptadas exibiam toast de “funcionalidade em desenvolvimento” como se fossem botões operacionais;
- conta bancária, métricas gerenciais e transações manuais apareciam no mesmo fluxo;
- o carregamento da conta Asaas bloqueava inclusive a área que não depende do Asaas;
- o modal de verificação utilizava proporções de desktop no celular.

## Arquitetura adotada

### Rotas

- `/financeiro` → Gestão Financeira.
- `/financeiro/neurofinance` → conta bancária e movimentação real.

O seletor mobile navega entre rotas reais, permitindo deep link, botão voltar e restauração correta após atualizar a página.

### Gestão Financeira

- não depende de conta NeuroFinance;
- permanece acessível para o plano gratuito;
- usa `transactions`, `useFinancialMetrics` e os lançamentos gerenciais existentes;
- mantém criação de receita/despesa e cobrança existente;
- apresenta módulos futuros como `Próxima etapa`, sem simular sucesso.

### NeuroFinance

- onboarding aparece somente dentro da rota NeuroFinance;
- bloqueio de plano é aplicado somente ao módulo bancário;
- saldo, pendências cadastrais e ações bancárias ficam isolados;
- ações ainda não adaptadas são exibidas como `Em adaptação` e permanecem desabilitadas;
- centro de verificação passa a usar altura dinâmica e scroll único.

## Entrega RC1

- segmentação Gestão / NeuroFinance;
- Gestão como entrada padrão;
- onboarding bancário sem bloquear o caixa gerencial;
- métricas mensais e transações reorganizadas;
- filtros de receitas e despesas funcionais;
- gráfico vazio com estado orientativo;
- status explícito para recursos ativos, em adaptação e próximos;
- suporte a light/dark pelos componentes compartilhados;
- navegação compatível com voltar do navegador;
- nenhuma alteração em fluxos Asaas existentes.

## Próximas corridas da Step 8

1. Fluxo mobile de Pix: pagar, QR Code, recebidos e chaves.
2. Transferências e saques com PIN em sheet dedicado.
3. Pagamento de boletos em etapas.
4. Extrato realizado, futuro e assinaturas.
5. Cobranças bancárias, comprovantes e compartilhamento.
6. Inadimplência, planejamento e relatórios gerenciais.
7. Testes em 360, 390, 412 e 430 px.

## Critérios para conclusão

- usuário sem conta bancária nunca perde acesso à Gestão;
- onboarding só aparece no NeuroFinance;
- nenhuma ação visual afirma sucesso sem backend;
- nenhum fluxo bancário validado é reescrito nesta etapa;
- PIN permanece obrigatório em operações sensíveis;
- formulários críticos usam página, sheet ou fluxo em etapas;
- erros bancários recebem mensagens específicas;
- light e dark não apresentam contraste quebrado;
- não existe scroll vertical duplo.
