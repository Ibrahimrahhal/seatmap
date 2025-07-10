# Seatmap Creator

A powerful React component for creating interactive seating layouts with drag and drop, zoom, and export capabilities.

## Features

- 🎯 **Interactive Canvas**: Create seating layouts with drag and drop functionality
- 🪑 **Flexible Sections**: Add regular sections and label sections with custom colors
- 🎨 **Visual Editor**: Resize, rotate, and customize sections and seats
- 🔍 **Zoom & Pan**: Zoom in/out with Ctrl+scroll and pan with space key
- 📦 **Grid Filling**: Automatically fill sections with seats in a grid pattern
- 🏷️ **Smart ID Generation**: Automatic seat ID generation with editing capabilities
- 📋 **Context Menus**: Right-click for advanced options on sections and seats
- 📤 **JSON Export**: Export your layout as JSON for integration
- 🎨 **Customizable**: Full TypeScript support with customizable interfaces

## Installation

```bash
npm install seatmap-creator
```

## Quick Start

```tsx
import React, { useState } from 'react';
import { SeatingEditor, type SeatingLayout } from 'seatmap-creator';

function App() {
  const [layout, setLayout] = useState<SeatingLayout>({
    sections: [],
    scale: 1
  });

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <SeatingEditor
        onLayoutChange={setLayout}
        initialLayout={layout}
      />
    </div>
  );
}
```

## API Reference

### SeatingEditor Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `onLayoutChange` | `(layout: SeatingLayout) => void` | No | Callback when layout changes |
| `initialLayout` | `SeatingLayout` | No | Initial layout configuration |

### Types

#### SeatingLayout
```typescript
interface SeatingLayout {
  sections: Section[];
  scale: number;
}
```

#### Section
```typescript
interface Section {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  seats: Seat[];
  type: 'section' | 'label';
}
```

#### Seat
```typescript
interface Seat {
  id: string;
  x: number;
  y: number;
  row: string;
  number: number;
  sectionId: string;
  seatSize: number;
}
```

## Usage Examples

### Basic Usage
```tsx
import { SeatingEditor } from 'seatmap-creator';

function MySeatingApp() {
  return (
    <SeatingEditor
      onLayoutChange={(layout) => {
        console.log('Layout updated:', layout);
      }}
    />
  );
}
```

### With Initial Layout
```tsx
import { SeatingEditor, type SeatingLayout } from 'seatmap-creator';

const initialLayout: SeatingLayout = {
  sections: [
    {
      id: 'section-1',
      name: 'VIP Section',
      color: '#ff6b6b',
      x: 50,
      y: 50,
      width: 200,
      height: 150,
      rotation: 0,
      seats: [],
      type: 'section'
    }
  ],
  scale: 1
};

function MySeatingApp() {
  return (
    <SeatingEditor
      initialLayout={initialLayout}
      onLayoutChange={(layout) => {
        // Handle layout changes
      }}
    />
  );
}
```

## Features in Detail

### 🎯 Interactive Canvas
- Drag and drop sections and seats
- Resize sections with handles
- Rotate sections with visual feedback
- Pan mode (hold SPACE key)

### 🪑 Section Management
- **Regular Sections**: Can contain seats, support grid filling
- **Label Sections**: Text-only sections for labels and titles
- **Context Menus**: Right-click for duplicate, edit, delete, color change
- **Smart Positioning**: Sections snap and align properly

### 🎨 Seat Management
- **Individual Seats**: Click "Add Seat" tool and click in sections
- **Grid Filling**: Right-click section → "Fill with Seats" for bulk creation
- **Smart IDs**: Automatic ID generation (e.g., "Section A-A-1", "Section B-X7K")
- **Seat Editing**: Right-click seats to edit IDs or delete

### 🔍 Navigation
- **Zoom**: Ctrl + scroll wheel or zoom buttons
- **Pan**: Hold SPACE key and drag
- **Visual Feedback**: Cursor changes during pan mode

### 📤 Export
The layout is automatically available as a JSON object through the `onLayoutChange` callback, making it easy to save and restore layouts.

## Development

### Building the Library
```bash
npm run build:lib
```

### Development Server
```bash
npm run dev
```

## Dependencies

- **React**: ^16.8.0 (peer dependency)
- **React DOM**: ^16.8.0 (peer dependency)
- **Konva**: ^9.3.22
- **React Konva**: ^19.0.7

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## License

MIT © [Ibrahim Rahhal](https://github.com/ibrahimrahhal)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

- 📧 Email: ibrahim.rahhal3636@gmail.com
- 🐛 Issues: [GitHub Issues](https://github.com/ibrahimrahhal/seatmap-creator/issues)
- 📖 Documentation: [GitHub README](https://github.com/ibrahimrahhal/seatmap-creator#readme) 
