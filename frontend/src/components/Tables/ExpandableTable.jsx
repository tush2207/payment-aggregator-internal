import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  KeyboardArrowDown,
  KeyboardArrowUp,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import {
  Box,
  Collapse,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Typography
} from '@mui/material';
import PropTypes from 'prop-types';
import React, { useState } from 'react';

// Sorting helpers
function descendingComparator(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) return -1;
  if (b[orderBy] > a[orderBy]) return 1;
  return 0;
}
function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}
function stableSort(array, comparator) {
  const stabilized = array?.map((el, index) => [el, index]);
  stabilized?.sort((a, b) => {
    const cmp = comparator(a[0], b[0]);
    if (cmp !== 0) return cmp;
    return a[1] - b[1];
  });
  return stabilized?.map((el) => el[0]);
}

export default function ExpandableTable({
  columns = [],
  rows = [],
  getRowId,
  renderNestedRow,
  onEdit,
  onDelete,
  onView,
  showActionCol = true,
  nestedRowWidth = '100%',
  actionElement,
  style,
}) {
  const [expandedId, setExpandedId] = useState(null);
  const [order, setOrder] = useState('asc');
  const initialOrderBy = columns[0]?.field
  const [orderBy, setOrderBy] = useState('');

  const handleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortedRows = stableSort(rows, getComparator(order, orderBy));

  return (
    <TableContainer component={Paper} sx={{
      margin: '24px 0px',
    }}>
      <Table size="small" padding='normal'>
        <TableHead style={{
          backgroundColor: '#bfd9f1'
        }}>
          <TableRow>
            <TableCell
              sx={{
                width: '5%',
                padding: '8px',
              }}
            >
              Sr No.
            </TableCell>

            {columns?.map((col) => (
              <TableCell
                sx={{
                  width: col.width || 'auto',
                  minWidth: col.minWidth || 'auto',
                  padding: '8px',
                }}
                key={col.field}
                sortDirection={orderBy === col.field ? order : false}
                align={col.align || 'left'}
              >
                <TableSortLabel
                  active={orderBy === col.field}
                  direction={orderBy === col.field ? order : 'asc'}
                  onClick={() => handleRequestSort(col.field)}
                  sx={{ fontWeight: '500', fontSize: '15px' }}
                >
                  {col.headerName}
                </TableSortLabel>
              </TableCell>
            ))}
            {showActionCol && (
              <TableCell
                sx={{
                  padding: '8px',
                  width: '5%',
                }}
              >
                Actions
              </TableCell>
            )}
          </TableRow>

        </TableHead>

        <TableBody>
          {sortedRows?.map((row, index) => {
            const rowId = getRowId(row);
            return (
              <React.Fragment key={rowId}>
                <TableRow sx={{ cursor: 'pointer' }} onClick={() => handleExpand(rowId)}>

                  {/* Serial Number */}
                  <TableCell>{index + 1}</TableCell>

                  {/* Actual Data Columns */}
                  {columns?.map((col) => (
                    <TableCell key={col.field}>
                      {col.renderCell
                        ? col.renderCell({ row, value: row[col.field], field: col.field })
                        : row[col.field]}
                    </TableCell>
                  ))}

                  {/* Actions */}
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      {onView && (
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            onView?.(row);
                          }}
                          color="info"
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      )}
                      {onEdit && (
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit?.(row);
                          }}
                          color="primary"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      )}
                      {onDelete && (
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete?.(row);
                          }}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                      {typeof actionElement === 'function'
                        ? actionElement(row, rowId)
                        : actionElement}
                      {renderNestedRow && (
                        <IconButton
                          size="small"
                          onClick={() => handleExpand(rowId)}
                        >
                          {expandedId === rowId ? (
                            <KeyboardArrowUp />
                          ) : (
                            <KeyboardArrowDown />
                          )}
                        </IconButton>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>

                {/* Nested Row */}
                <TableRow>
                  <TableCell colSpan={columns.length + 2} sx={{ padding: 0 }}>
                    <Collapse in={expandedId === rowId} timeout="auto" unmountOnExit>
                      <Box
                        sx={{
                          padding: 2,
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        {renderNestedRow ? (
                          <Box
                            width={nestedRowWidth}
                            sx={{
                              backgroundColor: 'white',
                            }}
                          >
                            {renderNestedRow(row)}
                          </Box>
                        ) : (
                          <Typography align="center" width="100%">
                            No nested content
                          </Typography>
                        )}
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            );
          })}

        </TableBody>
      </Table>
    </TableContainer >
  );
}

ExpandableTable.propTypes = {
  columns: PropTypes.array.isRequired,
  rows: PropTypes.array.isRequired,
  getRowId: PropTypes.func.isRequired,
  renderNestedRow: PropTypes.func,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onView: PropTypes.func,
};


