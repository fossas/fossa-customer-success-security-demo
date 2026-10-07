# FOSSA Security Demo

A small, buildable Node.js/Express app ("team status board") whose dependencies are
**intentionally pinned to vulnerable versions**. Use it to learn FOSSA's security
features end to end: scan, read and prioritize vulnerabilities, set policy, triage,
fix, and gate CI.

> ⚠️ **Do not deploy this app.** It exists to be scanned. Every vulnerability in it
> is real (see `npm audit`).

## What you'll practice

| FOSSA capability | Lab |
|---|---|
| Scanning manifests/lockfiles and building the dependency graph | [Lab 2](#lab-2-scan-the-project) |
| Reading a vulnerability issue: CVSS, EPSS, known exploits, dependency path, partial vs complete fix | [Lab 3](#lab-3-read-a-vulnerability-issue) |
| Prioritizing with filters (severity, EPSS, exploit maturity, depth) | [Lab 4](#lab-4-prioritize) |
| Security policies (CVSS thresholds, CWE and CVE rules) | [Lab 5](#lab-5-tune-the-security-policy) |
| Triage: ignore with a VEX justification, Jira tickets, custom risk scores | [Lab 6](#lab-6-triage) |
| Remediation: partial vs complete fix, and a major upgrade | [Lab 7](#lab-7-fix-axios) |
| CI gating with `fossa test` | [Lab 8](#lab-8-gate-ci-with-fossa-test) |
| Catching only *new* issues in a PR with `fossa test --diff` | [Lab 9](#lab-9-catch-a-new-vulnerability-in-a-pull-request-optional) (optional) |
| Container image scanning | [Lab 10](#lab-10-scan-a-container-image-optional) (optional) |
| SBOM export with VEX | [Lab 11](#lab-11-export-an-sbom-with-vex-optional) (optional) |

## Prerequisites

- **Node.js 18+** and npm
- **git** and a **GitHub** account (for the CI labs)
- A **FOSSA account** and an **API key** (Settings → Integrations → API Tokens). A full-access key works for every lab.
- **FOSSA CLI**:
  ```sh
  # macOS / Linux
  curl -H 'Cache-Control: no-cache' https://raw.githubusercontent.com/fossas/fossa-cli/master/install-latest.sh | bash
  # Windows (PowerShell)
  Set-ExecutionPolicy Bypass -Scope Process -Force; iex ((New-Object System.Net.WebClient).DownloadString('https://raw.githubusercontent.com/fossas/fossa-cli/master/install-latest.ps1'))
  ```
- Optional: **Docker** (Lab 10)

Labs 1–8 are the core path. Labs 9–11 are optional extras you can skip or do later.

## Lab 1: Build and run the app

```sh
git clone git@github.com:fossas/fossa-customer-success-security-demo.git   # or your fork
cd fossa-customer-success-security-demo
npm ci             # install the exact (vulnerable) versions from package-lock.json
npm run build      # syntax-check all sources
npm test           # 4 tests should pass
npm start          # http://localhost:3000
```

Run `npm audit` and note how many vulnerabilities npm reports. You'll compare this with FOSSA.

## Lab 2: Scan the project

```sh
export FOSSA_API_KEY=<your key>        # PowerShell: $env:FOSSA_API_KEY="<your key>"
fossa list-targets                      # what FOSSA will analyze (npm@./)
fossa analyze                           # build the dependency graph and upload it
```

The output ends with a link to the project in FOSSA. Open it.

- FOSSA reads `package-lock.json`, so it sees **transitive** dependencies too (`qs`, `body-parser`, `path-to-regexp`, ...), not just the 7 packages in `package.json`.
- Want to see what would be uploaded first? `fossa analyze --output` prints the graph locally without uploading.

## Lab 3: Read a vulnerability issue

Go to the project's **Issues → Vulnerabilities** tab and open the **axios** issue for
**CVE-2026-42043** (CVSS 10). axios is supposed to skip the proxy for hosts listed in
`NO_PROXY`, but any loopback address other than `127.0.0.1` (for example `127.0.0.2`) gets
around that check. An attacker who can influence a request URL can use it to reach internal
services (SSRF).

> FOSSA titles this issue *Permissive List of Allowed Inputs in axios (0.21.1)*. That's the name
> of its weakness category (CWE-183), not a description of the bug, and another axios issue
> (CVE-2026-42042) has the same title. Go by the CVE ID.

Find each of these:

| Element | What to look for |
|---|---|
| **Severity** | The CVSS score and level |
| **EPSS** | The percentage and percentile: how likely exploitation is in the next 30 days |
| **Known exploit** | Whether a public exploit exists |
| **Dependency path** | Click **View Path**. `axios` is a *direct* dependency |
| **Remediation** | Your current version (0.21.1), the **partial fix** and the **complete fix** |

The Remediation box gives two upgrade targets:

| Option | Version | What it means |
|---|---|---|
| **Partial fix** | **0.31.1** | Nearest version that fixes *this* vulnerability. Other axios vulnerabilities may remain. |
| **Complete fix** | **1.20.0** (major) | Nearest version that fixes *every* known vulnerability on axios |

**Discuss:** why is the complete fix a whole major version away, when this one issue is fixed
in 0.x? (Hint: other axios vulnerabilities only have fixes in the 1.x line, and the complete fix
has to clear all of them.)

Now open an issue on **qs** (a dependency of `express`) and click **View Path**. It's
*transitive*: you never installed `qs`, `express` → `body-parser` → `qs` did.

## Lab 4: Prioritize

On the global **Issues → Vulnerabilities** page, filter to this project and try:

1. **Severity = Critical**: which two packages are left? (ejs and minimist)
2. **Exploit maturity = has known exploit**: does that change your order?
3. **EPSS**: sort or filter by the highest exploit likelihood.
4. **Depth**: compare direct vs transitive. Which transitive issues disappear if you upgrade one direct dependency?

Save a filter you'd actually use as a view.

## Lab 5: Tune the security policy

*Needs org admin or policy-edit permissions. Skip if you don't have them.*

1. In FOSSA's **Policies** area, open the **Security** policies and create one (or copy your org's default).
2. Set the rule to flag vulnerabilities with **CVSS level High and above**.
3. Assign the policy to this project, then watch the issue list update; no rescan is needed.
4. Experiment: add a **CWE** to the deny list, or **allow** a specific CVE, and see how the issue list reacts.

Policies decide what counts as an issue. `fossa test` (Lab 8) fails on exactly those issues.

## Lab 6: Triage

Practice each action on a different issue:

- **Ignore with a reason.** Open a `node-fetch` issue. `src/client.js` uses node-fetch, but nothing in the app calls it yet. Click **Ignore**, choose a VEX *not affected* justification such as *vulnerable code not in execute path*, and add a comment. Note that the reason and your name are recorded.
- **Ticket.** If your org has the Jira integration, create a ticket from an issue, then filter the issue list by **Ticketed**.
- **Custom risk score.** Use **Assign Custom Risk Score** on an issue where CVSS doesn't match your real exposure.

Ignored is not fixed: ignores are auditable and flow into VEX exports (optional Lab 11).

## Lab 7: Fix axios

Go back to the axios issue from Lab 3. Its **Remediation** box offers two targets:
a **partial fix** (0.31.1) and a **complete fix** (1.20.0). Apply them in two passes.

**Pass 1: partial fix (0.31.1).**

```sh
npm install --save-exact axios@0.31.1
npm test && git commit -am "Upgrade axios to 0.31.1 (partial fix)"
fossa analyze
```

CVE-2026-42043 (and CVE-2026-42042, fixed in the same release) should be gone from the latest
scan, but other axios issues are still open, and `npm audit` still flags axios. A partial fix
fixes the issue you opened, not every issue on the package. Look for **CVE-2026-67315**, too:
0.31.0 through 0.32.x don't treat `0.0.0.0` as a loopback address, a similar `NO_PROXY` bypass.
The partial fix lands you on a version affected by a different vulnerability.

**Pass 2: complete fix (1.20.0).**

```sh
npm install --save-exact axios@1.20.0
npm test && git commit -am "Upgrade axios to 1.20.0 (complete fix)"
fossa analyze
```

Every axios issue should now be gone, including CVE-2021-3749 (ReDoS), CVE-2023-45857
(XSRF token leak) and the SSRF/proxy fixes.

**Partial vs complete fix:** the partial fix is a smaller change (it stays on 0.x) but leaves
other axios vulnerabilities open. The complete fix clears them all, but it's a **major** upgrade
and can bring breaking changes. In this app, `src/client.js` only calls
`axios.post(url, payload, { timeout })`, which works the same in 1.x, so the complete fix is safe
here. In a real codebase, check the axios 1.x migration notes (or let fossabot flag breaking
changes) before taking the major upgrade.

Both passes were verified on 2026-10-06: the build and `npm test` pass on 0.31.1 and on 1.20.0.

## Lab 8: Gate CI with fossa test

Locally first:

```sh
fossa test            # exit code 1 if the latest scan has issues under your policies
echo $?               # PowerShell: $LASTEXITCODE
fossa test --format json
```

It should still fail: Lab 7 fixed axios, but the other dependencies (ejs, minimist, lodash, ...)
are still vulnerable. Compare with the starting revision to see the axios issues drop out:
`fossa test --revision $(git rev-parse v0-vulnerable)`.

Then in GitHub:

1. Push your fork to GitHub.
2. Add a repository secret named **`FOSSA_API_KEY`** (Settings → Secrets and variables → Actions).
3. In `.github/workflows/fossa.yml`, delete the `if: false` line to enable the workflow.
4. Push to your default branch (`main` or `master`). The workflow builds, tests, runs `fossa analyze`, then `fossa test`.

## Lab 9: Catch a new vulnerability in a pull request (optional)

```sh
git checkout -b add-vulnerable-dep
npm install --save-exact minimatch@3.0.4   # has known ReDoS vulnerabilities
git commit -am "Add minimatch" && git push -u origin add-vulnerable-dep
```

Open a pull request. The PR job runs `fossa test --diff <base commit>`, which fails **only on
issues the PR introduces** (minimatch), not on anything already on the default branch. Fix it with
`npm install --save-exact minimatch@3.1.5`, push, and watch the check go green.

## Lab 10: Scan a container image (optional)

The `Dockerfile` uses an old, end-of-life base image on purpose.

```sh
docker build -t fossa-security-demo:old .
fossa container analyze fossa-security-demo:old
fossa container test fossa-security-demo:old
```

In FOSSA, look at the container project: vulnerabilities in **OS packages** from the base image
appear alongside your npm dependencies. Use the **container layers** filter to see whether an
issue comes from the base image or your app.

Quick fix: change the first line of the `Dockerfile` to `FROM node:22-alpine`, rebuild with a
new tag, and scan again.

## Lab 11: Export an SBOM with VEX (optional)

```sh
fossa report attribution --format cyclonedx-json > sbom.cyclonedx.json
fossa report attribution --format spdx-json > sbom.spdx.json
```

In the FOSSA UI, generate a **CycloneDX** report with **Open Vulnerabilities** and **Closed
Vulnerabilities** selected. Open vulnerabilities are marked *affected*; closed ones (fixed, or
ignored with a justification in Lab 6) carry their VEX status and reason. SPDX 2.3 has no field
for vulnerability status, so use CycloneDX when someone asks for VEX.

## Going further

These capabilities need a different kind of project than this Node app:

| Capability | How | Notes |
|---|---|---|
| **Vendored C/C++ code** | `fossa analyze --x-vendetta` | Finds open source copied into your repo by file hashing (experimental flag) |
| **SBOM import** | `fossa sbom analyze <file>` / `fossa sbom test` | Scan third-party SBOMs (SPDX JSON, CycloneDX); Enterprise feature |
| **Manual dependencies** | `fossa-deps.yml` | Declare deps no package manager knows about |
| **Package health** | Quality issues in the UI | Abandonware, empty packages, native code, and malware (where enabled) |

## Reset

The vulnerable starting point is tagged `v0-vulnerable`. To return to it after fixing things:

```sh
git checkout v0-vulnerable -- package.json package-lock.json Dockerfile && npm ci
```
