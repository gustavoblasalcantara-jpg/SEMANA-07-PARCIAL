import { sql } from '../config/neon-config.js';

// Registrar nuevo cliente (Rol por defecto: cliente)
export async function registrarUsuario(nombre, correo, contrasena) {
  const resultado = await sql`
    INSERT INTO usuarios (nombre, correo, contrasena, rol)
    VALUES (${nombre}, ${correo}, ${contrasena}, 'cliente')
    RETURNING id, nombre, correo, rol;
  `;
  return resultado[0];
}

// Iniciar sesión devolviendo ID, nombre, correo y ROL
export async function iniciarSesion(correo, contrasena) {
  const usuarios = await sql`
    SELECT id, nombre, correo, rol 
    FROM usuarios 
    WHERE correo = ${correo} AND contrasena = ${contrasena};
  `;

  if (usuarios.length > 0) {
    const usuario = usuarios[0];
    sessionStorage.setItem('usuario', JSON.stringify(usuario));
    return usuario;
  }
  
  return null;
}

// Verificar sesión activa del usuario
export function exigirSesion() {
  const usuarioData = sessionStorage.getItem('usuario');
  if (!usuarioData) {
    window.location.href = 'login.html';
    return null;
  }
  const u = JSON.parse(usuarioData);
  aplicarTema(u);
  return u;
}

// Cerrar sesión
export function cerrarSesion() {
  sessionStorage.removeItem('usuario');
  window.location.href = 'login.html';
}

// Entorno visual por rol: color, franja de identificación y menú propio
const ZONAS = {
  cliente: 'Zona del Beneficiario',
  empleado: 'Zona del Personal · Atención al ciudadano',
  administrador: 'Zona de Administración · Control total'
};
export function aplicarTema(u) {
  if (!u || !ZONAS[u.rol]) return;
  document.body.classList.add('rol-' + u.rol);
  const header = document.querySelector('.site-header');
  if (header && !document.getElementById('franja-rol')) {
    const f = document.createElement('div');
    f.id = 'franja-rol';
    f.className = 'franja-rol';
    f.textContent = ZONAS[u.rol] + ' — ' + u.nombre;
    header.insertAdjacentElement('afterend', f);
  }
  const ul = document.querySelector('.nav-principal ul');
  if (ul) {
    const links = [['cajeros.html', 'Cajeros']];
    if (u.rol === 'cliente') links.push(['quejas.html', 'Mis quejas']);
    else links.push(['panel.html', 'Panel']);
    const logout = ul.querySelector('#btn-logout')?.closest('li');
    links.forEach(([href, txt]) => {
      if (ul.querySelector(`a[href="${href}"]`)) return;
      const li = document.createElement('li');
      li.innerHTML = `<a href="${href}">${txt}</a>`;
      logout ? ul.insertBefore(li, logout) : ul.appendChild(li);
    });
  }
}
// Para páginas públicas (index, cajeros): aplica el tema si hay sesión, sin exigirla
export function temaSiHaySesion() {
  const d = sessionStorage.getItem('usuario');
  if (d) aplicarTema(JSON.parse(d));
}
