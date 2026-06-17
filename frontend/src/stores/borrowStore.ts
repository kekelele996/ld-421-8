import { create } from "zustand";
import { borrowApi } from "../api/borrow";
import type { BorrowRecord } from "../types/borrow";

type State = {
  items: BorrowRecord[];
  overdueCount: number;
  load: (status?: string) => Promise<void>;
  checkOverdue: () => Promise<void>;
};
export const useBorrowStore = create<State>((set) => ({
  items: [],
  overdueCount: 0,
  load: async (status = "") => set({ items: await borrowApi.list(status) }),
  checkOverdue: async () => {
    const result = await borrowApi.checkOverdue();
    set({ overdueCount: result.overdueCount });
  }
}));
