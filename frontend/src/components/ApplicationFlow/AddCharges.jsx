import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  Paper
} from "@mui/material";
import PaymentsIcon from "@mui/icons-material/Payments";

import { PROJECTION_CAL_DETAILS } from "&src/constants/PaymentAggregratorConstant";
import aggregatorProjections from "&src/services/aggregatorProjections";
import DialogWithHeader from "../Dialog/DialogWithHeader";
import FullScreenLoader from "../Loaders/FullScreenLoader";
import useStatusWiseAlert from "../ToastNotifications/useStatusWiseAlert";
import { getProjectionsForCustomer, getChannelOrder, isZeroProjectionChannel } from "&src/utils/calculation";

const AddCharges = ({
  applicationDetails,
  aggregatorId,
  openModal,
  setOpenModal,
  onSaveSuccess
}) => {
  const { applicationId, projection, avgTransactionSize } =
    applicationDetails || {};
  const { errorNotification, successNotification } = useStatusWiseAlert();
  const [loading, setLoading] = useState(false);
  const [errorRowIds, setErrorRowIds] = useState([]);
  const [allCharges, setAllCharges] = useState([]);

  // ---------------------- Initialize Data ----------------------
  useEffect(() => {
    if (!openModal || !applicationId) {
      setAllCharges([]);
      setErrorRowIds([]);
      return;
    }

    setAllCharges([]);
    setErrorRowIds([]);
    setLoading(true);

    const loadCharges = async () => {
      try {
        const res = await aggregatorProjections.getAllProjections(
          applicationId,
          0
        );
        const rawData = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
            ? res
            : [];
        if (rawData.length > 0) {
          const mapped = rawData.map((row, i) => ({
            ...row,
            id: row.id ?? i + 1,
            allow: row.allow,
            isIB: row.isIB,
            transactionType: row.transactionType,
            chargesProposed: (row.chargesProposed !== undefined && row.chargesProposed !== null && row.chargesProposed !== "" && Number(row.chargesProposed) > 0) ? row.chargesProposed : "",
            bankUnit: row.bankUnit ?? row.unit ?? "%"
          }));
          mapped.sort((a, b) => getChannelOrder(a) - getChannelOrder(b));
          setAllCharges(mapped);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn("Could not load saved charges, using baseline:", err);
      }

      const customerProjs = getProjectionsForCustomer(
        PROJECTION_CAL_DETAILS,
        projection,
        avgTransactionSize,
        applicationId
      );

      const defaultCharges = customerProjs.map((row, i) => ({
        ...row,
        id: row.id ?? i + 1,
        allow: row.allow,
        isIB: row.isIB,
        transactionType: row.transactionType,
        chargesProposed: (row.chargesProposed !== undefined && row.chargesProposed !== null && row.chargesProposed !== "" && Number(row.chargesProposed) > 0) ? row.chargesProposed : "",
        bankUnit: row.bankUnit ?? row.unit ?? "%"
      }));
      defaultCharges.sort((a, b) => getChannelOrder(a) - getChannelOrder(b));

      setAllCharges(defaultCharges);
      setLoading(false);
    };

    loadCharges();

    return () => {
      setAllCharges([]);
    };
  }, [openModal, applicationId, projection, avgTransactionSize]);

  // ---------------------- Handlers ----------------------
  const handleChanges = (id, value) => {
    setAllCharges((prev) =>
      prev.map((row) =>
        row.id === id ? { ...row, chargesProposed: value } : row
      )
    );
  };

  const handleRateTypeChange = (id, value) => {
    setAllCharges((prev) =>
      prev.map((row) => (row.id === id ? { ...row, bankUnit: value } : row))
    );
  };

  // ---------------------- Save All ----------------------
  const saveAllChareges = async () => {
    setLoading(true);
    try {
      await aggregatorProjections.updateProjectionByApplication(
        applicationId,
        allCharges
      );
      successNotification(
        "Bank charges updated and projections recalculated successfully."
      );
      setOpenModal(false);
      if (onSaveSuccess) {
        await onSaveSuccess();
      }
      setLoading(false);
    } catch (err) {
      setLoading(false);
      console.error("Error in saveAllChareges:", err);
      errorNotification(
        err?.response?.data?.message ||
        err?.message ||
        "Something went wrong. Please try again."
      );
    }
  };

  // ---------------------- Render ----------------------
  return (
    <Box>
      <DialogWithHeader
        maxWidth="md"
        open={openModal}
        onClose={() => setOpenModal(false)}
        headerText="Add Charges As Per Projections"
        applicationId={applicationId}
        icon={PaymentsIcon}
        contentSx={{ p: 2.5, overflow: "hidden", display: "flex", flexDirection: "column" }}
      >
        {loading && <FullScreenLoader />}

        <Box sx={{ mb: 1.5 }}>
          <Typography
            variant="body2"
            sx={{ color: "text.secondary", fontSize: "12.5px" }}
          >
            Enter proposed bank benchmark charges per transaction mode for this customer application.
          </Typography>
        </Box>

        <TableContainer
          component={Paper}
          elevation={0}
          sx={{
            maxHeight: "55vh",
            overflow: "auto",
            border: "1px solid #cbd5e1",
            borderRadius: "8px",
            position: "relative",
            "&::-webkit-scrollbar": { width: "6px", height: "6px" },
            "&::-webkit-scrollbar-track": { background: "#f1f5f9", borderRadius: "4px" },
            "&::-webkit-scrollbar-thumb": { background: "#cbd5e1", borderRadius: "4px", "&:hover": { background: "#94a3b8" } }
          }}
        >
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    fontWeight: 700,
                    fontSize: "12px",
                    width: 50,
                    bgcolor: "#0E4F8D !important",
                    color: "#ffffff !important",
                    borderBottom: "2px solid #062545"
                  }}
                >
                  #
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 700,
                    fontSize: "12px",
                    bgcolor: "#0E4F8D !important",
                    color: "#ffffff !important",
                    borderBottom: "2px solid #062545"
                  }}
                >
                  Payment Channels / Modes
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 700,
                    fontSize: "12px",
                    width: 220,
                    bgcolor: "#0E4F8D !important",
                    color: "#ffffff !important",
                    borderBottom: "2px solid #062545"
                  }}
                >
                  Charges Proposed
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {allCharges?.length ? (
                allCharges.map((row, i) => {
                  const srNo = !row.isIB
                    ? allCharges.slice(0, i + 1).filter((r) => !r.isIB).length
                    : "";

                  return (
                    <TableRow key={row.id || i} hover sx={{ "&:hover": { bgcolor: "#f8fafc" } }}>
                      <TableCell
                        sx={{ fontSize: "12px", color: "text.secondary" }}
                      >
                        {srNo}
                      </TableCell>
                      <TableCell
                        sx={{
                          fontSize: "12.5px",
                          fontWeight: row.isIB ? 500 : 700,
                          pl: row.isIB ? 3 : 1
                        }}
                      >
                        {row.transactionType}
                      </TableCell>

                      {!isZeroProjectionChannel(row) && !(row.transactionType?.toLowerCase().includes("internet") && !row.isIB) ? (
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <ToggleButtonGroup
                              value={row.bankUnit || "%"}
                              exclusive
                              size="small"
                              onChange={(e, newUnit) => {
                                if (newUnit) handleRateTypeChange(row.id, newUnit);
                              }}
                              sx={{
                                height: 32,
                                "& .MuiToggleButton-root": {
                                  px: 1,
                                  py: "2px",
                                  fontSize: "12px",
                                  fontWeight: 700,
                                  textTransform: "none",
                                  borderColor: "#cbd5e1",
                                  "&.Mui-selected": {
                                    bgcolor: "#0E4F8D !important",
                                    color: "#ffffff !important"
                                  }
                                }
                              }}
                            >
                              <ToggleButton value="%">%</ToggleButton>
                              <ToggleButton value="₹">₹</ToggleButton>
                            </ToggleButtonGroup>
                            <TextField
                              name="chargesProposed"
                              size="small"
                              variant="outlined"
                              type="text"
                              placeholder="0.00"
                              value={row.chargesProposed ?? ""}
                              error={errorRowIds.includes(row.id)}
                              helperText={
                                errorRowIds.includes(row.id) ? "Required" : ""
                              }
                              onChange={(e) => {
                                const val = e.target.value;
                                if (
                                  val === "" ||
                                  /^\d{0,3}(\.\d{0,4})?$/.test(val)
                                ) {
                                  handleChanges(row.id, val);
                                }
                              }}
                              inputProps={{
                                style: {
                                  textAlign: "right",
                                  padding: "5px 8px",
                                  fontSize: "12px",
                                  fontWeight: 600
                                }
                              }}
                              sx={{ width: 100 }}
                            />
                          </Box>
                        </TableCell>
                      ) : (
                        <TableCell
                          sx={{ color: "text.disabled", fontSize: "13px", fontWeight: 700, pl: 2 }}
                        >
                          —
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ py: 3 }}>
                    No projection data available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Box display="flex" justifyContent="flex-end" gap={1.5} mt={2.5}>
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => setOpenModal(false)}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={saveAllChareges}
            sx={{ fontWeight: 700 }}
          >
            Submit Charges
          </Button>
        </Box>
      </DialogWithHeader>
    </Box>
  );
};

export default AddCharges;

