/**
 * Filter Engine for Sheikh Academy
 * Features: Chapter-wise filtering, Board Question Archive, Tag-based suggestions.
 * [পয়েন্ট ১৪, ২১ - অধ্যায় ও বোর্ড ভিত্তিক ফিল্টারিং]
 */

const FilterEngine = {
    /**
     * ডাটা ফিল্টার করা (অধ্যায়, বোর্ড, এবং বছর অনুযায়ী)
     * @param {Array} allQuestions - ডাটাবেস থেকে আসা সব প্রশ্ন
     * @param {Object} criteria - ফিল্টারিং ক্রাইটেরিয়া { chapter, board, year, type }
     */
    filter: function(allQuestions, criteria) {
        if (!allQuestions || !Array.isArray(allQuestions)) return [];

        return allQuestions.filter(q => {
            let match = true;

            // ১. অধ্যায় ভিত্তিক ফিল্টারিং (পয়েন্ট ১৪)
            if (criteria.chapter && q.Chapter !== criteria.chapter) {
                match = false;
            }

            // ২. বোর্ড প্রশ্নের আর্কাইভ (পয়েন্ট ২১)
            // বোর্ড এবং বছর চেক করা (যেমন: ঢাকা বোর্ড ২০২৩)
            if (criteria.board && q.Board !== criteria.board) {
                match = false;
            }
            if (criteria.year && q.Year.toString() !== criteria.year.toString()) {
                match = false;
            }

            // ৩. প্রশ্নের ধরন (সৃজনশীল বা এমসিকিউ)
            if (criteria.type && q.Type !== criteria.type) {
                match = false;
            }

            return match;
        });
    },

    /**
     * ট্যাগ বা কি-ওয়ার্ড ভিত্তিক সার্চ (সাজেশন ইঞ্জিন)
     * @param {Array} questions - প্রশ্নের তালিকা
     * @param {string} keyword - যা লিখে সার্চ করা হচ্ছে
     */
    searchByTag: function(questions, keyword) {
        if (!keyword) return questions;
        const lowKey = keyword.toLowerCase();

        return questions.filter(q => {
            // প্রশ্ন, উদ্দীপক বা ট্যাগ কলামে কি-ওয়ার্ড আছে কি না দেখা
            return (
                (q.Question && q.Question.toLowerCase().includes(lowKey)) ||
                (q.Stimulus && q.Stimulus.toLowerCase().includes(lowKey)) ||
                (q.Tags && q.Tags.toLowerCase().includes(lowKey))
            );
        });
    },

    /**
     * ইউনিক অধ্যায় বা বোর্ডের তালিকা বের করা (ড্রপডাউনের জন্য)
     */
    getUniqueValues: function(questions, column) {
        const values = questions.map(q => q[column]).filter(v => v);
        return [...new Set(values)].sort();
    },

    /**
     * স্মার্ট সাজেশন (পয়েন্ট ১৪ - নির্দিষ্ট ট্যাগ খোঁজা)
     * একই ধরনের বা রিলেটেড প্রশ্ন সাজেস্ট করা
     */
    getRelatedQuestions: function(allQuestions, currentQuestion) {
        if (!currentQuestion.Tags) return [];
        const tags = currentQuestion.Tags.split(',');
        
        return allQuestions.filter(q => {
            if (q.SL === currentQuestion.SL) return false; // নিজের সাথে তুলনা বাদ
            return tags.some(tag => q.Tags && q.Tags.includes(tag.trim()));
        }).slice(0, 5); // সেরা ৫টি সাজেশন
    }
};

// গ্লোবাল এক্সেস
window.FilterEngine = FilterEngine;
