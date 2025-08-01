/*!
 * StickyAgenda.js
 * Copyright (c) 2025 Julio Daniel Azurduy Montalvo
 * Released under the MIT License
 * https://github.com/DanJuaz/sticky-notes-calendar
 */

/**
 * Modelo Todo para StickyAgenda
 */

class Todo {
    constructor(data = {}) {
        // Generar ID único si no se proporciona
        this.id = data.id || this.generateId();
        this.text = data.text || '';
        this.completed = data.completed || false;

        // Validar datos
        this.validate();
    }

    /**
     * Genera un ID único para el todo
     */
    generateId() {
        return 'todo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Valida los datos del todo
     */
    validate() {
        if (!window.StickyAgendaValidators) {
            console.warn('Validators no disponibles');
            return;
        }

        const validation = window.StickyAgendaValidators.validateTodo(this);
        if (!validation.isValid) {
            throw new Error(`Todo inválido: ${validation.errors.join(', ')}`);
        }
    }

    /**
     * Marca el todo como completado
     */
    markAsCompleted() {
        if (this.completed) return this;

        this.completed = true;
        return this;
    }

    /**
     * Marca el todo como pendiente
     */
    markAsPending() {
        if (!this.completed) return this;

        this.completed = false;
        return this;
    }

    /**
     * Actualiza el texto del todo
     */
    updateText(newText) {
        if (!newText || typeof newText !== 'string') {
            throw new Error('Texto inválido para el todo');
        }

        this.text = window.StickyAgendaValidators.sanitizeText(newText);
        return this;
    }

    /**
     * Convierte el todo a objeto plano para serialización
     */
    toJSON() {
        return {
            id: this.id,
            text: this.text,
            completed: this.completed
        };
    }

    /**
     * Cria una copia del todo
     */
    clone() {
        return new Todo(this.toJSON());
    }

    /**
     * Crea un todo desde datos planos
     */
    static fromJSON(data) {
        return new Todo(data);
    }

    /**
     * Obtiene la representación en texto del estado
     */
    getStatusText() {
        return this.completed ? 'Completado' : 'Pendiente';
    }



    /**
     * Verifica si el todo coincide con un criterio de búsqueda
     */
    matchesSearch(searchText) {
        if (!searchText) return true;
        
        const search = searchText.toLowerCase();
        return this.text.toLowerCase().includes(search);
    }

    /**
     * Obtiene estadísticas del todo (para análisis)
     */
    getStats() {
        const stats = {
            id: this.id,
            textLength: this.text.length,
            completed: this.completed,
        };

        if (this.completed) {
            stats.timeToComplete = completedDate - createdDate; // milliseconds
            stats.timeToCompleteHours = stats.timeToComplete / (1000 * 60 * 60);
        }

        return stats;
    }
}

// Exportar para uso global
window.StickyAgendaTodo = Todo;
