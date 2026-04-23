import { calcularPontosGanhos, calcularPoupancaCO2, tabelaPontos, tabelaCO2 } from './recyclingUtils';

describe('Recycling Utilities', () => {
  
  describe('Tabelas de Referência', () => {
    it('devem estar definidas e conter os valores base', () => {
      expect(tabelaPontos).toBeDefined();
      expect(tabelaCO2).toBeDefined();
      expect(tabelaPontos['Plástico']).toBe(10);
      expect(tabelaCO2['Plástico']).toBe(1.5);
    });
  });

  describe('calcularPontosGanhos()', () => {
    it('deve retornar os pontos corretos para materiais válidos', () => {
      expect(calcularPontosGanhos('Plástico')).toBe(10);
      expect(calcularPontosGanhos('Papel')).toBe(5);
      expect(calcularPontosGanhos('Vidro')).toBe(15);
      expect(calcularPontosGanhos('Metal')).toBe(20);
    });

    it('deve retornar 0 para um material desconhecido (edge case)', () => {
      expect(calcularPontosGanhos('Madeira')).toBe(0);
      expect(calcularPontosGanhos('Desconhecido')).toBe(0);
      expect(calcularPontosGanhos('')).toBe(0);
    });
  });

  describe('calcularPoupancaCO2()', () => {
    it('deve calcular corretamente a poupança para materiais válidos', () => {
      // O teu teste original incluído aqui
      expect(calcularPoupancaCO2(10, 'Vidro')).toBe("3.00");
      
      // Testes adicionais para cobrir os outros cálculos
      expect(calcularPoupancaCO2(2, 'Plástico')).toBe("3.00"); // 2 * 1.5
      expect(calcularPoupancaCO2(5, 'Papel')).toBe("4.50");    // 5 * 0.9
      expect(calcularPoupancaCO2(1.5, 'Metal')).toBe("3.75");  // 1.5 * 2.5
    });

    it('deve retornar "0.00" para materiais desconhecidos (edge case)', () => {
      expect(calcularPoupancaCO2(10, 'Esferovite')).toBe("0.00");
    });

    it('deve retornar "0.00" quando o peso inserido for zero (limit case)', () => {
      expect(calcularPoupancaCO2(0, 'Plástico')).toBe("0.00");
    });
  });

});