import {
  SlotGenerationConfig,
  GeneratedSlotPreview,
  CapacityCalculationResult,
} from '@/lib/validations/scheduling';
import { formatToIST } from '@/lib/crypto/tokens';

export interface CandidateToAssign {
  id: string;
  fullName: string;
  enrollmentNo: string;
}

export interface PanelInfo {
  id: string;
  name: string;
  meetLink?: string | null;
}

/**
 * Computes window minutes and capacity validation for simultaneous panels.
 */
export function calculateScheduleCapacity(
  config: SlotGenerationConfig,
  totalCandidates: number
): CapacityCalculationResult {
  const [startH, startM] = config.startTime.split(':').map(Number);
  const [endH, endM] = config.endTime.split(':').map(Number);
  const totalWindowMinutes = (endH * 60 + endM) - (startH * 60 + startM);

  const cycleTime = config.slotDurationMinutes + config.bufferMinutes;
  const slotsPerPanel = Math.floor(totalWindowMinutes / cycleTime);
  const totalSlotsCapacity = slotsPerPanel * config.panelIds.length;
  const fitsInWindow = totalSlotsCapacity >= totalCandidates;
  const surplusOrDeficit = totalSlotsCapacity - totalCandidates;

  return {
    totalCandidates,
    selectedPanelsCount: config.panelIds.length,
    slotDurationMinutes: config.slotDurationMinutes,
    bufferMinutes: config.bufferMinutes,
    totalWindowMinutes,
    slotsPerPanel,
    totalSlotsCapacity,
    fitsInWindow,
    surplusOrDeficit,
  };
}

/**
 * Generates slots across panels and distributes candidates evenly using round-robin.
 * Does not silently drop any candidate or truncate times.
 */
export function generateDraftSchedulePlan(
  config: SlotGenerationConfig,
  panels: PanelInfo[],
  candidates: CandidateToAssign[]
): {
  slots: GeneratedSlotPreview[];
  unassignedCandidates: CandidateToAssign[];
  capacity: CapacityCalculationResult;
} {
  const capacity = calculateScheduleCapacity(config, candidates.length);
  const [startH, startM] = config.startTime.split(':').map(Number);
  const cycleTime = config.slotDurationMinutes + config.bufferMinutes;

  // 1. Generate empty time slots per panel
  const panelSlotsMap: Map<string, GeneratedSlotPreview[]> = new Map();
  panels.forEach((p) => {
    panelSlotsMap.set(p.id, []);
  });

  // Interpret date in IST (Asia/Kolkata +05:30)
  for (let sIdx = 0; sIdx < capacity.slotsPerPanel; sIdx++) {
    const slotOffsetStart = sIdx * cycleTime;
    const slotOffsetEnd = slotOffsetStart + config.slotDurationMinutes;

    const startTotalMin = startH * 60 + startM + slotOffsetStart;
    const endTotalMin = startH * 60 + startM + slotOffsetEnd;

    const startHourStr = String(Math.floor(startTotalMin / 60)).padStart(2, '0');
    const startMinStr = String(startTotalMin % 60).padStart(2, '0');
    const endHourStr = String(Math.floor(endTotalMin / 60)).padStart(2, '0');
    const endMinStr = String(endTotalMin % 60).padStart(2, '0');

    // Create ISO string with Asia/Kolkata offset (+05:30)
    const startIso = `${config.interviewDate}T${startHourStr}:${startMinStr}:00+05:30`;
    const endIso = `${config.interviewDate}T${endHourStr}:${endMinStr}:00+05:30`;

    panels.forEach((panel) => {
      const slot: GeneratedSlotPreview = {
        panelId: panel.id,
        panelName: panel.name,
        meetLink: panel.meetLink,
        startsAt: new Date(startIso).toISOString(),
        endsAt: new Date(endIso).toISOString(),
        startsAtFormatted: formatToIST(startIso),
        endsAtFormatted: formatToIST(endIso),
      };
      panelSlotsMap.get(panel.id)?.push(slot);
    });
  }

  // 2. Round-robin candidate assignment across panels
  const allGeneratedSlots: GeneratedSlotPreview[] = [];
  const unassignedCandidates: CandidateToAssign[] = [];

  let candidateIdx = 0;
  for (let sIdx = 0; sIdx < capacity.slotsPerPanel; sIdx++) {
    for (const panel of panels) {
      const slotList = panelSlotsMap.get(panel.id);
      const slot = slotList?.[sIdx];
      if (!slot) continue;

      if (candidateIdx < candidates.length) {
        const cand = candidates[candidateIdx];
        slot.assignedCandidateId = cand.id;
        slot.assignedCandidateName = cand.fullName;
        slot.assignedCandidateEnrollment = cand.enrollmentNo;
        candidateIdx++;
      }
      allGeneratedSlots.push(slot);
    }
  }

  // If candidate count exceeds slots capacity, collect unassigned candidates
  while (candidateIdx < candidates.length) {
    unassignedCandidates.push(candidates[candidateIdx]);
    candidateIdx++;
  }

  // Sort chronologically by startsAt and then panelName
  allGeneratedSlots.sort((a, b) => {
    const timeCompare = new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
    if (timeCompare !== 0) return timeCompare;
    return a.panelName.localeCompare(b.panelName);
  });

  return {
    slots: allGeneratedSlots,
    unassignedCandidates,
    capacity,
  };
}
