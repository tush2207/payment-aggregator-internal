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
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { ApplicationFlowTable, ApplicationFlowDialog } from '&src/components/ApplicationFlow';
import SectionHeader from '&src/components/Headers/SectionHeader';
import DialogWithHeader from '&src/components/Dialog/DialogWithHeader';
import ApplicationForm from '&src/modules/PaymentAggregator/ApplicationForm';
import RoleBasedStepper from '&src/components/RoleBasedStepper';
import FullScreenLoader from '&src/components/Loaders/FullScreenLoader';
import useStatusWiseAlert from '&src/components/ToastNotifications/useStatusWiseAlert';
import { PAYMENT_AGGREGATOR_WORKFLOW } from '&src/constants/PaymentAggregratorConstant';
import { APPLICATION_ROUTES_URLS } from '&src/routes/routesConfig';
import applicationServices from '&src/services/applications';
import { selectUserRole, selectDialogOpen, openWorkflowDialog, fetchApplicationDetails } from '&src/store/applicationFlowSlice';

const getCurrentFinancialYear = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth(); // 0-11
  if (month >= 3) {
    return `FY ${year}-${(year + 1).toString().slice(2)}`;
  } else {
    return `FY ${year - 1}-${year.toString().slice(2)}`;
  }
};

export default function Dashboard() {
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const openAppId = searchParams.get('openAppId');
  const [mockApp, setMockApp] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [isReview, setIsReview] = useState(false);
  const [applicationData, setApplicationData] = useState(null);
  const [stepperOpen, setStepperOpen] = useState(false);
  const [selectedKpiFilter, setSelectedKpiFilter] = useState('ALL');
  const [selectedStageIndex, setSelectedStageIndex] = useState(null);

  const [filters, setFilters] = useState({
    financialYear: getCurrentFinancialYear(),
    selectedMonth: String(new Date().getMonth()),
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
      let filterby = '00000';
      let reqBranchId = undefined;
      let reqRegionId = undefined;

      if (userRole === 'BO') {
        reqBranchId = userDetails.branchId;
      } else if (userRole === 'RO') {
        reqRegionId = userDetails.regionId;
      } else if (userRole === 'ZO') {
        filterby = (userDetails.zoneId && userDetails.zoneId !== '0' && userDetails.zoneId !== 0) ? userDetails.zoneId : '00000';
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
    mockApp.forEach((app) => {
      const stageIdx = getApplicationActiveStage(app);
      if (stageIdx >= 0 && stageIdx < 7) {
        counts[stageIdx]++;
      }
    });
    return counts;
  }, [mockApp]);

  const currentUserId = sessionStorage.getItem('userId') || sessionStorage.getItem('user_id') || userDetails.employeeId || userDetails.pfNumber;
  const isReadOnlyUser = String(currentUserId) === '115019';

  // Compute live KPI analytics for 6 statuses
  const kpiStats = useMemo(() => {
    let pending = 0;
    let inProgress = 0;
    let approved = 0;
    let rejected = 0;
    let query = 0;

    mockApp.forEach((app) => {
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
      total: totalRecords || mockApp.length,
      pending,
      inProgress,
      approved,
      rejected,
      query,
    };
  }, [mockApp, totalRecords]);

  // Filter applications if a KPI card or Stage Stepper is selected
  const displayedApplications = useMemo(() => {
    let list = mockApp;

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
  }, [mockApp, selectedStageIndex, selectedKpiFilter]);

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
    setSelectedKpiFilter(id);
    setSelectedStageIndex(null);
  };

  const handleOpen = () => {
    setApplicationData(null);
    setIsReview(false);
    setOpen(true);
  };

  const handleFilterChange = useCallback((newFilters) => {
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
      let filterby = '00000';
      let reqBranchId = undefined;
      let reqRegionId = undefined;

      if (userRole === 'BO') {
        reqBranchId = userDetails.branchId;
      } else if (userRole === 'RO') {
        reqRegionId = userDetails.regionId;
      } else if (userRole === 'ZO') {
        filterby = (userDetails.zoneId && userDetails.zoneId !== '0' && userDetails.zoneId !== 0) ? userDetails.zoneId : '00000';
      } else {
        filterby = '00000';
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
        userRole: userRole,
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
      color: theme.palette.primary.main || '#176FC1',
      bgGradient: 'linear-gradient(135deg, rgba(23,111,193,0.12) 0%, rgba(23,111,193,0.02) 100%)',
      badge: 'All Records',
    },
    {
      id: 'PENDING',
      title: 'Pending Reviews',
      value: kpiStats.pending,
      icon: <HourglassTopRounded sx={{ fontSize: 26 }} />,
      color: '#ed6c02',
      bgGradient: 'linear-gradient(135deg, rgba(237,108,2,0.12) 0%, rgba(237,108,2,0.02) 100%)',
      badge: 'Initial Action',
    },
    {
      id: 'IN_PROGRESS',
      title: 'In Progress',
      value: kpiStats.inProgress,
      icon: <ReceiptLongRounded sx={{ fontSize: 26 }} />,
      color: '#0284c7',
      bgGradient: 'linear-gradient(135deg, rgba(2,132,199,0.12) 0%, rgba(2,132,199,0.02) 100%)',
      badge: 'Quotes & Markup',
    },
    {
      id: 'APPROVED',
      title: 'Approved & Active',
      value: kpiStats.approved,
      icon: <CheckCircleRounded sx={{ fontSize: 26 }} />,
      color: '#2e7d32',
      bgGradient: 'linear-gradient(135deg, rgba(46,125,50,0.12) 0%, rgba(46,125,50,0.02) 100%)',
      badge: 'PO Issued',
    },
    {
      id: 'REJECTED',
      title: 'Rejected',
      value: kpiStats.rejected,
      icon: <CancelRounded sx={{ fontSize: 26 }} />,
      color: '#d32f2f',
      bgGradient: 'linear-gradient(135deg, rgba(211,47,47,0.12) 0%, rgba(211,47,47,0.02) 100%)',
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
        buttonText="Add Customer Application"
        buttonProps={{
          startIcon: <Add />,
        }}
        actions={[
          {
            label: stepperOpen ? 'Hide Workflow Pipeline' : 'Show Workflow Pipeline (7 Steps)',
            startIcon: <TimelineRounded />,
            variant: stepperOpen ? 'contained' : 'outlined',
            color: 'primary',
            onClick: () => setStepperOpen(!stepperOpen),
            sx: {
              bgcolor: stepperOpen ? '#176FC1' : 'transparent',
              borderColor: '#176FC1',
            },
          },
        ]}
        onButtonClick={handleOpen}
      />

      {/* ── Interactive KPI Analytics Metric Cards ── */}
      <Grid container spacing={2} mb={3}>
        {kpiCards.map((card) => {
          const isSelected = selectedKpiFilter === card.id && selectedStageIndex === null;

          return (
            <Grid item xs={12} sm={6} md={4} lg={2.4} key={card.id}>
              <Card
                onClick={() => handleKpiCardClick(card.id)}
                elevation={0}
                sx={{
                  cursor: 'pointer',
                  p: 0,
                  borderRadius: '14px',
                  border: '2px solid',
                  borderColor: isSelected ? card.color : 'grey.200',
                  background: isSelected ? card.bgGradient : '#ffffff',
                  boxShadow: isSelected
                    ? `0 6px 18px ${alpha(card.color, 0.25)}`
                    : '0 2px 8px rgba(0,0,0,0.03)',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    boxShadow: `0 8px 20px ${alpha(card.color, 0.22)}`,
                    borderColor: card.color,
                  },
                }}
              >
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.2 }}>
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: alpha(card.color, 0.12),
                        color: card.color,
                      }}
                    >
                      {card.icon}
                    </Box>

                    <Chip
                      label={card.badge}
                      size="small"
                      sx={{
                        bgcolor: isSelected ? card.color : alpha(card.color, 0.08),
                        color: isSelected ? '#ffffff' : card.color,
                        fontWeight: 700,
                        fontSize: '0.68rem',
                        borderRadius: '6px',
                        height: 20,
                      }}
                    />
                  </Box>

                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.80rem' }}>
                    {card.title}
                  </Typography>

                  <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mt: 0.4 }}>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: card.color, fontSize: '1.75rem', lineHeight: 1.1 }}>
                      {card.value}
                    </Typography>

                    <Typography variant="caption" sx={{ color: isSelected ? card.color : 'text.disabled', fontSize: '0.70rem', fontWeight: 600 }}>
                      {isSelected ? '● Filtering active' : 'Click to filter'}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* ── Active KPI Filter Indicator & Reset ── */}
      {selectedKpiFilter !== 'ALL' && selectedStageIndex === null && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, p: 1.2, px: 2, bgcolor: '#f0f7ff', borderRadius: '8px', border: '1px dashed #176FC1' }}>
          <Typography variant="body2" sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#0E4F8D' }}>
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
            bgcolor: '#f0fdf4',
            borderRadius: '10px',
            border: '1.5px dashed #2E7D32',
            boxShadow: '0 2px 8px rgba(46, 125, 50, 0.08)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#2E7D32' }}>
              Active Stage Filter: <b>Step {selectedStageIndex + 1} ({workflowStepNames[selectedStageIndex]})</b>
            </Typography>
            <Chip
              label={`${displayedApplications.length} ${displayedApplications.length === 1 ? 'record' : 'records'} found`}
              size="small"
              sx={{
                bgcolor: 'rgba(46, 125, 50, 0.12)',
                color: '#2E7D32',
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
              borderColor: '#2e7d32',
              color: '#2e7d32',
              bgcolor: '#ffffff',
              boxShadow: '0 1px 4px rgba(46, 125, 50, 0.15)',
              '&:hover': {
                borderColor: '#1b5e20',
                bgcolor: 'rgba(46, 125, 50, 0.08)',
              },
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
