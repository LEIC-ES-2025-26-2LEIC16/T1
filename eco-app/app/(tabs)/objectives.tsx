import { useState, useCallback, useEffect } from 'react';
import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, TextInput, Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  getObjetivos, criarObjetivo, eliminarObjetivo, getHistoricoReciclagem,
  type Objetivo,
} from '@/services/firestore';
import { tabelaPontos } from '@/utils/recyclingUtils';

const MATERIAL_META: Record<string, { cor: string; fundo: string; emoji: string }> = {
  'Todos':    { cor: '#1B4332', fundo: '#EAF3DE', emoji: '♻️' },
  'Plástico': { cor: '#2563EB', fundo: '#EFF6FF', emoji: '🧴' },
  'Papel':    { cor: '#D97706', fundo: '#FFFBEB', emoji: '📄' },
  'Vidro':    { cor: '#0891B2', fundo: '#ECFEFF', emoji: '🫙' },
  'Metal':    { cor: '#7C3AED', fundo: '#F5F3FF', emoji: '🔩' },
};

const MATERIAIS = ['Todos', ...Object.keys(tabelaPontos)];
const PERIODOS: { label: string; value: 'semanal' | 'mensal' }[] = [
  { label: '📅  Semanal', value: 'semanal' },
  { label: '🗓  Mensal',  value: 'mensal'  },
];

function inicioDoperiodo(periodo: 'semanal' | 'mensal'): Date {
  const hoje = new Date();
  if (periodo === 'semanal') {
    const d = new Date(hoje);
    d.setDate(hoje.getDate() - hoje.getDay());
    d.setHours(0, 0, 0, 0);
    return d;
  }
  return new Date(hoje.getFullYear(), hoje.getMonth(), 1);
}

function calcularProgresso(objetivo: Objetivo, registos: any[]): number {
  const inicio = inicioDoperiodo(objetivo.periodo);
  const total = registos
    .filter(r => {
      const ts = r.criadoEm?.toDate?.() ?? (r.date ? new Date(r.date) : null);
      const material = r.material ?? r.type;
      return ts && ts >= inicio && (objetivo.material === 'Todos' || material === objetivo.material);
    })
    .reduce((s, r) => s + (parseFloat(r.quantidade ?? r.amount) || 0), 0);
  return Math.min(total / objetivo.metaKg, 1);
}

export default function ObjectivesScreen() {
  const insets = useSafeAreaInsets();
  const [objetivos, setObjetivos] = useState<Objetivo[]>([]);
  const [registos, setRegistos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [material, setMaterial] = useState('Todos');
  const [metaKg, setMetaKg] = useState('');
  const [periodo, setPeriodo] = useState<'semanal' | 'mensal'>('mensal');
  const [guardando, setGuardando] = useState(false);

  // new state for the tabs and challenges
  const [currentTab, setCurrentTab] = useState<'pessoais' | 'desafios'>('pessoais');
  const [isParticipatingNike, setIsParticipatingNike] = useState(false);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [hasClaimedNikeReward, setHasClaimedNikeReward] = useState(false);

  useFocusEffect(useCallback(() => {
    setLoading(true);
  useEffect(() => {
    Promise.all([getObjetivos(), getHistoricoReciclagem()])
      .then(([obj, reg]) => { setObjetivos(obj); setRegistos(reg); })
      .finally(() => setLoading(false));
  }, []);

  // Calculate Nike Challenge progress dynamically based on real 'Plástico' logs
  const nikeProgress = registos
    .filter(r => r.material === 'Plástico' || r.type === 'Plástico')
    .reduce((sum, r) => sum + (parseFloat(r.quantidade ?? r.amount) || 0), 0);

  const nikeProgressPercentage = Math.min((nikeProgress / 10.0) * 100, 100);

  // This effect checks if the user has completed the Nike challenge and shows the reward modal.
  useEffect(() => {
    if (isParticipatingNike && nikeProgress >= 10 && !hasClaimedNikeReward) {
      setShowRewardModal(true);
    }
  }, [isParticipatingNike, nikeProgress, hasClaimedNikeReward]);

  const guardar = async () => {
    if (!metaKg || isNaN(Number(metaKg)) || Number(metaKg) <= 0) {
      Alert.alert('Valor inválido', 'Introduz um número de kg válido.');
      return;
    }
    setGuardando(true);
    try {
      await criarObjetivo(material, Number(metaKg), periodo);
      const obj = await getObjetivos();
      setObjetivos(obj);
      setMostrarForm(false);
      setMetaKg('');
      setMaterial('Todos');
      setPeriodo('mensal');
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = (id: string) => {
    Alert.alert('Eliminar objetivo', 'Tens a certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive', onPress: async () => {
          try {
            await eliminarObjetivo(id);
            setObjetivos(o => o.filter(x => x.id !== id));
          } catch (error) {
            console.error("Erro ao eliminar objetivo:", error);
            Alert.alert("Erro", "Não foi possível eliminar o objetivo. Tente novamente.");
          }
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top + 8 }]} showsVerticalScrollIndicator={false}>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.titulo}>Objetivos</Text>
          <Text style={styles.subtitulo}>Acompanha o teu progresso de reciclagem</Text>
        </View>
        <TouchableOpacity
          style={[styles.botaoNovo, mostrarForm && styles.botaoNovoAtivo]}
          onPress={() => setMostrarForm(v => !v)}
          testID="objectives-add-button"
        >
          <Text style={styles.botaoNovoTexto}>{mostrarForm ? '✕' : '+'}</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Navigator */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, currentTab === 'pessoais' && styles.tabButtonActive]}
          onPress={() => setCurrentTab('pessoais')}
        >
          <Text style={[styles.tabButtonText, currentTab === 'pessoais' && styles.tabButtonTextActive]}>Meus Objetivos</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, currentTab === 'desafios' && styles.tabButtonActive]}
          onPress={() => setCurrentTab('desafios')}
        >
          <Text style={[styles.tabButtonText, currentTab === 'desafios' && styles.tabButtonTextActive]}>Desafios de Marcas</Text>
        </TouchableOpacity>
      </View>

      {/* Personal Objectives Tab */}
      {currentTab === 'pessoais' && (
        <>
          {/* Formulário */}
          {mostrarForm && (
            <View style={styles.form}>
              <Text style={styles.formTitulo}>Novo objetivo</Text>

              <Text style={styles.fieldLabel}>MATERIAL</Text>
              <View style={styles.chips}>
                {MATERIAIS.map(m => {
                  const meta = MATERIAL_META[m];
                  const sel = material === m;
                  return (
                    <TouchableOpacity
                      key={m}
                      style={[styles.chip, sel && { backgroundColor: meta.cor, borderColor: meta.cor }]}
                      onPress={() => setMaterial(m)}
                      testID={`chip-material-${m}`}
                    >
                      <Text style={{ fontSize: 14 }}>{meta.emoji}</Text>
                      <Text style={[styles.chipTexto, sel && styles.chipTextoSelecionado]}>{m}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.fieldLabel}>META (KG)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="Ex: 10"
                placeholderTextColor="#bbb"
                value={metaKg}
                onChangeText={setMetaKg}
              />

              <Text style={styles.fieldLabel}>PERÍODO</Text>
              <View style={styles.chips}>
                {PERIODOS.map(p => (
                  <TouchableOpacity
                    key={p.value}
                    style={[styles.chip, styles.chipPeriodo, periodo === p.value && styles.chipSelecionado]}
                    onPress={() => setPeriodo(p.value)}
                    testID={`chip-periodo-${p.value}`}
                  >
                    <Text style={[styles.chipTexto, periodo === p.value && styles.chipTextoSelecionado]}>
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.botaoGuardar} onPress={guardar} disabled={guardando} testID="objectives-create-button">
                {guardando
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.botaoGuardarTexto}>Criar objetivo</Text>}
              </TouchableOpacity>
            </View>
          )}

          {/* Lista */}
          {loading ? (
            <ActivityIndicator color="#1B4332" style={{ marginTop: 48 }} />
          ) : objetivos.length === 0 ? (
            <View style={styles.vazio} testID="objectives-empty-state">
              <Text style={styles.vazioEmoji}>🎯</Text>
              <Text style={styles.vazioTexto}>Sem objetivos ainda</Text>
              <Text style={styles.vazioSub}>Carrega em + para criar o teu primeiro objetivo de reciclagem.</Text>
            </View>
          ) : (
            objetivos.map(obj => {
              const meta = MATERIAL_META[obj.material] ?? MATERIAL_META['Todos'];
              const progresso = calcularProgresso(obj, registos);
              const kgFeitos = (progresso * obj.metaKg).toFixed(1);
              const percentagem = Math.round(progresso * 100);
              const concluido = progresso >= 1;

              return (
                <View key={obj.id} style={[styles.card, { borderLeftColor: meta.cor }]}>

                  {/* Topo */}
                  <View style={styles.cardTopo}>
                    <View style={[styles.iconCircle, { backgroundColor: meta.fundo }]}>
                      <Text style={styles.iconEmoji}>{meta.emoji}</Text>
                    </View>

                    <View style={styles.cardInfo}>
                      <Text style={styles.cardTitulo}>{obj.material === 'Todos' ? 'Todos os materiais' : obj.material}</Text>
                      <Text style={styles.cardSub}>
                        {obj.periodo === 'semanal' ? 'Esta semana' : 'Este mês'} · meta {obj.metaKg} kg
                      </Text>
                    </View>

                    <View style={styles.cardDireita}>
                      <Text style={[styles.percentagem, { color: concluido ? '#1B4332' : meta.cor }]}>
                        {percentagem}%
                      </Text>
                      <TouchableOpacity onPress={() => eliminar(obj.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} testID={`objectives-delete-${obj.id}`}>
                        <Text style={styles.botaoEliminarTexto}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Barra */}
                  <View style={styles.barraFundo}>
                    <View style={[
                      styles.barraProgresso,
                      { width: `${percentagem}%`, backgroundColor: concluido ? '#1B4332' : meta.cor },
                    ]} />
                  </View>

                  {/* Rodapé */}
                  <View style={styles.cardRodape}>
                    <Text style={styles.kgTexto}>{kgFeitos} kg feitos</Text>
                    {concluido
                      ? <View style={styles.badgeConcluido}><Text style={styles.badgeTexto}>✓ Concluído</Text></View>
                      : <Text style={styles.kgTexto}>{(obj.metaKg - Number(kgFeitos)).toFixed(1)} kg em falta</Text>
                    }
                  </View>

                </View>
              );
            })
          )}
        </>
      )}

      {/* Brand Challenges Tab */}
      {currentTab === 'desafios' && (
        <View>
          {/* Mock Nike Challenge Card */}
          <View style={styles.challengeCard}>
            <View style={styles.challengeHeader}>
              <Text style={styles.challengeBrand}>NIKE CHALLENGE</Text>
            </View>
            <View style={styles.challengeBody}>
              <Text style={styles.challengeTitle}>Recicla 10kg de plástico e ganha 20% de desconto!</Text>
              <Text style={styles.challengeDescription}>
                Ajuda o planeta e a Nike a atingir as suas metas de sustentabilidade. Participa no desafio e recebe um voucher exclusivo.
              </Text>

              {/* Add deadline indicator so the user knows when the challenge ends */}
              <Text style={{ fontSize: 12, color: '#e63946', marginTop: 8, fontWeight: 'bold' }}>
                ⏳ Termina a 31 de Maio
              </Text>

              {isParticipatingNike ? (
                <View style={styles.progressContainer}>
                  <Text style={styles.progressText}>{nikeProgress.toFixed(1)} / 10.0 kg</Text>
                  <View style={styles.challengeProgressBar}>
                    <View style={[styles.challengeProgress, { width: `${nikeProgressPercentage}%` }]} />
                  </View>
                </View>
              ) : (
                <TouchableOpacity style={styles.challengeButton} onPress={() => setIsParticipatingNike(true)}>
                  <Text style={styles.challengeButtonText}>Participar</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Past challenges section */}
        <Text style={styles.pastChallengesTitle}>DESAFIOS PASSADOS</Text>

         {/* Expired Challenge Card */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => Alert.alert(
            "Desafio Terminado",
            "Ficaste pelos 8/10kg! O desafio terminou, mas recebeste 80 EcoCoins base pelo teu esforço. Conseguirás da próxima vez!",
            [{ text: "OK" }]
          )}
        >
          <View style={[styles.challengeCard, styles.expiredCard]}>
            <View style={[styles.challengeHeader, styles.expiredHeader]}>
              <Text style={styles.challengeBrand}>Adidas Challenge (Expirado)</Text> 
            </View>
            <View style={styles.challengeBody}>
              <Text style={[styles.challengeTitle, styles.expiredText]}>
                Recicla 10kg de plástico e ganha 15% de desconto! 
              </Text>
              <Text style={[styles.challengeDescription, styles.expiredText]}>
                Este desafio terminou a 30 de Abril. 
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        </View>
      )}

      {/* Reward Modal for completing the Nike Challenge */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showRewardModal}
        onRequestClose={() => setShowRewardModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalEmoji}>🎉</Text>
            <Text style={styles.modalTitle}>Parabéns!</Text>
            <Text style={styles.modalText}>Atingiste os 10kg no desafio da Nike. Aqui está o teu prémio:</Text>
            <View style={styles.rewardCodeBox}>
              <Text style={styles.rewardCodeText}>NIKE-ECO-20</Text>
            </View>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setShowRewardModal(false);
                setHasClaimedNikeReward(true);
              }}
            >
              <Text style={styles.modalButtonText}>Guardar na Carteira</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: '#fff', paddingBottom: 48 },

  header:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  titulo:    { fontSize: 28, fontWeight: '800', color: '#1a1a1a', letterSpacing: -0.5 },
  subtitulo: { fontSize: 13, color: '#999', marginTop: 3 },
  botaoNovo: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#1B4332',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#1B4332', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
  },
  botaoNovoAtivo:  { backgroundColor: '#555' },
  botaoNovoTexto:  { color: '#fff', fontSize: 22, fontWeight: '400', lineHeight: 26 },

  tabContainer: { flexDirection: 'row', backgroundColor: '#f0f0f0', borderRadius: 10, padding: 4, marginBottom: 24 },
  tabButton: { flex: 1, paddingVertical: 10, borderRadius: 8 },
  tabButtonActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  tabButtonText: { textAlign: 'center', color: '#666', fontWeight: '600', fontSize: 13 },
  tabButtonTextActive: { color: '#1B4332' },


  form: {
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
    padding: 20,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  formTitulo:  { fontSize: 17, fontWeight: '700', color: '#1a1a1a', marginBottom: 16 },
  fieldLabel:  { fontSize: 11, fontWeight: '700', color: '#aaa', letterSpacing: 0.8, marginBottom: 10, marginTop: 16 },
  chips:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1.5, borderColor: '#E5E5E5',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7,
    backgroundColor: '#fff',
  },
  chipPeriodo:          { paddingHorizontal: 16 },
  chipSelecionado:      { backgroundColor: '#1B4332', borderColor: '#1B4332' },
  chipTexto:            { fontSize: 13, color: '#555', fontWeight: '500' },
  chipTextoSelecionado: { color: '#fff', fontWeight: '600' },
  input: {
    borderWidth: 1.5, borderColor: '#E5E5E5', borderRadius: 12,
    padding: 13, fontSize: 16, color: '#1a1a1a', backgroundColor: '#fff',
  },
  botaoGuardar:      { backgroundColor: '#1B4332', borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 20 },
  botaoGuardarTexto: { color: '#fff', fontWeight: '700', fontSize: 16 },

  vazio:      { alignItems: 'center', marginTop: 64, paddingHorizontal: 24 },
  vazioEmoji: { fontSize: 56, marginBottom: 16 },
  vazioTexto: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 8 },
  vazioSub:   { fontSize: 14, color: '#aaa', textAlign: 'center', lineHeight: 20 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#1B4332',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTopo:    { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  iconCircle:  { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  iconEmoji:   { fontSize: 22 },
  cardInfo:    { flex: 1 },
  cardTitulo:  { fontSize: 15, fontWeight: '700', color: '#1a1a1a', marginBottom: 2 },
  cardSub:     { fontSize: 12, color: '#aaa' },
  cardDireita: { alignItems: 'flex-end', gap: 6 },
  percentagem: { fontSize: 20, fontWeight: '800' },
  botaoEliminarTexto: { color: '#ddd', fontSize: 15, fontWeight: '700' },

  barraFundo:     { height: 10, backgroundColor: '#F3F3F3', borderRadius: 5, overflow: 'hidden', marginBottom: 10 },
  barraProgresso: { height: 10, borderRadius: 5 },

  cardRodape:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kgTexto:        { fontSize: 12, color: '#bbb' },
  badgeConcluido: { backgroundColor: '#EAF3DE', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3 },
  badgeTexto:     { fontSize: 12, fontWeight: '700', color: '#1B4332' },

  // Challenge Card Styles
  challengeCard: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#e5e5e5', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4 },
  challengeHeader: { backgroundColor: '#1a1a1a', padding: 14 },
  challengeBrand: { color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: 1 },
  challengeBody: { padding: 20 },
  challengeTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a1a', marginBottom: 8 },
  challengeDescription: { fontSize: 14, color: '#666', lineHeight: 20, marginBottom: 20 },
  challengeButton: { backgroundColor: '#1B4332', borderRadius: 10, padding: 14, alignItems: 'center' },
  challengeButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  progressContainer: { marginTop: 8 },
  progressText: { fontSize: 13, color: '#666', fontWeight: '600', textAlign: 'right', marginBottom: 6 },
  challengeProgressBar: { height: 12, backgroundColor: '#e0e0e0', borderRadius: 6, overflow: 'hidden' },
  challengeProgress: { height: '100%', backgroundColor: '#1B4332', borderRadius: 6 },

  // Expired Challenge Styles
  pastChallengesTitle: {
    marginTop: 32,
    marginBottom: 12,
    fontSize: 12,
    fontWeight: '700',
    color: '#aaa',
    letterSpacing: 0.5,
  },
  expiredCard: {
    backgroundColor: '#f5f5f5',
    shadowOpacity: 0.05,
    elevation: 2,
  },
  expiredHeader: {
    backgroundColor: '#b0b0b0',
  },
  expiredText: { color: '#999' },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContent: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  modalText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  rewardCodeBox: { backgroundColor: '#f0f0f0', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 20, marginBottom: 24, borderWidth: 1, borderColor: '#e5e5e5' },
  rewardCodeText: { fontSize: 18, fontWeight: '700', color: '#1B4332', letterSpacing: 1 },
  modalButton: { backgroundColor: '#1B4332', borderRadius: 12, padding: 15, alignItems: 'center', width: '100%' },
  modalButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
