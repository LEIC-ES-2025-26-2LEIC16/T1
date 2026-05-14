import { getIniciais, calcularProgresso } from './homeUtils';

describe('Home Utilities - Unidade', () => {
  describe('getIniciais()', () => {
    it('deve extrair iniciais corretamente', () => {
      expect(getIniciais('Miguel Ângelo')).toBe('MÂ');
      expect(getIniciais(' João Pereira ')).toBe('JP');
    });
  });

  describe('calcularProgresso()', () => {
    const mockObjetivo = { material: 'Plástico', metaKg: 10 };
    
    it('deve retornar 0 sem registos', () => {
      expect(calcularProgresso(mockObjetivo as any, [])).toBe(0);
    });

    it('deve ignorar registos de meses passados', () => {
      const dataAntiga = new Date(2020, 1, 1);
      const registos = [{ material: 'Plástico', quantidade: '10', criadoEm: { toDate: () => dataAntiga } }];
      expect(calcularProgresso(mockObjetivo as any, registos)).toBe(0);
    });
  });
});