import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Chip,
  Collapse,
  Button,
  Paper,
  alpha,
  useTheme,
} from '@mui/material';
import {
  DashboardRounded,
  Add,
  AssignmentRounded,
  HourglassTopRounded,
  CheckCircleRounded,
  ReceiptLongRounded,
  FilterAltOffRounded,
  AccountBalanceRounded,
  LocationOnRounded,
  ArrowForwardRounded,
  TimelineRounded,
  TouchAppRounded,
  CancelRounded,
  HelpOutlineRounded,
  FileDownloadRounded,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { ApplicationFlowTable, ApplicationFlowDialog } from '&src/features/application-flow';
import SectionHeader from '&src/components/Headers/SectionHeader';
import CommonKpiCards from '&src/components/common/CommonKpiCards';
import DialogWithHeader from '&src/components/Dialog/DialogWithHeader';
import ApplicationForm from '&src/features/payment-aggregator/ApplicationForm';
import RoleBasedStepper from '&src/components/RoleBasedStepper';
import FullScreenLoader from '&src/components/feedback/FullScreenLoader';
import useStatusWiseAlert from '&src/components/feedback/ToastNotifications/useStatusWiseAlert';
import { PAYMENT_AGGREGATOR_WORKFLOW } from '&src/constants/PaymentAggregratorConstant';
import { APPLICATION_ROUTES_URLS } from '&src/routes/routesConfig';
import { selectUserRole, selectDialogOpen, openWorkflowDialog, fetchApplicationDetails } from '&src/store/applicationFlowSlice';
import { exportApplicationsToExcel } from '&src/utils/excelExport';
import applicationServices from '&src/services/applications';
import { getCurrentFinancialYear } from '&src/utils';

export default function Dashboard() {
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const openAppId = searchParams.get('openAppId');
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [isReview, setIsReview] = useState(false);
  const [applicationData, setApplicationData] = useState(null);
  const [stepperOpen, setStepperOpen] = useState(false);
  const [selectedKpiFilter, setSelectedKpiFilter] = useState('ALL');
  const [selectedStageIndex, setSelectedStageIndex] = useState(null);

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
      const branchVal = userDetails.branchId ?? userDetails.branchCode ?? userDetails.Locationid ?? userDetails.LocationId ?? userDetails.solId;
      const regionVal = userDetails.regionId ?? userDetails.RegionId ?? userDetails.regionCode ?? userDetails.RegionCode;
      const zoneVal = userDetails.zoneId ?? userDetails.ZoneId ?? userDetails.zoneCode ?? userDetails.ZoneCode;

      let filterby = '00000';
      let reqBranchId = undefined;
      let reqRegionId = undefined;

      if (userRole === 'BO') {
        reqBranchId = branchVal;
      } else if (userRole === 'RO') {
        reqRegionId = regionVal;
      } else if (userRole === 'ZO') {
        filterby = (zoneVal && zoneVal !== '0' && zoneVal !== 0) ? zoneVal : '00000';
      } else {
        filterby = '00000';
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
        userRole: userRole,
      });
      console.log(response, 'responseresponse')

      if (response && response.data) {
        const appList = response.data.data || response.data || [];
        setApplications(Array.isArray(appList) ? appList : []);
        setTotalRecords(response.data.totalRecords || (Array.isArray(appList) ? appList.length : 0));
      } else {
        setApplications([]);
        setTotalRecords(0);
      }
    } catch (err) {
      console.error('Failed to fetch applications:', err);
      setApplications([]);
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
    userDetails,
  ]);

  useEffect(() => {
    if (!dialogOpen) {
      fetchApplicationsData();
    }
  }, [dialogOpen, fetchApplicationsData]);

  // Notification click: ensure filters allow target application to be visible on table
  useEffect(() => {
    if (!openAppId) return;
    setSelectedKpiFilter('ALL');
    setSelectedStageIndex(null);
    setFilters((prev) => ({ ...prev, search: '' }));
  }, [openAppId]);

  const handleApplicationCreatedOrUpdated = useCallback(async (createdOrUpdatedData) => {
    setSelectedKpiFilter('ALL');
    setSelectedStageIndex(null);
    setFilters((prev) => ({ ...prev, search: '', page: 1 }));
    await fetchApplicationsData();
  }, [fetchApplicationsData]);

  // Helper to determine the EXACT active workflow stage index (0-6) of an application
  const getApplicationActiveStage = (app) => {
    if (!app) return 0;
    if (app.isFinalApproved) return 6; // Step 7: Final Approval
    if (app.isQuoteAcceptRO) return 5; // Step 6: Customer Acceptance
    if (app.isQuoteReviewCO || app.isMarkUpAddedCO) return 4; // Step 5: Quote Analysis
    if (app.isQuoteAddedPA || app.isAggregatorAdded) return 3; // Step 4: Quote Submission
    if (app.isReviewByCO) return 2; // Step 3: CO Review
    if (app.isReviewByRO || app.isReviewByZO) return 1; // Step 2: RO / ZO Review
    return 0; // Step 1: Application Submission
  };

  // Compute live stage counts for the 7 steps in the workflow based on active stage
  const stageCounts = useMemo(() => {
    const counts = [0, 0, 0, 0, 0, 0, 0];
    applications.forEach((app) => {
      const stageIdx = getApplicationActiveStage(app);
      if (stageIdx >= 0 && stageIdx < 7) {
        counts[stageIdx]++;
      }
    });
    return counts;
  }, [applications]);

  const currentUserId = sessionStorage.getItem('userId') || sessionStorage.getItem('user_id') || userDetails.employeeId || userDetails.pfNumber;
  const isReadOnlyUser = String(currentUserId) === '115019';

  // Compute live KPI analytics for 6 statuses
  const kpiStats = useMemo(() => {
    let pending = 0;
    let inProgress = 0;
    let approved = 0;
    let rejected = 0;
    let query = 0;

    applications.forEach((app) => {
      const statusStr = String(app.status || '').toLowerCase();
      const isRej = statusStr.includes('reject') || Boolean(app.reasonOfRejection) || Boolean(app.rejectedDate);
      const isAppr = !isRej && (Boolean(app.isFinalApproved) || ['finalapproved', 'approved', 'completed'].includes(statusStr));
      const isQry = !isRej && (statusStr.includes('query') || statusStr === 'query');

      if (isRej) {
        rejected++;
      } else if (isAppr) {
        approved++;
      } else if (isQry) {
        query++;
        inProgress++;
      } else if (app.isReviewByCO || app.isAggregatorAdded || app.isQuoteAddedPA || app.isMarkUpAddedCO || app.isQuoteReviewCO || app.isQuoteAcceptRO) {
        inProgress++;
      } else {
        pending++;
      }
    });

    return {
      total: totalRecords || applications.length,
      pending,
      inProgress,
      approved,
      rejected,
      query,
    };
  }, [applications, totalRecords]);

  // Filter applications if a KPI card, Stage Stepper, or search query is selected
  const displayedApplications = useMemo(() => {
    let list = applications;

    // 0. Search Filter (instant multi-identifier search)
    if (filters.search && filters.search.trim()) {
      const s = filters.search.trim().toLowerCase();
      list = list.filter((app) => {
        const appId = String(app.applicationId || '').toLowerCase();
        const custName = String(app.customerName || '').toLowerCase();
        const accNo = String(app.accountNo || '').toLowerCase();
        const email = String(app.email || '').toLowerCase();
        const branchName = String(app.branchName || '').toLowerCase();
        const branchId = String(app.branchId || '').toLowerCase();
        const regionName = String(app.regionName || '').toLowerCase();
        const regionId = String(app.regionId || '').toLowerCase();
        const zoneName = String(app.zoneName || '').toLowerCase();
        const zoneId = String(app.zoneId || '').toLowerCase();
        const status = String(app.status || '').toLowerCase();
        const category = String(app.category || '').toLowerCase();
        const busCategory = String(app.businessCategory || app.merchantCategory || '').toLowerCase();
        const entityType = String(app.entityType || app.businessType || '').toLowerCase();
        return (
          appId.includes(s) ||
          custName.includes(s) ||
          accNo.includes(s) ||
          email.includes(s) ||
          branchName.includes(s) ||
          branchId.includes(s) ||
          regionName.includes(s) ||
          regionId.includes(s) ||
          zoneName.includes(s) ||
          zoneId.includes(s) ||
          status.includes(s) ||
          category.includes(s) ||
          busCategory.includes(s) ||
          entityType.includes(s)
        );
      });
    }

    // 1. Stage Stepper Filter (if user clicked a step in the pipeline)
    if (selectedStageIndex !== null) {
      list = list.filter((app) => getApplicationActiveStage(app) === selectedStageIndex);
    }

    // 2. KPI Filter (if user clicked a KPI card)
    if (selectedKpiFilter === 'PENDING') {
      list = list.filter((app) => {
        const s = String(app.status || '').toLowerCase();
        const isRej = s.includes('reject') || Boolean(app.reasonOfRejection);
        return !isRej && !app.isFinalApproved && !app.isReviewByCO && !app.isAggregatorAdded && !app.isQuoteAddedPA && !app.isMarkUpAddedCO && !app.isQuoteAcceptRO;
      });
    } else if (selectedKpiFilter === 'IN_PROGRESS') {
      list = list.filter((app) => {
        const s = String(app.status || '').toLowerCase();
        const isRej = s.includes('reject') || Boolean(app.reasonOfRejection);
        return !isRej && !app.isFinalApproved && (app.isReviewByCO || app.isAggregatorAdded || app.isQuoteAddedPA || app.isMarkUpAddedCO || app.isQuoteAcceptRO || s.includes('query'));
      });
    } else if (selectedKpiFilter === 'APPROVED') {
      list = list.filter((app) => {
        const s = String(app.status || '').toLowerCase();
        const isRej = s.includes('reject') || Boolean(app.reasonOfRejection);
        return !isRej && (Boolean(app.isFinalApproved) || ['finalapproved', 'approved', 'completed'].includes(s));
      });
    } else if (selectedKpiFilter === 'REJECTED') {
      list = list.filter((app) => {
        const s = String(app.status || '').toLowerCase();
        return s.includes('reject') || Boolean(app.reasonOfRejection) || Boolean(app.rejectedDate);
      });
    } else if (selectedKpiFilter === 'QUERY') {
      list = list.filter((app) => String(app.status || '').toLowerCase().includes('query'));
    }

    return [...list].sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      if (dateB !== dateA) return dateB - dateA;
      return (Number(b.applicationId) || 0) - (Number(a.applicationId) || 0);
    });
  }, [applications, selectedStageIndex, selectedKpiFilter, filters.search]);

  const recentThreeApplications = useMemo(() => {
    return displayedApplications.slice(0, 3);
  }, [displayedApplications]);

  const handleStageStepClick = (step, index) => {
    if (index === null) {
      setSelectedStageIndex(null);
    } else {
      setSelectedStageIndex((prev) => (prev === index ? null : index));
      setSelectedKpiFilter('ALL');
    }
  };

  const handleKpiCardClick = (id) => {
    setSelectedKpiFilter((prev) => (prev === id ? 'ALL' : id));
    setSelectedStageIndex(null);
  };

  const handleOpen = () => {
    setApplicationData(null);
    setIsReview(false);
    setOpen(true);
  };

  const handleFilterChange = useCallback((newFilters) => {
    if (newFilters.search === '' && newFilters.financialYear === 'all' && newFilters.selectedMonth === 'all') {
      setSelectedKpiFilter('ALL');
      setSelectedStageIndex(null);
    }
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const handleClearStageFilter = () => {
    setSelectedStageIndex(null);
  };

  const handleClose = () => {
    setApplicationData(null);
    setOpen(false);
  };

  const handleView = async (row) => {
    setApplicationData(row);
    setIsReview(false);
    setOpen(true);
    if (row?.applicationId) {
      try {
        const res = await applicationServices.getApplicationById(row.applicationId);
        if (res?.data) {
          setApplicationData(res.data);
        }
      } catch (e) {
        console.warn('Could not fetch single application details:', e);
      }
    }
  };

  const handleVerify = async (row) => {
    setApplicationData(row);
    setIsReview(true);
    setOpen(true);
    if (row?.applicationId) {
      try {
        const res = await applicationServices.getApplicationById(row.applicationId);
        if (res?.data) {
          setApplicationData(res.data);
        }
      } catch (e) {
        console.warn('Could not fetch single application details:', e);
      }
    }
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
      const recordsToExport = displayedApplications && displayedApplications.length > 0
        ? displayedApplications
        : applications;

      if (!recordsToExport || recordsToExport.length === 0) {
        errorNotification('No application records available to export.');
        return;
      }

      exportApplicationsToExcel(
        recordsToExport,
        `CBI_Customer_Applications_Report_${new Date().toISOString().slice(0, 10)}.xlsx`
      );
      successNotification(`Exported ${recordsToExport.length} application records to Excel successfully!`);
    } catch (err) {
      console.error('Failed to export applications to Excel:', err);
      errorNotification('Failed to export Excel report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const workflowStepNames = [
    'Application Submission',
    'RO / ZO Review',
    'CO Review',
    'Quote Submission',
    'Quote Analysis',
    'Customer Acceptance',
    'Final Approval',
  ];

  const kpiCards = [
    {
      id: 'ALL',
      title: 'Total Applications',
      value: kpiStats.total,
      icon: <AssignmentRounded sx={{ fontSize: 26 }} />,
      color: theme.palette.primary.main,
      bgGradient: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.12)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
      badge: 'All Records',
    },
    {
      id: 'PENDING',
      title: 'Pending Reviews',
      value: kpiStats.pending,
      icon: <HourglassTopRounded sx={{ fontSize: 26 }} />,
      color: theme.palette.warning.main,
      bgGradient: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.12)} 0%, ${alpha(theme.palette.warning.main, 0.02)} 100%)`,
      badge: 'Initial Action',
    },
    {
      id: 'IN_PROGRESS',
      title: 'In Progress',
      value: kpiStats.inProgress,
      icon: <ReceiptLongRounded sx={{ fontSize: 26 }} />,
      color: theme.palette.info.main,
      bgGradient: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.12)} 0%, ${alpha(theme.palette.info.main, 0.02)} 100%)`,
      badge: 'Quotes & Markup',
    },
    {
      id: 'APPROVED',
      title: 'Approved & Active',
      value: kpiStats.approved,
      icon: <CheckCircleRounded sx={{ fontSize: 26 }} />,
      color: theme.palette.success.main,
      bgGradient: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.12)} 0%, ${alpha(theme.palette.success.main, 0.02)} 100%)`,
      badge: 'PO Issued',
    },
    {
      id: 'REJECTED',
      title: 'Rejected',
      value: kpiStats.rejected,
      icon: <CancelRounded sx={{ fontSize: 26 }} />,
      color: theme.palette.error.main,
      bgGradient: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.12)} 0%, ${alpha(theme.palette.error.main, 0.02)} 100%)`,
      badge: 'Locked Out',
    },
  ];

  return (
    <Box sx={{ width: '100%', minWidth: 0 }}>
      {loading && <FullScreenLoader />}

      {/* ── Executive PageHeader ── */}
      <SectionHeader
        title="Customer Applications & Workflow Dashboard"
        description="Monitor, review, and process merchant payment aggregator applications, approvals, and quotations in real-time."
        icon={<DashboardRounded />}
        showButton={isBO && !isReadOnlyUser}
        buttonText="Add Application"
        buttonProps={{
          startIcon: <Add />,
        }}
        actions={[
          {
            label: stepperOpen ? 'Hide Workflow' : 'Show Workflow',
            startIcon: <TimelineRounded />,
            variant: stepperOpen ? 'contained' : 'outlined',
            color: 'primary',
            onClick: () => setStepperOpen(!stepperOpen),
          },
          {
            label: 'Export All',
            startIcon: <FileDownloadRounded />,
            variant: 'outlined',
            color: 'primary',
            onClick: handleExportExcel,
            sx: {
              fontWeight: 700,
              borderRadius: '8px',
              px: 2.2,
              py: 0.9,
              boxShadow: '0 2px 8px rgba(155, 10, 46, 0.25)',
            },
          },
        ]}
        onButtonClick={handleOpen}
      />

      {/* ── Interactive KPI Analytics Metric Cards ── */}
      <CommonKpiCards
        cards={kpiCards}
        selectedId={selectedStageIndex === null ? selectedKpiFilter : null}
        onCardClick={handleKpiCardClick}
      />

      {/* ── Active KPI Filter Indicator & Reset ── */}
      {selectedKpiFilter !== 'ALL' && selectedStageIndex === null && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, p: 1.2, px: 2, bgcolor: alpha(theme.palette.primary.main, 0.06), borderRadius: '8px', border: `1px dashed ${theme.palette.primary.main}` }}>
          <Typography variant="body2" sx={{ fontSize: '0.82rem', fontWeight: 600, color: 'primary.dark' }}>
            Active KPI Filter: <b>{kpiCards.find((c) => c.id === selectedKpiFilter)?.title}</b> ({displayedApplications.length} records)
          </Typography>
          <Button
            size="small"
            variant="outlined"
            color="primary"
            startIcon={<FilterAltOffRounded />}
            onClick={() => setSelectedKpiFilter('ALL')}
            sx={{ textTransform: 'none', fontSize: '0.75rem', py: 0.2, px: 1.2, ml: 'auto', borderRadius: '6px' }}
          >
            Clear Filter
          </Button>
        </Box>
      )}

      {/* ── Collapsible Interactive Workflow Stepper Pipeline ── */}
      <Collapse in={stepperOpen}>
        <Box sx={{ mb: 1.5 }}>
          <RoleBasedStepper
            steps={PAYMENT_AGGREGATOR_WORKFLOW([])}
            showDescription
            showTimestamp={false}
            allActive
            showTooltip={false}
            variant="qonto"
            interactiveFilter={true}
            selectedStepIndex={selectedStageIndex}
            onStepClick={handleStageStepClick}
            stepCounts={stageCounts}
          />
        </Box>
      </Collapse>

      {/* ── Active Workflow Stage Filter Banner (Single Dedicated Reset Action) ── */}
      {selectedStageIndex !== null && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            mb: 2.5,
            p: 1.5,
            px: 2.2,
            bgcolor: alpha(theme.palette.success.main, 0.08),
            borderRadius: '10px',
            border: `1.5px dashed ${theme.palette.success.main}`,
            boxShadow: `0 2px 8px ${alpha(theme.palette.success.main, 0.08)}`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ fontSize: '0.85rem', fontWeight: 700, color: 'success.dark' }}>
              Active Stage Filter: <b>Step {selectedStageIndex + 1} ({workflowStepNames[selectedStageIndex]})</b>
            </Typography>
            <Chip
              label={`${displayedApplications.length} ${displayedApplications.length === 1 ? 'record' : 'records'} found`}
              size="small"
              sx={{
                bgcolor: alpha(theme.palette.success.main, 0.12),
                color: 'success.dark',
                fontWeight: 700,
                fontSize: '0.72rem',
                height: 22,
              }}
            />
          </Box>

          <Button
            size="small"
            variant="outlined"
            color="success"
            startIcon={<FilterAltOffRounded />}
            onClick={() => setSelectedStageIndex(null)}
            sx={{
              textTransform: 'none',
              fontSize: '0.78rem',
              fontWeight: 700,
              py: 0.4,
              px: 1.8,
              ml: 'auto',
              borderRadius: '6px',
            }}
          >
            Reset Stage Filter
          </Button>
        </Box>
      )}

      {/* ── Main Customer Applications Table ── */}
      <ApplicationFlowTable
        applicationDetails={displayedApplications}
        totalRecords={totalRecords}
        filters={filters}
        onRefresh={fetchApplicationsData}
        onView={handleView}
        onVerify={handleVerify}
        onCreateApplication={isBO && !isReadOnlyUser ? handleOpen : undefined}
        onDelete={isBO && !isReadOnlyUser ? handleDelete : undefined}
        onFilterChange={handleFilterChange}
        onExport={handleExportExcel}
      />

      {/* ── Application Flow Stepper Modal / Dialog ── */}
      <ApplicationFlowDialog />

      {/* ── Add / Edit Customer Application Modal ── */}
      <DialogWithHeader
        open={open}
        onClose={handleClose}
        maxWidth="md"
        headerText={isReview ? 'Review Customer Application' : 'Customer Application Details'}
        applicationId={applicationData?.applicationId}
        icon={AssignmentRounded}
      >
        <ApplicationForm
          fetchAllApplications={handleApplicationCreatedOrUpdated}
          updateDetails={applicationData}
          handleClose={handleClose}
          formClosed={open}
        />
      </DialogWithHeader>
    </Box>
  );
}
