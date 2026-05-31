# Estrutura do Sistema - Módulo: Gestão Financeira

Este documento detalha as funcionalidades administrativas de controle de fluxo de caixa e faturamento do sistema, que devem ser usado como "norte" e referencial para criarmos a aba "Gestão Financeira" do NeuroBank. 

Não siga exatamente a ordem ou estrutura deste documento, mas sim os conceitos e ideias centrais das funcionalidades aqui descritas. O objetivo é criar uma interface limpa, intuitiva e que facilite a gestão financeira do psicólogo no dia a dia, ao mesmo tempo em que é completa e funcional. 

## 1. Estrutura de Navegação (Menu Lateral colapsável )

* **Financeiro**
    * **Transações**
        * Painel Financeiro (Dashboard)
        * Receitas (Entradas)
        * Despesas (Saídas)
        * Extrato (Fluxo de caixa consolidado)
    * **Cobranças**
        * Cobranças geradas (Histórico de faturas)
        * Configuração por cliente (Regras de cobrança individuais)
    * **Nota Fiscal**
        * Painel (Status geral)
        * Listagem (Histórico de emissões)
    * **Repasses**
        * Repasses de convênio (Recebimentos de planos de saúde)
        * Repasses ao profissional (Comissões para outros psicólogos)
        * Alocação de salas (Custos de infraestrutura)

## 2. Funcionalidades Detalhadas

* **Dashboard Financeiro**
    * Exibição de cards com: "Resultado previsto", "Receitas previstas" e "Despesas previstas".
    * Gráfico de barras anual comparando entradas e saídas.
* **Efetuar Pagamento (Modal)**
    * Seleção múltipla de sessões realizadas.
    * Opção de isenção de pagamento ou pagamento parcial.
    * Definição da forma de pagamento (Pix, Dinheiro, Cartão, Convênio).
    * Geração automática de recibo após a baixa.
* **Plano Financeiro do Cliente**
    * Configuração de modalidade: sessão avulsa, pacote mensal ou pacote fechado.
    * Definição do valor padrão por atendimento.
* **Recibo Anual (IRPF)**
    * Filtro de todos os pagamentos de um cliente no ano-base.
    * Geração de documento para declaração de imposto de renda.

## 3. Tipos de Status e Categorias

* **Status de Pagamento**
    * pago, nao_pago, atrasado, parcial, isento.
* **Categorias Financeiras**
    * sessao, venda, aluguel, marketing, imposto, pro-labore, outros.
* **Modelos de Cobrança**
    * sessao_avulsa, pacote_mensal, pacote_fechado.

## 4. Estrutura de Banco de Dados (Supabase Cloud)

> **Nota de Segurança:** Para garantir que o psicólogo veja apenas seus dados, todas as tabelas devem conter a coluna `psicologo_id`.

* **Tabela: perfis**
    * `id` / UUID (PK - referenciando auth.users)
    * `nome_completo` / text
    * `crp` / text
    * `email` / text
* **Tabela: clientes**
    * `id` / UUID (PK)
    * `psicologo_id` / UUID (FK)
    * `nome` / text
    * `cpf` / text
    * `valor_sessao_padrao` / numeric
    * `modelo_cobranca` / text (avulsa, mensal, fechado)
* **Tabela: transacoes**
    * `id` / UUID (PK)
    * `psicologo_id` / UUID (FK)
    * `cliente_id` / UUID (FK - opcional)
    * `tipo` / text (receita ou despesa)
    * `categoria` / text
    * `valor_previsto` / numeric
    * `valor_pago` / numeric
    * `status` / text
    * `data_vencimento` / date
    * `data_pagamento` / timestamp
    * `forma_pagamento` / text
    * `observacao` / text
* **Tabela: sessoes_atendimento**
    * `id` / UUID (PK)
    * `psicologo_id` / UUID (FK)
    * `cliente_id` / UUID (FK)
    * `transacao_id` / UUID (FK - vincula ao pagamento)
    * `data_sessao` / timestamp
    * `valor_cobrado` / numeric
    * `status_faturamento` / boolean (se já gerou transação ou não)