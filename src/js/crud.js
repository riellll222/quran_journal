class JournalManager {
    constructor() {
        this.entries = [];
        this.loadData();
    }

    async loadData() {
        try {
            console.log('Loading journal data...');
            if (window.electronAPI && window.electronAPI.readJournalData) {
                const data = await window.electronAPI.readJournalData();
                this.entries = data.entries || [];
                console.log('Loaded entries from Electron:', this.entries.length);
            } else {
                // Fallback for browser testing
                const saved = localStorage.getItem('quran-journal-entries');
                this.entries = saved ? JSON.parse(saved) : [];
                console.log('Loaded entries from localStorage:', this.entries.length);
            }
        } catch (error) {
            console.error('Error loading journal data:', error);
            this.entries = [];
        }
    }

    async saveData() {
        try {
            const data = { 
                entries: this.entries, 
                lastUpdated: new Date().toISOString() 
            };
            
            console.log('Saving data:', data);
            
            if (window.electronAPI && window.electronAPI.saveJournalData) {
                const result = await window.electronAPI.saveJournalData(data);
                console.log('Electron save result:', result);
                return result.success;
            } else {
                // Fallback for browser testing
                localStorage.setItem('quran-journal-entries', JSON.stringify(this.entries));
                console.log('Saved to localStorage');
                return true;
            }
        } catch (error) {
            console.error('Error saving journal data:', error);
            return false;
        }
    }

    // CREATE
    async createEntry(entryData) {
        console.log('Creating new entry:', entryData);
        
        const newEntry = {
            id: Date.now().toString(),
            ...entryData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        this.entries.push(newEntry);
        console.log('Entries after push:', this.entries);
        
        const success = await this.saveData();
        
        if (success) {
            console.log('Entry created successfully');
            return { success: true, entry: newEntry };
        }
        console.error('Failed to save entry');
        return { success: false, error: 'Failed to save entry' };
    }

    // READ
    getEntries() {
        return this.entries.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    }

    getEntryById(id) {
        return this.entries.find(entry => entry.id === id);
    }

    getEntriesBySurah(surahNumber) {
        return this.entries.filter(entry => entry.surahNumber === surahNumber);
    }

    // UPDATE
    async updateEntry(id, updatedData) {
        console.log('Updating entry:', id, updatedData);
        
        const index = this.entries.findIndex(entry => entry.id === id);
        if (index !== -1) {
            this.entries[index] = {
                ...this.entries[index],
                ...updatedData,
                updatedAt: new Date().toISOString()
            };
            
            const success = await this.saveData();
            if (success) {
                console.log('Entry updated successfully');
                return { success: true, entry: this.entries[index] };
            }
            return { success: false, error: 'Failed to update entry' };
        }
        return { success: false, error: 'Entry not found' };
    }

    // DELETE
    async deleteEntry(id) {
        console.log('Deleting entry:', id);
        
        const index = this.entries.findIndex(entry => entry.id === id);
        if (index !== -1) {
            this.entries.splice(index, 1);
            const success = await this.saveData();
            
            if (success) {
                console.log('Entry deleted successfully');
                return { success: true };
            }
            return { success: false, error: 'Failed to delete entry' };
        }
        return { success: false, error: 'Entry not found' };
    }

    // Progress tracking - Fixed calculation
    getProgressStats() {
        const totalSurahs = 114;
        
        // Get all unique surahs that have entries
        const surahsWithEntries = new Set(this.entries.map(entry => entry.surahNumber));
        
        // For each surah with entries, determine its status based on the most recent entry
        const surahStatus = {};
        
        this.entries.forEach(entry => {
            const surahNumber = entry.surahNumber;
            // Only update if this entry is more recent or we don't have a status yet
            if (!surahStatus[surahNumber] || 
                new Date(entry.updatedAt) > new Date(surahStatus[surahNumber].updatedAt)) {
                surahStatus[surahNumber] = {
                    status: entry.status,
                    updatedAt: entry.updatedAt
                };
            }
        });
        
        // Count surahs by status
        let completed = 0;
        let inProgress = 0;
        let notStarted = 0;
        
        Object.values(surahStatus).forEach(statusInfo => {
            switch (statusInfo.status) {
                case 'completed':
                    completed++;
                    break;
                case 'in-progress':
                    inProgress++;
                    break;
                case 'not-started':
                    notStarted++;
                    break;
            }
        });
        
        // Surahs without any entries are considered not started
        notStarted = totalSurahs - completed - inProgress;
        
        const totalEntries = this.entries.length;
        
        console.log('Progress calculation:', {
            totalSurahs,
            completed,
            inProgress,
            notStarted,
            totalEntries,
            surahsWithEntries: Array.from(surahsWithEntries),
            surahStatus
        });
        
        return {
            totalSurahs,
            completed,
            inProgress,
            notStarted,
            totalEntries
        };
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