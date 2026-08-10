import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import FilterListIcon from '@mui/icons-material/FilterList';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import Box from '@mui/material/Box';

import DeliveryPerformanceSection from '@/components/summary/DeliveryPerformanceSection';
import QualityPerformanceSection from '@/components/summary/QualityPerformanceSection';
import TopOffendersSection from '@/components/summary/TopOffendersSection';
import type { ViewHeaderAction } from '@/components/ui';
import { ViewHeader } from '@/components/ui';

// Bound to real filter state once the global filter bar is wired.
const COMMODITY = 'Steel Forgings';
const REGION_LABEL = 'All regions';

// Disabled stubs — behaviour not yet defined (UI_REQUIREMENTS_SPEC §4).
const ACTIONS: ViewHeaderAction[] = [
  { label: "Customize KPI's", icon: <DragIndicatorIcon />, disabled: true },
  { label: 'Filters', icon: <FilterListIcon />, disabled: true },
  { label: 'Export', icon: <SaveAltIcon />, disabled: true },
];

export default function SummaryPage() {
  return (
    <Box display="flex" flexDirection="column" gap={4}>
      <ViewHeader
        title="Portfolio Snapshot"
        subtitle={`${COMMODITY} · ${REGION_LABEL}`}
        actions={ACTIONS}
      />

      <Box display="flex" flexDirection="column" gap={4}>
        <QualityPerformanceSection />
        <DeliveryPerformanceSection />
        <TopOffendersSection />
      </Box>
    </Box>
  );
}
