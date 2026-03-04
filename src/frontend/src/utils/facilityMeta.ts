// Facility items and sector logs are stored in sessionStorage
// keyed by facilityId since the backend has no updateFacility API.

export interface FacilityItem {
  id: string;
  name: string;
  description: string;
  imageDataUrl?: string;
  price: number;
  stock: number;
  supply: number;
}

export interface SectorLogEntry {
  id: string;
  content: string;
  mediaDataUrl?: string;
  mediaType?: string;
  authorId: string;
  authorName: string;
  classLevel: number;
  createdAt: number;
}

function getItemsKey(facilityId: string): string {
  return `xution_items_${facilityId}`;
}

function getLogsKey(facilityId: string): string {
  return `xution_sectorlogs_${facilityId}`;
}

export function loadItems(facilityId: string): FacilityItem[] {
  try {
    const raw = sessionStorage.getItem(getItemsKey(facilityId));
    return raw ? (JSON.parse(raw) as FacilityItem[]) : [];
  } catch {
    return [];
  }
}

export function saveItems(facilityId: string, items: FacilityItem[]): void {
  try {
    sessionStorage.setItem(getItemsKey(facilityId), JSON.stringify(items));
  } catch {
    // ignore
  }
}

export function loadLogs(facilityId: string): SectorLogEntry[] {
  try {
    const raw = sessionStorage.getItem(getLogsKey(facilityId));
    return raw ? (JSON.parse(raw) as SectorLogEntry[]) : [];
  } catch {
    return [];
  }
}

export function saveLogs(facilityId: string, logs: SectorLogEntry[]): void {
  try {
    sessionStorage.setItem(getLogsKey(facilityId), JSON.stringify(logs));
  } catch {
    // ignore
  }
}
