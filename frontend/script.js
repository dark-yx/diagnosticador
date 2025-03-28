document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('encuestaForm');
  const submitBtn = form.querySelector('.submit-btn');
  const formContainer = document.querySelector('.container');
  const resultadoContainer = document.getElementById('resultadoContainer');
  const loaderContainer = document.getElementById('loaderContainer');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Validar el formulario antes de enviar
    if (!validarFormulario()) {
      return;
    }
    
    // Deshabilitar el botón y mostrar loader
    submitBtn.disabled = true;
    submitBtn.textContent = 'Procesando...';
    loaderContainer.style.display = 'flex';

    try {
      // Obtener los síntomas seleccionados
      const sintomasCheckboxes = form.querySelectorAll('input[name="sintomas"]:checked');
      const sintomas = Array.from(sintomasCheckboxes).map(cb => cb.value);

      if (sintomas.length === 0) {
        alert('Por favor, seleccione al menos un síntoma');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Obtener Análisis de Salud';
        loaderContainer.style.display = 'none';
        return;
      }

      // Crear objeto con los datos del formulario
      const formData = {
        nombre: form.querySelector('#nombre').value.trim(),
        apellido: form.querySelector('#apellido').value.trim(),
        identificacion: form.querySelector('#identificacion').value.trim(),
        telefono: form.querySelector('#telefono').value.trim(),
        correo: form.querySelector('#correo').value.trim(),
        edad: parseInt(form.querySelector('#edad').value),
        peso: parseFloat(form.querySelector('#peso').value),
        estatura: parseFloat(form.querySelector('#estatura').value),
        presion_arterial: form.querySelector('#presion_arterial').value.trim(),
        nivel_energia: parseInt(form.querySelector('#nivel_energia').value) || 5,
        sintomas: sintomas,
        observaciones: form.querySelector('#observaciones').value.trim() || null,
        nombre_encuestador: form.querySelector('#nombre_encuestador')?.value.trim() || null,
        encuestador_id: form.querySelector('#encuestador_id')?.value.trim() || null
      };

      console.log('Enviando datos:', formData);

      // Enviar datos al backend
      const response = await fetch('/api/encuesta', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      console.log('Respuesta del servidor:', data);

      if (!response.ok) {
        let errorMessage = data.details || data.error || 'Error al procesar la encuesta';
        
        // Mensajes de error más amigables
        if (response.status === 400) {
          errorMessage = 'Por favor, complete todos los campos requeridos correctamente.';
        } else if (response.status === 500) {
          errorMessage = 'Ha ocurrido un error en el servidor. Por favor, intente nuevamente más tarde.';
        }
        
        throw new Error(errorMessage);
      }

      if (!data.success) {
        throw new Error(data.details || data.error || 'Error al procesar la encuesta');
      }

      // Ocultar el formulario y mostrar los resultados
      formContainer.style.display = 'none';
      resultadoContainer.style.display = 'block';

      // Actualizar la fecha
      const fecha = new Date();
      const opciones = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      };
      document.getElementById('fecha').textContent = fecha.toLocaleDateString('es-ES', opciones);

      // Actualizar datos personales
      const nombreCompleto = `${data.datosPaciente.nombre} ${data.datosPaciente.apellido}`;
      console.log('Nombre completo:', nombreCompleto);
      
      document.getElementById('resultado-nombre').textContent = nombreCompleto;
      document.getElementById('resultado-identificacion').textContent = data.datosPaciente.identificacion;
      document.getElementById('resultado-telefono').textContent = data.datosPaciente.telefono;
      document.getElementById('resultado-correo').textContent = data.datosPaciente.correo;
      document.getElementById('resultado-edad').textContent = data.datosPaciente.edad;

      // Actualizar mediciones
      document.getElementById('resultado-peso').textContent = data.datosPaciente.peso;
      document.getElementById('resultado-estatura').textContent = data.datosPaciente.estatura;
      document.getElementById('resultado-presion-arterial').textContent = data.datosPaciente.presion_arterial;
      document.getElementById('resultado-nivel-energia').textContent = data.datosPaciente.nivel_energia;

      // Calcular y mostrar IMC
      const imc = (data.datosPaciente.peso / (data.datosPaciente.estatura * data.datosPaciente.estatura)).toFixed(2);
      document.getElementById('resultado-imc').textContent = imc;
      
      // Interpretación del IMC
      let imcInterpretacion = '';
      if (imc < 18.5) {
        imcInterpretacion = '(Bajo peso)';
      } else if (imc < 25) {
        imcInterpretacion = '(Peso normal)';
      } else if (imc < 30) {
        imcInterpretacion = '(Sobrepeso)';
      } else {
        imcInterpretacion = '(Obesidad)';
      }
      document.getElementById('resultado-imc-interpretacion').textContent = imcInterpretacion;

      // Actualizar síntomas
      const sintomasList = document.getElementById('resultado-sintomas');
      sintomasList.innerHTML = '';
      data.datosPaciente.sintomas.forEach(sintoma => {
        const li = document.createElement('li');
        li.textContent = sintoma;
        sintomasList.appendChild(li);
      });

      // Procesar el diagnóstico para eliminar la sección de datos duplicados
      let diagnostico = data.diagnostico;
      // Eliminar la sección de "Datos del Paciente" si existe
      diagnostico = diagnostico.replace(/Datos del Paciente[\s\S]*?(?=\d\.|$)/, '');

      // Actualizar diagnóstico y recomendaciones usando marked
      const diagnosticoHtml = marked.parse(diagnostico);
      const recomendacionesHtml = marked.parse(data.recomendaciones);

      document.getElementById('resultado-diagnostico').innerHTML = diagnosticoHtml;
      document.getElementById('resultado-recomendaciones').innerHTML = recomendacionesHtml;

      // Ocultar el loader
      loaderContainer.style.display = 'none';

      // Agregar logs para depuración
      console.log('Datos completos del paciente:', {
        nombre: data.datosPaciente.nombre,
        apellido: data.datosPaciente.apellido,
        identificacion: data.datosPaciente.identificacion,
        telefono: data.datosPaciente.telefono,
        correo: data.datosPaciente.correo,
        edad: data.datosPaciente.edad,
        peso: data.datosPaciente.peso,
        estatura: data.datosPaciente.estatura,
        presion_arterial: data.datosPaciente.presion_arterial,
        nivel_energia: data.datosPaciente.nivel_energia,
        sintomas: data.datosPaciente.sintomas
      });

    } catch (error) {
      console.error('Error:', error);
      alert(error.message || 'Hubo un error al procesar la encuesta. Por favor, intente nuevamente.');
    } finally {
      // Restaurar el botón y ocultar loader
      submitBtn.disabled = false;
      submitBtn.textContent = 'Obtener Análisis de Salud';
      loaderContainer.style.display = 'none';
    }
  });

  // Validación en tiempo real
  const inputs = form.querySelectorAll('input, textarea');
  inputs.forEach(input => {
    input.addEventListener('input', () => {
      validateField(input);
    });
  });
});

function validateField(field) {
  const value = field.value.trim();
  let error = '';

  // Validaciones específicas por tipo de campo
  switch (field.id) {
    case 'nombre':
    case 'apellido':
      if (value.length < 2) {
        error = 'Debe tener al menos 2 caracteres';
      }
      break;
    case 'identificacion':
      if (value.length < 5) {
        error = 'Identificación inválida';
      }
      break;
    case 'correo':
      if (!isValidEmail(value)) {
        error = 'Por favor, ingrese un correo electrónico válido';
      }
      break;
    case 'telefono':
      if (!isValidPhone(value)) {
        error = 'Por favor, ingrese un número de teléfono válido';
      }
      break;
    case 'edad':
      if (value < 0 || value > 120) {
        error = 'Por favor, ingrese una edad válida';
      }
      break;
    case 'peso':
      if (value < 20 || value > 300) {
        error = 'Por favor, ingrese un peso válido';
      }
      break;
    case 'estatura':
      if (value < 0.5 || value > 3) {
        error = 'Por favor, ingrese una estatura válida';
      }
      break;
    case 'nivel_energia':
      if (value < 1 || value > 10) {
        error = 'El nivel de energía debe estar entre 1 y 10';
      }
      break;
    case 'presion_arterial':
      if (!isValidPressure(value)) {
        error = 'Formato inválido (ej: 120/80)';
      }
      break;
  }

  // Mostrar o ocultar mensaje de error
  const errorDiv = field.nextElementSibling && field.nextElementSibling.classList.contains('error') 
    ? field.nextElementSibling 
    : null;
    
  if (error) {
    if (!errorDiv) {
      const newErrorDiv = document.createElement('div');
      newErrorDiv.className = 'error';
      newErrorDiv.textContent = error;
      field.parentNode.insertBefore(newErrorDiv, field.nextSibling);
    } else {
      errorDiv.textContent = error;
    }
    field.classList.add('invalid');
  } else {
    if (errorDiv) {
      errorDiv.remove();
    }
    field.classList.remove('invalid');
  }

  return !error;
}

function validarFormulario() {
  const form = document.getElementById('encuestaForm');
  const inputs = form.querySelectorAll('input[required]');
  let isValid = true;

  inputs.forEach(input => {
    if (!validateField(input)) {
      isValid = false;
    }
  });

  return isValid;
}

function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function isValidPhone(phone) {
  const re = /^\+?[\d\s-]{8,}$/;
  return re.test(phone);
}

function isValidPressure(pressure) {
  const re = /^\d{2,3}\/\d{2,3}$/;
  return re.test(pressure);
}
  