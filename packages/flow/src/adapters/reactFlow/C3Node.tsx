import { memo } from 'react';
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import type { CanvasNode } from '../../canvas/port';

export type C3FlowNode = Node<{ node: CanvasNode }, 'c3'>;

const HANDLE = 12;

/** Nó do React Flow: o cartão vem pronto do editor; aqui só entram a entrada (esquerda) e as saídas (direita). */
function C3Node({ data, isConnectable }: NodeProps<C3FlowNode>) {
  const { node } = data;
  const outputs = node.outputs;
  return (
    <Box sx={{ position: 'relative' }}>
      {node.hasInput && <Handle type="target" position={Position.Left} isConnectable={isConnectable} className="c3-flow-handle" />}
      {node.content}
      {outputs.map((port, i) => {
        const top = `${((i + 1) * 100) / (outputs.length + 1)}%`;
        return (
          <Box key={port.id}>
            <Handle
              id={port.id}
              type="source"
              position={Position.Right}
              isConnectable={isConnectable}
              className="c3-flow-handle"
              style={{ top }}
            />
            {port.label && (
              <Typography
                component="span"
                variant="caption"
                aria-hidden
                sx={{
                  position: 'absolute',
                  top,
                  left: `calc(100% + ${HANDLE}px)`,
                  transform: 'translateY(-50%)',
                  px: 0.5,
                  borderRadius: 0.5,
                  lineHeight: 1.4,
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                  color: 'text.secondary',
                  bgcolor: 'background.default'
                }}
              >
                {port.label}
              </Typography>
            )}
          </Box>
        );
      })}
    </Box>
  );
}

export default memo(C3Node);
