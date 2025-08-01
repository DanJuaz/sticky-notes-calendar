/**
 * Modelo Note (StickyNote) para StickyAgenda
 */

class Note {
    constructor(data = {}) {
        // Generar ID único si no se proporciona
        this.id = data.id || this.generateId();
        
        // Campos básicos requeridos
        this.title = data.title || '';
        this.description = data.description || '';
        this.author = data.author || '';
        
        // Metadatos temporales
        this.createdAt = data.createdAt || window.StickyAgendaDateHelpers.now();
        this.startDate = data.startDate || null;
        this.endDate = data.endDate || null;
        this.completedAt = data.completedAt || null;
        
        // Clasificación
        this.category = data.category || 'general';
        this.priority = data.priority || 2; // 1=alta, 2=media, 3=baja
        this.tags = Array.isArray(data.tags) ? data.tags : [];
        
        // Estado y visualización
        this.status = data.status || 'pending';
        this.position = data.position || { x: 0, y: 0 };
        this.color = data.color || '#ffeb3b';
        
        // To-do list interna
        this.todos = [];
        if (Array.isArray(data.todos)) {
            this.todos = data.todos.map(todoData => 
                new window.StickyAgendaTodo(todoData)
            );
        }
        
        // Metadatos adicionales
        this.attachments = Array.isArray(data.attachments) ? data.attachments : [];
        
        // Validar datos
        this.validate();
    }

    /**
     * Genera un ID único para la nota
     */
    generateId() {
        return 'note_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Valida los datos de la nota
     */
    validate() {
        if (!window.StickyAgendaValidators) {
            console.warn('Validators no disponibles');
            return;
        }

        const validation = window.StickyAgendaValidators.validateNote(this);
        if (!validation.isValid) {
            throw new Error(`Nota inválida: ${validation.errors.join(', ')}`);
        }
    }

    /**
     * Actualiza los datos básicos de la nota
     */
    update(data) {
        if (data.title !== undefined) {
            this.title = window.StickyAgendaValidators.sanitizeText(data.title);
        }
        
        if (data.description !== undefined) {
            this.description = window.StickyAgendaValidators.sanitizeText(data.description);
        }
        
        if (data.category !== undefined) {
            this.category = data.category;
        }
        
        if (data.priority !== undefined) {
            this.priority = data.priority;
        }
        
        if (data.startDate !== undefined) {
            this.startDate = data.startDate;
        }
        
        if (data.endDate !== undefined) {
            this.endDate = data.endDate;
        }
        
        if (data.color !== undefined) {
            this.color = data.color;
        }
        
        if (data.tags !== undefined && Array.isArray(data.tags)) {
            this.tags = data.tags;
        }

        // Re-validar después de actualizar
        this.validate();
        return this;
    }

    /**
     * Marca la nota como completada
     */
    markAsCompleted() {
        if (this.status === 'completed') return this;

        this.status = 'completed';
        this.completedAt = window.StickyAgendaDateHelpers.now();
        return this;
    }

    /**
     * Marca la nota como pendiente
     */
    markAsPending() {
        if (this.status === 'pending') return this;

        this.status = 'pending';
        this.completedAt = null;
        return this;
    }

    /**
     * Archiva la nota
     */
    archive() {
        this.status = 'archived';
        return this;
    }

    /**
     * Actualiza la posición de la nota
     */
    updatePosition(x, y) {
        this.position = { x: Number(x), y: Number(y) };
        return this;
    }

    // === GESTIÓN DE TODOS ===

    /**
     * Agrega un nuevo todo a la nota
     */
    addTodo(todoData) {
        const todo = new window.StickyAgendaTodo(todoData);
        this.todos.push(todo);
        return todo;
    }

    /**
     * Actualiza un todo específico
     */
    updateTodo(todoId, updateData) {
        const todo = this.todos.find(t => t.id === todoId);
        if (!todo) {
            throw new Error(`Todo con ID ${todoId} no encontrado`);
        }

        if (updateData.text !== undefined) {
            todo.updateText(updateData.text);
        }

        if (updateData.completed !== undefined) {
            updateData.completed ? todo.markAsCompleted() : todo.markAsPending();
        }

        return todo;
    }

    /**
     * Elimina un todo específico
     */
    removeTodo(todoId) {
        const index = this.todos.findIndex(t => t.id === todoId);
        if (index === -1) {
            throw new Error(`Todo con ID ${todoId} no encontrado`);
        }

        const removedTodo = this.todos.splice(index, 1)[0];
        return removedTodo;
    }

    /**
     * Obtiene todos los todos completados
     */
    getCompletedTodos() {
        return this.todos.filter(todo => todo.completed);
    }

    /**
     * Obtiene todos los todos pendientes
     */
    getPendingTodos() {
        return this.todos.filter(todo => !todo.completed);
    }

    /**
     * Obtiene el progreso de los todos (0-100)
     */
    getTodosProgress() {
        if (this.todos.length === 0) return 0;
        
        const completed = this.getCompletedTodos().length;
        return Math.round((completed / this.todos.length) * 100);
    }

    // === MÉTODOS DE ESTADO ===

    /**
     * Verifica si la nota está vencida
     */
    isOverdue() {
        if (!this.endDate || this.status === 'completed') return false;
        return window.StickyAgendaDateHelpers.isPast(this.endDate);
    }

    /**
     * Verifica si la nota es de hoy
     */
    isDueToday() {
        if (!this.endDate) return false;
        return window.StickyAgendaDateHelpers.isToday(this.endDate);
    }

    /**
     * Verifica si la nota es de mañana
     */
    isDueTomorrow() {
        if (!this.endDate) return false;
        return window.StickyAgendaDateHelpers.isTomorrow(this.endDate);
    }

    /**
     * Obtiene la prioridad como texto
     */
    getPriorityText() {
        const priorities = {
            1: 'Alta',
            2: 'Media',
            3: 'Baja'
        };
        return priorities[this.priority] || 'Media';
    }

    /**
     * Obtiene el estado como texto
     */
    getStatusText() {
        const statuses = {
            'pending': 'Pendiente',
            'completed': 'Completada',
            'archived': 'Archivada'
        };
        return statuses[this.status] || 'Pendiente';
    }

    // === FILTROS Y BÚSQUEDAS ===

    /**
     * Verifica si la nota coincide con criterios de filtro
     */
    matchesFilter(criteria) {
        // Filtro por estado
        if (criteria.status && this.status !== criteria.status) {
            return false;
        }

        // Filtro por categoría
        if (criteria.category && this.category !== criteria.category) {
            return false;
        }

        // Filtro por prioridad
        if (criteria.priority && this.priority !== criteria.priority) {
            return false;
        }

        // Filtro por autor
        if (criteria.author && this.author !== criteria.author) {
            return false;
        }

        // Filtro por rango de fechas
        if (criteria.dateRange) {
            const { start, end } = criteria.dateRange;
            const checkDate = this.startDate || this.createdAt;
            
            if (!window.StickyAgendaDateHelpers.isInRange(checkDate, start, end)) {
                return false;
            }
        }

        // Filtro por texto libre
        if (criteria.searchText) {
            const searchLower = criteria.searchText.toLowerCase();
            const titleMatch = this.title.toLowerCase().includes(searchLower);
            const descMatch = this.description.toLowerCase().includes(searchLower);
            const tagsMatch = this.tags.some(tag => 
                tag.toLowerCase().includes(searchLower)
            );
            const todosMatch = this.todos.some(todo => 
                todo.matchesSearch(criteria.searchText)
            );

            if (!titleMatch && !descMatch && !tagsMatch && !todosMatch) {
                return false;
            }
        }

        // Filtro por tags
        if (criteria.tags && Array.isArray(criteria.tags)) {
            const hasMatchingTag = criteria.tags.some(tag => 
                this.tags.includes(tag)
            );
            if (!hasMatchingTag) {
                return false;
            }
        }

        return true;
    }

    // === SERIALIZACIÓN ===

    /**
     * Convierte la nota a objeto plano para serialización
     */
    toJSON() {
        return {
            id: this.id,
            title: this.title,
            description: this.description,
            author: this.author,
            createdAt: this.createdAt,
            startDate: this.startDate,
            endDate: this.endDate,
            completedAt: this.completedAt,
            category: this.category,
            priority: this.priority,
            tags: [...this.tags],
            status: this.status,
            position: { ...this.position },
            color: this.color,
            todos: this.todos.map(todo => todo.toJSON()),
            attachments: [...this.attachments]
        };
    }

    /**
     * Crea una copia de la nota
     */
    clone() {
        return new Note(this.toJSON());
    }

    /**
     * Crea una nota desde datos planos
     */
    static fromJSON(data) {
        return new Note(data);
    }

    /**
     * Obtiene estadísticas de la nota
     */
    getStats() {
        return {
            id: this.id,
            hasTitle: !!this.title,
            hasDescription: !!this.description,
            titleLength: this.title.length,
            descriptionLength: this.description.length,
            todosCount: this.todos.length,
            completedTodosCount: this.getCompletedTodos().length,
            todosProgress: this.getTodosProgress(),
            tagsCount: this.tags.length,
            priority: this.priority,
            status: this.status,
            isOverdue: this.isOverdue(),
            isDueToday: this.isDueToday(),
            createdAt: this.createdAt,
            completedAt: this.completedAt
        };
    }
}

// Exportar para uso global
window.StickyAgendaNote = Note;
