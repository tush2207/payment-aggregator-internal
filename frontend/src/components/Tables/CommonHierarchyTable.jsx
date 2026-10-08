import React, { memo } from 'react';
import {
  Box,
  Table,
  TableBody,
  TablePagination,
  TextField,
  ButtonGroup,
  Button,
  Stack,
  Typography,
} from '@mui/material';
import { SearchRounded } from '@mui/icons-material';
import { CommonAppTable, CommonTableHeader, CommonTableEmptyState } from '&src/components/Tables/common';
import { useHierarchyTable } from '&src/hooks/useHierarchyTable';
import HierarchyTableRow from './HierarchyTableRow';

const HIERARCHY_COLUMNS = [
  { label: '', width: 45 },
  { label: 'Rank', width: 50 },
  { label: 'Name / Office Scope', minWidth: 200 },
  { label: 'Officer / Employee', width: 160 },
  { label: 'Status', align: 'center', width: 110 },
  { label: 'Target', align: 'right', width: 110 },
  { label: 'Achieved', align: 'right', width: 110 },
  { label: 'Pending', align: 'right', width: 110 },
  { label: 'Achievement %', width: 140 },
];

/**
 * Common Hierarchy Performance Table Component.
 * Strict < 200 lines, theme-driven, consumes useHierarchyTable and common tables.
 */
export const CommonHierarchyTable = memo(({
  data = [],
  groupLevel = 'zone',
}) => {
  const {
    page,
    setPage,
    rowsPerPage,
    setRowsPerPage,
    searchTerm,
    setSearchTerm,
    viewMode,
    setViewMode,
    expandedRows,
    toggleRow,
    filteredData,
    paginatedData,
  } = useHierarchyTable({ data, groupLevel });

  return (
    <Box sx={{ width: '100%' }}>
      {/* ── Toolbar: Search & View Mode Switcher ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
        <TextField
          size="small"
          placeholder="Search by zone, region, branch, or officer..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(0);
          }}
          InputProps={{
            startAdornment: <SearchRounded sx={{ color: '#94a3b8', fontSize: 18, mr: 0.5 }} />,
          }}
          sx={{ width: { xs: '100%', sm: 320 }, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
        />

        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="caption" fontWeight={700} color="text.secondary">
            View Unit:
          </Typography>
          <ButtonGroup size="small">
            <Button
              variant={viewMode === 'value' ? 'contained' : 'outlined'}
              onClick={() => setViewMode('value')}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              Value (₹)
            </Button>
            <Button
              variant={viewMode === 'percent' ? 'contained' : 'outlined'}
              onClick={() => setViewMode('percent')}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              Percentage (%)
            </Button>
          </ButtonGroup>
        </Stack>
      </Box>

      {/* ── Main Data Table ── */}
      <CommonAppTable>
        <Table size="small" sx={{ minWidth: 950, borderCollapse: 'collapse' }}>
          <CommonTableHeader columns={HIERARCHY_COLUMNS} />

          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((item) => (
                <HierarchyTableRow
                  key={item.id}
                  item={item}
                  level={groupLevel}
                  viewMode={viewMode}
                  expanded={expandedRows.has(item.id)}
                  onToggle={toggleRow}
                />
              ))
            ) : (
              <CommonTableEmptyState
                colSpan={HIERARCHY_COLUMNS.length}
                message="No hierarchy data matching criteria"
              />
            )}
          </TableBody>
        </Table>
      </CommonAppTable>

      {/* ── Pagination ── */}
      <TablePagination
        component="div"
        count={filteredData.length}
        page={page}
        onPageChange={(e, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={[10, 25, 50]}
      />
    </Box>
  );
});

export default CommonHierarchyTable;