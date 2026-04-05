/**
 * Sheikh Academy - Master Data & GitHub JSON Handler
 * গিটহাব থেকে সরাসরি বিশাল জেসন ডাটা লোড করার কনফিগারেশন।
 */

const DBHandler = {
    dbName: 'SheikhAcademyDB',
    version: 1,
    db: null,

    // ================= CONFIG =================
    config: {
        basePath: 'https://raw.githubusercontent.com/Sheikh-Academy/json-file-for-cq-and-mcq-for-all-class/refs/heads/main/',

        sources: {
            "class-4": ["bangla", "english", "math", "science"],
            "class-5": ["bangla", "english", "math", "science"],
            "class-6": ["bangla-1st", "bangla-2nd", "english-1st", "english-2nd", "math", "bangladesh-and-global-studies", "islam", "agriculture", "science", "ict"],
            "class-7": ["bangla-1st", "bangla-2nd", "english-1st", "english-2nd", "math", "bangladesh-and-global-studies", "islam", "agriculture", "science", "ict"],
            "class-8": ["bangla-1st", "bangla-2nd", "english-1st", "english-2nd", "math", "bangladesh-and-global-studies", "islam", "agriculture", "science", "ict"],
            "class-9-10": ["bangla-1st", "bangla-2nd", "english-1st", "english-2nd", "math", "islam", "agriculture", "science", "ict", "physics", "chemistry", "biology", "bangladesh-and-global-studies", "civivcs", "history", "gekography", "accounting", "business-management", "bangking-and-finanace"],
            "class-11-12": ["bangla-1st", "bangla-2nd", "english-1st", "english-2nd", "math", "islam", "agriculture", "science", "ict", "physics", "chemistry", "biology", "bangladesh-and-global-studies", "civivcs", "history", "gekography", "accounting", "business-management", "bangking-and-finanace"]
            }
    },

    /**
     * 🔑 class + subject → key বানানোর helper
     * example: class-7 + math → class-7-math
     */
    makeKey: function(className, subject) {
        return `${className}-${subject}`;
    },

    /**
     * 🔗 URL তৈরি করার ফাংশন
     * input: class-7-math + mcq
     * output: class-7/mcq/math.json
     */
    getFileUrl: function(subject, type) {

        if (!subject || !type) return null;

        const parts = subject.split("-");

        if (parts.length < 3) return null;

        const className = parts[0] + "-" + parts[1]; // class-7
        const subName = parts.slice(2).join("-");   // math / bangla-1st

        return `${this.config.basePath}${className}/${type}/${subName}.json`;
    },

    /**
     * 📦 IndexedDB init
     */
    init: function() {
        return new Promise((resolve, reject) => {

            const request = indexedDB.open(this.dbName, this.version);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                if (!db.objectStoreNames.contains('questions')) {
                    db.createObjectStore('questions', { keyPath: 'SL' });
                }

                if (!db.objectStoreNames.contains('drafts')) {
                    db.createObjectStore('drafts', { keyPath: 'id' });
                }
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };

            request.onerror = (event) => reject('Database error: ' + event.target.errorCode);
        });
    },

    /**
     * 🌐 GitHub থেকে ডাটা লোড
     * example:
     * DBHandler.syncQuestions("class-7-bangla-2nd", "mcq")
     */
    async syncQuestions(subject, type) {

        const url = this.getFileUrl(subject, type);

        if (!url) {
            console.error("ইউআরএল পাওয়া যায়নি!");
            return;
        }

        try {
            console.log(`লোডিং: ${url}`);

            const response = await fetch(url);
            if (!response.ok) throw new Error('Network response was not ok');

            const questions = await response.json();

            await this.cacheQuestions(questions);

            return questions;

        } catch (error) {
            console.error("গিটহাব থেকে ডাটা লোড করতে সমস্যা:", error);
        }
    },

    /**
     * 💾 IndexedDB-তে সেভ
     */
    cacheQuestions: async function(questionList) {

        if (!this.db) await this.init();

        const transaction = this.db.transaction(['questions'], 'readwrite');
        const store = transaction.objectStore('questions');

        questionList.forEach(q => store.put(q));

        return new Promise((resolve) => {
            transaction.oncomplete = () => {
                console.log("ডাটা লোকাল DB-তে সেভ হয়েছে");
                resolve();
            };
        });
    }

    // 👉 তোমার অন্যান্য ফাংশন (saveDraft, loadDraft) আগের মতোই থাকবে
};

window.DBHandler = DBHandler;
