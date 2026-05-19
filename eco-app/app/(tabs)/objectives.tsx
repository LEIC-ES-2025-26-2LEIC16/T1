import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  getObjetivos, criarObjetivo, eliminarObjetivo, getHistoricoReciclagem,
  type Objetivo,
} from '@/services/firestore';
import { tabelaPontos } from '@/utils/recyclingUtils';

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
  const [objetivos, setObjetivos] = useState<Objetivo[]>([]);
  const [registos, setRegistos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [material, setMaterial] = useState('Todos');
  const [metaKg, setMetaKg] = useState('');
  const [periodo, setPeriodo] = useState<'semanal' | 'mensal'>('mensal');
  const [guardando, setGuardando] = useState(false);
  const [selectedObjetivoId, setSelectedObjetivoId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getObjetivos(), getHistoricoReciclagem()])
      .then(([obj, reg]) => { setObjetivos(obj); setRegistos(reg); })
      .finally(() => setLoading(false));
  }, []);

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
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: '#fff' }}>
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

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
          <Text style={styles.botaoNovoTexto}>{mostrarForm ? '×' : '+'}</Text>
        </TouchableOpacity>
      </View>

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
                  <Text style={{ fontSize: 11, fontWeight: '700', color: meta.cor }}>{meta.iniciais}</Text>
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

      {loading ? (
        <ActivityIndicator color="#1B4332" style={{ marginTop: 48 }} />
      ) : objetivos.length === 0 ? (
        <View style={styles.vazio} testID="objectives-empty-state">
          <Text style={styles.vazioTexto}>Sem objetivos</Text>
          <Text style={styles.vazioSub}>Cria o teu primeiro objetivo de reciclagem.</Text>
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
                style={[styles.card, { borderLeftColor: meta.cor }, selectedObjetivoId === obj.id && styles.cardSelecionado]}
                activeOpacity={0.7}
                onPress={() => setSelectedObjetivoId(selectedObjetivoId === obj.id ? null : obj.id)}
              >

                <View style={styles.cardTopo}>
                  <View style={[styles.iconCircle, { backgroundColor: meta.fundo }]}>
                    <Text style={[styles.iconTexto, { color: meta.cor }]}>{meta.iniciais}</Text>
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
                      <Text style={styles.botaoEliminarTexto}>×</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.barraFundo}>
                  <View style={[
                    styles.barraProgresso,
                    { width: `${percentagem}%`, backgroundColor: concluido ? '#1B4332' : meta.cor },
                  ]} />
                </View>

                <View style={styles.cardRodape}>
                  <Text style={styles.kgTexto}>{kgFeitos} kg feitos</Text>
                  {concluido
                    ? <View style={styles.badgeConcluido}><Text style={styles.badgeTexto}>Concluído</Text></View>
                    : <Text style={styles.kgTexto}>{(obj.metaKg - Number(kgFeitos)).toFixed(1)} kg em falta</Text>
                  }
                </View>

              </TouchableOpacity>

              {selectedObjetivoId === obj.id && (
                <View style={styles.historicoInline}>
                  <Text style={styles.historicoInlineTitulo}>
                    Registos de {obj.material === 'Todos' ? 'todos os materiais' : obj.material}
                  </Text>
                  {registos.filter(r => obj.material === 'Todos' || (r.material ?? r.type) === obj.material).length === 0 ? (
                    <Text style={styles.historicoInlineVazio}>Nenhum registo encontrado.</Text>
                  ) : (
                    registos
                      .filter(r => obj.material === 'Todos' || (r.material ?? r.type) === obj.material)
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .slice(0, 10)
                      .map(r => (
                        <View key={r.id} style={styles.historicoInlineCard}>
                          <View style={[styles.historicoInlineIndicator, { backgroundColor: materialColor(r.type) }]} />
                          <View style={styles.historicoInlineBody}>
                            <View style={styles.historicoInlineRow}>
                              <View style={[styles.historicoInlineBadge, { backgroundColor: materialColor(r.type) + '15' }]}>
                                <Text style={[styles.historicoInlineBadgeText, { color: materialColor(r.type) }]}>
                                  {materialLabel(r.type)}
                                </Text>
                              </View>
                              <Text style={styles.historicoInlineAmount}>{r.amount}</Text>
                            </View>
                            <View style={styles.historicoInlineRow}>
                              <Text style={styles.historicoInlineDate}>{formatDate(r.date)}</Text>
                              <Text style={styles.historicoInlineImpact}>-{r.impact}</Text>
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
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: 20, backgroundColor: '#fff', paddingBottom: 48, paddingTop: 8 },

  header:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, marginTop: 40 },
  titulo:    { fontSize: 28, fontWeight: '800', color: '#1a1a1a', letterSpacing: -0.5, lineHeight: 36 },
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
  iconTexto:   { fontSize: 13, fontWeight: '700' },
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
  cardSelecionado: { borderBottomLeftRadius: 0, borderBottomRightRadius: 0, marginBottom: 0 },
  historicoInline: {
    backgroundColor: '#FAFAFA', borderWidth: 1, borderColor: '#EFEFEF',
    borderBottomLeftRadius: 12, borderBottomRightRadius: 12,
    padding: 12, marginBottom: 14, borderTopWidth: 0,
  },
  historicoInlineTitulo: { fontSize: 12, fontWeight: '600', color: '#999', marginBottom: 10, letterSpacing: 0.5 },
  historicoInlineVazio: { fontSize: 13, color: '#bbb', textAlign: 'center', paddingVertical: 12 },
  historicoInlineCard: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 8,
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
  historicoInlineDate:   { fontSize: 11, color: '#aaa' },
  historicoInlineAmount: { fontSize: 13, fontWeight: '700', color: '#1a1a1a' },
  historicoInlineImpact: { fontSize: 11, fontWeight: '600', color: '#639922' },
});
