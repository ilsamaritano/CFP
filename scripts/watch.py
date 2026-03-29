#!/usr/bin/env python3
"""
File watcher script for automatic refresh during local development.
Watches for changes in data/calls.json and config files, then automatically
runs validation and regenerates site/data.json.

Usage:
    python3 scripts/watch.py

Press Ctrl+C to stop.
"""

import sys
import time
import subprocess
from pathlib import Path
from datetime import datetime

def get_file_mtime(filepath):
    """Get the modification time of a file."""
    try:
        return Path(filepath).stat().st_mtime
    except FileNotFoundError:
        return None

def run_command(cmd, description):
    """Run a command and return success status."""
    print(f"\n{'='*60}")
    print(f"{description}")
    print(f"{'='*60}")
    try:
        result = subprocess.run(cmd, check=True, capture_output=True, text=True)
        print(result.stdout)
        if result.stderr:
            print(result.stderr, file=sys.stderr)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error: Command failed with exit code {e.returncode}", file=sys.stderr)
        print(e.stdout)
        print(e.stderr, file=sys.stderr)
        return False

def refresh_site():
    """Run validation and generation scripts."""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"\n🔄 [{timestamp}] Changes detected! Refreshing site...")

    # Run validation
    if not run_command(
        [sys.executable, "scripts/validate.py"],
        "📋 Validating data..."
    ):
        print("❌ Validation failed! Site data not regenerated.")
        return False

    # Run generation
    if not run_command(
        [sys.executable, "scripts/generate.py"],
        "🔨 Generating site data..."
    ):
        print("❌ Generation failed!")
        return False

    print(f"\n✅ [{timestamp}] Site refreshed successfully!")
    return True

def watch_files():
    """Watch for changes in data and config files."""
    # Files to watch
    watched_files = {
        "data/calls.json": None,
        "config/conferences-ranking.json": None,
        "config/journals-ranking.json": None,
        "config/topics.json": None,
    }

    print("👀 File Watcher Started")
    print("=" * 60)
    print("Watching for changes in:")
    for filepath in watched_files.keys():
        print(f"  • {filepath}")
    print("\nPress Ctrl+C to stop.")
    print("=" * 60)

    # Initialize modification times
    for filepath in watched_files.keys():
        watched_files[filepath] = get_file_mtime(filepath)

    # Initial refresh
    print("\n🚀 Running initial refresh...")
    refresh_site()

    # Watch loop
    try:
        while True:
            time.sleep(1)  # Check every second

            # Check each watched file
            for filepath, last_mtime in watched_files.items():
                current_mtime = get_file_mtime(filepath)

                # If file was modified
                if current_mtime is not None and current_mtime != last_mtime:
                    watched_files[filepath] = current_mtime

                    # If this is not the initial detection
                    if last_mtime is not None:
                        print(f"\n📝 Change detected: {filepath}")
                        refresh_site()
                        # Update all mtimes to avoid duplicate triggers
                        for fp in watched_files.keys():
                            watched_files[fp] = get_file_mtime(fp)
                        break

    except KeyboardInterrupt:
        print("\n\n👋 File watcher stopped.")
        sys.exit(0)

if __name__ == "__main__":
    # Check if we're in the right directory
    if not Path("data/calls.json").exists():
        print("Error: This script must be run from the repository root directory.", file=sys.stderr)
        print("Usage: python3 scripts/watch.py", file=sys.stderr)
        sys.exit(1)

    watch_files()
