import {
    Box,
    Button,
    Container,
    MenuItem,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField
} from "@mui/material";
import { useEffect, useState } from "react";

import { PROJECTION_CAL_DETAILS, PROJECTION_COLUMNS_FOR_PA, UPDATE_PROJECTION_COLUMNS } from "&src/constants/PaymentAggregratorConstant";
import aggregatorProjections from "&src/services/aggregatorProjections";
import { PERCENTAGE, RS } from "&src/utils";
import { calculateProjectionDetails, generateProjectionArray } from "&src/utils/calculation";
import useStatusWiseAlert from "../ToastNotifications/useStatusWiseAlert";


const UpdateProjectionPercentage = (customerDetails) => {

    const { applicationId, aggregateDepositAmt, avgTransactionYearly, isAggregatorAdded, isQuoteAcceptRO, finalizedAggregatorId, category, avgTransactionSize } =
        customerDetails || {};
    const { errorNotification, successNotification } = useStatusWiseAlert();
    const [loading, setLoading] = useState(false);
    const [errorRowIds, setErrorRowIds] = useState([]);
    const [allCharges, setAllCharges] = useState([]);


    const projectionList = generateProjectionArray(PROJECTION_CAL_DETAILS, avgTransactionSize)
    // 2️⃣ Projection Payload
    const projectionsPayload = calculateProjectionDetails({
        projectionDetails: projectionList,
        avgTransactionYearly,
        aggregateDepositAmt,
        applicationId,
    });

    useEffect(() => {
        console.log(projectionsPayload, 'projectionsPayload')
    }, [projectionsPayload])

    // ---------------------- Initialize Data ----------------------
    useEffect(() => {
        if (PROJECTION_CAL_DETAILS) {
            // Preserve all existing fields and ensure rate/unit exist
            const initialized = PROJECTION_CAL_DETAILS.map((q, i) => ({
                id: q.id ?? i + 1,
                allow: q.allow,
                transactionType: q.transactionType,
                chargesProposed: q.chargesProposed ?? q.chargesProposed ?? 0.0,
                bankUnit: RS
            }));
            setAllCharges(initialized);
        }
    }, []);

    const handleChanges = (transactionType, value) => {
        setAllCharges((prev) =>
            prev.map((row) =>
                row.transactionType === transactionType
                    ? { ...row, chargesProposed: parseFloat(value) }
                    : row
            )
        );
    };

    const handleRateTypeChange = (transactionType, value) => {
        setAllCharges((prev) =>
            prev.map((row) =>
                row.transactionType === transactionType
                    ? { ...row, bankUnit: value }
                    : row
            )
        );
    };


    // ---------------------- Save All ----------------------
    const saveAllChareges = async () => {
        setLoading(true);
        console.log('allCharges', allCharges)
        try {
            await aggregatorProjections.updateProjectionByApplication(applicationId, allCharges),
                successNotification("✅ Application approved and projections added successfully.");
            window.location.reload();

            setLoading(false);
        } catch (err) {
            setLoading(false);
            console.error("Error in saveAllChareges:", err);
            errorNotification(
                err?.response?.data?.message ||
                err?.message ||
                "⚠️ Something went wrong. Please try again."
            );
        }
    };

    // ---------------------- Render ----------------------
    return (
        <Container maxWidth='md' p={2}>
            <Box display="flex" justifyContent="end" mt={1}>
                <Button variant="contained" size="small" onClick={saveAllChareges}>
                    Submit Charges
                </Button>
            </Box>
            <Table size="small" sx={{ border: "1px solid #e0e0e0" }}>
                <TableHead>
                    <TableRow>
                        {UPDATE_PROJECTION_COLUMNS.map((col, idx) => (
                            <TableCell key={idx} sx={{ fontWeight: 600, fontSize: "13px" }}>
                                {col}
                            </TableCell>
                        ))}
                    </TableRow>
                </TableHead>

                <TableBody>
                    {allCharges?.length ? (
                        allCharges.map((row, i) => (
                            <TableRow key={row.id}>
                                <TableCell>{i + 1}</TableCell>
                                <TableCell width="50%">{row.transactionType}</TableCell>
                                <TableCell>
                                    <TextField
                                        name="chargesProposed"
                                        size="small"
                                        // placeholder="Enter Charges"
                                        variant="outlined"
                                        type="text"
                                        value={row.charge}
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
                                                handleChanges(row.transactionType, val);
                                            }
                                        }}
                                        inputProps={{ style: { textAlign: "right" } }}
                                        InputProps={{
                                            startAdornment: (
                                                <TextField
                                                    select
                                                    value={row.bankUnit}
                                                    onChange={(e) => handleRateTypeChange(row.transactionType, e.target.value)}
                                                    variant="standard"
                                                    size="small"
                                                    sx={{
                                                        minWidth: 45,
                                                        "& .MuiSelect-select": { padding: "2px 8px" },
                                                    }}
                                                >
                                                    <MenuItem value={RS}>{RS}</MenuItem>
                                                    <MenuItem value={PERCENTAGE}>{PERCENTAGE}</MenuItem>
                                                </TextField>
                                            ),
                                        }}

                                    />
                                </TableCell>
                                <TableCell width="50%">{row.transactionType}</TableCell>
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


        </Container>
    );
};

export default UpdateProjectionPercentage;
