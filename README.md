# Predator - Food Chain Entity Management

A modern Vue.js web application for exploring and visualizing food chain entities and their relationships. Built with TypeScript, Tailwind CSS, and Vue 3 Composition API.

## Features

### 🔍 **Predation View** (Main Page)
- 🌐 **Entity Exploration** - Browse and explore food chain entities
- 🔗 **Relationship Visualization** - View entity relationships and connections
- 📊 **Multiple Entity Types** - Support for ingredients, recipes, meals, and more
- 🔔 **Interactive Interface** - Expandable cards and nested relationships
- ⚡ **Real-time Updates** - Live API status monitoring

### ✨ **Entity Creation**
- 🆕 **Create New Entities** - Add new entities of any type with intuitive forms
- 🎯 **Drag & Drop Relationships** - Easily attach related entities by dragging from sidebar
- 📋 **Organized Entity Lists** - Collapsible groups with search functionality
- 🔄 **Real-time Filtering** - Available entities update as you attach relationships
- 💾 **Batch Operations** - Create entity and all relationships in a single save operation

## Project Structure

```
src/
├── components/          # Reusable Vue components
├── views/              # Page components
├── composables/        # Vue composition functions
├── router/             # Vue Router configuration
├── assets/             # Static assets and styles
├── App.vue             # Root component
└── main.ts             # Application entry point
```

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:3000`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Demo Features

### Main Application
- Entity exploration with expandable relationship trees
- Tab navigation between entity types
- Real-time search and filtering
- Interactive entity creation and management
- API status monitoring and notifications

### Components Showcase
- Various button states and interactions
- Interactive cards with progress indicators
- Form elements (inputs, selects, checkboxes, sliders)
- Animation demonstrations

## Technologies Used

- **Vue 3** - Progressive JavaScript framework
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Vite** - Next generation frontend tooling
- **Vue Router** - Official router for Vue.js
- **ESLint** - Code linting
- **Prettier** - Code formatting

## Best Practices Implemented

- **Component Composition** - Using Vue 3 Composition API
- **Type Safety** - Full TypeScript integration
- **Responsive Design** - Mobile-first approach with Tailwind
- **Code Organization** - Logical folder structure
- **State Management** - Custom composables for shared state
- **Performance** - Optimized builds with Vite
- **Code Quality** - ESLint and Prettier configuration

## Customization

### Tailwind Configuration
Modify `tailwind.config.js` to customize colors, animations, and other design tokens.

### Adding New Routes
Add new routes in `src/router/index.ts` and create corresponding view components.

### Creating Components
Follow the established patterns in the `src/components/` directory for reusable components.

## License

This project is for demonstration purposes.
