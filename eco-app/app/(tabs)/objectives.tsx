import { useState, useCallback, useEffect } from 'react';
import { useFocusEffect, router } from 'expo-router';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, TextInput, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/services/firebase';
import {
  getObjetivos, criarObjetivo, eliminarObjetivo, getHistoricoReciclagem,
  getObjetivosPartilhados, criarObjetivoPartilhado, eliminarObjetivoPartilhado,
  getAmigos,
  type Objetivo, type ObjetivoPartilhado,
} from '@/services/firestore';
import { tabelaPontos } from '@/utils/recyclingUtils';
import { useThemeColors } from '@/hooks/use-theme-colors';

const MATERIAL_META: Record<string, { cor: string; fundo: string; iniciais: string }> = {
  'Todos':    { cor: '#1B4332', fundo: '#EAF3DE', iniciais: 'Td' },
  'Plástico': { cor: '#2563EB', fundo: '#EFF6FF', iniciais: 'Pl' },
  'Papel':    { cor: '#D97706', fundo: '#FFFBEB', iniciais: 'Pa' },
  'Vidro':    { cor: '#0891B2', fundo: '#ECFEFF', iniciais: 'Vd' },
  'Metal':    { cor: '#7C3AED', fundo: '#F5F3FF', iniciais: 'Mt' },
};

const MATERIAIS = ['Todos', ...Object.keys(tabelaPontos)];
const PERIODOS: { label: string; value: 'semanal' | 'mensal' }[] = [
  { label: 'Semanal', value: 'semanal' },
  { label: 'Mensal',  value: 'mensal'  },
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

const formatDate = (date: any) =>
  new Date(date).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' });

const materialColor = (type: string) => {
  const t = (type || '').toLowerCase();
  if (t.includes('plastico') || t.includes('plástico')) return '#2563EB';
  if (t.includes('papel')) return '#D97706';
  if (t.includes('vidro')) return '#0891B2';
  if (t.includes('metal')) return '#7C3AED';
  return '#1B4332';
};

const materialLabel = (type: string) => {
  const t = (type || '').toLowerCase();
  if (t.includes('plastico') || t.includes('plástico')) return 'PL';
  if (t.includes('papel')) return 'PA';
  if (t.includes('vidro')) return 'VD';
  if (t.includes('metal')) return 'MT';
  return 'TD';
};

export default function ObjectivesScreen() {
  const colors = useThemeColors();
  const [objetivos, setObjetivos] = useState<Objetivo[]>([]);
  const [registos, setRegistos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [material, setMaterial] = useState('Todos');
  const [metaKg, setMetaKg] = useState('');
  const [periodo, setPeriodo] = useState<'semanal' | 'mensal'>('mensal');
  const [guardando, setGuardando] = useState(false);
  const [selectedObjetivoId, setSelectedObjetivoId] = useState<string | null>(null);

  const [currentTab, setCurrentTab] = useState<'pessoais' | 'partilhados' | 'desafios'>('pessoais');
  const [objetivosPartilhados, setObjetivosPartilhados] = useState<(ObjetivoPartilhado & { progressoUid1: number; progressoUid2: number })[]>([]);
  const [listaAmigos, setListaAmigos] = useState<{ uid: string; nome: string }[]>([]);
  const [mostrarFormPartilhado, setMostrarFormPartilhado] = useState(false);
  const [amigoSelecionado, setAmigoSelecionado] = useState<string | null>(null);
  const [isParticipatingNike, setIsParticipatingNike] = useState(false);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [hasClaimedNikeReward, setHasClaimedNikeReward] = useState(false);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    Promise.all([getObjetivos(), getHistoricoReciclagem(), getObjetivosPartilhados(), getAmigos()])
      .then(async ([obj, reg, part, amigos]) => {
        setObjetivos(obj);
        setRegistos(reg);
        setObjetivosPartilhados(part);
        const perfis = await Promise.all(
          amigos.map(async a => {
            const snap = await getDoc(doc(db, 'utilizadores', a.uid));
            const d = snap.data() || {};
            return { uid: a.uid, nome: d.nome || d.username || 'Amigo' };
          })
        );
        setListaAmigos(perfis);
      })
      .finally(() => setLoading(false));
  }, []));

  const nikeProgress = registos
    .filter(r => r.material === 'Plástico' || r.type === 'Plástico')
    .reduce((sum, r) => sum + (parseFloat(r.quantidade ?? r.amount) || 0), 0);

  const nikeProgressPercentage = Math.min((nikeProgress / 10.0) * 100, 100);

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

  const iniciais = (nome: string) =>
    nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.container, { backgroundColor: colors.background }]}>
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
        <View>
          <Text style={[styles.titulo, { color: colors.textPrimary }]}>Objetivos</Text>
          <Text style={[styles.subtitulo, { color: colors.textMuted }]}>Acompanha o teu progresso de reciclagem</Text>
        </View>
      </View>

      <View style={[styles.tabContainer, { backgroundColor: colors.cardBackground }]}>
        <TouchableOpacity
          style={[styles.tabButton, currentTab === 'pessoais' && { backgroundColor: colors.card, shadowColor: '#000' }]}
          onPress={() => setCurrentTab('pessoais')}
        >
          <Text style={[styles.tabButtonText, { color: colors.textSecondary }, currentTab === 'pessoais' && { color: colors.primary }]}>Meus Objetivos</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, currentTab === 'partilhados' && { backgroundColor: colors.card, shadowColor: '#000' }]}
          onPress={() => setCurrentTab('partilhados')}
        >
          <Text style={[styles.tabButtonText, { color: colors.textSecondary }, currentTab === 'partilhados' && { color: colors.primary }]}>Partilhados</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, currentTab === 'desafios' && { backgroundColor: colors.card, shadowColor: '#000' }]}
          onPress={() => setCurrentTab('desafios')}
        >
          <Text style={[styles.tabButtonText, { color: colors.textSecondary }, currentTab === 'desafios' && { color: colors.primary }]}>Desafios</Text>
        </TouchableOpacity>
      </View>

      {currentTab === 'pessoais' && (
        <>
          <TouchableOpacity
            style={[styles.botaoNovo, { backgroundColor: colors.primary, shadowColor: colors.primary }, mostrarForm && { backgroundColor: colors.textSecondary }]}
            onPress={() => setMostrarForm(v => !v)}
            testID="objectives-add-button"
          >
            <Text style={styles.botaoNovoTexto}>{mostrarForm ? '×' : '+'}</Text>
          </TouchableOpacity>

          {mostrarForm && (
            <View style={[styles.form, { backgroundColor: colors.formBackground, borderColor: colors.cardBorder }]}>
              <Text style={[styles.formTitulo, { color: colors.textPrimary }]}>Novo objetivo</Text>

              <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>MATERIAL</Text>
              <View style={styles.chips}>
                {MATERIAIS.map(m => {
                  const meta = MATERIAL_META[m];
                  const sel = material === m;
                  return (
                    <TouchableOpacity
                      key={m}
                      style={[styles.chip, { borderColor: colors.border, backgroundColor: colors.card }, sel && { backgroundColor: meta.cor, borderColor: meta.cor }]}
                      onPress={() => setMaterial(m)}
                      testID={`chip-material-${m}`}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '700', color: meta.cor }}>{meta.iniciais}</Text>
                      <Text style={[styles.chipTexto, { color: colors.textSecondary }, sel && styles.chipTextoSelecionado]}>{m}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>META (KG)</Text>
              <TextInput
                style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.card }]}
                keyboardType="numeric"
                placeholder="Ex: 10"
                placeholderTextColor={colors.textPlaceholder}
                value={metaKg}
                onChangeText={setMetaKg}
              />

              <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>PERÍODO</Text>
              <View style={styles.chips}>
                {PERIODOS.map(p => (
                  <TouchableOpacity
                    key={p.value}
                    style={[styles.chip, styles.chipPeriodo, { borderColor: colors.border, backgroundColor: colors.card }, periodo === p.value && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                    onPress={() => setPeriodo(p.value)}
                    testID={`chip-periodo-${p.value}`}
                  >
                    <Text style={[styles.chipTexto, { color: colors.textSecondary }, periodo === p.value && { color: colors.card }]}>
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={[styles.botaoGuardar, { backgroundColor: colors.primary }]} onPress={guardar} disabled={guardando} testID="objectives-create-button">
                {guardando
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.botaoGuardarTexto}>Criar objetivo</Text>}
              </TouchableOpacity>
            </View>
          )}

          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 48 }} />
          ) : objetivos.length === 0 ? (
            <View style={styles.vazio} testID="objectives-empty-state">
              <Text style={styles.vazioEmoji}>🎯</Text>
              <Text style={[styles.vazioTexto, { color: colors.textPrimary }]}>Sem objetivos ainda</Text>
              <Text style={[styles.vazioSub, { color: colors.textMuted }]}>Carrega em + para criar o teu primeiro objetivo de reciclagem.</Text>
            </View>
          ) : (
            objetivos.map(obj => {
              const meta = MATERIAL_META[obj.material] ?? MATERIAL_META['Todos'];
              const progresso = calcularProgresso(obj, registos);
              const kgFeitos = (progresso * obj.metaKg).toFixed(1);
              const percentagem = Math.round(progresso * 100);
              const concluido = progresso >= 1;

              return (
              <View key={obj.id}>
              <TouchableOpacity
                style={[styles.card, { backgroundColor: colors.card, borderLeftColor: meta.cor }, selectedObjetivoId === obj.id && styles.cardSelecionado]}
                activeOpacity={0.7}
                onPress={() => setSelectedObjetivoId(selectedObjetivoId === obj.id ? null : obj.id)}
              >

                <View style={styles.cardTopo}>
                  <View style={[styles.iconCircle, { backgroundColor: meta.fundo }]}>
                    <Text style={[styles.iconTexto, { color: meta.cor }]}>{meta.iniciais}</Text>
                  </View>

                  <View style={styles.cardInfo}>
                    <Text style={[styles.cardTitulo, { color: colors.textPrimary }]}>{obj.material === 'Todos' ? 'Todos os materiais' : obj.material}</Text>
                    <Text style={[styles.cardSub, { color: colors.textMuted }]}>
                      {obj.periodo === 'semanal' ? 'Esta semana' : 'Este mês'} · meta {obj.metaKg} kg
                    </Text>
                  </View>

                  <View style={styles.cardDireita}>
                    <Text style={[styles.percentagem, { color: concluido ? colors.primary : meta.cor }]}>
                      {percentagem}%
                    </Text>
                    <TouchableOpacity onPress={() => eliminar(obj.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} testID={`objectives-delete-${obj.id}`}>
                      <Text style={[styles.botaoEliminarTexto, { color: colors.textMuted }]}>×</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={[styles.barraFundo, { backgroundColor: colors.cardBackground }]}>
                  <View style={[
                    styles.barraProgresso,
                    { width: `${percentagem}%`, backgroundColor: concluido ? colors.primary : meta.cor },
                  ]} />
                </View>

                <View style={styles.cardRodape}>
                  <Text style={[styles.kgTexto, { color: colors.textMuted }]}>{kgFeitos} kg feitos</Text>
                  {concluido
                    ? <View style={[styles.badgeConcluido, { backgroundColor: colors.primaryLight }]}><Text style={[styles.badgeTexto, { color: colors.primary }]}>Concluído</Text></View>
                    : <Text style={[styles.kgTexto, { color: colors.textMuted }]}>{(obj.metaKg - Number(kgFeitos)).toFixed(1)} kg em falta</Text>
                  }
                </View>

              </TouchableOpacity>

              {selectedObjetivoId === obj.id && (
                <View style={[styles.historicoInline, { backgroundColor: colors.formBackground, borderColor: colors.cardBorder }]}>
                  <Text style={[styles.historicoInlineTitulo, { color: colors.textMuted }]}>
                    Registos de {obj.material === 'Todos' ? 'todos os materiais' : obj.material}
                  </Text>
                  {registos.filter(r => obj.material === 'Todos' || (r.material ?? r.type) === obj.material).length === 0 ? (
                    <Text style={[styles.historicoInlineVazio, { color: colors.textPlaceholder }]}>Nenhum registo encontrado.</Text>
                  ) : (
                    registos
                      .filter(r => obj.material === 'Todos' || (r.material ?? r.type) === obj.material)
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .slice(0, 10)
                      .map(r => (
                        <View key={r.id} style={[styles.historicoInlineCard, { backgroundColor: colors.card }]}>
                          <View style={[styles.historicoInlineIndicator, { backgroundColor: materialColor(r.type) }]} />
                          <View style={styles.historicoInlineBody}>
                            <View style={styles.historicoInlineRow}>
                              <View style={[styles.historicoInlineBadge, { backgroundColor: materialColor(r.type) + '15' }]}>
                                <Text style={[styles.historicoInlineBadgeText, { color: materialColor(r.type) }]}>
                                  {materialLabel(r.type)}
                                </Text>
                              </View>
                              <Text style={[styles.historicoInlineAmount, { color: colors.textPrimary }]}>{r.amount}</Text>
                            </View>
                            <View style={styles.historicoInlineRow}>
                              <Text style={[styles.historicoInlineDate, { color: colors.textMuted }]}>{formatDate(r.date)}</Text>
                              <Text style={[styles.historicoInlineImpact, { color: colors.secondary }]}>-{r.impact}</Text>
                            </View>
                          </View>
                        </View>
                      ))
                  )}
                </View>
              )}
              </View>
              );
            })
          )}
        </>
      )}

      {currentTab === 'partilhados' && (
        <>
          {!loading && listaAmigos.length === 0 ? (
            <View style={styles.vazio}>
              <Text style={styles.vazioEmoji}>👥</Text>
              <Text style={[styles.vazioTexto, { color: colors.textPrimary }]}>Sem amigos ainda</Text>
              <Text style={[styles.vazioSub, { color: colors.textMuted }]}>Adiciona amigos para criares objetivos partilhados.</Text>
              <TouchableOpacity
                style={[styles.botaoGuardar, { backgroundColor: colors.primary }]}
                onPress={() => router.push('/amigos')}
              >
                <Text style={styles.botaoGuardarTexto}>Adicionar amigos</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {mostrarFormPartilhado && (
                <View style={[styles.form, { backgroundColor: colors.formBackground, borderColor: colors.cardBorder }]}>
                  <Text style={[styles.formTitulo, { color: colors.textPrimary }]}>Novo objetivo partilhado</Text>

                  <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>COM AMIGO</Text>
                  <View style={styles.chips}>
                    {listaAmigos.map(a => (
                      <TouchableOpacity
                        key={a.uid}
                        style={[styles.chip, { borderColor: colors.border, backgroundColor: colors.card }, amigoSelecionado === a.uid && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                        onPress={() => setAmigoSelecionado(a.uid)}
                      >
                        <Text style={[styles.chipTexto, { color: colors.textSecondary }, amigoSelecionado === a.uid && styles.chipTextoSelecionado]}>{a.nome}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>MATERIAL</Text>
                  <View style={styles.chips}>
                    {MATERIAIS.map(m => {
                      const meta = MATERIAL_META[m];
                      const sel = material === m;
                      return (
                        <TouchableOpacity
                          key={m}
                          style={[styles.chip, { borderColor: colors.border, backgroundColor: colors.card }, sel && { backgroundColor: meta.cor, borderColor: meta.cor }]}
                          onPress={() => setMaterial(m)}
                        >
                          <Text style={{ fontSize: 11, fontWeight: '700', color: meta.cor }}>{meta.iniciais}</Text>
                          <Text style={[styles.chipTexto, { color: colors.textSecondary }, sel && styles.chipTextoSelecionado]}>{m}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>META (KG)</Text>
                  <TextInput
                    style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.card }]}
                    keyboardType="numeric"
                    placeholder="Ex: 10"
                    placeholderTextColor={colors.textPlaceholder}
                    value={metaKg}
                    onChangeText={setMetaKg}
                  />

                  <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>PERÍODO</Text>
                  <View style={styles.chips}>
                    {PERIODOS.map(p => (
                      <TouchableOpacity
                        key={p.value}
                        style={[styles.chip, styles.chipPeriodo, { borderColor: colors.border, backgroundColor: colors.card }, periodo === p.value && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                        onPress={() => setPeriodo(p.value)}
                      >
                        <Text style={[styles.chipTexto, { color: colors.textSecondary }, periodo === p.value && { color: colors.card }]}>{p.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TouchableOpacity style={[styles.botaoGuardar, { backgroundColor: colors.primary }]} onPress={async () => {
                    if (!amigoSelecionado) { Alert.alert('Seleciona um amigo'); return; }
                    if (!metaKg || isNaN(Number(metaKg)) || Number(metaKg) <= 0) { Alert.alert('Meta inválida'); return; }
                    try {
                      await criarObjetivoPartilhado(amigoSelecionado, material, Number(metaKg), periodo);
                      setMostrarFormPartilhado(false);
                      setAmigoSelecionado(null);
                      setMetaKg('');
                      const part = await getObjetivosPartilhados();
                      setObjetivosPartilhados(part);
                    } catch (e: any) { Alert.alert('Erro', e.message); }
                  }} disabled={guardando}>
                    <Text style={styles.botaoGuardarTexto}>Criar objetivo partilhado</Text>
                  </TouchableOpacity>
                </View>
              )}

              {loading ? (
                <ActivityIndicator color={colors.primary} style={{ marginTop: 48 }} />
              ) : (
                <>
                  <TouchableOpacity
                    style={[styles.botaoNovo, { backgroundColor: colors.primary, shadowColor: colors.primary }, mostrarFormPartilhado && { backgroundColor: colors.textSecondary }]}
                    onPress={() => setMostrarFormPartilhado(v => !v)}
                  >
                    <Text style={styles.botaoNovoTexto}>{mostrarFormPartilhado ? '×' : '+'}</Text>
                  </TouchableOpacity>

                  {objetivosPartilhados.length === 0 ? (
                    <View style={styles.vazio}>
                      <Text style={styles.vazioEmoji}>🤝</Text>
                      <Text style={[styles.vazioTexto, { color: colors.textPrimary }]}>Sem objetivos partilhados</Text>
                      <Text style={[styles.vazioSub, { color: colors.textMuted }]}>Cria um objetivo com um amigo para compararem o progresso.</Text>
                    </View>
                  ) : (
                    objetivosPartilhados.map(o => {
                      const meuUid = auth.currentUser?.uid || '';
                      const amigoUid = o.uid1 === meuUid ? o.uid2 : o.uid1;
                      const amigoNome = listaAmigos.find(a => a.uid === amigoUid)?.nome || 'Amigo';
                      const meuProgresso = o.uid1 === meuUid ? o.progressoUid1 : o.progressoUid2;
                      const progressoAmigo = o.uid1 === meuUid ? o.progressoUid2 : o.progressoUid1;
                      const meta = MATERIAL_META[o.material] || MATERIAL_META['Todos'];

                      return (
                        <View key={o.id} style={[styles.card, { backgroundColor: colors.card, borderLeftColor: meta.cor }]}>
                          <View style={styles.cardTopo}>
                            <View style={[styles.iconCircle, { backgroundColor: meta.fundo }]}>
                              <Text style={[styles.iconTexto, { color: meta.cor }]}>{meta.iniciais}</Text>
                            </View>
                            <View style={styles.cardInfo}>
                              <Text style={[styles.cardTitulo, { color: colors.textPrimary }]}>Partilhado com {amigoNome}</Text>
                              <Text style={[styles.cardSub, { color: colors.textMuted }]}>{o.material} · meta {o.metaKg} kg ({o.periodo})</Text>
                            </View>
                            <TouchableOpacity onPress={() => eliminarObjetivoPartilhado(o.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                              <Text style={[styles.botaoEliminarTexto, { color: colors.textMuted }]}>×</Text>
                            </TouchableOpacity>
                          </View>

                          <View style={{ marginTop: 12 }}>
                            <View style={styles.barraComparacao}>
                              <Text style={[styles.comparacaoLabel, { color: colors.textSecondary }]}>Tu: {meuProgresso.toFixed(1)} kg</Text>
                              <View style={[styles.barraFundoComparacao, { backgroundColor: colors.cardBackground }]}>
                                <View style={[styles.barraProgressoComparacao, { width: `${Math.min((meuProgresso / o.metaKg) * 100, 100)}%`, backgroundColor: colors.primary }]} />
                              </View>
                            </View>
                            <View style={styles.barraComparacao}>
                              <Text style={[styles.comparacaoLabel, { color: colors.textSecondary }]}>{amigoNome}: {progressoAmigo.toFixed(1)} kg</Text>
                              <View style={[styles.barraFundoComparacao, { backgroundColor: colors.cardBackground }]}>
                                <View style={[styles.barraProgressoComparacao, { width: `${Math.min((progressoAmigo / o.metaKg) * 100, 100)}%`, backgroundColor: colors.secondary }]} />
                              </View>
                            </View>
                          </View>
                        </View>
                      );
                    })
                  )}
                </>
              )}
            </>
          )}
        </>
      )}

      {currentTab === 'desafios' && (
        <View>
          <View style={[styles.challengeCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={[styles.challengeHeader, { backgroundColor: colors.textPrimary }]}>
              <Text style={styles.challengeBrand}>NIKE CHALLENGE</Text>
            </View>
            <View style={styles.challengeBody}>
              <Text style={[styles.challengeTitle, { color: colors.textPrimary }]}>Recicla 10kg de plástico e ganha 20% de desconto!</Text>
              <Text style={[styles.challengeDescription, { color: colors.textSecondary }]}>
                Ajuda o planeta e a Nike a atingir as suas metas de sustentabilidade. Participa no desafio e recebe um voucher exclusivo.
              </Text>

              <Text style={{ fontSize: 12, color: '#e63946', marginTop: 8, fontWeight: 'bold' }}>
                ⏳ Termina a 31 de Maio
              </Text>

              {isParticipatingNike ? (
                <View style={styles.progressContainer}>
                  <Text style={[styles.progressText, { color: colors.textSecondary }]}>{nikeProgress.toFixed(1)} / 10.0 kg</Text>
                  <View style={[styles.challengeProgressBar, { backgroundColor: colors.cardBackground }]}>
                    <View style={[styles.challengeProgress, { backgroundColor: colors.primary, width: `${nikeProgressPercentage}%` }]} />
                  </View>
                </View>
              ) : (
                <TouchableOpacity style={[styles.challengeButton, { backgroundColor: colors.primary }]} onPress={() => setIsParticipatingNike(true)}>
                  <Text style={styles.challengeButtonText}>Participar</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

        <Text style={[styles.pastChallengesTitle, { color: colors.textMuted }]}>DESAFIOS PASSADOS</Text>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => Alert.alert(
            "Desafio Terminado",
            "Ficaste pelos 8/10kg! O desafio terminou, mas recebeste 80 EcoCoins base pelo teu esforço. Conseguirás da próxima vez!",
            [{ text: "OK" }]
          )}
        >
          <View style={[styles.challengeCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
            <View style={[styles.challengeHeader, { backgroundColor: colors.textMuted }]}>
              <Text style={styles.challengeBrand}>Adidas Challenge (Expirado)</Text>
            </View>
            <View style={styles.challengeBody}>
              <Text style={[styles.challengeTitle, { color: colors.textSecondary }]}>
                Recicla 10kg de plástico e ganha 15% de desconto!
              </Text>
              <Text style={[styles.challengeDescription, { color: colors.textMuted }]}>
                Este desafio terminou a 30 de Abril.
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        </View>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={showRewardModal}
        onRequestClose={() => setShowRewardModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={styles.modalEmoji}>🎉</Text>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Parabéns!</Text>
            <Text style={[styles.modalText, { color: colors.textSecondary }]}>Atingiste os 10kg no desafio da Nike. Aqui está o teu prémio:</Text>
            <View style={[styles.rewardCodeBox, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
              <Text style={[styles.rewardCodeText, { color: colors.primary }]}>NIKE-ECO-20</Text>
            </View>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.primary }]}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 48, paddingTop: 8 },

  header:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, marginTop: 40 },
  titulo:    { fontSize: 28, fontWeight: '800', letterSpacing: -0.5, lineHeight: 36 },
  subtitulo: { fontSize: 13, marginTop: 3 },
  botaoNovo: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 4, alignSelf: 'flex-end', marginBottom: 16,
  },
  botaoNovoTexto:  { color: '#fff', fontSize: 22, fontWeight: '400', lineHeight: 26 },

  tabContainer: { flexDirection: 'row', borderRadius: 10, padding: 4, marginBottom: 24 },
  tabButton: { flex: 1, paddingVertical: 10, borderRadius: 8 },
  tabButtonText: { textAlign: 'center', fontWeight: '600', fontSize: 13 },

  form: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 28,
    borderWidth: 1,
  },
  formTitulo:  { fontSize: 17, fontWeight: '700', marginBottom: 16 },
  fieldLabel:  { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 10, marginTop: 16 },
  chips:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1.5,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7,
  },
  chipPeriodo:          { paddingHorizontal: 16 },
  chipTexto:            { fontSize: 13, fontWeight: '500' },
  chipTextoSelecionado: { color: '#fff', fontWeight: '600' },
  input: {
    borderWidth: 1.5, borderRadius: 12,
    padding: 13, fontSize: 16,
  },
  botaoGuardar:      { borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 20 },
  botaoGuardarTexto: { color: '#fff', fontWeight: '700', fontSize: 16 },

  vazio:      { alignItems: 'center', marginTop: 64, paddingHorizontal: 24 },
  vazioEmoji: { fontSize: 40, marginBottom: 12 },
  vazioTexto: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  vazioSub:   { fontSize: 14, textAlign: 'center', lineHeight: 20 },

  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTopo:    { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  iconCircle:  { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  iconTexto:   { fontSize: 13, fontWeight: '700' },
  cardInfo:    { flex: 1 },
  cardTitulo:  { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  cardSub:     { fontSize: 12 },
  cardDireita: { alignItems: 'flex-end', gap: 6 },
  percentagem: { fontSize: 20, fontWeight: '800' },
  botaoEliminarTexto: { fontSize: 15, fontWeight: '700' },

  barraFundo:     { height: 10, borderRadius: 5, overflow: 'hidden', marginBottom: 10 },
  barraProgresso: { height: 10, borderRadius: 5 },

  cardRodape:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kgTexto:        { fontSize: 12 },
  badgeConcluido: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3 },
  badgeTexto:     { fontSize: 12, fontWeight: '700' },
  cardSelecionado: { borderBottomLeftRadius: 0, borderBottomRightRadius: 0, marginBottom: 0 },
  historicoInline: {
    borderWidth: 1,
    borderBottomLeftRadius: 12, borderBottomRightRadius: 12,
    padding: 12, marginBottom: 14, borderTopWidth: 0,
  },
  historicoInlineTitulo: { fontSize: 12, fontWeight: '600', marginBottom: 10, letterSpacing: 0.5 },
  historicoInlineVazio: { fontSize: 13, textAlign: 'center', paddingVertical: 12 },
  historicoInlineCard: {
    flexDirection: 'row', borderRadius: 8,
    marginBottom: 6, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03, shadowRadius: 2, elevation: 1,
  },
  historicoInlineIndicator: { width: 3 },
  historicoInlineBody: { flex: 1, padding: 10 },
  historicoInlineRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 3,
  },
  historicoInlineBadge: {
    borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2,
  },
  historicoInlineBadgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  historicoInlineDate:   { fontSize: 11 },
  historicoInlineAmount: { fontSize: 13, fontWeight: '700' },
  historicoInlineImpact: { fontSize: 11, fontWeight: '600' },

  challengeCard: { borderRadius: 16, overflow: 'hidden', borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4 },
  challengeHeader: { padding: 14 },
  challengeBrand: { color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: 1 },
  challengeBody: { padding: 20 },
  challengeTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  challengeDescription: { fontSize: 14, lineHeight: 20, marginBottom: 20 },
  challengeButton: { borderRadius: 10, padding: 14, alignItems: 'center' },
  challengeButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  progressContainer: { marginTop: 8 },
  progressText: { fontSize: 13, fontWeight: '600', textAlign: 'right', marginBottom: 6 },
  challengeProgressBar: { height: 12, borderRadius: 6, overflow: 'hidden' },
  challengeProgress: { height: '100%', borderRadius: 6 },

  pastChallengesTitle: {
    marginTop: 32,
    marginBottom: 12,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  barraComparacao: { marginBottom: 6 },
  comparacaoLabel: { fontSize: 12, marginBottom: 3 },
  barraFundoComparacao: { height: 8, borderRadius: 4, overflow: 'hidden' },
  barraProgressoComparacao: { height: 8, borderRadius: 4 },

  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContent: {
    width: '85%',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalEmoji: { fontSize: 48, marginBottom: 16 },
  modalTitle: { fontSize: 22, fontWeight: '800', marginBottom: 8 },
  modalText: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  rewardCodeBox: { borderRadius: 10, paddingVertical: 12, paddingHorizontal: 20, marginBottom: 24, borderWidth: 1 },
  rewardCodeText: { fontSize: 18, fontWeight: '700', letterSpacing: 1 },
  modalButton: { borderRadius: 12, padding: 15, alignItems: 'center', width: '100%' },
  modalButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
