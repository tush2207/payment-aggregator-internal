import React, { useState, useEffect } from 'react';
import { CircularProgress, Box, Typography } from '@mui/material';

const SectionLoader = props => {
    return (
        <Box {...props}>
            <Box textAlign="center">
                <CircularProgress />
            </Box>
        </Box>
    );
};

export default SectionLoader;
