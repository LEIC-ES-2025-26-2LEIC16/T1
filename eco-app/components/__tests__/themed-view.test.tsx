import { render } from '@testing-library/react-native';
import { ThemedView } from '../themed-view';
import { Text } from 'react-native';

jest.mock('@/hooks/use-theme-color', () => ({
  useThemeColor: () => '#fff',
}));

describe('ThemedView', () => {
  it('deve renderizar children', () => {
    const { getByText } = render(
      <ThemedView>
        <Text>Conteúdo</Text>
      </ThemedView>
    );
    expect(getByText('Conteúdo')).toBeTruthy();
  });

  it('deve aplicar cor de fundo do tema', () => {
    const { getByTestId } = render(
      <ThemedView testID="themed-view" />
    );
    const view = getByTestId('themed-view');
    expect(view.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ backgroundColor: '#fff' }),
      ])
    );
  });

  it('deve aplicar style adicional', () => {
    const { getByTestId } = render(
      <ThemedView testID="themed-view" style={{ padding: 20 }} />
    );
    const view = getByTestId('themed-view');
    expect(view.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ padding: 20 }),
      ])
    );
  });

  it('deve passar outras props para o View nativo', () => {
    const { getByTestId } = render(
      <ThemedView testID="themed-view" accessibilityLabel="test-label" />
    );
    const view = getByTestId('themed-view');
    expect(view.props.accessibilityLabel).toBe('test-label');
  });
});
