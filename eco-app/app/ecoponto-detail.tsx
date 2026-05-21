import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { getFavoritos, toggleFavorito } from '@/services/firestore';

const ESTADO: Record<string, { cor: string; fundo: string; heroCor: string; label: string }> = {
  Operacional: { cor: '#1B4332', fundo: '#D1FAE5', heroCor: '#1B4332', label: 'Operacional' },
  Cheio:       { cor: '#92400E', fundo: '#FEF3C7', heroCor: '#B45309', label: 'Cheio'       },
  Danificado:  { cor: '#991B1B', fundo: '#FEE2E2', heroCor: '#B91C1C', label: 'Danificado'  },
};

export default function EcopontoDetailScreen() {
  const router = useRouter();
  // Grab the params passed from the previous screen
  const { ecopontoId, ecopontoNome, ecopontoMorada, ecopontoEstado, ultimaRecolha, proximaRecolha } = useLocalSearchParams<{
    ecopontoId: string;
    ecopontoNome: string;
    ecopontoMorada: string;
    ecopontoEstado: string;
    ultimaRecolha?: string; // Optional: last collection date
    proximaRecolha?: string; // Optional: next collection date
  }>();

  const [isFav, setIsFav] = useState(false);

  useFocusEffect(useCallback(() => {
    getFavoritos().then(favs => setIsFav(favs.includes(ecopontoId)));
  }, [ecopontoId]));

  const handleToggleFav = async () => {
    setIsFav(prev => !prev);
    await toggleFavorito(ecopontoId, isFav);
  };

  const estadoInfo = ESTADO[ecopontoEstado] ?? ESTADO['Operacional'];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 48 }} showsVerticalScrollIndicator={false}>

      {/* Hero section with the big icon and favorite button */}
      <View style={[styles.hero, { backgroundColor: estadoInfo.heroCor }]}>
        <View style={styles.heroIconeWrap}>
          <Text style={styles.heroIcone}>♻</Text>
        </View>
        <TouchableOpacity
          style={[styles.favBtn, isFav && styles.favBtnAtivo]}
          onPress={handleToggleFav}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.favBtnTexto}>{isFav ? '★' : '☆'}</Text>
        </TouchableOpacity>
      </View>

      {/* Basic info about the recycling bin */}
      <View style={styles.infoSection}>
        <View style={styles.infoTopo}>
          <Text style={styles.nome}>{ecopontoNome}</Text>
          <View style={[styles.estadoBadge, { backgroundColor: estadoInfo.fundo }]}>
            <Text style={[styles.estadoTexto, { color: estadoInfo.cor }]}>{estadoInfo.label}</Text>
          </View>
        </View>
        <View style={styles.moradaRow}>
          <Text style={styles.moradaIcone}>♻</Text>
          <Text style={styles.morada}>{ecopontoMorada}</Text>
        </View>
      </View>

      {/* Maintenance History Section */}
      <View style={styles.manutencaoSection}>
        {(ultimaRecolha && proximaRecolha) ? (
          // Happy path: We have collection dates
          <View style={styles.manutencaoBox}>
            <View style={styles.manutencaoRow}>
              <Text style={styles.manutencaoLabel}>Última Recolha:</Text>
              <Text style={styles.manutencaoValor}>{ultimaRecolha}</Text>
            </View>
            <View style={styles.manutencaoRow}>
              <Text style={styles.manutencaoLabel}>Próxima Recolha:</Text>
              <Text style={styles.manutencaoValor}>{proximaRecolha}</Text>
            </View>
          </View>
        ) : (
          // Exception: No collection dates available
          <View style={[styles.manutencaoBox, styles.manutencaoIndisponivel]}>
            <Text style={styles.manutencaoIndisponivelTexto}>
              Horário de recolha indisponível para este local.
            </Text>
          </View>
        )}
      </View>

      <View style={styles.divisor} />

      <Text style={styles.secaoLabel}>O QUE QUERES FAZER?</Text>

      <TouchableOpacity
        style={styles.acaoCard}
        activeOpacity={0.85}
        onPress={() => router.push({ pathname: '/log-recycling', params: { ecopontoId, ecopontoNome } } as any)}
      >
        <View style={[styles.acaoIconeWrap, { backgroundColor: '#D1FAE5' }]}>
          <Text style={styles.acaoIcone}>♻</Text>
        </View>
        <View style={styles.acaoTextos}>
          <Text style={styles.acaoTitulo}>Registar reciclagem</Text>
          <Text style={styles.acaoSub}>Fotografa e regista o que reciclaste aqui</Text>
        </View>
        <Text style={styles.acaoSeta}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.acaoCard}
        activeOpacity={0.85}
        testID="review-bin-button"
        onPress={() => router.push({ pathname: '/review-bin', params: { ecopontoId, ecopontoNome } } as any)}
      >
        <View style={[styles.acaoIconeWrap, { backgroundColor: '#FEF3C7' }]}>
          <Text style={styles.acaoIcone}>★</Text>
        </View>
        <View style={styles.acaoTextos}>
          <Text style={styles.acaoTitulo}>Avaliar ecoponto</Text>
          <Text style={styles.acaoSub}>Deixa a tua opinião sobre este local</Text>
        </View>
        <Text style={styles.acaoSeta}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.acaoCard}
        activeOpacity={0.85}
        testID="report-problem-button"
        onPress={() => router.push({ pathname: '/report-problem', params: { ecopontoNome, ecopontoMorada } } as any)}
      >
        <View style={[styles.acaoIconeWrap, { backgroundColor: '#FEE2E2' }]}>
          <Text style={styles.acaoIcone}>!</Text>
        </View>
        <View style={styles.acaoTextos}>
          <Text style={styles.acaoTitulo}>Reportar problema</Text>
          <Text style={styles.acaoSub}>Cheio, danificado ou mal localizado</Text>
        </View>
        <Text style={styles.acaoSeta}>›</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  hero: {
    height: 160,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  heroIconeWrap: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  heroIcone: { fontSize: 36 },
  favBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  favBtnAtivo:  { backgroundColor: 'rgba(255,255,255,0.35)' },
  favBtnTexto:  { fontSize: 22, color: '#fff' },

  infoSection: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 },
  infoTopo:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  nome:        { fontSize: 20, fontWeight: '800', color: '#1a1a1a', flex: 1, marginRight: 12 },
  estadoBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  estadoTexto: { fontSize: 12, fontWeight: '700' },
  moradaRow:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  moradaIcone: { fontSize: 14 },
  morada:      { fontSize: 14, color: '#888', flex: 1 },

  // Maintenance section styles
  manutencaoSection: {
    paddingHorizontal: 20,
    marginTop: 4,
  },
  manutencaoBox: {
    backgroundColor: '#fcfcfc',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    gap: 12,
  },
  manutencaoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  manutencaoLabel: { fontSize: 14, color: '#888' },
  manutencaoValor: { fontSize: 14, fontWeight: '600', color: '#1a1a1a' },
  manutencaoIndisponivel: { backgroundColor: '#f5f5f5', alignItems: 'center' },
  manutencaoIndisponivelTexto: { fontSize: 13, color: '#999', textAlign: 'center', lineHeight: 18 },

  divisor: {
    height: 1, backgroundColor: '#f0f0f0', marginHorizontal: 20, marginTop: 24, marginBottom: 20,
  },

  secaoLabel: {
    fontSize: 11, fontWeight: '700', color: '#bbb',
    letterSpacing: 1, paddingHorizontal: 20, marginBottom: 12,
  },

  acaoCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    marginHorizontal: 16, marginBottom: 10,
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#f0f0f0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  acaoIconeWrap: {
    width: 48, height: 48, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  acaoIcone:  { fontSize: 22 },
  acaoTextos: { flex: 1 },
  acaoTitulo: { fontSize: 15, fontWeight: '700', color: '#1a1a1a', marginBottom: 2 },
  acaoSub:    { fontSize: 12, color: '#aaa' },
  acaoSeta:   { fontSize: 20, color: '#ccc' },
});
