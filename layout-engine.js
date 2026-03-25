/**
 * Layout Engine for Sheikh Academy
 * Features: Multi-column balancing, Column break prevention, and Dynamic Margin.
 * [পয়েন্ট ৭, ১১, ২২ - ২/৩ কলাম লেআউট এবং মার্জিন নিয়ন্ত্রণ]
 */

const LayoutEngine = {
    /**
     * প্রশ্নের কন্টেইনারকে কলামে রূপান্তর করা
     * @param {string} containerId - 'questions-display'
     * @param {number} columns - ২ অথবা ৩
     */
    applyColumnLayout: function(containerId, columns = 2) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // ১. সিএসএস কলাম প্রোপার্টি সেট করা
        container.style.columnCount = columns;
        container.style.columnGap = '40px'; // মাঝখানের মার্জিন
        container.style.columnRule = '1px dashed #ccc'; // মাঝখানের ডিভাইডার লাইন
        
        // ২. প্রতিটি প্রশ্নের ব্রেকিং লজিক ঠিক করা
        const items = container.querySelectorAll('.mcq-item, .creative-question-set');
        items.forEach(item => {
            item.style.breakInside = 'avoid'; // প্রশ্ন যেন কলামের শেষে ভেঙ্গে না যায়
            item.style.marginBottom = '15px';
            item.style.display = 'block';
        });

        // ৩. ব্যালেন্সিং লজিক (কলামগুলো যেন সমান উচ্চতার হয়)
        container.style.columnFill = 'auto';
    },

    /**
     * কলামের মাঝখানের মার্জিন (Gutter) পরিবর্তন করা
     */
    updateMargin: function(containerId, marginSize) {
        const container = document.getElementById(containerId);
        if (container) {
            container.style.columnGap = marginSize + 'px';
        }
    },

    /**
     * লাইভ প্রিভিউতে লেআউট রিফ্রেশ করা
     * এটি ব্যবহার করা হয় যখন কোনো প্রশ্ন ডিলিট বা এডিট করা হয়
     */
    refreshLayout: function() {
        const currentCols = AppConfig.boardDefaults.defaultColumns || 2;
        this.applyColumnLayout('questions-display', currentCols);
    },

    /**
     * পেপার সাইজ অনুযায়ী ফন্ট অ্যাডজাস্টমেন্ট (পয়েন্ট ১১)
     */
    adjustFontSize: function(size) {
        const paper = document.getElementById('board-paper');
        if (paper) {
            paper.style.fontSize = size + 'px';
        }
    }
};

// গ্লোবাল এক্সেস
window.LayoutEngine = LayoutEngine;
