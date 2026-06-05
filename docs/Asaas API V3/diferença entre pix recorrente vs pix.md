

# Diferença entre Pix Recorrente e Pix Automático

Apesar dos nomes semelhantes, **Pix Recorrente** e **Pix Automático** possuem finalidades, fluxos e responsabilidades diferentes. A seguir, apresentamos as principais diferenças entre as duas modalidades.

## Tabela comparativa

| Característica                            | Pix Recorrente           | Pix Automático                    |
| ----------------------------------------- | ------------------------ | --------------------------------- |
| Tipo de operação                          | Transferência recorrente | Cobrança recorrente               |
| Quem inicia a configuração                | Pagador                  | Recebedor                         |
| Natureza do pagamento                     | Pix agendado             | Pix com autorização prévia        |
| Iniciativa do pagamento                   | Pagador                  | Recebedor                         |
| Necessidade de ação recorrente do pagador | Não                      | Não, apenas a autorização inicial |
| Autorização formal                        | Não                      | Sim                               |

***

## Pix Recorrente

O **Pix Recorrente** é uma transferência automática e periódica configurada diretamente pelo **pagador**.

### Como funciona

1. O pagador agenda um Pix recorrente para uma conta ou chave Pix.
2. Define o valor e a periodicidade (mensal, semanal, etc.).
3. As transferências são executadas automaticamente nas datas configuradas.

Veja mais informações sobre a funcionalidade aqui: [Pix Recorrente](https://docs.asaas.com/docs/pix-recorrente)

### Observações

* Não se trata de uma cobrança.
* O recebedor não possui controle sobre o fluxo.
* Funciona como um Pix agendado recorrente.

### Exemplo

> Um cliente agenda um Pix mensal para pagar um serviço diretamente pelo app do banco.

***

## Pix Automático

O **Pix Automático** é uma solução de **cobrança recorrente**, na qual o pagador autoriza previamente o recebedor a realizar débitos automáticos via Pix.

### Jornada de pagamento

1. **Geração do QR Code integrado**\
   O recebedor cria uma solicitação de autorização contendo dados do pagamento inicial e parâmetros da recorrência.

2. **Autorização pelo pagador**\
   O pagador escaneia o QR Code, autoriza o pagamento imediato e as cobranças recorrentes futuras.

3. **Pagamento inicial**\
   O primeiro pagamento é processado como um pix tradicional.

4. **Ativação da recorrência**\
   Após a liquidação do pagamento inicial, a autorização é ativada e o recebedor pode enviar cobranças recorrentes conforme os termos definidos.

Veja mais informações sobre a funcionalidade aqui: [Pix Automático](https://docs.asaas.com/docs/pix-automatico)

### Observações

* Indicado para mensalidades, assinaturas e planos recorrentes.
* O recebedor possui controle sobre a cobrança dentro dos limites autorizados.
* Proporciona maior previsibilidade financeira e redução da inadimplência para recebedor.

***

## Resumo

* **Pix Recorrente**: transferência recorrente configurada e controlada pelo pagador.
* **Pix Automático**: cobrança recorrente realizada pelo recebedor, com autorização prévia do pagador.