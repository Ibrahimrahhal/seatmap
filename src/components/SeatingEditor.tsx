import React, { useState, useRef, useCallback, useEffect, useLayoutEffect } from 'react';
import { Stage, Layer, Group, Rect, Text, Circle, Transformer } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';

/**
 * SeatingEditor - A React component for creating and editing seating layouts
 * 
 * Features:
 * - Interactive seating chart editor with drag-and-drop functionality
 * - Add, edit, and delete sections and seats
 * - Rotate and resize sections
 * - Fill sections with grid-based seats
 * - Export layouts to JSON
 * - Zoom and pan controls
 * - Context menus for section and seat management
 * 
 * Props:
 * @param {function} onLayoutChange - Callback function called when layout changes
 * @param {SeatingLayout} initialLayout - Initial layout configuration
 * @param {string|number} height - Height of the editor container (default: '100vh')
 * @param {string|number} width - Width of the editor container (default: '100%')
 * @param {string} backgroundColor - Background color of the editor (default: 'transparent')
 * @param {boolean} hideToolbar - Hide the default toolbar (default: false)
 * 
 * Usage:
 * ```tsx
 * // Basic usage
 * <SeatingEditor
 *   height="600px"
 *   width="800px"
 *   backgroundColor="#f5f5f5"
 *   onLayoutChange={(layout) => console.log(layout)}
 * />
 * 
 * // With custom toolbar
 * const editorRef = useRef<SeatingEditorRef>(null);
 * 
 * <div>
 *   <button onClick={() => editorRef.current?.addSection()}>Add Section</button>
 *   <button onClick={() => editorRef.current?.zoomIn()}>Zoom In</button>
 *   <SeatingEditor
 *     ref={editorRef}
 *     hideToolbar={true}
 *     onLayoutChange={(layout) => console.log(layout)}
 *   />
 * </div>
 * ```
 */

/**
 * Represents a seat in the seating layout
 */
export interface Seat {
  /** Unique identifier for the seat */
  id: string;
  /** X coordinate relative to section */
  x: number;
  /** Y coordinate relative to section */
  y: number;
  /** Row identifier (e.g., 'A', 'B', 'C') */
  row: string;
  /** Seat number within the row */
  number: number;
  /** ID of the section this seat belongs to */
  sectionId: string;
  /** Radius of the seat circle */
  seatSize: number;
}

/**
 * Represents a section in the seating layout
 */
export interface Section {
  /** Unique identifier for the section */
  id: string;
  /** Display name of the section */
  name: string;
  /** Background color of the section */
  color: string;
  /** X coordinate of the section */
  x: number;
  /** Y coordinate of the section */
  y: number;
  /** Width of the section */
  width: number;
  /** Height of the section */
  height: number;
  /** Rotation angle in degrees */
  rotation: number;
  /** Array of seats in this section */
  seats: Seat[];
  /** Type of section - 'section' for seating areas, 'label' for labels/stage */
  type: 'section' | 'label';
}

export interface StageElement {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'stage' | 'section';
}

/**
 * Represents the complete seating layout configuration
 */
export interface SeatingLayout {
  /** Array of sections in the layout */
  sections: Section[];
  /** Current zoom scale of the layout */
  scale: number;
}

interface SeatingEditorProps {
  onLayoutChange?: (layout: SeatingLayout) => void;
  initialLayout?: SeatingLayout;
  height?: string | number;
  width?: string | number;
  backgroundColor?: string;
  hideToolbar?: boolean;
}

export interface SeatingEditorRef {
  addSection: () => void;
  addLabelSection: () => void;
  setTool: (tool: 'select' | 'add-seat' | 'add-section') => void;
  zoomIn: () => void;
  zoomOut: () => void;
  exportToJSON: () => void;
  getLayout: () => SeatingLayout;
  setLayout: (layout: SeatingLayout) => void;
}

interface ContextMenuProps {
  x: number;
  y: number;
  sectionType: 'section' | 'label';
  onDuplicate: () => void;
  onEdit: () => void;
  onFillWithSeats: () => void;
  onDelete: () => void;
  onChangeColor: () => void;
  onClose: () => void;
}

interface SeatContextMenuProps {
  x: number;
  y: number;
  seatId: string;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, sectionType, onDuplicate, onEdit, onFillWithSeats, onDelete, onChangeColor, onClose }) => {
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        background: 'white',
        border: '1px solid #ddd',
        borderRadius: '4px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
        zIndex: 1002,
        minWidth: '160px'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        onClick={onDuplicate}
        style={{
          padding: '8px 12px',
          cursor: 'pointer',
          borderBottom: '1px solid #eee',
          fontSize: '14px'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#f8f9fa';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'white';
        }}
      >
        📋 Duplicate
      </div>
      <div
        onClick={onEdit}
        style={{
          padding: '8px 12px',
          cursor: 'pointer',
          borderBottom: '1px solid #eee',
          fontSize: '14px'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#f8f9fa';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'white';
        }}
      >
        ✏️ Edit {sectionType === 'label' ? 'Label' : 'Name'}
      </div>
      {sectionType === 'section' && (
        <div
          onClick={onFillWithSeats}
          style={{
            padding: '8px 12px',
            cursor: 'pointer',
            borderBottom: '1px solid #eee',
            fontSize: '14px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f8f9fa';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'white';
          }}
        >
          🪑 Fill with Seats
        </div>
      )}
      <div
        onClick={onChangeColor}
        style={{
          padding: '8px 12px',
          cursor: 'pointer',
          borderBottom: '1px solid #eee',
          fontSize: '14px'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#f8f9fa';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'white';
        }}
      >
        🎨 Change Color
      </div>
      <div
        onClick={onDelete}
        style={{
          padding: '8px 12px',
          cursor: 'pointer',
          fontSize: '14px',
          color: '#dc3545'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#f8f9fa';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'white';
        }}
      >
        🗑️ Delete {sectionType === 'label' ? 'Label' : 'Section'}
      </div>
    </div>
  );
};

const SeatContextMenu: React.FC<SeatContextMenuProps> = ({ x, y, seatId, onEdit, onDelete, onClose }) => {
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        background: 'white',
        border: '1px solid #ddd',
        borderRadius: '4px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
        zIndex: 1002,
        minWidth: '160px'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        style={{
          padding: '8px 12px',
          borderBottom: '1px solid #eee',
          fontSize: '12px',
          color: '#666',
          backgroundColor: '#f8f9fa'
        }}
      >
        ID: {seatId}
      </div>
      <div
        onClick={onEdit}
        style={{
          padding: '8px 12px',
          cursor: 'pointer',
          borderBottom: '1px solid #eee',
          fontSize: '14px'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#f8f9fa';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'white';
        }}
      >
        ✏️ Edit ID
      </div>
      <div
        onClick={onDelete}
        style={{
          padding: '8px 12px',
          cursor: 'pointer',
          fontSize: '14px',
          color: '#dc3545'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#f8f9fa';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'white';
        }}
      >
        🗑️ Delete Seat
      </div>
    </div>
  );
};

interface ColorPickerDialogProps {
  currentColor: string;
  onConfirm: (color: string) => void;
  onCancel: () => void;
}

const ColorPickerDialog: React.FC<ColorPickerDialogProps> = ({ currentColor, onConfirm, onCancel }) => {
  const [selectedColor, setSelectedColor] = useState(currentColor);
  
  const predefinedColors = [
    '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57',
    '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43',
    '#10ac84', '#ee5253', '#0abde3', '#ff6b6b', '#48dbfb'
  ];

  return (
    <div style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      background: 'white',
      padding: '20px',
      borderRadius: '8px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      zIndex: 1001,
      minWidth: '300px'
    }}>
      <h3>Change Section Color</h3>
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
          Select Color:
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', marginBottom: '15px' }}>
          {predefinedColors.map((color) => (
            <div
              key={color}
              onClick={() => setSelectedColor(color)}
              style={{
                width: '40px',
                height: '40px',
                backgroundColor: color,
                borderRadius: '50%',
                cursor: 'pointer',
                border: selectedColor === color ? '3px solid #333' : '2px solid #ddd',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {selectedColor === color && (
                <span style={{ color: 'white', fontSize: '16px' }}>✓</span>
              )}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ fontWeight: 'bold' }}>Custom:</label>
          <input
            type="color"
            value={selectedColor}
            onChange={(e) => setSelectedColor(e.target.value)}
            style={{
              width: '50px',
              height: '40px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          />
        </div>
      </div>
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <button
          onClick={onCancel}
          style={{
            background: '#6c757d',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Cancel
        </button>
        <button
          onClick={() => onConfirm(selectedColor)}
          style={{
            background: '#28a745',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Apply Color
        </button>
      </div>
    </div>
  );
};

interface SeatGridDialogProps {
  onConfirm: (rows: number, cols: number, seatSize: number) => void;
  onCancel: () => void;
}

const SeatGridDialog: React.FC<SeatGridDialogProps> = ({ onConfirm, onCancel }) => {
  const [rows, setRows] = useState(5);
  const [cols, setCols] = useState(8);
  const [seatSize, setSeatSize] = useState(8);

  return (
    <div style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      background: 'white',
      padding: '20px',
      borderRadius: '8px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      zIndex: 1001,
      minWidth: '300px'
    }}>
      <h3>Fill Section with Seats</h3>
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Number of Rows:
        </label>
        <input
          type="number"
          min="1"
          max="50"
          value={rows}
          onChange={(e) => setRows(parseInt(e.target.value) || 1)}
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}
        />
      </div>
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Number of Columns:
        </label>
        <input
          type="number"
          min="1"
          max="50"
          value={cols}
          onChange={(e) => setCols(parseInt(e.target.value) || 1)}
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}
        />
      </div>
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Seat Size (Radius):
        </label>
        <input
          type="number"
          min="3"
          max="20"
          value={seatSize}
          onChange={(e) => setSeatSize(parseInt(e.target.value) || 3)}
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}
        />
      </div>
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <button
          onClick={onCancel}
          style={{
            background: '#6c757d',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Cancel
        </button>
        <button
          onClick={() => onConfirm(rows, cols, seatSize)}
          style={{
            background: '#28a745',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Fill Section
        </button>
      </div>
    </div>
  );
};

interface SeatEditDialogProps {
  seat: Seat;
  onConfirm: (newId: string) => void;
  onCancel: () => void;
}

const SeatEditDialog: React.FC<SeatEditDialogProps> = ({ seat, onConfirm, onCancel }) => {
  const [newId, setNewId] = useState(seat.id);

  return (
    <div style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      background: 'white',
      padding: '20px',
      borderRadius: '8px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      zIndex: 1001,
      minWidth: '300px'
    }}>
      <h3>Edit Seat ID</h3>
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
          Seat ID:
        </label>
        <input
          type="text"
          value={newId}
          onChange={(e) => setNewId(e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}
        />
      </div>
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <button
          onClick={onCancel}
          style={{
            background: '#6c757d',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Cancel
        </button>
        <button
          onClick={() => onConfirm(newId)}
          style={{
            background: '#28a745',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Save
        </button>
      </div>
    </div>
  );
};

const SeatingEditor = React.forwardRef<SeatingEditorRef, SeatingEditorProps>(({ 
  onLayoutChange, 
  initialLayout,
  height = '100vh',
  width = '100%',
  backgroundColor = 'transparent',
  hideToolbar = false
}, ref) => {
  const [layout, setLayout] = useState<SeatingLayout>(initialLayout || {
    sections: [
      {
        id: 'section-1',
        name: 'Section A',
        color: '#ff6b6b',
        x: 50,
        y: 200,
        width: 150,
        height: 120,
        rotation: 0,
        seats: [],
        type: 'section'
      },
      {
        id: 'section-2',
        name: 'Section B',
        color: '#4ecdc4',
        x: 250,
        y: 200,
        width: 150,
        height: 120,
        rotation: 0,
        seats: [],
        type: 'section'
      }
    ],
    scale: 1
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [tool, setTool] = useState<'select' | 'add-seat' | 'add-section'>('select');
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    sectionId: string;
  } | null>(null);
  const [seatContextMenu, setSeatContextMenu] = useState<{
    x: number;
    y: number;
    seatId: string;
    sectionId: string;
  } | null>(null);
  const [seatGridDialog, setSeatGridDialog] = useState<{
    sectionId: string;
  } | null>(null);
  const [seatEditDialog, setSeatEditDialog] = useState<Seat | null>(null);
  const [colorPickerDialog, setColorPickerDialog] = useState<{
    currentColor: string;
    onConfirm: (color: string) => void;
    onCancel: () => void;
  } | null>(null);
  const transformerRef = useRef<any>(null);
  const stageRef = useRef<any>(null);
  const labelTextRef = useRef<any>(null);
  const [labelDims, setLabelDims] = useState<{width: number, height: number}>({width: 0, height: 0});

  // Handle keyboard events for space key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault(); // Prevent page scrolling
        setIsSpacePressed(true);
        document.body.style.cursor = 'grab';
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
        document.body.style.cursor = 'default';
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      document.body.style.cursor = 'default';
    };
  }, []);

  // Handle Ctrl + scroll wheel zoom
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault(); // Prevent browser zoom
        
        const direction = e.deltaY > 0 ? 'out' : 'in';
        const newScale = direction === 'in' ? scale * 1.1 : scale / 1.1;
        setScale(Math.max(0.1, Math.min(3, newScale)));
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      window.removeEventListener('wheel', handleWheel);
    };
  }, [scale]);

  // Handle mouse events for pan mode cursor
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (isSpacePressed) {
        document.body.style.cursor = 'grabbing';
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (isSpacePressed) {
        document.body.style.cursor = 'grab';
      }
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isSpacePressed]);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu(null);
      setSeatContextMenu(null);
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // Update transformer when selection changes
  useEffect(() => {
    if (selectedId) {
      const stage = stageRef.current;
      const transformer = transformerRef.current;
      const selectedNode = stage.findOne(`#${selectedId}`);
      
      if (selectedNode && transformer) {
        transformer.nodes([selectedNode]);
        transformer.getLayer().batchDraw();
      }
    }
  }, [selectedId]);

  useLayoutEffect(() => {
    if (labelTextRef.current) {
      setLabelDims({
        width: labelTextRef.current.width(),
        height: labelTextRef.current.height(),
      });
    }
  }, [layout.sections]); // rerun when sections change

  const handleDragEnd = useCallback((e: any, type: 'section', id: string) => {
    const newLayout = { ...layout };
    
    const sectionIndex = newLayout.sections.findIndex(s => s.id === id);
    if (sectionIndex !== -1) {
      // Convert from center coordinates back to top-left coordinates
      newLayout.sections[sectionIndex].x = e.target.x() - newLayout.sections[sectionIndex].width / 2;
      newLayout.sections[sectionIndex].y = e.target.y() - newLayout.sections[sectionIndex].height / 2;
    }
    
    setLayout(newLayout);
    onLayoutChange?.(newLayout);
  }, [layout, onLayoutChange]);

  const handleSectionClick = useCallback((sectionId: string) => {
    if (tool === 'add-seat') {
      const section = layout.sections.find(s => s.id === sectionId);
      if (section && section.type === 'section') { // Only allow seats in regular sections
        // Generate 3 random characters
        const randomChars = Math.random().toString(36).substring(2, 5).toUpperCase();
        const newSeat: Seat = {
          id: `${section.name}-${randomChars}`,
          x: Math.random() * (section.width - 20) + 10,
          y: Math.random() * (section.height - 20) + 10,
          row: 'A',
          number: section.seats.length + 1,
          sectionId,
          seatSize: 8 // Default seat size for individually added seats
        };
        
        const newLayout = { ...layout };
        const sectionIndex = newLayout.sections.findIndex(s => s.id === sectionId);
        newLayout.sections[sectionIndex].seats.push(newSeat);
        
        setLayout(newLayout);
        onLayoutChange?.(newLayout);
      }
    } else {
      setSelectedId(sectionId);
    }
  }, [layout, tool, onLayoutChange]);

  const handleSectionRightClick = useCallback((e: any, sectionId: string) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    const pointerPos = stage.getPointerPosition();
    
    setContextMenu({
      x: pointerPos.x,
      y: pointerPos.y,
      sectionId
    });
  }, []);

  const handleDuplicateSection = useCallback((sectionId: string) => {
    const section = layout.sections.find(s => s.id === sectionId);
    if (section) {
      const newSection: Section = {
        ...section,
        id: `section-${Date.now()}`,
        name: `${section.name} (Copy)`,
        x: section.x + 20,
        y: section.y + 20,
        seats: section.seats.map(seat => ({
          ...seat,
          id: `seat-${Date.now()}-${Math.random()}`,
          sectionId: `section-${Date.now()}`,
          seatSize: seat.seatSize || 8 // Ensure seatSize is preserved
        }))
      };
      
      const newLayout = { ...layout, sections: [...layout.sections, newSection] };
      setLayout(newLayout);
      onLayoutChange?.(newLayout);
    }
    setContextMenu(null);
  }, [layout, onLayoutChange]);

  const handleFillWithSeats = useCallback((sectionId: string, rows: number, cols: number, seatSize: number) => {
    const section = layout.sections.find(s => s.id === sectionId);
    if (section) {
      const newSeats: Seat[] = [];
      const minPadding = 15; // Minimum padding from borders
      
      // Calculate equal spacing
      const totalHorizontalSpaces = cols + 1; // Including spaces from borders
      const totalVerticalSpaces = rows + 1;   // Including spaces from borders
      
      const spacingX = Math.max(minPadding, (section.width - (cols * seatSize * 2)) / totalHorizontalSpaces);
      const spacingY = Math.max(minPadding, (section.height - (rows * seatSize * 2)) / totalVerticalSpaces);
      
      // Ensure we have enough space
      if (spacingX < minPadding || spacingY < minPadding) {
        console.warn('Section too small for seats with current configuration');
        return;
      }
      
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const seat: Seat = {
            id: `${section.name}-${String.fromCharCode(65 + row)}-${col + 1}`,
            x: spacingX + col * (seatSize * 2 + spacingX),
            y: spacingY + row * (seatSize * 2 + spacingY),
            row: String.fromCharCode(65 + row), // A, B, C, etc.
            number: col + 1,
            sectionId,
            seatSize
          };
          newSeats.push(seat);
        }
      }
      
      const newLayout = { ...layout };
      const sectionIndex = newLayout.sections.findIndex(s => s.id === sectionId);
      newLayout.sections[sectionIndex].seats = newSeats;
      
      setLayout(newLayout);
      onLayoutChange?.(newLayout);
    }
    setSeatGridDialog(null);
  }, [layout, onLayoutChange]);

  const handleSeatDragEnd = useCallback((e: any, seat: Seat, section: Section) => {
    const newLayout = { ...layout };
    const sectionIndex = newLayout.sections.findIndex(s => s.id === section.id);
    const seatIndex = newLayout.sections[sectionIndex].seats.findIndex(s => s.id === seat.id);
    
    // Calculate new position relative to section center (accounting for rotation)
    const centerX = section.x + section.width / 2;
    const centerY = section.y + section.height / 2;
    
    // Get the rotated position from the dragged seat
    const draggedX = e.target.x();
    const draggedY = e.target.y();
    
    // Calculate relative position from center
    const relativeX = draggedX - centerX;
    const relativeY = draggedY - centerY;
    
    // Reverse the rotation to get the original grid position
    const angle = -(section.rotation * Math.PI) / 180;
    const originalX = relativeX * Math.cos(angle) - relativeY * Math.sin(angle);
    const originalY = relativeX * Math.sin(angle) + relativeY * Math.cos(angle);
    
    // Store the position relative to section (not center)
    const sectionRelativeX = originalX + section.width / 2;
    const sectionRelativeY = originalY + section.height / 2;
    
    newLayout.sections[sectionIndex].seats[seatIndex].x = sectionRelativeX;
    newLayout.sections[sectionIndex].seats[seatIndex].y = sectionRelativeY;
    
    setLayout(newLayout);
    onLayoutChange?.(newLayout);
  }, [layout, onLayoutChange]);

  const handleTransformEnd = useCallback((e: any) => {
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    const rotation = node.rotation();

    // Reset scale to 1 and update width/height
    node.scaleX(1);
    node.scaleY(1);
    
    const newLayout = { ...layout };
    const sectionIndex = newLayout.sections.findIndex(s => s.id === selectedId);
    
    if (sectionIndex !== -1) {
      // Convert from center coordinates back to top-left coordinates
      newLayout.sections[sectionIndex].x = node.x() - (node.width() * scaleX) / 2;
      newLayout.sections[sectionIndex].y = node.y() - (node.height() * scaleY) / 2;
      newLayout.sections[sectionIndex].width = Math.max(node.width() * scaleX, 50);
      newLayout.sections[sectionIndex].height = Math.max(node.height() * scaleY, 50);
      newLayout.sections[sectionIndex].rotation = rotation;
    }
    
    setLayout(newLayout);
    onLayoutChange?.(newLayout);
  }, [layout, selectedId, onLayoutChange]);

  const handleZoom = useCallback((direction: 'in' | 'out') => {
    const newScale = direction === 'in' ? scale * 1.2 : scale / 1.2;
    setScale(Math.max(0.1, Math.min(3, newScale)));
  }, [scale]);

  const addSection = useCallback(() => {
    const newSection: Section = {
      id: `section-${Date.now()}`,
      name: `Section ${layout.sections.length + 1}`,
      color: `hsl(${Math.random() * 360}, 70%, 60%)`,
      x: 100 + layout.sections.length * 200,
      y: 300,
      width: 150,
      height: 120,
      rotation: 0,
      seats: [],
      type: 'section'
    };
    
    const newLayout = { ...layout, sections: [...layout.sections, newSection] };
    setLayout(newLayout);
    onLayoutChange?.(newLayout);
  }, [layout, onLayoutChange]);

  const addLabelSection = useCallback(() => {
    const newLabelSection: Section = {
      id: `label-${Date.now()}`,
      name: 'Stage',
      color: '#2c3e50',
      x: 100,
      y: 50,
      width: 200,
      height: 100,
      rotation: 0,
      seats: [],
      type: 'label'
    };
    
    const newLayout = { ...layout, sections: [...layout.sections, newLabelSection] };
    setLayout(newLayout);
    onLayoutChange?.(newLayout);
  }, [layout, onLayoutChange]);

  const exportToJSON = useCallback(() => {
    const jsonData = {
      ...layout,
      exportDate: new Date().toISOString(),
      totalSeats: layout.sections.reduce((sum, section) => sum + section.seats.length, 0)
    };
    
    const dataStr = JSON.stringify(jsonData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'seating-layout.json';
    link.click();
    URL.revokeObjectURL(url);
  }, [layout]);

  const handleSectionNameChange = useCallback((sectionId: string, newName: string) => {
    const newLayout = { ...layout };
    const sectionIndex = newLayout.sections.findIndex(s => s.id === sectionId);
    if (sectionIndex !== -1) {
      newLayout.sections[sectionIndex].name = newName;
      setLayout(newLayout);
      onLayoutChange?.(newLayout);
    }
  }, [layout, onLayoutChange]);

  const handleSeatContextMenu = useCallback((e: KonvaEventObject<MouseEvent>, seat: Seat) => {
    e.evt.preventDefault();
    setSeatContextMenu({
      x: e.evt.clientX,
      y: e.evt.clientY,
      seatId: seat.id,
      sectionId: seat.sectionId
    });
  }, []);

  const handleSeatAction = useCallback((action: string, seatId: string, sectionId: string) => {
    const seat = layout.sections.find(s => s.id === sectionId)?.seats.find(s => s.id === seatId);
    if (!seat) return;
    
    if (action === 'delete') {
      const newLayout = { ...layout };
      const sectionIndex = newLayout.sections.findIndex(s => s.id === sectionId);
      if (sectionIndex !== -1) {
        newLayout.sections[sectionIndex].seats = newLayout.sections[sectionIndex].seats.filter(s => s.id !== seatId);
        setLayout(newLayout);
        onLayoutChange?.(newLayout);
      }
    } else if (action === 'edit') {
      setSeatEditDialog(seat);
    }
    setSeatContextMenu(null);
  }, [layout, onLayoutChange]);

  const handleSeatEdit = useCallback((newId: string) => {
    if (!seatEditDialog) return;
    
    const newLayout = { ...layout };
    const sectionIndex = newLayout.sections.findIndex(s => s.id === seatEditDialog.sectionId);
    if (sectionIndex !== -1) {
      const seatIndex = newLayout.sections[sectionIndex].seats.findIndex(s => s.id === seatEditDialog.id);
      if (seatIndex !== -1) {
        newLayout.sections[sectionIndex].seats[seatIndex].id = newId;
        setLayout(newLayout);
        onLayoutChange?.(newLayout);
      }
    }
    setSeatEditDialog(null);
  }, [layout, onLayoutChange, seatEditDialog]);

  // Expose methods via ref
  React.useImperativeHandle(ref, () => ({
    addSection,
    addLabelSection,
    setTool,
    zoomIn: () => handleZoom('in'),
    zoomOut: () => handleZoom('out'),
    exportToJSON,
    getLayout: () => layout,
    setLayout: (newLayout: SeatingLayout) => {
      setLayout(newLayout);
      onLayoutChange?.(newLayout);
    }
  }), [layout, onLayoutChange, addSection, addLabelSection, setTool, handleZoom, exportToJSON]);

  return (
    <div style={{ 
      width: typeof width === 'number' ? `${width}px` : width, 
      height: typeof height === 'number' ? `${height}px` : height, 
      position: 'relative',
      backgroundColor
    }}>
      {/* Toolbar */}
      {!hideToolbar && (
        <div style={{
          position: 'absolute',
          top: 10,
          left: 10,
          zIndex: 1000,
          background: 'white',
          padding: '10px',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          display: 'flex',
          gap: '10px',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => setTool('select')}
            style={{
              background: tool === 'select' ? '#007bff' : '#f8f9fa',
              color: tool === 'select' ? 'white' : '#333',
              border: '1px solid #ddd',
              padding: '8px 12px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Select
          </button>
          <button
            onClick={() => setTool('add-seat')}
            style={{
              background: tool === 'add-seat' ? '#28a745' : '#f8f9fa',
              color: tool === 'add-seat' ? 'white' : '#333',
              border: '1px solid #ddd',
              padding: '8px 12px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Add Seat
          </button>
          <button
            onClick={addSection}
            style={{
              background: '#17a2b8',
              color: 'white',
              border: '1px solid #17a2b8',
              padding: '8px 12px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Add Section
          </button>
          <button
            onClick={addLabelSection}
            style={{
              background: '#6f42c1',
              color: 'white',
              border: '1px solid #6f42c1',
              padding: '8px 12px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Add Label Section
          </button>
          <button
            onClick={() => handleZoom('in')}
            style={{
              background: '#ffc107',
              color: '#333',
              border: '1px solid #ffc107',
              padding: '8px 12px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Zoom In
          </button>
          <button
            onClick={() => handleZoom('out')}
            style={{
              background: '#ffc107',
              color: '#333',
              border: '1px solid #ffc107',
              padding: '8px 12px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Zoom Out
          </button>
          <button
            onClick={exportToJSON}
            style={{
              background: '#6f42c1',
              color: 'white',
              border: '1px solid #6f42c1',
              padding: '8px 12px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Export JSON
          </button>
          <div style={{ fontSize: '12px', color: '#666' }}>
            Scale: {scale.toFixed(2)}x
          </div>
          {isSpacePressed && (
            <div style={{ fontSize: '12px', color: '#28a745', fontWeight: 'bold' }}>
              SPACE: Pan Mode
            </div>
          )}
        </div>
      )}

      {/* Canvas */}
      <Stage
        ref={stageRef}
        width={typeof width === 'number' ? width : window.innerWidth}
        height={typeof height === 'number' ? height : window.innerHeight}
        scaleX={scale}
        scaleY={scale}
        draggable={isSpacePressed}
        onClick={(e) => {
          if (e.target === e.target.getStage()) {
            setSelectedId(null);
          }
        }}
      >
        <Layer>
          {/* Sections */}
          {layout.sections.map((section) => (
            <Group key={section.id}>
              <Rect
                id={section.id}
                x={section.x + section.width / 2}
                y={section.y + section.height / 2}
                width={section.width}
                height={section.height}
                fill={section.color}
                stroke="#333"
                strokeWidth={2}
                cornerRadius={6}
                opacity={0.8}
                rotation={section.rotation}
                offsetX={section.width / 2}
                offsetY={section.height / 2}
                onClick={() => handleSectionClick(section.id)}
                onTap={() => handleSectionClick(section.id)}
                onContextMenu={(e) => handleSectionRightClick(e, section.id)}
                draggable={tool === 'select' && !isSpacePressed}
                onDragEnd={(e) => handleDragEnd(e, 'section', section.id)}
                onTransformEnd={handleTransformEnd}
              />
              {section.type === 'label' ? (
                <Text
                  ref={labelTextRef}
                  x={section.x + section.width / 2 - labelDims.width / 2}
                  y={section.y + section.height / 2 - labelDims.height / 2}
                  text={section.name}
                  fontSize={18}
                  fontStyle="bold"
                  fill="white"
                  align="center"
                  verticalAlign="middle"
                  rotation={section.rotation}
                  onClick={() => setEditingSection(section.id)}
                />
              ) : (
                <Text
                  x={section.x + section.width / 2}
                  y={section.y - 25}
                  text={section.name}
                  fontSize={14}
                  fill="black"
                  fontStyle="bold"
                  align="center"
                  rotation={section.rotation}
                  offsetX={0}
                  offsetY={0}
                  onClick={() => setEditingSection(section.id)}
                />
              )}
              
              {/* Seats in this section */}
              {section.seats.map((seat) => {
                // Calculate rotated seat position around section center
                const centerX = section.x + section.width / 2;
                const centerY = section.y + section.height / 2;
                const seatX = section.x + seat.x;
                const seatY = section.y + seat.y;
                
                // Calculate relative position from section center
                const relativeX = seatX - centerX;
                const relativeY = seatY - centerY;
                
                // Apply rotation around section center
                const angle = (section.rotation * Math.PI) / 180;
                const rotatedX = relativeX * Math.cos(angle) - relativeY * Math.sin(angle);
                const rotatedY = relativeX * Math.sin(angle) + relativeY * Math.cos(angle);
                
                // Calculate final position
                const finalX = centerX + rotatedX;
                const finalY = centerY + rotatedY;
                
                return (
                  <Circle
                    key={seat.id}
                    x={finalX}
                    y={finalY}
                    radius={seat.seatSize}
                    fill="#fff"
                    stroke="#333"
                    strokeWidth={1}
                    draggable={tool === 'select' && !isSpacePressed}
                    onDragEnd={(e) => handleSeatDragEnd(e, seat, section)}
                    onContextMenu={(e) => handleSeatContextMenu(e, seat)}
                  />
                );
              })}
            </Group>
          ))}

          {/* Transformer for selected elements */}
          {selectedId && (
            <Transformer
              ref={transformerRef}
              boundBoxFunc={(oldBox, newBox) => {
                // Limit resize
                return newBox;
              }}
            />
          )}
        </Layer>
      </Stage>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          sectionType={layout.sections.find(s => s.id === contextMenu.sectionId)?.type || 'section'}
          onDuplicate={() => handleDuplicateSection(contextMenu.sectionId)}
          onEdit={() => {
            setEditingSection(contextMenu.sectionId);
            setContextMenu(null);
          }}
          onFillWithSeats={() => {
            const section = layout.sections.find(s => s.id === contextMenu.sectionId);
            if (section && section.type === 'section') {
              setSeatGridDialog({ sectionId: contextMenu.sectionId });
            }
            setContextMenu(null);
          }}
          onDelete={() => {
            const newLayout = { ...layout };
            const sectionIndex = newLayout.sections.findIndex(s => s.id === contextMenu.sectionId);
            if (sectionIndex !== -1) {
              newLayout.sections.splice(sectionIndex, 1);
              setLayout(newLayout);
              onLayoutChange?.(newLayout);
            }
            setContextMenu(null);
          }}
          onChangeColor={() => {
            setContextMenu(null); // Close context menu
            setColorPickerDialog({
              currentColor: layout.sections.find(s => s.id === contextMenu.sectionId)?.color || '#ff6b6b',
              onConfirm: (color: string) => {
                const newLayout = { ...layout };
                const sectionIndex = newLayout.sections.findIndex(s => s.id === contextMenu.sectionId);
                if (sectionIndex !== -1) {
                  newLayout.sections[sectionIndex].color = color;
                  setLayout(newLayout);
                  onLayoutChange?.(newLayout);
                }
                setColorPickerDialog(null);
              },
              onCancel: () => setColorPickerDialog(null)
            });
          }}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Seat Context Menu */}
      {seatContextMenu && (
        <SeatContextMenu
          x={seatContextMenu.x}
          y={seatContextMenu.y}
          seatId={seatContextMenu.seatId}
          onEdit={() => {
            const seat = layout.sections.find(s => s.id === seatContextMenu.sectionId)?.seats.find(s => s.id === seatContextMenu.seatId);
            if (seat) {
              setSeatEditDialog(seat);
            }
            setSeatContextMenu(null);
          }}
          onDelete={() => {
            const newLayout = { ...layout };
            const sectionIndex = newLayout.sections.findIndex(s => s.id === seatContextMenu.sectionId);
            if (sectionIndex !== -1) {
              newLayout.sections[sectionIndex].seats = newLayout.sections[sectionIndex].seats.filter(s => s.id !== seatContextMenu.seatId);
              setLayout(newLayout);
              onLayoutChange?.(newLayout);
            }
            setSeatContextMenu(null);
          }}
          onClose={() => setSeatContextMenu(null)}
        />
      )}

      {/* Seat Grid Dialog */}
      {seatGridDialog && (
        <SeatGridDialog
          onConfirm={(rows, cols, seatSize) => handleFillWithSeats(seatGridDialog.sectionId, rows, cols, seatSize)}
          onCancel={() => setSeatGridDialog(null)}
        />
      )}

      {/* Seat Edit Dialog */}
      {seatEditDialog && (
        <SeatEditDialog
          seat={seatEditDialog}
          onConfirm={handleSeatEdit}
          onCancel={() => setSeatEditDialog(null)}
        />
      )}

      {/* Section Name Editor */}
      {editingSection && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          zIndex: 1001
        }}>
          <h3>Edit Section Name</h3>
          <input
            type="text"
            defaultValue={layout.sections.find(s => s.id === editingSection)?.name || ''}
            onChange={(e) => handleSectionNameChange(editingSection, e.target.value)}
            style={{
              width: '200px',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              marginBottom: '10px'
            }}
          />
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setEditingSection(null)}
              style={{
                background: '#6c757d',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => setEditingSection(null)}
              style={{
                background: '#007bff',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* Color Picker Dialog */}
      {colorPickerDialog && (
        <ColorPickerDialog
          currentColor={colorPickerDialog.currentColor}
          onConfirm={colorPickerDialog.onConfirm}
          onCancel={colorPickerDialog.onCancel}
        />
      )}
    </div>
  );
});

export default SeatingEditor;