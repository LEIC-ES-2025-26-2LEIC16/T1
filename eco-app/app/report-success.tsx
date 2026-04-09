// Ecrã de confirmação após enviar o reporte
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function ReportSuccessScreen() {
  const router = useRouter();

  return (
    <View style={styles.container} testID="success-message">

      {/* Ícone de sucesso */}
      <View style={styles.iconeContainer}>
        <Text style={styles.icone}>✓</Text>
      </View>

      {/* Mensagem de sucesso */}
      <Text style={styles.titulo}>Reporte submetido com sucesso!</Text>
      <Text style={styles.descricao}>
        O teu reporte foi enviado e será analisado em breve.
      </Text>

      {/* Botão para voltar ao início */}
      <TouchableOpacity
        style={styles.botao}
        onPress={() => router.push('/')}
        testID="back-to-map-button"
      >
        <Text style={styles.botaoTexto}>Voltar ao início</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', padding: 30 },
  iconeContainer: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#D1FAE5', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  icone: { fontSize: 48, color: '#1B4332' },
  titulo: { fontSize: 22, fontWeight: '700', color: '#1a1a1a', textAlign: 'center', marginBottom: 12 },
  descricao: { fontSize: 15, color: '#666', textAlign: 'center', marginBottom: 40 },
  botao: { backgroundColor: '#1B4332', borderRadius: 12, padding: 16, width: '100%' },
  botaoTexto: { color: '#fff', textAlign: 'center', fontSize: 16, fontWeight: '700' },
});
