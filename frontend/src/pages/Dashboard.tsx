import { useEffect, useState } from "react";
import { List, Typography } from "antd";
import { AlertBanner } from "../components/common/AlertBanner";
import { StatCard } from "../components/common/StatCard";
import { StatusBadge } from "../components/common/StatusBadge";

const { Text } = Typography;

type DashboardData = {
  stats: {
    totalEquipment: number;
    pendingBorrow: number;
    pendingReservation: number;
    maintenanceDue: number;
    overdueCount: number;
  };
  overdueAlerts: {
    recordId: string;
    equipmentName: string;
    borrowerName: string;
    expectedReturnAt: string;
    overdueDays: number;
  }[];
};

export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch("/api/dashboard", { headers: { "x-demo-role": "LabManager" } })
      .then((res) => res.json())
      .then((res) => setData(res.data))
      .catch(() => {});
  }, []);

  const overdueCount = data?.stats.overdueCount ?? 0;
  const overdueAlerts = data?.overdueAlerts ?? [];

  return (
    <section>
      <AlertBanner message={overdueCount > 0 ? `⚠ 有 ${overdueCount} 台设备逾期未归还，请及时处理` : "关注过保、逾期和待审批事项"} />
      <div style={{ display: "flex", gap: 16, marginTop: 16 }}>
        <StatCard title="设备总数" value={data?.stats.totalEquipment ?? 0} />
        <StatCard title="待审批借用" value={data?.stats.pendingBorrow ?? 0} />
        <StatCard title="逾期未还" value={overdueCount} />
        <StatCard title="待保养" value={data?.stats.maintenanceDue ?? 0} />
      </div>
      {overdueAlerts.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h3>逾期预警</h3>
          <List
            bordered
            dataSource={overdueAlerts}
            renderItem={(item) => (
              <List.Item>
                <Text strong>{item.equipmentName}</Text>
                <Text style={{ marginLeft: 12 }}>借用人：{item.borrowerName}</Text>
                <Text style={{ marginLeft: 12 }}>应还日期：{item.expectedReturnAt}</Text>
                <Text type="danger" style={{ marginLeft: 12 }}>逾期 {item.overdueDays} 天</Text>
                <StatusBadge value="Overdue" />
              </List.Item>
            )}
          />
        </div>
      )}
    </section>
  );
}
