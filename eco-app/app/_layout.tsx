import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { onAuthStateChanged, User } from 'firebase/auth';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { auth } from '@/services/firebase';

export const unstable_settings = {
  anchor: '(tabs)',
};

function AuthGuard({ user }: { user: User | null | undefined }) {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (user === undefined) return; // ainda a verificar

    const emAutenticacao = segments[0] === 'auth';

    if (!user && !emAutenticacao) {
      router.replace('/auth/login' as any);
    } else if (user && emAutenticacao) {
      router.replace('/(tabs)' as any);
    }
  }, [user, segments]);

  return null;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return unsubscribe;
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AuthGuard user={user} />
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="auth" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal', headerBackTitle: 'Início' }} />
          <Stack.Screen name="report-problem" options={{ title: 'Reportar Problema', headerBackTitle: 'Início' }} />
          <Stack.Screen name="review-bin" options={{ title: 'Avaliar Ecoponto', headerBackTitle: 'Início' }} />
          <Stack.Screen name="report-success" options={{ headerShown: false }} />
          <Stack.Screen name="add-ecoponto" options={{ title: 'Adicionar Ecoponto', headerBackTitle: 'Início' }} />
          <Stack.Screen name="ecopontos" options={{ title: 'Ecopontos', headerBackTitle: 'Início' }} />
          <Stack.Screen name="ecoponto-detail" options={{ title: 'Ecoponto', headerBackTitle: 'Ecopontos' }} />
          <Stack.Screen name="wrapped" options={{ presentation: 'modal', title: 'O teu Wrapped' }} />
        <Stack.Screen name="user-profile" options={{ title: 'Perfil', headerBackTitle: 'Ranking' }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
