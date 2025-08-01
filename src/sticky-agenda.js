/*!
 * StickyAgenda.js
 * Copyright (c) 2025 Julio Daniel Azurduy Montalvo
 * Released under the MIT License
 * https://github.com/DanJuaz/sticky-notes-calendar
 */

/**
 * StickyAgenda - Librería JavaScript para gestión de notas tipo post-it
 * Clase principal que coordina todos los componentes
 */

class StickyAgenda {
    constructor(options = {}) {

        // Textos bilingües
        this.texts = {
            yesterday: { en: 'YESTERDAY', es: 'AYER' },
            today: { en: 'TODAY', es: 'HOY' },
            tomorrow: { en: 'TOMORROW', es: 'MAÑANA' },
            lastWeek: { en: 'LAST WEEK', es: 'SEMANA PASADA' },
            thisWeek: { en: 'THIS WEEK', es: 'ESTA SEMANA' },
            nextWeek: { en: 'NEXT WEEK', es: 'PRÓXIMA SEMANA' },
            lastMonth: { en: 'LAST MONTH', es: 'MES PASADO' },
            thisMonth: { en: 'THIS MONTH', es: 'ESTE MES' },
            nextMonth: { en: 'NEXT MONTH', es: 'PRÓXIMO MES' },
            day: { en: 'Day', es: 'Día' },
            week: { en: 'Week', es: 'Semana' },
            month: { en: 'Month', es: 'Mes' }
        };

        // Configuración
        this.config = {
            container: options.container,
            data: options.data || [],
            
            // Configuración general
            backendUrl: options.config?.backendUrl || '/api/notes.php',
            categories: options.config?.categories || [],
            dateFormat: options.config?.dateFormat || 'DD/MM/YYYY',
            
            // Configuración de vista
            viewMode: options.config?.viewMode || 'day', // only day, week, month
            showDateNavigation: options.config?.showDateNavigation !== false,
            currentDate: options.config?.currentDate || new Date(),
            language: options.config?.language || 'es', // 'en' or 'es'
            
            // Configuración de componentes
            showFilters: options.config?.showFilters !== false,
            showAddButton: options.config?.showAddButton !== false,
            maxNotesPerPage: options.config?.maxNotesPerPage || 0, // 0 = sin límite
            
            ...options.config
        };

        // Estado interno
        this.notes = [];
        this.filteredNotes = [];
        this.currentFilters = {};
        this.isInitialized = false;

        // Referencias a componentes
        this.container = null;
        this.filtersComponent = null;
        this.rendererComponent = null;

        // Callbacks de eventos
        this.eventCallbacks = {
            filterChanged: [],
            ready: []
        };

        // Inicialización
        this.init();
    }

    /**
     * Obtiene texto en el idioma configurado
     */
    getText(key) {
        const text = this.texts[key];
        if (!text) return key;
        return text[this.config.language] || text.es;
    }

    /**
     * Valida las opciones de inicialización
     */
    validateOptions(options) {
        if (!options.container) {
            throw new Error('StickyAgenda: contenedor requerido');
        }

        // Verificar dependencias
        if (!window.StickyAgendaNote) {
            throw new Error('StickyAgenda: modelo Note no encontrado');
        }

        if (!window.StickyAgendaDateHelpers) {
            throw new Error('StickyAgenda: DateHelpers no encontrado');
        }
    }

    /**
     * Inicializa la aplicación
     */
    async init() {
        try {
            console.log('Inicializando StickyAgenda...');
            
            // Configurar contenedor
            this.setupContainer();
            
            // Cargar datos
            await this.loadData();
            
            // Inicializar componentes
            this.initializeComponents();
            
            // Renderizar interfaz inicial
            this.renderInterface();
            
            // Configurar visibilidad de elementos según vista actual
            this.toggleViewElements();
            
            // Configurar eventos
            this.bindEvents();
            
            // Marcar como inicializada
            this.isInitialized = true;
            
            console.log('StickyAgenda inicializada correctamente');
            this.notifyEvent('ready', { instance: this });
            
        } catch (error) {
            console.error('Error al inicializar StickyAgenda:', error);
            throw error;
        }
    }

    /**
     * Configura el contenedor principal
     */
    setupContainer() {
        this.container = typeof this.config.container === 'string' 
            ? document.querySelector(this.config.container)
            : this.config.container;

        if (!this.container) {
            throw new Error(`Contenedor no encontrado: ${this.config.container}`);
        }

        // Añadir clases base
        this.container.classList.add('sticky-agenda');
        
        // Configurar estructura HTML base
        this.container.innerHTML = `
            <div class="sticky-agenda-wrapper">
                <div class="sticky-agenda-header mb-4 flex flex-row items-center justify-between">
                    ${this.config.showDateNavigation ? this.renderNavigation() : ''}
                    ${this.renderViewModeSelector()}
                    ${this.config.showFilters && this.config.viewMode === 'board' ? '<div id="filters-container"></div>' : ''}
                </div>
                <div class="sticky-agenda-board" id="notes-board">
                    ${this.renderViewContainer()}
                </div>
            </div>
        `;
    }

    /**
     * Render navigation controls
     */
    renderNavigation() {
        const dateHelpers = window.StickyAgendaDateHelpers;
        const today = new Date();
        
        // Verificar si estamos en el período actual
        let isCurrent = false;
        switch (this.config.viewMode) {
            case 'day':
                isCurrent = dateHelpers.toDateString(this.config.currentDate) === dateHelpers.toDateString(today);
                break;
            case 'week':
                isCurrent = this.isSameWeek(this.config.currentDate, today);
                break;
            case 'month':
                isCurrent = this.isSameMonth(this.config.currentDate, today);
                break;
        }

        // Obtener etiqueta de fecha actual
        let currentLabel = '';
        switch (this.config.viewMode) {
            case 'day':
                currentLabel = dateHelpers.toDisplayDate(this.config.currentDate);
                break;
            case 'week':
                const weekStart = new Date(this.config.currentDate);
                weekStart.setDate(this.config.currentDate.getDate() - this.config.currentDate.getDay());
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);
                currentLabel = `${dateHelpers.toDisplayDate(weekStart)} - ${dateHelpers.toDisplayDate(weekEnd)}`;
                break;
            case 'month':
                currentLabel = this.config.currentDate.toLocaleDateString(this.config.language === 'en' ? 'en-US' : 'es-ES', { 
                    month: 'long', 
                    year: 'numeric' 
                });
                break;
        }

        return `
            <div class="flex items-center justify-center space-x-2">
                <button type="button" 
                        id="nav-previous"
                        class="px-3 py-2 text-sm font-medium rounded-md transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200">
                    &lt;
                </button>
                
                <div class="px-4 py-2 text-sm font-medium text-gray-900">
                    ${currentLabel}
                </div>
                
                <button type="button" 
                        id="nav-next"
                        class="px-3 py-2 text-sm font-medium rounded-md transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200">
                    &gt;
                </button>
                
                <button type="button" 
                        id="nav-today"
                        class="px-4 py-2 text-sm font-medium rounded-md transition-colors ${isCurrent ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}"
                        ${isCurrent ? 'disabled' : ''}>
                    HOY
                </button>
            </div>`;
    }

    /**
     * Verifica si dos fechas están en la misma semana
     */
    isSameWeek(date1, date2) {
        // Convertir a objetos Date si son strings
        const d1 = date1 instanceof Date ? date1 : new Date(date1);
        const d2 = date2 instanceof Date ? date2 : new Date(date2);
        
        // Verificar que las fechas sean válidas
        if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return false;
        
        const startOfWeek1 = new Date(d1);
        startOfWeek1.setDate(d1.getDate() - d1.getDay());
        
        const startOfWeek2 = new Date(d2);
        startOfWeek2.setDate(d2.getDate() - d2.getDay());
        
        return startOfWeek1.toDateString() === startOfWeek2.toDateString();
    }

    /**
     * Verifica si dos fechas están en el mismo mes
     */
    isSameMonth(date1, date2) {
        // Convertir a objetos Date si son strings
        const d1 = date1 instanceof Date ? date1 : new Date(date1);
        const d2 = date2 instanceof Date ? date2 : new Date(date2);
        
        // Verificar que las fechas sean válidas
        if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return false;
        
        return d1.getFullYear() === d2.getFullYear() && 
               d1.getMonth() === d2.getMonth();
    }

    /**
     * Renderiza el selector de modo de vista
     */
    renderViewModeSelector() {
        const modes = [
            { key: 'day', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
            { key: 'week', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
            { key: 'month', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' }
        ];

        return `
            <div class="rounded-lg p-3 mb-4">
                <div class="flex items-center justify-center space-x-2">
                    ${modes.map(mode => `
                        <button type="button"
                                class="view-mode-btn flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${this.config.viewMode === mode.key ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}"
                                data-view-mode="${mode.key}">
                            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${mode.icon}"/>
                            </svg>
                            ${this.getText(mode.key)}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Renderiza el contenedor de vista según el modo activo
     */
    renderViewContainer() {
        switch (this.config.viewMode) {
            case 'day':
                return `
                    <div class="day-view" id="day-view">
                        <!-- Vista diaria -->
                    </div>
                `;
            case 'week':
                return `
                    <div class="week-view" id="week-view">
                        <!-- Vista semanal -->
                    </div>
                `;
            case 'month':
                return `
                    <div class="month-view" id="month-view">
                        <!-- Vista mensual -->
                    </div>
                `;
            default:
                return `
                    <div class="day-view" id="day-view">
                        <!-- Vista diaria por defecto -->
                    </div>
                `;
        }
    }

    /**
     * Inicializa el sistema de almacenamiento
     */
    initializeStorage() {
        this.storageComponent = new window.StickyAgendaStorage({
            storageType: this.config.storageType,
            backendUrl: this.config.backendUrl,
            autoSave: this.config.autoSave,
            storageKey: `sticky_agenda_${this.config.user}`
        });
    }

    /**
     * Carga los datos iniciales
     */
    async loadData() {
        // Cargar desde datos proporcionados
        if (this.config.data && this.config.data.length > 0) {
            this.setNotes(this.config.data);
            return;
        }

        // Cargar desde almacenamiento
        const result = await this.storageComponent.load();
        if (result.success && result.data) {
            this.setNotes(result.data);
        }
    }

    /**
     * Inicializa los componentes
     */
    initializeComponents() {
        // Renderer
        this.rendererComponent = new window.StickyAgendaNoteRenderer({
            showAuthor: true,
            showDates: true,
            showTodos: true,
            showTags: true,
            showPriority: true,
            dateFormat: this.config.dateFormat
        });

        // Filtros
        if (this.config.showFilters) {
            this.initializeFilters();
        }

    }

    /**
     * Inicializa el sistema de filtros
     */
    initializeFilters() {
        // Solo mostrar filtros en modo tablero
        if (this.config.viewMode !== 'board') return;

        const filtersContainer = this.container.querySelector('#filters-container');
        if (!filtersContainer) return;

        this.filtersComponent = new window.StickyAgendaFilters(filtersContainer, {
            categories: this.config.categories,
            showSearchBox: true,
            showDateFilters: true,
            showStatusFilters: true,
            showCategoryFilters: true,
            showPriorityFilters: true,
            collapsible: true
        });

        // Vincular eventos de filtros
        this.filtersComponent.onFilterChange((filters) => {
            this.currentFilters = filters;
            this.applyFilters();
            this.notifyEvent('filterChanged', { filters });
        });

        this.filtersComponent.onFilterClear(() => {
            this.currentFilters = {};
            this.applyFilters();
            this.notifyEvent('filterChanged', { filters: {} });
        });
    }

    /**
     * Renderiza la interfaz completa
     */
    renderInterface() {
        this.applyFilters();
        this.renderCurrentView();
        this.updateNotesCount();
    }

    /**
     * Renderiza la vista actual según el modo seleccionado
     */
    renderCurrentView() {
        switch (this.config.viewMode) {
            case 'day':
                this.renderDayView();
                break;
            case 'week':
                this.renderWeekView();
                break;
            case 'month':
                this.renderMonthView();
                break;
            default:
                this.renderDayView();
        }
    }

    /**
     * Renderiza las notas en el DOM modo tablero
     */
    renderNotesGrid() {
        const notesGrid = this.container.querySelector('#notes-grid');
        if (!notesGrid) return;

        // Limpiar contenido existente
        notesGrid.innerHTML = '';

        // Renderizar notas filtradas
        const notesToRender = this.config.maxNotesPerPage > 0 
            ? this.filteredNotes.slice(0, this.config.maxNotesPerPage)
            : this.filteredNotes;

        notesToRender.forEach(note => {
            const noteHTML = this.rendererComponent.renderNote(note);
            const noteElement = document.createElement('div');
            noteElement.innerHTML = noteHTML;
            const noteNode = noteElement.firstElementChild;
            
            notesGrid.appendChild(noteNode);
            
            // Vincular eventos específicos de la nota
            this.rendererComponent.bindNoteEvents(noteNode);
        });

        // Mostrar mensaje si no hay notas
        if (this.filteredNotes.length === 0) {
            notesGrid.innerHTML = this.renderEmptyState();
        }
    }

    /**
     * Renderiza la vista de agenda por fecha
     */
    renderAgendaView() {
        const agendaView = this.container.querySelector('#agenda-view');
        if (!agendaView) return;

        const dateHelpers = window.StickyAgendaDateHelpers;
        const currentDate = dateHelpers.toDateString(this.config.currentDate);
        
        // Filtrar notas por fecha actual
        const todayNotes = this.filteredNotes.filter(note => {
            if (note.startDate && dateHelpers.toDateString(note.startDate) === currentDate) return true;
            if (note.endDate && dateHelpers.toDateString(note.endDate) === currentDate) return true;
            if (!note.startDate && !note.endDate && dateHelpers.toDateString(note.createdAt) === currentDate) return true;
            return false;
        });

        agendaView.innerHTML = `
            <div class="agenda-container">
                <div class="agenda-header bg-white rounded-lg border p-4 mb-4">
                    <p class="text-sm text-gray-500">${todayNotes.length} nota${todayNotes.length !== 1 ? 's' : ''} para este día</p>
                </div>
                
                <div class="agenda-timeline space-y-3">
                    ${todayNotes.length > 0 ? '' : '<div class="text-center py-8 text-gray-500">No hay notas para este día</div>'}
                </div>
            </div>
        `;

        // Renderizar notas usando el NoteRenderer
        const timeline = agendaView.querySelector('.agenda-timeline');
        if (todayNotes.length > 0) {
            todayNotes.forEach(note => {
                const noteHTML = this.rendererComponent.renderNote(note);
                const noteElement = document.createElement('div');
                noteElement.innerHTML = noteHTML;
                const noteNode = noteElement.firstElementChild;
                
                timeline.appendChild(noteNode);
                
                // Vincular eventos específicos de la nota
                this.rendererComponent.bindNoteEvents(noteNode);
            });
        }
    }

    /**
     * Renderiza vista mensual
     */
    renderMonthView() {
        const monthView = this.container.querySelector('#month-view');
        if (!monthView) return;

        const currentDate = this.config.currentDate;

        // Filtrar notas para el mes actual
        const currentMonthNotes = this.getNotesForMonth(currentDate);

        monthView.innerHTML = `
            <div class="month-view-container">
                ${this.renderMonthSection(currentDate, currentMonthNotes, 'thisMonth')}
            </div>
        `;

        // Renderizar notas usando el NoteRenderer
        const notesList = monthView.querySelector('.notes-list');
        if (currentMonthNotes.length > 0 && notesList) {
            currentMonthNotes.forEach(note => {
                const noteHTML = this.rendererComponent.renderNote(note);
                const noteElement = document.createElement('div');
                noteElement.innerHTML = noteHTML;
                const noteNode = noteElement.firstElementChild;
                
                notesList.appendChild(noteNode);
                
                // Vincular eventos específicos de la nota
                this.rendererComponent.bindNoteEvents(noteNode);
            });
        }
    }

    /**
     * Renderiza vista semanal
     */
    renderWeekView() {
        const weekView = this.container.querySelector('#week-view');
        if (!weekView) return;

        const currentDate = this.config.currentDate;

        // Filtrar notas para la semana actual
        const currentWeekNotes = this.getNotesForWeek(currentDate);

        weekView.innerHTML = `
            <div class="week-view-container">
                ${this.renderWeekSection(currentDate, currentWeekNotes, 'thisWeek')}
            </div>
        `;

        // Renderizar notas usando el NoteRenderer
        const notesList = weekView.querySelector('.notes-list');
        if (currentWeekNotes.length > 0 && notesList) {
            currentWeekNotes.forEach(note => {
                const noteHTML = this.rendererComponent.renderNote(note);
                const noteElement = document.createElement('div');
                noteElement.innerHTML = noteHTML;
                const noteNode = noteElement.firstElementChild;
                
                notesList.appendChild(noteNode);
                
                // Vincular eventos específicos de la nota
                this.rendererComponent.bindNoteEvents(noteNode);
            });
        }
    }

    /**
     * Renderiza vista diaria
     */
    renderDayView() {
        const dayView = this.container.querySelector('#day-view');
        if (!dayView) return;

        const currentDate = this.config.currentDate;

        // Filtrar notas para el día actual
        const currentDayNotes = this.getNotesForDate(currentDate);

        dayView.innerHTML = `
            <div class="day-view-container">
                ${this.renderDaySection(currentDayNotes)}
            </div>
        `;

        // Renderizar notas usando el NoteRenderer
        const notesList = dayView.querySelector('.notes-list');
        if (currentDayNotes.length > 0 && notesList) {
            currentDayNotes.forEach(note => {
                const noteHTML = this.rendererComponent.renderNote(note);
                const noteElement = document.createElement('div');
                noteElement.innerHTML = noteHTML;
                const noteNode = noteElement.firstElementChild;
                
                notesList.appendChild(noteNode);
                
                // Vincular eventos específicos de la nota
                this.rendererComponent.bindNoteEvents(noteNode);
            });
        }
    }

    /**
     * Obtiene notas para una fecha específica
     */
    getNotesForDate(date) {
        const dateHelpers = window.StickyAgendaDateHelpers;
        const targetDateStr = dateHelpers.toDateString(date);
        
        return this.filteredNotes.filter(note => {
            if (note.startDate && dateHelpers.toDateString(note.startDate) === targetDateStr) return true;
            if (note.endDate && dateHelpers.toDateString(note.endDate) === targetDateStr) return true;
            if (!note.startDate && !note.endDate && dateHelpers.toDateString(note.createdAt) === targetDateStr) return true;
            return false;
        });
    }

    /**
     * Obtiene notas para una semana específica
     */
    getNotesForWeek(date) {
        return this.filteredNotes.filter(note => {
            if (note.startDate && this.isSameWeek(note.startDate, date)) return true;
            if (note.endDate && this.isSameWeek(note.endDate, date)) return true;
            if (!note.startDate && !note.endDate && this.isSameWeek(note.createdAt, date)) return true;
            return false;
        });
    }

    /**
     * Obtiene notas para un mes específico
     */
    getNotesForMonth(date) {
        return this.filteredNotes.filter(note => {
            if (note.startDate && this.isSameMonth(note.startDate, date)) return true;
            if (note.endDate && this.isSameMonth(note.endDate, date)) return true;
            if (!note.startDate && !note.endDate && this.isSameMonth(note.createdAt, date)) return true;
            return false;
        });
    }

    /**
     * Renderiza una sección de día
     */
    renderDaySection(notes) {

        return `
            <div class="day-section bg-white rounded-lg border p-4">
                <div class="section-header mb-4">
                    <p class="text-sm text-gray-500">${notes.length} nota${notes.length !== 1 ? 's' : ''}</p>
                </div>
                
                <div class="notes-list space-y-3">
                    ${notes.length === 0 ? `
                        <div class="text-center py-8 text-gray-500">
                            ${this.config.language === 'en' ? 'No notes for this day' : 'No hay notas para este día'}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Renderiza una sección de semana
     */
    renderWeekSection(date, notes, periodKey) {
        const dateHelpers = window.StickyAgendaDateHelpers;
        const sectionTitle = this.getText(periodKey);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        return `
            <div class="week-section bg-white rounded-lg border p-4">
                <div class="section-header mb-4">
                    <p class="text-sm text-gray-500"> ${notes.length} nota${notes.length !== 1 ? 's' : ''}
                    </p>
                </div>
                
                <div class="notes-list space-y-3">
                    ${notes.length === 0 ? `
                        <div class="text-center py-8 text-gray-500">
                            ${this.config.language === 'en' ? 'No notes for this week' : 'No hay notas para esta semana'}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Renderiza una sección de mes
     */
    renderMonthSection(date, notes, periodKey) {
        const sectionTitle = this.getText(periodKey);
        const monthName = date.toLocaleDateString(this.config.language === 'en' ? 'en-US' : 'es-ES', { 
            month: 'long', 
            year: 'numeric' 
        });

        return `
            <div class="month-section bg-white rounded-lg border p-4">
                <div class="section-header mb-4">
                    <p class="text-sm text-gray-500">${notes.length} nota${notes.length !== 1 ? 's' : ''}</p>
                </div>
                
                <div class="notes-list space-y-3">
                    ${notes.length === 0 ? `
                        <div class="text-center py-8 text-gray-500">
                            ${this.config.language === 'en' ? 'No notes for this month' : 'No hay notas para este mes'}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Renderiza estado vacío
     */
    renderEmptyState() {
        return `
            <div class="col-span-full text-center py-12">
                <div class="text-gray-400 mb-4">
                    <svg class="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                </div>
                <h3 class="text-lg font-medium text-gray-900 mb-2">No hay notas</h3>
                <p class="text-gray-500 mb-4">
                    ${Object.keys(this.currentFilters).some(key => this.currentFilters[key]) 
                        ? 'No se encontraron notas con los filtros aplicados'
                        : ''}
                </p>
            </div>
        `;
    }

    /**
     * Actualiza el contador de notas
     */
    updateNotesCount() {
        const counter = this.container.querySelector('#notes-count');
        if (!counter) return;

        const total = this.notes.length;
        const filtered = this.filteredNotes.length;
        const completed = this.notes.filter(note => note.status === 'completed').length;

        if (total === 0) {
            counter.textContent = 'No hay notas creadas';
        } else if (filtered !== total) {
            counter.textContent = `Mostrando ${filtered} de ${total} notas • ${completed} completadas`;
        } else {
            counter.textContent = `${total} nota${total !== 1 ? 's' : ''} • ${completed} completada${completed !== 1 ? 's' : ''}`;
        }
    }

    /**
     * Vincula eventos globales
     */
    bindEvents() {
        // Botón agregar nota
        const addBtn = this.container.querySelector('#add-note-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.showAddNoteModal());
        }

        // Event listeners de navegación
        if (this.config.showDateNavigation) {
            // Navegación anterior
            const navPrevious = this.container.querySelector('#nav-previous');
            if (navPrevious) {
                navPrevious.addEventListener('click', () => this.navigateToDate('previous'));
            }

            // Navegación siguiente
            const navNext = this.container.querySelector('#nav-next');
            if (navNext) {
                navNext.addEventListener('click', () => this.navigateToDate('next'));
            }

            // Navegación a hoy
            const navToday = this.container.querySelector('#nav-today');
            if (navToday) {
                navToday.addEventListener('click', () => this.navigateToDate('current'));
            }
        }

        // Event listeners para selector de vistas
        const viewButtons = this.container.querySelectorAll('.view-mode-btn');
        viewButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const viewMode = e.target.closest('.view-mode-btn').dataset.viewMode;
                this.changeViewMode(viewMode);
            });
        });

        // Event listener global para acciones de notas en vistas de agenda
        this.container.addEventListener('click', (e) => {
            const target = e.target;
            
            // Checkbox de todos en vista agenda
            if (target.classList.contains('todo-checkbox')) {
                const noteId = target.dataset.noteId;
                const todoId = target.dataset.todoId;
                this.toggleTodo(noteId, todoId);
            }
        });

        // Eventos de teclado
        document.addEventListener('keydown', (e) => this.handleKeydown(e));
    }

    /**
     * Maneja eventos de teclado
     */
    handleKeydown(event) {
        // Ctrl+N o Cmd+N: Nueva nota
        if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
            event.preventDefault();
            this.showAddNoteModal();
        }

        // Escape: Cerrar modales
        if (event.key === 'Escape') {
            this.closeModals();
        }
    }

    // === GESTIÓN DE NOTAS ===

    /**
     * Establece las notas desde un array de datos
     */
    setNotes(notesData) {
        this.notes = notesData.map(noteData => {
            try {
                return new window.StickyAgendaNote(noteData);
            } catch (error) {
                console.error('Error al crear nota:', error, noteData);
                return null;
            }
        }).filter(Boolean);

        this.applyFilters();
    }

    /**
     * Obtiene una nota por ID
     */
    getNote(noteId) {
        return this.notes.find(note => note.id === noteId);
    }

    /**
     * Obtiene todas las notas
     */
    getAllNotes() {
        return [...this.notes];
    }

    /**
     * Actualiza la posición de una nota
     */
    updateNotePosition(noteId, position) {
        const note = this.getNote(noteId);
        if (!note) return;

        note.updatePosition(position.x, position.y);
        this.autoSave();
    }

    // === FILTROS ===

    /**
     * Aplica los filtros actuales
     */
    applyFilters() {
        if (Object.keys(this.currentFilters).length === 0) {
            this.filteredNotes = [...this.notes];
        } else {
            this.filteredNotes = this.notes.filter(note => 
                note.matchesFilter(this.currentFilters)
            );
        }

        // Ordenar notas (pendientes primero, luego por fecha de creación)
        this.filteredNotes.sort((a, b) => {
            // Completadas al final
            if (a.status === 'completed' && b.status !== 'completed') return 1;
            if (b.status === 'completed' && a.status !== 'completed') return -1;
            
            // Por fecha de creación (más recientes primero)
            return new Date(b.createdAt) - new Date(a.createdAt);
        });
    }

    /**
     * Filtra notas con criterios específicos
     */
    filterNotes(criteria) {
        if (this.filtersComponent) {
            this.filtersComponent.setFilters(criteria);
        } else {
            this.currentFilters = { ...this.currentFilters, ...criteria };
            this.applyFilters();
            this.renderNotes();
            this.updateNotesCount();
        }

        return this.filteredNotes;
    }

    /**
     * Limpia todos los filtros
     */
    clearFilters() {
        if (this.filtersComponent) {
            this.filtersComponent.clearAllFilters();
        } else {
            this.currentFilters = {};
            this.applyFilters();
            this.renderNotes();
            this.updateNotesCount();
        }
    }

    // === EVENTOS DE COMPONENTES ===

    /**
     * Maneja click en botón completar
     */
    handleCompleteClick(data) {
        this.markAsDone(data.noteId);
    }



    /**
     * Maneja toggle de todos
     */
    handleTodoToggle(data) {
        try {
            const note = this.getNote(data.noteId);
            if (!note) return;

            note.updateTodo(data.todoId, { completed: data.completed });
            
            // Re-renderizar la nota específica
            const noteElement = this.container.querySelector(`[data-note-id="${data.noteId}"]`);
            if (noteElement) {
                this.rendererComponent.updateNoteInDOM(note, this.container.querySelector('#notes-grid'));
            }
            
            this.autoSave();
            
        } catch (error) {
            console.error('Error al actualizar todo:', error);
        }
    }

    /**
     * Maneja click en nota
     */
    handleNoteClick(data) {
        // Por defecto, abrir modal de edición
        this.showEditNoteModal(data.noteId);
    }

    // === EVENTOS ===

    /**
     * Registra callback para eventos
     */
    on(eventType, callback) {
        if (typeof callback !== 'function') {
            throw new Error('Callback debe ser una función');
        }

        if (!this.eventCallbacks[eventType]) {
            this.eventCallbacks[eventType] = [];
        }

        this.eventCallbacks[eventType].push(callback);
    }

    /**
     * Desregistra callback de eventos
     */
    off(eventType, callback) {
        if (!this.eventCallbacks[eventType]) return;

        const index = this.eventCallbacks[eventType].indexOf(callback);
        if (index > -1) {
            this.eventCallbacks[eventType].splice(index, 1);
        }
    }

    /**
     * Notifica evento a los callbacks registrados
     */
    notifyEvent(eventType, data) {
        const callbacks = this.eventCallbacks[eventType] || [];
        callbacks.forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error en callback de evento ${eventType}:`, error);
            }
        });
    }

    // === UTILIDADES ===

    /**
     * Refresca el layout completo
     */
    refreshLayout() {
        this.applyFilters();
        this.renderNotes();
        this.updateNotesCount();
    }

    /**
     * Resetea todas las posiciones de las notas
     */
    resetPositions() {
        this.notes.forEach(note => {
            note.updatePosition(0, 0);
        });

        if (this.dragDropComponent) {
            this.dragDropComponent.resetAllPositions();
        }

        this.autoSave();
    }

    // === NAVEGACIÓN Y VISTAS ===

    /**
     * Navega a una fecha específica
     */
    navigateToDate(direction) {
        let newDate;

        switch(direction) {
            case 'previous':
                newDate = new Date(this.config.currentDate);
                if (this.config.viewMode === 'day') {
                    newDate.setDate(newDate.getDate() - 1);
                } else if (this.config.viewMode === 'week') {
                    newDate.setDate(newDate.getDate() - 7);
                } else if (this.config.viewMode === 'month') {
                    newDate.setMonth(newDate.getMonth() - 1);
                }
                break;
            case 'current':
                newDate = new Date();
                break;
            case 'next':
                newDate = new Date(this.config.currentDate);
                if (this.config.viewMode === 'day') {
                    newDate.setDate(newDate.getDate() + 1);
                } else if (this.config.viewMode === 'week') {
                    newDate.setDate(newDate.getDate() + 7);
                } else if (this.config.viewMode === 'month') {
                    newDate.setMonth(newDate.getMonth() + 1);
                }
                break;
            default:
                newDate = new Date();
        }

        this.config.currentDate = newDate;
        this.updateDateNavigation();
        this.renderInterface();
    }

    /**
     * Actualiza la navegación de fechas
     */
    updateDateNavigation() {
        // Re-renderizar toda la estructura para actualizar la navegación
        this.setupContainer();
        this.renderInterface();
        this.bindEvents();
    }

    /**
     * Cambia el modo de vista
     */
    changeViewMode(viewMode) {
        this.config.viewMode = viewMode;
        
        // Actualizar botones de vista
        const viewButtons = this.container.querySelectorAll('.view-mode-btn');
        viewButtons.forEach(btn => {
            if (btn.dataset.viewMode === viewMode) {
                btn.classList.add('bg-blue-600', 'text-white');
                btn.classList.remove('text-gray-700', 'hover:bg-gray-100');
            } else {
                btn.classList.remove('bg-blue-600', 'text-white');
                btn.classList.add('text-gray-700', 'hover:bg-gray-100');
            }
        });

        // Re-renderizar la estructura completa con nueva navegación
        this.setupContainer();
        this.renderInterface();
        this.bindEvents();
    }

    /**
     * Muestra/oculta elementos según la vista actual
     */
    toggleViewElements() {
        const filtersSection = this.container.querySelector('#filters-section');
        const notesGrid = this.container.querySelector('#notes-grid');
        const viewContainers = this.container.querySelectorAll('.view-container');
        
        // Ocultar todos los contenedores de vista
        viewContainers.forEach(container => {
            container.style.display = 'none';
        });

        // Mostrar contenedor correspondiente
        const activeContainer = this.container.querySelector(`#${this.config.viewMode}-view`);
        if (activeContainer) {
            activeContainer.style.display = 'block';
        }

        // Mostrar/ocultar filtros solo en modo board
        if (filtersSection) {
            filtersSection.style.display = this.config.viewMode === 'board' ? 'block' : 'none';
        }
    }

    /**
     * Alterna el estado de un todo
     */
    toggleTodo(noteId, todoId) {
        const note = this.notes.find(n => n.id === noteId);
        if (!note || !note.todos) return;

        const todo = note.todos.find(t => t.id === todoId);
        if (!todo) return;

        todo.completed = !todo.completed;
        note.updatedAt = new Date();

        this.renderInterface();
        this.storageComponent.save(this.notes);
        this.notifyEvent('todoToggled', { note, todo });
    }

    /**
     * Obtiene estadísticas de uso
     */
    getStats() {
        const completed = this.notes.filter(n => n.status === 'completed').length;
        const pending = this.notes.filter(n => n.status === 'pending').length;
        const overdue = this.notes.filter(n => n.isOverdue && n.isOverdue()).length;

        return {
            total: this.notes.length,
            completed,
            pending,
            overdue,
            filtered: this.filteredNotes.length,
            categories: [...new Set(this.notes.map(n => n.category))],
            authors: [...new Set(this.notes.map(n => n.author))],
            isInitialized: this.isInitialized
        };
    }

    /**
     * Destruye la instancia
     */
    destroy() {
        // Limpiar componentes
        if (this.filtersComponent) {
            this.filtersComponent.destroy();
        }

        if (this.dragDropComponent) {
            this.dragDropComponent.destroy();
        }

        if (this.rendererComponent) {
            this.rendererComponent.destroy();
        }

        // Limpiar eventos
        this.eventCallbacks = {};

        // Limpiar contenedor
        if (this.container) {
            this.container.innerHTML = '';
            this.container.classList.remove('sticky-agenda');
        }

        // Marcar como destruida
        this.isInitialized = false;
        
        console.log('StickyAgenda destruida');
    }
}

// Exportar para uso global
window.StickyAgenda = StickyAgenda;
