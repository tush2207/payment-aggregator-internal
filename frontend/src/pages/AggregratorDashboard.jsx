import DialogWithHeader from '&src/components/Dialog/DialogWithHeader';
import { NumberField } from '&src/components/FormFields';
import SectionHeader from '&src/components/Headers/SectionHeader';
import FullScreenLoader from '&src/components/Loaders/FullScreenLoader';
import StatusChipOrSelect from '&src/components/StatusChipOrSelect';
import ExpandableTable from '&src/components/Tables/ExpandableTable';
import TransactionRateTable from '&src/components/Tables/TransactionRateTable';
import useStatusWiseAlert from "&src/components/ToastNotifications/useStatusWiseAlert";
import { AGGREGRATOR_DASHBOARD_TABLE_DATA, GET_ALL_APPLICATION_RESPONSE } from '&src/data/data';
import useToggle from '&src/hooks/useToggle';
import applicationServices from '&src/services/applications';
import { RS } from '&src/utils';
import { Box, Button, Typography } from '@mui/material';
import { useEffect, useState } from 'react';

const AGGREGRATOR_DASHBOARD_TABLE_COLUMNS = [
  {
    field: "srNo",
    headerName: "Sr No.",
    flex: 0.3,
    sortable: false,
    filterable: false,
    valueGetter: (params) => params.api.getRowIndex(params.AggregratorCode) + 1,
  },
  {
    field: 'category',
    headerName: 'Category',
    flex: 0.5,
  },
  {
    field: 'avgTransactionSize',
    headerName: 'Average Ticket Size',
    flex: 0.5,
  },
  {
    field: 'avgTransactionYearly',
    headerName: 'Average Transaction',
    flex: 0.5,
  },
  {
    field: 'status',
    headerName: 'Status',
    flex: 0.4,
    renderCell: (params) => (
      <StatusChipOrSelect value={params?.row?.status} type="status" />
    ),
  },
];

function transformProjectionData(input) {
  return Object.entries(input)?.map(([channel, rate], index) => ({
    id: index + 1,
    channel,
    rate,
  }));
}


const AggregratorDashboard = () => {
  const { errorNotification, successNotification } = useStatusWiseAlert()
  const { value: isLoading, setValue: setShowLoader } = useToggle();
  const [quoteBasedOnChannels, setQuoteBasedOnChannels] = useState([]);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedQuoteId, setSelectedQuoteId] = useState(null);
  const [error, setError] = useState({});
  const [allApplicationDetails, setAllApplicationDetails] = useState([]);


  const fetchAllApplicationsData = async () => {
    setShowLoader(true);
    try {
      const response = await applicationServices.getAllApplications();
      setAllApplicationDetails(response?.data);
      setShowLoader(false);
      successNotification('fetch application data successfully.')
    } catch (error) {
      setShowLoader(false);
      //TODO: remove static data
      setAllApplicationDetails(GET_ALL_APPLICATION_RESPONSE);
      console.error('[ERROR] Failed to fetch application data:', error);
      errorNotification(error?.response?.data?.message || 'Failed to fetch application data');
    };
  };


  useEffect(() => {
    fetchAllApplicationsData()
  }, [])

  const handleChange = (event) => {
    const { name, value } = event.target;

    setQuoteBasedOnChannels((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear the error as user starts typing
    setError((prev) => ({
      ...prev,
      [name]: '',
    }));
  };

  const handleConfirmSubmit = () => {
    const transformedProjection = transformProjectionData(quoteBasedOnChannels);
    console.log(
      {
        quoteId: selectedQuoteId,
        projection: transformedProjection,
      },
      'quoteBasedOnChannels'
    );
    successNotification('Quotation Added Successfully')
    setQuoteBasedOnChannels([]);
    setConfirmDialogOpen(false);
    setSelectedQuoteId(null);
    window.location.reload();
  };


  const handleCancelSubmit = () => {
    setConfirmDialogOpen(false);
    setSelectedQuoteId(null);
  };

  const handleSubmitClick = ({ id }) => {
    setSelectedQuoteId(id);
    setConfirmDialogOpen(true);
  };

  const PROJECTION_TABLE_COLUMNS = [
    {
      field: 'id',
      headerName: 'Sr No.',
      flex: 0.1,
      align: 'center',
      headerAlign: 'center',

    },
    {
      field: 'channel',
      headerName: 'Channel',
      flex: 0.6,
    },
    {
      field: 'rate',
      headerName: 'Rate',
      flex: 0.5,
      renderCell: (params) =>
        params?.row?.rate === '' ? (
          <NumberField
            name={params?.row?.channel}
            InputProps={{
              startAdornment:
                <Typography className='mr-2'>
                  {RS}
                </Typography>
            }}
            placeholder="Enter Rate"
            value={quoteBasedOnChannels[params?.row?.channel]}
            onChange={handleChange}
            // error={!!error[params?.row.channel]}
            helperText={error[params?.row.channel]}
          />
        ) : (
          params?.row?.rate
        ),
    },
  ];

  return (
    <>
      <SectionHeader title="Payment Aggregator" />

      <ExpandableTable
        columns={AGGREGRATOR_DASHBOARD_TABLE_COLUMNS}
        rows={allApplicationDetails}
        getRowId={(row) => row?.aggregatorId}
        nestedRowWidth='50%'
        renderNestedRow={(row) => (
          <Box p={0}>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              mb={1}
              p={0}
            >
              <Typography variant="h6" fontWeight="bold">
                Add Quotation As Per Projections
              </Typography>
              {row?.status === 'pending' &&
                <Button variant="contained" size='small' onClick={() => handleSubmitClick({ id: row?.id, projection: row?.projection })}>Submit Quote</Button>
              }
            </Box>
            <TransactionRateTable projectionDetails={row?.projectionDetails || []} />
          </Box>
        )}
      />

      <DialogWithHeader
        maxWidth='xs'
        open={confirmDialogOpen}
        onClose={handleCancelSubmit}
        headerText="Confirmation"
      >
        <Box>
          <Typography mb={2} component='div'>
            Are you sure you want to submit the quote? After submission, you won't be able to edit this quote.
          </Typography>

          <Box display="flex" justifyContent="flex-end" gap={2}>
            <Button onClick={handleCancelSubmit} variant="outlined">
              Cancel
            </Button>
            <Button onClick={handleConfirmSubmit} variant="contained" color="primary">
              Confirm
            </Button>
          </Box>
        </Box>
      </DialogWithHeader>

      {isLoading && <FullScreenLoader />}
    </>
  );
};

export default AggregratorDashboard;


