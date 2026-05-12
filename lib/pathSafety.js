'use strict';

// Defensive validation for fields loaded from `.witsconfig.json`.
//
// Threat model: an attacker who can place or commit a `.witsconfig.json`
// in a project directory the developer subsequently runs `wits` from can
// otherwise direct file reads/writes to arbitrary host paths via
// `connectionInfo.baseAppPath`, `connectionInfo.baseAppPaths`, and
// `profileInfo.path` (CWE-22 / stored path traversal). Other fields
// (`deviceIp`, `hostIp`, `width`, `socketPort`, `isDebugMode`) reach
// shell commands or string templates and must be re-validated at load
// time rather than relying on the interactive (`wits -i`) flow alone.

const path = require('path');
const fs = require('fs');

class ConfigValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ConfigValidationError';
    }
}

const IPV4_RE =
    /^(?:(?:2(?:[0-4][0-9]|5[0-5])|[0-1]?[0-9]?[0-9])\.){3}(?:(?:2([0-4][0-9]|5[0-5])|[0-1]?[0-9]?[0-9]))$/;

// Note: the filesystem root (`/`) is intentionally NOT in this list,
// because *every* absolute path is "within" it. A literal baseAppPath
// of `/` is still rejected later by the directory/existence checks plus
// the fact that no Tizen project lives there. The roots below are the
// directories whose contents we never want a build tool reading or
// pushing on the developer's machine.
const POSIX_SYSTEM_ROOTS = [
    '/bin',
    '/boot',
    '/dev',
    '/etc',
    '/lib',
    '/lib32',
    '/lib64',
    '/libx32',
    '/proc',
    '/root',
    '/run',
    '/sbin',
    '/srv',
    '/sys',
    '/usr',
    '/var'
];
const WINDOWS_SYSTEM_ROOTS = [
    'C:\\Windows',
    'C:\\Program Files',
    'C:\\Program Files (x86)',
    'C:\\ProgramData'
];

function getSystemRoots() {
    return process.platform === 'win32' ? WINDOWS_SYSTEM_ROOTS : POSIX_SYSTEM_ROOTS;
}

function normalizeForCompare(p) {
    let n = path.normalize(p);
    // Strip a single trailing separator for stable comparison, but keep
    // the path-root separator (`/` or `C:\`) intact.
    if (n.length > 1) {
        const last = n[n.length - 1];
        if ((last === '/' || last === '\\') && !n.endsWith(':\\')) {
            n = n.slice(0, -1);
        }
    }
    if (process.platform === 'win32') {
        return n.toLowerCase().replace(/\//g, '\\');
    }
    return n;
}

function isWithin(child, parent) {
    const c = normalizeForCompare(child);
    const p = normalizeForCompare(parent);
    if (c === p) return true;
    const sep = process.platform === 'win32' ? '\\' : '/';
    // The root path itself ends with the separator (e.g. `/`); other
    // parents do not. Build a prefix that requires either an exact
    // match or a `<parent><sep>...` boundary so `/etcetera` is not
    // treated as being inside `/etc`.
    if (p.endsWith(sep)) {
        return c.startsWith(p);
    }
    return c.startsWith(p + sep);
}

function assertNoTraversal(raw, fieldName) {
    if (typeof raw !== 'string' || raw.length === 0) {
        throw new ConfigValidationError(
            `${fieldName} must be a non-empty string`
        );
    }
    // Reject any `..` segment in the raw string. Splitting on both
    // separators catches Windows-style payloads on POSIX boxes too.
    const segments = raw.split(/[\\/]+/);
    if (segments.some((s) => s === '..')) {
        throw new ConfigValidationError(
            `${fieldName} contains a parent-directory segment ('..'): ${raw}`
        );
    }
    // NUL byte injection (some Node fs APIs reject this themselves, but
    // we want a clear error before any path concatenation).
    if (raw.indexOf('\0') !== -1) {
        throw new ConfigValidationError(
            `${fieldName} contains a NUL byte`
        );
    }
}

function assertNotSystemPath(resolved, fieldName) {
    // Reject bare filesystem roots by exact match (we cannot put `/` in
    // the prefix-based denylist because then *every* absolute path
    // matches). Cover POSIX `/` and common Windows drive roots.
    const normalized = normalizeForCompare(resolved);
    if (
        normalized === '/' ||
        /^[a-z]:\\?$/i.test(normalized) ||
        /^[a-z]:$/i.test(normalized)
    ) {
        throw new ConfigValidationError(
            `${fieldName} resolves to the filesystem root (${resolved}); refusing to operate on it.`
        );
    }
    for (const root of getSystemRoots()) {
        if (isWithin(resolved, root)) {
            throw new ConfigValidationError(
                `${fieldName} resolves to a protected system path (${resolved}); refusing to operate on it.`
            );
        }
    }
}

function resolveSafeBaseAppPath(raw, { cwd } = {}) {
    const base = cwd || process.cwd();
    assertNoTraversal(raw, 'connectionInfo.baseAppPath');
    const resolved = path.isAbsolute(raw)
        ? path.normalize(raw)
        : path.normalize(path.join(base, raw));
    assertNotSystemPath(resolved, 'connectionInfo.baseAppPath');

    if (!fs.existsSync(resolved)) {
        throw new ConfigValidationError(
            `connectionInfo.baseAppPath does not exist: ${resolved}`
        );
    }
    const stat = fs.lstatSync(resolved);
    if (stat.isSymbolicLink()) {
        throw new ConfigValidationError(
            `connectionInfo.baseAppPath must not be a symbolic link: ${resolved}`
        );
    }
    if (!stat.isDirectory()) {
        throw new ConfigValidationError(
            `connectionInfo.baseAppPath is not a directory: ${resolved}`
        );
    }
    return resolved.replace(/\\/g, '/');
}

function resolveSafeProfilePath(raw) {
    assertNoTraversal(raw, 'profileInfo.path');
    const resolved = path.normalize(raw);
    if (!resolved.toLowerCase().endsWith('.xml')) {
        throw new ConfigValidationError(
            `profileInfo.path must reference an .xml file: ${resolved}`
        );
    }
    assertNotSystemPath(resolved, 'profileInfo.path');

    if (fs.existsSync(resolved)) {
        const stat = fs.lstatSync(resolved);
        if (stat.isSymbolicLink()) {
            throw new ConfigValidationError(
                `profileInfo.path must not be a symbolic link: ${resolved}`
            );
        }
        if (!stat.isFile()) {
            throw new ConfigValidationError(
                `profileInfo.path must be a regular file: ${resolved}`
            );
        }
    }
    return resolved;
}

function assertValidIp(raw, fieldName) {
    if (typeof raw !== 'string' || !IPV4_RE.test(raw)) {
        throw new ConfigValidationError(
            `${fieldName} is not a valid IPv4 address: ${JSON.stringify(raw)}`
        );
    }
}

function assertValidWidth(raw) {
    if (raw !== '1920' && raw !== '1280') {
        throw new ConfigValidationError(
            `connectionInfo.width must be '1920' or '1280': ${JSON.stringify(raw)}`
        );
    }
}

function assertValidSocketPort(raw) {
    const n = typeof raw === 'number' ? raw : Number(raw);
    if (!Number.isInteger(n) || n < 1024 || n > 65535) {
        throw new ConfigValidationError(
            `connectionInfo.socketPort must be an integer in 1024..65535: ${JSON.stringify(raw)}`
        );
    }
}

function assertValidBoolean(raw, fieldName) {
    if (typeof raw !== 'boolean') {
        throw new ConfigValidationError(
            `${fieldName} must be a boolean: ${JSON.stringify(raw)}`
        );
    }
}

function validateWitsConfig(wInfo, { cwd } = {}) {
    if (wInfo === null || typeof wInfo !== 'object' || Array.isArray(wInfo)) {
        throw new ConfigValidationError('config must be a JSON object');
    }
    const cInfo = wInfo.connectionInfo || {};
    const pInfo = wInfo.profileInfo || {};

    if (cInfo.baseAppPath !== undefined && cInfo.baseAppPath !== null) {
        resolveSafeBaseAppPath(cInfo.baseAppPath, { cwd });
    }
    if (cInfo.baseAppPaths !== undefined && cInfo.baseAppPaths !== null) {
        if (!Array.isArray(cInfo.baseAppPaths)) {
            throw new ConfigValidationError(
                'connectionInfo.baseAppPaths must be an array of strings'
            );
        }
        for (const p of cInfo.baseAppPaths) {
            resolveSafeBaseAppPath(p, { cwd });
        }
    }
    if (cInfo.deviceIp !== undefined && cInfo.deviceIp !== null) {
        assertValidIp(cInfo.deviceIp, 'connectionInfo.deviceIp');
    }
    if (cInfo.hostIp !== undefined && cInfo.hostIp !== null) {
        assertValidIp(cInfo.hostIp, 'connectionInfo.hostIp');
    }
    if (cInfo.width !== undefined && cInfo.width !== null) {
        assertValidWidth(cInfo.width);
    }
    if (cInfo.socketPort !== undefined && cInfo.socketPort !== null) {
        assertValidSocketPort(cInfo.socketPort);
    }
    if (cInfo.isDebugMode !== undefined && cInfo.isDebugMode !== null) {
        assertValidBoolean(cInfo.isDebugMode, 'connectionInfo.isDebugMode');
    }
    if (pInfo.path !== undefined && pInfo.path !== null) {
        resolveSafeProfilePath(pInfo.path);
    }
}

module.exports = {
    ConfigValidationError,
    assertNoTraversal,
    assertNotSystemPath,
    resolveSafeBaseAppPath,
    resolveSafeProfilePath,
    assertValidIp,
    assertValidWidth,
    assertValidSocketPort,
    assertValidBoolean,
    validateWitsConfig,
    isWithin
};
