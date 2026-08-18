import {
    Box,
    Button,
    Container,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Typography,
    IconButton
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { useEffect, useState } from "react";
import { PROJECTION_CAL_DETAILS, UPDATE_PROJECTION_COLUMNS } from "&src/constants/PaymentAggregratorConstant";
import aggregatorProjections from "&src/services/aggregatorProjections";
import applicationServices from "&src/services/applications";
import useStatusWiseAlert from "&src/components/ToastNotifications/useStatusWiseAlert";
import FullScreenLoader from "&src/components/Loaders/FullScreenLoader";
import { generateProjectionArray, calculateProjectionDetails } from "&src/utils/calculation";
import { useDispatch } from "react-redux";
import { fetchApplicationDetails, updateApplicationWorkflow } from "&src/store/applicationFlowSlice";

const UpdateProjectionPercentage = ({ customerDetails }) => {
    const { applicationId, avgTransactionSize, avgTransactionYearly, aggregateDepositAmt } = customerDetails || {};
    const { errorNotification, successNotification } = useStatusWiseAlert();
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(false);
    const [allCharges, setAllCharges] = useState([]);

    // ---------------------- Initialize Data ----------------------
    useEffect(() => {
        if (PROJECTION_CAL_DETAILS) {
            const initialized = PROJECTION_CAL_DETAILS.map((q, i) => ({
                id: q.id ?? i + 1,
                order: q.order ?? i + 1,
                transactionType: q.transactionType,
                transactionCount: q.transactionCount ? parseInt(q.transactionCount) || 0 : 0,
                transactionValue: q.transactionValue ? parseInt(q.transactionValue) || 0 : 0,
                isIB: q.isIB || false,
                isCustom: false,
            }));
            setAllCharges(initialized);
        }
    }, [customerDetails]);

    const handleNumericChange = (id, field, value) => {
        // Enforce integer numbers only, no decimal values
        if (value === "" || /^\d+$/.test(value)) {
            const numVal = value === "" ? 0 : parseInt(value);
            setAllCharges((prev) =>
                prev.map((row) =>
                    row.id === id ? { ...row, [field]: numVal } : row
                )
            );
        }
    };

    const handleAddRow = () => {
        const nextId = allCharges.length > 0 ? Math.max(...allCharges.map(c => c.id)) + 1 : 1;
        setAllCharges((prev) => [
            ...prev,
            {
                id: nextId,
                order: nextId,
                transactionType: "",
                transactionCount: 0,
                transactionValue: 0,
                isIB: false,
                isCustom: true,
            }
        ]);
    };

    const handleDeleteRow = (id) => {
        setAllCharges((prev) => prev.filter((row) => row.id !== id));
        const newRow = {
            id: Date.now(),
            transactionType: "",
            transactionCount: "",
            transactionValue: "",
            isIB: false,
            rate: 0,
            unit: "Percent",
            chargesProposed: 0,
            grossAmount: 0,
            vendorShare: 0,
            expectedRevenue: 0,
            isDeleted: false,
            allow: true,
        };
        setAllCharges([...allCharges, newRow]);
    };

    const handleDeleteRow = (index) => {
        const updated = allCharges.filter((_, i) => i !== index);
        setAllCharges(updated);
    };

    const handleChange = (index, field, value) => {
        const updated = [...allCharges];
        updated[index][field] = value;
        setAllCharges(updated);
    };

    const saveAllChareges = async () => {
        const nonIbRows = allCharges.filter(item => !item.isIB);
        const totalCount = nonIbRows.reduce((sum, item) => sum + (parseFloat(item.transactionCount) || 0), 0);
        const totalValue = nonIbRows.reduce((sum, item) => sum + (parseFloat(item.transactionValue) || 0), 0);

        if (totalCount !== 100) {
            errorNotification(`Total Share Transaction Count (%) must sum to exactly 100% (currently ${totalCount}%).`);
            return;
        }
        if (totalValue !== 100) {
            errorNotification(`Total Share Transaction Value (%) must sum to exactly 100% (currently ${totalValue}%).`);
            return;
        }

        setLoading(true);
        try {
            const formattedCharges = allCharges.map(item => ({
                ...item,
                transactionCount: item.isIB ? "" : `${item.transactionCount}%`,
                transactionValue: item.isIB ? "" : `${item.transactionValue}%`,
            }));

            const updatedPayload = calculateProjectionDetails({
                projectionDetails: formattedCharges,
                avgTransactionYearly,
                aggregateDepositAmt,
                applicationId,
            });

            try {
                await aggregatorProjections.updateProjectionByApplication(applicationId, updatedPayload);
            } catch (dbErr) {
                console.warn("Projection DB update warning:", dbErr);
            }

            await dispatch(updateApplicationWorkflow({
                applicationId,
                payload: { isProjectionAdded: true }
            }));

            successNotification("✅ Projections updated and saved successfully.");
        } catch (err) {
            console.error("Error in saveAllChareges:", err);
            errorNotification(
                err?.response?.data?.message ||
                err?.message ||
                "⚠️ Something went wrong. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleSkip = async () => {
        setLoading(true);
        try {
            const projectionList = generateProjectionArray(PROJECTION_CAL_DETAILS, avgTransactionSize);
            const defaultPayload = calculateProjectionDetails({
                projectionDetails: projectionList,
                avgTransactionYearly,
                aggregateDepositAmt,
                applicationId,
            });

            try {
                await aggregatorProjections.updateProjectionByApplication(applicationId, defaultPayload);
            } catch (dbErr) {
                console.warn("Projection skip DB update warning:", dbErr);
            }

            await dispatch(updateApplicationWorkflow({
                applicationId,
                payload: { isProjectionAdded: true }
            }));

            successNotification("✅ Projection step skipped successfully.");
        } catch (err) {
            console.error("Error in handleSkip:", err);
            errorNotification("⚠️ Failed to skip projection step.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="md" sx={{ p: 2 }}>
            {loading && <FullScreenLoader />}

            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Button variant="outlined" color="warning" size="small" onClick={handleSkip}>
                    Skip Step
                </Button>
                <Box display="flex" gap={1}>
                    <Button variant="outlined" color="primary" size="small" onClick={handleAddRow}>
                        Add Row
                    </Button>
                    <Button variant="contained" size="small" onClick={saveAllChareges}>
                        Submit Projections
                    </Button>
                </Box>
            </Box>

            <Table size="small" sx={{ width: "100%", tableLayout: "auto" }}>
                <TableHead sx={{ bgcolor: 'grey.100' }}>
                    <TableRow>
                        {UPDATE_PROJECTION_COLUMNS.map((col, idx) => (
                            <TableCell key={idx} sx={{ fontWeight: 700, fontSize: "11px", py: 1, px: 0.75, whiteSpace: "normal", wordBreak: "break-word", lineHeight: 1.1, verticalAlign: "top" }}>
                                {col}
                            </TableCell>
                        ))}
                        <TableCell sx={{ fontWeight: 700, fontSize: "11px", py: 1, px: 0.75, whiteSpace: "normal", wordBreak: "break-word", lineHeight: 1.1, verticalAlign: "top" }} align="center">Actions</TableCell>
                    </TableRow>
                </TableHead>

                <TableBody>
                    {(() => {
                        const visibleCharges = allCharges.filter(row => !row.isIB);
                        return visibleCharges?.length ? (
                            visibleCharges.map((row, i) => {
                                const cellSx = { fontSize: "11px", p: "4px", whiteSpace: "normal", wordBreak: "break-word" };
                                return (
                                    <TableRow key={row.id} sx={{ "&:hover": { bgcolor: "#f8fafc" } }}>
                                        <TableCell sx={cellSx}>{i + 1}</TableCell>
                                        <TableCell width="40%" sx={cellSx}>
                                            {row.isCustom ? (
                                                <TextField
                                                    size="small"
                                                    fullWidth
                                                    placeholder="e.g., Credit Card"
                                                    value={row.transactionType}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setAllCharges(prev => prev.map(r => r.id === row.id ? { ...r, transactionType: val } : r));
                                                    }}
                                                    inputProps={{ style: { fontSize: "11px", padding: "4px 8px" } }}
                                                />
                                            ) : (
                                                <Typography variant="body2" fontWeight={row.isIB ? 500 : 600} sx={{ fontSize: "11px" }}>
                                                    {row.transactionType}
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell sx={{ p: "4px" }}>
                                            <TextField
                                                size="small"
                                                type="text"
                                                placeholder="0"
                                                value={row.transactionCount}
                                                onChange={(e) => handleNumericChange(row.id, "transactionCount", e.target.value)}
                                                inputProps={{ style: { textAlign: "right", padding: "4px 4px", fontSize: "11px" } }}
                                                InputProps={{
                                                    endAdornment: <Typography variant="caption" color="text.secondary" sx={{ fontSize: "10px" }}>%</Typography>
                                                }}
                                                sx={{ width: 75 }}
                                            />
                                        </TableCell>
                                        <TableCell sx={{ p: "4px" }}>
                                            <TextField
                                                size="small"
                                                type="text"
                                                placeholder="0"
                                                value={row.transactionValue}
                                                onChange={(e) => handleNumericChange(row.id, "transactionValue", e.target.value)}
                                                inputProps={{ style: { textAlign: "right", padding: "4px 4px", fontSize: "11px" } }}
                                                InputProps={{
                                                    endAdornment: <Typography variant="caption" color="text.secondary" sx={{ fontSize: "10px" }}>%</Typography>
                                                }}
                                                sx={{ width: 75 }}
                                            />
                                        </TableCell>
                                        <TableCell align="center" sx={{ p: "4px" }}>
                                            {row.isCustom && (
                                                <IconButton size="small" color="error" onClick={() => handleDeleteRow(row.id)}>
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} align="center">
                                    No data available
                                </TableCell>
                            </TableRow>
                        );
                    })()}

                    {/* Totals Row */}
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                        <TableCell sx={{ fontSize: "11px", p: "4px" }}></TableCell>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: "11px", p: "4px" }}>Total Share (%)</TableCell>
                        <TableCell sx={{ p: "4px" }}>
                            <Typography fontWeight="bold" color={totalCount === 100 ? "success.main" : "error.main"} sx={{ fontSize: "11px", textAlign: "right", pr: 2 }}>
                                {totalCount}%
                            </Typography>
                        </TableCell>
                        <TableCell sx={{ p: "4px" }}>
                            <Typography fontWeight="bold" color={totalValue === 100 ? "success.main" : "error.main"} sx={{ fontSize: "11px", textAlign: "right", pr: 2 }}>
                                {totalValue}%
                            </Typography>
                        </TableCell>
                        <TableCell sx={{ fontSize: "11px", p: "4px" }}></TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </Container>
    );
};

export default UpdateProjectionPercentage;
