import { borrowRecords, equipment, maintenanceRecords, reservations, users } from "../database/seeds/seed.ts";
import { BorrowStatus } from "../types/enums.ts";

export const dashboardService = {
  summary() {
    this.syncOverdue();
    const byStatus = equipment.reduce<Record<string, number>>((acc, item) => {
      acc[item.status] = (acc[item.status] ?? 0) + 1;
      return acc;
    }, {});
    const borrowTop = equipment.map((item) => ({
      equipmentId: item.id,
      equipmentName: item.name,
      count: borrowRecords.filter((record) => record.equipmentId === item.id).length
    })).sort((a, b) => b.count - a.count).slice(0, 10);
    const warrantyAlerts = equipment.filter((item) => new Date(item.warrantyExpiresAt).getTime() < Date.now() + 120 * 86400000);
    const overdueRecords = borrowRecords.filter((record) => record.status === BorrowStatus.Overdue);
    const overdueAlerts = overdueRecords.map((record) => {
      const eq = equipment.find((e) => e.id === record.equipmentId);
      const borrower = users.find((u) => u.id === record.borrowerId);
      return {
        recordId: record.id,
        equipmentName: eq?.name ?? "未知设备",
        borrowerName: borrower?.name ?? "未知借用人",
        expectedReturnAt: record.expectedReturnAt,
        overdueDays: Math.floor((Date.now() - new Date(record.expectedReturnAt).getTime()) / 86400000)
      };
    });
    return {
      stats: {
        totalEquipment: equipment.length,
        pendingBorrow: borrowRecords.filter((record) => record.status === BorrowStatus.Pending).length,
        pendingReservation: reservations.filter((record) => record.status === "Pending").length,
        maintenanceDue: maintenanceRecords.filter((record) => new Date(record.nextMaintenanceDate).getTime() < Date.now() + 30 * 86400000).length,
        overdueCount: overdueRecords.length
      },
      byStatus,
      borrowTop,
      warrantyAlerts,
      overdueAlerts
    };
  },
  syncOverdue() {
    const today = new Date().toISOString().slice(0, 10);
    for (const record of borrowRecords) {
      if (record.status === BorrowStatus.Approved && record.expectedReturnAt < today) {
        record.status = BorrowStatus.Overdue;
      }
    }
  }
};
