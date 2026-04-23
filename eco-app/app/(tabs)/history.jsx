import { StyleSheet, ScrollView, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

const MOCK_DATA = [
  { id: '1',  date: '2026-04-15', type: 'Plástico', amount: '2kg',  impact: '0.5kg CO2' },
  { id: '2',  date: '2026-04-14', type: 'Papel',    amount: '5kg',  impact: '1.2kg CO2' },
  { id: '3',  date: '2026-04-12', type: 'Vidro',    amount: '1kg',  impact: '0.3kg CO2' },
  { id: '4',  date: '2026-03-28', type: 'Plástico', amount: '3kg',  impact: '0.7kg CO2' },
  { id: '5',  date: '2026-03-20', type: 'Metal',    amount: '2kg',  impact: '0.9kg CO2' },
  { id: '6',  date: '2026-03-10', type: 'Papel',    amount: '4kg',  impact: '1.0kg CO2' },
  { id: '7',  date: '2026-02-22', type: 'Vidro',    amount: '3kg',  impact: '0.8kg CO2' },
  { id: '8',  date: '2026-02-14', type: 'Plástico', amount: '1kg',  impact: '0.3kg CO2' },
  { id: '9',  date: '2026-02-03', type: 'Papel',    amount: '6kg',  impact: '1.5kg CO2' },
  { id: '10', date: '2026-01-25', type: 'Metal',    amount: '1kg',  impact: '0.4kg CO2' },
  { id: '11', date: '2026-01-15', type: 'Vidro',    amount: '2kg',  impact: '0.6kg CO2' },
  { id: '12', date: '2026-01-05', type: 'Plástico', amount: '4kg',  impact: '1.0kg CO2' },
];

const formatDate = (date) =>
  new Date(date).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' });

const groupByMonth = (data) => {
  const groups = {};
  data.forEach(item => {
    const key = new Date(item.date).toLocaleDateString('pt-PT', {
      month: 'long', year: 'numeric',
    });
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  });
  return Object.entries(groups).map(([month, items]) => ({ month, items }));
};

const totalKg = MOCK_DATA.reduce((s, i) => s + parseFloat(i.amount), 0);
const totalCO2 = MOCK_DATA.reduce((s, i) => s + parseFloat(i.impact), 0).toFixed(1);

export default function HistoryScreen() {
  const renderCard = (item) => (
    <View key={item.id} style={styles.card}>
      <View style={styles.left}>
        <View style={styles.titleRow}>
          <ThemedText style={styles.type}>{item.type}</ThemedText>
          <View style={styles.badge}>
            <ThemedText style={styles.badgeText}>{item.amount}</ThemedText>
          </View>
        </View>
        <ThemedText style={styles.date}>{formatDate(item.date)}</ThemedText>
      </View>
      <ThemedText style={styles.impact}>−{item.impact}</ThemedText>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.subtitle}>desde janeiro 2026</ThemedText>
      <ThemedText type="title" style={styles.header}>My impact</ThemedText>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <ThemedText style={styles.summaryLabel}>total recycled</ThemedText>
          <ThemedText style={styles.summaryValue}>{totalKg} kg</ThemedText>
        </View>
        <View style={styles.summaryCard}>
          <ThemedText style={styles.summaryLabel}>CO2 saved</ThemedText>
          <ThemedText style={[styles.summaryValue, { color: '#3B6D11' }]}>{totalCO2} kg</ThemedText>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {groupByMonth(MOCK_DATA).map(({ month, items }) => (
          <View key={month} style={styles.group}>
            <ThemedText style={styles.sectionLabel}>{month.toUpperCase()}</ThemedText>
            {items.map(item => renderCard(item))}
          </View>
        ))}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, paddingHorizontal: 20, paddingTop: 24 },
  subtitle:     { fontSize: 13, color: '#888', marginBottom: 2 },
  header:       { marginBottom: 16 },
  summaryRow:   { flexDirection: 'row', gap: 8, marginBottom: 20 },
  summaryCard:  { flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 12, borderWidth: 0.5, borderColor: '#e0e0e0' },
  summaryLabel: { fontSize: 12, color: '#888', marginBottom: 4 },
  summaryValue: { fontSize: 20, fontWeight: '500' },
  list:         { paddingBottom: 40 },
  group:        { marginBottom: 16 },
  sectionLabel: { fontSize: 11, color: '#aaa', letterSpacing: 0.8, marginBottom: 8, fontWeight: '500' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: '#e0e0e0',
    borderLeftWidth: 3,
    borderLeftColor: '#639922',
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 7,
  },
  left:        { flex: 1 },
  titleRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  type:        { fontSize: 15, fontWeight: '500' },
  badge:       { backgroundColor: '#EAF3DE', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText:   { fontSize: 11, color: '#3B6D11' },
  date:        { fontSize: 12, color: '#aaa' },
  impact:      { fontSize: 13, fontWeight: '500', color: '#3B6D11' },
});