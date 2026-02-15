import mongoose, { Document, Types } from "mongoose";
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
export declare const Expense: mongoose.Model<IExpense, {}, {}, {}, mongoose.Document<unknown, {}, IExpense, {}, mongoose.DefaultSchemaOptions> & IExpense & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IExpense>;
export {};
//# sourceMappingURL=Expense.d.ts.map