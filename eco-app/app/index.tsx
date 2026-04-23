import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { Ecoponto } from '@/constants/ecopontos';
import { ouvirEcopontos, seedEcopontos } from '@/services/firestore';

export default function HomeScreen() {
  const router = useRouter();
  const [ecopontos, setEcopontos] = useState<Ecoponto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    seedEcopontos(); // popula a BD se estiver vazia
    const unsubscribe = ouvirEcopontos((dados: any[]) => {      setEcopontos(dados);
      setLoading(false);
    });
    return unsubscribe; // cancela o listener ao sair do ecrã
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1B4332" />
        <Text style={styles.loadingTexto}>A carregar ecopontos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.cabecalho}>
        <Text style={styles.titulo}>Ecopontos</Text>
        <TouchableOpacity style={styles.botaoAdicionar} onPress={() => router.push('/add-ecoponto' as any)}>
          <Text style={styles.botaoAdicionarTexto}>+ Adicionar</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={ecopontos}
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

            <Link href="/log-recycling" asChild>
             <TouchableOpacity style={styles.actionCard} activeOpacity={0.8}>
              <View style={styles.iconContainer}>
               <Text style={styles.iconText}>📸</Text>
              </View>
              <View style={styles.textContainer}>
               <Text style={styles.cardTitle}>Registar Reciclagem</Text>
               <Text style={styles.cardSubtitle}>Valida o material e ganha +50 pontos</Text>
              </View>
             </TouchableOpacity>
            </Link>

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
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  loadingTexto: { marginTop: 12, fontSize: 14, color: '#666' },
  cabecalho: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 40, marginBottom: 16 },
  titulo: { fontSize: 24, fontWeight: 'bold' },
  botaoAdicionar: { backgroundColor: '#1B4332', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  botaoAdicionarTexto: { color: '#fff', fontSize: 13, fontWeight: '600' },
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
  actionCard: {flexDirection: 'row',backgroundColor: '#ffffff',padding: 16,borderRadius: 12,alignItems: 'center',marginBottom: 12, },
  iconContainer: {backgroundColor: '#E6F4FE',padding: 12,borderRadius: 10,marginRight: 16,},
  iconText: {fontSize: 24,},
  textContainer: {flex: 1,},
  cardTitle: {fontSize: 16,fontWeight: 'bold',color: '#1a1a1a',marginBottom: 4,},
  cardSubtitle: {fontSize: 13,color: '#666666',},
});