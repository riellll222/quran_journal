class QuranAPI {
    constructor() {
        this.baseURL = 'http://api.alquran.cloud/v1';
    }

    async fetchSurahs() {
        try {
            const response = await fetch(`${this.baseURL}/surah`);
            const data = await response.json();
            
            if (data.code === 200 && data.data) {
                return data.data.map(surah => ({
                    number: surah.number,
                    name: surah.name,
                    englishName: surah.englishName,
                    englishNameTranslation: surah.englishNameTranslation,
                    numberOfAyahs: surah.numberOfAyahs,
                    revelationType: surah.revelationType
                }));
            }
            throw new Error('Failed to fetch surahs');
        } catch (error) {
            console.error('API Error:', error);
            // Return sample data if API fails
            return this.getSampleSurahs();
        }
    }

    getSampleSurahs() {
        return [
            {
                number: 1,
                name: "الفاتحة",
                englishName: "Al-Fatiha",
                englishNameTranslation: "The Opening",
                numberOfAyahs: 7,
                revelationType: "Meccan"
            },
            {
                number: 2,
                name: "البقرة",
                englishName: "Al-Baqara",
                englishNameTranslation: "The Cow",
                numberOfAyahs: 286,
                revelationType: "Medinan"
            },
            {
                number: 3,
                name: "آل عمران",
                englishName: "Aal Imran",
                englishNameTranslation: "Family of Imran",
                numberOfAyahs: 200,
                revelationType: "Medinan"
            },
            {
                number: 4,
                name: "النساء",
                englishName: "An-Nisa",
                englishNameTranslation: "The Women",
                numberOfAyahs: 176,
                revelationType: "Medinan"
            },
            {
                number: 5,
                name: "المائدة",
                englishName: "Al-Ma'ida",
                englishNameTranslation: "The Table",
                numberOfAyahs: 120,
                revelationType: "Medinan"
            },
            {
                number: 6,
                name: "الأنعام",
                englishName: "Al-An'am",
                englishNameTranslation: "The Cattle",
                numberOfAyahs: 165,
                revelationType: "Meccan"
            },
            {
                number: 7,
                name: "الأعراف",
                englishName: "Al-A'raf",
                englishNameTranslation: "The Heights",
                numberOfAyahs: 206,
                revelationType: "Meccan"
            },
            {
                number: 8,
                name: "الأنفال",
                englishName: "Al-Anfal",
                englishNameTranslation: "The Spoils of War",
                numberOfAyahs: 75,
                revelationType: "Medinan"
            },
            {
                number: 9,
                name: "التوبة",
                englishName: "At-Tawba",
                englishNameTranslation: "The Repentance",
                numberOfAyahs: 129,
                revelationType: "Medinan"
            },
            {
                number: 10,
                name: "يونس",
                englishName: "Yunus",
                englishNameTranslation: "Jonah",
                numberOfAyahs: 109,
                revelationType: "Meccan"
            }
        ];
    }
}