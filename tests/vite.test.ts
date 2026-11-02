import { describe, expect, it } from 'vitest';
import { buildInfo, CONTENT_SECURITY_POLICY, contentSecurityPolicy } from '../src/vite';

describe('vite helpers', () => {
  it('the policy blocks every connection', () => {
    expect(CONTENT_SECURITY_POLICY).toContain("connect-src 'none'");
    expect(CONTENT_SECURITY_POLICY).toContain("default-src 'self'");
  });

  it('adds the policy after the charset, only at build', () => {
    const plugin = contentSecurityPolicy();
    expect(plugin.apply).toBe('build');
    const transform = plugin.transformIndexHtml as (html: string) => string;
    const html = transform('<head>\n    <meta charset="UTF-8" />\n</head>');
    expect(html).toContain(`<meta http-equiv="Content-Security-Policy" content="${CONTENT_SECURITY_POLICY}" />`);
    expect(() => transform('<head></head>')).toThrow(/charset/);
  });

  it('gives the version and the build time', () => {
    expect(buildInfo('0.3.1', new Date('2026-11-02T18:05:30Z'))).toEqual({
      __APP_VERSION__: '"0.3.1"',
      __BUILD_TIME__: '"2026-11-02 18:05"',
    });
  });
});
