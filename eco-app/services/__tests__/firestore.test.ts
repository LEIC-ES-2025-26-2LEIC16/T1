import { collection } from 'firebase/firestore';
import { auth } from '../firebase';

import {
  getEcopontos,
  guardarReporte,
  getPerfilUtilizador,
  guardarPerfilUtilizador,
  getFavoritos,
  toggleFavorito,
  getEstatisticasUtilizador,
  getObjetivos,
  criarObjetivo,
  eliminarObjetivo,
  guardarReview,
} from '../firestore';

const mockGetDocs = jest.fn();
const mockGetDoc = jest.fn();
const mockAddDoc = jest.fn();
const mockSetDoc = jest.fn();
const mockUpdateDoc = jest.fn();
const mockDeleteDoc = jest.fn();
const mockDoc = jest.fn();
const mockCollection = jest.fn(() => 'collection-ref');
const mockServerTimestamp = jest.fn(() => 'mock-timestamp');
const mockQuery = jest.fn(() => 'query-ref');

jest.mock('firebase/firestore', () => ({
  getDocs: (...args: any[]) => (mockGetDocs as any)(...args),
  getDoc: (...args: any[]) => (mockGetDoc as any)(...args),
  addDoc: (...args: any[]) => (mockAddDoc as any)(...args),
  setDoc: (...args: any[]) => (mockSetDoc as any)(...args),
  updateDoc: (...args: any[]) => (mockUpdateDoc as any)(...args),
  deleteDoc: (...args: any[]) => (mockDeleteDoc as any)(...args),
  doc: (...args: any[]) => (mockDoc as any)(...args),
  collection: (...args: any[]) => (mockCollection as any)(...args),
  query: (...args: any[]) => (mockQuery as any)(...args),
  where: jest.fn(() => 'where-ref'),
  orderBy: jest.fn(() => 'order-ref'),
  arrayUnion: jest.fn((v: any) => v),
  arrayRemove: jest.fn((v: any) => v),
  serverTimestamp: (...args: any[]) => (mockServerTimestamp as any)(...args),
  onSnapshot: jest.fn(() => jest.fn()),
  getFirestore: jest.fn(() => 'mock-firestore'),
}));

const createDocSnapshot = (id: string, data: any) => ({
  id,
  data: () => data,
  exists: () => true,
});

const createDocsSnapshot = (docs: any[]) => ({
  docs,
  size: docs.length,
  forEach: (cb: any) => docs.forEach(cb),
});

beforeEach(() => {
  jest.clearAllMocks();
  (auth as any).currentUser = null;
});

describe('getEcopontos', () => {
  it('deve retornar lista de ecopontos mapeada com id', async () => {
    mockGetDocs.mockResolvedValue(
      createDocsSnapshot([
        createDocSnapshot('1', { nome: 'Eco A', morada: 'Rua A', estado: 'Operacional', coordenadas: {} }),
        createDocSnapshot('2', { nome: 'Eco B', morada: 'Rua B', estado: 'Cheio', coordenadas: {} }),
      ])
    );

    const result = await getEcopontos();
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('1');
    expect(result[0].nome).toBe('Eco A');
  });

  it('deve retornar array vazio quando não há ecopontos', async () => {
    mockGetDocs.mockResolvedValue(createDocsSnapshot([]));
    const result = await getEcopontos();
    expect(result).toEqual([]);
  });
});

describe('guardarReporte', () => {
  it('deve guardar reporte com criadoEm timestamp', async () => {
    mockAddDoc.mockResolvedValue({ id: 'report-1' });
    mockServerTimestamp.mockReturnValue('mock-timestamp');

    await guardarReporte({
      ecopontoNome: 'Eco Teste',
      ecopontoMorada: 'Rua Teste',
      tipo: 'cheio',
      descricao: 'Contentor cheio',
    });

    expect(mockAddDoc).toHaveBeenCalledWith('collection-ref', {
      ecopontoNome: 'Eco Teste',
      ecopontoMorada: 'Rua Teste',
      tipo: 'cheio',
      descricao: 'Contentor cheio',
      criadoEm: 'mock-timestamp',
    });
  });
});

describe('getPerfilUtilizador', () => {
  it('deve retornar perfil quando utilizador está autenticado', async () => {
    (auth as any).currentUser = { uid: 'user-1', displayName: 'João' };
    mockGetDoc.mockResolvedValue(createDocSnapshot('user-1', {
      nome: 'João Silva',
      username: 'joao123',
      bio: 'Amante da natureza',
    }));

    const result = await getPerfilUtilizador();
    expect(result).toEqual({
      nome: 'João Silva',
      username: 'joao123',
      bio: 'Amante da natureza',
    });
  });

  it('deve retornar valores vazios quando utilizador não está autenticado', async () => {
    const result = await getPerfilUtilizador();
    expect(result).toEqual({ nome: '', username: '', bio: '' });
  });

  it('deve retornar displayName quando doc não existe no Firestore', async () => {
    (auth as any).currentUser = { uid: 'user-2', displayName: 'Maria' };
    const nonExistentSnap = { exists: () => false, data: () => undefined };
    mockGetDoc.mockResolvedValue(nonExistentSnap);

    const result = await getPerfilUtilizador();
    expect(result.nome).toBe('Maria');
    expect(result.username).toBe('');
  });

  it('deve retornar valores vazios em caso de erro', async () => {
    (auth as any).currentUser = { uid: 'user-3', displayName: 'Carlos' };
    mockGetDoc.mockRejectedValue(new Error('Erro de rede'));

    const result = await getPerfilUtilizador();
    expect(result).toEqual({ nome: '', username: '', bio: '' });
  });
});

describe('guardarPerfilUtilizador', () => {
  it('deve guardar perfil com merge true', async () => {
    (auth as any).currentUser = { uid: 'user-1' };
    mockDoc.mockReturnValue('doc-ref');

    await guardarPerfilUtilizador({ nome: 'Ana', username: 'ana', bio: 'Eco warrior' });

    expect(mockSetDoc).toHaveBeenCalledWith(
      'doc-ref',
      { uid: 'user-1', nome: 'Ana', username: 'ana', bio: 'Eco warrior' },
      { merge: true }
    );
  });

  it('deve lançar erro se não autenticado', async () => {
    await expect(guardarPerfilUtilizador({ nome: '', username: '', bio: '' })).rejects.toThrow(
      'Utilizador não autenticado.'
    );
  });
});

describe('getFavoritos', () => {
  it('deve retornar lista de favoritos', async () => {
    (auth as any).currentUser = { uid: 'user-1' };
    mockGetDoc.mockResolvedValue(createDocSnapshot('user-1', { favoritos: ['eco-1', 'eco-2'] }));

    const result = await getFavoritos();
    expect(result).toEqual(['eco-1', 'eco-2']);
  });

  it('deve retornar array vazio se não autenticado', async () => {
    const result = await getFavoritos();
    expect(result).toEqual([]);
  });

  it('deve retornar array vazio se favoritos não existir', async () => {
    (auth as any).currentUser = { uid: 'user-1' };
    mockGetDoc.mockResolvedValue(createDocSnapshot('user-1', {}));

    const result = await getFavoritos();
    expect(result).toEqual([]);
  });
});

describe('toggleFavorito', () => {
  beforeEach(() => {
    (auth as any).currentUser = { uid: 'user-1' };
    mockDoc.mockReturnValue('user-doc-ref');
  });

  it('deve remover favorito se já é favorito', async () => {
    mockUpdateDoc.mockResolvedValue(undefined);
    await toggleFavorito('eco-1', true);
    expect(mockUpdateDoc).toHaveBeenCalledWith('user-doc-ref', { favoritos: 'eco-1' });
  });

  it('deve adicionar favorito se não é favorito', async () => {
    mockUpdateDoc.mockResolvedValue(undefined);
    await toggleFavorito('eco-1', false);
    expect(mockUpdateDoc).toHaveBeenCalledWith('user-doc-ref', { favoritos: 'eco-1' });
  });

  it('deve lançar erro se não autenticado', async () => {
  (auth as any).currentUser = null;
    await expect(toggleFavorito('eco-1', false)).rejects.toThrow('Utilizador não autenticado.');
  });
});

describe('getEstatisticasUtilizador', () => {
  it('deve calcular estatísticas corretamente', async () => {
    (auth as any).currentUser = { uid: 'user-1' };
    mockGetDocs.mockResolvedValue(
      createDocsSnapshot([
        { data: () => ({ quantidade: '2.5', impactoCO2: '3.75', pontosAtribuidos: 10 }) },
        { data: () => ({ quantidade: '1.0', impactoCO2: '1.50', pontosAtribuidos: 5 }) },
      ])
    );

    const result = await getEstatisticasUtilizador();
    expect(result).toEqual({
      totalReciclagens: 2,
      totalKg: '3.5',
      totalCO2: '5.3',
      totalPontos: 15,
    });
  });

  it('deve retornar null se não autenticado', async () => {
    const result = await getEstatisticasUtilizador();
    expect(result).toBeNull();
  });
});

describe('getObjetivos', () => {
  it('deve retornar lista de objetivos mapeada', async () => {
    (auth as any).currentUser = { uid: 'user-1' };
    mockGetDocs.mockResolvedValue(
      createDocsSnapshot([
        {
          id: 'obj-1',
          data: () => ({
            material: 'Plástico',
            metaKg: 10,
            periodo: 'semanal',
            criadoEm: { toDate: () => new Date('2025-01-01') },
          }),
        },
      ])
    );

    const result = await getObjetivos();
    expect(result).toHaveLength(1);
    expect(result[0].material).toBe('Plástico');
    expect(result[0].metaKg).toBe(10);
  });

  it('deve retornar array vazio se não autenticado', async () => {
    const result = await getObjetivos();
    expect(result).toEqual([]);
  });

  it('deve retornar array vazio em caso de erro', async () => {
    (auth as any).currentUser = { uid: 'user-1' };
    mockGetDocs.mockRejectedValue(new Error('Erro'));
    const result = await getObjetivos();
    expect(result).toEqual([]);
  });
});

describe('criarObjetivo', () => {
  it('deve criar objetivo com dados corretos', async () => {
    (auth as any).currentUser = { uid: 'user-1' };
    mockServerTimestamp.mockReturnValue('mock-ts');

    await criarObjetivo('Papel', 5, 'mensal');

    expect(mockAddDoc).toHaveBeenCalledWith('collection-ref', {
      userId: 'user-1',
      material: 'Papel',
      metaKg: 5,
      periodo: 'mensal',
      criadoEm: 'mock-ts',
    });
  });

  it('deve lançar erro se não autenticado', async () => {
    await expect(criarObjetivo('Plástico', 10, 'semanal')).rejects.toThrow('Utilizador não autenticado.');
  });
});

describe('eliminarObjetivo', () => {
  it('deve eliminar objetivo se pertencer ao utilizador', async () => {
    (auth as any).currentUser = { uid: 'user-1' };
    mockDoc.mockReturnValue('doc-ref');
    mockGetDoc.mockResolvedValue(createDocSnapshot('obj-1', { userId: 'user-1' }));
    await eliminarObjetivo('obj-1');
    expect(mockDeleteDoc).toHaveBeenCalledWith('doc-ref');
  });

  it('deve lançar erro se objetivo não pertence ao utilizador', async () => {
    (auth as any).currentUser = { uid: 'user-1' };
    mockGetDoc.mockResolvedValue(createDocSnapshot('obj-1', { userId: 'user-2' }));
    await expect(eliminarObjetivo('obj-1')).rejects.toThrow('Operação não permitida.');
  });

  it('deve lançar erro se objetivo não existe', async () => {
    (auth as any).currentUser = { uid: 'user-1' };
    const nonExistent = { exists: () => false, data: () => undefined };
    mockGetDoc.mockResolvedValue(nonExistent);
    await expect(eliminarObjetivo('obj-1')).rejects.toThrow('Operação não permitida.');
  });
});

describe('guardarReview', () => {
  it('deve guardar review com userId do utilizador autenticado', async () => {
    (auth as any).currentUser = { uid: 'user-1' };
    mockServerTimestamp.mockReturnValue('mock-ts');

    await guardarReview('eco-1', 5, 'Excelente!');

    expect(mockAddDoc).toHaveBeenCalledWith('collection-ref', {
      ecopontoId: 'eco-1',
      rating: 5,
      comment: 'Excelente!',
      userId: 'user-1',
      data: 'mock-ts',
    });
  });

  it('deve usar "anonimo" se não autenticado', async () => {
    mockServerTimestamp.mockReturnValue('mock-ts');

    await guardarReview('eco-2', 3, 'Bom');

    expect(mockAddDoc).toHaveBeenCalledWith('collection-ref', {
      ecopontoId: 'eco-2',
      rating: 3,
      comment: 'Bom',
      userId: 'anonimo',
      data: 'mock-ts',
    });
  });

  it('deve relançar erro se guardar falhar', async () => {
    mockAddDoc.mockRejectedValue(new Error('Erro de rede'));
    await expect(guardarReview('eco-1', 4, '')).rejects.toThrow('Erro de rede');
  });
});
