import { Alert } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ReportProblemScreen from '../report-problem';

const mockGuardarReporte = jest.fn();
const mockPush = jest.fn();
const mockAlert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn() }),
  useLocalSearchParams: () => ({
    ecopontoNome: 'Ecoponto Teste',
    ecopontoMorada: 'Rua Teste, 123',
  }),
  Link: 'Link',
}));

jest.mock('@/services/firestore', () => ({
  guardarReporte: (...args: any[]) => mockGuardarReporte(...args),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('ReportProblemScreen', () => {
  it('deve renderizar informações do ecoponto', () => {
    const { getByText } = render(<ReportProblemScreen />);
    expect(getByText('Ecoponto Teste')).toBeTruthy();
    expect(getByText('Rua Teste, 123')).toBeTruthy();
  });

  it('deve renderizar todos os tipos de problema', () => {
    const { getByText } = render(<ReportProblemScreen />);
    expect(getByText('Contentor cheio')).toBeTruthy();
    expect(getByText('Contentor danificado')).toBeTruthy();
    expect(getByText('Mau cheiro')).toBeTruthy();
    expect(getByText('Outro')).toBeTruthy();
  });

  it('deve permitir selecionar um tipo de problema', () => {
    const { getByTestId } = render(<ReportProblemScreen />);
    const botaoCheio = getByTestId('problem-type-bin-full');
    fireEvent.press(botaoCheio);
    expect(getByTestId('problem-type-bin-full')).toBeTruthy();
  });

  it('deve ter botão de enviar desativado quando nenhum tipo selecionado', () => {
    const { getByTestId } = render(<ReportProblemScreen />);
    const botao = getByTestId('submit-report-button');
    expect(botao.props.accessibilityState?.disabled).toBe(true);
  });

  it('deve ativar botão quando um tipo é selecionado', () => {
    const { getByTestId } = render(<ReportProblemScreen />);
    fireEvent.press(getByTestId('problem-type-bin-full'));
    const botao = getByTestId('submit-report-button');
    expect(botao.props.accessibilityState?.disabled).toBe(false);
  });

  it('deve chamar guardarReporte e navegar para sucesso', async () => {
    mockGuardarReporte.mockResolvedValue(undefined);
    const { getByTestId } = render(<ReportProblemScreen />);

    fireEvent.press(getByTestId('problem-type-damaged'));
    fireEvent.press(getByTestId('submit-report-button'));

    await waitFor(() => {
      expect(mockGuardarReporte).toHaveBeenCalledWith({
        ecopontoNome: 'Ecoponto Teste',
        ecopontoMorada: 'Rua Teste, 123',
        tipo: 'danificado',
        descricao: '',
      });
      expect(mockPush).toHaveBeenCalledWith('/report-success');
    });
  });

  it('deve incluir descrição no reporte', async () => {
    mockGuardarReporte.mockResolvedValue(undefined);
    const { getByTestId } = render(<ReportProblemScreen />);

    fireEvent.press(getByTestId('problem-type-smell'));
    fireEvent.changeText(getByTestId('description-input'), 'Mau cheiro muito forte');
    fireEvent.press(getByTestId('submit-report-button'));

    await waitFor(() => {
      expect(mockGuardarReporte).toHaveBeenCalledWith({
        ecopontoNome: 'Ecoponto Teste',
        ecopontoMorada: 'Rua Teste, 123',
        tipo: 'cheiro',
        descricao: 'Mau cheiro muito forte',
      });
    });
  });

  it('deve mostrar alerta em caso de erro', async () => {
    mockGuardarReporte.mockRejectedValue(new Error('Erro de rede'));
    const { getByTestId } = render(<ReportProblemScreen />);

    fireEvent.press(getByTestId('problem-type-other'));
    fireEvent.press(getByTestId('submit-report-button'));

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith('Erro', 'Não foi possível enviar o reporte. Tenta novamente.');
    });
  });
});
