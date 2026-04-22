import { StyleSheet, FlatList, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

const MOCK_DATA = [
  { id: '1', date: '2026-04-15', type: 'Plástico', amount: '2kg', impact: '0.5kg CO2' },
  { id: '2', date: '2026-04-14', type: 'Papel', amount: '5kg', impact: '1.2kg CO2' },
  { id: '3', date: '2026-04-12', type: 'Vidro', amount: '1kg', impact: '0.3kg CO2' },
];

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('pt-PT', {
    day: 'numeric',
    month: 'short',
  });
};

export default function HistoryScreen() {
  const renderItem = ({ item }) => (
  <View style={styles.card}>
    
    {/* LEFT */}
    <View>
      <ThemedText style={styles.type}>
        {item.type}
      </ThemedText>

      <ThemedText style={styles.date}>
        {formatDate(item.date)}
      </ThemedText>
    </View>

    {/* RIGHT */}
    <View style={styles.rightContent}>
      <ThemedText style={styles.amount}>
        {item.amount}
      </ThemedText>

      <ThemedText style={styles.impact}>
        {item.impact}
      </ThemedText>
    </View>

  </View>
);

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.header}>My Impact</ThemedText>
      <FlatList data={MOCK_DATA} renderItem={renderItem} keyExtractor={item => item.id} contentContainerStyle={styles.list} ListEmptyComponent={<ThemedText style={styles.empty}>Ainda não tens registos de reciclagem.</ThemedText>} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  header: { marginBottom: 20 },
  list: { paddingBottom: 20 },
  card: {
  backgroundColor: '#013220', 
  padding: 14,
  borderRadius: 12,
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 10,
  borderLeftWidth: 4,
  borderLeftColor: '#4CAF50',
},
 type: {
  fontSize: 16,
  fontWeight: '600',
},

date: {
  fontSize: 12,
  color: '#aaa',
  marginTop: 2,
},

amount: {
  fontSize: 16,
  fontWeight: 'bold',
  color: 'white',
},

impact: {
  fontSize: 12,
  color: '#4CAF50',
  marginTop: 2,
},

rightContent: {
  alignItems: 'flex-end',
},
});
