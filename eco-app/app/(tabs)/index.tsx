import { useState, useCallback, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { auth } from '@/services/firebase';
import {
  ouvirEcopontos,
  getFavoritos,
  getHistoricoReciclagem,
  getObjetivos,
  getPerfilUtilizador,
  type Objetivo,
  type PerfilUtilizador,
} from '@/services/firestore';
import { type Ecoponto } from '@/constants/ecopontos';

// --- Helper Functions ---

/**
 * Returns a greeting based on the current time of day.
 */
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 19) return 'Boa tarde';
  return 'Boa noite';
}

/**
 * Calculates the progress of a monthly objective.
 */
function calculateObjectiveProgress(
  objective: Objetivo,
  records: { date: string; amount: string; type: string }[]
): number {
  const today = new Date();
  const periodStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const totalAmount = records
    .filter(r => {
      const recordDate = new Date(r.date);
      const isWithinPeriod = recordDate >= periodStart;
      const isCorrectMaterial = objective.material === 'Todos' || r.type === objective.material;
      return isWithinPeriod && isCorrectMaterial;
    })
    .reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);

  return Math.min(totalAmount / objective.metaKg, 1);
function calcularProgressoObjetivo(objetivo: Objetivo, registos: any[]): number {
  const inicio = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const total = registos
    .filter(r => {
      const ts = r.criadoEm?.toDate?.() ?? (r.date ? new Date(r.date) : null);
      const material = r.material ?? r.type;
      return ts && ts >= inicio && (objetivo.material === 'Todos' || material === objetivo.material);
    })
    .reduce((s, r) => s + (parseFloat(r.quantidade ?? r.amount) || 0), 0);
  return Math.min(total / objetivo.metaKg, 1);
}

// --- UI Components ---

const GreetingHeader = ({ profile }: { profile: PerfilUtilizador }) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = auth.currentUser;

  const displayName = profile.nome || user?.displayName || 'Utilizador';
  const initials = (
    displayName.split(' ').map(n => n[0]).join('').slice(0, 2)
    || user?.email?.[0]
    || '?'
  ).toUpperCase();

  return (
    <View style={[styles.headerContainer, { paddingTop: insets.top + 8 }]}>
      <View>
        <Text style={styles.greetingText}>{getGreeting()},</Text>
        <Text style={styles.greetingName}>{displayName} 👋</Text>
      </View>
      <TouchableOpacity
        style={styles.avatar}
        onPress={() => router.push('/(tabs)/profile')}
      >
        <Text style={styles.avatarText}>{initials}</Text>
      </TouchableOpacity>
    </View>
  );
};

const MonthlyImpact = ({ records }: { records: { date: string; amount: string }[] }) => {
  const router = useRouter();
  const kgThisMonth = records.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);

  return (
    <View style={styles.impactCard}>
      <Text style={styles.sectionLabel}>O TEU IMPACTO ESTE MÊS</Text>
      <View style={styles.impactContent}>
        <Text style={styles.impactValue}>{kgThisMonth.toFixed(1)}</Text>
        <Text style={styles.impactUnit}>kg</Text>
      </View>
      <Text style={styles.impactSubtext}>de material reciclado</Text>
    </View>
  );
};

const FavoriteEcopoints = ({ ecopontos }: { ecopontos: Ecoponto[] }) => {
  const router = useRouter();
  return (
    <>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>⭐ Favoritos</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/explore')}>
          <Text style={styles.seeAllText}>ver todos</Text>
        </TouchableOpacity>
      </View>

      {ecopontos.length === 0 ? (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateText}>Ainda não tens favoritos.</Text>
          <Text style={styles.emptyStateSubtext}>Adiciona ecopontos no mapa para os veres aqui.</Text>
        </View>
      ) : (
        ecopontos.map(e => (
          <TouchableOpacity
            key={e.id}
            style={styles.favCard}
            onPress={() => router.push({ pathname: '/(tabs)/explore', params: { ecopontoId: e.id } })}
          >
            <View style={styles.favIconWrapper}>
              <Text style={styles.favIcon}>♻️</Text>
            </View>
            <View style={styles.favInfo}>
              <Text style={styles.favName}>{e.nome}</Text>
              <Text style={styles.favAddress}>{e.morada}</Text>
            </View>
            <Text style={styles.favArrow}>›</Text>
          </TouchableOpacity>
        ))
      )}
    </>
  );
};

const MonthlyGoal = ({ objective, records }: { objective: Objetivo; records: any[] }) => {
  if (!objective) return null;

  const progress = calculateObjectiveProgress(objective, records);
  const percentage = Math.round(progress * 100);
  const currentKg = (progress * objective.metaKg).toFixed(1);
  const remainingKg = Math.max(0, objective.metaKg - Number(currentKg)).toFixed(1);
  const monthName = new Date().toLocaleString('pt-PT', { month: 'long' });

  return (
    <>
      <Text style={styles.sectionTitle}>🎯 Objetivo do mês</Text>
      <View style={styles.goalCard}>
        <Text style={styles.goalTitle}>
          Reciclar {objective.metaKg}kg de {objective.material} em {monthName}
        </Text>
        <View style={styles.goalProgressRow}>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBar, { width: `${percentage}%` }]} />
          </View>
          <Text style={styles.goalKgText}>{currentKg} / {objective.metaKg}kg</Text>
        </View>
        {progress >= 1 ? (
          <Text style={styles.goalSubtext}>✓ Objetivo concluído! Parabéns 🎉</Text>
        ) : (
          <Text style={styles.goalSubtext}>Faltam {remainingKg}kg para atingires o objetivo 💪</Text>
        )}
      </View>
    </>
  );
};

const ErrorState = ({ onRetry }: { onRetry: () => void }) => (
  <View style={styles.loadingContainer}>
    <Text style={styles.errorText}>Não foi possível carregar os teus dados.</Text>
    <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
      <Text style={styles.retryButtonText}>Tenta novamente</Text>
    </TouchableOpacity>
  </View>
);


// --- Main Screen Component ---

export default function HomeScreen() {
  const router = useRouter();
  const [ecopontos, setEcopontos] = useState<Ecoponto[]>([]);
  const [profile, setProfile] = useState<PerfilUtilizador | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [records, setRecords] = useState<{ date: string; amount: string; type: string }[]>([]);
  const [objective, setObjective] = useState<Objetivo | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [registos, setRegistos] = useState<any[]>([]);
  const [objetivo, setObjetivo] = useState<Objetivo | null>(null);
  const [nome, setNome] = useState('');

  // Fetches all necessary data for the dashboard.
  const fetchData = useCallback(() => {
    // 1. Check if we actually have a user before doing anything
    if (!auth.currentUser) {
      console.log("Auth not ready yet, skipping fetch...");
      return; 
    }

    setLoading(true);
    setError(null);
    Promise.all([
      getFavoritos(),
      getHistoricoReciclagem(),
      getObjetivos(),
      getPerfilUtilizador(),
    ]).then(([favs, recs, objs, prof]) => {
      setFavorites(favs);
      setRecords(recs);
      setObjective(objs.find(o => o.periodo === 'mensal') ?? objs[0] ?? null);
      setProfile(prof);
    }).catch((err) => {
      // If it's just a timing issue, we don't want to show the scary red screen
      console.error("Failed to fetch dashboard data:", err);
      setError("Não foi possível carregar os teus dados. Tenta novamente.");
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  // Subscribe to real-time ecoponto updates.
  useEffect(() => {
    const unsubscribe = ouvirEcopontos((dados) => {
      setEcopontos(dados);
    });
    return unsubscribe;
  }, []);

  // Fetch data when the screen comes into focus.
  useFocusEffect(fetchData);
  useFocusEffect(useCallback(() => {
    Promise.all([getFavoritos(), getHistoricoReciclagem(), getObjetivos(), getPerfilUtilizador()])
      .then(([favs, reg, objs, perfil]) => {
        setFavoritos(favs);
        setRegistos(reg);
        setObjetivo(objs.find(o => o.periodo === 'mensal') ?? objs[0] ?? null);
        setNome(perfil.nome || perfil.username || 'Utilizador');
      });
  }, []));

  const agora = new Date();
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
  const registosMes = registos.filter(r => {
    const ts = r.criadoEm?.toDate?.() ?? (r.date ? new Date(r.date) : null);
    return ts && ts >= inicioMes;
  });
  const visitas = registosMes.length;
  const kgMes = registosMes.reduce((s: number, r: any) => s + (parseFloat(r.quantidade ?? r.amount) || 0), 0);
  const pontosMes = registosMes.reduce((s: number, r: any) => s + ((r.pontosAtribuidos ?? r.pontos) || 0), 0);

  // Listen for auth changes to trigger a fetch as soon as the user is recognized
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchData();
      }
    });
    return unsubscribe;
  }, [fetchData]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1B4332" />
      </View>
    );
  }

  if (error || !profile) {
    return <ErrorState onRetry={fetchData} />;
  }

  const favoriteEcopontos = ecopontos.filter(e => favorites.includes(e.id)).slice(0, 2);
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthlyRecords = records.filter(r => r.date.startsWith(currentMonthStr));

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      <GreetingHeader profile={profile} />

      <MonthlyImpact records={monthlyRecords} />

      <FavoriteEcopoints ecopontos={favoriteEcopontos} />

      {objective && <MonthlyGoal objective={objective} records={records} />}

      {/* Main navigation button at the bottom of the screen */}
      <TouchableOpacity 
        style={styles.mainNavButton} 
        onPress={() => router.push('/(tabs)/explore')}
      >
        <Text style={styles.mainNavButtonText}>Ver todos os ecopontos {'->'}</Text>
      </TouchableOpacity>
      {/* Favoritos */}
      <View style={styles.secaoHeader}>
        <Text style={styles.secaoTitulo}>⭐  Favoritos</Text>
        <TouchableOpacity onPress={() => router.push({ pathname: '/ecopontos', params: { apenasFavoritos: '1' } } as any)}>
          <Text style={styles.verTodos}>ver todos</Text>
        </TouchableOpacity>
      </View>

      {ecopontosFav.length === 0 ? (
        <View style={styles.favVazio}>
          <Text style={styles.favVazioTexto}>Ainda não tens favoritos</Text>
          <Text style={styles.favVazioSub}>Vai à lista de ecopontos e carrega em ☆ para adicionar.</Text>
        </View>
      ) : (
        ecopontosFav.map(e => (
          <TouchableOpacity
            key={e.id}
            style={styles.favCard}
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

    </ScrollView>
  );
}

// --- Styles ---

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  errorText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#1B4332',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Header
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greetingText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1a1a',
    letterSpacing: -0.5,
  },
  greetingName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1a1a',
    letterSpacing: -0.5,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1B4332',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },

  // Section
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#86EFAC',
    letterSpacing: 1,
    marginBottom: 8,
  },
  seeAllText: {
    fontSize: 14,
    color: '#1B4332',
    fontWeight: '600',
  },

  // Impact Card
  impactCard: {
    backgroundColor: '#1B4332',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  impactContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  impactValue: {
    fontSize: 48,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 50,
  },
  impactUnit: {
    fontSize: 24,
    fontWeight: '700',
    color: '#86EFAC',
    paddingBottom: 4,
  },
  impactSubtext: {
    fontSize: 14,
    color: '#86EFAC',
    marginTop: 4,
  },

  // Favorites
  emptyStateContainer: {
    paddingVertical: 24,
    alignItems: 'center',
    backgroundColor: '#fafafa',
    borderRadius: 12,
  },
  emptyStateText: {
    fontSize: 15,
    color: '#555',
    fontWeight: '600',
    marginBottom: 6,
  },
  emptyStateSubtext: {
    fontSize: 13,
    color: '#aaa',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  favoritesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  favCardGrid: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#efefef',
  },
  favCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#efefef',
  },
  favIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#F0F7F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  favIcon: {
    fontSize: 24,
  },
  favInfo: {
    flex: 1,
  },
  favName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 3,
  },
  favAddress: {
    fontSize: 12,
    color: '#999',
  },
  favArrow: {
    fontSize: 22,
    color: '#ccc',
    fontWeight: '300',
  },

  // Goal
  goalCard: {
    backgroundColor: '#F0F7F0',
    borderRadius: 16,
    padding: 18,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#D1EAD1',
  },
  goalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 14,
  },
  goalProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  progressBarBackground: {
    flex: 1,
    height: 10,
    backgroundColor: '#D1EAD1',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBar: {
    height: 10,
    backgroundColor: '#1B4332',
    borderRadius: 5,
  },
  goalKgText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1B4332',
    minWidth: 70,
    textAlign: 'right',
  },
  goalSubtext: {
    fontSize: 13,
    color: '#639922',
  },
  mainNavButton: {
    backgroundColor: '#F5F7F5', // light color from the mockup
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#E8EFE9',
  },
  mainNavButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
});
