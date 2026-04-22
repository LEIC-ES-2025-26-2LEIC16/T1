import {
  collection,
  getDocs,
  addDoc,
  doc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from './firebase';
import { Ecoponto, ECOPONTOS } from '@/constants/ecopontos';

// Vai buscar todos os ecopontos da BD
export async function getEcopontos(): Promise<Ecoponto[]> {
  const snapshot = await getDocs(collection(db, 'ecopontos'));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Ecoponto));
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

export async function guardarRegistoReciclagem(imageUri: string, material: string, pontos: number) {
  const user = auth.currentUser;
  
  //garante que a transação só ocorre se existir um login válido
  if (!user) {
    throw new Error("Utilizador não autenticado.");
  }
 
  //converte o URI local num Blob
  const blob = await new Promise<Blob>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = function () {
      resolve(xhr.response);
    };
    xhr.onerror = function (e) {
      console.error(e);
      reject(new TypeError("Falha ao criar o Blob da imagem"));
    };
    xhr.responseType = "blob";
    xhr.open("GET", imageUri, true);
    xhr.send(null);
  });

  //define o caminho no Storage (Ex: reciclagens/ID_DO_USER/170000000.jpg)
  const caminhoFicheiro = `reciclagens/${user.uid}/${Date.now()}.jpg`;
  const storageRef = ref(storage, caminhoFicheiro);

  //executa o Upload
  await uploadBytes(storageRef, blob);

  //recupera o URL público da imagem guardada
  const downloadUrl = await getDownloadURL(storageRef);

  //registar a entrada na Base de Dados com os pontos e o URL
  await addDoc(collection(db, 'registos_reciclagem'), {
    userId: user.uid,
    material: material,
    imagemUrl: downloadUrl,
    pontosAtribuidos: pontos,
    criadoEm: serverTimestamp(),
  });
}
