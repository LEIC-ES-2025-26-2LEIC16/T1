import { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { collection, getDocs } from 'firebase/firestore';
import { auth, db } from '@/services/firebase';
import {
  ouvirEcopontos, seedEcopontos, getFavoritos,
  getHistoricoReciclagem, getObjetivos, getPerfilUtilizador,
  type Objetivo, type PerfilUtilizador,
} from '@/services/firestore';
import { type Ecoponto } from '@/constants/ecopontos';
import { getIniciais, calcularProgresso } from '@/utils/homeUtils';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 19) return 'Boa tarde';
  return 'Boa noite';
}

const ESTADO_COR: Record<string, string> = {
  Operacional: '#1B4332',
  Cheio: '#B45309',
  Danificado: '#B91C1C',
};

const ESTADO_LABEL: Record<string, string> = {
  Operacional: 'Disponível',
  Cheio: 'Cheio',
  Danificado: 'Danificado',
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [ecopontos, setEcopontos] = useState<Ecoponto[]>([]);
  const [profile, setProfile] = useState<PerfilUtilizador | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [objective, setObjective] = useState<Objetivo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [ranking, setRanking] = useState<{ id: string; nome: string; username: string; totalPontos: number }[]>([]);

  const fetchData = () => {
    if (!auth.currentUser) return;
    Promise.all([
      getFavoritos(), getHistoricoReciclagem(), getObjetivos(), getPerfilUtilizador(),
      getDocs(collection(db, 'utilizadores')),
      getDocs(collection(db, 'registos_reciclagem')),
    ])
      .then(([favs, recs, objs, prof, userSnap, registosSnap]) => {
        setFavorites(favs);
        setRecords(recs);
        setObjective(objs.find(o => o.periodo === 'mensal') ?? objs[0] ?? null);
        setProfile(prof);

        const pontosPorUser: Record<string, number> = {};
        registosSnap.docs.forEach(d => {
          const data = d.data();
          const uid = data.userId;
          const pts = data.pontosAtribuidos || 0;
          pontosPorUser[uid] = (pontosPorUser[uid] || 0) + pts;
        });

        const todos = userSnap.docs
          .map(d => {
            const data = d.data();
            const pts = data.totalPontos || pontosPorUser[d.id] || 0;
            return { id: d.id, nome: data.nome || data.username || 'Utilizador', username: data.username || '', totalPontos: pts };
          })
          .sort((a, b) => b.totalPontos - a.totalPontos)
          .slice(0, 5);
        setRanking(todos);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    seedEcopontos();
    const unsubscribe = ouvirEcopontos(setEcopontos);
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user: import('firebase/auth').User | null) => { if (user) fetchData(); });
    return unsubscribe;
  }, []);

  const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const registosMes = records.filter(r => {
    const ts = r.criadoEm?.toDate?.() ?? (r.date ? new Date(r.date) : null);
    return ts && ts >= inicioMes;
  });
  const visitas = registosMes.length;
  const kgMes = registosMes.reduce((s, r) => s + (parseFloat(r.quantidade ?? r.amount) || 0), 0);
  const pontosMes = registosMes.reduce((s, r) => s + ((r.pontosAtribuidos ?? r.pontos) || 0), 0);

  const ecopontosFav = ecopontos.filter(e => favorites.includes(e.id));

  const nome = profile?.nome || profile?.username || '';
  const iniciais = getIniciais(nome || 'U');

  const progresso = objective ? calcularProgresso(objective, records) : 0;
  const kgFeitos = objective ? (progresso * objective.metaKg).toFixed(1) : '0';
  const percentagem = Math.round(progresso * 100);
  const kgEmFalta = objective ? Math.max(0, objective.metaKg - Number(kgFeitos)).toFixed(1) : '0';
  const nomeMes = new Date().toLocaleString('pt-PT', { month: 'long' });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1B4332" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Não foi possível carregar os dados.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
          <Text style={styles.retryButtonText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Avatar topo direito */}
      <View style={[styles.avatarRow, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.avatar} onPress={() => router.push('/(tabs)/profile' as any)} testID="profile-avatar-button">
          <Text style={styles.avatarText}>{iniciais}</Text>
        </TouchableOpacity>
      </View>

      {/* Saudação */}
      <View style={styles.header}>
        <Text style={styles.greetingLabel}>{getGreeting()},</Text>
        <Text style={styles.greetingName}>{nome}</Text>
      </View>

      {/* Ver todos os ecopontos */}
      <TouchableOpacity style={styles.botaoLista} onPress={() => router.push('/ecopontos' as any)}>
        <View style={styles.botaoListaEsq}>
          <View style={styles.botaoListaIconeWrap}>
            <Text style={styles.botaoListaIcone}>♻</Text>
          </View>
          <View>
            <Text style={styles.botaoListaTitulo}>Ver todos os ecopontos</Text>
            <Text style={styles.botaoListaSub}>Pesquisar, adicionar e favoritar</Text>
          </View>
        </View>
        <Text style={styles.botaoListaSeta}>›</Text>
      </TouchableOpacity>

      {/* Impacto este mês */}
      <TouchableOpacity style={styles.impactoCard} activeOpacity={0.8} onPress={() => router.push('/(tabs)/history' as any)}>
        <Text style={styles.impactoLabel}>O TEU IMPACTO ESTE MÊS</Text>
        <View style={styles.impactoRow}>
          <View style={styles.impactoItem}>
            <Text style={styles.impactoValor}>{visitas}</Text>
            <Text style={styles.impactoSub}>visitas</Text>
          </View>
          <View style={styles.impactoDivider} />
          <View style={styles.impactoItem}>
            <Text style={styles.impactoValor}>{kgMes.toFixed(0)}kg</Text>
            <Text style={styles.impactoSub}>reciclado</Text>
          </View>
          <View style={styles.impactoDivider} />
          <View style={styles.impactoItem}>
            <Text style={styles.impactoValor}>{pontosMes}</Text>
            <Text style={styles.impactoSub}>pontos</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Favoritos */}
      <View style={styles.secaoHeader}>
        <Text style={styles.secaoTitulo}>Favoritos</Text>
        <TouchableOpacity onPress={() => router.push({ pathname: '/ecopontos', params: { apenasFavoritos: '1' } } as any)}>
          <Text style={styles.verTodos}>ver todos</Text>
        </TouchableOpacity>
      </View>

      {ecopontosFav.length === 0 ? (
        <View style={styles.favVazio}>
          <Text style={styles.favVazioTexto}>Ainda não tens favoritos</Text>
          <Text style={styles.favVazioSub}>Vai à lista de ecopontos e adiciona aos favoritos.</Text>
        </View>
      ) : (
        ecopontosFav.map(e => (
          <TouchableOpacity
            key={e.id}
            style={styles.favCard}
            activeOpacity={0.7}
            onPress={() => router.push({ pathname: '/ecoponto-detail', params: { ecopontoId: e.id, ecopontoNome: e.nome, ecopontoMorada: e.morada, ecopontoEstado: e.estado } } as any)}
          >
            <View style={styles.favIconeWrap}>
              <Text style={styles.favIcone}>♻</Text>
            </View>
            <View style={styles.favInfo}>
              <Text style={styles.favNome}>{e.nome}</Text>
              <Text style={[styles.favEstado, { color: ESTADO_COR[e.estado] ?? '#aaa' }]}>
                {ESTADO_LABEL[e.estado] ?? e.estado}
              </Text>
            </View>
            <Text style={styles.favSeta}>›</Text>
          </TouchableOpacity>
        ))
      )}

      {/* Ranking */}
      <View style={styles.secaoHeader}>
        <Text style={styles.secaoTitulo}>Ranking</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/leaderboard' as any)}>
          <Text style={styles.verTodos}>ver tudo</Text>
        </TouchableOpacity>
      </View>
      {ranking.map((u, i) => (
        <TouchableOpacity key={u.id} style={styles.rankCard} activeOpacity={0.7}
          onPress={() => router.push({ pathname: '/user-profile', params: { userId: u.id } } as any)}>
          <View style={[styles.rankPos, i < 3 && { backgroundColor: i === 0 ? '#FEF3C7' : i === 1 ? '#F3F4F6' : '#FEF2F2' }]}>
            <Text style={[styles.rankPosTexto, i < 3 && { color: i === 0 ? '#92400E' : i === 1 ? '#4B5563' : '#991B1B' }]}>{i + 1}</Text>
          </View>
          <View style={[styles.rankAvatar, { backgroundColor: i === 0 ? '#1B4332' : i === 1 ? '#4B5563' : i === 2 ? '#92400E' : '#E5E5E5' }]}>
            <Text style={styles.rankAvatarTexto}>{getIniciais(u.nome)}</Text>
          </View>
          <View style={styles.rankInfo}>
            <Text style={styles.rankNome} numberOfLines={1}>{u.nome}</Text>
            {u.username ? <Text style={styles.rankUsername}>@{u.username}</Text> : null}
          </View>
          <Text style={styles.rankPontos}>{(u.totalPontos || 0).toLocaleString()} pts</Text>
        </TouchableOpacity>
      ))}

      {/* Objetivo do mês */}
      {objective && (
        <>
          <Text style={styles.secaoTituloObjetivo}>Objetivo do mês</Text>
          <TouchableOpacity style={styles.objetivoCard} activeOpacity={0.8} onPress={() => router.push('/(tabs)/objectives' as any)}>
            <Text style={styles.objetivoTitulo}>
              Reciclar {objective.metaKg}kg em {nomeMes}
            </Text>
            <View style={styles.objetivoProgressoRow}>
              <View style={styles.barraFundo}>
                <View style={[styles.barraProgresso, { width: `${percentagem}%` }]} />
              </View>
              <Text style={styles.objetivoKg}>{kgFeitos} / {objective.metaKg}kg</Text>
            </View>
            {progresso >= 1 ? (
              <Text style={styles.objetivoSub}>Objetivo concluído! Parabéns</Text>
            ) : (
              <Text style={styles.objetivoSub}>Faltam {kgEmFalta}kg para atingires o objetivo</Text>
            )}
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#fff', paddingHorizontal: 16 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  errorText:        { fontSize: 15, color: '#555', textAlign: 'center', marginBottom: 16 },
  retryButton:      { backgroundColor: '#1B4332', borderRadius: 20, paddingHorizontal: 24, paddingVertical: 10 },
  retryButtonText:  { color: '#fff', fontWeight: '600' },

  avatarRow: { alignItems: 'flex-end', marginBottom: 4 },
  avatar:    { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1B4332', justifyContent: 'center', alignItems: 'center' },
  avatarText:{ fontSize: 15, fontWeight: '700', color: '#fff' },

  header:       { marginBottom: 20 },
  greetingLabel:{ fontSize: 28, fontWeight: '800', color: '#1a1a1a', letterSpacing: -0.5 },
  greetingName: { fontSize: 28, fontWeight: '800', color: '#1a1a1a', letterSpacing: -0.5 },

  botaoLista: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#F0F7F0', borderRadius: 14, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: '#D1EAD1',
  },
  botaoListaEsq:      { flexDirection: 'row', alignItems: 'center', gap: 12 },
  botaoListaIconeWrap:{ width: 44, height: 44, borderRadius: 10, backgroundColor: '#D1EAD1', justifyContent: 'center', alignItems: 'center' },
  botaoListaIcone:    { fontSize: 24 },
  botaoListaTitulo:   { fontSize: 15, fontWeight: '700', color: '#1B4332' },
  botaoListaSub:      { fontSize: 12, color: '#639922', marginTop: 2 },
  botaoListaSeta:     { fontSize: 24, color: '#1B4332', fontWeight: '300' },

  impactoCard:   { backgroundColor: '#1B4332', borderRadius: 16, padding: 20, marginBottom: 24 },
  impactoLabel:  { fontSize: 11, fontWeight: '700', color: '#86EFAC', letterSpacing: 1, marginBottom: 16 },
  impactoRow:    { flexDirection: 'row', alignItems: 'center' },
  impactoItem:   { flex: 1, alignItems: 'center' },
  impactoValor:  { fontSize: 30, fontWeight: '800', color: '#fff' },
  impactoSub:    { fontSize: 12, color: '#86EFAC', marginTop: 4 },
  impactoDivider:{ width: 1, height: 40, backgroundColor: '#2D6A4F' },

  secaoHeader:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  secaoTitulo:        { fontSize: 17, fontWeight: '700', color: '#1a1a1a' },
  secaoTituloObjetivo:{ fontSize: 17, fontWeight: '700', color: '#1a1a1a', marginTop: 8, marginBottom: 12 },
  verTodos:           { fontSize: 13, color: '#1B4332', fontWeight: '600' },

  favVazio:     { paddingVertical: 24, alignItems: 'center' },
  favVazioTexto:{ fontSize: 15, color: '#555', fontWeight: '600', marginBottom: 6 },
  favVazioSub:  { fontSize: 13, color: '#aaa', textAlign: 'center' },

  favCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: '#efefef',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  favIconeWrap:{ width: 48, height: 48, borderRadius: 10, backgroundColor: '#F0F7F0', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  favIcone:    { fontSize: 24 },
  favInfo:     { flex: 1 },
  favNome:     { fontSize: 15, fontWeight: '700', color: '#1a1a1a', marginBottom: 3 },
  favEstado:   { fontSize: 12, fontWeight: '500' },
  favSeta:     { fontSize: 22, color: '#ccc', fontWeight: '300' },

  objetivoCard:        { backgroundColor: '#F0F7F0', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: '#D1EAD1' },
  objetivoTitulo:      { fontSize: 15, fontWeight: '700', color: '#1a1a1a', marginBottom: 14 },
  objetivoProgressoRow:{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  barraFundo:          { flex: 1, height: 10, backgroundColor: '#D1EAD1', borderRadius: 5, overflow: 'hidden' },
  barraProgresso:      { height: 10, backgroundColor: '#1B4332', borderRadius: 5 },
  objetivoKg:          { fontSize: 13, fontWeight: '700', color: '#1B4332', minWidth: 70, textAlign: 'right' },
  objetivoSub:         { fontSize: 13, color: '#639922' },

  rankCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14,
    padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#f0f0f0',
  },
  rankPos: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  rankPosTexto: { fontSize: 12, fontWeight: '700', color: '#999' },
  rankAvatar: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  rankAvatarTexto: { fontSize: 12, fontWeight: '700', color: '#fff' },
  rankInfo: { flex: 1 },
  rankNome: { fontSize: 14, fontWeight: '700', color: '#1a1a1a' },
  rankUsername: { fontSize: 11, color: '#aaa', marginTop: 1 },
  rankPontos: { fontSize: 13, fontWeight: '700', color: '#1B4332' },
});
