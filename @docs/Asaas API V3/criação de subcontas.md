

# Criação de subcontas

> ⚠️ **Atenção**
>
> Todos os novos clientes que desejam criar subcontas via API estarão inicialmente sujeitos ao período de avaliação regulatória para serviços na API. Durante esse período obrigatório, as operações de subcontas e cobranças terão limites definidos. [Clique aqui](https://docs.asaas.com/docs/faq-periodo-de-avaliacao) e consulte o funcionamento completo.

A criação de subcontas possibilita que você crie contas Asaas para seus parceiros/clientes vinculadas a uma conta raiz, de forma que eles possam utilizar todas as funcionalidades do Asaas através do nosso site, aplicativo ou através de uma plataforma integrada desenvolvida por você.

Como resposta da criação da subconta Asaas, você receberá a chave de API (apiKey) da subconta criada para prosseguir com a integração, e também o walletId caso deseje trabalhar com o [Split de pagamentos](https://docs.asaas.com/docs/split-de-pagamentos) ou com a [Transferência entre contas Asaas.](https://docs.asaas.com/reference/transferir-para-conta-asaas)

Lembrando que, embora as subcontas geradas embaixo da sua conta raiz herdem definições de taxas e gerência da conta raiz, outras configurações devem ser realizadas individualmente em cada subconta criada, como webhooks, informações fiscais para emissão de notas, etc.

<Callout icon="📘" theme="info">
  A criação de subcontas incide de cobranças de taxas para cada conta criada, verifique em [Configurações de Contas > Taxas](https://www.asaas.com/config/index?tab=fees), quais taxas se aplicam.
</Callout>

## Criação da subconta

> **POST`/v3/accounts`**\
> [Confira a referência completa deste endpoint](https://docs.asaas.com/reference/criar-subconta)

```json
{
    "name": "Subconta criada via API",
    "email": "emaildaempresa@gmail.com",
    "cpfCnpj": "66625514000140",
    "birthDate": "1994-05-16",
    "companyType": "MEI",
    "phone": "11 32300606",
    "mobilePhone": "11 993367861",
    "address": "Av. Rolf Wiest",
    "addressNumber": "277",
    "complement": "Sala 502",
    "province": "Bom Retiro",
    "postalCode": "89223005",
}
```

> 🚧 Importante
>
> Em Sandbox só é possível criar 20 subcontas por dia, caso a conta atinja o limite diário receberá uma notificação de erro.
>
> Além disso, todas as comunicações de subcontas em Sandbox serão enviadas para o e-mail da conta raiz. O dono da subconta recebe notificações.

Ao criar uma subconta, quando ela não é Whitelabel, um e-mail de nova conta será enviado para o e-mail configurado.

### Guardando a chave de API da subconta

As chamadas seguintes para envio de documentos deverão ser realizadas utilizando a chave de API da subconta criada. A chave será devolvida como resposta da requisição de criação da conta e deverá ser armazenada nesse momento, não podendo ser recuperada posteriormente.

## Período de avaliação regulatória - O que é?

O Período de avaliação regulatória é um estágio obrigatório, ofertado pelo Asaas para que você tenha todo o suporte para utilizar nossa API seguindo todas as regras dispostas pelo Banco Central, pela Resolução Conjunta nº 16/17. Esse período se inicia a partir da primeira criação de subconta via API.

Limites durante o período:

* Máximo de 10 subcontas de diferentes titulares.
* Máximo de R$ 2.000,00 emitidos em cobranças por subconta.
* Vigência de até 60 dias corridos a partir da primeira subconta criada.

> 📘 **Importante**
>
> Após atingir qualquer limite (quantidade, valor ou prazo), a criação de novas subcontas e emissão adicional de cobranças, assinaturas, links de pagamento, será automaticamente bloqueada até a finalização do processo de avaliação regulatória (checklists/documentação).

[Clique aqui](https://docs.asaas.com/docs/faq-periodo-de-avaliacao) e consulte o funcionamento completo.