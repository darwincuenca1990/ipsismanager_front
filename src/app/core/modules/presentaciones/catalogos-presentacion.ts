import { forkJoin } from 'rxjs';
import { Bailarin, BailarinesService } from '../../services/bailarines.service';
import { Coreografia, CoreografiasService } from '../../services/coreografias.service';
import { obtenerTodasLasPaginas } from '../../services/paginas-api';

export function cargarCatalogosPresentacion(bailarines: BailarinesService, coreografias: CoreografiasService) {
  const cargarBailarines = (estado: 'ACTIVO' | 'INACTIVO') =>
    obtenerTodasLasPaginas<Bailarin>(enlace => bailarines.listar({ elenco: 'todos', estado }, enlace));
  return forkJoin({
    activos: cargarBailarines('ACTIVO'),
    inactivos: cargarBailarines('INACTIVO'),
    coreografias: obtenerTodasLasPaginas<Coreografia>(enlace => coreografias.listar(enlace))
  });
}

export function combinarBailarines(inactivos: Bailarin[], activos: Bailarin[]): Bailarin[] {
  return [...new Map([...inactivos, ...activos].map(bailarin => [bailarin.id, bailarin])).values()];
}
