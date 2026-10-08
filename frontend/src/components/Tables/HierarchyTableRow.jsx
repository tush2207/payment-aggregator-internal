import React, { Fragment } from 'react';
import {
  TableRow,
  TableCell,
  IconButton,
  Typography,
  Chip,
  Box,
  Collapse,
  LinearProgress,
} from '@mui/material';
import {
  KeyboardArrowDownRounded,
  KeyboardArrowUpRounded,
} from '@mui/icons-material';
import { formatStat, getPercent, getStatus } from '&src/hooks/useHierarchyTable';

export const HierarchyTableRow = ({
  item,
  level = 'zone',
  viewMode = 'value',
  expanded = false,
  onToggle,
}) => {
  const hasChildren = level === 'zone' ? (item.regions?.length > 0) : level === 'region' ? (item.branches?.length > 0) : false;
  const pct = item.percentage ?? getPercent(item.totalAchieved, item.totalTarget);
  const statusInfo = getStatus(pct, item.status);

  return (
    <Fragment>
      <TableRow
        hover
        sx={(theme) => ({
          bgcolor: level === 'zone' ? '#ffffff' : level === 'region' ? '#f8fafc' : '#f1f5f9',
          borderLeft: level === 'zone' ? '4px solid #CE0F3E' : level === 'region' ? '4px solid #176FC1' : '4px solid #2e7d32',
        })}
      >
        <TableCell sx={{ width: 45, py: 0.8, pl: level === 'region' ? 3 : level === 'branch' ? 5 : 1 }}>
          {hasChildren && (
            <IconButton size="small" onClick={() => onToggle(item.id)}>
              {expanded ? <KeyboardArrowUpRounded fontSize="small" /> : <KeyboardArrowDownRounded fontSize="small" />}
            </IconButton>
          )}
        </TableCell>

        <TableCell sx={{ width: 50, fontWeight: 700, fontSize: '11.5px', color: 'text.secondary' }}>
          {item.rank ? `#${item.rank}` : '—'}
        </TableCell>

        <TableCell sx={{ fontWeight: level === 'zone' ? 800 : 700, fontSize: '12px' }}>
          <Typography variant="body2" fontWeight={level === 'zone' ? 800 : 700} color={level === 'zone' ? 'secondary.main' : level === 'region' ? 'primary.main' : 'text.primary'}>
            {item.name}
          </Typography>
        </TableCell>

        <TableCell sx={{ fontSize: '12px', color: 'text.secondary' }}>
          {item.dapEmployeeName || '—'}
        </TableCell>

        <TableCell align="center">
          <Chip
            label={statusInfo.label}
            size="small"
            sx={{
              height: 20,
              fontSize: '10.5px',
              fontWeight: 700,
              bgcolor: statusInfo.bg,
              color: statusInfo.color,
            }}
          />
        </TableCell>

        <TableCell align="right" sx={{ fontWeight: 600, fontSize: '12px' }}>
          {formatStat(item.totalTarget, 100, viewMode)}
        </TableCell>

        <TableCell align="right" sx={{ fontWeight: 700, fontSize: '12px', color: '#15803d' }}>
          {formatStat(item.totalAchieved, pct, viewMode)}
        </TableCell>

        <TableCell align="right" sx={{ fontWeight: 600, fontSize: '12px', color: '#b45309' }}>
          {formatStat(item.targetPending, Math.max(0, 100 - pct), viewMode)}
        </TableCell>

        <TableCell sx={{ width: 140 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: '100%', mr: 1 }}>
              <LinearProgress
                variant="determinate"
                value={Math.min(100, pct)}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: '#e2e8f0',
                  '& .MuiLinearProgress-bar': { bgcolor: statusInfo.color },
                }}
              />
            </Box>
            <Typography variant="caption" fontWeight={700} sx={{ minWidth: 32, fontSize: '11px' }}>
              {pct}%
            </Typography>
          </Box>
        </TableCell>
      </TableRow>

      {/* Render Sub-Level Children */}
      {hasChildren && (
        <TableRow>
          <TableCell colSpan={9} sx={{ p: 0, borderBottom: 'none' }}>
            <Collapse in={expanded} timeout="auto" unmountOnExit>
              {level === 'zone' &&
                item.regions.map((reg) => (
                  <HierarchyTableRow
                    key={reg.id}
                    item={reg}
                    level="region"
                    viewMode={viewMode}
                    expanded={false}
                    onToggle={() => {}}
                  />
                ))}
            </Collapse>
          </TableCell>
        </TableRow>
      )}
    </Fragment>
  );
};

export default HierarchyTableRow;
