# Contributing to CFP Tracker

Thank you for your interest in contributing to the CFP & Journal Call Tracker!

## How to Contribute

### Adding New Calls

1. **Check for duplicates**: Search existing entries in `data/calls.json`

2. **Gather information**:
   - Official CFP/journal page URL
   - Exact deadline date
   - Conference/journal ranking (verify against CORE/SJR)
   - Topics and areas covered

3. **Add entry to `data/calls.json`**:
   ```json
   {
     "id": "unique-id-2026",
     "title": "Full Conference/Journal Name",
     "venue_type": "conference",
     "rank": "A*",
     "area": ["MPC", "SEC"],
     "topics": ["topic1", "topic2"],
     "deadline": "2026-12-31",
     "status": "open",
     "official_url": "https://official-site.com",
     "source_url": "https://official-site.com/cfp",
     "last_checked": "2026-03-28",
     "notes": "Optional additional info"
   }
   ```

4. **Validate**:
   ```bash
   python3 scripts/validate.py
   ```

5. **Submit pull request** with description of what you added

### Updating Rankings

Rankings should be updated from official sources:

- **CORE Rankings**: https://www.core.edu.au/conference-portal
- **SJR Journal Rankings**: https://www.scimagojr.com/

Edit `config/conferences-ranking.json` or `config/journals-ranking.json` and submit a PR.

### Reporting Issues

Found incorrect information? Please open an issue with:
- Link to the incorrect entry
- Correct information with source
- Any relevant context

## Code of Conduct

- Be respectful and constructive
- Verify information before submitting
- Always cite sources
- Keep discussions professional

## Questions?

Open an issue or discussion on GitHub!
