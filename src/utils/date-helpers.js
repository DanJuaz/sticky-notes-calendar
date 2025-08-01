/**
 * Utilidades de fechas para StickyAgenda
 */

class DateHelpers {
    /**
     * Genera timestamp ISO actual
     */
    static now() {
        return new Date().toISOString();
    }

    /**
     * Convierte fecha a formato YYYY-MM-DD
     */
    static toDateString(date) {
        if (!date) return null;
        
        const dateObj = date instanceof Date ? date : new Date(date);
        return dateObj.toISOString().split('T')[0];
    }

    /**
     * Convierte fecha a formato legible (DD/MM/YYYY)
     */
    static toDisplayDate(date, format = 'DD/MM/YYYY') {
        if (!date) return '';
        
        const dateObj = date instanceof Date ? date : new Date(date);
        const day = dateObj.getDate().toString().padStart(2, '0');
        const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
        const year = dateObj.getFullYear();

        switch (format) {
            case 'DD/MM/YYYY':
                return `${day}/${month}/${year}`;
            case 'MM/DD/YYYY':
                return `${month}/${day}/${year}`;
            case 'YYYY-MM-DD':
                return `${year}-${month}-${day}`;
            default:
                return `${day}/${month}/${year}`;
        }
    }

    /**
     * Obtiene la fecha de hoy en formato YYYY-MM-DD
     */
    static today() {
        return this.toDateString(new Date());
    }

    /**
     * Obtiene la fecha de mañana en formato YYYY-MM-DD
     */
    static tomorrow() {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return this.toDateString(tomorrow);
    }

    /**
     * Verifica si una fecha es hoy
     */
    static isToday(date) {
        if (!date) return false;
        return this.toDateString(date) === this.today();
    }

    /**
     * Verifica si una fecha es mañana
     */
    static isTomorrow(date) {
        if (!date) return false;
        return this.toDateString(date) === this.tomorrow();
    }

    /**
     * Verifica si una fecha ya pasó
     */
    static isPast(date) {
        if (!date) return false;
        const dateObj = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        dateObj.setHours(0, 0, 0, 0);
        return dateObj < today;
    }

    /**
     * Verifica si una fecha está en el futuro
     */
    static isFuture(date) {
        if (!date) return false;
        const dateObj = new Date(date);
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        return dateObj > today;
    }

    /**
     * Calcula días entre dos fechas
     */
    static daysBetween(startDate, endDate) {
        if (!startDate || !endDate) return 0;
        
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    /**
     * Verifica si una fecha está en un rango
     */
    static isInRange(date, startDate, endDate) {
        if (!date) return false;
        
        const checkDate = new Date(date);
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;

        if (start && checkDate < start) return false;
        if (end && checkDate > end) return false;
        
        return true;
    }

    /**
     * Obtiene el nombre del día de la semana
     */
    static getDayName(date, locale = 'es-ES') {
        if (!date) return '';
        
        const dateObj = date instanceof Date ? date : new Date(date);
        return dateObj.toLocaleDateString(locale, { weekday: 'long' });
    }

    /**
     * Obtiene el nombre del mes
     */
    static getMonthName(date, locale = 'es-ES') {
        if (!date) return '';
        
        const dateObj = date instanceof Date ? date : new Date(date);
        return dateObj.toLocaleDateString(locale, { month: 'long' });
    }

    /**
     * Genera un rango de fechas para filtros
     */
    static getDateRanges() {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        
        const thisWeekStart = new Date(today);
        thisWeekStart.setDate(today.getDate() - today.getDay());
        
        const thisWeekEnd = new Date(thisWeekStart);
        thisWeekEnd.setDate(thisWeekStart.getDate() + 6);
        
        const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const thisMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        return {
            today: {
                start: this.toDateString(today),
                end: this.toDateString(today),
                label: 'Hoy'
            },
            tomorrow: {
                start: this.toDateString(tomorrow),
                end: this.toDateString(tomorrow),
                label: 'Mañana'
            },
            thisWeek: {
                start: this.toDateString(thisWeekStart),
                end: this.toDateString(thisWeekEnd),
                label: 'Esta semana'
            },
            thisMonth: {
                start: this.toDateString(thisMonthStart),
                end: this.toDateString(thisMonthEnd),
                label: 'Este mes'
            }
        };
    }

    /**
     * Parsea una fecha desde formato de entrada
     */
    static parseDate(dateInput) {
        if (!dateInput) return null;
        
        // Si ya es un objeto Date
        if (dateInput instanceof Date) {
            return dateInput;
        }
        
        // Si es string ISO o formato YYYY-MM-DD
        if (typeof dateInput === 'string') {
            return new Date(dateInput);
        }
        
        return null;
    }

    /**
     * Formatea tiempo transcurrido (ej: "hace 2 horas")
     */
    static timeAgo(date) {
        if (!date) return '';
        
        const dateObj = date instanceof Date ? date : new Date(date);
        const now = new Date();
        const diffMs = now - dateObj;
        
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffMinutes < 1) return 'ahora mismo';
        if (diffMinutes < 60) return `hace ${diffMinutes} minuto${diffMinutes > 1 ? 's' : ''}`;
        if (diffHours < 24) return `hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
        if (diffDays < 7) return `hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
        
        return this.toDisplayDate(dateObj);
    }
}

// Exportar para uso global
window.StickyAgendaDateHelpers = DateHelpers;
