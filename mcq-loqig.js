/**
 * MCQ Question Logic for Sheikh Academy
 * Features: Smart Option Layout (1-line, 2-line, 4-line), 
 * Automatic Serial Conversion, and Inline Editing.
 * [পয়েন্ট ১২ - বহুনির্বাচনী প্রশ্নের স্মার্ট লেআউট লজিক]
 */

const MCQLogic = {
    /**
     * বহুনির্বাচনী প্রশ্ন রেন্ডার করা
     * @param {Object} qData - জেসন থেকে আসা একটি এমসিকিউ প্রশ্নের ডাটা
     * @param {number} index - প্রশ্নের ক্রমিক নম্বর
     */
    renderMCQ: function(qData, index) {
        const lang = Utils.detectLanguage(qData.Question || "");
        const serial = Utils.toBengaliNumber(index, lang);
        
        // অপশনগুলোর তালিকা
        const options = [
            { label: 'ক', text: qData.Option_1 },
            { label: 'খ', text: qData.Option_2 },
            { label: 'গ', text: qData.Option_3 },
            { label: 'ঘ', text: qData.Option_4 }
        ];

        // লেআউট নির্ধারণ করা (আপনার শর্ত অনুযায়ী)
        const layoutClass = this.calculateLayout(options.map(o => o.text));

        return `
            <div class="mcq-item" id="mcq-${qData.SL}" style="margin-bottom: 20px; break-inside: avoid;">
                <div class="mcq-question" style="display: flex; gap: 8px; margin-bottom: 8px;">
                    <strong class="q-serial">${serial}.</strong>
                    <div class="q-text sa-editable-area" contenteditable="true" style="flex: 1; text-align: justify;">
                        ${qData.Question}
                    </div>
                </div>
                
                <div class="options-grid ${layoutClass}" style="${this.getLayoutStyle(layoutClass)}">
                    ${options.map(opt => `
                        <div class="option-row" style="display: flex; gap: 5px; align-items: baseline;">
                            <span class="opt-label" style="font-weight: bold;">${opt.label}.</span>
                            <span class="opt-text sa-editable-area" contenteditable="true">${opt.text}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    /**
     * অপশন লেআউট ক্যালকুলেশন লজিক
     * [পয়েন্ট ১২ - জায়গা অনুযায়ী ১, ২ বা ৪ লাইনে বিন্যাস]
     */
    calculateLayout: function(optionTexts) {
        // সবচেয়ে বড় অপশনের দৈর্ঘ্য বের করা
        let maxLen = 0;
        optionTexts.forEach(text => {
            const len = text ? text.toString().length : 0;
            if (len > maxLen) maxLen = len;
        });

        // ১. যদি অপশন খুব ছোট হয় (সবগুলো এক লাইনে)
        if (maxLen <= 10) {
            return 'layout-inline'; 
        } 
        // ২. যদি মাঝারি হয় (এক লাইনে ২টা করে, মোট ২ লাইন)
        else if (maxLen <= 22) {
            return 'layout-double';
        } 
        // ৩. যদি বড় হয় (প্রতি লাইনে ১টি করে, মোট ৪ লাইন)
        else {
            return 'layout-vertical';
        }
    },

    /**
     * লেআউট অনুযায়ী সিএসএস গ্রিড স্টাইল রিটার্ন করা
     */
    getLayoutStyle: function(layoutClass) {
        switch(layoutClass) {
            case 'layout-inline': 
                return 'display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;';
            case 'layout-double': 
                return 'display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px 15px;';
            case 'layout-vertical': 
                return 'display: grid; grid-template-columns: 1fr; gap: 5px;';
            default: 
                return 'display: grid; grid-template-columns: 1fr;';
        }
    }
};

// গ্লোবাল এক্সেস
window.MCQLogic = MCQLogic;
