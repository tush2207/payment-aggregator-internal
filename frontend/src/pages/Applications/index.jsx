import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Tab,
  Tabs,
  Paper,
  Button,
  Chip,
  alpha,
  useTheme,
} from '@mui/material';
import {
  AssignmentRounded,
  AccountBalanceWalletRounded,
  PersonRounded,
  Add,
  FileDownloadRounded,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';

import { ApplicationFlowTable, ApplicationFlowDialog } from '&src/components/ApplicationFlow';
import SectionHeader from '&src/components/Headers/SectionHeader';
import DialogWithHeader from '&src/components/Dialog/DialogWithHeader';
import ApplicationForm from '&src/modules/PaymentAggregator/ApplicationForm';
import FullScreenLoader from '&src/components/Loaders/FullScreenLoader';
import useStatusWiseAlert from '&src/components/ToastNotifications/useStatusWiseAlert';
import useAggregatorDetails from '&src/hooks/useAggregatorDetails';
import applicationServices from '&src/services/applications';
import { selectUserRole, selectDialogOpen } from '&src/store/applicationFlowSlice';
import AggregatorApplicationsTable from './AggregatorApplicationsTable';

const getCurrentFinancialYear = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  if (month >= 3) {
    return `FY ${year}-${(year + 1).toString().slice(2)}`;
  } else {
    return `FY ${year - 1}-${year.toString().slice(2)}`;
  }
};

export default function Applications() {
  const theme = useTheme();
  const [currentTab, setCurrentTab] = useState(0);
  const [mockApp, setMockApp] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [isReview, setIsReview] = useState(false);
  const [applicationData, setApplicationData] = useState(null);

  const [filters, setFilters] = useState({
    financialYear: 'all',
    selectedMonth: 'all',
    startDate: '',
    endDate: '',
    search: '',
    page: 1,
    rowsPerPage: 10,
  });

  const [totalRecords, setTotalRecords] = useState(0);

  const { successNotification, errorNotification } = useStatusWiseAlert();
  const userRole = useSelector(selectUserRole) || sessionStorage.getItem('role') || 'BO';
  const isBO = userRole === 'BO';

  const { aggregatorDetails, fetchAllAggregators } = useAggregatorDetails();

  const userDetails = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem('userDetails') || '{}');
    } catch {
      return {};
    }
  }, []);

  const dialogOpen = useSelector(selectDialogOpen);

  const fetchApplicationsData = useCallback(async () => {
    setLoading(true);
    try {
      let filterby = '00000';
      let reqBranchId = undefined;
      let reqRegionId = undefined;

      if (userRole === 'BO') {
        reqBranchId = userDetails.branchId;
      } else if (userRole === 'RO') {
        reqRegionId = userDetails.regionId;
      } else if (userRole === 'ZO') {
        filterby = userDetails.zoneId || '00000';
      }

      const response = await applicationServices.getAllApplications({
        zoneId: filterby,
        page: filters.page,
        pageSize: filters.rowsPerPage,
        search: filters.search,
        status: 'all',
        createdAt: '',
        financialYear: filters.financialYear,
        month: filters.selectedMonth,
        startDate: filters.startDate,
        endDate: filters.endDate,
        branchId: reqBranchId,
        regionId: reqRegionId,
      });

      if (response && response.data) {
        const appList = response.data.data || response.data || [];
        setMockApp(Array.isArray(appList) ? appList : []);
        setTotalRecords(response.data.totalRecords || (Array.isArray(appList) ? appList.length : 0));
      } else {
        setMockApp([]);
        setTotalRecords(0);
      }
    } catch (err) {
      console.error('Failed to fetch applications:', err);
      setMockApp([]);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  }, [
    userRole,
    filters.page,
    filters.rowsPerPage,
    filters.search,
    filters.financialYear,
    filters.selectedMonth,
    filters.startDate,
    filters.endDate,
    userDetails?.branchId,
    userDetails?.regionId,
    userDetails?.zoneId,
  ]);

  useEffect(() => {
    if (!dialogOpen) {
      fetchApplicationsData();
    }
  }, [dialogOpen, fetchApplicationsData]);

  const handleOpen = () => {
    setApplicationData(null);
    setIsReview(false);
    setOpen(true);
  };

  const handleClose = () => {
    setApplicationData(null);
    setOpen(false);
  };

  const handleView = (row) => {
    setApplicationData(row);
    setIsReview(false);
    setOpen(true);
  };

  const handleVerify = (row) => {
    setApplicationData(row);
    setIsReview(true);
    setOpen(true);
  };

  const handleDelete = async (row) => {
    setLoading(true);
    try {
      await applicationServices.deleteApplication(row.applicationId);
      successNotification('Application deleted successfully');
      fetchApplicationsData();
    } catch (err) {
      errorNotification(err?.response?.data?.message || 'Failed to delete');
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    setLoading(true);
    try {
      let filterby = '00000';
      let reqBranchId = undefined;
      let reqRegionId = undefined;

      if (userRole === 'BO') {
        reqBranchId = userDetails.branchId;
      } else if (userRole === 'RO') {
        reqRegionId = userDetails.regionId;
      } else if (userRole === 'ZO') {
        filterby = userDetails.zoneId || '00000';
      }

      const response = await applicationServices.getAllApplications({
        zoneId: filterby,
        search: filters.search,
        status: 'all',
        createdAt: '',
        financialYear: filters.financialYear,
        month: filters.selectedMonth,
        startDate: filters.startDate,
        endDate: filters.endDate,
        branchId: reqBranchId,
        regionId: reqRegionId,
        exportType: 'excel',
        config: { responseType: 'blob' },
      });

      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `applications_report_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      successNotification('Excel report exported successfully');
    } catch (err) {
      console.error('Failed to export applications to Excel:', err);
      errorNotification('Failed to export Excel report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ width: '100%', minWidth: 0 }}>
      {loading && <FullScreenLoader />}

      {/* ── Executive PageHeader ── */}
      <SectionHeader
        title="Applications Directory & Workflow Repository"
        description="Comprehensive repository of all customer merchant onboarding applications and aggregator-assigned workflows."
        icon={<AssignmentRounded />}
        showButton={isBO}
        buttonText="Add Customer Application"
        buttonProps={{
          startIcon: <Add />,
        }}
        onButtonClick={handleOpen}
      />

      {/* ── Dual Tab Navigation Bar ── */}
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          borderRadius: '12px',
          border: '1px solid',
          borderColor: 'grey.200',
          bgcolor: '#ffffff',
          overflow: 'hidden',
        }}
      >
        <Tabs
          value={currentTab}
          onChange={(e, val) => setCurrentTab(val)}
          indicatorColor="secondary"
          textColor="primary"
          sx={{
            px: 2,
            minHeight: 52,
            '& .MuiTab-root': {
              minHeight: 52,
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.88rem',
              gap: 1.2,
            },
            '& .Mui-selected': {
              color: '#CE0F3E !important',
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#CE0F3E',
              height: 3,
              borderRadius: '3px 3px 0 0',
            },
          }}
        >
          <Tab
            icon={<PersonRounded sx={{ fontSize: 20 }} />}
            iconPosition="start"
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>Customer-Based Applications</span>
                <Chip
                  label={totalRecords || mockApp.length}
                  size="small"
                  sx={{
                    bgcolor: currentTab === 0 ? 'rgba(206,15,62,0.12)' : 'grey.100',
                    color: currentTab === 0 ? '#CE0F3E' : 'text.secondary',
                    fontWeight: 700,
                    fontSize: '0.72rem',
                    height: 20,
                  }}
                />
              </Box>
            }
          />
          <Tab
            icon={<AccountBalanceWalletRounded sx={{ fontSize: 20 }} />}
            iconPosition="start"
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>Aggregator-Based Applications</span>
                <Chip
                  label={aggregatorDetails?.length || 0}
                  size="small"
                  sx={{
                    bgcolor: currentTab === 1 ? 'rgba(206,15,62,0.12)' : 'grey.100',
                    color: currentTab === 1 ? '#CE0F3E' : 'text.secondary',
                    fontWeight: 700,
                    fontSize: '0.72rem',
                    height: 20,
                  }}
                />
              </Box>
            }
          />
        </Tabs>
      </Paper>

      {/* ── Tab 1: Customer-Based Applications Table ── */}
      {currentTab === 0 && (
        <ApplicationFlowTable
          applicationDetails={mockApp}
          totalRecords={totalRecords}
          onRefresh={fetchApplicationsData}
          onView={handleView}
          onVerify={handleVerify}
          onDelete={isBO ? handleDelete : undefined}
          onFilterChange={setFilters}
          onExport={handleExportExcel}
        />
      )}

      {/* ── Tab 2: Aggregator-Based Applications Table ── */}
      {currentTab === 1 && (
        <AggregatorApplicationsTable
          aggregators={aggregatorDetails || []}
          applications={mockApp || []}
          onView={handleView}
          onVerify={handleVerify}
        />
      )}

      {/* ── Application Flow Dialog ── */}
      <ApplicationFlowDialog />

      {/* ── Add / Edit Customer Application Modal ── */}
      <DialogWithHeader
        open={open}
        onClose={handleClose}
        maxWidth="md"
        headerText={isReview ? 'Review Customer Application' : 'Customer Application Details'}
      >
        <ApplicationForm
          fetchAllApplications={fetchApplicationsData}
          updateDetails={applicationData}
          handleClose={handleClose}
          formClosed={open}
        />
      </DialogWithHeader>
    </Box>
  );
}
