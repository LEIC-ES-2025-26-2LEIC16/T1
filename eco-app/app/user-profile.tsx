import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, router } from 'expo-router';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '@/services/firebase';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  verificarAmizade, enviarPedidoAmizade, removerAmigo,
  getObjetivosPartilhados, criarObjetivoPartilhado, type ObjetivoPartilhado,
} from '@/services/firestore';

const BANNER_HEIGHT = 130;
const AVATAR_SIZE = 90;

export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [stats, setStats] = useState({ totalReciclagens: 0, totalKg: '0.0', totalCO2: '0.0', totalPontos: 0 });
  const [amizadeStatus, setAmizadeStatus] = useState<'nenhuma' | 'pendente' | 'aceite'>('nenhuma');
  const [objetivosPartilhados, setObjetivosPartilhados] = useState<(ObjetivoPartilhado & { progressoUid1: number; progressoUid2: number })[]>([]);
  const [mostrarComparacao, setMostrarComparacao] = useState(false);
  const [rankPos, setRankPos] = useState<number | null>(null);

  const isOwnProfile = auth.currentUser?.uid === userId;
  const isLoggedIn = !!auth.currentUser;

  useEffect(() => {
    if (!userId) return;
    const fetchData = async () => {
      try {
        const userRef = doc(db, 'utilizadores', userId);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }

        const registosQ = query(collection(db, 'registos_reciclagem'), where('userId', '==', userId));
        const registosSnap = await getDocs(registosQ);
        let totalKg = 0, totalCO2 = 0, totalPontos = 0;
        registosSnap.docs.forEach(d => {
          const data = d.data();
          totalKg += parseFloat(data.quantidade) || 0;
          totalCO2 += parseFloat(data.impactoCO2) || 0;
          totalPontos += (data.pontosAtribuidos as number) || 0;
        });
        setStats({
          totalReciclagens: registosSnap.size,
          totalKg: totalKg.toFixed(1),
          totalCO2: totalCO2.toFixed(1),
          totalPontos,
        });

        const [todosUsersSnap, todosRegistosSnap] = await Promise.all([
          getDocs(collection(db, 'utilizadores')),
          getDocs(collection(db, 'registos_reciclagem')),
        ]);
        const pontosPorUser: Record<string, number> = {};
        todosRegistosSnap.docs.forEach((d: any) => {
          const data = d.data();
          pontosPorUser[data.userId] = (pontosPorUser[data.userId] || 0) + (data.pontosAtribuidos || 0);
        });
        const ordenados = todosUsersSnap.docs
          .map((d: any) => ({ id: d.id, pts: d.data().totalPontos || pontosPorUser[d.id] || 0 }))
          .sort((a: any, b: any) => b.pts - a.pts);
        const pos = ordenados.findIndex((u: any) => u.id === userId);
        setRankPos(pos >= 0 ? pos + 1 : null);

        if (!isOwnProfile && isLoggedIn) {
          const status = await verificarAmizade(userId);
          setAmizadeStatus(status);

          if (status === 'aceite') {
            const partilhados = await getObjetivosPartilhados();
            setObjetivosPartilhados(partilhados.filter(o => o.uid1 === userId || o.uid2 === userId));
          }
        }
      } catch (e) {
        console.error('Erro ao carregar perfil:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  const iniciais = userData?.nome
    ? userData.nome.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : userData?.username?.[0]?.toUpperCase() ?? '?';

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#1B4332" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top }]}>
      <View style={[styles.bannerWrapper, { height: BANNER_HEIGHT }]}>
        {userData?.bannerUrl ? (
          <Image source={{ uri: userData.bannerUrl }} style={styles.bannerImage} contentFit="cover" />
        ) : (
          <View style={styles.banner} />
        )}
      </View>

      <View style={styles.profileHeader}>
        <View style={[styles.avatarWrapper, { marginTop: -(AVATAR_SIZE / 2) }]}>
          <View style={styles.avatar}>
            {userData?.avatarUrl ? (
              <Image source={{ uri: userData.avatarUrl }} style={styles.avatarImage} contentFit="cover" />
            ) : (
              <Text style={styles.avatarTexto}>{iniciais}</Text>
            )}
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={styles.nome}>{userData?.nome || userData?.username || 'Utilizador'}</Text>
          {rankPos !== null && (
            <View style={[styles.rankBadge, rankPos <= 3 && { backgroundColor: rankPos === 1 ? '#FEF3C7' : rankPos === 2 ? '#F3F4F6' : '#FEF2F2' }]}>
              <Text style={[styles.rankBadgeTexto, rankPos <= 3 && { color: rankPos === 1 ? '#92400E' : rankPos === 2 ? '#4B5563' : '#991B1B' }]}>
                #{rankPos}
              </Text>
            </View>
          )}
        </View>
        {userData?.username && <Text style={styles.username}>@{userData.username}</Text>}
        {userData?.bio && <Text style={styles.bio}>{userData.bio}</Text>}
      </View>

      <View style={styles.separador} />

      <Text style={styles.secaoTitulo}>O MEU IMPACTO</Text>
      <View style={styles.grelha}>
        <View style={styles.statCard}>
          <Text style={styles.statValor}>{stats.totalReciclagens}</Text>
          <Text style={styles.statLabel}>reciclagens</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValor}>{stats.totalPontos}</Text>
          <Text style={styles.statLabel}>pontos</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValor}>{stats.totalKg} kg</Text>
          <Text style={styles.statLabel}>reciclado</Text>
        </View>
        <View style={[styles.statCard, styles.statCardVerde]}>
          <Text style={[styles.statValor, { color: '#1B4332' }]}>{stats.totalCO2} kg</Text>
          <Text style={[styles.statLabel, { color: '#1B4332' }]}>CO2 poupado</Text>
        </View>
      </View>

      {!isOwnProfile && isLoggedIn && (
        <View style={styles.acoesAmizade}>
          {amizadeStatus === 'nenhuma' && (
            <TouchableOpacity style={styles.botaoAmizade} onPress={async () => {
              try {
                await enviarPedidoAmizade(userId);
                setAmizadeStatus('pendente');
                Alert.alert('Pedido enviado', 'Pedido de amizade enviado!');
              } catch (e: any) { Alert.alert('Erro', e.message); }
            }}>
              <Text style={styles.botaoAmizadeTexto}>+ Adicionar amigo</Text>
            </TouchableOpacity>
          )}
          {amizadeStatus === 'pendente' && (
            <View style={[styles.botaoAmizade, styles.botaoPendente]}>
              <Text style={[styles.botaoAmizadeTexto, { color: '#999' }]}>Pedido enviado</Text>
            </View>
          )}
          {amizadeStatus === 'aceite' && (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity style={[styles.botaoAmizade, { flex: 1 }]} onPress={() => setMostrarComparacao(v => !v)}>
                <Text style={styles.botaoAmizadeTexto}>Comparar objetivos</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.botaoAmizade, styles.botaoRemoverAmigo]} onPress={() => {
                Alert.alert('Remover amigo', 'Tens a certeza?', [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Remover', style: 'destructive', onPress: async () => { await removerAmigo(userId); setAmizadeStatus('nenhuma'); } },
                ]);
              }}>
                <Text style={[styles.botaoAmizadeTexto, { color: '#DC2626' }]}>Remover</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {mostrarComparacao && amizadeStatus === 'aceite' && (
        <View style={styles.comparacao}>
          {objetivosPartilhados.length > 0 ? (
            <>
              <Text style={styles.secaoTitulo}>OBJETIVOS PARTILHADOS</Text>
              {objetivosPartilhados.map(o => {
                const meuProgresso = o.uid1 === auth.currentUser?.uid ? o.progressoUid1 : o.progressoUid2;
                const progressoAmigo = o.uid1 === auth.currentUser?.uid ? o.progressoUid2 : o.progressoUid1;
                return (
                  <View key={o.id} style={styles.objCard}>
                    <Text style={styles.objMaterial}>{o.material} · {o.metaKg} kg ({o.periodo})</Text>
                    <View style={styles.barraComparacao}>
                      <Text style={styles.barraLabel}>Tu: {meuProgresso.toFixed(1)} kg</Text>
                      <View style={styles.barraFundo}>
                        <View style={[styles.barraProgresso, { width: `${Math.min((meuProgresso / o.metaKg) * 100, 100)}%`, backgroundColor: '#1B4332' }]} />
                      </View>
                    </View>
                    <View style={styles.barraComparacao}>
                      <Text style={styles.barraLabel}>{userData?.nome || 'Amigo'}: {progressoAmigo.toFixed(1)} kg</Text>
                      <View style={styles.barraFundo}>
                        <View style={[styles.barraProgresso, { width: `${Math.min((progressoAmigo / o.metaKg) * 100, 100)}%`, backgroundColor: '#639922' }]} />
                      </View>
                    </View>
                  </View>
                );
              })}
            </>
          ) : (
            <View style={styles.semObjetivos}>
              <Text style={{ fontSize: 14, color: '#aaa', textAlign: 'center', marginBottom: 12 }}>
                Ainda não têm objetivos partilhados.
              </Text>
              <TouchableOpacity style={styles.botaoCriarPartilhado} onPress={() => {
                Alert.alert('Criar objetivo partilhado', 'Material (Todos/Plastico/Papel/Vidro/Metal):', [
                  { text: 'Cancelar', style: 'cancel' },
                  {
                    text: 'Seguinte',
                    onPress: () => {
                      // Simple creation via prompt
                      const materiais = ['Todos', 'Plastico', 'Papel', 'Vidro', 'Metal'];
                      Alert.alert('Escolhe o material', '', [
                        ...materiais.map(m => ({
                          text: m,
                          onPress: () => {
                            Alert.alert('Meta (kg)', 'Quantos kg?', [
                              { text: 'Cancelar', style: 'cancel' },
                              {
                                text: 'Criar',
                                onPress: async () => {
                                  // Will use a different approach - navigate to objetivos
                                },
                              },
                            ]);
                          },
                        })),
                        { text: 'Cancelar', style: 'cancel' },
                      ]);
                    },
                  },
                ]);
              }}>
                <Text style={styles.botaoCriarPartilhadoTexto}>Criar objetivo partilhado</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#fff', paddingBottom: 48 },
  bannerWrapper: { overflow: 'hidden' },
  banner: { flex: 1, backgroundColor: '#1B4332' },
  bannerImage: { width: '100%', height: BANNER_HEIGHT },
  profileHeader: { alignItems: 'center', marginBottom: 20, paddingHorizontal: 20 },
  avatarWrapper: { marginBottom: 16 },
  avatar: {
    width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2,
    backgroundColor: '#639922', justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: '#fff', overflow: 'hidden',
  },
  avatarImage: { width: AVATAR_SIZE, height: AVATAR_SIZE },
  avatarTexto: { fontSize: 34, fontWeight: '700', color: '#fff' },
  nome:     { fontSize: 22, fontWeight: '700', color: '#1a1a1a' },
  username: { fontSize: 14, color: '#639922', fontWeight: '600', marginTop: 4 },
  bio:      { fontSize: 14, color: '#444', marginTop: 8, textAlign: 'center', lineHeight: 20, paddingHorizontal: 20 },
  separador:    { height: 1, backgroundColor: '#f0f0f0', marginVertical: 20, marginHorizontal: 20 },
  secaoTitulo:  { fontSize: 11, fontWeight: '600', color: '#aaa', letterSpacing: 0.8, marginBottom: 12, paddingHorizontal: 20 },
  grelha:       { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 20 },
  statCard:     { flex: 1, minWidth: '45%', backgroundColor: '#f7f7f7', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 0.5, borderColor: '#e8e8e8' },
  statCardVerde:{ backgroundColor: '#EAF3DE', borderColor: '#c4e0a0' },
  statValor:    { fontSize: 20, fontWeight: '700', color: '#1a1a1a', marginBottom: 3 },
  statLabel:    { fontSize: 11, color: '#888' },
  acoesAmizade: { paddingHorizontal: 20, marginTop: 20 },
  botaoAmizade: {
    backgroundColor: '#1B4332', borderRadius: 12, padding: 14,
    alignItems: 'center', marginBottom: 10,
  },
  botaoAmizadeTexto: { color: '#fff', fontWeight: '700', fontSize: 15 },
  botaoPendente: { backgroundColor: '#f0f0f0' },
  botaoRemoverAmigo: { backgroundColor: '#FEE2E2' },
  comparacao: { paddingHorizontal: 20, marginTop: 20 },
  objCard: {
    backgroundColor: '#f9f9f9', borderRadius: 12, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: '#efefef',
  },
  objMaterial: { fontSize: 14, fontWeight: '700', color: '#1a1a1a', marginBottom: 12 },
  barraComparacao: { marginBottom: 8 },
  barraLabel: { fontSize: 12, color: '#666', marginBottom: 4 },
  barraFundo: { height: 8, backgroundColor: '#E5E5E5', borderRadius: 4, overflow: 'hidden' },
  barraProgresso: { height: 8, borderRadius: 4 },
  semObjetivos: { alignItems: 'center', paddingVertical: 20 },
  botaoCriarPartilhado: {
    backgroundColor: '#1B4332', borderRadius: 10, padding: 12, paddingHorizontal: 20,
  },
  botaoCriarPartilhadoTexto: { color: '#fff', fontWeight: '700', fontSize: 14 },
  rankBadge: {
    backgroundColor: '#F5F5F5', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
  },
  rankBadgeTexto: { fontSize: 13, fontWeight: '700', color: '#999' },
});
