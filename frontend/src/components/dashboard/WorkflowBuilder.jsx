import React, { useState, useCallback, useMemo, useRef } from 'react';
import ReactFlow, {
    Background,
    Controls,
    addEdge,
    useNodesState,
    useEdgesState,
    Handle,
    Position,
    useReactFlow,
    ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, FileText, AlertCircle, Play, Plus, Minus, Maximize, Lock, Unlock, MousePointer, Hand, MessageSquare,
    Activity, CheckCircle2, User, Trash2, Layout, ArrowRight, ArrowDown, Undo2, Redo2, History,
    ListChecks, CircleDashed, ChevronDown, BarChart3, Lightbulb, MessageSquareText, UserCircle2
} from 'lucide-react';
import { getLayoutedElements } from '../../utils/layoutUtils';
import { generateMockReport } from '../../utils/reportSimulator';
import { PERSONAS } from '../../data/personas';
import HistoryExplorer from './HistoryExplorer';
import LeftSidebar from './LeftSidebar';

const WorkflowHUD = ({ isLocked, setIsLocked, onLayout, onUndo, onRedo, canUndo, canRedo }) => {
    const { zoomIn, zoomOut, fitView } = useReactFlow();
    const [showLayoutMenu, setShowLayoutMenu] = useState(false);

    return (
        <div className="absolute left-6 top-1/2 -translate-y-1/2 bg-white rounded-full py-3 px-1.5 flex flex-col gap-2 shadow-xl border border-gray-200 z-50">
            {/* Mode Tools */}
            <div className="flex flex-col gap-1 pb-1">
                <button
                    className={`p-1.5 rounded-full transition-all ${!isLocked ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
                    onClick={() => setIsLocked(false)}
                    title="Selection Mode"
                >
                    <MousePointer size={16} />
                </button>
                <button
                    className={`p-1.5 rounded-full transition-all ${isLocked ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
                    onClick={() => setIsLocked(true)}
                    title="Pan Mode (Locked)"
                >
                    <Hand size={16} />
                </button>
            </div>

            {/* Layout Tools */}
            <div className="flex flex-col gap-1 pb-1 relative">
                <button
                    onClick={() => setShowLayoutMenu(!showLayoutMenu)}
                    className={`p-1.5 rounded-full transition-all ${showLayoutMenu ? 'text-gray-900 bg-gray-100' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
                    title="Auto Layout"
                >
                    <Layout size={16} />
                </button>

                {/* Layout Dropdown */}
                <AnimatePresence>
                    {showLayoutMenu && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="absolute left-full top-0 ml-4 bg-white rounded-xl border border-gray-200 p-1 flex flex-col gap-1 shadow-xl min-w-[140px] z-50"
                        >
                            <div className="px-3 py-2 text-[10px] items-center uppercase font-bold text-gray-500 tracking-wider border-b border-gray-100 mb-1">
                                Rearrange
                            </div>
                            <button onClick={() => { onLayout('LR'); setShowLayoutMenu(false); }} className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors text-left">
                                <ArrowRight size={14} /> Horizontal
                            </button>
                            <button onClick={() => { onLayout('TB'); setShowLayoutMenu(false); }} className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors text-left">
                                <ArrowDown size={14} /> Vertical
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* View Controls */}
            <div className="flex flex-col gap-1 pb-1">
                <button onClick={() => zoomIn()} className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all" title="Zoom In">
                    <Plus size={16} />
                </button>
                <button onClick={() => zoomOut()} className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all" title="Zoom Out">
                    <Minus size={16} />
                </button>
                <button onClick={() => fitView({ padding: 0.2, maxZoom: 0.95 })} className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all" title="Fit View">
                    <Maximize size={16} />
                </button>
            </div>

            {/* History Tools */}
            <div className="flex flex-col gap-1 pb-1">
                <button
                    onClick={onUndo}
                    disabled={!canUndo}
                    className={`p-1.5 rounded-full transition-all ${!canUndo ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
                    title="Undo"
                >
                    <Undo2 size={16} />
                </button>
                <button
                    onClick={onRedo}
                    disabled={!canRedo}
                    className={`p-1.5 rounded-full transition-all ${!canRedo ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
                    title="Redo"
                >
                    <Redo2 size={16} />
                </button>
            </div>

            {/* Lock Action */}
            <div className="flex flex-col gap-1 pt-1 border-t border-gray-100">
                <button
                    onClick={() => setIsLocked(!isLocked)}
                    className={`p-1.5 rounded-full transition-all ${isLocked ? 'text-red-500 hover:bg-red-50' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
                    title={isLocked ? "Unlock Canvas" : "Lock Canvas"}
                >
                    {isLocked ? <Lock size={16} /> : <Unlock size={16} />}
                </button>
            </div>
        </div>
    );
};

// Custom Node Component
const CustomNode = ({ id, data, selected }) => {
    const { type, nodeData, mockReport, onDelete, updateData, hasOutgoingConnection, hasIncomingConnection } = data;
    const [isHovered, setIsHovered] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Node type configurations
    const nodeConfigs = {
        source: { label: 'Source', icon: FileText, color: 'text-blue-700', bgColor: 'bg-blue-50' },
        feedback: { label: 'Feedback', icon: MessageSquareText, color: 'text-purple-700', bgColor: 'bg-purple-50' },
        stats: { label: 'Statistics', icon: BarChart3, color: 'text-emerald-700', bgColor: 'bg-emerald-50' },
        recommendations: { label: 'Recommendations', icon: Lightbulb, color: 'text-amber-700', bgColor: 'bg-amber-50' },
        persona: { label: 'Target Persona', icon: UserCircle2, color: 'text-pink-700', bgColor: 'bg-pink-50' },
    };

    const config = nodeConfigs[type];
    const Icon = config.icon;

    return (
        <div
            className={`bg-white rounded-2xl shadow-xl shadow-black/5 hover:shadow-2xl hover:shadow-black/10 transition-all duration-300 ${selected ? 'ring-2 ring-blue-500' : 'border border-gray-200'
                }`}
            style={{ minWidth: '260px' }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Input Handle */}
            {type !== 'source' && (
                <Handle
                    type="target"
                    position={Position.Top}
                    isConnectable={!hasIncomingConnection}
                    className={`w-2.5 h-2.5 !border-2 !border-white rounded-full translate-y-[-50%] ${hasIncomingConnection ? '!bg-gray-400' : '!bg-gray-300'}`}
                />
            )}

            {/* Header */}
            <div className={`px-5 py-3 flex items-center justify-between border-b border-gray-200`}>
                <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-lg ${config.bgColor}`}>
                        <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                    </div>
                    <span className={`text-sm font-semibold text-gray-900`}>
                        {config.label}
                    </span>
                </div>
                {type !== 'source' && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                        className="text-gray-300 hover:text-red-500 transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Body */}
            <div className="p-4 space-y-3">
                {/* Source */}
                {type === 'source' && nodeData.interview && (
                    <div className="text-xs text-gray-600">
                        <p><strong className="text-gray-900">Previous:</strong> {nodeData.interview.jobContext.role}</p>
                        <p><strong className="text-gray-900">Company:</strong> {nodeData.interview.jobContext.company}</p>
                    </div>
                )}

                {/* Feedback */}
                {type === 'feedback' && mockReport && (
                    <div className="bg-gray-50 p-2 rounded text-[10px] text-gray-600 italic border border-gray-200">
                        "{mockReport.feedback?.summary ? mockReport.feedback.summary.substring(0, 80) : (typeof mockReport.feedback === 'string' ? mockReport.feedback.substring(0, 80) : 'No feedback available')}..."
                    </div>
                )}

                {/* Statistics */}
                {type === 'stats' && mockReport && (
                    <div className="space-y-2">
                        {Object.entries(mockReport.stats).map(([key, value]) => (
                            <div key={key} className="space-y-1">
                                <div className="flex justify-between items-center">
                                    <span className="text-[9px] text-gray-600 uppercase font-medium">
                                        {key.replace(/([A-Z])/g, ' $1').trim()}
                                    </span>
                                    <span className="text-[10px] font-bold text-emerald-600">{value}%</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-1.5">
                                    <div
                                        className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full rounded-full transition-all"
                                        style={{ width: `${value}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Recommendations */}
                {type === 'recommendations' && mockReport && (
                    <ul className="space-y-1">
                        {mockReport.recommendations.map((rec, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-[10px] text-gray-600">
                                <CheckCircle2 className="w-3 h-3 text-orange-500 shrink-0" />
                                <span className="line-clamp-1">{rec.title}</span>
                            </li>
                        ))}
                    </ul>
                )}

                {/* Persona */}
                {/* Persona Dropdown */}
                {type === 'persona' && (
                    <div className="relative">
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="w-full flex items-center justify-between bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl p-2.5 transition-all outline-none focus:ring-2 focus:ring-pink-100 focus:border-pink-300 group"
                        >
                            <div className="flex items-center gap-3">
                                {nodeData.selectedPersona ? (
                                    <>
                                        <img src={nodeData.selectedPersona.avatar} className="w-8 h-8 rounded-full object-cover ring-2 ring-white shadow-sm" alt="" />
                                        <div className="text-left">
                                            <div className="text-sm font-semibold text-gray-900 leading-tight">
                                                {nodeData.selectedPersona.name}
                                            </div>
                                            <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
                                                {nodeData.selectedPersona.role}
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <span className="text-sm text-gray-500 font-medium px-1">Select Persona</span>
                                )}
                            </div>
                            <div className={`p-1 rounded-full text-gray-400 group-hover:text-gray-600 transition-colors ${isDropdownOpen ? 'bg-gray-200 rotate-180' : ''}`}>
                                <ArrowDown className="w-4 h-4 transition-transform duration-300" />
                            </div>
                        </button>

                        <AnimatePresence>
                            {isDropdownOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                    transition={{ duration: 0.15, ease: 'easeOut' }}
                                    className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-2xl shadow-gray-200/50 z-50 overflow-hidden divide-y divide-gray-50 ring-1 ring-black/5"
                                >
                                    <div className="max-h-[240px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent nowheel">
                                        {PERSONAS.map((p) => (
                                            <button
                                                key={p.name}
                                                onClick={() => {
                                                    updateData({ selectedPersona: p });
                                                    setIsDropdownOpen(false);
                                                }}
                                                className={`w-full flex items-center gap-3 p-3 transition-colors text-left
                                                    ${nodeData.selectedPersona?.name === p.name ? 'bg-pink-50 text-gray-900 group' : 'hover:bg-gray-50 text-gray-700'}
                                                `}
                                            >
                                                <img src={p.avatar} className={`w-8 h-8 rounded-full object-cover ring-2 ${nodeData.selectedPersona?.name === p.name ? 'ring-pink-200' : 'ring-gray-100'}`} alt="" />
                                                <div>
                                                    <div className={`text-sm font-semibold ${nodeData.selectedPersona?.name === p.name ? 'text-pink-900' : 'text-gray-900'}`}>{p.name}</div>
                                                    <div className={`text-[10px] font-medium ${nodeData.selectedPersona?.name === p.name ? 'text-pink-700' : 'text-gray-500'} uppercase`}>{p.role}</div>
                                                </div>
                                                {nodeData.selectedPersona?.name === p.name && (
                                                    <div className="ml-auto text-pink-500">
                                                        <CheckCircle2 className="w-4 h-4" />
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="p-2 bg-gray-50/50 border-t border-gray-100">
                                        <button className="w-full text-xs font-semibold text-gray-500 hover:text-gray-800 hover:bg-gray-100 py-1.5 rounded-lg transition-colors">
                                            Manage Personas
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Output Handle - Styled as Plus Button */}
            {type !== 'persona' && (
                <Handle
                    type="source"
                    id="source"
                    position={Position.Bottom}
                    isConnectable={!hasOutgoingConnection}
                    style={{
                        width: '32px',
                        height: '32px',
                        background: 'white',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        transform: 'translate(-50%, 50%)',
                        transition: 'all 0.2s',
                        cursor: hasOutgoingConnection ? 'default' : 'crosshair',
                        boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
                        position: 'relative',
                        // Hide visual appearance if connected, but keep in DOM for React Flow
                        opacity: hasOutgoingConnection ? 0 : (isHovered ? 1 : 0),
                        pointerEvents: hasOutgoingConnection ? 'none' : 'auto',
                    }}
                    onMouseEnter={(e) => {
                        if (!hasOutgoingConnection) {
                            e.currentTarget.style.borderColor = '#3b82f6';
                            e.currentTarget.style.boxShadow = '0 4px 6px -1px rgb(0 0 0 / 0.1)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (!hasOutgoingConnection) {
                            e.currentTarget.style.borderColor = '#d1d5db';
                            e.currentTarget.style.boxShadow = '0 1px 2px 0 rgb(0 0 0 / 0.05)';
                        }
                    }}
                >
                    {/* Plus icon using SVG data URI */}
                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            pointerEvents: 'none',
                            color: '#9ca3af',
                        }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                    </div>
                </Handle>
            )}
        </div>
    );
};

const WorkflowBuilderInner = ({ sourceInterview, onClose, onStartSession, allInterviews }) => {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [mockReport] = useState(() => generateMockReport(sourceInterview.jobContext.role));
    const [isExecuting, setIsExecuting] = useState(false);
    const [selectedEdge, setSelectedEdge] = useState(null);
    const [pendingConnection, setPendingConnection] = useState(null);

    // React Flow hook for coordinates
    const { screenToFlowPosition, zoomIn, zoomOut } = useReactFlow();

    // Use refs for tracking drag state to avoid re-renders and closure issues
    const dragStartPos = useRef(null);
    const connectionJustEnded = useRef(false);
    const isConnectingToExistingNode = useRef(false);

    // HUD State
    const [isLocked, setIsLocked] = useState(false);

    // History State
    const [history, setHistory] = useState({ past: [], future: [] });

    // Helper to take a snapshot
    const takeSnapshot = useCallback(() => {
        setHistory(prev => ({
            past: [...prev.past, { nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) }],
            future: []
        }));
    }, [nodes, edges]);

    const onUndo = useCallback(() => {
        setHistory(prev => {
            if (prev.past.length === 0) return prev;

            const newPast = [...prev.past];
            const previousState = newPast.pop();

            setNodes(previousState.nodes);
            setEdges(previousState.edges);

            return {
                past: newPast,
                future: [{ nodes, edges }, ...prev.future]
            };
        });
    }, [nodes, edges, setNodes, setEdges]);

    const onRedo = useCallback(() => {
        setHistory(prev => {
            if (prev.future.length === 0) return prev;

            const newFuture = [...prev.future];
            const nextState = newFuture.shift();

            setNodes(nextState.nodes);
            setEdges(nextState.edges);

            return {
                past: [...prev.past, { nodes, edges }],
                future: newFuture
            };
        });
    }, [nodes, edges, setNodes, setEdges]);

    // Initialize with source node
    React.useEffect(() => {
        setNodes([{
            id: 'source-1',
            type: 'custom',
            position: { x: 250, y: 100 },
            data: {
                type: 'source',
                nodeData: { interview: sourceInterview },
                mockReport,
                onDelete: () => { },
                updateData: () => { },
                hasOutgoingConnection: false,
            },
        }]);
    }, []);

    // Update node data when connections change
    React.useEffect(() => {
        setNodes((nds) =>
            nds.map((node) => ({
                ...node,
                data: {
                    ...node.data,
                    hasOutgoingConnection: edges.some(e => e.source === node.id),
                    hasIncomingConnection: edges.some(e => e.target === node.id),
                },
            }))
        );
    }, [edges]);

    // Keyboard Shortcuts for Zoom
    React.useEffect(() => {
        const handleKeyDown = (e) => {
            // Ignore if typing in an input or textarea
            if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;

            // Zoom In: +, =, NumPad+ (with or without Ctrl/Cmd)
            if ((e.key === '=' || e.key === '+' || e.key === 'Add') && (e.metaKey || e.ctrlKey || true)) {
                e.preventDefault();
                zoomIn();
            }

            // Zoom Out: -, _, NumPad- (with or without Ctrl/Cmd)
            if ((e.key === '-' || e.key === '_' || e.key === 'Subtract') && (e.metaKey || e.ctrlKey || true)) {
                e.preventDefault();
                zoomOut();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [zoomIn, zoomOut]);

    // Handle manual connection (Node-to-Node)
    const onConnect = useCallback((params) => {
        takeSnapshot(); // Snapshot before connecting
        isConnectingToExistingNode.current = true;
        setEdges((eds) => addEdge(params, eds));
    }, [setEdges, takeSnapshot]);

    // Handle connection start - this is called when dragging starts from a handle
    const onConnectStart = useCallback((event, { nodeId, handleId, handleType }) => {
        if (handleType === 'source') {
            // Store start position
            if (event.clientX && event.clientY) {
                dragStartPos.current = { x: event.clientX, y: event.clientY };
            }
            // Capture handleId here!
            setPendingConnection({ sourceNodeId: nodeId, sourceHandleId: handleId });
        }
    }, []);

    // Handle connection end - show context menu when drag is released
    const onConnectEnd = useCallback((event) => {
        // If we just connected to an existing node, DO NOT show the menu
        if (isConnectingToExistingNode.current) {
            isConnectingToExistingNode.current = false;
            return;
        }

        // Set flag to prevent onPaneClick from closing the menu immediately
        connectionJustEnded.current = true;
        setTimeout(() => {
            connectionJustEnded.current = false;
        }, 100);

        setPendingConnection(prev => {
            if (!prev) return null;

            // Use clientX/Y for fixed positioning of the context menu
            const screenX = event.clientX;
            const screenY = event.clientY;

            // Check drag distance - allow even small drags (5px) to be responsive
            if (dragStartPos.current) {
                const dist = Math.hypot(event.clientX - dragStartPos.current.x, event.clientY - dragStartPos.current.y);
                if (dist < 5) return null; // Only ignore tiny micro-movements
            }

            return {
                ...prev,
                screenX,
                screenY,
            };
        });
        dragStartPos.current = null; // Reset start pos
    }, []);

    // Auto Layout Handler
    const onLayout = useCallback((direction) => {
        takeSnapshot(); // Snapshot before layout
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
            nodes,
            edges,
            direction
        );

        setNodes([...layoutedNodes]);
        setEdges([...layoutedEdges]);

        // animate view to fit new layout
        setTimeout(() => {
            window.requestAnimationFrame(() => {
                // We need access to fitView, but we are inside the component.
                // We'll use useReactFlow inside HUD for fitView, but here we just update nodes.
            });
        }, 10);
    }, [nodes, edges, setNodes, setEdges, takeSnapshot]);

    const addNodeFromMenu = useCallback((type) => {
        if (!pendingConnection) return;
        takeSnapshot(); // Snapshot before adding node

        const newNodeId = `${type}-${Date.now()}`;

        // Calculate position based on where the menu was opened (screen coords -> flow coords)
        const position = screenToFlowPosition({
            x: pendingConnection.screenX,
            y: pendingConnection.screenY,
        });

        const newNode = {
            id: newNodeId,
            type: 'custom',
            position,
            data: {
                type,
                nodeData: type === 'persona' ? { selectedPersona: PERSONAS[0] } : {},
                mockReport,
                onDelete: () => deleteNode(newNodeId),
                updateData: (data) => updateNodeData(newNodeId, data),
                hasOutgoingConnection: false,
            },
        };

        // Add node
        setNodes((nds) => [...nds, newNode]);

        // Create connection with glow
        const newEdge = {
            id: `e-${pendingConnection.sourceNodeId}-${newNodeId}`,
            source: pendingConnection.sourceNodeId,
            sourceHandle: pendingConnection.sourceHandleId, // Use the captured handle ID
            target: newNodeId,
            animated: true,
            style: { stroke: '#3b82f6', strokeWidth: 2.5, filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.6))' },
        };
        setEdges((eds) => [...eds, newEdge]);
        setSelectedEdge(newEdge.id);

        setPendingConnection(null);
    }, [pendingConnection, mockReport, nodes]);

    const deleteNode = useCallback((id) => {
        takeSnapshot(); // Snapshot before delete
        setNodes((nds) => nds.filter(n => n.id !== id));
        setEdges((eds) => eds.filter(e => e.source !== id && e.target !== id));
    }, [takeSnapshot]);

    const updateNodeData = useCallback((id, data) => {
        setNodes((nds) =>
            nds.map((node) =>
                node.id === id
                    ? { ...node, data: { ...node.data, nodeData: { ...node.data.nodeData, ...data } } }
                    : node
            )
        );
    }, []);

    // Update edge styles based on selection
    React.useEffect(() => {
        setEdges((eds) =>
            eds.map((edge) => ({
                ...edge,
                animated: edge.id === selectedEdge,
                style: edge.id === selectedEdge
                    ? { stroke: '#3b82f6', strokeWidth: 2.5, filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.6))' }
                    : { stroke: '#9ca3af', strokeWidth: 2 },
            }))
        );
    }, [selectedEdge]);

    const handlePaneClick = useCallback(() => {
        // Prevent clearing if we just ended a connection (race condition fix)
        if (connectionJustEnded.current) return;

        setPendingConnection(null);
        setSelectedEdge(null);
        setShowChecklist(false); // Close checklist when clicking canvas
    }, []);

    // State for History Explorer
    const [showHistory, setShowHistory] = useState(false);

    // Validation
    // Validation (Detailed)
    const validation = useMemo(() => {
        const hasFeedback = nodes.some(n => n.data.type === 'feedback');
        const hasPersona = nodes.some(n => n.data.type === 'persona');
        const sourceNode = nodes.find(n => n.data.type === 'source');

        // Connectivity
        let allConnected = false;
        if (sourceNode) {
            const visited = new Set([sourceNode.id]);
            const queue = [sourceNode.id];
            while (queue.length > 0) {
                const currentId = queue.shift();
                const connectedEdges = edges.filter(e => e.source === currentId);
                for (const edge of connectedEdges) {
                    if (!visited.has(edge.target)) {
                        visited.add(edge.target);
                        queue.push(edge.target);
                    }
                }
            }
            allConnected = visited.size === nodes.length;
        }

        const items = [
            { id: 'source', label: 'Source Context', valid: !!sourceNode, message: 'Source node is the starting point' },
            { id: 'persona', label: 'Target Persona', valid: hasPersona, message: 'Select who you want to practice with' },
            { id: 'feedback', label: 'Feedback Logic', valid: hasFeedback, message: 'Include feedback from previous session' },
            { id: 'connectivity', label: 'Flow Connection', valid: allConnected, message: 'Connect all nodes together' }
        ];

        const firstError = items.find(i => !i.valid);

        return {
            valid: !firstError,
            message: firstError ? firstError.message : '',
            items
        };
    }, [nodes, edges]);

    const [showChecklist, setShowChecklist] = useState(false);

    // Execute workflow
    const handleExecute = async () => {
        if (!validation.valid) return;
        setIsExecuting(true);

        const personaNode = nodes.find(n => n.data.type === 'persona');
        const statsNode = nodes.find(n => n.data.type === 'stats');
        const recsNode = nodes.find(n => n.data.type === 'recommendations');

        const persona = personaNode.data.nodeData.selectedPersona;
        const previousStats = statsNode ? mockReport.stats : null;
        const previousRecommendations = recsNode ? mockReport.recommendations : null;

        const payload = {
            sourceInterview: sourceInterview,
            persona: persona.name,
            personaDescription: persona.description,
            personaStyle: persona.role,
            previousFeedback: mockReport.feedback,
            previousStats,
            previousRecommendations,
        };

        try {
            const res = await fetch('/api/generate-followup-prompt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json();

            if (data.system_prompt) {
                onStartSession({
                    jobContext: sourceInterview.jobContext,
                    resumeContext: sourceInterview.resumeContext,
                    persona,
                    systemPrompt: data.system_prompt,
                    parentId: sourceInterview.id,
                });
            }
        } catch (err) {
            console.error('Workflow Execution Failed', err);
            setIsExecuting(false);
        }
    };

    const nodeTypes = useMemo(() => ({ custom: CustomNode }), []);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
    const [toast, setToast] = useState(null); // { message, type }

    const handleStartClick = () => {
        if (!validation.valid) {
            setToast({ message: validation.message, type: 'error' });
            setTimeout(() => setToast(null), 5000);
            return;
        }
        handleExecute();
    };

    return (
        <div className="fixed inset-0 z-50 bg-gray-100 flex">
            {/* Sidebar Integration */}
            <LeftSidebar
                isCollapsed={isSidebarCollapsed}
                setIsCollapsed={setIsSidebarCollapsed}
                activeTab="spaces" // Highlight 'Spaces' as active
                setActiveTab={(tab) => {
                    if (tab !== 'spaces') onClose(); // Close overlay if navigating away
                }}
            />

            {/* Main Content Area */}
            <div className="flex-1 relative flex flex-col h-full w-full bg-white overflow-hidden shadow-2xl rounded-l-3xl border-l border-gray-200">
                {/* Header */}
                <header className="absolute top-0 left-0 right-0 h-14 border-b border-gray-200 bg-white/90 backdrop-blur-sm px-6 flex items-center justify-between z-20">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowHistory(true)}
                                className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-blue-600 transition-colors flex items-center gap-2 group"
                                title="View Interview History"
                            >
                                <History className="w-5 h-5" />
                                <span className="text-xs font-semibold hidden md:block group-hover:block">History</span>
                            </button>
                            <div className="h-6 w-px bg-gray-200 mx-2 hidden md:block" />
                            <h2 className="text-sm font-semibold text-gray-700 hidden md:block">Follow-up Workflow</h2>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Checklist HUB */}
                        <div className="relative">
                            <button
                                onClick={() => setShowChecklist(!showChecklist)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all text-xs font-medium
                                    ${validation.valid
                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                                        : 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100'
                                    }`}
                            >
                                {validation.valid ? <CheckCircle2 className="w-3.5 h-3.5" /> : <ListChecks className="w-3.5 h-3.5" />}
                                <span>{validation.items.filter(i => i.valid).length}/{validation.items.length} Ready</span>
                                <ChevronDown className={`w-3 h-3 transition-transform ${showChecklist ? 'rotate-180' : ''}`} />
                            </button>

                            <AnimatePresence>
                                {showChecklist && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                        className="absolute top-full left-0 mt-3 w-44 bg-white text-gray-900 rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-[60]"
                                    >
                                        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center">
                                            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Flight Check</span>
                                        </div>
                                        <div className="p-2 space-y-1">
                                            {validation.items.map((item) => (
                                                <div key={item.id} className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${item.valid ? 'text-gray-400' : 'bg-gray-50'}`}>
                                                    {item.valid ? (
                                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                                    ) : (
                                                        <CircleDashed className="w-4 h-4 text-orange-400 shrink-0 animate-pulse" />
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-xs font-medium ${item.valid ? 'text-gray-400 line-through decoration-gray-300' : 'text-gray-700'}`}>
                                                            {item.label}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleStartClick}
                            disabled={isExecuting}
                            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all duration-200
                                ${validation.valid
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-70'
                                }
                            `}
                        >
                            {isExecuting ? 'Starting...' : <> <Play className={`w-4 h-4 ${validation.valid ? 'fill-current' : ''}`} /> Start Session </>}
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </header>

                {/* React Flow Canvas */}
                <div className="absolute inset-0 z-0 pt-14">
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        nodeTypes={nodeTypes}
                        onPaneClick={handlePaneClick}
                        onConnect={onConnect}
                        onConnectStart={onConnectStart}
                        onConnectEnd={onConnectEnd}
                        connectionMode="loose"
                        fitView
                        fitViewOptions={{ padding: 0.2, maxZoom: 0.95 }}
                        proOptions={{ hideAttribution: true }}
                        nodesDraggable={!isLocked}
                        nodesConnectable={!isLocked}
                        elementsSelectable={!isLocked}
                        panOnDrag={true}
                        panOnScroll={true}
                        zoomOnScroll={true}
                        zoomOnPinch={true}
                        onNodeDragStart={() => takeSnapshot()} // Snapshot before drag starts to capture previous position
                    >
                        <Background color="#9ca3af" gap={24} size={1} />
                        <WorkflowHUD
                            isLocked={isLocked}
                            setIsLocked={setIsLocked}
                            onLayout={onLayout}
                            onUndo={onUndo}
                            onRedo={onRedo}
                            canUndo={history.past.length > 0}
                            canRedo={history.future.length > 0}
                        />
                    </ReactFlow>
                </div>

                {/* Context Menu - OUTSIDE ReactFlow for proper rendering */}
                <AnimatePresence>
                    {pendingConnection && pendingConnection.screenX && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            style={{
                                position: 'fixed',
                                left: (pendingConnection.screenX + 250 > window.innerWidth) ? 'auto' : pendingConnection.screenX,
                                right: (pendingConnection.screenX + 250 > window.innerWidth) ? (window.innerWidth - pendingConnection.screenX) : 'auto',
                                top: (pendingConnection.screenY + 300 > window.innerHeight) ? 'auto' : pendingConnection.screenY + 56,
                                bottom: (pendingConnection.screenY + 300 > window.innerHeight) ? (window.innerHeight - pendingConnection.screenY) : 'auto',
                                zIndex: 9999,
                            }}
                            className="bg-white border-2 border-blue-500 rounded-xl shadow-2xl p-2 min-w-[200px]"
                            onClick={(e) => e.stopPropagation()}
                        >


                            <div className="space-y-1">
                                {!nodes.find(n => n.data.type === 'feedback') && (
                                    <button onClick={() => addNodeFromMenu('feedback')} className="w-full text-left px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-lg flex items-center gap-3 transition-colors group">
                                        <div className="p-2 rounded-lg bg-purple-50 group-hover:bg-purple-100 transition-colors text-purple-700"><MessageSquareText className="w-4 h-4" /></div>
                                        <span>Feedback</span>
                                    </button>
                                )}
                                {!nodes.find(n => n.data.type === 'stats') && (
                                    <button onClick={() => addNodeFromMenu('stats')} className="w-full text-left px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-lg flex items-center gap-3 transition-colors group">
                                        <div className="p-2 rounded-lg bg-emerald-50 group-hover:bg-emerald-100 transition-colors text-emerald-700"><BarChart3 className="w-4 h-4" /></div>
                                        <span>Statistics</span>
                                    </button>
                                )}
                                {!nodes.find(n => n.data.type === 'recommendations') && (
                                    <button onClick={() => addNodeFromMenu('recommendations')} className="w-full text-left px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-lg flex items-center gap-3 transition-colors group">
                                        <div className="p-2 rounded-lg bg-amber-50 group-hover:bg-amber-100 transition-colors text-amber-700"><Lightbulb className="w-4 h-4" /></div>
                                        <span>Recommendations</span>
                                    </button>
                                )}
                                {!nodes.find(n => n.data.type === 'persona') && (
                                    <button onClick={() => addNodeFromMenu('persona')} className="w-full text-left px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-lg flex items-center gap-3 transition-colors group">
                                        <div className="p-2 rounded-lg bg-pink-50 group-hover:bg-pink-100 transition-colors text-pink-700"><UserCircle2 className="w-4 h-4" /></div>
                                        <span>Persona</span>
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* History Explorer Overlay */}
                <AnimatePresence>
                    {showHistory && (
                        <div className="fixed inset-0 z-[100] bg-black/20 backdrop-blur-sm">
                            <HistoryExplorer
                                currentSessionId={sourceInterview.id}
                                onClose={() => setShowHistory(false)}
                                allInterviews={allInterviews}
                            />
                        </div>
                    )}
                </AnimatePresence>

                {/* Floating Toast Notification */}
                <AnimatePresence>
                    {toast && (
                        <motion.div
                            initial={{ opacity: 0, y: -20, x: 20 }}
                            animate={{ opacity: 1, y: 0, x: 0 }}
                            exit={{ opacity: 0, y: -20, x: 20 }}
                            className="absolute top-20 right-8 z-[9999] bg-[#1e1e1e] text-white p-4 rounded-xl shadow-2xl border border-gray-800 flex items-start gap-3 min-w-[300px]"
                        >
                            <div className="p-2 bg-red-500/10 rounded-lg">
                                <AlertCircle className="w-5 h-5 text-red-500" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-sm text-red-100">Action Required</h4>
                                <p className="text-xs text-gray-400 mt-1 leading-relaxed">{toast.message}</p>
                            </div>
                            <button onClick={() => setToast(null)} className="text-gray-500 hover:text-white transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

// Wrapper component with ReactFlowProvider
const WorkflowBuilder = (props) => {
    return (
        <ReactFlowProvider>
            <WorkflowBuilderInner {...props} />
        </ReactFlowProvider>
    );
};

export default WorkflowBuilder;
