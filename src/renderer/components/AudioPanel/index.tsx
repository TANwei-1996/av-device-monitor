import React, { useRef, useEffect, useCallback } from 'react';
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
  const meterFillRef = useRef<HTMLDivElement>(null);
  const dbfsValueRef = useRef<HTMLSpanElement>(null);

  const {
    isCapturing,
    denoiseLevel,
    gain,
    setCapturing,
    setAudioData,
    setDenoiseLevel,
    setGain,
  } = useAudioStore();

  const selectedAudioDevice = useDeviceStore((s) => s.selectedAudioDevice);

  // Web Audio API refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const rafRef = useRef<number>(0);

  // Stop capture helper
  const stopCapture = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
    if (sourceRef.current) { sourceRef.current.disconnect(); sourceRef.current = null; }
    if (gainNodeRef.current) { gainNodeRef.current.disconnect(); gainNodeRef.current = null; }
    if (analyserRef.current) { analyserRef.current.disconnect(); analyserRef.current = null; }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    // Reset meter display
    if (meterFillRef.current) {
      meterFillRef.current.style.width = '0%';
      meterFillRef.current.className = 'level-meter-fill good';
    }
    if (dbfsValueRef.current) {
      dbfsValueRef.current.textContent = '-Inf';
    }
  }, []);

  // Start capture using real Web Audio API
  const startCapture = useCallback(async (deviceId: string) => {
    stopCapture();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: { exact: deviceId },
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      streamRef.current = stream;

      const audioCtx = new AudioContext({ sampleRate: 48000 });
      audioCtxRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      sourceRef.current = source;

      // Gain node for volume control
      const gainNode = audioCtx.createGain();
      gainNodeRef.current = gainNode;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      source.connect(gainNode).connect(analyser);

      setCapturing(true);

      // Start render loop
      const timeData = new Uint8Array(analyser.frequencyBinCount);
      const freqData = new Uint8Array(analyser.frequencyBinCount);
      const waveformLength = 200;
      const spectrumLength = 64;

      const render = () => {
        if (!analyserRef.current) return;
        analyser.getByteTimeDomainData(timeData);
        analyser.getByteFrequencyData(freqData);

        // Compute dBFS from time domain
        let sumSquares = 0;
        for (let i = 0; i < timeData.length; i++) {
          const v = (timeData[i] - 128) / 128;
          sumSquares += v * v;
        }
        const rms = Math.sqrt(sumSquares / timeData.length);
        const dbfs = 20 * Math.log10(rms + 1e-10);

        // Update meter display via DOM refs (avoid React re-render at 60fps)
        const meterPercent = Math.max(0, Math.min(100, ((dbfs + 60) / 60) * 100));
        if (meterFillRef.current) {
          meterFillRef.current.style.width = `${meterPercent}%`;
          const cls = meterPercent < 60 ? 'good' : meterPercent < 85 ? 'warn' : 'danger';
          meterFillRef.current.className = `level-meter-fill ${cls}`;
        }
        if (dbfsValueRef.current) {
          const display = dbfs > -100 ? dbfs.toFixed(1) : '-Inf';
          dbfsValueRef.current.textContent = display;
          dbfsValueRef.current.style.color = meterPercent > 85 ? '#ff4d4f' : '#fff';
        }

        // Downsample waveform
        const waveform: number[] = [];
        const step = Math.floor(timeData.length / waveformLength);
        for (let i = 0; i < waveformLength; i++) {
          waveform.push((timeData[i * step] - 128) / 128);
        }

        // Aggregate spectrum into 64 bins
        const spectrum: number[] = [];
        const binSize = Math.floor(freqData.length / spectrumLength);
        for (let i = 0; i < spectrumLength; i++) {
          let sum = 0;
          for (let j = 0; j < binSize; j++) {
            sum += freqData[i * binSize + j];
          }
          spectrum.push(sum / binSize / 255);
        }

        setAudioData({ dbfs, waveform, spectrum, timestamp: Date.now() });

        // Draw waveform canvas
        const wCanvas = waveformCanvasRef.current;
        if (wCanvas) {
          const ctx = wCanvas.getContext('2d');
          if (ctx) {
            const { width, height } = wCanvas;
            const mid = height / 2;
            ctx.fillStyle = '#1f1f1f';
            ctx.fillRect(0, 0, width, height);
            ctx.strokeStyle = '#ffffff22';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, mid);
            ctx.lineTo(width, mid);
            ctx.stroke();
            ctx.strokeStyle = '#1668dc';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            const s = width / waveform.length;
            for (let i = 0; i < waveform.length; i++) {
              const x = i * s;
              const y = mid + waveform[i] * mid * 0.9;
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.stroke();
          }
        }

        // Draw spectrum canvas
        const sCanvas = spectrumCanvasRef.current;
        if (sCanvas) {
          const ctx = sCanvas.getContext('2d');
          if (ctx) {
            const { width, height } = sCanvas;
            ctx.fillStyle = '#1f1f1f';
            ctx.fillRect(0, 0, width, height);
            const barWidth = width / spectrum.length - 1;
            spectrum.forEach((value, i) => {
              const barHeight = value * height * 2;
              const x = i * (barWidth + 1);
              const y = height - barHeight;
              const gradient = ctx.createLinearGradient(x, height, x, y);
              gradient.addColorStop(0, '#1668dc');
              gradient.addColorStop(1, '#69b1ff');
              ctx.fillStyle = gradient;
              ctx.fillRect(x, y, barWidth, barHeight);
            });
          }
        }

        rafRef.current = requestAnimationFrame(render);
      };

      rafRef.current = requestAnimationFrame(render);
    } catch (err) {
      console.error('Failed to start audio capture:', err);
    }
  }, [stopCapture, setCapturing, setAudioData]);

  // Apply gain changes
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = Math.pow(10, gain / 20);
    }
  }, [gain]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { stopCapture(); };
  }, [stopCapture]);

  const handleToggleCapture = async () => {
    if (isCapturing) {
      stopCapture();
      setCapturing(false);
    } else {
      if (!selectedAudioDevice) return;
      await startCapture(selectedAudioDevice.id);
    }
  };

  return (
    <Card title={<span><SoundOutlined /> {t('audio.title')}</span>} size="small">
      {/* Level Meter */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={4}>
          <Statistic
            title={t('audio.dbfs')}
            value={<span ref={dbfsValueRef}>-Inf</span>}
            suffix="dB"
            valueStyle={{ fontSize: 20 }}
          />
        </Col>
        <Col span={20} style={{ display: 'flex', alignItems: 'center' }}>
          <div className="level-meter" style={{ flex: 1 }}>
            <div
              ref={meterFillRef}
              className="level-meter-fill good"
              style={{ width: '0%' }}
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
