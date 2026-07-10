import { ThemeProvider as MuiThemeProvider, createTheme } from "@mui/material/styles";

export default function ThemeProvider({ children }) {
  const gradients = {
    main: "linear-gradient(to right, #6682cb, #1b2851)",
    light: "linear-gradient(to right, #8ea4db, #35406b)",
    dark: "linear-gradient(to right, #4e65a7, #11192e)",
    hover: "linear-gradient(to right, #7691d6, #222f5e)",
    disabled: "linear-gradient(to right, #b1bada, #5f6a8f)",
  };

  const theme = createTheme({
    typography: {
      fontFamily: "Work Sans, sans-serif",
    },

    custom: { gradients },

    components: {
      /* ---------------------- PREMIUM TABLE CONTAINER ----------------------- */
      MuiTableContainer: {
        styleOverrides: {
          root: {
            borderRadius: 18,
            overflow: "hidden",
            background: "rgba(255,255,255,0.65)",
            backdropFilter: "blur(12px)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
          },
        },
      },

      /* ---------------------- PREMIUM TABLE HEADER -------------------------- */
      MuiTableHead: {
        styleOverrides: {
          root: {
            background: gradients.main,
            "& th": {
              padding: "9px 12px !important",
              fontSize: "13.5px",
              fontWeight: 700,
              color: "#ffffff",
              borderBottom: "1px solid rgba(255,255,255,0.2)",
              textShadow: "0 1px 3px rgba(0,0,0,0.3)",
              userSelect: "none",
            },
          },
        },
      },

      /* ---------------------- PREMIUM TABLE ROW ----------------------------- */
      MuiTableRow: {
        styleOverrides: {
          root: {
            transition: "all 0.25s ease",
            "&:hover": {
              // background: "rgba(102,130,203,0.09)",
              transform: "scale(1.003)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
            },
          },
        },
      },

      /* ---------------------- PREMIUM TABLE CELL ---------------------------- */
      MuiTableCell: {
        styleOverrides: {
          root: {
            padding: "8px 12px !important",
            fontSize: "13px",
            borderBottom: "1px solid rgba(0,0,0,0.08)",
          },
        },
      },

      /* ---------------------- PREMIUM ICON BUTTON --------------------------- */
      MuiIconButton: {
        styleOverrides: {
          root: {
            transition: "0.25s",
            "&:hover": {
              transform: "scale(1.15)",
              background: "rgba(102,130,203,0.15)",
            },
          },
        },
      },

      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: "none",
            fontWeight: 600,
            borderRadius: "12px",
            transition: "0.25s ease",

            padding: "6px 10px !important",
            // minHeight:'32px',
            // lineHeight:1.3,
            fontSize: "14px",
          },

          /* ---------------------- CONTAINED BUTTON ---------------------- */
          contained: {
            background:
              "linear-gradient(90deg, #1565C0 0%, #1E88E5 50%, #42A5F5 100%)",
            boxShadow: "0 6px 15px rgba(25,118,210,.3)",

            "&:hover": {
              transform: "scale(1.05)",
              background:
                "linear-gradient(90deg, #0D47A1 0%, #1565C0 50%, #1E88E5 100%)",
              boxShadow: "0 8px 20px rgba(25,118,210,.4)",
            },

            "&.Mui-disabled": {
              background:
                "linear-gradient(90deg, #b1bada 0%, #5f6a8f 100%) !important",
              color: "#e6e6e6 !important",
              boxShadow: "none",
              opacity: 0.8,
            },
          },

          /* ---------------------- OUTLINED BUTTON ----------------------- */
          outlined: {
            lineHeight:1.5,
            borderWidth: "2px !important",
            borderColor: "rgba(21, 101, 192, 0.6) !important",
            color: "#1565C0",
            background: "rgba(255,255,255,0.25)",
            backdropFilter: "blur(8px)",

            "&:hover": {
              borderColor: "#0D47A1 !important",
              color: "#0D47A1",
              background: "rgba(21,101,192,0.10)",
              transform: "scale(1.05)",
              boxShadow: "0 6px 18px rgba(21,101,192,0.25)",
            },

            "&.Mui-disabled": {
              borderColor: "rgba(0,0,0,0.2) !important",
              color: "rgba(0,0,0,0.3) !important",
              opacity: 0.6,
            },
          },

          /* ---------------------- TEXT / STANDARD BUTTON ---------------------- */
          text: {
            color: "#1565C0",
            background: "transparent",

            "&:hover": {
              color: "#0D47A1",
              background: "rgba(21,101,192,0.10)",
              transform: "scale(1.03)",
            },

            "&.Mui-disabled": {
              color: "rgba(0,0,0,0.3) !important",
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            // marginTop: "6px",

            "& .MuiOutlinedInput-root": {
              borderRadius: "12px",
              background: "rgba(255, 255, 255, 0.45)",
              backdropFilter: "blur(10px)",
              transition: "all 0.25s ease",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",

              /* ----------- Default Border ----------- */
              "& fieldset": {
                borderColor: "rgba(21, 101, 192, 0.3)",
                transition: "all 0.25s ease",
              },

              /* ----------- Hover ----------- */
              "&:hover fieldset": {
                borderColor: "#1565C0",
                boxShadow: "0 0 12px rgba(21,101,192,0.25)",
              },

              /* ----------- Focus ----------- */
              "&.Mui-focused fieldset": {
                borderColor: "#0D47A1",
                boxShadow: "0 0 12px rgba(13,71,161,0.35)",
                borderWidth: "2px",
              },

              /* ----------- Disabled ----------- */
              "&.Mui-disabled": {
                background: "rgba(240,240,240,0.6)",
                borderRadius: "12px",
                opacity: 0.7,

                "& fieldset": {
                  borderColor: "rgba(0,0,0,0.2)",
                },
              },
            },

            /* ----------- Input Text ----------- */
            "& .MuiInputBase-input": {
              padding: "10px 14px",
              fontSize: "14px",
              fontWeight: 500,
            },

            /* ----------- Placeholder ----------- */
            "& .MuiInputBase-input::placeholder": {
              color: "rgba(0,0,0,0.4)",
              fontWeight: 400,
            },

            /* ----------- Label ----------- */
            "& .MuiInputLabel-root": {
              fontSize: "14px",
              fontWeight: 500,
              color: "#1b2851",
            },

            /* ----------- Label on Focus ----------- */
            "& .MuiInputLabel-root.Mui-focused": {
              color: "#0D47A1",
              fontWeight: 600,
            },

            /* ----------- Error State ----------- */
            "& .MuiOutlinedInput-root.Mui-error fieldset": {
              borderColor: "#d32f2f !important",
              boxShadow: "0 0 8px rgba(211,47,47,0.25)",
            },
            "& .MuiFormHelperText-root.Mui-error": {
              fontWeight: 600,
            },
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          root: {
            borderRadius: "12px",
            background: "rgba(255, 255, 255, 0.45)",
            backdropFilter: "blur(10px)",
            transition: "all 0.25s ease",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",

            "&.Mui-disabled": {
              background: "rgba(240,240,240,0.6)",
              opacity: 0.7,
            },
          },

          /* Dropdown Icon Styling */
          icon: {
            color: "#1565C0",
            transition: "all 0.25s ease",
          },
        },
      },
    },
  });

  return <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>;
}