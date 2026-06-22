// The shell that wraps every page: a collapsible sidebar + top bar + content.
import { useState } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Layout, Menu, Typography } from 'antd';
import {
  DashboardOutlined,
  ToolOutlined,
  ShopOutlined,
  TeamOutlined,
  FileTextOutlined,
  CompassOutlined,
  DollarOutlined
} from '@ant-design/icons';

import Dashboard from '../pages/Dashboard.jsx';
import Parts from '../pages/Parts.jsx';
import Suppliers from '../pages/Suppliers.jsx';
import Customers from '../pages/Customers.jsx';
import Proformas from '../pages/Proformas.jsx';
import ProformaDetail from '../pages/ProformaDetail.jsx';
import Shipments from '../pages/Shipments.jsx';
import ShipmentDetail from '../pages/ShipmentDetail.jsx';
import Finance from '../pages/Finance.jsx';

const { Header, Sider, Content } = Layout;

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: <Link to="/">Dashboard</Link> },
  { key: 'grp-presales', type: 'group', label: 'PRESALES', children: [
    { key: '/proformas', icon: <FileTextOutlined />, label: <Link to="/proformas">Proformas</Link> }
  ]},
  { key: 'grp-shipments', type: 'group', label: 'SHIPMENTS', children: [
    { key: '/shipments', icon: <CompassOutlined />, label: <Link to="/shipments">Shipments</Link> }
  ]},
  { key: 'grp-inventory', type: 'group', label: 'INVENTORY & PARTNERS', children: [
    { key: '/parts', icon: <ToolOutlined />, label: <Link to="/parts">Parts Inventory</Link> },
    { key: '/suppliers', icon: <ShopOutlined />, label: <Link to="/suppliers">Suppliers</Link> },
    { key: '/customers', icon: <TeamOutlined />, label: <Link to="/customers">Customers</Link> }
  ]},
  { key: 'grp-finance', type: 'group', label: 'FINANCES', children: [
    { key: '/finance', icon: <DollarOutlined />, label: <Link to="/finance">Finance & Expenses</Link> }
  ]}
];

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  // Find selected key (handling sub-paths like /proformas/1)
  const getSelectedKey = () => {
    const path = location.pathname;
    if (path.startsWith('/proformas')) return '/proformas';
    if (path.startsWith('/shipments')) return '/shipments';
    return path;
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} theme="dark" width={240}>
        <div style={{ color: '#fff', padding: '16px', fontWeight: 700, fontSize: collapsed ? 12 : 16, textAlign: 'center', background: '#073c1f' }}>
          {collapsed ? 'SPI' : '🇪🇹 Spare Parts Importer'}
        </div>
        <Menu theme="dark" mode="inline" selectedKeys={[getSelectedKey()]} items={menuItems} style={{ borderRight: 0 }} />
      </Sider>

      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #f0f0f0' }}>
          <Typography.Title level={4} style={{ margin: 0, color: '#0f7b3f' }}>
            Back-office Importer Console
          </Typography.Title>
        </Header>

        <Content style={{ margin: '24px', minHeight: 280 }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/proformas" element={<Proformas />} />
            <Route path="/proformas/:id" element={<ProformaDetail />} />
            <Route path="/shipments" element={<Shipments />} />
            <Route path="/shipments/:id" element={<ShipmentDetail />} />
            <Route path="/parts" element={<Parts />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/finance" element={<Finance />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
}
