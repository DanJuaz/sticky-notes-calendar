/**
 * Sistema de filtros para StickyAgenda
 */

class Filters {
    constructor(container, config = {}) {
        this.container = typeof container === 'string' 
            ? document.querySelector(container) 
            : container;
        
        if (!this.container) {
            throw new Error('Contenedor de filtros no encontrado');
        }

        this.config = {
            categories: config.categories || ['general', 'personal', 'trabajo', 'urgente'],
            showSearchBox: config.showSearchBox !== false,
            showDateFilters: config.showDateFilters !== false,
            showStatusFilters: config.showStatusFilters !== false,
            showCategoryFilters: config.showCategoryFilters !== false,
            showPriorityFilters: config.showPriorityFilters !== false,
            collapsible: config.collapsible !== false,
            ...config
        };

        this.currentFilters = {
            searchText: '',
            category: '',
            status: '',
            priority: null,
            author: '',
            dateRange: null,
            tags: []
        };

        this.callbacks = {
            onFilterChange: [],
            onFilterClear: []
        };

        this.init();
    }

    /**
     * Inicializa el componente de filtros
     */
    init() {
        this.render();
        this.bindEvents();
    }

    /**
     * Renderiza la interfaz de filtros
     */
    render() {
        const html = `
            <div class="sticky-agenda-filters bg-white rounded-lg shadow-sm border p-4 mb-4">
                ${this.config.collapsible ? this.renderToggleButton() : ''}
                
                <div class="filters-content ${this.config.collapsible ? 'hidden' : ''}" id="filters-content">
                    ${this.config.showSearchBox ? this.renderSearchBox() : ''}
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                        ${this.config.showStatusFilters ? this.renderStatusFilter() : ''}
                        ${this.config.showCategoryFilters ? this.renderCategoryFilter() : ''}
                        ${this.config.showPriorityFilters ? this.renderPriorityFilter() : ''}
                        ${this.config.showDateFilters ? this.renderDateFilter() : ''}
                    </div>
                    
                    <div class="flex justify-between items-center mt-4">
                        <div class="text-sm text-gray-500" id="filter-summary">
                            Mostrando todas las notas
                        </div>
                        <button type="button" 
                                class="text-sm text-blue-600 hover:text-blue-800 underline"
                                id="clear-filters">
                            Limpiar filtros
                        </button>
                    </div>
                </div>
            </div>
        `;

        this.container.innerHTML = html;
    }

    /**
     * Renderiza el botón de colapsar/expandir
     */
    renderToggleButton() {
        return `
            <button type="button" 
                    class="w-full flex items-center justify-between text-left font-medium text-gray-900 mb-2"
                    id="filters-toggle">
                <span class="flex items-center">
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z"/>
                    </svg>
                    Filtros
                </span>
                <svg class="w-5 h-5 transform transition-transform" id="filters-chevron">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                </svg>
            </button>
        `;
    }

    /**
     * Renderiza la caja de búsqueda
     */
    renderSearchBox() {
        return `
            <div class="relative">
                <input type="text" 
                       id="search-input"
                       class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                       placeholder="Buscar en títulos, descripciones, tags y todos...">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                    </svg>
                </div>
            </div>
        `;
    }

    /**
     * Renderiza el filtro de estado
     */
    renderStatusFilter() {
        return `
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select id="status-filter" 
                        class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="">Todos los estados</option>
                    <option value="pending">Pendiente</option>
                    <option value="completed">Completada</option>
                    <option value="archived">Archivada</option>
                </select>
            </div>
        `;
    }

    /**
     * Renderiza el filtro de categoría
     */
    renderCategoryFilter() {
        const options = this.config.categories.map(cat => 
            `<option value="${cat}">${cat.charAt(0).toUpperCase() + cat.slice(1)}</option>`
        ).join('');

        return `
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <select id="category-filter" 
                        class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="">Todas las categorías</option>
                    ${options}
                </select>
            </div>
        `;
    }

    /**
     * Renderiza el filtro de prioridad
     */
    renderPriorityFilter() {
        return `
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
                <select id="priority-filter" 
                        class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="">Todas las prioridades</option>
                    <option value="1">Alta</option>
                    <option value="2">Media</option>
                    <option value="3">Baja</option>
                </select>
            </div>
        `;
    }

    /**
     * Renderiza el filtro de fecha
     */
    renderDateFilter() {
        return `
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                <select id="date-filter" 
                        class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="">Todas las fechas</option>
                    <option value="today">Hoy</option>
                    <option value="tomorrow">Mañana</option>
                    <option value="thisWeek">Esta semana</option>
                    <option value="thisMonth">Este mes</option>
                    <option value="overdue">Vencidas</option>
                    <option value="custom">Rango personalizado...</option>
                </select>
            </div>
        `;
    }

    /**
     * Vincula eventos a los elementos de filtro
     */
    bindEvents() {
        const container = this.container;

        // Toggle de colapsar filtros
        const toggleBtn = container.querySelector('#filters-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggleFilters());
        }

        // Búsqueda de texto
        const searchInput = container.querySelector('#search-input');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.updateFilter('searchText', e.target.value);
                }, 300); // Debounce 300ms
            });
        }

        // Filtros de select
        const selects = container.querySelectorAll('select');
        selects.forEach(select => {
            select.addEventListener('change', (e) => {
                this.handleSelectChange(e.target);
            });
        });

        // Botón limpiar filtros
        const clearBtn = container.querySelector('#clear-filters');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearAllFilters());
        }
    }

    /**
     * Maneja cambios en los selects
     */
    handleSelectChange(select) {
        const value = select.value;
        
        switch (select.id) {
            case 'status-filter':
                this.updateFilter('status', value);
                break;
            case 'category-filter':
                this.updateFilter('category', value);
                break;
            case 'priority-filter':
                this.updateFilter('priority', value ? parseInt(value) : null);
                break;
            case 'date-filter':
                this.handleDateFilterChange(value);
                break;
        }
    }

    /**
     * Maneja cambios en el filtro de fecha
     */
    handleDateFilterChange(value) {
        if (!value) {
            this.updateFilter('dateRange', null);
            return;
        }

        const dateHelpers = window.StickyAgendaDateHelpers;
        if (!dateHelpers) {
            console.warn('DateHelpers no disponible');
            return;
        }

        let dateRange = null;

        switch (value) {
            case 'today':
                const today = dateHelpers.today();
                dateRange = { start: today, end: today };
                break;
            case 'tomorrow':
                const tomorrow = dateHelpers.tomorrow();
                dateRange = { start: tomorrow, end: tomorrow };
                break;
            case 'thisWeek':
            case 'thisMonth':
                const ranges = dateHelpers.getDateRanges();
                dateRange = ranges[value];
                break;
            case 'overdue':
                dateRange = { 
                    start: '2000-01-01', 
                    end: dateHelpers.today(),
                    overdue: true 
                };
                break;
            case 'custom':
                this.showCustomDatePicker();
                return;
        }

        this.updateFilter('dateRange', dateRange);
    }

    /**
     * Muestra selector de fecha personalizado
     */
    showCustomDatePicker() {
        // Por ahora, usar prompt simple. En futuro se puede implementar un date picker más elegante
        const start = prompt('Fecha de inicio (YYYY-MM-DD):');
        const end = prompt('Fecha de fin (YYYY-MM-DD):');

        if (start && end) {
            this.updateFilter('dateRange', { start, end });
        } else {
            // Resetear el select si canceló
            const dateSelect = this.container.querySelector('#date-filter');
            if (dateSelect) dateSelect.value = '';
        }
    }

    /**
     * Actualiza un filtro específico
     */
    updateFilter(filterType, value) {
        this.currentFilters[filterType] = value;
        this.updateFilterSummary();
        this.notifyFilterChange();
    }

    /**
     * Limpia todos los filtros
     */
    clearAllFilters() {
        this.currentFilters = {
            searchText: '',
            category: '',
            status: '',
            priority: null,
            author: '',
            dateRange: null,
            tags: []
        };

        // Resetear inputs
        const searchInput = this.container.querySelector('#search-input');
        if (searchInput) searchInput.value = '';

        const selects = this.container.querySelectorAll('select');
        selects.forEach(select => select.value = '');

        this.updateFilterSummary();
        this.notifyFilterClear();
    }

    /**
     * Alterna la visibilidad de los filtros
     */
    toggleFilters() {
        const content = this.container.querySelector('#filters-content');
        const chevron = this.container.querySelector('#filters-chevron');
        
        if (content && chevron) {
            content.classList.toggle('hidden');
            chevron.classList.toggle('rotate-180');
        }
    }

    /**
     * Actualiza el resumen de filtros activos
     */
    updateFilterSummary() {
        const summary = this.container.querySelector('#filter-summary');
        if (!summary) return;

        const activeFilters = [];
        
        if (this.currentFilters.searchText) {
            activeFilters.push(`texto: "${this.currentFilters.searchText}"`);
        }
        
        if (this.currentFilters.status) {
            activeFilters.push(`estado: ${this.currentFilters.status}`);
        }
        
        if (this.currentFilters.category) {
            activeFilters.push(`categoría: ${this.currentFilters.category}`);
        }
        
        if (this.currentFilters.priority) {
            const priorities = { 1: 'Alta', 2: 'Media', 3: 'Baja' };
            activeFilters.push(`prioridad: ${priorities[this.currentFilters.priority]}`);
        }
        
        if (this.currentFilters.dateRange) {
            if (this.currentFilters.dateRange.overdue) {
                activeFilters.push('fecha: vencidas');
            } else {
                activeFilters.push('fecha: rango personalizado');
            }
        }

        if (activeFilters.length === 0) {
            summary.textContent = 'Mostrando todas las notas';
        } else {
            summary.textContent = `Filtros activos: ${activeFilters.join(', ')}`;
        }
    }

    /**
     * Obtiene los filtros actuales
     */
    getCurrentFilters() {
        return { ...this.currentFilters };
    }

    /**
     * Establece filtros programáticamente
     */
    setFilters(filters) {
        this.currentFilters = { ...this.currentFilters, ...filters };
        
        // Actualizar UI
        const searchInput = this.container.querySelector('#search-input');
        if (searchInput && filters.searchText !== undefined) {
            searchInput.value = filters.searchText || '';
        }

        const statusSelect = this.container.querySelector('#status-filter');
        if (statusSelect && filters.status !== undefined) {
            statusSelect.value = filters.status || '';
        }

        const categorySelect = this.container.querySelector('#category-filter');
        if (categorySelect && filters.category !== undefined) {
            categorySelect.value = filters.category || '';
        }

        const prioritySelect = this.container.querySelector('#priority-filter');
        if (prioritySelect && filters.priority !== undefined) {
            prioritySelect.value = filters.priority || '';
        }

        this.updateFilterSummary();
        this.notifyFilterChange();
    }

    /**
     * Agrega callback para cambios de filtro
     */
    onFilterChange(callback) {
        if (typeof callback === 'function') {
            this.callbacks.onFilterChange.push(callback);
        }
    }

    /**
     * Agrega callback para limpiar filtros
     */
    onFilterClear(callback) {
        if (typeof callback === 'function') {
            this.callbacks.onFilterClear.push(callback);
        }
    }

    /**
     * Notifica cambios de filtro
     */
    notifyFilterChange() {
        const filters = this.getCurrentFilters();
        this.callbacks.onFilterChange.forEach(callback => {
            try {
                callback(filters);
            } catch (error) {
                console.error('Error en callback de filtro:', error);
            }
        });
    }

    /**
     * Notifica limpieza de filtros
     */
    notifyFilterClear() {
        this.callbacks.onFilterClear.forEach(callback => {
            try {
                callback();
            } catch (error) {
                console.error('Error en callback de limpiar filtros:', error);
            }
        });
    }

    /**
     * Destruye el componente
     */
    destroy() {
        this.callbacks = { onFilterChange: [], onFilterClear: [] };
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

// Exportar para uso global
window.StickyAgendaFilters = Filters;
