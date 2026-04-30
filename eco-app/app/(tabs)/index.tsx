import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ecoponto } from '@/constants/ecopontos';
import { ouvirEcopontos, seedEcopontos, getFavoritos, toggleFavorito } from '@/services/firestore';
import { useEffect } from 'react';

const ESTADO_STYLE: Record<string, object> = {
  'Cheio':      { backgroundColor: '#FEF3C7' },
  'Danificado': { backgroundColor: '#FEE2E2' },
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [ecopontos, setEcopontos] = useState<Ecoponto[]>([]);
  const [favoritos, setFavoritos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    seedEcopontos();
    const unsubscribe = ouvirEcopontos((dados) => {
      setEcopontos(dados);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useFocusEffect(useCallback(() => {
    getFavoritos().then(setFavoritos);
  }, []));

  const handleDesfavoritar = async (id: string) => {
    setFavoritos(prev => prev.filter(f => f !== id));
    await toggleFavorito(id, true);
  };

  const ecopontosFavoritos = ecopontos.filter(e => favoritos.includes(e.id));

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1B4332" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>

      <Text style={styles.titulo}>Ecopontos</Text>

      {/* Botão para ir à lista completa */}
      <TouchableOpacity style={styles.botaoLista} onPress={() => router.push('/ecopontos' as any)}>
        <View style={styles.botaoListaEsq}>
          <Text style={styles.botaoListaIcone}>♻</Text>
          <View>
            <Text style={styles.botaoListaTitulo}>Ver todos os ecopontos</Text>
            <Text style={styles.botaoListaSub}>Pesquisar, adicionar e favoritar</Text>
          </View>
        </View>
        <Text style={styles.botaoListaSeta}>›</Text>
      </TouchableOpacity>

      {/* Favoritos */}
      <Text style={styles.secaoTitulo}>★  Favoritos</Text>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {ecopontosFavoritos.length === 0 ? (
          <View style={styles.favVazio}>
            <Text style={styles.favVazioEmoji}>⭐</Text>
            <Text style={styles.favVazioTexto}>Ainda não tens favoritos</Text>
            <Text style={styles.favVazioSub}>Vai à lista de ecopontos e carrega em ☆ para adicionar.</Text>
          </View>
        ) : (
          ecopontosFavoritos.map(e => (
            <View key={e.id} style={styles.card} testID="recycling-bin-marker">
              <View style={styles.cardTopo}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardNome}>{e.nome}</Text>
                  <Text style={styles.cardMorada}>{e.morada}</Text>
                </View>
                <View style={styles.cardTopoDireita}>
                  <View style={[styles.estadoBadge, ESTADO_STYLE[e.estado]]}>
                    <Text style={styles.estadoTexto}>{e.estado}</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleDesfavoritar(e.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Text style={styles.starAtivo}>★</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.acoes}>
                <TouchableOpacity style={[styles.acao, { backgroundColor: '#1B4332' }]} onPress={() => router.push('/log-recycling' as any)}>
                  <Text style={styles.acaoTexto}>📸  Registar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.acao, { backgroundColor: '#4B5563' }]}
                  testID="review-bin-button"
                  onPress={() => router.push({ pathname: '/review-bin', params: { ecopontoId: e.id, ecopontoNome: e.nome } } as any)}
                >
                  <Text style={styles.acaoTexto}>⭐  Avaliar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.acao, { backgroundColor: '#B91C1C' }]}
                  testID="report-problem-button"
                  onPress={() => router.push({ pathname: '/report-problem', params: { ecopontoNome: e.nome, ecopontoMorada: e.morada } } as any)}
                >
                  <Text style={styles.acaoTexto}>⚠  Reportar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, paddingHorizontal: 16, backgroundColor: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  titulo:           { fontSize: 28, fontWeight: '800', color: '#1a1a1a', letterSpacing: -0.5, marginBottom: 16, paddingHorizontal: 4 },

  botaoLista: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#F0F7F0', borderRadius: 14, padding: 16, marginBottom: 24, marginHorizontal: 4,
    borderWidth: 1, borderColor: '#D1EAD1',
  },
  botaoListaEsq:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  botaoListaIcone:  { fontSize: 28 },
  botaoListaTitulo: { fontSize: 15, fontWeight: '700', color: '#1B4332' },
  botaoListaSub:    { fontSize: 12, color: '#639922', marginTop: 2 },
  botaoListaSeta:   { fontSize: 24, color: '#1B4332', fontWeight: '300' },

  secaoTitulo: { fontSize: 13, fontWeight: '700', color: '#aaa', letterSpacing: 0.5, marginBottom: 12, paddingHorizontal: 4 },

  favVazio:      { alignItems: 'center', paddingVertical: 40 },
  favVazioEmoji: { fontSize: 40, marginBottom: 12 },
  favVazioTexto: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 6 },
  favVazioSub:   { fontSize: 13, color: '#aaa', textAlign: 'center', paddingHorizontal: 24 },

  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, marginHorizontal: 4,
    borderWidth: 1, borderColor: '#efefef',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  cardTopo:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  cardTopoDireita:{ alignItems: 'flex-end', gap: 6 },
  cardNome:       { fontSize: 15, fontWeight: '700', color: '#1a1a1a', marginBottom: 2 },
  cardMorada:     { fontSize: 12, color: '#aaa' },
  starAtivo:      { fontSize: 20, color: '#F59E0B' },

  estadoBadge:    { backgroundColor: '#D1FAE5', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  estadoTexto:    { fontSize: 11, fontWeight: '600', color: '#1B4332' },

  acoes:     { flexDirection: 'row', gap: 7 },
  acao:      { flex: 1, borderRadius: 8, paddingVertical: 9, alignItems: 'center' },
  acaoTexto: { color: '#fff', fontSize: 11, fontWeight: '600' },
});
