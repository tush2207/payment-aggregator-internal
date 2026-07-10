import { LockOpenOutlined, LockPerson, Person } from '@mui/icons-material';
import { IconButton, Typography, useMediaQuery, useTheme } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';

import DialogWithHeader from '&src/components/Dialog/DialogWithHeader';
import SectionHeader from '&src/components/Headers/SectionHeader';
import DataGridTable from '&src/components/Tables/DataGrid';
import useStatusWiseAlert from "&src/components/ToastNotifications/useStatusWiseAlert";
import { MANAGE_AGGREGATOR_TABLE_COLUMNS } from '&src/constants/PaymentAggregratorConstant';
import useAggregatorDetails from '&src/hooks/useAggregatorDetails';
import useToggle from '&src/hooks/useToggle';
import ManageAggregatorForm from '&src/modules/ManageAggregrator/ManageAggregatorForm';
import { getActionsColumn } from '&src/utils';
import FullScreenLoader from '&src/components/Loaders/FullScreenLoader';
import manageAggregatorServices from '&src/services/manageAggregator';
import ConfirmationDialogWithReason from '&src/components/Dialog/ConfirmationDialogWithReason';
import StatusChipOrSelect from '&src/components/StatusChipOrSelect';

//TODO: Add active  & inactive API calls
const ManageAggregator = () => {
  const theme = useTheme();
  const { value: isLoading, setValue: setShowLoader } = useToggle();
  const { errorNotification, successNotification } = useStatusWiseAlert();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [open, setOpen] = useState(false);
  const [aggregatorData, setAggregatorData] = useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const { isLoading: showLoader, aggregatorDetails, fetchAllAggregators } = useAggregatorDetails();

  const handleOpen = () => {
    setAggregatorData(null);
    setOpen(true);
  };
  const handleClose = () => {
    setAggregatorData(null);
    setOpen(false);
  };

  const handleDelete = async (row) => {
    setShowLoader(true);
    try {
      await manageAggregatorServices.deleteAggregator(aggregatorData?.aggregatorId);
      successNotification('Aggregator deleted successfully');
      fetchAllAggregators?.();
      setShowLoader(false);
      setConfirmDialogOpen(false)
    } catch (error) {
      setShowLoader(false);
      console.error('[ERROR] Delete failed:', error);
      errorNotification(error?.response?.data?.message || 'Failed to delete Aggregator');
    }
  };

  const onEditClick = (value) => {
    setAggregatorData(value);
    setOpen(true);
  };

  const onDeleteClick = (value) => {
    setAggregatorData(value);
    setConfirmDialogOpen(true)
  }

  const columns = useMemo(() => {
    return [
      ...MANAGE_AGGREGATOR_TABLE_COLUMNS,
      {
        field: 'status',
        headerName: 'Status',
        flex: 0.5,
        renderCell: (params) => {

          const isUserActive = params?.row?.status === 'active' ? 'green' : 'red';

          return (
            <>
              <StatusChipOrSelect
                value={params?.row?.status}
                type="status"
              />
              <IconButton>
             
                <LockPerson style={{
                  color: 'red'
                }} />
                <LockOpenOutlined style={{
                  color: 'green'
                }} />
              </IconButton>

            </>
          )
        },
      },
      getActionsColumn({
        onEdit: onEditClick,
        onDelete: onDeleteClick,
        flex: 0.3
      }),
    ];
  }, [handleDelete]);

  return (
    <>
      <SectionHeader
        showButton
        title="Manage Aggregator"
        buttonText={isMobile ? "Add" : "Add Aggregator"}
        buttonProps={{
          endIcon: <Person fontSize="large" />,
        }}
        onButtonClick={handleOpen}
      />

      <DialogWithHeader
        open={open}
        onClose={handleClose}
        headerText={aggregatorData ? "Update Aggregator" : "Add New Aggregator"}
      >
        <ManageAggregatorForm
          updateDetails={aggregatorData}
          fetchAllAggregators={fetchAllAggregators}
          handleClose={handleClose}
          formClosed={open || confirmDialogOpen}
        />
      </DialogWithHeader>

      <DataGridTable
        showSearch
        placeholder='Enter Aggregator Name'
        searchLabel='Search Aggregator Name'
        searchKey1='aggregatorName'
        tableHeight={600}
        columns={columns}
        rows={aggregatorDetails || []}
        getRowId={(row) => row.aggregatorId}
      />

      <ConfirmationDialogWithReason
        title='Delete Confirmation'
        description={
          <Typography>Are you sure you want to delete{" "}<Typography component='span' fontWeight={700}>{aggregatorData?.aggregatorName}</Typography>{" "}Payment Aggregator?</Typography>}
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        onConfirm={() => handleDelete()}
        confirmText='Delete'
        confirmTextColor='error'
        isLoading={isLoading || showLoader}
      />

      {(isLoading || showLoader) && <FullScreenLoader />}
    </>
  );
};

export default ManageAggregator;
