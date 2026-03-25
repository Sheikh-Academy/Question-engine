/**
 * IndexedDB Handler for Sheikh Academy
 * Features: Auto-save drafts, local caching of 15,000+ questions, and recovery.
 * [পয়েন্ট ৮, ৯ - ইনডেক্সডডিবি সেটআপ ও ড্রাফট সেভ]
 */

const DBHandler = {
    dbName: 'SheikhAcademyDB',
    version: 1,
    db: null,

    /**
     * ডাটাবেস ইনিশিয়ালাইজ করা
     */
    init: function() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                // ১. প্রশ্নের ডাটা ক্যাশ করার জন্য স্টোর
                if (!db.objectStoreNames.contains('questions')) {
                    db.createObjectStore('questions', { keyPath: 'SL' });
                }
                // ২. শিক্ষকদের ড্রাফট বা অসম্পূর্ণ কাজ সেভ করার জন্য স্টোর
                if (!db.objectStoreNames.contains('drafts')) {
                    db.createObjectStore('drafts', { keyPath: 'id', autoIncrement: true });
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
     * ড্রাফট সেভ করা (পয়েন্ট ৯ - পরে এসে সেখান থেকে শুরু করা)
     * @param {Object} content - পুরো এডিটর বা প্রশ্নপত্রের বর্তমান অবস্থা
     */
    saveDraft: async function(content) {
        if (!this.db) await this.init();
        const transaction = this.db.transaction(['drafts'], 'readwrite');
        const store = transaction.objectStore('drafts');
        
        const draftData = {
            id: 'current_work', // একটি নির্দিষ্ট কি (Key) ব্যবহার করা যেন বারবার ওভাররাইট হয়
            data: content,
            timestamp: new Date().getTime()
        };
        
        store.put(draftData);
    },

    /**
     * সংরক্ষিত ড্রাফট ফিরে পাওয়া (পয়েন্ট ৯)
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
     * বিশাল জেসন ডাটা লোকালি লোড করে রাখা (পয়েন্ট ৮)
     * @param {Array} questionList - জেসন থেকে আসা ১৫,০০০ প্রশ্ন
     */
    cacheQuestions: async function(questionList) {
        if (!this.db) await this.init();
        const transaction = this.db.transaction(['questions'], 'readwrite');
        const store = transaction.objectStore('questions');
        
        questionList.forEach(q => store.put(q));
        console.log("সব প্রশ্ন লোকাল স্টোরেজে সেভ হয়েছে।");
    },

    /**
     * লোকাল স্টোরেজ থেকে প্রশ্ন রিড করা
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
