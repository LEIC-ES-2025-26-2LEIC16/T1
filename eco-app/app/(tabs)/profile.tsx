import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  ScrollView, Alert, TextInput, KeyboardAvoidingView, Platform, Share, Modal, useColorScheme
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth, db } from '@/services/firebase';
import {
  getEstatisticasUtilizador,
  getPerfilUtilizador,
  guardarPerfilUtilizador,
  type PerfilUtilizador,
  gerarCodigoReferral,
  getInfoReferral,
  type InfoReferral,
  getAmigos, getPedidosRecebidos, getSugestoesAmigos,
  enviarPedidoAmizade, responderPedidoAmizade, removerAmigo,
} from '@/services/firestore';
import { Colors } from '@/constants/theme';

type Estatisticas = {
  totalReciclagens: number;
  totalKg: string;
  totalCO2: string;
  totalPontos: number;
};

const BANNER_HEIGHT = 130;
const AVATAR_SIZE = 90;

async function pickImagem(maxW = 600): Promise<string> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    quality: 0.4,
    base64: true,
  });
  if (result.canceled) return '';
  const asset = result.assets[0];
  return `data:image/jpeg;base64,${asset.base64}`;
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const user = auth.currentUser;
  const [stats, setStats] = useState<Estatisticas | null>(null);
  const [perfil, setPerfil] = useState<PerfilUtilizador>({ nome: '', username: '', bio: '', avatarUrl: '', bannerUrl: '' });
  const [rascunho, setRascunho] = useState<PerfilUtilizador>({ nome: '', username: '', bio: '', avatarUrl: '', bannerUrl: '' });
  const [editando, setEditando] = useState(false);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);

    // Referral
  const [referral,          setReferral]          = useState<InfoReferral | null>(null);
  const [loadingReferral,   setLoadingReferral]   = useState(false);
  const [partilhando,       setPartilhando]       = useState(false);
  const [mostrarBonusModal, setMostrarBonusModal] = useState(false);

  // Amigos
  const [amigosLista, setAmigosLista] = useState<{ uid: string; nome: string; username: string }[]>([]);
  const [pedidosLista, setPedidosLista] = useState<{ id: string; deUid: string; nome: string }[]>([]);
  const [pesquisaAmigos, setPesquisaAmigos] = useState('');
  const [resultadosAmigos, setResultadosAmigos] = useState<any[]>([]);
  const [pesquisandoAmigos, setPesquisandoAmigos] = useState(false);
  const [abaAmigos, setAbaAmigos] = useState<'amigos' | 'pedidos' | 'procurar'>('amigos');

  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const carregarAmigos = async () => {
    const amigos = await getAmigos();
    const perfis = await Promise.all(amigos.map(async a => {
      const snap = await getDoc(doc(db, 'utilizadores', a.uid));
      const d = snap.data() || {};
      return { uid: a.uid, nome: d.nome || d.username || 'Amigo', username: d.username || '' };
    }));
    setAmigosLista(perfis);
    const pedidos = await getPedidosRecebidos();
    const perfisP = await Promise.all(pedidos.map(async p => {
      const snap = await getDoc(doc(db, 'utilizadores', p.deUid));
      const d = snap.data() || {};
      return { ...p, nome: d.nome || d.username || 'Utilizador' };
    }));
    setPedidosLista(perfisP);
  };

  useEffect(() => {
    Promise.all([getEstatisticasUtilizador(), getPerfilUtilizador(), getInfoReferral(), carregarAmigos()])
      .then(([s, p, r]) => { setStats(s); setPerfil(p); setReferral(r); })
      .finally(() => setLoading(false));
  }, []);



   // Polling: deteta quando um novo amigo se regista
  useEffect(() => {
    if (!referral) return;
    const interval = setInterval(async () => {
      const info = await getInfoReferral();
      if (info && referral && info.totalConvidados > referral.totalConvidados) {
        setMostrarBonusModal(true);
        setReferral(info);
      }
    }, 15_000);
    return () => clearInterval(interval);
  }, [referral]);

  const partilharConvite = async () => {
    setPartilhando(true);
    try {
      let info = referral;
      if (!info) {
        setLoadingReferral(true);
        info = await gerarCodigoReferral();
        setReferral(info);
        setLoadingReferral(false);
      }
      const mensagem =
        `Junta-te a mim no MyImpact e vamos reciclar juntos! 🌱\n\n` +
        `Usa o meu link de convite:\n${info.link}\n\nCódigo: ${info.codigo}`;
      await Share.share({ message: mensagem });
    } catch (err: any) {
      if (err?.message !== 'User did not share')
        Alert.alert('Erro', 'Não foi possível abrir o menu de partilha.');
    } finally {
      setPartilhando(false);
      setLoadingReferral(false);
    }
  };


  const iniciais = perfil.nome
    ? perfil.nome.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? '?';

  const abrirEdicao = () => {
    setRascunho({ ...perfil });
    setEditando(true);
  };

  const escolherAvatar = async () => {
    const data = await pickImagem();
    if (data) setRascunho(r => ({ ...r, avatarUrl: data }));
  };

  const escolherBanner = async () => {
    const data = await pickImagem(900);
    if (data) setRascunho(r => ({ ...r, bannerUrl: data }));
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
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color="#1B4332" />
      </View>
    );
  }

  const avatarSource = editando ? rascunho.avatarUrl : perfil.avatarUrl;
  const bannerSource = editando ? rascunho.bannerUrl : perfil.bannerUrl;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Banner */}
        <View style={{ paddingTop: insets.top, backgroundColor: '#1B4332' }}>
        <TouchableOpacity
          activeOpacity={editando ? 0.7 : 1}
          onPress={editando ? escolherBanner : undefined}
          style={styles.bannerWrapper}
        >
          {bannerSource ? (
            <Image source={{ uri: bannerSource }} style={styles.bannerImage} contentFit="cover" />
          ) : (
            <View style={styles.banner} />
          )}
          {editando && (
            <View style={styles.editOverlay}>
              <Text style={styles.editOverlayText}>Alterar capa</Text>
            </View>
          )}
        </TouchableOpacity>
        </View>

        {/* Avatar + botão editar */}
        <View style={styles.avatarRow}>
          <TouchableOpacity activeOpacity={editando ? 0.7 : 1} onPress={editando ? escolherAvatar : undefined}>
            <View style={styles.avatar}>
              {avatarSource ? (
                <Image source={{ uri: avatarSource }} style={styles.avatarImage} contentFit="cover" />
              ) : (
                <Text style={styles.avatarTexto}>{iniciais}</Text>
              )}
              {editando && (
                <View style={styles.avatarEditOverlay}>
                  <Text style={styles.avatarEditText}>Editar</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
          {!editando && (
            <TouchableOpacity
             accessible={true}
             testID="profile-edit-button"
             accessibilityLabel="profile-edit-button"
             style={styles.botaoEditar}
             onPress={abrirEdicao}
>
              <Text style={styles.botaoEditarTexto}>Editar perfil</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Info / formulário */}
        <View style={styles.infoContainer}>
          {editando ? (
            <>
              <Text style={styles.fieldLabel}>Foto de perfil</Text>
              <TouchableOpacity style={styles.botaoImagem} onPress={escolherAvatar}>
                <Text style={styles.botaoImagemTexto}>
                  {rascunho.avatarUrl ? 'Alterar foto' : 'Adicionar foto'}
                </Text>
              </TouchableOpacity>

              <Text style={styles.fieldLabel}>Imagem de capa</Text>
              <TouchableOpacity style={styles.botaoImagem} onPress={escolherBanner}>
                <Text style={styles.botaoImagemTexto}>
                  {rascunho.bannerUrl ? 'Alterar capa' : 'Adicionar capa'}
                </Text>
              </TouchableOpacity>

              <Text style={styles.fieldLabel}>Nome</Text>
              <TextInput
                testID="profile-name-input"
                style={[styles.input, colorScheme === 'dark' && { backgroundColor: '#1E293B', color: '#fff', borderColor: '#334155' }]}
                value={rascunho.nome}
                onChangeText={v => setRascunho(r => ({ ...r, nome: v }))}
                placeholder="O teu nome"
                placeholderTextColor="#bbb"
              />

              <Text style={styles.fieldLabel}>Nome de utilizador</Text>
              <TextInput
                testID="profile-username-input"
                style={[styles.input, colorScheme === 'dark' && { backgroundColor: '#1E293B', color: '#fff', borderColor: '#334155' }]}
                value={rascunho.username}
                onChangeText={v => setRascunho(r => ({ ...r, username: v.replace(/\s/g, '') }))}
                placeholder="@username"
                placeholderTextColor="#bbb"
                autoCapitalize="none"
              />

              <Text style={styles.fieldLabel}>Bio</Text>
              <TextInput
                testID="profile-bio-input"
                style={[styles.input, styles.inputBio, colorScheme === 'dark' && { backgroundColor: '#1E293B', color: '#fff', borderColor: '#334155' }]}
                value={rascunho.bio}
                onChangeText={v => setRascunho(r => ({ ...r, bio: v }))}
                placeholder="Conta um pouco sobre ti..."
                placeholderTextColor="#bbb"
                multiline
                numberOfLines={3}
              />

              {__DEV__ && (
                <TouchableOpacity 
                  testID="autofill-profile" 
                  onPress={() => setRascunho(r => ({ ...r, nome: 'Joao', username: 'jo', bio: 'test' }))}
                  style={{ width: 1, height: 1 }}
                />
              )}

              <View style={styles.botoesEdicao}>
                <TouchableOpacity style={styles.botaoCancelar} onPress={() => setEditando(false)} testID="profile-cancel-button">
                  <Text style={styles.botaoCancelarTexto}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.botaoGuardar} onPress={guardar} disabled={guardando} testID="profile-save-button">
                  {guardando
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={styles.botaoGuardarTexto}>Guardar</Text>}
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Text style={[styles.nome, { color: theme.text }]}>{perfil.nome || 'Sem nome'}</Text>
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
          <View style={[styles.statCard, colorScheme === 'dark' && { backgroundColor: '#1E293B', borderColor: '#334155' }]}>
            <Text style={[styles.statValor, { color: theme.text }]}>{stats?.totalReciclagens ?? 0}</Text>
            <Text style={styles.statLabel}>reciclagens</Text>
          </View>
          <View style={[styles.statCard, colorScheme === 'dark' && { backgroundColor: '#1E293B', borderColor: '#334155' }]}>
            <Text style={[styles.statValor, { color: theme.text }]}>{stats?.totalPontos ?? 0}</Text>
            <Text style={styles.statLabel}>pontos</Text>
          </View>
          <View style={[styles.statCard, colorScheme === 'dark' && { backgroundColor: '#1E293B', borderColor: '#334155' }]}>
            <Text style={[styles.statValor, { color: theme.text }]}>{stats?.totalKg ?? '0.0'} kg</Text>
            <Text style={styles.statLabel}>reciclado</Text>
          </View>
          <View style={[styles.statCard, styles.statCardVerde, colorScheme === 'dark' && { backgroundColor: '#334155', borderColor: '#475569' }]}>
            <Text style={[styles.statValor, { color: colorScheme === 'dark' ? '#86EFAC' : '#1B4332' }]}>{stats?.totalCO2 ?? '0.0'} kg</Text>
            <Text style={[styles.statLabel, { color: colorScheme === 'dark' ? '#86EFAC' : '#1B4332' }]}>CO2 poupado</Text>
          </View>
        </View>
      <TouchableOpacity 
        style={styles.botaoWrapped} 
        onPress={() => router.push('/wrapped' as any)}
        testID="profile-wrapped-button"
      >
        <Text style={styles.botaoWrappedTexto}>Ver o meu Wrapped 2026</Text>
      </TouchableOpacity>

        <View style={styles.separador} />

        {/* ── Amigos ── */}
        <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
          <Text style={styles.secaoTitulo}>AMIGOS</Text>

          <View style={{ flexDirection: 'row', backgroundColor: '#f0f0f0', borderRadius: 10, padding: 4, marginBottom: 16 }}>
            {(['amigos', 'pedidos', 'procurar'] as const).map(t => (
              <TouchableOpacity key={t} style={{ flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: abaAmigos === t ? '#fff' : 'transparent' }}
                onPress={() => setAbaAmigos(t)}>
                <Text style={{ textAlign: 'center', color: abaAmigos === t ? '#1B4332' : '#666', fontWeight: '600', fontSize: 12 }}>
                  {t === 'amigos' ? `Amigos (${amigosLista.length})` : t === 'pedidos' ? `Pedidos (${pedidosLista.length})` : 'Procurar'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {abaAmigos === 'amigos' && (
            amigosLista.length === 0 ? (
              <Text style={{ color: '#aaa', textAlign: 'center', paddingVertical: 12, fontSize: 13 }}>Sem amigos ainda.</Text>
            ) : (
              amigosLista.map(a => (
                <TouchableOpacity key={a.uid} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' }}
                  onPress={() => router.push({ pathname: '/user-profile', params: { userId: a.uid } } as any)}>
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#639922', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>
                      {a.nome.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#1a1a1a' }}>{a.nome}</Text>
                    {a.username ? <Text style={{ fontSize: 11, color: '#aaa' }}>@{a.username}</Text> : null}
                  </View>
                </TouchableOpacity>
              ))
            )
          )}

          {abaAmigos === 'pedidos' && (
            pedidosLista.length === 0 ? (
              <Text style={{ color: '#aaa', textAlign: 'center', paddingVertical: 12, fontSize: 13 }}>Sem pedidos pendentes.</Text>
            ) : (
              pedidosLista.map(p => (
                <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' }}>
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#639922', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>
                      {p.nome.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#1a1a1a' }}>{p.nome}</Text>
                    <Text style={{ fontSize: 11, color: '#aaa' }}>Quer ser teu amigo</Text>
                  </View>
                  <TouchableOpacity style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#EAF3DE', justifyContent: 'center', alignItems: 'center', marginRight: 6 }}
                    onPress={async () => { await responderPedidoAmizade(p.id, true); carregarAmigos(); }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#1B4332' }}>✓</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center' }}
                    onPress={async () => { await responderPedidoAmizade(p.id, false); carregarAmigos(); }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#DC2626' }}>×</Text>
                  </TouchableOpacity>
                </View>
              ))
            )
          )}

          {abaAmigos === 'procurar' && (
            <View>
              <TextInput
                style={{
                  borderWidth: 1.5, borderColor: '#E5E5E5', borderRadius: 12,
                  padding: 12, fontSize: 14, color: '#1a1a1a', backgroundColor: '#fff',
                }}
                placeholder="Pesquisar por nome ou username..."
                placeholderTextColor="#bbb"
                value={pesquisaAmigos}
                onChangeText={async (v) => {
                  setPesquisaAmigos(v);
                  if (v.length < 2) { setResultadosAmigos([]); return; }
                  setPesquisandoAmigos(true);
                  const res = await getSugestoesAmigos(v);
                  setResultadosAmigos(res.filter(r => r.id !== auth.currentUser?.uid));
                  setPesquisandoAmigos(false);
                }}
              />
              {pesquisandoAmigos && <ActivityIndicator color="#1B4332" style={{ marginTop: 8 }} />}
              {resultadosAmigos.map(r => (
                <TouchableOpacity key={r.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colorScheme === 'dark' ? '#334155' : '#f0f0f0' }}
                  onPress={() => router.push({ pathname: '/user-profile', params: { userId: r.id } } as any)}>
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#639922', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>
                      {(r.nome || r.username || 'U').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>{r.nome || r.username || 'Utilizador'}</Text>
                    {r.username ? <Text style={{ fontSize: 11, color: '#aaa' }}>@{r.username}</Text> : null}
                    <Text style={{ fontSize: 11, color: '#639922', fontWeight: '600' }}>{r.totalPontos || 0} pts</Text>
                  </View>
                  <TouchableOpacity style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#1B4332', justifyContent: 'center', alignItems: 'center' }}
                    onPress={async () => {
                      try {
                        await enviarPedidoAmizade(r.id);
                        Alert.alert('Pedido enviado');
                        setResultadosAmigos(prev => prev.filter(x => x.id !== r.id));
                      } catch (e: any) { Alert.alert('Erro', e.message); }
                    }}>
                    <Text style={{ fontSize: 18, fontWeight: '700', color: '#fff' }}>+</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
              {pesquisaAmigos.length >= 2 && !pesquisandoAmigos && resultadosAmigos.length === 0 && (
                <Text style={{ textAlign: 'center', color: '#aaa', marginTop: 16, fontSize: 13 }}>Nenhum utilizador encontrado.</Text>
              )}
            </View>
          )}
        </View>

        <View style={styles.separador} />

        {/* ── Painel Convidar Amigos ── */}
        <Text style={styles.secaoTitulo}>CONVIDAR AMIGOS</Text>
        <View style={[styles.referralCard, colorScheme === 'dark' && { backgroundColor: '#1E293B', borderColor: '#334155' }]}>
          <View style={styles.referralCabecalho}>
            <View style={[styles.referralIcone, colorScheme === 'dark' && { backgroundColor: '#334155' }]}>
              <Text style={styles.referralIconeTexto}>🌱</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.referralTitulo, { color: theme.text }]}>Convida e ganha EcoCoins</Text>
              <Text style={styles.referralSub}>
                Cada amigo que se registar com o teu link vale{' '}
                <Text style={{ color: colorScheme === 'dark' ? '#86EFAC' : '#1B4332', fontWeight: '700' }}>50 EcoCoins</Text> para ti.
              </Text>
            </View>
          </View>

          {referral && (
            <View style={styles.referralStats}>
              <View style={styles.referralStatItem}>
                <Text style={styles.referralStatValor}>{referral.totalConvidados}</Text>
                <Text style={styles.referralStatLabel}>amigos{'\n'}convidados</Text>
              </View>
              <View style={styles.referralStatDivider} />
              <View style={styles.referralStatItem}>
                <Text style={styles.referralStatValor}>{referral.pontosGanhos}</Text>
                <Text style={styles.referralStatLabel}>EcoCoins{'\n'}ganhos</Text>
              </View>
              <View style={styles.referralStatDivider} />
              <View style={styles.referralStatItem}>
                <Text style={[styles.referralStatValor, { fontSize: 13, letterSpacing: 1 }]}>
                  {referral.codigo}
                </Text>
                <Text style={styles.referralStatLabel}>o teu{'\n'}código</Text>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={styles.botaoPartilhar}
            onPress={partilharConvite}
            disabled={partilhando || loadingReferral}
            testID="profile-share-invite-button"
          >
            {partilhando || loadingReferral
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.botaoPartilharTexto}>↗ Partilhar link de convite</Text>
            }
          </TouchableOpacity>

          <Text style={styles.referralNota}>
            O bónus só é creditado após o teu amigo completar o registo.
          </Text>
        </View>

        <View style={styles.separador} />

        <TouchableOpacity style={styles.botaoSair} onPress={handleLogout}>
          <Text style={styles.botaoSairTexto}>Terminar sessão</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Modal bónus */}
      <Modal animationType="slide" transparent visible={mostrarBonusModal}
        onRequestClose={() => setMostrarBonusModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalEmoji}>🎉</Text>
            <Text style={styles.modalTitulo}>O teu amigo juntou-se!</Text>
            <Text style={styles.modalTexto}>
              Registou-se no MyImpact através do teu convite.{'\n'}
              Ganhaste <Text style={{ color: '#1B4332', fontWeight: '700' }}>50 EcoCoins</Text>!
            </Text>
            <TouchableOpacity style={styles.modalBotao} onPress={() => setMostrarBonusModal(false)}>
              <Text style={styles.modalBotaoTexto}>Ótimo!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  container:        { backgroundColor: '#fff', paddingBottom: 48 },

  bannerWrapper: { overflow: 'hidden', height: BANNER_HEIGHT },
  banner: {
    height: BANNER_HEIGHT,
    backgroundColor: '#1B4332',
  },
  bannerImage: {
    width: '100%',
    height: BANNER_HEIGHT,
  },
  editOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center', alignItems: 'center',
  },
  editOverlayText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  avatarRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    marginTop: -(AVATAR_SIZE / 2),
    marginBottom: 12,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: '#639922',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    overflow: 'hidden',
  },
  avatarImage: { width: AVATAR_SIZE, height: AVATAR_SIZE },
  avatarTexto: { fontSize: 34, fontWeight: '700', color: '#fff' },
  avatarEditOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center', alignItems: 'center',
    borderRadius: AVATAR_SIZE / 2,
  },
  avatarEditText: { color: '#fff', fontSize: 11, fontWeight: '600' },

  botaoEditar: {
    marginLeft: 'auto',
    borderWidth: 1.5,
    borderColor: '#1B4332',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 7,
    marginBottom: 6,
  },
  botaoEditarTexto: { color: '#1B4332', fontWeight: '600', fontSize: 13 },

  botaoImagem: {
    backgroundColor: '#f0f0f0', borderRadius: 10, padding: 12,
    alignItems: 'center', marginBottom: 4, borderWidth: 1, borderColor: '#e0e0e0',
  },
  botaoImagemTexto: { color: '#555', fontWeight: '600', fontSize: 14 },

  infoContainer: { paddingHorizontal: 20, marginBottom: 4 },

  nome:     { fontSize: 20, fontWeight: '700', color: '#1a1a1a' },
  username: { fontSize: 14, color: '#639922', fontWeight: '600', marginTop: 2 },
  email:    { fontSize: 13, color: '#999', marginTop: 2 },
  bio:      { fontSize: 14, color: '#444', marginTop: 10, lineHeight: 20 },
  bioVazia: { fontSize: 14, color: '#bbb', marginTop: 10, fontStyle: 'italic' },

  fieldLabel: { fontSize: 12, color: '#888', fontWeight: '600', marginBottom: 4, marginTop: 14 },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: '#1a1a1a',
    backgroundColor: '#fafafa',
  },
  inputBio:         { height: 80, textAlignVertical: 'top' },
  botoesEdicao:     { flexDirection: 'row', gap: 10, marginTop: 20 },
  botaoCancelar:    { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 10, padding: 13, alignItems: 'center' },
  botaoCancelarTexto: { color: '#666', fontWeight: '600' },
  botaoGuardar:     { flex: 1, backgroundColor: '#1B4332', borderRadius: 10, padding: 13, alignItems: 'center' },
  botaoGuardarTexto:{ color: '#fff', fontWeight: '700' },

  separador:    { height: 1, backgroundColor: '#f0f0f0', marginVertical: 20, marginHorizontal: 20 },
  secaoTitulo:  { fontSize: 11, fontWeight: '600', color: '#aaa', letterSpacing: 0.8, marginBottom: 12, paddingHorizontal: 20 },

  grelha:       { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 20, marginBottom: 32 },
  statCard:     { flex: 1, minWidth: '45%', backgroundColor: '#f7f7f7', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 0.5, borderColor: '#e8e8e8' },
  statCardVerde:{ backgroundColor: '#EAF3DE', borderColor: '#c4e0a0' },
  statValor:    { fontSize: 20, fontWeight: '700', color: '#1a1a1a', marginBottom: 3 },
  statLabel:    { fontSize: 11, color: '#888' },

  botaoSair:      { marginHorizontal: 20, marginTop: 0.1, borderWidth: 1.5, borderColor: '#DC2626', borderRadius: 10, padding: 14, alignItems: 'center' },
  botaoSairTexto: { color: '#DC2626', fontWeight: '700', fontSize: 15 },
  botaoWrapped: { marginHorizontal: 20, backgroundColor: '#1B4332', borderRadius: 10, padding: 14, alignItems: 'center', marginBottom: 20, shadowColor: '#1B4332', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4},
  botaoWrappedTexto: { color: '#fff', fontWeight: '700', fontSize: 16,},


  referralCard: {
    marginHorizontal: 20, marginBottom: 8, backgroundColor: '#FAFAFA',
    borderRadius: 16, borderWidth: 1, borderColor: '#EFEFEF', padding: 20,
  },
  referralCabecalho:  { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16 },
  referralIcone:      { width: 44, height: 44, borderRadius: 12, backgroundColor: '#EAF3DE', justifyContent: 'center', alignItems: 'center' },
  referralIconeTexto: { fontSize: 22 },
  referralTitulo:     { fontSize: 15, fontWeight: '700', color: '#1a1a1a', marginBottom: 3 },
  referralSub:        { fontSize: 13, color: '#666', lineHeight: 18 },
  referralStats:      { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#EFEFEF', marginBottom: 16, overflow: 'hidden' },
  referralStatItem:   { flex: 1, alignItems: 'center', paddingVertical: 14 },
  referralStatDivider:{ width: 1, backgroundColor: '#EFEFEF' },
  referralStatValor:  { fontSize: 18, fontWeight: '800', color: '#1B4332', marginBottom: 3 },
  referralStatLabel:  { fontSize: 10, color: '#aaa', textAlign: 'center', lineHeight: 14 },
  botaoPartilhar:     { backgroundColor: '#1B4332', borderRadius: 12, padding: 15, alignItems: 'center' },
  botaoPartilharTexto:{ color: '#fff', fontWeight: '700', fontSize: 15 },
  referralNota:       { fontSize: 11, color: '#bbb', textAlign: 'center', marginTop: 12, lineHeight: 16 },
  modalOverlay:       { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent:       { width: '82%', backgroundColor: '#fff', borderRadius: 20, padding: 28, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 8 },
  modalEmoji:         { fontSize: 52, marginBottom: 12 },
  modalTitulo:        { fontSize: 20, fontWeight: '800', color: '#1a1a1a', marginBottom: 8 },
  modalTexto:         { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  modalBotao:         { backgroundColor: '#1B4332', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 40 },
  modalBotaoTexto:    { color: '#fff', fontWeight: '700', fontSize: 16 },
});
