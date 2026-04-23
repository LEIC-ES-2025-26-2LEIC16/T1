import { useState, useCallback } from 'react';
import { StyleSheet, ScrollView, View, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getHistoricoReciclagem } from '@/services/firestore';

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

export default function HistoryScreen() {
  const [registos, setRegistos] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    getHistoricoReciclagem()
      .then(setRegistos)
      .finally(() => setLoading(false));
  }, []));

  const totalKg = registos.reduce((s, i) => s + parseFloat(i.amount), 0).toFixed(1);
  const totalCO2 = registos.reduce((s, i) => s + parseFloat(i.impact), 0).toFixed(1);

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
      <ThemedText style={styles.subtitle}>histórico de reciclagem</ThemedText>
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

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#639922" />
      ) : registos.length === 0 ? (
        <ThemedText style={styles.empty}>Ainda não tens registos de reciclagem.</ThemedText>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {groupByMonth(registos).map(({ month, items }) => (
            <View key={month} style={styles.group}>
              <ThemedText style={styles.sectionLabel}>{month.toUpperCase()}</ThemedText>
              {items.map(item => renderCard(item))}
            </View>
          ))}
        </ScrollView>
      )}
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
  empty:        { textAlign: 'center', color: '#aaa', marginTop: 40 },
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
