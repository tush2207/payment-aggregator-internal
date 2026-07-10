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
    Typography
} from "@mui/material";
import AutocompleteDropdown from "../AutocompleteDropdown";
import DialogWithHeader from "../Dialog/DialogWithHeader";
import FullScreenLoader from "../Loaders/FullScreenLoader";

const POForm = ({ openPOModal, setOpenPOModal, poFormDetails, generatePO, applicationId, aggregatorId, isLoading }) => {

    const { values, errors, touched, handleChange, handleBlur, handleSubmit, resetForm, setFieldTouched, setFieldValue } = poFormDetails;

    const handleClose = () => {
        setOpenPOModal(false)
        resetForm()
    };

    return (
        <>
            <DialogWithHeader
                open={openPOModal}
                onClose={() => setOpenPOModal(false)}
                maxWidth="sm"
                headerText={"Required PO Details"}
            >
                {isLoading && <FullScreenLoader />}

                <form onSubmit={(event) => {
                    event.preventDefault();
                    handleSubmit(applicationId, aggregatorId)
                }}
                    noValidate>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <Typography fontWeight={500}>
                                Branch / RCC Details
                            </Typography>
                        </Grid>
                        <Grid item xs={12}>
                            <Divider />
                        </Grid>
                        {/* Branch Name */}
                        <Grid item xs={12}>
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
                        {/* Customer Name */}
                        <Grid item xs={12}>
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

                        {/* Customer Name */}
                        <Grid item xs={12}>
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

                        {/* Contact Details */}
                        <Grid item xs={12}>
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

                        <Grid item xs={12}>
                            <MobileNoField
                                required
                                name="rccMobileNo"
                                label="Mobile Number"
                                value={values?.mobileNo}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                error={touched?.rccMobileNo && Boolean(errors?.rccMobileNo)}
                                helperText={touched?.rccMobileNo && errors?.rccMobileNo}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Typography fontWeight={500}>
                                Authorised Person Details
                            </Typography>
                        </Grid>
                        <Grid item xs={12}>
                            <Divider />
                        </Grid>
                        <Grid item xs={12}>
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
                        <Grid item xs={12}>
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
                        <Grid item xs={4} />
                        <Grid item xs={4}>
                            <Button
                                fullWidth
                                type="button"
                                variant="outlined"
                                onClick={handleClose}
                            >
                                Cancel
                            </Button>

                        </Grid>
                        <Grid item xs={4}>

                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                color="success"
                                onClick={() => generatePO({ applicationId, aggregatorId })}
                            >
                                Generate PO
                            </Button>
                        </Grid>
                    </Grid>

                </form>
            </DialogWithHeader>
        </>
    );
};

export default POForm;
