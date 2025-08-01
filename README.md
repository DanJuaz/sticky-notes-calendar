# StickyAgenda 📝

Una librería JavaScript vanilla para gestionar tareas visuales tipo "post-it" en una agenda visual. Diseñada para proyectos legacy PHP + Smarty + jQuery, sin dependencias de build tools.

## ✨ Características

- 📌 Notas visuales tipo post-it arrastrables (Drag & Drop)
- 📅 Gestión de fechas inicio/fin y estados
- 🏷️ Categorías y prioridades
- ✅ To-do lists internas por nota
- 🔍 Filtros avanzados (fecha, categoría, estado, texto)
- 📱 Diseño responsive optimizado para móviles
- 💾 Persistencia en localStorage o backend PHP
- 🎨 Integración con TailwindCSS

## 🚀 Instalación

### Via CDN (próximamente)
```html
<script src="https://cdn.jsdelivr.net/npm/sticky-agenda/dist/sticky-agenda.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/sticky-agenda/dist/sticky-agenda.min.css">
```

### Local Development
```html
<!-- Dependencias -->
<script src="https://cdn.tailwindcss.com"></script>
<script src="https://cdn.jsdelivr.net/npm/interactjs/dist/interact.min.js"></script>

<!-- StickyAgenda -->
<link rel="stylesheet" href="src/styles/sticky-agenda.css">
<script src="src/sticky-agenda.js"></script>
```

## 📖 Uso Básico

```html
<div id="agenda-container"></div>

<script>
const agenda = new StickyAgenda({
  container: '#agenda-container',
  user: 'juan_perez',
  config: {
    allowDragDrop: true,
    autoSave: true,
    storageType: 'localStorage',
    defaultColor: '#ffeb3b',
    categories: ['personal', 'trabajo', 'urgente']
  }
});

// Agregar una nota
agenda.addNote({
  title: 'Reunión cliente',
  description: 'Revisar propuesta proyecto',
  category: 'trabajo',
  startDate: '2025-07-30',
  endDate: '2025-07-31'
});
</script>
```

## 📊 Modelo de Datos

### Estructura de una Nota
```javascript
{
  id: "unique-id",
  title: "Título de la nota",
  description: "Descripción detallada",
  
  // Metadatos temporales
  createdAt: "2025-07-30T10:30:00Z",
  startDate: "2025-07-30",
  endDate: "2025-08-05",
  completedAt: null,
  
  // Usuario y clasificación
  author: "nombre_usuario",
  category: "trabajo",
  priority: 1, // 1=alta, 2=media, 3=baja
  
  // Estado y visualización
  status: "pending", // pending, completed, archived
  position: { x: 100, y: 200 },
  color: "#ffeb3b",
  
  // To-do list interna
  todos: [
    {
      id: "todo-1",
      text: "Subtarea 1",
      completed: false,
      createdAt: "2025-07-30T10:35:00Z"
    }
  ],
  
  // Metadatos adicionales
  tags: ["reunión", "cliente"],
  attachments: []
}
```

## 🛠️ API

### Inicialización
```javascript
const agenda = new StickyAgenda(options)
```

### Métodos Principales
```javascript
// Gestión de notas
agenda.addNote(noteData)
agenda.updateNote(noteId, updateData)
agenda.deleteNote(noteId)
agenda.getNote(noteId)
agenda.getAllNotes()

// Estados
agenda.markAsDone(noteId)
agenda.markAsPending(noteId)

// Filtros
agenda.filterNotes(criteria)
agenda.clearFilters()

// Exportación
agenda.exportToPDF()
agenda.exportToJSON()
```

### Eventos
```javascript
agenda.on('noteAdded', (note) => console.log('Nota agregada:', note))
agenda.on('noteCompleted', (note) => console.log('Nota completada:', note))
agenda.on('noteDeleted', (noteId) => console.log('Nota eliminada:', noteId))
```

## 🏗️ Estructura del Proyecto

```
/post-it/
├── src/
│   ├── sticky-agenda.js      # Clase principal
│   ├── models/
│   │   ├── note.js          # Modelo StickyNote
│   │   └── todo.js          # Modelo Todo
│   ├── components/
│   │   ├── note-renderer.js # Renderizado visual
│   │   ├── filters.js       # Sistema de filtros
│   │   └── drag-drop.js     # Drag & Drop
│   ├── utils/
│   │   ├── date-helpers.js  # Utilidades de fechas
│   │   ├── storage.js       # Persistencia
│   │   └── validators.js    # Validaciones
│   └── styles/
│       └── sticky-agenda.css
├── examples/
│   ├── basic.html
│   └── with-backend.html
└── dist/ (futuro bundle)
```

## 📱 Responsive Design

- **Desktop**: Grid de 4-6 columnas, drag & drop completo
- **Tablet**: Grid de 2-3 columnas, gestos touch
- **Mobile**: Lista vertical, swipe gestures

## 🔧 Desarrollo

```bash
# Clonar proyecto
git clone [repo-url]

# Abrir index.html en navegador para desarrollo
# No requiere build tools
```

## 📄 Licencia

MIT License
