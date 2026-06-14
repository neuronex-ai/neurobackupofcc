# Checkpoint de reconciliação — passo 7

Data: 14 de junho de 2026

Este documento registra o estado encontrado no repositório `neurobackup` e no projeto Supabase NeuroNex após a migração do histórico de desenvolvimento para o novo repositório.

## Confirmado no código e no banco

- Motor compartilhado de sessão e transcrição presente no projeto.
- Tabelas persistentes de transcrição e segmentos existentes no Supabase.
- Centro persistente de notificações e preferências existentes.
- Preferências de aparência, densidade, movimento reduzido, idioma, fuso horário e início da semana persistidas em `user_preferences`.
- Templates de comunicação carregados e salvos em `communication_templates`.
- Configurações de relatório persistidas em `monthly_report_settings`.
- Sugestões de integrações gravadas em `integration_suggestions`.

## Correções aplicadas nesta rodada

### Segurança do Synapse

RLS habilitado em:

- `history_conversation_psychology`;
- `chat_sessions`;
- `synapse_channel_bindings`.

As políticas de propriedade já existentes passaram a ser efetivamente aplicadas. Edge Functions administrativas continuam operando por `service_role`.

### Templates de comunicação

A unicidade de `communication_templates` passou de global em `template_key` para escopo por profissional:

```sql
unique (user_id, template_key)
```

Isso permite que profissionais diferentes salvem o mesmo tipo de template.

### Sugestões de integração

A migration já versionada no repositório foi aplicada ao Supabase Cloud. A tabela agora possui RLS, políticas por usuário, validação e atualização automática de `updated_at`.

### Relatório mensal

A Edge Function `send-monthly-report` foi revisada e publicada com JWT obrigatório.

O envio de teste:

- vai somente para o e-mail do profissional autenticado;
- usa dados demonstrativos;
- não envia mensagem a pacientes;
- respeita assunto, introdução, sessões e pagamentos selecionados.

O envio normal:

- valida que o paciente pertence ao profissional;
- calcula sessões e valores com dados reais;
- respeita preferências de e-mail;
- escapa conteúdo e cabeçalhos;
- renova o token Google quando necessário.

A síntese clínica permanece desabilitada até existir revisão e aprovação explícita pelo profissional.

### Canais de notificação

E-mail e notificações internas permanecem configuráveis.

SMS e push foram marcados como indisponível/em breve e são persistidos como desativados. Os logs atuais mostram falhas no provedor SMS, e o projeto ainda não possui infraestrutura PWA de push validada.

## Pendências conhecidas do passo 7

1. Implementar o processador automático de relatórios mensais com `pg_cron`, `pg_net`, Vault, deduplicação, tentativas e log de entrega.
2. Executar teste autenticado do envio de relatório pelo Gmail em um ambiente do aplicativo.
3. Corrigir ou substituir o provedor SMS antes de reabilitar o canal.
4. Marcar também o editor de templates SMS como indisponível ou apenas preparatório.
5. Substituir o card mobile de assinatura, atualmente com plano e data de renovação estáticos, por dados reais de `useSubscription`.
6. Auditar integralmente as telas de Plano, Segurança, Integrações e Financeiro/Fiscal para remover ações sem backend.
7. Executar build TypeScript e testes de navegação quando o repositório estiver disponível em um ambiente executável.

## Segurança para rodada dedicada

O advisor do Supabase ainda aponta itens antigos que não foram alterados nesta rodada para evitar regressões:

- tabelas com RLS sem políticas;
- funções `SECURITY DEFINER` executáveis por papéis amplos;
- funções com `search_path` mutável;
- buckets públicos com listagem ampla;
- política de inserção permissiva em logs;
- proteção contra senhas vazadas desabilitada.

Cada item deve ser tratado após mapear consumidores, papéis e fluxos públicos legítimos.

## Critério para avançar ao passo 8

Antes de iniciar Gestão Financeira mobile:

- validar build;
- testar templates e relatório manual;
- decidir o desenho seguro do agendador mensal;
- fechar as simulações restantes mais visíveis em Ajustes.
