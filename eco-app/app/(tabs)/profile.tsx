import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { signOut } from 'firebase/auth';
import { auth } from '@/services/firebase';
import { getEstatisticasUtilizador } from '@/services/firestore';

type Estatisticas = {
  totalReciclagens: number;
  totalKg: string;
  totalCO2: string;
  totalPontos: number;
};

export default function ProfileScreen() {
  const user = auth.currentUser;
  const [stats, setStats] = useState<Estatisticas | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    getEstatisticasUtilizador()
      .then(setStats)
      .finally(() => setLoading(false));
  }, []));

  const iniciais = user?.displayName
    ? user.displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? '?';

  const handleLogout = () => {
    Alert.alert('Terminar sessão', 'Tens a certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => signOut(auth) },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarTexto}>{iniciais}</Text>
        </View>
        <Text style={styles.nome}>{user?.displayName ?? 'Utilizador'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <Text style={styles.secaoTitulo}>O meu impacto</Text>

      {loading ? (
        <ActivityIndicator color="#1B4332" style={{ marginTop: 24 }} />
      ) : (
        <View style={styles.grelha}>
          <View style={styles.statCard}>
            <Text style={styles.statValor}>{stats?.totalReciclagens ?? 0}</Text>
            <Text style={styles.statLabel}>reciclagens</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValor}>{stats?.totalPontos ?? 0}</Text>
            <Text style={styles.statLabel}>pontos</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValor}>{stats?.totalKg ?? '0.0'} kg</Text>
            <Text style={styles.statLabel}>reciclado</Text>
          </View>
          <View style={[styles.statCard, styles.statCardVerde]}>
            <Text style={[styles.statValor, { color: '#1B4332' }]}>{stats?.totalCO2 ?? '0.0'} kg</Text>
            <Text style={[styles.statLabel, { color: '#1B4332' }]}>CO2 poupado</Text>
          </View>
        </View>
      )}

      <TouchableOpacity style={styles.botaoSair} onPress={handleLogout}>
        <Text style={styles.botaoSairTexto}>Terminar sessão</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:     { flexGrow: 1, padding: 24, backgroundColor: '#fff' },
  header:        { alignItems: 'center', paddingTop: 20, marginBottom: 32 },
  avatar:        { width: 80, height: 80, borderRadius: 40, backgroundColor: '#1B4332', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarTexto:   { fontSize: 30, fontWeight: '700', color: '#fff' },
  nome:          { fontSize: 20, fontWeight: '700', color: '#1a1a1a', marginBottom: 4 },
  email:         { fontSize: 14, color: '#888' },
  secaoTitulo:   { fontSize: 13, fontWeight: '600', color: '#aaa', letterSpacing: 0.8, marginBottom: 12 },
  grelha:        { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 40 },
  statCard:      { flex: 1, minWidth: '45%', backgroundColor: '#f7f7f7', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 0.5, borderColor: '#e0e0e0' },
  statCardVerde: { backgroundColor: '#EAF3DE', borderColor: '#c4e0a0' },
  statValor:     { fontSize: 22, fontWeight: '700', color: '#1a1a1a', marginBottom: 4 },
  statLabel:     { fontSize: 12, color: '#888' },
  botaoSair:     { borderWidth: 1.5, borderColor: '#DC2626', borderRadius: 10, padding: 14, alignItems: 'center' },
  botaoSairTexto:{ color: '#DC2626', fontWeight: '700', fontSize: 15 },
});
