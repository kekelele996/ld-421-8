import { useEffect, useState } from "react";
import { Tabs, Table, Button, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { StepIndicator } from "../components/common/StepIndicator";
import { StatusBadge } from "../components/common/StatusBadge";
import { useBorrowStore } from "../stores/borrowStore";
import { useBorrowFlow } from "../hooks/useBorrowFlow";
import type { BorrowRecord } from "../types/borrow";

const statusTabs = [
  { key: "", label: "全部" },
  { key: "Pending", label: "待审批" },
  { key: "Approved", label: "已批准" },
  { key: "Overdue", label: "逾期" },
  { key: "Returned", label: "已归还" },
  { key: "Rejected", label: "已驳回" }
];

export function BorrowManage() {
  const { items, load, checkOverdue, overdueCount } = useBorrowStore();
  const [activeTab, setActiveTab] = useState("");
  const flow = useBorrowFlow();

  useEffect(() => {
    load(activeTab);
  }, [activeTab, load]);

  const handleCheckOverdue = async () => {
    await checkOverdue();
    await load(activeTab);
    if (overdueCount > 0) {
      message.warning(`已检测到 ${overdueCount} 条逾期记录`);
    } else {
      message.success("暂无逾期记录");
    }
  };

  const columns: ColumnsType<BorrowRecord> = [
    { title: "记录ID", dataIndex: "id", key: "id" },
    { title: "设备ID", dataIndex: "equipmentId", key: "equipmentId" },
    { title: "借用人", dataIndex: "borrowerId", key: "borrowerId" },
    { title: "借用日期", dataIndex: "borrowedAt", key: "borrowedAt" },
    { title: "预计归还", dataIndex: "expectedReturnAt", key: "expectedReturnAt" },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: (status: string) => <StatusBadge value={status} />
    },
    {
      title: "操作",
      key: "action",
      render: (_: unknown, record: BorrowRecord) => {
        if (record.status === "Pending") {
          return (
            <>
              <Button size="small" type="primary" onClick={() => { flow.approve(record.id); load(activeTab); }}>批准</Button>
              <Button size="small" danger style={{ marginLeft: 8 }} onClick={() => { flow.reject(record.id); load(activeTab); }}>驳回</Button>
            </>
          );
        }
        if (record.status === "Approved" || record.status === "Overdue") {
          return <Button size="small" onClick={() => { flow.confirmReturn(record.id); load(activeTab); }}>确认归还</Button>;
        }
        return null;
      }
    }
  ];

  return (
    <section>
      <StepIndicator current={1} />
      <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between" }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={statusTabs.map((tab) => ({
            key: tab.key,
            label: tab.key === "Overdue" ? `${tab.label}${overdueCount > 0 ? ` (${overdueCount})` : ""}` : tab.label
          }))}
        />
        <Button type="primary" onClick={handleCheckOverdue}>逾期检测</Button>
      </div>
      <Table rowKey="id" dataSource={items} columns={columns} pagination={{ pageSize: 10 }} />
    </section>
  );
}
