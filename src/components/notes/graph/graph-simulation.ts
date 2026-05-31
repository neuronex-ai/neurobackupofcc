import {
    forceSimulation,
    forceLink,
    forceManyBody,
    forceCenter,
    forceCollide,
    forceX,
    forceY,
    Simulation
} from "d3-force";
import { GraphNode, GraphLink } from "./graph-types";
import { GraphConfig } from "../GraphSettings";

export const createSimulation = (
    nodes: GraphNode[],
    links: GraphLink[],
    config: GraphConfig
): Simulation<GraphNode, GraphLink> => {

    return forceSimulation<GraphNode>(nodes)
        .velocityDecay(0.3) // Lower = more "floaty/organic" feel (Obsidian-like)
        .alphaDecay(0.02)   // Slower decay = longer settling animation
        .alphaMin(0.001)    // Lower threshold = smoother final positions
        .force("link", forceLink<GraphNode, GraphLink>(links)
            .id(d => d.id)
            .distance(config.linkDistance)
            .strength(0.4)) // Softer links for organic stretch
        .force("charge", forceManyBody()
            .strength(config.repulsion)
            .distanceMax(600)
            .theta(0.8)) // Smoother approximation
        .force("collide", forceCollide()
            .radius((d: any) => config.nodeSize * 2.5 + (d.type === 'patient' ? 12 : 4))
            .strength(0.6)
            .iterations(2)) // Fewer iterations but larger radii
        .force("center", forceCenter(0, 0).strength(config.centerForce * 0.5)) // Very soft centering
        .force("x", forceX(0).strength(config.centerForce / 3))
        .force("y", forceY(0).strength(config.centerForce / 3));
};

export const updateSimulationForces = (
    simulation: Simulation<GraphNode, GraphLink>,
    config: GraphConfig
) => {
    simulation.force("charge", forceManyBody()
        .strength(config.repulsion)
        .distanceMax(600)
        .theta(0.8));
    // @ts-ignore
    simulation.force("link").distance(config.linkDistance).strength(0.4);
    // @ts-ignore
    simulation.force("collide").radius((d: any) => config.nodeSize * 2.5 + (d.type === 'patient' ? 12 : 4));
    // @ts-ignore
    simulation.force("center").strength(config.centerForce * 0.5);

    simulation.alpha(0.4).restart(); // Slightly warmer restart for smoother response
};