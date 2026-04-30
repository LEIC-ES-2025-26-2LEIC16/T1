import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, TextInput,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
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

function calcularProgresso(
  objetivo: Objetivo,
  registos: { date: string; amount: string; type: string }[]
): number {
  const inicio = inicioDoperiodo(objetivo.periodo);
  const total = registos
    .filter(r => {
      const dentro = new Date(r.date) >= inicio;
      const mat = objetivo.material === 'Todos' || r.type === objetivo.material;
      return dentro && mat;
    })
    .reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
  return Math.min(total / objetivo.metaKg, 1);
}

export default function ObjectivesScreen() {
  const insets = useSafeAreaInsets();
  const [objetivos, setObjetivos] = useState<Objetivo[]>([]);
  const [registos, setRegistos] = useState<{ date: string; amount: string; type: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [material, setMaterial] = useState('Todos');
  const [metaKg, setMetaKg] = useState('');
  const [periodo, setPeriodo] = useState<'semanal' | 'mensal'>('mensal');
  const [guardando, setGuardando] = useState(false);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    Promise.all([getObjetivos(), getHistoricoReciclagem()])
      .then(([obj, reg]) => { setObjetivos(obj); setRegistos(reg); })
      .finally(() => setLoading(false));
  }, []));

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
          await eliminarObjetivo(id);
          setObjetivos(o => o.filter(x => x.id !== id));
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
        >
          <Text style={styles.botaoNovoTexto}>{mostrarForm ? '✕' : '+'}</Text>
        </TouchableOpacity>
      </View>

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
              >
                <Text style={[styles.chipTexto, periodo === p.value && styles.chipTextoSelecionado]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.botaoGuardar} onPress={guardar} disabled={guardando}>
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
        <View style={styles.vazio}>
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
                  <TouchableOpacity onPress={() => eliminar(obj.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
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
});
