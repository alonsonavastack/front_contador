import { Injectable } from '@angular/core';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { environment } from '../../environments/environment';
import type { Documento } from '../shared/types';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface FileUploadProgress {
  file: File;
  progress: number;
  status: 'waiting' | 'uploading' | 'completed' | 'error';
  error?: string;
  documento?: Documento;
}

@Injectable({ providedIn: 'root' })
export class UploadsApi {
  private base = `${environment.api}/upload`;

  constructor(private http: HttpClient) {}

  /**
   * Sube un solo archivo con progreso
   * @param usuarioId ID del usuario
   * @param file Archivo a subir
   */
  uploadSingleFile(usuarioId: string, file: File): Observable<FileUploadProgress> {
    const formData = new FormData();
    formData.append('files', file, file.name);

    return this.http.post<{ 
      ok: boolean; 
      msg: string;
      documentos: Documento[] 
    }>(`${this.base}/${usuarioId}`, formData, {
      reportProgress: true,
      observe: 'events'
    }).pipe(
      map(event => {
        if (event.type === HttpEventType.UploadProgress) {
          // Progreso de carga
          const progress = event.total 
            ? Math.round((100 * event.loaded) / event.total) 
            : 0;
          
          return {
            file,
            progress,
            status: 'uploading' as const
          };
        } else if (event.type === HttpEventType.Response) {
          // Carga completada
          return {
            file,
            progress: 100,
            status: 'completed' as const,
            documento: event.body?.documentos?.[0]
          };
        }
        
        // Estado inicial
        return {
          file,
          progress: 0,
          status: 'uploading' as const
        };
      })
    );
  }

  /**
   * Sube archivos para un usuario específico (método antiguo, compatible)
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
