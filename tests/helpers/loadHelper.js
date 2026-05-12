'use strict';

// Isolated loader for lib/appLaunchHelper.js so each test gets a fresh
// instance that captures the current mocks at require-time. The helper
// destructures `execSync` and holds the `chrome-launcher` module object,
// so we mock by:
//   - mutating child_process.execSync (writable property), and
//   - replacing the require.cache entry for `chrome-launcher` (its `launch`
//     export is a non-configurable getter so direct mutation is impossible).

const path = require('path');
const childProcess = require('child_process');

const HELPER_PATH = path.resolve(__dirname, '..', '..', 'lib', 'appLaunchHelper.js');
const UTIL_PATH = path.resolve(__dirname, '..', '..', 'lib', 'util.js');
const CHROME_LAUNCHER_PATH = require.resolve('chrome-launcher');

const FAKE_SDB = '/fake/sdb';

let originalExecSync = null;
let originalChromeLauncherCache = null;
let originalSdbPath = null;
let originalDisplayOutput = null;
let originalExit = null;

function setup({ execSync, launch, displayOutput, exit } = {}) {
    const calls = {
        execSync: [],
        launch: [],
        displayOutput: [],
        exit: 0
    };

    if (originalExecSync === null) {
        originalExecSync = childProcess.execSync;
    }
    childProcess.execSync = (cmd, opts) => {
        calls.execSync.push({ cmd, opts });
        if (typeof execSync !== 'function') {
            return '';
        }
        return execSync(cmd, opts, calls.execSync.length - 1);
    };

    if (originalChromeLauncherCache === null) {
        // Capture whatever was there (possibly undefined if never required yet).
        originalChromeLauncherCache = require.cache[CHROME_LAUNCHER_PATH] || false;
    }
    require.cache[CHROME_LAUNCHER_PATH] = {
        id: CHROME_LAUNCHER_PATH,
        filename: CHROME_LAUNCHER_PATH,
        loaded: true,
        exports: {
            launch: (opts) => {
                calls.launch.push(opts);
                if (typeof launch === 'function') {
                    return launch(opts);
                }
                return Promise.resolve({ port: 9222, kill: () => Promise.resolve() });
            }
        }
    };

    const util = require(UTIL_PATH);
    if (originalSdbPath === null) {
        originalSdbPath = util.TOOLS_SDB_PATH;
    }
    if (originalDisplayOutput === null) {
        originalDisplayOutput = util.displayOutput;
    }
    if (originalExit === null) {
        originalExit = util.exit;
    }
    util.TOOLS_SDB_PATH = FAKE_SDB;
    util.displayOutput = (logs) => {
        calls.displayOutput.push(logs);
        if (typeof displayOutput === 'function') {
            displayOutput(logs);
        }
    };
    util.exit = () => {
        calls.exit += 1;
        if (typeof exit === 'function') {
            exit();
        }
    };

    // Force re-evaluation so the helper's `const { execSync } = require('child_process')`
    // and `const chromeLauncher = require('chrome-launcher')` capture our mocks.
    delete require.cache[HELPER_PATH];
    const helper = require(HELPER_PATH);

    return { helper, calls, util, FAKE_SDB };
}

function teardown() {
    if (originalExecSync !== null) {
        childProcess.execSync = originalExecSync;
        originalExecSync = null;
    }
    if (originalChromeLauncherCache !== null) {
        if (originalChromeLauncherCache === false) {
            delete require.cache[CHROME_LAUNCHER_PATH];
        } else {
            require.cache[CHROME_LAUNCHER_PATH] = originalChromeLauncherCache;
        }
        originalChromeLauncherCache = null;
    }
    const util = require(UTIL_PATH);
    if (originalSdbPath !== null) {
        util.TOOLS_SDB_PATH = originalSdbPath;
        originalSdbPath = null;
    }
    if (originalDisplayOutput !== null) {
        util.displayOutput = originalDisplayOutput;
        originalDisplayOutput = null;
    }
    if (originalExit !== null) {
        util.exit = originalExit;
        originalExit = null;
    }
    delete require.cache[HELPER_PATH];
}

module.exports = { setup, teardown, FAKE_SDB };
