/**
 * Customer-visible Jazz North / School systems copy must not mention Rhythmstix or DreamHost.
 * Run: node --test artifacts/ccd/src/config/customerCopyGuard.test.mjs
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const srcRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const FORBIDDEN = /Rhythmstix|DreamHost/;

function readSrc(rel) {
  return readFileSync(join(srcRoot, rel), 'utf8');
}

/**
 * Collect quoted string literals that look like UI copy (contain whitespace),
 * ignoring import paths / identifiers like jazzNorthDreamHost.
 */
function customerCopyStrings(src) {
  const withoutComments = src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
  const literals = withoutComments.match(/(['"`])(?:(?!\1)[\s\S])*\1/g) || [];
  return literals
    .map((s) => s.slice(1, -1))
    .filter((s) => /\s/.test(s))
    .join('\n');
}

describe('customer-visible Jazz North / School systems copy', () => {
  it('hub + settings UI strings omit Rhythmstix / DreamHost', () => {
    const files = [
      'config/partnerHubs.ts',
      'config/partnerOrgHubDefaults.ts',
      'config/partnerHubContent.ts',
      'components/partners/JazzNorthPartnerHub.tsx',
      'components/settings/settingsSections.ts',
      'components/settings/misIntegrations/SchoolSystemsIntegrationsPanel.tsx',
    ];
    for (const rel of files) {
      const strings = customerCopyStrings(readSrc(rel));
      assert.doesNotMatch(strings, FORBIDDEN, rel);
    }
  });

  it('School systems helper mentions CCDesigner', () => {
    assert.match(readSrc('components/settings/settingsSections.ts'), /across CCDesigner/);
  });
});
