import * as React from 'react';
import PropTypes from 'prop-types';
import { DataGrid } from '@mui/x-data-grid';
import { Autocomplete, Box, TextField } from '@mui/material';
import NoData from '../NoData';
import TextFieldLabel from '../Label';

export default function DataGridTable(props) {
  const {
    placeholder,
    columns = [],
    rows = [],
    showSearch = false,
    searchLabel = 'Search...',
    searchKey1,
    searchKey2,
    pageSize = 10,
    onSearchChange = null,
    getRowId,
    tableHeight = 350,
  } = props;

  const [selectedRow, setSelectedRow] = React.useState(null);

  const handleSearchChange = (event, newValue) => {
    setSelectedRow(newValue);
    if (onSearchChange) onSearchChange(newValue);
  };

  const filteredRows = selectedRow ? [selectedRow] : rows;

  return (
    <Box
      sx={{
        // width: '100%',
        minHeight: tableHeight,
        borderRadius: 2,
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
        overflow: 'hidden',
        bgcolor: 'background.paper',
        p: 2, // padding around table
      }}
    >
      {showSearch && (
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-start', flexDirection: 'column' }}>
          <TextFieldLabel label={searchLabel} />
          <Autocomplete
            size="small"
            disablePortal
            options={rows}
            getOptionLabel={(option) => {
              if (!option) return '';
              const val1 = option[searchKey1] ?? '';
              const val2 = option[searchKey2] ?? '';
              return searchKey2 ? `${val1} (${val2})` : `${val1}`;
            }}
            isOptionEqualToValue={(option, value) => getRowId(option) === getRowId(value)}
            onChange={handleSearchChange}
            sx={{
              width: 320,
            }}
            renderInput={(params) => <TextField {...params} size="small" placeholder={placeholder} />}
          />
        </Box>
      )}

      <DataGrid
        {...props}
        rows={filteredRows}
        columns={columns}
        initialState={{
          pagination: { paginationModel: { pageSize: pageSize } },
        }}
        pageSizeOptions={[pageSize]}
        disableColumnMenu
        disableRowSelectionOnClick
        getRowId={getRowId}
        hideFooter={filteredRows?.length < 1}
        sx={{
          border: '1px solid #cbd5e1',
          borderRadius: 2,
          fontFamily: "'Inter', sans-serif",
          minHeight: tableHeight,
          '& .MuiDataGrid-columnHeaders, & .MuiDataGrid-columnHeader, & .MuiDataGrid-columnHeaderRow': {
            background: 'linear-gradient(135deg, #0a2342 0%, #0d3b6e 100%) !important',
            backgroundColor: '#0a2342 !important',
            color: '#ffffff !important',
            borderBottom: '2px solid #071830',
          },
          '& .MuiDataGrid-columnHeaderTitle': {
            color: '#ffffff !important',
            fontWeight: 700,
            fontSize: '12px',
            letterSpacing: '0.4px',
            textTransform: 'uppercase',
          },
          '& .MuiDataGrid-sortIcon, & .MuiDataGrid-menuIconButton, & .MuiDataGrid-iconButtonContainer': {
            color: '#ffffff !important',
          },
          '& .MuiDataGrid-row': {
            borderRadius: 1,
            transition: 'all 0.2s ease',
            '&:hover': {
              bgcolor: '#f1f5f9',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            },
          },
          '& .MuiDataGrid-row:nth-of-type(odd)': {
            bgcolor: '#f8fafc',
          },
          '& .MuiDataGrid-cell': {
            fontSize: 12,
            fontWeight: 500,
            color: '#1e293b',
          },
          '& .MuiDataGrid-footerContainer': {
            borderTop: '1px solid #cbd5e1',
            bgcolor: '#f8fafc',
          },
          '& .MuiDataGrid-virtualScroller': {
            scrollbarWidth: 'thin',
            scrollbarColor: '#c1c1c1 transparent',
          },
        }}
        slots={{
          noRowsOverlay: () => (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              <NoData />
            </Box>
          ),
        }}
      />
    </Box>
  );
}

DataGridTable.propTypes = {
  columns: PropTypes.array.isRequired,
  rows: PropTypes.array.isRequired,
  showSearch: PropTypes.bool,
  searchLabel: PropTypes.string,
  searchKey1: PropTypes.string,
  searchKey2: PropTypes.string,
  pageSize: PropTypes.number,
  onSearchChange: PropTypes.func,
  getRowId: PropTypes.func,
  tableHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};
