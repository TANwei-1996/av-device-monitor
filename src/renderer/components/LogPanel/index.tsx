import React, { useRef, useEffect } from 'react';
import { Card, Select, Input, Button, Space, Tag, Typography } from 'antd';
import { DownloadOutlined, DeleteOutlined, FileTextOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useLogStore } from '../../stores/logStore';

const { Text } = Typography;

const levelColors: Record<string, string> = {
  error: 'red',
  warn: 'orange',
  info: 'blue',
  debug: 'default',
  trace: 'default',
};

const LogPanel: React.FC = () => {
  const { t } = useTranslation();
  const listRef = useRef<HTMLDivElement>(null);
  const {
    entries,
    levelFilter,
    searchText,
    setLevelFilter,
    setSearchText,
    clearEntries,
    getFilteredEntries,
  } = useLogStore();

  const filteredEntries = getFilteredEntries();

  // Auto-scroll to bottom
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [entries.length]);

  const handleExport = async (format: 'txt' | 'json') => {
    try {
      const content = await window.electron.exportLogs(format);
      const blob = new Blob([content], {
        type: format === 'json' ? 'application/json' : 'text/plain',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `avmonitor-logs-${new Date().toISOString().slice(0, 10)}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  return (
    <Card
      title={<span><FileTextOutlined /> {t('log.title')}</span>}
      size="small"
      style={{ marginTop: 16 }}
      extra={
        <Space>
          <Button size="small" icon={<DownloadOutlined />} onClick={() => handleExport('txt')}>
            {t('log.export')}
          </Button>
          <Button size="small" icon={<DeleteOutlined />} onClick={clearEntries}>
            {t('log.clear')}
          </Button>
        </Space>
      }
    >
      <Space style={{ marginBottom: 8 }}>
        <Select value={levelFilter} onChange={setLevelFilter} style={{ width: 100 }} size="small">
          <Select.Option value="all">{t('log.level.all')}</Select.Option>
          <Select.Option value="error">{t('log.level.error')}</Select.Option>
          <Select.Option value="warn">{t('log.level.warn')}</Select.Option>
          <Select.Option value="info">{t('log.level.info')}</Select.Option>
          <Select.Option value="debug">{t('log.level.debug')}</Select.Option>
        </Select>
        <Input
          placeholder={t('log.search')}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 200 }}
          size="small"
          allowClear
        />
        <Text type="secondary" style={{ fontSize: 11 }}>
          {filteredEntries.length} / {entries.length}
        </Text>
      </Space>

      <div
        ref={listRef}
        className="log-panel"
        style={{
          maxHeight: 250,
          overflow: 'auto',
          background: '#00000040',
          borderRadius: 4,
          padding: 4,
        }}
      >
        {filteredEntries.map((entry) => (
          <div key={entry.id} className="log-entry">
            <Tag color={levelColors[entry.level] || 'default'} style={{ marginRight: 0, minWidth: 52, textAlign: 'center' }}>
              {entry.level.toUpperCase()}
            </Tag>
            <span className="log-timestamp">
              {new Date(entry.timestamp).toLocaleTimeString('zh-CN', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                fractionalSecondDigits: 3,
              } as any)}
            </span>
            <span className="log-message">
              <Tag style={{ marginRight: 4, fontSize: 10, padding: '0 4px', lineHeight: '18px' }}>
                {entry.module}
              </Tag>
              {entry.message}
            </span>
          </div>
        ))}
        {filteredEntries.length === 0 && (
          <div style={{ padding: 20, textAlign: 'center' }}>
            <Text type="secondary">No log entries</Text>
          </div>
        )}
      </div>
    </Card>
  );
};

export default LogPanel;
