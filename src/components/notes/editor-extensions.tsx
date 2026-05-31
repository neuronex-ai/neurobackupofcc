import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';
import { ReactRenderer } from '@tiptap/react';
import tippy from 'tippy.js';
import {
  Heading1,
  Heading2,
  CheckSquare,
  Quote,
  Minus,
  BrainCircuit,
  Table,
  List,
  Info,
  Calendar,
} from 'lucide-react';
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// --- Visual Component: Command List ---
export const CommandList = forwardRef((props: any, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) {
      props.command(item);
    }
  };

  useEffect(() => setSelectedIndex(0), [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
        return true;
      }
      if (event.key === 'ArrowDown') {
        setSelectedIndex((selectedIndex + 1) % props.items.length);
        return true;
      }
      if (event.key === 'Enter') {
        selectItem(selectedIndex);
        return true;
      }
      return false;
    },
  }));

  return (
    <div className="bg-[#0F0F10]/95 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-[0_40px_100px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.05)] overflow-hidden min-w-[340px] p-2 animate-in fade-in zoom-in-95 duration-200 z-[1000] ring-1 ring-white/5">
      <div className="px-3 py-2 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] border-b border-white/5 mb-2 flex items-center justify-between opacity-50">
        <span>Ações Rápidas</span>
        <span className="text-[9px] bg-white/5 px-1.5 py-0.5 rounded border border-white/5">ESC para sair</span>
      </div>
      <div className="max-h-[350px] overflow-y-auto custom-scrollbar space-y-1 pr-1">
        {props.items.length ? (
          props.items.map((item: any, index: number) => (
            <button
              key={index}
              className={cn(
                "flex items-center gap-3 w-full px-3 py-3 rounded-xl text-left transition-all duration-300 group relative",
                index === selectedIndex ? "bg-white/5 shadow-inner" : "hover:bg-white/5 text-white/50"
              )}
              onClick={() => selectItem(index)}
            >
              {index === selectedIndex && (
                <div className="absolute inset-y-0 left-0 w-[3px] rounded-r-full bg-primary shadow-[0_0_12px_rgba(var(--primary),0.8)]" />
              )}
              <div className={cn(
                "p-2.5 rounded-xl border transition-all duration-300 shadow-sm",
                index === selectedIndex ? "bg-primary/20 border-primary/30 text-primary rotate-3 scale-110 shadow-[0_0_20px_rgba(var(--primary),0.2)]" : "bg-white/5 border-white/5 text-muted-foreground group-hover:text-white group-hover:bg-white/10 group-hover:border-white/10"
              )}>
                <item.icon className="h-4 w-4" />
              </div>
              <div className="flex flex-col flex-1 gap-0.5">
                <span className={cn("text-sm font-bold tracking-tight transition-colors", index === selectedIndex ? "text-white" : "text-white/70 block")}>{item.title}</span>
                {item.description && <span className="text-[10px] text-muted-foreground font-medium transition-colors opacity-70 group-hover:opacity-100">{item.description}</span>}
              </div>
            </button>
          ))
        ) : (
          <div className="px-4 py-8 text-xs text-muted-foreground text-center font-medium italic flex flex-col items-center gap-2">
            <BrainCircuit className="h-8 w-8 opacity-20" />
            <span>Nenhum comando encontrado...</span>
          </div>
        )}
      </div>
    </div>
  );
});

// --- Visual Component: Mention List ---
export const MentionList = forwardRef((props: any, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) {
      props.command({ id: item.id, label: item.name });
    }
  };

  useEffect(() => setSelectedIndex(0), [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
        return true;
      }
      if (event.key === 'ArrowDown') {
        setSelectedIndex((selectedIndex + 1) % props.items.length);
        return true;
      }
      if (event.key === 'Enter') {
        selectItem(selectedIndex);
        return true;
      }
      return false;
    },
  }));

  return (
    <div className="bg-[#0F0F10]/95 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-[0_40px_100px_rgba(0,0,0,0.8)] overflow-hidden min-w-[280px] p-2 animate-in fade-in zoom-in-95 duration-200 z-[1000]">
      <div className="px-3 py-2 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] border-b border-white/5 mb-2 opacity-50 flex items-center gap-2">
        <span>Vincular Paciente</span>
      </div>
      <div className="max-h-[250px] overflow-y-auto custom-scrollbar space-y-1">
        {props.items.length ? (
          props.items.map((item: any, index: number) => (
            <button
              key={index}
              className={cn(
                "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left transition-all duration-200",
                index === selectedIndex ? "bg-primary/10" : "hover:bg-white/5"
              )}
              onClick={() => selectItem(index)}
            >
              <div className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold border shadow-lg transition-all",
                index === selectedIndex ? "bg-primary text-white border-primary shadow-[0_0_15px_rgba(var(--primary),0.4)]" : "bg-white/5 border-white/10 text-muted-foreground"
              )}>
                {item.name.charAt(0)}
              </div>
              <div className="flex flex-col">
                <span className={cn("text-sm font-semibold tracking-tight transition-colors", index === selectedIndex ? "text-white" : "text-white/80")}>{item.name}</span>
                <span className="text-[9px] text-muted-foreground uppercase tracking-widest">Paciente</span>
              </div>
            </button>
          ))
        ) : (
          <div className="px-4 py-4 text-xs text-muted-foreground text-center italic">Nenhum paciente encontrado...</div>
        )}
      </div>
    </div>
  );
});

// --- Command Definitions ---
const getSuggestionItems = ({ query }: { query: string }) => {
  return [
    {
      title: 'Tabela Inteligente',
      description: 'Estrutura de dados premium para observações',
      icon: Table,
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
      },
    },
    {
      title: 'Destaque / Insight',
      description: 'Caixa de observação importante',
      icon: Info,
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).insertContent(`
            <div style="padding: 24px; background: rgba(var(--primary), 0.05); border: 1px solid rgba(var(--primary), 0.1); border-left: 4px solid rgba(var(--primary), 1); border-radius: 12px; margin: 24px 0;">
                <p style="margin: 0; font-weight: 500; color: rgba(255,255,255,0.9);">💡 <strong>Insight:</strong>&nbsp;Digite aqui...</p>
            </div>
            <p></p>
        `).run();
      },
    },
    {
      title: 'Data Atual',
      description: 'Data de hoje formatada',
      icon: Calendar,
      command: ({ editor, range }: any) => {
        const date = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
        editor.chain().focus().deleteRange(range).insertContent(date).run();
      },
    },
    {
      title: 'Título Principal',
      icon: Heading1,
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run();
      },
    },
    {
      title: 'Subtítulo',
      icon: Heading2,
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run();
      },
    },
    {
      title: 'Lista de Tarefas',
      icon: CheckSquare,
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).toggleTaskList().run();
      },
    },
    {
      title: 'Lista com Marcadores',
      icon: List,
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).toggleBulletList().run();
      },
    },
    {
      title: 'Divisor',
      icon: Minus,
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).setHorizontalRule().run();
      },
    },
    {
      title: 'Citação',
      icon: Quote,
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).toggleBlockquote().run();
      },
    },
  ].filter(item => item.title.toLowerCase().includes(query.toLowerCase()));
};

export const SlashCommands = Extension.create({
  name: 'slash-commands',
  addOptions() {
    return {
      suggestion: {
        char: '/',
        command: ({ editor, range, props }: any) => {
          props.command({ editor, range });
        },
      },
    };
  },
  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});

export const slashSuggestion = {
  items: getSuggestionItems,
  render: () => {
    let component: ReactRenderer;
    let popup: any;

    return {
      onStart: (props: any) => {
        component = new ReactRenderer(CommandList, {
          props,
          editor: props.editor,
        });

        if (!props.clientRect) return;

        popup = tippy('body', {
          getReferenceClientRect: props.clientRect,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: 'manual',
          placement: 'bottom-start',
          theme: 'dark',
        });
      },
      onUpdate(props: any) {
        component.updateProps(props);
        if (!props.clientRect) return;
        popup[0].setProps({
          getReferenceClientRect: props.clientRect,
        });
      },
      onKeyDown(props: any) {
        if (props.event.key === 'Escape') {
          popup[0].hide();
          return true;
        }
        // @ts-ignore
        return component.ref?.onKeyDown(props);
      },
      onExit() {
        if (popup && popup[0]) {
          popup[0].destroy();
        }
        if (component) {
          component.destroy();
        }
      },
    };
  },
};