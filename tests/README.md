# Tests

Unit tests for the Wits CLI. Uses Node's built-in [`node:test`](https://nodejs.org/api/test.html)
runner, no extra dev dependencies.

## Run

```sh
npm test
```

Run a single file:

```sh
node --test tests/launchDebugMode.test.js
```

Filter by name:

```sh
node --test --test-name-pattern='#112' tests/
```

## Coverage map

| File | What it guards |
| --- | --- |
| `launchDebugMode.test.js` | `lib/appLaunchHelper.js` debug-mode launch: Tizen 3.0 fallback (issue #112), emulator single-Chrome-launch regression (issue #110), error paths |
| `installAndLaunch.test.js` | `installPackage`, `unInstallPackage`, `launchApp`, `terminateApp` happy + failure paths |
| `cssRegression.test.js` | `container/css/{1280,1920}/style.css` body rule keeps `background-color: unset` (issue #119) |
| `helpers/loadHelper.js` | Mock harness: swaps `child_process.execSync`, replaces `chrome-launcher` in `require.cache`, and stubs `util.{TOOLS_SDB_PATH,displayOutput,exit}` |

## Pre-push hook (recommended)

A pre-push hook is provided at `.githooks/pre-push` that runs `npm test`
before allowing a push. Enable it once per clone with:

```sh
git config core.hooksPath .githooks
```

Skip the hook for a single push if absolutely necessary:

```sh
git push --no-verify
```

## Manual pre-push checklist

If you don't enable the hook, before pushing to `master` run:

1. `npm install` — make sure deps are present
2. `npm test` — all tests must be green
3. `git diff origin/master...HEAD` — sanity-check what's going up
