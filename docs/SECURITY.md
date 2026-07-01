# Postura de Segurança para Repositório Público

Última atualização: 2026-06-30

O projeto deve permanecer seguro mesmo com o código-fonte visível. Este documento é público e sanitizado: não deve conter contratos privados, credenciais, tokens, dados clínicos, payloads financeiros, IDs internos sensíveis ou evidências administrativas completas.

## Regras Não Negociáveis

- Nunca confiar em guards de rota no frontend, botões ocultos, browser storage ou checagens de papel feitas no cliente.
- Manter `service_role`, chaves de provedores, credenciais R2, segredos de webhook, segredos OAuth e chaves de assinatura somente em secret stores server-side.
- Manter o R2 como object store privado para documentos de pacientes/profissionais. O Supabase armazena metadados relacionais e estado de autorização.
- Edge Functions do Supabase devem usar `verify_jwt = true` por padrão. Exceções públicas precisam ser intencionais: webhook, callback OAuth, fluxo público de convite/token, consulta de disponibilidade ou endpoint de manutenção protegido por segredo próprio.
- NeuroFinance pode permanecer como marca de produto/interface, mas fluxos financeiros devem identificar claramente o Asaas como instituição/prestador responsável por contas, recursos, Pix, boleto, cartão, saque e operações financeiras relacionadas. A NeuroNex é a plataforma tecnológica e não deve ser descrita como banco ou instituição de pagamento.
- Contas de pacientes e profissionais devem permanecer separadas. A autorização no backend deve impor essa separação mesmo que um usuário chame APIs manualmente.
- Funções `SECURITY DEFINER` devem ter `search_path` fixo, checagens explícitas de proprietário ou token e grants de `EXECUTE` restritos.
- Buckets públicos não podem permitir listagem ampla de objetos. Documentos privados de pacientes não devem usar URLs públicas do Supabase Storage.

## Fontes de Verdade Atuais

- Frontend: `src`
- Supabase Edge Functions: `supabase/functions`
- Migrations Supabase: `supabase/migrations`
- Fluxo R2 de documentos: Edge Function `r2-create-upload-url` e metadados em `document_files`
- Provedor financeiro: Asaas BaaS v3 por meio do NeuroFinance

## Transparência Asaas BaaS

- Usar atribuição clara ao Asaas em onboarding, telas financeiras, termos, contratos, links de pagamento, Pix/boleto/cartão, saques, comprovantes e cobrança de pacientes quando serviços financeiros forem apresentados.
- Não usar textos que ocultem, minimizem ou confundam o papel do Asaas. NeuroFinance é a experiência de produto; Asaas é o prestador contratado dos serviços financeiros.
- Demandas de clientes sobre serviços financeiros contratados devem ser encaminhadas ao Asaas sem atraso indevido, conforme procedimento interno de suporte.
- Incidentes relevantes que afetem serviços Asaas BaaS devem ser comunicados ao Asaas imediatamente e em no máximo 24 horas.
- Não habilitar antecipação de recebíveis nem outro provedor para os mesmos serviços BaaS contratados sem confirmação de gestão/jurídico.

## Provedores Legados Que Não Devem Retornar

Stripe, C6, Focus NFe, Twilio, ElevenLabs, MoltBook, Synapse Heartbeat e Google Sheets são legado. Não adicionar código, tabelas, funções, documentação ou UI ativa para esses provedores.

## Critérios Públicos de Release e CI

Toda mudança deve entrar por Pull Request. A `main` não deve receber commit direto de trabalho de produto, segurança ou infraestrutura. Antes de merge, os checks obrigatórios devem passar:

- TypeScript: `npx tsc -p tsconfig.app.json --noEmit`.
- Testes automatizados: `npm test -- --reporter=dot`.
- Build de produção: `npm run build`.
- Auditoria de dependências: `npm audit --audit-level=high`.
- Varredura de secrets: Gitleaks.

Vulnerabilidades `critical` ou `high` bloqueiam release. Exceções só podem existir quando forem falso positivo ou dependência sem caminho de exploração aplicável, com justificativa registrada, responsável, prazo de revisão e sem enfraquecer o check global.

Descoberta real de secret bloqueia merge e exige contenção fora do repositório: revogação/rotação pelo gestor autorizado, análise de exposição e registro de incidente quando aplicável.

## Separação de Ambientes

- Produção, homologação/sandbox e desenvolvimento local devem usar variáveis externas ao código.
- O frontend não deve conter fallback de URL/chave do Supabase nem secrets de provedores.
- Homologação deve usar Asaas Sandbox ou mocks, nunca credenciais de produção.
- Evidências privadas de ambiente, MFA, contratos, IDs internos e registros operacionais devem ficar fora do repositório público.

## Regras de Secrets Server-side

- Secrets só podem ser lidos por Edge Functions, jobs administrativos ou ambiente de deploy autorizado.
- `service_role` nunca pode aparecer em `src/`, bundle frontend, logs de CI ou documentação pública com valor real.
- Chaves Asaas, R2 e webhooks não podem ser selecionadas, retornadas ou logadas em fluxos de navegador.
- Logs devem registrar contexto operacional mínimo, sem payload clínico, tokens, credenciais ou dados financeiros sensíveis.

## Reporte Público de Segurança

Relatos de vulnerabilidade devem ser enviados por canal privado oficial da NeuroNex, sem abrir issue pública com dados sensíveis. O relato deve conter impacto, passos de reprodução sanitizados e ambiente afetado. Não incluir dados clínicos reais, credenciais, tokens, dumps, capturas com informações pessoais completas ou payloads financeiros. A triagem deve priorizar risco a pacientes, profissionais, autenticação, RLS, credenciais, pagamentos e disponibilidade.

## Antes de Mesclar Trabalho Sensível

Executar:

```bash
npx tsc -p tsconfig.app.json --noEmit
npm test -- --reporter=dot
npm run build
npm audit --audit-level=high
```

Para mudanças Supabase, verificar também o estado Cloud relevante por meio autorizado, sem imprimir dados de pacientes, tokens, chaves ou credenciais.
