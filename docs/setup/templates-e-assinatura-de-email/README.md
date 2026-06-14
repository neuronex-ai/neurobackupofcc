# Kit de e-mails NeuroNex

Identidade visual aplicada:
- Ônix: `#09090B`
- Branco cerâmico: `#FFFFFF`
- Fundo neutro: `#F4F4F5`
- Bordas: `#E4E4E7`
- Acento violeta discreto: `#8B5CF6`
- Largura: 600 px
- HTML em tabelas e CSS inline para maior compatibilidade entre clientes de e-mail.

## Arquitetura de remetentes recomendada

Use um único subdomínio de envio: `email.neuronex.site`.

- Autenticação e segurança: `NeuroNex Segurança <seguranca@email.neuronex.site>`
- Notificações operacionais: `NeuroNex <notificacoes@email.neuronex.site>`
- Financeiro: `NeuroFinance <financeiro@email.neuronex.site>`
- Comunicação humana: `Equipe NeuroNex <contato@email.neuronex.site>`
- Reply-To padrão: `contato@email.neuronex.site`

Não é necessário criar um subdomínio diferente para cada finalidade nesta fase. Diferentes endereços no mesmo subdomínio mantêm a organização sem fragmentar desnecessariamente a reputação de envio.

## Importante: Supabase x Resend

Há duas arquiteturas possíveis:

1. Integração SMTP/nativa: o Resend transporta as mensagens, mas os templates de Auth continuam configurados no Supabase.
2. Supabase Auth Hook + API do Resend: os templates podem ficar publicados no Resend e ser chamados por ID.

Os arquivos em `01-auth-supabase` usam as variáveis nativas do Supabase.
Os arquivos em `02-operacionais-resend` usam variáveis do Resend com sintaxe `{{{VARIABLE}}}`.

## Templates de autenticação

| # | Uso | Arquivo | Assunto sugerido |
|---|---|---|---|
| 01 | Confirmação de e-mail | `01-confirmacao-de-email.html` | `Confirme seu e-mail para ativar sua conta NeuroNex` |
| 02 | Convite de usuário | `02-convite-de-usuario.html` | `Você recebeu um convite para acessar a NeuroNex` |
| 03 | Redefinição de senha | `03-redefinicao-de-senha.html` | `Redefinição de senha solicitada` |
| 04 | Link mágico | `04-link-magico.html` | `Seu acesso seguro à NeuroNex` |
| 05 | Confirmação de alteração de e-mail | `05-alteracao-de-email.html` | `Confirme seu novo endereço de e-mail` |
| 06 | Código de reautenticação | `06-reauthentication-code.html` | `{{ .Token }} é seu código de verificação NeuroNex` |
| 07 | Senha alterada | `07-senha-alterada.html` | `Sua senha da NeuroNex foi alterada` |
| 08 | E-mail alterado | `08-email-alterado.html` | `O e-mail da sua conta NeuroNex foi alterado` |
| 09 | Telefone alterado | `09-telefone-alterado.html` | `O telefone da sua conta NeuroNex foi alterado` |
| 10 | MFA adicionado | `10-mfa-adicionado.html` | `Um novo método de verificação foi adicionado` |
| 11 | MFA removido | `11-mfa-removido.html` | `Um método de verificação foi removido` |
| 12 | Identidade vinculada | `12-identidade-vinculada.html` | `Um novo método de login foi vinculado` |
| 13 | Identidade desvinculada | `13-identidade-desvinculada.html` | `Um método de login foi removido` |

## Templates operacionais

| # | Uso | Arquivo | Variáveis |
|---|---|---|---|
| 01 | Boas-vindas | `01-boas-vindas.html` | `RECIPIENT_NAME`, `ACTION_URL` |
| 02 | Convite para paciente | `02-convite-paciente.html` | `PATIENT_NAME`, `PROFESSIONAL_NAME`, `SECURITY_CODE`, `ACTION_URL` |
| 03 | Agendamento confirmado | `03-agendamento-confirmado.html` | `RECIPIENT_NAME`, `APPOINTMENT_DATE`, `APPOINTMENT_TIME`, `PROFESSIONAL_NAME`, `APPOINTMENT_MODE`, `ACTION_URL` |
| 04 | Lembrete de agendamento | `04-lembrete-agendamento.html` | `RECIPIENT_NAME`, `TIME_UNTIL`, `APPOINTMENT_DATE`, `APPOINTMENT_TIME`, `ACTION_URL` |
| 05 | Agendamento cancelado | `05-agendamento-cancelado.html` | `RECIPIENT_NAME`, `APPOINTMENT_DATE`, `APPOINTMENT_TIME`, `CANCELLATION_MESSAGE`, `ACTION_URL` |
| 06 | Pagamento confirmado | `06-pagamento-confirmado.html` | `RECIPIENT_NAME`, `PAYMENT_AMOUNT`, `PAYMENT_REFERENCE`, `PAYMENT_DATE`, `ACTION_URL` |
| 07 | Cobrança próxima do vencimento | `07-cobranca-proxima-do-vencimento.html` | `RECIPIENT_NAME`, `PAYMENT_AMOUNT`, `PAYMENT_DUE_DATE`, `PAYMENT_DESCRIPTION`, `ACTION_URL` |
| 08 | Documento disponível | `08-documento-disponivel.html` | `RECIPIENT_NAME`, `PROFESSIONAL_NAME`, `DOCUMENT_NAME`, `ACTION_URL` |
| 09 | Novo login detectado | `09-novo-login.html` | `LOGIN_DATE`, `DEVICE_NAME`, `APPROXIMATE_LOCATION`, `ACTION_URL` |

## Assinatura

A pasta `03-assinatura` contém:
- `assinatura-neuronex.html`: versão recomendada, acessível e com links clicáveis.
- `assinatura-neuronex-preview.png`: prévia visual em imagem.

Dados ainda necessários para finalizar a assinatura:
- Razão social
- CNPJ
- Telefone com DDD
- Endereço comercial completo
- Confirmação do site principal: `neuronex.site` ou `neuronexai.com.br`

## Logo

Os templates apontam temporariamente para:
`https://neuronex.site/favicon-light.png`

Antes da publicação, confirme que essa URL exibe a versão branca/transparente da logo. Caso contrário, hospede `assets/neuronex-logo-white.png` em uma URL pública e substitua o endereço nos arquivos.

## Observações de privacidade

Os modelos de agenda, documentos e notificações evitam exibir diagnóstico, conteúdo clínico, nome completo de paciente em tela bloqueada ou outras informações sensíveis. Os links devem direcionar para área autenticada sempre que o conteúdo for confidencial.
