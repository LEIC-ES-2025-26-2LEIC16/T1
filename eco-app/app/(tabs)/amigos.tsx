import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth } from '@/services/firebase';
import {
  enviarPedidoAmizade,
  responderPedidoAmizade, removerAmigo, getSugestoesAmigos,
} from '@/services/firestore';
import { useThemeColors } from '@/hooks/use-theme-colors';

export default function AmigosScreen() {
  const colors = useThemeColors();
  const [tab, setTab] = useState<'amigos' | 'pedidos' | 'procurar'>('amigos');
  const [amigos, setAmigos] = useState<{ id: string; uid: string; nome: string; username: string; avatarUrl: string; totalPontos: number }[]>([]);
  const [pedidos, setPedidos] = useState<{ id: string; deUid: string; nome: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [pesquisa, setPesquisa] = useState('');
  const [resultados, setResultados] = useState<any[]>([]);
  const [pesquisando, setPesquisando] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const qAmigos = query(
      collection(db, 'amizades'),
      where('usuarios', 'array-contains', user.uid),
      where('status', '==', 'aceite')
    );
    const unsubAmigos = onSnapshot(qAmigos, async (snap) => {
      const amigosData = snap.docs.map(d => {
        const data = d.data();
        const amigoUid = data.usuarios.find((u: string) => u !== user.uid);
        return { id: d.id, uid: amigoUid };
      });
      const perfis = await Promise.all(
        amigosData.map(async a => {
          if (!a.uid) return null;
          const snap = await getDoc(doc(db, 'utilizadores', a.uid));
          const d = snap.data() || {};
          return { ...a, nome: d.nome || d.username || 'Utilizador', username: d.username || '', avatarUrl: d.avatarUrl || '', totalPontos: d.totalPontos || 0 };
        })
      );
      setAmigos(perfis.filter(Boolean));
      setLoading(false);
    });

    const qPedidos = query(
      collection(db, 'amizades'),
      where('usuarios', 'array-contains', user.uid),
      where('status', '==', 'pendente')
    );
    const unsubPedidos = onSnapshot(qPedidos, async (snap) => {
      const pedidosData = snap.docs
        .map(d => {
          const data = d.data();
          if (data.accaoUid === user.uid) return null;
          return { id: d.id, deUid: data.accaoUid };
        })
        .filter(Boolean) as { id: string; deUid: string }[];
      const perfis = await Promise.all(
        pedidosData.map(async p => {
          const snap = await getDoc(doc(db, 'utilizadores', p.deUid));
          const d = snap.data() || {};
          return { ...p, nome: d.nome || d.username || 'Utilizador' };
        })
      );
      setPedidos(perfis);
      setLoading(false);
    });

    return () => {
      unsubAmigos();
      unsubPedidos();
    };
  }, []);

  const handlePesquisa = async (texto: string) => {
    setPesquisa(texto);
    if (texto.length < 2) { setResultados([]); return; }
    setPesquisando(true);
    const res = await getSugestoesAmigos(texto);
    setResultados(res.filter(r => r.id !== auth.currentUser?.uid));
    setPesquisando(false);
  };

  const handleAdicionar = async (userId: string) => {
    try {
      await enviarPedidoAmizade(userId);
      Alert.alert('Pedido enviado', 'Pedido de amizade enviado com sucesso!');
      setResultados(r => r.filter(x => x.id !== userId));
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    }
  };

  const handleResponder = async (amizadeId: string, aceitar: boolean) => {
    await responderPedidoAmizade(amizadeId, aceitar);
  };

  const handleRemover = (amigoUid: string, nome: string) => {
    Alert.alert('Remover amigo', `Remover ${nome} dos teus amigos?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: async () => { await removerAmigo(amigoUid); } },
    ]);
  };

  const iniciais = (nome: string) =>
    nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.titulo, { color: colors.textPrimary }]}>Amigos</Text>
          <Text style={[styles.subtitulo, { color: colors.textMuted }]}>Conecta-te e compara objetivos</Text>
        </View>

        <View style={[styles.tabContainer, { backgroundColor: colors.cardBackground }]}>
          {(['amigos', 'pedidos', 'procurar'] as const).map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.tabButton, tab === t && { backgroundColor: colors.card, shadowColor: '#000' }]}
              onPress={() => setTab(t)}
            >
              <Text style={[styles.tabButtonText, { color: colors.textSecondary }, tab === t && { color: colors.primary }]}>
                {t === 'amigos' ? 'Amigos' : t === 'pedidos' ? `Pedidos${pedidos.length > 0 ? ` (${pedidos.length})` : ''}` : 'Procurar'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === 'amigos' && (
          loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 48 }} /> :
          amigos.length === 0 ? (
            <View style={styles.vazio}>
              <Text style={styles.vazioEmoji}>👥</Text>
              <Text style={[styles.vazioTexto, { color: colors.textPrimary }]}>Sem amigos ainda</Text>
              <Text style={[styles.vazioSub, { color: colors.textMuted }]}>Vai a "Procurar" para encontrar utilizadores.</Text>
            </View>
          ) : (
            amigos.map(a => (
              <TouchableOpacity key={a.uid} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]} activeOpacity={0.7}
                onPress={() => router.push(`/user-profile?userId=${a.uid}`)}>
                <View style={[styles.avatar, { backgroundColor: colors.avatarBg }]}>
                  {a.avatarUrl ? (
                    <Text style={styles.avatarTexto}>Foto</Text>
                  ) : (
                    <Text style={styles.avatarTexto}>{iniciais(a.nome)}</Text>
                  )}
                </View>
                <View style={styles.cardInfo}>
                  <Text style={[styles.cardNome, { color: colors.textPrimary }]}>{a.nome}</Text>
                  {a.username ? <Text style={[styles.cardUsername, { color: colors.textMuted }]}>@{a.username}</Text> : null}
                  <Text style={[styles.cardPontos, { color: colors.secondary }]}>{a.totalPontos} pts</Text>
                </View>
                <TouchableOpacity style={[styles.botaoRemover, { backgroundColor: colors.dangerBg }]} onPress={() => handleRemover(a.uid, a.nome)}>
                  <Text style={[styles.botaoRemoverTexto, { color: colors.danger }]}>Remover</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          )
        )}

        {tab === 'pedidos' && (
          loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 48 }} /> :
          pedidos.length === 0 ? (
            <View style={styles.vazio}>
              <Text style={styles.vazioEmoji}>📨</Text>
              <Text style={[styles.vazioTexto, { color: colors.textPrimary }]}>Sem pedidos pendentes</Text>
            </View>
          ) : (
            pedidos.map(p => (
              <View key={p.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                <View style={[styles.avatar, { backgroundColor: colors.avatarBg }]}>
                  <Text style={styles.avatarTexto}>{iniciais(p.nome)}</Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={[styles.cardNome, { color: colors.textPrimary }]}>{p.nome}</Text>
                  <Text style={[styles.cardUsername, { color: colors.textMuted }]}>Quer ser teu amigo</Text>
                </View>
                <View style={styles.acoes}>
                  <TouchableOpacity style={[styles.botaoAceitar, { backgroundColor: colors.primaryLight }]} onPress={() => handleResponder(p.id, true)}>
                    <Text style={[styles.botaoAceitarTexto, { color: colors.primary }]}>✓</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.botaoRejeitar, { backgroundColor: colors.dangerBg }]} onPress={() => handleResponder(p.id, false)}>
                    <Text style={[styles.botaoRejeitarTexto, { color: colors.danger }]}>×</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )
        )}

        {tab === 'procurar' && (
          <View>
            <TextInput
              style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.card }]}
              placeholder="Pesquisar por nome ou username..."
              placeholderTextColor={colors.textPlaceholder}
              value={pesquisa}
              onChangeText={handlePesquisa}
            />
            {pesquisando && <ActivityIndicator color={colors.primary} style={{ marginTop: 12 }} />}
            {resultados.map(r => (
              <TouchableOpacity key={r.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]} activeOpacity={0.7}
                onPress={() => router.push(`/user-profile?userId=${r.id}`)}>
                <View style={[styles.avatar, { backgroundColor: colors.avatarBg }]}>
                  <Text style={styles.avatarTexto}>{iniciais(r.nome || r.username)}</Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={[styles.cardNome, { color: colors.textPrimary }]}>{r.nome || r.username || 'Utilizador'}</Text>
                  {r.username ? <Text style={[styles.cardUsername, { color: colors.textMuted }]}>@{r.username}</Text> : null}
                  <Text style={[styles.cardPontos, { color: colors.secondary }]}>{r.totalPontos || 0} pts</Text>
                </View>
                <TouchableOpacity style={[styles.botaoAdicionar, { backgroundColor: colors.primary }]} onPress={() => handleAdicionar(r.id)}>
                  <Text style={styles.botaoAdicionarTexto}>+</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
            {pesquisa.length >= 2 && !pesquisando && resultados.length === 0 && (
              <Text style={[styles.semResultados, { color: colors.textMuted }]}>Nenhum utilizador encontrado.</Text>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 48, paddingTop: 8 },
  container: { flex: 1 },
  header: { marginBottom: 24, marginTop: 40 },
  titulo: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5, lineHeight: 36 },
  subtitulo: { fontSize: 13, marginTop: 3 },
  tabContainer: { flexDirection: 'row', borderRadius: 10, padding: 4, marginBottom: 24 },
  tabButton: { flex: 1, paddingVertical: 10, borderRadius: 8 },
  tabButtonText: { textAlign: 'center', fontWeight: '600', fontSize: 13 },
  card: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 14,
    padding: 14, marginBottom: 10, borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  avatarTexto: { fontSize: 15, fontWeight: '700', color: '#fff' },
  cardInfo: { flex: 1 },
  cardNome: { fontSize: 15, fontWeight: '700' },
  cardUsername: { fontSize: 12, marginTop: 1 },
  cardPontos: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  botaoRemover: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  botaoRemoverTexto: { fontSize: 12, fontWeight: '700' },
  acoes: { flexDirection: 'row', gap: 8 },
  botaoAceitar: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  botaoAceitarTexto: { fontSize: 18, fontWeight: '700' },
  botaoRejeitar: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  botaoRejeitarTexto: { fontSize: 18, fontWeight: '700' },
  botaoAdicionar: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  botaoAdicionarTexto: { fontSize: 20, fontWeight: '700', color: '#fff' },
  input: {
    borderWidth: 1.5, borderRadius: 12,
    padding: 13, fontSize: 15,
  },
  vazio: { alignItems: 'center', marginTop: 64, paddingHorizontal: 24 },
  vazioEmoji: { fontSize: 40, marginBottom: 12 },
  vazioTexto: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  vazioSub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  semResultados: { textAlign: 'center', marginTop: 24, fontSize: 14 },
});
