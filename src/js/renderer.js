class QuranJournalApp {
    constructor() {
        this.quranAPI = new QuranAPI();
        this.journalManager = new JournalManager();
        this.currentSurahs = [];
        this.init();
    }

    async init() {
        await this.journalManager.loadData();
        this.setupEventListeners();
        await this.loadSurahList();
        await this.populateSurahSelect();
        await this.loadJournalEntries();
        this.updateProgress();
        this.loadHomepageData();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.showPage(e.target.dataset.page);
            });
        });

        // Homepage quick actions
        document.querySelectorAll('.hero-btn, .action-card').forEach(element => {
            element.addEventListener('click', (e) => {
                const page = e.currentTarget.dataset.page;
                this.showPage(page);
            });
        });

        // Search functionality
        document.getElementById('search-surah').addEventListener('input', (e) => {
            this.filterSurahs(e.target.value);
        });

        // Journal modal
        document.getElementById('add-journal-btn').addEventListener('click', () => {
            this.openJournalModal();
        });

        document.getElementById('cancel-btn').addEventListener('click', () => {
            this.closeJournalModal();
        });

        document.querySelector('.close-modal').addEventListener('click', () => {
            this.closeJournalModal();
        });

        document.getElementById('journal-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveJournalEntry();
        });

        // Surah select change event
        document.getElementById('surah-select').addEventListener('change', (e) => {
            this.updateAyahsLimit(e.target.value);
        });

        // Ayahs completed change event
        document.getElementById('ayahs-completed').addEventListener('input', (e) => {
            this.updateStatusBasedOnAyahs();
        });

        // Modal close on outside click
        document.getElementById('journal-modal').addEventListener('click', (e) => {
            if (e.target.id === 'journal-modal') {
                this.closeJournalModal();
            }
        });

        // Allow typing in textarea (prevent event propagation)
        document.getElementById('reflection').addEventListener('click', (e) => {
            e.stopPropagation();
        });

        document.getElementById('reflection').addEventListener('keydown', (e) => {
            e.stopPropagation();
        });
    }

    async loadSurahList() {
        try {
            const grid = document.getElementById('surah-grid');
            grid.innerHTML = '<div class="loading">Loading surahs...</div>';
            
            const surahs = await this.quranAPI.fetchSurahs();
            this.currentSurahs = surahs;
            this.renderSurahCards(surahs);
        } catch (error) {
            this.showError('Failed to load surahs. Please check your internet connection.');
        }
    }

    async populateSurahSelect() {
        const surahSelect = document.getElementById('surah-select');
        // Clear existing options except the first one
        while (surahSelect.children.length > 1) {
            surahSelect.removeChild(surahSelect.lastChild);
        }
        
        this.currentSurahs.forEach(surah => {
            const option = document.createElement('option');
            option.value = surah.number;
            option.textContent = `${surah.number}. ${surah.englishName} (${surah.name})`;
            option.dataset.ayahs = surah.numberOfAyahs;
            surahSelect.appendChild(option);
        });
    }

    updateAyahsLimit(surahNumber) {
        const ayahsCompleted = document.getElementById('ayahs-completed');
        const totalAyahsText = document.getElementById('total-ayahs-text');
        
        if (surahNumber) {
            const surah = this.currentSurahs.find(s => s.number == surahNumber);
            if (surah) {
                ayahsCompleted.max = surah.numberOfAyahs;
                totalAyahsText.textContent = `Total ayahs: ${surah.numberOfAyahs}`;
                totalAyahsText.style.display = 'block';
                this.updateStatusBasedOnAyahs();
                return;
            }
        }
        
        ayahsCompleted.max = '';
        totalAyahsText.style.display = 'none';
    }

    updateStatusBasedOnAyahs() {
        const surahNumber = document.getElementById('surah-select').value;
        const ayahsCompleted = parseInt(document.getElementById('ayahs-completed').value) || 0;
        
        if (surahNumber) {
            const surah = this.currentSurahs.find(s => s.number == surahNumber);
            if (surah) {
                const statusSelect = document.getElementById('status');
                if (ayahsCompleted === 0) {
                    statusSelect.value = 'not-started';
                } else if (ayahsCompleted === surah.numberOfAyahs) {
                    statusSelect.value = 'completed';
                } else {
                    statusSelect.value = 'in-progress';
                }
            }
        }
    }

    renderSurahCards(surahs) {
        const grid = document.getElementById('surah-grid');
        
        if (surahs.length === 0) {
            grid.innerHTML = '<div class="empty-state">No surahs found</div>';
            return;
        }

        grid.innerHTML = surahs.map(surah => this.createSurahCardHTML(surah)).join('');

        // Add event listeners to the "Add to Journal" buttons
        document.querySelectorAll('.add-journal').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const surahCard = e.target.closest('.surah-card');
                const surahNumber = parseInt(surahCard.dataset.surahNumber);
                const surah = this.currentSurahs.find(s => s.number === surahNumber);
                this.openJournalModal(surah);
            });
        });
    }

    createSurahCardHTML(surah) {
        return `
            <div class="surah-card" data-surah-number="${surah.number}">
                <div class="surah-header">
                    <span class="surah-number">${surah.number}</span>
                    <h3 class="surah-name">${surah.englishName}</h3>
                    <span class="surah-arabic">${surah.name}</span>
                </div>
                <div class="surah-details">
                    <p class="surah-translation">${surah.englishNameTranslation}</p>
                    <div class="surah-meta">
                        <span class="ayahs">${surah.numberOfAyahs} Ayahs</span>
                        <span class="revelation ${surah.revelationType.toLowerCase()}">${surah.revelationType}</span>
                    </div>
                </div>
                <div class="surah-actions">
                    <button class="btn-outline add-journal">
                        <i class="fas fa-book-medical"></i> Add to Journal
                    </button>
                </div>
            </div>
        `;
    }

    async filterSurahs(query) {
        if (query.trim() === '') {
            this.renderSurahCards(this.currentSurahs);
            return;
        }

        const filteredSurahs = this.currentSurahs.filter(surah => 
            surah.englishName.toLowerCase().includes(query.toLowerCase()) ||
            surah.name.toLowerCase().includes(query.toLowerCase()) ||
            surah.englishNameTranslation.toLowerCase().includes(query.toLowerCase())
        );
        this.renderSurahCards(filteredSurahs);
    }

    openJournalModal(surah = null) {
        const modal = document.getElementById('journal-modal');
        const form = document.getElementById('journal-form');
        
        // Reset form
        form.reset();
        document.getElementById('entry-id').value = '';
        document.getElementById('modal-title').textContent = 'Add Journal Entry';
        document.getElementById('ayahs-completed').value = '0';
        document.getElementById('reflection').value = '';
        document.getElementById('status').value = 'not-started';
        
        if (surah) {
            // Set the surah in the dropdown
            document.getElementById('surah-select').value = surah.number;
            this.updateAyahsLimit(surah.number);
        } else {
            document.getElementById('surah-select').value = '';
            this.updateAyahsLimit('');
        }
        
        modal.style.display = 'block';
        
        // Focus on the first input field
        setTimeout(() => {
            if (surah) {
                document.getElementById('ayahs-completed').focus();
            } else {
                document.getElementById('surah-select').focus();
            }
        }, 100);
    }

    closeJournalModal() {
        document.getElementById('journal-modal').style.display = 'none';
    }

    async saveJournalEntry() {
        console.log('Save journal entry called');
        
        // Get form values directly from elements
        const surahSelect = document.getElementById('surah-select');
        const ayahsCompleted = document.getElementById('ayahs-completed');
        const reflection = document.getElementById('reflection');
        const status = document.getElementById('status');
        const entryId = document.getElementById('entry-id').value;
        
        const surahNumber = parseInt(surahSelect.value);
        const ayahsCompletedValue = parseInt(ayahsCompleted.value) || 0;
        const reflectionValue = reflection.value; // Don't trim here, allow spaces
        const statusValue = status.value;
        
        console.log('Form values:', {
            surahNumber,
            ayahsCompletedValue,
            reflectionValue,
            statusValue,
            entryId
        });

        // Validation
        if (!surahNumber || isNaN(surahNumber)) {
            this.showError('Please select a surah.');
            return;
        }

        if (isNaN(ayahsCompletedValue) || ayahsCompletedValue < 0) {
            this.showError('Please enter a valid number of ayahs completed.');
            return;
        }

        const surah = this.currentSurahs.find(s => s.number === surahNumber);
        if (surah && ayahsCompletedValue > surah.numberOfAyahs) {
            this.showError(`Ayahs completed cannot exceed total ayahs (${surah.numberOfAyahs})`);
            return;
        }

        const entryData = {
            surahNumber: surahNumber,
            ayahsCompleted: ayahsCompletedValue,
            reflection: reflectionValue, // Use the raw value
            status: statusValue
        };

        console.log('Saving entry data:', entryData);

        let result;
        if (entryId) {
            console.log('Updating existing entry:', entryId);
            result = await this.journalManager.updateEntry(entryId, entryData);
        } else {
            console.log('Creating new entry');
            result = await this.journalManager.createEntry(entryData);
        }

        console.log('Save result:', result);

        if (result.success) {
            this.closeJournalModal();
            await this.loadJournalEntries();
            this.updateProgress();
            this.loadHomepageData();
            this.showMessage('Journal entry saved successfully!', 'success');
        } else {
            this.showError(result.error || 'Failed to save journal entry.');
        }
    }

    async loadJournalEntries() {
        const entries = this.journalManager.getEntries();
        const container = document.getElementById('journal-entries');
        
        if (entries.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-book-open"></i>
                    <h3>No Journal Entries Yet</h3>
                    <p>Start your Quran journaling journey by adding your first entry.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = entries.map(entry => this.createJournalEntryHTML(entry)).join('');
        this.attachJournalEntryEvents();
    }

    createJournalEntryHTML(entry) {
        const surah = this.currentSurahs.find(s => s.number === entry.surahNumber);
        const surahName = surah ? `${surah.englishName} (${surah.name})` : `Surah ${entry.surahNumber}`;
        const totalAyahs = surah ? surah.numberOfAyahs : '?';
        
        return `
            <div class="journal-entry" data-entry-id="${entry.id}">
                <div class="entry-header">
                    <h4>${surahName}</h4>
                    <span class="entry-date">${new Date(entry.updatedAt).toLocaleDateString()}</span>
                </div>
                <div class="entry-content">
                    <div class="progress-info">
                        <span class="progress-text">${entry.ayahsCompleted} / ${totalAyahs} Ayahs</span>
                        <span class="status-badge ${entry.status}">${entry.status.replace('-', ' ')}</span>
                    </div>
                    <p class="reflection">${entry.reflection || 'No reflection added.'}</p>
                </div>
                <div class="entry-actions">
                    <button class="btn-icon edit-entry" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon delete-entry" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    attachJournalEntryEvents() {
        // Edit buttons
        document.querySelectorAll('.edit-entry').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const entryId = e.target.closest('.journal-entry').dataset.entryId;
                this.editJournalEntry(entryId);
            });
        });

        // Delete buttons
        document.querySelectorAll('.delete-entry').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const entryId = e.target.closest('.journal-entry').dataset.entryId;
                this.deleteJournalEntry(entryId);
            });
        });
    }

    async editJournalEntry(entryId) {
        const entry = this.journalManager.getEntryById(entryId);
        if (!entry) return;

        const modal = document.getElementById('journal-modal');
        
        document.getElementById('entry-id').value = entry.id;
        document.getElementById('surah-select').value = entry.surahNumber;
        document.getElementById('ayahs-completed').value = entry.ayahsCompleted;
        document.getElementById('reflection').value = entry.reflection || '';
        document.getElementById('status').value = entry.status;
        document.getElementById('modal-title').textContent = 'Edit Journal Entry';
        
        this.updateAyahsLimit(entry.surahNumber);
        modal.style.display = 'block';
        
        // Focus on reflection textarea when editing
        setTimeout(() => {
            document.getElementById('reflection').focus();
        }, 100);
    }

    async deleteJournalEntry(entryId) {
        if (confirm('Are you sure you want to delete this journal entry?')) {
            const result = await this.journalManager.deleteEntry(entryId);
            if (result.success) {
                await this.loadJournalEntries();
                this.updateProgress();
                this.loadHomepageData();
            } else {
                this.showError(result.error || 'Failed to delete journal entry.');
            }
        }
    }

    updateProgress() {
        const stats = this.journalManager.getProgressStats();
        console.log('Progress stats:', stats);
        
        // Update progress numbers
        document.getElementById('completed-surahs').textContent = stats.completed;
        document.getElementById('inprogress-surahs').textContent = stats.inProgress;
        document.getElementById('notstarted-surahs').textContent = stats.notStarted;
        document.getElementById('total-entries').textContent = stats.totalEntries;
        
        // Render the progress chart and details
        this.renderProgressChart(stats);
        this.renderProgressDetails(stats);
    }

    renderProgressChart(stats) {
        const canvas = document.getElementById('progress-chart');
        if (!canvas) {
            console.error('Progress chart canvas not found');
            return;
        }
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error('Could not get canvas context');
            return;
        }
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const total = stats.totalSurahs;
        const completedPercent = (stats.completed / total) * 100;
        const inProgressPercent = (stats.inProgress / total) * 100;
        const notStartedPercent = (stats.notStarted / total) * 100;
        
        console.log('Chart percentages:', { completedPercent, inProgressPercent, notStartedPercent });
        
        // Draw progress bars with better visualization
        const barHeight = 30;
        const barWidth = 400;
        
        // Completed section (Green)
        const completedWidth = (stats.completed / total) * barWidth;
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(0, 0, completedWidth, barHeight);
        
        // In Progress section (Yellow)
        const inProgressWidth = (stats.inProgress / total) * barWidth;
        ctx.fillStyle = '#FFC107';
        ctx.fillRect(completedWidth, 0, inProgressWidth, barHeight);
        
        // Not Started section (Gray)
        const notStartedWidth = (stats.notStarted / total) * barWidth;
        ctx.fillStyle = '#E0E0E0';
        ctx.fillRect(completedWidth + inProgressWidth, 0, notStartedWidth, barHeight);
        
        // Add border
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, barWidth, barHeight);
        
        // Add percentage labels
        ctx.fillStyle = '#2c3e50';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Only show labels if the section is wide enough
        if (completedWidth > 40) {
            ctx.fillStyle = 'white';
            ctx.fillText(
                `${Math.round(completedPercent)}% Completed`, 
                completedWidth / 2, 
                barHeight / 2
            );
        }
        
        if (inProgressWidth > 40) {
            ctx.fillStyle = '#2c3e50';
            ctx.fillText(
                `${Math.round(inProgressPercent)}% In Progress`, 
                completedWidth + inProgressWidth / 2, 
                barHeight / 2
            );
        }
        
        if (notStartedWidth > 40) {
            ctx.fillStyle = '#2c3e50';
            ctx.fillText(
                `${Math.round(notStartedPercent)}% Not Started`, 
                completedWidth + inProgressWidth + notStartedWidth / 2, 
                barHeight / 2
            );
        }
        
        // Add legend below the chart
        const legendY = barHeight + 40;
        const legendItemHeight = 20;
        
        // Completed legend
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(0, legendY, 15, 15);
        ctx.fillStyle = '#2c3e50';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Completed: ${stats.completed} surahs`, 20, legendY + 10);
        
        // In Progress legend
        ctx.fillStyle = '#FFC107';
        ctx.fillRect(0, legendY + legendItemHeight, 15, 15);
        ctx.fillStyle = '#2c3e50';
        ctx.fillText(`In Progress: ${stats.inProgress} surahs`, 20, legendY + legendItemHeight + 10);
        
        // Not Started legend
        ctx.fillStyle = '#E0E0E0';
        ctx.fillRect(0, legendY + legendItemHeight * 2, 15, 15);
        ctx.fillStyle = '#2c3e50';
        ctx.fillText(`Not Started: ${stats.notStarted} surahs`, 20, legendY + legendItemHeight * 2 + 10);
        
        // Total entries legend
        ctx.fillStyle = '#3498db';
        ctx.fillRect(0, legendY + legendItemHeight * 3, 15, 15);
        ctx.fillStyle = '#2c3e50';
        ctx.fillText(`Journal Entries: ${stats.totalEntries}`, 20, legendY + legendItemHeight * 3 + 10);
    }

    renderProgressDetails(stats) {
        const container = document.getElementById('progress-details');
        
        if (stats.totalEntries === 0) {
            container.innerHTML = `
                <div class="progress-empty" style="grid-column: 1 / -1;">
                    <i class="fas fa-chart-pie"></i>
                    <h3>No Progress Data Yet</h3>
                    <p>Start adding journal entries to see your progress here.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="detail-item completed">
                <div class="detail-info">
                    <h4>Completed</h4>
                    <p>${stats.completed} surahs finished</p>
                </div>
                <span class="detail-number">${stats.completed}</span>
            </div>
            <div class="detail-item in-progress">
                <div class="detail-info">
                    <h4>In Progress</h4>
                    <p>${stats.inProgress} surahs being read</p>
                </div>
                <span class="detail-number">${stats.inProgress}</span>
            </div>
            <div class="detail-item not-started">
                <div class="detail-info">
                    <h4>Not Started</h4>
                    <p>${stats.notStarted} surahs to begin</p>
                </div>
                <span class="detail-number">${stats.notStarted}</span>
            </div>
            <div class="detail-item" style="border-left-color: #3498db;">
                <div class="detail-info">
                    <h4>Total Entries</h4>
                    <p>Journal reflections written</p>
                </div>
                <span class="detail-number">${stats.totalEntries}</span>
            </div>
        `;
    }

    loadHomepageData() {
        const stats = this.journalManager.getProgressStats();
        const recentEntries = this.journalManager.getEntries().slice(0, 3);
        
        // Update homepage stats
        document.getElementById('home-total-entries').textContent = stats.totalEntries;
        document.getElementById('home-completed').textContent = stats.completed;
        
        // Load recent entries
        this.renderRecentEntries(recentEntries);
    }

    renderRecentEntries(entries) {
        const container = document.getElementById('recent-entries');
        
        if (entries.length === 0) {
            container.innerHTML = `
                <div class="empty-state mini">
                    <i class="fas fa-book-open"></i>
                    <p>No recent entries</p>
                </div>
            `;
            return;
        }

        container.innerHTML = entries.map(entry => {
            const surah = this.currentSurahs.find(s => s.number === entry.surahNumber);
            const surahName = surah ? surah.englishName : `Surah ${entry.surahNumber}`;
            
            return `
                <div class="recent-entry">
                    <div class="recent-entry-header">
                        <h5>${surahName}</h5>
                        <span class="recent-date">${new Date(entry.updatedAt).toLocaleDateString()}</span>
                    </div>
                    <div class="recent-progress">
                        <span class="ayahs-count">${entry.ayahsCompleted} ayahs</span>
                        <span class="status-mini ${entry.status}"></span>
                    </div>
                </div>
            `;
        }).join('');
    }

    showPage(pageId) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        
        // Remove active class from all nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Show selected page and activate corresponding nav button
        document.getElementById(pageId).classList.add('active');
        document.querySelector(`[data-page="${pageId}"]`).classList.add('active');
        
        // Refresh data if needed
        if (pageId === 'home') {
            this.loadHomepageData();
        }
    }

    showError(message) {
        const errorEl = document.createElement('div');
        errorEl.className = 'message error';
        errorEl.textContent = message;
        document.body.appendChild(errorEl);
        
        setTimeout(() => {
            if (errorEl.parentNode) {
                errorEl.parentNode.removeChild(errorEl);
            }
        }, 5000);
    }

    showMessage(message, type = 'info') {
        const messageEl = document.createElement('div');
        messageEl.className = `message ${type}`;
        messageEl.textContent = message;
        document.body.appendChild(messageEl);
        
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.parentNode.removeChild(messageEl);
            }
        }, 3000);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new QuranJournalApp();
});