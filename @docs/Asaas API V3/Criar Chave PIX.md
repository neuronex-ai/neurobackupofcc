Criar uma chave

# Criar uma chave

**Permissão necessária**: `PIX_ADDRESS_KEY:WRITE`

### Guia de Pix

[Confira o guia de Pix para mais informações.](https://docs.asaas.com/docs/pix)

Permite a manipulação de chaves aleátorias da sua conta Asaas.

> 🚧 Atenção
>
> Por limitações aplicadas pelo Banco Central, deve-se aguardar 1 minuto entre cada chave criada para uma conta.

> 🚧 Status `CONFIRMED` em cobranças Pix para pessoas físicas
>
> O status `CONFIRMED` pode ficar disponível em cobranças Pix de contas de pessoas físicas em caso de cobranças que sofram bloqueio cautelar e que precisam de análise da área de prevenção. O prazo máximo de bloqueio é de 72h e a cobrança mudará para o status `RECEIVED` se recebida ou `REFUNDED` caso negada.

<br />

> 🚧 Atenção — Ciclo de vida da chave Pix
>
> As chaves Pix **não possuem expiração automática por tempo ou inatividade**.
>
> Uma chave permanecerá ativa indefinidamente, desde que os dados da conta permaneçam válidos.
>
> No entanto, a chave pode ser **removida automaticamente** nos seguintes cenários:
>
> * Reprovação da conta
> * Alterações cadastrais sensíveis, como:
>
>   * Nome ou razão social
>   * CPF ou CNPJ
>   * Quadro de Sócios e Administradores (QSA)
>
> Essas situações invalidam a vinculação da chave junto ao DICT (Banco Central), sendo necessário realizar um novo cadastro após a regularização da conta.

# OpenAPI definition

```json
{
  "openapi": "3.0.1",
  "info": {
    "title": "Asaas",
    "description": "API pública de integração com a plataforma Asaas.",
    "version": "3.0.0"
  },
  "servers": [
    {
      "url": "https://api-sandbox.asaas.com",
      "description": "Sandbox"
    }
  ],
  "security": [
    {
      "Authorization": []
    }
  ],
  "tags": [
    {
      "name": "Pix"
    }
  ],
  "paths": {
    "/v3/pix/addressKeys": {
      "post": {
        "tags": [
          "Pix"
        ],
        "summary": "Criar uma chave",
        "description": "",
        "operationId": "criar-uma-chave",
        "parameters": [],
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/PixAddressKeySaveRequestDTO"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Ok",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/PixAddressKeyGetResponseDTO"
                }
              }
            }
          },
          "400": {
            "description": "Bad Request",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ErrorResponseDTO"
                },
                "example": {
                  "errors": [
                    {
                      "code": "error_code",
                      "description": "Descrição do erro"
                    }
                  ]
                }
              }
            }
          },
          "401": {
            "description": "Unauthorized",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ErrorResponseDTO"
                },
                "example": {
                  "errors": [
                    {
                      "code": "invalid_access_token",
                      "description": "A chave de API fornecida é inválida"
                    }
                  ]
                }
              }
            }
          }
        },
        "deprecated": false
      }
    }
  },
  "components": {
    "schemas": {
      "ErrorResponseDTO": {
        "type": "object",
        "properties": {
          "errors": {
            "type": "array",
            "description": "Lista de objetos",
            "deprecated": false,
            "items": {
              "$ref": "#/components/schemas/ErrorResponseItemDTO"
            }
          }
        }
      },
      "ErrorResponseItemDTO": {
        "type": "object",
        "properties": {
          "code": {
            "type": "string",
            "description": "Código do erro",
            "deprecated": false,
            "example": null
          },
          "description": {
            "type": "string",
            "description": "Descrição do erro",
            "deprecated": false,
            "example": null
          }
        },
        "description": "Lista de objetos",
        "deprecated": false
      },
      "PixAddressKeyGetResponseDTO": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "description": "Identificador único da chave Pix no Asaas",
            "example": "a33047b1-fb19-4b68-9373-a7ba8a8162aa",
            "deprecated": false
          },
          "key": {
            "type": "string",
            "description": "Valor da chave",
            "example": "b6295ee1-f054-47d1-9e90-ee57b74f60d9",
            "deprecated": false
          },
          "type": {
            "$ref": "#/components/schemas/PixAddressKeyGetResponsePixAddressKeyType"
          },
          "status": {
            "$ref": "#/components/schemas/PixAddressKeyGetResponsePixAddressKeyStatus"
          },
          "dateCreated": {
            "type": "string",
            "description": "Data de criação da chave",
            "format": "date-time",
            "example": "2022-02-07 17:17:48",
            "deprecated": false
          },
          "canBeDeleted": {
            "type": "boolean",
            "description": "Determina se a chave pode ser deletada",
            "example": true,
            "deprecated": false
          },
          "cannotBeDeletedReason": {
            "type": "string",
            "description": "Motivo de não poder ser removida",
            "deprecated": false,
            "example": null
          },
          "qrCode": {
            "$ref": "#/components/schemas/PixAddressKeyQrCodeGetResponseDTO"
          }
        }
      },
      "PixAddressKeyGetResponsePixAddressKeyType": {
        "type": "string",
        "description": "Tipo da chave Pix",
        "example": "EVP",
        "deprecated": false,
        "enum": [
          "EVP"
        ]
      },
      "PixAddressKeyGetResponsePixAddressKeyStatus": {
        "type": "string",
        "description": "Status da chave",
        "example": "ACTIVE",
        "deprecated": false,
        "enum": [
          "AWAITING_ACTIVATION",
          "ACTIVE",
          "AWAITING_DELETION",
          "AWAITING_ACCOUNT_DELETION",
          "DELETED",
          "ERROR"
        ]
      },
      "PixAddressKeyQrCodeGetResponseDTO": {
        "type": "object",
        "properties": {
          "encodedImage": {
            "type": "string",
            "description": "Imagem do QrCode em base64",
            "example": "QRCODE IMAGE IN BASE64",
            "deprecated": false
          },
          "payload": {
            "type": "string",
            "description": "Copia e Cola do QrCode",
            "example": "00020126580014br.gov.bcb.pix0136a9fe43bc-164d-44d1-91c2-2f9b4d6956e95204000053039865802BR5925Joao da Silva6009Joinville62290525JOAOSILVA00000055ASA6304E62B",
            "deprecated": false
          }
        },
        "description": "QrCode da chave Pix",
        "deprecated": false
      },
      "PixAddressKeySaveRequestDTO": {
        "required": [
          "type"
        ],
        "type": "object",
        "properties": {
          "type": {
            "$ref": "#/components/schemas/PixAddressKeySaveRequestPixAddressKeyType"
          }
        }
      },
      "PixAddressKeySaveRequestPixAddressKeyType": {
        "type": "string",
        "description": "Tipo da chave Pix",
        "nullable": false,
        "example": "EVP",
        "deprecated": false,
        "enum": [
          "EVP"
        ]
      }
    },
    "securitySchemes": {
      "Authorization": {
        "type": "apiKey",
        "name": "access_token",
        "in": "header"
      }
    }
  }
}
```