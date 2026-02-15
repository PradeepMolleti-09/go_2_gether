import { Types } from "mongoose";
export declare const addExpenseItem: (params: {
    tripId: string;
    description: string;
    amount: number;
    paidByUserId: string;
    splitBetweenUserIds: string[];
}) => Promise<import("mongoose").Document<unknown, {}, import("../models/Expense").IExpense, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Expense").IExpense & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}>;
export declare const getExpense: (tripId: string) => Promise<(import("../models/Expense").IExpense & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}) | null>;
//# sourceMappingURL=expenseService.d.ts.map