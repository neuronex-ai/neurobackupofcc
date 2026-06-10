import {
    detectPixKeyType,
    normalizePixQrConsultation,
    validatePixQrConsultation,
} from "./asaas-outgoing.ts";

Deno.test("normalizes a payable variable Pix QR consultation", () => {
    const normalized = normalizePixQrConsultation({
        payload: "000201",
        canBePaid: true,
        canBePaidWithDifferentValue: true,
        receiver: {
            name: "Clinica Exemplo",
            cpfCnpj: "**.000.000/0001-**",
            ispbName: "Banco Exemplo",
        },
    });

    if (validatePixQrConsultation(normalized).length !== 0) {
        throw new Error("Expected a valid variable Pix consultation");
    }
});

Deno.test("requires a fixed value when the Pix QR cannot change value", () => {
    const normalized = normalizePixQrConsultation({
        payload: "000201",
        canBePaid: true,
        receiver: { name: "Pessoa", cpfCnpj: "***.000.000-**", ispb: "123" },
    });

    if (!validatePixQrConsultation(normalized).includes("value")) {
        throw new Error("Expected value to be required");
    }
});

Deno.test("detects supported Pix key types", () => {
    if (detectPixKeyType("nome@exemplo.com") !== "EMAIL") throw new Error("email");
    if (detectPixKeyType("123.456.789-01") !== "CPF") throw new Error("cpf");
    if (detectPixKeyType("12.345.678/0001-01") !== "CNPJ") throw new Error("cnpj");
    if (detectPixKeyType("b6295ee1-f054-47d1-9e90-ee57b74f60d9") !== "EVP") throw new Error("evp");
});
