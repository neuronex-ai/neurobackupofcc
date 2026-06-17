"use client";

import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import {
    ChevronLeft, Layers, Loader2, Lock, Maximize, Plus, Unlock, ZoomIn, ZoomOut
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactFlow, {
    addEdge, Background, Connection,
    Edge,
    Node, OnEdgesDelete, OnNodesDelete, Panel, ReactFlowProvider, useEdgesState, useNodesState, useReactFlow
} from 'reactflow';
import 'reactflow/dist/style.css';
import { toast } from 'sonner';
import NeuralEdge from './NeuralEdge';
import NeuralNode from './NeuralNode';
import { NeuroFlowEditModal } from './NeuroFlowEditModal';
import { NeuroFlowPreviewModal } from './NeuroFlowPreviewModal';
import { BridgeNode } from './nodes/BridgeNode';
import { DiagnosticNode } from './nodes/DiagnosticNode';
import { MoodNode } from './nodes/MoodNode';
import { TableNode } from './nodes/TableNode';
import { TranscriptionNode } from './nodes/TranscriptionNode';
import { NodeType, SegundoCerebro } from './SegundoCerebro';

const nodeTypes = {
  start: NeuralNode,
  root: NeuralNode,
  category: NeuralNode,
  action: NeuralNode,
  item: NeuralNode,
  logic: NeuralNode,
  quote: NeuralNode,
  document: NeuralNode,
  anamnesis: NeuralNode,
  somatic: NeuralNode,
  timeline: NeuralNode,
  mood: MoodNode,
  table: TableNode,
  diagnostic: DiagnosticNode,
  transcription: TranscriptionNode,
  bridge: BridgeNode,
};

const edgeTypes = {
  neural: NeuralEdge,
};

const NeuroFlowContent = ({ flowId, onBack }: { flowId?: string, onBack?: () => void }) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [patientId, setPatientId] = useState<string | null>(null);
  const { screenToFlowPosition, getViewport, zoomIn, zoomOut, fitView } = useReactFlow();
  const { theme } = useTheme();

  // Modal States
  const [editModalNoteId, setEditModalNoteId] = useState<string | null>(null);
  const [previewModalFileData, setPreviewModalFileData] = useState<any | null>(null);

  useEffect(() => {
    const handleOpenLib = () => setIsLibraryOpen(true);
    window.addEventListener('open-synaptic-library', handleOpenLib);
    return () => window.removeEventListener('open-synaptic-library', handleOpenLib);
  }, []);

  const loadFlow = useCallback(async () => {
    if (!flowId) return;
    setIsLoading(true);
    try {
      const { data: flowData } = await supabase.from('neuro_flows').select('patient_id').eq('id', flowId).single();
      const currentPatientId = flowData?.patient_id;
      setPatientId(currentPatientId);

      const { data: dbNodes } = await supabase.from('flow_nodes').select('*').eq('flow_id', flowId);
      const { data: dbEdges } = await supabase.from('flow_edges').select('*').eq('flow_id', flowId);

      if (dbNodes && dbNodes.length > 0) {
        setNodes(dbNodes.map(n => ({
          id: n.id,
          type: n.type || 'item',
          position: { x: n.x, y: n.y },
          data: { label: n.label || 'Sem título', patientId: currentPatientId, ...(n.content as object) },
        })));
      } else {
        setNodes([{
          id: 'root',
          type: 'root',
          position: { x: 250, y: 250 },
          data: { label: 'Início da Sessão' }
        }]);
      }

      if (dbEdges) {
        setEdges(dbEdges.map(e => ({
          id: e.id,
          source: e.source_id,
          target: e.target_id,
          sourceHandle: e.source_handle,
          targetHandle: e.target_handle,
          type: 'neural',
          animated: true
        })));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [flowId, setNodes, setEdges]);

  useEffect(() => { loadFlow(); }, [loadFlow]);

  // Sincronização automática
  useEffect(() => {
    if (isLoading) return;
    const timer = setTimeout(() => { saveState(); }, 2000);
    return () => clearTimeout(timer);
  }, [nodes, edges]);

  const saveState = async () => {
    if (!flowId || isSaving) return;
    setIsSaving(true);
    try {
      const nodeUpdates = nodes.map(n => ({
        id: n.id,
        flow_id: flowId,
        x: Math.round(n.position.x),
        y: Math.round(n.position.y),
        label: n.data.label,
        type: n.type,
        content: n.data // content now implicitly includes patientId but thats fine, or we can spread out
      }));
      await supabase.from('flow_nodes').upsert(nodeUpdates);

      const edgeUpdates = edges.map(e => ({
        id: e.id,
        flow_id: flowId,
        source_id: e.source,
        target_id: e.target,
        source_handle: e.sourceHandle,
        target_handle: e.targetHandle,
        type: e.type || 'neural'
      }));

      if (edgeUpdates.length > 0) {
        await supabase.from('flow_edges').upsert(edgeUpdates);
      }

    } catch (e) {
      console.error("[NeuroFlow] Erro ao salvar estado:", e);
    } finally {
      setIsSaving(false);
    }
  };

  const onConnect = useCallback((params: Connection | Edge) => {
    const edgeId = `edge-${crypto.randomUUID()}`;
    setEdges((eds) => addEdge({
      ...params,
      id: edgeId,
      type: 'neural',
      animated: true
    }, eds));
  }, [setEdges]);

  const onEdgesDelete: OnEdgesDelete = useCallback(async (deletedEdges) => {
    const ids = deletedEdges.map(e => e.id);
    if (ids.length > 0) {
      await supabase.from('flow_edges').delete().in('id', ids);
    }
  }, []);

  const onNodesDelete: OnNodesDelete = useCallback(async (deletedNodes) => {
    const ids = deletedNodes.map(n => n.id);
    if (ids.length > 0) {
      await supabase.from('flow_nodes').delete().in('id', ids);
    }
  }, []);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow/type') as NodeType;
      const rawData = event.dataTransfer.getData('application/reactflow/data');
      const extraData = rawData ? JSON.parse(rawData) : {};

      if (!type || !reactFlowWrapper.current) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: Node = {
        id: crypto.randomUUID(),
        type,
        position,
        data: {
          label: extraData.label || `Novo Bloco`,
          patientId, // Pass the patientId context
          ...extraData
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition, setNodes, patientId]
  );

  const onAddNode = useCallback((type: NodeType, data: any) => {
    // Get center of viewport
    const viewport = getViewport();
    const center = {
      x: -viewport.x / viewport.zoom + (window.innerWidth / 2) / viewport.zoom,
      y: -viewport.y / viewport.zoom + (window.innerHeight / 2) / viewport.zoom,
    };

    const newNode: Node = {
      id: crypto.randomUUID(),
      type,
      position: center,
      data: {
        label: data.label || `Novo Bloco`,
        patientId,
        ...data
      },
    };

    setNodes((nds) => nds.concat(newNode));
    toast.success(`${data.label || 'Bloco'} adicionado ao mapa.`);
  }, [getViewport, setNodes, patientId]);

  const onNodeDoubleClick = useCallback((_event: React.MouseEvent, node: Node) => {
    if (node.type === 'document') {
      setPreviewModalFileData({ id: node.id, label: node.data.label, ...node.data });
    } else {
      // Prioritize sourceNoteId (imported notes from Notas tab)
      const sourceNoteId = node.data.sourceNoteId;
      const linkedId = node.data.linkedNoteIds?.[0];
      const noteIdToEdit = sourceNoteId || linkedId;
      if (noteIdToEdit) {
        setEditModalNoteId(noteIdToEdit);
      } else {
        toast.info("Importe uma nota da Biblioteca ou vincule uma nota a este bloco.");
      }
    }
  }, []);

  if (isLoading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-transparent transition-colors duration-500">
        <Loader2 className="h-10 w-10 animate-spin text-zinc-900 dark:text-white mb-6" />
        <p className="text-[10px] text-zinc-400 dark:text-zinc-700 font-black uppercase tracking-[0.6em]">Processando</p>
      </div>
    );
  }

  return (
    <div
      className="relative isolate h-full min-h-0 w-full min-w-0 overflow-hidden bg-transparent [contain:layout_paint_size] transition-colors duration-500"
      ref={reactFlowWrapper as any}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodesDelete={onNodesDelete}
        onEdgesDelete={onEdgesDelete}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeDoubleClick={onNodeDoubleClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodesDraggable={!isLocked}
        nodesConnectable={!isLocked}
        elementsSelectable={!isLocked}
        fitView
        className="bg-transparent"
      >
        <Background
          color={theme === 'dark' ? "#ffffff" : "#000000"}
          gap={100}
          size={1}
          style={{ opacity: theme === 'dark' ? 0.02 : 0.05 }}
        />

        {/* HUD Overlay */}
        <Panel position="top-left" className="m-12">
          <div className="flex items-center gap-2 p-2 bg-white/80 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/5 rounded-2xl backdrop-blur-3xl shadow-xl dark:shadow-2xl">
            <button
              onClick={onBack}
              className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-900 dark:text-white transition-all mr-1"
            >
              <ChevronLeft size={20} strokeWidth={2.5} />
            </button>

            <div className="w-px h-6 bg-zinc-200 dark:bg-white/5 mx-1" />

            <button onClick={() => zoomIn()} className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-400 dark:text-zinc-600 hover:text-zinc-900 dark:hover:text-white transition-all"><ZoomIn size={18} /></button>
            <button onClick={() => zoomOut()} className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-400 dark:text-zinc-600 hover:text-zinc-900 dark:hover:text-white transition-all"><ZoomOut size={18} /></button>
            <button onClick={() => fitView()} className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-400 dark:text-zinc-600 hover:text-zinc-900 dark:hover:text-white transition-all"><Maximize size={18} /></button>

            <div className="w-px h-6 bg-zinc-200 dark:bg-white/5 mx-1" />

            <button onClick={() => setIsLocked(!isLocked)} className={cn(
              "h-10 w-10 flex items-center justify-center rounded-xl transition-all",
              isLocked
                ? "bg-zinc-900 dark:bg-white text-white dark:text-black shadow-lg"
                : "hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-400 dark:text-zinc-600 hover:text-zinc-900 dark:hover:text-white"
            )}>
              {isLocked ? <Lock size={18} /> : <Unlock size={18} />}
            </button>
          </div>
        </Panel>

        <Panel position="top-right" className="m-12">
          <Button
            onClick={() => setIsLibraryOpen(true)}
            className="h-14 w-14 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-black hover:scale-110 active:scale-95 transition-all shadow-xl dark:shadow-2xl flex items-center justify-center"
          >
            <Plus size={24} strokeWidth={3} />
          </Button>
        </Panel>

        <SegundoCerebro isOpen={isLibraryOpen} onClose={() => setIsLibraryOpen(false)} onAddNode={onAddNode} />

        {/* Modals */}
        <NeuroFlowEditModal
          noteId={editModalNoteId}
          isOpen={!!editModalNoteId}
          onClose={() => setEditModalNoteId(null)}
        />
        <NeuroFlowPreviewModal
          fileData={previewModalFileData}
          isOpen={!!previewModalFileData}
          onClose={() => setPreviewModalFileData(null)}
        />

        <Panel position="bottom-center" className="mb-12">
          <div className="px-10 py-5 bg-white/80 dark:bg-[#0a0a0b]/80 border border-zinc-200 dark:border-white/5 backdrop-blur-[40px] rounded-full flex items-center gap-10 shadow-xl dark:shadow-2xl">
            <div className="flex items-center gap-4">
              <Layers size={14} className="text-zinc-400 dark:text-zinc-600" />
              <span className="text-[10px] font-black text-zinc-900 dark:text-white uppercase tracking-[0.4em]">{nodes.length} Blocos / {edges.length} Conexões</span>
            </div>
            {isSaving && (
              <div className="flex items-center gap-2">
                <Loader2 size={12} className="animate-spin text-zinc-400 dark:text-zinc-500" />
                <span className="text-[8px] text-zinc-400 dark:text-zinc-500 font-black uppercase tracking-widest">Sincronizando</span>
              </div>
            )}
          </div>
        </Panel>
      </ReactFlow>

      <style>{`
        .react-flow__viewport {
          transition: transform 0.1s ease-out;
        }
      `}</style>
    </div>
  );
};

export const NeuroFlow = (props: any) => (
  <ReactFlowProvider>
    <NeuroFlowContent {...props} />
  </ReactFlowProvider>
);
