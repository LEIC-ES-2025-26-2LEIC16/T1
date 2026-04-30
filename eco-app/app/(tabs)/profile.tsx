import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  ScrollView, Alert, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { router } from 'expo-router';
import { signOut } from 'firebase/auth';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth } from '@/services/firebase';
import {
  getEstatisticasUtilizador,
  getPerfilUtilizador,
  guardarPerfilUtilizador,
  type PerfilUtilizador,
} from '@/services/firestore';

type Estatisticas = {
  totalReciclagens: number;
  totalKg: string;
  totalCO2: string;
  totalPontos: number;
};

const BANNER_HEIGHT = 130;
const AVATAR_SIZE = 90;

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const user = auth.currentUser;
  const [stats, setStats] = useState<Estatisticas | null>(null);
  const [perfil, setPerfil] = useState<PerfilUtilizador>({ nome: '', username: '', bio: '' });
  const [rascunho, setRascunho] = useState<PerfilUtilizador>({ nome: '', username: '', bio: '' });
  const [editando, setEditando] = useState(false);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    Promise.all([getEstatisticasUtilizador(), getPerfilUtilizador()])
      .then(([s, p]) => { setStats(s); setPerfil(p); })
      .finally(() => setLoading(false));
  }, []));

  const iniciais = perfil.nome
    ? perfil.nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? '?';

  const abrirEdicao = () => {
    setRascunho({ ...perfil });
    setEditando(true);
  };

  const guardar = async () => {
    setGuardando(true);
    try {
      await guardarPerfilUtilizador(rascunho);
      setPerfil(rascunho);
      setEditando(false);
    } catch {
      Alert.alert('Erro', 'Não foi possível guardar o perfil.');
    } finally {
      setGuardando(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Terminar sessão', 'Tens a certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => signOut(auth) },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1B4332" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* Banner */}
        <View style={[styles.banner, { height: BANNER_HEIGHT + insets.top }]} />

        {/* Avatar + botão editar */}
        <View style={styles.avatarRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarTexto}>{iniciais}</Text>
          </View>
          {!editando && (
            <TouchableOpacity style={styles.botaoEditar} onPress={abrirEdicao}>
              <Text style={styles.botaoEditarTexto}>Editar perfil</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Info / formulário */}
        <View style={styles.infoContainer}>
          {editando ? (
            <>
              <Text style={styles.fieldLabel}>Nome</Text>
              <TextInput
                style={styles.input}
                value={rascunho.nome}
                onChangeText={v => setRascunho(r => ({ ...r, nome: v }))}
                placeholder="O teu nome"
                placeholderTextColor="#bbb"
              />

              <Text style={styles.fieldLabel}>Nome de utilizador</Text>
              <TextInput
                style={styles.input}
                value={rascunho.username}
                onChangeText={v => setRascunho(r => ({ ...r, username: v.replace(/\s/g, '') }))}
                placeholder="@username"
                placeholderTextColor="#bbb"
                autoCapitalize="none"
              />

              <Text style={styles.fieldLabel}>Bio</Text>
              <TextInput
                style={[styles.input, styles.inputBio]}
                value={rascunho.bio}
                onChangeText={v => setRascunho(r => ({ ...r, bio: v }))}
                placeholder="Conta um pouco sobre ti..."
                placeholderTextColor="#bbb"
                multiline
                numberOfLines={3}
              />

              <View style={styles.botoesEdicao}>
                <TouchableOpacity style={styles.botaoCancelar} onPress={() => setEditando(false)}>
                  <Text style={styles.botaoCancelarTexto}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.botaoGuardar} onPress={guardar} disabled={guardando}>
                  {guardando
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={styles.botaoGuardarTexto}>Guardar</Text>}
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.nome}>{perfil.nome || 'Sem nome'}</Text>
              {!!perfil.username && (
                <Text style={styles.username}>@{perfil.username}</Text>
              )}
              <Text style={styles.email}>{user?.email}</Text>
              {perfil.bio
                ? <Text style={styles.bio}>{perfil.bio}</Text>
                : <Text style={styles.bioVazia}>Adiciona uma bio</Text>
              }
            </>
          )}
        </View>

        <View style={styles.separador} />

        {/* Stats */}
        <Text style={styles.secaoTitulo}>O MEU IMPACTO</Text>
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
      <TouchableOpacity 
        style={styles.botaoWrapped} 
        onPress={() => router.push('/wrapped' as any)}
      >
        <Text style={styles.botaoWrappedTexto}>✨ Ver o meu Wrapped 2026</Text>
      </TouchableOpacity>

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
