#!/usr/bin/env python3
"""
Priority calculator for CFP and journal calls.
Calculates priority score based on ranking, deadline proximity, and topic relevance.
"""
import json
from datetime import datetime
from pathlib import Path

def calculate_priority_score(call, today):
    """
    Calculate priority score for a call.

    Scoring factors:
    - Ranking: A* = 100, A = 80, Q1 = 90, B = 60, Q2 = 70, C/Q3 = 40, Q4/unknown = 20
    - Deadline proximity:
      - < 7 days: +50
      - < 14 days: +40
      - < 30 days: +30
      - < 60 days: +20
      - < 90 days: +10
    - Area relevance:
      - Both MPC and SEC: +30
      - Either MPC or SEC: +15
    - MPC-specific topics: +10 per relevant topic (max +30)
    """
    score = 0

    # Ranking score
    rank_scores = {
        'A*': 100,
        'Q1': 90,
        'A': 80,
        'Q2': 70,
        'B': 60,
        'C': 40,
        'Q3': 40,
        'Q4': 20,
        'unknown': 10
    }
    score += rank_scores.get(call.get('rank', 'unknown'), 10)

    # Deadline proximity score
    if call.get('status') == 'open':
        try:
            deadline = datetime.strptime(call['deadline'], '%Y-%m-%d').date()
            days_until = (deadline - today).days

            if days_until < 0:
                score -= 50  # Penalty for past deadlines
            elif days_until <= 7:
                score += 50
            elif days_until <= 14:
                score += 40
            elif days_until <= 30:
                score += 30
            elif days_until <= 60:
                score += 20
            elif days_until <= 90:
                score += 10
        except (ValueError, KeyError):
            pass

    # Area relevance score
    areas = call.get('area', [])
    if 'MPC' in areas and 'SEC' in areas:
        score += 30
    elif 'MPC' in areas or 'SEC' in areas:
        score += 15

    # MPC-specific topic bonus
    mpc_keywords = [
        'multi-party computation', 'mpc', 'secure computation',
        'secret sharing', 'threshold cryptography', 'garbled circuits',
        'oblivious transfer', 'smpc'
    ]
    topics_lower = [t.lower() for t in call.get('topics', [])]
    title_lower = call.get('title', '').lower()
    notes_lower = call.get('notes', '').lower()

    mpc_relevance_count = 0
    for keyword in mpc_keywords:
        if (keyword in topics_lower or
            keyword in title_lower or
            keyword in notes_lower):
            mpc_relevance_count += 1

    score += min(mpc_relevance_count * 10, 30)

    return score

def add_priority_scores(calls_path, output_path):
    """Add priority scores to calls and save sorted result."""
    with open(calls_path, 'r', encoding='utf-8') as f:
        calls = json.load(f)

    today = datetime.now().date()

    # Calculate priority for each call
    for call in calls:
        call['priority_score'] = calculate_priority_score(call, today)

        # Calculate days until deadline for display
        try:
            deadline = datetime.strptime(call['deadline'], '%Y-%m-%d').date()
            call['days_until_deadline'] = (deadline - today).days
        except (ValueError, KeyError):
            call['days_until_deadline'] = None

    # Sort by priority score (descending)
    calls.sort(key=lambda x: x['priority_score'], reverse=True)

    # Save sorted data
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(calls, f, indent=2, ensure_ascii=False)

    print(f"✓ Calculated priority scores for {len(calls)} calls")
    print(f"✓ Saved sorted data to {output_path}")

    # Print top 5
    print("\nTop 5 highest priority calls:")
    for i, call in enumerate(calls[:5], 1):
        print(f"  {i}. {call['title']} (Score: {call['priority_score']}, Rank: {call['rank']})")

def main():
    """Main function."""
    base_path = Path(__file__).parent.parent
    calls_path = base_path / 'data' / 'calls.json'
    output_path = base_path / 'site' / 'data.json'

    add_priority_scores(calls_path, output_path)

if __name__ == '__main__':
    main()
