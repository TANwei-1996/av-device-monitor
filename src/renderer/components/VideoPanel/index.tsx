import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Card, Select, Row, Col, Typography, Tag, Empty, Space } from 'antd';
import { VideoCameraOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useDeviceStore } from '../../stores/deviceStore';

const { Text } = Typography;

// Rolling history length for charts (2 minutes at 1 sample/sec)
const HISTORY_LENGTH = 120;

// Available codec formats for USB cameras
const CODEC_OPTIONS = [
  { value: 'YUY2', label: 'YUY2' },
  { value: 'MJPEG', label: 'MJPEG' },
  { value: 'H.264', label: 'H.264' },
  { value: 'NV12', label: 'NV12' },
];

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

// Draw a single line chart on a canvas with grid, labels, and fill
function drawLineChart(
  canvas: HTMLCanvasElement,
  data: number[],
  maxVal: number,
  color: string,
  unit: string,
  label: string
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { width, height } = canvas;
  const pad = { top: 8, right: 8, bottom: 18, left: 40 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  // Clear
  ctx.fillStyle = '#141414';
  ctx.fillRect(0, 0, width, height);

  // Grid lines
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + (plotH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(pad.left + plotW, y);
    ctx.stroke();
  }

  // Y-axis labels
  ctx.fillStyle = '#888';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'right';
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + (plotH / 4) * i;
    const val = Math.round(maxVal - (maxVal / 4) * i);
    ctx.fillText(String(val), pad.left - 4, y + 3);
  }

  // Chart label
  ctx.fillStyle = '#aaa';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(label, pad.left, height - 3);

  // Current value
  const current = data.length > 0 ? data[data.length - 1] : 0;
  ctx.textAlign = 'right';
  ctx.fillStyle = color;
  ctx.font = 'bold 11px sans-serif';
  ctx.fillText(`${current.toFixed(0)} ${unit}`, width - pad.right, height - 3);

  if (data.length < 2) return;

  // Draw line
  const step = plotW / (HISTORY_LENGTH - 1);
  const startIdx = Math.max(0, data.length - HISTORY_LENGTH);
  const visible = data.slice(startIdx);
  const offsetX = pad.left + (HISTORY_LENGTH - visible.length) * step;

  // Fill area
  ctx.beginPath();
  ctx.moveTo(offsetX, pad.top + plotH);
  for (let i = 0; i < visible.length; i++) {
    const x = offsetX + i * step;
    const y = pad.top + plotH - (Math.min(visible[i], maxVal) / maxVal) * plotH;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(offsetX + (visible.length - 1) * step, pad.top + plotH);
  ctx.closePath();
  ctx.fillStyle = color + '18';
  ctx.fill();

  // Stroke line
  ctx.beginPath();
  for (let i = 0; i < visible.length; i++) {
    const x = offsetX + i * step;
    const y = pad.top + plotH - (Math.min(visible[i], maxVal) / maxVal) * plotH;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

const VideoPanel: React.FC = () => {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const fpsCanvasRef = useRef<HTMLCanvasElement>(null);
  const bitrateCanvasRef = useRef<HTMLCanvasElement>(null);
  const dropsCanvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const chartTimerRef = useRef<ReturnType<typeof setInterval>>();

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [resolution, setResolution] = useState('1920x1080');
  const [frameRate, setFrameRate] = useState(30);
  const [codec, setCodec] = useState('YUY2');
  const [availableFrameRates, setAvailableFrameRates] = useState<number[]>([30, 60]);
  const [liveInfo, setLiveInfo] = useState({ width: 0, height: 0, aspectRatio: '', fps: 0 });

  // Rolling history for charts
  const fpsHistory = useRef<number[]>([]);
  const bitrateHistory = useRef<number[]>([]);
  const dropsHistory = useRef<number[]>([]);

  // Track previous frame timestamp for dropped frame detection
  const prevFrameTime = useRef(0);
  const expectedFrameInterval = useRef(0);
  const totalDrops = useRef(0);

  const { selectedVideoDevice, videoDevices } = useDeviceStore();

  // Query device capabilities for available frame rates
  const queryCapabilities = useCallback(async (deviceId: string, width: number, height: number) => {
    try {
      const tempStream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: { exact: deviceId },
          width: { ideal: width },
          height: { ideal: height },
        },
      });
      const track = tempStream.getVideoTracks()[0];
      const caps = track.getCapabilities?.() as any;
      if (caps?.frameRate) {
        const maxFps = Math.round(caps.frameRate.max || 30);
        const minFps = Math.round(caps.frameRate.min || 1);
        const standardRates = [15, 24, 25, 30, 48, 60, 120];
        const rates = standardRates.filter((r) => r >= minFps && r <= maxFps);
        if (rates.length === 0) rates.push(maxFps);
        setAvailableFrameRates(rates);
      }
      tempStream.getTracks().forEach((tr) => tr.stop());
    } catch (err) {
      console.error('Failed to query capabilities:', err);
    }
  }, []);

  // Start/restart camera
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
        await queryCapabilities(selectedVideoDevice.id, w, h);

        currentStream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: { exact: selectedVideoDevice.id },
            width: { ideal: w },
            height: { ideal: h },
            frameRate: { ideal: frameRate },
          },
        });

        setStream(currentStream);
        if (videoRef.current) {
          videoRef.current.srcObject = currentStream;
        }

        // Reset chart data
        fpsHistory.current = [];
        bitrateHistory.current = [];
        dropsHistory.current = [];
        totalDrops.current = 0;
        prevFrameTime.current = 0;
        expectedFrameInterval.current = 1000 / frameRate;

        const track = currentStream.getVideoTracks()[0];
        const settings = track.getSettings();
        const actualW = settings.width || w;
        const actualH = settings.height || h;
        const g = gcd(actualW, actualH);

        setLiveInfo({
          width: actualW,
          height: actualH,
          aspectRatio: `${actualW / g}:${actualH / g}`,
          fps: Math.round(settings.frameRate || frameRate),
        });

        // Real-time metrics update via requestAnimationFrame
        const updateLive = () => {
          if (!currentStream || currentStream.getVideoTracks()[0]?.readyState !== 'live') return;
          const liveTrack = currentStream.getVideoTracks()[0];
          const s = liveTrack.getSettings();
          setLiveInfo((prev) => {
            const nf = Math.round(s.frameRate || prev.fps);
            const lw = s.width || prev.width;
            const lh = s.height || prev.height;
            if (nf === prev.fps && lw === prev.width && lh === prev.height) return prev;
            const lg = gcd(lw, lh);
            return { width: lw, height: lh, aspectRatio: `${lw / lg}:${lh / lg}`, fps: nf };
          });

          // Track frame timing for dropped frame detection
          const now = performance.now();
          if (prevFrameTime.current > 0) {
            const interval = now - prevFrameTime.current;
            const expected = expectedFrameInterval.current;
            if (expected > 0 && interval > expected * 1.5) {
              // More than 1.5x expected interval = dropped frames
              const missed = Math.floor(interval / expected) - 1;
              totalDrops.current += missed;
            }
          }
          prevFrameTime.current = now;

          rafRef.current = requestAnimationFrame(updateLive);
        };
        rafRef.current = requestAnimationFrame(updateLive);

        // Chart sampling: push one data point per second
        chartTimerRef.current = setInterval(() => {
          if (!currentStream || currentStream.getVideoTracks()[0]?.readyState !== 'live') return;
          const liveTrack = currentStream.getVideoTracks()[0];
          const s = liveTrack.getSettings();
          const currentFps = Math.round(s.frameRate || frameRate);

          // FPS history
          fpsHistory.current.push(currentFps);
          if (fpsHistory.current.length > HISTORY_LENGTH) fpsHistory.current.shift();

          // Estimated bitrate: width * height * bitDepth * fps / compression
          // Assume 12 bits/pixel after YUV subsampling, ~4:1 MJPEG compression
          const bpp = 2.4; // effective bits per pixel for MJPEG
          const estimatedMbps = (currentFps * s.width * s.height * bpp) / 1_000_000;
          bitrateHistory.current.push(estimatedMbps);
          if (bitrateHistory.current.length > HISTORY_LENGTH) bitrateHistory.current.shift();

          // Dropped frames (cumulative delta per second)
          dropsHistory.current.push(totalDrops.current);
          if (dropsHistory.current.length > HISTORY_LENGTH) dropsHistory.current.shift();

          // Draw charts
          const fpsMax = Math.max(frameRate * 1.5, 60);
          const bitrateMax = Math.max(...bitrateHistory.current, 10);
          const dropsMax = Math.max(...dropsHistory.current, 5);

          if (fpsCanvasRef.current) drawLineChart(fpsCanvasRef.current, fpsHistory.current, fpsMax, '#52c41a', 'fps', t('video.liveFrameRate') || 'Frame Rate');
          if (bitrateCanvasRef.current) drawLineChart(bitrateCanvasRef.current, bitrateHistory.current, bitrateMax, '#1668dc', 'Mbps', t('video.bitrate') || 'Bitrate');
          if (dropsCanvasRef.current) drawLineChart(dropsCanvasRef.current, dropsHistory.current, dropsMax, '#ff4d4f', '', t('video.droppedFrames') || 'Dropped Frames');
        }, 1000);

      } catch (err) {
        console.error('Failed to start camera:', err);
      }
    };

    startCamera();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (chartTimerRef.current) clearInterval(chartTimerRef.current);
      if (currentStream) {
        currentStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [selectedVideoDevice, resolution, frameRate]);

  const selectedDevice = videoDevices.find((d) => d.id === selectedVideoDevice?.id);

  return (
    <Card
      title={<span><VideoCameraOutlined /> {t('video.title')}</span>}
      size="small"
      style={{ marginTop: 16 }}
    >
      {selectedVideoDevice ? (
        <>
          <Row gutter={12} style={{ marginBottom: 12 }}>
            <Col span={7}>
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
            <Col span={7}>
              <Text type="secondary" style={{ fontSize: 12 }}>{t('video.frameRate') || 'Frame Rate'}</Text>
              <Select
                style={{ width: '100%', marginTop: 4 }}
                value={frameRate}
                onChange={setFrameRate}
              >
                {availableFrameRates.map((fps) => (
                  <Select.Option key={fps} value={fps}>
                    {fps} fps
                  </Select.Option>
                ))}
              </Select>
            </Col>
            <Col span={7}>
              <Text type="secondary" style={{ fontSize: 12 }}>{t('video.codec') || 'Codec'}</Text>
              <Select
                style={{ width: '100%', marginTop: 4 }}
                value={codec}
                onChange={setCodec}
              >
                {CODEC_OPTIONS.map((opt) => (
                  <Select.Option key={opt.value} value={opt.value}>
                    {opt.label}
                  </Select.Option>
                ))}
              </Select>
            </Col>
            <Col span={3}>
              {liveInfo.width > 0 && (
                <Space direction="vertical" size={0} style={{ marginTop: 22 }}>
                  <Tag color="blue">{liveInfo.width}x{liveInfo.height}</Tag>
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

          {/* Real-time dynamic charts */}
          <Row gutter={8} style={{ marginTop: 12 }}>
            <Col span={8}>
              <canvas
                ref={fpsCanvasRef}
                width={400}
                height={100}
                style={{ width: '100%', height: 100, borderRadius: 4, background: '#141414' }}
              />
            </Col>
            <Col span={8}>
              <canvas
                ref={bitrateCanvasRef}
                width={400}
                height={100}
                style={{ width: '100%', height: 100, borderRadius: 4, background: '#141414' }}
              />
            </Col>
            <Col span={8}>
              <canvas
                ref={dropsCanvasRef}
                width={400}
                height={100}
                style={{ width: '100%', height: 100, borderRadius: 4, background: '#141414' }}
              />
            </Col>
          </Row>

          {/* Compact info row */}
          <Row gutter={16} style={{ marginTop: 8 }}>
            <Col span={24}>
              <Space size="middle">
                <Text type="secondary" style={{ fontSize: 11 }}>
                  {t('video.actualResolution') || 'Resolution'}: <Text style={{ color: '#fff', fontSize: 11 }}>{liveInfo.width}x{liveInfo.height}</Text>
                </Text>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  {t('video.aspectRatio') || 'Aspect'}: <Text style={{ color: '#fff', fontSize: 11 }}>{liveInfo.aspectRatio}</Text>
                </Text>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  {t('video.codec') || 'Codec'}: <Tag color="purple" style={{ marginLeft: 4 }}>{codec}</Tag>
                </Text>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  {t('video.liveFrameRate') || 'FPS'}: <Text strong style={{ color: liveInfo.fps >= 25 ? '#52c41a' : '#faad14', fontSize: 11 }}>{liveInfo.fps} fps</Text>
                </Text>
              </Space>
            </Col>
          </Row>
        </>
      ) : (
        <Empty description={t('video.noCamera')} />
      )}
    </Card>
  );
};

export default VideoPanel;
