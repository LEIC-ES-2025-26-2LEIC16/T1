import { Alert } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import RegisterScreen from '../register';

const mockCreateUser = jest.fn();
const mockSetDoc = jest.fn();
const mockAlert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

jest.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: (...args: any[]) => mockCreateUser(...args),
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(() => 'user-doc-ref'),
  setDoc: (...args: any[]) => mockSetDoc(...args),
  serverTimestamp: jest.fn(() => 'mock-timestamp'),
}));

jest.mock('@/services/firebase', () => ({
  auth: {},
  db: 'mock-db',
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('RegisterScreen', () => {
  it('deve renderizar título e campos do formulário', () => {
    const { getByText, getByPlaceholderText } = render(<RegisterScreen />);
    expect(getByText('Bem-vindo ao My Impact')).toBeTruthy();
    expect(getByPlaceholderText('Email')).toBeTruthy();
    expect(getByPlaceholderText('Password')).toBeTruthy();
    expect(getByText('Registar')).toBeTruthy();
  });

  it('deve mostrar alerta se campos estiverem vazios', () => {
    const { getByText } = render(<RegisterScreen />);
    fireEvent.press(getByText('Registar'));
    expect(mockAlert).toHaveBeenCalledWith('Erro', 'Preenche todos os campos.');
  });

  it('deve chamar createUserWithEmailAndPassword e setDoc no registo', async () => {
    mockCreateUser.mockResolvedValue({
      user: { uid: 'user-123', email: 'novo@email.com' },
    });
    const { getByText, getByPlaceholderText } = render(<RegisterScreen />);

    fireEvent.changeText(getByPlaceholderText('Email'), 'novo@email.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'senha123');
    fireEvent.press(getByText('Registar'));

    await waitFor(() => {
      expect(mockCreateUser).toHaveBeenCalledWith(expect.anything(), 'novo@email.com', 'senha123');
      expect(mockSetDoc).toHaveBeenCalledWith('user-doc-ref', {
        email: 'novo@email.com',
        criadoEm: 'mock-timestamp',
      });
      expect(mockAlert).toHaveBeenCalledWith('Sucesso', 'Conta criada com sucesso!');
    });
  });

  it('deve mostrar alerta se email já está registado', async () => {
    mockCreateUser.mockRejectedValue({ code: 'auth/email-already-in-use' });
    const { getByText, getByPlaceholderText } = render(<RegisterScreen />);

    fireEvent.changeText(getByPlaceholderText('Email'), 'existe@email.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'senha123');
    fireEvent.press(getByText('Registar'));

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith('Erro', 'Este email já está registado.');
    });
  });

  it('deve mostrar alerta para password fraca', async () => {
    mockCreateUser.mockRejectedValue({ code: 'auth/weak-password' });
    const { getByText, getByPlaceholderText } = render(<RegisterScreen />);

    fireEvent.changeText(getByPlaceholderText('Email'), 'teste@email.com');
    fireEvent.changeText(getByPlaceholderText('Password'), '123');
    fireEvent.press(getByText('Registar'));

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith('Erro', 'A password deve ter pelo menos 6 caracteres.');
    });
  });

  it('deve mostrar alerta genérico para erro desconhecido', async () => {
    mockCreateUser.mockRejectedValue({ code: 'auth/unknown' });
    const { getByText, getByPlaceholderText } = render(<RegisterScreen />);

    fireEvent.changeText(getByPlaceholderText('Email'), 'teste@email.com');
    fireEvent.changeText(getByPlaceholderText('Password'), '123456');
    fireEvent.press(getByText('Registar'));

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith('Erro', 'Não foi possível criar a conta.');
    });
  });

  it('deve mostrar loading no botão durante o registo', async () => {
    mockCreateUser.mockImplementation(() => new Promise(() => {}));
    const { getByText, getByPlaceholderText, queryByText } = render(<RegisterScreen />);

    fireEvent.changeText(getByPlaceholderText('Email'), 'a@b.com');
    fireEvent.changeText(getByPlaceholderText('Password'), '123456');
    fireEvent.press(getByText('Registar'));

    await waitFor(() => {
      expect(queryByText('Registar')).toBeNull();
    });
  });
});
