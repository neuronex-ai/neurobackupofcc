# 🔧 Correções Necessárias no N8N Workflow

## Resumo do Problema

O workflow atual **não suporta multi-tenancy** (múltiplos psicólogos). Todas as mensagens são processadas sem distinção de qual profissional elas pertencem.

## Correções Passo a Passo

### 1️⃣ Extrair o `professionalId` do Webhook

Adicione um novo node **"Set"** logo após o Webhook chamado **"Extrair ProfessionalId"**:

```json
{
  "parameters": {
    "assignments": {
      "assignments": [
        {
          "name": "professionalId",
          "value": "={{ $json.query.professionalId }}",
          "type": "string"
        },
        {
          "name": "instance",
          "value": "={{ $json.body.instance }}",
          "type": "string"
        },
        {
          "name": "apikey",
          "value": "={{ $json.body.apikey }}",
          "type": "string"
        }
      ]
    }
  },
  "type": "n8n-nodes-base.set",
  "name": "Extrair ProfessionalId"
}
```

### 2️⃣ Atualizar o Node "Credenciais"

Adicione o `professionalId` às credenciais:

```javascript
// Adicione esta assignment ao node existente
{
  "name": "professionalId",
  "value": "={{ $item('Extrair ProfessionalId').json.professionalId }}",
  "type": "string"
}
```

### 3️⃣ Atualizar as Queries do Supabase

**Node: "Varredura no BD - Psicólogo Existe?"**
Mude de:
```
filter: remoteJid = {{ remoteJid }}
```
Para:
```
filter: remoteJid = {{ remoteJid }} AND professional_id = {{ professionalId }}
```

**Node: "Pegar mensagens por remoteJid"**
Mude de:
```
filter: remoteJid = {{ remoteJid }}
```
Para:
```
filter: remoteJid = {{ remoteJid }} AND professional_id = {{ professionalId }}
```

**Node: "Cria Psicólogo no BD"**
Adicione o campo:
```
professional_id: {{ professionalId }}
```

### 4️⃣ Atualizar o Node "Execute Action via Bridge"

O body já envia `remoteJid`, mas também devemos enviar o `professionalId` diretamente:

```json
{
  "action": "{{ $json.actions[0].action }}",
  "params": {{ JSON.stringify($json.actions[0].params) }},
  "professionalId": "{{ $node['Credenciais'].json['professionalId'] }}",
  "remoteJid": "{{ $node['Webhook'].json['body']['data']['key']['remoteJid'] }}"
}
```

---

## Verificação da Evolution API

Para que isso funcione, a Evolution API **DEVE** ser configurada para enviar webhooks com o `professionalId`.

A URL do webhook na Evolution deve ser:
```
https://webhook.dev.neuronex.site/webhook/neuronex?professionalId=UUID-DO-PSICOLOGO
```

### Verificar se está configurado corretamente:

1. Acesse a instância na Evolution API
2. Vá em Settings > Webhooks
3. Verifique se a URL inclui `?professionalId=UUID`

Se precisar reconfigurar, use a função `evolution-manager` do Supabase ou diretamente:

```bash
curl -X PUT "https://wsapi.dev.neuronex.site/webhook/set/INSTANCE_NAME" \
  -H "apikey: MANAGED" \
  -H "Content-Type: application/json" \
  -d '{
    "webhook": {
      "enabled": true,
      "url": "https://webhook.dev.neuronex.site/webhook/neuronex?professionalId=UUID-DO-PSICOLOGO",
      "byEvents": false,
      "webhookBase64": false,
      "events": ["MESSAGES_UPSERT", "MESSAGES_UPDATE", "CONNECTION_UPDATE"]
    }
  }'
```

---

## Tabelas Supabase Necessárias

### `whatsapp_professional_mapping`

Esta tabela mapeia o `remote_jid` de cada profissional para o seu `user_id`:

```sql
CREATE TABLE IF NOT EXISTS whatsapp_professional_mapping (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  remote_jid TEXT NOT NULL,
  instance_name TEXT NOT NULL,
  phone_number TEXT,
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(user_id),
  UNIQUE(remote_jid)
);

-- Index para buscas rápidas
CREATE INDEX idx_mapping_remote_jid ON whatsapp_professional_mapping(remote_jid);
CREATE INDEX idx_mapping_user_id ON whatsapp_professional_mapping(user_id);
```

### Adicionar `professional_id` às tabelas existentes

Se as tabelas do N8N (`base_leads_psicólogos`, `history_conversation_psychology`) ainda não tiverem `professional_id`:

```sql
ALTER TABLE base_leads_psicólogos ADD COLUMN IF NOT EXISTS professional_id UUID REFERENCES auth.users(id);
ALTER TABLE history_conversation_psychology ADD COLUMN IF NOT EXISTS professional_id UUID REFERENCES auth.users(id);

-- Indexes
CREATE INDEX idx_leads_professional ON base_leads_psicólogos(professional_id);
CREATE INDEX idx_history_professional ON history_conversation_psychology(professional_id);
```

---

## Fluxo Completo Após Correções

```
1. Psicólogo conecta WhatsApp
   └── evolution-manager cria instância
   └── evolution-manager configura webhook com professionalId

2. Paciente envia mensagem
   └── Evolution API → N8N (/webhook/neuronex?professionalId=UUID)
   └── N8N extrai professionalId do query param
   
3. N8N processa
   └── Busca histórico por remoteJid + professionalId
   └── Gemini processa com contexto
   └── Ações executadas via n8n-bridge com professionalId
   
4. N8N responde
   └── Evolution API envia para WhatsApp
   └── Histórico salvo com professionalId
```

---

## Teste Após Aplicar Correções

1. Verifique que o webhook está recebendo o `professionalId`:
   - No N8N, vá em "Executions"
   - Veja os dados do Webhook - deve aparecer `query.professionalId`

2. Teste enviar uma mensagem para o WhatsApp do psicólogo

3. Verifique no Supabase se as tabelas estão sendo populadas corretamente com `professional_id`
