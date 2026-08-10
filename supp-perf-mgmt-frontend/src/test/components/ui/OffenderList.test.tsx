import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import OffenderList from '@/components/ui/OffenderList';
import type { TopOffenderBar } from '@/types';

import { renderWithTheme } from '../../utils/renderWithTheme';

const offenders: TopOffenderBar[] = [
  {
    supplierId: 'sup-rwb-forge',
    supplierName: 'RWB Forge',
    value: 1250,
    caption: 'EMEA · top offender',
  },
  {
    supplierId: 'sup-acros-ltd',
    supplierName: 'Acros LTD',
    value: 980,
    caption: 'NAR',
  },
  {
    supplierId: 'sup-robert-forge',
    supplierName: 'Robert Forge',
    value: 820,
  },
];

describe('OffenderList', () => {
  it('renders every supplier name, value, and caption', () => {
    renderWithTheme(<OffenderList offenders={offenders} unit="PPM" />);

    expect(screen.getByText('RWB Forge')).toBeInTheDocument();
    expect(screen.getByText('1,250 PPM')).toBeInTheDocument();
    expect(screen.getByText('EMEA · top offender')).toBeInTheDocument();

    expect(screen.getByText('Acros LTD')).toBeInTheDocument();
    expect(screen.getByText('980 PPM')).toBeInTheDocument();
    expect(screen.getByText('NAR')).toBeInTheDocument();
  });

  it('renders a row without a caption', () => {
    renderWithTheme(<OffenderList offenders={offenders} unit="PPM" />);

    expect(screen.getByText('Robert Forge')).toBeInTheDocument();
    expect(screen.getByText('820 PPM')).toBeInTheDocument();
  });

  it('renders an inline empty state when there are no offenders', () => {
    renderWithTheme(<OffenderList offenders={[]} unit="PPM" />);
    expect(screen.getByText('No offenders')).toBeInTheDocument();
  });

  it('renders the skeleton variant with placeholder rows', () => {
    const { container } = renderWithTheme(<OffenderList.Skeleton />);
    expect(
      container.querySelectorAll('.MuiSkeleton-root').length,
    ).toBeGreaterThan(0);
  });
});
