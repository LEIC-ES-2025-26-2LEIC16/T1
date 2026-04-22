export const tabelaPontos: Record<string, number> = {
  'Plástico': 10,
  'Papel': 5,
  'Vidro': 15,
  'Metal': 20,
};

export const tabelaCO2: Record<string, number> = {
  'Plástico': 1.5,
  'Papel': 0.9,
  'Vidro': 0.3,
  'Metal': 2.5,
};

export const calcularPontosGanhos = (material: string): number => {
  return tabelaPontos[material] || 0;
};

export const calcularPoupancaCO2 = (pesoEmKg: number, material: string): string => {
  const fator = tabelaCO2[material] || 0;
  return (pesoEmKg * fator).toFixed(2);
};