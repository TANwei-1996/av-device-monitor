import React, { useRef, useEffect, useState } from 'react';
import { Card, Select, Row, Col, Typography, Tag, Empty, Space } from 'antd';
import { VideoCameraOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useDeviceStore } from '../../stores/deviceStore';

const { Text } = Typography;

const VideoPanel: React.FC = () => {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [resolution, setResolution] = useState('1920x1080');
  const [actualSettings, setActualSettings] = useState<{ width: number; height: number; frameRate: number } | null>(null);

  const { selectedVideoDevice, videoDevices } = useDeviceStore();

  useEffect(() => {
    let currentStream: MediaStream | null = null;

    const startCamera = async () => {
      if (!selectedVideoDevice) {
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
          setStream(null);
        }
        return;
      }

      try {
        const [w, h] = resolution.split('x').map(Number);
        currentStream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: { exact: selectedVideoDevice.id },
            width: { ideal: w },
            height: { ideal: h },
          },
        });

        setStream(currentStream);
        if (videoRef.current) {
          videoRef.current.srcObject = currentStream;
        }

        // Get actual settings
        const track = currentStream.getVideoTracks()[0];
        const settings = track.getSettings();
        setActualSettings({
          width: settings.width || w,
          height: settings.height || h,
          frameRate: Math.round(settings.frameRate || 30),
        });
      } catch (err) {
        console.error('Failed to start camera:', err);
      }
    };

    startCamera();

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [selectedVideoDevice, resolution]);

  const selectedDevice = videoDevices.find((d) => d.id === selectedVideoDevice?.id);

  return (
    <Card
      title={<span><VideoCameraOutlined /> {t('video.title')}</span>}
      size="small"
      style={{ marginTop: 16 }}
    >
      {selectedVideoDevice ? (
        <>
          <Row gutter={16} style={{ marginBottom: 12 }}>
            <Col span={8}>
              <Text type="secondary" style={{ fontSize: 12 }}>{t('video.resolution')}</Text>
              <Select
                style={{ width: '100%', marginTop: 4 }}
                value={resolution}
                onChange={setResolution}
              >
                {selectedDevice?.resolutions.map((res) => (
                  <Select.Option key={`${res.width}x${res.height}`} value={`${res.width}x${res.height}`}>
                    {res.width}x{res.height}
                  </Select.Option>
                )) || (
                  <>
                    <Select.Option value="1920x1080">1920x1080</Select.Option>
                    <Select.Option value="1280x720">1280x720</Select.Option>
                    <Select.Option value="640x480">640x480</Select.Option>
                  </>
                )}
              </Select>
            </Col>
            <Col span={16}>
              {actualSettings && (
                <Space style={{ marginTop: 22 }}>
                  <Tag color="blue">
                    {actualSettings.width}x{actualSettings.height}
                  </Tag>
                  <Tag color="green">{actualSettings.frameRate} fps</Tag>
                </Space>
              )}
            </Col>
          </Row>

          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%',
              maxHeight: 400,
              background: '#000',
              borderRadius: 4,
            }}
          />
        </>
      ) : (
        <Empty description={t('video.noCamera')} />
      )}
    </Card>
  );
};

export default VideoPanel;
