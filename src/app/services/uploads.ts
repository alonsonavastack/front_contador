import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import type { Documento } from '../shared/types';

@Injectable({ providedIn: 'root' })
export class UploadsApi {
  private base = `${environment.api}/upload`;

  constructor(private http: HttpClient) {}

  /**
   * Sube archivos para un usuario específico
   * POST /upload/:usuarioId
   * @param usuarioId ID del usuario
   * @param files Array de archivos
   */
  uploadForUser(usuarioId: string, files: File[]) {
    const formData = new FormData();
    
    // Agregar todos los archivos con el mismo nombre de campo
    for (const file of files) {
      formData.append('files', file, file.name);
    }

    return this.http.post<{ 
      ok: boolean; 
      msg: string;
      documentos: Documento[] 
    }>(`${this.base}/${usuarioId}`, formData);
  }

  /**
   * Obtiene/descarga un archivo por su nombre físico
   * GET /upload/ver/:fileName
   */
  verArchivo(fileName: string) {
    return `${this.base}/ver/${fileName}`;
  }
}
