export function agruparPorElenco<T>(
  elementos: T[], obtenerElenco: (elemento: T) => string | null | undefined, orden: string[]
): { elenco: string; elementos: T[] }[] {
  const grupos = new Map<string, T[]>();
  for (const elemento of elementos) {
    const elenco = obtenerElenco(elemento) || 'SIN ELENCO';
    const grupo = grupos.get(elenco) ?? [];
    grupo.push(elemento);
    grupos.set(elenco, grupo);
  }
  return [...grupos].map(([elenco, grupo]) => ({ elenco, elementos: grupo })).sort((a, b) => {
    const indiceA = orden.indexOf(a.elenco);
    const indiceB = orden.indexOf(b.elenco);
    return (indiceA < 0 ? orden.length : indiceA) - (indiceB < 0 ? orden.length : indiceB) ||
      a.elenco.localeCompare(b.elenco, 'es');
  });
}
