import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Tag, Card, Typography, Space, Row, Col, Statistic, Popconfirm, message } from 'antd';
import { EyeOutlined, DeleteOutlined, CompassOutlined, CheckCircleOutlined, DollarOutlined } from '@ant-design/icons';
import api from '../api/client.js';
import { etb } from '../format.js';

const { Title, Paragraph, Text } = Typography;

export default function Shipments() {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function loadShipments() {
    setLoading(true);
    try {
      const res = await api.get('/shipments');
      setShipments(res.data);
    } catch {
      message.error('Failed to load shipments.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadShipments();
  }, []);

  async function handleDeleteShipment(id) {
    try {
      await api.delete(`/shipments/${id}`);
      message.success('Shipment deleted, linked proforma reverted.');
      loadShipments();
    } catch (err) {
      message.error(err.response?.data?.error || 'Failed to delete shipment.');
    }
  }

  // Summary Metrics
  const activeCount = shipments.filter(s => s.status !== 'DELIVERED').length;
  const deliveredCount = shipments.filter(s => s.status === 'DELIVERED').length;
  const totalLandedCost = shipments.reduce((sum, s) => sum + (s.totalLandedCostETB || 0), 0);
  const totalTaxes = shipments.reduce((sum, s) => sum + (s.totalTaxesETB || 0), 0);

  const columns = [
    {
      title: 'Shipment ID / Ref',
      key: 'shipmentId',
      render: (_, record) => (
        <a onClick={() => navigate(`/shipments/${record.id}`)} style={{ fontWeight: 600 }}>
          {record.refNumber ? `Shipment for ${record.refNumber}` : `Shipment #${record.id}`}
        </a>
      )
    },
    {
      title: 'Supplier',
      dataIndex: 'supplierName',
      key: 'supplierName'
    },
    {
      title: 'Items',
      dataIndex: 'itemCount',
      key: 'itemCount'
    },
    {
      title: 'FOB (USD)',
      dataIndex: 'totalFOBUSD',
      key: 'totalFOBUSD',
      render: (val) => `$${val.toFixed(2)}`
    },
    {
      title: 'Calculated Landed Cost',
      dataIndex: 'totalLandedCostETB',
      key: 'totalLandedCostETB',
      render: (val) => etb(val)
    },
    {
      title: 'Import Taxes Paid',
      dataIndex: 'totalTaxesETB',
      key: 'totalTaxesETB',
      render: (val) => etb(val)
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
        return <Tag color={color} style={{ fontWeight: 600 }}>{status.replace('_', ' ')}</Tag>;
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            ghost
            icon={<EyeOutlined />}
            size="small"
            onClick={() => navigate(`/shipments/${record.id}`)}
          >
            Cost Details
          </Button>
          {record.status !== 'DELIVERED' && (
            <Popconfirm title="Delete shipment? Linked order will revert to Negotiating status." onConfirm={() => handleDeleteShipment(record.id)}>
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Import Shipments</Title>
        <Paragraph type="secondary">
          Track active imports from China, compute Ethiopian duties, customs, withholding, port handling, and inland transport costs, and check landed pricing.
        </Paragraph>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card bordered={false} style={{ background: '#e6f7ff', borderLeft: '4px solid #1890ff' }}>
            <Statistic title="In Transit / Customs" value={activeCount} valueStyle={{ color: '#096dd9' }} prefix={<CompassOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false} style={{ background: '#f6ffed', borderLeft: '4px solid #52c41a' }}>
            <Statistic title="Delivered & Stocked" value={deliveredCount} valueStyle={{ color: '#3f8600' }} prefix={<CheckCircleOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false} style={{ background: '#fff0f6', borderLeft: '4px solid #eb2f96' }}>
            <Statistic title="Total Landed Investments" value={totalLandedCost} precision={0} valueStyle={{ color: '#c41d7f' }} prefix="Br" />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false} style={{ background: '#feffe6', borderLeft: '4px solid #fadb14' }}>
            <Statistic title="Total Customs Taxes Paid" value={totalTaxes} precision={0} valueStyle={{ color: '#d4b106' }} prefix="Br" />
          </Card>
        </Col>
      </Row>

      <Card title="Active & Historic Shipments" style={{ borderRadius: 8 }}>
        <Table
          rowKey="id"
          dataSource={shipments}
          columns={columns}
          loading={loading}
          pagination={{ pageSize: 8 }}
        />
      </Card>
    </div>
  );
}
