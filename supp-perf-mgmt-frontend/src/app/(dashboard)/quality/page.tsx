import FilterListIcon from '@mui/icons-material/FilterList';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import Box from '@mui/material/Box';

import QualitySections from '@/components/quality/QualitySections';
import type { ViewHeaderAction } from '@/components/ui';
import { ViewHeader } from '@/components/ui';

// Bound to real filter state once the global filter bar is wired.
const COMMODITY = 'Steel Forgings';
const REGION_LABEL = 'All regions';

// Disabled stubs — behaviour not yet defined (mirrors the Summary header).
const ACTIONS: ViewHeaderAction[] = [
  { label: 'Filters', icon: <FilterListIcon />, disabled: true },
  { label: 'Export', icon: <SaveAltIcon />, disabled: true },
];

export default function QualityPage() {
  return (
    <Box display="flex" flexDirection="column" gap={6}>
      <ViewHeader
        title="Quality"
        subtitle={`${COMMODITY} · ${REGION_LABEL}`}
        actions={ACTIONS}
      />
      <QualitySections />
    </Box>
  );
}
