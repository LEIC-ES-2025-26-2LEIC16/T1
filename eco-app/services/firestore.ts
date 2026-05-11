import {
  collection,
  getDocs,
  addDoc,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  query,
  where,
  arrayUnion,
  arrayRemove,
  updateDoc,
} from 'firebase/firestore';
import { db, auth } from './firebase';

const CLOUDINARY_CLOUD_NAME = 'dly87uk53';
const CLOUDINARY_UPLOAD_PRESET = 'eco-app';
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

export async function guardarRegistoReciclagem(imageUri: string, material: string, pontos: number, peso: string,     // <-- Adicionado
  co2: string) {
  const user = auth.currentUser;
  
  //garante que a transação só ocorre se existir um login válido
  if (!user) {
    throw new Error("Utilizador não autenticado.");
  }
 
  // faz upload da imagem para o Cloudinary
  const formData = new FormData();
  formData.append('file', { uri: imageUri, type: 'image/jpeg', name: 'reciclagem.jpg' } as any);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', `reciclagens/${user.uid}`);

  const respostaCloudinary = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );
  const dadosCloudinary = await respostaCloudinary.json();
  const downloadUrl = dadosCloudinary.secure_url;

  if (!downloadUrl) throw new Error('Falha no upload da imagem.');

  //registar a entrada na Base de Dados com os pontos e o URL
  await addDoc(collection(db, 'registos_reciclagem'), {
    userId: user.uid,
    material: material,
    imagemUrl: downloadUrl,
    pontosAtribuidos: pontos,
    quantidade: peso,
    impactoCO2: co2,
    criadoEm: serverTimestamp(),
  });
}

export type PerfilUtilizador = {
  nome: string;
  username: string;
  bio: string;
};

export async function getPerfilUtilizador(): Promise<PerfilUtilizador> {
  const user = auth.currentUser;
  if (!user) throw new Error('Utilizador não autenticado.');
  const snap = await getDocs(query(collection(db, 'utilizadores'), where('uid', '==', user.uid)));
  if (snap.empty) return { nome: user.displayName ?? '', username: '', bio: '' };
  const data = snap.docs[0].data();
  return { nome: data.nome ?? '', username: data.username ?? '', bio: data.bio ?? '' };
}

export async function guardarPerfilUtilizador(perfil: PerfilUtilizador) {
  const user = auth.currentUser;
  if (!user) throw new Error('Utilizador não autenticado.');
  await setDoc(doc(db, 'utilizadores', user.uid), { uid: user.uid, ...perfil }, { merge: true });
}

export async function getFavoritos(): Promise<string[]> {
  const user = auth.currentUser;
  if (!user) return [];
  const snap = await getDoc(doc(db, 'utilizadores', user.uid));
  return (snap.data()?.favoritos as string[]) ?? [];
}

export async function toggleFavorito(ecopontoId: string, isFavorito: boolean): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Utilizador não autenticado.');
  const ref = doc(db, 'utilizadores', user.uid);
  await updateDoc(ref, {
    favoritos: isFavorito ? arrayRemove(ecopontoId) : arrayUnion(ecopontoId),
  }).catch(() =>
    setDoc(ref, { uid: user.uid, favoritos: [ecopontoId] }, { merge: true })
  );
}

export async function getEstatisticasUtilizador() {
  const user = auth.currentUser;
  if (!user) throw new Error('Utilizador não autenticado.');

  const q = query(
    collection(db, 'registos_reciclagem'),
    where('userId', '==', user.uid)
  );

  const snapshot = await getDocs(q);
  let totalKg = 0;
  let totalCO2 = 0;
  let totalPontos = 0;

  snapshot.docs.forEach(d => {
    const data = d.data();
    totalKg += parseFloat(data.quantidade) || 0;
    totalCO2 += parseFloat(data.impactoCO2) || 0;
    totalPontos += (data.pontosAtribuidos as number) || 0;
  });

  return {
    totalReciclagens: snapshot.size,
    totalKg: totalKg.toFixed(1),
    totalCO2: totalCO2.toFixed(1),
    totalPontos,
  };
}

export type Objetivo = {
  id: string;
  material: string;
  metaKg: number;
  periodo: 'semanal' | 'mensal';
  criadoEm: string;
};

export async function getObjetivos(): Promise<Objetivo[]> {
  const user = auth.currentUser;
  if (!user) throw new Error('Utilizador não autenticado.');
  const q = query(collection(db, 'objetivos'), where('userId', '==', user.uid));
  const snap = await getDocs(q);
  return snap.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      material: data.material,
      metaKg: data.metaKg,
      periodo: data.periodo,
      criadoEm: data.criadoEm?.toDate?.()?.toISOString() ?? new Date().toISOString(),
    };
  });
}

export async function criarObjetivo(material: string, metaKg: number, periodo: 'semanal' | 'mensal') {
  const user = auth.currentUser;
  if (!user) throw new Error('Utilizador não autenticado.');
  await addDoc(collection(db, 'objetivos'), {
    userId: user.uid,
    material,
    metaKg,
    periodo,
    criadoEm: serverTimestamp(),
  });
}

export async function eliminarObjetivo(id: string) {
  await import('firebase/firestore').then(({ deleteDoc, doc: firestoreDoc }) =>
    deleteDoc(firestoreDoc(db, 'objetivos', id))
  );
}

export async function getHistoricoReciclagem() {
  const user = auth.currentUser;
  if (!user) throw new Error('Utilizador não autenticado.');

  const q = query(
    collection(db, 'registos_reciclagem'),
    where('userId', '==', user.uid)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs
    .map(d => {
      const data = d.data();
      const date = data.criadoEm?.toDate?.()?.toISOString().split('T')[0] ?? new Date().toISOString().split('T')[0];
      return {
        id: d.id,
        type: data.material as string,
        amount: data.quantidade as string,
        impact: data.impactoCO2 as string,
        pontos: (data.pontosAtribuidos as number) || 0,
        date,
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

export async function guardarReview(ecopontoId: string, rating: number, comment: string) {
try {
  // Tenta ir buscar o ID do utilizador logado. Se não houver, fica 'anonimo'
  const userId = auth.currentUser?.uid || 'anonimo'; 

  await addDoc(collection(db, 'reviews'), {
    ecopontoId,
    rating,
    comment,
    userId,
    data: serverTimestamp() // Guarda a data e hora exatas do servidor
  });
} catch (error) {
  console.error("Erro ao guardar review:", error);
  throw error; // Lança o erro para o ecrã poder mostrar o modal de falha
}
}