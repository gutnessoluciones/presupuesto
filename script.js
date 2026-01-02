// Estado de la aplicación
let currentBudget = {
    id: null,
    client: {
        name: '',
        email: '',
        date: '',
        number: ''
    },
    items: [],
    subtotal: 0,
    iva: 0,
    total: 0,
    includeIVA: true,
    logo: ''
};

let savedBudgets = [];

// Logo fijo - siempre usar este logo
const FIXED_LOGO = 'data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgNDY1IDMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4NCiAgPCEtLSBHcmF5IGFyZWEgKHRvcC1sZWZ0KSAtLT4NCiAgPHJlY3QgeD0iMjAiIHk9IjMxIiB3aWR0aD0iODUiIGhlaWdodD0iMTc2IiBmaWxsPSIjOTk5OTk5Ii8+DQogIA0KICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKICAKAG==';

let globalLogo = FIXED_LOGO;

// Cargar presupuestos guardados del localStorage al iniciar
document.addEventListener('DOMContentLoaded', () => {
    loadSavedBudgets();
    loadGlobalLogo();
    syncLogoToServer(); // Guardar el logo actual en el servidor
    setTodayDate();
    generateBudgetNumber();
    initLogoUpload();
    initIVAToggle();
    initPDFExport();
    initStorageTools();
    loadItemDescriptions();
});

// Establecer la fecha actual
function setTodayDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('budgetDate').value = today;
}

// Generar número de presupuesto automático
function generateBudgetNumber() {
    const budgetNumber = String(savedBudgets.length + 1).padStart(3, '0');
    document.getElementById('budgetNumber').value = budgetNumber;
}

// Agregar artículo
document.getElementById('addItemBtn').addEventListener('click', () => {
    const description = document.getElementById('itemDescription').value.trim();
    const quantity = parseFloat(document.getElementById('itemQuantity').value);
    const price = parseFloat(document.getElementById('itemPrice').value);

    if (!description || !quantity || price < 0 || isNaN(price)) {
        alert('Por favor, complete todos los campos del artículo correctamente');
        return;
    }

    const addBtn = document.getElementById('addItemBtn');
    const editingId = addBtn.dataset.editingId;

    if (editingId) {
        // Modo edición: actualizar artículo existente
        const item = currentBudget.items.find(i => i.id === parseInt(editingId));
        if (item) {
            item.description = description;
            item.quantity = quantity;
            item.price = price;
            item.subtotal = quantity * price;

            // Actualizar la fila en la tabla
            const row = document.querySelector(`tr[data-id="${editingId}"]`);
            row.querySelector('td:nth-child(1)').textContent = item.description;
            row.querySelector('td:nth-child(2)').textContent = item.quantity;
            row.querySelector('td:nth-child(3)').textContent = `${item.price.toFixed(2)}€`;
            row.querySelector('td:nth-child(4)').textContent = `${item.subtotal.toFixed(2)}€`;
        }

        // Restaurar botón a modo agregar
        addBtn.textContent = 'Agregar Artículo';
        addBtn.classList.remove('btn-warning');
        addBtn.classList.add('btn-primary');
        delete addBtn.dataset.editingId;
    } else {
        // Modo agregar: crear nuevo artículo
        const item = {
            id: Date.now(),
            description,
            quantity,
            price,
            subtotal: quantity * price
        };

        currentBudget.items.push(item);
        addItemToTable(item);
        
        // Guardar descripción en el servidor para autocompletar futuro
        saveItemDescription(description);
    }

    calculateTotals();
    clearItemInputs();
});

// Agregar artículo a la tabla
function addItemToTable(item) {
    const tbody = document.getElementById('itemsTableBody');
    const row = document.createElement('tr');
    row.dataset.id = item.id;

    row.innerHTML = `
        <td>${item.description}</td>
        <td>${item.quantity}</td>
        <td>${item.price.toFixed(2)}€</td>
        <td>${item.subtotal.toFixed(2)}€</td>
        <td>
            <button class="btn btn-info btn-small" onclick="editItem(${item.id})">Editar</button>
            <button class="btn btn-danger" onclick="removeItem(${item.id})">Eliminar</button>
        </td>
    `;

    tbody.appendChild(row);
}

// Eliminar artículo
function removeItem(itemId) {
    currentBudget.items = currentBudget.items.filter(item => item.id !== itemId);
    document.querySelector(`tr[data-id="${itemId}"]`).remove();
    calculateTotals();
}

// Editar artículo
function editItem(itemId) {
    const item = currentBudget.items.find(i => i.id === itemId);
    if (!item) return;

    // Cargar datos en el formulario
    document.getElementById('itemDescription').value = item.description;
    document.getElementById('itemQuantity').value = item.quantity;
    document.getElementById('itemPrice').value = item.price;

    // Cambiar el botón a modo edición
    const addBtn = document.getElementById('addItemBtn');
    addBtn.textContent = 'Actualizar Artículo';
    addBtn.classList.remove('btn-primary');
    addBtn.classList.add('btn-warning');
    addBtn.dataset.editingId = itemId;

    // Scroll al formulario
    document.querySelector('.items-section').scrollIntoView({ behavior: 'smooth' });
}

// Calcular totales
function calculateTotals() {
    const subtotal = currentBudget.items.reduce((sum, item) => sum + item.subtotal, 0);
    const includeIVA = document.getElementById('includeIVA').checked;
    const iva = includeIVA ? subtotal * 0.21 : 0;
    const total = subtotal + iva;

    currentBudget.subtotal = subtotal;
    currentBudget.iva = iva;
    currentBudget.total = total;
    currentBudget.includeIVA = includeIVA;

    document.getElementById('subtotal').textContent = `${subtotal.toFixed(2)}€`;
    document.getElementById('iva').textContent = `${iva.toFixed(2)}€`;
    document.getElementById('total').textContent = `${total.toFixed(2)}€`;
}

// Limpiar inputs de artículos
function clearItemInputs() {
    document.getElementById('itemDescription').value = '';
    document.getElementById('itemQuantity').value = '1';
    document.getElementById('itemPrice').value = '';
    document.getElementById('itemDescription').focus();
}

// Guardar presupuesto
document.getElementById('saveBudgetBtn').addEventListener('click', () => {
    const clientName = document.getElementById('clientName').value.trim();
    const clientEmail = document.getElementById('clientEmail').value.trim();
    const budgetDate = document.getElementById('budgetDate').value;
    const budgetNumber = document.getElementById('budgetNumber').value.trim();

    if (!clientName || !budgetDate || !budgetNumber) {
        alert('Por favor, complete la información del cliente');
        return;
    }

    if (currentBudget.items.length === 0) {
        alert('Agregue al menos un artículo al presupuesto');
        return;
    }

    currentBudget.client = {
        name: clientName,
        email: clientEmail,
        date: budgetDate,
        number: budgetNumber
    };

    const budgetToSave = JSON.parse(JSON.stringify(currentBudget));
    budgetToSave.savedAt = new Date().toISOString();
    
    // Si tiene ID, es una edición (sobreescribir)
    if (currentBudget.id) {
        const index = savedBudgets.findIndex(b => b.id === currentBudget.id);
        if (index !== -1) {
            budgetToSave.id = currentBudget.id;
            budgetToSave.createdAt = savedBudgets[index].createdAt; // Mantener fecha de creación original
            savedBudgets[index] = budgetToSave;
            alert('Presupuesto actualizado exitosamente');
        }
    } else {
        // Nuevo presupuesto
        budgetToSave.id = Date.now();
        budgetToSave.createdAt = new Date().toISOString();
        savedBudgets.push(budgetToSave);
            alert('Presupuesto guardado exitosamente');
            updateStorageStatus();
    }

    localStorage.setItem('budgets', JSON.stringify(savedBudgets));
    
    // Sync budget to server
    syncBudgetToServer(budgetToSave);
    
    displaySavedBudgets();
        updateStorageStatus();
});

// Imprimir presupuesto
document.getElementById('printBudgetBtn').addEventListener('click', () => {
    if (currentBudget.items.length === 0) {
        alert('Agregue artículos antes de imprimir');
        return;
    }
    window.print();
});

// Nuevo presupuesto
document.getElementById('newBudgetBtn').addEventListener('click', () => {
    if (confirm('¿Está seguro de crear un nuevo presupuesto? Los datos no guardados se perderán.')) {
        resetBudget();
    }
});

// Resetear presupuesto
function resetBudget() {
    currentBudget = {
        id: null,
        client: { name: '', email: '', date: '', number: '' },
        items: [],
        subtotal: 0,
        iva: 0,
        total: 0,
        includeIVA: true,
        logo: globalLogo
    };

    document.getElementById('clientName').value = '';
    document.getElementById('clientEmail').value = '';
    document.getElementById('itemsTableBody').innerHTML = '';
    document.getElementById('includeIVA').checked = true;
    clearItemInputs();
    calculateTotals();
    setTodayDate();
    generateBudgetNumber();
    
    // Actualizar botón de guardar
    const saveBtn = document.getElementById('saveBudgetBtn');
    saveBtn.textContent = 'Guardar Presupuesto';
    saveBtn.classList.remove('btn-warning');
    saveBtn.classList.add('btn-success');
}

// Cargar presupuestos guardados
function loadSavedBudgets() {
    const stored = localStorage.getItem('budgets');
    if (stored) {
        savedBudgets = JSON.parse(stored);
        displaySavedBudgets();
    }
    // Attempt to load from server and merge
    loadBudgetsFromServer();
}

// Mostrar estado del almacenamiento y conectar botones de import/export
function initStorageTools() {
    updateStorageStatus();

    const exportBtn = document.getElementById('exportDataBtn');
    const importInput = document.getElementById('importData');

    exportBtn.addEventListener('click', () => {
        const data = {
            globalLogo: localStorage.getItem('globalLogo') || null,
            budgets: JSON.parse(localStorage.getItem('budgets') || '[]')
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `presupuestos_backup_${new Date().toISOString().slice(0,10)}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    });

    importInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const parsed = JSON.parse(ev.target.result);
                if (parsed.globalLogo) {
                    // Do NOT overwrite an existing logo: logo is fixed
                    if (!localStorage.getItem('globalLogo')) {
                        localStorage.setItem('globalLogo', parsed.globalLogo);
                        loadGlobalLogo();
                    } else {
                        console.info('Import contained a logo but an existing fixed logo is kept.');
                    }
                }
                if (Array.isArray(parsed.budgets)) {
                    // Merge budgets safely, preserving existing createdAt
                    const existing = JSON.parse(localStorage.getItem('budgets') || '[]');
                    const merged = existing.concat(parsed.budgets);
                    localStorage.setItem('budgets', JSON.stringify(merged));
                    loadSavedBudgets();
                }
                updateStorageStatus();
                alert('Importación completa');
            } catch (err) {
                alert('Error leyendo el archivo: ' + err.message);
            }
        };
        reader.readAsText(file);
    });
}

// Mostrar modal con contenido de localStorage
function showStorageModal() {
    const modal = document.getElementById('storageModal');
    const dump = document.getElementById('storageDump');
    const all = {
        globalLogo: localStorage.getItem('globalLogo') || null,
        budgets: JSON.parse(localStorage.getItem('budgets') || '[]')
    };
    dump.textContent = JSON.stringify(all, null, 2);
    modal.style.display = 'flex';
}

function closeStorageModal() {
    const modal = document.getElementById('storageModal');
    modal.style.display = 'none';
}

// Connect modal buttons
document.addEventListener('DOMContentLoaded', () => {
    const viewBtn = document.getElementById('viewDataBtn');
    if (viewBtn) viewBtn.addEventListener('click', showStorageModal);

    const closeBtn = document.getElementById('closeStorageModal');
    if (closeBtn) closeBtn.addEventListener('click', closeStorageModal);
});

function updateStorageStatus() {
    const statusEl = document.getElementById('storageStatus');
    const budgets = JSON.parse(localStorage.getItem('budgets') || '[]');
    const hasLogo = !!localStorage.getItem('globalLogo');
    statusEl.textContent = `Presupuestos guardados: ${budgets.length} — Logo cargado: ${hasLogo ? 'Sí' : 'No'}`;
}

// Mostrar presupuestos guardados
function displaySavedBudgets() {
    const container = document.getElementById('savedBudgetsList');
    
    if (savedBudgets.length === 0) {
        container.innerHTML = '<div class="empty-state">No hay presupuestos guardados</div>';
        return;
    }

    // Ordenar por fecha de creación (más reciente primero)
    const sortedBudgets = [...savedBudgets].sort((a, b) => {
        const dateA = new Date(a.createdAt || a.savedAt);
        const dateB = new Date(b.createdAt || b.savedAt);
        return dateB - dateA;
    });

    container.innerHTML = sortedBudgets.map((budget) => {
        const index = savedBudgets.findIndex(b => String(b.id) === String(budget.id));
        return `
        <div class="budget-card">
            <h3>${budget.client.name}</h3>
            <p><strong>Nº:</strong> ${budget.client.number}</p>
            <p><strong>Fecha:</strong> ${formatDate(budget.client.date)}</p>
            <p><strong>Artículos:</strong> ${budget.items.length}</p>
            <p class="budget-total">Total: ${budget.total.toFixed(2)}€</p>
            <div class="budget-card-actions">
                <button class="btn btn-info btn-small" onclick="editBudget(${index})">Editar</button>
                <button class="btn btn-secondary btn-small" onclick="useAsTemplate(${index})">Reutilizar</button>
                <button class="btn btn-success btn-small" onclick="exportBudgetToPDF(${index})">Exportar</button>
                <button class="btn btn-danger" onclick="deleteBudget(${index})">Eliminar</button>
            </div>
        </div>
    `;
    }).join('');
}

// Editar presupuesto guardado (sobreescribir)
function editBudget(index) {
    const budget = savedBudgets[index];
    
    // Cargar ID para sobreescribir
    currentBudget.id = budget.id;
    
    document.getElementById('clientName').value = budget.client.name;
    document.getElementById('clientEmail').value = budget.client.email;
    document.getElementById('budgetDate').value = budget.client.date;
    document.getElementById('budgetNumber').value = budget.client.number;
    document.getElementById('includeIVA').checked = budget.includeIVA !== false;

    currentBudget.items = JSON.parse(JSON.stringify(budget.items));
    currentBudget.includeIVA = budget.includeIVA !== false;
    
    const tbody = document.getElementById('itemsTableBody');
    tbody.innerHTML = '';
    
    currentBudget.items.forEach(item => {
        addItemToTable(item);
    });

    calculateTotals();
    
    // Cambiar botón a modo edición
    const saveBtn = document.getElementById('saveBudgetBtn');
    saveBtn.textContent = 'Actualizar Presupuesto';
    saveBtn.classList.remove('btn-success');
    saveBtn.classList.add('btn-warning');
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Usar presupuesto como base (nuevo presupuesto con mismos artículos)
function useAsTemplate(index) {
    // Guardar seguridad: comprobar índice válido
    if (typeof index !== 'number' || index < 0 || index >= savedBudgets.length) {
        alert('No se pudo cargar el presupuesto para reutilizar. Por favor, recargue la página e inténtelo de nuevo.');
        return;
    }

    const budget = savedBudgets[index];
    if (!budget) {
        alert('Presupuesto no encontrado');
        return;
    }

    // NO cargar ID (será nuevo presupuesto)
    currentBudget.id = null;

    // Cargar datos del cliente para facilitar la reutilización
    document.getElementById('clientName').value = budget.client?.name || '';
    document.getElementById('clientEmail').value = budget.client?.email || '';
    document.getElementById('includeIVA').checked = budget.includeIVA !== false;

    currentBudget.items = JSON.parse(JSON.stringify(budget.items || []));
    currentBudget.includeIVA = budget.includeIVA !== false;

    const tbody = document.getElementById('itemsTableBody');
    tbody.innerHTML = '';

    currentBudget.items.forEach(item => {
        addItemToTable(item);
    });

    calculateTotals();
    setTodayDate();
    generateBudgetNumber();

    // Asegurar que está en modo crear
    const saveBtn = document.getElementById('saveBudgetBtn');
    saveBtn.textContent = 'Guardar Presupuesto';
    saveBtn.classList.remove('btn-warning');
    saveBtn.classList.add('btn-success');

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Eliminar presupuesto
function deleteBudget(index) {
    if (confirm('¿Está seguro de eliminar este presupuesto?')) {
        const budgetId = savedBudgets[index]?.id;
        savedBudgets.splice(index, 1);
        localStorage.setItem('budgets', JSON.stringify(savedBudgets));
        
        // Sync deletion to server
        if (budgetId) {
            syncDeleteToServer(budgetId);
        }
        
        displaySavedBudgets();
            updateStorageStatus();
    }
}

// Exportar presupuesto guardado a PDF
function exportBudgetToPDF(index) {
    const budget = savedBudgets[index];
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Función para añadir pie de página legal
    const addLegalFooter = (pageNumber) => {
        const pageHeight = doc.internal.pageSize.height;
        let footerY = pageHeight - 35;
        
        doc.setFontSize(6);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(80, 80, 80);
        doc.text('CONDICIONES:', 15, footerY);
        
        doc.setFont(undefined, 'normal');
        doc.setFontSize(5.5);
        const conditions = 'Validez: 30 días. Forma de pago: según lo acordado. Este presupuesto no incluye IVA salvo indicación expresa. ' +
            'Los precios están sujetos a variaciones. La aceptación implica conformidad con estas condiciones.';
        const conditionLines = doc.splitTextToSize(conditions, 180);
        footerY += 3;
        conditionLines.forEach(line => {
            doc.text(line, 15, footerY);
            footerY += 2.5;
        });
        
        footerY += 1;
        doc.setFont(undefined, 'bold');
        doc.setFontSize(6);
        doc.text('PROTECCIÓN DE DATOS:', 15, footerY);
        
        doc.setFont(undefined, 'normal');
        doc.setFontSize(5.5);
        footerY += 3;
        const privacy = 'En cumplimiento del RGPD (UE) 2016/679 y LOPDGDD 3/2018, los datos serán tratados confidencialmente por GutNes para gestión comercial. ' +
            'Derechos de acceso, rectificación y supresión dirigiéndose a GutNes.';
        const privacyLines = doc.splitTextToSize(privacy, 180);
        privacyLines.forEach(line => {
            doc.text(line, 15, footerY);
            footerY += 2.5;
        });
        
        // Número de página
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Página ${pageNumber}`, 105, pageHeight - 10, { align: 'center' });
    };
    
    let yPosition = 20;
    let pageNumber = 1;
    
    // Añadir logo si existe
    if (budget.logo) {
        try {
            doc.addImage(budget.logo, 'PNG', 15, yPosition, 40, 30);
        } catch (error) {
            console.log('Error al añadir logo:', error);
        }
    }
    
    // Nombre de la empresa
    doc.setFontSize(16);
    doc.setTextColor(102, 126, 234);
    doc.setFont(undefined, 'bold');
    doc.text('GutNes', 105, yPosition + 5, { align: 'center' });
    
    // Título
    doc.setFontSize(20);
    doc.setFont(undefined, 'normal');
    doc.text('PRESUPUESTO', 105, yPosition + 15, { align: 'center' });
    
    yPosition += 35;
    
    // Información del cliente
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Cliente: ${budget.client.name || 'N/A'}`, 15, yPosition);
    yPosition += 7;
    doc.text(`Email: ${budget.client.email || 'N/A'}`, 15, yPosition);
    yPosition += 7;
    doc.text(`Fecha: ${formatDate(budget.client.date)}`, 15, yPosition);
    yPosition += 7;
    doc.text(`Nº Presupuesto: ${budget.client.number}`, 15, yPosition);
    
    yPosition += 15;
    
    // Tabla de artículos
    doc.setFillColor(102, 126, 234);
    doc.rect(15, yPosition, 180, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text('Descripción', 17, yPosition + 5);
    doc.text('Cant.', 120, yPosition + 5);
    doc.text('Precio', 145, yPosition + 5);
    doc.text('Subtotal', 170, yPosition + 5);
    
    yPosition += 12;
    doc.setTextColor(0, 0, 0);
    
    budget.items.forEach((item) => {
        if (yPosition > 235) {
            addLegalFooter(pageNumber);
            doc.addPage();
            pageNumber++;
            yPosition = 20;
        }
        
        // Dividir descripción en múltiples líneas si es muy larga
        const maxWidth = 100;
        const description = item.description;
        const lines = doc.splitTextToSize(description, maxWidth);
        
        // Imprimir todas las líneas de la descripción
        lines.forEach((line, lineIndex) => {
            if (yPosition > 235) {
                addLegalFooter(pageNumber);
                doc.addPage();
                pageNumber++;
                yPosition = 20;
            }
            
            doc.text(line, 17, yPosition);
            
            // Solo imprimir cantidad, precio y subtotal en la primera línea
            if (lineIndex === 0) {
                doc.text(item.quantity.toString(), 120, yPosition);
                doc.text(`${item.price.toFixed(2)}€`, 162, yPosition, { align: 'right' });
                doc.text(`${item.subtotal.toFixed(2)}€`, 192, yPosition, { align: 'right' });
            }
            
            yPosition += 5;
        });
        
        yPosition += 2; // Espacio extra entre artículos
    });
    
    yPosition += 10;
    
    // Totales alineados con las columnas
    doc.setDrawColor(200, 200, 200);
    doc.line(120, yPosition, 195, yPosition);
    yPosition += 7;
    
    doc.setFontSize(11);
    doc.text('Subtotal:', 120, yPosition);
    doc.text(`${budget.subtotal.toFixed(2)}€`, 192, yPosition, { align: 'right' });
    yPosition += 7;
    
    if (budget.includeIVA !== false) {
        doc.text('IVA (21%):', 120, yPosition);
        doc.text(`${budget.iva.toFixed(2)}€`, 192, yPosition, { align: 'right' });
        yPosition += 7;
    }
    
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(102, 126, 234);
    doc.text('TOTAL:', 120, yPosition);
    doc.text(`${budget.total.toFixed(2)}€`, 192, yPosition, { align: 'right' });
    
    yPosition += 15;
    
    // Información bancaria
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('DATOS BANCARIOS:', 15, yPosition);
    yPosition += 8;
    
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    doc.text('Cuenta bancaria: ES87 1563 2626 3232 6953 8771', 15, yPosition);
    yPosition += 6;
    doc.text('Beneficiario: Juan Carlos Gutiérrez Rodríguez', 15, yPosition);
    
    // Añadir pie de página legal en la última página
    addLegalFooter(pageNumber);
    
    // Guardar PDF con nombre estructurado
    const budgetNumber = budget.client.number || 'XXX';
    const clientName = budget.client.name || 'Cliente';
    const fileName = `GutNes_Ppto_${budgetNumber}_${clientName}.pdf`;
    doc.save(fileName);
}

// Formatear fecha
function formatDate(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Permitir agregar artículos con Enter
document.getElementById('itemPrice').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('addItemBtn').click();
    }
});

// Inicializar carga de logotipo
function initLogoUpload() {
    const logoContainer = document.getElementById('logoContainer');
    const logoInput = document.getElementById('logoInput');
    const companyLogo = document.getElementById('companyLogo');
    const logoPlaceholder = document.getElementById('logoPlaceholder');
    
    if (logoContainer && logoInput) {
        // Click en el contenedor del logo abre el diálogo de archivo
        logoContainer.addEventListener('click', () => {
            logoInput.click();
        });
        
        // Cambio en el input de archivo
        logoInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const logoData = event.target.result;
                    globalLogo = logoData;
                    currentBudget.logo = logoData;
                    
                    // Mostrar logo y ocultar placeholder
                    companyLogo.src = logoData;
                    companyLogo.style.display = 'block';
                    if (logoPlaceholder) {
                        logoPlaceholder.style.display = 'none';
                    }
                    
                    // Sincronizar con servidor
                    saveItemDescription(logoData);
                };
                reader.readAsDataURL(file);
            }
        });
    }
}

// Cargar logo global
function loadGlobalLogo() {
    // Cargar logo fijo como predeterminado
    const companyLogo = document.getElementById('companyLogo');
    const logoPlaceholder = document.getElementById('logoPlaceholder');
    
    if (companyLogo) {
        companyLogo.src = FIXED_LOGO;
        companyLogo.style.display = 'block';
        // Ocultar placeholder si hay logo
        if (logoPlaceholder) {
            logoPlaceholder.style.display = 'none';
        }
    }
    
    currentBudget.logo = FIXED_LOGO;
    globalLogo = FIXED_LOGO;
}

// Cargar descripciones de artículos desde el servidor para autocompletar
async function loadItemDescriptions() {
    try {
        const response = await fetch('/api/items');
        if (!response.ok) {
            console.info('Could not load item descriptions');
            return;
        }
        const data = await response.json();
        populateDescriptionList(data.items || []);
    } catch (error) {
        console.info('Could not load item descriptions:', error.message);
    }
}

// Poblar el datalist con descripciones
function populateDescriptionList(descriptions) {
    const datalist = document.getElementById('descriptionList');
    if (!datalist) return;
    
    datalist.innerHTML = '';
    descriptions.forEach(desc => {
        const option = document.createElement('option');
        option.value = desc;
        datalist.appendChild(option);
    });
}

// Guardar nueva descripción de artículo en el servidor
async function saveItemDescription(description) {
    try {
        const response = await fetch('/api/items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ description: description.trim() })
        });
        if (response.ok) {
            // Recargar lista de descripciones
            loadItemDescriptions();
        }
    } catch (error) {
        console.info('Could not save item description:', error.message);
    }
}


// Inicializar toggle de IVA
function initIVAToggle() {
    const ivaCheckbox = document.getElementById('includeIVA');
    if (!ivaCheckbox) {
        console.warn('IVA checkbox not found in DOM');
        return;
    }
    ivaCheckbox.addEventListener('change', () => {
        console.log('IVA checkbox changed, recalculating totals');
        calculateTotals();
    });
    // Also listen to click for better browser compatibility
    ivaCheckbox.addEventListener('click', () => {
        console.log('IVA checkbox clicked, recalculating totals');
        calculateTotals();
    });
}

// Inicializar exportación a PDF
function initPDFExport() {
    document.getElementById('exportPDFBtn').addEventListener('click', exportToPDF);
}

// Exportar a PDF
async function exportToPDF() {
    if (currentBudget.items.length === 0) {
        alert('Agregue artículos antes de exportar a PDF');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Función para añadir pie de página legal
    const addLegalFooter = (pageNumber) => {
        const pageHeight = doc.internal.pageSize.height;
        let footerY = pageHeight - 35;
        
        doc.setFontSize(6);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(80, 80, 80);
        doc.text('CONDICIONES:', 15, footerY);
        
        doc.setFont(undefined, 'normal');
        doc.setFontSize(5.5);
        const conditions = 'Validez: 30 días. Forma de pago: según lo acordado. Este presupuesto no incluye IVA salvo indicación expresa. ' +
            'Los precios están sujetos a variaciones. La aceptación implica conformidad con estas condiciones.';
        const conditionLines = doc.splitTextToSize(conditions, 180);
        footerY += 3;
        conditionLines.forEach(line => {
            doc.text(line, 15, footerY);
            footerY += 2.5;
        });
        
        footerY += 1;
        doc.setFont(undefined, 'bold');
        doc.setFontSize(6);
        doc.text('PROTECCIÓN DE DATOS:', 15, footerY);
        
        doc.setFont(undefined, 'normal');
        doc.setFontSize(5.5);
        footerY += 3;
        const privacy = 'En cumplimiento del RGPD (UE) 2016/679 y LOPDGDD 3/2018, los datos serán tratados confidencialmente por GutNes para gestión comercial. ' +
            'Derechos de acceso, rectificación y supresión dirigiéndose a GutNes.';
        const privacyLines = doc.splitTextToSize(privacy, 180);
        privacyLines.forEach(line => {
            doc.text(line, 15, footerY);
            footerY += 2.5;
        });
        
        // Número de página
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Página ${pageNumber}`, 105, pageHeight - 10, { align: 'center' });
    };
    
    let yPosition = 20;
    let pageNumber = 1;
    
    // Añadir logo (usa el logo actual, ya sea el predeterminado o uno personalizado)
    try {
        const logoToUse = globalLogo || FIXED_LOGO;
        doc.addImage(logoToUse, 'PNG', 15, yPosition, 40, 30);
    } catch (error) {
        console.log('Error al añadir logo:', error);
    }
    
    // Nombre de la empresa
    doc.setFontSize(16);
    doc.setTextColor(102, 126, 234);
    doc.setFont(undefined, 'bold');
    doc.text('GutNes', 105, yPosition + 5, { align: 'center' });
    
    // Título
    doc.setFontSize(20);
    doc.setFont(undefined, 'normal');
    doc.text('PRESUPUESTO', 105, yPosition + 15, { align: 'center' });
    
    yPosition += 35;
    
    // Información del cliente
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Cliente: ${document.getElementById('clientName').value || 'N/A'}`, 15, yPosition);
    yPosition += 7;
    doc.text(`Email: ${document.getElementById('clientEmail').value || 'N/A'}`, 15, yPosition);
    yPosition += 7;
    doc.text(`Fecha: ${formatDate(document.getElementById('budgetDate').value)}`, 15, yPosition);
    yPosition += 7;
    doc.text(`Nº Presupuesto: ${document.getElementById('budgetNumber').value}`, 15, yPosition);
    
    yPosition += 15;
    
    // Tabla de artículos
    doc.setFillColor(102, 126, 234);
    doc.rect(15, yPosition, 180, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text('Descripción', 17, yPosition + 5);
    doc.text('Cant.', 120, yPosition + 5);
    doc.text('Precio', 145, yPosition + 5);
    doc.text('Subtotal', 170, yPosition + 5);
    
    yPosition += 12;
    doc.setTextColor(0, 0, 0);
    
    currentBudget.items.forEach((item) => {
        if (yPosition > 235) {
            addLegalFooter(pageNumber);
            doc.addPage();
            pageNumber++;
            yPosition = 20;
        }
        
        // Dividir descripción en múltiples líneas si es muy larga
        const maxWidth = 100;
        const description = item.description;
        const lines = doc.splitTextToSize(description, maxWidth);
        
        // Imprimir todas las líneas de la descripción
        lines.forEach((line, lineIndex) => {
            if (yPosition > 235) {
                addLegalFooter(pageNumber);
                doc.addPage();
                pageNumber++;
                yPosition = 20;
            }
            
            doc.text(line, 17, yPosition);
            
            // Solo imprimir cantidad, precio y subtotal en la primera línea
            if (lineIndex === 0) {
                doc.text(item.quantity.toString(), 120, yPosition);
                doc.text(`${item.price.toFixed(2)}€`, 162, yPosition, { align: 'right' });
                doc.text(`${item.subtotal.toFixed(2)}€`, 192, yPosition, { align: 'right' });
            }
            
            yPosition += 5;
        });
        
        yPosition += 2; // Espacio extra entre artículos
    });
    
    yPosition += 10;
    
    // Totales alineados con las columnas
    doc.setDrawColor(200, 200, 200);
    doc.line(120, yPosition, 195, yPosition);
    yPosition += 7;
    
    doc.setFontSize(11);
    doc.text('Subtotal:', 120, yPosition);
    doc.text(`${currentBudget.subtotal.toFixed(2)}€`, 192, yPosition, { align: 'right' });
    yPosition += 7;
    
    if (currentBudget.includeIVA) {
        doc.text('IVA (21%):', 120, yPosition);
        doc.text(`${currentBudget.iva.toFixed(2)}€`, 192, yPosition, { align: 'right' });
        yPosition += 7;
    }
    
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(102, 126, 234);
    doc.text('TOTAL:', 120, yPosition);
    doc.text(`${currentBudget.total.toFixed(2)}€`, 192, yPosition, { align: 'right' });
    
    yPosition += 15;
    
    // Información bancaria
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('DATOS BANCARIOS:', 15, yPosition);
    yPosition += 8;
    
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    doc.text('Cuenta bancaria: ES87 1563 2626 3232 6953 8771', 15, yPosition);
    yPosition += 6;
    doc.text('Beneficiario: Juan Carlos Gutiérrez Rodríguez', 15, yPosition);
    
    // Añadir pie de página legal en la última página
    addLegalFooter(pageNumber);
    
    // Guardar PDF con nombre estructurado
    const budgetNumber = document.getElementById('budgetNumber').value || 'XXX';
    const clientName = document.getElementById('clientName').value || 'Cliente';
    const fileName = `GutNes_Ppto_${budgetNumber}_${clientName}.pdf`;
    doc.save(fileName);
}

// === SERVER SYNC FUNCTIONS ===

// Try to sync a logo to the server
async function syncLogoToServer() {
    // Sincronizar logo fijo al servidor
    try {
        const response = await fetch('/api/logo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ logo: FIXED_LOGO })
        });
        if (!response.ok) {
            console.info('Could not sync fixed logo to server (not critical):', response.statusText);
        } else {
            console.log('Fixed logo synced to server');
        }
    } catch (error) {
        console.info('Could not sync logo to server (backend may be offline):', error.message);
    }
}

// Try to sync a budget to the server
async function syncBudgetToServer(budget) {
    try {
        const response = await fetch('/api/budgets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(budget)
        });
        if (!response.ok) {
            console.warn('Failed to sync budget to server:', response.statusText);
        } else {
            console.log('Budget synced to server:', budget.id);
        }
    } catch (error) {
        console.warn('Could not sync to server (backend may be offline):', error.message);
    }
}

// Try to sync a deletion to the server
async function syncDeleteToServer(budgetId) {
    try {
        const response = await fetch(`/api/budgets/${budgetId}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            console.warn('Failed to delete budget on server:', response.statusText);
        } else {
            console.log('Budget deleted from server:', budgetId);
        }
    } catch (error) {
        console.warn('Could not delete from server (backend may be offline):', error.message);
    }
}

// Try to load budgets from the server and merge with localStorage
async function loadBudgetsFromServer() {
    try {
        const response = await fetch('/api/budgets');
        if (!response.ok) {
            console.info('Server budgets not available');
            return;
        }
        const serverBudgets = await response.json();
        
        // Merge: keep local-only and add server-only budgets
        const localIds = new Set(savedBudgets.map(b => b.id));
        const serverOnlyBudgets = serverBudgets.filter(sb => !localIds.has(sb.id));
        
        // Combine local + server-only, avoiding duplicates
        savedBudgets = [...savedBudgets, ...serverOnlyBudgets];
        localStorage.setItem('budgets', JSON.stringify(savedBudgets));
        displaySavedBudgets();
        
        console.log('Merged server budgets with local storage');
    } catch (error) {
        console.info('Could not load budgets from server:', error.message);
    }
}

// Try to load logo from the server
async function loadLogoFromServer() {
    // El logo está siempre fijo, no necesario cargar desde servidor
    // La constante FIXED_LOGO se usa en todas partes
}
