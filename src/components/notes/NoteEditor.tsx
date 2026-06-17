"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Calendar } from "@/components/ui/calendar";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList
} from "@/components/ui/command";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from "@/components/ui/popover";
import { usePatients } from "@/hooks/use-patients";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AnimatePresence, motion } from "framer-motion";
import {
    Calendar as CalendarIcon, CalendarDays,
    Check,
    ChevronDown, Clock, FileText as FileTextIcon, Mail, Maximize2, MessageCircle as MessageCircleIcon, Minimize2, MoreVertical, Plus, Save, Share2, Tag, Trash2, User, X
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { RichTextEditor } from "./RichTextEditor";

interface NoteEditorProps {
  note: any;
  onUpdate: (id: string, updates: any) => Promise<unknown> | void;
  onDelete: (id: string) => void;
  isFocusMode: boolean;
  onToggleFocus: () => void;
}

export const NoteEditor = ({
  note,
  onUpdate,
  onDelete,
  isFocusMode,
  onToggleFocus
}: NoteEditorProps) => {
  const [title, setTitle] = useState(note.title || "");
  const [content, setContent] = useState(note.content || "");
  const [saveStatus, setSaveStatus] = useState<'saved' | 'pending' | 'saving' | 'error'>('saved');
  const [newTag, setNewTag] = useState("");
  const [showToolbar, setShowToolbar] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const toolbarTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const latestDraftRef = useRef({ title: note.title || "", content: note.content || "" });
  const lastSavedDraftRef = useRef({ title: note.title || "", content: note.content || "" });
  const saveInFlightRef = useRef<Promise<void> | null>(null);
  const saveQueuedRef = useRef(false);
  const flushSaveRef = useRef<() => Promise<void>>(async () => undefined);

  const { data: patients } = usePatients();

  useEffect(() => {
    const nextDraft = { title: note.title || "", content: note.content || "" };
    setTitle(nextDraft.title);
    setContent(nextDraft.content);
    latestDraftRef.current = nextDraft;
    lastSavedDraftRef.current = nextDraft;
    setSaveStatus('saved');
  }, [note.id]);

  const draftsMatch = useCallback((
    first: { title: string; content: string },
    second: { title: string; content: string },
  ) => first.title === second.title && first.content === second.content, []);

  useEffect(() => {
    const serverDraft = { title: note.title || "", content: note.content || "" };
    const localDraft = latestDraftRef.current;
    const lastSavedDraft = lastSavedDraftRef.current;
    const localIsClean = draftsMatch(localDraft, lastSavedDraft);

    if (draftsMatch(serverDraft, localDraft)) {
      lastSavedDraftRef.current = serverDraft;
      if (saveStatus !== 'saving') setSaveStatus('saved');
      return;
    }

    if (localIsClean) {
      setTitle(serverDraft.title);
      setContent(serverDraft.content);
      latestDraftRef.current = serverDraft;
      lastSavedDraftRef.current = serverDraft;
    }
  }, [draftsMatch, note.title, note.content, saveStatus]);

  const flushSave = useCallback(async () => {
    if (saveInFlightRef.current) {
      saveQueuedRef.current = true;
      await saveInFlightRef.current;
      return;
    }

    const draftToSave = { ...latestDraftRef.current };
    if (draftsMatch(draftToSave, lastSavedDraftRef.current)) {
      setSaveStatus('saved');
      return;
    }

    setSaveStatus('saving');
    const request = Promise.resolve(onUpdate(note.id, draftToSave))
      .then(() => {
        lastSavedDraftRef.current = draftToSave;
        setSaveStatus(draftsMatch(latestDraftRef.current, draftToSave) ? 'saved' : 'pending');
      })
      .catch(() => {
        setSaveStatus('error');
      })
      .finally(() => {
        saveInFlightRef.current = null;
        const shouldContinue = saveQueuedRef.current
          || !draftsMatch(latestDraftRef.current, lastSavedDraftRef.current);
        saveQueuedRef.current = false;
        if (shouldContinue) void flushSaveRef.current();
      });

    saveInFlightRef.current = request;
    await request;
  }, [draftsMatch, note.id, onUpdate]);

  useEffect(() => {
    flushSaveRef.current = flushSave;
  }, [flushSave]);

  const updateDraft = useCallback((updates: Partial<{ title: string; content: string }>) => {
    const nextDraft = { ...latestDraftRef.current, ...updates };
    latestDraftRef.current = nextDraft;
    if (updates.title !== undefined) setTitle(updates.title);
    const nextStatus = draftsMatch(nextDraft, lastSavedDraftRef.current) ? 'saved' : 'pending';
    setSaveStatus(nextStatus);

    if (autosaveTimeoutRef.current) clearTimeout(autosaveTimeoutRef.current);
    if (nextStatus === 'pending') {
      autosaveTimeoutRef.current = setTimeout(() => {
        void flushSaveRef.current();
      }, 900);
    }
  }, [draftsMatch]);

  const handleMetadataUpdate = useCallback(async (updates: any) => {
    setSaveStatus('saving');
    try {
      await Promise.resolve(onUpdate(note.id, updates));
      setSaveStatus(draftsMatch(latestDraftRef.current, lastSavedDraftRef.current) ? 'saved' : 'pending');
    } catch {
      setSaveStatus('error');
    }
  }, [draftsMatch, note.id, onUpdate]);

  // Zen Mode Toolbar Visibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFocusMode) {
        onToggleFocus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    if (!isFocusMode) {
      setShowToolbar(true);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }

    const handleMouseMove = () => {
      setShowToolbar(true);
      if (toolbarTimeoutRef.current) clearTimeout(toolbarTimeoutRef.current);
      toolbarTimeoutRef.current = setTimeout(() => {
        setShowToolbar(false);
      }, 3000);
    };

    window.addEventListener('mousemove', handleMouseMove);
    handleMouseMove();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (toolbarTimeoutRef.current) clearTimeout(toolbarTimeoutRef.current);
    };
  }, [isFocusMode]);

  // Save on Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        void flushSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [flushSave]);

  useEffect(() => () => {
    if (autosaveTimeoutRef.current) clearTimeout(autosaveTimeoutRef.current);
    void flushSaveRef.current();
  }, []);

  const selectedPatient = useMemo(() =>
    patients?.find(p => p.id === note.patient_id),
    [patients, note.patient_id]
  );

  const handleAddTag = () => {
    if (!newTag.trim()) return;
    const tags = note.tags || [];
    if (!tags.includes(newTag.trim())) {
      void handleMetadataUpdate({ tags: [...tags, newTag.trim()] });
    }
    setNewTag("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const tags = note.tags || [];
    void handleMetadataUpdate({ tags: tags.filter((t: string) => t !== tagToRemove) });
  };

  const getPlainTextContent = useCallback(() => {
    return latestDraftRef.current.content.replace(/<[^>]*>/g, '').trim();
  }, []);

  const handleShareGoogleDocs = useCallback(async () => {
    const plainText = getPlainTextContent();
    const loadingToast = toast.loading("Preparando documento no Google Docs...");

    try {
      const { data, error } = await supabase.functions.invoke('google-suite-action', {
        body: {
          action: 'create_doc',
          title: title || 'Nota Clínica - NeuroNex',
          content: plainText
        }
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
        toast.success("Documento criado com sucesso!", { id: loadingToast });
      } else {
        throw new Error("Não foi possível gerar a URL do documento.");
      }
    } catch (err: any) {
      console.error('Erro ao exportar para Google Docs:', err);
      toast.error("Erro ao exportar", {
        id: loadingToast,
        description: err.message === "Google account not connected"
          ? "Sua conta Google não está conectada. Conecte-a nas configurações."
          : "Certifique-se de que sua conta Google está conectada."
      });
    }
  }, [title, getPlainTextContent]);

  const handleShareWhatsApp = useCallback(() => {
    const plainText = `*${title}*\n\n${getPlainTextContent()}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(plainText)}`, '_blank');
    toast.success("Abrindo WhatsApp...");
  }, [title, getPlainTextContent]);

  const handleShareGmail = useCallback(() => {
    const plainText = getPlainTextContent();
    const subject = encodeURIComponent(title || 'Nota Clínica - NeuroNex');
    const body = encodeURIComponent(plainText);
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}`, '_blank');
    toast.success("Abrindo Gmail...");
  }, [title, getPlainTextContent]);

  const handleCopyToClipboard = useCallback(() => {
    const text = `${title}\n\n${getPlainTextContent()}`;
    navigator.clipboard.writeText(text);
    toast.success("Conteúdo copiado!");
  }, [title, getPlainTextContent]);

  return (
    <div className={cn(
      "flex flex-col h-full w-full bg-transparent font-sans relative transition-all duration-700",
      isFocusMode ? "z-[60] fixed inset-0 bg-zinc-50 dark:bg-black overflow-hidden" : ""
    )}>
      {/* Immersive Focus Mode Background */}
      <AnimatePresence>
        {isFocusMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-0 pointer-events-none overflow-hidden"
          >
            <div className="absolute inset-0 notes-focus-backdrop" />
            <div className="absolute inset-0 notes-retina-texture opacity-[0.18] dark:opacity-[0.26]" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Editor Toolbar */}
      <AnimatePresence>
        {showToolbar && (
          <motion.div
            initial={isFocusMode ? { opacity: 0, y: -20, x: "-50%" } : { opacity: 1 }}
            animate={isFocusMode ? { opacity: 1, y: 0, x: "-50%" } : { opacity: 1 }}
            exit={isFocusMode ? { opacity: 0, y: -20, x: "-50%" } : { opacity: 1 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={cn(
              "h-14 px-5 md:px-7 flex items-center justify-between z-50 transition-all duration-700",
              isFocusMode
                ? "fixed top-8 left-1/2 w-[90%] max-w-4xl h-14 rounded-2xl bg-white/60 dark:bg-zinc-900/60 backdrop-blur-3xl border border-zinc-200 dark:border-zinc-800 shadow-[0_20px_50px_rgba(0,0,0,0.05)] ring-1 ring-zinc-100 dark:ring-white/5"
                : "border-b border-zinc-100 dark:border-white/5 bg-white/60 dark:bg-black/60 backdrop-blur-xl sticky top-0"
            )}
          >
            <div className="flex items-center gap-2 md:gap-4">
              {/* Patient Selector */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-9 px-3 rounded-xl border transition-all duration-200 gap-2",
                      selectedPatient
                        ? "bg-zinc-900 border-transparent text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                        : "bg-zinc-100 border-transparent text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 dark:bg-white/5 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-white"
                    )}
                  >
                    <User className="h-3.5 w-3.5" />
                    <span className="text-xs font-semibold tracking-tight truncate max-w-[120px]">
                      {selectedPatient ? selectedPatient.name : "Vincular"}
                    </span>
                    <ChevronDown className="h-3 w-3 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xl" align="start">
                  <Command className="bg-transparent">
                    <CommandInput placeholder="Buscar paciente..." className="h-10 border-none focus:ring-0 text-sm dark:text-white dark:placeholder:text-zinc-500" />
                    <CommandList className="max-h-[300px] custom-scrollbar p-1">
                      <CommandEmpty className="py-6 text-center text-xs text-muted-foreground">Nenhum paciente encontrado.</CommandEmpty>
                      <CommandGroup>
                        {patients?.map((patient) => (
                          <CommandItem
                            key={patient.id}
                            onSelect={() => void handleMetadataUpdate({ patient_id: patient.id })}
                            className="flex items-center justify-between px-3 py-2 cursor-pointer rounded-lg mx-1 aria-selected:bg-zinc-100 dark:aria-selected:bg-white/5 dark:text-zinc-200"
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary border border-primary/10">
                                {patient.name.charAt(0)}
                              </div>
                              <span className="text-sm font-medium">{patient.name}</span>
                            </div>
                            {note.patient_id === patient.id && <Check className="h-3.5 w-3.5 text-primary" />}
                          </CommandItem>
                        ))}
                        {note.patient_id && (
                          <CommandItem
                            onSelect={() => void handleMetadataUpdate({ patient_id: null })}
                            className="flex items-center gap-2 px-3 py-2 cursor-pointer text-destructive focus:text-destructive rounded-lg mx-1 mt-1"
                          >
                            <X className="h-3.5 w-3.5" />
                            <span className="text-sm font-medium">Desvincular</span>
                          </CommandItem>
                        )}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {/* Date/Time Selector */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 px-3 rounded-xl bg-zinc-100 dark:bg-white/5 border border-transparent text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-white/10 hover:text-zinc-900 dark:hover:text-white transition-all duration-200 gap-2"
                  >
                    <CalendarDays className="h-3.5 w-3.5" />
                    <span className="text-xs font-semibold tracking-tight">
                      {note.reference_date ? format(new Date(note.reference_date), "dd/MM/yyyy", { locale: ptBR }) : "Data"}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-4 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl" align="start">
                  <div className="space-y-4">
                    <Calendar
                      mode="single"
                      selected={note.reference_date ? new Date(note.reference_date) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          const newDate = note.reference_date ? new Date(note.reference_date) : new Date();
                          newDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
                          void handleMetadataUpdate({ reference_date: newDate.toISOString() });
                        }
                      }}
                      className="rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm dark:bg-black dark:text-zinc-200"
                    />
                    <div className="flex items-center gap-3 px-2 pt-2 border-t border-zinc-200 dark:border-white/10">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <Input
                        type="time"
                        value={note.reference_date ? format(new Date(note.reference_date), "HH:mm") : "00:00"}
                        onChange={(e) => {
                          const [hours, minutes] = e.target.value.split(':');
                          const newDate = note.reference_date ? new Date(note.reference_date) : new Date();
                          newDate.setHours(parseInt(hours), parseInt(minutes));
                          void handleMetadataUpdate({ reference_date: newDate.toISOString() });
                        }}
                        className="h-8 w-full bg-zinc-100 dark:bg-white/5 border-transparent rounded-md text-xs dark:text-white"
                      />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {(saveStatus === 'saving' || saveStatus === 'saved' || saveStatus === 'error') && (
                <div className="flex items-center gap-2 px-3 h-7 rounded-full border border-white/[0.06] bg-white/[0.035] transition-all duration-300 [.light_&]:border-zinc-200/70 [.light_&]:bg-zinc-100/80">
                  <div className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    saveStatus === 'saving' && "animate-pulse bg-zinc-300",
                    saveStatus === 'saved' && "bg-emerald-400",
                    saveStatus === 'error' && "bg-red-400",
                  )} />
                  <span className="text-[8px] font-black uppercase tracking-[0.18em] leading-none text-zinc-400 [.light_&]:text-zinc-600">
                    {saveStatus === 'saving' ? 'Salvando' : saveStatus === 'error' ? 'Não foi salvo' : 'Salvo'}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleFocus}
                className={cn(
                  "h-9 w-9 rounded-lg transition-all duration-200",
                  isFocusMode
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/5"
                )}
                title={isFocusMode ? "Sair do modo foco" : "Modo foco"}
              >
                {isFocusMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/5 transition-all"
                    title="Compartilhar"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 p-2 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-3xl border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl">
                  <DropdownMenuLabel className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-[0.2em] px-3 py-2">Exportar Nota Para</DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={handleShareGoogleDocs}
                    className="rounded-xl cursor-pointer text-zinc-700 dark:text-zinc-300 text-xs font-semibold py-3 px-3 gap-3 hover:bg-zinc-50 dark:hover:bg-white/5 transition-all"
                  >
                    <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/10"><FileTextIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" /></div>
                    Google Docs
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleShareWhatsApp}
                    className="rounded-xl cursor-pointer text-zinc-700 dark:text-zinc-300 text-xs font-semibold py-3 px-3 gap-3 hover:bg-zinc-50 dark:hover:bg-white/5 transition-all"
                  >
                    <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10"><MessageCircleIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /></div>
                    WhatsApp
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleShareGmail}
                    className="rounded-xl cursor-pointer text-zinc-700 dark:text-zinc-300 text-xs font-semibold py-3 px-3 gap-3 hover:bg-zinc-50 dark:hover:bg-white/5 transition-all"
                  >
                    <div className="p-1.5 rounded-lg bg-red-50 dark:bg-red-500/10"><Mail className="h-4 w-4 text-red-600 dark:text-red-400" /></div>
                    Gmail
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-zinc-100 dark:bg-white/5 my-1" />
                  <DropdownMenuItem
                    onClick={handleCopyToClipboard}
                    className="rounded-xl cursor-pointer text-zinc-500 dark:text-zinc-400 text-xs font-semibold py-3 px-3 gap-3 hover:bg-zinc-50 dark:hover:bg-white/5 transition-all"
                  >
                    <div className="p-1.5 rounded-lg bg-zinc-100 dark:bg-white/5"><Share2 className="h-4 w-4" /></div>
                    Copiar Texto
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-zinc-400 hover:text-foreground hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/5 transition-all">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-1.5 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-3xl border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl">
                  <DropdownMenuLabel className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider px-2 py-1.5">Tags</DropdownMenuLabel>
                  <div className="px-2 pb-2 space-y-2">
                    <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto custom-scrollbar">
                      {note.tags?.map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="bg-zinc-100 hover:bg-zinc-200 text-[10px] py-0.5 px-1.5 gap-1 border-transparent rounded-md text-foreground/80 font-medium dark:bg-white/5 dark:hover:bg-white/10 dark:text-zinc-300">
                          {tag}
                          <X className="h-2.5 w-2.5 cursor-pointer opacity-50 hover:opacity-100" onClick={() => handleRemoveTag(tag)} />
                        </Badge>
                      ))}
                      {(!note.tags || note.tags.length === 0) && (
                        <span className="text-[10px] text-muted-foreground italic">Sem tags</span>
                      )}
                    </div>
                    <div className="flex gap-1.5 pt-1">
                      <Input
                        placeholder="Nova tag..."
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                        className="h-7 bg-zinc-100 border-transparent text-xs rounded shadow-none focus-visible:ring-1 focus-visible:bg-zinc-200 dark:bg-white/5 dark:focus-visible:bg-white/10 dark:text-zinc-300"
                      />
                      <Button size="icon" variant="ghost" className="h-7 w-7 rounded hover:bg-zinc-100 dark:hover:bg-white/5" onClick={handleAddTag}>
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <DropdownMenuSeparator className="bg-zinc-200 my-1" />
                  <DropdownMenuItem
                    className="rounded-lg px-2 py-2 text-xs font-medium gap-2 text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                    onClick={() => setIsDeleteDialogOpen(true)}
                  >
                    <Trash2 className="h-4 w-4" /> Excluir Nota
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                onClick={() => void flushSave()}
                size="sm"
                className="ml-2 h-9 px-4 rounded-lg font-semibold text-xs shadow-sm active:scale-95 transition-all gap-2 bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
              >
                <Save className="h-3.5 w-3.5" />
                Salvar
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Glass Masks for Immersive Scrolling */}
      <AnimatePresence>
        {isFocusMode && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed top-0 left-0 right-0 h-40 bg-gradient-to-b from-zinc-50/90 via-zinc-50/40 to-transparent z-[20] pointer-events-none dark:from-black dark:via-black/40 backdrop-blur-[2px]"
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-zinc-50/90 via-zinc-50/40 to-transparent z-[20] pointer-events-none dark:from-black dark:via-black/40 backdrop-blur-[2px]"
            />
          </>
        )}
      </AnimatePresence>

      {/* Editor Content Area */}
      <div className={cn(
        "notes-scroll-surface relative z-10 flex-1 overflow-y-auto overscroll-contain bg-transparent custom-scrollbar [scrollbar-gutter:stable]",
        isFocusMode ? "pt-40 pb-60" : ""
      )}>
        <div className={cn(
          "mx-auto max-w-[840px] space-y-8 px-7 py-10 md:px-12",
          isFocusMode ? "max-w-[1200px] py-40" : ""
        )}>
          {/* Header Metadata */}
          <div className={cn(
            "space-y-5 animate-in fade-in slide-in-from-top-4 duration-700",
            isFocusMode ? "mb-32" : "mb-7"
          )}>
            {/* Title Input */}
            <motion.input
              initial={false}
              animate={isFocusMode ? { scale: 1.05, y: -20 } : { scale: 1, y: 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 100 }}
              value={title}
              onChange={(e) => updateDraft({ title: e.target.value })}
              onBlur={() => void flushSave()}
              placeholder="Nota sem título"
              className={cn(
                "w-full bg-transparent border-none focus:ring-0 font-black tracking-tighter text-zinc-900 placeholder:text-zinc-300 focus:outline-none py-2 selection:bg-zinc-900/10 leading-[1.1] transition-all dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:selection:bg-white/10",
                isFocusMode ? "text-6xl md:text-8xl text-center" : "text-3xl md:text-4xl text-zinc-900 dark:text-zinc-100",
                !title && "animate-shimmer"
              )}
            />

            <div className={cn(
              "flex flex-wrap items-center gap-6 text-zinc-400 text-[10px] font-black uppercase tracking-[0.3em] dark:text-zinc-500",
              isFocusMode ? "justify-center" : ""
            )}>
              <div className="flex items-center gap-2 hover:text-foreground transition-colors cursor-default group dark:hover:text-white">
                <CalendarIcon className="h-3.5 w-3.5 group-hover:text-primary transition-colors" />
                <span>{format(new Date(note.created_at), "dd 'de' MMM, yyyy", { locale: ptBR })}</span>
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-primary/20" />
              <div className="flex items-center gap-2 hover:text-foreground transition-colors cursor-default group dark:hover:text-white">
                <Clock className="h-3.5 w-3.5 group-hover:text-primary transition-colors" />
                <span>{format(new Date(note.updated_at), "HH:mm")}</span>
              </div>

              {note.tags && note.tags.length > 0 && (
                <>
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/20" />
                  <div className="flex items-center gap-4">
                    {note.tags.map((tag: string) => (
                      <span key={tag} className="flex items-center gap-2 text-primary hover:text-white transition-all cursor-pointer">
                        <Tag className="h-3 w-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="w-full h-px bg-gradient-to-r from-transparent via-zinc-100 to-transparent dark:via-zinc-800" />

          {/* Rich Text Editor */}
          <div className="min-h-[480px] pb-28 animate-in fade-in duration-500 delay-100">
            <RichTextEditor
              content={content}
              onChange={(html) => updateDraft({ content: html })}
              placeholder="Comece a escrever... Digite '/' para comandos."
              className="prose-lg focus:outline-none max-w-none text-zinc-800 leading-relaxed font-sans dark:text-zinc-100"
              editable={true}
              patients={patients?.map(p => ({ id: p.id, name: p.name }))}
              isFocusMode={isFocusMode}
            />
          </div>
        </div>
      </div>

      {/* Accessibility Hint */}
      <AnimatePresence>
        {isFocusMode && showToolbar && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, x: 20 }}
            className="fixed bottom-10 right-10 z-50 pointer-events-none"
          >
            <div className="flex items-center gap-4 px-6 py-3 rounded-2xl bg-black/40 backdrop-blur-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] ring-1 ring-white/10">
              <div className="flex items-center justify-center min-w-[36px] h-7 px-2 rounded-lg bg-white/10 border border-white/10 text-[10px] font-black tracking-tighter text-white/80 shadow-inner">ESC</div>
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Encerrar Sessão de Foco</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="max-w-md rounded-[26px] border-white/[0.08] bg-zinc-950/95 p-0 text-white shadow-[0_36px_100px_-32px_rgba(0,0,0,0.9)] backdrop-blur-3xl [.light_&]:border-zinc-200/80 [.light_&]:bg-white/95 [.light_&]:text-zinc-950">
          <div className="p-6">
            <AlertDialogHeader className="space-y-3">
              <AlertDialogTitle className="text-xl font-black tracking-tight">Excluir esta nota?</AlertDialogTitle>
              <AlertDialogDescription className="text-sm leading-relaxed text-zinc-400 [.light_&]:text-zinc-600">
                Esta ação é permanente e a nota não poderá ser recuperada depois.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-7 gap-2">
              <AlertDialogCancel className="h-11 rounded-xl border-white/[0.08] bg-white/[0.04] text-white hover:bg-white/[0.08] hover:text-white [.light_&]:border-zinc-200 [.light_&]:bg-white [.light_&]:text-zinc-700 [.light_&]:hover:bg-zinc-100">
                Manter nota
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onDelete(note.id)}
                className="h-11 rounded-xl bg-red-500 text-white hover:bg-red-600"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.1); border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        
        @keyframes float-slow {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(5% , 5%) scale(1.1); }
          100% { transform: translate(0, 0) scale(1); }
        }
        
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        
        .animate-shimmer {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent);
          background-size: 200% 100%;
          animation: shimmer 3s infinite;
        }

        .animate-float-slow {
          animation: float-slow 20s ease-in-out infinite;
        }
        
        .animate-float-slower {
          animation: float-slow 30s ease-in-out infinite reverse;
        }
      `}</style>
    </div>
  );
};
