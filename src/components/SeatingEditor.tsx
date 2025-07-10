import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Stage, Layer, Group, Rect, Text, Circle, Transformer } from 'react-konva';

export interface Seat {
  id: string;
  x: number;
  y: number;
  row: string;
  number: number;
  sectionId: string;
}

export interface Section {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
  seats: Seat[];
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

export interface SeatingLayout {
  stage: StageElement;
  sections: Section[];
  scale: number;
}

interface SeatingEditorProps {
  onLayoutChange?: (layout: SeatingLayout) => void;
  initialLayout?: SeatingLayout;
}

interface ContextMenuProps {
  x: number;
  y: number;
  onDuplicate: () => void;
  onEdit: () => void;
  onClose: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, onDuplicate, onEdit, onClose }) => {
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
        minWidth: '120px'
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
          fontSize: '14px'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#f8f9fa';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'white';
        }}
      >
        ✏️ Edit Name
      </div>
    </div>
  );
};

const SeatingEditor: React.FC<SeatingEditorProps> = ({ 
  onLayoutChange, 
  initialLayout 
}) => {
  const [layout, setLayout] = useState<SeatingLayout>(initialLayout || {
    stage: {
      id: 'stage-1',
      name: 'Main Stage',
      x: 100,
      y: 50,
      width: 200,
      height: 100,
      type: 'stage'
    },
    sections: [
      {
        id: 'section-1',
        name: 'Section A',
        color: '#ff6b6b',
        x: 50,
        y: 200,
        width: 150,
        height: 120,
        seats: []
      },
      {
        id: 'section-2',
        name: 'Section B',
        color: '#4ecdc4',
        x: 250,
        y: 200,
        width: 150,
        height: 120,
        seats: []
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
  const transformerRef = useRef<any>(null);
  const stageRef = useRef<any>(null);

  // Handle keyboard events for space key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault(); // Prevent page scrolling
        setIsSpacePressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu(null);
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

  const handleDragEnd = useCallback((e: any, type: 'stage' | 'section', id: string) => {
    const newLayout = { ...layout };
    
    if (type === 'stage') {
      newLayout.stage.x = e.target.x();
      newLayout.stage.y = e.target.y();
    } else {
      const sectionIndex = newLayout.sections.findIndex(s => s.id === id);
      if (sectionIndex !== -1) {
        newLayout.sections[sectionIndex].x = e.target.x();
        newLayout.sections[sectionIndex].y = e.target.y();
      }
    }
    
    setLayout(newLayout);
    onLayoutChange?.(newLayout);
  }, [layout, onLayoutChange]);

  const handleSectionClick = useCallback((sectionId: string) => {
    if (tool === 'add-seat') {
      const section = layout.sections.find(s => s.id === sectionId);
      if (section) {
        const newSeat: Seat = {
          id: `seat-${Date.now()}`,
          x: Math.random() * (section.width - 20) + 10,
          y: Math.random() * (section.height - 20) + 10,
          row: 'A',
          number: section.seats.length + 1,
          sectionId
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
          sectionId: `section-${Date.now()}`
        }))
      };
      
      const newLayout = { ...layout, sections: [...layout.sections, newSection] };
      setLayout(newLayout);
      onLayoutChange?.(newLayout);
    }
    setContextMenu(null);
  }, [layout, onLayoutChange]);

  const handleSeatDragEnd = useCallback((e: any, seat: Seat, section: Section) => {
    const newLayout = { ...layout };
    const sectionIndex = newLayout.sections.findIndex(s => s.id === section.id);
    const seatIndex = newLayout.sections[sectionIndex].seats.findIndex(s => s.id === seat.id);
    
    // Calculate new position relative to section (no constraints)
    const newX = e.target.x() - section.x;
    const newY = e.target.y() - section.y;
    
    newLayout.sections[sectionIndex].seats[seatIndex].x = newX;
    newLayout.sections[sectionIndex].seats[seatIndex].y = newY;
    
    setLayout(newLayout);
    onLayoutChange?.(newLayout);
  }, [layout, onLayoutChange]);

  const handleTransformEnd = useCallback((e: any) => {
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // Reset scale to 1 and update width/height
    node.scaleX(1);
    node.scaleY(1);
    
    const newLayout = { ...layout };
    const sectionIndex = newLayout.sections.findIndex(s => s.id === selectedId);
    
    if (sectionIndex !== -1) {
      newLayout.sections[sectionIndex].x = node.x();
      newLayout.sections[sectionIndex].y = node.y();
      newLayout.sections[sectionIndex].width = Math.max(node.width() * scaleX, 50);
      newLayout.sections[sectionIndex].height = Math.max(node.height() * scaleY, 50);
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
      seats: []
    };
    
    const newLayout = { ...layout, sections: [...layout.sections, newSection] };
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

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      {/* Toolbar */}
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

      {/* Canvas */}
      <Stage
        ref={stageRef}
        width={window.innerWidth}
        height={window.innerHeight}
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
          {/* Main Stage */}
          <Rect
            x={layout.stage.x}
            y={layout.stage.y}
            width={layout.stage.width}
            height={layout.stage.height}
            fill="#2c3e50"
            stroke="#34495e"
            strokeWidth={2}
            cornerRadius={8}
            draggable={tool === 'select' && !isSpacePressed}
            onDragEnd={(e) => handleDragEnd(e, 'stage', layout.stage.id)}
          />
          <Text
            x={layout.stage.x + 10}
            y={layout.stage.y + layout.stage.height / 2 - 10}
            text={layout.stage.name}
            fontSize={16}
            fill="white"
            fontStyle="bold"
          />

          {/* Sections */}
          {layout.sections.map((section) => (
            <Group key={section.id}>
              <Rect
                id={section.id}
                x={section.x}
                y={section.y}
                width={section.width}
                height={section.height}
                fill={section.color}
                stroke="#333"
                strokeWidth={2}
                cornerRadius={6}
                opacity={0.8}
                onClick={() => handleSectionClick(section.id)}
                onTap={() => handleSectionClick(section.id)}
                onContextMenu={(e) => handleSectionRightClick(e, section.id)}
                draggable={tool === 'select' && !isSpacePressed}
                onDragEnd={(e) => handleDragEnd(e, 'section', section.id)}
                onTransformEnd={handleTransformEnd}
              />
              <Text
                x={section.x + 5}
                y={section.y + 5}
                text={section.name}
                fontSize={14}
                fill="white"
                fontStyle="bold"
                onClick={() => setEditingSection(section.id)}
              />
              
              {/* Seats in this section */}
              {section.seats.map((seat) => (
                <Circle
                  key={seat.id}
                  x={section.x + seat.x}
                  y={section.y + seat.y}
                  radius={8}
                  fill="#fff"
                  stroke="#333"
                  strokeWidth={1}
                  draggable={tool === 'select' && !isSpacePressed}
                  onDragEnd={(e) => handleSeatDragEnd(e, seat, section)}
                />
              ))}
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
          onDuplicate={() => handleDuplicateSection(contextMenu.sectionId)}
          onEdit={() => {
            setEditingSection(contextMenu.sectionId);
            setContextMenu(null);
          }}
          onClose={() => setContextMenu(null)}
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
    </div>
  );
};

export default SeatingEditor;