import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { addEcoponto } from '@/services/firestore';
import { Ecoponto } from '@/constants/ecopontos';

const ESTADOS: Ecoponto['estado'][] = ['Operacional', 'Cheio', 'Danificado'];

async function geocodificarMorada(morada: string) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(morada)}&format=json&limit=1`;
  const resposta = await fetch(url, { headers: { 'User-Agent': 'MyImpact-EcoApp/1.0' } });
  const dados = await resposta.json();
  if (!dados.length) return null;
  return { latitude: parseFloat(dados[0].lat), longitude: parseFloat(dados[0].lon) };
}

export default function AddEcopontoScreen() {
  const router = useRouter();
  const [nome, setNome] = useState('');
  const [morada, setMorada] = useState('');
  const [estado, setEstado] = useState<Ecoponto['estado']>('Operacional');
  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    if (!nome.trim()) {
      Alert.alert('Erro', 'O nome é obrigatório.');
      return;
    }
    if (!morada.trim()) {
      Alert.alert('Erro', 'A morada é obrigatória.');
      return;
    }

    setGuardando(true);
    try {
      const coordenadas = await geocodificarMorada(morada);
      if (!coordenadas) {
        Alert.alert('Morada não encontrada', 'Não foi possível encontrar esta morada. Tenta ser mais específico (ex: "Rua das Flores, Porto").');
        return;
      }
      await addEcoponto({ nome, morada, estado, coordenadas });
      Alert.alert('Sucesso', 'Ecoponto adicionado!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert('Erro', 'Não foi possível guardar o ecoponto.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.label}>Nome *</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex: Ecoponto Rua das Flores"
        value={nome}
        onChangeText={setNome}
      />

      <Text style={styles.label}>Morada *</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex: Rua das Flores, Porto"
        value={morada}
        onChangeText={setMorada}
      />

      <Text style={styles.label}>Estado</Text>
      <View style={styles.estadosRow}>
        {ESTADOS.map((e) => (
          <TouchableOpacity
            key={e}
            style={[styles.estadoBtn, estado === e && styles.estadoBtnAtivo]}
            onPress={() => setEstado(e)}
          >
            <Text style={[styles.estadoBtnTexto, estado === e && styles.estadoBtnTextoAtivo]}>
              {e}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.botaoGuardar, guardando && { opacity: 0.7 }]}
        onPress={guardar}
        disabled={guardando}
      >
        {guardando
          ? <><ActivityIndicator color="#fff" /><Text style={styles.botaoGuardarTexto}>  A localizar morada...</Text></>
          : <Text style={styles.botaoGuardarTexto}>Guardar Ecoponto</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  label: { fontSize: 15, fontWeight: '600', color: '#1a1a1a', marginBottom: 8, marginTop: 16 },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 10,
    padding: 13, fontSize: 15, color: '#333', backgroundColor: '#fafafa',
  },
  estadosRow: { flexDirection: 'row', gap: 10 },
  estadoBtn: {
    borderWidth: 1, borderColor: '#ccc', borderRadius: 10,
    paddingVertical: 10, paddingHorizontal: 16, backgroundColor: '#fff',
  },
  estadoBtnAtivo: { borderColor: '#1B4332', backgroundColor: '#D1FAE5' },
  estadoBtnTexto: { fontSize: 13, color: '#333' },
  estadoBtnTextoAtivo: { color: '#1B4332', fontWeight: '700' },
  botaoGuardar: {
    backgroundColor: '#1B4332', borderRadius: 12, padding: 16, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', marginTop: 32, marginBottom: 40,
  },
  botaoGuardarTexto: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
