import { describe, expect, it } from 'vitest';

import { computeSignatureMetadata, type SignaturePoint } from '@/types/signature';

describe('computeSignatureMetadata', () => {
  it('returns zeros for empty input', () => {
    const meta = computeSignatureMetadata([]);
    expect(meta).toEqual({
      duracion_ms: 0,
      presion_max: 0,
      presion_media: 0,
      velocidad_media_px_s: 0,
      num_puntos: 0,
    });
  });

  it('handles a single-point trace without dividing by zero', () => {
    const meta = computeSignatureMetadata([{ x: 0, y: 0, t: 0, p: 0.7 }]);
    expect(meta).toEqual({
      duracion_ms: 0,
      presion_max: 0.7,
      presion_media: 0.7,
      velocidad_media_px_s: 0,
      num_puntos: 1,
    });
  });

  it('computes duration, pressure stats and average velocity for a straight line', () => {
    const points: SignaturePoint[] = [
      { x: 0, y: 0, t: 0, p: 0.4 },
      { x: 10, y: 0, t: 100, p: 0.5 },
      { x: 30, y: 0, t: 300, p: 0.6 },
      { x: 60, y: 0, t: 600, p: 0.5 },
    ];
    const meta = computeSignatureMetadata(points);
    expect(meta.num_puntos).toBe(4);
    expect(meta.duracion_ms).toBe(600);
    expect(meta.presion_max).toBeCloseTo(0.6);
    expect(meta.presion_media).toBeCloseTo((0.4 + 0.5 + 0.6 + 0.5) / 4);
    // total distance = 10 + 20 + 30 = 60 px in 0.6 s -> 100 px/s
    expect(meta.velocidad_media_px_s).toBeCloseTo(100, 5);
  });

  it('returns the highest individual pressure, not the average, for presion_max', () => {
    const points: SignaturePoint[] = [
      { x: 0, y: 0, t: 0, p: 0.2 },
      { x: 1, y: 0, t: 50, p: 0.95 },
      { x: 2, y: 0, t: 100, p: 0.3 },
    ];
    const meta = computeSignatureMetadata(points);
    expect(meta.presion_max).toBeCloseTo(0.95);
  });
});
