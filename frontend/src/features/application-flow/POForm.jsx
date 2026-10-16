import React from "react";
import {
    EmailField,
    FormField,
    MobileNoField
} from "&src/components/form/FormFields";
import {
    DESIGNATIONS
} from "&src/constants/PaymentAggregratorConstant";
import {
    Button,
    Divider,
    Grid,
    Typography,
    Paper,
    Box,
    Stack,
    CircularProgress
} from "@mui/material";
import AssignmentIcon from "@mui/icons-material/Assignment";
import BusinessIcon from "@mui/icons-material/Business";
import BadgeIcon from "@mui/icons-material/Badge";
import DescriptionIcon from "@mui/icons-material/Description";
import AutocompleteDropdown from "@components/AutocompleteDropdown";
import DialogWithHeader from "@components/Dialog/DialogWithHeader";
import FullScreenLoader from "@components/feedback/FullScreenLoader";

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
    const { values, errors, touched, handleChange, handleBlur, handleSubmit, resetForm, setFieldValue } = poFormDetails;

    const handleClose = () => {
        if (setOpenPOModal) setOpenPOModal(false);
        resetForm();
    };

    const renderFormContent = () => (
        <form onSubmit={handleSubmit} noValidate>
            <Grid container spacing={2.5}>
                {/* Section 1: Branch & RCC Details */}
                <Grid item xs={12}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 2.5,
                            borderRadius: "10px",
                            border: "1px solid #cbd5e1",
                            bgcolor: "#f8fafc"
                        }}
                    >
                        <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                            <BusinessIcon sx={{ color: "#0E4F8D", fontSize: 20 }} />
                            <Typography variant="subtitle2" fontWeight={800} sx={{ color: "#0E4F8D", fontSize: "13.5px" }}>
                                Branch & RCC Communication Details
                            </Typography>
                        </Box>
                        <Divider sx={{ mb: 2 }} />

                        <Grid container spacing={2}>
                            {/* Branch Name */}
                            <Grid item xs={12} sm={6}>
                                <FormField
                                    required
                                    name="branchName"
                                    label="Branch Name"
                                    placeholder="e.g. Mumbai Main Branch"
                                    value={values?.branchName}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    error={touched?.branchName && Boolean(errors?.branchName)}
                                    helperText={touched?.branchName && errors?.branchName}
                                />
                            </Grid>
                            {/* Region Name */}
                            <Grid item xs={12} sm={6}>
                                <FormField
                                    required
                                    name="regionName"
                                    label="Region Name"
                                    placeholder="e.g. Mumbai Metro Region"
                                    value={values?.regionName}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    error={touched?.regionName && Boolean(errors?.regionName)}
                                    helperText={touched?.regionName && errors?.regionName}
                                />
                            </Grid>

                            {/* Contact Person Name */}
                            <Grid item xs={12} sm={4}>
                                <FormField
                                    required
                                    name="rccContactPersonName"
                                    label="RCC Contact Person"
                                    placeholder="e.g. Rajesh Sharma"
                                    value={values?.rccContactPersonName}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    error={touched?.rccContactPersonName && Boolean(errors?.rccContactPersonName)}
                                    helperText={touched?.rccContactPersonName && errors?.rccContactPersonName}
                                />
                            </Grid>

                            {/* Mail Id */}
                            <Grid item xs={12} sm={4}>
                                <EmailField
                                    required
                                    name="rccMailId"
                                    label="RCC Official Email"
                                    placeholder="rcc.mumbai@centralbank.co.in"
                                    value={values?.rccMailId}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    error={touched?.rccMailId && Boolean(errors?.rccMailId)}
                                    helperText={touched?.rccMailId && errors?.rccMailId}
                                />
                            </Grid>

                            {/* Mobile Number */}
                            <Grid item xs={12} sm={4}>
                                <MobileNoField
                                    required
                                    name="rccMobileNo"
                                    label="Contact Mobile No"
                                    placeholder="9876543210"
                                    value={values?.rccMobileNo}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    error={touched?.rccMobileNo && Boolean(errors?.rccMobileNo)}
                                    helperText={touched?.rccMobileNo && errors?.rccMobileNo}
                                />
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>

                {/* Section 2: Authorised Person Details */}
                <Grid item xs={12}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 2.5,
                            borderRadius: "10px",
                            border: "1px solid #cbd5e1",
                            bgcolor: "#f8fafc"
                        }}
                    >
                        <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                            <BadgeIcon sx={{ color: "#0E4F8D", fontSize: 20 }} />
                            <Typography variant="subtitle2" fontWeight={800} sx={{ color: "#0E4F8D", fontSize: "13.5px" }}>
                                Authorised Signatory / Issuing Authority Details
                            </Typography>
                        </Box>
                        <Divider sx={{ mb: 2 }} />

                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <FormField
                                    required
                                    name="authorisedPersonName"
                                    label="Authorised Person Name"
                                    placeholder="e.g. S. K. Verma"
                                    value={values?.authorisedPersonName}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    error={touched?.authorisedPersonName && Boolean(errors?.authorisedPersonName)}
                                    helperText={touched?.authorisedPersonName && errors?.authorisedPersonName}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <AutocompleteDropdown
                                    label="Authorised Designation"
                                    name="authorisedPersonDesignation"
                                    options={DESIGNATIONS}
                                    value={values?.authorisedPersonDesignation}
                                    setFieldValue={setFieldValue}
                                    handleBlur={handleBlur}
                                    touched={touched}
                                    errors={errors}
                                    required
                                />
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>

                {/* Action Buttons */}
                <Grid item xs={12} display="flex" justifyContent="flex-end" gap={2} sx={{ mt: 1 }}>
                    <Button
                        variant="outlined"
                        onClick={inline ? onCancel : handleClose}
                        disabled={isLoading}
                        sx={{
                            px: 3.5,
                            py: 1,
                            fontWeight: 700,
                            borderRadius: "8px",
                            textTransform: "none",
                            borderColor: "#cbd5e1",
                            color: "#475569",
                            "&:hover": { bgcolor: "#f1f5f9", borderColor: "#94a3b8" }
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={isLoading}
                        startIcon={isLoading ? <CircularProgress size={18} color="inherit" /> : <DescriptionIcon />}
                        sx={{
                            px: 4,
                            py: 1,
                            fontWeight: 800,
                            borderRadius: "8px",
                            textTransform: "none",
                            background: "linear-gradient(90deg, #15803d 0%, #16a34a 100%)",
                            boxShadow: "0 4px 12px rgba(22, 163, 74, 0.3)",
                            "&:hover": { background: "linear-gradient(90deg, #166534 0%, #15803d 100%)" }
                        }}
                    >
                        {isLoading ? "Generating PO..." : "Generate & Issue Purchase Order"}
                    </Button>
                </Grid>
            </Grid>
        </form>
    );

    if (inline) {
        return (
            <Paper
                elevation={0}
                sx={{
                    p: 3,
                    borderRadius: "12px",
                    border: "1.5px solid #cbd5e1",
                    mt: 2,
                    bgcolor: "#ffffff",
                    boxShadow: "0 4px 16px rgba(14, 79, 141, 0.06)"
                }}
            >
                {isLoading && <FullScreenLoader message="Generating Purchase Order and sending email notifications..." />}
                <Box display="flex" alignItems="center" gap={1.5} mb={2}>
                    <AssignmentIcon sx={{ color: "#0E4F8D", fontSize: 26 }} />
                    <Box>
                        <Typography variant="h6" fontWeight={800} sx={{ color: "#0E4F8D", fontSize: "16px" }}>
                            Enter Purchase Order (PO) Details
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Provide branch, RCC, and authorized signatory details to generate the official Central Bank PO document.
                        </Typography>
                    </Box>
                </Box>
                <Divider sx={{ mb: 2.5 }} />
                {renderFormContent()}
            </Paper>
        );
    }

    return (
        <DialogWithHeader
            open={openPOModal}
            onClose={handleClose}
            maxWidth="md"
            headerText="Required Purchase Order Details"
            applicationId={applicationId}
            icon={AssignmentIcon}
        >
            {isLoading && <FullScreenLoader message="Generating Purchase Order and sending email notifications..." />}
            <Box sx={{ p: 1 }}>
                {renderFormContent()}
            </Box>
        </DialogWithHeader>
    );
};

export default POForm;
