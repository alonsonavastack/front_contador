import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import type { AuthResponse, User } from '../shared/types';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _user = signal<User | null>(this.restoreUser());
  private _token = signal<string | null>(this.restoreToken());

  // Signals públicos de solo lectura
  user = computed(() => this._user());
  token = computed(() => this._token());
  isLoggedIn = computed(() => {
    const token = this._token();
    const user = this._user();
    return !!token && !!user;
  });
  role = computed(() => this._user()?.role ?? 'USER_ROLE');
  isAdmin = computed(() => this.role() === 'ADMIN_ROLE');

  constructor(private http: HttpClient) {
    // Debug: verificar estado inicial
    console.log('AuthService inicializado:', {
      user: this._user(),
      token: this._token(),
      isLoggedIn: this.isLoggedIn()
    });
  }

  private restoreToken(): string | null {
    try {
      const token = localStorage.getItem('token');
      return token || null;
    } catch (e) {
      console.error('Error al restaurar token:', e);
      return null;
    }
  }

  private restoreUser(): User | null {
    try {
      const raw = localStorage.getItem('user');
      if (!raw || raw === 'undefined') {
        // Limpiar localStorage corrupto
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        return null;
      }
      return JSON.parse(raw) as User;
    } catch (e) {
      console.error('Error al restaurar usuario:', e);
      // Limpiar localStorage corrupto
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      return null;
    }
  }

  login(email: string, password: string) {
    return this.http.post<AuthResponse>(`${environment.api}/login/login`, {
      email,
      password
    });
  }

  register(nombre: string, email: string, password: string) {
    // Asumimos que el rol por defecto es 'USER_ROLE'
    return this.http.post<AuthResponse>(`${environment.api}/login/register`, {
      nombre,
      email,
      password,
    });
  }

  setSession(res: any) {
    console.log('Guardando sesión:', res);

    // Validar que la respuesta sea correcta
    // El backend puede retornar 'user' o 'usuario'
    const user = res.user || res.usuario;
    const token = res.token;

    if (!user || !token || token.trim() === '') {
      console.error('Respuesta de login inválida:', res);
      throw new Error('Respuesta de autenticación inválida');
    }

    // Actualizar signals
    this._user.set(user);
    this._token.set(token);

    // Guardar en localStorage
    try {
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
      console.log('Sesión guardada correctamente');
    } catch (e) {
      console.error('Error al guardar sesión:', e);
    }
  }

  logout() {
    console.log('Cerrando sesión');
    this._user.set(null);
    this._token.set(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  }

  // Método para refrescar el usuario (opcional)
  refreshUser() {
    return this.http.get<{ ok: boolean; user: User }>(`${environment.api}/api/auth/me`);
  }
}
