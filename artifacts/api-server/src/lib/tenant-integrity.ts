export function belongsToCompany(
  resource: { companyId: string } | undefined,
  companyId: string,
): boolean {
  return resource?.companyId === companyId;
}

export function budgetItemBelongsToWork(
  item: { companyId: string; workId: string } | undefined,
  companyId: string,
  workId: string,
): boolean {
  return belongsToCompany(item, companyId) && item?.workId === workId;
}