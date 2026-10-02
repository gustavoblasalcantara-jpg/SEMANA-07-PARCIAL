import { sql } from '../config/neon-config.js';
import { exigirSesion, cerrarSesion } from '../auth/auth.js';

const usuario = exigirSesion();
document.getElementById('btn-logout')?.addEventListener('click', cerrarSesion);

const params = new URLSearchParams(window.location.search);
const idRegistro = params.get('id');

const form = document.getElementById('form-actualizar-programa');
const msg = document.getElementById('mensaje-estado');
const btnGuardar = document.getElementById('btn-guardar');

async function cargarDatos() {
  if (!idRegistro) {
    window.location.href = 'consulta.html';
    return;
  }

  try {
    const res = await sql`
      SELECT id, beneficiario, dni, programa, estado 
      FROM inscripciones_programas_sociales 
      WHERE id = ${idRegistro} AND id_usuario = ${usuario.id};
    `;

    if (res.length === 0) {
      alert("No tienes permiso para editar este registro o no existe.");
      window.location.href = 'consulta.html';
      return;
    }

    const reg = res[0];

    document.getElementById('act-id').value = reg.id;
    document.getElementById('act-nombre').value = reg.beneficiario;
    document.getElementById('act-dni').value = reg.dni;
    document.getElementById('act-programa').value = reg.programa;

    // Regla de Negocio: Solo editar si el estado es 'registrado'
    if (reg.estado !== 'registrado') {
      msg.innerHTML = `<strong style="color:red;">Trámite en estado '${reg.estado}': Este registro no se puede modificar porque ya fue atendido.</strong>`;
      
      document.getElementById('act-nombre').disabled = true;
      document.getElementById('act-dni').disabled = true;
      document.getElementById('act-programa').disabled = true;
      btnGuardar.disabled = true;
    } else {
      msg.innerHTML = `<span style="color:green;">Estado: Registrado (Modificación permitida)</span>`;
    }

  } catch (err) {
    console.error(err);
    alert("Error al cargar los datos: " + err.message);
  }
}

export async function actualizarRegistro(id, datos) {
  await sql`
    UPDATE inscripciones_programas_sociales
    SET beneficiario = ${datos.beneficiario}, dni = ${datos.dni}, programa = ${datos.programa}
    WHERE id = ${id} AND id_usuario = ${usuario.id} AND estado = 'registrado';
  `;
}

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('act-id').value;
    const datos = {
      beneficiario: document.getElementById('act-nombre').value,
      dni: document.getElementById('act-dni').value,
      programa: document.getElementById('act-programa').value
    };

    try {
      await actualizarRegistro(id, datos);
      alert("¡Registro actualizado con éxito!");
      window.location.href = 'consulta.html';
    } catch (err) {
      console.error("Error al actualizar:", err);
      alert("Error al actualizar: " + err.message);
    }
  });
}

cargarDatos();