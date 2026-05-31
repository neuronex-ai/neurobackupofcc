# Estrutura do Sistema - Módulo: NeuroBank

Este documento detalha as funcionalidades de conta digital e processamento automático de pagamentos que devem ser usado como "norte" e referencial para criarmos a aba "Gestão Financeira" do NeuroBank. 

Não siga exatamente a ordem ou estrutura deste documento, mas sim os conceitos e ideias centrais das funcionalidades aqui descritas. O objetivo é criar uma interface limpa, intuitiva e que facilite a gestão financeira do psicólogo no dia a dia, ao mesmo tempo em que é completa e funcional. 

Não exclua as seções e funcionalidades da atual aba "NeuroBank", apenas complemente com as funcionalidades aqui descritas para uma interface complementada, intuitiva e funcional.

## 1. Estrutura de Navegação (Menu Lateral)

* **Financeiro**
    * **NeuroBank**
        * **Resumo:** Visão geral de saldos e gráficos de recebimento.
        * **Minhas contas:** Gestão de contas bancárias externas para recebimento de saques.
        * **Histórico:** Extrato detalhado de todas as movimentações da conta digital.

## 2. Funcionalidades Detalhadas

* **Painel de Saldos**
    * **Saldo Disponível:** Dinheiro já liberado para transferência bancária.
    * **Saldo Bloqueado:** Valores em processamento (ex: vendas no crédito que liberam em 30 dias).
    * **Aguardando Pagamento:** Soma de todos os boletos e links de Pix emitidos que ainda não foram quitados.
* **Checkout de Pagamento (Paciente)**
    * Interface mobile para visualização do resumo da cobrança (Nome, CPF, Sessões).
    * Opções de pagamento: Pix (com cópia da chave) ou Cartão de Crédito.
* **Gestão de Links**
    * Tabela de acompanhamento de envios.
    * Status de leitura ("Lido") e status de conclusão de pagamento.
* **Saques**
    * Função para transferência do saldo disponível para conta bancária de titularidade do psicólogo.

## 3. Taxas e Regras de Negócio

* **Boleto Bancário:** Taxa fixa por boleto compensado.
* **Pix:** Taxa fixa ou percentual reduzido por transação.
* **Cartão de Crédito:** Taxa percentual sobre o valor bruto.
* **Saque:** Taxa fixa por transferência efetuada.

## 4. Estrutura de Banco de Dados (Supabase Cloud)

> **Importante:** O NeuroBank deve ser isolado para garantir a integridade dos saldos reais.

* **Tabela: neurobank_contas**
    * `id` / UUID (PK)
    * `psicologo_id` / UUID (FK)
    * `saldo_disponivel` / numeric
    * `saldo_bloqueado` / numeric
    * `banco_destino` / text
    * `agencia_destino` / text
    * `conta_destino` / text
    * `status_conta` / text (ativo, suspenso)
* **Tabela: neurobank_movimentacoes**
    * `id` / UUID (PK)
    * `psicologo_id` / UUID (FK)
    * `conta_id` / UUID (FK)
    * `transacao_id` / UUID (FK - link com a tabela de transações geral)
    * `tipo_movimentacao` / text (entrada_pagamento, saida_saque, taxa_sistema)
    * `valor_bruto` / numeric
    * `valor_taxa` / numeric
    * `valor_liquido` / numeric
    * `metodo_pagamento` / text (pix, boleto, cartao)
    * `data_operacao` / timestamp
* **Tabela: neurobank_links_pagamento**
    * `id` / UUID (PK)
    * `transacao_id` / UUID (FK)
    * `codigo_link` / text (slug único para a URL)
    * `visualizado_em` / timestamp (para o status "Lido")
    * `data_expiracao` / timestamp
    * `status_link` / text (ativo, pago, expirado)
* **Tabela: neurobank_saques_solicitados**
    * `id` / UUID (PK)
    * `psicologo_id` / UUID (FK)
    * `valor_solicitado` / numeric
    * `taxa_saque_aplicada` / numeric
    * `status_processamento` / text (pendente, concluido, rejeitado)
    * `data_solicitacao` / timestamp
    * `comprovante_url` / text