export type Role = "ADMIN_ROLE" | "USER_ROLE";

export interface User {
  uid: string;
  nombre: string;
  email: string;
  role: Role;
  curp?: string;
  telefono?: string;
  estado: boolean; // Indica si el usuario está activo (true) o inactivo (false)
}

export interface AuthResponse {
  ok: boolean;
  usuario: User;
  token: string;
}

export interface Documento {
  _id: string;
  nombre: string;
  archivo: string;
  rutaPublica?: string;
  ext: "pdf" | "xml" | "zip";
  mime: string;
  size: number;
  /**
   * El usuario propietario del documento. Puede ser un ID de usuario (string) o el objeto de usuario completo.
   */
  usuario: string | User;
  createdAt: string;
}

export interface Paginated<T> {
  ok: boolean;
  items: T[];
  total: number;
  page: number;
  pages: number;
}
