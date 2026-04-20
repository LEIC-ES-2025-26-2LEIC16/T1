export type Ecoponto = {
  id: string;
  nome: string;
  morada: string;
  estado: 'Operacional' | 'Cheio' | 'Danificado';
  coordenadas: {
    latitude: number;
    longitude: number;
  };
};

export const ECOPONTOS: Ecoponto[] = [
  {
    id: '1',
    nome: 'Ecoponto Rua das Flores',
    morada: 'Rua das Flores, Porto',
    estado: 'Operacional',
    coordenadas: { latitude: 41.1448, longitude: -8.6122 },
  },
  {
    id: '2',
    nome: 'Ecoponto Praça do Município',
    morada: 'Praça do Município, Porto',
    estado: 'Cheio',
    coordenadas: { latitude: 41.1412, longitude: -8.6160 },
  },
  {
    id: '3',
    nome: 'Ecoponto Av. dos Aliados',
    morada: 'Avenida dos Aliados, Porto',
    estado: 'Operacional',
    coordenadas: { latitude: 41.1476, longitude: -8.6097 },
  },
];
