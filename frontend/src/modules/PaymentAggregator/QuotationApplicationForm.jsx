import DataGridTable from '&src/components/Tables/DataGrid';
import useStatusWiseAlert from "&src/components/ToastNotifications/useStatusWiseAlert";
import { user_role } from '&src/constants/PaymentAggregratorConstant';
import addApplicationForm from '&src/services/PaymentAggregator/applicationServices';
import { generatePayload } from '&src/utils';
import { applicationFormSchema } from '&src/utils/validationSchemas';
import { Help } from '@mui/icons-material';
import {
  Button,
  Grid,
  IconButton,
  TextField,
  Tooltip
} from '@mui/material';
import { useFormik } from 'formik';
import { useEffect, useMemo, useState } from 'react';

// Default Initial Values
const APPLICATION_FORM_VALUES = {
  userType: 'existing',
  customerName: '',
  accountNo: '',
  averageBalance: 0,
  email: '',
  mobileNo: '',
  address: '',
  date: '',
  integrateWith: '',
  projection: [],
  files: [],
  projectionQuotations: [{
    aggregratorCode: '',
    aggregratorName: '',
    quoteBudget: '',
  }],
};


const QuotationApplicationForm = ({ updateDetails, fetchEmployees, handleClose, formClosed }) => {
  const { errorNotification, successNotification } = useStatusWiseAlert();

  const [isLoading, setLoading] = useState(false);

  const addAndUpdateEmployeeDetails = async (values) => {
    const isUpdate = Boolean(values?.employeeId);
    const payload = generatePayload(values);
    const newPayload = {
      ...payload,
      ...(!isUpdate && { employeeId: values.employeeId })
    };

    setLoading(true);
    try {
      const response = isUpdate
        ? await addApplicationForm.updateEmployee(values.employeeId, newPayload)
        : await addApplicationForm.addEmployee(newPayload);

      if (response?.status === 200 || response?.status === 201) {
        fetchEmployees();
        handleClose();
        successNotification(
          isUpdate ? 'Employee updated successfully' : 'Employee added successfully'
        );
      } else {
        errorNotification(response?.data?.message || "Operation failed, please try again later.");
      }
    } catch (err) {
      console.error('[ERROR] API Error:', err);
      errorNotification(err?.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const formik = useFormik({
    initialValues: APPLICATION_FORM_VALUES,
    validationSchema: applicationFormSchema,
    onSubmit: addAndUpdateEmployeeDetails,
    validateOnBlur: true,
    validateOnChange: true,
  });

  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    resetForm,
  } = formik;

  const data = [
    {
      id: '1',
      channels: 'Internet Banking',
      rate: '23'
    },
    {
      id: '2',
      channels: 'UPI',
      rate: '23'

    }
    , {
      id: '3',
      channels: 'Credit Card',
      rate: '23'

    }, {
      id: '4',
      channels: 'Debit Card Upto 2000',
      rate: '23'

    },
    {
      id: '4',
      channels: 'Debit Card Above 2000',
    },
    {
      id: '5',
      channels: 'Other Banks',
    }]

  const PROJECTION_TABLE_COLUMNS = [
    {
      field: 'id',
      headerName: 'Sr No.',
      flex: 0.3,
      align: 'center',
      renderCell: (params) => {
        const index = params.api.getAllRowIds().indexOf(params.id);
        return index + 1;
      },
    },
    {
      field: 'channels',
      headerName: 'Channels',
      flex: 1,
    },

  ];


  const columns = useMemo(() => {
    return [
      ...PROJECTION_TABLE_COLUMNS,
      {
        field: 'rate',
        headerName: 'Rate',
        flex: 1,
        renderCell: (params) =>
          user_role === 'AEPA' ? (
            <TextField
              sx={{ marginTop: '5px' }}
              size="small"
              placeholder="Enter Rate"
              value={params?.row?.rate || ''}
            />
          ) : (
            params?.row?.rate || '-'
          ),
      },

      user_role === 'CO' && {
        field: 'markup',
        headerName: 'Mark Up',
        flex: 1,
        sortable: false,
        filterable: false,
        renderHeader: () => (
          <>
            <Button variant="outlined" size="small">
              Add Mark Up
            </Button>
            <Tooltip title="Modify" placement="top">
              <IconButton color="primary">
                <Help />
              </IconButton>
            </Tooltip>
          </>
        ),
        renderCell: (params) => (
          <TextField
            sx={{ marginTop: '5px' }}
            size="small"
            placeholder="Enter Markup"
            value={params?.row?.markUp || ''}
          />
        ),
      },
    ].filter(Boolean); // Remove falsy entries if user_role !== 'CO'
  }, [user_role]);

  useEffect(() => {
    if (updateDetails) {
      const newValues = {
        ...APPLICATION_FORM_VALUES,
        ...updateDetails,
      };
      formik.setValues(newValues);
    }
  }, [updateDetails]);

  useEffect(() => {
    if (!formClosed) resetForm();
  }, [formClosed]);

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <DataGridTable columns={columns} rows={data} pageSize={data?.length} hideFooter />
        </Grid>
        <Grid item xs={4} />
        <Grid item xs={4} />
        <Grid item xs={4}>
          <Button
            fullWidth
            type="submit"
            variant="contained"
            color="primary"
            disabled={isLoading}
          >
            {isLoading ? 'Submitting...' : 'Submit'}
          </Button>
        </Grid>
      </Grid>
    </form >
  );
};

export default QuotationApplicationForm;
