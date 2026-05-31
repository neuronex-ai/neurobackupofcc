Criar QR Code estático

# Criar QR Code estático

**Permissão necessária**: `PIX_CREDIT:WRITE`

Caso não informado o campo valor, o pagador poderá escolher o valor a ser pago.

> 🚧 Status `CONFIRMED` em cobranças Pix para pessoas físicas
>
> O status `CONFIRMED` pode ficar disponível em cobranças Pix de contas de pessoas físicas em caso de cobranças que sofram bloqueio cautelar e que precisam de análise da área de prevenção. O prazo máximo de bloqueio é de 72h e a cobrança mudará para o status `RECEIVED` se recebida ou `REFUNDED` caso negada.

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
    "/v3/pix/qrCodes/static": {
      "post": {
        "tags": [
          "Pix"
        ],
        "summary": "Criar QR Code estático",
        "description": "",
        "operationId": "criar-qrcode-estatico",
        "parameters": [],
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/PixQrCodeSaveRequestDTO"
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
                  "$ref": "#/components/schemas/PixQrCodeSaveResponseDTO"
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
      "PixQrCodeSaveRequestDTO": {
        "type": "object",
        "properties": {
          "addressKey": {
            "type": "string",
            "description": "Chave que receberá os pagamentos do QR Code",
            "example": "b6295ee1-f054-47d1-9e90-ee57b74f60d9",
            "deprecated": false
          },
          "description": {
            "type": "string",
            "description": "Descrição do QrCode",
            "example": "Churrasco",
            "deprecated": false
          },
          "value": {
            "type": "number",
            "description": "Valor do QrCode, caso não informado o pagador poderá escolher o valor",
            "example": 50,
            "deprecated": false
          },
          "format": {
            "type": "string",
            "description": "Formato do QR Code",
            "example": "ALL",
            "deprecated": false,
            "enum": [
              "ALL",
              "IMAGE",
              "PAYLOAD"
            ]
          },
          "expirationDate": {
            "type": "string",
            "description": "Data/Hora de expiração do QR Code, após desta data todos os pagamentos serão recusados.",
            "format": "date-time",
            "example": "2023-05-05 14:20:50",
            "deprecated": false
          },
          "expirationSeconds": {
            "type": "integer",
            "description": "Determina a data de expiração em segundos.",
            "format": "int32",
            "deprecated": false,
            "example": null
          },
          "allowsMultiplePayments": {
            "type": "boolean",
            "description": "Define se o QrCode pode ser pago múltiplas vezes, caso não informado o valor padrão é true.",
            "example": true,
            "deprecated": false
          },
          "externalReference": {
            "maxLength": 100,
            "type": "string",
            "description": "Campo livre para busca",
            "deprecated": false,
            "example": null
          }
        }
      },
      "PixQrCodeSaveResponseDTO": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "description": "Imagem do qrCode em base64",
            "example": "9bea9bcd126b45c7939960f577be84d6",
            "deprecated": false
          },
          "encodedImage": {
            "type": "string",
            "description": "Identificador do QrCode",
            "example": "QRCODE IMAGE IN BASE64",
            "deprecated": false
          },
          "payload": {
            "type": "string",
            "description": "Copia e Cola do QrCode",
            "example": "00020126580014br.gov.bcb.pix0136a9fe43bc-164d-44d1-91c2-2f9b4d6956e95204000053039865802BR5925Churrasco6009Joinville62290525JOAOSILVA00000055ASA6304E62B",
            "deprecated": false
          },
          "allowsMultiplePayments": {
            "type": "boolean",
            "description": "Indica se permite múltiplos pagamentos",
            "example": true,
            "deprecated": false
          },
          "expirationDate": {
            "type": "string",
            "description": "Data/Hora de expiração do QrCode, após desta data todos os pagamentos serão recusados",
            "format": "date-time",
            "example": "2023-05-05 14:20:5",
            "deprecated": false
          },
          "externalReference": {
            "type": "string",
            "description": "Campo livre para busca",
            "deprecated": false,
            "example": null
          },
          "description": {
            "type": "string",
            "description": "Descrição do QrCode",
            "example": "Churrasco",
            "deprecated": false
          }
        }
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