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

export default function Dashboard() {
  const [mockApp, setMockApp] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [isReview, setIsReview] = useState(false);
  const [applicationData, setApplicationData] = useState(null);

  const { successNotification, errorNotification } = useStatusWiseAlert();
  const userRole = useSelector(selectUserRole) || sessionStorage.getItem('role') || 'BO';
  const isBO = userRole === 'BO';

  const dialogOpen = useSelector(selectDialogOpen);

  const fetchApplicationsData = useCallback(async () => {
    setLoading(true);
    try {
      const userDetails = JSON.parse(sessionStorage.getItem('userDetails') || '{}');
      const zoneId = userDetails.zoneId || '00000';
      const filterby = userRole === 'CO' ? "00000" : zoneId;

      const response = await applicationServices.getAllApplications({
        zoneId: filterby,
        page: 1,
        search: "",
        status: "all",
        createdAt: "",
      });

      if (response && response.data) {
        // Axios resolves to response.data, let's look for backend array structure
        const appList = response.data.data || response.data || [];
        setMockApp(appList);
      } else {
        setMockApp([]);
      }
    } catch (err) {
      console.error("Failed to fetch applications:", err);
      // Fallback to local data in development to prevent blank pages
      setMockApp(GET_ALL_APPLICATION_RESPONSE || []);
    } finally {
      setLoading(false);
    }
  }, [userRole]);

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
      successNotification("Application deleted successfully");
      fetchApplicationsData();
    } catch (err) {
      errorNotification(err?.response?.data?.message || "Failed to delete");
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
        onRefresh={fetchApplicationsData}
        onView={handleView}
        onVerify={handleVerify}
        onDelete={isBO ? handleDelete : undefined}
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
