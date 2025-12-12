/**
 * State management hook for the node graph
 */

import { useReducer, useCallback } from 'react';
import type { Node, Connection, CanvasState } from '../types/nodeGraph';
import { createNode } from '../utils/nodeFactory';

// Action types
type NodeGraphAction =
  | { type: 'ADD_NODE'; payload: { nodeType: Node['type']; x?: number; y?: number } }
  | { type: 'REMOVE_NODE'; payload: { nodeId: string } }
  | { type: 'UPDATE_NODE'; payload: { nodeId: string; updates: Partial<Node> } }
  | { type: 'MOVE_NODE'; payload: { nodeId: string; x: number; y: number } }
  | { type: 'ADD_CONNECTION'; payload: Connection }
  | { type: 'REMOVE_CONNECTION'; payload: { connectionId: string } }
  | { type: 'SELECT_NODE'; payload: { nodeId: string | null } }
  | { type: 'START_DRAG'; payload: { nodeId: string } }
  | { type: 'END_DRAG' }
  | { type: 'START_CONNECTING'; payload: { nodeId: string; pointId: string } }
  | { type: 'END_CONNECTING' }
  | { type: 'SET_ZOOM'; payload: { zoom: number } }
  | { type: 'SET_PAN'; payload: { panX: number; panY: number } }
  | { type: 'RESET_VIEW' }
  | { type: 'LOAD_STATE'; payload: CanvasState };

// Initial state
const initialState: CanvasState = {
  nodes: [],
  connections: [],
  selectedNodeId: null,
  draggingNodeId: null,
  connectingFrom: null,
  zoom: 1.0,
  panX: 0,
  panY: 0,
};

// Reducer function
const nodeGraphReducer = (state: CanvasState, action: NodeGraphAction): CanvasState => {
  switch (action.type) {
    case 'ADD_NODE': {
      const { nodeType, x, y } = action.payload;
      const newNode = createNode(nodeType, x, y);
      return {
        ...state,
        nodes: [...state.nodes, newNode],
      };
    }

    case 'REMOVE_NODE': {
      const { nodeId } = action.payload;
      return {
        ...state,
        nodes: state.nodes.filter(node => node.id !== nodeId),
        connections: state.connections.filter(
          conn => conn.from !== nodeId && conn.to !== nodeId
        ),
        selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
      };
    }

    case 'UPDATE_NODE': {
      const { nodeId, updates } = action.payload;
      return {
        ...state,
        nodes: state.nodes.map(node =>
          node.id === nodeId ? { ...node, ...updates } : node
        ),
      };
    }

    case 'MOVE_NODE': {
      const { nodeId, x, y } = action.payload;
      return {
        ...state,
        nodes: state.nodes.map(node =>
          node.id === nodeId ? { ...node, x, y } : node
        ),
      };
    }

    case 'ADD_CONNECTION': {
      return {
        ...state,
        connections: [...state.connections, action.payload],
      };
    }

    case 'REMOVE_CONNECTION': {
      const { connectionId } = action.payload;
      return {
        ...state,
        connections: state.connections.filter(conn => conn.id !== connectionId),
      };
    }

    case 'SELECT_NODE': {
      return {
        ...state,
        selectedNodeId: action.payload.nodeId,
      };
    }

    case 'START_DRAG': {
      return {
        ...state,
        draggingNodeId: action.payload.nodeId,
      };
    }

    case 'END_DRAG': {
      return {
        ...state,
        draggingNodeId: null,
      };
    }

    case 'START_CONNECTING': {
      return {
        ...state,
        connectingFrom: action.payload,
      };
    }

    case 'END_CONNECTING': {
      return {
        ...state,
        connectingFrom: null,
      };
    }

    case 'SET_ZOOM': {
      return {
        ...state,
        zoom: action.payload.zoom,
      };
    }

    case 'SET_PAN': {
      return {
        ...state,
        panX: action.payload.panX,
        panY: action.payload.panY,
      };
    }

    case 'RESET_VIEW': {
      return {
        ...state,
        zoom: 1.0,
        panX: 0,
        panY: 0,
      };
    }

    case 'LOAD_STATE': {
      return action.payload;
    }

    default:
      return state;
  }
};

/**
 * Hook for managing node graph state
 */
export const useNodeGraph = (initialStateOverride?: Partial<CanvasState>) => {
  const [state, dispatch] = useReducer(
    nodeGraphReducer,
    { ...initialState, ...initialStateOverride }
  );

  // Action creators
  const addNode = useCallback((nodeType: Node['type'], x?: number, y?: number) => {
    dispatch({ type: 'ADD_NODE', payload: { nodeType, x, y } });
  }, []);

  const removeNode = useCallback((nodeId: string) => {
    dispatch({ type: 'REMOVE_NODE', payload: { nodeId } });
  }, []);

  const updateNode = useCallback((nodeId: string, updates: Partial<Node>) => {
    dispatch({ type: 'UPDATE_NODE', payload: { nodeId, updates } });
  }, []);

  const moveNode = useCallback((nodeId: string, x: number, y: number) => {
    dispatch({ type: 'MOVE_NODE', payload: { nodeId, x, y } });
  }, []);

  const addConnection = useCallback((connection: Connection) => {
    dispatch({ type: 'ADD_CONNECTION', payload: connection });
  }, []);

  const removeConnection = useCallback((connectionId: string) => {
    dispatch({ type: 'REMOVE_CONNECTION', payload: { connectionId } });
  }, []);

  const selectNode = useCallback((nodeId: string | null) => {
    dispatch({ type: 'SELECT_NODE', payload: { nodeId } });
  }, []);

  const startDrag = useCallback((nodeId: string) => {
    dispatch({ type: 'START_DRAG', payload: { nodeId } });
  }, []);

  const endDrag = useCallback(() => {
    dispatch({ type: 'END_DRAG' });
  }, []);

  const startConnecting = useCallback((nodeId: string, pointId: string) => {
    dispatch({ type: 'START_CONNECTING', payload: { nodeId, pointId } });
  }, []);

  const endConnecting = useCallback(() => {
    dispatch({ type: 'END_CONNECTING' });
  }, []);

  const setZoom = useCallback((zoom: number) => {
    dispatch({ type: 'SET_ZOOM', payload: { zoom } });
  }, []);

  const setPan = useCallback((panX: number, panY: number) => {
    dispatch({ type: 'SET_PAN', payload: { panX, panY } });
  }, []);

  const resetView = useCallback(() => {
    dispatch({ type: 'RESET_VIEW' });
  }, []);

  const loadState = useCallback((newState: CanvasState) => {
    dispatch({ type: 'LOAD_STATE', payload: newState });
  }, []);

  return {
    state,
    actions: {
      addNode,
      removeNode,
      updateNode,
      moveNode,
      addConnection,
      removeConnection,
      selectNode,
      startDrag,
      endDrag,
      startConnecting,
      endConnecting,
      setZoom,
      setPan,
      resetView,
      loadState,
    },
  };
};
