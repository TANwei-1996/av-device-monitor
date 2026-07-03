import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Select, Row, Col, Space, Typography, Input, message, Tag } from 'antd';
import { PlayCircleOutlined, PauseCircleOutlined, StopOutlined, FolderOpenOutlined, AudioOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

const RecorderPanel: React.FC = () => {
  const { t } = useTranslation();
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [fileSize, setFileSize] = useState(0);
  const [filepath, setFilepath] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const [sampleRate, setSampleRate] = useState(48000);
  const [bitDepth, setBitDepth] = useState<8 | 16 | 24 | 32>(16);
  const [channels, setChannels] = useState<1 | 2>(1);
  const [outputDir, setOutputDir] = useState('');

  useEffect(() => {
    // Load default recording path
    window.electron.getPaths().then((paths) => {
      setOutputDir(paths.recordings);
    });
  }, []);

  // Poll recording status from main process for real file size and duration
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(async () => {
        try {
          const status = await window.electron.getRecordingStatus();
          setDuration(Math.floor(status.duration));
          setFileSize(status.fileSize);
        } catch {
          // ignore polling errors
        }
      }, 500);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording, isPaused]);

  const handleStart = async () => {
    try {
      const fp = await window.electron.startRecording({
        sampleRate,
        bitDepth,
        channels,
        outputDir: outputDir || '.',
      });
      setIsRecording(true);
      setIsPaused(false);
      setDuration(0);
      setFileSize(0);
      setFilepath(fp);

      // Activate sample bridge in AudioPanel
      const setRecordingActive = (window as any).__setRecordingActive;
      if (setRecordingActive) setRecordingActive(true);

      message.success(t('recorder.start'));
    } catch (err: any) {
      message.error(err.message || 'Failed to start recording');
    }
  };

  const handleStop = async () => {
    try {
      // Deactivate sample bridge first
      const setRecordingActive = (window as any).__setRecordingActive;
      if (setRecordingActive) setRecordingActive(false);

      const result = await window.electron.stopRecording();
      setIsRecording(false);
      setIsPaused(false);
      message.success(
        `Recording saved: ${result.filepath} (${result.duration.toFixed(1)}s, ${(result.fileSize / 1024 / 1024).toFixed(2)}MB)`
      );
    } catch (err: any) {
      message.error(err.message || 'Failed to stop recording');
    }
  };

  const handlePause = async () => {
    // Pause sample flow
    const setRecordingActive = (window as any).__setRecordingActive;
    if (setRecordingActive) setRecordingActive(false);

    await window.electron.pauseRecording();
    setIsPaused(true);
  };

  const handleResume = async () => {
    await window.electron.resumeRecording();
    setIsPaused(false);

    // Resume sample flow
    const setRecordingActive = (window as any).__setRecordingActive;
    if (setRecordingActive) setRecordingActive(true);
  };

  const handleSelectDir = async () => {
    const dir = await window.electron.openDirectory();
    if (dir) setOutputDir(dir);
  };

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <Card
      title={<span><AudioOutlined /> {t('recorder.title')}</span>}
      size="small"
      style={{ marginTop: 16 }}
    >
      <Row gutter={[16, 12]}>
        <Col span={6}>
          <Text type="secondary" style={{ fontSize: 12 }}>{t('recorder.sampleRate')}</Text>
          <Select
            style={{ width: '100%', marginTop: 4 }}
            value={sampleRate}
            onChange={setSampleRate}
            disabled={isRecording}
          >
            {[8000, 16000, 22050, 44100, 48000, 96000].map((rate) => (
              <Select.Option key={rate} value={rate}>{rate} Hz</Select.Option>
            ))}
          </Select>
        </Col>
        <Col span={6}>
          <Text type="secondary" style={{ fontSize: 12 }}>{t('recorder.bitDepth')}</Text>
          <Select
            style={{ width: '100%', marginTop: 4 }}
            value={bitDepth}
            onChange={setBitDepth}
            disabled={isRecording}
          >
            {[8, 16, 24, 32].map((depth) => (
              <Select.Option key={depth} value={depth}>{depth}-bit</Select.Option>
            ))}
          </Select>
        </Col>
        <Col span={6}>
          <Text type="secondary" style={{ fontSize: 12 }}>{t('recorder.channels')}</Text>
          <Select
            style={{ width: '100%', marginTop: 4 }}
            value={channels}
            onChange={setChannels}
            disabled={isRecording}
          >
            <Select.Option value={1}>{t('recorder.mono')}</Select.Option>
            <Select.Option value={2}>{t('recorder.stereo')}</Select.Option>
          </Select>
        </Col>
        <Col span={6}>
          <Text type="secondary" style={{ fontSize: 12 }}>{t('recorder.savePath')}</Text>
          <Input
            value={outputDir}
            onChange={(e) => setOutputDir(e.target.value)}
            disabled={isRecording}
            style={{ marginTop: 4 }}
            addonAfter={
              <FolderOpenOutlined
                style={{ cursor: 'pointer' }}
                onClick={!isRecording ? handleSelectDir : undefined}
              />
            }
          />
        </Col>
      </Row>

      <Space style={{ marginTop: 16, width: '100%' }} direction="vertical">
        <Space>
          {!isRecording ? (
            <Button type="primary" icon={<PlayCircleOutlined />} onClick={handleStart}>
              {t('recorder.start')}
            </Button>
          ) : (
            <>
              {isPaused ? (
                <Button type="primary" icon={<PlayCircleOutlined />} onClick={handleResume}>
                  {t('recorder.resume')}
                </Button>
              ) : (
                <Button icon={<PauseCircleOutlined />} onClick={handlePause}>
                  {t('recorder.pause')}
                </Button>
              )}
              <Button danger icon={<StopOutlined />} onClick={handleStop}>
                {t('recorder.stop')}
              </Button>
            </>
          )}

          {isRecording && (
            <Tag color={isPaused ? 'default' : 'red'}>
              {isPaused ? t('recorder.paused') || 'Paused' : t('recorder.recording')}
            </Tag>
          )}
        </Space>

        {isRecording && (
          <Space size="large">
            <Text strong>{formatDuration(duration)}</Text>
            <Text type="secondary">{(fileSize / 1024 / 1024).toFixed(2)} MB</Text>
            <Text type="secondary">
              {sampleRate}Hz, {bitDepth}-bit, {channels === 1 ? t('recorder.mono') : t('recorder.stereo')}
            </Text>
          </Space>
        )}
      </Space>
    </Card>
  );
};

export default RecorderPanel;
