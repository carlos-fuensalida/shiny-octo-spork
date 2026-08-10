import { ThemeProvider } from '@mui/material/styles';
import {
  render,
  type RenderOptions,
  type RenderResult,
} from '@testing-library/react';

import theme from '@/lib/theme';

/** Renders under the app theme so palette paths and spacing behave as in the app. */
export function renderWithTheme(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
): RenderResult {
  return render(ui, {
    wrapper: ({ children }) => (
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    ),
    ...options,
  });
}
