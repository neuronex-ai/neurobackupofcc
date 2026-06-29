import { describe, expect, it } from 'vitest';
import {
  NEUROFLOW_WORKFLOW_SCHEMA,
  deserializeNeuroFlowWorkflow,
  serializeNeuroFlowWorkflow,
  validateNeuroFlowWorkflow,
  workflowFromLegacyTables,
} from '../neuroflow-workflow';

describe('neuroflow workflow v2', () => {
  it('serializes and deserializes nodes, edges and viewport', () => {
    const workflow = serializeNeuroFlowWorkflow({
      nodes: [
        { id: 'a', type: 'item', position: { x: 10.4, y: 20.6 }, data: { label: 'A', sourceNoteId: 'note-1' } },
        { id: 'b', type: 'diagnostic', position: { x: 120, y: 220 }, data: { label: 'B', patientId: 'patient-1' } },
      ],
      edges: [
        { id: 'edge-1', source: 'a', target: 'b', type: 'neural', data: { relation: 'sustenta', polarity: 'supports' } },
      ],
      viewport: { x: 1, y: 2, zoom: 0.85 },
      metadata: { title: 'Formulação' },
    });

    expect(workflow.schema).toBe(NEUROFLOW_WORKFLOW_SCHEMA);
    expect(workflow.edges).toHaveLength(1);
    expect(workflow.links.map((link) => link.type)).toEqual(expect.arrayContaining(['note', 'patient']));

    const restored = deserializeNeuroFlowWorkflow(workflow);
    expect(restored.nodes[0].position).toEqual({ x: 10, y: 21 });
    expect(restored.edges[0].source).toBe('a');
  });

  it('rejects edges pointing to missing nodes', () => {
    expect(() => validateNeuroFlowWorkflow({
      schema: NEUROFLOW_WORKFLOW_SCHEMA,
      nodes: [{ id: 'a', type: 'item', position: { x: 0, y: 0 }, data: {} }],
      edges: [{ id: 'edge-1', source: 'a', target: 'missing' }],
      viewport: {},
      metadata: {},
      links: [],
    })).toThrow(/conexao invalida/i);
  });

  it('converts legacy flow tables into workflow v2', () => {
    const workflow = workflowFromLegacyTables({
      nodes: [
        { id: 'n1', type: 'item', x: 10, y: 20, label: 'Nota', content: { sourceNoteId: 'note-1' } },
        { id: 'n2', type: 'timeline', x: 40, y: 50, label: 'Evento', content: {} },
      ],
      edges: [
        { id: 'e1', source_id: 'n1', target_id: 'n2', type: 'neural' },
      ],
      metadata: { title: 'Legado' },
    });

    expect(workflow.metadata.migratedFrom).toBe('flow_tables');
    expect(workflow.nodes[0].data.label).toBe('Nota');
    expect(workflow.edges[0].target).toBe('n2');
  });
});
