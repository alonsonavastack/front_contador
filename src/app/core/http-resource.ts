import { HttpClient, HttpParams } from '@angular/common/http';
import { signal, Signal, computed, effect } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Observable, of, catchError, map, startWith } from 'rxjs';

/**
 * Estado de una petición HTTP
 */
export interface ResourceState<T> {
  data: T | null;
  loading: boolean;
  error: any;
}

/**
 * Crea un cliente de recursos HTTP para una URL base.
 * Simplifica las llamadas GET, especialmente para listados paginados.
 * @param http El cliente HttpClient de Angular.
 * @param baseUrl La URL base del recurso (ej: /api/usuarios).
 * @returns Un objeto con métodos simplificados que retornan signals.
 */
export function httpResource(http: HttpClient, baseUrl: string) {
  return {
    /**
     * Realiza una petición GET y retorna un signal con el estado de la petición.
     * @param path - Una ruta adicional para añadir a la URL base (ej: 'mios').
     * @param params - Un objeto con los parámetros a enviar. Los valores nulos o vacíos se ignoran.
     */
    get: <T>(path: string | null = null, params: Record<string, any> = {}) => {
      let httpParams = new HttpParams();
      for (const key in params) {
        if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
          httpParams = httpParams.set(key, params[key]);
        }
      }
      const url = path ? `${baseUrl}/${path}` : baseUrl;
      return http.get<T>(url, { params: httpParams });
    },

    /**
     * Realiza una petición GET y retorna un signal reactivo con el estado (data, loading, error).
     * Ideal para uso directo en componentes con control flow.
     */
    getAsSignal: <T>(path: string | null = null, params: Record<string, any> = {}) => {
      let httpParams = new HttpParams();
      for (const key in params) {
        if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
          httpParams = httpParams.set(key, params[key]);
        }
      }
      const url = path ? `${baseUrl}/${path}` : baseUrl;
      
      const request$ = http.get<T>(url, { params: httpParams }).pipe(
        map(data => ({ data, loading: false, error: null })),
        startWith({ data: null, loading: true, error: null }),
        catchError(error => of({ data: null, loading: false, error }))
      );

      return toSignal(request$, { 
        initialValue: { data: null, loading: true, error: null } 
      });
    },

    /**
     * Crea un signal reactivo que se recarga cuando cambian los parámetros.
     * Perfecto para búsquedas y filtros reactivos.
     */
    createReactiveQuery: <T>(
      pathSignal: Signal<string | null>,
      paramsSignal: Signal<Record<string, any>>
    ) => {
      const state = signal<ResourceState<T>>({ 
        data: null, 
        loading: true, 
        error: null 
      });

      effect(() => {
        const path = pathSignal();
        const params = paramsSignal();
        
        state.set({ data: null, loading: true, error: null });

        let httpParams = new HttpParams();
        for (const key in params) {
          if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
            httpParams = httpParams.set(key, params[key]);
          }
        }
        
        const url = path ? `${baseUrl}/${path}` : baseUrl;
        
        http.get<T>(url, { params: httpParams }).subscribe({
          next: (data) => state.set({ data, loading: false, error: null }),
          error: (error) => state.set({ data: null, loading: false, error })
        });
      });

      return state.asReadonly();
    },

    /**
     * Realiza una petición DELETE a un recurso por su ID.
     */
    delete: <T>(id: string) => {
      return http.delete<T>(`${baseUrl}/${id}`);
    },

    /**
     * Realiza una petición POST a la URL base.
     */
    post: <T>(body: any, path: string | null = null) => {
      const url = path ? `${baseUrl}/${path}` : baseUrl;
      return http.post<T>(url, body);
    },

    /**
     * Realiza una petición PUT a un recurso por su ID.
     */
    put: <T>(id: string, body: any) => {
      return http.put<T>(`${baseUrl}/${id}`, body);
    },
  };
}

/**
 * Hook para crear un estado de recurso manualmente controlado.
 * Útil cuando necesitas control total sobre cuándo hacer las peticiones.
 */
export function createResourceState<T>() {
  const state = signal<ResourceState<T>>({
    data: null,
    loading: false,
    error: null
  });

  const load = async (request: Observable<T>) => {
    state.set({ data: null, loading: true, error: null });
    
    request.subscribe({
      next: (data) => state.set({ data, loading: false, error: null }),
      error: (error) => state.set({ data: null, loading: false, error })
    });
  };

  return {
    state: state.asReadonly(),
    load,
    setData: (data: T) => state.update(s => ({ ...s, data })),
    setLoading: (loading: boolean) => state.update(s => ({ ...s, loading })),
    setError: (error: any) => state.update(s => ({ ...s, error })),
    reset: () => state.set({ data: null, loading: false, error: null })
  };
}
