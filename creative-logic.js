/**
 * Creative Question Logic for Sheikh Academy
 * Features: Stimulus rendering (Justified), Marks allocation (Right-aligned), 
 * and strictly vertical question layout.
 * [পয়েন্ট ৩ - সৃজনশীল প্রশ্ন ও নম্বর বিন্যাস লজিক]
 */

const CreativeLogic = {
    /**
     * সৃজনশীল প্রশ্নের কন্টেন্ট তৈরি করা
     * @param {Object} qData - জেসন থেকে আসা একটি সৃজনশীল প্রশ্নের ডাটা
     * @param {number} index - প্রশ্নের ক্রমিক নম্বর
     */
    renderCreativeSet: function(qData, index) {
        const lang = Utils.detectLanguage(qData.Stimulus || "");
        const serial = Utils.toBengaliNumber(index, lang);

        return `
            <div class="creative-question-set" id="cq-${qData.SL}" style="margin-bottom: 30px;">
                <!-- উদ্দীপক অংশ (জাস্টিফাইড এলাইনমেন্ট) -->
                <div class="cq-header" style="margin-bottom: 15px;">
                    <div style="display: flex; gap: 10px;">
                        <strong>${serial}. </strong>
                        <div class="stimulus-text sa-editable-area" 
                             contenteditable="true" 
                             style="text-align: justify; flex: 1; line-height: 1.6;">
                            ${qData.Stimulus}
                        </div>
                    </div>
                </div>

                <!-- উপ-প্রশ্নসমূহ (সবসময় নিচে নিচে) -->
                <div class="cq-sub-questions">
                    ${this.renderSubQuestion('ক', qData.Question_Ka, 1, lang)}
                    ${this.renderSubQuestion('খ', qData.Question_Kha, 2, lang)}
                    ${this.renderSubQuestion('গ', qData.Question_Ga, 3, lang)}
                    ${this.renderSubQuestion('ঘ', qData.Question_Gha, 4, lang)}
                </div>
            </div>
        `;
    },

    /**
     * উপ-প্রশ্ন (ক,খ,গ,ঘ) রেন্ডার করা
     * নম্বরগুলো (১,২,৩,৪) একদম ডানপাশে মার্জিনের কাছে থাকবে
     */
    renderSubQuestion: function(label, text, marks, lang) {
        const marksText = Utils.toBengaliNumber(marks, lang);
        return `
            <div class="sub-q-row" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; width: 100%;">
                <div style="display: flex; gap: 8px; flex: 1;">
                    <span class="sub-q-label" style="font-weight: bold;">${label}.</span>
                    <span class="sub-q-text sa-editable-area" contenteditable="true" style="flex: 1; text-align: justify;">
                        ${text}
                    </span>
                </div>
                <div class="sub-q-marks" style="min-width: 20px; text-align: right; font-weight: bold; margin-left: 20px;">
                    ${marksText}
                </div>
            </div>
        `;
    },

    /**
     * বহুনির্বাচনী প্রশ্নের জন্য আগের লজিক (প্রয়োজন হলে ব্যবহারের জন্য সংরক্ষিত)
     */
    calculateOptionLayout: function(options) {
        let maxLength = 0;
        options.forEach(opt => {
            if (opt.length > maxLength) maxLength = opt.length;
        });

        if (maxLength < 10) return 'layout-1-line';
        else if (maxLength < 25) return 'layout-2-lines';
        else return 'layout-4-lines';
    }
};

// গ্লোবাল এক্সেস
window.CreativeLogic = CreativeLogic;
