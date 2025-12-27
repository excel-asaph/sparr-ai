import dagre from 'dagre';
import { Position } from 'reactflow';

// Define estimated dimensions per node type to ensure layout awareness
const NODE_DIMENSIONS = {
    source: { width: 300, height: 160 },
    feedback: { width: 320, height: 250 }, // Feedback text can be long
    stats: { width: 300, height: 450 },     // Statistics has 5 progress bars + header
    recommendations: { width: 300, height: 200 },
    persona: { width: 300, height: 180 },
    default: { width: 300, height: 180 },
};

/**
 * Calculates the layout for nodes and edges using dagre.
 * @param {Array} nodes 
 * @param {Array} edges 
 * @param {string} direction 'TB' (Top-Bottom) or 'LR' (Left-Right)
 * @returns {object} { nodes, edges } with updated positions
 */
export const getLayoutedElements = (nodes, edges, direction = 'TB') => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    // Increased separation for better readability
    const isHorizontal = direction === 'LR';
    dagreGraph.setGraph({
        rankdir: direction,
        ranksep: isHorizontal ? 100 : 80, // Distance between ranks (levels)
        nodesep: isHorizontal ? 80 : 100, // Distance between nodes in same rank
    });

    nodes.forEach((node) => {
        // Fallback to default if type not found or data.type not set
        const type = node.data?.type || node.type || 'default';
        const dims = NODE_DIMENSIONS[type] || NODE_DIMENSIONS.default;

        dagreGraph.setNode(node.id, { width: dims.width, height: dims.height });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);

        // Handle positions based on direction
        const targetPosition = isHorizontal ? Position.Left : Position.Top;
        const sourcePosition = isHorizontal ? Position.Right : Position.Bottom;

        // Get dimensions used for calculation to center correctly
        const type = node.data?.type || node.type || 'default';
        const dims = NODE_DIMENSIONS[type] || NODE_DIMENSIONS.default;

        return {
            ...node,
            targetPosition,
            sourcePosition,
            position: {
                // Shift position because dagre places based on center, ReactFlow needs top-left
                x: nodeWithPosition.x - dims.width / 2,
                y: nodeWithPosition.y - dims.height / 2,
            },
        };
    });

    return { nodes: layoutedNodes, edges };
};
