/*!
 * StickyAgenda.js
 * Copyright (c) 2025 Julio Daniel Azurduy Montalvo
 * Released under the MIT License
 * https://github.com/DanJuaz/sticky-notes-calendar
 */

/**
 * Utilidades de validación para StickyAgenda
 */

class Validators {
    /**
     * Valida si una cadena es un ID válido
     */
    static isValidId(id) {
        return typeof id === 'string' && id.length > 0;
    }

    /**
     * Valida si una fecha es válida (formato YYYY-MM-DD)
     */
    static isValidDate(date) {
        if (!date) return true; // Las fechas pueden ser opcionales
        const regex = /^\d{4}-\d{2}-\d{2}$/;
        if (!regex.test(date)) return false;
        
        const dateObj = new Date(date);
        return dateObj instanceof Date && !isNaN(dateObj);
    }

    /**
     * Valida si una fecha ISO es válida
     */
    static isValidISODate(isoDate) {
        if (!isoDate) return true;
        const dateObj = new Date(isoDate);
        return dateObj instanceof Date && !isNaN(dateObj);
    }

    /**
     * Valida la estructura básica de una nota
     */
    static validateNote(note) {
        const errors = [];

        // Campos requeridos
        if (!note.title || typeof note.title !== 'string' || note.title.trim() === '') {
            errors.push('El título es requerido');
        }

        if (!note.author || typeof note.author !== 'string' || note.author.trim() === '') {
            errors.push('El autor es requerido');
        }

        // Fechas
        if (note.startDate && !this.isValidDate(note.startDate)) {
            errors.push('Fecha de inicio inválida');
        }

        if (note.endDate && !this.isValidDate(note.endDate)) {
            errors.push('Fecha de fin inválida');
        }

        if (note.createdAt && !this.isValidISODate(note.createdAt)) {
            errors.push('Fecha de creación inválida');
        }

        if (note.completedAt && !this.isValidISODate(note.completedAt)) {
            errors.push('Fecha de completado inválida');
        }

        // Prioridad
        if (note.priority !== undefined && (note.priority < 1 || note.priority > 3)) {
            errors.push('La prioridad debe ser 1, 2 o 3');
        }

        // Estado
        const validStatuses = ['pending', 'completed', 'archived'];
        if (note.status && !validStatuses.includes(note.status)) {
            errors.push('Estado inválido');
        }

        // Color
        if (note.color && !/^#[0-9A-F]{6}$/i.test(note.color)) {
            errors.push('Color inválido (debe ser formato hex #RRGGBB)');
        }

        // Posición
        if (note.position) {
            if (typeof note.position.x !== 'number' || typeof note.position.y !== 'number') {
                errors.push('La posición debe tener coordenadas x e y numéricas');
            }
        }

        // Tags
        if (note.tags && !Array.isArray(note.tags)) {
            errors.push('Los tags deben ser un array');
        }

        // Todos
        if (note.todos && !Array.isArray(note.todos)) {
            errors.push('Los todos deben ser un array');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Valida la estructura de un todo
     */
    static validateTodo(todo) {
        const errors = [];

        if (!todo.text || typeof todo.text !== 'string' || todo.text.trim() === '') {
            errors.push('El texto del todo es requerido');
        }

        if (typeof todo.completed !== 'boolean') {
            errors.push('El estado completed debe ser booleano');
        }

        if (todo.createdAt && !this.isValidISODate(todo.createdAt)) {
            errors.push('Fecha de creación del todo inválida');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Sanitiza texto para prevenir XSS
     */
    static sanitizeText(text) {
        if (typeof text !== 'string') return '';
        
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .trim();
    }

    /**
     * Valida criterios de filtro
     */
    static validateFilterCriteria(criteria) {
        const errors = [];

        if (criteria.dateRange) {
            if (criteria.dateRange.start && !this.isValidDate(criteria.dateRange.start)) {
                errors.push('Fecha de inicio del rango inválida');
            }
            if (criteria.dateRange.end && !this.isValidDate(criteria.dateRange.end)) {
                errors.push('Fecha de fin del rango inválida');
            }
        }

        const validStatuses = ['pending', 'completed', 'archived'];
        if (criteria.status && !validStatuses.includes(criteria.status)) {
            errors.push('Estado de filtro inválido');
        }

        if (criteria.priority && (criteria.priority < 1 || criteria.priority > 3)) {
            errors.push('Prioridad de filtro inválida');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

// Exportar para uso global
window.StickyAgendaValidators = Validators;
