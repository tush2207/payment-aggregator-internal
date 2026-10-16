import React from 'react';
import { Grid, Card, CardContent, Typography, Box, Chip, alpha, useTheme } from '@mui/material';

/**
 * CommonKpiCards Component
 * Standardized, responsive row of interactive KPI metric cards across CBI PAPG Portal.
 * Eliminates duplicate card JSX in Dashboard and Applications pages.
 */
export default function CommonKpiCards({
  cards = [],
  selectedId = null,
  onCardClick = null,
}) {
  const theme = useTheme();
  if (!cards || cards.length === 0) return null;

  return (
    <Grid container spacing={2} mb={3}>
      {cards.map((card) => {
        const isSelected = selectedId === card.id;
        const cardColor = card.color || theme.palette.primary.main;
        const bgGradient = card.bgGradient || `linear-gradient(135deg, ${alpha(cardColor, 0.12)} 0%, ${alpha(cardColor, 0.02)} 100%)`;

        return (
          <Grid item xs={12} sm={6} md={4} lg={12 / Math.min(cards.length, 5)} key={card.id}>
            <Card
              onClick={() => onCardClick && onCardClick(card.id)}
              elevation={0}
              sx={{
                cursor: onCardClick ? 'pointer' : 'default',
                p: 0,
                borderRadius: '14px',
                border: '2px solid',
                borderColor: isSelected ? cardColor : 'grey.200',
                background: isSelected ? bgGradient : theme.palette.background.paper,
                boxShadow: isSelected
                  ? `0 6px 18px ${alpha(cardColor, 0.25)}`
                  : '0 2px 8px rgba(0,0,0,0.03)',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden',
                '&:hover': onCardClick
                  ? {
                      transform: 'translateY(-3px)',
                      boxShadow: `0 8px 20px ${alpha(cardColor, 0.22)}`,
                      borderColor: cardColor,
                    }
                  : {},
              }}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.2 }}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: alpha(cardColor, 0.12),
                      color: cardColor,
                    }}
                  >
                    {card.icon}
                  </Box>

                  {card.badge && (
                    <Chip
                      label={card.badge}
                      size="small"
                      sx={{
                        bgcolor: isSelected ? cardColor : alpha(cardColor, 0.08),
                        color: isSelected ? theme.palette.common.white : cardColor,
                        fontWeight: 700,
                        fontSize: '0.68rem',
                        borderRadius: '6px',
                        height: 20,
                      }}
                    />
                  )}
                </Box>

                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.80rem' }}>
                  {card.title || card.label}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mt: 0.4 }}>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: cardColor, fontSize: '1.75rem', lineHeight: 1.1 }}>
                    {card.value}
                  </Typography>

                  <Typography variant="caption" sx={{ color: isSelected ? cardColor : 'text.disabled', fontSize: '0.70rem', fontWeight: 600 }}>
                    {card.subValue || (onCardClick ? (isSelected ? '● Filtering active' : 'Click to filter') : '')}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
}
