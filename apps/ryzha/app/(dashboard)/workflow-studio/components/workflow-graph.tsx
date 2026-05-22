"use client"

import { useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const initialNodes = [
  { id: "r2r", position: { x: 100, y: 150 }, data: { label: "R2R (Record to Report)" }, type: "input", style: { background: '#bfdbfe', color: '#1e3a8a', border: '1px solid #60a5fa' } },
  { id: "om", position: { x: 350, y: 150 }, data: { label: "O&M (Order & Matching)" }, style: { background: '#fed7aa', color: '#7c2d12', border: '1px solid #fb923c' } },
  { id: "auditor", position: { x: 600, y: 150 }, data: { label: "Auditor" }, style: { background: '#bbf7d0', color: '#14532d', border: '1px solid #4ade80' } },
  { id: "fpna", position: { x: 850, y: 150 }, data: { label: "FP&A (Planning)" }, type: "output", style: { background: '#e9d5ff', color: '#581c87', border: '1px solid #c084fc' } },
  { id: "p2p", position: { x: 100, y: 50 }, data: { label: "P2P Workflow" }, type: "input", style: { background: '#e5e7eb', color: '#1f2937', border: '1px solid #9ca3af' } },
  { id: "o2c", position: { x: 100, y: 250 }, data: { label: "O2C Workflow" }, type: "input", style: { background: '#e5e7eb', color: '#1f2937', border: '1px solid #9ca3af' } },
];

const initialEdges = [
  { id: "e-r2r-om", source: "r2r", target: "om", animated: true },
  { id: "e-om-auditor", source: "om", target: "auditor", animated: true },
  { id: "e-auditor-fpna", source: "auditor", target: "fpna", animated: true },
  { id: "e-p2p-r2r", source: "p2p", target: "r2r", type: "step", style: { stroke: '#9ca3af', strokeDasharray: '5,5' } },
  { id: "e-o2c-r2r", source: "o2c", target: "r2r", type: "step", style: { stroke: '#9ca3af', strokeDasharray: '5,5' } },
];

export function WorkflowGraph() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div className="w-full h-[600px] border rounded-lg overflow-hidden bg-background">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
      >
        <Controls />
        <MiniMap />
        <Background gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}
