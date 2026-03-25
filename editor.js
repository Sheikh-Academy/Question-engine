/**
 * Editor Engine for Sheikh Academy
 * Features: MS Word-like Editing, Formatting, MCQ Styles, Column Management, and Paper Sizing
 */

const Editor = {
    // ডিফল্ট সেটিংস (পয়েন্ট ২ ও ১১)
    settings: {
        paperSize: 'A4', // A4 or Letter
        mcqStyle: 'dot', // dot (ক.), circle (①), bracket_both ((ক)), bracket_right (ক))
        columns: 2,      // 1, 2, or 3
        showDivider: true,
        fontFamily: 'Kalpurush',
        fontSize: '16px'
    },

    /**
     * এডিটর মোড চালু করা (পয়েন্ট ২ - বাক্য ও বর্ণ সম্পাদনা)
     * @param {string} elementId - যে এলিমেন্টটি এডিটযোগ্য হবে
     */
    enableEditing: function(elementId) {
        const el = document.getElementById(elementId);
        if (el) {
            el.contentEditable = true;
            el.classList.add('sa-editable-area');
        }
    },

    /**
     * টেক্সট ফরম্যাটিং কমান্ড (বোল্ড, ইটালিক, আন্ডারলাইন, এলাইনমেন্ট)
     * @param {string} command - bold, italic, underline, justifyLeft, etc.
     */
    formatText: function(command, value = null) {
        document.execCommand(command, false, value);
    },

    /**
     * পেপার সাইজ সেট করা
     * [পয়েন্ট ১১ - সাদা পাতায় বোর্ড স্টাইল]
     */
    setPaperSize: function(size) {
        this.settings.paperSize = size;
        const paper = document.querySelector('.board-paper');
        if (paper) {
            paper.style.width = (size === 'A4') ? '210mm' : '215.9mm';
            paper.style.minHeight = (size === 'A4') ? '297mm' : '279.4mm';
        }
    },

    /**
     * কলাম লেআউট আপডেট করা
     * [পয়েন্ট ২২ - ২/৩ কলাম ও মার্জিন লজিক]
     */
    updateLayout: function(colCount, showDivider) {
        this.settings.columns = colCount;
        this.settings.showDivider = showDivider;
        
        const container = document.querySelector('.questions-container');
        if (container) {
            container.style.columnCount = colCount;
            container.style.columnGap = '30px';
            container.style.columnRule = showDivider ? '1px dashed #ccc' : 'none';
        }
    },

    /**
     * এমসিকিউ অপশন স্টাইল পরিবর্তন (ক. বনাম (ক) বনাম বৃত্ত)
     * [পয়েন্ট ১২ - অপশন ফরম্যাটিং]
     */
    applyMCQStyle: function(style) {
        this.settings.mcqStyle = style;
        const options = document.querySelectorAll('.option-prefix');
        
        options.forEach(opt => {
            let label = opt.getAttribute('data-label'); // ক, খ, গ, ঘ
            switch(style) {
                case 'dot': opt.innerText = `${label}.`; break;
                case 'bracket_both': opt.innerText = `(${label})`; break;
                case 'bracket_right': opt.innerText = `${label})`; break;
                case 'circle': 
                    const circles = {'ক': '①', 'খ': '②', 'গ': '③', 'ঘ': '④'};
                    opt.innerText = circles[label] || label;
                    break;
            }
        });
    },

    /**
     * হেডিং এডিট করা (স্কুল নাম, বিষয়, সময়)
     * [পয়েন্ট ১৯ - বিষয় কোড, সময় যুক্ত/বিযুক্ত]
     */
    updateHeaderInfo: function(field, value) {
        const el = document.querySelector(`.header-${field}`);
        if (el) el.innerText = value;
    },

    /**
     * স্পেসিং এবং ফন্ট সাইজ নিয়ন্ত্রণ
     */
    updateTypography: function(property, value) {
        const target = document.querySelector('.board-paper');
        if (target) {
            if (property === 'fontSize') target.style.fontSize = value + 'px';
            if (property === 'lineHeight') target.style.lineHeight = value;
        }
    }
};

// গ্লোবাল এক্সেস
window.Editor = Editor;
