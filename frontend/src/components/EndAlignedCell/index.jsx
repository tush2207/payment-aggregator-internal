import { TableCell } from "@mui/material";

const formatNumber = (value) => {
  if (value == null || value === "") return "-"; // handle empty/null
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(value);
};

const EndAlignedCell = ({ children, textAlign= "end", format = true, fontWeight, sx = {} }) => {
  const displayValue = format ? formatNumber(children) : children;

  return (
    <TableCell sx={{ textAlign:textAlign, fontWeight: fontWeight, ...sx }} >
      {displayValue}
    </TableCell>
  );
};

export default EndAlignedCell;
