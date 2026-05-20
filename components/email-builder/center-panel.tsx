"use client";

import { useBuilderStore, EmailBlock } from "./builder-store";
import { Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDroppable, useDraggable } from "@dnd-kit/core";

export function getDirectImageUrl(url: string): string {
  if (!url) return "";
  
  try {
    let cleanUrl = url.trim();

    // 1. Google Drive
    if (cleanUrl.includes("drive.google.com")) {
      const fileIdMatch = cleanUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || cleanUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (fileIdMatch && fileIdMatch[1]) {
        return `https://lh3.googleusercontent.com/d/${fileIdMatch[1]}`;
      }
    }

    // 2. OneDrive Personal
    if (cleanUrl.includes("onedrive.live.com") && cleanUrl.includes("redir")) {
      return cleanUrl.replace("redir?", "download?");
    }
    if (cleanUrl.includes("1drv.ms/i/s!")) {
      return cleanUrl.replace("/i/s!", "/u/s!") + (cleanUrl.includes("?") ? "&" : "?") + "download=1";
    }

    // 3. OneDrive Business / SharePoint
    if (cleanUrl.includes(".sharepoint.com") && (cleanUrl.includes("/:i:/") || cleanUrl.includes("/:u:/"))) {
      let converted = cleanUrl.replace(/\/:[iu]:\//, '/:b:/');
      if (!converted.includes("download=1") && !converted.includes("raw=1")) {
        converted += (converted.includes("?") ? "&" : "?") + "download=1";
      }
      return converted;
    }

    // 4. Dropbox
    if (cleanUrl.includes("dropbox.com")) {
      if (cleanUrl.includes("dl=0")) {
        return cleanUrl.replace("dl=0", "raw=1");
      }
      if (!cleanUrl.includes("raw=1")) {
        return cleanUrl + (cleanUrl.includes("?") ? "&" : "?") + "raw=1";
      }
    }

    return cleanUrl;
  } catch (e) {
    return url;
  }
}

export function CenterPanel() {
  const { blocks, selectedBlockId, selectBlock, removeBlock, previewMode } = useBuilderStore();
  
  const { setNodeRef, isOver } = useDroppable({
    id: 'canvas-droppable',
  });

  if (previewMode === 'code') {
    return <CodePreview blocks={blocks} />;
  }

  // Filter root blocks (no parentId)
  const rootBlocks = blocks.filter(b => !b.parentId);

  return (
    <div 
      ref={setNodeRef}
      className={cn(
        "bg-white text-black shadow-xl min-h-[600px] h-fit shrink-0 transition-all relative pb-20 border-2 w-full max-w-[600px]",
        isOver ? "border-primary bg-blue-50/50" : "border-transparent"
      )}
      onClick={() => selectBlock(null)}
    >
      {blocks.length === 0 ? (
        <div className="h-[600px] flex flex-col items-center justify-center text-muted-foreground p-12 text-center border-2 border-dashed border-muted-foreground/20 m-4 rounded-lg">
          <p>El canvas está vacío.</p>
          <p className="text-sm mt-2">Arrastra los componentes desde el panel izquierdo hacia aquí.</p>
        </div>
      ) : (
        <div className="flex flex-col h-auto p-4 gap-2">
          {rootBlocks.map((block) => (
            <BlockRenderer 
              key={block.id} 
              block={block} 
              allBlocks={blocks}
              isSelected={selectedBlockId === block.id}
              onSelect={(e) => { e.stopPropagation(); selectBlock(block.id); }}
              onRemove={() => removeBlock(block.id)}
            />
          ))}
          {isOver && (
            <div className="w-full h-20 border-2 border-dashed border-primary bg-primary/10 m-2 rounded" />
          )}
        </div>
      )}
    </div>
  );
}

function BlockRenderer({ block, allBlocks, isSelected, onSelect, onRemove }: { block: EmailBlock; allBlocks: EmailBlock[]; isSelected: boolean; onSelect: (e: any) => void; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({
    id: block.id,
    data: { type: 'existing_block', blockId: block.id }
  });

  const { isOver: isOverBefore, setNodeRef: setBeforeRef } = useDroppable({ id: `before-${block.id}` });
  const { isOver: isOverAfter, setNodeRef: setAfterRef } = useDroppable({ id: `after-${block.id}` });

  return (
    <div 
      className={cn(
        "relative group cursor-pointer border-2 transition-all rounded",
        isSelected ? "border-blue-500" : "border-transparent hover:border-blue-300",
        isDragging ? "opacity-50" : ""
      )}
      onClick={onSelect}
      style={{ padding: block.styles.padding || '0px' }}
    >
      {/* Drop Zones for visual indicator */}
      <div ref={setBeforeRef} className="absolute top-0 left-0 w-full h-1/2 z-10" />
      <div ref={setAfterRef} className="absolute bottom-0 left-0 w-full h-1/2 z-10" />

      {isOverBefore && <div className="absolute top-0 left-0 w-full h-1 bg-blue-600 z-30 scale-x-105" />}
      {isOverAfter && <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 z-30 scale-x-105" />}

      {isSelected && (
        <div className="absolute -top-4 right-0 flex items-center bg-blue-500 text-white rounded text-xs z-30 overflow-hidden shadow-md">
          <div ref={setDragRef} {...listeners} {...attributes} className="p-1 cursor-grab active:cursor-grabbing hover:bg-blue-600">
            <GripVertical className="size-4" />
          </div>
          <button className="p-1 hover:bg-red-600 transition-colors" onClick={(e) => { e.stopPropagation(); onRemove(); }}>
            <Trash2 className="size-4" />
          </button>
        </div>
      )}

      {/* BLOCK CONTENT RENDER */}
      <div className={cn("pointer-events-none w-full", block.type !== 'columns' && "pointer-events-none")}>
        {block.type === 'title' && <h1 className="text-2xl font-bold" style={block.styles}>{block.content}</h1>}
        {block.type === 'text' && <p style={block.styles}>{block.content}</p>}
        {block.type === 'button' && (
          <div style={{ textAlign: block.styles.textAlign || 'center', width: '100%' }}>
            <a href={block.content.url} className="inline-block bg-primary text-primary-foreground px-4 py-2 rounded-md no-underline" style={block.styles}>
              {block.content.text}
            </a>
          </div>
        )}
        {block.type === 'image' && (
          <div style={{ textAlign: block.styles.textAlign || 'center', width: '100%' }}>
            {block.content.url ? (
               <img src={getDirectImageUrl(block.content.url)} alt={block.content.alt} className="max-w-full h-auto" style={block.styles} />
            ) : (
              <div className="w-full h-32 bg-muted flex items-center justify-center text-muted-foreground border-2 border-dashed">
                [Imagen]
              </div>
            )}
          </div>
        )}
        {block.type === 'divider' && <hr className="my-4 border-t-2" style={block.styles} />}
        {block.type === 'spacer' && <div style={{ height: block.styles.height || '20px', width: '100%' }} />}
        {block.type === 'html' && <div dangerouslySetInnerHTML={{ __html: block.content }} style={{width: '100%'}} />}
        {block.type === 'header' && (
          <div className="flex items-center justify-between" style={block.styles}>
            {block.content.logoUrl ? <img src={getDirectImageUrl(block.content.logoUrl)} alt="Logo" className="max-h-12" /> : <div className="font-bold text-xl">LOGO</div>}
            <div className="text-sm font-medium">{block.content.text}</div>
          </div>
        )}
        {block.type === 'footer' && (
          <div style={block.styles} dangerouslySetInnerHTML={{ __html: block.content }} />
        )}
        {block.type === 'social' && (
          <div className="flex justify-center gap-4" style={block.styles}>
            <a href={block.content.facebook} className="text-blue-600 font-bold">FB</a>
            <a href={block.content.twitter} className="text-sky-500 font-bold">TW</a>
            <a href={block.content.linkedin} className="text-blue-800 font-bold">IN</a>
          </div>
        )}
      </div>

      {block.type === 'columns' && (
         <div className="flex w-full gap-2 mt-2 pointer-events-auto relative z-20">
           <ColumnDropZone slotName="left" parentId={block.id} allBlocks={allBlocks} />
           <ColumnDropZone slotName="right" parentId={block.id} allBlocks={allBlocks} />
         </div>
      )}
    </div>
  );
}

function ColumnDropZone({ slotName, parentId, allBlocks }: { slotName: 'left' | 'right', parentId: string, allBlocks: EmailBlock[] }) {
  const { selectBlock, removeBlock, selectedBlockId } = useBuilderStore();
  const zoneId = `${parentId}-${slotName}`;
  const { setNodeRef, isOver } = useDroppable({ id: zoneId });

  const children = allBlocks.filter(b => b.parentId === parentId && b.slot === slotName);

  return (
    <div 
      ref={setNodeRef}
      className={cn(
        "flex-1 min-h-[100px] border-2 border-dashed p-2 transition-colors flex flex-col gap-2",
        isOver ? "border-primary bg-primary/10" : "border-muted-foreground/30 bg-muted/10",
        children.length === 0 ? "items-center justify-center text-xs text-muted-foreground" : ""
      )}
    >
      {children.length === 0 ? (
        <span>Soltar aquí</span>
      ) : (
        children.map(child => (
          <BlockRenderer 
            key={child.id} 
            block={child} 
            allBlocks={allBlocks}
            isSelected={selectedBlockId === child.id}
            onSelect={(e) => { e.stopPropagation(); selectBlock(child.id); }}
            onRemove={() => removeBlock(child.id)}
          />
        ))
      )}
    </div>
  );
}

function CodePreview({ blocks }: { blocks: EmailBlock[] }) {
  const buildHtml = (blocksList: EmailBlock[]): string => {
    return blocksList.map(block => {
      let content = '';
      const styles = Object.entries(block.styles).map(([k, v]) => `${k.replace(/([A-Z])/g, "-$1").toLowerCase()}: ${v}`).join('; ');
      
      if (block.type === 'title') content = `<h1 style="${styles}">${block.content}</h1>`;
      else if (block.type === 'text') content = `<p style="${styles}">${block.content}</p>`;
      else if (block.type === 'button') content = `<div style="text-align: ${block.styles.textAlign || 'center'};"><a href="${block.content.url}" style="display:inline-block; padding:10px 20px; background-color:#000; color:#fff; text-decoration:none; border-radius:5px; ${styles}">${block.content.text}</a></div>`;
      else if (block.type === 'image') content = `<div style="text-align: ${block.styles.textAlign || 'center'};"><img src="${getDirectImageUrl(block.content.url)}" alt="${block.content.alt}" style="max-width:100%; ${styles}" /></div>`;
      else if (block.type === 'divider') content = `<hr style="${styles}" />`;
      else if (block.type === 'spacer') content = `<div style="height: ${block.styles.height || '20px'}; ${styles}"></div>`;
      else if (block.type === 'html') content = `<div style="${styles}">${block.content}</div>`;
      else if (block.type === 'header') content = `<table width="100%" style="${styles}"><tr><td>${block.content.logoUrl ? `<img src="${getDirectImageUrl(block.content.logoUrl)}" height="40" />` : `<strong>LOGO</strong>`}</td><td align="right">${block.content.text}</td></tr></table>`;
      else if (block.type === 'footer') content = `<div style="${styles}">${block.content}</div>`;
      else if (block.type === 'social') content = `<div style="text-align:center; padding: 10px; ${styles}"><a href="${block.content.facebook}" style="margin: 0 10px;">FB</a><a href="${block.content.twitter}" style="margin: 0 10px;">TW</a><a href="${block.content.linkedin}" style="margin: 0 10px;">IN</a></div>`;
      else if (block.type === 'columns') {
        const leftBlocks = blocks.filter(b => b.parentId === block.id && b.slot === 'left');
        const rightBlocks = blocks.filter(b => b.parentId === block.id && b.slot === 'right');
        content = `
<table width="100%" border="0" cellspacing="0" cellpadding="0">
  <tr>
    <td width="50%" valign="top" style="padding: 10px;">${buildHtml(leftBlocks)}</td>
    <td width="50%" valign="top" style="padding: 10px;">${buildHtml(rightBlocks)}</td>
  </tr>
</table>`;
      }
      return content;
    }).join('\n');
  };

  const compiledHtml = `
<table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f9f9f9; padding: 20px; font-family: Arial, sans-serif;">
  <tr>
    <td align="center">
      <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
        <tr>
          <td style="padding: 20px;">
${buildHtml(blocks.filter(b => !b.parentId))}
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;

  return (
    <div className="w-full h-full max-w-[800px] bg-[#1e1e1e] text-[#d4d4d4] p-6 rounded-md font-mono text-sm overflow-auto mx-auto shadow-2xl flex flex-col gap-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-white font-bold">HTML para Outlook / Envíos:</h3>
          <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(compiledHtml)}>Copiar HTML</Button>
        </div>
        <pre className="bg-black/50 p-4 rounded overflow-x-auto text-blue-300"><code>{compiledHtml}</code></pre>
      </div>
    </div>
  );
}
