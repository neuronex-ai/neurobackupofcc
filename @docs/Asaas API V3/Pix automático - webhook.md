

# Fluxos de Webhook

<br />

Como funciona o fluxo do Webhook do Pix Automático?

*Veja mais detalhes sobre o fluxo de webhooks em recebimentos de Pix Automático no Asaas:*

### **Autorizações**

QR Code imediato criado, pagamento efetuado e autorização concedida:

*PIX\_AUTOMATIC\_RECURRING\_AUTHORIZATION\_CREATED > PAYMENT\_CREATED > PAYMENT\_RECEIVED > PIX\_AUTOMATIC\_RECURRING\_AUTHORIZATION\_ACTIVATED*

QR Code imediato criado, pagamento efetuado e autorização concedida e expirada (passou do prazo de vigência estipulada pelo cliente Asaas em finishDate:

*PIX\_AUTOMATIC\_RECURRING\_AUTHORIZATION\_CREATED > PAYMENT\_CREATED > PAYMENT\_RECEIVED > PIX\_AUTOMATIC\_RECURRING\_AUTHORIZATION\_ACTIVATED > PIX\_AUTOMATIC\_RECURRING\_AUTHORIZATION\_EXPIRED*

QR Code imediato criado e expirado (pagamento não efetuado e autorização não efetuada):

*PIX\_AUTOMATIC\_RECURRING\_AUTHORIZATION\_CREATED > PIX\_AUTOMATIC\_RECURRING\_AUTHORIZATION\_REFUSED*

QR Code imediato criado, pagamento efetuado, autorização concedida, e cancelamento feito pelo pagador:

*PIX\_AUTOMATIC\_RECURRING\_AUTHORIZATION\_CREATED > PAYMENT\_CREATED > PAYMENT\_RECEIVED > PIX\_AUTOMATIC\_RECURRING\_AUTHORIZATION\_ACTIVATED > PIX\_AUTOMATIC\_RECURRING\_AUTHORIZATION\_CANCELLED*

QR Code imediato criado, pagamento efetuado, autorização concedida, e cancelamento feito pelo cliente Asaas:

*PIX\_AUTOMATIC\_RECURRING\_AUTHORIZATION\_CREATED > PAYMENT\_CREATED > PAYMENT\_RECEIVED > PIX\_AUTOMATIC\_RECURRING\_AUTHORIZATION\_ACTIVATED > PIX\_AUTOMATIC\_RECURRING\_AUTHORIZATION\_CANCELLED*

Instruções de pagamento e cobranças

Cobrança criada, instrução de pagamento criada, agendamento aceito e cobrança confirmada (na data de vencimento):

*PAYMENT\_CREATED> PIX\_AUTOMATIC\_RECURRING\_PAYMENT\_INSTRUCTION\_CREATED > PIX\_AUTOMATIC\_RECURRING\_PAYMENT\_INSTRUCTION\_SCHEDULED > PAYMENT\_CONFIRMED*

Cobrança criada, instrução de pagamento criada, agendamento aceito pelo banco pagador porém falha no pagamento na data de agendamento (falta de saldo ou limite no banco pagador:

*PAYMENT\_CREATED> PIX\_AUTOMATIC\_RECURRING\_PAYMENT\_INSTRUCTION\_CREATED > PIX\_AUTOMATIC\_RECURRING\_PAYMENT\_INSTRUCTION\_SCHEDULED > PIX\_AUTOMATIC\_RECURRING\_PAYMENT\_INSTRUCTION\_REFUSED*

Cobrança criada, instrução de pagamento criada, agendamento recusado pelo banco pagador (por exemplo falha operacional):

*PAYMENT\_CREATED> PIX\_AUTOMATIC\_RECURRING\_PAYMENT\_INSTRUCTION\_CREATED > PIX\_AUTOMATIC\_RECURRING\_PAYMENT\_INSTRUCTION\_REFUSED*

Cobrança criada, instrução de pagamento criada, agendamento aceito pelo banco pagador, porém cancelamento feito pelo usuário pagador:

*PAYMENT\_CREATED> PIX\_AUTOMATIC\_RECURRING\_PAYMENT\_INSTRUCTION\_CREATED > PIX\_AUTOMATIC\_RECURRING\_PAYMENT\_INSTRUCTION\_SCHEDULED >PIX\_AUTOMATIC\_RECURRING\_PAYMENT\_INSTRUCTION\_CANCELLED*

Cobrança criada, instrução de pagamento criada, agendamento aceito pelo banco pagador, porém cancelamento feito pelo cliente Asaas:

*PAYMENT\_CREATED> PIX\_AUTOMATIC\_RECURRING\_PAYMENT\_INSTRUCTION\_CREATED > PIX\_AUTOMATIC\_RECURRING\_PAYMENT\_INSTRUCTION\_SCHEDULED >PIX\_AUTOMATIC\_RECURRING\_PAYMENT\_INSTRUCTION\_CANCELLED*

Cobrança criada, instrução de pagamento criada, agendamento aceito pelo banco pagador, porém o pagamento foi feito via fatura do asaas, onde a cobrança automática não deve mais ser efetuada:

*PAYMENT\_CREATED> PIX\_AUTOMATIC\_RECURRING\_PAYMENT\_INSTRUCTION\_CREATED > PIX\_AUTOMATIC\_RECURRING\_PAYMENT\_INSTRUCTION\_SCHEDULED > PAYMENT\_CONFIRMED>PIX\_AUTOMATIC\_RECURRING\_PAYMENT\_INSTRUCTION\_CANCELLED*

Cobrança criada, instrução de pagamento criada, agendamento aceito pelo banco pagador, autorização cancelada (causando cancelamento subsequente das instruções e agendamentos criados):

*PAYMENT\_CREATED> PIX\_AUTOMATIC\_RECURRING\_PAYMENT\_INSTRUCTION\_CREATED > PIX\_AUTOMATIC\_RECURRING\_PAYMENT\_INSTRUCTION\_SCHEDULED > PIX\_AUTOMATIC\_RECURRING\_AUTHORIZATION\_CANCELLED>PIX\_AUTOMATIC\_RECURRING\_PAYMENT\_INSTRUCTION\_CANCELLED*