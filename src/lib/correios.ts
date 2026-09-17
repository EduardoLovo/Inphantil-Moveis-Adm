import "server-only";
import type { ShippingOption } from "@/lib/shipping";

// Serviços cotados (mesmos do legado): PAC + SEDEX.
const SERVICOS = [
  { code: "03298", name: "PAC" },
  { code: "03220", name: "SEDEX" },
] as const;

const TOKEN_URL = "https://api.correios.com.br/token/v1/autentica/cartaopostagem";
const PRECO_URL = "https://api.correios.com.br/preco/v1/nacional";
const PRAZO_URL = "https://api.correios.com.br/prazo/v1/nacional";

let cachedToken: string | null = null;
let tokenExpiraEm: Date | null = null;

async function fetchJson(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Record<string, unknown>> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: ctrl.signal });
    if (!res.ok) {
      throw new Error(`Correios respondeu ${res.status}`);
    }
    return (await res.json()) as Record<string, unknown>;
  } finally {
    clearTimeout(t);
  }
}

async function getToken(): Promise<string> {
  const agora = Date.now();
  const margem = 30 * 60 * 1000;
  if (cachedToken && tokenExpiraEm && tokenExpiraEm.getTime() - agora > margem) {
    return cachedToken;
  }

  const usuario = process.env.CORREIOS_USUARIO ?? "";
  const codigo = process.env.CORREIOS_CODIGO_ACESSO ?? "";
  const cartao = process.env.CORREIOS_CARTAO_POSTAGEM ?? "";
  const contrato = process.env.CORREIOS_CONTRATO ?? "";
  const dr = process.env.CORREIOS_DR ?? "";

  if (!usuario || !codigo || !cartao) {
    throw new Error(
      "Credenciais Correios incompletas. Configure CORREIOS_USUARIO, " +
        "CORREIOS_CODIGO_ACESSO e CORREIOS_CARTAO_POSTAGEM no .env.",
    );
  }

  const basicAuth = Buffer.from(`${usuario}:${codigo}`).toString("base64");
  const body: Record<string, string | number> = { numero: cartao };
  if (contrato) body.contrato = contrato;
  if (dr) body.dr = Number(dr);

  const data = await fetchJson(
    TOKEN_URL,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
    10_000,
  );

  cachedToken = String(data.token ?? "");
  tokenExpiraEm = new Date(String(data.expiraEm ?? ""));
  if (!cachedToken) throw new Error("Token dos Correios não retornado.");
  return cachedToken;
}

async function fetchPreco(
  token: string,
  codigoServico: string,
  cepOrigem: string,
  cepDestino: string,
  pesoGramas: number,
  comprimento: number,
  largura: number,
  altura: number,
): Promise<number> {
  const params = new URLSearchParams({
    cepOrigem,
    cepDestino,
    psObjeto: String(pesoGramas),
    tpObjeto: "2",
    comprimento: String(comprimento),
    largura: String(largura),
    altura: String(altura),
    cartaoPostagem: process.env.CORREIOS_CARTAO_POSTAGEM ?? "",
  });
  const data = await fetchJson(
    `${PRECO_URL}/${codigoServico}?${params}`,
    { headers: { Authorization: `Bearer ${token}` } },
    20_000,
  );
  const preco = parseFloat(String(data.pcFinal ?? "").replace(",", "."));
  if (isNaN(preco)) throw new Error(`Preço inválido para ${codigoServico}`);
  return preco;
}

async function fetchPrazo(
  token: string,
  codigoServico: string,
  cepOrigem: string,
  cepDestino: string,
): Promise<number> {
  const params = new URLSearchParams({
    cepOrigem,
    cepDestino,
    cartaoPostagem: process.env.CORREIOS_CARTAO_POSTAGEM ?? "",
  });
  const data = await fetchJson(
    `${PRAZO_URL}/${codigoServico}?${params}`,
    { headers: { Authorization: `Bearer ${token}` } },
    20_000,
  );
  const prazo = parseInt(String(data.prazoEntrega ?? ""), 10);
  if (isNaN(prazo)) throw new Error(`Prazo inválido para ${codigoServico}`);
  return prazo;
}

/** Calcula preço + prazo (PAC/SEDEX) pelos Correios. */
export async function calculateCorreios(
  cepDestino: string,
  weightKg = 1,
  comprimento = 40,
  largura = 30,
  altura = 20,
): Promise<ShippingOption[]> {
  const cep = cepDestino.replace(/\D/g, "");
  if (cep.length !== 8) throw new Error(`CEP inválido: ${cepDestino}`);

  const cepOrigem = (process.env.CORREIOS_CEP_ORIGEM ?? "86900000").replace(/\D/g, "");
  const pesoGramas = Math.max(300, Math.ceil(weightKg * 1000));

  comprimento = Math.min(Math.max(comprimento, 16), 100);
  largura = Math.min(Math.max(largura, 11), 100);
  altura = Math.min(Math.max(altura, 2), 100);
  const soma = comprimento + largura + altura;
  if (soma > 200) {
    const fator = 200 / soma;
    comprimento = Math.floor(comprimento * fator);
    largura = Math.floor(largura * fator);
    altura = Math.floor(altura * fator);
  }

  const token = await getToken();

  const results = await Promise.allSettled(
    SERVICOS.map(async (s) => {
      const [preco, prazo] = await Promise.all([
        fetchPreco(token, s.code, cepOrigem, cep, pesoGramas, comprimento, largura, altura),
        fetchPrazo(token, s.code, cepOrigem, cep),
      ]);
      return { code: s.code, name: s.name, price: preco, deadline: prazo } as ShippingOption;
    }),
  );

  const options: ShippingOption[] = results.map((r, i) =>
    r.status === "fulfilled"
      ? r.value
      : {
          code: SERVICOS[i].code,
          name: SERVICOS[i].name,
          price: 0,
          deadline: 0,
          error: `${SERVICOS[i].name} indisponível para este CEP`,
        },
  );

  if (options.every((o) => o.error)) {
    throw new Error("Nenhum serviço de frete disponível para este CEP.");
  }
  return options;
}
