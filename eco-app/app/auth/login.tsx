import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, View, Text } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/services/firebase';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erro', 'Preenche todos os campos.');
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged no _layout.tsx trata do redirect automático
    } catch (e: any) {
      const mensagens: Record<string, string> = {
        'auth/invalid-credential': 'Email ou password incorretos.',
        'auth/invalid-email': 'Email inválido.',
        'auth/user-not-found': 'Utilizador não encontrado.',
        'auth/wrong-password': 'Password incorreta.',
      };
      Alert.alert('Erro', mensagens[e.code] ?? 'Não foi possível entrar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>My Impact</Text>
      <Text style={styles.subtitulo}>Entra na tua conta</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#999"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#999"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={[styles.botao, loading && { opacity: 0.7 }]}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.botaoTexto}>Entrar</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/auth/register' as any)}>
        <Text style={styles.linkRegisto}>Não tens conta? <Text style={styles.linkRegisotDestaque}>Cria uma aqui</Text></Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#fff' },
  titulo: { fontSize: 32, fontWeight: 'bold', color: '#1B4332', marginBottom: 6, textAlign: 'center' },
  subtitulo: { fontSize: 16, color: '#666', marginBottom: 32, textAlign: 'center' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    fontSize: 15,
    color: '#333',
    marginBottom: 15,
    backgroundColor: '#fafafa',
  },
  botao: {
    backgroundColor: '#1B4332',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  botaoTexto: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  linkRegisto: { textAlign: 'center', color: '#666', fontSize: 14 },
  linkRegisotDestaque: { color: '#1B4332', fontWeight: '700' },
});
