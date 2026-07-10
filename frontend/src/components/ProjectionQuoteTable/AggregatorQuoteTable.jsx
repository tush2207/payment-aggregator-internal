import {
  Add,
  CheckCircle,
  CurrencyRupee,
  Gavel,
  InfoOutlined,
  KeyboardArrowDown,
  KeyboardArrowUp,
  Send,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Collapse,
  IconButton,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  Tooltip,
  Typography,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import dayjs from "dayjs";
import React, { useCallback, useEffect, useState } from "react";

import {
  AGGREGATOR_COLUMNS,
  isCO,
  MANAGE_AGGREGATOR_TABLE_COLUMNS,
  PROJECTION_CAL_DETAILS
} from "&src/constants/PaymentAggregratorConstant";

import { AGGREGRATOR_BY_APPLICATION_RESPONSE } from "&src/data/data";
import useAggregatorDetails from "&src/hooks/useAggregatorDetails";
import aggregatorByApplication from "&src/services/aggregatorByApplication";
import aggregatorProjections from "&src/services/aggregatorProjections";
import { sortAggregatorsByQuote } from "&src/utils";
import { calculateProjectionDetails, generateProjectionArray } from "&src/utils/calculation";

import applicationServices from "&src/services/applications";
import CenterAlign from "../CenterAlign";
import DatePicker from "../DatePicker";
import EndAlignedCell from "../EndAlignedCell";
import FullScreenLoader from "../Loaders/FullScreenLoader";
import StatusChipOrSelect from "../StatusChipOrSelect";
import useStatusWiseAlert from "../ToastNotifications/useStatusWiseAlert";
import AddCharges from "./AddCharges";
import QuoteTable from "./QuoteTable";

// ✅ Conditional hook wrapper
function useConditionalAggregatorDetails(condition) {
  return condition ? useAggregatorDetails() : { aggregatorDetails: [] };
}

const AggregatorDetails = ({ customerDetails }) => {
  const { errorNotification, successNotification } = useStatusWiseAlert();
  const [openRow, setOpenRow] = useState(null);
  const [loading, setLoading] = useState(false);
  const [endDate, setEndDate] = useState(dayjs().add(2, "day"));
  const [selectedAggregators, setSelectedAggregators] = useState([]);
  const [selectedAggregatorsDetails, setSelectedAggregatorsDetails] = useState([]);
  const [openModal, setOpenModal] = useState(false);

  const { applicationId, aggregateDepositAmt, avgTransactionYearly, isAggregatorAdded, isQuoteAcceptRO, finalizedAggregatorId, category, avgTransactionSize } =
    customerDetails || {};

  const condition = isAggregatorAdded === null && isCO;
  const { aggregatorDetails } = useConditionalAggregatorDetails(condition);

  // 🔹 Manage Tabs
  const [tabValue, setTabValue] = useState("all");

  useEffect(() => {
    if (finalizedAggregatorId && isQuoteAcceptRO) {
      setTabValue("finalizedAggregator");
    } else {
      setTabValue("all");
    }
  }, [finalizedAggregatorId, isQuoteAcceptRO]);

  const handleChange = (event, newValue) => {
    setTabValue(newValue);
    setOpenRow(null)
  };

  /** 🔹 Fetch Aggregator Details */
  const fetchSelectedAggregatorDetails = useCallback(async () => {
    if (!applicationId) return;
    setLoading(true);

    try {
      const response = await aggregatorByApplication.getAllAggregatorsByApplication(applicationId);
      setSelectedAggregatorsDetails(Array.isArray(response?.data)

        ? sortAggregatorsByQuote(response?.data)
        : []);
    } catch (error) {
      console.error("[ERROR] Failed to fetch aggregators:", error);
      errorNotification(error?.response?.data?.message || "Failed to fetch aggregators");
      // fallback mock sorted data
      setSelectedAggregatorsDetails(sortAggregatorsByQuote(AGGREGRATOR_BY_APPLICATION_RESPONSE));
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    if (applicationId && customerDetails?.isAggregatorAdded && isCO) {
      fetchSelectedAggregatorDetails();
    }
  }, [applicationId, customerDetails?.isAggregatorAdded]);

  /** 🔹 Send for Quote */
  const handleSendForQuote = async () => {
    if (!selectedAggregators?.length) {
      return errorNotification("Please select at least one aggregator");
    }

    try {
      setLoading(true);

      // 1️⃣ Aggregator Payload
      const aggregatorPayload = selectedAggregators.map((agg) => ({
        aggregatorId: agg.aggregatorId,
        aggregatorName: agg.aggregatorName,
        email: agg.email,
        endDate,
        applicationId,
        totalEstimatedTransactions: 0,
        totalAggregateAmount: 0,
        totalGrossAmount: 0,
        totalVendorShare: 0,
        totalExpectedRevenue: 0,
        status: "pending",
        quoteStatus: "inprogress",
        sumOfRate: 0,
        avgTransactionYearly,
        avgTransactionSize,
        category,
      }));

      const projectionList = generateProjectionArray(PROJECTION_CAL_DETAILS, avgTransactionSize)
      // 2️⃣ Projection Payload
      const projectionsPayload = calculateProjectionDetails({
        projectionDetails: projectionList,
        avgTransactionYearly,
        aggregateDepositAmt,
        applicationId,
      });

      // 🔹 Sequential API Calls
      const aggResponse = await aggregatorByApplication.createAggregatorByApplication(applicationId, aggregatorPayload);
      if (!(aggResponse?.status === 200 || aggResponse?.status === 201)) {
        throw new Error("Failed to add aggregator");
      }

      const projResponse = await aggregatorProjections.createProjection(applicationId, projectionsPayload);
      if (!(projResponse?.status === 200 || projResponse?.status === 201)) {
        errorNotification("Failed to add projections.");
        throw new Error("Failed to add projections.");
      }

      const appResponse = await applicationServices.updateApplication(applicationId, {
        isAggregatorAdded: true,
        isReviewByCO: true,
        status: "quoterequested",
      });
      if (!(appResponse?.status === 200 || appResponse?.status === 201)) {
        errorNotification("Failed to update application status.");
        throw new Error("Failed to update application status.");
      }

      successNotification("Aggregators & Projections added successfully");
      fetchSelectedAggregatorDetails();
      window.location.reload();
    } catch (err) {
      setLoading(false);
      errorNotification(err?.response?.data?.message || err.message || "Something went wrong.");
    }
  };


  const sortAggregator = (data) => {
    return [...data]?.sort((a, b) => {
      //Submitted first
      if (a.status === 'submitted' && b.status !== 'submitted') return -1;
      if (a.status !== 'submitted' && b.status === 'submitted') return 1;
      // Revenue sorting (high -> low)
      return (b.totalExpectedRevenue || 0) - (a.totalExpectedRevenue || 0)
    })
  }

  /** 🔹 Filter finalized aggregator if exists */
  const filteredAggregators =
    tabValue === "finalizedAggregator" && finalizedAggregatorId

      ? sortAggregator(selectedAggregatorsDetails.filter((agg) => agg.aggregatorId === customerDetails.finalizedAggregatorId))

      : sortAggregator(selectedAggregatorsDetails);

  return (
    <Box>
      {loading && <FullScreenLoader />}

      {/* ➤ Add Aggregator Section */}
      {condition && (
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" fontWeight="bold">
              Add Aggregator for Quote

              {/* in this click open pop up and in that show ManageAggregator from AND Then call once getaggregator call so i can get all the details in belwo add aggregator for quote table   */}
              <Button variant="outlined" className="ml-2" startIcon={<Add />}>
                Add New Aggregator
              </Button>

            </Typography>

            <Stack direction="row" spacing={2} alignItems="center">
              <DatePicker disablePast value={endDate} onChange={setEndDate} />
              <Tooltip title="Choose the desired end date for quotation submission" arrow placement="top">
                <IconButton size="small">
                  <InfoOutlined color="primary" />
                </IconButton>
              </Tooltip>
              <Button variant="contained" endIcon={<Send />} onClick={handleSendForQuote}>
                Send for Quote
              </Button>
            </Stack>
          </Box>

          <DataGrid
            checkboxSelection
            columns={MANAGE_AGGREGATOR_TABLE_COLUMNS}
            rows={aggregatorDetails || []}
            getRowId={(row) => row.aggregatorId}
            hideFooter
            onRowSelectionModelChange={(selectionModel) => {
              setSelectedAggregators(
                aggregatorDetails.filter((row) => selectionModel.includes(row.aggregatorId))
              );
            }}
          />
        </Box>
      )}

      {/* ➤ Added Aggregators Section */}
      {customerDetails?.isAggregatorAdded && isCO && (
        <Box sx={{ mt: 2 }}>
          <Box display='flex' justifyContent='space-between' m={2}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 1 }}>
              All Aggregetors Details
            </Typography>
            <Box>
              {!customerDetails?.isFinalApproved &&
                <>
                  <Button startIcon={<CurrencyRupee />} variant="outlined" onClick={() => setOpenModal(!openModal)}>
                    Add Charges
                  </Button>
                  <Tooltip title="Add Charges as per projection details" placement="top" arrow>
                    <IconButton size="small">
                      <InfoOutlined color="primary" />
                    </IconButton>
                  </Tooltip>
                </>
              }

            </Box>
          </Box>
          {/* Tabs visible only if finalizedAggregatorId exists */}
          {finalizedAggregatorId && isQuoteAcceptRO && (
            <>
              <Tabs
                variant="fullWidth"
                // centered
                value={tabValue}
                onChange={handleChange}
                aria-label="Aggregator Process Tabs"
                sx={{
                  backgroundColor: "#f5f5f5",
                  borderRadius: 2,
                  p: 0.5,
                  ".MuiTab-root": {
                    borderRadius: 1,
                    textTransform: "none",
                    fontWeight: 700,
                    color: "#555",
                    minHeight: "40px",
                    px: 2,
                    "&:hover": {
                      backgroundColor: "#e0e0e0",
                    },
                    "&.Mui-selected": {
                      border: finalizedAggregatorId && tabValue === 'finalizedAggregator'
                        ? "1px solid green"
                        : "1px solid blue",
                      backgroundColor: finalizedAggregatorId && tabValue === 'finalizedAggregator'
                        ? "rgba(144, 238, 144, 0.3)"
                        : "rgba(173, 216, 230, 0.3)",
                      color: finalizedAggregatorId && tabValue === 'finalizedAggregator' ? "green" : "blue",
                    },
                  },
                  gap: 1,
                  "& .MuiTabs-flexContainer": { justifyContent: "center", gap: "8px" },
                }}
              >
                <Tab
                  icon={<CheckCircle />}
                  iconPosition="start"
                  label="Finalized Aggregator"
                  value="finalizedAggregator"
                />
                <Tab
                  icon={<Gavel />}
                  iconPosition="start"
                  label="All Selected Aggregators"
                  value="selectedAggregators"
                />
              </Tabs>

            </>
          )}

          <Table size="small" sx={{ mt: 1 }}>
            <TableHead>
              <TableRow>
                {AGGREGATOR_COLUMNS.map((col, idx) => (
                  <TableCell key={idx}>{col}</TableCell>
                ))}
                <TableCell>Quote Submission</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredAggregators.map((agg, idx) => {
                const isOpen = openRow === agg.aggregatorId;
                return (
                  <React.Fragment key={agg.aggregatorId || idx}>
                    <TableRow>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>{`AGG000${agg.aggregatorId || idx + 1}`}</TableCell>
                      <TableCell>{agg.aggregatorName}</TableCell>
                      <EndAlignedCell>{agg.totalGrossAmount}</EndAlignedCell>
                      <EndAlignedCell>{agg.totalVendorShare}</EndAlignedCell>
                      <EndAlignedCell>{agg.totalExpectedRevenue}</EndAlignedCell>
                      <TableCell>
                        <CenterAlign>
                          <StatusChipOrSelect value={agg.quoteStatus} type="status" />
                        </ CenterAlign>
                      </TableCell>
                      {/* </>
                      )} */}
                      <TableCell>
                        <CenterAlign>
                          <StatusChipOrSelect value={agg.status} type="status" />
                        </CenterAlign>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => setOpenRow(isOpen ? null : agg.aggregatorId)}
                        >
                          {isOpen ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                        </IconButton>
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell
                        colSpan={AGGREGATOR_COLUMNS?.length + (customerDetails?.isFinalApproved ? 6 : 3)}
                        sx={{ p: 0 }}
                      >
                        <Collapse in={isOpen} timeout="auto" unmountOnExit>
                          <QuoteTable
                            applicationDetails={customerDetails}
                            aggregatorId={agg.aggregatorId}
                            aggregatorName={agg.aggregatorName}
                            isRateAdded={Boolean(agg.sumOfRate)}
                          />
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </Box>
      )}
      <AddCharges openModal={openModal} setOpenModal={setOpenModal} applicationDetails={customerDetails} />

    </Box>
  );
};

export default AggregatorDetails;
