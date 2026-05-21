import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { StyleSheet, ScrollView, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getHistoricoReciclagem } from '@/services/firestore';
import { useThemeColors } from '@/hooks/use-theme-colors';

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

const CORES = {
  plastico: '#2563EB',
  papel: '#D97706',
  vidro: '#0891B2',
  metal: '#7C3AED',
  verde: '#1B4332',
  verdeClaro: '#639922',
};

const materialColor = (type) => {
  const t = (type || '').toLowerCase();
  if (t.includes('plastico') || t.includes('plástico')) return CORES.plastico;
  if (t.includes('papel')) return CORES.papel;
  if (t.includes('vidro')) return CORES.vidro;
  if (t.includes('metal')) return CORES.metal;
  return CORES.verde;
};

const materialLabel = (type) => {
  const t = (type || '').toLowerCase();
  if (t.includes('plastico') || t.includes('plástico')) return 'PL';
  if (t.includes('papel')) return 'PA';
  if (t.includes('vidro')) return 'VD';
  if (t.includes('metal')) return 'MT';
  return 'TD';
};

export default function HistoryScreen() {
  const colors = useThemeColors();
  const [registos, setRegistos] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      getHistoricoReciclagem()
        .then(setRegistos)
        .finally(() => setLoading(false));
    }, [])
  );

  const totalKg = registos.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0).toFixed(1);
  const totalCO2 = registos.reduce((s, i) => s + (parseFloat(i.impact) || 0), 0).toFixed(1);

  const renderCard = (item) => (
    <ThemedView key={item.id} style={styles.card}>
      <View style={[styles.cardIndicator, { backgroundColor: materialColor(item.type) }]} />
      <View style={styles.cardBody}>
        <View style={styles.cardRow}>
          <View style={[styles.materialBadge, { backgroundColor: materialColor(item.type) + '15' }]}>
            <ThemedText style={[styles.materialBadgeText, { color: materialColor(item.type) }]}>
              {materialLabel(item.type)}
            </ThemedText>
          </View>
          <ThemedText style={styles.cardAmount}>{parseFloat(item.amount || 0).toFixed(2)} kg</ThemedText>
        </View>
        <View style={styles.cardRow}>
          <ThemedText style={[styles.cardDate, { color: colors.textMuted }]}>{formatDate(item.date)}</ThemedText>
          <ThemedText style={[styles.cardImpact, { color: colors.secondary }]}>-{parseFloat(item.impact || 0).toFixed(2)} kg CO₂</ThemedText>
        </View>
        {item.ecopontoNome ? (
          <ThemedText style={[styles.cardEcoponto, { color: colors.textMuted }]}>📍 {item.ecopontoNome}</ThemedText>
        ) : null}
      </View>
    </ThemedView>
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.background }}>
      <ThemedView style={styles.container}>
        <View style={styles.headerRow}>
          <ThemedText style={styles.titulo}>Histórico</ThemedText>
          <ThemedText style={[styles.totalRegistos, { color: colors.textMuted }]}>{registos.length} registos</ThemedText>
        </View>

        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: colors.card, borderLeftColor: CORES.verde }]}>
            <View style={styles.summaryValueRow}>
              <ThemedText style={[styles.summaryValue, { color: colors.primary }]}>{totalKg}</ThemedText>
              <ThemedText style={[styles.summaryUnit, { color: colors.textMuted }]}> kg</ThemedText>
            </View>
            <ThemedText style={[styles.summaryLabel, { color: colors.textSecondary }]}>reciclados</ThemedText>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.card, borderLeftColor: CORES.verdeClaro }]}>
            <View style={styles.summaryValueRow}>
              <ThemedText style={[styles.summaryValue, { color: CORES.verdeClaro }]}>{totalCO2}</ThemedText>
              <ThemedText style={[styles.summaryUnit, { color: colors.textMuted }]}> kg</ThemedText>
            </View>
            <ThemedText style={[styles.summaryLabel, { color: colors.textSecondary }]}>CO2 poupado</ThemedText>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 48 }} color={colors.primary} />
        ) : registos.length === 0 ? (
          <ThemedText style={[styles.empty, { color: colors.textMuted }]}>Ainda não tens registos de reciclagem.</ThemedText>
        ) : (
          <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
            {groupByMonth(registos).map(({ month, items }) => (
              <View key={month} style={styles.group}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionLine, { backgroundColor: colors.divider }]} />
                  <ThemedText style={[styles.sectionLabel, { color: colors.textMuted }]}>{month.toUpperCase()}</ThemedText>
                  <View style={[styles.sectionLine, { backgroundColor: colors.divider }]} />
                </View>
                {items.map(item => renderCard(item))}
              </View>
            ))}
          </ScrollView>
        )}
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 8 },

  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline',
    marginBottom: 20, marginTop: 40,
  },
  titulo: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5, lineHeight: 36 },
  totalRegistos: { fontSize: 13, fontWeight: '500' },

  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 28 },
  summaryCard: {
    flex: 1, borderRadius: 14,
    padding: 16, borderLeftWidth: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  summaryValueRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 2 },
  summaryValue: { fontSize: 24, fontWeight: '800' },
  summaryUnit: { fontSize: 14, fontWeight: '600' },
  summaryLabel: { fontSize: 12, fontWeight: '500' },

  list: { paddingBottom: 40 },
  group: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginBottom: 14,
  },
  sectionLine: { flex: 1, height: 1 },
  sectionLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.6 },

  empty: { textAlign: 'center', marginTop: 48 },

  card: {
    flexDirection: 'row', borderRadius: 12,
    marginBottom: 8, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  cardIndicator: { width: 4 },
  cardBody: { flex: 1, padding: 14 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardRowNoMargin: { marginBottom: 0 },
  materialBadge: {
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
  },
  materialBadgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  cardAmount: { fontSize: 18, fontWeight: '700' },
  cardDate: { fontSize: 12 },
  cardImpact: { fontSize: 13, fontWeight: '600' },
  cardEcoponto: { fontSize: 11, marginTop: 1 },
});
