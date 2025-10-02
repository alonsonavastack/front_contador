import { Component, signal, computed, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { User, Role } from '../../shared/types';
import { UsuariosApi } from '../../services/usuarios';
import { UploadsApi, type FileUploadProgress } from '../../services/uploads';
import { createResourceState } from '../../core/http-resource';
import { EditUserModalComponent } from '../../shared/edit-user-modal.component';
import { forkJoin } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-usuarios',
  imports: [CommonModule, EditUserModalComponent, ],
  templateUrl: './usuarios.html',
})
export class UsuariosPage {
  // Referencia al modal
  editModal = viewChild<EditUserModalComponent>('editModal');

  // Parámetros de búsqueda
  q = signal('');
  page = signal(1);
  role = signal<string>('');

  // Estado del listado de usuarios
  private usersResource = createResourceState<{ ok: boolean; items: User[]; total: number; pages: number }>();

  usersState = this.usersResource.state;
  usuarios = computed(() => this.usersState().data?.items ?? []);
  loading = computed(() => this.usersState().loading);
  error = computed(() => this.usersState().error);
  totalPages = computed(() => this.usersState().data?.pages ?? 1);

  // Estado de subida de archivos
  selected = signal<User | null>(null);
  files = signal<File[]>([]);

  // Progreso de cada archivo
  fileProgress = signal<Map<string, FileUploadProgress>>(new Map());

  uploading = signal(false);
  resultMsg = signal('');

  constructor(
    private usersApi: UsuariosApi,
    private uploadApi: UploadsApi
  ) {
    this.load();
  }

  load() {
    this.usersResource.load(
      this.usersApi.list({
        q: this.q(),
        page: this.page(),
        role: this.role()
      })
    );
  }

  onSearch() {
    this.page.set(1); // Reset a la primera página al buscar
    this.load();
  }

  onPick(u: User) {
    this.selected.set(u);
    this.files.set([]);
    this.fileProgress.set(new Map());
    this.resultMsg.set('');
  }

  // Abrir modal de edición
  openEditModal(user: User) {
    this.editModal()?.open(user);
  }

  // Abrir modal de creación
  openCreateModal() {
    this.editModal()?.open(null);
  }

  // Manejar actualización de usuario
  onUserUpdate(event: { user: User; role: string; estado: boolean }) {
    const { user, role, estado } = event;

    // Creamos el payload para la actualización.
    // Usamos el usuario original y sobreescribimos las propiedades que cambiaron.
    const updatedUserPayload = { ...user, role: role as Role, estado };

    // Enviamos el payload completo al método de actualización.
    this.usersApi.update(user.uid, updatedUserPayload).subscribe({
      next: () => {
        this.editModal()?.handleSuccess('Usuario actualizado correctamente.');
        // Recargar la lista
        this.load();
      },
      error: (e) => {
        this.editModal()?.handleError(
          e?.error?.msg || 'Error al actualizar el usuario.'
        );
      },
    });
  }

  // Manejar creación de usuario
  onUserCreate(event: { user: Partial<User> & { password?: string }; role: string }) {
    const { user, role } = event;

    if (!user.password) {
      this.editModal()?.handleError('La contraseña es obligatoria para crear un usuario.');
      return;
    }

    this.usersApi.create({ ...user, role: role as any, password: user.password })
      .subscribe({
        next: () => {
          this.editModal()?.handleSuccess('Usuario creado correctamente.');
          this.load(); // Recargar la lista
        },
        error: (e) => {
          this.editModal()?.handleError(e?.error?.msg || 'Error al crear el usuario.');
        }
      });
  }

  onFileChange(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const list = input.files ? Array.from(input.files) : [];

    // Validar tamaño de archivos (50 MB = 50 * 1024 * 1024 bytes)
    const MAX_SIZE = 50 * 1024 * 1024;
    const invalidFiles = list.filter(f => f.size > MAX_SIZE);

    if (invalidFiles.length > 0) {
      const names = invalidFiles.map(f => f.name).join(', ');
      this.resultMsg.set(`⚠️ Archivos demasiado grandes (>50MB): ${names}`);

      // Filtrar solo los archivos válidos
      const validFiles = list.filter(f => f.size <= MAX_SIZE);
      this.files.set(validFiles);
    } else {
      this.files.set(list);
      this.resultMsg.set('');
    }

    this.fileProgress.set(new Map());
  }

  upload() {
    const user = this.selected();
    const files = this.files();

    if (!user || files.length === 0) return;

    this.uploading.set(true);
    this.resultMsg.set('');

    // Inicializar el progreso de cada archivo
    const progressMap = new Map<string, FileUploadProgress>();
    files.forEach(file => {
      progressMap.set(file.name, {
        file,
        progress: 0,
        status: 'waiting'
      });
    });
    this.fileProgress.set(progressMap);

    // Subir cada archivo individualmente para rastrear el progreso
    const uploads$ = files.map(file =>
      this.uploadApi.uploadSingleFile(user.uid, file)
    );

    // Suscribirse a cada upload para actualizar el progreso
    uploads$.forEach((upload$, index) => {
      upload$.subscribe({
        next: (progress) => {
          // Actualizar el progreso de este archivo específico
          const current = new Map(this.fileProgress());
          current.set(progress.file.name, progress);
          this.fileProgress.set(current);
        },
        error: (e) => {
          // Marcar este archivo como error
          const current = new Map(this.fileProgress());
          const fileName = files[index].name;
          current.set(fileName, {
            file: files[index],
            progress: 0,
            status: 'error',
            error: e?.error?.msg || 'Error al subir'
          });
          this.fileProgress.set(current);
        }
      });
    });

    // Esperar a que todos terminen
    forkJoin(uploads$.map(upload$ =>
      upload$.pipe()
    )).subscribe({
      next: () => {
        this.uploading.set(false);

        // Verificar si todos se subieron correctamente
        const progress = Array.from(this.fileProgress().values());
        const completed = progress.filter(p => p.status === 'completed').length;
        const errors = progress.filter(p => p.status === 'error').length;

        if (errors === 0) {
          this.resultMsg.set(`✓ ${completed} archivo(s) subido(s) correctamente`);

          // Limpiar después de 3 segundos
          setTimeout(() => {
            this.files.set([]);
            this.fileProgress.set(new Map());
            this.resultMsg.set('');

            // Limpiar el input
            const input = document.querySelector('input[type="file"]') as HTMLInputElement;
            if (input) input.value = '';
          }, 3000);
        } else {
          this.resultMsg.set(`⚠️ ${completed} subido(s), ${errors} con error(es)`);
        }
      },
      error: (e) => {
        this.uploading.set(false);
        this.resultMsg.set(`✗ ${e?.error?.msg || 'Error al subir archivos'}`);
      }
    });
  }

  removeFile(file: File) {
    this.files.update(files => files.filter(f => f !== file));

    // Remover del progreso también
    const current = new Map(this.fileProgress());
    current.delete(file.name);
    this.fileProgress.set(current);
  }

  // Obtener el progreso de un archivo específico
  getFileProgress(fileName: string): FileUploadProgress | undefined {
    return this.fileProgress().get(fileName);
  }

  // Obtener array de progreso para el template
  getProgressArray() {
    return Array.from(this.fileProgress().values());
  }
}
