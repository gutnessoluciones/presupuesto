# Sistema de Gestión de Presupuestos

Aplicación web para crear, gestionar y generar presupuestos profesionales de manera sencilla y eficiente.

## 🚀 Características

- ✅ **Gestión de Clientes**: Registra información del cliente (nombre, email, fecha, número de presupuesto)
- ✅ **Artículos Dinámicos**: Agrega y elimina artículos con descripción, cantidad y precio
- ✅ **Cálculo Automático**: Calcula subtotales, IVA (21%) y total automáticamente
- ✅ **IVA Opcional**: Activa o desactiva el IVA según tus necesidades con un simple checkbox
- ✅ **Logotipo de Empresa**: Carga y muestra el logo de tu empresa en los presupuestos
- ✅ **Exportación a PDF**: Genera archivos PDF profesionales de tus presupuestos
- ✅ **Almacenamiento Local**: Guarda presupuestos en el navegador usando localStorage
- ✅ **Visualización de Presupuestos**: Lista todos los presupuestos guardados con detalles
- ✅ **Cargar Presupuestos**: Recupera y edita presupuestos anteriores
- ✅ **Función de Impresión**: Imprime presupuestos con formato optimizado
- ✅ **Diseño Responsive**: Funciona perfectamente en dispositivos móviles y escritorio
- ✅ **Interfaz Moderna**: UI atractiva con gradientes y animaciones

## 📋 Requisitos

- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- No requiere instalación de dependencias ni servidor

## 🎯 Cómo Usar

1. **Abrir la aplicación**: Simplemente abre el archivo `index.html` en tu navegador
2. **Cargar Logotipo** (Opcional): Haz clic en "📷 Cargar Logo" para añadir el logo de tu empresa
3. **Información del Cliente**: Completa los datos del cliente en la sección superior
4. **Agregar Artículos**: 
   - Ingresa descripción, cantidad y precio unitario
   - Haz clic en "Agregar Artículo" o presiona Enter
5. **Configurar IVA**: Marca o desmarca el checkbox "IVA (21%)" según necesites incluirlo
6. **Ver Totales**: Los cálculos se actualizan automáticamente
7. **Guardar**: Haz clic en "Guardar Presupuesto" para almacenarlo localmente
8. **Exportar PDF**: Usa el botón "📄 Exportar PDF" para generar un archivo PDF profesional
9. **Imprimir**: Usa el botón "Imprimir" para generar una versión imprimible
10. **Nuevo Presupuesto**: Limpia el formulario con "Nuevo Presupuesto"

## 📁 Estructura del Proyecto

```
presupuesto/
├── index.html          # Estructura HTML principal
├── styles.css          # Estilos y diseño visual
├── script.js           # Lógica de la aplicación
├── .github/
│   └── copilot-instructions.md  # Instrucciones del proyecto
└── README.md           # Documentación
```

## 💡 Funcionalidades Técnicas

### Almacenamiento
- Utiliza `localStorage` para persistir datos
- Los presupuestos se guardan automáticamente en el navegador
- El logotipo se guarda en formato Base64
- No se pierden los datos al cerrar la página

### Exportación PDF
- Utiliza las librerías jsPDF y html2canvas
- Genera PDFs profesionales con logo, datos del cliente y artículos
- Incluye totales y formato personalizado
- Descarga automática del archivo

### Cálculos
- Subtotal: Suma de todos los artículos (cantidad × precio)
- IVA: 21% sobre el subtotal (opcional)
- Total: Subtotal + IVA (si está activado)

### Validaciones
- Verifica que los campos requeridos estén completos
- Valida que haya al menos un artículo antes de guardar o imprimir
- Confirma acciones destructivas (eliminar, nuevo presupuesto)
- Acepta solo archivos de imagen para el logotipo

## 🎨 Personalización

### Cambiar el Porcentaje de IVA
Edita el archivo `script.js`, en la función `calculateTotals`:
```javascript
const iva = includeIVA ? subtotal * 0.21 : 0; // Cambiar 0.21 por el porcentaje deseado
```

### Modificar Colores
Edita `styles.css` para cambiar los colores del gradiente y tema:
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

### Cambiar el Logo
Simplemente haz clic en "📷 Cargar Logo" y selecciona la imagen de tu empresa. Formatos soportados: JPG, PNG, GIF, SVG.

## 🖨️ Impresión y Exportación

### Imprimir
La aplicación incluye estilos específicos para impresión que:
- Muestran el logotipo de la empresa
- Ocultan botones y secciones innecesarias
- Optimizan el diseño para papel
- Mantienen solo la información esencial del presupuesto

### Exportar a PDF
El botón "📄 Exportar PDF" genera un archivo PDF profesional que incluye:
- Logotipo de la empresa (si está cargado)
- Información completa del cliente
- Tabla detallada de artículos
- Cálculo de subtotal, IVA (si aplica) y total
- Formato profesional y descarga automática

## 📱 Compatibilidad

- ✅ Chrome/Edge (última versión)
- ✅ Firefox (última versión)
- ✅ Safari (última versión)
- ✅ Dispositivos móviles (iOS/Android)

## 🔒 Privacidad

Todos los datos se almacenan localmente en tu navegador. No se envía información a ningún servidor externo.

## 🚀 Inicio Rápido

1. Descarga o clona el proyecto
2. Abre `index.html` en tu navegador
3. ¡Comienza a crear presupuestos!

## 📝 Notas

- Los presupuestos se guardan en el navegador, no en la nube
- El logotipo se guarda junto con cada presupuesto
- Si limpias los datos del navegador, se perderán los presupuestos guardados
- Puedes exportar presupuestos como PDF o imprimirlos
- El IVA es opcional y se puede activar/desactivar en cualquier momento

## 🤝 Contribuciones

Este es un proyecto de código abierto. Siéntete libre de mejorarlo y adaptarlo a tus necesidades.

---

**Desarrollado con ❤️ para facilitar la gestión de presupuestos**
