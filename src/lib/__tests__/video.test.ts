import { describe, it, expect } from 'vitest';
import { parseVideoSource, isEmbedKind } from '../video';

describe('parseVideoSource', () => {
  it('bo\'sh/null → none', () => {
    expect(parseVideoSource('').kind).toBe('none');
    expect(parseVideoSource(null).kind).toBe('none');
    expect(parseVideoSource(undefined).kind).toBe('none');
    expect(parseVideoSource('   ').kind).toBe('none');
  });

  it('YouTube — barcha formatlar embed URL beradi', () => {
    const cases = [
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'https://youtu.be/dQw4w9WgXcQ',
      'https://www.youtube.com/embed/dQw4w9WgXcQ',
      'https://www.youtube.com/shorts/dQw4w9WgXcQ',
      'https://youtube.com/watch?v=dQw4w9WgXcQ&t=42s',
    ];
    for (const url of cases) {
      const s = parseVideoSource(url);
      expect(s.kind).toBe('youtube');
      expect(s.id).toBe('dQw4w9WgXcQ');
      expect(s.embedUrl).toContain('youtube.com/embed/dQw4w9WgXcQ');
    }
  });

  it('Vimeo → player embed', () => {
    const s = parseVideoSource('https://vimeo.com/123456789');
    expect(s.kind).toBe('vimeo');
    expect(s.embedUrl).toBe('https://player.vimeo.com/video/123456789');
  });

  it('Cloudflare Stream → iframe embed', () => {
    const s = parseVideoSource('https://customer-abc.cloudflarestream.com/xyz123/watch');
    expect(s.kind).toBe('cloudflare');
    expect(s.embedUrl).toContain('/iframe');
  });

  it('To\'g\'ridan-to\'g\'ri fayl (mp4/webm) → file', () => {
    expect(parseVideoSource('https://cdn.ustoz.uz/dars.mp4').kind).toBe('file');
    expect(parseVideoSource('https://example.com/a/b/lesson.webm?token=1').kind).toBe('file');
  });

  it('R2 host → file', () => {
    const s = parseVideoSource('https://bucket.acc.r2.cloudflarestorage.com/videos/1.mp4');
    expect(s.kind).toBe('file');
    expect(s.fileUrl).toBeTruthy();
  });

  it('Xavfsizlik: javascript:/data: rad etiladi', () => {
    expect(parseVideoSource('javascript:alert(1)').kind).toBe('unknown');
    expect(parseVideoSource('data:text/html,<script>').kind).toBe('unknown');
  });

  it('Noto\'g\'ri/tanilmagan havola → unknown', () => {
    expect(parseVideoSource('https://example.com/page').kind).toBe('unknown');
    expect(parseVideoSource('not a url').kind).toBe('unknown');
    expect(parseVideoSource('https://youtube.com/watch?v=<script>').kind).toBe('unknown');
  });

  it('isEmbedKind', () => {
    expect(isEmbedKind('youtube')).toBe(true);
    expect(isEmbedKind('vimeo')).toBe(true);
    expect(isEmbedKind('cloudflare')).toBe(true);
    expect(isEmbedKind('file')).toBe(false);
    expect(isEmbedKind('none')).toBe(false);
  });
});
