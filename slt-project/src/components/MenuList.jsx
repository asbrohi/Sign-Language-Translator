import React from "react";
import { useNavigate, useLocation } from "react-router-dom"; // Import useNavigate
import "./MenuList.css";
import { Menu } from "antd";
import {
  HomeOutlined,
  VideoCameraOutlined,
  TranslationOutlined,
  PhoneOutlined,
  FolderAddOutlined,
  LogoutOutlined,
} from "@ant-design/icons";

const MenuList = () => {
  const navigate = useNavigate();

  const getMenuKeyFromLocation = () => {
    const path = location.pathname;
    let key = path.replace("/home/", "");
    if (key === "" || key === "/home" || key === "/") {
      key = "home";
    }

    return key;
  };

  const currentKey = getMenuKeyFromLocation();

  const handleMenuClick = ({ key }) => {
    if (key === "logout") {
      // Handle logout logic here
      navigate("/"); // Redirect to login page after logout
    } else {
      navigate(`/home/${key === "home" ? "" : key}`);
    }
  };

  return (
    <Menu
      theme="dark"
      mode="inline"
      className="menu-bar"
      style={{ backgroundColor: "#4C9670" }}
      onClick={handleMenuClick}
    >
      <Menu.Item
        style={{ color: "black" }}
        className="keys"
        key="home"
        icon={<HomeOutlined />}
      >
        Home
      </Menu.Item>

      <Menu.Item
        style={{ color: "black" }}
        className="keys"
        key="add-gestures"
        icon={<FolderAddOutlined />}
      >
        Add Gestures
      </Menu.Item>

      <Menu.Item
        style={{ color: "black" }}
        className="keys"
        key="video-calling"
        icon={<PhoneOutlined />}
      >
        Video Calling
      </Menu.Item>

      <Menu.Item
        style={{ color: "black" }}
        className="keys"
        key="video-recording"
        icon={<VideoCameraOutlined />}
      >
        Video Recording
      </Menu.Item>

      <Menu.Item
        style={{ color: "black" }}
        className="keys"
        key="real-time-translation"
        icon={<TranslationOutlined />}
      >
        Translation
      </Menu.Item>

      <Menu.Item
        className="keys"
        key="logout"
        icon={<LogoutOutlined />}
        style={{ marginTop: "85%", color: "black" }}
      >
        Logout
      </Menu.Item>
    </Menu>
  );
};

export default MenuList;
