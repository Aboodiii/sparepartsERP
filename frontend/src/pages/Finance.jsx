import { useEffect, useState } from 'react';
import { Card, Table, Typography, Row, Col, Statistic, Space, Tag, Divider, Spin, message } from 'antd';
import {
  DollarOutlined,
  DashboardOutlined,
  AlertOutlined,
  InfoCircleOutlined,
  GoldOutlined
} from '@ant-design/icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../api/client.js';
import { etb } from '../format.js';

const { Title, Paragraph, Text } = Typography;

export default function Finance() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadFinanceData() {
    setLoading(true);
    try {
      const res = await api.get('/finance');
      setData(res.data);
    } catch {
      message.error('Failed to load financial analysis.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFinanceData();
  }, []);

  if (loading || !data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Spin size="large" tip="Loading financial analytics..." />
      </div>
    );
  }

  const { summary, shipments } = data;

  // Formatting chart data
  const chartData = shipments.map(s => ({
    name: s.refNumber || `PI-${s.id}`,
    'Goods Cost (FOB)': s.goodsValueETB,
    'Freight & Ins': s.shippingFreightETB,
    'Duties & Taxes': s.taxesETB,
    'Local Port & Transport': s.localChargesETB,
  }));

  const columns = [
    {
      title: 'Order / Ref',
      dataIndex: 'refNumber',
      key: 'refNumber',
      render: (text, record) => (
        <span style={{ fontWeight: 600 }}>{text || `PI-${record.id}`}</span>
      )
    },
    {
      title: 'Supplier',
      dataIndex: 'supplierName',
      key: 'supplierName'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'blue';
        if (status === 'IN_TRANSIT') color = 'cyan';
        if (status === 'CUSTOMS') color = 'warning';
        if (status === 'DELIVERED') color = 'green';
        return <Tag color={color} style={{ fontWeight: 600 }}>{status}</Tag>;
      }
    },
    {
      title: 'Goods FOB (ETB)',
      dataIndex: 'goodsValueETB',
      key: 'goodsValueETB',
      render: (val) => etb(val)
    },
    {
      title: 'Freight / Ins (ETB)',
      dataIndex: 'shippingFreightETB',
      key: 'shippingFreightETB',
      render: (val) => etb(val)
    },
    {
      title: 'Customs & Duties',
      dataIndex: 'taxesETB',
      key: 'taxesETB',
      render: (val) => etb(val)
    },
    {
      title: 'Local Port & Trans.',
      dataIndex: 'localChargesETB',
      key: 'localChargesETB',
      render: (val) => etb(val)
    },
    {
      title: 'Total Capital Cost',
      dataIndex: 'totalLandedCostETB',
      key: 'totalLandedCostETB',
      render: (val) => (
        <span style={{ fontWeight: 600, color: '#0f7b3f' }}>{etb(val)}</span>
      )
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Import Finance & Expenses</Title>
        <Paragraph type="secondary">
          Analyze total invested capital, freight/insurance allocations, duties/taxes paid to Ethiopian customs, and average margins.
        </Paragraph>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card bordered={false} style={{ background: '#f6ffed', borderLeft: '4px solid #52c41a', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <Statistic
              title="Delivered Investment (ETB)"
              value={summary.totalInvestedETB}
              precision={2}
              valueStyle={{ color: '#3f8600', fontWeight: 700 }}
              prefix={<DollarOutlined />}
            />
            <Text type="secondary" style={{ fontSize: 11 }}>Capital in delivered inventory</Text>
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false} style={{ background: '#fff1f0', borderLeft: '4px solid #f5222d', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <Statistic
              title="Customs & Taxes Paid (ETB)"
              value={summary.totalTaxesPaidETB}
              precision={2}
              valueStyle={{ color: '#cf1322', fontWeight: 700 }}
              prefix={<GoldOutlined />}
            />
            <Text type="secondary" style={{ fontSize: 11 }}>Import duties, Excise, VAT & Surtax</Text>
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false} style={{ background: '#e6f7ff', borderLeft: '4px solid #1890ff', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <Statistic
              title="In-Transit Capital (ETB)"
              value={summary.pendingShipmentsValueETB}
              precision={2}
              valueStyle={{ color: '#096dd9', fontWeight: 700 }}
              prefix={<DashboardOutlined />}
            />
            <Text type="secondary" style={{ fontSize: 11 }}>FOB value of active shipments</Text>
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false} style={{ background: '#f9f0ff', borderLeft: '4px solid #722ed1', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <Statistic
              title="Average Selling Markup"
              value={summary.avgMarginPercent}
              precision={1}
              valueStyle={{ color: '#531dab', fontWeight: 700 }}
              suffix="%"
            />
            <Text type="secondary" style={{ fontSize: 11 }}>Weighted margin over landed costs</Text>
          </Card>
        </Col>
      </Row>

      <Row gutter={24} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card title="Expense Breakdown per Import Order (ETB)" style={{ borderRadius: 8 }}>
            {chartData.length > 0 ? (
              <div style={{ width: '100%', height: 350 }}>
                <ResponsiveContainer>
                  <BarChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <RechartsTooltip formatter={(v) => etb(v)} />
                    <Legend />
                    <Bar dataKey="Goods Cost (FOB)" stackId="a" fill="#1890ff" />
                    <Bar dataKey="Freight & Ins" stackId="a" fill="#2fc25b" />
                    <Bar dataKey="Duties & Taxes" stackId="a" fill="#facc14" />
                    <Bar dataKey="Local Port & Transport" stackId="a" fill="#f04864" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <InfoCircleOutlined style={{ fontSize: 32, color: '#bfbfbf', marginBottom: 8 }} />
                <Paragraph type="secondary">No received shipments found. Complete a shipment receipt to generate expense data.</Paragraph>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Card title="Shipment Financial Ledger" style={{ borderRadius: 8 }}>
        <Table
          rowKey="id"
          dataSource={shipments}
          columns={columns}
          pagination={{ pageSize: 8 }}
        />
      </Card>
    </div>
  );
}
