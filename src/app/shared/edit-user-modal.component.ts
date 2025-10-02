import { Component, signal, output, computed } from '@angular/core';
import { FormsModule} from '@angular/forms';
import { User } from './types';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-edit-user-modal',
  imports: [FormsModule, CommonModule, FormsModule, ],
  template: `
    @if (isOpen()) {
      <!-- Backdrop -->
      <div
        class="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fadeIn"
        (click)="close()">
      </div>

      <!-- Modal -->
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          class="bg-gray-900 rounded-2xl border border-white/10 shadow-2xl max-w-md w-full animate-slideUp"
          (click)="$event.stopPropagation()">

          <!-- Header -->
          <div class="flex items-center justify-between p-6 border-b border-white/10">
            <h3 class="text-xl font-semibold text-white">
              {{ isEditMode() ? 'Editar Usuario' : 'Crear Usuario' }}
            </h3>
            <button
              (click)="close()"
              class="text-white/60 hover:text-white transition-colors">
              <span class="text-2xl">×</span>
            </button>
          </div>

          <!-- Body -->
          <div class="p-6 space-y-4">
            <!-- Formulario -->
            <div class="space-y-4">
              @if (isEditMode()) {
                <!-- Info del usuario (solo en modo edición) -->
                <div class="p-4 rounded-lg bg-gray-800 border border-white/10">
                  <div class="text-sm text-white/60 mb-1">Usuario:</div>
                  <div class="font-semibold text-white">{{ user()?.nombre }}</div>
                  <div class="text-sm text-white/60">{{ user()?.email }}</div>
                </div>
              } @else {
                <!-- Campos de creación -->
                <div>
                  <label for="nombre" class="block text-sm font-medium text-white/80 mb-2">Nombre</label>
                  <input type="text" [(ngModel)]="newUser.nombre" name="nombre" required
                         class="w-full px-4 py-3 rounded-lg bg-gray-800 text-white border border-white/10
                                outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition-all">
                </div>
                <div>
                  <label class="block text-sm font-medium text-white/80 mb-2">Email</label>
                  <input type="email" [(ngModel)]="newUser.email" name="email" required
                         class="w-full px-4 py-3 rounded-lg bg-gray-800 text-white border border-white/10
                                outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition-all">
                </div>
                <div>
                  <label class="block text-sm font-medium text-white/80 mb-2">Contraseña</label>
                  <input type="password" [(ngModel)]="newUser.password" name="password" required
                         class="w-full px-4 py-3 rounded-lg bg-gray-800 text-white border border-white/10
                                outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition-all">
                </div>
              }
            </div>

            <!-- Rol -->
            <div>
              <label class="block text-sm font-medium text-white/80 mb-2">
                Rol
              </label>
              <select
                [(ngModel)]="selectedRole"
                class="w-full px-4 py-3 rounded-lg bg-gray-800 text-white border border-white/10
                       outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20
                       transition-all">
                <option value="USER_ROLE">Usuario</option>
                <option value="ADMIN_ROLE">Administrador</option>
              </select>
            </div>

            <!-- Estado -->
            <div>
              <label class="block text-sm font-medium text-white/80 mb-3">
                Estado
              </label>
              <div class="flex items-center gap-4">
                <button
                  type="button"
                  (click)="selectedEstado.set(true)"
                  [class.bg-green-500]="selectedEstado()"
                  [class.text-white]="selectedEstado()"
                  [class.bg-gray-800]="!selectedEstado()"
                  [class.text-white/60]="!selectedEstado()"
                  class="flex-1 px-4 py-3 rounded-lg border border-white/10 font-medium transition-all">
                  ✓ Activo
                </button>
                <button
                  type="button"
                  (click)="selectedEstado.set(false)"
                  [class.bg-red-500]="!selectedEstado()"
                  [class.text-white]="!selectedEstado()"
                  [class.bg-gray-800]="selectedEstado()"
                  [class.text-white/60]="selectedEstado()"
                  class="flex-1 px-4 py-3 rounded-lg border border-white/10 font-medium transition-all">
                  × Inactivo
                </button>
              </div>
            </div>

            <!-- Resumen de cambios -->
            @if (hasChanges()) {
              <div class="p-3 rounded-lg bg-yellow-400/10 border border-yellow-400/30">
                <div class="text-xs font-semibold text-yellow-400 mb-1">Cambios pendientes:</div>
                <ul class="text-xs text-yellow-300 space-y-1">
                  @if (roleChanged()) {
                    <li>• Rol: {{ originalRole() }} → {{ selectedRole() }}</li>
                  }
                  @if (estadoChanged()) {
                    <li>• Estado: {{ originalEstado() ? 'Activo' : 'Inactivo' }} → {{ selectedEstado() ? 'Activo' : 'Inactivo' }}</li>
                  }
                </ul>
              </div>
            }

            <!-- Mensaje de error -->
            @if (error()) {
              <div class="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
                {{ error() }}
              </div>
            }
          </div>

          <!-- Footer -->
          <div class="flex gap-3 p-6 border-t border-white/10">
            <button
              (click)="close()"
              [disabled]="saving()"
              class="flex-1 px-4 py-3 rounded-lg bg-gray-800 text-white font-medium
                     hover:bg-gray-700 disabled:opacity-50 transition-colors">
              Cancelar
            </button>
            <button
              (click)="save()"
              [disabled]="saving() || (isEditMode() && !hasChanges())"
              class="flex-1 px-4 py-3 rounded-lg bg-yellow-400 text-black font-semibold
                     hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors">
              @if (saving()) {
                <span class="flex items-center justify-center gap-2">
                  <span class="animate-spin inline-block w-4 h-4 border-2 border-black border-t-transparent rounded-full"></span>
                  {{ isEditMode() ? 'Guardando...' : 'Creando...' }}
                </span>
              } @else {
                <span>Guardar cambios</span>
              }
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .animate-fadeIn {
      animation: fadeIn 0.2s ease-out;
    }

    .animate-slideUp {
      animation: slideUp 0.3s ease-out;
    }
  `]
})
export class EditUserModalComponent {
  isOpen = signal(false);
  user = signal<User | null>(null);
  saving = signal(false);
  error = signal('');

  // Modo de operación
  isEditMode = computed(() => !!this.user());

  // Estados editables
  selectedRole = signal<'USER_ROLE' | 'ADMIN_ROLE'>('USER_ROLE');
  selectedEstado = signal(true);

  // Estados originales para comparar
  originalRole = signal<'USER_ROLE' | 'ADMIN_ROLE'>('USER_ROLE');
  originalEstado = signal(true);

  // Datos para un nuevo usuario
  newUser = { nombre: '', email: '', password: '' };

  // Outputs
  userUpdated = output<{ user: User; role: string; estado: boolean }>();
  userCreated = output<{ user: Partial<User> & { password?: string }; role: string }>();

  // Detectar cambios
  roleChanged = signal(false);
  estadoChanged = signal(false);
  hasChanges = signal(false);

  constructor() {
    // Escuchar cambios para actualizar flags
    this.setupChangeDetection();
  }

  private setupChangeDetection() {
    // Esto se podría hacer con effect() pero lo hacemos simple
    setInterval(() => {
      if (this.isOpen()) {
        const roleChanged = this.selectedRole() !== this.originalRole();
        const estadoChanged = this.selectedEstado() !== this.originalEstado();

        this.roleChanged.set(roleChanged);
        this.estadoChanged.set(estadoChanged);
        this.hasChanges.set(roleChanged || estadoChanged);
      }
    }, 100);
  }

  open(user: User | null) {
    this.user.set(user);
    this.error.set('');
    this.saving.set(false);

    if (user) {
      // Modo Edición
      this.selectedRole.set(user.role);
      this.selectedEstado.set(user.estado ?? true);
      this.originalRole.set(user.role);
      this.originalEstado.set(user.estado ?? true);
    } else {
      // Modo Creación: resetear valores
      this.newUser = { nombre: '', email: '', password: '' };
      this.selectedRole.set('USER_ROLE');
      this.selectedEstado.set(true);
    }

    this.isOpen.set(true);
  }

  close() {
    this.isOpen.set(false);
    this.error.set('');
  }

  save() {
    this.saving.set(true);
    this.error.set('');

    if (this.isEditMode()) {
      const user = this.user();
      if (!user) return; // Salvaguarda

      // Emitir evento de actualización
      this.userUpdated.emit({
        user,
        role: this.selectedRole(),
        estado: this.selectedEstado()
      });
    } else {
      // Emitir evento de creación
      this.userCreated.emit({
        user: this.newUser,
        role: this.selectedRole()
      });
    }
  }

  // Método para manejar el resultado desde el componente padre
  handleSuccess(message?: string) {
    this.saving.set(false);
    // Opcional: podrías mostrar un mensaje de éxito si tuvieras un lugar en el template.
    // Por ahora, simplemente cerramos el modal.
    // Si en el futuro quieres mostrar un mensaje, puedes usar el `message` que llega.
    setTimeout(() => this.close(), 300); // Pequeño delay para que el usuario vea el cambio de estado del botón
  }

  handleError(message: string) {
    this.saving.set(false);
    this.error.set(message);
  }
}
