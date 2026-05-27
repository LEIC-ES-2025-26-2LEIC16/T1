import { guardarRegistoReciclagem } from '@/services/firestore';
import { addDoc, collection } from 'firebase/firestore';

// Mock das dependências do Firebase
jest.mock('@/services/firebase', () => ({
  auth: {
    currentUser: { uid: 'myimpact-user-123' }
  },
  db: {}
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  addDoc: jest.fn(),
  setDoc: jest.fn(),
  doc: jest.fn(),
  increment: jest.fn((n) => n),
  serverTimestamp: jest.fn(() => 'mocked-timestamp'),
}));

// Mock nativo do fetch para interceptar a chamada ao Cloudinary
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ secure_url: 'https://api.cloudinary.com/v1_1/mock-image.jpg' }),
  })
) as jest.Mock;

describe('Integração Firestore - Fluxo de Registo de Reciclagem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve simular o upload da imagem e persistir o registo na base de dados com as métricas calculadas', async () => {
    const mockImageUri = 'file://local/camera/photo.jpg';
    const mockMaterial = 'Plástico';
    const mockPontos = 20;
    const mockPeso = '2kg';
    const mockCO2 = '3.00kg CO2';

    await guardarRegistoReciclagem(mockImageUri, mockMaterial, mockPontos, mockPeso, mockCO2);

    // Validação da integração externa (Cloudinary)
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('api.cloudinary.com'),
      expect.objectContaining({ method: 'POST' })
    );

    // Validação da integração interna (Firestore)
    expect(collection).toHaveBeenCalledWith({}, 'registos_reciclagem');
    expect(addDoc).toHaveBeenCalledTimes(1);
    expect(addDoc).toHaveBeenCalledWith(
      undefined, 
      expect.objectContaining({
        userId: 'myimpact-user-123',
        material: mockMaterial,
        imagemUrl: 'https://api.cloudinary.com/v1_1/mock-image.jpg',
        pontosAtribuidos: mockPontos,
        quantidade: mockPeso,
        impactoCO2: mockCO2,
      })
    );
  });
});