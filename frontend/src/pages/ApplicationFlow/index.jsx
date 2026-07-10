import React, { useEffect, useState } from 'react';
import { Box, MenuItem, Select, FormControl, InputLabel, Typography, Button } from '@mui/material';

import SectionHeader from '&src/components/Headers/SectionHeader';
import FullScreenLoader from '&src/components/Loaders/FullScreenLoader';
import DialogWithHeader from '&src/components/Dialog/DialogWithHeader';
import ApplicationForm from '&src/modules/PaymentAggregator/ApplicationForm';
import ProjectionEditorModal from '&src/components/ProjectionQuoteTable/ProjectionEditorModal';

import useApplicationFlow from './useApplicationFlow';
import ApplicationFlowTable from './ApplicationFlowTable';
import { GET_ALL_APPLICATION_RESPONSE } from "&src/data/data";
// ^ Using local data as fallback if no real applications are fetched from the API yet

const ApplicationFlowDashboard = () => {
  const {
    applications,
    setApplications,
    isLoading,
    fetchApplications,
    submitApplicationBR,
    reviewByZO,
    reviewByRO,
    reviewByCO,
    submitProjections,
    addAggregators,
    acceptQuoteRO,
    finalApproval
  } = useApplicationFlow();

  // For testing purposes, let the user change their role from a dropdown
  const [testRole, setTestRole] = useState('BR');

  // Verify Dialog State
  const [open, setOpen] = useState(false);
  const [applicationData, setApplicationData] = useState(null);

  // Post-Verify Projection Prompt State
  const [showProjectionPrompt, setShowProjectionPrompt] = useState(false);
  const [approvedAppDetails, setApprovedAppDetails] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorApp, setEditorApp] = useState(null);

  const handleClose = () => {
    setOpen(false);
    setApplicationData(null);
  };

  useEffect(() => {
    // Initial fetch
    fetchApplications().then(() => {
      // Fallback to local data if API returns empty to make testing easy
      setApplications(prev => prev.length > 0 ? prev : GET_ALL_APPLICATION_RESPONSE);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  console.log(applications, 'applications')
  return (
    <>
      <SectionHeader title="Application Flow (Testing Mode)" />

      {/* Test Role Switcher */}
      <Box sx={{ mb: 2, p: 2, backgroundColor: '#fff', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="body2" fontWeight={600}>Test as Role:</Typography>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Role</InputLabel>
          <Select
            value={testRole}
            label="Role"
            onChange={(e) => setTestRole(e.target.value)}
          >
            <MenuItem value="BR">Branch (BR)</MenuItem>
            <MenuItem value="ZO">Zonal Head (ZO)</MenuItem>
            <MenuItem value="RO">Regional Head (RO)</MenuItem>
            <MenuItem value="CO">Central Officer (CO)</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Main Table */}
      <ApplicationFlowTable
        applicationDetails={applications}
        userRole={testRole}
        onVerify={(app) => {
          setApplicationData(app);
          setOpen(true);
        }}
        onSubmitBR={submitApplicationBR}
        onReviewZO={reviewByZO}
        onReviewRO={reviewByRO}
        onReviewCO={reviewByCO}
        onSubmitProjections={submitProjections}
        onAddAggregator={addAggregators}
        onAcceptQuote={acceptQuoteRO}
        onFinalApproval={finalApproval}
      />

      {isLoading && <FullScreenLoader />}

      {/* Verify Application Form Modal */}
      <DialogWithHeader
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        headerText="Verify Customer Application"
      >
        <ApplicationForm
          fetchAllApplications={fetchApplications}
          updateDetails={applicationData}
          handleClose={handleClose}
          formClosed={open}
          onApproveSuccess={() => {
            if (['RO', 'ZO', 'CO'].includes(testRole)) {
              setApprovedAppDetails(applicationData);
              setShowProjectionPrompt(true);
            }
          }}
        />
      </DialogWithHeader>

      {/* Post-Verify Projection Prompt */}
      <DialogWithHeader
        open={showProjectionPrompt}
        onClose={() => setShowProjectionPrompt(false)}
        headerText="Update Projections"
        maxWidth="xs"
      >
        <Box p={3} textAlign="center">
          <Typography variant="body1" mb={3}>
            Application verified successfully! Do you want to update the projections for this application?
          </Typography>
          <Box display="flex" justifyContent="center" gap={2}>
            <Button variant="outlined" onClick={() => setShowProjectionPrompt(false)}>
              No, skip
            </Button>
            <Button variant="contained" onClick={() => {
              setShowProjectionPrompt(false);
              setEditorApp(approvedAppDetails);
              setEditorOpen(true);
            }}>
              Yes, update
            </Button>
          </Box>
        </Box>
      </DialogWithHeader>

      {/* Projection Editor Modal */}
      <ProjectionEditorModal
        open={editorOpen}
        onClose={(shouldReload) => {
          setEditorOpen(false);
          if (shouldReload) fetchApplications();
        }}
        applicationDetails={editorApp}
      />
    </>
  );
};

export default ApplicationFlowDashboard;
