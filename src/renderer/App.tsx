import React, { useEffect, useState } from 'react';
import { ConfigProvider, theme, Button, Space, Layout, Typography } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import DevicePanel from './components/DevicePanel';
import AudioPanel from './components/AudioPanel';
import VideoPanel from './components/VideoPanel';
import RecorderPanel from './components/RecorderPanel';
import LogPanel from './components/LogPanel';
import SettingsDrawer from './components/SettingsDrawer';
import { useDeviceStore } from './stores/deviceStore';
import { useLogStore } from './stores/logStore';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

const App: React.FC = () => {
  const { t } = useTranslation();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const fetchAllDevices = useDeviceStore((s) => s.fetchAllDevices);
  const addLogEntry = useLogStore((s) => s.addEntry);

  useEffect(() => {
    // Fetch devices on mount
    fetchAllDevices();

    // Subscribe to log entries
    const unsubLog = window.electron.onLogEntry((entry) => {
      addLogEntry(entry);
    });

    // Subscribe to device changes
    const unsubDevice = window.electron.onDeviceChanged(() => {
      fetchAllDevices();
    });

    return () => {
      unsubLog();
      unsubDevice();
    };
  }, []);

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#1668dc',
          borderRadius: 6,
        },
      }}
    >
      <Layout className="app-layout">
        <Header className="app-header">
          <Space>
            <Title level={4} style={{ margin: 0, color: '#fff' }}>
              {t('app.title')}
            </Title>
          </Space>
          <div className="header-actions">
            <Space>
              <Button
                icon={<SettingOutlined />}
                type="text"
                onClick={() => setSettingsOpen(true)}
              />
            </Space>
          </div>
        </Header>

        <div className="app-content">
          <Sider className="sidebar" width={280} theme="dark">
            <DevicePanel />
          </Sider>
          <Content className="main-content">
            <AudioPanel />
            <VideoPanel />
            <RecorderPanel />
            <LogPanel />
          </Content>
        </div>

        <SettingsDrawer
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
        />
      </Layout>
    </ConfigProvider>
  );
};

export default App;
