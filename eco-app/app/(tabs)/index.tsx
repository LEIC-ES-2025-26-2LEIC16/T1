import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ECOPONTOS } from '@/constants/ecopontos';

export default function HomeScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Ecopontos</Text>

      <FlatList
        data={ECOPONTOS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card} testID="recycling-bin-marker">
            <View style={styles.cardTop}>
              <Text style={styles.nome}>{item.nome}</Text>
              <View style={[
                styles.estadoBadge,
                item.estado === 'Cheio' && styles.estadoCheio,
                item.estado === 'Danificado' && styles.estadoDanificado,
              ]}>
                <Text style={styles.estadoTexto}>{item.estado}</Text>
              </View>
            </View>
            <Text style={styles.morada}>{item.morada}</Text>

            <TouchableOpacity
              style={styles.botao}
              testID="report-problem-button"
              onPress={() =>
                router.push({
                  pathname: '/report-problem',
                  params: { ecopontoNome: item.nome, ecopontoMorada: item.morada },
                } as any)
              }
            >
              <Text style={styles.botaoTexto}>Reportar Problema</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  titulo: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, marginTop: 40 },
  card: { backgroundColor: '#f0f0f0', borderRadius: 10, padding: 16, marginBottom: 12 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nome: { fontSize: 16, fontWeight: '600', flex: 1 },
  morada: { fontSize: 13, color: '#666', marginTop: 4, marginBottom: 10 },
  estadoBadge: { backgroundColor: '#D1FAE5', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  estadoCheio: { backgroundColor: '#FEF3C7' },
  estadoDanificado: { backgroundColor: '#FEE2E2' },
  estadoTexto: { fontSize: 12, fontWeight: '600', color: '#1B4332' },
  botao: { backgroundColor: '#126439', borderRadius: 8, padding: 10 },
  botaoTexto: { color: '#fff', textAlign: 'center', fontWeight: '600' },
});
