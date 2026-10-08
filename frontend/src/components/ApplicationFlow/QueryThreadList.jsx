import React from 'react';
import {
  Box,
  Typography,
  Stack,
  Button,
  TextField,
  Chip,
  Card,
  CardActionArea,
  CircularProgress,
} from '@mui/material';
import {
  AddCircleOutlineRounded,
  SearchRounded,
  ChatBubbleOutlineRounded,
  ForumOutlined,
} from '@mui/icons-material';
import { formatDateAndTime } from '&src/utils';

export const QueryThreadList = ({
  queries = [],
  selectedQuery = null,
  onSelectQuery,
  onOpenCreate,
  searchQuery,
  onChangeSearch,
  loading = false,
}) => {
  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Search & New Query Button */}
      <Box sx={{ p: 1.5, borderBottom: '1px solid #e2e8f0', display: 'flex', gap: 1 }}>
        <TextField
          size="small"
          placeholder="Search queries..."
          fullWidth
          value={searchQuery}
          onChange={(e) => onChangeSearch(e.target.value)}
          InputProps={{
            startAdornment: <SearchRounded sx={{ color: '#94a3b8', fontSize: 18, mr: 0.5 }} />,
          }}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
        />
        <Button
          variant="contained"
          size="small"
          startIcon={<AddCircleOutlineRounded />}
          onClick={onOpenCreate}
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            borderRadius: '8px',
          }}
        >
          Raise Query
        </Button>
      </Box>

      {/* Query List */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 1.5 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : queries.length > 0 ? (
          <Stack spacing={1}>
            {queries.map((q) => {
              const isSelected = selectedQuery?.ticketId === q.ticketId || selectedQuery?.id === q.id;
              const isResolved = (q.status || '').toLowerCase() === 'resolved';

              return (
                <Card
                  key={q.ticketId || q.id}
                  variant="outlined"
                  sx={(theme) => ({
                    borderRadius: '10px',
                    borderColor: isSelected ? theme.palette.primary.main : theme.palette.divider,
                    borderWidth: isSelected ? '2px' : '1px',
                    bgcolor: isSelected ? `${theme.palette.primary.main}0A` : '#ffffff',
                    transition: 'all 0.15s ease',
                  })}
                >
                  <CardActionArea onClick={() => onSelectQuery(q)} sx={{ p: 1.2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                      <Typography variant="subtitle2" fontWeight={700} sx={{ fontSize: '0.85rem' }} noWrap>
                        {q.subject || 'Query Subject'}
                      </Typography>
                      <Chip
                        label={q.status || 'Open'}
                        size="small"
                        color={isResolved ? 'success' : 'warning'}
                        sx={{ height: 20, fontSize: '10px', fontWeight: 700 }}
                      />
                    </Box>

                    <Typography variant="caption" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.3 }}>
                      {q.comments || q.message || 'No message content'}
                    </Typography>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                      <Typography variant="caption" color="text.disabled" sx={{ fontSize: '10px' }}>
                        {formatDateAndTime(q.createdAt || q.created_at)}
                      </Typography>
                      <Typography variant="caption" fontWeight={600} color="primary.main" sx={{ fontSize: '10px' }}>
                        {q.targetOffice ? `Target: ${q.targetOffice}` : ''}
                      </Typography>
                    </Box>
                  </CardActionArea>
                </Card>
              );
            })}
          </Stack>
        ) : (
          <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
            <ChatBubbleOutlineRounded sx={{ fontSize: 36, color: '#94a3b8', mb: 1 }} />
            <Typography variant="body2" fontWeight={600}>
              No queries raised yet
            </Typography>
            <Typography variant="caption">
              Click "Raise Query" above to start a conversation.
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default QueryThreadList;
