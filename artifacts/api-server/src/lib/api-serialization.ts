export function serializeIncident<T extends { createdAt: Date }>(
  incident: T,
): Omit<T, "createdAt"> & { createdAt: string } {
  return { ...incident, createdAt: incident.createdAt.toISOString() };
}

export function serializeAttachment<T extends { createdAt: Date }>(
  attachment: T,
): Omit<T, "createdAt"> & { createdAt: string } {
  return { ...attachment, createdAt: attachment.createdAt.toISOString() };
}