import {
    EmailField,
    FormField,
    MobileNoField
} from "&src/components/FormFields";
import {
    DESIGNATIONS
} from "&src/constants/PaymentAggregratorConstant";
import {
    Button,
    Divider,
    Grid,
    Typography,
    Paper,
    Box
} from "@mui/material";
import AutocompleteDropdown from "../AutocompleteDropdown";
import DialogWithHeader from "../Dialog/DialogWithHeader";
import FullScreenLoader from "../Loaders/FullScreenLoader";

const POForm = ({ 
    openPOModal, 
    setOpenPOModal, 
    poFormDetails, 
    generatePO, 
    applicationId, 
    aggregatorId, 
    isLoading,
    inline = false,
    onCancel
}) => {

    const { values, errors, touched, handleChange, handleBlur, handleSubmit, resetForm, setFieldTouched, setFieldValue } = poFormDetails;

    const handleClose = () => {
        if (setOpenPOModal) setOpenPOModal(false);
        resetForm();
    };

    const renderFormContent = () => (
        <form onSubmit={(event) => {
            event.preventDefault();
            handleSubmit(applicationId, aggregatorId);
        }}
            noValidate
        >
            <Grid container spacing={2}>
                <Grid item xs={12}>
                    <Typography fontWeight={500} variant="subtitle2" color="text.secondary">
                        Branch / RCC Details
                    </Typography>
                </Grid>
                <Grid item xs={12}>
                    <Divider />
                </Grid>
                {/* Branch Name */}
                <Grid item xs={12} sm={inline ? 6 : 12}>
                    <FormField
                        required
                        name="branchName"
                        label="Branch Name"
                        value={values?.branchName}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        helperText={touched?.branchName && errors?.branchName}
                    />
                </Grid>
                {/* Region Name */}
                <Grid item xs={12} sm={inline ? 6 : 12}>
                    <FormField
                        required
                        name="regionName"
                        label="Region Name"
                        value={values?.regionName}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        helperText={touched?.regionName && errors?.regionName}
                    />
                </Grid>

                {/* Contact Person Name */}
                <Grid item xs={12} sm={inline ? 6 : 12}>
                    <FormField
                        required
                        name="rccContactPersonName"
                        label="Contact Person Name"
                        value={values?.rccContactPersonName}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        helperText={touched?.rccContactPersonName && errors?.rccContactPersonName}
                    />
                </Grid>

                {/* Mail Id */}
                <Grid item xs={12} sm={inline ? 6 : 12}>
                    <EmailField
                        required
                        name="rccMailId"
                        label="Mail Id"
                        value={values?.rccMailId}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched?.rccMailId && Boolean(errors?.rccMailId)}
                        helperText={touched?.rccMailId && errors?.rccMailId}
                    />
                </Grid>

                {/* Mobile Number */}
                <Grid item xs={12} sm={inline ? 6 : 12}>
                    <MobileNoField
                        required
                        name="rccMobileNo"
                        label="Mobile Number"
                        value={values?.rccMobileNo}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched?.rccMobileNo && Boolean(errors?.rccMobileNo)}
                        helperText={touched?.rccMobileNo && errors?.rccMobileNo}
                    />
                </Grid>
                <Grid item xs={12} sx={{ mt: 1 }}>
                    <Typography fontWeight={500} variant="subtitle2" color="text.secondary">
                        Authorised Person Details
                    </Typography>
                </Grid>
                <Grid item xs={12}>
                    <Divider />
                </Grid>
                <Grid item xs={12} sm={inline ? 6 : 12}>
                    <FormField
                        required
                        name="authorisedPersonName"
                        label="Person Name"
                        value={values?.authorisedPersonName}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        helperText={touched?.authorisedPersonName && errors?.authorisedPersonName}
                    />
                </Grid>
                <Grid item xs={12} sm={inline ? 6 : 12}>
                    <AutocompleteDropdown
                        label="Designation"
                        name="authorisedPersonDesignation"
                        options={DESIGNATIONS}
                        value={values.authorisedPersonDesignation}
                        setFieldValue={setFieldValue}
                        handleBlur={handleBlur}
                        touched={touched}
                        errors={errors}
                        required
                    />
                </Grid>
                <Grid item xs={12} display="flex" justifyContent="flex-end" gap={2} sx={{ mt: 3 }}>
                    <Button
                        variant="outlined"
                        onClick={inline ? onCancel : handleClose}
                        sx={{ px: 4 }}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        color="success"
                        sx={{ px: 4 }}
                    >
                        Generate PO
                    </Button>
                </Grid>
            </Grid>
        </form>
    );

    if (inline) {
        return (
            <Paper variant="outlined" sx={{ p: 4, borderRadius: "12px", border: "1px solid #cbd5e1", mt: 2 }}>
                {isLoading && <FullScreenLoader />}
                <Typography variant="h6" fontWeight={700} color="primary" sx={{ mb: 2 }}>
                    Required PO Details
                </Typography>
                {renderFormContent()}
            </Paper>
        );
    }

    return (
        <DialogWithHeader
            open={openPOModal}
            onClose={handleClose}
            maxWidth="sm"
            headerText="Required PO Details"
        >
            {isLoading && <FullScreenLoader />}
            {renderFormContent()}
        </DialogWithHeader>
    );
};

export default POForm;
