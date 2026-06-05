

# Motivos de Recusa

Ao tentar efetivar a cobrança das instruções do Pix Automático, o banco pagador pode rejeitar a solicitação por diferentes motivos.

### Recusa retornada pelo Asaas

* PAYMENT\_OVERDUE: Cobrança vencida por falta de saldo/limite no momento do débito.

### Motivos de recusa retornados pelo banco pagador

| Motivo de Recusa                             | Descrição                                                                                                                                                                                                    |
| :------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| EXTERNAL\_INSTITUTION\_ERROR                 | Erro na instituição de pagamento do cliente.                                                                                                                                                                 |
| ACCOUNT\_CLOSED                              | Contra transacional do cliente encerrada.                                                                                                                                                                    |
| ACCOUNT\_BLOCKED                             | Contra transacional do cliente bloqueada.                                                                                                                                                                    |
| SAME\_INSTITUTION\_ERROR                     | Não é possível solicitar agendamento para transferências entre contas da mesma instituição participante ou entre participantes que utilizem o serviço de liquidação do mesmo participante liquidante no SPI. |
| MAXIMUM\_AMOUNT\_EXCEEDED                    | Valor da cobrança ultrapassa o valor máximo estabelecido pelo cliente.                                                                                                                                       |
| AMOUNT\_MISMATCH                             | Valor da cobrança não corresponde ao valor estabelecido na recorrência.                                                                                                                                      |
| RECEIVER\_CPF\_CNPJ\_MISMATCH                | O CNPJ do recebedor informado não corresponde com o dado de identificação contido na recorrência.                                                                                                            |
| PAYER\_CPF\_CNPJ\_MISMATCH                   | O CPF/CNPJ do cliente não corresponde com o dado de identificação contido na recorrência/autorização.                                                                                                        |
| PARTICIPANT\_NOT\_REGISTERED                 | Participante não se encontra cadastrado e/ou não iniciou a operação no SPI.                                                                                                                                  |
| DUE\_DATE\_MISMATCH                          | Divergência entre a data de vencimento informada e a periodicidade da recorrência e/ou regras do produto.                                                                                                    |
| POST\_DUE\_DATE\_ATTEMPT\_NOT\_ALLOWED       | Novas tentativas de agendamento após o vencimento em desacordo com o limite de dias definido (a partir de D+8, considerando D0 a data de vencimento).                                                        |
| RECEIVED\_TOO\_EARLY                         | Recebido com mais de 10 dias de antecedência da data prevista para liquidação.                                                                                                                               |
| RECEIVED\_TOO\_LATE                          | Recebido com menos de 2 dias de antecedência da data prevista para liquidação.                                                                                                                               |
| OTHER                                        | Erro desconhecido na instituição externa.                                                                                                                                                                    |
| OUT\_OF\_TIME\_FRAME\_FOR\_RETRY             | A cobrança recorrente não permite novas tentativas de agendamento após o vencimento.                                                                                                                         |
| INVALID\_RECURRING\_PAYMENT\_ID              | Identificador único da recorrência inexistente ou incorreto.                                                                                                                                                 |
| RECURRING\_PAYMENT\_NOT\_CONFIRMED           | Recorrência não confirmada pelo cliente.                                                                                                                                                                     |
| PAYMENT\_ALREADY\_SCHEDULED                  | A cobrança já possui um pedido de liquidação pendente.                                                                                                                                                       |
| PAYMENT\_ALREADY\_DONE                       | A cobrança já foi paga.                                                                                                                                                                                      |
| PAYMENT\_INSTRUCTION\_WITHOUT\_AUTHORIZATION | Nova instrução de pagamento não corresponde a uma cobrança recorrente gerada anteriormente.                                                                                                                  |
| EXCEEDED\_MAXIMUM\_RETRY\_ATTEMPTS           | A quantidade de novas tentativas de agendamento após o vencimento excedeu o limite definido (mais de 3 tentativas, em intervalo de 7 dias após o vencimento, considerando D0 como a data do vencimento).     |
| PARTICIPANT\_ISPB\_INVALID                   | ISPB da instituição do cliente inválido ou inexistente.                                                                                                                                                      |
| INVALID\_CUSTOMER\_CPF\_CNPJ                 | CPF/CNPJ do cliente inválido.                                                                                                                                                                                |
| INCORRECT\_CUSTOMER\_CPF\_CNPJ               | CPF/CNPJ do cliente incorreto.                                                                                                                                                                               |

<br />