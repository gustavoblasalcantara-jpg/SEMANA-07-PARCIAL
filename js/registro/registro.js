import { sql } from '../config/neon-config.js';
import { exigirSesion, cerrarSesion } from '../auth/auth.js';

// Exigir sesión de cliente activa
const usuario = exigirSesion();

document.getElementById('btn-logout')?.addEventListener('click', cerrarSesion);

const form = document.getElementById('form-registro-programa');

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nombre = document.getElementById('reg-nombre').value;
    const dni = document.getElementById('reg-dni').value;
    const programa = document.getElementById('reg-programa').value;

    try {
      // Guardar registro con el nombre de columna correcto en Neon: 'beneficiario'
      await sql`
        INSERT INTO inscripciones_programas_sociales (beneficiario, dni, programa, estado, id_usuario)
        VALUES (${nombre}, ${dni}, ${programa}, 'registrado', ${usuario.id});
      `;

      alert("¡Inscripción registrada con éxito!");
      form.reset();
      
      // Redirigir a consulta para ver el trámite en la tabla
      window.location.href = 'consulta.html';

    } catch (err) {
      console.error("Error al registrar:", err);
      alert("Ocurrió un error al guardar la inscripción: " + err.message);
    }
  });
}