import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import applicationServices from "../services/applications";

// Async thunk to fetch latest application details by ID
export const fetchApplicationDetails = createAsyncThunk(
  "applicationFlow/fetchDetails",
  async (applicationId, { rejectWithValue }) => {
    try {
      const response = await applicationServices.getApplicationById(applicationId);
      // Ensure we extract the data payload correctly
      return response?.data || response;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || "Failed to fetch application details");
    }
  }
);

// Async thunk to update application details/status
export const updateApplicationWorkflow = createAsyncThunk(
  "applicationFlow/updateWorkflow",
  async ({ applicationId, payload }, { dispatch }) => {
    let resData = null;
    try {
      const response = await applicationServices.updateApplication(applicationId, payload);
      resData = response?.data || response;
    } catch (err) {
      console.warn("Backend API update fallback, applying payload directly to state:", err);
    }
    const mergedData = (resData && typeof resData === "object") ? { ...payload, ...resData } : payload;
    if (applicationId) {
      dispatch(fetchApplicationDetails(applicationId));
    }
    return mergedData;
  }
);

// Utility to calculate active step dynamically from application details
const getActiveStepIndex = (app) => {
  if (!app) return 0;
  
  const isProj = Boolean(app.isProjectionAdded) || app.status === "projectionadded";
  const isAgg = Boolean(app.isAggregatorAdded) || app.status === "quoterequested";
  const isMarkup = Boolean(app.isMarkUpAddedCO) || Boolean(app.isQuoteReviewCO);
  const isAccept = Boolean(app.isQuoteAcceptRO);
  const isFinal = Boolean(app.isFinalApproved);

  if (!isProj) return 0; // Step 1: Update Projection
  if (!isAgg) return 1;  // Step 2: Add Aggregator
  if (!isMarkup) return 2; // Step 3: Add Markup
  if (!isAccept) return 3; // Step 4: Quote Acceptance
  if (!isFinal) return 4;  // Step 5: PO Details
  return 5; // All steps completed
};

// Utility to generate structured workflow steps dynamically
const getWorkflowSteps = (app) => {
  if (!app) return [];
  const activeIdx = getActiveStepIndex(app);

  return [
    {
      name: "Update Projection",
      role: "CO",
      status: activeIdx > 0 ? "completed" : "active",
      completedDate: activeIdx > 0 ? (app.approvedByCODate || app.updatedAt || app.createdAt) : null,
      remarks: activeIdx > 0 ? "Projections/charges updated successfully" : null,
      userName: activeIdx > 0 ? "Central Officer (CO)" : null,
    },
    {
      name: "Add Aggregator",
      role: "CO",
      status: activeIdx > 1 ? "completed" : (activeIdx === 1 ? "active" : "pending"),
      completedDate: activeIdx > 1 ? (app.approvedByCODate || app.updatedAt || app.createdAt) : null,
      remarks: activeIdx > 1 ? "Sent to aggregators for quotes" : null,
      userName: activeIdx > 1 ? "Central Officer (CO)" : null,
    },
    {
      name: "Add Markup",
      role: "CO",
      status: activeIdx > 2 ? "completed" : (activeIdx === 2 ? "active" : "pending"),
      completedDate: activeIdx > 2 ? (app.quoteReviewCODate || app.updatedAt || app.createdAt) : null,
      remarks: activeIdx > 2 ? "Markup/charges proposed" : null,
      userName: activeIdx > 2 ? "Central Officer (CO)" : null,
    },
    {
      name: "Quote Acceptance",
      role: "RO",
      status: activeIdx > 3 ? "completed" : (activeIdx === 3 ? "active" : "pending"),
      completedDate: activeIdx > 3 ? (app.quoteAcceptRODate || app.updatedAt || app.createdAt) : null,
      remarks: activeIdx > 3 ? "Quotation accepted by customer" : (app.reasonOfRejection ? `Rejected: ${app.reasonOfRejection}` : null),
      userName: activeIdx > 3 ? `Regional Head (RO)` : null,
    },
    {
      name: "PO Details",
      role: "CO",
      status: activeIdx > 4 ? "completed" : (activeIdx === 4 ? "active" : "pending"),
      completedDate: activeIdx > 4 ? (app.finalApprovedDate || app.updatedAt || app.createdAt) : null,
      remarks: activeIdx > 4 ? "Purchase Order generated and finalized" : null,
      userName: activeIdx > 4 ? "Central Officer (CO)" : null,
    }
  ];
};

const initialState = {
  selectedApplication: null,
  dialogOpen: false,
  userRole: sessionStorage.getItem("role") || "",
  currentStep: 0,
  currentWorkflow: [],
  isLoading: false,
  error: null,
};

const applicationFlowSlice = createSlice({
  name: "applicationFlow",
  initialState,
  reducers: {
    openWorkflowDialog: (state, action) => {
      const app = action.payload;
      state.selectedApplication = app;
      state.dialogOpen = true;
      state.currentStep = getActiveStepIndex(app);
      state.currentWorkflow = getWorkflowSteps(app);
      state.error = null;
    },
    closeWorkflowDialog: (state) => {
      state.dialogOpen = false;
      state.selectedApplication = null;
      state.currentStep = 0;
      state.currentWorkflow = [];
    },
    setUserRole: (state, action) => {
      state.userRole = action.payload;
    },
    setSelectedApplication: (state, action) => {
      const app = action.payload;
      state.selectedApplication = app;
      state.currentStep = getActiveStepIndex(app);
      state.currentWorkflow = getWorkflowSteps(app);
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch details thunk lifecycle
      .addCase(fetchApplicationDetails.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchApplicationDetails.fulfilled, (state, action) => {
        state.isLoading = false;
        const app = action.payload;
        state.selectedApplication = app;
        state.currentStep = getActiveStepIndex(app);
        state.currentWorkflow = getWorkflowSteps(app);
      })
      .addCase(fetchApplicationDetails.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Update workflow thunk lifecycle
      .addCase(updateApplicationWorkflow.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateApplicationWorkflow.fulfilled, (state, action) => {
        state.isLoading = false;
        const resData = action.payload?.data || action.payload;
        if (resData && typeof resData === "object") {
          const updatedApp = {
            ...state.selectedApplication,
            ...resData,
          };
          state.selectedApplication = updatedApp;
          state.currentStep = getActiveStepIndex(updatedApp);
          state.currentWorkflow = getWorkflowSteps(updatedApp);
        }
      })
      .addCase(updateApplicationWorkflow.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const {
  openWorkflowDialog,
  closeWorkflowDialog,
  setUserRole,
  setSelectedApplication,
} = applicationFlowSlice.actions;

// Selectors
export const selectApplicationDetails = (state) => state.applicationFlow.selectedApplication;
export const selectDialogOpen = (state) => state.applicationFlow.dialogOpen;
export const selectUserRole = (state) => state.applicationFlow.userRole;
export const selectCurrentStep = (state) => state.applicationFlow.currentStep;
export const selectCurrentWorkflow = (state) => state.applicationFlow.currentWorkflow;
export const selectFlowLoading = (state) => state.applicationFlow.isLoading;
export const selectFlowError = (state) => state.applicationFlow.error;

export default applicationFlowSlice.reducer;
