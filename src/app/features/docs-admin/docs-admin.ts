import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { Documento, User } from '../../shared/types';
import { DocumentosApi } from '../../services/documentos';
import { createResourceState } from '../../core/http-resource';

@Component({
  standalone: true,
  selector: 'app-docs-admin',
  imports: [CommonModule],
  templateUrl: './docs-admin.html',
})
export class DocsAdminPage {
  // Parámetros de búsqueda
  q = signal('');
  page = signal(1);
  pageSize = signal(10);
  selectedMonth = signal('');

  // Estado del recurso
  private docsResource = createResourceState<{ ok: boolean; documentos: Documento[] }>();

  state = this.docsResource.state;

  // Lógica de filtrado y paginación combinada
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
        this.normalizeString(doc.nombre).includes(normalizedQuery) ||
        this.normalizeString(this.getUserName(doc)).includes(normalizedQuery) ||
        this.normalizeString(this.getUserEmail(doc)).includes(normalizedQuery)
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

  // Estado para eliminar
  deleting = signal<string | null>(null);

  constructor(private api: DocumentosApi) {
    this.load();
  }

  load() {
    this.docsResource.load(this.api.all());
  }

  onMonthChange(value: string) {
    this.selectedMonth.set(value);
    this.page.set(1); // Resetear a la página 1 al cambiar el filtro
  }

  onSearchChange(value: string) {
    this.q.set(value);
    this.page.set(1); // Resetear a la página 1 al buscar
  }

  onPageSizeChange(size: string) {
    this.pageSize.set(Number(size));
    this.page.set(1);
  }

  getUserName(doc: Documento): string {
    if (typeof doc.usuario === 'object' && doc.usuario !== null) {
      return (doc.usuario as User).nombre || 'Desconocido';
    }
    return doc.usuario || 'Desconocido';
  }

  getUserEmail(doc: Documento): string {
    if (typeof doc.usuario === 'object' && doc.usuario !== null) {
      return (doc.usuario as User).email || 'N/A';
    }
    return 'N/A';
  }

  async deleteDoc(doc: Documento) {
    if (!confirm(`¿Eliminar "${doc.nombre}"?`)) return;

    this.deleting.set(doc._id);

    this.api.delete(doc._id).subscribe({
      next: () => {
        this.deleting.set(null);
        this.load(); // Recargar la lista
      },
      error: (e) => {
        this.deleting.set(null);
        alert(e?.error?.msg || 'Error al eliminar');
      }
    });
  }

  // Construir URL completa para visualizar documentos
  getDocUrl(doc: Documento): string {
    return doc.rutaPublica
      ? `http://localhost:3000${doc.rutaPublica}`
      : '#';
  }

  nextPage() {
    this.page.update(p => p + 1);
  }

  prevPage() {
    this.page.update(p => p - 1);
  }

  /**
   * Helper para normalizar strings: quita acentos y convierte a minúsculas.
   */
  private normalizeString(str: string): string {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  // Este método es para el botón de limpiar filtros en el HTML
  clearFilters() {
    this.q.set('');
    this.selectedMonth.set('');
    this.page.set(1);
  }
}
