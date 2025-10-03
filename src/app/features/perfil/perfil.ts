import { Component, signal, computed, inject } from '@angular/core';
import { AuthService } from '../../core/auth';
import { UsuariosApi } from '../../services/usuarios';

@Component({
  standalone: true,
  selector: 'app-perfil',
  templateUrl: './perfil.html',
})
export class Perfil {
  private auth = inject(AuthService);
  private usersApi = inject(UsuariosApi);

  // Usuario actual
  user = computed(() => this.auth.user());

  // Formulario de perfil
  nombre = signal('');
  email = signal('');
  editingProfile = signal(false);
  savingProfile = signal(false);
  profileMsg = signal('');

  // Formulario de contraseña
  oldPassword = signal('');
  newPassword = signal('');
  confirmPassword = signal('');
  showOldPassword = signal(false);
  showNewPassword = signal(false);
  showConfirmPassword = signal(false);
  changingPassword = signal(false);
  savingPassword = signal(false);
  passwordMsg = signal('');

  constructor() {
    // Inicializar con datos del usuario
    const currentUser = this.user();
    if (currentUser) {
      this.nombre.set(currentUser.nombre);
      this.email.set(currentUser.email);
    }
  }

  // ==================== PERFIL ====================

  startEditProfile() {
    const currentUser = this.user();
    if (currentUser) {
      this.nombre.set(currentUser.nombre);
      this.email.set(currentUser.email);
    }
    this.editingProfile.set(true);
    this.profileMsg.set('');
  }

  cancelEditProfile() {
    const currentUser = this.user();
    if (currentUser) {
      this.nombre.set(currentUser.nombre);
      this.email.set(currentUser.email);
    }
    this.editingProfile.set(false);
    this.profileMsg.set('');
  }

  saveProfile() {
    const currentUser = this.user();
    if (!currentUser) return;

    const nombreValue = this.nombre().trim();
    const emailValue = this.email().trim();

    if (!nombreValue || !emailValue) {
      this.profileMsg.set('❌ Por favor completa todos los campos');
      return;
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailValue)) {
      this.profileMsg.set('❌ Email inválido');
      return;
    }

    this.savingProfile.set(true);
    this.profileMsg.set('');

    this.usersApi.update(currentUser.uid, {
      nombre: nombreValue,
      email: emailValue
    }).subscribe({
      next: (res) => {
        // Actualizar el usuario en el auth service
        this.auth.setSession({
          ok: true,
          user: res.usuario,
          token: this.auth.token()!
        });

        this.savingProfile.set(false);
        this.editingProfile.set(false);
        this.profileMsg.set('✓ Perfil actualizado correctamente');

        // Limpiar mensaje después de 3 segundos
        setTimeout(() => this.profileMsg.set(''), 3000);
      },
      error: (e) => {
        this.savingProfile.set(false);
        this.profileMsg.set(`❌ ${e?.error?.msg || 'Error al actualizar perfil'}`);
      }
    });
  }

  // ==================== CONTRASEÑA ====================

  toggleChangePassword() {
    this.changingPassword.update(v => !v);
    if (this.changingPassword()) {
      // Limpiar campos al abrir
      this.oldPassword.set('');
      this.newPassword.set('');
      this.confirmPassword.set('');
      this.passwordMsg.set('');
      this.showOldPassword.set(false);
      this.showNewPassword.set(false);
      this.showConfirmPassword.set(false);
    }
  }

  savePassword() {
    const currentUser = this.user();
    if (!currentUser) return;

    const oldPwd = this.oldPassword().trim();
    const newPwd = this.newPassword().trim();
    const confirmPwd = this.confirmPassword().trim();

    // Validaciones
    if (!oldPwd || !newPwd || !confirmPwd) {
      this.passwordMsg.set('❌ Por favor completa todos los campos');
      return;
    }

    if (newPwd.length < 6) {
      this.passwordMsg.set('❌ La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (newPwd !== confirmPwd) {
      this.passwordMsg.set('❌ Las contraseñas no coinciden');
      return;
    }

    if (oldPwd === newPwd) {
      this.passwordMsg.set('❌ La nueva contraseña debe ser diferente a la actual');
      return;
    }

    this.savingPassword.set(true);
    this.passwordMsg.set('');

    this.usersApi.changePassword(currentUser.uid, oldPwd, newPwd).subscribe({
      next: () => {
        this.savingPassword.set(false);
        this.passwordMsg.set('✓ Contraseña actualizada correctamente');

        // Limpiar campos
        this.oldPassword.set('');
        this.newPassword.set('');
        this.confirmPassword.set('');

        // Cerrar el formulario después de 2 segundos
        setTimeout(() => {
          this.changingPassword.set(false);
          this.passwordMsg.set('');
        }, 2000);
      },
      error: (e) => {
        this.savingPassword.set(false);
        this.passwordMsg.set(`❌ ${e?.error?.msg || 'Error al cambiar contraseña'}`);
      }
    });
  }

  // Validación de fortaleza de contraseña
  getPasswordStrength() {
    const pwd = this.newPassword();
    if (pwd.length === 0) return { level: 0, text: '', color: '' };
    
    let strength = 0;
    if (pwd.length >= 6) strength++;
    if (pwd.length >= 8) strength++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++;
    if (/\d/.test(pwd)) strength++;
    if (/[^a-zA-Z\d]/.test(pwd)) strength++;

    if (strength <= 2) return { level: 1, text: 'Débil', color: 'bg-red-500' };
    if (strength <= 3) return { level: 2, text: 'Media', color: 'bg-yellow-500' };
    return { level: 3, text: 'Fuerte', color: 'bg-green-500' };
  }

  // Métodos para toggle de visibilidad de contraseñas
  toggleShowOldPassword() {
    this.showOldPassword.update(v => !v);
  }

  toggleShowNewPassword() {
    this.showNewPassword.update(v => !v);
  }

  toggleShowConfirmPassword() {
    this.showConfirmPassword.update(v => !v);
  }
}
