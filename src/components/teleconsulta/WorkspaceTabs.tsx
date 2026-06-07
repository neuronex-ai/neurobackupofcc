import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NotebookPen, Sparkles, Paperclip } from "lucide-react";
import { WorkspaceNotePanel } from "./panels/WorkspaceNotePanel";
import { SummaryPanel } from "./panels/SummaryPanel";
import { AttachmentsPanel } from "./panels/AttachmentsPanel";
import { motion, AnimatePresence } from "framer-motion";

interface WorkspaceTabsProps {
  patientId: string;
  patientName: string;
}

const AnimatedWrapper = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95, y: 10 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.95, y: -10 }}
    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    className="h-full w-full"
  >
    {children}
  </motion.div>
);

export const WorkspaceTabs = ({ patientId, patientName }: WorkspaceTabsProps) => {
  return (
    <div className="desktop-apple-shell group relative flex flex-1 flex-col overflow-hidden rounded-[30px]">
      {/* Texture */}
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay pointer-events-none" />

      <Tabs defaultValue="workspace" className="flex flex-col h-full relative z-10">
        <div className="px-6 pb-3 pt-6">
          <TabsList className="grid w-full grid-cols-3 rounded-[18px] border border-black/[0.055] bg-black/[0.035] p-1 dark:border-white/[0.055] dark:bg-white/[0.035]">
            <TabsTrigger
              value="workspace"
              className="desktop-tactile rounded-[14px] text-[10px] font-bold uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=active]:shadow-sm dark:data-[state=active]:bg-white/[0.09] dark:data-[state=active]:text-white"
            >
              <div className="flex items-center gap-2">
                <NotebookPen className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Notas de Sessão</span>
              </div>
            </TabsTrigger>
            <TabsTrigger
              value="summary"
              className="desktop-tactile rounded-[14px] text-[10px] font-bold uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=active]:shadow-sm dark:data-[state=active]:bg-white/[0.09] dark:data-[state=active]:text-white"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Synapse AI</span>
              </div>
            </TabsTrigger>
            <TabsTrigger
              value="attachments"
              className="desktop-tactile rounded-[14px] text-[10px] font-bold uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=active]:shadow-sm dark:data-[state=active]:bg-white/[0.09] dark:data-[state=active]:text-white"
            >
              <div className="flex items-center gap-2">
                <Paperclip className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Anexos</span>
              </div>
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="relative mt-0 h-full flex-1 overflow-hidden p-6 pt-3">
          <AnimatePresence mode="wait">
            <TabsContent value="workspace" className="h-full mt-0 m-0 p-0 outline-none">
              <AnimatedWrapper key="workspace">
                <WorkspaceNotePanel patientId={patientId} patientName={patientName} />
              </AnimatedWrapper>
            </TabsContent>
            <TabsContent value="summary" className="h-full mt-0 m-0 p-0 outline-none">
              <AnimatedWrapper key="summary">
                <SummaryPanel patientId={patientId} />
              </AnimatedWrapper>
            </TabsContent>
            <TabsContent value="attachments" className="h-full mt-0 m-0 p-0 outline-none">
              <AnimatedWrapper key="attachments">
                <AttachmentsPanel patientId={patientId} />
              </AnimatedWrapper>
            </TabsContent>
          </AnimatePresence>
        </div>
      </Tabs>
    </div>
  );
};
