# Synapse Text com NVIDIA Nemotron 3 Ultra

O Synapse de texto usa um único backend autenticado para desktop e mobile. O endpoint legado `gemini-text-chat` permanece como alias de compatibilidade e encaminha as mensagens para `synapse-text-fallback`.

## Secrets do Supabase

Adicione em **Project Settings → Edge Functions → Secrets**:

```text
NVIDIA_API_KEY=<chave gerada no NVIDIA Build>
NVIDIA_SYNAPSE_MODEL=nvidia/nemotron-3-ultra-550b-a55b
SYNAPSE_TEXT_PROVIDER=nvidia
```

`NVIDIA_SYNAPSE_MODEL` e `SYNAPSE_TEXT_PROVIDER` são opcionais porque esses já são os valores padrão. A chave nunca deve ser adicionada ao frontend, GitHub, arquivos `.env` versionados ou variáveis `VITE_*`.

Se a NVIDIA estiver temporariamente indisponível, o agente usa Groq quando `GROQ_API_KEY` estiver configurada. A resposta da função informa `provider` e `model` para diagnóstico.

## Componentes envolvidos

- `supabase/functions/synapse-text-fallback/index.ts`: agente unificado e memória da conversa.
- `provider.ts`: NVIDIA primária e fallback Groq.
- `tools-v3.ts`: catálogo operacional.
- `executor-v3.ts`: pacientes, agenda, comunicações, NeuroFinance e NFS-e.
- `entity-context.ts`: resolução de paciente/consulta sem pedir IDs.
- `gemini-text-chat/index.ts`: alias para clientes desktop/mobile existentes.
- `20260620120000_synapse_conversation_context.sql`: contexto durável por conversa.

## Teste rápido

Execute na mesma conversa:

1. `Procure a paciente Ana e me diga quando é a próxima consulta dela.`
2. `Agora envie um lembrete por e-mail para ela.`
3. Confirme somente depois que o Synapse apresentar o resumo da ação.

Memória:

1. `Meu foco desta semana é reduzir faltas.`
2. `Qual foi o foco que eu acabei de mencionar?`

NeuroFinance:

1. `Minha conta NeuroFinance está ativa?`
2. `Quanto tenho disponível e quanto ainda vai liberar?`
3. `Mostre minhas últimas cobranças pagas.`

Fiscal:

1. `Liste minhas últimas notas fiscais.`
2. `Quero emitir uma NFS-e de R$ 150 para Ana por sessão de psicoterapia.`
3. Confirme somente após revisar paciente, valor e descrição.

Agenda:

1. `Quais horários tenho livres na próxima terça?`
2. `Agende Ana às 14h por 50 minutos.`
3. `Remarque a consulta dela para 15h.`
4. `Cancele a consulta e envie o aviso por e-mail.`

## Segurança operacional

- Leituras usam dados da conta autenticada.
- IDs internos nunca devem ser solicitados ou exibidos.
- Escritas, cobranças, emissões fiscais e envios exigem confirmação em uma mensagem separada.
- Solicitar uma NFS-e não equivale a autorização municipal.
- Se não houver conta NeuroFinance, o agente informa o estágio real de ativação em vez de inventar saldo.
