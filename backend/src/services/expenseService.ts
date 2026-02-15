import { Types } from "mongoose";
import { Expense } from "../models/Expense";

export const addExpenseItem = async (params: {
  tripId: string;
  description: string;
  amount: number;
  paidByUserId: string;
  splitBetweenUserIds: string[];
}) => {
  let expense = await Expense.findOne({ trip: params.tripId });
  if (!expense) {
    expense = await Expense.create({
      trip: new Types.ObjectId(params.tripId),
      items: [],
      settlements: [],
    });
  }
  expense.items.push({
    description: params.description,
    amount: params.amount,
    paidBy: new Types.ObjectId(params.paidByUserId),
    splitBetween: params.splitBetweenUserIds.map(
      (id) => new Types.ObjectId(id)
    ),
  });

  // Simple equal split algorithm (placeholder).
  const balances = new Map<string, number>();
  for (const item of expense.items) {
    const share =
      item.splitBetween.length > 0
        ? item.amount / item.splitBetween.length
        : 0;
    const payerId = item.paidBy.toString();
    balances.set(payerId, (balances.get(payerId) || 0) + item.amount);
    for (const u of item.splitBetween) {
      const id = u.toString();
      balances.set(id, (balances.get(id) || 0) - share);
    }
  }

  const positive: { id: string; amount: number }[] = [];
  const negative: { id: string; amount: number }[] = [];
  for (const [id, bal] of balances) {
    if (bal > 0.01) positive.push({ id, amount: bal });
    else if (bal < -0.01) negative.push({ id, amount: -bal });
  }

  positive.sort((a, b) => b.amount - a.amount);
  negative.sort((a, b) => b.amount - a.amount);

  const settlements: { from: string; to: string; amount: number }[] = [];
  let i = 0;
  let j = 0;
  while (i < positive.length && j < negative.length) {
    const p = positive[i];
    const n = negative[j];
    const amount = Math.min(p.amount, n.amount);
    settlements.push({ from: n.id, to: p.id, amount });
    p.amount -= amount;
    n.amount -= amount;
    if (p.amount < 0.01) i++;
    if (n.amount < 0.01) j++;
  }

  expense.settlements = settlements.map((s) => ({
    from: new Types.ObjectId(s.from),
    to: new Types.ObjectId(s.to),
    amount: s.amount,
  }));

  await expense.save();
  return expense;
};

export const getExpense = async (tripId: string) => {
  return Expense.findOne({ trip: tripId }).lean();
};

