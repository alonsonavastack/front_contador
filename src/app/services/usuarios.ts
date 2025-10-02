import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import type { User } from '../shared/types';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class UsuariosApi {
  private base = `${environment.api}/usuarios`;

  constructor(private http: HttpClient) {}

  /**
   * Lista usuarios
   * GET /usuarios
   * El backend retorna: { ok: true, usuarios: [...] }
   */
  list(params: { q?: string; page?: number; limit?: number; role?: string } = {}) {
    return this.http.get<{ ok: boolean; usuarios: User[] }>(this.base, {
      params: {
        ...(params.q && { q: params.q }),
        ...(params.page && { page: params.page.toString() }),
        ...(params.limit && { limit: params.limit.toString() }),
        ...(params.role && { role: params.role })
      }
    }).pipe(
      // Transformar al formato que esperan los componentes
      map(res => ({
        ok: res.ok,
        items: res.usuarios,
        total: res.usuarios.length,
        page: params.page || 1,
        pages: 1
      }))
    );
  }

  /**
   * Obtiene un usuario por ID
   */
  getById(id: string) {
    return this.http.get<{ ok: boolean; usuario: User }>(`${this.base}/${id}`);
  }

  /**
   * Crea un nuevo usuario
   * POST /usuarios
   */
  create(data: Partial<User> & { password: string }) {
    return this.http.post<{ ok: boolean; usuario: User; token?: string }>(
      this.base,
      data
    );
  }

  /**
   * Actualiza un usuario
   * PUT /usuarios/:id
   */
  update(id: string, data: Partial<User>) {
    return this.http.put<{ ok: boolean; usuario: User }>(
      `${this.base}/${id}`,
      data
    );
  }

  /**
   * Elimina un usuario (eliminación lógica)
   * DELETE /usuarios/:id
   */
  delete(id: string) {
    return this.http.delete<{ ok: boolean; msg: string; usuario: User }>(
      `${this.base}/${id}`
    );
  }

  /**
   * Activa o desactiva un usuario.
   * PATCH /usuarios/:id/toggle-status
   */
  toggleStatus(id: string) {
    return this.http.patch<{ ok: boolean; msg: string; usuario: User }>(
      `${this.base}/${id}/toggle-status`, {}
    );
  }
}
