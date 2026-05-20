import { create } from 'zustand';

export type BlockType = 'text' | 'title' | 'button' | 'image' | 'divider' | 'spacer' | 'columns' | 'html' | 'header' | 'footer' | 'social';

export interface EmailBlock {
  id: string;
  type: BlockType;
  content: any;
  styles: Record<string, any>;
  parentId?: string;
  slot?: 'left' | 'right';
}

interface BuilderState {
  blocks: EmailBlock[];
  selectedBlockId: string | null;
  previewMode: 'design' | 'code';
  addBlock: (block: Omit<EmailBlock, 'id'>, targetId?: string, position?: 'before' | 'after') => void;
  updateBlock: (id: string, updates: Partial<EmailBlock>) => void;
  removeBlock: (id: string) => void;
  reorderBlocks: (startIndex: number, endIndex: number) => void;
  selectBlock: (id: string | null) => void;
  setPreviewMode: (mode: 'design' | 'code') => void;
  moveBlock: (id: string, targetId: string, position: 'before' | 'after') => void;
  setBlocks: (blocks: EmailBlock[]) => void;
}

export const useBuilderStore = create<BuilderState>((set) => ({
  blocks: [],
  selectedBlockId: null,
  previewMode: 'design',
  setBlocks: (blocks) => set({ blocks, selectedBlockId: null }),

  addBlock: (block, targetId, position) => set((state) => {
    const newBlock = { ...block, id: Math.random().toString(36).substr(2, 9) };
    if (!targetId) return { blocks: [...state.blocks, newBlock] };
    
    const targetIndex = state.blocks.findIndex(b => b.id === targetId);
    if (targetIndex === -1) return { blocks: [...state.blocks, newBlock] };
    
    const newBlocks = [...state.blocks];
    newBlocks.splice(position === 'before' ? targetIndex : targetIndex + 1, 0, newBlock);
    return { blocks: newBlocks };
  }),

  updateBlock: (id, updates) => set((state) => ({
    blocks: state.blocks.map(b => b.id === id ? { ...b, ...updates } : b)
  })),

  removeBlock: (id) => set((state) => ({
    blocks: state.blocks.filter(b => b.id !== id),
    selectedBlockId: state.selectedBlockId === id ? null : state.selectedBlockId
  })),

  reorderBlocks: (startIndex, endIndex) => set((state) => {
    const newBlocks = Array.from(state.blocks);
    const [removed] = newBlocks.splice(startIndex, 1);
    newBlocks.splice(endIndex, 0, removed);
    return { blocks: newBlocks };
  }),

  moveBlock: (blockId, targetId, position) => set((state) => {
    const blockIndex = state.blocks.findIndex(b => b.id === blockId);
    if (blockIndex === -1) return state;
    
    const block = state.blocks[blockIndex];
    const newBlocks = [...state.blocks];
    newBlocks.splice(blockIndex, 1);

    const targetIndex = newBlocks.findIndex(b => b.id === targetId);
    if (targetIndex === -1) {
       newBlocks.push(block);
       return { blocks: newBlocks };
    }

    const targetBlock = newBlocks[targetIndex];
    block.parentId = targetBlock.parentId;
    block.slot = targetBlock.slot;

    newBlocks.splice(position === 'before' ? targetIndex : targetIndex + 1, 0, block);
    return { blocks: newBlocks };
  }),

  selectBlock: (id) => set({ selectedBlockId: id }),
  setPreviewMode: (mode) => set({ previewMode: mode }),
}));

export function getDefaultContent(type: BlockType) {
  switch(type) {
    case 'text': return 'Escribe tu texto aquí...';
    case 'title': return 'Nuevo Título';
    case 'button': return { text: 'Call to Action', url: '#' };
    case 'image': return { url: '', alt: 'Imagen' };
    case 'html': return '<div>HTML Custom</div>';
    case 'columns': return { left: [], right: [] }; 
    case 'header': return { logoUrl: '', text: 'Tu Empresa' };
    case 'footer': return '© 2026 Tu Empresa. Todos los derechos reservados. <br/> <a href="{{unsubscribe_url}}">Darse de baja</a>';
    case 'social': return { facebook: '#', twitter: '#', linkedin: '#' };
    default: return '';
  }
}

export function getDefaultStyles(type: BlockType): any {
  if (type === 'footer') return { padding: '20px', margin: '0px', backgroundColor: '#f1f5f9', fontSize: '12px', textAlign: 'center', color: '#64748b' };
  if (type === 'header') return { padding: '15px', margin: '0px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#ffffff' };
  return { padding: '10px', margin: '0px' };
}
