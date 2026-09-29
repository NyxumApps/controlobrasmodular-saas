export function canDemoteOwner(
  targetRole: "owner_manager" | "office" | "site_manager",
  nextRole: "owner_manager" | "office" | "site_manager",
  ownerCount: number,
): boolean {
  return !(
    targetRole === "owner_manager" &&
    nextRole !== "owner_manager" &&
    ownerCount <= 1
  );
}

export function isValidPayment(amount: number, pendingPayment: number): boolean {
  return Number.isInteger(amount) && amount > 0 && amount <= pendingPayment;
}