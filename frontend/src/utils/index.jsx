import ActionColumn from "&src/components/ActionColumn";
import { WORK_FLOW_STATUS } from "&src/constants/PaymentAggregratorConstant";

export const RS = "₹"
export const PERCENTAGE = "%"


export const formatDateAndTime = (dateString) => {
  const date = new Date(dateString);
  const options = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    // second: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata'
  }
  return date.toLocaleString("en-US", options)
}

export const getActionsColumn = ({
  onEdit,
  onDelete,
  onView,
  headerName = 'Actions',
  width = 120,
  editBtnName,
  flex,
  onMgs,
  onReply
} = {}) => ({
  field: 'actions',
  headerName,
  width,
  sortable: false,
  filterable: false,
  align: 'center',
  headerAlign: 'center',
  flex: flex,
  renderCell: (params) => (
    <ActionColumn
      row={params.row}
      onEdit={onEdit}
      onDelete={onDelete}
      onView={onView}
      editBtnName={editBtnName}
      onMgs={onMgs}
      onReply={onReply}
    />
  ),
});

export const sumofAggregatorRates = (details = []) => {
  return details?.reduce((sum, item) => {
    const rate = parseFloat(item.rate) || 0;
    if (item.unit === PERCENTAGE) {
      return sum + rate / 100
    }
    else {
      return sum + rate
    }
  }, 0)
}

export const formatNumber = (val, decimals = 2) => {
  const num = Number(val);
  return isNaN(num) ? "-" : num.toFixed(decimals);
};

export const numberInputWithoutArrowsSX = {
  '& input[type=number]': {
    MozAppearance: 'textfield', // Firefox
  },
  '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
    WebkitAppearance: 'none', // Chrome, Safari
    margin: 0,
  },
}

export const currentDateAndTime = new Date().toLocaleString('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: true,
  timeZone: 'Asia/Kolkata'
});

export const timestamp = () => Date.now();

// Converts a string like "Event Management" to "eventManagement"
export const toCamelCase = (str) => {
  return str
    ?.toLowerCase()
    ?.replace(/[^a-zA-Z0-9 ]/g, '')
    ?.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
      index === 0 ? word.toLowerCase() : word.toUpperCase()
    )
    .replace(/\s+/g, '');
};

// Converts camelCase to "Title Case" like "eventManagement" -> "Event Management"
export const toTitleCase = (str) => {
  return str
    ?.toLowerCase()
    ?.split(" ")
    ?.map(word => word.charAt(0).toUpperCase() + word.slice(1))
    ?.join(" ");
};

// Converts a URL search string like '?dispatch' to 'Dispatch'

export function formatSearchQuery(search) {
  if (!search) return '';

  const query = search?.startsWith('?') ? search?.slice(1) : search;
  return query?.charAt(0)?.toUpperCase() + query?.slice(1);
}

export const currentDate = (() => {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0'); // Months are 0-based
  const year = String(d.getFullYear()); // Full 4-digit year
  return `${day}-${month}-${year}`;
})();

export const removeEmptySpace = (value) => value?.replaceAll(" ", "");


// Convert array → pipe-separated string (for POST)
export function preparePayload(data) {
  return {
    ...data,
    services: Array.isArray(data?.services) ? data?.services?.join("|") : data.services,
    isDeleted: data.isDeleted ?? false, // ensure it's always present
  };
}

// Convert pipe-separated string → array (for GET response)
export function parseResponse(data) {
  return data.map(item => ({
    ...item,
    services: typeof item.services === "string" ? item.services.split("|") : item.services
  }));
}


export const getVerifyButtonProps = (status) => {
  const isVerified = WORK_FLOW_STATUS.includes(status);
  return {
    label: isVerified ? "Verified" : "Verify",
    color: isVerified ? "success" : "info",
    variant: isVerified ? "contained" : "outlined",
  };
};

export function sortAggregatorsByQuote(aggregators) {
  return [...aggregators].sort((a, b) => a.totalQuote - b.totalQuote);
}

// Function to encode the data in base64
export const encodeBase64 = (data) => {
  return window.btoa(unescape(encodeURIComponent(data)));
};
