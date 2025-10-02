import { Component, signal, computed, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../core/auth';

@Component({
  standalone: true,
  selector: 'app-dashboard',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './dashboard.html',
})
export class Dashboard {
  private router = inject(Router);
  auth = inject(AuthService);
  
  menuOpen = signal(true);
  user = computed(() => this.auth.user());
  role = computed(() => this.auth.role());

  // Verificar que el usuario esté cargado
  constructor() {
    // Si no hay usuario, redirigir a login
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
    }
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  toggleMenu() {
    this.menuOpen.update(v => !v);
  }
}
