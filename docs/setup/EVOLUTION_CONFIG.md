# Configuração da Evolution API para NeuroZap

## Visão Geral

Para que o NeuroZap funcione corretamente e sincronize as conversas, a Evolution API precisa estar configurada para:

1. **Armazenar histórico de mensagens** (Store)
2. **Enviar webhooks** para o N8N
3. **Permitir busca de chats e mensagens**

---

## Passo 1: Acessar o Manager da Evolution

Acesse: `https://wsapi.dev.neuronex.site/manager`

Use a API Key global: `429683C4C977415CAAFCCE10F7D57E11`

---

## Passo 2: Configurar Store (Histórico)

A Evolution API precisa estar configurada para salvar mensagens. Isso é feito na criação da instância ou pode ser atualizado.

### Via API (recomendado):

```bash
curl -X POST "https://wsapi.dev.neuronex.site/store/set/SUA_INSTANCIA" \
  -H "apikey: 429683C4C977415CAAFCCE10F7D57E11" \
  -H "Content-Type: application/json" \
  -d '{
    "messageUpTimestamp": true,
    "messagesDelete": true,
    "chatsDelete": true
  }'
```

### O que cada opção significa:
- `messageUpTimestamp`: Atualiza timestamp ao sincronizar mensagens
- `messagesDelete`: Mantém histórico mesmo após deletar do celular
- `chatsDelete`: Mantém chats mesmo após arquivar

---

## Passo 3: Configurar Webhook (AUTOMÁTICO)

O webhook é configurado **automaticamente** pelo NeuroNex quando você conecta via QR Code. 

### Configuração Automática Inclui:

- **URL Dinâmica**: `https://webhook.dev.neuronex.site/webhook/neuronex/{professionalId}`
- **Base64 Habilitado**: Para receber mídias (imagens, áudios, documentos)
- **Headers Customizados**: `X-Instance-Name`, `X-Professional-Id`

### Eventos Habilitados Automaticamente:

```json
[
  "APPLICATION_STARTUP",
  "QRCODE_UPDATED", 
  "CONNECTION_UPDATE",
  "MESSAGES_SET",
  "MESSAGES_UPSERT",
  "MESSAGES_UPDATE",
  "MESSAGES_DELETE",
  "SEND_MESSAGE",
  "CONTACTS_SET",
  "CONTACTS_UPSERT",
  "CONTACTS_UPDATE",
  "CHATS_SET",
  "CHATS_UPSERT",
  "CHATS_UPDATE",
  "CHATS_DELETE",
  "GROUPS_UPSERT",
  "GROUP_UPDATE",
  "GROUP_PARTICIPANTS_UPDATE",
  "LABELS_EDIT",
  "LABELS_ASSOCIATION",
  "PRESENCE_UPDATE",
  "CALL"
]
```

### Reconfigurar Webhook Manualmente (se necessário):

```bash
curl -X POST "https://wsapi.dev.neuronex.site/webhook/set/SUA_INSTANCIA" \
  -H "apikey: 429683C4C977415CAAFCCE10F7D57E11" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://webhook.dev.neuronex.site/webhook/neuronex/SEU_USER_ID",
    "webhook_by_events": false,
    "enabled": true,
    "base64": true,
    "events": ["MESSAGES_UPSERT", "MESSAGES_UPDATE", "CONNECTION_UPDATE", ...]
  }'
```

### Configurar no N8N:

1. Crie um webhook node com path dinâmico: `/neuronex/:professionalId`
2. O `professionalId` será extraído automaticamente da URL
3. Use esse ID para identificar qual psicólogo está recebendo a mensagem

---

## Passo 4: Endpoints Disponíveis para Sync

### Buscar todos os chats:

```bash
curl -X POST "https://wsapi.dev.neuronex.site/chat/findChats/SUA_INSTANCIA" \
  -H "apikey: 429683C4C977415CAAFCCE10F7D57E11" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Buscar mensagens de um chat:

```bash
curl -X POST "https://wsapi.dev.neuronex.site/chat/findMessages/SUA_INSTANCIA" \
  -H "apikey: 429683C4C977415CAAFCCE10F7D57E11" \
  -H "Content-Type: application/json" \
  -d '{
    "where": {
      "key": {
        "remoteJid": "5511999999999@s.whatsapp.net"
      }
    },
    "limit": 50
  }'
```

### Enviar mensagem:

```bash
curl -X POST "https://wsapi.dev.neuronex.site/message/sendText/SUA_INSTANCIA" \
  -H "apikey: 429683C4C977415CAAFCCE10F7D57E11" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "5511999999999",
    "text": "Olá! Esta é uma mensagem de teste."
  }'
```

---

## Passo 5: Verificar Status da Instância

```bash
curl -X GET "https://wsapi.dev.neuronex.site/instance/connectionState/SUA_INSTANCIA" \
  -H "apikey: 429683C4C977415CAAFCCE10F7D57E11"
```

Resposta esperada quando conectado:
```json
{
  "instance": {
    "instanceName": "SUA_INSTANCIA",
    "state": "open"
  }
}
```

---

## Troubleshooting

### Conversas não aparecem após sync

1. **Verifique se o Store está habilitado**
   - Acesse o Manager e verifique as configurações da instância
   
2. **Verifique se a instância está conectada**
   - Chame o endpoint `connectionState` e verifique se `state` é `open`

3. **Tente reconectar**
   - Desconecte e conecte novamente via QR Code

### Mensagens novas não chegam

1. **Verifique o webhook**
   - Use o endpoint `webhook/find` para ver a configuração atual
   
2. **Verifique os logs do N8N**
   - Acesse o painel do N8N e veja se os webhooks estão chegando

3. **Teste o webhook manualmente**
   - Use o Postman ou curl para enviar um POST para a URL do webhook

### QR Code expira muito rápido

- Isso é normal! QR Codes do WhatsApp expiram em ~45 segundos
- O NeuroNex já tem auto-refresh implementado

---

## Dica: Forçar Sync no Frontend

Após conectar, clique no botão de **sincronizar** (ícone de refresh) na lista de conversas do NeuroZap. Isso vai chamar a Edge Function `whatsapp-sync` que:

1. Busca todos os chats da Evolution API
2. Busca as últimas 20 mensagens de cada chat
3. Salva tudo no Supabase NeuroNex
4. Atualiza a interface automaticamente
