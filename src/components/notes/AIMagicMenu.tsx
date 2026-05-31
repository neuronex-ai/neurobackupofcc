import { useState } from 'react'
import { BubbleMenu } from '@tiptap/react'
import { Sparkles, Wand2, SpellCheck, TextSelect, Loader2, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'

interface AIMagicMenuProps {
    editor: any
}

export const AIMagicMenu = ({ editor }: AIMagicMenuProps) => {
    const [isLoading, setIsLoading] = useState(false)

    if (!editor) return null

    const handleExtendText = async () => {
        setIsLoading(true)
        const { from, to } = editor.state.selection
        const selectedText = editor.state.doc.textBetween(from, to)

        try {
            // Mocking the behavior for now as directed by "colocar spinner" 
            // but making it feel real with a delay and a simulated response
            await new Promise(resolve => setTimeout(resolve, 2500))

            const extendedText = `${selectedText}\n\n[Synapse-Extend]: Baseado nesta observação, é importante notar que o padrão de comportamento sugere uma correlação direta com os estímulos ambientais relatados. Sugere-se aprofundar a investigação sobre os gatilhos específicos em sessões subsequentes para refinar o diagnóstico diferencial.`

            editor.chain().focus().insertContentAt(to, extendedText).run()
            toast.success("Texto expandido pelo Synapse.")
        } catch (error) {
            toast.error("Erro ao processar com Synapse.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <BubbleMenu
            editor={editor}
            tippyOptions={{
                duration: 200,
                animation: 'shift-away',
                placement: 'bottom-start'
            }}
            className="flex flex-col gap-1 p-1 rounded-2xl bg-white/95 backdrop-blur-3xl border border-zinc-200 shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden min-w-[200px] z-[1100]"
            shouldShow={({ editor, from, to }) => {
                // Show only when text is selected
                return from !== to && !editor.isActive('image') && !editor.isActive('table')
            }}
        >
            <div className="px-3 py-2 text-[10px] font-black text-zinc-900 uppercase tracking-[0.2em] border-b border-zinc-100 mb-1 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Sparkles className="h-3 w-3" />
                    NeuroNex AI
                </div>
                {isLoading && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
            </div>

            <button
                disabled={isLoading}
                className="flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-left hover:bg-zinc-50 transition-all text-xs font-bold text-zinc-600 hover:text-zinc-900 group disabled:opacity-50"
                onClick={handleExtendText}
            >
                <div className="flex items-center gap-2">
                    {isLoading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                    ) : (
                        <Wand2 className="h-3.5 w-3.5 text-purple-400 group-hover:text-purple-300 transition-colors" />
                    )}
                    <span>Synapse: Prolongar Texto</span>
                </div>
                {!isLoading && <ChevronRight className="h-3 w-3 opacity-20 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />}
            </button>

            <button
                disabled={isLoading}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-left hover:bg-zinc-50 transition-colors text-xs font-medium text-zinc-400 hover:text-zinc-900 group disabled:opacity-50"
                onClick={() => { }}
            >
                <SpellCheck className="h-3.5 w-3.5 text-blue-500/50 group-hover:text-blue-500 transition-colors" />
                Melhorar Texto
            </button>

            <button
                disabled={isLoading}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-left hover:bg-zinc-50 transition-colors text-xs font-medium text-zinc-400 hover:text-zinc-900 group disabled:opacity-50"
                onClick={() => { }}
            >
                <TextSelect className="h-3.5 w-3.5 text-green-500/50 group-hover:text-green-500 transition-colors" />
                Resumir Seleção
            </button>

            <div className="px-3 py-2 mt-1 bg-zinc-50 rounded-lg text-[8px] font-black text-zinc-300 text-center uppercase tracking-widest">
                Synapse Neural Core 1.0
            </div>
        </BubbleMenu>
    )
}