// The shell that wraps every page: a collapsible sidebar + top bar + content.
// This is what makes it feel like a real "admin template".
import { useState } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Layout, Menu, Typography } from 'antd';
import {
  DashboardOutlined,
  ToolOutlined,
  ShopOutlined,
  TeamOutlined,
} from '@ant-design/icons';

import Dashboard from '../pages/Dashboard.jsx';
import Parts from '../pages/Parts.jsx';
import Suppliers from '../pages/Suppliers.jsx';
import Customers from '../pages/Customers.jsx';

const { Header, Sider, Content } = Layout;

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: <Link to="/">Dashboard</Link> },
  { key: '/parts', icon: <ToolOutlined />, label: <Link to="/parts">Parts</Link> },
  { key: '/suppliers', icon: <ShopOutlined />, label: <Link to="/suppliers">Suppliers</Link> },
  { key: '/customers', icon: <TeamOutlined />, label: <Link to="/customers">Customers</Link> },
];

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} theme="dark">
        <div style={{ color: '#fff', padding: '16px', fontWeight: 700, fontSize: collapsed ? 12 : 16, textAlign: 'center' }}>
          {collapsed ? 'SPI' : 'Spare Parts Importer'}
        </div>
        <Menu theme="dark" mode="inline" selectedKeys={[location.pathname]} items={menuItems} />
      </Sider>

      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', alignItems: 'center' }}>
          <Typography.Title level={4} style={{ margin: 0 }}>
            Back-office
          </Typography.Title>
        </Header>

        <Content style={{ margin: 24 }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/parts" element={<Parts />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
}
