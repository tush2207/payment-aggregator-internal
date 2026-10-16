import { TableCell } from "@mui/material";
import { formatAppNumber } from "&src/utils/numberFormatter";

const EndAlignedCell = ({ children, textAlign = "end", format = true, fontWeight, sx = {} }) => {
  const displayValue = format ? formatAppNumber(children) : children;

  return (
    <TableCell sx={{ textAlign: textAlign, fontWeight: fontWeight, ...sx }}>
      {displayValue}
    </TableCell>
  );
};

export default EndAlignedCell;
