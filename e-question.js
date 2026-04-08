// <![CDATA[
/**
 * ============================================================
 *  SHEIKH ACADEMY — COMBINED JAVASCRIPT
 *  সব মডিউল একত্রিত করা হয়েছে Blogger-এর জন্য।
 *  Dependency Order:
 *    1. Utils (config.js)
 *    2. DBHandler (db-handler.js)
 *    3. CoreLogic (core-logic.js)
 *    4. FilterEngine (filter-engine.js)
 *    5. Shuffler (shuffler.js)
 *    6. MCQLogic (mcq-loqig.js)
 *    7. CreativeLogic (creative-logic.js)
 *    8. LayoutEngine (layout-engine.js)
 *    9. OMRGenerator (omr-generator.js)
 *   10. ThemeManager (theme-manager.js)
 *   11. Exporter (exporter.js)
 *   12. Editor (editor.js)
 *   13. SidebarControls (sidebar-controls.js)
 *   14. SuggestionView (suggestion-view.js)
 *   15. StudentPanel (student-panel.js)
 *   16. TeacherPanel (teacher-panel.js)
 * ============================================================
 */

(function (global) {
    'use strict';

    // ============================================================
    // ১. UTILS — config.js
    // সবার আগে লোড হয়, কারণ সব মডিউল এটি ব্যবহার করে।
    // ============================================================
    const Utils = {
        bnNumbers: {
            '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
            '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'
        },

        toBengaliNumber: function (num, lang) {
            lang = lang || 'bn';
            if (!num) return '';
            if (lang === 'en') return num.toString();
            return num.toString().split('').map(function (digit) {
                return this.bnNumbers[digit] || digit;
            }, this).join('');
        },

        detectLanguage: function (text) {
            var bnRegex = /[\u0980-\u09FF]/;
            return bnRegex.test(text) ? 'bn' : 'en';
        },

        formatDate: function (date, lang) {
            lang = lang || 'bn';
            var d = new Date(date);
            var day = this.toBengaliNumber(d.getDate(), lang);
            var year = this.toBengaliNumber(d.getFullYear(), lang);
            var monthsBn = [
                'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
                'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
            ];
            var monthsEn = [
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
            ];
            var month = (lang === 'bn') ? monthsBn[d.getMonth()] : monthsEn[d.getMonth()];
            return (lang === 'bn') ? (day + ' ' + month + ', ' + year) : (month + ' ' + day + ', ' + year);
        },

        formatMarks: function (marks, lang) {
            lang = lang || 'bn';
            var num = this.toBengaliNumber(marks, lang);
            return lang === 'bn' ? ('[মান: ' + num + ']') : ('[Marks: ' + num + ']');
        },

        formatSerial: function (index, style, lang) {
            style = style || 'dot';
            lang = lang || 'bn';
            var num = this.toBengaliNumber(index, lang);
            switch (style) {
                case 'bracket': return '(' + num + ')';
                case 'dot': return num + '.';
                default: return num;
            }
        }
    };

    // ============================================================
    // ২. DBHANDLER — db-handler.js
    // Data layer — GitHub JSON লোড ও IndexedDB ক্যাশিং।
    // ============================================================
    var DBHandler = {
        dbName: 'SheikhAcademyDB',
        version: 1,
        db: null,

        config: {
            basePath: 'https://raw.githubusercontent.com/Sheikh-Academy/json-file-for-cq-and-mcq-for-all-class/refs/heads/main/',
            sources: {
                "class-4": ["bangla", "english", "math", "science"],
                "class-5": ["bangla", "english", "math", "science"],
                "class-6": ["bangla-1st", "bangla-2nd", "english-1st", "english-2nd", "math", "bangladesh-and-global-studies", "islam", "agriculture", "science", "ict"],
                "class-7": ["bangla-1st", "bangla-2nd", "english-1st", "english-2nd", "math", "bangladesh-and-global-studies", "islam", "agriculture", "science", "ict"],
                "class-8": ["bangla-1st", "bangla-2nd", "english-1st", "english-2nd", "math", "bangladesh-and-global-studies", "islam", "agriculture", "science", "ict"],
                "class-9-10": ["bangla-1st", "bangla-2nd", "english-1st", "english-2nd", "math", "islam", "agriculture", "science", "ict", "physics", "chemistry", "biology", "bangladesh-and-global-studies", "civivcs", "history", "gekography", "accounting", "business-management", "bangking-and-finanace"],
                "class-11-12": ["bangla-1st", "bangla-2nd", "english-1st", "english-2nd", "math", "islam", "agriculture", "science", "ict", "physics", "chemistry", "biology", "bangladesh-and-global-studies", "civivcs", "history", "gekography", "accounting", "business-management", "bangking-and-finanace"]
            }
        },

        makeKey: function (className, subject) {
            return className + '-' + subject;
        },

        getFileUrl: function (subjectKey, type) {
            if (!subjectKey || !type) return null;
            var parts = subjectKey.split('-');
            var className, subName;
            if (subjectKey.indexOf('9-10') !== -1 || subjectKey.indexOf('11-12') !== -1) {
                className = parts.slice(0, 3).join('-');
                subName = parts.slice(3).join('-');
            } else {
                className = parts.slice(0, 2).join('-');
                subName = parts.slice(2).join('-');
            }
            if (!subName) return null;
            return this.config.basePath + className + '/' + type + '/' + subName + '.json';
        },

        init: function () {
            var self = this;
            return new Promise(function (resolve, reject) {
                var request = indexedDB.open(self.dbName, self.version);
                request.onupgradeneeded = function (event) {
                    var db = event.target.result;
                    if (!db.objectStoreNames.contains('questions')) {
                        db.createObjectStore('questions', { keyPath: 'SL' });
                    }
                    if (!db.objectStoreNames.contains('drafts')) {
                        db.createObjectStore('drafts', { keyPath: 'id' });
                    }
                };
                request.onsuccess = function (event) {
                    self.db = event.target.result;
                    resolve(self.db);
                };
                request.onerror = function (event) {
                    reject('Database error: ' + event.target.errorCode);
                };
            });
        },

        syncQuestions: async function (subject, type) {
            var url = this.getFileUrl(subject, type);
            if (!url) {
                console.error('ইউআরএল পাওয়া যায়নি!');
                return;
            }
            try {
                console.log('লোডিং: ' + url);
                var response = await fetch(url);
                if (!response.ok) throw new Error('Network response was not ok');
                var questions = await response.json();
                await this.cacheQuestions(questions);
                return questions;
            } catch (error) {
                console.error('গিটহাব থেকে ডাটা লোড করতে সমস্যা:', error);
            }
        },

        cacheQuestions: async function (questionList) {
            if (!this.db) await this.init();
            var transaction = this.db.transaction(['questions'], 'readwrite');
            var store = transaction.objectStore('questions');
            questionList.forEach(function (q) { store.put(q); });
            return new Promise(function (resolve) {
                transaction.oncomplete = function () {
                    console.log('ডাটা লোকাল DB-তে সেভ হয়েছে');
                    resolve();
                };
            });
        },

        getAllQuestions: function () {
            var self = this;
            return new Promise(async function (resolve, reject) {
                if (!self.db) await self.init();
                var transaction = self.db.transaction(['questions'], 'readonly');
                var store = transaction.objectStore('questions');
                var request = store.getAll();
                request.onsuccess = function () { resolve(request.result || []); };
                request.onerror = function () { reject([]); };
            });
        },

        saveDraft: function (content) {
            var self = this;
            (async function () {
                if (!self.db) await self.init();
                var transaction = self.db.transaction(['drafts'], 'readwrite');
                var store = transaction.objectStore('drafts');
                store.put({ id: 'current', html: content, saved: Date.now() });
            })();
        },

        loadDraft: function () {
            var self = this;
            return new Promise(async function (resolve, reject) {
                if (!self.db) await self.init();
                var transaction = self.db.transaction(['drafts'], 'readonly');
                var store = transaction.objectStore('drafts');
                var request = store.get('current');
                request.onsuccess = function () { resolve(request.result ? request.result.html : null); };
                request.onerror = function () { reject(null); };
            });
        }
    };

    // ============================================================
    // ৩. CORELOGIC — core-logic.js
    // Difficulty Balancing, Chapter Filtering, Question Selection
    // ============================================================
    var CoreLogic = {
        ratios: {
            easy_mode:   { easy: 50, medium: 50, hard: 0 },
            medium_mode: { easy: 20, medium: 60, hard: 20 },
            hard_mode:   { easy: 0,  medium: 30, hard: 70 }
        },

        getUniqueChapters: function (allQuestions) {
            var chapters = allQuestions.map(function (q) { return q.Chapter_No || q.Chapter; });
            return chapters.filter(function (v, i, a) { return v && a.indexOf(v) === i; }).sort();
        },

        filterQuestions: function (data, config) {
            var pool = [];
            if (config.selectedChapters && config.selectedChapters.length > 0) {
                pool = data.filter(function (q) {
                    return config.selectedChapters.indexOf(q.Chapter_No || q.Chapter) !== -1;
                });
            } else {
                pool = data.slice();
            }

            var easyGroup   = pool.filter(function (q) { return q.Difficulty.toLowerCase() === 'easy'; });
            var mediumGroup = pool.filter(function (q) { return q.Difficulty.toLowerCase() === 'medium'; });
            var hardGroup   = pool.filter(function (q) { return q.Difficulty.toLowerCase() === 'hard'; });

            var selectedQuestions = [];
            var ratio = this.ratios[config.difficulty] || this.ratios.medium_mode;

            var targetEasy   = Math.round((config.totalLimit * ratio.easy) / 100);
            var targetMedium = Math.round((config.totalLimit * ratio.medium) / 100);
            var targetHard   = Math.round((config.totalLimit * ratio.hard) / 100);

            var getRandom = function (arr, count) {
                var shuffled = arr.slice().sort(function () { return 0.5 - Math.random(); });
                return shuffled.slice(0, count);
            };

            if (config.chapterLimits && Object.keys(config.chapterLimits).length > 0) {
                Object.entries(config.chapterLimits).forEach(function (entry) {
                    var chapter = entry[0], limit = entry[1];
                    var chapterPool = pool.filter(function (q) { return (q.Chapter_No || q.Chapter) === chapter; });
                    selectedQuestions = selectedQuestions.concat(getRandom(chapterPool, limit));
                });
            } else {
                selectedQuestions = selectedQuestions
                    .concat(getRandom(easyGroup, targetEasy))
                    .concat(getRandom(mediumGroup, targetMedium))
                    .concat(getRandom(hardGroup, targetHard));
            }

            return selectedQuestions;
        },

        getCreativeSets: function (data, count) {
            var shuffled = data.slice().sort(function () { return 0.5 - Math.random(); });
            return shuffled.slice(0, count);
        }
    };

    // ============================================================
    // ৪. FILTERENGINE — filter-engine.js
    // Chapter, Board, Year, Tag-based filtering
    // ============================================================
    var FilterEngine = {
        filter: function (allQuestions, criteria) {
            if (!allQuestions || !Array.isArray(allQuestions)) return [];
            return allQuestions.filter(function (q) {
                var match = true;
                if (criteria.chapter && q.Chapter !== criteria.chapter) match = false;
                if (criteria.board && q.Board !== criteria.board) match = false;
                if (criteria.year && q.Year && q.Year.toString() !== criteria.year.toString()) match = false;
                if (criteria.type && q.Type !== criteria.type) match = false;
                return match;
            });
        },

        searchByTag: function (questions, keyword) {
            if (!keyword) return questions;
            var lowKey = keyword.toLowerCase();
            return questions.filter(function (q) {
                return (
                    (q.Question && q.Question.toLowerCase().indexOf(lowKey) !== -1) ||
                    (q.Stimulus && q.Stimulus.toLowerCase().indexOf(lowKey) !== -1) ||
                    (q.Tags && q.Tags.toLowerCase().indexOf(lowKey) !== -1)
                );
            });
        },

        getUniqueValues: function (questions, column) {
            var values = questions.map(function (q) { return q[column]; }).filter(function (v) { return !!v; });
            return values.filter(function (v, i, a) { return a.indexOf(v) === i; }).sort();
        },

        getRelatedQuestions: function (allQuestions, currentQuestion) {
            if (!currentQuestion.Tags) return [];
            var tags = currentQuestion.Tags.split(',');
            return allQuestions.filter(function (q) {
                if (q.SL === currentQuestion.SL) return false;
                return tags.some(function (tag) { return q.Tags && q.Tags.indexOf(tag.trim()) !== -1; });
            }).slice(0, 5);
        }
    };

    // ============================================================
    // ৫. SHUFFLER — shuffler.js
    // Set Generation, Question & Option Shuffling, Answer Key
    // ============================================================
    var Shuffler = {
        shuffleArray: function (array) {
            var currentIndex = array.length, randomIndex;
            var newArray = array.slice();
            while (currentIndex !== 0) {
                randomIndex = Math.floor(Math.random() * currentIndex);
                currentIndex--;
                var tmp = newArray[currentIndex];
                newArray[currentIndex] = newArray[randomIndex];
                newArray[randomIndex] = tmp;
            }
            return newArray;
        },

        shuffleOptions: function (question) {
            var optionIndices = [1, 2, 3, 4];
            var shuffledIndices = this.shuffleArray(optionIndices);
            var newOptions = {};
            var newCorrectAnswer = '';
            var q = question;
            shuffledIndices.forEach(function (oldIdx, newIdx) {
                var currentLabel = 'Option_' + oldIdx;
                var newLabel = 'Option_' + (newIdx + 1);
                newOptions[newLabel] = q[currentLabel];
                if (oldIdx.toString() === q.Correct_Answer.toString()) {
                    newCorrectAnswer = (newIdx + 1).toString();
                }
            });
            return Object.assign({}, question, newOptions, { Correct_Answer: newCorrectAnswer });
        },

        generateSets: function (questions, numberOfSets, shuffleOpts) {
            numberOfSets = numberOfSets || 1;
            shuffleOpts = shuffleOpts || false;
            var sets = [];
            var setNames = ['ক', 'খ', 'গ', 'ঘ'];
            var self = this;

            for (var i = 0; i < numberOfSets; i++) {
                var shuffledQuestions = self.shuffleArray(questions);
                if (shuffleOpts) {
                    shuffledQuestions = shuffledQuestions.map(function (q) { return self.shuffleOptions(q); });
                }
                var answerKey = shuffledQuestions.map(function (q, idx) {
                    return { no: idx + 1, answer: q.Correct_Answer, explanation: q.Explanation || '' };
                });
                sets.push({ setName: setNames[i], questions: shuffledQuestions, answerKey: answerKey });
            }
            return sets;
        }
    };

    // ============================================================
    // ৬. MCQLOGIC — mcq-loqig.js
    // Smart Option Layout, Serial Conversion, Inline Editing
    // ============================================================
    var MCQLogic = {
        renderMCQ: function (qData, index) {
            var lang = Utils.detectLanguage(qData.Question || '');
            var serial = Utils.toBengaliNumber(index, lang);
            var options = [
                { label: 'ক', text: qData.Option_1 },
                { label: 'খ', text: qData.Option_2 },
                { label: 'গ', text: qData.Option_3 },
                { label: 'ঘ', text: qData.Option_4 }
            ];
            var layoutClass = this.calculateLayout(options.map(function (o) { return o.text; }));
            var layoutStyle = this.getLayoutStyle(layoutClass);

            var optionsHtml = options.map(function (opt) {
                return '<div class="option-row" style="display:flex;gap:5px;align-items:baseline;">' +
                    '<span class="opt-label" style="font-weight:bold;">' + opt.label + '.</span>' +
                    '<span class="opt-text sa-editable-area" contenteditable="true">' + (opt.text || '') + '</span>' +
                    '</div>';
            }).join('');

            return '<div class="mcq-item" id="mcq-' + qData.SL + '" style="margin-bottom:20px;break-inside:avoid;">' +
                '<div class="mcq-question" style="display:flex;gap:8px;margin-bottom:8px;">' +
                '<strong class="q-serial">' + serial + '.</strong>' +
                '<div class="q-text sa-editable-area" contenteditable="true" style="flex:1;text-align:justify;">' + qData.Question + '</div>' +
                '</div>' +
                '<div class="options-grid ' + layoutClass + '" style="' + layoutStyle + '">' + optionsHtml + '</div>' +
                '</div>';
        },

        calculateLayout: function (optionTexts) {
            var maxLen = 0;
            optionTexts.forEach(function (text) {
                var len = text ? text.toString().length : 0;
                if (len > maxLen) maxLen = len;
            });
            if (maxLen <= 10) return 'layout-inline';
            else if (maxLen <= 22) return 'layout-double';
            else return 'layout-vertical';
        },

        getLayoutStyle: function (layoutClass) {
            switch (layoutClass) {
                case 'layout-inline':   return 'display:grid;grid-template-columns:repeat(4,1fr);gap:10px;';
                case 'layout-double':   return 'display:grid;grid-template-columns:repeat(2,1fr);gap:8px 15px;';
                case 'layout-vertical': return 'display:grid;grid-template-columns:1fr;gap:5px;';
                default:                return 'display:grid;grid-template-columns:1fr;';
            }
        }
    };

    // ============================================================
    // ৭. CREATIVELOGIC — creative-logic.js
    // Stimulus rendering, Marks allocation, Sub-question layout
    // ============================================================
    var CreativeLogic = {
        renderCreativeSet: function (qData, index) {
            var lang = Utils.detectLanguage(qData.Stimulus || '');
            var serial = Utils.toBengaliNumber(index, lang);
            var self = this;

            return '<div class="creative-question-set" id="cq-' + qData.SL + '" style="margin-bottom:30px;">' +
                '<div class="cq-header" style="margin-bottom:15px;">' +
                '<div style="display:flex;gap:10px;">' +
                '<strong>' + serial + '. </strong>' +
                '<div class="stimulus-text sa-editable-area" contenteditable="true" style="text-align:justify;flex:1;line-height:1.6;">' +
                qData.Stimulus +
                '</div></div></div>' +
                '<div class="cq-sub-questions">' +
                self.renderSubQuestion('ক', qData.Question_Ka,  1, lang) +
                self.renderSubQuestion('খ', qData.Question_Kha, 2, lang) +
                self.renderSubQuestion('গ', qData.Question_Ga,  3, lang) +
                self.renderSubQuestion('ঘ', qData.Question_Gha, 4, lang) +
                '</div></div>';
        },

        renderSubQuestion: function (label, text, marks, lang) {
            var marksText = Utils.toBengaliNumber(marks, lang);
            return '<div class="sub-q-row" style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;width:100%;">' +
                '<div style="display:flex;gap:8px;flex:1;">' +
                '<span class="sub-q-label" style="font-weight:bold;">' + label + '.</span>' +
                '<span class="sub-q-text sa-editable-area" contenteditable="true" style="flex:1;text-align:justify;">' + (text || '') + '</span>' +
                '</div>' +
                '<div class="sub-q-marks" style="min-width:20px;text-align:right;font-weight:bold;margin-left:20px;">' + marksText + '</div>' +
                '</div>';
        },

        calculateOptionLayout: function (options) {
            var maxLength = 0;
            options.forEach(function (opt) { if (opt.length > maxLength) maxLength = opt.length; });
            if (maxLength < 10) return 'layout-1-line';
            else if (maxLength < 25) return 'layout-2-lines';
            else return 'layout-4-lines';
        }
    };

    // ============================================================
    // ৮. LAYOUTENGINE — layout-engine.js
    // Multi-column balancing, Column break prevention, Dynamic Margin
    // ============================================================
    var LayoutEngine = {
        applyColumnLayout: function (containerId, columns) {
            columns = columns || 2;
            var container = document.getElementById(containerId);
            if (!container) return;
            container.style.columnCount = columns;
            container.style.columnGap = '40px';
            container.style.columnRule = '1px dashed #ccc';
            var items = container.querySelectorAll('.mcq-item, .creative-question-set');
            items.forEach(function (item) {
                item.style.breakInside = 'avoid';
                item.style.marginBottom = '15px';
                item.style.display = 'block';
            });
            container.style.columnFill = 'auto';
        },

        updateMargin: function (containerId, marginSize) {
            var container = document.getElementById(containerId);
            if (container) container.style.columnGap = marginSize + 'px';
        },

        refreshLayout: function () {
            var currentCols = (global.AppConfig && global.AppConfig.boardDefaults && global.AppConfig.boardDefaults.defaultColumns) || 2;
            this.applyColumnLayout('questions-display', currentCols);
        },

        adjustFontSize: function (size) {
            var paper = document.getElementById('board-paper');
            if (paper) paper.style.fontSize = size + 'px';
        }
    };

    // ============================================================
    // ৯. OMRGENERATOR — omr-generator.js
    // Dynamic OMR sheet generation
    // ============================================================
    var OMRGenerator = {
        settings: {
            containerId: 'omr-section',
            columnColors: {
                ka:  '#000000',
                kha: '#ff69b4',
                ga:  '#000000',
                gha: '#ff69b4'
            }
        },

        generate: function (questionCount, headerData) {
            headerData = headerData || {};
            var container = document.getElementById(this.settings.containerId);
            if (!container) return;
            var self = this;

            var html = '<div class="omr-wrapper" style="margin-top:50px;border-top:2px dashed #000;padding-top:20px;">' +
                '<div class="omr-header" style="text-align:center;margin-bottom:20px;">' +
                '<h3 style="margin:0;">' + (headerData.schoolName || 'প্রতিষ্ঠানের নাম') + '</h3>' +
                '<p style="margin:5px 0;">ওএমআর উত্তরপত্র (OMR Answer Sheet)</p>' +
                '<div style="display:flex;justify-content:space-around;font-weight:bold;border-bottom:1px solid #000;padding-bottom:10px;">' +
                '<span>শ্রেণি: ' + (headerData.className || '____') + '</span>' +
                '<span>বিষয়: ' + (headerData.subject || '____') + '</span>' +
                '<span>রোল: __________</span>' +
                '</div></div>' +
                '<div class="omr-grid" style="display:grid;grid-template-columns:repeat(2,1fr);gap:20px;">' +
                self.renderRows(questionCount) +
                '</div></div>';

            container.innerHTML = html;
        },

        renderRows: function (count) {
            var rowsHtml = '';
            var self = this;
            for (var i = 1; i <= count; i++) {
                rowsHtml += '<div class="omr-row" style="display:flex;align-items:center;margin-bottom:8px;">' +
                    '<span style="width:25px;font-weight:bold;">' + i + '.</span>' +
                    '<div class="omr-circles" style="display:flex;gap:10px;">' +
                    self.renderCircle('ক', self.settings.columnColors.ka) +
                    self.renderCircle('খ', self.settings.columnColors.kha) +
                    self.renderCircle('গ', self.settings.columnColors.ga) +
                    self.renderCircle('ঘ', self.settings.columnColors.gha) +
                    '</div></div>';
            }
            return rowsHtml;
        },

        renderCircle: function (label, color) {
            return '<div class="omr-item" style="display:flex;flex-direction:column;align-items:center;">' +
                '<div class="omr-circle" style="width:18px;height:18px;border:1.5px solid ' + color + ';border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;color:' + color + ';font-weight:bold;">' +
                label + '</div></div>';
        },

        setColumnColor: function (col, color) {
            if (this.settings.columnColors[col] !== undefined) {
                this.settings.columnColors[col] = color;
                var currentCount = document.querySelectorAll('.omr-row').length;
                this.generate(currentCount);
            }
        }
    };

    // ============================================================
    // ১০. THEMEMANAGER — theme-manager.js
    // Watermark, Color modes, OMR styling
    // ============================================================
    var ThemeManager = {
        settings: {
            paperId: 'board-paper',
            watermarkId: 'sa-watermark',
            defaultColor: '#000000',
            defaultPaper: '#ffffff'
        },

        setWatermark: function (text) {
            var wm = document.getElementById(this.settings.watermarkId);
            if (!wm) {
                wm = document.createElement('div');
                wm.id = this.settings.watermarkId;
                var paper = document.getElementById(this.settings.paperId);
                if (paper) paper.appendChild(wm);
            }
            if (!text) { wm.style.display = 'none'; return; }
            wm.style.display = 'flex';
            wm.innerText = text;
            this.applyWatermarkStyles(wm);
        },

        applyWatermarkStyles: function (el) {
            Object.assign(el.style, {
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%) rotate(-45deg)',
                fontSize: '80px', color: 'rgba(0,0,0,0.05)',
                pointerEvents: 'none', zIndex: '0',
                whiteSpace: 'nowrap', fontWeight: 'bold', userSelect: 'none'
            });
        },

        setTextColor: function (color) {
            var paper = document.getElementById(this.settings.paperId);
            if (paper) paper.style.color = color || this.settings.defaultColor;
        },

        setOMRTheme: function (color) {
            var circles = document.querySelectorAll('.omr-circle');
            circles.forEach(function (circle) { circle.style.borderColor = color; });
        },

        applyHighlightColor: function (color) {
            document.execCommand('foreColor', false, color);
        },

        resetToDefault: function () {
            this.setTextColor(this.settings.defaultColor);
            this.setWatermark('');
            var paper = document.getElementById(this.settings.paperId);
            if (paper) paper.style.backgroundColor = this.settings.defaultPaper;
        }
    };

    // ============================================================
    // ১১. EXPORTER — exporter.js
    // PDF, Word (DOCX) export, Answer Key generation
    // ============================================================
    var Exporter = {
        downloadPDF: function (elementId, fileName) {
            fileName = fileName || 'Question_Paper.pdf';
            var element = document.getElementById(elementId);
            if (!element) return;
            if (typeof html2pdf === 'undefined') {
                console.error('html2pdf লাইব্রেরি লোড হয়নি। CDN যুক্ত করুন।');
                return;
            }
            var opt = {
                margin: [10, 10, 10, 10],
                filename: fileName,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };
            html2pdf().set(opt).from(element).save();
        },

        downloadWord: function (elementId, fileName) {
            fileName = fileName || 'Question_Paper.docx';
            var el = document.getElementById(elementId);
            if (!el) return;
            var content = el.innerHTML;
            var header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' " +
                "xmlns:w='urn:schemas-microsoft-com:office:word' " +
                "xmlns='http://www.w3.org/TR/REC-html40'>" +
                "<head><meta charset='utf-8'><title>Export</title>" +
                "<style>body{font-family:'Kalpurush','Times New Roman',serif;}</style></head><body>";
            var footer = '</body></html>';
            var blob = new Blob(['\ufeff', header + content + footer], { type: 'application/msword' });
            var url = URL.createObjectURL(blob);
            var link = document.createElement('a');
            link.href = url; link.download = fileName; link.click();
        },

        downloadAnswerKey: function (answerData, setName) {
            setName = setName || 'ক';
            var html = '<div style="padding:20px;font-family:\'Kalpurush\',sans-serif;">' +
                '<h2 style="text-align:center;">উত্তরপত্র - সেট: ' + setName + '</h2>' +
                '<table border="1" style="width:100%;border-collapse:collapse;text-align:center;">' +
                '<thead><tr style="background:#f2f2f2;"><th>প্রশ্ন নং</th><th>সঠিক উত্তর</th><th>ব্যাখ্যা</th></tr></thead><tbody>';
            answerData.forEach(function (item) {
                html += '<tr><td style="padding:8px;">' + item.no + '</td>' +
                    '<td style="padding:8px;">' + item.answer + '</td>' +
                    '<td style="padding:8px;text-align:left;">' + (item.explanation || '-') + '</td></tr>';
            });
            html += '</tbody></table></div>';
            var tempDiv = document.createElement('div');
            tempDiv.id = 'temp-answer-key';
            tempDiv.innerHTML = html;
            tempDiv.style.position = 'absolute';
            tempDiv.style.left = '-9999px';
            document.body.appendChild(tempDiv);
            this.downloadPDF('temp-answer-key', 'Answer_Key_Set_' + setName + '.pdf');
            setTimeout(function () {
                if (document.body.contains(tempDiv)) document.body.removeChild(tempDiv);
            }, 1000);
        }
    };

    // ============================================================
    // ১২. EDITOR — editor.js
    // MS Word-like Editing, Formatting, Column & Paper management
    // ============================================================
    var Editor = {
        settings: {
            paperSize: 'A4',
            mcqStyle: 'dot',
            columns: 2,
            showDivider: true,
            fontFamily: 'Kalpurush',
            fontSize: '16px'
        },

        enableEditing: function (elementId) {
            var el = document.getElementById(elementId);
            if (el) { el.contentEditable = true; el.classList.add('sa-editable-area'); }
        },

        formatText: function (command, value) {
            document.execCommand(command, false, value || null);
        },

        setPaperSize: function (size) {
            this.settings.paperSize = size;
            var paper = document.querySelector('.board-paper');
            if (paper) {
                paper.style.width    = (size === 'A4') ? '210mm' : '215.9mm';
                paper.style.minHeight = (size === 'A4') ? '297mm' : '279.4mm';
            }
        },

        updateLayout: function (colCount, showDivider) {
            this.settings.columns = colCount;
            this.settings.showDivider = showDivider;
            var container = document.querySelector('.questions-container');
            if (container) {
                container.style.columnCount = colCount;
                container.style.columnGap = '30px';
                container.style.columnRule = showDivider ? '1px dashed #ccc' : 'none';
            }
        },

        applyMCQStyle: function (style) {
            this.settings.mcqStyle = style;
            var options = document.querySelectorAll('.option-prefix');
            options.forEach(function (opt) {
                var label = opt.getAttribute('data-label');
                switch (style) {
                    case 'dot':           opt.innerText = label + '.'; break;
                    case 'bracket_both':  opt.innerText = '(' + label + ')'; break;
                    case 'bracket_right': opt.innerText = label + ')'; break;
                    case 'circle':
                        var circles = { 'ক': '①', 'খ': '②', 'গ': '③', 'ঘ': '④' };
                        opt.innerText = circles[label] || label; break;
                }
            });
        },

        updateHeaderInfo: function (field, value) {
            var el = document.querySelector('.header-' + field);
            if (el) el.innerText = value;
        },

        updateTypography: function (property, value) {
            var target = document.querySelector('.board-paper');
            if (target) {
                if (property === 'fontSize')   target.style.fontSize = value + 'px';
                if (property === 'lineHeight')  target.style.lineHeight = value;
            }
        }
    };

    // ============================================================
    // ১৩. SIDEBARCONTROLS — sidebar-controls.js
    // Settings Panel, Desktop-side / Mobile-top view
    // ============================================================
    var SidebarControls = {
        settings: {
            isMobile: global.innerWidth < 768,
            isOpen: true
        },

        init: function (containerId) {
            var container = document.getElementById(containerId);
            if (!container) return;
            var layoutClass = this.settings.isMobile ? 'sa-top-bar' : 'sa-sidebar';

            container.innerHTML =
                '<div class="' + layoutClass + '" id="main-controls">' +
                '<div class="control-header">' +
                '<h4>সেটিংস ও এডিট প্যানেল</h4>' +
                '<button onclick="SidebarControls.togglePanel()">☰</button>' +
                '</div>' +
                '<div class="control-body" id="control-fields">' +

                '<div class="control-group"><label>প্রশ্ন সেট সংখ্যা (ক-ঘ):</label>' +
                '<select onchange="window.updateSetCount(this.value)">' +
                '<option value="1">১টি (ক)</option><option value="2">২টি (ক, খ)</option>' +
                '<option value="3">৩টি (ক, খ, গ)</option><option value="4">৪টি (ক, খ, গ, ঘ)</option>' +
                '</select></div>' +

                '<div class="control-group"><label class="switch">' +
                '<input type="checkbox" onchange="window.toggleOMR(this.checked)">' +
                '<span class="slider"></span> ওএমআর (OMR) যুক্ত করুন</label></div>' +

                '<div class="control-group"><label>কলাম সংখ্যা:</label>' +
                '<div class="radio-group">' +
                '<input type="radio" name="cols" value="1" onclick="Editor.updateLayout(1,true)"> ১ ' +
                '<input type="radio" name="cols" value="2" checked onclick="Editor.updateLayout(2,true)"> ২ ' +
                '<input type="radio" name="cols" value="3" onclick="Editor.updateLayout(3,true)"> ৩' +
                '</div></div>' +

                '<div class="control-group"><label>জলছাপ (Watermark):</label>' +
                '<input type="text" placeholder="স্কুলের নাম লিখুন" oninput="window.updateWatermark(this.value)"></div>' +

                '<div class="control-group"><label>কালার মোড:</label>' +
                '<input type="color" value="#000000" onchange="window.updateColorMode(this.value)"> রঙিন প্রশ্ন</div>' +

                '<div class="action-buttons">' +
                '<button class="btn-pdf" onclick="Exporter.downloadPDF(\'board-paper\')">PDF ডাউনলোড</button>' +
                '<button class="btn-word" onclick="Exporter.downloadWord(\'board-paper\')">Word ডাউনলোড</button>' +
                '</div>' +
                '</div></div>';

            this.applyStyles();
        },

        togglePanel: function () {
            var body = document.getElementById('control-fields');
            this.settings.isOpen = !this.settings.isOpen;
            body.style.display = this.settings.isOpen ? 'block' : 'none';
        },

        applyStyles: function () {
            if (document.getElementById('sa-sidebar-style')) return;
            var style = document.createElement('style');
            style.id = 'sa-sidebar-style';
            style.innerHTML =
                '.sa-sidebar{width:300px;position:fixed;right:0;top:0;height:100vh;background:#f8f9fa;border-left:1px solid #ddd;padding:15px;z-index:1000;overflow-y:auto;}' +
                '.sa-top-bar{width:100%;position:sticky;top:0;background:#f8f9fa;border-bottom:1px solid #ddd;padding:10px;z-index:1000;}' +
                '.control-group{margin-bottom:15px;padding-bottom:10px;border-bottom:1px solid #eee;}' +
                '.control-group label{display:block;font-weight:bold;margin-bottom:5px;font-size:14px;}' +
                '.action-buttons button{width:100%;margin-top:10px;padding:10px;border:none;border-radius:5px;cursor:pointer;color:white;}' +
                '.btn-pdf{background:#e74c3c;}.btn-word{background:#3498db;}' +
                '@media(max-width:767px){.sa-sidebar{display:none;}}';
            document.head.appendChild(style);
        }
    };

    // ============================================================
    // ১৪. SUGGESTIONVIEW — suggestion-view.js
    // Chapter-based filtering, Important Question display
    // ============================================================
    var SuggestionView = {
        allQuestions: [],
        selectedChapter: null,

        init: async function () {
            this.allQuestions = await DBHandler.getAllQuestions();
            this.renderLayout();
        },

        renderLayout: function () {
            var app = document.getElementById('app');
            if (!app) return;
            app.innerHTML =
                '<div class="suggestion-container" style="background:#fdfdfd;min-height:100vh;padding:20px;">' +
                '<div class="suggestion-header" style="text-align:center;margin-bottom:30px;border-bottom:2px solid #3498db;padding-bottom:20px;">' +
                '<h2 style="color:#2c3e50;">🎯 বিশেষ সাজেশন বোর্ড</h2>' +
                '<p style="color:#7f8c8d;">এখানে শুধু গুরুত্বপূর্ণ প্রশ্ন ও তাদের সঠিক উত্তর দেওয়া হয়েছে।</p>' +
                '<div class="selector-controls" style="margin-top:20px;display:flex;justify-content:center;gap:15px;flex-wrap:wrap;">' +
                '<select id="suggest-class" style="padding:10px;border-radius:5px;border:1px solid #ddd;"><option value="10">দশম শ্রেণি</option><option value="9">নবম শ্রেণি</option></select>' +
                '<select id="suggest-subject" style="padding:10px;border-radius:5px;border:1px solid #ddd;"><option value="Physics">পদার্থবিজ্ঞান</option><option value="Chemistry">রসায়ন</option></select>' +
                '<button onclick="SuggestionView.loadChapters()" style="padding:10px 20px;background:#3498db;color:white;border:none;border-radius:5px;cursor:pointer;">অধ্যায়গুলো দেখুন</button>' +
                '</div></div>' +
                '<div id="chapter-buttons-area" style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin-bottom:30px;"></div>' +
                '<div id="suggestion-list-area" style="max-width:900px;margin:0 auto;"><div style="text-align:center;color:#ccc;margin-top:50px;"><p>উপরের যেকোনো অধ্যায় সিলেক্ট করুন...</p></div></div>' +
                '</div>';
        },

        loadChapters: function () {
            var questions = this.allQuestions;
            var chapters = FilterEngine.getUniqueValues(questions, 'Chapter');
            var btnArea = document.getElementById('chapter-buttons-area');
            if (!btnArea) return;
            btnArea.innerHTML = chapters.map(function (ch) {
                return '<button onclick="SuggestionView.showChapterQuestions(\'' + ch + '\')" class="chapter-btn" style="' +
                    'padding:12px 20px;background:#fff;border:2px solid #3498db;color:#3498db;border-radius:25px;cursor:pointer;font-weight:bold;transition:all 0.3s;" ' +
                    'onmouseover="this.style.background=\'#3498db\';this.style.color=\'#fff\';" ' +
                    'onmouseout="this.style.background=\'#fff\';this.style.color=\'#3498db\';">' + ch + '</button>';
            }).join('');
            document.getElementById('suggestion-list-area').innerHTML = '<p style="text-align:center;">অধ্যায় লোড হয়েছে। প্রশ্ন দেখতে বাটনে ক্লিক করুন।</p>';
        },

        showChapterQuestions: function (chapterName) {
            this.selectedChapter = chapterName;
            var self = this;
            var filtered = this.allQuestions.filter(function (q) {
                return q.Chapter === chapterName && q.Type === 'MCQ' && (q.Tags && q.Tags.indexOf('Important') !== -1);
            });
            var listArea = document.getElementById('suggestion-list-area');
            if (!listArea) return;
            if (filtered.length === 0) {
                listArea.innerHTML = '<div style="text-align:center;padding:40px;color:#e74c3c;">এই অধ্যায়ে এখনো কোনো সাজেশন যুক্ত করা হয়নি।</div>';
                return;
            }
            listArea.innerHTML = '<h3 style="margin-bottom:20px;color:#2c3e50;border-left:5px solid #2ecc71;padding-left:10px;">' + chapterName + ' - এর গুরুত্বপূর্ণ প্রশ্নোত্তর</h3>' +
                filtered.map(function (q, i) {
                    return '<div class="suggest-card" style="background:white;padding:20px;border-radius:10px;margin-bottom:15px;box-shadow:0 2px 8px rgba(0,0,0,0.05);border:1px solid #eee;">' +
                        '<div style="font-weight:bold;margin-bottom:10px;font-size:16px;">' + Utils.toBengaliNumber(i + 1) + '. ' + q.Question + '</div>' +
                        '<div class="correct-answer-box" style="background:#eafaf1;color:#27ae60;padding:10px 15px;border-radius:5px;display:inline-block;font-weight:bold;">✅ উত্তর: ' + self.getCorrectAnswerText(q) + '</div>' +
                        '</div>';
                }).join('');
        },

        getCorrectAnswerText: function (q) {
            var optionLabel = 'Option_' + q.Correct_Answer;
            return q[optionLabel] || 'তথ্য পাওয়া যায়নি';
        }
    };

    // ============================================================
    // ১৫. STUDENTPANEL — student-panel.js
    // Floating Timer, Progress Tracker, Locked Answers, Certificate
    // ============================================================
    var StudentPanel = {
        examData: [],
        userAnswers: {},
        timeLeft: 0,
        timerInterval: null,
        totalQuestions: 0,

        startExam: function (questions) {
            this.examData = questions;
            this.totalQuestions = questions.length;
            this.timeLeft = this.totalQuestions * 40;
            this.userAnswers = {};
            this.renderLayout();
            this.startTimer();
        },

        renderLayout: function () {
            var self = this;
            var app = document.getElementById('app');
            if (!app) return;
            app.innerHTML =
                '<div class="student-exam-container" style="background:#f4f7f6;min-height:100vh;padding-bottom:50px;">' +
                '<div class="floating-status-bar" style="position:sticky;top:0;background:#2c3e50;color:white;padding:15px;display:flex;justify-content:space-around;z-index:2000;box-shadow:0 2px 10px rgba(0,0,0,0.2);font-weight:bold;">' +
                '<div id="exam-timer">সময় বাকি: ০০:০০</div>' +
                '<div id="question-progress">বাকি আছে: ' + Utils.toBengaliNumber(self.totalQuestions) + ' টি</div>' +
                '</div>' +
                '<div class="exam-content" style="max-width:800px;margin:20px auto;padding:0 15px;">' +
                '<div class="student-info" style="background:white;padding:15px;border-radius:8px;margin-bottom:20px;border-left:5px solid #3498db;">' +
                '<h3 style="margin:0;">মডেল টেস্ট: পদার্থবিজ্ঞান</h3>' +
                '<p style="margin:5px 0;color:#666;">পরীক্ষার্থী: <span contenteditable="true">আপনার নাম লিখুন</span></p>' +
                '</div>' +
                '<div id="exam-questions-list">' + self.renderQuestions() + '</div>' +
                '<button onclick="StudentPanel.submitExam()" id="submit-btn" style="width:100%;padding:15px;background:#27ae60;color:white;border:none;border-radius:8px;font-size:18px;cursor:pointer;margin-top:30px;">উত্তর জমা দিন</button>' +
                '</div></div>';
        },

        renderQuestions: function () {
            var self = this;
            return this.examData.map(function (q, i) {
                return '<div class="exam-q-card" id="q-card-' + i + '" style="background:white;padding:20px;border-radius:8px;margin-bottom:20px;box-shadow:0 2px 5px rgba(0,0,0,0.05);">' +
                    '<p style="font-weight:bold;margin-bottom:15px;">' + Utils.toBengaliNumber(i + 1) + '. ' + q.Question + '</p>' +
                    '<div class="exam-options">' +
                    self.renderOption(i, 1, q.Option_1, 'ক') +
                    self.renderOption(i, 2, q.Option_2, 'খ') +
                    self.renderOption(i, 3, q.Option_3, 'গ') +
                    self.renderOption(i, 4, q.Option_4, 'ঘ') +
                    '</div></div>';
            }).join('');
        },

        renderOption: function (qIndex, optIndex, text, label) {
            return '<div class="opt-wrapper" onclick="StudentPanel.selectOption(' + qIndex + ',' + optIndex + ')" ' +
                'id="opt-' + qIndex + '-' + optIndex + '" ' +
                'style="display:flex;align-items:center;gap:10px;margin-bottom:10px;cursor:pointer;padding:8px;border-radius:5px;border:1px solid #eee;">' +
                '<div class="opt-circle" style="width:24px;height:24px;border:2px solid #ddd;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:bold;">' + label + '</div>' +
                '<div class="opt-text">' + (text || '') + '</div>' +
                '</div>';
        },

        selectOption: function (qIndex, optIndex) {
            if (this.userAnswers[qIndex]) return;
            this.userAnswers[qIndex] = optIndex;
            var selectedOpt = document.getElementById('opt-' + qIndex + '-' + optIndex);
            if (selectedOpt) {
                selectedOpt.style.background = '#d4edda';
                selectedOpt.style.borderColor = '#28a745';
                var circle = selectedOpt.querySelector('.opt-circle');
                if (circle) { circle.style.background = '#28a745'; circle.style.color = 'white'; }
            }
            var solved = Object.keys(this.userAnswers).length;
            var progressEl = document.getElementById('question-progress');
            if (progressEl) progressEl.innerText = 'বাকি আছে: ' + Utils.toBengaliNumber(this.totalQuestions - solved) + ' টি';
        },

        startTimer: function () {
            var self = this;
            this.timerInterval = setInterval(function () {
                self.timeLeft--;
                var minutes = Math.floor(self.timeLeft / 60);
                var seconds = self.timeLeft % 60;
                var timerEl = document.getElementById('exam-timer');
                if (timerEl) timerEl.innerText = 'সময় বাকি: ' + Utils.toBengaliNumber(minutes) + ':' + Utils.toBengaliNumber(seconds < 10 ? '0' + seconds : seconds);
                if (self.timeLeft <= 0) self.submitExam();
            }, 1000);
        },

        submitExam: function () {
            clearInterval(this.timerInterval);
            var score = 0;
            var self = this;
            this.examData.forEach(function (q, i) {
                if (self.userAnswers[i] && self.userAnswers[i].toString() === q.Correct_Answer.toString()) score++;
            });
            this.showCertificate(score);
        },

        showCertificate: function (score) {
            var app = document.getElementById('app');
            if (!app) return;
            var percentage = Math.round((score / this.totalQuestions) * 100);
            app.innerHTML =
                '<div class="certificate-overlay" style="display:flex;align-items:center;justify-content:center;min-height:100vh;background:#2c3e50;padding:20px;">' +
                '<div class="certificate-card" style="background:white;padding:40px;border-radius:15px;text-align:center;max-width:600px;border:10px double #f1c40f;">' +
                '<h1 style="color:#f1c40f;margin-bottom:10px;">অভিনন্দন!</h1>' +
                '<p style="font-size:20px;">আপনার পরীক্ষা সফলভাবে সম্পন্ন হয়েছে।</p>' +
                '<hr style="margin:20px 0;">' +
                '<div style="font-size:24px;margin-bottom:20px;">প্রাপ্ত নম্বর: <strong>' + Utils.toBengaliNumber(score) + '</strong> / ' + Utils.toBengaliNumber(this.totalQuestions) + '<br>সাফল্যের হার: <strong>' + Utils.toBengaliNumber(percentage) + '%</strong></div>' +
                '<p style="font-style:italic;color:#666;">শেখ একাডেমি - আপনার মেধা বিকাশের সঙ্গী</p>' +
                '<button onclick="location.reload()" style="margin-top:30px;padding:10px 25px;background:#3498db;color:white;border:none;border-radius:5px;cursor:pointer;">আবার চেষ্টা করুন</button>' +
                '</div></div>';
        }
    };

    // ============================================================
    // ১৬. TEACHERPANEL — teacher-panel.js
    // Live Preview, Question Selection, Dynamic Filtering
    // এটি সবার শেষে কারণ এটি প্রায় সব মডিউল ব্যবহার করে।
    // ============================================================
    var TeacherPanel = {
        allQuestions: [],
        selectedQuestions: [],
        currentSubject: 'Physics',

        init: async function () {
            this.allQuestions = await DBHandler.getAllQuestions();
            this.renderLayout();
            this.setupEventListeners();
            SidebarControls.init('sidebar-container');
        },

        renderLayout: function () {
            var app = document.getElementById('app');
            if (!app) return;
            app.innerHTML =
                '<div class="editor-app-container">' +
                '<div class="question-selector-panel" style="width:350px;border-right:1px solid #ddd;display:flex;flex-direction:column;">' +
                '<div class="filter-section" style="padding:15px;background:#f8f9fa;border-bottom:1px solid #ddd;">' +
                '<select id="chapter-filter" onchange="TeacherPanel.handleFilterChange()" style="width:100%;padding:8px;margin-bottom:10px;">' +
                '<option value="">সকল অধ্যায়</option>' + this.getChapterOptions() +
                '</select>' +
                '<input type="text" id="search-tag" placeholder="ট্যাগ বা কি-ওয়ার্ড দিয়ে খুঁজুন..." oninput="TeacherPanel.handleFilterChange()" style="width:100%;padding:8px;">' +
                '</div>' +
                '<div id="question-list" style="flex:1;overflow-y:auto;padding:10px;"></div>' +
                '</div>' +

                '<div class="main-editor-area" style="flex:1;overflow-y:auto;background:#525659;padding:40px;">' +
                '<div id="board-paper" class="board-paper">' +
                '<div class="exam-header">' +
                '<h2 contenteditable="true" class="header-school">প্রতিষ্ঠানের নাম লিখুন</h2>' +
                '<p contenteditable="true">বার্ষিক পরীক্ষা - ২০২৪</p>' +
                '<div class="header-meta">' +
                '<span contenteditable="true">বিষয়: পদার্থবিজ্ঞান</span>' +
                '<span contenteditable="true">সময়: ২ ঘণ্টা ৩০ মিনিট</span>' +
                '<span contenteditable="true">পূর্ণমান: ১০০</span>' +
                '</div></div>' +
                '<div id="questions-display" class="questions-container"><p style="color:#999;text-align:center;margin-top:50px;">বাম পাশ থেকে প্রশ্ন সিলেক্ট করুন...</p></div>' +
                '<div id="omr-section"></div>' +
                '</div></div>' +

                '<div id="sidebar-container"></div>' +
                '</div>';
        },

        getChapterOptions: function () {
            var chapters = FilterEngine.getUniqueValues(this.allQuestions, 'Chapter');
            return chapters.map(function (c) { return '<option value="' + c + '">' + c + '</option>'; }).join('');
        },

        handleFilterChange: function () {
            var chapterEl = document.getElementById('chapter-filter');
            var keywordEl = document.getElementById('search-tag');
            var chapter = chapterEl ? chapterEl.value : '';
            var keyword  = keywordEl ? keywordEl.value : '';
            var filtered = FilterEngine.filter(this.allQuestions, { chapter: chapter });
            if (keyword) filtered = FilterEngine.searchByTag(filtered, keyword);
            this.renderQuestionList(filtered);
        },

        renderQuestionList: function (list) {
            var self = this;
            var listContainer = document.getElementById('question-list');
            if (!listContainer) return;
            listContainer.innerHTML = list.map(function (q) {
                var isSelected = self.selectedQuestions.some(function (sq) { return sq.SL === q.SL; });
                return '<div class="q-card" style="border:1px solid #eee;padding:10px;margin-bottom:10px;cursor:pointer;background:#fff;border-radius:4px;" ' +
                    'onclick="TeacherPanel.toggleQuestionSelection(\'' + q.SL + '\')">' +
                    '<small style="color:#3498db;">' + (q.Chapter || '') + '</small>' +
                    '<p style="margin:5px 0;font-size:14px;">' + (q.Question || (q.Stimulus ? q.Stimulus.substring(0, 50) + '...' : '')) + '</p>' +
                    '<input type="checkbox" ' + (isSelected ? 'checked' : '') + '> যুক্ত করুন' +
                    '</div>';
            }).join('');
        },

        toggleQuestionSelection: function (sl) {
            var question = this.allQuestions.find(function (q) { return q.SL === sl; });
            var index = this.selectedQuestions.findIndex(function (sq) { return sq.SL === sl; });
            if (index > -1) this.selectedQuestions.splice(index, 1);
            else this.selectedQuestions.push(question);
            this.updateLivePreview();
            this.handleFilterChange();
        },

        updateLivePreview: function () {
            var display = document.getElementById('questions-display');
            if (!display) return;
            if (this.selectedQuestions.length === 0) {
                display.innerHTML = '<p style="color:#999;text-align:center;">কোনো প্রশ্ন সিলেক্ট করা নেই।</p>';
                return;
            }
            var html = '';
            this.selectedQuestions.forEach(function (q, i) {
                if (q.Type === 'MCQ') html += MCQLogic.renderMCQ(q, i + 1);
                else html += CreativeLogic.renderCreativeSet(q, i + 1);
            });
            display.innerHTML = html;

            var mcqList = this.selectedQuestions.filter(function (q) { return q.Type === 'MCQ'; });
            if (mcqList.length > 0) {
                OMRGenerator.generate(mcqList.length, {
                    schoolName: (document.querySelector('.header-school') || {}).innerText || '',
                    className: 'দশম',
                    subject: 'পদার্থবিজ্ঞান'
                });
            } else {
                var omrSection = document.getElementById('omr-section');
                if (omrSection) omrSection.innerHTML = '';
            }
        },

        setupEventListeners: function () {
            document.addEventListener('input', function () {
                var paper = document.getElementById('board-paper');
                if (paper) DBHandler.saveDraft(paper.innerHTML);
            });
        }
    };

    // ============================================================
    // GLOBAL HELPER FUNCTIONS (window.* — sidebar কলব্যাক থেকে ব্যবহৃত)
    // ============================================================
    global.updateSetCount = function (val) {
        console.log('সেট সংখ্যা নির্বাচন:', val);
    };

    global.toggleOMR = function (checked) {
        var omrSection = document.getElementById('omr-section');
        if (!omrSection) return;
        if (checked) {
            var mcqCount = (TeacherPanel.selectedQuestions || []).filter(function (q) { return q.Type === 'MCQ'; }).length;
            OMRGenerator.generate(mcqCount || 30, {});
        } else {
            omrSection.innerHTML = '';
        }
    };

    global.updateWatermark = function (text) {
        ThemeManager.setWatermark(text);
    };

    global.updateColorMode = function (color) {
        ThemeManager.setTextColor(color);
    };

    // ============================================================
    // সব মডিউল window-এ expose করা
    // ============================================================
    global.Utils            = Utils;
    global.DBHandler        = DBHandler;
    global.CoreLogic        = CoreLogic;
    global.FilterEngine     = FilterEngine;
    global.Shuffler         = Shuffler;
    global.MCQLogic         = MCQLogic;
    global.CreativeLogic    = CreativeLogic;
    global.LayoutEngine     = LayoutEngine;
    global.OMRGenerator     = OMRGenerator;
    global.ThemeManager     = ThemeManager;
    global.Exporter         = Exporter;
    global.Editor           = Editor;
    global.SidebarControls  = SidebarControls;
    global.SuggestionView   = SuggestionView;
    global.StudentPanel     = StudentPanel;
    global.TeacherPanel     = TeacherPanel;

    // ============================================================
    // অ্যাপ অটো-ইনিট (পেজ লোড হলে TeacherPanel চালু হবে)
    // ============================================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            if (document.getElementById('app')) TeacherPanel.init();
        });
    } else {
        if (document.getElementById('app')) TeacherPanel.init();
    }

}(window));
// ]]>
