/*!
 * StickyAgenda.js
 * Copyright (c) 2025 Julio Daniel Azurduy Montalvo
 * Released under the MIT License
 * https://github.com/DanJuaz/sticky-notes-calendar
 */

/**
 * Renderizador de notas para StickyAgenda
 * Maneja la creación y actualización del HTML de las notas
 */

class NoteRenderer {
    constructor(config = {}) {
        this.config = {
            showAuthor: config.showAuthor !== false,
            showDates: config.showDates !== false,
            showTodos: config.showTodos !== false,
            showTags: config.showTags !== false,
            showPriority: config.showPriority !== false,
            allowInlineEdit: config.allowInlineEdit !== false,
            dateFormat: config.dateFormat || 'DD/MM/YYYY',
            maxTitleLength: config.maxTitleLength || 50,
            maxDescriptionLength: config.maxDescriptionLength || 150,
            language: config.language || 'es',
            getText: config.getText || ((key) => key),
            ...config
        };

        this.callbacks = {
        };
    }

    /**
     * Renderiza una nota completa
     */
    renderNote(note) {
        if (!note || !note.id) {
            console.error('Nota inválida para renderizar:', note);
            return '';
        }

        const noteClasses = this.getNoteClasses(note);

        return `
            <div class="${noteClasses}" 
                data-note-id="${note.id}">
                
                ${this.renderNoteHeader(note)}
                ${this.renderNoteBody(note)}
                ${this.config.showTodos ? this.renderTodos(note) : ''}
                ${this.renderNoteFooter(note)}
                ${this.renderNoteActions(note)}
            </div>
        `;
    }

    /**
     * Obtiene las clases CSS para una nota
     */
    getNoteClasses(note) {
        const baseClasses = [
            'sticky-note',
            'rounded-lg',
            'shadow-md',
            'border-l-4',
            'p-4',
            'relative',
            'transition-all',
            'duration-200',
            'hover:shadow-lg'
        ];

        // Estado de la nota
        if (note.status === 'completed') {
            baseClasses.push('opacity-40', 'bg-gray-50');
        }

        // Prioridad
        if (note.priority === 1) {
            baseClasses.push('bg-red-500');
            baseClasses.push('border-red-400');
        } else if (note.priority === 2) {
            baseClasses.push('bg-yellow-500');
        } else {
            baseClasses.push('bg-green-500');
        }

        // Estado de vencimiento
        if (note.isOverdue && note.isOverdue()) {
            baseClasses.push('ring-2', 'ring-red-200');
        } else if (note.isDueToday && note.isDueToday()) {
            baseClasses.push('ring-2', 'ring-blue-200');
        }

        return baseClasses.join(' ');
    }

    /**
     * Renderiza el header de la nota
     */
    renderNoteHeader(note) {
        return `
            <div class="note-header flex items-start justify-between mb-3">
                <div class="flex-1 min-w-0">
                    <h3 class="text-lg font-semibold text-gray-50 truncate" 
                        title="${this.escapeHtml(note.title)}">
                        ${this.truncateText(note.title, this.config.maxTitleLength)}
                    </h3>
                    ${this.config.showAuthor ? this.renderAuthor(note) : ''}
                </div>
                ${this.config.showPriority ? this.renderPriorityBadge(note) : ''}
            </div>
        `;
    }

    /**
     * Renderiza el autor de la nota
     */
    renderAuthor(note) {
        const byText = this.config.language === 'en' ? 'by' : 'por';
        return `
            <p class="text-sm text-gray-100 mt-1">
                ${byText} ${this.escapeHtml(note.author)}
            </p>
        `;
    }

    /**
     * Renderiza el badge de prioridad
     */
    renderPriorityBadge(note) {
        const priorities = {
            1: { textKey: 'priorityHigh', class: 'text-red-500' },
            2: { textKey: 'priorityMedium', class: 'text-yellow-500' },
            3: { textKey: 'priorityLow', class: 'text-green-500' }
        };

        const priority = priorities[note.priority] || priorities[2];

        return `
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-50 ${priority.class}">
                ${this.config.getText(priority.textKey)}
            </span>
        `;
    }

    /**
     * Renderiza el cuerpo de la nota
     */
    renderNoteBody(note) {
        return `
            <div class="note-body mb-3">
                ${note.description ? this.renderDescription(note) : ''}
                ${this.config.showDates ? this.renderDates(note) : ''}
                ${this.config.showTags ? this.renderTags(note) : ''}
            </div>
        `;
    }

    /**
     * Renderiza la descripción de la nota
     */
    renderDescription(note) {
        if (!note.description) return '';

        const truncatedDesc = this.truncateText(note.description, this.config.maxDescriptionLength);
        const showExpand = note.description.length > this.config.maxDescriptionLength;

        return `
            <div class="description mb-3">
                <p class="text-gray-50 text-sm leading-relaxed"
                   title="${this.escapeHtml(note.description)}">
                    ${this.escapeHtml(truncatedDesc)}
                    ${showExpand ? '<span class="text-blue-500 cursor-pointer hover:underline ml-1">ver más</span>' : ''}
                </p>
            </div>
        `;
    }

    /**
     * Renderiza las fechas de la nota
     */
    renderDates(note) {
        if (!note.startDate && !note.endDate) return '';

        const dateHelpers = window.StickyAgendaDateHelpers;
        const formatDate = dateHelpers ? 
            (date) => dateHelpers.toDisplayDate(date, this.config.dateFormat) : 
            (date) => date;

        let datesHtml = '<div class="dates text-xs text-gray-500 mb-2">';

        if (note.startDate) {
            const startText = this.config.getText('startDate');
            datesHtml += `
                <div class="flex items-center mb-1">
                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                    <span>${startText}: ${formatDate(note.startDate)}</span>
                </div>
            `;
        }

        if (note.endDate) {
            const isOverdue = note.isOverdue && note.isOverdue();
            const isDueToday = note.isDueToday && note.isDueToday();
            
            let endClass = '';
            if (isOverdue) endClass = 'text-red-600 font-medium';
            else if (isDueToday) endClass = 'text-blue-600 font-medium';

            datesHtml += `
                <div class="flex items-center">
                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <span class="${endClass}">
                        ${this.config.getText('endDate')}: ${formatDate(note.endDate)}
                        ${isOverdue ? ` (${this.config.getText('overdue')})` : ''}
                        ${isDueToday ? ` (${this.config.getText('dueToday')})` : ''}
                    </span>
                </div>
            `;
        }

        datesHtml += '</div>';
        return datesHtml;
    }

    /**
     * Renderiza los tags de la nota
     */
    renderTags(note) {
        if (!note.tags || note.tags.length === 0) return '';

        const tagsHtml = note.tags.map(tag => `
            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 mr-1 mb-1">
                #${this.escapeHtml(tag)}
            </span>
        `).join('');

        return `
            <div class="tags mb-2">
                ${tagsHtml}
            </div>
        `;
    }

    /**
     * Renderiza la lista de todos
     */
    renderTodos(note) {
        if (!note.todos || note.todos.length === 0) return '';

        const todosHtml = note.todos.map(todo => this.renderTodo(todo, note.id)).join('');
        const progress = note.getTodosProgress ? note.getTodosProgress() : 0;

        return `
            <div class="todos mb-3">
                <div class="flex items-center justify-between mb-2">
                    <h4 class="text-sm font-medium text-gray-700">${this.config.getText('tasks')}</h4>
                    <span class="text-xs text-gray-500">${progress}%</span>
                </div>
                
                ${progress > 0 ? `
                    <div class="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                        <div class="bg-blue-600 h-1.5 rounded-full transition-all duration-300" 
                             style="width: ${progress}%"></div>
                    </div>
                ` : ''}
                
                <div class="todos-list space-y-1">
                    ${todosHtml}
                </div>
            </div>
        `;
    }

    /**
     * Renderiza un todo individual
     */
    renderTodo(todo, noteId) {
        const todoClasses = [
            'todo-item',
            'flex',
            'items-center',
            'text-sm',
            'p-2',
            'rounded',
            'hover:bg-gray-50',
            'transition-colors'
        ];

        if (todo.completed) {
            todoClasses.push('line-through', 'text-gray-500');
        }

        return `
            <div class="${todoClasses.join(' ')}" data-todo-id="${todo.id}">
                <input type="checkbox" 
                       class="todo-checkbox mr-2 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                       ${todo.completed ? 'checked' : ''}
                       data-note-id="${noteId}"
                       data-todo-id="${todo.id}">
                <span class="flex-1 min-w-0">
                    ${this.escapeHtml(todo.text)}
                </span>
                ${todo.completed && todo.completedAt ? `
                    <span class="text-xs text-gray-400 ml-2">
                        ${window.StickyAgendaDateHelpers ? 
                          window.StickyAgendaDateHelpers.timeAgo(todo.completedAt) : 
                          (this.config.language === 'en' ? 'completed' : 'completado')}
                    </span>
                ` : ''}
            </div>
        `;
    }

    /**
     * Renderiza el footer de la nota
     */
    renderNoteFooter(note) {
        const dateHelpers = window.StickyAgendaDateHelpers;
        const createdAgo = dateHelpers ? 
            dateHelpers.timeAgo(note.createdAt) : 
            'hace un tiempo';

        return `
            <div class="note-footer text-xs text-gray-50 mb-2">
                <div class="flex items-center justify-between">
                    <span>${this.config.getText('createdAgo')} ${createdAgo}</span>
                    ${note.status === 'completed' && note.completedAt ? `
                        <span class="text-green-600">
                            ✓ ${this.config.getText('completedAgo')} ${dateHelpers ? 
                                dateHelpers.timeAgo(note.completedAt) : 
                                (this.config.language === 'en' ? 'recently' : 'recientemente')}
                        </span>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Renderiza las acciones de la nota
     */
    renderNoteActions() {
        return `
            <div class="note-actions flex items-center justify-end space-x-2 pt-2 border-t border-gray-100">
            </div>
        `;
    }

   

    /**
     * Vincula eventos a una nota
     */
    bindNoteEvents(noteElement) {
        // Eventos de acciones
        const actionButtons = noteElement.querySelectorAll('.action-btn');
      
        // Eventos de todos
        const todoCheckboxes = noteElement.querySelectorAll('.todo-checkbox');
        todoCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => this.handleTodoToggle(e));
        });

    }


    /**
     * Maneja toggle de todos
     */
    handleTodoToggle(event) {
        const checkbox = event.target;
        const noteId = checkbox.getAttribute('data-note-id');
        const todoId = checkbox.getAttribute('data-todo-id');
        const completed = checkbox.checked;

        this.notifyCallbacks('onTodoToggle', { 
            noteId, 
            todoId, 
            completed, 
            checkbox, 
            event 
        });
    }

    // === UTILIDADES ===

    /**
     * Escapa HTML para prevenir XSS
     */
    escapeHtml(text) {
        if (typeof text !== 'string') return '';
        
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Trunca texto a una longitud específica
     */
    truncateText(text, maxLength) {
        if (!text || text.length <= maxLength) return text;
        return text.slice(0, maxLength - 3) + '...';
    }

    // === CALLBACKS ===

    /**
     * Notifica callbacks
     */
    notifyCallbacks(eventType, data) {
        const callbacks = this.callbacks[eventType] || [];
        callbacks.forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error en callback ${eventType}:`, error);
            }
        });
    }

}

// Exportar para uso global
window.StickyAgendaNoteRenderer = NoteRenderer;
