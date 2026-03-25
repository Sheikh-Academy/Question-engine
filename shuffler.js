/**
 * Shuffler Engine for Sheikh Academy
 * Features: Set Generation (A, B, C, D), Question Shuffling, Option Shuffling, and Answer Key Mapping
 */

const Shuffler = {
    
    /**
     * অ্যারে শাফলিং লজিক (Fisher-Yates Algorithm)
     * [পয়েন্ট ১৬ ও ২০ - লজিক যা সব প্রশ্নে কার্যকর হবে]
     */
    shuffleArray: function(array) {
        let currentIndex = array.length, randomIndex;
        const newArray = [...array];
        while (currentIndex !== 0) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            [newArray[currentIndex], newArray[randomIndex]] = [
                newArray[randomIndex], newArray[currentIndex]];
        }
        return newArray;
    },

    /**
     * অপশন শাফলিং লজিক
     * [পয়েন্ট ১২ - বহুনির্বাচনী প্রশ্নের অপশন ওলটপালট করা]
     */
    shuffleOptions: function(question) {
        // ১ থেকে ৪ পর্যন্ত অপশন ইনডেক্স
        const optionIndices = [1, 2, 3, 4];
        const shuffledIndices = this.shuffleArray(optionIndices);
        
        const newOptions = {};
        let newCorrectAnswer = "";

        shuffledIndices.forEach((oldIdx, newIdx) => {
            const currentLabel = `Option_${oldIdx}`;
            const newLabel = `Option_${newIdx + 1}`;
            newOptions[newLabel] = question[currentLabel];
            
            // যদি এই অপশনটি সঠিক উত্তর হয়, তবে নতুন ইনডেক্স আপডেট করা
            if (oldIdx.toString() === question.Correct_Answer.toString()) {
                newCorrectAnswer = (newIdx + 1).toString();
            }
        });

        return { ...question, ...newOptions, Correct_Answer: newCorrectAnswer };
    },

    /**
     * প্রশ্নপত্রের সেট তৈরি করা (ক, খ, গ, ঘ)
     * [পয়েন্ট ১৬ - একই প্রশ্নগুলো আলাদা জায়গায় ক্রম পরিবর্তন করা]
     * @param {Array} questions - নির্বাচিত প্রশ্নের তালিকা
     * @param {number} numberOfSets - কয়টি সেট হবে (১-৪)
     * @param {boolean} shuffleOpts - অপশন শাফলিং হবে কি না
     */
    generateSets: function(questions, numberOfSets = 1, shuffleOpts = false) {
        const sets = [];
        const setNames = ["ক", "খ", "গ", "ঘ"];

        for (let i = 0; i < numberOfSets; i++) {
            // প্রশ্নগুলো শাফলিং করা
            let shuffledQuestions = this.shuffleArray(questions);

            // যদি অপশন শাফলিং অন থাকে
            if (shuffleOpts) {
                shuffledQuestions = shuffledQuestions.map(q => this.shuffleOptions(q));
            }

            // উত্তরপত্র তৈরি করা (পয়েন্ট ১৮ - সেট অনুযায়ী আলাদা উত্তরপত্র)
            const answerKey = shuffledQuestions.map((q, idx) => ({
                no: idx + 1,
                answer: q.Correct_Answer,
                explanation: q.Explanation || ""
            }));

            sets.push({
                setName: setNames[i],
                questions: shuffledQuestions,
                answerKey: answerKey
            });
        }

        return sets;
    }
};

// গ্লোবাল এক্সেস বা মডিউল এক্সপোর্ট
if (typeof module !== 'undefined') {
    module.exports = Shuffler;
} else {
    window.Shuffler = Shuffler;
}
