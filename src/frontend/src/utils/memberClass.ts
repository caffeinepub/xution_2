export function encodeMemberEmail(class_: number, xutNumber: string): string {
  return `class:${class_}|xut:${xutNumber}`;
}

export function decodeMemberEmail(email: string): {
  class_: number;
  xutNumber: string;
} {
  const classMatch = email.match(/class:(\d+)/);
  const xutMatch = email.match(/xut:([^|]*)/);
  return {
    class_: classMatch ? Number.parseInt(classMatch[1]) : 1,
    xutNumber: xutMatch ? xutMatch[1] : "",
  };
}

export function getMemberClass(member: { email: string }): number {
  return decodeMemberEmail(member.email).class_;
}

export function getMemberXut(member: { email: string }): string {
  return decodeMemberEmail(member.email).xutNumber;
}

export function getClassLabel(class_: number): string {
  return `Class ${class_}`;
}
