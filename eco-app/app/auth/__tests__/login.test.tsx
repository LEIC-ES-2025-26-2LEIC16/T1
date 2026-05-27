import { Alert } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import LoginScreen from '../login';

const mockPush = jest.fn();
const mockAlert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
  getApps: jest.fn(() => []),
  getApp: jest.fn(),
}));

jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: jest.fn(),
  getAuth: jest.fn(() => ({})),
  initializeAuth: jest.fn(),
}));

jest.mock('@firebase/auth', () => ({
  getReactNativePersistence: jest.fn(),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn() }),
  useLocalSearchParams: () => ({}),
  Link: 'Link',
}));

jest.mock('@/services/firebase', () => ({
  auth: {},
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('LoginScreen', () => {
  it('deve renderizar título e campos do formulário', () => {
    const { getByText, getByPlaceholderText } = render(<LoginScreen />);
    expect(getByText('My Impact')).toBeTruthy();
    expect(getByText('Entra na tua conta')).toBeTruthy();
    expect(getByPlaceholderText('Email')).toBeTruthy();
    expect(getByPlaceholderText('Password')).toBeTruthy();
    expect(getByText('Entrar')).toBeTruthy();
  });

  it('deve mostrar alerta se campos estiverem vazios', () => {
    const { getByText } = render(<LoginScreen />);
    fireEvent.press(getByText('Entrar'));
    expect(mockAlert).toHaveBeenCalledWith('Erro', 'Preenche todos os campos.');
  });

  it('deve chamar signInWithEmailAndPassword com email e password', async () => {
    (signInWithEmailAndPassword as jest.Mock).mockResolvedValue({ user: { uid: '123' } });
    const { getByText, getByPlaceholderText } = render(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText('Email'), 'teste@email.com');
    fireEvent.changeText(getByPlaceholderText('Password'), '123456');
    fireEvent.press(getByText('Entrar'));

    await waitFor(() => {
      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(expect.anything(), 'teste@email.com', '123456');
    });
  });

  it('deve mostrar alerta de erro em caso de credenciais inválidas', async () => {
    (signInWithEmailAndPassword as jest.Mock).mockRejectedValue({ code: 'auth/invalid-credential' });
    const { getByText, getByPlaceholderText } = render(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText('Email'), 'erro@email.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'wrong');
    fireEvent.press(getByText('Entrar'));

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith('Erro', 'Email ou password incorretos.');
    });
  });

  it('deve mostrar alerta de erro genérico para códigos desconhecidos', async () => {
    (signInWithEmailAndPassword as jest.Mock).mockRejectedValue({ code: 'auth/unknown-error' });
    const { getByText, getByPlaceholderText } = render(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText('Email'), 'x@x.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'pwd');
    fireEvent.press(getByText('Entrar'));

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith('Erro', 'Não foi possível entrar.');
    });
  });

  it('deve desativar o botão durante o loading', async () => {
    (signInWithEmailAndPassword as jest.Mock).mockImplementation(() => new Promise(() => {}));
    const { getByText, getByPlaceholderText, queryByText } = render(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText('Email'), 'a@b.com');
    fireEvent.changeText(getByPlaceholderText('Password'), '123456');
    fireEvent.press(getByText('Entrar'));

    await waitFor(() => {
      expect(queryByText('Entrar')).toBeNull();
    });
  });

  it('deve navegar para register ao clicar no link de registo', () => {
    const { getByText } = render(<LoginScreen />);
    fireEvent.press(getByText(/Cria uma aqui/));
    expect(mockPush).toHaveBeenCalledWith('/auth/register');
  });

  it('deve navegar para password-recovery ao clicar no link', () => {
    const { getByText } = render(<LoginScreen />);
    fireEvent.press(getByText('Esqueceu-se da password?'));
    expect(mockPush).toHaveBeenCalledWith('/auth/password-recovery');
  });
});
