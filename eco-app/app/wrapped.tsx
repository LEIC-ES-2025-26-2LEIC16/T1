import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Linking, Share, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import { getHistoricoReciclagem } from '@/services/firestore';

// Define the shape of our aggregated data
type WrappedStats = {
  totalItems: number;
  co2Saved: number;
  activeMonths: number;
  topItems: { name: string; count: number }[];
  topLocation: string;
  topLocationVisits: number;
  peakMonth: string;
  peakMonthItems: number;
};

export default function WrappedScreen() {
  const [locationStatus] = Location.useForegroundPermissions();
  const [showPartialWrapped, setShowPartialWrapped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [wrappedData, setWrappedData] = useState<WrappedStats | null>(null);

  useEffect(() => {
    async function calculateWrappedData() {
      try {
        // 1. Fetch real data from the database
        const registos = await getHistoricoReciclagem();

        if (!registos || registos.length === 0) {
          setWrappedData(null);
          setIsLoading(false);
          return;
        }

        // 2. Variables to hold our calculations
        let totalCo2 = 0;
        const monthsSet = new Set();
        const materialsCount: Record<string, number> = {};
        const locationsCount: Record<string, number> = {};
        const monthsCount: Record<number, number> = {};

        const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

        // 3. Process each recycling log
        registos.forEach((reg: any) => {
          // Parse CO2 impact (e.g., "0.5kg CO2" -> 0.5)
          const co2 = parseFloat(reg.impact) || 0;
          totalCo2 += co2;

          // Parse Date to get the month
          const dateObj = new Date(reg.date);
          const monthKey = dateObj.getMonth();
          monthsSet.add(monthKey);
          monthsCount[monthKey] = (monthsCount[monthKey] || 0) + 1;

          // Process Materials
          const mat = reg.type || 'Outro';
          materialsCount[mat] = (materialsCount[mat] || 0) + 1;

          // Process Location (If you save it in the future, it reads it here)
          const loc = reg.location || reg.ecopontoNome || 'Ecoponto Local';
          locationsCount[loc] = (locationsCount[loc] || 0) + 1;
        });

        // 4. Calculate Top 3 Materials
        const topItems = Object.entries(materialsCount)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 3); // Keep only top 3

        // 5. Calculate Peak Month
        let peakMonthIndex = 0;
        let peakMonthItems = 0;
        Object.entries(monthsCount).forEach(([monthStr, count]) => {
          if (count > peakMonthItems) {
            peakMonthItems = count;
            peakMonthIndex = parseInt(monthStr);
          }
        });

        // 6. Calculate Top Location
        let topLoc = 'Ecoponto da Zona';
        let topLocVisits = 0;
        Object.entries(locationsCount).forEach(([loc, count]) => {
          if (count > topLocVisits) {
            topLocVisits = count;
            topLoc = loc;
          }
        });

        // 7. Save to state
        setWrappedData({
          totalItems: registos.length,
          co2Saved: parseFloat(totalCo2.toFixed(1)), // Keep 1 decimal place
          activeMonths: monthsSet.size,
          topItems,
          topLocation: topLoc,
          topLocationVisits: topLocVisits,
          peakMonth: monthNames[peakMonthIndex],
          peakMonthItems,
        });

      } catch (error) {
        console.error("Erro ao calcular Wrapped:", error);
      } finally {
        setIsLoading(false);
      }
    }

    calculateWrappedData();
  }, []);

  const handleShare = async () => {
    if (!wrappedData) return;
    try {
      await Share.share({
        message: `O meu ano em reciclagem! Poupei ${wrappedData.co2Saved}kg de CO2 no MyImpact 🌍♻️ Junta-te a mim!`,
      });
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível partilhar.');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1B4332" />
        <Text style={styles.loadingText}>A calcular o teu impacto...</Text>
      </View>
    );
  }

  // Se o utilizador criou a conta agora e não tem dados
  if (!wrappedData) {
    return (
      <View style={styles.loadingContainer} testID="wrapped-empty-state">
        <Text style={styles.lockIcon}>🌱</Text>
        <Text style={styles.incompleteTitle}>Ainda sem dados</Text>
        <Text style={styles.incompleteDescription}>
          Começa a registar as tuas reciclagens para poderes ver o teu Wrapped de final de ano!
        </Text>
      </View>
    );
  }

  const hasLocationDenied = locationStatus && locationStatus.status !== 'granted';

  // Scenario 2: Incomplete Wrapped
  if (hasLocationDenied && !showPartialWrapped) {
    return (
      <View style={styles.incompleteContainer}>
        <Text style={styles.lockIcon}>🔒</Text>
        <Text style={styles.incompleteTitle}>Wrapped incompleto</Text>
        <Text style={styles.incompleteDescription}>
          Não conseguimos gerar o teu resumo porque a localização está desativada. A localização é necessária para mostrar onde reciclaste mais.
        </Text>

        <View style={styles.blockedSections}>
          <Text style={styles.blockedSectionTitle}>Secções Bloqueadas:</Text>
          <Text style={styles.blockedItem}>📍 Onde mais reciclaste</Text>
          <Text style={styles.blockedItem}>📍 Ecoponto mais visitado</Text>
        </View>

        <TouchableOpacity style={styles.enableLocationButton} onPress={() => Linking.openSettings()}>
          <Text style={styles.enableLocationText}>Ativar Localização</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.partialButton} onPress={() => setShowPartialWrapped(true)}>
          <Text style={styles.partialButtonText}>Ver Wrapped parcial mesmo assim</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Scenario 1: Successful or Partial Wrapped
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }} testID="wrapped-content">
      <Text style={styles.badge}>WRAPPED 2026</Text>
      <Text style={styles.headerTitle}>O teu ano em reciclagem</Text>
      <Text style={styles.headerSubtitle}>Aqui está tudo o que fizeste pelo planeta este ano ✨</Text>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{wrappedData.totalItems}</Text>
          <Text style={styles.statLabel}>Itens</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{wrappedData.co2Saved} kg</Text>
          <Text style={styles.statLabel}>CO2</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{wrappedData.activeMonths}</Text>
          <Text style={styles.statLabel}>Meses</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>O QUE MAIS RECICLASTE</Text>
      <View style={styles.sectionCard}>
        {wrappedData.topItems.map((item, index) => (
          <View key={item.name} style={styles.topItemRow}>
            <Text style={styles.topItemRank}>#{index + 1}</Text>
            <Text style={styles.topItemName}>{item.name}</Text>
            <Text style={styles.topItemCount}>{item.count}x</Text>
          </View>
        ))}
      </View>

      {/* Esconde a localização se for o Wrapped Parcial */}
      {(!hasLocationDenied) && (
        <>
          <Text style={styles.sectionTitle}>ONDE MAIS RECICLASTE</Text>
          <View style={styles.sectionCard}>
            <Text style={styles.locationName}>{wrappedData.topLocation}</Text>
            <Text style={styles.locationVisits}>{wrappedData.topLocationVisits} visitas este ano</Text>
          </View>
        </>
      )}

      <Text style={styles.sectionTitle}>QUANDO RECICLASTE MAIS</Text>
      <View style={styles.sectionCard}>
        <Text style={styles.monthName}>Pico em {wrappedData.peakMonth}</Text>
        <Text style={styles.monthStats}>{wrappedData.peakMonthItems} registos nesse mês</Text>
      </View>

      <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
        <Text style={styles.shareButtonText}>Partilhar Wrapped</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', padding: 20 },
  loadingText: { marginTop: 12, fontSize: 16, color: '#1B4332', fontWeight: '600' },
  
  incompleteContainer: { flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', padding: 30 },
  lockIcon: { fontSize: 60, marginBottom: 20 },
  incompleteTitle: { fontSize: 24, fontWeight: 'bold', color: '#1a1a1a', textAlign: 'center', marginBottom: 12 },
  incompleteDescription: { fontSize: 15, color: '#666', textAlign: 'center', marginBottom: 30, lineHeight: 22 },
  blockedSections: { backgroundColor: '#f9f9f9', width: '100%', padding: 20, borderRadius: 12, marginBottom: 30, borderWidth: 1, borderColor: '#eee' },
  blockedSectionTitle: { fontSize: 13, fontWeight: 'bold', color: '#DC2626', marginBottom: 12, textTransform: 'uppercase' },
  blockedItem: { fontSize: 15, color: '#666', marginBottom: 8 },
  enableLocationButton: { backgroundColor: '#1B4332', borderRadius: 12, padding: 16, width: '100%', marginBottom: 16 },
  enableLocationText: { color: '#fff', textAlign: 'center', fontSize: 16, fontWeight: 'bold' },
  partialButton: { padding: 15 },
  partialButtonText: { color: '#666', textAlign: 'center', fontSize: 15, fontWeight: '600' },

  container: { flex: 1, backgroundColor: '#fff', padding: 24 },
  badge: { alignSelf: 'flex-start', backgroundColor: '#EAF3DE', color: '#1B4332', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, fontSize: 12, fontWeight: 'bold', overflow: 'hidden', marginBottom: 16, marginTop: 10 },
  headerTitle: { fontSize: 32, fontWeight: '800', color: '#1a1a1a', marginBottom: 8, lineHeight: 36 },
  headerSubtitle: { fontSize: 16, color: '#666', marginBottom: 30 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginBottom: 40 },
  statCard: { flex: 1, backgroundColor: '#f7f7f7', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 0.5, borderColor: '#e0e0e0' },
  statValue: { fontSize: 24, fontWeight: '800', color: '#1B4332', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#666', textTransform: 'uppercase', fontWeight: '600' },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#aaa', letterSpacing: 1, marginBottom: 12 },
  sectionCard: { backgroundColor: '#f9f9f9', borderRadius: 12, padding: 20, marginBottom: 30, borderWidth: 1, borderColor: '#eee' },
  topItemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  topItemRank: { fontSize: 16, fontWeight: 'bold', color: '#aaa', width: 30 },
  topItemName: { fontSize: 18, fontWeight: '600', color: '#1a1a1a', flex: 1 },
  topItemCount: { fontSize: 16, fontWeight: 'bold', color: '#1B4332' },
  locationName: { fontSize: 18, fontWeight: '700', color: '#1a1a1a', marginBottom: 4 },
  locationVisits: { fontSize: 15, color: '#666' },
  monthName: { fontSize: 18, fontWeight: '700', color: '#1a1a1a', marginBottom: 4 },
  monthStats: { fontSize: 15, color: '#666' },
  shareButton: { backgroundColor: '#1B4332', borderRadius: 12, padding: 18, alignItems: 'center', marginTop: 10, marginBottom: 20 },
  shareButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});