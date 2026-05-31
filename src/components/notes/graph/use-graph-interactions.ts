import { RefObject, useRef } from 'react';
import { GraphNode } from './graph-types';

// Engine state type for interactions
interface EngineState {
    width: number;
    height: number;
    camera: { x: number; y: number; k: number };
    targetCamera: { x: number; y: number; k: number };
    simulation?: any;
    hoveredNode: GraphNode | null;
    draggingNode?: GraphNode | null;
    dragStartPos: { x: number; y: number };
}

interface UseGraphInteractionsProps {
    canvasRef: RefObject<HTMLCanvasElement>;
    engine: RefObject<EngineState>;
    onNodeClick?: (node: any) => void;
    onHover?: (node: GraphNode | null, x: number, y: number) => void;
}

export const useGraphInteractions = ({
    canvasRef,
    engine,
    onNodeClick,
    onHover
}: UseGraphInteractionsProps) => {

    // Helper to get logic coordinates from screen events
    const getGraphPos = (clientX: number, clientY: number) => {
        if (!canvasRef.current) return { x: 0, y: 0 };
        const rect = canvasRef.current.getBoundingClientRect();
        const state = engine.current!;
        return {
            x: (clientX - rect.left - state.camera.x) / state.camera.k,
            y: (clientY - rect.top - state.camera.y) / state.camera.k
        };
    };

    // --- Mouse Handlers ---

    const handleMouseDown = (e: React.MouseEvent) => {
        const { x, y } = getGraphPos(e.clientX, e.clientY);
        const state = engine.current!;

        // Find node with larger hit area
        const node = state.simulation?.find(x, y, 40 / state.camera.k);

        state.dragStartPos = { x: e.clientX, y: e.clientY };

        if (node) {
            state.draggingNode = node;
            node.fx = node.x;
            node.fy = node.y;
            state.simulation?.alphaTarget(0.3).restart();
            if (canvasRef.current) canvasRef.current.style.cursor = "grabbing";
        } else {
            if (canvasRef.current) canvasRef.current.style.cursor = "grabbing"; // Panning
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        const state = engine.current!;

        if (state.draggingNode) {
            const { x, y } = getGraphPos(e.clientX, e.clientY);
            state.draggingNode.fx = x;
            state.draggingNode.fy = y;
            state.simulation?.alpha(0.5).restart();
        } else if (e.buttons === 1) {
            // Panning
            state.targetCamera.x += e.movementX;
            state.targetCamera.y += e.movementY;
        } else {
            // Hover
            const { x, y } = getGraphPos(e.clientX, e.clientY);
            const node = state.simulation?.find(x, y, 30 / state.camera.k);

            if (node?.id !== state.hoveredNode?.id) {
                state.hoveredNode = node || null;
                if (canvasRef.current) canvasRef.current.style.cursor = node ? "pointer" : "default";

                if (onHover) {
                    if (node && canvasRef.current) {
                        const rect = canvasRef.current.getBoundingClientRect();
                        const screenX = (node.x! * state.camera.k) + state.camera.x + rect.left;
                        const screenY = (node.y! * state.camera.k) + state.camera.y + rect.top;
                        onHover(node, screenX, screenY);
                    } else {
                        onHover(null, 0, 0);
                    }
                }
            }
        }
    };

    const handleMouseUp = (e: React.MouseEvent) => {
        const state = engine.current!;

        if (state.draggingNode) {
            const dist = Math.sqrt(Math.pow(e.clientX - state.dragStartPos.x, 2) + Math.pow(e.clientY - state.dragStartPos.y, 2));
            // Click threshold
            if (dist < 5 && onNodeClick) {
                if (state.draggingNode.type === 'note' || state.draggingNode.type === 'patient') {
                    onNodeClick(state.draggingNode.data);
                }
            }

            state.draggingNode.fx = undefined;
            state.draggingNode.fy = undefined;
            state.draggingNode = null;
            state.simulation?.alphaTarget(0);
        }
        if (canvasRef.current) canvasRef.current.style.cursor = state.hoveredNode ? "pointer" : "default";
    };

    const handleWheel = (e: React.WheelEvent) => {
        const state = engine.current!;
        const zoomSpeed = 0.001;

        // Zoom towards mouse pointer logic could be added here, 
        // for now simple center zoom is robust enough
        const newK = Math.max(0.1, Math.min(8, state.targetCamera.k - e.deltaY * zoomSpeed));
        state.targetCamera.k = newK;
    };

    // --- Touch Handlers (Mobile Support) ---
    // We use React ref to store last touch distance for pinch zoom
    const touchState = useRef({
        lastDist: 0,
        lastX: 0,
        lastY: 0
    });

    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            touchState.current.lastX = touch.clientX;
            touchState.current.lastY = touch.clientY;

            // Reusing mouse logic for drag/tap
            // We mock a mouse event structure
            handleMouseDown({
                clientX: touch.clientX,
                clientY: touch.clientY,
                buttons: 1
            } as any);
        } else if (e.touches.length === 2) {
            // Pinch Start
            const dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            touchState.current.lastDist = dist;
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        e.preventDefault(); // Prevent page scroll

        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const movementX = touch.clientX - touchState.current.lastX;
            const movementY = touch.clientY - touchState.current.lastY;

            touchState.current.lastX = touch.clientX;
            touchState.current.lastY = touch.clientY;

            // Reuse mouse move logic with injected movement data
            handleMouseMove({
                clientX: touch.clientX,
                clientY: touch.clientY,
                buttons: 1,
                movementX,
                movementY
            } as any);
        } else if (e.touches.length === 2) {
            // Pinch Zoom
            const dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );

            const delta = dist - touchState.current.lastDist;
            touchState.current.lastDist = dist;

            const state = engine.current!;
            const zoomSpeed = 0.005;
            const newK = Math.max(0.1, Math.min(8, state.targetCamera.k + delta * zoomSpeed));
            state.targetCamera.k = newK;
        }
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (e.touches.length === 0) {
            // Only call mouse up if no fingers left (end of interaction)
            // Use last known pos
            handleMouseUp({
                clientX: touchState.current.lastX,
                clientY: touchState.current.lastY
            } as any);
        }
    };

    return {
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
        handleWheel,
        handleTouchStart,
        handleTouchMove,
        handleTouchEnd
    };
};
