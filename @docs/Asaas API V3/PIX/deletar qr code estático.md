Deletar QR Code estático

# Deletar QR Code estático

**Permissão necessária**: `PIX_CREDIT:WRITE`

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
    "/v3/pix/qrCodes/static/{id}": {
      "delete": {
        "tags": [
          "Pix"
        ],
        "summary": "Deletar QR Code estático",
        "description": "",
        "operationId": "deletar-qrcode-estatico",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "description": "Identificador do QR Code que será removido.",
            "required": true,
            "schema": {
              "type": "string",
              "example": "ASAAS00000000000000383ASA"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Ok",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/PixQrCodeDeleteResponseDTO"
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
          },
          "404": {
            "description": "Not found"
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
      "PixQrCodeDeleteResponseDTO": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "description": "Identificador do QrCode",
            "example": "ASAAS00000000000000383ASA",
            "deprecated": false
          },
          "deleted": {
            "type": "boolean",
            "description": "Indica se o QR Code foi removido",
            "example": true,
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