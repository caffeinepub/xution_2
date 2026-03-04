// An "office" is a Facility where location === "__OFFICE__"
// A "facility" belonging to an office has location === "office:<officeId>"

export function isOfficeFacility(f: { location: string }): boolean {
  return f.location === "__OFFICE__";
}

export function isFacilityForOffice(
  f: { location: string },
  officeId: string,
): boolean {
  return f.location === `office:${officeId}`;
}

export function officeFacilityLocation(): string {
  return "__OFFICE__";
}

export function facilityForOfficeLocation(officeId: string): string {
  return `office:${officeId}`;
}
