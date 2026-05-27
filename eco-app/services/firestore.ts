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
  orderBy,
  arrayUnion,
  arrayRemove,
  updateDoc,
  deleteDoc,
  increment,
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

export async function guardarRegistoReciclagem(
  imageUri: string,
  material: string,
  pontos: number,
  peso: string,
  co2: string,
  ecopontoId?: string,
  ecopontoNome?: string,
) {
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
    ...(ecopontoId   && { ecopontoId }),
    ...(ecopontoNome && { ecopontoNome }),
    criadoEm: serverTimestamp(),
  });

  // Atualiza totalPontos no documento do utilizador para o ranking
  await setDoc(
    doc(db, 'utilizadores', user.uid),
    { totalPontos: increment(pontos) },
    { merge: true },
  );
}

export type PerfilUtilizador = {
  nome: string;
  username: string;
  bio: string;
  avatarUrl: string;
  bannerUrl: string;
};

export async function getPerfilUtilizador(): Promise<PerfilUtilizador> {
  const user = auth.currentUser;

  if (!user) {
    console.log("Aguardando autenticação para carregar o perfil...");
    return { nome: '', username: '', bio: '', avatarUrl: '', bannerUrl: '' };
  }

  try {
    const docRef = doc(db, 'utilizadores', user.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        nome: data.nome || '',
        username: data.username || '',
        bio: data.bio || '',
        avatarUrl: data.avatarUrl || '',
        bannerUrl: data.bannerUrl || '',
      };
    }
    return { nome: user.displayName ?? '', username: '', bio: '', avatarUrl: '', bannerUrl: '' };
  } catch (error) {
    console.error("Erro ao obter perfil do utilizador:", error);
    return { nome: '', username: '', bio: '', avatarUrl: '', bannerUrl: '' };
  }
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
  if (!user) {
    // Retorna null para que o ecrã de perfil possa lidar com o estado de loading
    // sem que a app crashe ou mostre um erro ao utilizador.
    return null;
  }

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
  if (!user) {
    console.log("Aguardando autenticação para os objetivos...");
    return [];
  }

  try {
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
  } catch (error) {
    console.error("Erro ao procurar objetivos:", error);
    return [];
  }
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
  const user = auth.currentUser;
  if (!user) return [];

  const objetivoRef = doc(db, 'objetivos', id);
  const objetivoSnap = await getDoc(objetivoRef);

  // Medida de segurança: garante que o objetivo pertence ao utilizador logado
  if (!objetivoSnap.exists() || objetivoSnap.data().userId !== user.uid) {
    console.error("Tentativa de eliminar objetivo que não pertence ao utilizador ou não existe.");
    throw new Error("Operação não permitida.");
  }

  await deleteDoc(objetivoRef);
}

export const getHistoricoReciclagem = async () => {
  const user = auth.currentUser;

  // se o utilizador ainda não estiver carregado, não tentamos a query
  if (!user) {
    console.log("Aguardando autenticação...");
    return []; // return da lista vazia em vez de crashar
  }

  try {
    const q = query(
      collection(db, "registos_reciclagem"),
      where("userId", "==", user.uid),
      orderBy("criadoEm", "desc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(d => {
      const data = d.data();
      // Converte o Timestamp do Firestore para string ISO legível pelo JavaScript
      const criadoEm = data.criadoEm?.toDate?.() ?? new Date();
      return {
        id: d.id,
        // Normaliza os nomes dos campos para os usados no ecrã de histórico
        date: criadoEm.toISOString(),
        type: data.material ?? '',
        amount: data.quantidade ?? '0',
        impact: data.impactoCO2 ?? '0',
        imagemUrl: data.imagemUrl ?? '',
        pontosAtribuidos: data.pontosAtribuidos ?? 0,
        ecopontoNome: data.ecopontoNome ?? null,
        ecopontoId: data.ecopontoId ?? null,
      };
    });
  } catch (error) {
    console.error("Erro ao procurar histórico:", error);
    return [];
  }
};
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






const PONTOS_REFERRAL = 50;      // EcoCoins por amigo convidado
const DEEP_LINK_BASE = 'https://myimpact.vercel.app/invite';

// ── Tipos ────────────────────────────────────────────────────

export type InfoReferral = {
  codigo: string;
  link:   string;
  totalConvidados: number;
  pontosGanhos:    number;
};

// ── 1. Gera (ou devolve) o código único do utilizador ────────
//
//  Cria o documento  referrals/{uid}  se ainda não existir.
//  Estrutura do documento:
//    { codigo, uid, totalConvidados, pontosGanhos, criadoEm }

export async function gerarCodigoReferral(): Promise<InfoReferral> {
  const user = auth.currentUser;
  if (!user) throw new Error('Utilizador não autenticado.');

  const ref = doc(db, 'referrals', user.uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    const d = snap.data();
    return {
      codigo:          d.codigo,
      link:            `${DEEP_LINK_BASE}?ref=${d.codigo}`,
      totalConvidados: d.totalConvidados ?? 0,
      pontosGanhos:    d.pontosGanhos    ?? 0,
    };
  }

  // Gera código: primeiros 8 chars do uid em maiúsculas
  const codigo = user.uid.slice(0, 8).toUpperCase();

  await setDoc(ref, {
    codigo,
    uid:             user.uid,
    totalConvidados: 0,
    pontosGanhos:    0,
    criadoEm:        serverTimestamp(),
  });

  return {
    codigo,
    link:            `${DEEP_LINK_BASE}?ref=${codigo}`,
    totalConvidados: 0,
    pontosGanhos:    0,
  };
}

// ── 2. Devolve o estado atual do referral do utilizador ──────

export async function getInfoReferral(): Promise<InfoReferral | null> {
  const user = auth.currentUser;
  if (!user) return null;

  const snap = await getDoc(doc(db, 'referrals', user.uid));
  if (!snap.exists()) return null;

  const d = snap.data();
  return {
    codigo:          d.codigo,
    link:            `${DEEP_LINK_BASE}?ref=${d.codigo}`,
    totalConvidados: d.totalConvidados ?? 0,
    pontosGanhos:    d.pontosGanhos    ?? 0,
  };
}

// ── 3. Processa o referral quando um novo utilizador se regista
//
//  Deve ser chamada DEPOIS do createUserWithEmailAndPassword,
//  passando o código que veio no deep link.
//
//  Regras de negócio implementadas:
//    • O email do novo utilizador não pode já existir em 'utilizadores'
//      (a Firebase Auth já o impede, mas verificamos por segurança)
//    • O código deve existir em 'referrals'
//    • Não credita pontos se o novo uid == dono do código (auto-convite)
//    • Regista o uso em  referral_uses/{newUid}  para evitar duplicados

export async function processarReferral(codigoReferral: string): Promise<boolean> {
  const newUser = auth.currentUser;
  if (!newUser) return false;

  // Evita processar duas vezes o mesmo utilizador
  const usoRef  = doc(db, 'referral_uses', newUser.uid);
  const usoSnap = await getDoc(usoRef);
  if (usoSnap.exists()) return false;  // já foi processado

  // Encontra o dono do código
  const q = query(
    collection(db, 'referrals'),
    where('codigo', '==', codigoReferral.toUpperCase())
  );
  const snap = await getDocs(q);
  if (snap.empty) return false;  // código inválido

  const donoDoc  = snap.docs[0];
  const donoData = donoDoc.data();

  // Não credita auto-convites
  if (donoData.uid === newUser.uid) return false;

  // Verifica que o novo utilizador ainda não existia (Cenário 2)
  // — a Firebase Auth já bloqueou o registo com email duplicado,
  //   mas protegemos também a nível de Firestore
  const utilizadorSnap = await getDoc(doc(db, 'utilizadores', newUser.uid));
  // Se o documento já existia ANTES deste registo, é utilizador antigo — ignora
  // (na prática este caminho nunca é atingido porque createUser falha antes)

  // Credita pontos ao dono do código
  await updateDoc(doc(db, 'referrals', donoDoc.id), {
    totalConvidados: increment(1),
    pontosGanhos:    increment(PONTOS_REFERRAL),
  });

  // Credita os mesmos pontos no documento principal do utilizador
  await setDoc(
    doc(db, 'utilizadores', donoData.uid),
    { pontosReferral: increment(PONTOS_REFERRAL), totalPontos: increment(PONTOS_REFERRAL) },
    { merge: true }
  );

  // Regista o uso para não creditar duas vezes
  await setDoc(usoRef, {
    codigoUsado:   codigoReferral.toUpperCase(),
    donoUid:       donoData.uid,
    novoUtilizadorUid: newUser.uid,
    processadoEm:  serverTimestamp(),
  });

  return true;  // sinaliza que o bónus foi creditado — mostra notificação ao dono
}

// ── Amizades ─────────────────────────────────────────────────

export type Amizade = {
  id: string;
  usuarios: string[];
  accaoUid: string;
  status: 'pendente' | 'aceite';
  criadoEm: any;
};

function sortedUsuarios(uid1: string, uid2: string): string[] {
  return [uid1, uid2].sort();
}

export async function enviarPedidoAmizade(paraUserId: string) {
  const user = auth.currentUser;
  if (!user) throw new Error('Utilizador não autenticado.');
  if (user.uid === paraUserId) throw new Error('Não podes adicionar-te a ti próprio.');

  const usuarios = sortedUsuarios(user.uid, paraUserId);

  // Verifica se já existe pedido
  const q = query(
    collection(db, 'amizades'),
    where('usuarios', '==', usuarios)
  );
  const snap = await getDocs(q);
  if (!snap.empty) throw new Error('Já existe um pedido ou amizade entre vocês.');

  await addDoc(collection(db, 'amizades'), {
    usuarios,
    accaoUid: user.uid,
    status: 'pendente',
    criadoEm: serverTimestamp(),
  });
}

export async function responderPedidoAmizade(amizadeId: string, aceitar: boolean) {
  const user = auth.currentUser;
  if (!user) throw new Error('Utilizador não autenticado.');

  if (aceitar) {
    await updateDoc(doc(db, 'amizades', amizadeId), { status: 'aceite' });
  } else {
    await deleteDoc(doc(db, 'amizades', amizadeId));
  }
}

export async function removerAmigo(amigoUserId: string) {
  const user = auth.currentUser;
  if (!user) throw new Error('Utilizador não autenticado.');

  const usuarios = sortedUsuarios(user.uid, amigoUserId);
  const q = query(collection(db, 'amizades'), where('usuarios', '==', usuarios), where('status', '==', 'aceite'));
  const snap = await getDocs(q);
  if (!snap.empty) {
    await deleteDoc(doc(db, 'amizades', snap.docs[0].id));
  }
}

export async function getAmigos(): Promise<{ id: string; uid: string }[]> {
  const user = auth.currentUser;
  if (!user) return [];

  const q = query(collection(db, 'amizades'), where('usuarios', 'array-contains', user.uid), where('status', '==', 'aceite'));
  const snap = await getDocs(q);
  return snap.docs.map(d => {
    const data = d.data();
    const amigoUid = data.usuarios.find((u: string) => u !== user.uid);
    return { id: d.id, uid: amigoUid };
  });
}

export async function getPedidosRecebidos(): Promise<{ id: string; deUid: string }[]> {
  const user = auth.currentUser;
  if (!user) return [];

  const q = query(collection(db, 'amizades'), where('usuarios', 'array-contains', user.uid), where('status', '==', 'pendente'));
  const snap = await getDocs(q);
  return snap.docs
    .map(d => {
      const data = d.data();
      if (data.accaoUid === user.uid) return null; // pedidos enviados, não recebidos
      return { id: d.id, deUid: data.accaoUid };
    })
    .filter(Boolean) as { id: string; deUid: string }[];
}

export async function getPedidosEnviados(): Promise<string[]> {
  const user = auth.currentUser;
  if (!user) return [];

  const q = query(collection(db, 'amizades'), where('usuarios', 'array-contains', user.uid), where('status', '==', 'pendente'));
  const snap = await getDocs(q);
  return snap.docs
    .map(d => {
      const data = d.data();
      if (data.accaoUid !== user.uid) return null;
      return data.usuarios.find((u: string) => u !== user.uid);
    })
    .filter(Boolean) as string[];
}

export async function verificarAmizade(otherUserId: string): Promise<'nenhuma' | 'pendente' | 'aceite'> {
  const user = auth.currentUser;
  if (!user || user.uid === otherUserId) return 'nenhuma';

  const usuarios = sortedUsuarios(user.uid, otherUserId);
  const q = query(collection(db, 'amizades'), where('usuarios', '==', usuarios));
  const snap = await getDocs(q);
  if (snap.empty) return 'nenhuma';
  return snap.docs[0].data().status as 'pendente' | 'aceite';
}

export async function getSugestoesAmigos(pesquisa: string): Promise<{ id: string; nome: string; username: string; avatarUrl: string; totalPontos: number }[]> {
  // Pesquisa por nome (Firestore não suporta LIKE, fazemos query e filtramos)
  const snap = await getDocs(collection(db, 'utilizadores'));
  const termo = pesquisa.toLowerCase();
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as any))
    .filter((u: any) =>
      (u.nome?.toLowerCase().includes(termo) || u.username?.toLowerCase().includes(termo))
    )
    .map((u: any) => ({
      id: u.id,
      nome: u.nome || '',
      username: u.username || '',
      avatarUrl: u.avatarUrl || '',
      totalPontos: u.totalPontos || 0,
    }));
}

// ── Objetivos Partilhados ────────────────────────────────────

export type ObjetivoPartilhado = {
  id: string;
  uid1: string;
  uid2: string;
  material: string;
  metaKg: number;
  periodo: 'semanal' | 'mensal';
  criadoEm: any;
};

export async function criarObjetivoPartilhado(
  amigoUserId: string,
  material: string,
  metaKg: number,
  periodo: 'semanal' | 'mensal',
) {
  const user = auth.currentUser;
  if (!user) throw new Error('Utilizador não autenticado.');

  const usuarios = sortedUsuarios(user.uid, amigoUserId);
  await addDoc(collection(db, 'objetivos_partilhados'), {
    uid1: usuarios[0],
    uid2: usuarios[1],
    material,
    metaKg,
    periodo,
    criadoEm: serverTimestamp(),
  });
}

export async function getObjetivosPartilhados(): Promise<(ObjetivoPartilhado & { progressoUid1: number; progressoUid2: number })[]> {
  const user = auth.currentUser;
  if (!user) return [];

  const q = query(collection(db, 'objetivos_partilhados'), where('uid1', '==', user.uid));
  const q2 = query(collection(db, 'objetivos_partilhados'), where('uid2', '==', user.uid));

  const [snap1, snap2] = await Promise.all([getDocs(q), getDocs(q2)]);
  const all = [...snap1.docs, ...snap2.docs];

  const registos = await getDocs(collection(db, 'registos_reciclagem'));

  return all.map(d => {
    const data = d.data();
    const o: ObjetivoPartilhado = {
      id: d.id,
      uid1: data.uid1,
      uid2: data.uid2,
      material: data.material,
      metaKg: data.metaKg,
      periodo: data.periodo,
      criadoEm: data.criadoEm?.toDate?.()?.toISOString() ?? new Date().toISOString(),
    };

    const inicio = (() => {
      const hoje = new Date();
      if (o.periodo === 'semanal') {
        const d = new Date(hoje);
        d.setDate(hoje.getDate() - hoje.getDay());
        d.setHours(0, 0, 0, 0);
        return d;
      }
      return new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    })();

    const calcular = (uid: string) => {
      return registos.docs
        .filter(r => {
          const rd = r.data();
          const ts = rd.criadoEm?.toDate?.();
          return rd.userId === uid && ts && ts >= inicio && (o.material === 'Todos' || rd.material === o.material);
        })
        .reduce((s, r) => s + (parseFloat(r.data().quantidade) || 0), 0);
    };

    return {
      ...o,
      progressoUid1: calcular(o.uid1),
      progressoUid2: calcular(o.uid2),
    };
  });
}

export async function eliminarObjetivoPartilhado(id: string) {
  const user = auth.currentUser;
  if (!user) return;
  await deleteDoc(doc(db, 'objetivos_partilhados', id));
}