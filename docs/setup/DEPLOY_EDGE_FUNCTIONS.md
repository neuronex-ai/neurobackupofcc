# 🚀 Deploy das Edge Functions - NeuroZap

## ⚠️ PROBLEMA ATUAL
As Edge Functions `whatsapp-sync` e `whatsapp-send` estão com versões desatualizadas na Supabase.
O deploy automático via MCP está falhando com erro interno.

## 📋 SOLUÇÃO: Deploy via Supabase Dashboard

### Método 1: Via Supabase CLI (Recomendado)

**1. Instale o Supabase CLI** (se ainda não tiver):
```powershell
npm install -g supabase
```

**2. Faça login na Supabase:**
```powershell
supabase login
```

**3. Navegue até a pasta do projeto:**
```powershell
cd "c:\Users\Administrator\dyad-apps\neuronex sem landing"
```

**4. Faça o deploy das funções:**
```powershell
supabase functions deploy whatsapp-sync --project-ref krewdaklcyzqfxkkgvqr
supabase functions deploy whatsapp-send --project-ref krewdaklcyzqfxkkgvqr
```

---

### Método 2: Deploy Manual pelo Dashboard

**1. Acesse o Dashboard da Supabase:**
https://supabase.com/dashboard/project/krewdaklcyzqfxkkgvqr/functions

**2. Para CADA função (`whatsapp-sync` e `whatsapp-send`):**
   - Clique na função existente
   - Clique em "Edit Function" ou crie uma nova versão
   - Copie o código completo do arquivo local correspondente

**3. Arquivos locais:**
   - `whatsapp-sync`: `supabase/functions/whatsapp-sync/index.ts`
   - `whatsapp-send`: `supabase/functions/whatsapp-send/index.ts`

---

## 🔧 O QUE FOI CORRIGIDO NO CÓDIGO LOCAL

### `whatsapp-send/index.ts`:
- ✅ Removido comentário duplicado "// Evolution API Configuration"
- ✅ Adicionado N8N_API_KEY para autenticação
- ✅ Header Authorization no webhook do N8N

### `whatsapp-sync/index.ts`:
- ✅ Validações robustas para chats e mensagens
- ✅ Try/catch em loops para evitar crashes
- ✅ Logs detalhados para debugging

---

## 🎨 INTERFACE ATUALIZADA

O arquivo `src/pages/WhatsAppAgent.tsx` foi completamente redesenhado com:

- ✅ Design ultra-premium com gradientes e glassmorphism
- ✅ Fotos de perfil do WhatsApp sincronizadas
- ✅ Sistema de etiquetas coloridas (lead, paciente, urgente, etc.)
- ✅ Indicadores de status de mensagem (enviado, entregue, lido)
- ✅ Layout responsivo para mobile
- ✅ Animações suaves com Framer Motion
- ✅ Toggle de IA mais intuitivo

---

## 🔍 VERIFICANDO SE DEU CERTO

Após o deploy, verifique os logs em:
https://supabase.com/dashboard/project/krewdaklcyzqfxkkgvqr/logs/edge-logs

Procure por:
- Status 200 nas chamadas de `whatsapp-sync` e `whatsapp-send`
- Logs "Message sent successfully" quando enviar mensagens
- Logs "N8N notified successfully" quando a IA é acionada

---

## 📞 TESTE RÁPIDO

1. Abra o NeuroZap no navegador
2. Clique no botão de sincronizar (⟳)
3. Selecione uma conversa
4. Envie uma mensagem de teste
5. Verifique se aparece no WhatsApp do destinatário
