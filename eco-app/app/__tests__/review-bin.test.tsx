import { Alert } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ReviewBinScreen from '../review-bin';

const mockGuardarReview = jest.fn();
const mockNetInfoFetch = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, push: jest.fn() }),
  useLocalSearchParams: () => ({
    ecopontoId: 'eco-123',
    ecopontoNome: 'Ecoponto Teste',
  }),
  Link: 'Link',
}));

jest.mock('@/services/firestore', () => ({
  guardarReview: (...args: any[]) => mockGuardarReview(...args),
}));

jest.mock('@react-native-community/netinfo', () => ({
  fetch: (...args: any[]) => mockNetInfoFetch(...args),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('ReviewBinScreen', () => {
  it('deve renderizar título e nome do ecoponto', () => {
    const { getByText } = render(<ReviewBinScreen />);
    expect(getByText('Como avalias este ecoponto?')).toBeTruthy();
    expect(getByText('Ecoponto Teste')).toBeTruthy();
  });

  it('deve renderizar 5 estrelas', () => {
    const { getAllByText } = render(<ReviewBinScreen />);
    const estrelas = getAllByText('★');
    expect(estrelas).toHaveLength(5);
  });

  it('deve submeter review com sucesso quando há internet', async () => {
    mockNetInfoFetch.mockResolvedValue({ isConnected: true });
    mockGuardarReview.mockResolvedValue(undefined);
    const { getByText, getAllByText } = render(<ReviewBinScreen />);

    const estrelas = getAllByText('★');
    fireEvent.press(estrelas[4]);

    await waitFor(() => {
      fireEvent.press(getByText('Submeter'));
    });

    await waitFor(() => {
      expect(mockGuardarReview).toHaveBeenCalledWith('eco-123', 5, '');
    });
  });

  it('deve mostrar modal de erro quando guardarReview falha', async () => {
    mockNetInfoFetch.mockResolvedValue({ isConnected: true });
    mockGuardarReview.mockRejectedValue(new Error('Erro Firebase'));
    const { getByText, getAllByText } = render(<ReviewBinScreen />);

    const estrelas = getAllByText('★');
    fireEvent.press(estrelas[3]);

    await waitFor(() => {
      fireEvent.press(getByText('Submeter'));
    });

    await waitFor(() => {
      expect(getByText('Erro de ligação')).toBeTruthy();
    });
  });

  it('deve permitir retry no modal de erro', async () => {
    mockNetInfoFetch
      .mockResolvedValueOnce({ isConnected: false })
      .mockResolvedValueOnce({ isConnected: true });
    mockGuardarReview.mockResolvedValue(undefined);
    const { getByText, getAllByText } = render(<ReviewBinScreen />);

    const estrelas = getAllByText('★');
    fireEvent.press(estrelas[4]);

    await waitFor(() => {
      fireEvent.press(getByText('Submeter'));
    });

    await waitFor(() => {
      expect(getByText('Erro de ligação')).toBeTruthy();
    });

    fireEvent.press(getByText('Tentar novamente'));

    await waitFor(() => {
      expect(mockGuardarReview).toHaveBeenCalledWith('eco-123', 5, '');
    });
  });

  it('deve fechar modal ao clicar em Cancelar', async () => {
    mockNetInfoFetch.mockResolvedValue({ isConnected: false });
    const { getByText, getAllByText, queryByText } = render(<ReviewBinScreen />);

    const estrelas = getAllByText('★');
    fireEvent.press(estrelas[4]);

    await waitFor(() => {
      fireEvent.press(getByText('Submeter'));
    });

    await waitFor(() => {
      expect(getByText('Erro de ligação')).toBeTruthy();
    });

    fireEvent.press(getByText('Cancelar'));

    await waitFor(() => {
      expect(queryByText('Erro de ligação')).toBeNull();
    });
  });
});
