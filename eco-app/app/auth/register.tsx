import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/services/firebase';
import { processarReferral } from '@/services/firestore';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useLocalSearchParams } from 'expo-router';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { ref: codigoReferral } = useLocalSearchParams<{ ref?: string }>();

  const handleRegister = async () => {
    if (!email || !password) {
      Alert.alert('Erro', 'Preenche todos os campos.');
      return;
    }
    setLoading(true);
    try {
      const credencial = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, 'utilizadores', credencial.user.uid), {
        email: credencial.user.email,
        criadoEm: serverTimestamp(),
      });

      // Processa o referral se veio com código no link
      if (codigoReferral) {
        await processarReferral(codigoReferral);
      }

      Alert.alert('Sucesso', 'Conta criada com sucesso!');
    } catch (e: any) {
      const mensagens: Record<string, string> = {
        'auth/email-already-in-use': 'Este email já está registado.',
        'auth/invalid-email': 'Email inválido.',
        'auth/weak-password': 'A password deve ter pelo menos 6 caracteres.',
      };
      // Cenário 2: email já existe — não notificamos o dono do link
      Alert.alert('Erro', mensagens[e.code] ?? 'Não foi possível criar a conta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Bem-vindo ao My Impact</ThemedText>
      <ThemedText style={styles.subtitle}>Cria a tua conta para começar</ThemedText>
      <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#ccc" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#ccc" value={password} onChangeText={setPassword} secureTextEntry />
      <TouchableOpacity style={[styles.button, loading && { opacity: 0.7 }]} onPress={handleRegister} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.buttonText}>Registar</ThemedText>}
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  subtitle: { marginBottom: 30, opacity: 0.7 },
  input: { backgroundColor: '#1c1c1e', color: '#fff', padding: 15, borderRadius: 10, marginBottom: 15 },
  button: { backgroundColor: '#1B4332', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontWeight: 'bold' }
});
