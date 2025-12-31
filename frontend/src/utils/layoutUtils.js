/**
 * @fileoverview Graph Layout Utilities
 * 
 * Provides automatic layout calculation for ReactFlow graphs using the
 * Dagre library. Handles node positioning based on hierarchical structure.
 * 
 * @module utils/layoutUtils
 * @requires dagre
 * @requires reactflow
 */

import dagre from 'dagre';
import { Position } from 'reactflow';

/**
 * Node dimension configuration by type.
 * Defines width/height for each node type to ensure proper layout spacing.
 * @type {Object.<string, {width: number, height: number}>}
 */
const NODE_DIMENSIONS = {
    source: { width: 300, height: 160 },
    feedback: { width: 320, height: 250 },
    stats: { width: 300, height: 450 },
    recommendations: { width: 300, height: 200 },
    persona: { width: 300, height: 180 },
    default: { width: 300, height: 180 },
};

/**
 * Calculates automatic layout positions for nodes and edges using Dagre.
 * 
 * Uses hierarchical graph layout algorithm to position nodes based on
 * their connections. Supports both horizontal (LR) and vertical (TB) layouts.
 * 
 * @function getLayoutedElements
 * @param {Array<Object>} nodes - ReactFlow nodes array
 * @param {Array<Object>} edges - ReactFlow edges array
 * @param {string} [direction='TB'] - Layout direction ('TB' for top-bottom, 'LR' for left-right)
 * @returns {{nodes: Array<Object>, edges: Array<Object>}} Updated nodes with positions and edges
 * 
 * @example
 * const { nodes, edges } = getLayoutedElements(initialNodes, initialEdges, 'TB');
 */
export const getLayoutedElements = (nodes, edges, direction = 'TB') => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    const isHorizontal = direction === 'LR';

    // Configure graph layout parameters
    dagreGraph.setGraph({
        rankdir: direction,
        ranksep: isHorizontal ? 100 : 80,
        nodesep: isHorizontal ? 80 : 100,
    });

    // Register nodes with their dimensions
    nodes.forEach((node) => {
        const type = node.data?.type || node.type || 'default';
        const dims = NODE_DIMENSIONS[type] || NODE_DIMENSIONS.default;

        dagreGraph.setNode(node.id, { width: dims.width, height: dims.height });
    });

    // Register edges
    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    // Execute Dagre layout algorithm
    dagre.layout(dagreGraph);

    // Map calculated positions back to ReactFlow format
    const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);

        // Set handle positions based on layout direction
        const targetPosition = isHorizontal ? Position.Left : Position.Top;
        const sourcePosition = isHorizontal ? Position.Right : Position.Bottom;

        const type = node.data?.type || node.type || 'default';
        const dims = NODE_DIMENSIONS[type] || NODE_DIMENSIONS.default;

        return {
            ...node,
            targetPosition,
            sourcePosition,
            position: {
                // Dagre uses center coordinates; ReactFlow uses top-left
                x: nodeWithPosition.x - dims.width / 2,
                y: nodeWithPosition.y - dims.height / 2,
            },
        };
    });

    return { nodes: layoutedNodes, edges };
};
