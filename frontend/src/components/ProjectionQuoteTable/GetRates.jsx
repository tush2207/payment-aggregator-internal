import {
    Box,
    Button,
    MenuItem,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField
} from "@mui/material";
import { useEffect, useState } from "react";

import { PROJECTION_COLUMNS_FOR_PA } from "&src/constants/PaymentAggregratorConstant";
import { PERCENTAGE, RS, sumofAggregatorRates } from "&src/utils";
import DialogWithHeader from "../Dialog/DialogWithHeader";
import FullScreenLoader from "../Loaders/FullScreenLoader";
import useStatusWiseAlert from "../ToastNotifications/useStatusWiseAlert";
import aggregatorProjections from "&src/services/aggregatorProjections";
import applicationServices from "&src/services/applications";
import aggregatorByApplication from "&src/services/aggregatorByApplication";


const GetRates = ({
    applicationDetails,
    aggregatorId,
    quoteDetails,
    openModal,
    setOpenModal
}) => {
    const { applicationId } = applicationDetails || {};
    const { errorNotification, successNotification } = useStatusWiseAlert();

    const [loading, setLoading] = useState(false);
    const [errorRowIds, setErrorRowIds] = useState([]);
    const [rateDetails, setRateDetails] = useState([]);

    // ---------------------- Initialize Data ----------------------
    useEffect(() => {
        if (quoteDetails?.length) {
            // Preserve all existing fields and ensure rate/unit exist
            const initialized = quoteDetails.map((q, i) => ({
                ...q,
                id: q.id ?? i + 1,
                rate: q.rate ?? q.chargesProposed ?? "",
                unit: q.unit ?? RS
            }));
            setRateDetails(initialized);
        }
    }, [quoteDetails]);

    // ---------------------- Handlers ----------------------
    const handleRateChange = (transactionType, value) => {
        setRateDetails((prev) =>
            prev.map((row) =>
                row.transactionType === transactionType
                    ? { ...row, rate: value }
                    : row
            )
        );
    };

    const handleRateTypeChange = (transactionType, newUnit) => {
        setRateDetails((prev) =>
            prev.map((row) =>
                row.transactionType === transactionType
                    ? { ...row, unit: newUnit }
                    : row
            )
        );
    };

    // ---------------------- Save All ----------------------
    const saveAllRates = async () => {
        setLoading(true);
        try {
            // ✅ Validate numbers
            const isInvalidNumber = (value) =>
                value === null ||
                value === undefined ||
                value === "" ||
                isNaN(Number(value)) ||
                Number(value) <= 0;

            const invalidRows = rateDetails.filter(
                (row) => row.allow && isInvalidNumber(row.rate)
            );

            if (invalidRows.length > 0) {
                const invalidIds = invalidRows.map((r) => r.id);
                setErrorRowIds(invalidIds);

                const transactionTypeList = invalidRows.map((r) => r.transactionType);
                errorNotification(
                    `⚠️ Missing or invalid charge details in: ${transactionTypeList.join(", ")}`
                );
                setLoading(false);
                return;
            }

            // ✅ Clear previous errors if validation passed
            setErrorRowIds([]);

            // ✅ Prepare final payload (keep all fields)
            const finalPayload = rateDetails?.map((item) => ({
                ...item,
                rate: item.rate,
                unit: item.unit
            }));

            const sumOfRate = sumofAggregatorRates(rateDetails)
            console.log("✅ Final Payload:", finalPayload);

            const [res, resAgg, resApp] = await Promise.all([
                aggregatorProjections.updateProjection(applicationId, aggregatorId, finalPayload),
                aggregatorByApplication.updateAggregatorByApplication(applicationId, aggregatorId, { sumOfRate, status: 'submitted' }),
                applicationServices.updateApplication(applicationId, {
                    isQuoteAddedPA: true,
                    status: "quotesubmitted",
                }),
            ]);

            const allSuccess = [res, resAgg, resApp].every(
                (r) => r?.status === 200 || r?.status === 201
            );

            if (!allSuccess) {
                throw new Error("❌ One or more API calls failed.");
            }

            successNotification("✅ Application approved and projections added successfully.");
            window.location.reload();

            setLoading(false);
            successNotification("✅ Rates validated and ready to save.");
        } catch (err) {
            setLoading(false);
            console.error("Error in saveAllRates:", err);
            errorNotification(
                err?.response?.data?.message ||
                err?.message ||
                "⚠️ Something went wrong. Please try again."
            );
        }
    };

    // ---------------------- Render ----------------------
    return (
        <Box p={2}>

            <DialogWithHeader
                maxWidth="sm"
                open={openModal}
                onClose={() => setOpenModal(!openModal)}
                headerText={`Add Quotation As Per Projections`}
            >
                {loading && <FullScreenLoader />}

                <Table size="small">
                    <TableHead>
                        <TableRow>
                            {PROJECTION_COLUMNS_FOR_PA.map((col, idx) => (
                                <TableCell key={idx} sx={{ fontWeight: 600, fontSize: "13px" }}>
                                    {col}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {rateDetails?.length ? (
                            rateDetails.map((row, i) => (
                                <TableRow key={row.id}>
                                    <TableCell>{i + 1}</TableCell>
                                    <TableCell width="50%">{row.transactionType}</TableCell>

                                    {row.allow ? (
                                        <TableCell>
                                            <TextField
                                                size="small"
                                                variant="outlined"
                                                type="text"
                                                value={row.rate}
                                                error={errorRowIds.includes(row.id)}
                                                helperText={
                                                    errorRowIds.includes(row.id)
                                                        ? "Required"
                                                        : ""
                                                }
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (
                                                        val === "" ||
                                                        /^\d{0,3}(\.\d{0,3})?$/.test(val)
                                                    ) {
                                                        handleRateChange(row.transactionType, val);
                                                    }
                                                }}
                                                inputProps={{ style: { textAlign: "right" } }}
                                                InputProps={{
                                                    startAdornment: (
                                                        <TextField
                                                            select
                                                            value={row.unit}
                                                            onChange={(e) =>
                                                                handleRateTypeChange(
                                                                    row.transactionType,
                                                                    e.target.value
                                                                )
                                                            }
                                                            variant="standard"
                                                            size="small"
                                                            sx={{
                                                                minWidth: 45,
                                                                "& .MuiSelect-select": {
                                                                    padding: "2px 0px",
                                                                },
                                                            }}
                                                        >
                                                            <MenuItem value={RS}>{RS}</MenuItem>
                                                            <MenuItem value={PERCENTAGE}>
                                                                {PERCENTAGE}
                                                            </MenuItem>
                                                        </TextField>
                                                    ),
                                                }}
                                            />
                                        </TableCell>
                                    ) : (
                                        <TableCell />
                                    )}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={3} align="center">
                                    No data available
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                <Box display="flex" justifyContent="end" mt={1}>
                    <Button variant="contained" size="small" onClick={saveAllRates}>
                        Submit Rates
                    </Button>
                </Box>
            </DialogWithHeader>
        </Box>
    );
};

export default GetRates;
