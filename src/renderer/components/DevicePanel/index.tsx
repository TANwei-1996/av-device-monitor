import React, { useEffect } from 'react';
import { List, Select, Tag, Card, Descriptions, Spin, Empty, Typography, Divider, Button } from 'antd';
import { UsbOutlined, AudioOutlined, VideoCameraOutlined, ReloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useDeviceStore } from '../../stores/deviceStore';

const { Title, Text } = Typography;

const DevicePanel: React.FC = () => {
  const { t } = useTranslation();
  const {
    audioDevices,
    videoDevices,
    usbDevices,
    selectedAudioDevice,
    selectedVideoDevice,
    isLoading,
    selectAudioDevice,
    selectVideoDevice,
    fetchAllDevices,
  } = useDeviceStore();

  // Find matching USB device for selected audio/video device
  const getUSBInfo = (deviceName: string) => {
    return usbDevices.find(
      (usb) =>
        deviceName.toLowerCase().includes(usb.product.toLowerCase()) ||
        deviceName.toLowerCase().includes(usb.manufacturer.toLowerCase())
    );
  };

  const selectedUSB = selectedAudioDevice
    ? getUSBInfo(selectedAudioDevice.name)
    : selectedVideoDevice
    ? getUSBInfo(selectedVideoDevice.name)
    : null;

  return (
    <div style={{ padding: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <Title level={5} style={{ margin: 0 }}>
          {t('device.title')}
        </Title>
        <Button
          type="text"
          size="small"
          icon={<ReloadOutlined spin={isLoading} />}
          onClick={fetchAllDevices}
          loading={isLoading}
        />
      </div>

      {/* Audio Device Select */}
      <div style={{ marginBottom: 16 }}>
        <Text type="secondary" style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>
          <AudioOutlined /> {t('device.microphone')}
        </Text>
        <Select
          style={{ width: '100%' }}
          placeholder={t('device.noDevice')}
          value={selectedAudioDevice?.id}
          onChange={(id) => {
            const device = audioDevices.find((d) => d.id === id);
            selectAudioDevice(device || null);
          }}
          loading={isLoading}
        >
          {audioDevices.map((device) => (
            <Select.Option key={device.id} value={device.id}>
              {device.name} {device.isDefault && <Tag color="blue">Default</Tag>}
            </Select.Option>
          ))}
        </Select>
      </div>

      {/* Video Device Select */}
      <div style={{ marginBottom: 16 }}>
        <Text type="secondary" style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>
          <VideoCameraOutlined /> {t('device.camera')}
        </Text>
        <Select
          style={{ width: '100%' }}
          placeholder={t('device.noDevice')}
          value={selectedVideoDevice?.id}
          onChange={(id) => {
            const device = videoDevices.find((d) => d.id === id);
            selectVideoDevice(device || null);
          }}
          loading={isLoading}
        >
          {videoDevices.map((device) => (
            <Select.Option key={device.id} value={device.id}>
              {device.name}
            </Select.Option>
          ))}
        </Select>
      </div>

      {/* USB Device Info Card */}
      {selectedUSB && (
        <Card
          size="small"
          title={
            <span>
              <UsbOutlined /> {t('device.usbInfo')}
            </span>
          }
          style={{ marginTop: 8 }}
        >
          <Descriptions column={1} size="small">
            <Descriptions.Item label={t('device.vid')}>
              <Tag>{selectedUSB.vid}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label={t('device.pid')}>
              <Tag>{selectedUSB.pid}</Tag>
            </Descriptions.Item>
            {selectedUSB.manufacturer && (
              <Descriptions.Item label={t('device.manufacturer')}>
                {selectedUSB.manufacturer}
              </Descriptions.Item>
            )}
            {selectedUSB.product && (
              <Descriptions.Item label={t('device.product')}>
                {selectedUSB.product}
              </Descriptions.Item>
            )}
            {selectedUSB.serialNumber && (
              <Descriptions.Item label={t('device.serial')}>
                {selectedUSB.serialNumber}
              </Descriptions.Item>
            )}
            <Descriptions.Item label={t('device.usbVersion')}>
              USB {selectedUSB.usbVersion}
            </Descriptions.Item>
            <Descriptions.Item label={t('device.deviceType')}>
              <Tag color="processing">{selectedUSB.deviceType}</Tag>
            </Descriptions.Item>
            {selectedUSB.firmwareVersion && (
              <Descriptions.Item label={t('device.firmware')}>
                {selectedUSB.firmwareVersion}
              </Descriptions.Item>
            )}
            <Descriptions.Item label={t('device.powerMode')}>
              {selectedUSB.powerMode}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}

      {/* USB Device List */}
      <Divider style={{ margin: '12px 0' }}>
        <Text type="secondary" style={{ fontSize: 11 }}>
          USB Devices ({usbDevices.length})
        </Text>
      </Divider>
      <List
        size="small"
        dataSource={usbDevices.slice(0, 20)}
        locale={{ emptyText: <Empty description={t('device.noDevice')} image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
        renderItem={(device) => (
          <List.Item style={{ padding: '4px 0' }}>
            <List.Item.Meta
              avatar={<UsbOutlined style={{ fontSize: 16, color: '#1668dc' }} />}
              title={
                <Text style={{ fontSize: 12 }} ellipsis>
                  {device.product || device.manufacturer || `${device.vid}:${device.pid}`}
                </Text>
              }
              description={
                <Text type="secondary" style={{ fontSize: 10 }}>
                  {device.vid}:{device.pid} | {device.deviceType}
                </Text>
              }
            />
          </List.Item>
        )}
      />
    </div>
  );
};

export default DevicePanel;
