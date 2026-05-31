import { NotionIcon } from "@/components/icons/NotionIcon";
import { Button } from "@/components/ui/button";
import { NotionBlock, useNotionPages } from "@/hooks/use-notion-pages";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AnimatePresence, motion } from "framer-motion";
import {
    ArrowLeft, BookOpen, ChevronRight, Clock, ExternalLink, FileText, Loader2, RefreshCw
} from "lucide-react";
import { useCallback, useState } from "react";
import { Link } from "react-router-dom";

// ─── Notion Block Renderer ─────────────────────────────────────

function extractRichText(richTextArray: any[]): string {
    if (!richTextArray || !Array.isArray(richTextArray)) return "";
    return richTextArray.map((rt: any) => rt.plain_text || "").join("");
}

function EditableText({
    initialText,
    onSave,
    className
}: {
    initialText: any[],
    onSave: (text: string) => void,
    className?: string
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [text, setText] = useState(extractRichText(initialText));

    if (isEditing) {
        return (
            <textarea
                autoFocus
                className={cn("w-full bg-transparent border-none focus:ring-0 p-0 resize-none font-inherit", className)}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onBlur={() => {
                    setIsEditing(false);
                    if (text !== extractRichText(initialText)) onSave(text);
                }}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.currentTarget.blur();
                    }
                }}
            />
        );
    }

    return (
        <div
            onClick={() => setIsEditing(true)}
            className={cn("cursor-text hover:bg-foreground/5 rounded px-0.5 -mx-0.5 transition-colors", className)}
        >
            <RichTextSpan richText={initialText} />
        </div>
    );
}

function RichTextSpan({ richText }: { richText: any[] }) {
    if (!richText || !Array.isArray(richText)) return null;
    return (
        <>
            {richText.map((rt: any, i: number) => {
                let el: React.ReactNode = rt.plain_text || "";
                if (rt.annotations?.bold) el = <strong key={i}>{el}</strong>;
                if (rt.annotations?.italic) el = <em key={i}>{el}</em>;
                if (rt.annotations?.strikethrough) el = <s key={i}>{el}</s>;
                if (rt.annotations?.underline) el = <u key={i}>{el}</u>;
                if (rt.annotations?.code)
                    el = (
                        <code
                            key={i}
                            className="px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-[12px] font-mono"
                        >
                            {el}
                        </code>
                    );
                if (rt.href)
                    el = (
                        <a
                            key={i}
                            href={rt.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
                        >
                            {el}
                        </a>
                    );
                return <span key={i}>{el}</span>;
            })}
        </>
    );
}

function NotionBlockRenderer({
    block,
    onUpdate
}: {
    block: NotionBlock,
    onUpdate?: (blockId: string, payload: any) => void
}) {
    const type = block.type;
    const data = block[type];
    const children = (block.children as NotionBlock[]) || [];

    const handleTextUpdate = (newText: string) => {
        onUpdate?.(block.id, {
            [type]: {
                rich_text: [{ text: { content: newText } }]
            }
        });
    };

    const renderChildren = () => {
        if (!children.length) return null;
        return (
            <div className="space-y-1 mt-1">
                {children.map((child) => (
                    <NotionBlockRenderer key={child.id} block={child} onUpdate={onUpdate} />
                ))}
            </div>
        );
    };

    switch (type) {
        case "paragraph":
            if (!data?.rich_text?.length && !children.length) return <div className="h-4" />;
            return (
                <div className="group relative">
                    <p className="text-[14px] leading-[1.8] text-foreground/85 font-normal">
                        <EditableText initialText={data.rich_text} onSave={handleTextUpdate} />
                    </p>
                    {renderChildren()}
                </div>
            );
        case "heading_1":
            return (
                <div className="mt-8 mb-4">
                    <h1 className="text-[26px] font-bold text-foreground tracking-tight">
                        <EditableText initialText={data.rich_text} onSave={handleTextUpdate} />
                    </h1>
                    {renderChildren()}
                </div>
            );
        case "heading_2":
            return (
                <div className="mt-6 mb-3">
                    <h2 className="text-[20px] font-bold text-foreground tracking-tight">
                        <EditableText initialText={data.rich_text} onSave={handleTextUpdate} />
                    </h2>
                    {renderChildren()}
                </div>
            );
        case "heading_3":
            return (
                <div className="mt-4 mb-2">
                    <h3 className="text-[16px] font-bold text-foreground tracking-tight">
                        <EditableText initialText={data.rich_text} onSave={handleTextUpdate} />
                    </h3>
                    {renderChildren()}
                </div>
            );
        case "bulleted_list_item":
            return (
                <div className="ml-5 group relative">
                    <li className="text-[14px] leading-[1.8] text-foreground/85 list-disc">
                        <EditableText initialText={data.rich_text} onSave={handleTextUpdate} />
                    </li>
                    {renderChildren()}
                </div>
            );
        case "numbered_list_item":
            return (
                <div className="ml-5 group relative">
                    <li className="text-[14px] leading-[1.8] text-foreground/85 list-decimal">
                        <EditableText initialText={data.rich_text} onSave={handleTextUpdate} />
                    </li>
                    {renderChildren()}
                </div>
            );
        case "to_do":
            return (
                <div className="group relative mb-1">
                    <div className="flex items-start gap-3 text-[14px] leading-[1.8]">
                        <button
                            onClick={() => onUpdate?.(block.id, { to_do: { checked: !data.checked } })}
                            className={cn(
                                "mt-[5px] flex-shrink-0 w-[18px] h-[18px] rounded-md border-2 flex items-center justify-center transition-all hover:scale-105 active:scale-95",
                                data.checked
                                    ? "bg-primary border-primary text-primary-foreground"
                                    : "border-muted-foreground/30 hover:border-primary/50"
                            )}
                        >
                            {data.checked && (
                                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                    <path
                                        d="M2 5L4 7L8 3"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            )}
                        </button>
                        <span className={cn(data.checked && "line-through opacity-50 transition-opacity")}>
                            <EditableText initialText={data.rich_text} onSave={handleTextUpdate} />
                        </span>
                    </div>
                    <div className="ml-7">{renderChildren()}</div>
                </div>
            );
        case "toggle":
            return (
                <details className="group my-2 ml-1">
                    <summary className="text-[14px] font-semibold cursor-pointer list-none flex items-center gap-2 text-foreground hover:text-primary transition-colors outline-none">
                        <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90 text-muted-foreground" />
                        <EditableText initialText={data.rich_text} onSave={handleTextUpdate} />
                    </summary>
                    <div className="ml-3 border-l border-border/20 pl-4 py-1">
                        {renderChildren()}
                    </div>
                </details>
            );
        case "column_list":
            return (
                <div className="flex flex-col md:flex-row gap-8 my-6 w-full">
                    {children.map((col) => (
                        <div key={col.id} className="flex-1 min-w-0">
                            <NotionBlockRenderer block={col} onUpdate={onUpdate} />
                        </div>
                    ))}
                </div>
            );
        case "column":
            return <div className="space-y-1">{renderChildren()}</div>;
        case "quote":
            return (
                <div className="my-4">
                    <blockquote className="pl-4 border-l-[3px] border-primary/40 italic text-[15px] leading-[1.8] text-foreground/70">
                        <EditableText initialText={data.rich_text} onSave={handleTextUpdate} />
                    </blockquote>
                    {renderChildren()}
                </div>
            );
        case "callout":
            return (
                <div className="my-4 p-4 rounded-2xl bg-muted/40 border border-border/50 flex items-start gap-3">
                    {data.icon?.emoji && <span className="text-xl shrink-0 mt-0.5">{data.icon.emoji}</span>}
                    <div className="text-[14px] leading-[1.8] text-foreground/85 flex-1">
                        <EditableText initialText={data.rich_text} onSave={handleTextUpdate} />
                        {renderChildren()}
                    </div>
                </div>
            );
        case "code":
            return (
                <div className="my-6">
                    <pre className="p-5 rounded-2xl bg-zinc-950 text-zinc-100 text-[13px] font-mono overflow-x-auto border border-white/5 shadow-2xl">
                        <div className="flex justify-between items-center mb-3 opacity-50 text-[10px] uppercase tracking-widest">
                            <span>{data.language}</span>
                        </div>
                        <code>{extractRichText(data.rich_text)}</code>
                    </pre>
                    {renderChildren()}
                </div>
            );
        case "divider":
            return <hr className="border-border/40 my-8" />;
        case "image": {
            const imgUrl = data?.file?.url || data?.external?.url;
            if (!imgUrl) return null;
            return (
                <div className="my-8 group relative rounded-2xl overflow-hidden border border-border/30 shadow-sm transition-shadow hover:shadow-md">
                    <img src={imgUrl} alt="" className="w-full object-cover max-h-[600px]" />
                    {data.caption?.length > 0 && (
                        <div className="bg-muted/50 px-4 py-2 border-t border-border/30">
                            <p className="text-[11px] text-muted-foreground text-center italic">
                                <RichTextSpan richText={data.caption} />
                            </p>
                        </div>
                    )}
                </div>
            );
        }
        case "bookmark": {
            const bookmarkUrl = data?.url;
            if (!bookmarkUrl) return null;
            return (
                <div className="my-4">
                    <a
                        href={bookmarkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/50 hover:bg-muted/50 hover:border-primary/30 transition-all group"
                    >
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                            <ExternalLink className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[13px] font-medium text-foreground truncate">{bookmarkUrl}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">Link externo</p>
                        </div>
                    </a>
                    {renderChildren()}
                </div>
            );
        }
        default:
            return null;
    }
}

// ─── Main Component ─────────────────────────────────────────────

interface NotionPagesPanelProps {
    onSelectNotionPage?: (pageId: string) => void;
    selectedPageId?: string | null;
}

export const NotionPagesPanel = ({
    onSelectNotionPage,
    selectedPageId,
}: NotionPagesPanelProps) => {
    const { pages, isLoading, isConnected, refetch, fetchPageContent, updateBlock } = useNotionPages();
    const [viewingPage, setViewingPage] = useState<{
        id: string;
        title: string;
        icon: any;
        url: string;
    } | null>(null);
    const [blocks, setBlocks] = useState<NotionBlock[]>([]);
    const [isLoadingContent, setIsLoadingContent] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const handleOpenPage = useCallback(
        async (page: any) => {
            setViewingPage(page);
            setIsLoadingContent(true);
            try {
                const content = await fetchPageContent(page.id);
                setBlocks(content);
            } catch (e) {
                console.error(e);
                setBlocks([]);
            } finally {
                setIsLoadingContent(false);
            }
            onSelectNotionPage?.(page.id);
        },
        [fetchPageContent, onSelectNotionPage]
    );

    const handleUpdateBlock = async (blockId: string, payload: any) => {
        // Optimistic update
        const updatedBlocks = JSON.parse(JSON.stringify(blocks));
        const updateInList = (list: NotionBlock[]) => {
            for (let b of list) {
                if (b.id === blockId) {
                    Object.assign(b, payload);
                    return true;
                }
                if (b.children && updateInList(b.children)) return true;
            }
            return false;
        };
        updateInList(updatedBlocks);
        setBlocks(updatedBlocks);

        const success = await updateBlock(blockId, payload);
        if (!success) {
            // Revert on failure
            const content = await fetchPageContent(viewingPage!.id);
            setBlocks(content);
        }
    };

    const handleBack = () => {
        setViewingPage(null);
        setBlocks([]);
        onSelectNotionPage?.(null as any);
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await refetch();
        setIsRefreshing(false);
    };

    const filteredPages = pages.filter((p) =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // ─── Not Connected State ─────────────────────────────────
    if (!isConnected) {
        return (
            <div className="flex flex-col items-center justify-center h-full px-8 text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-6"
                >
                    <div className="relative mx-auto w-20 h-20">
                        <div className="absolute inset-0 bg-foreground/5 rounded-3xl blur-2xl animate-pulse" />
                        <div className="relative w-20 h-20 rounded-3xl bg-background border border-border/50 flex items-center justify-center shadow-xl">
                            <NotionIcon className="h-9 w-9 text-foreground/70" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-lg font-bold tracking-tight">Notion</h3>
                        <p className="text-[13px] text-muted-foreground max-w-[260px] leading-relaxed">
                            Conecte sua conta do Notion para importar e visualizar suas páginas
                            diretamente aqui.
                        </p>
                    </div>
                    <Button asChild variant="outline" className="rounded-xl font-bold gap-2">
                        <Link to="/ajustes?tab=integrations">
                            Conectar Notion
                            <ChevronRight className="h-4 w-4" />
                        </Link>
                    </Button>
                </motion.div>
            </div>
        );
    }

    // ─── Page Content View ───────────────────────────────────
    if (viewingPage) {
        return (
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="flex flex-col h-full"
            >
                {/* Reader Header */}
                <div className="shrink-0 px-6 py-4 border-b border-border/40 bg-background/60 backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={handleBack}
                                className="h-8 w-8 rounded-xl hover:bg-muted"
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <div className="flex items-center gap-2.5">
                                {viewingPage.icon?.type === "emoji" ? (
                                    <span className="text-xl">{viewingPage.icon.value}</span>
                                ) : (
                                    <NotionIcon className="h-5 w-5 text-foreground/60" />
                                )}
                                <h2 className="text-[15px] font-bold tracking-tight truncate max-w-[400px]">
                                    {viewingPage.title}
                                </h2>
                            </div>
                        </div>
                        <a
                            href={viewingPage.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-[11px] font-semibold text-muted-foreground hover:text-primary transition-colors uppercase tracking-wider"
                        >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Abrir no Notion
                        </a>
                    </div>
                </div>

                {/* Reader Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="max-w-[720px] mx-auto px-8 py-10">
                        {isLoadingContent ? (
                            <div className="flex flex-col items-center justify-center h-64 gap-4">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                <p className="text-[12px] text-muted-foreground font-medium">
                                    Carregando conteúdo...
                                </p>
                            </div>
                        ) : blocks.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
                                <BookOpen className="h-8 w-8 text-muted-foreground/40" strokeWidth={1.5} />
                                <div>
                                    <p className="text-[13px] font-semibold text-muted-foreground">
                                        Página vazia
                                    </p>
                                    <p className="text-[11px] text-muted-foreground/60 mt-1">
                                        Esta página não possui conteúdo visível.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-1.5">
                                {blocks.map((block) => (
                                    <NotionBlockRenderer
                                        key={block.id}
                                        block={block}
                                        onUpdate={handleUpdateBlock}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <style>{`
          .custom-scrollbar::-webkit-scrollbar { width: 4px; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(128,128,128,0.2); border-radius: 20px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        `}</style>
            </motion.div>
        );
    }

    // ─── Pages List View ─────────────────────────────────────
    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="shrink-0 px-6 py-5 pb-4">
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-foreground/5 dark:bg-white/5 flex items-center justify-center">
                            <NotionIcon className="h-5 w-5 text-foreground/70" />
                        </div>
                        <div className="space-y-0.5">
                            <h2 className="text-[15px] font-bold tracking-tight text-foreground">
                                Notion
                            </h2>
                            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
                                {pages.length} página{pages.length !== 1 ? "s" : ""}
                            </p>
                        </div>
                    </div>
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground"
                    >
                        <RefreshCw
                            className={cn("h-4 w-4", isRefreshing && "animate-spin")}
                        />
                    </Button>
                </div>

                {/* Search */}
                <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                        <svg
                            className="h-3.5 w-3.5 text-muted-foreground group-focus-within:text-foreground transition-colors"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                    </div>
                    <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar páginas..."
                        className="w-full pl-9 h-9 bg-muted/40 border-transparent rounded-xl text-[13px] font-medium focus-visible:ring-1 focus-visible:ring-primary/20 focus-visible:bg-muted transition-all placeholder:text-muted-foreground/50 hover:bg-muted/60 border outline-none px-3"
                    />
                </div>
            </div>

            {/* Pages List */}
            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2 custom-scrollbar">
                {isLoading ? (
                    <div className="space-y-3 pt-2">
                        {[1, 2, 3, 4].map((i) => (
                            <div
                                key={i}
                                className="h-20 rounded-2xl bg-muted/40 animate-pulse"
                                style={{ animationDelay: `${i * 100}ms` }}
                            />
                        ))}
                    </div>
                ) : filteredPages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-center space-y-3 opacity-50 px-6">
                        <FileText className="h-6 w-6 text-muted-foreground" strokeWidth={1} />
                        <p className="text-[11px] font-medium text-muted-foreground">
                            {searchQuery
                                ? "Nenhuma página encontrada."
                                : "Nenhuma página importada."}
                        </p>
                    </div>
                ) : (
                    <AnimatePresence initial={false}>
                        {filteredPages.map((page, index) => (
                            <motion.div
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: index * 0.03 }}
                                key={page.id}
                                onClick={() => handleOpenPage(page)}
                                className={cn(
                                    "group relative rounded-2xl cursor-pointer transition-all duration-300 border overflow-hidden",
                                    selectedPageId === page.id
                                        ? "bg-card shadow-lg shadow-black/5 border-border/50 z-10 scale-[1.01]"
                                        : "bg-transparent hover:bg-card/60 border-transparent hover:border-border/30"
                                )}
                            >
                                {/* Cover image strip */}
                                {page.cover && (
                                    <div className="h-[72px] w-full overflow-hidden">
                                        <img
                                            src={page.cover}
                                            alt=""
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/80" />
                                    </div>
                                )}

                                <div
                                    className={cn(
                                        "p-4 flex items-start gap-3.5",
                                        page.cover && "-mt-3 relative z-10"
                                    )}
                                >
                                    {/* Icon */}
                                    <div
                                        className={cn(
                                            "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300",
                                            page.cover
                                                ? "bg-background border border-border/50 shadow-md"
                                                : "bg-muted/50 group-hover:bg-muted"
                                        )}
                                    >
                                        {page.icon?.type === "emoji" ? (
                                            <span className="text-xl leading-none">
                                                {page.icon.value}
                                            </span>
                                        ) : page.icon?.type === "url" ? (
                                            <img
                                                src={page.icon.value}
                                                alt=""
                                                className="w-5 h-5 object-contain"
                                            />
                                        ) : (
                                            <FileText className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0 space-y-1">
                                        <h3 className="text-[13px] font-semibold leading-snug tracking-tight line-clamp-1 text-foreground/90 group-hover:text-foreground transition-colors">
                                            {page.title}
                                        </h3>
                                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60 font-medium">
                                            <Clock className="h-3 w-3" />
                                            <span>
                                                {formatDistanceToNow(
                                                    new Date(page.last_edited_time),
                                                    { addSuffix: true, locale: ptBR }
                                                )}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Arrow */}
                                    <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-all group-hover:translate-x-0.5 shrink-0 mt-0.5" />
                                </div>

                                {/* Active stripe */}
                                {selectedPageId === page.id && (
                                    <div className="absolute left-0 top-3 bottom-3 w-1 bg-primary rounded-r-full" />
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>

            <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(128,128,128,0.2); border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
      `}</style>
        </div>
    );
};