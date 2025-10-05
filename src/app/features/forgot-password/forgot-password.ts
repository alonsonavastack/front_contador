import { Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth';
import { CommonModule } from '@angular/common';

enum RecoveryStep {
  REQUEST = 'REQUEST',    // Solicitar código
  VERIFY = 'VERIFY',      // Verificar código OTP
  RESET = 'RESET'         // Establecer nueva contraseña
}

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './forgot-password.html',
})
export class ForgotPassword {
  // Enum para usar en el template
  RecoveryStep = RecoveryStep;

  // Paso actual del flujo
  currentStep = signal<RecoveryStep>(RecoveryStep.REQUEST);

  // Datos del formulario
  email = signal('');
  otpCode = signal('');
  newPassword = signal('');
  confirmPassword = signal('');

  // Estados de carga
  loading = signal(false);
  verifying = signal(false);
  resetting = signal(false);

  // Mensajes
  error = signal('');
  successMessage = signal('');

  // Datos temporales para el flujo
  tempToken = signal('');
  userId = signal('');
  telefono = signal('');

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  // Métodos para actualizar los signals
  onEmailChange(event: Event) {
    this.email.set((event.target as HTMLInputElement).value);
  }

  onOtpChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    const numericValue = value.replace(/\D/g, '');
    this.otpCode.set(numericValue);
  }

  onNewPasswordChange(event: Event) {
    this.newPassword.set((event.target as HTMLInputElement).value);
  }

  onConfirmPasswordChange(event: Event) {
    this.confirmPassword.set((event.target as HTMLInputElement).value);
  }

  // Paso 1: Solicitar código de recuperación
  requestRecovery(event: Event) {
    event.preventDefault();
    this.loading.set(true);
    this.error.set('');
    this.successMessage.set('');

    console.log('📧 Solicitando recuperación para:', this.email());

    this.auth.requestPasswordRecovery(this.email()).subscribe({
      next: (res) => {
        console.log('✅ Código enviado:', res);
        this.loading.set(false);
        this.successMessage.set(res.msg || 'Código enviado a tu WhatsApp');
        this.telefono.set(res.telefono || '');
        this.currentStep.set(RecoveryStep.VERIFY);
      },
      error: (e) => {
        console.error('❌ Error al solicitar recuperación:', e);
        this.error.set(e?.error?.msg || 'No se pudo enviar el código');
        this.loading.set(false);
      }
    });
  }

  // Paso 2: Verificar código OTP
  verifyCode(event: Event) {
    event.preventDefault();

    if (!this.otpCode() || this.otpCode().length !== 6) {
      this.error.set('Por favor ingresa el código completo de 6 dígitos');
      return;
    }

    this.verifying.set(true);
    this.error.set('');
    this.successMessage.set('');

    console.log('🔐 Verificando código:', this.otpCode());

    this.auth.verifyRecoveryOtp(this.email(), this.otpCode()).subscribe({
      next: (res) => {
        console.log('✅ Código verificado:', res);
        this.verifying.set(false);
        this.successMessage.set(res.msg || 'Código verificado correctamente');
        this.tempToken.set(res.tempToken);
        this.userId.set(res.userId);
        this.currentStep.set(RecoveryStep.RESET);
      },
      error: (e) => {
        console.error('❌ Error al verificar código:', e);
        let errorMsg = 'Código inválido';

        if (e.error?.msg) {
          errorMsg = e.error.msg;
        } else if (e.status === 400) {
          errorMsg = 'El código no es válido o ya expiró';
        } else if (e.status === 429) {
          errorMsg = 'Demasiados intentos. Solicita un código nuevo';
        }

        this.error.set(errorMsg);
        this.verifying.set(false);
      }
    });
  }

  // Paso 3: Restablecer contraseña
  resetPassword(event: Event) {
    event.preventDefault();

    // Validaciones
    if (this.newPassword().length < 6) {
      this.error.set('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (this.newPassword() !== this.confirmPassword()) {
      this.error.set('Las contraseñas no coinciden');
      return;
    }

    this.resetting.set(true);
    this.error.set('');
    this.successMessage.set('');

    console.log('🔑 Restableciendo contraseña');

    this.auth.resetPassword(
      this.tempToken(),
      this.userId(),
      this.newPassword()
    ).subscribe({
      next: (res) => {
        console.log('✅ Contraseña actualizada:', res);
        this.resetting.set(false);
        this.successMessage.set(res.msg || 'Contraseña actualizada exitosamente');

        // Redirigir al login después de 2 segundos
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (e) => {
        console.error('❌ Error al restablecer contraseña:', e);
        this.error.set(e?.error?.msg || 'No se pudo actualizar la contraseña');
        this.resetting.set(false);
      }
    });
  }

  // Reenviar código
  resendCode() {
    this.loading.set(true);
    this.error.set('');
    this.successMessage.set('');

    console.log('🔄 Reenviando código');

    this.auth.requestPasswordRecovery(this.email()).subscribe({
      next: (res) => {
        console.log('✅ Código reenviado:', res);
        this.loading.set(false);
        this.successMessage.set('Código reenviado a tu WhatsApp');
        this.otpCode.set('');
        setTimeout(() => this.successMessage.set(''), 3000);
      },
      error: (e) => {
        console.error('❌ Error al reenviar código:', e);
        this.error.set(e?.error?.msg || 'No se pudo reenviar el código');
        this.loading.set(false);
      }
    });
  }

  // Volver al paso anterior
  goBack() {
    if (this.currentStep() === RecoveryStep.VERIFY) {
      this.currentStep.set(RecoveryStep.REQUEST);
      this.otpCode.set('');
    } else if (this.currentStep() === RecoveryStep.RESET) {
      this.currentStep.set(RecoveryStep.VERIFY);
      this.newPassword.set('');
      this.confirmPassword.set('');
    }
    this.error.set('');
    this.successMessage.set('');
  }
}
