import { guardarPerfilUtilizador } from '@/services/firestore';
import { doc, setDoc } from 'firebase/firestore';

jest.mock('@/services/firebase', () => ({
  auth: {
    currentUser: { uid: 'myimpact-user-123' }
  },
  db: {}
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  setDoc: jest.fn(),
}));

describe('Integração Firestore - Edição de Perfil', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve invocar a gravacao na base de dados com o merge ativado', async () => {
    const rascunho = { nome: 'Miguel Frias', username: 'miguelfrias', bio: 'L.EIC', avatarUrl: '', bannerUrl: '' };
    
    await guardarPerfilUtilizador(rascunho);

    expect(doc).toHaveBeenCalledWith({}, 'utilizadores', 'myimpact-user-123');
    expect(setDoc).toHaveBeenCalledWith(undefined, { ...rascunho, uid: 'myimpact-user-123' }, { merge: true });
  });
});