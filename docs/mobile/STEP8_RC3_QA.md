# Step 8 RC3 — Matriz de validação mobile

## Objetivo

Validar a Gestão Financeira e o NeuroFinance em telas de 360, 390, 412 e 430 pixels antes da promoção final da Step 8.

## Gestão Financeira

### Visão geral

- métricas não extrapolam a largura;
- receitas, despesas, resultado e valores pendentes usam dados reais;
- atalhos preservam o botão voltar;
- criação de transação e cobrança abre sem scroll duplo;
- modo claro e escuro mantêm contraste.

### Fluxo, receitas e despesas

- cards ficam em uma coluna em telas estreitas;
- valores longos não cortam a moeda;
- categorias sem dados mostram estado vazio;
- seleção de transação abre o detalhe correto;
- recibo e fatura só abrem quando existe URL.

### Cobranças e inadimplência

- pendências vencidas são diferenciadas das futuras;
- paciente, valor e vencimento permanecem legíveis;
- lista sem pendências mostra estado vazio real;
- nenhuma mensagem afirma cobrança realizada sem retorno do backend.

### Planejamento e relatórios

- meta, ticket médio e ponto de equilíbrio não quebram o layout;
- exportação CSV inclui data, tipo, descrição, categoria, status, valor, paciente e origem;
- arquivo CSV abre corretamente no Excel e similares;
- relatório vazio não gera arquivo enganoso.

## NeuroFinance

### Acesso e estado da conta

- conta inexistente apresenta onboarding somente no NeuroFinance;
- conta pendente não acessa operações;
- conta aprovada exibe saldo e atalhos;
- plano gratuito continua acessando Gestão;
- atualização da página preserva a rota atual.

### Pix

- Copia e Cola trata payload inválido;
- consulta exibe recebedor, instituição e valor;
- PIN só aparece depois da revisão;
- QR Code não exige nome ou CPF quando o endpoint de QR estático não exigir;
- chaves Pix suportam criação, cópia e remoção;
- recebimentos e cobranças têm estados vazio, carregando e erro.

### Transferências e saques

- tipo de chave e campo correspondente cabem em 360 px;
- consulta DICT acontece antes do PIN;
- saldo insuficiente bloqueia confirmação;
- sucesso apresenta comprovante ou fallback imprimível;
- compartilhamento usa Web Share API e copia os dados quando indisponível.

### Boletos

- linha digitável pode ser colada;
- imagem e PDF preservam o arquivo selecionado;
- consulta ocorre antes da autorização;
- pagamento imediato e agendado ficam visualmente distintos;
- histórico apresenta status e comprovante quando disponível.

### Extrato

- abas Realizado, Futuro e Recorrente preservam o filtro;
- busca aceita descrição, paciente e categoria;
- valores podem ser ocultados;
- sincronização apresenta estado de carregamento;
- lista limita volume sem travar a página.

## Navegadores e dispositivos

- Android Chrome;
- Android PWA;
- iPhone Safari;
- iPad Safari;
- desktop Chrome em modo responsivo;
- desktop Edge em modo responsivo.

## Cenários de falha

- sessão expirada;
- conta restrita;
- rede lenta;
- resposta bancária pendente;
- comprovante ainda indisponível;
- navegador sem Web Share API;
- permissão de clipboard negada;
- retorno à tela após recarregar a página.

## Critério de promoção

A RC3 pode ser promovida quando o build estiver aprovado, nenhuma rota protegida apresentar tela branca, operações sensíveis mantiverem revisão e PIN, e os quatro tamanhos mínimos não exibirem scroll horizontal persistente.
