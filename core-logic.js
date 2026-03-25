/**
 * Core Logic Engine for Sheikh Academy
 * Features: Difficulty Balancing, Chapter Filtering, and Unique Question Selection
 */

const CoreLogic = {
    // ডিফল্ট কনফিগারেশন (পয়েন্ট ৫ অনুযায়ী যা শিক্ষক পরিবর্তন করতে পারবেন)
    ratios: {
        easy_mode: { easy: 50, medium: 50, hard: 0 },
        medium_mode: { easy: 20, medium: 60, hard: 20 },
        hard_mode: { easy: 0, medium: 30, hard: 70 }
    },

    /**
     * ডাটাবেস থেকে ইউনিক অধ্যায়গুলোর তালিকা বের করা (ড্রপডাউনের জন্য)
     * @param {Array} allQuestions - JSON থেকে আসা সব প্রশ্ন
     */
    getUniqueChapters: function(allQuestions) {
        const chapters = allQuestions.map(q => q.Chapter_No || q.Chapter);
        return [...new Set(chapters)].filter(Boolean).sort();
    },

    /**
     * শিক্ষক বা ছাত্রের চাহিদা অনুযায়ী প্রশ্ন ফিল্টার করা
     * @param {Array} data - মূল জেসন ডাটা
     * @param {Object} config - { selectedChapters: [], difficulty: 'medium_mode', totalLimit: 30, chapterLimits: {} }
     */
    filterQuestions: function(data, config) {
        let pool = [];

        // ১. অধ্যায় ভিত্তিক ফিল্টারিং (পয়েন্ট ২১ ও অধ্যায় নির্বাচন লজিক)
        if (config.selectedChapters && config.selectedChapters.length > 0) {
            pool = data.filter(q => config.selectedChapters.includes(q.Chapter_No || q.Chapter));
        } else {
            pool = [...data]; // কোনো অধ্যায় সিলেক্ট না করলে সব অধ্যায় থেকে নিবে
        }

        // ২. ডিফিকাল্টি অনুযায়ী গ্রুপ করা
        const easyGroup = pool.filter(q => q.Difficulty.toLowerCase() === 'easy');
        const mediumGroup = pool.filter(q => q.Difficulty.toLowerCase() === 'medium');
        const hardGroup = pool.filter(q => q.Difficulty.toLowerCase() === 'hard');

        const selectedQuestions = [];
        const ratio = this.ratios[config.difficulty] || this.ratios.medium_mode;

        // ৩. অনুপাত অনুযায়ী প্রশ্ন সংখ্যা নির্ধারণ (পয়েন্ট ৫ ও ১০)
        const targetEasy = Math.round((config.totalLimit * ratio.easy) / 100);
        const targetMedium = Math.round((config.totalLimit * ratio.medium) / 100);
        const targetHard = Math.round((config.totalLimit * ratio.hard) / 100);

        // ৪. রেন্ডম সিলেকশন ফাংশন (পয়েন্ট ১০ - প্রতিবার ভিন্ন সেট)
        const getRandom = (arr, count) => {
            const shuffled = [...arr].sort(() => 0.5 - Math.random());
            return shuffled.slice(0, count);
        };

        // ৫. প্রতিটি অধ্যায় থেকে নির্দিষ্ট সংখ্যা থাকলে তা হ্যান্ডেল করা
        if (config.chapterLimits && Object.keys(config.chapterLimits).length > 0) {
            // যদি শিক্ষক ম্যানুয়ালি প্রতি অধ্যায় থেকে সংখ্যা ঠিক করে দেন
            Object.entries(config.chapterLimits).forEach(([chapter, limit]) => {
                const chapterPool = pool.filter(q => (q.Chapter_No || q.Chapter) === chapter);
                selectedQuestions.push(...getRandom(chapterPool, limit));
            });
        } else {
            // অন্যথায় অটোমেটিক অনুপাত বজায় রাখা
            selectedQuestions.push(...getRandom(easyGroup, targetEasy));
            selectedQuestions.push(...getRandom(mediumGroup, targetMedium));
            selectedQuestions.push(...getRandom(hardGroup, targetHard));
        }

        return selectedQuestions;
    },

    /**
     * সৃজনশীল প্রশ্ন বাছাইয়ের লজিক
     * উদ্দীপক এবং ক,খ,গ,ঘ এর সমন্বয় বজায় রাখে
     */
    getCreativeSets: function(data, count) {
        const shuffled = [...data].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }
};

// গ্লোবাল এক্সেস বা মডিউল এক্সপোর্ট
if (typeof module !== 'undefined') {
    module.exports = CoreLogic;
} else {
    window.CoreLogic = CoreLogic;
}
