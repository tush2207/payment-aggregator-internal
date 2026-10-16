import React from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import { Visibility, Edit, Delete, MessageSharp, ReplyAllSharp, ChatSharp, InsertComment } from '@mui/icons-material';
import PropTypes from 'prop-types';

const ActionColumn = ({ row, onView, onEdit, onDelete, disableDelete = false, editBtnName, onMgs, onReply }) => {
  return (
    <Box display="flex" gap={1} justifyContent='center'>
      {onView && (
        <Tooltip title="View" placement='top' arrow>
          <IconButton color="primary" onClick={() => onView(row)}>
            <Visibility />
          </IconButton>
        </Tooltip>
      )}
      {onEdit && (
        <Tooltip title="Modify" placement='top' arrow>
          <IconButton color="primary" onClick={() => onEdit(row)}>
            <Edit /> {editBtnName}
          </IconButton>
        </Tooltip>
      )}
      {onDelete && !disableDelete && (
        <Tooltip title="Delete" placement='top' arrow>
          <IconButton color="error" onClick={() => onDelete(row)}>
            <Delete />
          </IconButton>
        </Tooltip>
      )}
        {onReply && (
        <Tooltip title="Reply " placement='top' arrow>
          <IconButton color="primary" onClick={() => onReply(row)}>
            <ReplyAllSharp />
          </IconButton>
        </Tooltip>
      )}
      {onMgs && (
        <Tooltip title={row?.remark} placement='top' arrow>
          <IconButton color="primary">
            <InsertComment />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
};

ActionColumn.propTypes = {
  row: PropTypes.object.isRequired,
  onView: PropTypes.func,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  disableDelete: PropTypes.bool,
};

export default ActionColumn;
