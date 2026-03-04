// An "office" is a Facility where location starts with "__OFFICE__"
// An office with address: location === "__OFFICE__|addr:<address>"
// A "facility" belonging to an office has location === "office:<officeId>"

export function isOfficeFacility(f: { location: string }): boolean {
  return (
    f.location === "__OFFICE__" || f.location.startsWith("__OFFICE__|addr:")
  );
}

export function isFacilityForOffice(
  f: { location: string },
  officeId: string,
): boolean {
  return f.location === `office:${officeId}`;
}

export function officeFacilityLocation(address?: string): string {
  if (address?.trim()) {
    return `__OFFICE__|addr:${address.trim()}`;
  }
  return "__OFFICE__";
}

export function facilityForOfficeLocation(officeId: string): string {
  return `office:${officeId}`;
}

export function parseOfficeAddress(location: string): string {
  const match = location.match(/^__OFFICE__\|addr:(.+)$/);
  return match ? match[1] : "";
}

export function makeOfficeLocation(address: string): string {
  return officeFacilityLocation(address);
}
