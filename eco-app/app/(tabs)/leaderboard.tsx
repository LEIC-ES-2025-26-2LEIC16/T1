import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, TextInput } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, getDocs } from 'firebase/firestore';
import { db, auth } from '@/services/firebase';
import { useThemeColors } from '@/hooks/use-theme-colors';

interface UserRank {
  id: string;
  name: string;
  username?: string;
  totalPontos: number;
}

const rankCores = (colors: ReturnType<typeof useThemeColors>): Record<number, { bg: string; text: string }> => ({
  0: { bg: colors.rankGold, text: colors.rankGoldText },
  1: { bg: colors.rankSilver, text: colors.rankSilverText },
  2: { bg: colors.rankBronze, text: colors.rankBronzeText },
});

const getIniciais = (name: string) =>
  name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

export default function LeaderboardScreen() {
  const colors = useThemeColors();
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<UserRank[]>([]);
  const [pesquisa, setPesquisa] = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      if (!auth.currentUser) { setLoading(false); return; }
      try {
        const [userSnap, registosSnap] = await Promise.all([
          getDocs(collection(db, 'utilizadores')),
          getDocs(collection(db, 'registos_reciclagem')),
        ]);

        const pontosPorUser: Record<string, number> = {};
        registosSnap.docs.forEach(d => {
          const data = d.data();
          const uid = data.userId;
          const pts = data.pontosAtribuidos || 0;
          pontosPorUser[uid] = (pontosPorUser[uid] || 0) + pts;
        });

        const data = userSnap.docs.map(d => {
          const data = d.data();
          const pts = data.totalPontos || pontosPorUser[d.id] || 0;
          return { id: d.id, name: data.nome || data.username || 'Utilizador', username: data.username || '', totalPontos: pts };
        });

        data.sort((a, b) => b.totalPontos - a.totalPontos);
        setAllUsers(data);
      } catch (e) { console.error('erro ao carregar ranking:', e); }
      finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  const users = allUsers.filter(u => allUsers.indexOf(u) < 20);
  const resultados = pesquisa.length >= 2
    ? allUsers.filter(u =>
        (u.name || '').toLowerCase().includes(pesquisa.toLowerCase()) ||
        (u.username || '').toLowerCase().includes(pesquisa.toLowerCase())
      )
    : [];

  const renderItem = ({ item, index }: { item: UserRank, index: number }) => {
    const cores = rankCores(colors);
    const rankStyle = cores[index];
    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
        activeOpacity={0.7}
        onPress={() => router.push(`/user-profile?userId=${item.id}`)}
      >
        <View style={[styles.rankBadge, { backgroundColor: colors.rankDefault }, rankStyle ? { backgroundColor: rankStyle.bg } : undefined]}>
          <Text style={[styles.rankText, { color: colors.textMuted }, rankStyle ? { color: rankStyle.text } : undefined]}>
            {index + 1}
          </Text>
        </View>
        <View style={[styles.avatar, { backgroundColor: index === 0 ? colors.primary : index === 1 ? colors.rankSilverText : index === 2 ? colors.rankGoldText : colors.rankDefault }]}>
          <Text style={styles.avatarText}>{getIniciais(item.name || item.username || 'U')}</Text>
        </View>
        <View style={styles.info}>
          <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>{item.name || item.username || 'Utilizador'}</Text>
          {item.username && <Text style={[styles.username, { color: colors.textMuted }]}>@{item.username}</Text>}
        </View>
        <Text style={[styles.points, { color: colors.primary }]}>{(item.totalPontos || 0).toLocaleString()} pts</Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={[styles.container, styles.loadingContainer, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Ranking</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Os melhores recicladores</Text>
        </View>

        <TextInput
          style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.card }]}
          placeholder="Procurar utilizador..."
          placeholderTextColor={colors.textPlaceholder}
          value={pesquisa}
          onChangeText={setPesquisa}
        />

        {pesquisa.length >= 2 ? (
          <>
            <Text style={[styles.resultadosLabel, { color: colors.textMuted }]}>
              {resultados.length} resultado{resultados.length !== 1 ? 's' : ''} para "{pesquisa}"
            </Text>
            <FlatList
              data={resultados}
              renderItem={({ item }) => {
                const cores = rankCores(colors);
                const pos = allUsers.findIndex(u => u.id === item.id) + 1;
                const rankStyle = pos <= 3 ? cores[pos - 1] : undefined;
                return (
                  <TouchableOpacity style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]} activeOpacity={0.7}
                    onPress={() => router.push(`/user-profile?userId=${item.id}`)}>
                    <View style={[styles.rankBadge, { backgroundColor: colors.rankDefault }, rankStyle ? { backgroundColor: rankStyle.bg } : undefined]}>
                      <Text style={[styles.rankText, { color: colors.textMuted }, rankStyle ? { color: rankStyle.text } : undefined]}>#{pos}</Text>
                    </View>
                    <View style={[styles.avatar, { backgroundColor: pos === 1 ? colors.primary : pos === 2 ? colors.rankSilverText : pos === 3 ? colors.rankGoldText : colors.rankDefault }]}>
                      <Text style={styles.avatarText}>{getIniciais(item.name || item.username || 'U')}</Text>
                    </View>
                    <View style={styles.info}>
                      <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>{item.name || item.username || 'Utilizador'}</Text>
                      {item.username && <Text style={[styles.username, { color: colors.textMuted }]}>@{item.username}</Text>}
                    </View>
                    <Text style={[styles.points, { color: colors.primary }]}>{(item.totalPontos || 0).toLocaleString()} pts</Text>
                  </TouchableOpacity>
                );
              }}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
            />
          </>
        ) : (
          <FlatList
            data={users}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  loadingContainer: { justifyContent: 'center' },
  header:   { marginBottom: 20 },
  title:    { fontSize: 28, fontWeight: '800', letterSpacing: -0.5, lineHeight: 36 },
  subtitle: { fontSize: 13, marginTop: 3 },
  list:     { paddingBottom: 20 },
  card: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14,
    padding: 14, marginBottom: 10,
    borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  rankBadge: {
    width: 28, height: 28, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 12,
  },
  rankText: { fontSize: 13, fontWeight: '700' },
  avatar: {
    width: 42, height: 42, borderRadius: 21,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  info:   { flex: 1 },
  name:   { fontSize: 15, fontWeight: '700' },
  username: { fontSize: 12, marginTop: 1 },
  points: { fontSize: 15, fontWeight: '700' },
  input: {
    borderWidth: 1.5, borderRadius: 12,
    padding: 12, fontSize: 15,
    marginBottom: 16,
  },
  resultadosLabel: { fontSize: 12, fontWeight: '600', marginBottom: 12 },
});
