import useStatusWiseAlert from "&src/components/feedback/ToastNotifications/useStatusWiseAlert";
import manageAggregatorServices from "&src/services/manageAggregator";
import { useEffect, useState } from "react";
import useToggle from "./useToggle";

const FALLBACK_AGGREGATORS = [
  {
    aggregatorId: 1,
    aggregatorName: 'Razorpay',
    contactPersonName: 'Varun Sharma',
    email: 'onboarding@razorpay.com',
    mobileNo: '9820123456',
    services: 'Credit Cards | Debit Cards | Net Banking | UPI | Corporate Net Banking',
    status: 'active',
  },
  {
    aggregatorId: 2,
    aggregatorName: 'BillDesk',
    contactPersonName: 'Sanjay Kulkarni',
    email: 'partner-desk@billdesk.com',
    mobileNo: '9820234567',
    services: 'Credit Cards | Debit Cards | Net Banking | UPI | Corporate Net Banking | Wallets',
    status: 'active',
  },
  {
    aggregatorId: 3,
    aggregatorName: 'CCAvenue',
    contactPersonName: 'Amit Mehta',
    email: 'merchant.services@ccavenue.com',
    mobileNo: '9820345678',
    services: 'Credit Cards | Debit Cards | Net Banking | UPI | International Cards',
    status: 'active',
  },
  {
    aggregatorId: 4,
    aggregatorName: 'PayU',
    contactPersonName: 'Pooja Verma',
    email: 'banking-alliances@payu.in',
    mobileNo: '9820456789',
    services: 'Credit Cards | Debit Cards | Net Banking | UPI | BNPL & EMI Payments',
    status: 'active',
  },
  {
    aggregatorId: 5,
    aggregatorName: 'Worldline',
    contactPersonName: 'Ramesh Iyer',
    email: 'alliances@worldline.com',
    mobileNo: '9820567890',
    services: 'Credit Cards | Debit Cards | Net Banking | UPI | Bharat QR',
    status: 'active',
  },
  {
    aggregatorId: 6,
    aggregatorName: 'Cashfree',
    contactPersonName: 'Deepak Roy',
    email: 'banking@cashfree.com',
    mobileNo: '9820678901',
    services: 'Credit Cards | Debit Cards | Net Banking | UPI | AutoPay',
    status: 'active',
  },
  {
    aggregatorId: 7,
    aggregatorName: 'Paytm',
    contactPersonName: 'Neha Singh',
    email: 'pg.support@paytm.com',
    mobileNo: '9820789012',
    services: 'Credit Cards | Debit Cards | Net Banking | UPI | Paytm Wallet',
    status: 'active',
  },
];

const useAggregatorDetails = () => {
  const [aggregatorDetails, setAggregatorDetails] = useState([]);
  const { errorNotification } = useStatusWiseAlert();
  const { value: isLoading, setValue: setShowLoader } = useToggle();

  const fetchAllAggregators = async () => {
    setShowLoader(true);
    try {
      const response = await manageAggregatorServices.getAllAggregators();
      const data = Array.isArray(response?.data) ? response.data : (Array.isArray(response) ? response : []);
      if (data.length > 0) {
        setAggregatorDetails(data);
      } else {
        setAggregatorDetails(FALLBACK_AGGREGATORS);
      }
      setShowLoader(false);
    } catch (error) {
      setShowLoader(false);
      console.warn("[WARN] Failed to fetch aggregators from API, using standard panel:", error);
      setAggregatorDetails(FALLBACK_AGGREGATORS);
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
