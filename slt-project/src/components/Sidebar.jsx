import React, { useState } from "react";
import { Button, Layout, theme } from "antd";
import Logo from "./Logo";
import "./Sidebar.css";
import MenuList from "./MenuList";
import { MenuUnfoldOutlined, MenuFoldOutlined } from "@ant-design/icons";

const { Header, Sider } = Layout;
const Sidebar = () => {
  const [darkTheme, setDarkTheme] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  const {
    token: { colorBgContainer },
  } = theme.useToken();

  return (
    <div>
      <Layout>
        <Header style={{ padding: 0, background: colorBgContainer }}>
          <Button
            className="toggle"
            type="text"
            onClick={() => {
              setCollapsed(!collapsed);
            }}
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          />
        </Header>
      </Layout>
      <Layout>
        <Sider
          collapsed={collapsed}
          trigger={null}
          theme="dark"
          className="sidebar"
          style={{backgroundColor: '#4C9670', padding: 0, margin:0}}
        >
          <Logo />
          <MenuList />
        </Sider>
      </Layout>
    </div>
  );
};

export default Sidebar;
