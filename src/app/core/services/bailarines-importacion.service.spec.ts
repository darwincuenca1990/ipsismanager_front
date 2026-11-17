import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { constants } from '../../../assets/constants/constants';
import { BailarinesService, ResultadoImportacionBailarines } from './bailarines.service';

describe('Importación de bailarines', () => {
  it('envía el archivo xlsx en multipart y conserva el resultado', () => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    const servicio = TestBed.inject(BailarinesService);
    const http = TestBed.inject(HttpTestingController);
    const archivo = new File(['datos'], 'bailarines.xlsx');
    const resultado: ResultadoImportacionBailarines = { creados: [{ fila: 3, id: 101 }], errores: [] };
    let recibido: ResultadoImportacionBailarines | undefined;
    servicio.importarExcel(archivo).subscribe(respuesta => recibido = respuesta);
    const solicitud = http.expectOne(`${constants.SERVICES.INDICADOR_ALOJAMIENTO_WS.CONTEXT}/bailarines/importar-excel/`);
    expect(solicitud.request.method).toBe('POST');
    expect(solicitud.request.body instanceof FormData).toBeTrue();
    expect(solicitud.request.body.get('archivo')).toBe(archivo);
    expect(solicitud.request.headers.has('Content-Type')).toBeFalse();
    solicitud.flush(resultado);
    expect(recibido).toEqual(resultado);
    http.verify();
  });
});
