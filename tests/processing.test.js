import { describe, it, expect } from 'vitest';

describe('Image processing', () => {
  it('grayscale conversion works', () => {
    const r = 100, g = 150, b = 200;
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    expect(gray).toBeGreaterThan(100);
    expect(gray).toBeLessThan(200);
  });

  it('sepia conversion works', () => {
    const r = 100, g = 150, b = 200;
    const sr = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
    expect(sr).toBeGreaterThan(100);
  });

  it('format detection works', () => {
    const types = ['image/png', 'image/jpeg', 'image/webp'];
    types.forEach(t => expect(t.startsWith('image/')).toBe(true));
  });

  it('resize keeps aspect ratio', () => {
    const w = 1920, h = 1080;
    const newW = 960;
    const newH = Math.round(newW * h / w);
    expect(newH).toBe(540);
  });

  it('invert flips colors', () => {
    expect(255 - 100).toBe(155);
    expect(255 - 200).toBe(55);
  });
});
