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

export default function AmigosScreen() {
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
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.titulo}>Amigos</Text>
          <Text style={styles.subtitulo}>Conecta-te e compara objetivos</Text>
        </View>

        <View style={styles.tabContainer}>
          {(['amigos', 'pedidos', 'procurar'] as const).map(t => (
            <TouchableOpacity key={t} style={[styles.tabButton, tab === t && styles.tabButtonActive]} onPress={() => setTab(t)}>
              <Text style={[styles.tabButtonText, tab === t && styles.tabButtonTextActive]}>
                {t === 'amigos' ? 'Amigos' : t === 'pedidos' ? `Pedidos${pedidos.length > 0 ? ` (${pedidos.length})` : ''}` : 'Procurar'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === 'amigos' && (
          loading ? <ActivityIndicator color="#1B4332" style={{ marginTop: 48 }} /> :
          amigos.length === 0 ? (
            <View style={styles.vazio}>
              <Text style={styles.vazioEmoji}>👥</Text>
              <Text style={styles.vazioTexto}>Sem amigos ainda</Text>
              <Text style={styles.vazioSub}>Vai a "Procurar" para encontrar utilizadores.</Text>
            </View>
          ) : (
            amigos.map(a => (
              <TouchableOpacity key={a.uid} style={styles.card} activeOpacity={0.7}
                onPress={() => router.push(`/user-profile?userId=${a.uid}`)}>
                <View style={styles.avatar}>
                  {a.avatarUrl ? (
                    <Text style={styles.avatarTexto}>Foto</Text>
                  ) : (
                    <Text style={styles.avatarTexto}>{iniciais(a.nome)}</Text>
                  )}
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardNome}>{a.nome}</Text>
                  {a.username ? <Text style={styles.cardUsername}>@{a.username}</Text> : null}
                  <Text style={styles.cardPontos}>{a.totalPontos} pts</Text>
                </View>
                <TouchableOpacity style={styles.botaoRemover} onPress={() => handleRemover(a.uid, a.nome)}>
                  <Text style={styles.botaoRemoverTexto}>Remover</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          )
        )}

        {tab === 'pedidos' && (
          loading ? <ActivityIndicator color="#1B4332" style={{ marginTop: 48 }} /> :
          pedidos.length === 0 ? (
            <View style={styles.vazio}>
              <Text style={styles.vazioEmoji}>📨</Text>
              <Text style={styles.vazioTexto}>Sem pedidos pendentes</Text>
            </View>
          ) : (
            pedidos.map(p => (
              <View key={p.id} style={styles.card}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarTexto}>{iniciais(p.nome)}</Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardNome}>{p.nome}</Text>
                  <Text style={styles.cardUsername}>Quer ser teu amigo</Text>
                </View>
                <View style={styles.acoes}>
                  <TouchableOpacity style={styles.botaoAceitar} onPress={() => handleResponder(p.id, true)}>
                    <Text style={styles.botaoAceitarTexto}>✓</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.botaoRejeitar} onPress={() => handleResponder(p.id, false)}>
                    <Text style={styles.botaoRejeitarTexto}>×</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )
        )}

        {tab === 'procurar' && (
          <View>
            <TextInput
              style={styles.input}
              placeholder="Pesquisar por nome ou username..."
              placeholderTextColor="#bbb"
              value={pesquisa}
              onChangeText={handlePesquisa}
            />
            {pesquisando && <ActivityIndicator color="#1B4332" style={{ marginTop: 12 }} />}
            {resultados.map(r => (
              <TouchableOpacity key={r.id} style={styles.card} activeOpacity={0.7}
                onPress={() => router.push(`/user-profile?userId=${r.id}`)}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarTexto}>{iniciais(r.nome || r.username)}</Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardNome}>{r.nome || r.username || 'Utilizador'}</Text>
                  {r.username ? <Text style={styles.cardUsername}>@{r.username}</Text> : null}
                  <Text style={styles.cardPontos}>{r.totalPontos || 0} pts</Text>
                </View>
                <TouchableOpacity style={styles.botaoAdicionar} onPress={() => handleAdicionar(r.id)}>
                  <Text style={styles.botaoAdicionarTexto}>+</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
            {pesquisa.length >= 2 && !pesquisando && resultados.length === 0 && (
              <Text style={styles.semResultados}>Nenhum utilizador encontrado.</Text>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: 20, backgroundColor: '#fff', paddingBottom: 48, paddingTop: 8 },
  header: { marginBottom: 24, marginTop: 40 },
  titulo: { fontSize: 28, fontWeight: '800', color: '#1a1a1a', letterSpacing: -0.5, lineHeight: 36 },
  subtitulo: { fontSize: 13, color: '#999', marginTop: 3 },
  tabContainer: { flexDirection: 'row', backgroundColor: '#f0f0f0', borderRadius: 10, padding: 4, marginBottom: 24 },
  tabButton: { flex: 1, paddingVertical: 10, borderRadius: 8 },
  tabButtonActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  tabButtonText: { textAlign: 'center', color: '#666', fontWeight: '600', fontSize: 13 },
  tabButtonTextActive: { color: '#1B4332' },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14,
    padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#f0f0f0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#639922',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  avatarTexto: { fontSize: 15, fontWeight: '700', color: '#fff' },
  cardInfo: { flex: 1 },
  cardNome: { fontSize: 15, fontWeight: '700', color: '#1a1a1a' },
  cardUsername: { fontSize: 12, color: '#aaa', marginTop: 1 },
  cardPontos: { fontSize: 12, color: '#639922', fontWeight: '600', marginTop: 2 },
  botaoRemover: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#FEE2E2' },
  botaoRemoverTexto: { fontSize: 12, fontWeight: '700', color: '#DC2626' },
  acoes: { flexDirection: 'row', gap: 8 },
  botaoAceitar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#EAF3DE', justifyContent: 'center', alignItems: 'center' },
  botaoAceitarTexto: { fontSize: 18, fontWeight: '700', color: '#1B4332' },
  botaoRejeitar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center' },
  botaoRejeitarTexto: { fontSize: 18, fontWeight: '700', color: '#DC2626' },
  botaoAdicionar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#1B4332', justifyContent: 'center', alignItems: 'center' },
  botaoAdicionarTexto: { fontSize: 20, fontWeight: '700', color: '#fff' },
  input: {
    borderWidth: 1.5, borderColor: '#E5E5E5', borderRadius: 12,
    padding: 13, fontSize: 15, color: '#1a1a1a', backgroundColor: '#fff',
  },
  vazio: { alignItems: 'center', marginTop: 64, paddingHorizontal: 24 },
  vazioEmoji: { fontSize: 40, marginBottom: 12 },
  vazioTexto: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 8 },
  vazioSub: { fontSize: 14, color: '#aaa', textAlign: 'center', lineHeight: 20 },
  semResultados: { textAlign: 'center', color: '#aaa', marginTop: 24, fontSize: 14 },
});