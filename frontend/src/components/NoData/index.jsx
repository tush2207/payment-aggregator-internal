import { emptyBox } from "&src/assets";
import { Box, Typography } from "@mui/material";

const NoData = ({ message = "No Data Found" }) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        // py: 4,
        width: '100%'
      }}
    >
      <img
        src={emptyBox}
        alt="No Data"
        style={{ width: 180, height: 180, opacity: 0.7, mb: 2 }}
      />
      <Typography variant="body1" color="text.secondary" component='div'>
        {message}
      </Typography>
    </Box>
  );
};

export default NoData;
