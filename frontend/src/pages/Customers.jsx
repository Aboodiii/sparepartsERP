// Same pattern as Parts.jsx. See Parts.jsx for the commentary.
import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, Space, Popconfirm, Tag, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../api/client.js';

const TYPE_COLORS = { Garage: 'blue', Retail: 'green', Wholesale: 'purple' };

export default function Customers() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  async function load() {
    setLoading(true);
    try {
      const res = await api.get('/customers');
      setRows(res.data);
    } catch {
      message.error('Failed to load customers.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openCreate() { setEditing(null); form.resetFields(); form.setFieldsValue({ type: 'Retail' }); setModalOpen(true); }
  function openEdit(record) { setEditing(record); form.setFieldsValue(record); setModalOpen(true); }

  async function handleSave() {
    try {
      const values = await form.validateFields();
      if (editing) await api.put(`/customers/${editing.id}`, values);
      else await api.post('/customers', values);
      message.success('Saved.');
      setModalOpen(false);
      load();
    } catch (err) {
      if (err?.errorFields) return;
      message.error(err?.response?.data?.error || 'Save failed.');
    }
  }

  async function handleDelete(id) {
    try { await api.delete(`/customers/${id}`); message.success('Deleted.'); load(); }
    catch { message.error('Delete failed.'); }
  }

  const columns = [
    { title: 'Name', dataIndex: 'name' },
    { title: 'Type', dataIndex: 'type', render: (t) => <Tag color={TYPE_COLORS[t]}>{t}</Tag> },
    { title: 'Phone', dataIndex: 'phone', render: (v) => v || '—' },
    { title: 'Email', dataIndex: 'email', render: (v) => v || '—' },
    { title: 'Address', dataIndex: 'address', render: (v) => v || '—' },
    {
      title: 'Actions',
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>Edit</Button>
          <Popconfirm title="Delete this customer?" onConfirm={() => handleDelete(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />}>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0 }}>Customers</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Add customer</Button>
      </div>

      <Table rowKey="id" loading={loading} dataSource={rows} columns={columns} />

      <Modal title={editing ? 'Edit customer' : 'Add customer'} open={modalOpen} onOk={handleSave} onCancel={() => setModalOpen(false)} okText="Save" destroyOnHidden>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Required' }]}><Input /></Form.Item>
          <Form.Item name="type" label="Type" rules={[{ required: true }]}>
            <Select options={['Garage', 'Retail', 'Wholesale'].map((t) => ({ value: t, label: t }))} />
          </Form.Item>
          <Form.Item name="phone" label="Phone"><Input /></Form.Item>
          <Form.Item name="email" label="Email" rules={[{ type: 'email', message: 'Not a valid email' }]}><Input /></Form.Item>
          <Form.Item name="address" label="Address"><Input /></Form.Item>
        </Form>
      </Modal>
    </>
  );
}
