export function createPageUrl(pageName: string): string {
  const base = pageName.replace(/ /g, '-');
  return base.startsWith('/') ? base : `/${base}`;
}

/** Extrai o valor numérico da carga para uso em input (ex: "30 kg" ou "30" -> "30"). */
export function parseWeightForInput(
  weight: string | number | null | undefined
): string {
  if (weight == null || weight === '') return '';
  const s = String(weight).trim();
  const m = s.match(/^(\d+(?:[.,]\d+)?)/);
  return m ? m[1].replace(',', '.') : '';
}

/** Exibe a carga com unidade kg (ex: "30" -> "30 kg", vazio -> "-"). */
export function formatWeightDisplay(
  weight: string | number | null | undefined
): string {
  const n = parseWeightForInput(weight);
  return n ? `${n} kg` : '-';
}
