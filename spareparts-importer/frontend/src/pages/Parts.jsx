// ===========================================================================
// THE REFERENCE PAGE. Read this one carefully — Suppliers and Customers are
// the same pattern with fewer fields. The flow on every admin CRUD page is:
//   1. Load the list into a table.
//   2. "Add" / "Edit" opens a modal with a form.
//   3. Save -> POST (new) or PUT (existing) -> reload the table.
//   4. Delete -> confirm -> DELETE -> reload.
// ===========================================================================
import { useEffect, useState } from 'react';
import {
  Table, Button, Modal, Form, Input, InputNumber, Select, Space,
  Popconfirm, Tag, message,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../api/client.js';
import { etb } from '../format.js';

export default function Parts() {
  const [parts, setParts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null); // null = creating, object = editing
  const [form] = Form.useForm();

  // ---- data loading -------------------------------------------------------
  async function loadParts() {
    setLoading(true);
    try {
      const res = await api.get('/parts');
      setParts(res.data);
    } catch {
      message.error('Failed to load parts.');
    } finally {
      setLoading(false);
    }
  }

  async function loadSuppliers() {
    const res = await api.get('/suppliers');
    setSuppliers(res.data);
  }

  useEffect(() => {
    loadParts();
    loadSuppliers();
  }, []);

  // ---- open the modal -----------------------------------------------------
  function openCreate() {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ unit: 'pcs', reorderLevel: 5 });
    setModalOpen(true);
  }

  function openEdit(record) {
    setEditing(record);
    form.setFieldsValue(record);
    setModalOpen(true);
  }

  // ---- save (create or update) -------------------------------------------
  async function handleSave() {
    try {
      const values = await form.validateFields(); // runs the rules below
      if (editing) {
        await api.put(`/parts/${editing.id}`, values);
        message.success('Part updated.');
      } else {
        await api.post('/parts', values);
        message.success('Part added.');
      }
      setModalOpen(false);
      loadParts();
    } catch (err) {
      if (err?.errorFields) return; // validation error, form shows it
      message.error(err?.response?.data?.error || 'Save failed.');
    }
  }

  // ---- delete -------------------------------------------------------------
  async function handleDelete(id) {
    try {
      await api.delete(`/parts/${id}`);
      message.success('Part deleted.');
      loadParts();
    } catch {
      message.error('Delete failed.');
    }
  }

  // ---- table columns ------------------------------------------------------
  const columns = [
    { title: 'Part No.', dataIndex: 'partNumber' },
    { title: 'Name', dataIndex: 'name' },
    { title: 'Vehicle', dataIndex: 'vehicleMake' },
    { title: 'Category', dataIndex: 'category', render: (c) => c && <Tag>{c}</Tag> },
    { title: 'Selling price', dataIndex: 'sellingPrice', render: (v) => etb(v) },
    {
      title: 'Stock',
      dataIndex: 'quantityInStock',
      render: (qty, row) => (
        <Tag color={qty <= row.reorderLevel ? 'orange' : 'green'}>{qty} {row.unit}</Tag>
      ),
    },
    { title: 'Supplier', dataIndex: ['supplier', 'name'], render: (n) => n || '—' },
    {
      title: 'Actions',
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>Edit</Button>
          <Popconfirm title="Delete this part?" onConfirm={() => handleDelete(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />}>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0 }}>Parts</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Add part</Button>
      </div>

      <Table rowKey="id" loading={loading} dataSource={parts} columns={columns} />

      <Modal
        title={editing ? 'Edit part' : 'Add part'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        okText="Save"
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="partNumber" label="Part number" rules={[{ required: true, message: 'Required' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Required' }]}>
            <Input />
          </Form.Item>
          <Space style={{ display: 'flex' }} align="start">
            <Form.Item name="brand" label="Brand"><Input /></Form.Item>
            <Form.Item name="vehicleMake" label="Vehicle make"><Input /></Form.Item>
          </Space>
          <Space style={{ display: 'flex' }} align="start">
            <Form.Item name="category" label="Category"><Input placeholder="Brakes, Filters…" /></Form.Item>
            <Form.Item name="unit" label="Unit"><Input /></Form.Item>
          </Space>
          <Space style={{ display: 'flex' }} align="start">
            <Form.Item name="costPrice" label="Cost price (ETB)"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
            <Form.Item name="sellingPrice" label="Selling price (ETB)"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
          </Space>
          <Space style={{ display: 'flex' }} align="start">
            <Form.Item name="quantityInStock" label="Quantity in stock"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
            <Form.Item name="reorderLevel" label="Reorder level"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
          </Space>
          <Form.Item name="supplierId" label="Supplier">
            <Select
              allowClear
              placeholder="Choose a supplier"
              options={suppliers.map((s) => ({ value: s.id, label: `${s.name} (${s.country})` }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
