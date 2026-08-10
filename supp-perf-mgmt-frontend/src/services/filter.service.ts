import { z } from 'zod';

import type {
  ApiResponse,
  FilterMetadata,
  SavedFilterPreference,
} from '@/types';

import { dataApi } from './http';

const PlantSchema = z.object({
  plantId: z.string(),
  plantName: z.string(),
  region: z.enum(['GLOBAL', 'LAR', 'NAR']),
  country: z.string().optional(),
});

const FilterMetadataSchema = z.object({
  regions: z.array(z.enum(['GLOBAL', 'LAR', 'NAR'])),
  years: z.array(z.number()),
  months: z.array(z.number()),
  plants: z.array(PlantSchema),
  commodities: z.array(z.string()),
  subcommodities: z.array(z.string()),
  categories: z.array(z.string()),
  supplierLocations: z.array(z.string()),
});

export async function getFilterMetadata(): Promise<FilterMetadata> {
  const res = await dataApi.get<ApiResponse<FilterMetadata>>(
    '/kpis/filters/metadata',
  );
  return FilterMetadataSchema.parse(res.data);
}

export async function getSavedFilters(): Promise<SavedFilterPreference[]> {
  const res = await dataApi.get<{ data: SavedFilterPreference[] }>(
    '/filters/saved',
  );
  return res.data;
}

export async function saveFilter(
  payload: Omit<
    SavedFilterPreference,
    'id' | 'userId' | 'createdAt' | 'updatedAt'
  >,
): Promise<SavedFilterPreference> {
  const res = await dataApi.post<ApiResponse<SavedFilterPreference>>(
    '/filters/saved',
    payload,
  );
  return res.data;
}

export async function updateFilter(
  id: string,
  payload: Partial<SavedFilterPreference>,
): Promise<SavedFilterPreference> {
  const res = await dataApi.put<ApiResponse<SavedFilterPreference>>(
    `/filters/saved/${id}`,
    payload,
  );
  return res.data;
}

export async function deleteFilter(id: string): Promise<void> {
  await dataApi.delete(`/filters/saved/${id}`);
}
