import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, TextInput } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ecoponto } from '@/constants/ecopontos';
import { ouvirEcopontos, getFavoritos, toggleFavorito } from '@/services/firestore';
import { useEffect } from 'react';

const ESTADO_STYLE: Record<string, object> = {
  'Cheio':      { backgroundColor: '#FEF3C7' },
  'Danificado': { backgroundColor: '#FEE2E2' },
};

export default function EcopontosScreen() {
  const router = useRouter();
  const [ecopontos, setEcopontos] = useState<Ecoponto[]>([]);
  const [favoritos, setFavoritos] = useState<string[]>([]);
  const [pesquisa, setPesquisa] = useState('');

  useEffect(() => {
    const unsubscribe = ouvirEcopontos(setEcopontos);
    return unsubscribe;
  }, []);

  useFocusEffect(useCallback(() => {
    getFavoritos().then(setFavoritos);
  }, []));

  const handleToggleFav = async (id: string) => {
    const isFav = favoritos.includes(id);
    setFavoritos(prev => isFav ? prev.filter(f => f !== id) : [...prev, id]);
    await toggleFavorito(id, isFav);
  };

  const filtrados = ecopontos.filter(e =>
    e.nome.toLowerCase().includes(pesquisa.toLowerCase()) ||
    e.morada.toLowerCase().includes(pesquisa.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.titulo}>Ecopontos</Text>
        <TouchableOpacity style={styles.botaoAdicionar} onPress={() => router.push('/add-ecoponto' as any)}>
          <Text style={styles.botaoAdicionarTexto}>+ Adicionar</Text>
        </TouchableOpacity>
      </View>

      {/* Pesquisa */}
      <View style={styles.pesquisaContainer}>
        <Text style={styles.pesquisaIcone}>🔍</Text>
        <TextInput
          style={styles.pesquisaInput}
          placeholder="Pesquisar por nome ou morada..."
          placeholderTextColor="#bbb"
          value={pesquisa}
          onChangeText={setPesquisa}
          clearButtonMode="while-editing"
        />
      </View>

      {/* Lista */}
      <FlatList
        data={filtrados}
        keyExtractor={e => e.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        ListEmptyComponent={
          <View style={styles.vazio}>
            <Text style={styles.vazioTexto}>Nenhum ecoponto encontrado.</Text>
          </View>
        }
        renderItem={({ item: e }) => {
          const isFav = favoritos.includes(e.id);
          return (
            <View style={styles.card} testID="recycling-bin-marker">
              <View style={styles.cardTopo}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardNome}>{e.nome}</Text>
                  <Text style={styles.cardMorada}>{e.morada}</Text>
                </View>
                <View style={styles.cardTopoDireita}>
                  <View style={[styles.estadoBadge, ESTADO_STYLE[e.estado]]}>
                    <Text style={styles.estadoTexto}>{e.estado}</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleToggleFav(e.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Text style={isFav ? styles.starAtivo : styles.starInativo}>{isFav ? '★' : '☆'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.acoes}>
                <TouchableOpacity
                  style={[styles.acao, { backgroundColor: '#1B4332' }]}
                  onPress={() => router.push('/log-recycling' as any)}
                >
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
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 16 },

  header:            { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, paddingBottom: 12 },
  titulo:            { fontSize: 22, fontWeight: '800', color: '#1a1a1a' },
  botaoAdicionar:    { backgroundColor: '#1B4332', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  botaoAdicionarTexto: { color: '#fff', fontSize: 13, fontWeight: '600' },

  pesquisaContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F5F5F5', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
    marginBottom: 16, gap: 8,
  },
  pesquisaIcone: { fontSize: 16 },
  pesquisaInput: { flex: 1, fontSize: 15, color: '#1a1a1a' },

  vazio:      { alignItems: 'center', paddingTop: 60 },
  vazioTexto: { fontSize: 15, color: '#aaa' },

  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: '#efefef',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  cardTopo:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  cardTopoDireita: { alignItems: 'flex-end', gap: 6 },
  cardNome:        { fontSize: 15, fontWeight: '700', color: '#1a1a1a', marginBottom: 2 },
  cardMorada:      { fontSize: 12, color: '#aaa' },
  starAtivo:       { fontSize: 22, color: '#F59E0B' },
  starInativo:     { fontSize: 22, color: '#ccc' },

  estadoBadge: { backgroundColor: '#D1FAE5', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  estadoTexto: { fontSize: 11, fontWeight: '600', color: '#1B4332' },

  acoes:     { flexDirection: 'row', gap: 7 },
  acao:      { flex: 1, borderRadius: 8, paddingVertical: 9, alignItems: 'center' },
  acaoTexto: { color: '#fff', fontSize: 11, fontWeight: '600' },
});
