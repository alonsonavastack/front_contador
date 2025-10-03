import {
  Component,
  signal,
  computed,
  inject,
  HostListener,
} from "@angular/core";
import {
  RouterOutlet,
  RouterLink,
  RouterLinkActive,
  Router,
} from "@angular/router";
import { AuthService } from "../../core/auth";

@Component({
  standalone: true,
  selector: "app-dashboard",
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: "./dashboard.html",
})
export class Dashboard {
  private router = inject(Router);
  auth = inject(AuthService);

  menuOpen = signal(true);
  isDesktop = signal(window.innerWidth >= 768); // md breakpoint (768px)

  user = computed(() => this.auth.user());
  role = computed(() => this.auth.role());

  // Verificar que el usuario esté cargado
  constructor() {
    // Si no hay usuario, redirigir a login
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(["/login"]);
    }

    // Colapsar menú por defecto en móvil al iniciar
    if (!this.isDesktop()) {
      this.menuOpen.set(false);
    }
  }

  @HostListener("window:resize")
  onResize() {
    const isCurrentlyDesktop = window.innerWidth >= 768;
    if (this.isDesktop() !== isCurrentlyDesktop) {
      this.isDesktop.set(isCurrentlyDesktop);
      // Ajustar el estado del menú al cambiar entre vistas
      this.menuOpen.set(isCurrentlyDesktop);
    }
  }

  logout() {
    this.auth.logout();
    this.router.navigate(["/login"]);
  }

  toggleMenu() {
    this.menuOpen.update((v) => !v);
  }
}
