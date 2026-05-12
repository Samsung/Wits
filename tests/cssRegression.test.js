'use strict';

// Regression guard for issue #119: Bootstrap's default body background
// color must be overridden so a TV window set to background is visible
// behind the WITs loading container.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const CSS_FILES = [
    path.resolve(__dirname, '..', 'container', 'css', '1280', 'style.css'),
    path.resolve(__dirname, '..', 'container', 'css', '1920', 'style.css')
];

function extractBodyRule(cssText) {
    // Capture the contents of the first `body { ... }` rule. This is a
    // dependency-free, intentionally narrow parse — it assumes a flat
    // top-level rule, which matches the current file shape.
    const match = cssText.match(/(^|\})\s*body\s*\{([^}]*)\}/);
    if (!match) return null;
    return match[2];
}

for (const file of CSS_FILES) {
    test(`#119: body rule in ${path.relative(process.cwd(), file)} sets background-color: unset`, () => {
        const css = fs.readFileSync(file, 'utf-8');
        const bodyRule = extractBodyRule(css);
        assert.ok(bodyRule, `expected a top-level body { ... } rule in ${file}`);
        assert.match(
            bodyRule,
            /background-color\s*:\s*unset\s*;?/,
            'body rule must contain `background-color: unset` so Bootstrap white does not cover background TV windows'
        );
    });
}
