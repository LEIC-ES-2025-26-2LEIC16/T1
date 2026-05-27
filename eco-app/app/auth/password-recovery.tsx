import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, View, Text } from 'react-native';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/services/firebase';
import { useRouter } from 'expo-router';

export default function PasswordRecoveryScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handlePasswordReset = async () => {
    if (!email) {
      Alert.alert('Erro', 'Por favor, insere o teu email.');
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert(
        'Verifica o teu email',
        'Se o endereço estiver registado, receberás um link de recuperação. Se não receberes, podes não ter conta.',
        [
          { text: 'Voltar ao Login', onPress: () => router.back() },
          { text: 'Criar conta', onPress: () => router.push('/auth/register' as any) },
        ]
      );
    } catch (e: any) {
      const mensagens: Record<string, string> = {
        // com a proteção contra enumeração de e-mail ativada, o Firebase não distingue
        // entre e-mails não registados e e-mails válidos para o sendPasswordResetEmail
        // qualquer erro que não seja um sucesso será tratado genericamente
      };
      Alert.alert('Erro', mensagens[e.code] ?? 'Não foi possível enviar o email de recuperação.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Recuperar acesso</Text>
      <Text style={styles.subtitulo}>Insere o teu email para receberes um link de recuperação.</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#999"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TouchableOpacity
        style={[styles.botao, loading && { opacity: 0.7 }]}
        onPress={handlePasswordReset}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.botaoTexto}>Enviar</Text>
        )}
      </TouchableOpacity>

      {__DEV__ && (
        <TouchableOpacity 
          testID="autofill-recovery" 
          onPress={() => setEmail('teste@exemplo.com')}
          style={{ width: 1, height: 1 }}
        />
      )}

      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.linkVoltar}>Voltar para o Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#fff' },
  titulo: { fontSize: 28, fontWeight: 'bold', color: '#1B4332', marginBottom: 8, textAlign: 'center' },
  subtitulo: { fontSize: 16, color: '#666', marginBottom: 32, textAlign: 'center' },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 15, fontSize: 15,
    color: '#333', marginBottom: 20, backgroundColor: '#fafafa',
  },
  botao: { backgroundColor: '#1B4332', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 20 },
  botaoTexto: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  linkVoltar: { textAlign: 'center', color: '#1B4332', fontWeight: '600', fontSize: 14, marginTop: 10 },
});