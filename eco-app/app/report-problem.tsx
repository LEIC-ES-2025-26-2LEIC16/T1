// Ecrã do formulário de reporte de problema
import { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { guardarReporte } from '@/services/firestore';

// Tipos de problema disponíveis
const TIPOS_PROBLEMA = [
  { id: 'cheio', label: 'Contentor cheio', testID: 'problem-type-bin-full' },
  { id: 'danificado', label: 'Contentor danificado', testID: 'problem-type-damaged' },
  { id: 'cheiro', label: 'Mau cheiro', testID: 'problem-type-smell' },
  { id: 'outro', label: 'Outro', testID: 'problem-type-other' },
];

export default function ReportProblemScreen() {
  // tipoSelecionado guarda qual o tipo de problema escolhido
  const [tipoSelecionado, setTipSelecionado] = useState('');
  // descricao guarda o texto opcional que o utilizador escreve
  const [descricao, setDescricao] = useState('');
  const [enviando, setEnviando] = useState(false);
  const router = useRouter();
  const { ecopontoNome, ecopontoMorada } = useLocalSearchParams();

  const enviarReporte = async () => {
    setEnviando(true);
    try {
      await guardarReporte({
        ecopontoNome: String(ecopontoNome),
        ecopontoMorada: String(ecopontoMorada),
        tipo: tipoSelecionado,
        descricao,
      });
      router.push('/report-success');
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível enviar o reporte. Tenta novamente.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">

      {/* Info do ecoponto selecionado */}
      <View style={styles.ecopontoCard}>
        <Text style={styles.ecopontoNome}>{ecopontoNome || 'Ecoponto'}</Text>
        <Text style={styles.ecopontoMorada}>{ecopontoMorada || ''}</Text>
      </View>

      {/* Seleção do tipo de problema */}
      <Text style={styles.label}>Tipo de problema *</Text>
      <View style={styles.tiposGrid}>
        {TIPOS_PROBLEMA.map((tipo) => (
          <TouchableOpacity
            key={tipo.id}
            testID={tipo.testID}
            style={[styles.tipoBtn, tipoSelecionado === tipo.id && styles.tipoBtnSelecionado]}
            onPress={() => setTipSelecionado(tipo.id)}
          >
            <Text style={[styles.tipoBtnTexto, tipoSelecionado === tipo.id && styles.tipoBtnTextoSelecionado]}>
              {tipo.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Campo de descrição opcional */}
      <Text style={styles.label}>Descrição (opcional)</Text>
      <TextInput
        testID="description-input"
        style={styles.input}
        placeholder="Descreve o problema..."
        multiline
        numberOfLines={4}
        value={descricao}
        onChangeText={setDescricao}
      />

      {__DEV__ && (
        <TouchableOpacity 
          testID="autofill-report" 
          onPress={() => { setDescricao('O ecoponto amarelo esta a transbordar e tem sacos no chao.'); setTipSelecionado('cheio'); }}
          style={{ width: 1, height: 1 }}
        />
      )}

      {/* Botão enviar */}
      <TouchableOpacity
        style={[styles.botaoEnviar, (!tipoSelecionado || enviando) && styles.botaoDesativado]}
        onPress={enviarReporte}
        disabled={!tipoSelecionado || enviando}
        testID="submit-report-button"
      >
        <Text style={styles.botaoTexto}>{enviando ? 'A enviar...' : 'Enviar Reporte'}</Text>
      </TouchableOpacity>

    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  ecopontoCard: { backgroundColor: '#f5f5f5', borderRadius: 10, padding: 14, marginBottom: 20 },
  ecopontoNome: { fontSize: 16, fontWeight: '700', color: '#1a1a1a' },
  ecopontoMorada: { fontSize: 13, color: '#666', marginTop: 2 },
  label: { fontSize: 15, fontWeight: '600', color: '#1a1a1a', marginBottom: 10 },
  tiposGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  tipoBtn: { borderWidth: 1, borderColor: '#ccc', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 16, backgroundColor: '#fff' },
  tipoBtnSelecionado: { borderColor: '#1B4332', backgroundColor: '#D1FAE5' },
  tipoBtnTexto: { fontSize: 14, color: '#333' },
  tipoBtnTextoSelecionado: { color: '#1B4332', fontWeight: '700' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 10, padding: 12, fontSize: 14, color: '#333', minHeight: 100, textAlignVertical: 'top', marginBottom: 24 },
  botaoEnviar: { backgroundColor: '#1B4332', borderRadius: 12, padding: 16, marginBottom: 40 },
  botaoDesativado: { backgroundColor: '#999' },
  botaoTexto: { color: '#fff', textAlign: 'center', fontSize: 16, fontWeight: '700' },
});
