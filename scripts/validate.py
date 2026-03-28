#!/usr/bin/env python3
"""
Data validation script for CFP and journal calls dataset.
Validates data against schema and checks for common issues.
"""
import json
import sys
from datetime import datetime
from pathlib import Path

def load_json(filepath):
    """Load and parse JSON file."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading {filepath}: {e}")
        sys.exit(1)

def validate_record(record, schema, index):
    """Validate a single record against requirements."""
    errors = []

    # Check required fields
    required_fields = schema.get('required', [])
    for field in required_fields:
        if field not in record:
            errors.append(f"Record {index}: Missing required field '{field}'")

    # Validate venue_type
    if 'venue_type' in record and record['venue_type'] not in ['conference', 'journal']:
        errors.append(f"Record {index}: Invalid venue_type '{record['venue_type']}'")

    # Validate rank
    valid_ranks = ['A*', 'A', 'B', 'C', 'Q1', 'Q2', 'Q3', 'Q4', 'unknown']
    if 'rank' in record and record['rank'] not in valid_ranks:
        errors.append(f"Record {index}: Invalid rank '{record['rank']}'")

    # Validate area
    if 'area' in record:
        if not isinstance(record['area'], list):
            errors.append(f"Record {index}: 'area' must be a list")
        else:
            for area in record['area']:
                if area not in ['MPC', 'SEC']:
                    errors.append(f"Record {index}: Invalid area '{area}'")

    # Validate status
    if 'status' in record and record['status'] not in ['open', 'closed', 'upcoming']:
        errors.append(f"Record {index}: Invalid status '{record['status']}'")

    # Validate date formats
    for date_field in ['deadline', 'last_checked']:
        if date_field in record:
            try:
                datetime.strptime(record[date_field], '%Y-%m-%d')
            except ValueError:
                errors.append(f"Record {index}: Invalid date format for '{date_field}': {record[date_field]}")

    # Validate URLs
    for url_field in ['official_url', 'source_url']:
        if url_field in record:
            url = record[url_field]
            if not url.startswith('http://') and not url.startswith('https://'):
                errors.append(f"Record {index}: Invalid URL for '{url_field}': {url}")

    return errors

def check_duplicates(calls):
    """Check for duplicate IDs."""
    ids = [call['id'] for call in calls if 'id' in call]
    duplicates = [id for id in ids if ids.count(id) > 1]
    if duplicates:
        return [f"Duplicate IDs found: {set(duplicates)}"]
    return []

def update_statuses(calls):
    """Update call statuses based on deadline."""
    today = datetime.now().date()
    updated_count = 0

    for call in calls:
        if 'deadline' not in call:
            continue

        try:
            deadline = datetime.strptime(call['deadline'], '%Y-%m-%d').date()

            if deadline < today and call['status'] != 'closed':
                call['status'] = 'closed'
                updated_count += 1
            elif deadline >= today and call['status'] == 'closed':
                call['status'] = 'open'
                updated_count += 1
        except ValueError:
            continue

    return updated_count

def main():
    """Main validation function."""
    # Setup paths
    base_path = Path(__file__).parent.parent
    schema_path = base_path / 'data' / 'schema.json'
    calls_path = base_path / 'data' / 'calls.json'

    print("=" * 60)
    print("CFP Data Validation")
    print("=" * 60)

    # Load schema and data
    schema = load_json(schema_path)
    calls = load_json(calls_path)

    print(f"\nLoaded {len(calls)} records from {calls_path}")

    # Validate each record
    all_errors = []
    for index, call in enumerate(calls):
        errors = validate_record(call, schema, index)
        all_errors.extend(errors)

    # Check for duplicates
    duplicate_errors = check_duplicates(calls)
    all_errors.extend(duplicate_errors)

    # Update statuses
    updated_count = update_statuses(calls)
    if updated_count > 0:
        print(f"\n✓ Updated {updated_count} record statuses based on deadlines")
        with open(calls_path, 'w', encoding='utf-8') as f:
            json.dump(calls, f, indent=2, ensure_ascii=False)
        print(f"✓ Saved updated data to {calls_path}")

    # Report results
    print("\n" + "=" * 60)
    if all_errors:
        print("❌ VALIDATION FAILED")
        print("=" * 60)
        for error in all_errors:
            print(f"  • {error}")
        sys.exit(1)
    else:
        print("✅ VALIDATION PASSED")
        print("=" * 60)
        print(f"  • All {len(calls)} records are valid")
        print(f"  • No duplicate IDs found")
        print(f"  • All required fields present")
        print(f"  • All formats correct")
        sys.exit(0)

if __name__ == '__main__':
    main()
