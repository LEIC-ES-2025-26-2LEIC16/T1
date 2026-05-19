import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db, auth } from '@/services/firebase';

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
  const [users, setUsers] = useState<UserRank[]>([]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      if (!auth.currentUser) {
        setUsers([]);
        setLoading(false);
        return;
      }
      try {
        const q = query(
          collection(db, 'utilizadores'),
          orderBy('totalPontos', 'desc'),
          limit(10)
        );
        const querySnapshot = await getDocs(q);
        const leaderboardData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as UserRank[];
        setUsers(leaderboardData);
      } catch (error) {
        console.error("erro ao carregar ranking:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  const renderItem = ({ item, index }: { item: UserRank, index: number }) => {
    const rankStyle = RANK_CORES[index];
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => router.push(`/user-profile?userId=${item.id}`)}
      >
        <View style={[styles.rankBadge, rankStyle ? { backgroundColor: rankStyle.bg } : undefined]}>
          <Text style={[styles.rankText, rankStyle ? { color: rankStyle.text } : undefined]}>
            {index + 1}
          </Text>
        </View>
        <View style={[styles.avatar, { backgroundColor: index === 0 ? '#1B4332' : index === 1 ? '#4B5563' : index === 2 ? '#92400E' : '#E5E5E5' }]}>
          <Text style={styles.avatarText}>{getIniciais(item.name || item.username || 'U')}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{item.name || item.username || 'Utilizador'}</Text>
          {item.username && <Text style={styles.username}>@{item.username}</Text>}
        </View>
        <Text style={styles.points}>{(item.totalPontos || 0).toLocaleString()} pts</Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: '#fff' }}>
        <View style={[styles.container, styles.loadingContainer]}>
          <ActivityIndicator size="large" color="#1B4332" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Ranking</Text>
          <Text style={styles.subtitle}>Os melhores recicladores este mês</Text>
        </View>
        <FlatList
          data={users}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
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
});
