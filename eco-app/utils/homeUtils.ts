import { Objetivo } from '@/services/firestore';

export function getIniciais(nome: string): string {
  const partes = nome.trim().split(' ').filter(Boolean);
  if (partes.length >= 2) return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  return nome.slice(0, 2).toUpperCase();
}

export function calcularProgresso(objetivo: Objetivo, registos: any[]): number {
  const inicio = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const total = registos
    .filter(r => {
      const ts = r.criadoEm?.toDate?.() ?? (r.date ? new Date(r.date) : null);
      const material = r.material ?? r.type;
      return ts && ts >= inicio && (objetivo.material === 'Todos' || material === objetivo.material);
    })
    .reduce((s, r) => s + (parseFloat(r.quantidade ?? r.amount) || 0), 0);
  return Math.min(total / objetivo.metaKg, 1);
}