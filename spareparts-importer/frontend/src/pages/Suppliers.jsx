// Same pattern as Parts.jsx, fewer fields. See Parts.jsx for the commentary.
import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Space, Popconfirm, Tag, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../api/client.js';

export default function Suppliers() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  async function load() {
    setLoading(true);
    try {
      const res = await api.get('/suppliers');
      setRows(res.data);
    } catch {
      message.error('Failed to load suppliers.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openCreate() { setEditing(null); form.resetFields(); setModalOpen(true); }
  function openEdit(record) { setEditing(record); form.setFieldsValue(record); setModalOpen(true); }

  async function handleSave() {
    try {
      const values = await form.validateFields();
      if (editing) await api.put(`/suppliers/${editing.id}`, values);
      else await api.post('/suppliers', values);
      message.success('Saved.');
      setModalOpen(false);
      load();
    } catch (err) {
      if (err?.errorFields) return;
      message.error(err?.response?.data?.error || 'Save failed.');
    }
  }

  async function handleDelete(id) {
    try { await api.delete(`/suppliers/${id}`); message.success('Deleted.'); load(); }
    catch { message.error('Delete failed. Remove its parts first.'); }
  }

  const columns = [
    { title: 'Name', dataIndex: 'name' },
    { title: 'Country', dataIndex: 'country', render: (c) => <Tag>{c}</Tag> },
    { title: 'Contact', dataIndex: 'contactPerson', render: (v) => v || '—' },
    { title: 'Phone', dataIndex: 'phone', render: (v) => v || '—' },
    { title: 'Email', dataIndex: 'email', render: (v) => v || '—' },
    { title: 'Parts', dataIndex: ['_count', 'parts'], render: (v) => v ?? 0 },
    {
      title: 'Actions',
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>Edit</Button>
          <Popconfirm title="Delete this supplier?" onConfirm={() => handleDelete(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />}>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0 }}>Suppliers</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Add supplier</Button>
      </div>

      <Table rowKey="id" loading={loading} dataSource={rows} columns={columns} />

      <Modal title={editing ? 'Edit supplier' : 'Add supplier'} open={modalOpen} onOk={handleSave} onCancel={() => setModalOpen(false)} okText="Save" destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Required' }]}><Input /></Form.Item>
          <Form.Item name="country" label="Country" rules={[{ required: true, message: 'Required' }]}><Input placeholder="China, UAE, Japan…" /></Form.Item>
          <Form.Item name="contactPerson" label="Contact person"><Input /></Form.Item>
          <Form.Item name="phone" label="Phone"><Input /></Form.Item>
          <Form.Item name="email" label="Email" rules={[{ type: 'email', message: 'Not a valid email' }]}><Input /></Form.Item>
        </Form>
      </Modal>
    </>
  );
}
