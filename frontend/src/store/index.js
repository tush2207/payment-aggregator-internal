import { configureStore } from "@reduxjs/toolkit";
import applicationFlowReducer from "./applicationFlowSlice";

export const store = configureStore({
  reducer: {
    applicationFlow: applicationFlowReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;
