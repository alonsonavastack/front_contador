import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { Documento, User } from '../../shared/types';
import { DocumentosApi } from '../../services/documentos';
import { createResourceState } from '../../core/http-resource';
import { AuthService } from '../../core/auth';

@Component({
  standalone: true,
  selector: 'app-mis-docs',
  imports: [CommonModule],
  templateUrl: './mis-docs.html',
})
export class MisDocsPage {
  // Parámetros de búsqueda y paginación
  q = signal('');
  page = signal(1);
  pageSize = signal(10);
  selectedMonth = signal('');

  // Servicios
  private api = inject(DocumentosApi);
  private auth = inject(AuthService);

  // Estado del recurso
  private docsResource = createResourceState<{ ok: boolean; documentos: Documento[] }>();
  state = this.docsResource.state;

  // Lógica de filtrado y paginación en el cliente
  private paginatedData = computed(() => {
    const originalDocs = this.state().data?.documentos ?? [];
    const query = this.q().trim();
    const month = this.selectedMonth();
    const page = this.page();
    const pageSize = this.pageSize();

    // 1. Filtrar
    let filteredDocs = originalDocs;
    if (month) {
      filteredDocs = filteredDocs.filter(doc => doc.createdAt.startsWith(month));
    }

    if (query) {
      const normalizedQuery = this.normalizeString(query);
      filteredDocs = filteredDocs.filter(doc =>
        this.normalizeString(doc.nombre).includes(normalizedQuery)
      );
    }

    // 2. Paginar
    const totalItems = filteredDocs.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const pageIndex = page - 1;
    const start = pageIndex * pageSize;
    const end = start + pageSize;
    const items = filteredDocs.slice(start, end);

    return { items, totalItems, totalPages };
  });

  // Signals expuestos a la plantilla
  items = computed(() => this.paginatedData().items);
  pages = computed(() => this.paginatedData().totalPages);
  total = computed(() => this.paginatedData().totalItems);
  loading = computed(() => this.state().loading);
  error = computed(() => this.state().error);

  constructor() {
    this.load();
  }

  load() {
    const userId = this.auth.user()?.uid;
    if (!userId) {
      this.docsResource.setError('Usuario no autenticado');
      return;
    }
    this.docsResource.load(this.api.mis(userId));
  }

  // --- Manejadores de eventos ---

  onMonthChange(value: string) {
    this.selectedMonth.set(value);
    this.page.set(1);
  }

  onSearchChange(value: string) {
    this.q.set(value);
    this.page.set(1);
  }

  onPageSizeChange(size: string) {
    this.pageSize.set(Number(size));
    this.page.set(1);
  }

  getDocUrl(doc: Documento): string {
    return doc.rutaPublica ? `http://localhost:3000${doc.rutaPublica}` : '#';
  }

  nextPage() { this.page.update(p => p + 1); }
  prevPage() { this.page.update(p => p - 1); }

  private normalizeString(str: string): string {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  clearFilters() {
    this.q.set('');
    this.selectedMonth.set('');
    this.page.set(1);
  }
}
