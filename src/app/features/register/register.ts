import { Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './register.html',
})
export class Register {
  // Signals para el estado del formulario
  nombre = signal('');
  email = signal('');
  password = signal('');
  loading = signal(false);
  error = signal('');

  constructor(
    private auth: AuthService,
    private router: Router
  ) {
    // Si ya está logueado, redirigir al dashboard
    if (this.auth.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
    }
  }

  // Métodos para actualizar los signals en cada input
  onNombreChange(event: Event) {
    this.nombre.set((event.target as HTMLInputElement).value);
  }

  onEmailChange(event: Event) {
    this.email.set((event.target as HTMLInputElement).value);
  }

  onPasswordChange(event: Event) {
    this.password.set((event.target as HTMLInputElement).value);
  }

  // Método para enviar el formulario
  submit(event: Event) {
    event.preventDefault();
    this.loading.set(true);
    this.error.set('');

    this.auth.register(this.nombre(), this.email(), this.password()).subscribe({
      next: (res) => {
        // Después de un registro exitoso, iniciamos sesión automáticamente
        this.auth.setSession(res);
        this.loading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (e) => {
        console.error('Error de registro:', e);
        this.error.set(e?.error?.msg || e?.error?.message || 'No se pudo completar el registro.');
        this.loading.set(false);
      }
    });
  }
}
