

# FAQ

Veja aqui respostas para dúvidas comuns na implementação e gestão dos Pix automáticos.

#### 1. O que acontece se o meu cliente pagar a autorização antes do vencimento?

Se pagamento for realizado até o dia anterior ao vencimento, a instrução referente àquele ciclo será automaticamente cancelada para evitar débito duplicado. Isso não encerra o Pix Automático: a recorrência permanece ativa e a próxima cobrança será gerada normalmente na data prevista do ciclo seguinte.

#### 2. A cobrança fica por parte do pagador processar mensalmente ou o Asaas faz isso automaticamente?

Após o pagamento da primeira cobrança e a autorização do Pix Automático, o pagador não precisa mais agir mensalmente. Porém, o Asaas também não cria as cobranças sozinho. Vocês precisam gerar, via API, a instrução de pagamento a cada ciclo (mensal, por exemplo). Uma vez criada a instrução, o débito ocorre automaticamente, desde que haja saldo.

#### 3. Consigo utilizar o split de pagamento em conjunto com o Pix automático?

Sim, e não. No processo de criação da autorização, não haverá compatibilidade do recurso com o uso de split. Porém, ao criar novas cobranças dentro da mesma instrução de autorização, poderá aplicar normalmente o split ao utilizar a nossa [API de cobrança](https://docs.asaas.com/reference/criar-nova-cobranca).

#### 4. O que acontece se o cliente não tiver saldo quando chegar o dia do pix automático?

A instrução irá vencer e a cobrança relacionada à essa autorização mudará o seu status para **OVERDUE**, com o evento webhook *PAYMENT\_OVERDUE* sendo gerado normalmente.

#### 5. Como funcionam os fluxos de retentativas em caso de falta de saldo por parte do pagador?

A primeira tentativa de pagamento do Pix acontecerá às 7h. Caso não haja saldo disponível, o banco continuará tentando durante o dia no fluxo de retentativa intradia (conforme disponibilizado na documentação oficial do Pix feita pelo Bacen). Próximas tentativas acontecerão às 10h, 13h, 16h, 18h, 19h e 20h. Caso todas as tentativas falhem, às 20h o agendamento é recusado definitivamente, sem novas tentativas após esse horário ou nos dias posteriores.

#### 6. Posso alterar o valor das instruções de pagamento?

É possível alterar o valor das instruções de pagamento dependendo de como a autorização foi criada. O campo value não é obrigatório no momento da criação. Quando ele é enviado com um valor fixo, esse valor fica travado na autorização e não pode ser alterado nas instruções dos meses seguintes. Esse cenário é indicado para cobranças com valor fixo, como uma mensalidade de academia, por exemplo.

Por outro lado, quando a autorização é criada sem o envio do value, o valor pode ser definido livremente a cada instrução mensal. Isso é ideal para casos em que o valor pode variar, como cobranças por consumo ou contas de serviços.

Caso a autorização tenha sido criada com um valor fixo e posteriormente seja necessário alterá-lo, não é possível fazer essa mudança na mesma autorização. Nessa situação, é preciso cancelar a autorização atual e criar uma nova com o valor desejado.

#### 7. Estar apto a utilizar o Pix Automático no Asaas

* Conta precisa ser PJ (PF não é elegível)
* Conta precisa estar aprovada
* Conta não deve ter pendências cadastrais
* CNPJ ativo na Receita Federal
* CNPJ estar ativo, no mínimo, há 6 meses
* Sem marcações de cometimento de fraude relacionadas ao Pix

#### 8. Se uma conta era elegível e se tornou inelegível, o que acontece?

Quando a conta se torna inelegível, é enviado o evento `PIX_AUTOMATIC_RECURRING_ELIGIBILITY_UPDATED`, com eligibility.status igual a  `INELIGIBLE`. Com isso,odas as autorizações ativas são canceladas e todas as instruções de pagamento são canceladas.
Então, ao receber esse evento, você precisa ajustar as cobranças vinculadas para evitar qualquer prejuízo.