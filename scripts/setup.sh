#!/usr/bin/env bash
# setup.sh — Check and install prerequisites for job-shit
#
# Verifies that Node.js and Chrome/Chromium are available.
# On macOS, offers to install Chrome via Homebrew when it is missing.
# PDF generation (--pdf flag) requires Chrome; all other features work without it.

set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

ok()   { echo -e "${GREEN}✓${NC} $*"; }
warn() { echo -e "${YELLOW}⚠${NC} $*"; }
fail() { echo -e "${RED}✗${NC} $*"; }

echo ""
echo "job-shit — prerequisites check"
echo "================================"
echo ""

# ---------------------------------------------------------------------------
# Node.js
# ---------------------------------------------------------------------------
if command -v node &>/dev/null; then
  NODE_VER=$(node --version)
  ok "Node.js $NODE_VER"
else
  fail "Node.js not found. Install Node.js >=20.19.0 from https://nodejs.org"
  exit 1
fi

# ---------------------------------------------------------------------------
# npm packages
# ---------------------------------------------------------------------------
if [ -d "node_modules" ]; then
  ok "npm dependencies installed"
else
  warn "node_modules not found — running npm install..."
  npm install
  ok "npm dependencies installed"
fi

# ---------------------------------------------------------------------------
# Chrome / Chromium  (required only for --pdf flag)
# ---------------------------------------------------------------------------
echo ""
echo "Checking for Chrome/Chromium (required for --pdf)..."
echo ""

CHROME_FOUND=""

# Respect CHROME_PATH override
if [ -n "${CHROME_PATH:-}" ] && [ -x "$CHROME_PATH" ]; then
  ok "Chrome found via CHROME_PATH: $CHROME_PATH"
  CHROME_FOUND="$CHROME_PATH"
fi

# macOS app bundles
if [ -z "$CHROME_FOUND" ]; then
  for path in \
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
    "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary" \
    "/Applications/Chromium.app/Contents/MacOS/Chromium"
  do
    if [ -x "$path" ]; then
      ok "Chrome found: $path"
      CHROME_FOUND="$path"
      break
    fi
  done
fi

# Linux paths
if [ -z "$CHROME_FOUND" ]; then
  for bin in google-chrome google-chrome-stable chromium chromium-browser chrome; do
    if command -v "$bin" &>/dev/null; then
      CHROME_PATH_FOUND=$(command -v "$bin")
      ok "Chrome found on PATH: $CHROME_PATH_FOUND"
      CHROME_FOUND="$CHROME_PATH_FOUND"
      break
    fi
  done
fi

if [ -z "$CHROME_FOUND" ]; then
  warn "Chrome/Chromium not found."
  echo ""
  echo "PDF generation (--pdf flag) will not be available until Chrome is installed."
  echo ""

  # Offer to install via Homebrew on macOS
  if [[ "$(uname)" == "Darwin" ]]; then
    if command -v brew &>/dev/null; then
      read -r -p "  Install Google Chrome via Homebrew? [y/N] " REPLY
      if [[ "$REPLY" =~ ^[Yy]$ ]]; then
        echo "  Running: brew install --cask google-chrome"
        brew install --cask google-chrome
        ok "Google Chrome installed."
        CHROME_FOUND="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
      else
        warn "Skipped Chrome installation."
        echo "  To install later, run: brew install --cask google-chrome"
        echo "  Or set CHROME_PATH in your .env to point to any Chromium binary."
      fi
    else
      warn "Homebrew not found."
      echo "  Install Homebrew first: https://brew.sh"
      echo "  Then run: brew install --cask google-chrome"
      echo "  Or download Chrome directly: https://www.google.com/chrome/"
    fi
  else
    echo "  On Debian/Ubuntu: sudo apt-get install -y google-chrome-stable"
    echo "  On Fedora/RHEL:   sudo dnf install -y google-chrome-stable"
    echo "  Or set CHROME_PATH in your .env to point to any Chromium binary."
  fi
else
  echo ""
  echo "  Note: Safari is not supported for headless PDF generation."
  echo "  Set CHROME_PATH in your .env to override the detected binary."
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo ""
echo "================================"
if [ -n "$CHROME_FOUND" ]; then
  ok "All prerequisites met. Run 'npm run build' to compile, then use --pdf to generate PDFs."
else
  warn "Setup complete (PDF generation unavailable without Chrome)."
  echo "  All other features work without Chrome."
fi
echo ""
