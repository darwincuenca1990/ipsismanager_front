import { isPlatformBrowser } from '@angular/common';
import { AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input, OnChanges, OnDestroy, Output, PLATFORM_ID, ViewChild } from '@angular/core';
import type { ECharts, EChartsOption } from 'echarts';

@Component({
  selector: 'app-grafico-comparativa',
  standalone: true,
  template: '<div #grafico class="grafico" role="img" [attr.aria-label]="etiqueta"></div>',
  styles: ['.grafico { width: 100%; height: 340px; }']
})
export class GraficoComparativaComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input({ required: true }) opciones!: EChartsOption;
  @Input({ required: true }) etiqueta = '';
  @Output() errorGrafico = new EventEmitter<void>();
  @ViewChild('grafico', { static: true }) grafico!: ElementRef<HTMLDivElement>;
  private chart?: ECharts;
  private resizeObserver?: ResizeObserver;
  private destruido = false;
  private readonly resize = () => this.chart?.resize();

  constructor(@Inject(PLATFORM_ID) private readonly platformId: object) {}

  async ngAfterViewInit(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      const echarts = await import('echarts');
      if (this.destruido) return;
      this.chart = echarts.init(this.grafico.nativeElement);
      this.chart.setOption(this.opciones, true);
      if (typeof ResizeObserver !== 'undefined') {
        this.resizeObserver = new ResizeObserver(this.resize);
        this.resizeObserver.observe(this.grafico.nativeElement);
      } else {
        window.addEventListener('resize', this.resize);
      }
    } catch (error) {
      console.error('No se pudo mostrar el gráfico de comparativas.', error);
      this.errorGrafico.emit();
    }
  }

  ngOnChanges(): void {
    if (this.chart && this.opciones) this.chart.setOption(this.opciones, true);
  }

  ngOnDestroy(): void {
    this.destruido = true;
    this.resizeObserver?.disconnect();
    if (isPlatformBrowser(this.platformId)) window.removeEventListener('resize', this.resize);
    this.chart?.dispose();
  }
}
