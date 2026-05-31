# Guia Completo de Integrações: Google, Todoist, Notion e Microsoft To Do

Este guia detalha como configurar as integrações do NeuroNex com serviços externos.

## Visão Geral das Variáveis de Ambiente (Secrets)

No painel do Supabase (Project Settings > Edge Functions), você deve adicionar as seguintes variáveis:

| Serviço | Variável | Descrição |
| :--- | :--- | :--- |
| **Geral** | `FRONTEND_URL` | URL do seu frontend (ex: `http://localhost:5173` para dev, `https://neuronex.site` para prod). Usada para redirecionar o usuário após o OAuth. |
| **Google** | `GOOGLE_CLIENT_ID` | Client ID do Google Cloud Console. |
| | `GOOGLE_CLIENT_SECRET` | Client Secret do Google Cloud Console. |
| **Todoist** | `TODOIST_CLIENT_ID` | Client ID do painel de desenvolvedor do Todoist. |
| | `TODOIST_CLIENT_SECRET` | Client Secret do Todoist. |
| | `TODOIST_WEBHOOK_SECRET` | (Opcional) Secret para validar webhooks. |
| **Notion** | `NOTION_CLIENT_ID` | Client ID da integração Notion. |
| | `NOTION_CLIENT_SECRET` | Client Secret da integração Notion. |
| | `NOTION_WEBHOOK_SECRET` | (Opcional) Secret para validar chamadas de webhooks customizados. |
| **Microsoft** | `MICROSOFT_CLIENT_ID` | Application (client) ID do Azure Portal. |
| | `MICROSOFT_CLIENT_SECRET` | Client Secret (Value) do Azure Portal. |

---

## 1. Todoist

### Configuração no Todoist
1.  Acesse [Todoist App Console](https://developer.todoist.com/appconsole.html).
2.  Crie um novo App.
3.  **OAuth Redirect URL**:
    ```
    https://krewdaklcyzqfxkkgvqr.supabase.co/functions/v1/todoist-auth-callback
    ```
4.  Copie o Client ID e Client Secret para o Supabase.

### Webhook (Opcional)
-   **Webhook URL**:
    ```
    https://krewdaklcyzqfxkkgvqr.supabase.co/functions/v1/todoist-webhook
    ```
-   Eventos sugeridos: `item:completed`, `item:added`.

---

## 2. Notion

### Configuração no Notion
1.  Acesse [My Integrations](https://www.notion.so/my-integrations).
2.  Crie uma nova integração (Type: **Public** para OAuth).
3.  **Redirect URIs**:
    ```
    https://krewdaklcyzqfxkkgvqr.supabase.co/functions/v1/notion-auth-callback
    ```
4.  Copie o ID e Secret.
5.  **Webhook (Automação)**:
    -   Você pode usar o endpoint abaixo para receber notificações de automações (ex: *Make*, *Zapier*, *Notion Automations*):
        ```
        https://krewdaklcyzqfxkkgvqr.supabase.co/functions/v1/notion-webhook
        ```
    -   (Opcional) Envie o header `x-notion-secret` com o valor da sua variável `NOTION_WEBHOOK_SECRET` para segurança.

---

## 3. Microsoft To Do (Graph API)

### Configuração no Azure AD
1.  Acesse [Azure Portal > App Registrations](https://portal.azure.com/#view/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/~/RegisteredApps).
2.  "New Registration".
3.  **Supported account types**: "Accounts in any organizational directory (Any Microsoft Entra ID tenant - Multitenant) and personal Microsoft accounts (e.g. Skype, Xbox)".
4.  **Redirect URI** (Web):
    ```
    https://krewdaklcyzqfxkkgvqr.supabase.co/functions/v1/microsoft-auth-callback
    ```
5.  Em **Certificates & secrets**, crie um novo Client Secret.
6.  Em **API Permissions**, adicione: `Tasks.ReadWrite`, `User.Read`, `Offline_access`.

---

## 4. Google Drive

### Configuração no Google Cloud
1.  Verifique se a API Google Drive está ativada.
2.  **Authorized redirect URIs**:
    - Se usar o fluxo client-side do Supabase Auth (padrão): `https://krewdaklcyzqfxkkgvqr.supabase.co/auth/v1/callback`
    - Para as funções backend (`google-drive-files`), certifique-se de que os tokens de refresh estão sendo armazenados corretamente na tabela `user_google_tokens`.

---

## Comandos de Deploy

Execute no terminal para atualizar todas as funções:

```bash
npx supabase functions deploy google-drive-files --project-ref krewdaklcyzqfxkkgvqr
npx supabase functions deploy todoist-auth-init --project-ref krewdaklcyzqfxkkgvqr
npx supabase functions deploy todoist-auth-callback --project-ref krewdaklcyzqfxkkgvqr
npx supabase functions deploy todoist-webhook --project-ref krewdaklcyzqfxkkgvqr
npx supabase functions deploy notion-auth-init --project-ref krewdaklcyzqfxkkgvqr
npx supabase functions deploy notion-auth-callback --project-ref krewdaklcyzqfxkkgvqr
npx supabase functions deploy notion-webhook --project-ref krewdaklcyzqfxkkgvqr
npx supabase functions deploy microsoft-auth-init --project-ref krewdaklcyzqfxkkgvqr
npx supabase functions deploy microsoft-auth-callback --project-ref krewdaklcyzqfxkkgvqr
```

## Tabelas do Banco de Dados

As seguintes tabelas são necessárias (já criadas via migração automática, mas para referência):
-   `public.user_todoist_tokens`
-   `public.user_notion_tokens`
-   `public.user_microsoft_tokens`
-   `public.user_google_tokens`
