"use client";

import { Type, Heading, Square, Image as ImageIcon, Minus, Space, Columns, Code, LayoutTemplate, PanelBottom, Share2 } from "lucide-react";
import { useBuilderStore, BlockType } from "./builder-store";
import { useDraggable } from "@dnd-kit/core";
import { toast } from "sonner";

const BLOCKS: { type: BlockType; label: string; icon: React.ReactNode }[] = [
  { type: "header", label: "Header", icon: <LayoutTemplate className="size-4" /> },
  { type: "title", label: "Título", icon: <Heading className="size-4" /> },
  { type: "text", label: "Texto", icon: <Type className="size-4" /> },
  { type: "button", label: "Botón", icon: <Square className="size-4" /> },
  { type: "image", label: "Imagen", icon: <ImageIcon className="size-4" /> },
  { type: "columns", label: "Columnas", icon: <Columns className="size-4" /> },
  { type: "social", label: "Redes", icon: <Share2 className="size-4" /> },
  { type: "divider", label: "Separador", icon: <Minus className="size-4" /> },
  { type: "spacer", label: "Espacio", icon: <Space className="size-4" /> },
  { type: "footer", label: "Footer", icon: <PanelBottom className="size-4" /> },
  { type: "html", label: "HTML", icon: <Code className="size-4" /> },
];

const VARIABLES = [
  "{{client_name}}",
  "{{email}}",
  "{{date}}",
  "{{company}}",
  "{{invoice_number}}",
];

export function LeftPanel() {
  const { blocks, selectedBlockId, updateBlock } = useBuilderStore();

  const handleInsertVariable = (variable: string) => {
    if (!selectedBlockId) {
      toast.error("Selecciona un bloque de texto o título primero");
      return;
    }
    const block = blocks.find(b => b.id === selectedBlockId);
    if (!block || (block.type !== 'text' && block.type !== 'title' && block.type !== 'html')) {
      toast.error("Solo puedes insertar variables en bloques de texto, título o html");
      return;
    }
    
    updateBlock(block.id, { content: block.content + " " + variable });
    toast.success(`Variable ${variable} insertada`);
  };

  return (
    <div className="flex flex-col h-full select-none">
      <div className="p-3 border-b font-semibold text-sm">Bloques</div>
      <div className="p-3 grid grid-cols-3 gap-2">
        {BLOCKS.map((block) => (
          <DraggableBlock key={block.type} block={block} />
        ))}
      </div>

      <div className="p-3 border-y font-semibold mt-2 bg-muted/30 text-sm">Variables</div>
      <div className="p-3 flex flex-col gap-1">
        {VARIABLES.map((v) => (
          <div 
            key={v} 
            title="Clic para insertar en el texto seleccionado"
            onClick={() => handleInsertVariable(v)}
            className="text-[11px] p-1.5 bg-muted rounded border border-dashed flex items-center justify-between cursor-pointer hover:bg-muted/80 hover:border-primary transition-colors"
          >
            <code>{v}</code>
          </div>
        ))}
      </div>
    </div>
  );
}

function DraggableBlock({ block }: { block: { type: BlockType; label: string; icon: React.ReactNode } }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `draggable-${block.type}`,
    data: {
      type: 'new_block',
      blockType: block.type
    }
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      title={block.label}
      className={`flex flex-col items-center justify-center gap-1 aspect-square rounded-md border bg-background hover:bg-accent hover:text-accent-foreground cursor-grab active:cursor-grabbing shadow-sm transition-all ${isDragging ? 'opacity-50 border-primary scale-95' : ''}`}
    >
      <div className="text-muted-foreground group-hover:text-foreground">{block.icon}</div>
      <span className="text-[10px] text-center px-1 leading-tight">{block.label}</span>
    </div>
  );
}
