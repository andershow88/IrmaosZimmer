import { describe, it, expect } from "vitest";
import {
  cn,
  slugify,
  greeting,
  formatBRL,
  formatNumber,
  formatDateBR,
  formatDateTimeBR,
} from "@/lib/utils";
import {
  maskCPFCNPJ,
  maskTelefone,
  maskCEP,
  maskPlaca,
  isValidCPF,
  isValidCNPJ,
  isValidCPFCNPJ,
} from "@/lib/masks";

describe("cn", () => {
  it("mescla classes tailwind", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
    expect(cn("text-red-500", undefined, "text-blue-500")).toBe("text-blue-500");
  });
});

describe("slugify", () => {
  it("transforma em slug", () => {
    expect(slugify("Mecânica Geral")).toBe("mecanica-geral");
    expect(slugify("Suspensão & Freios")).toBe("suspensao-freios");
  });
});

describe("formatBRL", () => {
  it("formata Reais a partir de número", () => {
    expect(formatBRL(1234.56)).toBe("R$ 1.234,56");
    expect(formatBRL(0)).toBe("R$ 0,00");
  });
  it("formata Reais a partir de string", () => {
    expect(formatBRL("1234.5")).toBe("R$ 1.234,50");
  });
  it("formata Reais a partir de Decimal-like (toString)", () => {
    const decimalLike = { toString: () => "99.9" };
    expect(formatBRL(decimalLike)).toBe("R$ 99,90");
  });
  it("trata valores inválidos como zero", () => {
    expect(formatBRL("abc")).toBe("R$ 0,00");
  });
});

describe("formatNumber", () => {
  it("usa separador pt-BR", () => {
    expect(formatNumber(1234567)).toBe("1.234.567");
    expect(formatNumber(1234.5, 2)).toBe("1.234,50");
  });
});

describe("formatDateBR / formatDateTimeBR", () => {
  it("formato dd/MM/yyyy", () => {
    const d = new Date(2026, 5, 3); // 03/06/2026
    expect(formatDateBR(d)).toBe("03/06/2026");
  });
  it("formato dd/MM/yyyy HH:mm (24h)", () => {
    const d = new Date(2026, 5, 3, 14, 30); // 03/06/2026 14:30
    expect(formatDateTimeBR(d)).toBe("03/06/2026 14:30");
  });
});

describe("greeting", () => {
  it("retorna uma das saudações pt-BR", () => {
    expect(["Bom dia", "Boa tarde", "Boa noite"]).toContain(greeting());
  });
});

describe("maskCPFCNPJ", () => {
  it("formata CPF", () => {
    expect(maskCPFCNPJ("12345678909")).toBe("123.456.789-09");
  });
  it("formata CNPJ", () => {
    expect(maskCPFCNPJ("11222333000181")).toBe("11.222.333/0001-81");
  });
});

describe("maskTelefone", () => {
  it("formata celular com 11 dígitos", () => {
    expect(maskTelefone("51999887766")).toBe("(51) 99988-7766");
  });
  it("formata fixo com 10 dígitos", () => {
    expect(maskTelefone("5135551234")).toBe("(51) 3555-1234");
  });
});

describe("maskCEP", () => {
  it("formata CEP", () => {
    expect(maskCEP("93890000")).toBe("93890-000");
  });
});

describe("maskPlaca", () => {
  it("formata placa antiga com hífen", () => {
    expect(maskPlaca("abc1234")).toBe("ABC-1234");
  });
  it("mantém placa Mercosul sem hífen", () => {
    expect(maskPlaca("abc1d23")).toBe("ABC1D23");
  });
});

describe("validadores de documento", () => {
  it("valida CPF correto e rejeita inválido", () => {
    expect(isValidCPF("390.533.447-05")).toBe(true);
    expect(isValidCPF("111.111.111-11")).toBe(false);
    expect(isValidCPF("123.456.789-00")).toBe(false);
  });
  it("valida CNPJ correto e rejeita inválido", () => {
    expect(isValidCNPJ("11.222.333/0001-81")).toBe(true);
    expect(isValidCNPJ("11.111.111/1111-11")).toBe(false);
  });
  it("isValidCPFCNPJ escolhe pelo comprimento", () => {
    expect(isValidCPFCNPJ("390.533.447-05")).toBe(true);
    expect(isValidCPFCNPJ("11.222.333/0001-81")).toBe(true);
    expect(isValidCPFCNPJ("123")).toBe(false);
  });
});
