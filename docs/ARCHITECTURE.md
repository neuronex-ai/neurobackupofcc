# Arquitetura NeuroNex

Última atualização: 2026-06-30

Este documento é a fonte pública sanitizada de arquitetura para agentes e mantenedores. Experimentos antigos de provedores são legado e não devem ser reintroduzidos sem decisão explícita de produto, gestão e segurança.

## Stack Atual

| Camada | Escolha atual |
| --- | --- |
| Frontend | React 18, TypeScript, Vite, React Router |
| UI | Tailwind CSS, Radix UI, shadcn/ui, lucide-react |
| Estado/dados | TanStack Query, Supabase JS |
| Banco/Auth/RLS | Supabase Cloud |
| Backend edge | Supabase Edge Functions |
| Object storage privado | Cloudflare R2 |
| Provedor financeiro | Asaas BaaS v3, identificado nos fluxos financeiros como prestador dos serviços |
| Superfície financeira | NeuroFinance, produto/interface da NeuroNex para workflows financeiros |
| Provedor fiscal/NFS-e | Fluxos fiscais/NFS-e do Asaas com atribuição clara ao provedor |
| IA | Edge Functions Gemini/Synapse |
| Integrações calendário/documentos | Google Calendar/Drive/Docs onde ainda conectados |
| Teleconsulta | Fluxo atual Jitsi/JaaS mais rota legada oculta de avaliação |
| WhatsApp/NeuroZap | Rota oculta `/neurozap`, fora da navbar |

## Regras de Arquitetura

- NeuroFinance é a única superfície financeira ativa, mas não deve ocultar o papel do provedor. Usa Asaas BaaS v3 para assinaturas de psicólogos, subcontas, cobranças de pacientes, Pix/boletos/cartões, saques, dados fiscais e NFS-e.
- NeuroNex é a plataforma tecnológica. Não deve ser descrita como banco, instituição de pagamento ou detentora de recursos de clientes.
- Asaas deve ser claramente identificado em onboarding, telas financeiras, termos, contratos, fluxos Pix/boleto/cartão, saques, comprovantes e cobrança de pacientes como prestador responsável pelos serviços financeiros contratados.
- Supabase armazena metadados relacionais, Auth, RLS, realtime e Edge Functions. Ele não é o object store primário de documentos.
- Cloudflare R2 armazena bytes privados de documentos. Supabase armazena metadados e autoriza uploads/downloads por Edge Functions e URLs assinadas de curta duração.
- Documentos, anexos de notas, arquivos de chat IA, arquivos do portal do paciente e objetos legados migrados devem usar R2, salvo item explicitamente público e não sensível.
- Contas de pacientes e profissionais são papéis separados. Pacientes devem entrar em `/portal`; profissionais não devem entrar no portal do paciente sem relacionamento explícito com aquele paciente.
- Superfícies de clínica/multi-profissional estão adiadas. Não manter nem adicionar dashboards de Plano Clínica, gestão de equipe, relatórios de clínica ou configurações de organização no produto ativo.

## Ambientes e Release

- Produção, homologação/sandbox e desenvolvimento local são ambientes separados. O frontend não deve fixar URLs, project refs, chaves ou fallbacks de produção; workflows e scripts operacionais devem deixar o ambiente explícito e não misturar refs de produção e homologação no mesmo fluxo.
- O frontend recebe apenas variáveis públicas necessárias, como URL e chave anon/publishable do Supabase, sempre por ambiente externo.
- `service_role`, chaves Asaas, segredos R2, segredos de webhook e segredos OAuth ficam somente em Edge Functions, jobs administrativos ou secret stores server-side.
- Homologação deve usar Asaas Sandbox ou mocks. Operações financeiras reais não devem ser executadas em homologação ou desenvolvimento.
- Mudanças em banco e Edge Functions exigem PR, checks, revisão do diff e etapa explícita de aplicação/deploy. Migration aprovada no Git não significa aplicação automática em Cloud.
- Evidências privadas de segurança, contratos, MFA, painel Asaas, painel Supabase e inventário de fornecedores devem ser mantidas fora do repositório público.

## Famílias de Rotas Ativas

| Família | Exemplos de rotas | Status |
| --- | --- | --- |
| Auth | `/auth`, `/reset-password`, `/email-confirmed` | Ativo |
| App profissional | `/dashboard`, `/agenda`, `/pacientes`, `/notas`, `/financeiro/*`, `/ajustes`, `/teleconsulta` | Ativo |
| Portal do paciente | `/portal/*`, `/portal/convite/:token`, `/portal/ativar` | Ativo |
| Fluxos públicos/semi-públicos | `/confirmar-agendamento/:token`, `/join/:appointmentId`, `/payment/callback`, `/anamnese-externa/:id`, `/help` | Ativo |
| Avaliação oculta | `/neurozap`, `/teleconsulta-antiga`, `/notas-mobile-antiga` | Mantido intencionalmente, sem entrada na navbar |

## Legado a Remover ou Manter Removido

Estas superfícies são legado definitivo neste projeto:

- Stripe, Stripe Connect, Stripe Checkout, webhooks Stripe, funções Stripe de payout/conta e premissas pós-pagamento Stripe.
- C6 Bank e qualquer schema de pagamento/Pix/boleto/conta C6.
- Focus NFe e campos, funções, chaves de API ou UI específicos da Focus.
- Twilio SMS.
- ElevenLabs.
- MoltBook e Synapse Heartbeat.
- Exportação/sync Google Sheets. Google Calendar/Drive/Docs podem permanecer quando usados por integrações atuais.
- Páginas/rotas institucionais públicas: `/about`, `/blog`, `/careers`, `/neurobank`.
- Rotas e módulos de plano clínica: `/clinic-dashboard`, `/relatorios`, `reports/`, gestão de organização/equipe, relatórios de performance de clínica, automação mensal de relatório clínico.

Migrations históricas ainda podem mencionar provedores antigos porque o histórico de migrations é append-only. Código ativo, Edge Functions, config e documentação de produto não devem depender deles.

## Contratos Supabase e R2

- Credenciais R2 são secrets server-side de Edge Functions. Nunca devem aparecer em variáveis Vite/browser ou bundles frontend.
- Acesso a objetos R2 usa Edge Functions autenticadas para confirmação de upload, criação de URL de download e exclusão.
- Supabase Storage não é usado para documentos privados. O bucket ativo remanescente é `avatars` para imagens de perfil; buckets legados de sandbox, como `files_psico`, `chat_attachments` e `downloads`, foram removidos após validação/backfill R2.
- Edge Functions devem usar `verify_jwt = true` por padrão. Exceções devem ser classificadas explicitamente como webhook, callback OAuth, endpoint público de convite/disponibilidade ou endpoint de manutenção com segredo compartilhado próprio.
- Funções security-definer não devem virar APIs públicas acidentais. Preferir checagens de proprietário, grants restritos e validação por advisors.

## Contratos Financeiros e Fiscais

- Assinaturas profissionais da NeuroNex usam registros de checkout/subscription Asaas por `create-checkout-session`, `verify-checkout-session`, `asaas-webhook` e sync de entitlement.
- Contas/subcontas financeiras de psicólogos usam Asaas BaaS v3 por onboarding NeuroFinance e funções de sync de conta.
- Cobranças de pacientes usam criação/ações de pagamento NeuroFinance e `nb_payments` como fonte de verdade financeira para pagamentos respaldados pelo provedor.
- UI financeira, comprovantes e cobrança de pacientes devem tornar inequívoco o papel do Asaas. Usar marcas oficiais Asaas somente a partir de assets aprovados e manter NeuroFinance como marca de produto, não como substituto da atribuição ao provedor.
- Webhooks operacionais não são evidência de validação de saque por si só. Validação de saque deve ser confirmada pela configuração Asaas específica de webhook de saque ou por allowlist de IP da API.
- Emissão de NFS-e usa `asaas-invoices` e helpers Asaas NFS-e compartilhados. Colunas neutras de provedor devem usar `nfse_*`; colunas específicas Focus são legado.
- Relatórios de gestão financeira dentro de `/financeiro` são visões atuais de cashflow do psicólogo e não os antigos relatórios de Plano Clínica.

## Notas Atuais de Limpeza

- UI de clínica/equipe foi removida das configurações ativas. Qualquer produto futuro de clínica deve ser reconstruído a partir de novo design/schema.
- Automação mensal de relatório clínico foi removida da UI/functions ativas. Notas clínicas, prontuário, resumos e documentos de paciente continuam sendo produto central.
- Algumas tabelas financeiras ainda podem manter colunas dormentes de escopo `clinic_id` enquanto RLS e conciliação são simplificadas em migration futura dedicada. Não usar esses campos para novas features.
