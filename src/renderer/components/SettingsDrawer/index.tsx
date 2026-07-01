import React, { useEffect, useState } from 'react';
import { Drawer, Form, Input, Button, Space, Select, Typography, Divider, message } from 'antd';
import { FolderOpenOutlined, ReloadOutlined, SettingOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

interface Props {
  open: boolean;
  onClose: () => void;
}

const SettingsDrawer: React.FC<Props> = ({ open, onClose }) => {
  const { t, i18n } = useTranslation();
  const [paths, setPaths] = useState({
    logs: '',
    recordings: '',
    config: '',
    temp: '',
  });

  useEffect(() => {
    if (open) {
      window.electron.getPaths().then(setPaths);
    }
  }, [open]);

  const handleBrowse = async (key: string) => {
    const dir = await window.electron.openDirectory();
    if (dir) {
      const newPaths = { ...paths, [key]: dir };
      setPaths(newPaths);
      await window.electron.setPath(key, dir);
      message.success('Path updated');
    }
  };

  const handleReset = async () => {
    await window.electron.resetPaths();
    const newPaths = await window.electron.getPaths();
    setPaths(newPaths);
    message.success(t('settings.paths.reset'));
  };

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    window.electron.setSettings({ language: lang });
  };

  return (
    <Drawer
      title={t('settings.title')}
      placement="right"
      width={400}
      onClose={onClose}
      open={open}
    >
      <Form layout="vertical">
        <Form.Item label={t('settings.language')}>
          <Select
            value={i18n.language}
            onChange={handleLanguageChange}
            style={{ width: 200 }}
          >
            <Select.Option value="zh-CN">中文</Select.Option>
            <Select.Option value="en-US">English</Select.Option>
          </Select>
        </Form.Item>

        <Divider>{t('settings.paths.title')}</Divider>

        <Form.Item label={t('settings.paths.logs')}>
          <Space style={{ width: '100%' }}>
            <Input value={paths.logs} readOnly style={{ flex: 1 }} />
            <Button icon={<FolderOpenOutlined />} onClick={() => handleBrowse('logs')} />
          </Space>
        </Form.Item>

        <Form.Item label={t('settings.paths.recordings')}>
          <Space style={{ width: '100%' }}>
            <Input value={paths.recordings} readOnly style={{ flex: 1 }} />
            <Button icon={<FolderOpenOutlined />} onClick={() => handleBrowse('recordings')} />
          </Space>
        </Form.Item>

        <Form.Item>
          <Button icon={<ReloadOutlined />} onClick={handleReset}>
            {t('settings.paths.reset')}
          </Button>
        </Form.Item>
      </Form>
    </Drawer>
  );
};

export default SettingsDrawer;
