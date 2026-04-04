/**
 * Sheikh Academy - Master Data & IndexedDB Handler
 * Features: Centralized JSON management, Auto-save drafts, 15k+ Question Caching.
 * [পয়েন্ট ৮, ৯ - ডাটা সোর্স ও ইনডেক্সডডিবি সেটআপ]
 */

const DBHandler = {
    dbName: 'SheikhAcademyDB',
    version: 1,
    db: null,

    // ১. জেসন ডাটা কনফিগারেশন (সরাসরি হ্যান্ডলারের ভেতর)
    config: {
        basePath: './data/questions/',
        sources: {
            'physics': {
                'mcq': 'physics_mcq_15k.json',
                'creative': 'physics_cq.json'
            },
            'chemistry': {
                'mcq': 'chemistry_mcq_all.json',
                'creative': 'chemistry_cq.json'
            },
            'biology': {
                'mcq': 'biology_mcq_v1.json',
                'creative': 'biology_cq_v1.json'
            },
            'math': {
                'mcq': 'higher_math_mcq.json',
                'creative': 'higher_math_cq.json'
            },
            'ict': {
                'mcq': 'ict_mcq_bank.json'
            },
            'english': {
                'grammar': 'english_grammar_rules.json'
            }
            // নতুন জেসন ফাইল এখানে যোগ করবেন
        }
    },

    /**
     * ডাটাবেস ইনিশিয়ালাইজ করা
     */
    init: function() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                // প্রশ্নের ডাটা স্টোর (Key হিসেবে SL ব্যবহার করা হয়েছে আপনার রিকোয়ারমেন্ট অনুযায়ী)
                if (!db.objectStoreNames.contains('questions')) {
                    db.createObjectStore('questions', { keyPath: 'SL' });
                }
                // ড্রাফট সেভ করার স্টোর
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
     * নির্দিষ্ট বিষয় ও টাইপ অনুযায়ী ডাটা সিঙ্ক করা
     */
    async syncQuestions(subject, type) {
        const file = this.config.sources[subject] ? this.config.sources[subject][type] : null;
        if (!file) {
            console.error("ফাইল কনফিগারেশনে পাওয়া যায়নি!");
            return;
        }

        const url = this.config.basePath + file;
        try {
            const response = await fetch(url);
            const questions = await response.json();
            await this.cacheQuestions(questions);
            return questions;
        } catch (error) {
            console.error("ডাটা লোড করতে সমস্যা হয়েছে:", error);
        }
    },

    /**
     * জেসন থেকে আসা প্রশ্নগুলো লোকাল ডিবিতে সেভ করা
     */
    cacheQuestions: async function(questionList) {
        if (!this.db) await this.init();
        const transaction = this.db.transaction(['questions'], 'readwrite');
        const store = transaction.objectStore('questions');
        
        questionList.forEach(q => store.put(q));
        return new Promise((resolve) => {
            transaction.oncomplete = () => {
                console.log("সব প্রশ্ন লোকাল স্টোরেজে সংরক্ষিত হয়েছে।");
                resolve();
            };
        });
    },

    /**
     * ড্রাফট সেভ করা (পয়েন্ট ৯)
     */
    saveDraft: async function(content) {
        if (!this.db) await this.init();
        const transaction = this.db.transaction(['drafts'], 'readwrite');
        const store = transaction.objectStore('drafts');
        
        const draftData = {
            id: 'current_work',
            data: content,
            timestamp: new Date().getTime()
        };
        
        store.put(draftData);
    },

    /**
     * ড্রাফট লোড করা
     */
    loadDraft: async function() {
        if (!this.db) await this.init();
        return new Promise((resolve) => {
            const transaction = this.db.transaction(['drafts'], 'readonly');
            const store = transaction.objectStore('drafts');
            const request = store.get('current_work');
            
            request.onsuccess = () => resolve(request.result ? request.result.data : null);
        });
    },

    /**
     * সব প্রশ্ন রিড করা
     */
    getAllQuestions: async function() {
        if (!this.db) await this.init();
        return new Promise((resolve) => {
            const transaction = this.db.transaction(['questions'], 'readonly');
            const store = transaction.objectStore('questions');
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result);
        });
    }
};

// গ্লোবাল এক্সেস
window.DBHandler = DBHandler;
