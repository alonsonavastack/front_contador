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
  telefono = signal('');
  loading = signal(false);
  error = signal('');
  
  // Control del flujo de verificación
  showOtpInput = signal(false);
  otpCode = signal('');
  verifyingOtp = signal(false);
  successMessage = signal('');
  
  // Para debugging
  debugInfo = signal('');

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

  onTelefonoChange(event: Event) {
    this.telefono.set((event.target as HTMLInputElement).value);
  }

  onOtpChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    // Solo permitir números
    const numericValue = value.replace(/\D/g, '');
    this.otpCode.set(numericValue);
  }

  // Método para enviar el formulario de registro
  submit(event: Event) {
    event.preventDefault();
    this.loading.set(true);
    this.error.set('');
    this.successMessage.set('');

    console.log('📝 Enviando registro:', {
      nombre: this.nombre(),
      email: this.email(),
      telefono: this.telefono()
    });

    this.auth.register(
      this.nombre(), 
      this.email(), 
      this.password(),
      this.telefono()
    ).subscribe({
      next: (res) => {
        console.log('✅ Registro exitoso:', res);
        this.loading.set(false);
        this.successMessage.set(res.msg || '¡Código enviado a tu WhatsApp! Por favor verifica tu número.');
        this.showOtpInput.set(true);
        this.debugInfo.set(`Email: ${this.email()}, Teléfono: ${this.telefono()}`);
      },
      error: (e) => {
        console.error('❌ Error de registro:', e);
        this.error.set(e?.error?.msg || e?.error?.message || 'No se pudo completar el registro.');
        this.loading.set(false);
      }
    });
  }

  // Método para verificar el código OTP
  verifyOtp(event: Event) {
    event.preventDefault();
    
    if (!this.otpCode() || this.otpCode().length !== 6) {
      this.error.set('Por favor ingresa el código completo de 6 dígitos');
      return;
    }

    this.verifyingOtp.set(true);
    this.error.set('');
    this.successMessage.set('');

    console.log('🔐 Verificando OTP:', {
      email: this.email(),
      code: this.otpCode(),
      codeLength: this.otpCode().length
    });

    this.auth.verifyOtp(this.email(), this.otpCode()).subscribe({
      next: (res) => {
        console.log('✅ Verificación exitosa:', res);
        this.verifyingOtp.set(false);
        this.successMessage.set(res.msg || '¡Cuenta verificada exitosamente! Redirigiendo al login...');
        
        // Redirigir al login después de 2 segundos
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (e) => {
        console.error('❌ Error al verificar OTP:', e);
        console.error('Detalles del error:', {
          status: e.status,
          statusText: e.statusText,
          error: e.error
        });
        
        let errorMsg = 'Código inválido. Por favor intenta de nuevo.';
        
        if (e.error?.msg) {
          errorMsg = e.error.msg;
        } else if (e.status === 400) {
          errorMsg = 'El código no es válido o ya expiró.';
        } else if (e.status === 404) {
          errorMsg = 'No se encontró el código. ¿Ya lo usaste? Solicita uno nuevo.';
        } else if (e.status === 429) {
          errorMsg = 'Demasiados intentos. Solicita un código nuevo.';
        }
        
        this.error.set(errorMsg);
        this.verifyingOtp.set(false);
      }
    });
  }

  // Método para reenviar el código
  resendCode() {
    this.loading.set(true);
    this.error.set('');
    this.successMessage.set('');
    
    console.log('🔄 Reenviando código a:', this.telefono());
    
    this.auth.register(
      this.nombre(), 
      this.email(), 
      this.password(),
      this.telefono()
    ).subscribe({
      next: (res) => {
        console.log('✅ Código reenviado:', res);
        this.loading.set(false);
        this.successMessage.set('¡Código reenviado a tu WhatsApp!');
        // Limpiar el código anterior
        this.otpCode.set('');
        setTimeout(() => this.successMessage.set(''), 3000);
      },
      error: (e) => {
        console.error('❌ Error al reenviar código:', e);
        this.error.set(e?.error?.msg || e?.error?.message || 'No se pudo reenviar el código.');
        this.loading.set(false);
      }
    });
  }
}
