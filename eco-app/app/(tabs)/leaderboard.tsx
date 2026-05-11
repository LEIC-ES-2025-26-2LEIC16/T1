import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db, auth } from '@/services/firebase'; // Garante que o caminho está correto
 
// define a estrutura de um utilizador no ranking
interface UserRank {
  id: string;
  name: string;
  username?: string;
  totalPontos: number;
}
 
export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  // estado para saber se estamos a carregar os dados
  const [loading, setLoading] = useState(true);
  // estado para guardar a lista de utilizadores do ranking
  const [users, setUsers] = useState<UserRank[]>([]);
 
  // efeito que corre uma vez quando o ecrã é montado
  useEffect(() => {
    // função temporária para testar a UI 
    const seedData = async () => {
      try {
        const { addDoc, collection } = await import('firebase/firestore');
        await addDoc(collection(db, 'utilizadores'), { name: 'Eco Hero', totalPontos: 1500 });
        await addDoc(collection(db, 'utilizadores'), { name: 'Recycle Master', totalPontos: 1200 });
        await addDoc(collection(db, 'utilizadores'), { name: 'Planeta Limpo', totalPontos: 800 });
      } catch (e) {
        console.error("Erro ao inserir mock:", e);
      }
    };

    // remover ou comentar esta linha logo a seguir a correr a app uma vez
    //seedData();

    // função para ir buscar os dados à base de dados
    const fetchLeaderboard = async () => {
      if (!auth.currentUser) {
        setUsers([]);
        setLoading(false);
        return;
      }

      try {
        // cria uma query para ir buscar os utilizadores
        const q = query(
          collection(db, 'utilizadores'),
          orderBy('totalPontos', 'desc'),
          limit(10)
        );
        
        const querySnapshot = await getDocs(q);
        // mapeia os resultados para o formato que queremos
        const leaderboardData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as UserRank[];
 
        // atualiza o estado com os dados recebidos
        setUsers(leaderboardData);
      } catch (error) {
        // se der erro, mostra na consola
        console.error("erro ao carregar ranking:", error);
      } finally {
        // no final, quer dê erro ou não, para de carregar
        setLoading(false);
      }
    };
 
    // chama a função para ir buscar os dados
    fetchLeaderboard();
  }, []); // o array vazio faz com que este efeito corra só uma vez
 
  const getRankStyle = (index: number) => {
    switch (index) {
      case 0:
        return { color: '#FFD700' }; // ouro
      case 1:
        return { color: '#C0C0C0' }; // prata
      case 2:
        return { color: '#CD7F32' }; // bronze
      default:
        return {}; // cor padrão do estilo
    }
  };

  // função que desenha cada item da lista
  const renderItem = ({ item, index }: { item: UserRank, index: number }) => (
    <View style={styles.itemContainer}>
      <Text style={[styles.rank, getRankStyle(index)]}>{index + 1}º</Text>
      <Text style={styles.name}>{item.name || item.username || 'utilizador anónimo'}</Text>
      <Text style={styles.points}>{(item.totalPontos || 0).toLocaleString()} pts</Text>
    </View>
  );
 
  // se ainda estiver a carregar, mostra uma animação
  if (loading) {
    return <ActivityIndicator size="large" color="#1B4332" style={{ flex: 1 }} />;
  }
 
  // quando os dados estiverem carregados, mostra o ecrã
  return (
    <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
      <Text style={styles.title}>Top Recicladores 🏆</Text>
      <FlatList
        data={users} // os dados da lista
        renderItem={renderItem} // como desenhar cada item
        keyExtractor={item => item.id} // identificador único para cada item
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1B4332', marginBottom: 20, textAlign: 'center' },
  list: { paddingBottom: 20 },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  rank: { fontSize: 18, fontWeight: 'bold', color: '#409167', width: 40 },
  name: { flex: 1, fontSize: 16, color: '#333' },
  points: { fontSize: 16, fontWeight: 'bold', color: '#1B4332' },
});