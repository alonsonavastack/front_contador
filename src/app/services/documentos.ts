import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import type { Documento } from '../shared/types';

@Injectable({ providedIn: 'root' })
export class DocumentosApi {
  private base = `${environment.api}/documentos`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene MIS documentos (del usuario logueado)
   * GET /documentos/mis-documentos/:userId
   */
  mis(userId: string) {
    return this.http.get<{ ok: boolean; documentos: Documento[] }>(
      `${this.base}/mis-documentos/${userId}`
    );
  }

  /**
   * Obtiene TODOS los documentos (admin)
   * GET /documentos
   */
  all() {
    return this.http.get<{ ok: boolean; documentos: Documento[] }>(this.base);
  }

  /**
   * Obtiene un documento por ID
   * GET /documentos/editar-documento/:id
   */
  getById(id: string) {
    return this.http.get<{ ok: boolean; documentos: Documento }>(
      `${this.base}/editar-documento/${id}`
    );
  }

  /**
   * Crea un nuevo documento
   * POST /documentos
   */
  create(data: Partial<Documento>) {
    return this.http.post<{ ok: boolean; documento: Documento }>(this.base, data);
  }

  /**
   * Actualiza un documento
   * PUT /documentos/:id
   */
  update(id: string, data: Partial<Documento>) {
    return this.http.put<{ ok: boolean; documento: Documento }>(
      `${this.base}/${id}`, 
      data
    );
  }

  /**
   * Edita un documento existente
   * PUT /documentos/editar-documento/:id
   */
  edit(id: string, data: Partial<Documento>) {
    return this.http.put<{ ok: boolean; documento: Documento }>(
      `${this.base}/editar-documento/${id}`, 
      data
    );
  }

  /**
   * Elimina un documento (eliminación lógica)
   * DELETE /documentos/:id
   */
  delete(id: string) {
    return this.http.delete<{ ok: boolean; msg: string; documento: Documento }>(
      `${this.base}/${id}`
    );
  }
}
