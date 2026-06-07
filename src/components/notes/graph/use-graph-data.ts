import { useMemo, useRef, useEffect } from "react";
import { usePersonalNotes } from "@/hooks/use-personal-notes";
import { usePatients } from "@/hooks/use-patients";
import { GraphNode, GraphLink, GRAPH_COLORS } from "./graph-types";
import { NeuroConfig } from "../NeuroViewControls";

interface UseGraphDataProps {
  config: NeuroConfig;
  searchQuery: string;
}

export const useGraphData = ({ config, searchQuery }: UseGraphDataProps) => {
  const { notes, isLoading: loadingNotes } = usePersonalNotes();
  const { data: patients, isLoading: loadingPatients } = usePatients();
  
  // Cache images and previous node positions
  const imagesRef = useRef<Record<string, HTMLImageElement>>({});
  const nodePositions = useRef<Record<string, { x: number, y: number, vx: number, vy: number }>>({});

  const { graphData, nodeMap } = useMemo(() => {
    if (!notes || !patients) {
        return { graphData: { nodes: [], links: [] }, nodeMap: {} };
    }

    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];
    const map: Record<string, GraphNode> = {};
    const addedIds = new Set<string>();

    const getOrLoadImage = (url: string) => {
      if (!imagesRef.current[url]) {
        const img = new Image();
        img.src = url;
        img.crossOrigin = "Anonymous";
        imagesRef.current[url] = img;
      }
      return imagesRef.current[url];
    };

    // Helper to restore position
    const enhanceNode = (n: GraphNode) => {
        const prev = nodePositions.current[n.id];
        if (prev) {
            n.x = prev.x;
            n.y = prev.y;
            // Also restore velocity to prevent sudden stops
            (n as any).vx = prev.vx;
            (n as any).vy = prev.vy;
        }
        return n;
    };

    const addNode = (n: any) => {
      if (n.type === 'patient' && !config.showPatients) return;
      if (n.type === 'note' && !config.showNotes) return;
      if (n.type === 'tag' && !config.showTags) return;

      const baseRadius = n.type === 'patient' ? 6 : (n.type === 'note' ? 4.2 : 2.8);
      const baseGlow = n.type === 'patient' ? 24 : (n.type === 'note' ? 16 : 10);
      const pulseSeed = Array.from(String(n.id)).reduce((sum, char) => sum + char.charCodeAt(0), 0) % 997;

      const node: GraphNode = {
        ...n,
        val: n.type === 'patient' ? 22 : (n.type === 'note' ? 11 : 5),
        neighbors: [],
        links: [],
        imgObj: n.imgUrl ? getOrLoadImage(n.imgUrl) : undefined,
        currentRadius: baseRadius,
        targetRadius: baseRadius,
        currentGlow: baseGlow,
        targetGlow: baseGlow,
        revealProgress: 1,
        revealTarget: 1,
        pulseSeed
      };

      nodes.push(enhanceNode(node));
      addedIds.add(n.id);
      map[n.id] = node;
    };

    // Add Patients
    patients.forEach(p => {
      addNode({
        id: `pat-${p.id}`,
        label: p.name,
        type: 'patient',
        color: '#FFFFFF',
        imgUrl: p.avatar_url,
        data: p
      });
    });

    // Add Notes & Tags
    notes.forEach(n => {
      const noteId = `note-${n.id}`;
      const matchesSearch = searchQuery === "" ||
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.content.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return;

      addNode({
        id: noteId,
        label: n.title,
        type: 'note',
        color: GRAPH_COLORS.note,
        data: n
      });

      // Link Note -> Patient
      if (n.patient_id && addedIds.has(`pat-${n.patient_id}`) && addedIds.has(noteId)) {
        links.push({ source: `pat-${n.patient_id}`, target: noteId, value: 2, revealProgress: 1, revealTarget: 1 });
      }

      // Tags
      n.tags?.forEach((tag: string) => {
        const tagId = `tag-${tag}`;
        if (!addedIds.has(tagId)) {
          addNode({ id: tagId, label: `#${tag}`, type: 'tag', color: GRAPH_COLORS.tag });
        }
        if (addedIds.has(noteId) && addedIds.has(tagId)) {
          links.push({ source: noteId, target: tagId, value: 1, revealProgress: 1, revealTarget: 1 });
        }
      });
    });

    // Compute Neighbors for highlighting logic
    links.forEach(link => {
      const a = map[link.source as string];
      const b = map[link.target as string];
      if (a && b) {
        link.pulseSeed = ((a.pulseSeed || 0) + (b.pulseSeed || 0)) % 997;
        a.neighbors?.push(b);
        b.neighbors?.push(a);
        a.links?.push(link);
        b.links?.push(link);
      }
    });

    return { graphData: { nodes, links }, nodeMap: map };
  }, [notes, patients, config, searchQuery]);

  // Continuously save positions to ref to persist across re-renders
  useEffect(() => {
     // We don't need a timer, just update on unmount or before re-render? 
     // Actually, graph library updates the node objects directly.
     // We need to capture that state periodically or before updates.
     const interval = setInterval(() => {
         graphData.nodes.forEach(n => {
             if (Number.isFinite(n.x) && Number.isFinite(n.y)) {
                 nodePositions.current[n.id] = { 
                     x: n.x!, 
                     y: n.y!, 
                     vx: (n as any).vx || 0,
                     vy: (n as any).vy || 0
                 };
             }
         });
     }, 500);
     return () => clearInterval(interval);
  }, [graphData]);

  return { 
    graphData, 
    nodeMap, 
    notes,
    patients,
    isLoading: loadingNotes || loadingPatients 
  };
};
