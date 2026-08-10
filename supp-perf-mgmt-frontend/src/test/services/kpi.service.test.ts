import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/services/http', async () => {
  const actual =
    await vi.importActual<typeof import('@/services/http')>('@/services/http');
  return {
    ...actual,
    dataApi: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  };
});

import { HttpError } from '@/services/http';
import { dataApi } from '@/services/http';
import {
  getCostRecoveryDetail,
  getExhibitsDetail,
  getProductsOnHoldDetail,
  getQualityKpis,
  getSummaryKpis,
  getTopOffenders,
} from '@/services/kpi.service';
import type {
  CostRecoveryKpi,
  KpiCard,
  ProductsOnHoldKpi,
  QualityExhibitsKpi,
  SummaryKpiCard,
  TopOffenderChart,
} from '@/types';

const mockKpi: SummaryKpiCard = {
  kpiId: 'kpi-8d-capa',
  kpiName: '8Ds',
  category: 'QUALITY',
  region: 'GLOBAL',
  value: 38,
  unit: 'COUNT',
  status: null,
  reportingPeriod: '2026-01',
  lastUpdated: '2026-02-02T06:00:00Z',
  metrics: [
    { label: 'Total Open 2026', value: 38 },
    { label: 'Open > 90 Days', value: 9 },
  ],
};

const mockResponse = {
  data: [mockKpi],
  meta: { requestId: 'req-1', reportingPeriod: '2026-01' },
};

describe('getSummaryKpis', () => {
  beforeEach(() => vi.clearAllMocks());

  it('requests /kpis/summary with no query string when unfiltered', async () => {
    vi.mocked(dataApi.get).mockResolvedValue(mockResponse);
    await getSummaryKpis();
    expect(dataApi.get).toHaveBeenCalledWith('/kpis/summary');
  });

  it('encodes filters into the query string', async () => {
    vi.mocked(dataApi.get).mockResolvedValue(mockResponse);
    await getSummaryKpis({ region: 'NAR', year: 2026, month: 1 });

    const path = vi.mocked(dataApi.get).mock.calls[0][0] as string;
    expect(path.startsWith('/kpis/summary?')).toBe(true);
    expect(path).toContain('region=NAR');
    expect(path).toContain('year=2026');
    expect(path).toContain('month=1');
  });

  it('repeats array filters as separate params', async () => {
    vi.mocked(dataApi.get).mockResolvedValue(mockResponse);
    await getSummaryKpis({ supplierIds: ['sup-001', 'sup-002'] });

    const path = vi.mocked(dataApi.get).mock.calls[0][0] as string;
    expect(path).toContain('supplierIds=sup-001');
    expect(path).toContain('supplierIds=sup-002');
  });

  it('omits undefined filter values', async () => {
    vi.mocked(dataApi.get).mockResolvedValue(mockResponse);
    await getSummaryKpis({ region: undefined, commodity: 'Steel Forgings' });

    const path = vi.mocked(dataApi.get).mock.calls[0][0] as string;
    expect(path).not.toContain('region');
    expect(path).toContain('commodity=Steel+Forgings');
  });

  it('returns the envelope untouched, including the metrics array', async () => {
    vi.mocked(dataApi.get).mockResolvedValue(mockResponse);
    const res = await getSummaryKpis();

    expect(res.data).toHaveLength(1);
    expect(res.data[0].metrics).toEqual(mockKpi.metrics);
    expect(res.meta.requestId).toBe('req-1');
  });

  it('passes an empty data array through rather than throwing', async () => {
    vi.mocked(dataApi.get).mockResolvedValue({
      data: [],
      meta: { requestId: 'req-2' },
    });
    const res = await getSummaryKpis();
    expect(res.data).toEqual([]);
  });

  it('propagates HttpError from the transport', async () => {
    vi.mocked(dataApi.get).mockRejectedValue(
      new HttpError(500, 'Server error'),
    );
    await expect(getSummaryKpis()).rejects.toThrow('Server error');
  });
});

const mockQualityKpi: KpiCard = {
  kpiId: 'kpi-gsir',
  kpiName: 'GSIR',
  category: 'QUALITY',
  region: 'GLOBAL',
  value: 42,
  unit: 'COUNT',
  status: null,
  reportingPeriod: '2026-01',
  lastUpdated: '2026-02-02T06:00:00Z',
};

const mockQualityResponse = {
  data: [mockQualityKpi],
  meta: { requestId: 'req-q', reportingPeriod: '2026-01' },
};

describe('getQualityKpis', () => {
  beforeEach(() => vi.clearAllMocks());

  it('requests /kpis/quality with no query string when unfiltered', async () => {
    vi.mocked(dataApi.get).mockResolvedValue(mockQualityResponse);
    await getQualityKpis();
    expect(dataApi.get).toHaveBeenCalledWith('/kpis/quality');
  });

  it('encodes filters into the query string', async () => {
    vi.mocked(dataApi.get).mockResolvedValue(mockQualityResponse);
    await getQualityKpis({ region: 'NAR', year: 2026 });

    const path = vi.mocked(dataApi.get).mock.calls[0][0] as string;
    expect(path.startsWith('/kpis/quality?')).toBe(true);
    expect(path).toContain('region=NAR');
    expect(path).toContain('year=2026');
  });

  it('returns the envelope untouched', async () => {
    vi.mocked(dataApi.get).mockResolvedValue(mockQualityResponse);
    const res = await getQualityKpis();

    expect(res.data).toHaveLength(1);
    expect(res.data[0].kpiId).toBe('kpi-gsir');
    expect(res.meta.requestId).toBe('req-q');
  });

  it('passes an empty data array through rather than throwing', async () => {
    vi.mocked(dataApi.get).mockResolvedValue({
      data: [],
      meta: { requestId: 'req-empty' },
    });
    const res = await getQualityKpis();
    expect(res.data).toEqual([]);
  });

  it('propagates HttpError from the transport', async () => {
    vi.mocked(dataApi.get).mockRejectedValue(
      new HttpError(500, 'Server error'),
    );
    await expect(getQualityKpis()).rejects.toThrow('Server error');
  });
});

const mockChart: TopOffenderChart = {
  metricId: 'expedites',
  metricName: 'Expedites — ($ Value)',
  unit: 'USD',
  offenders: [
    {
      supplierId: 'sup-001',
      supplierName: 'Meridian Forge Co.',
      value: 1240000,
    },
    { supplierId: 'sup-002', supplierName: 'Apex Steel Works', value: 980000 },
  ],
};

const mockOffendersResponse = {
  data: [mockChart],
  meta: { requestId: 'req-to', reportingPeriod: '2026-01' },
};

describe('getTopOffenders', () => {
  beforeEach(() => vi.clearAllMocks());

  it('requests /kpis/top-offenders with no query string when unfiltered', async () => {
    vi.mocked(dataApi.get).mockResolvedValue(mockOffendersResponse);
    await getTopOffenders();
    expect(dataApi.get).toHaveBeenCalledWith('/kpis/top-offenders');
  });

  it('encodes filters into the query string', async () => {
    vi.mocked(dataApi.get).mockResolvedValue(mockOffendersResponse);
    await getTopOffenders({ region: 'NAR' });

    const path = vi.mocked(dataApi.get).mock.calls[0][0] as string;
    expect(path.startsWith('/kpis/top-offenders?')).toBe(true);
    expect(path).toContain('region=NAR');
  });

  it('returns the envelope untouched, including each chart’s offenders', async () => {
    vi.mocked(dataApi.get).mockResolvedValue(mockOffendersResponse);
    const res = await getTopOffenders();

    expect(res.data).toHaveLength(1);
    expect(res.data[0].offenders).toEqual(mockChart.offenders);
    expect(res.meta.requestId).toBe('req-to');
  });

  it('passes an empty data array through rather than throwing', async () => {
    vi.mocked(dataApi.get).mockResolvedValue({
      data: [],
      meta: { requestId: 'req-empty' },
    });
    const res = await getTopOffenders();
    expect(res.data).toEqual([]);
  });

  it('propagates HttpError from the transport', async () => {
    vi.mocked(dataApi.get).mockRejectedValue(
      new HttpError(500, 'Server error'),
    );
    await expect(getTopOffenders()).rejects.toThrow('Server error');
  });
});

const mockProductsOnHold: ProductsOnHoldKpi = {
  kpiId: 'kpi-products-on-hold',
  kpiName: 'Products on Hold',
  category: 'QUALITY',
  region: 'GLOBAL',
  value: 57,
  unit: 'COUNT',
  status: null,
  reportingPeriod: '2026-05',
  lastUpdated: '2026-06-02T06:00:00Z',
  segmentScope: 'GLOBAL',
  carryOver2025: 52,
  byMonth: [{ period: '2026-01', fullMonth: 22, eom: 85 }],
};

describe('getProductsOnHoldDetail', () => {
  beforeEach(() => vi.clearAllMocks());

  it('requests /kpis/kpi-products-on-hold with no query string when unfiltered', async () => {
    vi.mocked(dataApi.get).mockResolvedValue({
      data: [mockProductsOnHold],
      meta: { requestId: 'req-poh' },
    });
    await getProductsOnHoldDetail();
    expect(dataApi.get).toHaveBeenCalledWith('/kpis/kpi-products-on-hold');
  });

  it('encodes filters into the query string', async () => {
    vi.mocked(dataApi.get).mockResolvedValue({
      data: [mockProductsOnHold],
      meta: { requestId: 'req-poh' },
    });
    await getProductsOnHoldDetail({ region: 'NAR' });

    const path = vi.mocked(dataApi.get).mock.calls[0][0] as string;
    expect(path.startsWith('/kpis/kpi-products-on-hold?')).toBe(true);
    expect(path).toContain('region=NAR');
  });

  // One card per segment scope, so this endpoint is a list — not the single
  // object the T1 stub assumed (SPM-132).
  it('returns a list envelope, one entry per segment scope', async () => {
    vi.mocked(dataApi.get).mockResolvedValue({
      data: [
        mockProductsOnHold,
        { ...mockProductsOnHold, segmentScope: 'NAR' },
      ],
      meta: { requestId: 'req-poh' },
    });
    const res = await getProductsOnHoldDetail();

    expect(res.data).toHaveLength(2);
    expect(res.data[0].segmentScope).toBe('GLOBAL');
  });

  it('passes an empty data array through rather than throwing', async () => {
    vi.mocked(dataApi.get).mockResolvedValue({
      data: [],
      meta: { requestId: 'req-empty' },
    });
    const res = await getProductsOnHoldDetail();
    expect(res.data).toEqual([]);
  });

  it('propagates HttpError from the transport', async () => {
    vi.mocked(dataApi.get).mockRejectedValue(
      new HttpError(500, 'Server error'),
    );
    await expect(getProductsOnHoldDetail()).rejects.toThrow('Server error');
  });
});

const mockExhibits: QualityExhibitsKpi = {
  kpiId: 'kpi-exhibits',
  kpiName: 'Quality Exhibits',
  category: 'QUALITY',
  region: 'GLOBAL',
  value: 54,
  unit: 'COUNT',
  status: null,
  reportingPeriod: '2026-05',
  lastUpdated: '2026-06-02T06:00:00Z',
  completed: 11,
  ongoing: 18,
  delayed: 8,
  disposition: 3,
  notStarted: 14,
};

describe('getExhibitsDetail', () => {
  beforeEach(() => vi.clearAllMocks());

  it('requests /kpis/kpi-exhibits with no query string when unfiltered', async () => {
    vi.mocked(dataApi.get).mockResolvedValue({
      data: [mockExhibits],
      meta: { requestId: 'req-ex' },
    });
    await getExhibitsDetail();
    expect(dataApi.get).toHaveBeenCalledWith('/kpis/kpi-exhibits');
  });

  it('encodes filters into the query string', async () => {
    vi.mocked(dataApi.get).mockResolvedValue({
      data: [mockExhibits],
      meta: { requestId: 'req-ex' },
    });
    await getExhibitsDetail({ region: 'LAR' });

    const path = vi.mocked(dataApi.get).mock.calls[0][0] as string;
    expect(path.startsWith('/kpis/kpi-exhibits?')).toBe(true);
    expect(path).toContain('region=LAR');
  });

  // Status breakdown per region — deliberately not `OpenActionsKpi`, which
  // stays the 8Ds table's shape (SPM-132).
  it('returns a list envelope carrying the status breakdown', async () => {
    vi.mocked(dataApi.get).mockResolvedValue({
      data: [mockExhibits],
      meta: { requestId: 'req-ex' },
    });
    const res = await getExhibitsDetail();

    expect(res.data).toHaveLength(1);
    expect(res.data[0]).toMatchObject({
      completed: 11,
      ongoing: 18,
      delayed: 8,
      disposition: 3,
      notStarted: 14,
    });
  });

  it('passes an empty data array through rather than throwing', async () => {
    vi.mocked(dataApi.get).mockResolvedValue({
      data: [],
      meta: { requestId: 'req-empty' },
    });
    const res = await getExhibitsDetail();
    expect(res.data).toEqual([]);
  });

  it('propagates HttpError from the transport', async () => {
    vi.mocked(dataApi.get).mockRejectedValue(
      new HttpError(500, 'Server error'),
    );
    await expect(getExhibitsDetail()).rejects.toThrow('Server error');
  });
});

const mockCostRecovery: CostRecoveryKpi = {
  kpiId: 'kpi-cost-recovery',
  kpiName: 'Cost Recovery',
  category: 'QUALITY',
  region: 'GLOBAL',
  value: 15_000,
  unit: 'USD',
  status: null,
  reportingPeriod: '2026-05',
  lastUpdated: '2026-06-02T06:00:00Z',
  globalConversion: 24,
  totalRecovered: 15_000,
  ongoing: 24_000_000,
};

describe('getCostRecoveryDetail', () => {
  beforeEach(() => vi.clearAllMocks());

  it('requests /kpis/kpi-cost-recovery with no query string when unfiltered', async () => {
    vi.mocked(dataApi.get).mockResolvedValue({
      data: mockCostRecovery,
      meta: { requestId: 'req-cr' },
    });
    await getCostRecoveryDetail();

    expect(dataApi.get).toHaveBeenCalledWith('/kpis/kpi-cost-recovery');
  });

  it('encodes filters into the query string', async () => {
    vi.mocked(dataApi.get).mockResolvedValue({
      data: mockCostRecovery,
      meta: { requestId: 'req-cr' },
    });
    await getCostRecoveryDetail({ region: 'LAR' });

    const path = vi.mocked(dataApi.get).mock.calls[0][0] as string;
    expect(path.startsWith('/kpis/kpi-cost-recovery?')).toBe(true);
    expect(path).toContain('region=LAR');
  });

  it('returns the three card figures as raw numbers', async () => {
    vi.mocked(dataApi.get).mockResolvedValue({
      data: mockCostRecovery,
      meta: { requestId: 'req-cr' },
    });
    const res = await getCostRecoveryDetail();

    expect(res.data).toMatchObject({
      globalConversion: 24,
      totalRecovered: 15_000,
      ongoing: 24_000_000,
    });
  });

  // Single-object endpoint: "no detail" is null with HTTP 200, not an error
  // (§14) — the equivalent of `data: []` on the list endpoints.
  it('passes a null detail through rather than throwing', async () => {
    vi.mocked(dataApi.get).mockResolvedValue({
      data: null,
      meta: { requestId: 'req-empty' },
    });
    const res = await getCostRecoveryDetail();
    expect(res.data).toBeNull();
  });

  it('propagates HttpError from the transport', async () => {
    vi.mocked(dataApi.get).mockRejectedValue(
      new HttpError(500, 'Server error'),
    );
    await expect(getCostRecoveryDetail()).rejects.toThrow('Server error');
  });
});
