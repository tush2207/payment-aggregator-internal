import useStatusWiseAlert from "&src/components/ToastNotifications/useStatusWiseAlert";
import manageAggregatorServices from "&src/services/manageAggregator";
import { useEffect, useState } from "react";
import useToggle from "./useToggle";

const useAggregatorDetails = () => {
  const [aggregatorDetails, setAggregatorDetails] = useState([]);
  const { errorNotification } = useStatusWiseAlert();
  const { value: isLoading, setValue: setShowLoader } = useToggle();

  const fetchAllAggregators = async () => {
    setShowLoader(true);
    try {
      const response = await manageAggregatorServices.getAllAggregators();
      if (Array.isArray(response?.data)) {
        setAggregatorDetails(response?.data);
      } else {
        setAggregatorDetails([]);
      }
      setShowLoader(false);
    } catch (error) {
      setShowLoader(false);
      setAggregatorDetails([]);
      console.error("[ERROR] Failed to fetch aggregators:", error);
      errorNotification(error?.response?.data?.message || "Failed to fetch aggregators");
    }
  };

  useEffect(() => {
    fetchAllAggregators();
  }, []);

  return {
    aggregatorDetails,
    fetchAllAggregators,
    isLoading,
  };
};

export default useAggregatorDetails;
