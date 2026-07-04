import { Expense, MemberBalance, Settlement, SettlementSuggestion } from "./types";

/**
 * Round to paise/cents to avoid floating point drift accumulating across
 * many small shares (e.g. splitting ₹100 three ways).
 */
function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Computes each member's net balance within a group from raw expenses and
 * completed settlements.
 *
 * For every expense: the payer is credited the full amount, and every
 * participant (including the payer, if they're also splitting it) is
 * debited their share. A completed settlement moves the balance directly:
 * paying off a debt credits the payer and debits the receiver.
 *
 * Net > 0  → this member is owed money overall.
 * Net < 0  → this member owes money overall.
 */
export function calculateBalances(
  expenses: Expense[],
  settlements: Settlement[],
  memberIds: string[]
): MemberBalance[] {
  const net = new Map<string, number>(memberIds.map((id) => [id, 0]));

  const bump = (userId: string, delta: number) => {
    net.set(userId, round2((net.get(userId) ?? 0) + delta));
  };

  for (const expense of expenses) {
    bump(expense.paid_by, expense.amount);
    for (const p of expense.participants ?? []) {
      bump(p.user_id, -p.share_amount);
    }
  }

  for (const s of settlements) {
    if (s.status !== "completed") continue;
    // from_user paid to_user, so from_user's debt shrinks (net goes up
    // toward 0) and to_user's credit shrinks (net goes down toward 0).
    bump(s.from_user, s.amount);
    bump(s.to_user, -s.amount);
  }

  return Array.from(net.entries()).map(([userId, value]) => ({ userId, net: value }));
}

/**
 * Greedy minimum-transaction settlement: repeatedly matches the largest
 * creditor with the largest debtor until everyone nets to zero. This is
 * the standard "debt simplification" approach — it doesn't preserve who
 * originally owed whom, it just minimizes the number of payments needed
 * to settle the whole group.
 */
export function suggestSettlements(balances: MemberBalance[]): SettlementSuggestion[] {
  const EPSILON = 0.01;
  const creditors = balances
    .filter((b) => b.net > EPSILON)
    .map((b) => ({ ...b }))
    .sort((a, b) => b.net - a.net);
  const debtors = balances
    .filter((b) => b.net < -EPSILON)
    .map((b) => ({ ...b, net: -b.net }))
    .sort((a, b) => b.net - a.net);

  const result: SettlementSuggestion[] = [];
  let i = 0;
  let j = 0;

  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];
    const amount = round2(Math.min(creditor.net, debtor.net));

    if (amount > EPSILON) {
      result.push({ fromUserId: debtor.userId, toUserId: creditor.userId, amount });
    }

    creditor.net = round2(creditor.net - amount);
    debtor.net = round2(debtor.net - amount);

    if (creditor.net <= EPSILON) i++;
    if (debtor.net <= EPSILON) j++;
  }

  return result;
}

export function totalGroupSpend(expenses: Expense[]): number {
  return round2(expenses.reduce((sum, e) => sum + e.amount, 0));
}

export function splitEqually(amount: number, participantIds: string[]): Record<string, number> {
  const share = round2(amount / participantIds.length);
  const shares: Record<string, number> = {};
  let allocated = 0;
  participantIds.forEach((id, idx) => {
    if (idx === participantIds.length - 1) {
      // last person absorbs the rounding remainder so shares always sum
      // exactly to `amount`
      shares[id] = round2(amount - allocated);
    } else {
      shares[id] = share;
      allocated = round2(allocated + share);
    }
  });
  return shares;
}
