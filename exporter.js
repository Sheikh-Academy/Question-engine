/**
 * Exporter Engine for Sheikh Academy
 * Features: PDF Generation, Word (DOCX) Export, and Answer Key Generation.
 * [পয়েন্ট ৩, ৪, ১৮ - পিডিএফ/ওয়ার্ড ডাউনলোড ও উত্তরপত্র]
 */

const Exporter = {
    /**
     * প্রশ্নপত্র পিডিএফ হিসেবে ডাউনলোড করা (পয়েন্ট ৪)
     * @param {string} elementId - যে অংশটি পিডিএফ হবে (যেমন: .board-paper)
     * @param {string} fileName - ফাইলের নাম
     */
    downloadPDF: function(elementId, fileName = 'Question_Paper.pdf') {
        const element = document.getElementById(elementId);
        if (!element) return;

        // পিডিএফ সেটআপ (বোর্ড পরীক্ষার স্ট্যান্ডার্ড অনুযায়ী)
        const opt = {
            margin:       [10, 10, 10, 10], // উপরে, বামে, নিচে, ডানে মার্জিন (mm)
            filename:     fileName,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true }, // হাই-রেজোলিউশন স্কেল
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        // পিডিএফ জেনারেশন শুরু
        html2pdf().set(opt).from(element).save();
    },

    /**
     * এমএস ওয়ার্ড (DOCX) ফরম্যাটে ডাউনলোড করা (পয়েন্ট ৪)
     * @param {string} elementId - কন্টেন্ট আইডি
     */
    downloadWord: function(elementId, fileName = 'Question_Paper.docx') {
        const content = document.getElementById(elementId).innerHTML;
        
        // ওয়ার্ড ফাইলের জন্য বেসিক এইচটিএমএল স্ট্রাকচার ও ফন্ট সাপোর্ট
        const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' "+
            "xmlns:w='urn:schemas-microsoft-com:office:word' "+
            "xmlns='http://www.w3.org/TR/REC-html40'>"+
            "<head><meta charset='utf-8'><title>Export</title>"+
            "<style>body { font-family: 'Kalpurush', 'Times New Roman', serif; }</style></head><body>";
        const footer = "</body></html>";
        const sourceHTML = header + content + footer;
        
        // ব্লব (Blob) তৈরি করে ডাউনলোড করা
        const blob = new Blob(['\ufeff', sourceHTML], {
            type: 'application/msword'
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
    },

    /**
     * উত্তরপত্র তৈরি ও ডাউনলোড (পয়েন্ট ১৮)
     * @param {Array} answerData - Shuffler থেকে আসা উত্তরপত্রের ডাটা
     * @param {string} setName - সেটের নাম (ক/খ/গ/ঘ)
     */
    downloadAnswerKey: function(answerData, setName = 'ক') {
        // একটি ইন-মেমোরি টেমপ্লেট তৈরি করা
        let html = `<div style="padding:20px; font-family:'Kalpurush', sans-serif;">
            <h2 style="text-align:center;">উত্তরপত্র - সেট: ${setName}</h2>
            <table border="1" style="width:100%; border-collapse:collapse; text-align:center;">
                <thead>
                    <tr style="background:#f2f2f2;">
                        <th>প্রশ্ন নং</th>
                        <th>সঠিক উত্তর</th>
                        <th>ব্যাখ্যা</th>
                    </tr>
                </thead>
                <tbody>`;

        answerData.forEach(item => {
            html += `<tr>
                <td style="padding:8px;">${item.no}</td>
                <td style="padding:8px;">${item.answer}</td>
                <td style="padding:8px; text-align:left;">${item.explanation || '-'}</td>
            </tr>`;
        });

        html += `</tbody></table></div>`;

        // এটি একটি টেম্পোরারি এলিমেন্টে বসিয়ে পিডিএফ করা
        const tempDiv = document.createElement('div');
        tempDiv.id = 'temp-answer-key';
        tempDiv.innerHTML = html;
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        document.body.appendChild(tempDiv);

        this.downloadPDF('temp-answer-key', `Answer_Key_Set_${setName}.pdf`);
        
        // কাজ শেষে ডিলিট করা
        setTimeout(() => document.body.removeChild(tempDiv), 1000);
    }
};

// গ্লোবাল এক্সেস
window.Exporter = Exporter;
