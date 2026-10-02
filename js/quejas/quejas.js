import { sql } from '../config/neon-config.js';
import { exigirSesion, cerrarSesion } from '../auth/auth.js';
const usuario = exigirSesion();
document.getElementById('btn-logout').addEventListener('click', cerrarSesion);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const tbody = document.getElementById('tabla-quejas-cliente');
const msg = document.getElementById('q-msg');
async function cargar() {
  try {
    const r = await sql`SELECT id, tipo, descripcion, estado, respuesta FROM quejas WHERE id_usuario = ${usuario.id} ORDER BY id DESC;`;
    tbody.innerHTML = r.length ? r.map(q => `<tr><td>${q.id}</td><td>${esc(q.tipo)}</td><td>${esc(q.descripcion)}</td>
      <td><span class="badge ${esc(q.estado)}">${esc(q.estado)}</span></td><td>${esc(q.respuesta) || '—'}</td></tr>`).join('')
      : '<tr><td colspan="5">Aún no has enviado nada.</td></tr>';
  } catch (e) { tbody.innerHTML = `<tr><td colspan="5">Error: ${esc(e.message)}</td></tr>`; }
}
document.getElementById('form-queja').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await sql`INSERT INTO quejas (id_usuario, tipo, descripcion) VALUES (${usuario.id}, ${document.getElementById('q-tipo').value}, ${document.getElementById('q-desc').value});`;
    msg.textContent = '¡Enviado! El personal lo revisará pronto.';
    e.target.reset(); cargar();
  } catch (err) { msg.textContent = 'Error: ' + err.message; }
});
cargar();
