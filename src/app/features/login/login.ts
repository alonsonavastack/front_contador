import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.html',
})
export class LoginPage {
  email = signal('@example.com');
  password = signal('password123');
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

  onEmailChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.email.set(input.value);
  }

  onPasswordChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.password.set(input.value);
  }

  submit(event: Event) {
    event.preventDefault();

    const emailValue = this.email().trim();
    const passwordValue = this.password().trim();

    if (!emailValue || !passwordValue) {
      this.error.set('Por favor completa todos los campos');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.auth.login(emailValue, passwordValue).subscribe({
      next: (res) => {
        this.auth.setSession(res);
        this.loading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (e) => {
        console.error('Error de login:', e);
        this.error.set(e?.error?.msg || e?.error?.message || 'Credenciales inválidas');
        this.loading.set(false);
      }
    });
  }
}
