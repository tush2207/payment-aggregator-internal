import { EmailField, FormField, MobileNoField, NumberField, TextAreaField } from '&src/components/FormFields';
import useStatusWiseAlert from "&src/components/ToastNotifications/useStatusWiseAlert";
import { Box, Button, Chip, Grid, IconButton, Stack, styled, Tooltip, Typography } from '@mui/material';
import { useFormik } from 'formik';
import { useEffect, useState } from 'react';

import FullScreenLoader from '&src/components/Loaders/FullScreenLoader';
import { HELP_DESK_FORM_VALUES, user_Id, user_role } from '&src/constants/PaymentAggregratorConstant';
import HelpdeskServices from '&src/services/helpdesk';
import { helpDeskFormSchema } from '&src/utils/validationSchemas';
import applicationServices from '&src/services/applications';
import { InfoOutlined, VerifiedOutlined, VerifiedRounded } from '@mui/icons-material';

const PriorityChip = styled(Chip)(({ theme }) => ({
    padding: "18px 22px",
    fontSize: "1rem",
    borderRadius: "14px",
    fontWeight: 600,
    cursor: "pointer",
    minWidth: "110px",
    justifyContent: "center",
    transition: "0.25s ease",
    border: "none",

    "&:hover": {
        transform: "translateY(-2px)",
        boxShadow: "0 6px 14px rgba(0,0,0,0.18)",
    },

    "&.selected": {
        color: "#fff",
        boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
        transform: "translateY(-2px)",
    }
}));


const ManageHelpDeskForm = ({ updateDetails, fetchAllTickets, formClosed } = {}) => {
    console.log('updateDetails', updateDetails)
    const { errorNotification, successNotification } = useStatusWiseAlert();
    const [isLoading, setLoading] = useState(false);
    const [verified, setVerified] = useState(false)

    const addOrUpdateTicket = async (values) => {
        console.log(values, resetForm, 'addOrUpdateTicket')
        const isUpdate = Boolean(values?.id);
        setLoading(true);
        try {
            const response = isUpdate
                ? await HelpdeskServices.updateHelpdesk(values.id, values)
                : await HelpdeskServices.addHelpdesk(values);

            if (response?.status === 200 || response?.status === 201) {
                setLoading(false);
                fetchAllTickets?.();
                resetForm();
                successNotification(isUpdate ? 'Tickets updated successfully' : 'Tickets added successfully');
            } else {
                setLoading(false);
                errorNotification(response?.data?.message || 'Operation failed, please try again later.');
            }
        } catch (err) {
            setLoading(false);
            console.error('[ERROR] API Error:', err);
            errorNotification(err?.response?.data?.message || 'Something went wrong.');
        }

    };

    const formik = useFormik({
        initialValues: HELP_DESK_FORM_VALUES,
        validationSchema: helpDeskFormSchema,
        onSubmit: addOrUpdateTicket,
        validateOnBlur: true,
        validateOnChange: true,
    });

    useEffect(() => {
        if (updateDetails) {
            formik?.setValues({
                ...HELP_DESK_FORM_VALUES,
                ...updateDetails,
            });
        }
    }, [updateDetails]);

    const { values, errors, touched, handleChange, handleBlur, handleSubmit, resetForm } = formik;

    const renderError = (field) => touched[field] && errors[field] ? errors[field] : '';
    const disabled = updateDetails?.creatorId !== user_Id && (updateDetails?.id || updateDetails?.creatorId);

    const updateStatus = async (status) => {
        await HelpdeskServices.updateHelpdesk(values.id, { ...values, status });
        fetchAllTickets?.();
    };

    useEffect(() => {
        if (!formClosed) {
            formik.resetForm();
            setVerified(false);
        }
    }, [formClosed]);

    useEffect(() => {
        if (!updateDetails) {
            formik.setValues({
                ...formik.initialValues,
                applicationNo: values?.applicationNo
            });
            setVerified(false);
        }
    }, [values?.applicationNo]);

    const fetchAllApplicationDetais = async () => {
        if (!values.applicationNo)
            return errorNotification('Application No is required.');

        try {
            const response = await applicationServices.getApplicationById(values.applicationNo)

            console.log(response, 'response')
            if (response?.data !== null) {
                setLoading(false);
                const { customerName, mobileNo, email, accountNo } = response?.data || {}
                formik?.setValues({
                    ...values,
                    customerName: customerName,
                    customerEmail: email,
                    customerMobileNo: mobileNo,
                    accountNo: accountNo,
                });
                setVerified(true)
                successNotification('Application details fetched successfully');
            } else {
                setVerified(false)
                setLoading(false);
                errorNotification("Invalid Application Number. Please verify and try again.");
            }
        } catch (err) {
            setLoading(false);
            setLoading(false);
            console.error('[ERROR] API Error:', err);
            errorNotification("Invalid Application Number. Please verify and try again.");
        }
    }

    return (
        <>
            <form onSubmit={formik?.handleSubmit} noValidate>
                {isLoading && <FullScreenLoader />}
                <Grid container spacing={2}>
                    <Grid item xs={12} md={updateDetails?.id ? 12 : 9}>
                        <NumberField
                            required
                            name="applicationNo"
                            label="Application Number"
                            value={values?.applicationNo}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={touched?.applicationNo && Boolean(errors?.applicationNo)}
                            helperText={touched?.applicationNo && errors?.applicationNo}
                            disabled={disabled}

                        />

                    </Grid>
                    {!updateDetails?.id && <Grid item xs={12} md={3}>
                        {verified ?
                            <Box height='100%' display='flex' mt={5} gap={2}>
                                <Typography variant='subtitle1' color='green'>
                                    <VerifiedRounded /> Verified
                                </Typography>
                            </Box>
                            :
                            <Box height={71} display='flex' justifyContent='flex-end' alignItems='end' gap={2}>
                                <Button color={"success"} variant={verified ? 'contained' : 'outlined'} fullWidth onClick={fetchAllApplicationDetais}>
                                    Verify
                                </Button>
                                <Tooltip title={
                                    <Typography variant='caption'>
                                        Note: Click <b>Verify</b> button and <b>fetch customer details</b>.
                                    </Typography>
                                } placement='top' arrow>
                                    <IconButton color="primary">
                                        <InfoOutlined />
                                    </IconButton>
                                </Tooltip>
                            </Box>

                        }
                    </Grid>}
                    <Grid item xs={12} md={12}>
                        <NumberField
                            required
                            disabled={disabled}
                            name="accountNo"
                            label="Account Number"
                            value={values?.accountNo}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={touched?.accountNo && Boolean(errors?.accountNo)}
                            helperText={touched?.accountNo && errors?.accountNo}
                        />                    </Grid>
                    <Grid item xs={12} md={12}>
                        <FormField
                            required
                            disabled={disabled}
                            name="customerName"
                            label="Name of the customer / Institution"
                            value={values?.customerName}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            helperText={touched?.customerName && errors?.customerName}
                        />
                    </Grid>
                    <Grid item xs={12} md={12}>
                        <FormField name="ticketName" label="Queru / Issue /Ticket Name"
                            disabled={disabled}
                            value={values?.ticketName}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            helperText={touched?.ticketName && errors?.ticketName}
                        />
                    </Grid>
                    <Grid item xs={12} md={12}>
                        <Stack direction="row" spacing={2} sx={{ mt: 1, mb: 1 }}>
                            <PriorityChip
                                disabled={disabled}
                                label="Low"
                                onClick={() => formik.setFieldValue("priority", "low")}
                                className={values.priority === "low" ? "selected" : ""}
                                sx={{
                                    background: values.priority === "low"
                                        ? "linear-gradient(45deg,#4caf50,#2e7d32)"
                                        : "#e8f5e9",
                                    color: values.priority === "low" ? "#fff" : "#2e7d32",
                                }}
                            />

                            <PriorityChip
                                disabled={disabled}
                                label="Medium"
                                onClick={() => formik.setFieldValue("priority", "medium")}
                                className={values.priority === "medium" ? "selected" : ""}
                                sx={{
                                    background: values.priority === "medium"
                                        ? "linear-gradient(45deg,#2196f3,#1565c0)"
                                        : "#e3f2fd",
                                    color: values.priority === "medium" ? "#fff" : "#1565c0",
                                }}
                            />

                            <PriorityChip
                                disabled={disabled}
                                label="High"
                                onClick={() => formik.setFieldValue("priority", "high")}
                                className={values.priority === "high" ? "selected" : ""}
                                sx={{
                                    background: values.priority === "high"
                                        ? "linear-gradient(45deg,#f44336,#b71c1c)"
                                        : "#ffebee",
                                    color: values.priority === "high" ? "#fff" : "#b71c1c",
                                }}
                            />
                        </Stack>

                        {renderError("priority") && (
                            <Typography color="error" variant="body2">
                                {renderError("priority")}
                            </Typography>
                        )}
                    </Grid>



                    <Grid item xs={12} md={12}>
                        <EmailField
                            required
                            disabled={disabled}
                            name="customerEmail"
                            label="Customer Email"
                            value={values?.customerEmail}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={touched?.customerEmail && Boolean(errors?.customerEmail)}
                            helperText={touched?.customerEmail && errors?.customerEmail}
                        />
                    </Grid>
                    <Grid item xs={12} md={12}>
                        <MobileNoField
                            required
                            disabled={disabled}
                            name="customerMobileNo"
                            label="Customer Mobile Number"
                            value={values?.customerMobileNo}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={touched?.customerMobileNo && Boolean(errors?.customerMobileNo)}
                            helperText={touched?.customerMobileNo && errors?.customerMobileNo}
                        />
                    </Grid>
                    <Grid item xs={12} md={12}>
                        <FormField
                            required
                            disabled={disabled}
                            name="branchName"
                            label="Branch Name"
                            value={values?.branchName}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            helperText={touched?.branchName && errors?.branchName}
                        />
                    </Grid>
                    <Grid item xs={12} md={12}>
                        <FormField
                            required
                            disabled={disabled}
                            name="regionName"
                            label="Region Name"
                            value={values?.regionName}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            helperText={touched?.regionName && errors?.regionName}
                        />
                    </Grid>
                    <Grid item xs={12} md={12}>
                        <FormField
                            required
                            disabled={disabled}
                            name="zoneName"
                            label="Zone Name"
                            value={values?.zoneName}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            helperText={touched?.zoneName && errors?.zoneName}
                        />
                    </Grid>
                    <Grid item xs={12} md={12}>
                        <TextAreaField
                            required
                            disabled={disabled}
                            name="description"
                            label="Description"
                            multiline
                            rows={2}
                            value={values?.description}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={touched?.description && Boolean(errors?.description)}
                            helperText={touched?.description && errors?.description}
                        />
                    </Grid>
                    {
                        user_role === 'CO' && <Grid item xs={12} md={12}>
                            <TextAreaField
                                name="remark"
                                label="Remark"
                                multiline
                                rows={2}
                                value={values?.remark}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                error={touched?.remark && Boolean(errors?.remark)}
                                helperText={touched?.remark && errors?.remark}
                                disabled={values?.status === 'resolved'}
                            />
                        </Grid>
                    }
                    <Grid item xs={4} />
                    {!updateDetails?.id ? (
                        <>
                            <Grid item xs={4}>
                                <Button fullWidth variant="outlined" onClick={() => formik.resetForm()}>
                                    Reset
                                </Button>
                            </Grid>
                            <Grid item xs={4}>
                                <Button fullWidth variant="contained" color="primary" type='sumbit'>
                                    Submit
                                </Button>
                            </Grid>
                        </>) :
                        (<>
                            {user_role === 'CO' &&
                                <>
                                    <Grid item xs={4}>
                                        <Button fullWidth variant="outlined" color="primary" disabled={values?.status === 'inprogress' || values?.status === 'resolved'} onClick={() => updateStatus("inprogress")}>
                                            In Progress
                                        </Button>
                                    </Grid>
                                    <Grid item xs={4}>
                                        <Button fullWidth variant="contained" disabled={values?.status === 'resolved'} color="success" onClick={() => updateStatus("resolved")}>
                                            Resolved
                                        </Button>
                                    </Grid>
                                </>}
                        </>
                        )}
                </Grid >
            </form >

        </>
    );
};

export default ManageHelpDeskForm;
