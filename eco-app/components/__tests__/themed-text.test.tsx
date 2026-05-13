import { render } from '@testing-library/react-native';
import { ThemedText } from '../themed-text';

jest.mock('@/hooks/use-theme-color', () => ({
  useThemeColor: () => '#11181C',
}));

describe('ThemedText', () => {
  it('deve renderizar o children corretamente', () => {
    const { getByText } = render(<ThemedText>Olá Mundo</ThemedText>);
    expect(getByText('Olá Mundo')).toBeTruthy();
  });

  it('deve aplicar estilo default quando type não é especificado', () => {
    const { getByText } = render(<ThemedText>Default</ThemedText>);
    const text = getByText('Default');
    expect(text.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ color: '#11181C' }),
        expect.objectContaining({ fontSize: 16, lineHeight: 24 }),
      ])
    );
  });

  it('deve aplicar estilo title quando type="title"', () => {
    const { getByText } = render(<ThemedText type="title">Title</ThemedText>);
    const text = getByText('Title');
    expect(text.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ fontSize: 32, fontWeight: 'bold', lineHeight: 32 }),
      ])
    );
  });

  it('deve aplicar estilo subtitle quando type="subtitle"', () => {
    const { getByText } = render(<ThemedText type="subtitle">Sub</ThemedText>);
    const text = getByText('Sub');
    expect(text.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ fontSize: 20, fontWeight: 'bold' }),
      ])
    );
  });

  it('deve aplicar estilo defaultSemiBold quando type="defaultSemiBold"', () => {
    const { getByText } = render(<ThemedText type="defaultSemiBold">Semi</ThemedText>);
    const text = getByText('Semi');
    expect(text.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ fontSize: 16, lineHeight: 24, fontWeight: '600' }),
      ])
    );
  });

  it('deve aplicar estilo link quando type="link"', () => {
    const { getByText } = render(<ThemedText type="link">Link</ThemedText>);
    const text = getByText('Link');
    expect(text.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ fontSize: 16, lineHeight: 30, color: '#0a7ea4' }),
      ])
    );
  });

  it('deve aplicar lightColor e darkColor passados como props', () => {
    jest.mock('@/hooks/use-theme-color', () => ({
      useThemeColor: jest.fn(() => '#ff0000'),
    }));

    const { getByText } = render(
      <ThemedText lightColor="#ff0000" darkColor="#00ff00">
        Colorido
      </ThemedText>
    );
    expect(getByText('Colorido')).toBeTruthy();
  });

  it('deve aplicar style adicional', () => {
    const { getByText } = render(
      <ThemedText style={{ marginTop: 10 }}>Styled</ThemedText>
    );
    const text = getByText('Styled');
    expect(text.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ marginTop: 10 }),
      ])
    );
  });
});
