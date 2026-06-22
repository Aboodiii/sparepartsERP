import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Table, Button, Card, Typography, Space, Tag, InputNumber, Input, Form,
  Select, Modal, message, Row, Col, Statistic, Tooltip, Divider
} from 'antd';
import {
  ArrowLeftOutlined,
  FileExcelOutlined,
  CheckCircleOutlined,
  EditOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import api from '../api/client.js';
import { etb } from '../format.js';

const { Title, Paragraph, Text } = Typography;

export default function ProformaDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [proforma, setProforma] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingHeader, setSavingHeader] = useState(false);
  const [confirmingOrder, setConfirmingOrder] = useState(false);
  
  // Item edit modal states
  const [editingItem, setEditingItem] = useState(null);
  const [itemForm] = Form.useForm();
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [savingItem, setSavingItem] = useState(false);

  // Load suppliers and proforma details
  async function loadSuppliers() {
    try {
      const res = await api.get('/suppliers');
      setSuppliers(res.data);
    } catch {
      message.error('Failed to load suppliers.');
    }
  }

  async function loadProforma() {
    setLoading(true);
    try {
      const res = await api.get(`/proformas/${id}`);
      setProforma(res.data);
    } catch (err) {
      message.error('Failed to load proforma details.');
      navigate('/proformas');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSuppliers();
    loadProforma();
  }, [id]);

  // Update proforma metadata (header fields)
  async function handleHeaderChange(changedValues) {
    setSavingHeader(true);
    try {
      const res = await api.put(`/proformas/${id}`, changedValues);
      setProforma(prev => ({ ...prev, ...res.data }));
      message.success('Header updated.');
    } catch {
      message.error('Failed to update header fields.');
    } finally {
      setSavingHeader(false);
    }
  }

  // Open item edit modal
  function openEditItem(item) {
    setEditingItem(item);
    itemForm.setFieldsValue({
      quantity: item.quantity,
      negotiatedPrice: item.negotiatedPrice !== null ? item.negotiatedPrice : item.supplierPrice,
      notes: item.notes || ''
    });
    setItemModalOpen(true);
  }

  // Save edited item
  async function handleSaveItem() {
    setSavingItem(true);
    try {
      const values = await itemForm.validateFields();
      await api.put(`/proformas/${id}/items/${editingItem.id}`, values);
      message.success('Item updated successfully!');
      setItemModalOpen(false);
      loadProforma();
    } catch (err) {
      if (err?.errorFields) return;
      message.error('Failed to update item.');
    } finally {
      setSavingItem(false);
    }
  }

  // Confirm order and create shipment
  async function handleConfirmOrder() {
    setConfirmingOrder(true);
    try {
      const res = await api.post(`/proformas/${id}/confirm`);
      message.success(res.data.message);
      navigate(`/shipments/${res.data.shipmentId}`);
    } catch (err) {
      message.error(err.response?.data?.error || 'Failed to confirm order.');
    } finally {
      setConfirmingOrder(false);
    }
  }

  if (!proforma) {
    return <Card loading={loading} style={{ margin: 24 }} />;
  }

  // Calculations
  const exchangeRate = proforma.exchangeRate || 1.0;
  
  let totalUSD = 0;
  proforma.items.forEach(item => {
    const price = item.negotiatedPrice !== null && item.negotiatedPrice !== undefined ? item.negotiatedPrice : (item.supplierPrice || 0);
    const qty = item.quantity || 0;
    totalUSD += qty * price;
  });

  const totalETB = totalUSD * exchangeRate;

  const columns = [
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
      title: 'Brand',
      dataIndex: 'brand',
      key: 'brand',
      render: (text) => text || '—'
    },
    {
      title: 'Qty',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (qty, record) => `${qty} ${record.unit || 'pcs'}`
    },
    {
      title: 'Supplier Price (USD)',
      dataIndex: 'supplierPrice',
      key: 'supplierPrice',
      render: (val) => `$${Number(val || 0).toFixed(2)}`
    },
    {
      title: 'Negotiated Price (USD)',
      dataIndex: 'negotiatedPrice',
      key: 'negotiatedPrice',
      render: (val, record) => {
        const current = val !== null && val !== undefined ? val : (record.supplierPrice || 0);
        const isModified = val !== null && val !== undefined && val !== record.supplierPrice;
        return (
          <Space>
            <span>${Number(current).toFixed(2)}</span>
            {isModified && <Tag color="warning">Adjusted</Tag>}
          </Space>
        );
      }
    },
    {
      title: 'Total USD',
      key: 'totalUSD',
      render: (_, record) => {
        const price = record.negotiatedPrice !== null && record.negotiatedPrice !== undefined ? record.negotiatedPrice : (record.supplierPrice || 0);
        const qty = record.quantity || 0;
        return `$${(qty * price).toFixed(2)}`;
      }
    },
    {
      title: 'Total ETB',
      key: 'totalETB',
      render: (_, record) => {
        const price = record.negotiatedPrice !== null && record.negotiatedPrice !== undefined ? record.negotiatedPrice : (record.supplierPrice || 0);
        const qty = record.quantity || 0;
        return etb(qty * price * exchangeRate);
      }
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
      render: (text) => text || '—'
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="link"
          icon={<EditOutlined />}
          disabled={proforma.status === 'CONFIRMED' || proforma.status === 'RECEIVED'}
          onClick={() => openEditItem(record)}
        >
          Edit
        </Button>
      )
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/proformas')} />
          <div>
            <Title level={3} style={{ margin: 0 }}>Proforma: {proforma.referenceNumber || `PI-${proforma.id}`}</Title>
            <Space>
              <Text type="secondary">Manage supplier quotes and customize items prior to shipping.</Text>
              <Tag color={proforma.status === 'DRAFT' ? 'default' : proforma.status === 'NEGOTIATING' ? 'orange' : proforma.status === 'CONFIRMED' ? 'green' : 'purple'}>
                {proforma.status}
              </Tag>
            </Space>
          </div>
        </Space>
        <Space>
          <Button
            icon={<FileExcelOutlined />}
            style={{ borderColor: '#0f7b3f', color: '#0f7b3f' }}
            href={`http://localhost:4000/api/proformas/${proforma.id}/export`}
            target="_blank"
          >
            Export Final Excel
          </Button>
          {(proforma.status === 'DRAFT' || proforma.status === 'NEGOTIATING') && (
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              loading={confirmingOrder}
              onClick={handleConfirmOrder}
            >
              Confirm Order & Create Shipment
            </Button>
          )}
          {proforma.status === 'CONFIRMED' && proforma.shipment && (
            <Button
              type="primary"
              onClick={() => navigate(`/shipments/${proforma.shipment.id}`)}
            >
              Go to Shipment Costing
            </Button>
          )}
        </Space>
      </div>

      <Row gutter={24} style={{ marginBottom: 24 }}>
        <Col span={16}>
          <Card title="Supplier & Negotiation Information" style={{ borderRadius: 8 }}>
            <Form
              layout="vertical"
              initialValues={{
                supplierId: proforma.supplierId,
                referenceNumber: proforma.referenceNumber,
                invoiceDate: proforma.invoiceDate,
                exchangeRate: proforma.exchangeRate,
                notes: proforma.notes || ''
              }}
              onValuesChange={handleHeaderChange}
              disabled={proforma.status === 'CONFIRMED' || proforma.status === 'RECEIVED'}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="supplierId" label="Supplier">
                    <Select
                      placeholder="Choose a supplier"
                      options={suppliers.map(s => ({ value: s.id, label: `${s.name} (${s.country})` }))}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="exchangeRate" label="Exchange Rate (ETB / USD)">
                    <InputNumber min={1} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="referenceNumber" label="Proforma Reference No.">
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="invoiceDate" label="Invoice Date">
                    <Input placeholder="YYYY-MM-DD" />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="notes" label="Negotiation Notes / Comments">
                <Input.TextArea rows={2} placeholder="Add comments regarding discounts, shipping agreements, delays..." />
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col span={8}>
          <Card title="Summary Calculations" style={{ borderRadius: 8, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ marginBottom: 20 }}>
              <Statistic
                title="Total Order Value (USD)"
                value={totalUSD}
                precision={2}
                prefix="$"
                valueStyle={{ color: '#0f7b3f', fontSize: 32, fontWeight: 700 }}
              />
            </div>
            <Divider style={{ margin: '12px 0' }} />
            <div>
              <Statistic
                title="Landed Goods Value (ETB)"
                value={totalETB}
                precision={2}
                prefix="Br "
                valueStyle={{ color: '#1890ff', fontSize: 24, fontWeight: 600 }}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>
                <InfoCircleOutlined /> Equal to FOB Value at current rate of {exchangeRate} Birr/USD.
              </Text>
            </div>
          </Card>
        </Col>
      </Row>

      <Card title="Proforma Invoice Parts List" style={{ borderRadius: 8 }}>
        <Table
          rowKey="id"
          dataSource={proforma.items}
          columns={columns}
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Edit Item Modal */}
      <Modal
        title="Edit Negotiated Item"
        open={itemModalOpen}
        onOk={handleSaveItem}
        onCancel={() => setItemModalOpen(false)}
        confirmLoading={savingItem}
        destroyOnHidden
      >
        {editingItem && (
          <Form form={itemForm} layout="vertical" style={{ marginTop: 16 }}>
            <div style={{ marginBottom: 16 }}>
              <Text bold>Part: </Text>
              <Text>{editingItem.partNumber} - {editingItem.description}</Text>
            </div>
            <Form.Item name="quantity" label="Quantity Ordered" rules={[{ required: true, message: 'Required' }]}>
              <InputNumber min={0.1} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="negotiatedPrice" label="Negotiated Price (USD)" rules={[{ required: true, message: 'Required' }]}>
              <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="notes" label="Item Notes">
              <Input.TextArea placeholder="Specific notes (e.g. bulk discount, original packaging...)" />
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
}
