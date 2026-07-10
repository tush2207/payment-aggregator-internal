import DialogWithHeader from '&src/components/Dialog/DialogWithHeader';
import SectionHeader from '&src/components/Headers/SectionHeader';
import FullScreenLoader from '&src/components/Loaders/FullScreenLoader';
import ProjectionQuoteTable from '&src/components/ProjectionQuoteTable';
import RoleBasedStepper from '&src/components/RoleBasedStepper';
import useStatusWiseAlert from '&src/components/ToastNotifications/useStatusWiseAlert';
import {
  isBO,
  isCO,
  isRO,
  isZO,
  PAYMENT_AGGREGATOR_WORKFLOW
} from '&src/constants/PaymentAggregratorConstant';
import { ClearAll, UploadFile } from '@mui/icons-material';
import { Box, Button, Grid, IconButton, Typography } from '@mui/material';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';

import useToggle from '&src/hooks/useToggle';
import ApplicationForm from '&src/modules/PaymentAggregator/ApplicationForm';
import applicationServices from '&src/services/applications';

import DatePicker from '&src/components/DatePicker';
import ConfirmationDialogWithReason from '&src/components/Dialog/ConfirmationDialogWithReason';
import { FormField } from '&src/components/FormFields';
import StatusChipOrSelect from '&src/components/StatusChipOrSelect';
import { GET_ALL_APPLICATION_RESPONSE } from '&src/data/data';
import useDebounce from '&src/hooks/useDebounce';


const Dashboard = () => {
  const { value: isLoading, setValue: setShowLoader } = useToggle();

  const [open, setOpen] = useState(false);
  const [applicationData, setApplicationData] = useState(null);
  const [allApplicationDetails, setAllApplicationDetails] = useState([]);

  const today = new Date();
  const formattedToday = today.toISOString().split("T")[0]; // YYYY-MM-DD

  const userDetails = useMemo(() => {
    const stored = sessionStorage.getItem('userDetails');
    return stored && JSON.parse(stored);
  }, []);

  const { zoneId, branchName, zoneName, regionName } = userDetails || {};
  // --------- FILTERS ---------
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [fromDate, setFromDate] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const searchResult = useDebounce(search);
  const { successNotification, errorNotification } = useStatusWiseAlert();

  // ---------- MODAL HANDLERS ----------
  const handleOpen = () => {
    setApplicationData(null);
    setOpen(true);
  };

  const handleClose = () => {
    setApplicationData(null);
    setOpen(false);
    setConfirmDialogOpen(false)
  };

  const handleView = (row) => {
    setApplicationData(row);
    setOpen(true);
  };

  const handleEdit = (row) => {
    setApplicationData(row);
    setOpen(true);
  };

  const uploadAction = (row) => (
    <IconButton
      onClick={(e) => {
        e.stopPropagation();
        setApplicationData(row);
        setOpen(true);
      }}
      color="primary"
    >
      <UploadFile fontSize="small" />
    </IconButton>
  );


  // ---------- DELETE ----------
  const handleDelete = async (row) => {
    setShowLoader(true);
    try {
      await applicationServices.deleteApplication(applicationData?.applicationId);
      successNotification("Application deleted successfully");
      fetchAllApplicationsData();
      setShowLoader(false);
      setConfirmDialogOpen(false);
      setApplicationData(null);
    } catch (err) {
      setShowLoader(false);
      errorNotification(err?.response?.data?.message || "Failed to delete");
    }
  };

  const onDeleteClick = (value) => {
    setApplicationData(value);
    setConfirmDialogOpen(true)
  }


  // ---------- API CALL ----------
  const fetchAllApplicationsData = async (check) => {
    console.log('fetchAllApplicationsData', check)

    setShowLoader(true);

    try {
      const filterby = isCO ? "00000" : zoneId;
      console.log('fetchAllApplicationsData 1', filterby)
      // const response = await applicationServices.getAllApplications(filterby);
      // console.log('fetchAllApplicationsData',response)
      const response = await applicationServices.getAllApplications({
        zoneId: filterby,
        page,
        search: searchResult.trim() || "",
        status: status !== "all" ? status : "all",
        createdAt: fromDate ? dayjs(fromDate).format("YYYY-MM-DD") : "",
      });
      console.log('fetchAllApplicationsDataresponse', response)


      setAllApplicationDetails(GET_ALL_APPLICATION_RESPONSE || []);
      // setTotalPages(response?.data?.totalPages || 1);
      successNotification("Fetched data successfully");
    } catch (error) {
      setAllApplicationDetails(GET_ALL_APPLICATION_RESPONSE);
      errorNotification(error?.response?.data?.message || "Failed to fetch");
    } finally {
      setShowLoader(false);
    }
  };


  // ---------- FETCH WHEN FILTERS CHANGE ----------
  // useEffect(() => {
  //   fetchAllApplicationsData('test');
  //   console.log('fetchAllApplicationsData', 'fetchAllApplicationsData')
  // }, []);

  useEffect(() => {
    fetchAllApplicationsData();
  }, [searchResult, status, category, fromDate, page]);

  const onClickClearAll = () => {
    setCategory(null)
    setFromDate(null)
    setStatus('all');
    setSearch('')
  }


  return (
    <>
      {/* <SectionHeader title={`Zone:${toTitleCase(zoneName)} | Region:${toTitleCase(regionName)} | Branch:${toTitleCase(branchName)}`} /> */}
      {/* payment-aggregator-request-automation-portal */}
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

      {/* ------------ FILTERS UI -------------- */}
      <Grid container spacing={2} sx={{ mb: 2 }}>

        <Grid item xs={12} md={2}>
          <StatusChipOrSelect
            placeholder='Select Status'
            fullWidth
            label="Status"
            value={status}
            editable
            type="workflow"
            onChange={(val) => {
              setStatus(val);
              setPage(1);
            }}
          />
        </Grid>

        <Grid item xs={12} md={3}>
          <FormField
            label="Search"
            placeholder="Account No / App ID / Customer Name"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </Grid>

        <Grid item xs={12} md={5}>
          <Box display='inline-flex' justifyContent='flex-end' alignItems='end' gap={2}>
            <DatePicker
              disableFuture
              fullWidth
              label="Seach By Created Date"
              value={fromDate}
              onChange={(v) => {
                setFromDate(v);
                setPage(1);
              }}
            />
            <Button onClick={onClickClearAll} variant='outlined'>
              <ClearAll /> Clear All
            </Button>
          </Box>
        </Grid>

        <Grid item xs={12} md={3}>


        </Grid>

        {/* 
        <Grid item xs={12} md={2}>
          <AutocompleteDropdown
            name="category"
            label="Category"
            options={BUSINESS_CATEGORIES}
            value={category}
            setFieldValue={(val) => {
              setCategory(val);
              setPage(1);
            }}
          />
        </Grid> */}
      </Grid>




      {/* ------------ TABLE -------------- */}
      <ProjectionQuoteTable
        applicationDetails={allApplicationDetails}
        onView={handleView}
        onEdit={isCO ? handleEdit : undefined}
        onVerify={handleEdit}
        onDelete={isBO ? onDeleteClick : undefined}
        actionElement={isZO || isRO ? uploadAction : undefined}
        totalPages={totalPages}
        page={page}
        onPageChange={(p) => setPage(p)}
      />

      {/* ------------ FORM DIALOG -------------- */}
      <DialogWithHeader
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        headerText={(isRO || isZO) ? "Review Customer Application" : applicationData ? "Customer Application Details" : "Add Customer Details"}
      >
        <ApplicationForm
          fetchAllApplications={fetchAllApplicationsData}
          updateDetails={applicationData}
          handleClose={handleClose}
          formClosed={open || confirmDialogOpen}
        />
      </DialogWithHeader>

      <ConfirmationDialogWithReason
        title='Delete Confirmation'
        description={
          <Typography>Are you sure you want to delete{" "}<Typography component='span' fontWeight={700}>{applicationData?.customerName}</Typography>{" "}Customer?</Typography>}
        open={confirmDialogOpen}
        onClose={() => handleClose()}
        onConfirm={() => handleDelete()}
        confirmText='Delete'
        confirmTextColor='error'
        isLoading={isLoading}
      />

      {isLoading && <FullScreenLoader />}
    </>
  );
};

export default Dashboard;
