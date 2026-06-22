import { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Spin, Alert } from 'antd';
import {
  ToolOutlined,
  ShopOutlined,
  TeamOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import api from '../api/client.js';
import { etb } from '../format.js';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/dashboard')
      .then((res) => setData(res.data))
      .catch(() => setError('Could not load dashboard. Is the backend running on port 4000?'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spin size="large" style={{ display: 'block', marginTop: 80 }} />;
  if (error) return <Alert type="error" message={error} showIcon />;

  const cards = [
    { title: 'Parts in catalogue', value: data.totalParts, icon: <ToolOutlined /> },
    { title: 'Suppliers', value: data.totalSuppliers, icon: <ShopOutlined /> },
    { title: 'Customers', value: data.totalCustomers, icon: <TeamOutlined /> },
    { title: 'Low-stock items', value: data.lowStockCount, icon: <WarningOutlined />, danger: true },
  ];

  const lowStockColumns = [
    { title: 'Part No.', dataIndex: 'partNumber' },
    { title: 'Name', dataIndex: 'name' },
    { title: 'Supplier', dataIndex: 'supplier' },
    {
      title: 'In stock',
      dataIndex: 'quantityInStock',
      render: (qty, row) => <Tag color={qty === 0 ? 'red' : 'orange'}>{qty} / reorder at {row.reorderLevel}</Tag>,
    },
  ];

  return (
    <>
      <Row gutter={[16, 16]}>
        {cards.map((c) => (
          <Col xs={24} sm={12} lg={6} key={c.title}>
            <Card>
              <Statistic
                title={c.title}
                value={c.value}
                prefix={c.icon}
                valueStyle={c.danger ? { color: '#cf1322' } : undefined}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Card style={{ marginTop: 16 }}>
        <Statistic title="Inventory value (at cost)" value={etb(data.inventoryValue)} />
      </Card>

      <Card title="Items to reorder" style={{ marginTop: 16 }}>
        <Table
          rowKey="id"
          dataSource={data.lowStock}
          columns={lowStockColumns}
          pagination={false}
          locale={{ emptyText: 'Nothing to reorder — stock levels look healthy.' }}
        />
      </Card>
    </>
  );
}
