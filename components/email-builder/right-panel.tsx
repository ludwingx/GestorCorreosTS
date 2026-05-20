"use client";

import { useBuilderStore } from "./builder-store";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function RightPanel() {
  const { blocks, selectedBlockId, updateBlock } = useBuilderStore();
  
  const selectedBlock = blocks.find(b => b.id === selectedBlockId);

  if (!selectedBlock) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-4 text-muted-foreground text-sm text-center">
        Selecciona un bloque en el canvas para ver sus propiedades.
      </div>
    );
  }

  const handleContentChange = (field: string, value: any) => {
    if (typeof selectedBlock.content === 'object') {
      updateBlock(selectedBlock.id, { content: { ...selectedBlock.content, [field]: value } });
    } else {
      updateBlock(selectedBlock.id, { content: value });
    }
  };

  const handleStyleChange = (field: string, value: string) => {
    updateBlock(selectedBlock.id, { styles: { ...selectedBlock.styles, [field]: value } });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b font-semibold bg-muted/30">
        Propiedades: {selectedBlock.type.toUpperCase()}
      </div>
      
      <div className="p-4 flex flex-col gap-6">
        {/* PROPIEDADES DE CONTENIDO */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase text-muted-foreground">Contenido</h3>
          
          {(selectedBlock.type === 'text' || selectedBlock.type === 'title' || selectedBlock.type === 'html' || selectedBlock.type === 'footer') && (
            <div className="space-y-2">
              <Label>Texto / HTML</Label>
              <Textarea 
                value={selectedBlock.content} 
                onChange={(e) => handleContentChange('text', e.target.value)} 
                rows={5}
              />
            </div>
          )}

          {selectedBlock.type === 'header' && (
            <>
              <div className="space-y-2">
                <Label>Texto del Header</Label>
                <Input 
                  value={selectedBlock.content.text} 
                  onChange={(e) => handleContentChange('text', e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label>URL del Logo</Label>
                <Input 
                  value={selectedBlock.content.logoUrl} 
                  onChange={(e) => handleContentChange('logoUrl', e.target.value)} 
                  placeholder="https://..."
                />
              </div>
            </>
          )}

          {selectedBlock.type === 'social' && (
            <>
              <div className="space-y-2">
                <Label>Link Facebook</Label>
                <Input value={selectedBlock.content.facebook} onChange={(e) => handleContentChange('facebook', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Link Twitter/X</Label>
                <Input value={selectedBlock.content.twitter} onChange={(e) => handleContentChange('twitter', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Link LinkedIn</Label>
                <Input value={selectedBlock.content.linkedin} onChange={(e) => handleContentChange('linkedin', e.target.value)} />
              </div>
            </>
          )}

          {selectedBlock.type === 'button' && (
            <>
              <div className="space-y-2">
                <Label>Texto del Botón</Label>
                <Input 
                  value={selectedBlock.content.text} 
                  onChange={(e) => handleContentChange('text', e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label>URL Destino</Label>
                <Input 
                  value={selectedBlock.content.url} 
                  onChange={(e) => handleContentChange('url', e.target.value)} 
                />
              </div>
            </>
          )}

          {selectedBlock.type === 'image' && (
            <>
              <div className="space-y-2">
                <Label>URL de Imagen</Label>
                <Input 
                  value={selectedBlock.content.url} 
                  onChange={(e) => handleContentChange('url', e.target.value)} 
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label>Texto Alternativo (Alt)</Label>
                <Input 
                  value={selectedBlock.content.alt} 
                  onChange={(e) => handleContentChange('alt', e.target.value)} 
                />
              </div>
            </>
          )}
        </div>

        {/* PROPIEDADES DE ESTILO */}
        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-sm font-semibold uppercase text-muted-foreground">Estilos</h3>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label>Color de Texto</Label>
              <Input 
                type="color" 
                value={selectedBlock.styles.color || '#000000'} 
                onChange={(e) => handleStyleChange('color', e.target.value)} 
                className="h-10 p-1"
              />
            </div>
            <div className="space-y-2">
              <Label>Fondo</Label>
              <Input 
                type="color" 
                value={selectedBlock.styles.backgroundColor || '#ffffff'} 
                onChange={(e) => handleStyleChange('backgroundColor', e.target.value)} 
                className="h-10 p-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Alineación</Label>
            <div className="flex gap-2">
              {['left', 'center', 'right', 'justify'].map(align => (
                <button 
                  key={align}
                  className={`flex-1 py-1 text-xs rounded border ${selectedBlock.styles.textAlign === align ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                  onClick={() => handleStyleChange('textAlign', align)}
                >
                  {align}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Ancho (Width)</Label>
            <Input 
              value={selectedBlock.styles.width || '100%'} 
              onChange={(e) => handleStyleChange('width', e.target.value)} 
              placeholder="Ej. 100%, 50%, 200px"
            />
          </div>

          <div className="space-y-2">
            <Label>Radio del Borde (Border Radius)</Label>
            <Input 
              value={selectedBlock.styles.borderRadius || '0px'} 
              onChange={(e) => handleStyleChange('borderRadius', e.target.value)} 
              placeholder="Ej. 5px, 50%"
            />
          </div>

          <div className="space-y-2">
            <Label>Padding</Label>
            <Input 
              value={selectedBlock.styles.padding || '10px'} 
              onChange={(e) => handleStyleChange('padding', e.target.value)} 
              placeholder="Ej. 10px 20px"
            />
          </div>

          {(selectedBlock.type === 'spacer') && (
            <div className="space-y-2">
              <Label>Altura</Label>
              <Input 
                value={selectedBlock.styles.height || '20px'} 
                onChange={(e) => handleStyleChange('height', e.target.value)} 
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
