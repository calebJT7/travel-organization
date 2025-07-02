// Estado de la aplicación
let appState = {
    trips: [],
    todos: [],
    expenses: [],
    currentUser: null,
    theme: 'light',
    fabMenuOpen: false
};

// Utilidades
const Utils = {
    formatDate: (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    },

    formatCurrency: (amount) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS'
        }).format(amount);
    },

    generateId: () => {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    validateEmail: (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    calculateDaysBetween: (startDate, endDate) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const timeDiff = end.getTime() - start.getTime();
        return Math.ceil(timeDiff / (1000 * 3600 * 24));
    }
};

// Gestión de datos (reemplaza localStorage por variables en memoria)
const DataManager = {
    data: {
        users: [],
        currentUser: null,
        trips: [],
        todos: [],
        expenses: []
    },

    saveData: function() {
        // En un entorno real, aquí guardarías en localStorage
        // localStorage.setItem('travelPlannerData', JSON.stringify(this.data));
        console.log('Datos guardados en memoria');
    },

    loadData: function() {
        // En un entorno real, aquí cargarías desde localStorage
        // const saved = localStorage.getItem('travelPlannerData');
        // if (saved) {
        //     this.data = JSON.parse(saved);
        // }
        console.log('Datos cargados desde memoria');
    },

    getCurrentUser: function() {
        return this.data.currentUser;
    },

    setCurrentUser: function(user) {
        this.data.currentUser = user;
        this.saveData();
    }
};

// Notificaciones Toast
const Toast = {
    show: function(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <i class="fas ${this.getIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 100);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => document.body.removeChild(toast), 300);
        }, duration);
    },

    getIcon: function(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    }
};

// Gestión de Viajes
const TripManager = {
    add: function(tripData) {
        const trip = {
            id: Utils.generateId(),
            ...tripData,
            createdAt: new Date().toISOString(),
            userId: DataManager.getCurrentUser()?.id
        };
        
        appState.trips.push(trip);
        DataManager.data.trips.push(trip);
        DataManager.saveData();
        
        this.render();
        this.updateStats();
        Toast.show('Viaje agregado exitosamente', 'success');
    },

    delete: function(id) {
        if (confirm('¿Estás seguro de que quieres eliminar este viaje?')) {
            appState.trips = appState.trips.filter(trip => trip.id !== id);
            DataManager.data.trips = DataManager.data.trips.filter(trip => trip.id !== id);
            DataManager.saveData();
            
            this.render();
            this.updateStats();
            Toast.show('Viaje eliminado', 'info');
        }
    },

    edit: function(id) {
        const trip = appState.trips.find(t => t.id === id);
        if (trip) {
            // Llenar el formulario con los datos del viaje
            document.getElementById('destination').value = trip.destination;
            document.getElementById('startDate').value = trip.startDate;
            document.getElementById('endDate').value = trip.endDate;
            document.getElementById('budget').value = trip.budget;
            document.getElementById('description').value = trip.description || '';
            
            // Cambiar el comportamiento del formulario para editar
            const form = document.getElementById('tripForm');
            form.dataset.editId = id;
            
            toggleModal('tripModal');
        }
    },

    render: function() {
        const container = document.getElementById('tripCards');
        
        if (appState.trips.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                    <i class="fas fa-map-marker-alt" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                    <h3>No hay viajes planeados</h3>
                    <p>¡Agrega tu primer viaje y comienza a planificar!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = appState.trips.map(trip => `
            <div class="trip-card animate-fade-in-scale">
                <div class="trip-header">
                    <div>
                        <h3 class="trip-destination">${trip.destination}</h3>
                        <div class="trip-dates">
                            <i class="fas fa-calendar"></i>
                            ${Utils.formatDate(trip.startDate)} - ${Utils.formatDate(trip.endDate)}
                        </div>
                    </div>
                </div>
                
                <div class="trip-budget">
                    <i class="fas fa-dollar-sign"></i>
                    Presupuesto: ${Utils.formatCurrency(trip.budget)}
                </div>
                
                ${trip.description ? `<p style="margin-top: 1rem; opacity: 0.9;">${trip.description}</p>` : ''}
                
                <div class="trip-actions">
                    <button class="btn-sm btn-edit" onclick="TripManager.edit('${trip.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-sm btn-delete" onclick="TripManager.delete('${trip.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    },

    updateStats: function() {
        const totalTrips = appState.trips.length;
        const totalBudget = appState.trips.reduce((sum, trip) => sum + trip.budget, 0);
        
        document.getElementById('totalTrips').textContent = totalTrips;
        document.getElementById('totalBudget').textContent = Utils.formatCurrency(totalBudget);
    }
};

// Gestión de Tareas
const TodoManager = {
    add: function(todoData) {
        const todo = {
            id: Utils.generateId(),
            ...todoData,
            completed: false,
            createdAt: new Date().toISOString(),
            userId: DataManager.getCurrentUser()?.id
        };
        
        appState.todos.push(todo);
        DataManager.data.todos.push(todo);
        DataManager.saveData();
        
        this.render();
        this.updateStats();
        Toast.show('Tarea agregada exitosamente', 'success');
    },

    toggle: function(id) {
        const todo = appState.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            DataManager.saveData();
            this.render();
            this.updateStats();
        }
    },

    delete: function(id) {
        if (confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
            appState.todos = appState.todos.filter(todo => todo.id !== id);
            DataManager.data.todos = DataManager.data.todos.filter(todo => todo.id !== id);
            DataManager.saveData();
            
            this.render();
            this.updateStats();
            Toast.show('Tarea eliminada', 'info');
        }
    },

    render: function() {
        const container = document.getElementById('todoList');
        
        if (appState.todos.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                    <i class="fas fa-tasks" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                    <p>No hay tareas pendientes</p>
                </div>
            `;
            return;
        }

        container.innerHTML = appState.todos.map(todo => `
            <li class="todo-item ${todo.completed ? 'completed' : ''} animate-fade-in-up">
                <input type="checkbox" class="todo-checkbox" 
                       ${todo.completed ? 'checked' : ''} 
                       onchange="TodoManager.toggle('${todo.id}')">
                <div class="todo-content">
                    <div class="todo-title">${todo.title}</div>
                    <div class="todo-meta">
                        <span class="todo-category">${todo.category}</span>
                        <span class="todo-priority ${todo.priority}">${todo.priority}</span>
                    </div>
                </div>
                <button class="btn-sm btn-delete" onclick="TodoManager.delete('${todo.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </li>
        `).join('');
    },

    updateStats: function() {
        const totalTodos = appState.todos.filter(todo => !todo.completed).length;
        document.getElementById('totalTodos').textContent = totalTodos;
    }
};

// Gestión de Gastos
const ExpenseManager = {
    add: function(expenseData) {
        const expense = {
            id: Utils.generateId(),
            ...expenseData,
            createdAt: new Date().toISOString(),
            userId: DataManager.getCurrentUser()?.id
        };
        
        appState.expenses.push(expense);
        DataManager.data.expenses.push(expense);
        DataManager.saveData();
        
        this.render();
        Toast.show('Gasto agregado exitosamente', 'success');
    },

    delete: function(id) {
        if (confirm('¿Estás seguro de que quieres eliminar este gasto?')) {
            appState.expenses = appState.expenses.filter(expense => expense.id !== id);
            DataManager.data.expenses = DataManager.data.expenses.filter(expense => expense.id !== id);
            DataManager.saveData();
            
            this.render();
            Toast.show('Gasto eliminado', 'info');
        }
    },

    render: function() {
        const container = document.getElementById('expenseList');
        const totalElement = document.getElementById('totalExpenses');
        
        const total = appState.expenses.reduce((sum, expense) => sum + expense.amount, 0);
        totalElement.textContent = `Total: ${Utils.formatCurrency(total)}`;
        
        if (appState.expenses.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                    <i class="fas fa-receipt" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                    <p>No hay gastos registrados</p>
                </div>
            `;
            return;
        }

        container.innerHTML = appState.expenses.map(expense => `
            <li class="expense-item animate-fade-in-up">
                <div class="expense-info">
                    <div class="expense-name">${expense.name}</div>
                    <div class="expense-meta">
                        <span class="expense-category">${expense.category}</span>
                        <span class="expense-date">${Utils.formatDate(expense.date)}</span>
                    </div>
                </div>
                <div class="expense-amount">${Utils.formatCurrency(expense.amount)}</div>
                <button class="btn-sm btn-delete" onclick="ExpenseManager.delete('${expense.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </li>
        `).join('');
    }
};

// Gestión de Reservas
const BookingManager = {
    add: function(bookingData) {
        const booking = {
            id: Utils.generateId(),
            ...bookingData,
            createdAt: new Date().toISOString(),
            userId: DataManager.getCurrentUser()?.id
        };

        if (!appState.bookings) appState.bookings = [];
        appState.bookings.push(booking);

        if (!DataManager.data.bookings) DataManager.data.bookings = [];
        DataManager.data.bookings.push(booking);

        DataManager.saveData();
        this.render();
        Toast.show('Reserva agregada exitosamente', 'success');
    },

    delete: function(id) {
        if (confirm('¿Estás seguro de que quieres eliminar esta reserva?')) {
            appState.bookings = appState.bookings.filter(b => b.id !== id);
            DataManager.data.bookings = DataManager.data.bookings.filter(b => b.id !== id);
            DataManager.saveData();
            this.render();
            Toast.show('Reserva eliminada', 'info');
        }
    },

    render: function() {
        const container = document.getElementById('bookingList');
        if (!appState.bookings || appState.bookings.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                    <i class="fas fa-ticket-alt" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                    <p>No hay reservas registradas</p>
                </div>
            `;
            return;
        }

        container.innerHTML = appState.bookings.map(booking => `
            <li class="booking-item animate-fade-in-up">
                <div class="booking-info">
                    <div class="booking-type">${booking.type.charAt(0).toUpperCase() + booking.type.slice(1)}</div>
                    <div class="booking-name">${booking.name}</div>
                    <div class="booking-meta">
                        <span class="booking-date">${Utils.formatDate(booking.date)}</span>
                        ${booking.amount ? `<span class="booking-amount">${Utils.formatCurrency(booking.amount)}</span>` : ''}
                    </div>
                </div>
                <button class="btn-sm btn-delete" onclick="BookingManager.delete('${booking.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </li>
        `).join('');
    }
};

// Gestión de Modales
function toggleModal(modalId) {
    const modal = document.getElementById(modalId);
    const overlay = document.getElementById('modalOverlay');
    
    if (modal.classList.contains('active')) {
        modal.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
        
        // Limpiar formularios al cerrar
        const form = modal.querySelector('form');
        if (form) {
            form.reset();
            delete form.dataset.editId;
        }
    } else {
        modal.classList.add('active');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

// Gestión del menú FAB
function toggleFabMenu() {
    document.querySelector('.fab-container').classList.toggle('open');
}

// Gestión de Temas
function toggleTheme() {
    appState.theme = appState.theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', appState.theme);
    
    const themeIcon = document.querySelector('.theme-toggle i');
    themeIcon.className = appState.theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    
    DataManager.saveData();
}

// Cerrar sesión
function logout() {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
        DataManager.setCurrentUser(null);
        appState = {
            trips: [],
            todos: [],
            expenses: [],
            currentUser: null,
            theme: appState.theme,
            fabMenuOpen: false
        };
        
        // Redirigir a la página de login
        window.location.href = 'index.html';
    }
}

// Manejadores de formularios
function initializeFormHandlers() {
    // Formulario de viajes
    document.getElementById('tripForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = {
            destination: document.getElementById('destination').value.trim(),
            startDate: document.getElementById('startDate').value,
            endDate: document.getElementById('endDate').value,
            budget: parseFloat(document.getElementById('budget').value),
            description: document.getElementById('description').value.trim()
        };
        
        // Validaciones
        if (!formData.destination || !formData.startDate || !formData.endDate || !formData.budget) {
            Toast.show('Por favor completa todos los campos obligatorios', 'error');
            return;
        }
        
        if (new Date(formData.startDate) >= new Date(formData.endDate)) {
            Toast.show('La fecha de inicio debe ser anterior a la fecha de fin', 'error');
            return;
        }
        
        if (formData.budget <= 0) {
            Toast.show('El presupuesto debe ser mayor a 0', 'error');
            return;
        }
        
        // Verificar si es edición
        const editId = this.dataset.editId;
        if (editId) {
            // Actualizar viaje existente
            const tripIndex = appState.trips.findIndex(t => t.id === editId);
            if (tripIndex !== -1) {
                appState.trips[tripIndex] = { ...appState.trips[tripIndex], ...formData };
                DataManager.saveData();
                TripManager.render();
                TripManager.updateStats();
                Toast.show('Viaje actualizado exitosamente', 'success');
            }
            delete this.dataset.editId;
        } else {
            // Agregar nuevo viaje
            TripManager.add(formData);
        }
        
        toggleModal('tripModal');
    });
    
    // Formulario de tareas
    document.getElementById('todoForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = {
            title: document.getElementById('todoTitle').value.trim(),
            category: document.getElementById('todoCategory').value,
            priority: document.getElementById('todoPriority').value
        };
        
        if (!formData.title) {
            Toast.show('Por favor ingresa el título de la tarea', 'error');
            return;
        }
        
        TodoManager.add(formData);
        toggleModal('todoModal');
    });
    
    // Formulario de gastos
    document.getElementById('expenseForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('expenseName').value.trim(),
            amount: parseFloat(document.getElementById('expenseAmount').value),
            category: document.getElementById('expenseCategory').value,
            date: document.getElementById('expenseDate').value
        };
        
        if (!formData.name || !formData.amount || !formData.date) {
            Toast.show('Por favor completa todos los campos', 'error');
            return;
        }
        
        if (formData.amount <= 0) {
            Toast.show('El monto debe ser mayor a 0', 'error');
            return;
        }
        
        ExpenseManager.add(formData);
        toggleModal('expenseModal');
    });
    
    // Formulario de reservas
    document.getElementById('bookingForm').addEventListener('submit', function(e) {
        e.preventDefault();

        const formData = {
            type: document.getElementById('bookingType').value,
            name: document.getElementById('bookingName').value.trim(),
            date: document.getElementById('bookingDate').value,
            amount: parseFloat(document.getElementById('bookingAmount').value) || 0
        };

        if (!formData.type || !formData.name || !formData.date) {
            Toast.show('Por favor completa todos los campos obligatorios', 'error');
            return;
        }

        BookingManager.add(formData);
        toggleModal('bookingModal');
    });
}

// Cerrar modal al hacer clic en el overlay
document.addEventListener('click', function(e) {
    if (e.target.id === 'modalOverlay') {
        const activeModal = document.querySelector('.modal.active');
        if (activeModal) {
            toggleModal(activeModal.id);
        }
    }
});

// Cerrar menú FAB al hacer clic fuera
document.addEventListener('click', function(e) {
    if (!e.target.closest('.fab-container') && appState.fabMenuOpen) {
        toggleFabMenu();
    }
});

// Manejo de teclas de escape
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const activeModal = document.querySelector('.modal.active');
        if (activeModal) {
            toggleModal(activeModal.id);
        } else if (appState.fabMenuOpen) {
            toggleFabMenu();
        }
    }
});

// Inicialización de la aplicación
function initializeApp() {
    // Simular usuario logueado
    const mockUser = { id: 'user1', email: 'usuario@ejemplo.com' };
    DataManager.setCurrentUser(mockUser);
    
    // Cargar datos
    DataManager.loadData();
    
    // Establecer fecha actual por defecto en los formularios
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('expenseDate').value = today;
    
    // Inicializar manejadores de formularios
    initializeFormHandlers();
    
        // Renderizar contenido inicial
        TripManager.render();
        TodoManager.render();
        ExpenseManager.render();
        BookingManager.render();
    }