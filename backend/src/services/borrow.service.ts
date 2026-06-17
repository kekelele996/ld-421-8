import { borrowRecords, equipment } from "../database/seeds/seed.ts";
import { AssetStatus, BorrowStatus, ReturnCondition } from "../types/enums.ts";
import type { BorrowRecord } from "../types/interfaces.ts";
import { ApiError } from "../utils/response.ts";

export const borrowService = {
  list(status = "") {
    this.overdueCheck();
    return status ? borrowRecords.filter((record) => record.status === status) : borrowRecords;
  },
  overdueCheck() {
    const today = new Date().toISOString().slice(0, 10);
    let count = 0;
    for (const record of borrowRecords) {
      if (record.status === BorrowStatus.Approved && record.expectedReturnAt < today) {
        record.status = BorrowStatus.Overdue;
        count++;
      }
    }
    return count;
  },
  hasOverdueEquipment(equipmentId: string) {
    return borrowRecords.some(
      (record) => record.equipmentId === equipmentId && record.status === BorrowStatus.Overdue
    );
  },
  create(input: Partial<BorrowRecord>) {
    if (!input.equipmentId) throw new ApiError(400, "EQUIPMENT_REQUIRED", "必须选择设备");
    if (this.hasOverdueEquipment(input.equipmentId)) {
      throw new ApiError(403, "EQUIPMENT_OVERDUE", "该设备存在逾期未归还记录，禁止再借");
    }
    const record: BorrowRecord = {
      id: `br-${Date.now()}`,
      equipmentId: input.equipmentId,
      borrowerId: input.borrowerId ?? "u-student",
      borrowedAt: input.borrowedAt ?? new Date().toISOString().slice(0, 10),
      expectedReturnAt: input.expectedReturnAt ?? new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      purpose: input.purpose ?? "临时实验任务",
      status: BorrowStatus.Pending
    };
    borrowRecords.unshift(record);
    return record;
  },
  approve(id: string, approverId: string, approved = true) {
    const record = borrowRecords.find((item) => item.id === id);
    if (!record) throw new ApiError(404, "BORROW_NOT_FOUND", "借用记录不存在");
    record.status = approved ? BorrowStatus.Approved : BorrowStatus.Rejected;
    record.approverId = approverId;
    const item = equipment.find((entry) => entry.id === record.equipmentId);
    if (approved && item) item.status = AssetStatus.InUse;
    return record;
  },
  confirmReturn(id: string, condition = ReturnCondition.Good) {
    const record = borrowRecords.find((item) => item.id === id);
    if (!record) throw new ApiError(404, "BORROW_NOT_FOUND", "借用记录不存在");
    record.status = BorrowStatus.Returned;
    record.actualReturnAt = new Date().toISOString().slice(0, 10);
    record.returnCondition = condition;
    const item = equipment.find((entry) => entry.id === record.equipmentId);
    if (item) item.status = condition === ReturnCondition.Lost ? AssetStatus.Lost : AssetStatus.Available;
    return record;
  }
};
