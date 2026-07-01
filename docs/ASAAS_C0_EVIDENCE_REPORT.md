# Relatório C0 de Evidências Asaas BaaS

Última atualização: 2026-06-30

Este relatório é público e sanitizado. Ele não contém contratos privados, credenciais, IDs de usuários, dados clínicos, payloads financeiros, capturas internas, evidências de MFA, tokens ou chaves.

## Escopo

- Fechamento documental e evidências públicas do questionário Asaas BaaS.
- Revisão de documentação, CI, migrations financeiras, Edge Functions Asaas, uso de `service_role`, exposição de credenciais no frontend, logs e controles de auditoria.
- Criação de checks estáticos somente de leitura para reduzir risco de regressão em repositório público.

## Limites Aplicados

- Nenhuma migration foi aplicada.
- Nenhuma Edge Function foi publicada.
- Nenhum secret foi lido, impresso, alterado ou rotacionado.
- Nenhum projeto Supabase Cloud, Vercel produção ou Produção Candidata foi alterado.
- Nenhum dado real de paciente, contrato privado ou payload financeiro foi incluído.

## Controles Comprovados Publicamente

- PR e CI: `.github/workflows/validate-main.yml` executa typecheck, testes, build, `npm audit --audit-level=high` e Gitleaks.
- Secrets no frontend: existe teste estático que bloqueia `service_role`, nomes de chaves Asaas, imports de secrets server-side em `src/` e selects de `asaas_api_key` no frontend.
- Convites e e-mails: existe teste estático que bloqueia `localhost` em templates de e-mail/convite auditados.
- Separação Asaas/NeuroFinance: `docs/SECURITY.md` e `docs/ARCHITECTURE.md` declaram que NeuroFinance é a interface de produto e que Asaas deve ser identificado como prestador dos serviços financeiros.
- Armazenamento privado: documentação pública define R2 como object store privado e Supabase como metadados/autorização.

## Controles Parciais

- Migrations de hardening BaaS existem localmente, mas dependem de aprovação para aplicação Cloud.
- Edge Functions Asaas usam backend server-side, mas algumas rotas ainda precisam de validação pós-deploy em ambiente aprovado.
- Validação de saque depende de confirmação manual no painel Asaas: webhook específico de saque ou IP allowlist da API.
- MFA e leaked-password protection dependem de evidência administrativa sanitizada, fora do repositório.
- Branch protection/rulesets dependem de evidência das configurações GitHub, fora do repositório.

## Evidências Privadas Que Devem Permanecer Fora do Git

- Contrato BaaS e anexos.
- Capturas de MFA e usuários administrativos.
- Capturas de branch protection/rulesets.
- Evidências de painel Asaas sobre validação de saque ou IP allowlist.
- Registro mensal de reclamações, prazo de resposta e disponibilidade.
- Inventário privado de fornecedores.
- Registros de backup/restauração.
- Registros de rotação/revogação de secrets.
- Evidências com e-mails completos, IDs internos ou dados financeiros.

## Migrations Necessárias Depois

- `20260630082958_baas_private_credentials_and_financial_rls.sql`: remove credencial Asaas do schema exposto, cria estrutura privada, restringe grants e endurece RLS financeira.
- `20260630083030_baas_contract_acceptances.sql`: registra aceite contratual server-side, versões/referências de termos e consentimento específico quando aplicável.

Essas migrations devem ser aplicadas apenas em ambiente aprovado, com backup, janela de rollback e validação de Edge Functions. Não foram aplicadas nesta rodada C0.

## Edge Functions Que Precisam de Validação/Deploy Posterior

- Fluxos Asaas/NeuroFinance: `asaas-account-sync`, `asaas-connect-onboarding`, `asaas-create-payment`, `asaas-payment-actions`, `asaas-payout`, `asaas-pix`, `asaas-pix-out`, `asaas-pix-payment`, `asaas-bill-payment`, `asaas-invoices`, `asaas-webhook`, `base-asaas-webhook`, `create-checkout-session`, `verify-checkout-session`, `neurofinance-post-onboarding`.
- Fluxos do portal do paciente impactados pela correção P0: `patient-portal-current`, `patient-portal-auth`, `patient-portal-activate`, `patient-portal-invite-preview`, `create-patient-portal-invite`.

Deploy deve ocorrer somente após aprovação explícita, em ambiente correto e sem alterar produção por acidente.

## Riscos

- Aplicar hardening financeiro sem deploy coordenado das Edge Functions pode quebrar onboarding, sync de conta, cobrança, saque ou leitura financeira.
- Manter credenciais Asaas em estrutura legada aumenta risco até a migration P0 ser aplicada e a rotação posterior ser concluída.
- Marcar controles Asaas como plenamente comprovados sem evidência privada de painel, MFA, branch protection e validação de saque cria risco documental.
- Falhas de dependência com severidade alta/crítica bloqueiam release até correção, falso positivo documentado ou decisão formal de aceite de risco.

## Rollback

- Documentação/checks: reverter o commit C0.
- Workflow: restaurar versão anterior de `.github/workflows/validate-main.yml`.
- Testes estáticos: remover `src/lib/__tests__/security-static-contracts.test.ts`.
- Migrations futuras: cada aplicação Cloud deve ter rollback próprio antes da execução; esta C0 não aplicou nenhuma migration.
- Edge Functions futuras: manter versão anterior implantável e registrar o bundle/commit em uso antes de publicar nova versão.

## Testes e Checks Esperados

- `npx tsc -p tsconfig.app.json --noEmit`
- `npm test -- --reporter=dot`
- `npm run build`
- `npm audit --audit-level=high`
- Gitleaks em CI
- Teste estático local: `src/lib/__tests__/security-static-contracts.test.ts`

## Pendências do Gestor

- Confirmar evidência de MFA para administradores sem expor fatores ou usuários.
- Confirmar leaked-password protection no Supabase Auth.
- Confirmar branch protection/ruleset e checks obrigatórios no GitHub.
- Confirmar validação de saque no Asaas por webhook específico ou IP allowlist.
- Aprovar aplicação das migrations BaaS e deploy coordenado das Edge Functions.
- Aprovar comunicação/termos que identifiquem o Asaas nos fluxos financeiros.

## Classificação C0

GO para revisão da PR documental e dos checks estáticos.

NO-GO para produção até que evidências privadas, migrations aprovadas, deploys aprovados e validações em ambiente correto sejam concluídos.
