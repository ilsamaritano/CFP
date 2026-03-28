# CFP & Journal Call Tracker

A static website for tracking Call for Papers (CFP) and journal calls in **Multi-Party Computation (MPC)** and **Security (SEC)** research areas. The site features automated data updates, configurable ranking filters (A*, Q1), and priority-based sorting.

🔗 **Live Site**: https://ilsamaritano.github.io/CFP/

## Features

- 📊 **Comprehensive Tracking**: Monitor conferences and journals in MPC and Security
- 🔍 **Advanced Filtering**: Filter by area, ranking, venue type, status, and deadline
- 🔎 **Full-Text Search**: Search across titles, topics, and notes
- ⚡ **Priority Scoring**: Intelligent sorting based on ranking, deadline proximity, and topic relevance
- 🏆 **Configurable Rankings**: A* conferences (CORE) and Q1 journals (SJR) - no hardcoded values
- 🤖 **Automated Updates**: Daily data refresh via GitHub Actions
- 📱 **Responsive Design**: Works on all devices
- 🚀 **Static Site**: No backend required, hosted on GitHub Pages

## Repository Structure

```
CFP/
├── .github/
│   └── workflows/
│       ├── update-and-deploy.yml    # Main CI/CD pipeline
│       └── manual-update.yml        # Manual update workflow
├── config/
│   ├── conferences-ranking.json     # A*/A/B conference rankings
│   ├── journals-ranking.json        # Q1/Q2/Q3 journal rankings
│   └── topics.json                  # Topic taxonomy for tagging
├── data/
│   ├── schema.json                  # JSON schema for data validation
│   └── calls.json                   # Main dataset (source of truth)
├── scripts/
│   ├── validate.py                  # Data validation script
│   └── generate.py                  # Priority calculation and site data generation
├── site/
│   ├── index.html                   # Main HTML page
│   ├── css/
│   │   └── style.css               # Styles
│   ├── js/
│   │   └── app.js                  # Frontend application
│   └── data.json                   # Generated data with priorities (auto-generated)
└── README.md
```

## Data Schema

Each call/journal entry contains:

```json
{
  "id": "unique-identifier",
  "title": "Conference or Journal Name",
  "venue_type": "conference | journal",
  "rank": "A* | A | B | C | Q1 | Q2 | Q3 | Q4 | unknown",
  "area": ["MPC", "SEC"],
  "topics": ["list", "of", "specific", "topics"],
  "deadline": "YYYY-MM-DD",
  "status": "open | closed | upcoming",
  "location": "City, Country | Online",
  "acceptance_rate": 23.5,
  "official_url": "https://official-site.com",
  "source_url": "https://source-where-found.com",
  "last_checked": "YYYY-MM-DD",
  "notes": "Additional information"
}
```

## Priority Algorithm

The system calculates a priority score for each call based on:

1. **Ranking Weight**:
   - A* conferences: 100 points
   - Q1 journals: 90 points
   - A conferences: 80 points
   - Q2 journals: 70 points
   - B conferences: 60 points
   - C/Q3: 40 points
   - Q4/unknown: 20 points

2. **Deadline Proximity** (for open calls):
   - < 7 days: +50 points
   - < 14 days: +40 points
   - < 30 days: +30 points
   - < 60 days: +20 points
   - < 90 days: +10 points
   - Past deadline: -50 points

3. **Area Relevance**:
   - Both MPC and SEC: +30 points
   - Either MPC or SEC: +15 points

4. **MPC Topic Relevance**:
   - +10 points per relevant MPC keyword (max +30)

## Setup and Deployment

### Prerequisites

- Python 3.11+
- Git
- GitHub account

### Initial Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/ilsamaritano/CFP.git
   cd CFP
   ```

2. **Enable GitHub Pages**:
   - Go to repository Settings → Pages
   - Source: GitHub Actions
   - Save

3. **Run initial data generation**:
   ```bash
   python3 scripts/validate.py
   python3 scripts/generate.py
   ```

4. **Commit and push**:
   ```bash
   git add .
   git commit -m "Initial setup"
   git push
   ```

The site will be automatically deployed to `https://ilsamaritano.github.io/CFP/`

## Maintenance

### Adding New Calls

1. Edit `data/calls.json`
2. Add new entry following the schema
3. Create a pull request - **site data is auto-generated**
4. The PR workflow will automatically:
   - Validate your data
   - Regenerate `site/data.json` with priority scores
   - Commit the changes to your PR branch
5. After PR is merged, the site is automatically deployed

### Updating Rankings

Rankings are stored in configuration files (not hardcoded):

- **Conferences**: Edit `config/conferences-ranking.json`
  - Based on CORE rankings: https://www.core.edu.au/conference-portal
- **Journals**: Edit `config/journals-ranking.json`
  - Based on SJR/Scopus quartiles: https://www.scimagojr.com/

After updating, regenerate data:
```bash
python3 scripts/generate.py
```

### Manual Workflow Triggers

- **Full update and deploy**: Go to Actions → "Update Data and Deploy" → Run workflow
- **Validation only**: Go to Actions → "Manual Data Update" → Run workflow

### Data Validation

The validation script checks:
- Required fields presence
- Valid enum values (venue_type, rank, area, status)
- Date format (YYYY-MM-DD)
- URL format (http/https)
- Duplicate IDs
- Auto-updates statuses based on deadlines

Run validation:
```bash
python3 scripts/validate.py
```

## Automated Updates

The system features multiple levels of automation:

### 1. Pull Request Automation
When you create a PR that modifies `data/calls.json` or configuration files:
- **Automatic validation** of all data entries
- **Automatic regeneration** of `site/data.json` with priority scores
- Changes are committed directly to your PR branch
- No manual script execution needed

### 2. Daily Automation
The system runs daily at 00:00 UTC:

1. Validates all data
2. Updates call statuses based on deadlines
3. Recalculates priority scores
4. Regenerates site data
5. Commits changes (if any)
6. Deploys to GitHub Pages

### 3. Post-Merge Automation
After a PR is merged to main:
- The workflow validates and regenerates data
- Deploys the updated site to GitHub Pages
- No manual intervention required

## Data Sources

The system prioritizes official sources:

- **Primary sources**: Official conference/journal websites
- **Verification**: DBLP, WikiCFP (as secondary)
- **Rankings**: CORE (conferences), SJR/Scopus (journals)

Always link to official CFP pages in `official_url` field.

## Development

### Local Testing

**Note**: When working with PRs, you don't need to run these commands manually - the PR workflow handles them automatically. These are only needed for local development and testing.

1. **Validate data**:
   ```bash
   python3 scripts/validate.py
   ```

2. **Generate site data**:
   ```bash
   python3 scripts/generate.py
   ```

3. **Serve locally**:
   ```bash
   cd site
   python3 -m http.server 8000
   ```

4. Open http://localhost:8000 in browser

### Adding New Features

The frontend is vanilla JavaScript with no build step:
- Edit `site/index.html` for structure
- Edit `site/css/style.css` for styling
- Edit `site/js/app.js` for functionality

No compilation needed - changes are immediate.

## Configuration Files

### conferences-ranking.json

Maps conference names to CORE rankings (A*, A, B). Update periodically from official CORE portal.

### journals-ranking.json

Maps journal names to SJR quartiles (Q1, Q2, Q3, Q4). Update periodically from Scopus/SJR.

### topics.json

Defines:
- Area keywords for auto-tagging (MPC, SEC)
- Specific topics taxonomy
- Used by priority algorithm for relevance scoring

## Troubleshooting

### Build fails on GitHub Actions

- Check Python script syntax
- Verify JSON files are valid: `python3 -m json.tool data/calls.json`
- Review workflow logs in Actions tab

### Site shows "No calls found"

- Ensure `site/data.json` exists and is valid
- Check browser console for errors
- Verify `site/data.json` is committed

### Rankings not working

- Verify rank values match schema: A*, A, B, C, Q1, Q2, Q3, Q4, unknown
- Check configuration files are valid JSON
- Regenerate site data: `python3 scripts/generate.py`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run validation: `python3 scripts/validate.py`
5. Submit a pull request

## License

MIT License - feel free to adapt for your research area.

## Maintenance Plan

### Weekly
- Review new CFP announcements
- Add newly announced conferences/journals
- Update deadlines if extended

### Monthly
- Verify existing deadlines against official sources
- Update `last_checked` dates
- Review and tag new topics

### Quarterly
- Update CORE rankings from official source
- Update SJR journal quartiles
- Review and clean closed/past calls

### Annually
- Archive previous year's data
- Major cleanup and restructuring if needed
- Review and update topic taxonomy

## Contact

For issues or suggestions, please open an issue on GitHub: https://github.com/ilsamaritano/CFP/issues

---

**Note**: This system is designed to be simple, maintainable, and transparent. All data sources are documented, all rankings are configurable, and the entire pipeline is open source.
