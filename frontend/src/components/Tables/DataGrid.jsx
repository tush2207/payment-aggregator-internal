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
        minHeight: tableHeight,
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        bgcolor: 'background.paper',
        p: 0,
      }}
    >
      {showSearch && (
        <Box sx={{ p: 2, pb: 1, display: 'flex', justifyContent: 'flex-start', flexDirection: 'column' }}>
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
          border: 'none',
          borderRadius: 0,
          fontFamily: "'Inter', sans-serif",
          minHeight: tableHeight,
          '& .MuiDataGrid-topContainer, & .MuiDataGrid-columnHeaders, & .MuiDataGrid-columnHeader, & .MuiDataGrid-columnHeaderRow, & .MuiDataGrid-columnHeadersInner': {
            background: 'linear-gradient(90deg, #0E4F8D 0%, #176FC1 50%, #0E4F8D 100%) !important',
            backgroundColor: '#176FC1 !important',
            color: '#ffffff !important',
            borderBottom: 'none !important',
            borderRight: 'none !important',
            borderLeft: 'none !important',
            outline: 'none !important',
            '&:focus, &:focus-within': {
              outline: 'none !important',
            },
          },
          '& .MuiDataGrid-columnHeaderTitle': {
            color: '#ffffff !important',
            fontWeight: '700 !important',
            fontSize: '12px !important',
            letterSpacing: '0.4px',
            textTransform: 'uppercase',
          },
          '& .MuiDataGrid-columnHeaderTitleContainer': {
            color: '#ffffff !important',
          },
          '& .MuiDataGrid-columnSeparator': {
            display: 'none !important',
          },
          '& .MuiDataGrid-sortIcon, & .MuiDataGrid-menuIconButton, & .MuiDataGrid-iconButtonContainer, & .MuiDataGrid-iconButtonContainer *': {
            color: '#ffffff !important',
            fill: '#ffffff !important',
          },
          '& .MuiDataGrid-row': {
            transition: 'all 0.2s ease',
            '&:hover': {
              bgcolor: '#f8fafc !important',
            },
          },
          '& .MuiDataGrid-cell': {
            fontSize: 13,
            fontWeight: 500,
            color: '#334155',
            borderBottom: '1px solid #f1f5f9',
            borderRight: 'none !important',
            borderLeft: 'none !important',
            '&:focus, &:focus-within': {
              outline: 'none !important',
            },
          },
          '& .MuiDataGrid-footerContainer': {
            borderTop: '1px solid #e2e8f0',
            bgcolor: '#ffffff',
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
