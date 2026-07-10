import { BugReport, DoneAllOutlined, PendingActionsOutlined, Person } from '@mui/icons-material';
import { Grid, Typography, useMediaQuery, useTheme } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';

import AnalyticsCard from '&src/components/AnalyticsCard';
import ConfirmationDialogWithReason from '&src/components/Dialog/ConfirmationDialogWithReason';
import DialogWithHeader from '&src/components/Dialog/DialogWithHeader';
import SectionHeader from '&src/components/Headers/SectionHeader';
import FullScreenLoader from '&src/components/Loaders/FullScreenLoader';
import DataGridTable from '&src/components/Tables/DataGrid';
import useStatusWiseAlert from "&src/components/ToastNotifications/useStatusWiseAlert";
import { HELP_DESK_TABLE_COLUMNS, isBO, isCO } from '&src/constants/PaymentAggregratorConstant';
import useToggle from '&src/hooks/useToggle';
import ManageHelpDeskForm from '&src/modules/HelpDesk/ManageHelpDeskForm';
import HelpdeskServices from '&src/services/helpdesk';
import { getActionsColumn } from '&src/utils';

const ManageHelpDesk = () => {
  const theme = useTheme();
  const { value: showLoader, setValue: setShowLoader } = useToggle();
  const { errorNotification, successNotification } = useStatusWiseAlert();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [open, setOpen] = useState(false);
  const [ticketData, setTicketData] = useState(null);
  const [allTicketsDetails, setAllTicketsDetails] = useState({});
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const handleClose = () => {
    setTicketData(null);
    setOpen(false);
    setTicketData({})
  };

  const fetchAllTicketsData = async () => {
    setShowLoader(true);
    try {
      const response = await HelpdeskServices.getAllHelpdesks();
      setAllTicketsDetails(response?.data);
      console.log('fetch', response?.data)
      successNotification("Fetched data successfully");
      handleClose()
    } catch (error) {
      setAllTicketsDetails([]);
      errorNotification(error?.response?.data?.message || "Failed to fetch");
    } finally {
      setShowLoader(false);
    }
  };

  useEffect(() => {
    fetchAllTicketsData()
  }, [])

  const handleOpen = () => {
    setTicketData(null);
    setOpen(true);
  };

  const handleDelete = async () => {
    setShowLoader(true);
    try {
      await HelpdeskServices.deleteHelpdesk(ticketData?.id);
      successNotification('Ticket deleted successfully');
      fetchAllTicketsData();
      setShowLoader(false);
      setConfirmDialogOpen(false);
    } catch (error) {
      setShowLoader(false);
      console.error('[ERROR] Delete failed:', error);
      errorNotification(error?.response?.data?.message || 'Failed to delete ticket');
    }
  };

  const onEditClick = (value) => {
    setTicketData(value);
    setOpen(true);
  };

  const onDeleteClick = (value) => {
    setTicketData(value);
    setConfirmDialogOpen(true);
  };

  const columns = useMemo(() => {
    return [
      ...HELP_DESK_TABLE_COLUMNS,
      getActionsColumn({
        width: '160',
        onView: !isCO ? onEditClick : undefined,
        onReply: isCO ? onEditClick : undefined,
        onDelete: isBO ? onDeleteClick : undefined,
        onMgs: true
      }),
    ];
  }, [handleDelete]);

  return (
    <>
      <SectionHeader
        showButton={!isCO}
        title="Help Desk"
        buttonText={isMobile ? "Add" : "Add Query"}
        buttonProps={{
          endIcon: <Person fontSize="large" />,
        }}
        onButtonClick={handleOpen}
      />
      {isCO &&
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <AnalyticsCard title="Open Tickets" value={allTicketsDetails?.openTkCount} icon={<BugReport sx={{ fontSize: '50px' }} />} color="#ff9800" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <AnalyticsCard title="Pending Tickets" value={allTicketsDetails?.pendingTkCount} icon={<PendingActionsOutlined sx={{ fontSize: '50px' }} />} color="#2196f3" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <AnalyticsCard title="Resolved" value={allTicketsDetails?.resolvedTkCount} icon={<DoneAllOutlined sx={{ fontSize: '50px' }} />} color="#4caf50" />
          </Grid>
        </Grid>
      }
      <DialogWithHeader
        open={open}
        onClose={handleClose}
        headerText={ticketData ? "Ticket Information" : "Add New Query"}
      >
        <ManageHelpDeskForm
          updateDetails={ticketData}
          fetchAllTickets={fetchAllTicketsData}
          handleClose={handleClose}
          formClosed={open || confirmDialogOpen}
        />
      </DialogWithHeader>

      <DataGridTable
        searchLabel='Search'
        placeholder="Account No / Ticket Name"
        searchKey1='ticketName'
        searchKey2='accountNo'
        showSearch
        columns={columns}
        rows={allTicketsDetails?.ticketsList || []}
        getRowId={(row) => row.id}
      />

      <ConfirmationDialogWithReason
        title='Delete Confirmation'

        description={
          <Typography>Are you sure you want to delete{" "}<Typography component='span' fontWeight={700}>{ticketData?.ticketName}</Typography>{" "}Ticket?</Typography>}
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        onConfirm={() => handleDelete()}
        confirmText='Delete'
        confirmTextColor='error'
        isLoading={showLoader}
        showReasonSec={false}
      />

      {(showLoader || showLoader) && <FullScreenLoader />}
    </>

  );
};

export default ManageHelpDesk;
