"use server";

import { requireUser } from "@/lib/rbac";
import { calculateCorreios } from "@/lib/correios";
import type { ShippingOption } from "@/lib/shipping";

export type CalcResult =
  | { ok: true; options: ShippingOption[] }
  | { ok: false; error: string };

export async function calcularFreteCorreios(input: {
  cep: string;
  weightKg: number;
  comprimento: number;
  largura: number;
  altura: number;
}): Promise<CalcResult> {
  await requireUser();

  const cep = (input.cep ?? "").replace(/\D/g, "");
  if (cep.length !== 8) return { ok: false, error: "Informe um CEP válido (8 dígitos)." };
  const weight = Number(input.weightKg) || 0;
  if (weight <= 0) return { ok: false, error: "Informe o peso em kg." };

  try {
    const options = await calculateCorreios(
      cep,
      weight,
      Number(input.comprimento) || 40,
      Number(input.largura) || 30,
      Number(input.altura) || 20,
    );
    return { ok: true, options };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Falha ao consultar os Correios.",
    };
  }
}
