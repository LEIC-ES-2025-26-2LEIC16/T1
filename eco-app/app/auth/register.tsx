import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password) {
      Alert.alert("Erro", "Preenche todos os campos.");
      return;
    }
    
    setLoading(true);
    // TODO: Aqui entrará o método da tua colega: 
    // createUserWithEmailAndPassword(auth, email, password)
    
    console.log("Tentativa de registo com:", email);
    
    // Simulação de espera
    setTimeout(() => {
      setLoading(false);
      Alert.alert("Sucesso", "Conta preparada! Aguarda a ligação ao Firebase.");
    }, 1500);
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Bem-vindo ao My Impact</ThemedText>
      <ThemedText style={styles.subtitle}>Cria a tua conta para começar</ThemedText>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#ccc"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#ccc"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity 
        style={[styles.button, loading && { opacity: 0.7 }]} 
        onPress={handleRegister}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <ThemedText style={styles.buttonText}>Registar</ThemedText>
        )}
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  subtitle: { marginBottom: 30, opacity: 0.7 },
  input: {
    backgroundColor: '#1c1c1e', // Ajusta conforme o teu tema
    color: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: { color: '#fff', fontWeight: 'bold' }
});