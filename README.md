# SiteDelta

[![GitHub Release](https://img.shields.io/github/v/release/kiwamizamurai/sitedelta?style=flat-square)](https://github.com/kiwamizamurai/sitedelta/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg?style=flat-square)](https://nodejs.org/)
[![GitHub Stars](https://img.shields.io/github/stars/kiwamizamurai/sitedelta?style=flat-square)](https://github.com/kiwamizamurai/sitedelta/stargazers)
[![GitHub Issues](https://img.shields.io/github/issues/kiwamizamurai/sitedelta?style=flat-square)](https://github.com/kiwamizamurai/sitedelta/issues)

**A lightweight [changedetection.io](https://github.com/dgtlmoon/changedetection.io) alternative for GitHub Actions.**

No server required. No hosting costs. Just a YAML config and GitHub Actions free tier.

## Table of Contents

- [Comparison](#comparison)
- [Features](#features)
- [Quick Start](#quick-start)
- [How to Find Selectors](#how-to-find-selectors)
- [Configuration Reference](#configuration-reference)
- [Star History](#star-history)

## Comparison

| | changedetection.io | SiteDelta |
|---|---|---|
| Hosting | Self-hosted (Docker) or SaaS | GitHub Actions |
| Cost | Free (self-host) / $8.99/mo (SaaS) | Free |
| Setup | Docker compose | 2 YAML files |
| UI | Web dashboard | Git history + notifications |

## Features

- **YAML Configuration** - Simple config file to monitor multiple sites
- **Multiple Selectors** - CSS / XPath selectors
- **Regex Matching** - Extract prices, counts, or specific text patterns
- **Auto Dynamic Mode** - Automatically retries with Playwright if static fetch returns empty
- **History Tracking** - Automatic change history in CSV + JSON

## Quick Start

### 1. Create a Repository

Fork this repository or create your own with the following 2 files:

### 2. Create Workflow

`.github/workflows/monitor.yml`:

```yaml
name: Website Monitor

on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
  workflow_dispatch:        # Manual trigger button

jobs:
  monitor:
    runs-on: ubuntu-latest
    permissions:
      contents: write

    steps:
      - uses: actions/checkout@v4

      - uses: kiwamizamurai/sitedelta@v1
        id: patrol
        with:
          config: config.yaml  # or multiple: "hackernews.yaml,amazon.yaml"

      - uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: "Update monitoring results"
          file_pattern: "data/*"

      - uses: joelwmale/webhook-action@v2.4.1
        if: steps.patrol.outputs.changed == 'true'
        with:
          url: ${{ secrets.WEBHOOK_URL }}
          body: '{"content": "Site changes detected!", "changes": ${{ steps.patrol.outputs.changes }}}'
```

**Multiple Config Files:**

```yaml
- uses: kiwamizamurai/sitedelta@v1
  with:
    config: "configs/hackernews.yaml,configs/amazon.yaml,configs/news.yaml"
```

Each config generates separate state/history files: `data/{configName}-state.json`, `data/{configName}-history.csv`

### 3. Create Config File

`config.yaml`:

```yaml
version: "1"

monitors:
  - id: suumo-listing-count
    name: "SUUMO Tokyo Listings"
    url: "https://suumo.jp/chintai/tokyo/new/"
    selectors:
      - name: count
        type: css
        value: ".paginate_set-hit"
        match:
          type: regex
          pattern: "([0-9,]+)件"  # Extracts: 401,965

# Output paths are auto-derived from config filename:
# config.yaml → data/config-state.json, data/config-history.csv
```

See [`examples/`](./examples) for more configurations.

## How to Find Selectors

### Method 1: Browser Extensions (Recommended)

The easiest way to find selectors:

**[SelectorGadget](https://selectorgadget.com/)** (Chrome)
- Click on elements to generate CSS selectors automatically
- Green = selected, Yellow = matched elements
- Perfect for beginners

**[SelectorsHub](https://selectorshub.com/)** (Chrome/Firefox)
- Generates XPath, CSS, and Playwright selectors
- Works with iframes and Shadow DOM
- Shows errors in your selectors

### Method 2: Chrome DevTools

1. Right-click element → **Inspect**
2. In Elements panel, right-click → **Copy** → **Copy selector** or **Copy XPath**
3. Test in Console:
   ```javascript
   $$('.price')                      // CSS
   $x('//span[@class="price"]')      // XPath
   ```

### Simplify Selectors

Chrome generates verbose selectors. Simplify them:

```
# Before (Chrome generated)
#__next > div > main > ul > li:nth-child(1) > span.price

# After (simplified)
.price
```

**Tips:**
- Use class names: `.price`, `.product-title`
- Use `:first-child` for first item in a list
- If class names are random (React/Vue), use `[data-testid="price"]`

### CSS vs XPath

| Use Case | CSS | XPath |
|----------|-----|-------|
| Simple class/id | `.price`, `#title` | `//div[@class="price"]` |
| First element | `li:first-child` | `//li[1]` |
| Contains text | Not supported | `//span[contains(text(), "¥")]` |
| Parent element | Not supported | `//span/..` |

**Recommendation:** Use CSS for simplicity. Use XPath when you need text matching.

### Verify with sitedelta

```bash
npm run dev -- your-config.yaml
```

## Configuration Reference

### Monitor Settings

```yaml
monitors:
  - id: unique-id           # Unique identifier (required)
    name: "Display Name"    # Name used in notifications (required)
    url: "https://..."      # Target URL (required)
    timeout: 30000          # Timeout in milliseconds (default: 30000)
    mode: dynamic           # Force dynamic mode (optional, auto-detected)
    waitFor: ".selector"    # Wait for element (optional, defaults to CSS selector)
    selectors:              # Extraction methods (required, array)
      - name: price         # Selector name (required)
        type: css           # css / xpath
        value: ".price"     # Selector value
        match:              # Matching condition (optional)
          type: regex       # regex / exact / contains
          pattern: "([0-9,]+)"
```

**Auto-fallback**: If static fetch returns empty content, the system automatically retries with Playwright (dynamic mode). No need to manually specify `mode: dynamic` for most sites.

### Selector Types

| Type | Description | Example |
|------|-------------|---------|
| `css` | CSS Selector | `.price`, `#main h1`, `[data-price]` |
| `xpath` | XPath | `//div[@class="price"]/text()` |

### Match Types

| Type | Description |
|------|-------------|
| `regex` | Regex matching. Use capture groups `()` to extract values |
| `exact` | Exact match |
| `contains` | Partial match |

### Outputs

SiteDelta provides GitHub Actions outputs for integration with other actions:

| Output | Description |
|--------|-------------|
| `changed` | `true` if any changes detected |
| `changes` | JSON array of all changed monitors |
| `results` | Per-config results: `{"configName": {changed, changes, errors}}` |
| `error_count` | Total number of errors |
| `errors` | JSON array of error details |

## Star History

<a href="https://star-history.com/#kiwamizamurai/sitedelta&Date">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=kiwamizamurai/sitedelta&type=Date&theme=dark" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=kiwamizamurai/sitedelta&type=Date" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=kiwamizamurai/sitedelta&type=Date" />
 </picture>
</a>
