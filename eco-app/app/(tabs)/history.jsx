import { StyleSheet, FlatList, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

// Dados fictícios para testares a UI enquanto o Firebase não chega
const MOCK_DATA = [
  { id: '1', date: '2026-04-15', type: 'Plástico', amount: '2kg', impact: '0.5kg CO2' },
  { id: '2', date: '2026-04-14', type: 'Papel', amount: '5kg', impact: '1.2kg CO2' },
  { id: '3', date: '2026-04-12', type: 'Vidro', amount: '1kg', impact: '0.3kg CO2' },
];

export default function HistoryScreen() {
  
  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View>
        <ThemedText type="defaultSemiBold">{item.type}</ThemedText>
        <ThemedText style={styles.date}>{item.date}</ThemedText>
      </View>
      <View style={styles.rightContent}>
        <ThemedText style={styles.amount}>{item.amount}</ThemedText>
        <ThemedText style={styles.impact}>{item.impact}</ThemedText>
      </View>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.header}>O Meu Impacto</ThemedText>
      
      <FlatList
        data={MOCK_DATA}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <ThemedText style={styles.empty}>Ainda não tens registos de reciclagem.</ThemedText>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 60 },
  header: { marginBottom: 20 },
  list: { paddingBottom: 20 },
  card: {
    backgroundColor: '#1c1c1e', // Cor escura para o tema dark
    padding: 15,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50', // Verde para eco-conscious
  },
  date: { fontSize: 12, opacity: 0.6, marginTop: 4 },
  amount: { fontSize: 16, fontWeight: 'bold', textAlign: 'right' },
  impact: { fontSize: 12, color: '#4CAF50', textAlign: 'right' },
  empty: { textAlign: 'center', marginTop: 50, opacity: 0.5 }
});