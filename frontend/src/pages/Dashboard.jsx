import React, { useState, useEffect, useCallback } from 'react';
import { Box } from '@mui/material';
import { ApplicationFlowTable, ApplicationFlowDialog } from '&src/components/ApplicationFlow';
import SectionHeader from '&src/components/Headers/SectionHeader';
import DialogWithHeader from '&src/components/Dialog/DialogWithHeader';
import ApplicationForm from '&src/modules/PaymentAggregator/ApplicationForm';
import RoleBasedStepper from '&src/components/RoleBasedStepper';
import { useSelector } from 'react-redux';
import { selectUserRole, selectDialogOpen } from '&src/store/applicationFlowSlice';
import { PAYMENT_AGGREGATOR_WORKFLOW } from '&src/constants/PaymentAggregratorConstant';
import applicationServices from '&src/services/applications';
import { GET_ALL_APPLICATION_RESPONSE } from '&src/data/data';
import useStatusWiseAlert from '&src/components/ToastNotifications/useStatusWiseAlert';
import FullScreenLoader from '&src/components/Loaders/FullScreenLoader';

// Helpers to get current financial year dynamically
const getCurrentFinancialYear = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth(); // 0-11
  if (month >= 3) { // April onwards
    return `FY ${year}-${(year + 1).toString().slice(2)}`;
  } else {
    return `FY ${year - 1}-${year.toString().slice(2)}`;
  }
};

export default function Dashboard() {
  const [mockApp, setMockApp] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [isReview, setIsReview] = useState(false);
  const [applicationData, setApplicationData] = useState(null);

  const [filters, setFilters] = useState({
    financialYear: getCurrentFinancialYear(),
    selectedMonth: new Date().getMonth().toString(),
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

  const dialogOpen = useSelector(selectDialogOpen);

  const fetchApplicationsData = useCallback(async () => {
    console.log("fetchApplicationsData calling API with filters:", filters);
    setLoading(true);
    try {
      const userDetails = JSON.parse(sessionStorage.getItem('userDetails') || '{}');
      
      let filterby = "00000";
      let reqBranchId = undefined;
      let reqRegionId = undefined;

      if (userRole === 'BO') {
        reqBranchId = userDetails.branchId;
      } else if (userRole === 'RO') {
        reqRegionId = userDetails.regionId;
      } else if (userRole === 'ZO') {
        filterby = userDetails.zoneId || "00000";
      }

      const response = await applicationServices.getAllApplications({
        zoneId: filterby,
        page: filters.page,
        pageSize: filters.rowsPerPage,
        search: filters.search,
        status: "all",
        createdAt: "",
        financialYear: filters.financialYear,
        month: filters.selectedMonth,
        startDate: filters.startDate,
        endDate: filters.endDate,
        branchId: reqBranchId,
        regionId: reqRegionId,
      });

      if (response && response.data) {
        // Axios resolves to response.data, let's look for backend array structure
        const appList = response.data.data || response.data || [];
        setMockApp(appList);
        setTotalRecords(response.data.totalRecords || appList.length);
      } else {
        setMockApp([]);
        setTotalRecords(0);
      }
    } catch (err) {
      console.error("Failed to fetch applications:", err);
      // Fallback to local data in development to prevent blank pages
      setMockApp(GET_ALL_APPLICATION_RESPONSE || []);
      setTotalRecords((GET_ALL_APPLICATION_RESPONSE || []).length);
    } finally {
      setLoading(false);
    }
  }, [userRole, filters]);

  useEffect(() => {
    console.log("Dashboard useEffect: filters changed, fetching applications", filters);
    if (!dialogOpen) {
      fetchApplicationsData();
    }
  }, [dialogOpen, filters, fetchApplicationsData]);

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
      successNotification("Application deleted successfully");
      fetchApplicationsData();
    } catch (err) {
      errorNotification(err?.response?.data?.message || "Failed to delete");
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    setLoading(true);
    try {
      const userDetails = JSON.parse(sessionStorage.getItem('userDetails') || '{}');
      
      let filterby = "00000";
      let reqBranchId = undefined;
      let reqRegionId = undefined;

      if (userRole === 'BO') {
        reqBranchId = userDetails.branchId;
      } else if (userRole === 'RO') {
        reqRegionId = userDetails.regionId;
      } else if (userRole === 'ZO') {
        filterby = userDetails.zoneId || "00000";
      }

      const response = await applicationServices.getAllApplications({
        zoneId: filterby,
        search: filters.search,
        status: "all",
        createdAt: "",
        financialYear: filters.financialYear,
        month: filters.selectedMonth,
        startDate: filters.startDate,
        endDate: filters.endDate,
        branchId: reqBranchId,
        regionId: reqRegionId,
        exportType: "excel",
        config: { responseType: 'blob' }
      });

      const blob = new Blob([response.data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `applications_report_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      successNotification("Excel report exported successfully");
    } catch (err) {
      console.error("Failed to export applications to Excel:", err);
      errorNotification("Failed to export Excel report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box p={3}>
      {loading && <FullScreenLoader />}

      <RoleBasedStepper
        steps={PAYMENT_AGGREGATOR_WORKFLOW([])}
        showDescription
        allActive
        showTooltip={false}
        variant="qonto"
      />

      <SectionHeader
        title="Customer Applications"
        showButton={isBO}
        buttonText="Add Customer Application"
        onButtonClick={handleOpen}
      />

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
      <ApplicationFlowDialog />

      <DialogWithHeader
        open={open}
        onClose={handleClose}
        maxWidth="md"
        headerText={isReview ? "Review Customer Application" : "Customer Application Details"}
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
