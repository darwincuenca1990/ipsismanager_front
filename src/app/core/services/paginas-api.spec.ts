import { of } from 'rxjs';
import { obtenerTodasLasPaginas } from './paginas-api';

describe('obtenerTodasLasPaginas', () => {
  it('combina todas las páginas', () => {
    const cargar = jasmine.createSpy().and.callFake((enlace?: string) => of(enlace
      ? { count: 2, next: null, previous: '?page=1', results: [2] }
      : { count: 2, next: '?page=2', previous: null, results: [1] }));
    obtenerTodasLasPaginas<number>(cargar).subscribe(resultado => expect(resultado).toEqual([1, 2]));
    expect(cargar).toHaveBeenCalledWith('?page=2');
  });

  it('rechaza una paginación cíclica', () => {
    const cargar = () => of({ count: 2, next: '?page=2', previous: null, results: [1] });
    obtenerTodasLasPaginas<number>(cargar).subscribe({
      next: () => fail('La paginación cíclica no debe devolver resultados.'),
      error: error => expect(error.message).toContain('paginación')
    });
  });
});
