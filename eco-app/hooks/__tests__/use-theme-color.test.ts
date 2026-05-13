import { renderHook } from '@testing-library/react-native';

const mockUseColorScheme = jest.fn();

jest.mock('@/hooks/use-color-scheme', () => ({
  useColorScheme: () => mockUseColorScheme(),
}));

jest.mock('@/constants/theme', () => ({
  Colors: {
    light: { text: '#11181C', background: '#fff', tint: '#0a7ea4', icon: '#687076', tabIconDefault: '#687076', tabIconSelected: '#0a7ea4' },
    dark: { text: '#ECEDEE', background: '#151718', tint: '#fff', icon: '#9BA1A6', tabIconDefault: '#9BA1A6', tabIconSelected: '#fff' },
  },
}));

import { useThemeColor } from '../use-theme-color';

beforeEach(() => {
  mockUseColorScheme.mockReset();
});

describe('useThemeColor', () => {
  it('deve retornar a cor das props para light mode', () => {
    mockUseColorScheme.mockReturnValue('light');
    const { result } = renderHook(() =>
      useThemeColor({ light: '#ff0000', dark: '#00ff00' }, 'text')
    );
    expect(result.current).toBe('#ff0000');
  });

  it('deve retornar a cor das props para dark mode', () => {
    mockUseColorScheme.mockReturnValue('dark');
    const { result } = renderHook(() =>
      useThemeColor({ light: '#ff0000', dark: '#00ff00' }, 'text')
    );
    expect(result.current).toBe('#00ff00');
  });

  it('deve usar cor do tema light quando props não têm light', () => {
    mockUseColorScheme.mockReturnValue('light');
    const { result } = renderHook(() =>
      useThemeColor({}, 'text')
    );
    expect(result.current).toBe('#11181C');
  });

  it('deve usar cor do tema dark quando props não têm dark', () => {
    mockUseColorScheme.mockReturnValue('dark');
    const { result } = renderHook(() =>
      useThemeColor({}, 'text')
    );
    expect(result.current).toBe('#ECEDEE');
  });

  it('deve retornar light como fallback quando theme é undefined', () => {
    mockUseColorScheme.mockReturnValue(undefined);
    const { result } = renderHook(() =>
      useThemeColor({}, 'background')
    );
    expect(result.current).toBe('#fff');
  });

  it('deve dar prioridade às props sobre o tema', () => {
    mockUseColorScheme.mockReturnValue('dark');
    const { result } = renderHook(() =>
      useThemeColor({ light: '#aaa', dark: '#bbb' }, 'text')
    );
    expect(result.current).toBe('#bbb');
  });
});
