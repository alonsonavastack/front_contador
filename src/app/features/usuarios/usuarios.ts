import { Component, signal, computed } from "@angular/core";
import type { User } from "../../shared/types";
import { UsuariosApi } from "../../services/usuarios";
import { UploadsApi } from "../../services/uploads";
import { createResourceState } from "../../core/http-resource";

@Component({
  standalone: true,
  selector: "app-usuarios",
  templateUrl: "./usuarios.html",
})
export class UsuariosPage {
  // Parámetros de búsqueda
  page = signal(1);
  changingRole = signal<string | null>(null);
  togglingStatus = signal<string | null>(null);
  terminoBusqueda = signal("");
  // Estado del listado de usuarios
  private usersResource = createResourceState<{
    ok: boolean;
    items: User[];
    total: number;
    pages: number;
  }>();

  usersState = this.usersResource.state;
  usuarios = computed(() => {
    let filteredUsers = this.usersState().data?.items ?? [];
    const query = this.terminoBusqueda().trim();

    if (query) {
      const normalizedQuery = this.normalizeString(query);
      filteredUsers = filteredUsers.filter(
        (user) =>
          this.normalizeString(user.nombre).includes(normalizedQuery) ||
          this.normalizeString(user.email).includes(normalizedQuery)
      );
    }

    return filteredUsers;
  });
  loading = computed(() => this.usersState().loading);
  error = computed(() => this.usersState().error);
  totalPages = computed(() => this.usersState().data?.pages ?? 1);

  // Estado de subida de archivos
  selected = signal<User | null>(null);
  files = signal<File[]>([]);
  uploading = signal(false);
  resultMsg = signal("");

  constructor(private usersApi: UsuariosApi, private uploadApi: UploadsApi) {
    this.load();
  }

  load() {
    this.usersResource.load(
      this.usersApi.list({
        page: this.page(),
      })
    );
  }

  onSearch() {
    // La búsqueda ahora es en frontend, el computed `usuarios` se actualiza solo.
  }

  onPick(u: User) {
    this.selected.set(u);
    this.files.set([]);
    this.resultMsg.set("");
  }

  onFileChange(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const list = input.files ? Array.from(input.files) : [];
    this.files.set(list);
  }

  upload() {
    const user = this.selected();
    const files = this.files();
    if (!user || files.length === 0) return;

    this.uploading.set(true);
    this.resultMsg.set("");

    this.uploadApi.uploadForUser(user.uid, files).subscribe({
      next: (res) => {
        this.resultMsg.set(
          `✓ Subidos ${res.documentos.length} archivo(s) correctamente`
        );
        this.uploading.set(false);
        this.files.set([]);
        // Limpiar el input de archivo
        const input = document.querySelector(
          'input[type="file"]'
        ) as HTMLInputElement;
        if (input) input.value = "";
      },
      error: (e) => {
        this.resultMsg.set(`✗ ${e?.error?.msg || "Error al subir archivos"}`);
        this.uploading.set(false);
      },
    });
  }

  changeRole(user: User) {
    const newRole = user.role === "ADMIN_ROLE" ? "USER_ROLE" : "ADMIN_ROLE";
    const message = `¿Deseas cambiar el rol de "${user.nombre}" a ${newRole}?`;

    if (!confirm(message)) {
      return;
    }

    this.changingRole.set(user.uid);

    // Creamos el payload para la actualización.
    // El backend espera 'nombre', 'email' y 'role'.
    const updatedUser: Partial<User> = {
      nombre: user.nombre,
      email: user.email,
      role: newRole,
    };

    this.usersApi.update(user.uid, updatedUser).subscribe({
      next: () => {
        // Éxito: recargamos la lista para ver el cambio
        this.load();
        this.changingRole.set(null);
      },
      error: (err) => {
        console.error("Error al cambiar el rol:", err);
        alert(err?.error?.msg || "No se pudo cambiar el rol");
        this.changingRole.set(null);
      },
    });
  }

  toggleStatus(user: User, event: Event) {
    const action = user.estado ? "desactivar" : "activar";
    const message = `¿Estás seguro de que deseas ${action} a "${user.nombre}"?`;
    const input = event.target as HTMLInputElement;

    if (!confirm(message)) {
      input.checked = user.estado;

      return;
    }

    this.togglingStatus.set(user.uid);

    this.usersApi.toggleStatus(user.uid).subscribe({
      next: (res) => {
        // Actualizamos el usuario en el estado local para reflejar el cambio instantáneamente
        this.usersResource.setData({
          ...this.usersState().data!,
          items: this.usersState().data!.items.map((u) =>
            u.uid === user.uid ? res.usuario : u
          ),
        });
        this.togglingStatus.set(null);
      },
      error: (err) => {
        alert(err?.error?.msg || `No se pudo ${action} al usuario.`);
        input.checked = user.estado;

        this.togglingStatus.set(null);
      },
    });
  }

  removeFile(index: number) {
    this.files.update((files) => files.filter((_, i) => i !== index));
  }

  /**
   * Helper para normalizar strings: quita acentos y convierte a minúsculas.
   */
  private normalizeString(str: string): string {
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }
}
