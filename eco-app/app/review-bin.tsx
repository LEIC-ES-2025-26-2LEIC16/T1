import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Modal, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import NetInfo from '@react-native-community/netinfo';
import { guardarReview } from '@/services/firestore';

export default function ReviewBinScreen() {
  const router = useRouter();
  const { ecopontoId, ecopontoNome } = useLocalSearchParams();

  // Estados locais da UI que não devem ser apagados em caso de erro de rede
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  
  // Estados de controlo do fluxo
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showErrorModal, setShowErrorModal] = useState<boolean>(false);
  const handleSubmit = async () => {
      if (rating === 0) {
        Alert.alert('Atenção', 'Por favor, seleciona pelo menos 1 estrela.');
        return;
      }

      setIsSubmitting(true);
      setShowErrorModal(false);

      try {
        // 1. VERIFICAÇÃO REAL DE REDE: Pergunta ao telemóvel se tem internet
        const networkState = await NetInfo.fetch();
        
        if (!networkState.isConnected) {
          setIsSubmitting(false);
          setShowErrorModal(true);
          return; 
        }

        // 2. ENVIO REAL PARA A BASE DE DADOS FIREBASE
        // Convertemos o ecopontoId para String para evitar erros do TypeScript
        await guardarReview(String(ecopontoId), rating, comment);

        // 3. SUCESSO
        Alert.alert(
          'Sucesso',
          'Obrigado pela tua avaliação!',
          [{ text: 'OK', onPress: () => router.back() }]
        );

      } catch (error) {
        // Se a internet cair a meio do envio ou o Firebase falhar, apanhamos o erro aqui
        setShowErrorModal(true);
      } finally {
        setIsSubmitting(false);
      }
    };
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        
        <View style={styles.header}>
          <Text style={styles.titulo}>Como avalias este ecoponto?</Text>
          <Text style={styles.subtitulo}>{ecopontoNome || 'Ecoponto selecionado'}</Text>
        </View>

        {/* Sistema de 5 Estrelas */}
        <View style={styles.estrelasContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity key={star} onPress={() => setRating(star)}>
              <Text style={[styles.estrela, rating >= star ? styles.estrelaAtiva : styles.estrelaInativa]}>
                ★
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Comentário Opcional */}
        <Text style={styles.label}>Comentário (opcional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Muito limpo e fácil de aceder..."
          placeholderTextColor="#999"
          multiline
          numberOfLines={4}
          value={comment}
          onChangeText={setComment}
        />

        {/* Botão Submeter */}
        <TouchableOpacity
          style={[styles.botaoSubmeter, (rating === 0 || isSubmitting) && styles.botaoDesativado]}
          onPress={handleSubmit}
          disabled={rating === 0 || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.botaoTexto}>Submeter</Text>
          )}
        </TouchableOpacity>

        {/* Cenário Excecional: Modal de Erro de Rede */}
        <Modal visible={showErrorModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalIcone}>!</Text>
              <Text style={styles.modalTitulo}>Erro de ligação</Text>
              <Text style={styles.modalMensagem}> 
                Não foi possível submeter a tua avaliação. Verifica a tua ligação à internet e tenta novamente.
              </Text>
              <View style={styles.modalBotoes}>
                <TouchableOpacity style={[styles.modalBotao, styles.botaoCancelar]} onPress={() => setShowErrorModal(false)}>
                  <Text style={styles.botaoCancelarTexto}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalBotao, styles.botaoTentarNovamente]} onPress={handleSubmit}>
                  <Text style={styles.botaoTentarTexto}>Tentar novamente</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#fff', padding: 24, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 30 },
  titulo: { fontSize: 20, fontWeight: 'bold', color: '#1a1a1a', textAlign: 'center', marginBottom: 8 },
  subtitulo: { fontSize: 16, color: '#666', textAlign: 'center' },
  
  estrelasContainer: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 40 },
  estrela: { fontSize: 50 },
  estrelaAtiva: { color: '#F59E0B' }, // Cor âmbar/amarela
  estrelaInativa: { color: '#E5E7EB' }, // Cor cinzenta

  label: { fontSize: 15, fontWeight: '600', color: '#1a1a1a', marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#333',
    backgroundColor: '#fafafa',
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 30,
  },
  
  botaoSubmeter: { backgroundColor: '#1B4332', borderRadius: 12, padding: 18, alignItems: 'center' },
  botaoDesativado: { backgroundColor: '#9CA3AF' },
  botaoTexto: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  // Estilos do Modal de Erro
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalBox: { backgroundColor: '#fff', borderRadius: 16, padding: 24, alignItems: 'center', width: '100%', elevation: 10 },
  modalIcone: { fontSize: 40, marginBottom: 16, fontWeight: '700', color: '#DC2626' },
  modalTitulo: { fontSize: 18, fontWeight: 'bold', color: '#DC2626', marginBottom: 10 },
  modalMensagem: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  modalBotoes: { flexDirection: 'row', gap: 12, width: '100%' },
  modalBotao: { flex: 1, padding: 14, borderRadius: 10, alignItems: 'center' },
  botaoCancelar: { backgroundColor: '#F3F4F6' },
  botaoCancelarTexto: { color: '#4B5563', fontWeight: '600', fontSize: 15 },
  botaoTentarNovamente: { backgroundColor: '#1B4332' },
  botaoTentarTexto: { color: '#fff', fontWeight: '600', fontSize: 15 },
});