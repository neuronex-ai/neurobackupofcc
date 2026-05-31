

# Implementação

Um guia de implementação para auxiliar na integração com a API de autorizações na jornada 3.

### 1. Criar uma autorização com QR Code imediato

A criação da autorização é o primeiro passo. Você fará uma chamada na nossa API para gerar um QR Code que já contém os dados da primeira cobrança e da autorização de recorrência.

> Veja a referência completa do endpoint: [Criar autorização com QR Code imediato](https://docs.asaas.com/reference/criar-uma-autorizacao-pix-automatico)

Ao consumir esse endpoint, será gerado um código "copia e cola" (`payload`) que deve ser apresentado ao seu cliente (o pagador).

No retorno da chamada, o campo `immediateQrCode` virá acompanhado de um `conciliationIdentifier`. Este mesmo identificador será incluído na cobrança correspondente quando o pagamento for liquidado, permitindo que você concilie a autorização original com o pagamento de forma segura.

Você também receberá o `id` da autorização. **Armazene este `id`**, pois ele será essencial para criar as cobranças futuras e para acompanhar os webhooks.

> ❗️ **Webhooks**
>
> O Asaas disponibiliza webhooks para que sua aplicação seja notificada em tempo real sobre todo o fluxo de instrução e autorização de pagamentos. Veja os exemplos e eventos disponíveis na seção de [eventos de webhook do Pix Automático.](https://docs.asaas.com/docs/eventos-para-pix-autom%C3%A1tico)

### 2. Criar as cobranças recorrentes

Com a autorização no status `ACTIVE`, sua aplicação já pode começar a criar as cobranças periódicas no Asaas. O débito será realizado automaticamente na conta do pagador na data de vencimento.

Para isso, utilize a API de criação de cobranças, informando o novo campo `pixAutomaticAuthorizationId` dentro do objeto principal, com o identificador da autorização obtido no primeiro passo.

> Veja a referência completa do endpoint: \[[Criar cobrança com Pix Automático](https://docs.asaas.com/reference/criar-nova-cobranca)]

> 📘 **Intervalo antes do vencimento**
>
> A criação da instrução de pagamento deve respeitar um intervalo de 2 a 10 dias úteis antes do vencimento da cobrança. Caso sua aplicação tente gerar a cobrança antes desse prazo, a API devolverá exceção.