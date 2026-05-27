import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, TextInput, useColorScheme } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, getDocs } from 'firebase/firestore';
import { db, auth } from '@/services/firebase';
import { Colors } from '@/constants/theme';

interface UserRank {
  id: string;
  name: string;
  username?: string;
  totalPontos: number;
}

const RANK_CORES: Record<number, { bg: string; text: string }> = {
  0: { bg: '#FEF3C7', text: '#92400E' },
  1: { bg: '#F3F4F6', text: '#4B5563' },
  2: { bg: '#FEF2F2', text: '#991B1B' },
};

const getIniciais = (name: string) =>
  name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

export default function LeaderboardScreen() {
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<UserRank[]>([]);
  const [pesquisa, setPesquisa] = useState('');
  
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

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
    const rankStyle = RANK_CORES[index];
    return (
      <TouchableOpacity
        style={[styles.card, colorScheme === 'dark' && { backgroundColor: '#1E293B', borderColor: '#334155' }]}
        activeOpacity={0.7}
        onPress={() => router.push(`/user-profile?userId=${item.id}`)}
      >
        <View style={[styles.rankBadge, rankStyle ? { backgroundColor: rankStyle.bg } : undefined, colorScheme === 'dark' && { backgroundColor: '#334155' }]}>
          <Text style={[styles.rankText, rankStyle ? { color: rankStyle.text } : undefined, colorScheme === 'dark' && { color: '#fff' }]}>
            {index + 1}
          </Text>
        </View>
        <View style={[styles.avatar, { backgroundColor: index === 0 ? '#1B4332' : index === 1 ? '#4B5563' : index === 2 ? '#92400E' : '#E5E5E5' }]}>
          <Text style={styles.avatarText}>{getIniciais(item.name || item.username || 'U')}</Text>
        </View>
        <View style={styles.info}>
          <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>{item.name || item.username || 'Utilizador'}</Text>
          {item.username && <Text style={styles.username}>@{item.username}</Text>}
        </View>
        <Text style={[styles.points, colorScheme === 'dark' && { color: '#86EFAC' }]}>{(item.totalPontos || 0).toLocaleString()} pts</Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: theme.background }}>
        <View style={[styles.container, styles.loadingContainer, { backgroundColor: theme.background }]}>
          <ActivityIndicator size="large" color="#1B4332" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Ranking</Text>
          <Text style={styles.subtitle}>Os melhores recicladores</Text>
        </View>

        <TextInput
          style={[styles.input, colorScheme === 'dark' && { backgroundColor: '#1E293B', borderColor: '#334155', color: '#fff' }]}
          placeholder="Procurar utilizador..."
          placeholderTextColor="#bbb"
          value={pesquisa}
          onChangeText={setPesquisa}
        />

        {pesquisa.length >= 2 ? (
          <>
            <Text style={styles.resultadosLabel}>
              {resultados.length} resultado{resultados.length !== 1 ? 's' : ''} para "{pesquisa}"
            </Text>
            <FlatList
              data={resultados}
              renderItem={({ item }) => {
                const pos = allUsers.findIndex(u => u.id === item.id) + 1;
                return (
                  <TouchableOpacity style={[styles.card, colorScheme === 'dark' && { backgroundColor: '#1E293B', borderColor: '#334155' }]} activeOpacity={0.7}
                    onPress={() => router.push(`/user-profile?userId=${item.id}`)}>
                    <View style={[styles.rankBadge, pos <= 3 ? { backgroundColor: RANK_CORES[pos - 1]?.bg } : undefined, colorScheme === 'dark' && { backgroundColor: '#334155' }]}>
                      <Text style={[styles.rankText, pos <= 3 ? { color: RANK_CORES[pos - 1]?.text } : undefined, colorScheme === 'dark' && { color: '#fff' }]}>#{pos}</Text>
                    </View>
                    <View style={[styles.avatar, { backgroundColor: pos === 1 ? '#1B4332' : pos === 2 ? '#4B5563' : pos === 3 ? '#92400E' : '#E5E5E5' }]}>
                      <Text style={styles.avatarText}>{getIniciais(item.name || item.username || 'U')}</Text>
                    </View>
                    <View style={styles.info}>
                      <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>{item.name || item.username || 'Utilizador'}</Text>
                      {item.username && <Text style={styles.username}>@{item.username}</Text>}
                    </View>
                    <Text style={[styles.points, colorScheme === 'dark' && { color: '#86EFAC' }]}>{(item.totalPontos || 0).toLocaleString()} pts</Text>
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
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 20 },
  loadingContainer: { justifyContent: 'center' },
  header:   { marginBottom: 20 },
  title:    { fontSize: 28, fontWeight: '800', color: '#1a1a1a', letterSpacing: -0.5, lineHeight: 36 },
  subtitle: { fontSize: 13, color: '#999', marginTop: 3 },
  list:     { paddingBottom: 20 },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 14,
    padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: '#f0f0f0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  rankBadge: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center', alignItems: 'center',
    marginRight: 12,
  },
  rankText: { fontSize: 13, fontWeight: '700', color: '#999' },
  avatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#E5E5E5',
    justifyContent: 'center', alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  info:   { flex: 1 },
  name:   { fontSize: 15, fontWeight: '700', color: '#1a1a1a' },
  username: { fontSize: 12, color: '#aaa', marginTop: 1 },
  points: { fontSize: 15, fontWeight: '700', color: '#1B4332' },
  input: {
    borderWidth: 1.5, borderColor: '#E5E5E5', borderRadius: 12,
    padding: 12, fontSize: 15, color: '#1a1a1a', backgroundColor: '#fff',
    marginBottom: 16,
  },
  resultadosLabel: { fontSize: 12, color: '#aaa', fontWeight: '600', marginBottom: 12 },
});
