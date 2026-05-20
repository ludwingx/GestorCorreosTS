"use client";

import { useBuilderStore, getDefaultContent, getDefaultStyles } from "./builder-store";
import { LeftPanel } from "./left-panel";
import { CenterPanel } from "./center-panel";
import { RightPanel } from "./right-panel";
import { DndContext, DragEndEvent, DragOverlay, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { useState } from "react";
import { BlockType } from "./builder-store";

export function EmailBuilderLayout() {
  const { previewMode, addBlock, reorderBlocks } = useBuilderStore();
  const [activeDragType, setActiveDragType] = useState<BlockType | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: any) => {
    const { active } = event;
    if (active.data.current?.type === 'new_block') {
      setActiveDragType(active.data.current.blockType);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragType(null);
    const { active, over } = event;

    if (!over) return;

    let targetId = undefined;
    let position: 'before' | 'after' | undefined = undefined;
    let parentId = undefined;
    let slot = undefined;

    const overId = over.id as string;
    
    const isCanvas = overId === 'canvas-droppable';
    const isNested = overId.endsWith('-left') || overId.endsWith('-right');
    const isRelative = overId.startsWith('before-') || overId.startsWith('after-');

    if (!isCanvas && !isNested && !isRelative) return;

    if (isNested) {
      const parts = overId.split('-');
      slot = parts.pop() as 'left' | 'right';
      parentId = parts.join('-');
    } else if (isRelative) {
      if (overId.startsWith('before-')) {
        position = 'before';
        targetId = overId.replace('before-', '');
      } else {
        position = 'after';
        targetId = overId.replace('after-', '');
      }
    }

    const store = useBuilderStore.getState();

    if (active.data.current?.type === 'new_block') {
      const blockType = active.data.current.blockType;
      store.addBlock({
        type: blockType,
        content: getDefaultContent(blockType),
        styles: getDefaultStyles(blockType),
        parentId, // will be undefined if relative
        slot
      }, targetId, position);
    } else if (active.data.current?.type === 'existing_block') {
      const blockId = active.data.current.blockId;
      
      if (isRelative) {
         store.moveBlock(blockId, targetId as string, position as 'before' | 'after');
      } else {
         // Moving into a new slot (or root canvas)
         store.updateBlock(blockId, { parentId, slot });
      }
    }
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex h-[calc(100vh-3.5rem)] w-full overflow-hidden border-t">
        {/* Panel Izquierdo: Bloques y Variables */}
        <div className="w-[240px] border-r bg-background flex-shrink-0 flex flex-col h-full overflow-y-auto">
          <LeftPanel />
        </div>

        {/* Panel Central: Canvas y Preview */}
        <div className="flex-1 bg-muted/30 overflow-y-auto relative flex flex-col items-center py-6">
          <CenterPanel />
        </div>

        {/* Panel Derecho: Propiedades */}
        <div className="w-[260px] border-l bg-background flex-shrink-0 flex flex-col h-full overflow-y-auto">
          <RightPanel />
        </div>
      </div>
      
       <DragOverlay>
        {activeDragType ? (
          <div className="bg-white border-2 border-primary border-dashed shadow-2xl opacity-90 pointer-events-none" style={{ width: '400px', ...getDefaultStyles(activeDragType) } as any}>
            <BlockPreview type={activeDragType} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function BlockPreview({ type }: { type: BlockType }) {
  const content = getDefaultContent(type);
  const styles = getDefaultStyles(type);

  if (type === 'title') return <h1 className="text-2xl font-bold" style={styles}>{content as string}</h1>;
  if (type === 'text') return <p style={styles}>{content as string}</p>;
  if (type === 'button') return (
    <div style={{ textAlign: 'center', width: '100%' }}>
      <span className="inline-block bg-primary text-primary-foreground px-4 py-2 rounded-md" style={styles}>
        {(content as any).text}
      </span>
    </div>
  );
  if (type === 'image') return (
    <div className="w-full h-32 bg-muted flex items-center justify-center text-muted-foreground border-2 border-dashed">
      [Imagen]
    </div>
  );
  if (type === 'divider') return <hr className="my-4 border-t-2" style={styles} />;
  if (type === 'spacer') return <div style={{ height: styles.height || '20px', width: '100%' }} />;
  if (type === 'html') return <div dangerouslySetInnerHTML={{ __html: content as string }} style={{width: '100%'}} />;
  if (type === 'header') return (
    <div className="flex items-center justify-between" style={styles}>
      <div className="font-bold text-xl">LOGO</div>
      <div className="text-sm font-medium">{(content as any).text}</div>
    </div>
  );
  if (type === 'footer') return <div style={styles} dangerouslySetInnerHTML={{ __html: content as string }} />;
  if (type === 'social') return (
    <div className="flex justify-center gap-4" style={styles}>
      <span className="text-blue-600 font-bold">FB</span>
      <span className="text-sky-500 font-bold">TW</span>
      <span className="text-blue-800 font-bold">IN</span>
    </div>
  );
  if (type === 'columns') return (
    <div className="flex w-full gap-2">
      <div className="flex-1 h-20 border-2 border-dashed bg-muted/10"></div>
      <div className="flex-1 h-20 border-2 border-dashed bg-muted/10"></div>
    </div>
  );

  return <div>Preview</div>;
}
