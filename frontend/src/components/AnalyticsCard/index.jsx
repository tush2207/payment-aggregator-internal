import { Card, CardContent, Typography, Box } from "@mui/material";
import { styled } from "@mui/material/styles";

// 🎛 Neumorphism Main Card
const NeoCard = styled(Card)(({ theme }) => ({
    borderRadius: "20px",
    padding: "22px",
    background: "#e9eef5",
    boxShadow: `
    10px 10px 20px #c7ccd3,
    -10px -10px 20px #ffffff
  `,
    transition: "all 0.3s ease",
    cursor: "pointer",

    "&:hover": {
        transform: "translateY(-4px)",
        boxShadow: `
      14px 14px 28px #c7ccd3,
      -14px -14px 28px #ffffff
    `,
    },
}));

// 🌀 Icon container with pressed effect
const SoftIcon = styled(Box)(({ color }) => ({
    width: 70,
    height: 70,
    borderRadius: "12px",
    background: "#e9eef5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: color,
    fontSize: "50px",
    boxShadow: `
    inset 4px 4px 10px #c7ccd3,
    inset -4px -4px 10px #ffffff
  `,
}));

export default function AnalyticsCard({ title, value, icon, color = "#1976d2" }) {
    return (
        <NeoCard elevation={0}>
            <CardContent sx={{ p: 0 }}>
                <Box display="flex" alignItems="center" gap={2}>

                    {/* Icon with Neumorphic Emboss */}
                    <SoftIcon color={color}>{icon}</SoftIcon>

                    {/* Text Section */}
                    <Box>
                        <Typography
                            variant="subtitle2"
                            sx={{
                                opacity: 0.6,
                                fontWeight: 600,
                                letterSpacing: 0.5,
                                textTransform: "uppercase",
                            }}
                        >
                            {title}
                        </Typography>

                        <Typography
                            variant="h4"
                            fontWeight={800}
                            sx={{
                                color: color,
                                mt: 0.5,
                            }}
                        >
                            {value}
                        </Typography>
                    </Box>
                </Box>
            </CardContent>
        </NeoCard>
    );
}
