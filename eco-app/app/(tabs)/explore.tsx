import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import MapLibreGL from '@maplibre/maplibre-react-native';
import { type Ecoponto } from '@/constants/ecopontos';
import { ouvirEcopontos } from '@/services/firestore';
import Constants, { ExecutionEnvironment } from 'expo-constants';

// verifica se a aplicação está a ser executada no ambiente expo go.
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient; 

if (!isExpoGo) {
  // define o token de acesso como nulo para usar estilos gratuitos como openstreetmap.
  // esta linha só é executada em builds nativas (apk/aab), evitando crashes no expo go.
  MapLibreGL.setAccessToken(null);
}

// definição do estilo do mapa, utilizando um tile server gratuito do openstreetmap.
const MAP_STYLE = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap Contributors',
      maxzoom: 19,
    },
  },
  layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
};

// coordenadas do centro do porto para a câmara inicial do mapa.
const CENTRO_PORTO = [
  -8.6291, // longitude
  41.1579, // latitude
];

export default function MapaScreen() {
  const router = useRouter();
  // estado para armazenar a lista de ecopontos vinda do firestore.
  const [ecopontos, setEcopontos] = useState<Ecoponto[]>([]);
  // estado para controlar a visibilidade do indicador de carregamento.
  const [loading, setLoading] = useState(true);
  // estado para guardar o ecoponto que o utilizador selecionou no mapa.
  const [ecopontoSelecionado, setEcopontoSelecionado] = useState<Ecoponto | null>(null);

  useEffect(() => {
    // subscreve a alterações em tempo real na coleção de ecopontos.
    const unsubscribe = ouvirEcopontos((dados: Ecoponto[]) => {
      setEcopontos(dados);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <View style={styles.container}>
      {isExpoGo ? (
        // renderiza um ecrã de fallback se estiver no expo go, pois o maplibre não é compatível.
        <View style={[styles.mapa, styles.expoGoFallback]}>
          <Text style={styles.expoGoTitle}>Modo de Visualização: Expo Go</Text>
          <Text style={styles.expoGoSubtitle}>
            O mapa real (MapLibre) só será carregado no APK final. Podes testar o resto das
            funções aqui!
          </Text>
        </View>
      ) : (
        // renderiza o mapa real na build final (apk/aab).
        <MapLibreGL.MapView style={styles.mapa} styleURL={JSON.stringify(MAP_STYLE)}>
        <MapLibreGL.Camera
          zoomLevel={13}
          centerCoordinate={CENTRO_PORTO}
          animationDuration={0}
        />

        {/* mostra um overlay de carregamento enquanto os dados dos ecopontos são obtidos. */}
        {loading && !isExpoGo && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#1B4332" />
            <Text style={styles.loadingTexto}>A carregar mapa...</Text>
          </View>
        )}

        {/* itera sobre a lista de ecopontos e renderiza um marcador para cada um. */}
        {ecopontos.map((ecoponto) => (
          <MapLibreGL.PointAnnotation
            key={ecoponto.id}
            id={ecoponto.id}
            coordinate={[ecoponto.coordenadas.longitude, ecoponto.coordenadas.latitude]}
            onSelected={() => setEcopontoSelecionado(ecoponto)}
          >
            {/* o view representa o marcador visual no mapa, com estilos dinâmicos. */}
            <View style={[
              styles.marcador,
              ecoponto.estado === 'Cheio' && styles.marcadorCheio,
              ecoponto.estado === 'Danificado' && styles.marcadorDanificado,
              ecopontoSelecionado?.id === ecoponto.id && styles.marcadorSelecionado,
            ]}>
              <Text style={[
                styles.marcadorTexto,
                ecopontoSelecionado?.id === ecoponto.id && styles.marcadorTextoSelecionado,
              ]}>♻</Text>
            </View>
          </MapLibreGL.PointAnnotation>
        ))}
        </MapLibreGL.MapView>
      )}
      
      {/* card de informação que aparece quando um ecoponto é selecionado. */}
      {ecopontoSelecionado && (
        <View style={styles.card}>
<View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardNome}>{ecopontoSelecionado.nome}</Text>
              <Text style={styles.cardMorada}>{ecopontoSelecionado.morada}</Text>
            </View>
            <View style={[
              styles.estadoBadge,
              ecopontoSelecionado.estado === 'Cheio' && styles.estadoCheio,
              ecopontoSelecionado.estado === 'Danificado' && styles.estadoDanificado,
            ]}>
              <Text style={styles.estadoTexto}>{ecopontoSelecionado.estado}</Text>
            </View>
          </View>
          
          {/* botões de ação para o ecoponto selecionado. */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity
              style={[styles.botao, { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#1B4332' }]}
              onPress={() =>
                router.push({
                  pathname: '/review-bin',
                  params: {
                    ecopontoId: ecopontoSelecionado.id,
                    ecopontoNome: ecopontoSelecionado.nome,
                  },
                } as any)
              }
            >
              <Text style={[styles.botaoTexto, { color: '#1B4332' }]}>⭐ Avaliar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.botao, { flex: 1 }]}
              onPress={() =>
                router.push({
                  pathname: '/report-problem',
                  params: {
                    ecopontoNome: ecopontoSelecionado.nome,
                    ecopontoMorada: ecopontoSelecionado.morada,
                  },
                } as any)
              }
            >
              <Text style={styles.botaoTexto}>Reportar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  // o mapa deve ocupar todo o espaço disponível.
  mapa: { flex: 1 },
  expoGoFallback: {
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dcfce7',
  },
  expoGoTitle: { color: '#1B4332', fontWeight: '700', fontSize: 16, textAlign: 'center' },
  expoGoSubtitle: {
    color: '#1B4332',
    textAlign: 'center',
    paddingHorizontal: 30,
    marginTop: 8,
    opacity: 0.8,
  },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.8)', zIndex: 1 },
  loadingTexto: { marginTop: 12, fontSize: 14, color: '#666' },

  // estilo base para os marcadores (pins) no mapa.
  marcador: {
    width: 44,
    height: 44, 
    borderRadius: 22, // metade da largura/altura para criar um círculo.
    backgroundColor: '#279840',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    // sombra para dar profundidade e destacar o marcador do mapa.
    elevation: 4, // sombra para android.
    shadowColor: '#000', // sombra para ios.
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  // estilos condicionais para o marcador, baseados no estado do ecoponto.
  marcadorCheio: { backgroundColor: '#D97706' },
  marcadorDanificado: { backgroundColor: '#DC2626' },
  marcadorSelecionado: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: '#1B4332',
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  // estilos para o ícone de reciclagem dentro do marcador.
  marcadorTextoSelecionado: { fontSize: 28 },
  marcadorTexto: { fontSize: 22 },
  // estilo para o card de informações que flutua sobre o mapa.
  card: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  cardNome: { fontSize: 15, fontWeight: '700', color: '#1a1a1a', maxWidth: '70%' },
  cardMorada: { fontSize: 13, color: '#666', marginTop: 2 },
  estadoBadge: { backgroundColor: '#D1FAE5', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  estadoCheio: { backgroundColor: '#FEF3C7' },
  estadoDanificado: { backgroundColor: '#FEE2E2' },
  estadoTexto: { fontSize: 12, fontWeight: '600', color: '#1B4332' },
  botao: { backgroundColor: '#1B4332', borderRadius: 10, padding: 12 },
  botaoTexto: { color: '#fff', textAlign: 'center', fontWeight: '700', fontSize: 14 },
});
