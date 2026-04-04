/**
 * Sheikh Academy - Master Data & GitHub JSON Handler
 * গিটহাব থেকে সরাসরি বিশাল জেসন ডাটা লোড করার কনফিগারেশন।
 */

const DBHandler = {
    dbName: 'SheikhAcademyDB',
    version: 1,
    db: null,

    // ১. ডাটা কনফিগারেশন
    config: {
        // গিটহাবের র (Raw) কন্টেন্ট ইউআরএল বেস হিসেবে ব্যবহার করুন
        // উদাহরণ: 'https://raw.githubusercontent.com/[Username]/[Repo]/[Branch]/[Folder]/'
        basePath: 'https://raw.githubusercontent.com/your-username/sheikh-academy-data/main/questions/',

        sources: {
            'physics': {
                'mcq': 'physics_mcq_15k.json', // পূর্ণ পথ হবে: basePath + filename
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
            },
            'biology': {
                // আপনি চাইলে নির্দিষ্ট ফাইলের জন্য পুরো গিটহাব লিঙ্কও সরাসরি দিতে পারেন
                'mcq': 'https://raw.githubusercontent.com/user/repo/main/bio_mcq.json'
            }
            // এভাবেই ১৫টি বা তার বেশি লিঙ্ক এখানে যোগ করবেন
        }
    },

    /**
     * সঠিক ইউআরএল তৈরি করার ফাংশন
     */
    getFileUrl: function(subject, type) {
        const file = this.config.sources[subject] ? this.config.sources[subject][type] : null;
        if (!file) return null;

        // যদি ফাইলটি 'http' দিয়ে শুরু হয় তবে সেটি সরাসরি রিটার্ন করবে, নতুবা basePath যোগ করবে
        return file.startsWith('http') ? file : this.config.basePath + file;
    },

    /**
     * ডাটাবেস ইনিশিয়ালাইজেশন
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
     * গিটহাব থেকে ডাটা সিঙ্ক এবং ক্যাশ করা (পয়েন্ট ৮)
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
     * জেসন থেকে আসা প্রশ্নগুলো IndexedDB-তে সেভ করা
     */
    cacheQuestions: async function(questionList) {
        if (!this.db) await this.init();
        const transaction = this.db.transaction(['questions'], 'readwrite');
        const store = transaction.objectStore('questions');
        
        // একসাথে অনেক ডাটা সেভ করার জন্য লুপ
        questionList.forEach(q => store.put(q));
        
        return new Promise((resolve) => {
            transaction.oncomplete = () => {
                console.log("গিটহাবের সব ডাটা লোকাল ডিবিতে সংরক্ষিত হয়েছে।");
                resolve();
            };
        });
    },

    // ... (অন্যান্য ফাংশন যেমন saveDraft, loadDraft আগের মতোই থাকবে)
};

window.DBHandler = DBHandler;
