// js/auth/login.js — script propio de login.html
import { iniciarSesion, registrarUsuario } from './auth.js';

function mostrar(caja, ok, html) {
  caja.style.display = 'block';
  caja.style.backgroundColor = ok ? '#d4edda' : '#f8d7da';
  caja.style.color = ok ? '#155724' : '#721c24';
  caja.innerHTML = html;
}
const esc = (s) => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// Iniciar sesión: el rol decide a qué página se redirige
const formLogin = document.getElementById('form-login');
const boxLogin = document.getElementById('mensaje-login');
formLogin.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('btn-login');
  try {
    btn.disabled = true; btn.textContent = 'Verificando...';
    const u = await iniciarSesion(
      document.getElementById('login-correo').value,
      document.getElementById('login-password').value);
    if (!u) return mostrar(boxLogin, false, '<strong>Error:</strong> Correo o contraseña incorrectos.');
    mostrar(boxLogin, true, `<strong>¡Bienvenido(a) ${esc(u.nombre)}!</strong> (${esc(u.rol)})`);
    setTimeout(() => {
      window.location.href = (u.rol === 'cliente') ? 'registro.html' : 'panel.html';
    }, 1000);
  } catch (err) {
    mostrar(boxLogin, false, '<strong>Error de conexión:</strong> ' + esc(err.message));
  } finally {
    btn.disabled = false; btn.textContent = 'Ingresar';
  }
});

// Crear cuenta (siempre rol cliente)
const formReg = document.getElementById('form-registro');
const boxReg = document.getElementById('mensaje-registro');
formReg.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('btn-registro');
  try {
    btn.disabled = true; btn.textContent = 'Registrando...';
    await registrarUsuario(
      document.getElementById('reg-nombre').value,
      document.getElementById('reg-correo').value,
      document.getElementById('reg-password').value);
    mostrar(boxReg, true, '<strong>¡Usuario registrado!</strong> Ahora puedes iniciar sesión arriba.');
    formReg.reset();
  } catch (err) {
    mostrar(boxReg, false, '<strong>Error:</strong> ' + esc(err.message));
  } finally {
    btn.disabled = false; btn.textContent = 'Registrarse en Neon';
  }
});
