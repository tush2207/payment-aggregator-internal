
import { Typography } from '@mui/material'
import React from 'react'

const TextFieldLabel = ({
  label,
  required
}) => {
  return (
    <Typography variant="subtitle1" gutterBottom component='div'>
      {label}
      {required && (
        <span style={{ color: 'red', marginLeft: '4px' }}>*</span>
      )}
    </Typography>

  )
}

export default TextFieldLabel
