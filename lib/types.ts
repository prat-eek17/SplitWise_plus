export type Category =
  | "food"
  | "travel"
  | "shopping"
  | "rent"
  | "bills"
  | "entertainment"
  | "other";

export const CATEGORY_META: Record<Category, { label: string; emoji: string }> = {
  food: { label: "Food", emoji: "🍔" },
  travel: { label: "Travel", emoji: "🚗" },
  shopping: { label: "Shopping", emoji: "🛒" },
  rent: { label: "Rent", emoji: "🏠" },
  bills: { label: "Bills", emoji: "💡" },
  entertainment: { label: "Entertainment", emoji: "🎮" },
  other: { label: "Other", emoji: "✨" },
};

export interface Profile {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
}

export interface Group {
  id: string;
  name: string;
  emoji: string;
  created_by: string;
  created_at: string;
}

export interface GroupMember {
  group_id: string;
  user_id: string;
  role: "owner" | "member";
  joined_at: string;
  profile?: Profile;
}

export interface ExpenseParticipant {
  expense_id: string;
  user_id: string;
  share_amount: number;
  profile?: Profile;
}

export interface Expense {
  id: string;
  group_id: string;
  title: string;
  amount: number;
  paid_by: string;
  category: Category;
  notes: string | null;
  expense_date: string;
  expense_time: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  paid_by_profile?: Profile;
  participants?: ExpenseParticipant[];
}

export interface Settlement {
  id: string;
  group_id: string;
  from_user: string;
  to_user: string;
  amount: number;
  status: "pending" | "completed";
  created_at: string;
  settled_at: string | null;
  from_profile?: Profile;
  to_profile?: Profile;
}

export type ActivityType =
  | "expense_added"
  | "expense_edited"
  | "expense_deleted"
  | "member_joined"
  | "member_left"
  | "settlement_completed";

export interface ActivityItem {
  id: string;
  group_id: string;
  actor_id: string | null;
  type: ActivityType;
  message: string;
  metadata: Record<string, unknown>;
  created_at: string;
  actor?: Profile;
}

/** Net balance for one member within a single group. Positive = owed to them. */
export interface MemberBalance {
  userId: string;
  net: number;
}

/** A single directional debt: fromUser owes toUser this amount. */
export interface SettlementSuggestion {
  fromUserId: string;
  toUserId: string;
  amount: number;
}
