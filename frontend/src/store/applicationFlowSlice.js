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
  async ({ applicationId, payload }, { dispatch, rejectWithValue }) => {
    try {
      const response = await applicationServices.updateApplication(applicationId, payload);
      // After update, refresh the details in state
      dispatch(fetchApplicationDetails(applicationId));
      return response?.data || response;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message || "Failed to update application");
    }
  }
);

// Utility to calculate active step dynamically from application details
const getActiveStepIndex = (app) => {
  if (!app) return 0;
  if (app.isFinalApproved) return 5; // All steps completed
  if (app.isQuoteAcceptRO) return 4; // Step 5: PO Details
  if (app.isMarkUpAddedCO) return 3; // Step 4: Quote Acceptance
  if (app.isAggregatorAdded) return 2; // Step 3: Add Markup (or Quote Submission/Evaluation)
  if (app.isProjectionAdded) return 1; // Step 2: Add Aggregator
  return 0; // Step 1: Update Projection
};

// Utility to generate structured workflow steps dynamically
const getWorkflowSteps = (app) => {
  if (!app) return [];
  return [
    {
      name: "Update Projection",
      role: "CO",
      status: app.isProjectionAdded ? "completed" : (app.isReviewByCO === true ? "active" : "pending"),
      completedDate: app.isProjectionAdded ? app.updatedAt || app.createdAt : null,
      remarks: app.isProjectionAdded ? "Projections/charges updated successfully" : null,
      userName: app.isProjectionAdded ? "Central Officer (CO)" : null,
    },
    {
      name: "Add Aggregator",
      role: "CO",
      status: app.isAggregatorAdded ? "completed" : (app.isProjectionAdded ? "active" : "pending"),
      completedDate: app.isAggregatorAdded ? app.updatedAt || app.createdAt : null,
      remarks: app.isAggregatorAdded ? "Sent to aggregators for quotes" : null,
      userName: app.isAggregatorAdded ? "Central Officer (CO)" : null,
    },
    {
      name: "Add Markup",
      role: "CO",
      status: app.isMarkUpAddedCO ? "completed" : (app.isAggregatorAdded ? "active" : "pending"),
      completedDate: app.isMarkUpAddedCO ? app.updatedAt || app.createdAt : null,
      remarks: app.isMarkUpAddedCO ? "Markup/charges proposed" : null,
      userName: app.isMarkUpAddedCO ? "Central Officer (CO)" : null,
    },
    {
      name: "Quote Acceptance",
      role: "RO",
      status: app.isQuoteAcceptRO ? "completed" : (app.isMarkUpAddedCO ? "active" : "pending"),
      completedDate: app.isQuoteAcceptRO ? app.updatedAt || app.createdAt : null,
      remarks: app.isQuoteAcceptRO ? "Quotation accepted by customer" : (app.reasonOfRejection ? `Rejected: ${app.reasonOfRejection}` : null),
      userName: app.isQuoteAcceptRO ? `Regional Head (RO)` : null,
    },
    {
      name: "PO Details",
      role: "CO",
      status: app.isFinalApproved ? "completed" : (app.isQuoteAcceptRO ? "active" : "pending"),
      completedDate: app.isFinalApproved ? app.updatedAt || app.createdAt : null,
      remarks: app.isFinalApproved ? "Purchase Order generated and finalized" : null,
      userName: app.isFinalApproved ? "Central Officer (CO)" : null,
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
      .addCase(updateApplicationWorkflow.fulfilled, (state) => {
        state.isLoading = false;
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
