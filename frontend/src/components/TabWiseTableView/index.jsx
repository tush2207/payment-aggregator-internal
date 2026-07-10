import { Tabs, Tab, Box } from '@mui/material';
import { useState, useMemo } from 'react';
import DataGridTable from '../Tables/DataGrid';


const TabWiseTableView = ({ rows, columns }) => {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // 🧠 Deduplicate based on `merchantAccountNo`
  const getDuplicates = (data) => {
    const seen = new Set();
    const duplicates = [];

    data.forEach((row) => {
      if (seen.has(row.merchantAccountNo)) {
        duplicates.push(row);
      } else {
        seen.add(row.merchantAccountNo);
      }
    });

    return duplicates;
  };

  // 🗂️ Filter rows based on selected tab
  const filteredRows = useMemo(() => {
    switch (activeTab) {
      case 0: return rows; // All
      case 1: return getDuplicates(rows); // Duplicate
      case 2: return rows.filter(row => !row.hasError); // Valid
      case 3: return rows.filter(row => row.hasError); // Invalid
      default: return rows;
    }
  }, [activeTab, rows]);

  return (
    <Box>
      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }}>
        <Tab label={`All (${rows.length})`} />
        <Tab label={`Duplicate (${getDuplicates(rows).length})`} />
        <Tab label={`Valid (${rows.filter(r => !r.hasError).length})`} />
        <Tab label={`Invalid (${rows.filter(r => r.hasError).length})`} />
      </Tabs>

      <Box>
        <DataGridTable
          rows={filteredRows}
          columns={columns}
          checkboxSelection
          disableRowSelectionOnClick
        />
      </Box>
    </Box>
  );
};

export default TabWiseTableView;
