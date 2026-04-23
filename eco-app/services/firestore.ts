import {
  collection,
  getDocs,
  addDoc,
  doc,
  setDoc,
  onSnapshot,
  serverTimestamp,
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
