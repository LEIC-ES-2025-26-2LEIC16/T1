import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import MapLibreGL from '@maplibre/maplibre-react-native';
import { type Ecoponto } from '@/constants/ecopontos';
import { ouvirEcopontos } from '@/services/firestore';
import Constants, { ExecutionEnvironment } from 'expo-constants';

// checking if we are using expo go or the real dev client
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

if (!isExpoGo) {
  MapLibreGL.setAccessToken(null);
}

// openstreetmap style
const MAPA_ESTILO = {
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

const CENTRO_PORTO = [-8.6291, 41.1579];

export default function MapaScreen() {
  const router = useRouter();
  const [ecopontos, setEcopontos] = useState<Ecoponto[]>([]);
  const [ecopontoSelecionado, setEcopontoSelecionado] = useState<Ecoponto | null>(null);
  
  // new state to prevent crashing before map is loaded
  const [isMapReady, setIsMapReady] = useState(false);

  useEffect(() => {
    const unsubscribe = ouvirEcopontos(setEcopontos);
    return unsubscribe;
  }, []);

  return (
    <View style={styles.container}>
      {isExpoGo ? (
        <View style={[styles.mapa, { backgroundColor: '#f0fdf4', justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ fontSize: 40, marginBottom: 10 }}>📍</Text>
          <Text style={{ color: '#1B4332', fontWeight: '700', fontSize: 16 }}>Modo: Expo Go</Text>
          <Text style={{ textAlign: 'center', padding: 20 }}>O mapa real só carrega no Dev Client!</Text>
        </View>
      ) : (
        <MapLibreGL.MapView
          style={styles.mapa}
          mapStyle={MAPA_ESTILO}
          onDidFinishLoadingMap={() => setIsMapReady(true)} // sets map as ready
        >
          <MapLibreGL.Camera
            zoomLevel={13}
            centerCoordinate={CENTRO_PORTO}
            animationDuration={0}
          />

          {/* only renders markers when map is fully ready to avoid index errors */}
          {isMapReady && ecopontos.map((ecoponto) => (
            <MapLibreGL.PointAnnotation
              key={ecoponto.id}
              id={ecoponto.id}
              coordinate={[ecoponto.coordenadas.longitude, ecoponto.coordenadas.latitude]}
              onSelected={() => setEcopontoSelecionado(ecoponto)}
            >
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

      {/* info card for selected bins */}
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
              <Text style={[styles.botaoTexto, { color: '#1B4332' }]}>⭐ avaliar</Text>
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
              <Text style={styles.botaoTexto}>reportar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  mapa: { flex: 1 },
  marcador: {
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: '#279840',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2, 
    borderColor: '#fff',
    elevation: 4, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
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
  marcadorTextoSelecionado: { fontSize: 28 },
  marcadorTexto: { fontSize: 22 },
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
