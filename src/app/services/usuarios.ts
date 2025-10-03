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

  list() {
    return this.http.get<{ ok: boolean; usuarios: User[] }>(this.base, {}).pipe(
      // Transformar al formato que esperan los componentes
      map(res => ({
        ok: res.ok, // Mantener el 'ok'
        items: res.usuarios ?? [] // Devolver solo los 'items'
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
   * Cambia la contraseña de un usuario
   * PUT /usuarios/change-password/:id
   */
  changePassword(id: string, oldPassword: string, newPassword: string) {
    return this.http.put<{ ok: boolean; msg: string }>(
      `${this.base}/change-password/${id}`,
      { oldPassword, newPassword }
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
