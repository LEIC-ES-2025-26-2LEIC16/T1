// Importamos as ferramentas que vamos usar
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

// Lista de ecopontos com dados fixos (sem base de dados por agora)
const ECOPONTOS = [
  { id: '1', nome: 'Ecoponto Rua das Flores', estado: 'Operacional' },
  { id: '2', nome: 'Ecoponto Praça do Município', estado: 'Cheio' },
  { id: '3', nome: 'Ecoponto Av. dos Aliados', estado: 'Operacional' },
];

// Este é o ecrã principal da app
export default function HomeScreen() {
  const router = useRouter();
  return (
    // View é um contentor, como uma caixa
    <View style={styles.container}>

      {/* Título no topo do ecrã */}
      <Text style={styles.titulo}>Ecopontos</Text>

      {/* FlatList percorre a lista ECOPONTOS e cria um card para cada um */}
      <FlatList
        data={ECOPONTOS}
        keyExtractor={(item) => item.id} // id único para cada item
        renderItem={({ item }) => (

          // Card de cada ecoponto
          <View style={styles.card} testID="recycling-bin-marker">
            <Text style={styles.nome}>{item.nome}</Text>
            <Text style={styles.estado}>{item.estado}</Text>

            {/* Botão para reportar problema — navega para o formulário */}
            <TouchableOpacity
              style={styles.botao}
              testID="report-problem-button"
              onPress={() => router.push({ pathname: '/report-problem' as any, params: { ecopontoNome: item.nome, ecopontoMorada: item.estado } })}
            >
              <Text style={styles.botaoTexto}>Reportar Problema</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

// Estilos de cada elemento (funciona como CSS)
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  titulo: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, marginTop: 40 },
  card: { backgroundColor: '#f0f0f0', borderRadius: 10, padding: 16, marginBottom: 12 },
  nome: { fontSize: 16, fontWeight: '600' },
  estado: { fontSize: 14, color: '#666', marginTop: 4 },
  botao: { backgroundColor: '#126439ff', borderRadius: 8, padding: 10, marginTop: 10 },
  botaoTexto: { color: '#fff', textAlign: 'center', fontWeight: '600' },
});
