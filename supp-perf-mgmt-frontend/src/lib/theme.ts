'use client';

import { createTheme } from '@mui/material/styles';

// Color tokens — named after the color itself, not its purpose.
// Semantic meaning lives in the palette or in component usage, not here.
const tokens = {
  // Blues / navy
  navy: '#0d436b',
  skyBlue: '#00a0dd',
  iceBlue: '#edf4fc', // lightest blue; also used as primary contrast text

  // Neutrals — the design system's named ramp (Figma: NEAR BLACK → EXTRA LIGHT GRAY)
  white: '#ffffff',
  charcoal: '#484948', // primary text (Figma "NEAR BLACK")
  grayMid: '#767777', // secondary / muted text (Figma "DARK GRAY")
  gray: '#d1d3d4', // table row separators (Figma "GRAY")
  grayLight: '#f5f5f5', // neutral chip / card tint
  cloudGray: '#dee0e3', // borders and dividers (Figma "LIGHT GRAY")
  grayLightest: '#f5f6f7', // table header fill (Figma "EXTRA LIGHT GRAY")

  // Green family
  green: '#6aa342', // on-track status indicator
  greenDark: '#2e7d32', // on-track text / success semantic
  greenLight: '#f1f8ec', // on-track chip background
  greenLightest: '#e8f5e9', // on-track card background (softer tint)

  // Amber / yellow family (watch status)
  amber: '#eeb111', // watch status indicator
  amberMid: '#c98f00', // hover variant (e.g. FAB hover on amber bg)
  amberDark: '#7a5200', // watch text on light bg
  amberLight: '#fff8e1', // watch chip background
  accentYellowMid: '#f3d04f', // chart series fill (Figma "brand/accent-yellow-mid")

  // Orange family (at-risk status)
  orange: '#e08650', // at-risk status indicator

  // Red family
  red: '#d32f2f', // error semantic
  redDark: '#c62828', // at-risk / error text on light bg
  redLight: '#fdecea', // at-risk chip / error tint background

  // Deep orange (semantic warning)
  deepOrange: '#ef6c00',

  // Alert surface tints — the soft status fills used behind alert banners and
  // status-highlighted table cells. `alertBg` is the warning tint; the error and
  // success tints join it as `error.light` / `success.light` in the palette.
  alertBg: '#fff4e5',
  alertText: '#663c00',
  alertBorder: '#ffe0b2',
  alertErrorBg: '#fdeded',
  alertSuccessBg: '#edf7ed',
} as const;

export { tokens };

const theme = createTheme({
  breakpoints: {
    values: { xs: 0, sm: 600, md: 900, lg: 1280, xl: 1536 },
  },
  palette: {
    primary: {
      main: tokens.navy,
      contrastText: tokens.iceBlue,
    },
    secondary: {
      main: tokens.skyBlue,
      contrastText: tokens.white,
    },
    background: {
      default: tokens.iceBlue,
      paper: tokens.white,
    },
    text: {
      primary: tokens.charcoal,
      secondary: tokens.grayMid,
    },
    // `light` on each status is the soft surface tint (status-cell / alert
    // background), `main` the border-and-text colour — the pairing the Figma
    // alert and table-highlight styles use.
    error: { main: tokens.red, light: tokens.alertErrorBg },
    success: { main: tokens.greenDark, light: tokens.alertSuccessBg },
    warning: {
      main: tokens.deepOrange,
      light: tokens.alertBg,
      dark: tokens.alertText,
    },
    divider: tokens.cloudGray,
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
    h1: { fontSize: '24px', fontWeight: 400 },
    h2: { fontSize: '20px', fontWeight: 500, letterSpacing: '0.15px' },
    h3: { fontSize: '16px', fontWeight: 500 },
    body1: { fontSize: '14px', fontWeight: 400 },
    body2: { fontSize: '12px', fontWeight: 400 },
    subtitle2: {
      fontFamily: `var(--font-open-sans), Open Sans, sans-serif`,
      fontSize: '13px',
      fontWeight: 600,
      letterSpacing: '0.15px',
    },
    button: {
      fontSize: '13px',
      fontWeight: 500,
      letterSpacing: '0.46px',
      textTransform: 'uppercase',
    },
    overline: {
      fontSize: '12px',
      fontWeight: 400,
      letterSpacing: '1px',
    },
  },
  shape: {
    borderRadius: 4,
  },
  spacing: 4,
  components: {
    MuiToolbar: {
      styleOverrides: {
        root: ({ theme }) => ({
          [theme.breakpoints.up('sm')]: {
            paddingLeft: '12px',
            paddingRight: '12px',
          },
          [theme.breakpoints.up('xl')]: {
            paddingLeft: '32px',
            paddingRight: '32px',
          },
        }),
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        html: { height: '100%' },
        body: { height: '100%', backgroundColor: tokens.iceBlue },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: `1px solid ${tokens.cloudGray}`,
          borderRadius: 8,
          boxShadow: 'none',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          fontFamily: 'Roboto, Arial, sans-serif',
          fontSize: '14px',
          fontWeight: 500,
          letterSpacing: '0.4px',
          textTransform: 'uppercase',
          color: tokens.charcoal,
          '&.Mui-selected': { color: tokens.skyBlue },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: { backgroundColor: tokens.skyBlue },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 4 },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 4 },
      },
    },
    // Table typography follows the Figma design system's `table/header` and
    // `typography/body2` styles (Roboto 14px). Corrected in SPM-130 from the
    // SPM-91 placeholder (Open Sans 12px, grey headers), which predated pulling
    // the real tokens — same correction story as MetricColumn in SPM-114.
    //
    // These live on MuiTableCell's own slots rather than as descendant
    // selectors under MuiTableHead/MuiTableBody (`& .MuiTableCell-body`) on
    // purpose: a descendant selector scores 0,2,0 and would outrank any `sx`
    // on the cell (0,1,0), so per-cell colour — e.g. the PPM/CAL status
    // highlights via `Column.cellSx` — could never take effect.
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontSize: '14px',
          fontWeight: 500,
          lineHeight: '24px',
          letterSpacing: '0.17px',
          color: tokens.navy,
        },
        body: {
          fontSize: '14px',
          fontWeight: 400,
          letterSpacing: '0.17px',
          color: tokens.charcoal,
          borderBottomColor: tokens.gray,
        },
      },
    },
  },
});

export default theme;
