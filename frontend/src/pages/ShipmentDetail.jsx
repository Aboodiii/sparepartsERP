import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Table, Typography, Space, Button, InputNumber, Form,
  Select, Tag, Row, Col, Statistic, Divider, Descriptions, message,
  Alert, Input
} from 'antd';
import {
  ArrowLeftOutlined,
  SaveOutlined,
  CarryOutOutlined,
  CalculatorOutlined,
  SafetyCertificateOutlined,
  CompassOutlined
} from '@ant-design/icons';
import api from '../api/client.js';
import { etb } from '../format.js';

const { Title, Paragraph, Text } = Typography;

export default function ShipmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [receiving, setReceiving] = useState(false);
  const [form] = Form.useForm();

  async function loadShipment() {
    setLoading(true);
    try {
      const res = await api.get(`/shipments/${id}`);
      setShipment(res.data);
      form.setFieldsValue(res.data);
    } catch {
      message.error('Failed to load shipment details.');
      navigate('/shipments');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadShipment();
  }, [id]);

  // Save changes
  async function handleSave(values) {
    setSaving(true);
    try {
      const res = await api.put(`/shipments/${id}`, values);
      setShipment(res.data);
      message.success('Shipment costs and calculations updated!');
    } catch {
      message.error('Failed to save shipment settings.');
    } finally {
      setSaving(false);
    }
  }

  // Receive shipment
  async function handleReceiveShipment() {
    setReceiving(true);
    try {
      await api.post(`/shipments/${id}/receive`);
      message.success('Shipment successfully received! Parts inventory quantities and cost prices updated.');
      loadShipment();
    } catch (err) {
      message.error(err.response?.data?.error || 'Failed to receive shipment.');
    } finally {
      setReceiving(false);
    }
  }

  if (!shipment) {
    return <Card loading={loading} style={{ margin: 24 }} />;
  }

  const calcs = shipment.calculations;
  const isDelivered = shipment.status === 'DELIVERED';

  const itemColumns = [
    {
      title: 'Part No.',
      dataIndex: 'partNumber',
      key: 'partNumber',
      render: (text) => text || <Text type="secondary">N/A</Text>
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description'
    },
    {
      title: 'Qty',
      dataIndex: 'quantityReceived',
      key: 'quantityReceived'
    },
    {
      title: 'Unit FOB (USD)',
      dataIndex: 'unitCostUSD',
      key: 'unitCostUSD',
      render: (val) => `$${Number(val || 0).toFixed(2)}`
    },
    {
      title: 'Total FOB (USD)',
      dataIndex: 'itemFOBUSD',
      key: 'itemFOBUSD',
      render: (val) => `$${Number(val || 0).toFixed(2)}`
    },
    {
      title: 'Allocated Landed (ETB)',
      dataIndex: 'itemLandedCostETB',
      key: 'itemLandedCostETB',
      render: (val) => etb(val)
    },
    {
      title: 'Unit Landed Cost (ETB)',
      dataIndex: 'unitLandedCostETB',
      key: 'unitLandedCostETB',
      render: (val) => (
        <span style={{ fontWeight: 600, color: '#0f7b3f' }}>
          {etb(val)}
        </span>
      )
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/shipments')} />
          <div>
            <Title level={3} style={{ margin: 0 }}>
              Shipment for {shipment.proforma.referenceNumber || `Order #${shipment.proforma.id}`}
            </Title>
            <Space>
              <Text type="secondary">Calculate freight, duties, taxes, and receive parts into inventory.</Text>
              <Tag color={shipment.status === 'IN_TRANSIT' ? 'cyan' : shipment.status === 'CUSTOMS' ? 'warning' : 'green'}>
                {shipment.status}
              </Tag>
            </Space>
          </div>
        </Space>
        
        <Space>
          {!isDelivered && (
            <Button
              type="primary"
              icon={<CarryOutOutlined />}
              loading={receiving}
              onClick={handleReceiveShipment}
              style={{ background: '#52c41a', borderColor: '#52c41a' }}
            >
              Mark Received & Stock Inventory
            </Button>
          )}
        </Space>
      </div>

      {isDelivered && (
        <Alert
          message="Shipment Received"
          description={`This shipment was marked as RECEIVED on ${shipment.receivedDate}. All parts have been added to the inventory catalog and stock, and cost prices have been updated/calculated based on weighted average landed costs.`}
          type="success"
          showIcon
          style={{ marginBottom: 24, borderRadius: 8 }}
        />
      )}

      <Row gutter={24}>
        {/* Cost & Tax Input Form */}
        <Col span={12}>
          <Card title="Configure Shipment & Customs Costs" style={{ borderRadius: 8, marginBottom: 24 }}>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSave}
              disabled={isDelivered}
            >
              <Title level={5} style={{ marginTop: 0, color: '#0f7b3f' }}>1. International Freight & Insurance</Title>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="freightCostUSD" label="Ocean/Air Freight Cost (USD)">
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="insuranceCostUSD" label="Insurance Cost (USD)">
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>

              <Title level={5} style={{ marginTop: 12, color: '#0f7b3f' }}>2. Ethiopian Customs Tax Rates (%)</Title>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="importDutyRate" label="Import Duty Rate (%)">
                    <InputNumber min={0} max={100} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="exciseTaxRate" label="Excise Tax Rate (%)">
                    <InputNumber min={0} max={200} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>
              <Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 16 }}>
                Note: **VAT (15%)**, **Surtax (10%)**, and **Withholding Tax (3%)** are automatically calculated on top of these values according to Ethiopian customs formulas.
              </Paragraph>

              <Title level={5} style={{ marginTop: 12, color: '#0f7b3f' }}>3. Local Port & Clearing Charges (ETB)</Title>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="portHandlingETB" label="Port Handling Fee (ETB)">
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="clearingAgentETB" label="Clearing Agent Fee (ETB)">
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="inlandTransportETB" label="Inland Transport Cost (ETB)">
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="brokerageETB" label="Brokerage Fee (ETB)">
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="otherChargesETB" label="Other Charges (ETB)">
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="status" label="Shipment Status">
                    <Select
                      options={[
                        { value: 'IN_TRANSIT', label: 'In Transit' },
                        { value: 'CUSTOMS', label: 'In Customs' }
                      ]}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="notes" label="Shipping / Delivery Notes">
                <Input.TextArea rows={2} />
              </Form.Item>

              {!isDelivered && (
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving} block>
                  Calculate & Update Taxes
                </Button>
              )}
            </Form>
          </Card>
        </Col>

        {/* Live Tax Sheet Breakdown */}
        <Col span={12}>
          <Card
            title={
              <Space>
                <CalculatorOutlined style={{ color: '#0f7b3f' }} />
                <span>Ethiopian Customs & Landed Cost Sheet</span>
              </Space>
            }
            style={{ borderRadius: 8, borderColor: '#0f7b3f' }}
          >
            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label="FOB Goods Value (USD)">
                ${Number(calcs?.totalFOBUSD || 0).toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="Freight + Insurance (USD)">
                ${Number((calcs?.freightUSD || 0) + (calcs?.insuranceUSD || 0)).toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="CIF Customs Value (USD)">
                <Text strong>${Number(calcs?.cifUSD || 0).toFixed(2)}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="CIF Customs Value (ETB)">
                <Text strong>{etb(calcs.cifETB)}</Text>
                <span style={{ fontSize: 11, color: '#8c8c8c', marginLeft: 8 }}>
                  (@ {shipment.proforma.exchangeRate} Birr)
                </span>
              </Descriptions.Item>
            </Descriptions>

            <Divider style={{ margin: '12px 0' }} />
            <Text strong style={{ color: '#d48806', display: 'block', marginBottom: 8 }}>
              Customs Duties & Import Taxes (ETB)
            </Text>

            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label={`Import Duty (${shipment.importDutyRate}%)`}>
                {etb(calcs.importDutyETB)}
              </Descriptions.Item>
              <Descriptions.Item label={`Excise Tax (${shipment.exciseTaxRate}%)`}>
                {etb(calcs.exciseTaxETB)}
              </Descriptions.Item>
              <Descriptions.Item label="VAT (15%)">
                {etb(calcs.vatETB)}
              </Descriptions.Item>
              <Descriptions.Item label="Surtax (10%)">
                {etb(calcs.surtaxETB)}
              </Descriptions.Item>
              <Descriptions.Item label="Withholding Tax (3%)">
                {etb(calcs.withholdingETB)}
              </Descriptions.Item>
              <Descriptions.Item label="Total Taxes Paid" labelStyle={{ fontWeight: 600 }}>
                <Text strong type="danger">{etb(calcs.totalTaxesETB)}</Text>
              </Descriptions.Item>
            </Descriptions>

            <Divider style={{ margin: '12px 0' }} />
            <Text strong style={{ color: '#1890ff', display: 'block', marginBottom: 8 }}>
              Local Port & Handling Fees (ETB)
            </Text>
            
            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label="Total Port & Transport Cost">
                {etb(calcs.totalLocalCostsETB)}
              </Descriptions.Item>
            </Descriptions>

            <Divider style={{ margin: '12px 0' }} />
            <div style={{ padding: 12, background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text strong style={{ fontSize: 15, color: '#3f8600' }}>TOTAL LANDED COST (ETB):</Text>
              <Text strong style={{ fontSize: 20, color: '#3f8600' }}>{etb(calcs.totalLandedCostETB)}</Text>
            </div>
            
            <div style={{ marginTop: 12, textAlign: 'right' }}>
              <Text type="secondary" style={{ fontSize: 11 }}>
                * Includes Cost of Goods (FOB) + Freight/Ins + All Duties/Taxes + All Local Charges
              </Text>
            </div>
          </Card>
        </Col>
      </Row>

      <Card title="Allocated Landed Cost Per Part Item" style={{ borderRadius: 8, marginTop: 24 }}>
        <Table
          rowKey="id"
          dataSource={shipment.items}
          columns={itemColumns}
          pagination={false}
        />
      </Card>
    </div>
  );
}
