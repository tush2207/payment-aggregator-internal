import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import palette, { GRADIENTS, GOLD, NAVY, RED } from './palette';
import typography from './typography';
import shadows from './shadows';
import getComponentsOverride from './components';

export default function ThemeProvider({ children }) {
    const theme = createTheme({
        typography,
        palette,
        shape: { borderRadius: 10 },
        shadows,
        custom: {
            gradients: GRADIENTS,
            navy: NAVY,
            red: RED,
            gold: GOLD,
        },
        components: getComponentsOverride(),
    });

    return <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>;
}