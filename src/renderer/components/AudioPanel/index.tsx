import React, { useRef, useEffect } from 'react';
import { Card, Slider, Row, Col, Button, Space, Typography, Statistic } from 'antd';
import { PlayCircleOutlined, PauseCircleOutlined, SoundOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useAudioStore } from '../../stores/audioStore';
import { useDeviceStore } from '../../stores/deviceStore';

const { Text } = Typography;

const AudioPanel: React.FC = () => {
  const { t } = useTranslation();
  const waveformCanvasRef = useRef<HTMLCanvasElement>(null);
  const spectrumCanvasRef = useRef<HTMLCanvasElement>(null);

  const {
    isCapturing,
    audioData,
    denoiseLevel,
    eqBands,
    gain,
    setCapturing,
    setDenoiseLevel,
    setGain,
  } = useAudioStore();

  const selectedAudioDevice = useDeviceStore((s) => s.selectedAudioDevice);

  const handleToggleCapture = async () => {
    if (isCapturing) {
      await window.electron.stopAudioCapture();
      setCapturing(false);
    } else {
      if (!selectedAudioDevice) return;
      await window.electron.startAudioCapture(selectedAudioDevice.id);
      setCapturing(true);
    }
  };

  // Render waveform
  useEffect(() => {
    const canvas = waveformCanvasRef.current;
    if (!canvas || !audioData?.waveform) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    const data = audioData.waveform;

    ctx.fillStyle = '#1f1f1f';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#1668dc';
    ctx.lineWidth = 1.5;
    ctx.beginPath();

    const step = width / data.length;
    const mid = height / 2;

    for (let i = 0; i < data.length; i++) {
      const x = i * step;
      const y = mid + data[i] * mid * 0.9;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    ctx.stroke();

    // Draw center line
    ctx.strokeStyle = '#ffffff22';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, mid);
    ctx.lineTo(width, mid);
    ctx.stroke();
  }, [audioData?.waveform]);

  // Render spectrum
  useEffect(() => {
    const canvas = spectrumCanvasRef.current;
    if (!canvas || !audioData?.spectrum) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    const data = audioData.spectrum;

    ctx.fillStyle = '#1f1f1f';
    ctx.fillRect(0, 0, width, height);

    const barWidth = width / data.length - 1;

    data.forEach((value, i) => {
      const barHeight = value * height * 2;
      const x = i * (barWidth + 1);
      const y = height - barHeight;

      const gradient = ctx.createLinearGradient(x, height, x, y);
      gradient.addColorStop(0, '#1668dc');
      gradient.addColorStop(1, '#69b1ff');

      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, barWidth, barHeight);
    });
  }, [audioData?.spectrum]);

  const dbfs = audioData?.dbfs ?? -100;
  const dbfsDisplay = dbfs > -100 ? dbfs.toFixed(1) : '-Inf';
  const meterPercent = Math.max(0, Math.min(100, ((dbfs + 60) / 60) * 100));
  const meterClass = meterPercent < 60 ? 'good' : meterPercent < 85 ? 'warn' : 'danger';

  return (
    <Card title={<span><SoundOutlined /> {t('audio.title')}</span>} size="small">
      {/* Level Meter */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={4}>
          <Statistic
            title={t('audio.dbfs')}
            value={dbfsDisplay}
            suffix="dB"
            valueStyle={{ fontSize: 20, color: meterPercent > 85 ? '#ff4d4f' : '#fff' }}
          />
        </Col>
        <Col span={20} style={{ display: 'flex', alignItems: 'center' }}>
          <div className="level-meter" style={{ flex: 1 }}>
            <div
              className={`level-meter-fill ${meterClass}`}
              style={{ width: `${meterPercent}%` }}
            />
          </div>
        </Col>
      </Row>

      {/* Waveform */}
      <div style={{ marginBottom: 8 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>{t('audio.waveform')}</Text>
      </div>
      <canvas
        ref={waveformCanvasRef}
        width={800}
        height={120}
        style={{ width: '100%', height: 120, borderRadius: 4, marginBottom: 16, background: '#1f1f1f' }}
      />

      {/* Spectrum */}
      <div style={{ marginBottom: 8 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>{t('audio.spectrum')}</Text>
      </div>
      <canvas
        ref={spectrumCanvasRef}
        width={800}
        height={100}
        style={{ width: '100%', height: 100, borderRadius: 4, marginBottom: 16, background: '#1f1f1f' }}
      />

      {/* Controls */}
      <Space style={{ width: '100%' }} direction="vertical">
        <Row gutter={16}>
          <Col span={8}>
            <Button
              type={isCapturing ? 'default' : 'primary'}
              danger={isCapturing}
              icon={isCapturing ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
              onClick={handleToggleCapture}
              block
              disabled={!selectedAudioDevice}
            >
              {isCapturing ? t('audio.stopCapture') : t('audio.startCapture')}
            </Button>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Text type="secondary" style={{ fontSize: 12 }}>{t('audio.denoise')}: {denoiseLevel}%</Text>
            <Slider
              min={0}
              max={100}
              value={denoiseLevel}
              onChange={setDenoiseLevel}
            />
          </Col>
          <Col span={12}>
            <Text type="secondary" style={{ fontSize: 12 }}>{t('audio.gain')}: {gain > 0 ? '+' : ''}{gain} dB</Text>
            <Slider
              min={-12}
              max={12}
              step={0.5}
              value={gain}
              onChange={setGain}
            />
          </Col>
        </Row>
      </Space>
    </Card>
  );
};

export default AudioPanel;
