import { sql } from '../config/neon-config.js';
import { exigirSesion, cerrarSesion } from '../auth/auth.js';

const usuario = exigirSesion();
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
document.getElementById('btn-logout')?.addEventListener('click', cerrarSesion);

async function cargarRegistros() {
  const tbody = document.getElementById('tabla-cuerpo-consulta');
  if (!tbody) return;

  try {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Cargando registros...</td></tr>`;

    const registros = await sql`
      SELECT id, beneficiario, dni, programa, estado 
      FROM inscripciones_programas_sociales 
      WHERE id_usuario = ${usuario.id}
      ORDER BY id DESC;
    `;

    if (registros.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No tienes trámites registrados actualmente.</td></tr>`;
      return;
    }

    tbody.innerHTML = registros.map(reg => `
      <tr>
        <td>${reg.id}</td>
        <td>${esc(reg.beneficiario) || 'Sin nombre'}</td>
        <td>${esc(reg.dni)}</td>
        <td>${esc(reg.programa)}</td>
        <td><span class="badge ${reg.estado}">${reg.estado}</span></td>
        <td>
          ${reg.estado === 'registrado'
            ? `<a href="actualizar.html?id=${reg.id}" class="boton" style="padding: 4px 8px; font-size: 12px;">Editar</a>`
            : '<span style="font-size:12px;color:#888;">Solo lectura</span>'}
        </td>
      </tr>
    `).join('');

  } catch (err) {
    console.error("Error al consultar Neon:", err);
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:red;"><strong>Error BD:</strong> ${err.message}</td></tr>`;
  }
}

cargarRegistros();