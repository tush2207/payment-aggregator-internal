import { Box } from "@mui/material"

const CenterAlign = ({children}) => (
    <Box display="flex" justifyContent="center" alignContent='center' alignItems="center" height="100%">
        {children}
    </Box>
)
export default CenterAlign