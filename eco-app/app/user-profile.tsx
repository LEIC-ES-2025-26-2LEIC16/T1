import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [stats, setStats] = useState({ totalReciclagens: 0, totalKg: '0.0', totalCO2: '0.0', totalPontos: 0 });

  useEffect(() => {
    if (!userId) return;
    const fetchData = async () => {
      try {
        const userRef = doc(db, 'utilizadores', userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setUserData(userSnap.data());
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
    <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top + 20 }]}>
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarTexto}>{iniciais}</Text>
        </View>
        <Text style={styles.nome}>{userData?.nome || userData?.username || 'Utilizador'}</Text>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#fff', paddingHorizontal: 20, paddingBottom: 48 },
  profileHeader: { alignItems: 'center', marginBottom: 20 },
  avatar: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: '#639922',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: '#fff',
    marginBottom: 16,
  },
  avatarTexto: { fontSize: 34, fontWeight: '700', color: '#fff' },
  nome:     { fontSize: 22, fontWeight: '700', color: '#1a1a1a' },
  username: { fontSize: 14, color: '#639922', fontWeight: '600', marginTop: 4 },
  bio:      { fontSize: 14, color: '#444', marginTop: 8, textAlign: 'center', lineHeight: 20, paddingHorizontal: 20 },
  separador:    { height: 1, backgroundColor: '#f0f0f0', marginVertical: 20 },
  secaoTitulo:  { fontSize: 11, fontWeight: '600', color: '#aaa', letterSpacing: 0.8, marginBottom: 12 },
  grelha:       { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard:     { flex: 1, minWidth: '45%', backgroundColor: '#f7f7f7', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 0.5, borderColor: '#e8e8e8' },
  statCardVerde:{ backgroundColor: '#EAF3DE', borderColor: '#c4e0a0' },
  statValor:    { fontSize: 20, fontWeight: '700', color: '#1a1a1a', marginBottom: 3 },
  statLabel:    { fontSize: 11, color: '#888' },
});
