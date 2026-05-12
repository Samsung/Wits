# Changelog

All notable changes to this project will be documented in this file.
The format is loosely based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.6.0] - 2026-05-12

### Security

- **CWE-22 / Stored Path Traversal**: every field loaded from
  `.witsconfig.json` is now validated before any filesystem or shell
  use. `connectionInfo.baseAppPath` / `baseAppPaths` and
  `profileInfo.path` reject `..` segments, NUL bytes, and resolved
  paths inside system directories (`/etc`, `/usr`, `/var`,
  `C:\Windows`, ...). `deviceIp` / `hostIp` are re-validated as IPv4,
  `width` is restricted to `"1920"` / `"1280"`, `socketPort` to ints in
  `1024..65535`, `isDebugMode` to boolean. On any violation Wits logs a
  `[security]` error and exits before touching disk or `sdb`. See
  `lib/pathSafety.js` and the new `Security` section in `README.md`.
- `.witsconfig.json` is now in the repository's `.gitignore` and
  `.npmignore`. Users are advised to add it to their own project's
  `.gitignore` as well.

### Fixed

- **#119**: Bootstrap's default white body background was hiding TV
  windows set behind the WITs container. The body rule in
  `container/css/1280/style.css` and `container/css/1920/style.css`
  now sets `background-color: unset;`.
- **#112**: `launchDebugMode` failed on Tizen 3.0 (2017) devices
  because the no-timeout `sdb shell 0 debug <app>` command threw
  (`stderr: 'closed\n'`) instead of returning empty stdout, so the
  existing `||` fallback never fired. The call is now wrapped in
  `try/catch` and the timeout-suffixed variant is used as a fallback
  on either empty stdout *or* throw.
- **#110**: Two Chrome instances were launched when debugging against
  the emulator because `setPortForward` called `launchChrome`
  internally while `launchDebugMode` also called it after the IP was
  remapped to `127.0.0.1`. `setPortForward` no longer launches Chrome.

### Added

- Unit test suite using Node's built-in `node:test` runner (no new
  runtime/dev dependencies). 67 tests across:
  - `tests/launchDebugMode.test.js` — debug-launch flow, Tizen 3.0
    fallback, emulator-single-Chrome regression
  - `tests/installAndLaunch.test.js` — install/uninstall/launch/
    terminate paths and the public module surface
  - `tests/cssRegression.test.js` — guards the issue #119 fix
  - `tests/pathSafety.test.js` — every validator in `lib/pathSafety.js`
  - `tests/configValidation.test.js` — end-to-end load of malicious
    `.witsconfig.json` files
- `npm test` script.
- Opt-in pre-push hook at `.githooks/pre-push` (enable with
  `git config core.hooksPath .githooks`) that runs `npm test` and
  blocks the push on any failure.
- `tests/README.md` documenting how to run, filter, and gate on tests.
