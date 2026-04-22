import { calcularPontosGanhos, calcularPoupancaCO2 } from './recyclingUtils';

describe('Validação da Lógica de Reciclagem', () => {
  test('Deve atribuir a pontuação correta para cada material', () => {
    expect(calcularPontosGanhos('Metal')).toBe(20);
    expect(calcularPontosGanhos('Papel')).toBe(5);
  });

  test('Deve calcular corretamente o impacto de CO2', () => {
    // 2kg de Plástico * 1.5 = 3.00
    expect(calcularPoupancaCO2(2, 'Plástico')).toBe("3.00");
    // 10kg de Vidro * 0.3 = 3.00
    expect(calcularPoupancaCO2(10, 'Vidro')).toBe("3.00");
  });
});