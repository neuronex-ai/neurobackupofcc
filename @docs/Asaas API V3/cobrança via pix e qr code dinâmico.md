

# Cobranças via Pix / QR Code dinâmico

A forma mais rápida de ter o dinheiro na conta.

Ofereça o Pix como forma de pagamento, aumente suas vendas e ainda receba o dinheiro em segundos, direto na sua conta digital. [Conheça mais.](https://www.asaas.com/pix-asaas)

### Criando uma cobrança por Pix

Ao escolher a forma de pagamento por `PIX` e ter uma [chave Pix configurada](https://docs.asaas.com/reference/criar-uma-chave), um QRCode único é gerado para você.

> **POST`/v3/lean/payments`**\
> [Confira a referência completa deste endpoint](https://docs.asaas.com/reference/criar-nova-cobranca-com-dados-resumidos-na-resposta)

```json
{
      "customer": "cus_000005219613",
      "billingType": "PIX",
      "value": 100.90,
      "dueDate": "2023-07-21"
}
```

Para recuperar a imagem do QRCode e a chave copia e cola, basta enviar o ID dessa cobrança que você acabou de criar no endpoint para recuperar os dados.

> **GET`/v3/payments/id/pixQrCode`**\
> [Confira a referência completa deste endpoint](https://docs.asaas.com/reference/obter-qr-code-para-pagamentos-via-pix)

A partir desse endpoint você terá acesso a 3 informações, a imagem encodada em Base64 `encodedImage`, o código copia e cola `payload` e a data de expiração `expirationDate`.

> 📘
>
> * O QRCode gerado é do tipo dinâmico com vencimento. *O QRCode expira 12 meses após a data de vencimento.* Pode ser impresso ou disponibilizado em documentos, pois os valores são consultados na hora da leitura do QRCode. Por exemplo: imprimir em um boleto ou carnês de pagamento.\* Só pode ser pago uma vez.

> 🚧 Atenção
>
> Atualmente é possível gerar QR Code Pix dinâmico de pagamento imediato sem possuir uma chave Pix Cadastrada no Asaas. Esse QR Code será vinculado a uma instituição parceira onde o Asaas tem uma chave cadastrada. Todo QR Code obtido desta maneira pode ser pago até 23:59 do mesmo dia. A cada atualização em sua cobrança, é necessário obter um novo QR Code. Entretanto essa funcionalidade será descontinuada no futuro, será enviando um comunicado com 30 dias de antecedência, portanto já indicamos fazer o cadastro da sua chave Pix em [Criar uma chave Pix](https://docs.asaas.com/reference/criar-uma-chave).