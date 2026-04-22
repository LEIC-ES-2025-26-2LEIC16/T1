import {
  collection,
  getDocs,
  addDoc,
  doc,
  setDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { Ecoponto, ECOPONTOS } from '@/constants/ecopontos';

// Vai buscar todos os ecopontos da BD
export async function getEcopontos(): Promise<Ecoponto[]> {
  const snapshot = await getDocs(collection(db, 'ecopontos'));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Ecoponto));
}

// Ouve mudanças em tempo real na coleção de ecopontos
export function ouvirEcopontos(callback: (ecopontos: Ecoponto[]) => void) {
  return onSnapshot(collection(db, 'ecopontos'), (snapshot) => {
    callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Ecoponto)));
  });
}

// Adiciona um novo ecoponto à BD
export async function addEcoponto(dados: Omit<Ecoponto, 'id'>) {
  await addDoc(collection(db, 'ecopontos'), dados);
}

// Guarda um reporte de problema na BD
export async function guardarReporte(dados: {
  ecopontoNome: string;
  ecopontoMorada: string;
  tipo: string;
  descricao: string;
}) {
  await addDoc(collection(db, 'reportes'), {
    ...dados,
    criadoEm: serverTimestamp(),
  });
}

// Popula o Firestore com os ecopontos se ainda não existirem
export async function seedEcopontos() {
  const snapshot = await getDocs(collection(db, 'ecopontos'));
  if (!snapshot.empty) return; // já existem dados, não fazer nada

  for (const ecoponto of ECOPONTOS) {
    const { id, ...dados } = ecoponto;
    await setDoc(doc(db, 'ecopontos', id), dados);
  }
}
