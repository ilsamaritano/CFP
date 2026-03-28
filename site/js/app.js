// CFP & Journal Call Tracker - Main Application
class CFPTracker {
    constructor() {
        this.allCalls = [];
        this.filteredCalls = [];
        this.compareSelection = new Set();
        this.filters = {
            search: '',
            area: '',
            venue: 'conference',
            rank: '',
            status: 'open',
            location: '',
            acceptance: '',
            urgent: false
        };
        this.init();
    }

    async init() {
        try {
            await this.loadData();
            this.setupEventListeners();
            this.syncFilterUI();
            this.applyFilters();
            this.renderStats();
            this.updateLastUpdate();
        } catch (error) {
            console.error('Error initializing app:', error);
            this.showError('Failed to load data. Please try again later.');
        }
    }

    async loadData() {
        const response = await fetch('data.json');
        if (!response.ok) {
            throw new Error('Failed to fetch data');
        }
        this.allCalls = await response.json();
    }

    setupEventListeners() {
        // Search input
        document.getElementById('search').addEventListener('input', (e) => {
            this.filters.search = e.target.value.toLowerCase();
            this.applyFilters();
        });

        // Filter dropdowns
        document.getElementById('filter-area').addEventListener('change', (e) => {
            this.filters.area = e.target.value;
            this.applyFilters();
        });

        document.getElementById('filter-venue').addEventListener('change', (e) => {
            this.filters.venue = e.target.value;
            this.applyFilters();
        });

        document.getElementById('filter-rank').addEventListener('change', (e) => {
            this.filters.rank = e.target.value;
            this.applyFilters();
        });

        document.getElementById('filter-status').addEventListener('change', (e) => {
            this.filters.status = e.target.value;
            this.applyFilters();
        });

        document.getElementById('filter-location').addEventListener('input', (e) => {
            this.filters.location = e.target.value.toLowerCase();
            this.applyFilters();
        });

        document.getElementById('filter-acceptance').addEventListener('change', (e) => {
            this.filters.acceptance = e.target.value;
            this.applyFilters();
        });

        // Urgent checkbox
        document.getElementById('filter-urgent').addEventListener('change', (e) => {
            this.filters.urgent = e.target.checked;
            this.applyFilters();
        });
    }

    syncFilterUI() {
        document.getElementById('filter-venue').value = this.filters.venue;
        document.getElementById('filter-status').value = this.filters.status;
        document.getElementById('filter-location').value = this.filters.location;
        document.getElementById('filter-acceptance').value = this.filters.acceptance;
        document.getElementById('filter-urgent').checked = this.filters.urgent;
    }

    applyFilters() {
        this.filteredCalls = this.allCalls.filter(call => {
            // Search filter
            if (this.filters.search) {
                const searchText = `${call.title} ${call.topics.join(' ')} ${call.notes || ''} ${call.location || ''}`.toLowerCase();
                if (!searchText.includes(this.filters.search)) {
                    return false;
                }
            }

            // Area filter
            if (this.filters.area && !call.area.includes(this.filters.area)) {
                return false;
            }

            // Venue type filter
            if (this.filters.venue && call.venue_type !== this.filters.venue) {
                return false;
            }

            // Rank filter
            if (this.filters.rank && call.rank !== this.filters.rank) {
                return false;
            }

            // Status filter
            if (this.filters.status && call.status !== this.filters.status) {
                return false;
            }

            // Urgent filter (< 30 days)
            if (this.filters.urgent) {
                const daysUntil = call.days_until_deadline;
                if (daysUntil === null || daysUntil < 0 || daysUntil > 30) {
                    return false;
                }
            }

            // Location filter
            if (this.filters.location) {
                const location = (call.location || '').toLowerCase();
                if (!location.includes(this.filters.location)) {
                    return false;
                }
            }

            // Acceptance rate filter
            if (this.filters.acceptance && !this.matchesAcceptanceRate(call.acceptance_rate, this.filters.acceptance)) {
                return false;
            }

            return true;
        });

        this.render();
        this.renderComparePanel();
    }

    matchesAcceptanceRate(rate, filter) {
        if (rate === null || rate === undefined) {
            return false;
        }

        if (filter === 'lt20') {
            return rate < 20;
        }

        if (filter === '20to30') {
            return rate >= 20 && rate <= 30;
        }

        if (filter === 'gt30') {
            return rate > 30;
        }

        return true;
    }

    render() {
        const resultsContainer = document.getElementById('results');

        if (this.filteredCalls.length === 0) {
            resultsContainer.innerHTML = '<div class="no-results">No calls found matching your criteria.</div>';
            return;
        }

        resultsContainer.innerHTML = this.filteredCalls.map(call => this.renderCallCard(call)).join('');
        this.attachCardHandlers();
    }

    attachCardHandlers() {
        const resultsContainer = document.getElementById('results');

        resultsContainer.querySelectorAll('[data-action="calendar"]').forEach(button => {
            button.addEventListener('click', () => {
                const call = this.findCallById(button.dataset.id);
                if (call) {
                    this.downloadCalendar(call);
                }
            });
        });

        resultsContainer.querySelectorAll('[data-action="citation"]').forEach(button => {
            button.addEventListener('click', async () => {
                const call = this.findCallById(button.dataset.id);
                if (!call) {
                    return;
                }
                const citation = this.getCitationText(call);

                try {
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        await navigator.clipboard.writeText(citation);
                    } else {
                        const textarea = document.createElement('textarea');
                        textarea.value = citation;
                        document.body.appendChild(textarea);
                        textarea.select();
                        document.execCommand('copy');
                        textarea.remove();
                    }
                    const original = button.textContent;
                    button.textContent = 'Copied!';
                    setTimeout(() => {
                        button.textContent = original;
                    }, 1500);
                } catch (err) {
                    console.error('Failed to copy citation', err);
                }
            });
        });

        resultsContainer.querySelectorAll('input[data-action="compare"]').forEach(input => {
            input.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.compareSelection.add(e.target.dataset.id);
                } else {
                    this.compareSelection.delete(e.target.dataset.id);
                }
                this.renderComparePanel();
            });
        });
    }

    renderCallCard(call) {
        const isUrgent = call.days_until_deadline !== null &&
                         call.days_until_deadline >= 0 &&
                         call.days_until_deadline < 30;

        const rankClass = call.rank.toLowerCase().replace('*', '-star').replace(/\d/, (m) => `-q${m}`);

        const deadlineText = this.formatDeadline(call);
        const areasText = call.area.join(', ');
        const topicsHtml = call.topics.map(topic => `<span class="topic-tag">${this.escapeHtml(topic)}</span>`).join('');

        return `
            <div class="call-card ${call.rank === 'A*' ? 'rank-a-star' : call.rank === 'Q1' ? 'rank-q1' : call.rank === 'A' ? 'rank-a' : ''}">
                <div class="call-header">
                    <h2 class="call-title">
                        <a href="${this.escapeHtml(call.official_url)}" target="_blank" rel="noopener">
                            ${this.escapeHtml(call.title)}
                        </a>
                    </h2>
                    <div class="badges">
                        <span class="badge ${rankClass}">${this.escapeHtml(call.rank)}</span>
                        <span class="badge ${call.venue_type}">${this.escapeHtml(call.venue_type)}</span>
                        <span class="badge status-${call.status}">${this.escapeHtml(call.status)}</span>
                        ${isUrgent && call.status === 'open' ? '<span class="badge urgent">⚠️ Urgent</span>' : ''}
                    </div>
                </div>

                <div class="call-meta">
                    <div class="call-meta-item">
                        <strong>Deadline:</strong> ${deadlineText}
                    </div>
                    <div class="call-meta-item">
                        <strong>Areas:</strong> ${areasText}
                    </div>
                    <div class="call-meta-item">
                        <strong>Location:</strong> ${this.escapeHtml(call.location)}
                    </div>
                    <div class="call-meta-item">
                        <strong>Acceptance:</strong> ${this.formatAcceptanceRate(call)}
                    </div>
                    <div class="call-meta-item">
                        <span class="priority-score">Priority: ${call.priority_score}</span>
                    </div>
                </div>

                <div class="call-topics">
                    ${topicsHtml}
                </div>

                <div class="call-actions">
                    <button class="action-button" data-action="calendar" data-id="${call.id}">Export to calendar</button>
                    <button class="action-button secondary" data-action="citation" data-id="${call.id}">Copy citation</button>
                    <label class="compare-toggle">
                        <input type="checkbox" data-action="compare" data-id="${call.id}" ${this.compareSelection.has(call.id) ? 'checked' : ''}>
                        Compare
                    </label>
                </div>

                ${call.notes ? `<div class="call-notes">${this.escapeHtml(call.notes)}</div>` : ''}

                <div class="call-meta" style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--gray-200);">
                    <div class="call-meta-item">
                        <strong>Last checked:</strong> ${call.last_checked}
                    </div>
                    <div class="call-meta-item">
                        <a href="${this.escapeHtml(call.source_url)}" target="_blank" rel="noopener">View source</a>
                    </div>
                </div>
            </div>
        `;
    }

    findCallById(id) {
        return this.allCalls.find(c => c.id === id);
    }

    downloadCalendar(call) {
        const deadline = new Date(call.deadline);
        if (Number.isNaN(deadline.getTime())) {
            return;
        }

        const dateStr = this.formatDateForICS(deadline);
        const summary = `${call.title} (${call.rank} ${call.venue_type})`;
        const description = `Official URL: ${call.official_url}\\nSource: ${call.source_url}`;
        const icsContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//CFP Tracker//EN',
            'BEGIN:VEVENT',
            `UID:${call.id}@cfp-tracker`,
            `SUMMARY:${summary}`,
            `DTSTART;VALUE=DATE:${dateStr}`,
            `DTEND;VALUE=DATE:${dateStr}`,
            `DESCRIPTION:${description}`,
            `URL:${call.official_url}`,
            'END:VEVENT',
            'END:VCALENDAR'
        ].join('\\n');

        const blob = new Blob([icsContent], { type: 'text/calendar' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${call.id}.ics`;
        a.click();
        URL.revokeObjectURL(url);
    }

    formatDateForICS(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}${month}${day}`;
    }

    getCitationText(call) {
        const location = call.location ? `, ${call.location}` : '';
        return `${call.title}. ${call.venue_type} (${call.rank})${location}. Deadline: ${call.deadline}. Acceptance rate: ${this.formatAcceptanceRate(call)}. Last checked: ${call.last_checked}.`;
    }

    formatDeadline(call) {
        const deadline = new Date(call.deadline);
        const dateStr = deadline.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        if (call.days_until_deadline === null) {
            return dateStr;
        }

        if (call.days_until_deadline < 0) {
            return `${dateStr} (passed)`;
        }

        if (call.days_until_deadline === 0) {
            return `${dateStr} (today!)`;
        }

        if (call.days_until_deadline === 1) {
            return `${dateStr} (tomorrow!)`;
        }

        return `${dateStr} (in ${call.days_until_deadline} days)`;
    }

    formatAcceptanceRate(call) {
        if (call.acceptance_rate === null || call.acceptance_rate === undefined) {
            return 'N/A';
        }
        return `${call.acceptance_rate}%`;
    }

    renderComparePanel() {
        const panel = document.getElementById('compare-panel');
        if (!panel) {
            return;
        }

        if (this.compareSelection.size === 0) {
            panel.classList.add('hidden');
            panel.innerHTML = '';
            return;
        }

        const selectedCalls = this.allCalls.filter(call => this.compareSelection.has(call.id));
        panel.classList.remove('hidden');

        panel.innerHTML = `
            <div class="compare-header">
                <div>
                    <strong>Comparing ${selectedCalls.length} venues</strong>
                    <p class="compare-subtitle">Quickly scan ranks, locations, deadlines, and acceptance rates.</p>
                </div>
                <button class="action-button secondary" id="clear-compare">Clear</button>
            </div>
            <div class="compare-grid">
                ${selectedCalls.map(call => `
                    <div class="compare-card">
                        <div class="compare-title">${this.escapeHtml(call.title)}</div>
                        <div class="compare-line"><strong>Rank:</strong> ${this.escapeHtml(call.rank)} • ${this.escapeHtml(call.venue_type)}</div>
                        <div class="compare-line"><strong>Location:</strong> ${this.escapeHtml(call.location)}</div>
                        <div class="compare-line"><strong>Acceptance:</strong> ${this.formatAcceptanceRate(call)}</div>
                        <div class="compare-line"><strong>Deadline:</strong> ${this.formatDeadline(call)}</div>
                    </div>
                `).join('')}
            </div>
        `;

        const clearBtn = panel.querySelector('#clear-compare');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.compareSelection.clear();
                this.applyFilters();
            });
        }
    }

    renderStats() {
        const stats = this.calculateStats();
        const statsContainer = document.getElementById('stats');

        statsContainer.innerHTML = `
            <div class="stat-card">
                <div class="number">${stats.total}</div>
                <div class="label">Total Calls</div>
            </div>
            <div class="stat-card">
                <div class="number">${stats.open}</div>
                <div class="label">Open Calls</div>
            </div>
            <div class="stat-card">
                <div class="number">${stats.urgent}</div>
                <div class="label">Urgent (< 30 days)</div>
            </div>
            <div class="stat-card">
                <div class="number">${stats.aStar}</div>
                <div class="label">A* Conferences</div>
            </div>
            <div class="stat-card">
                <div class="number">${stats.q1}</div>
                <div class="label">Q1 Journals</div>
            </div>
        `;
    }

    calculateStats() {
        return {
            total: this.allCalls.length,
            open: this.allCalls.filter(c => c.status === 'open').length,
            urgent: this.allCalls.filter(c =>
                c.days_until_deadline !== null &&
                c.days_until_deadline >= 0 &&
                c.days_until_deadline < 30 &&
                c.status === 'open'
            ).length,
            aStar: this.allCalls.filter(c => c.rank === 'A*').length,
            q1: this.allCalls.filter(c => c.rank === 'Q1').length
        };
    }

    updateLastUpdate() {
        // Get the most recent last_checked date
        const lastUpdate = this.allCalls.reduce((latest, call) => {
            return call.last_checked > latest ? call.last_checked : latest;
        }, '');

        if (lastUpdate) {
            const date = new Date(lastUpdate);
            document.getElementById('last-update').textContent = date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showError(message) {
        const resultsContainer = document.getElementById('results');
        resultsContainer.innerHTML = `<div class="no-results" style="color: var(--danger-color);">${message}</div>`;
    }
}

// Initialize the app when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new CFPTracker();
});
