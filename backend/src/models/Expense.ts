import mongoose, { Schema, Document, Types } from "mongoose";

interface ExpenseItem {
  description: string;
  amount: number;
  paidBy: Types.ObjectId;
  splitBetween: Types.ObjectId[];
}

interface Settlement {
  from: Types.ObjectId;
  to: Types.ObjectId;
  amount: number;
}

export interface IExpense extends Document {
  trip: Types.ObjectId;
  items: ExpenseItem[];
  settlements: Settlement[];
  createdAt: Date;
  updatedAt: Date;
}

const expenseSchema = new Schema<IExpense>(
  {
    trip: { type: Schema.Types.ObjectId, ref: "Trip", required: true },
    items: [
      {
        description: { type: String, required: true },
        amount: { type: Number, required: true },
        paidBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
        splitBetween: [{ type: Schema.Types.ObjectId, ref: "User" }],
      },
    ],
    settlements: [
      {
        from: { type: Schema.Types.ObjectId, ref: "User", required: true },
        to: { type: Schema.Types.ObjectId, ref: "User", required: true },
        amount: { type: Number, required: true },
      },
    ],
  },
  { timestamps: true }
);

export const Expense = mongoose.model<IExpense>("Expense", expenseSchema);

