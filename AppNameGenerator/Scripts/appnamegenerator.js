/// <reference path="../jquery-2.1.0.js" />
/// <reference path="../knockout-3.0.0.js" />
/// <reference path="../array.extend/array.extend.js" />
function WordViewModel(word, isAdgective, isNonStart) {
    var self = this;
    self.word = word;
    self.isAdjective = ko.observable(isAdgective || false);
    self.isNonStart = ko.observable(isNonStart || false);
}
function AppNameGeneratorViewModel() {
    self.minSyllables = ko.observable(1);
    self.maxSyllables = ko.observable(5);
    self.prefixes = ko.observableArray([]);
    self.postfixes = ko.observableArray([]);
    self.maxAcronymLength = ko.observable(5);
    self.buzzWords = ko.observableArray([]);
    self.newBuzzWord = ko.observable('');
    self.newPrefix = ko.observable('');
    self.newPostfix = ko.observable('');
    self.wordList = wordList;
    self.matches = ko.observableArray([]);
    self.addBuzzWord = function () {
        if (self.newBuzzWord() != '' && !self.buzzWords().any(function (b) { return b.word == self.newBuzzWord(); })) {
            self.buzzWords.push(new WordViewModel(self.newBuzzWord()));
            self.newBuzzWord('');
        }
    };
    self.removeBuzzWord = function (buzzWord) {
        self.buzzWords.remove(buzzWord);
    };
    self.addPrefix = function () {
        if (self.newPrefix() != '' && !self.prefixes().any(function (b) { return b.word == self.newPrefix(); })) {
            self.prefixes.push(new WordViewModel(self.newPrefix()));
            self.newPrefix('');
        }
    };
    self.removePrefix = function (prefix) {
        self.prefixes.remove(prefix);
    };
    self.addPostfix = function () {
        if (self.newPostfix() != '' && !self.postfixes().any(function (b) { return b.word == self.newPostfix(); })) {
            self.postfixes.push(new WordViewModel(self.newPostfix()));
            self.newPostfix('');
        }
    };
    self.removePostfix = function (postfix) {
        self.postfixes.remove(postfix);
    };
    function getSyllableCount(word) {
        word = word.toLowerCase();
        if (word.length <= 3) { return 1; }
        word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
        word = word.replace(/^y/, '');
        try { return word.match(/[aeiouy]{1,2}/g).length; } catch (e) { return 0; }
    }
    function combineWords(w, ignoreIndex) {
        if (getSyllableCount(w) > self.maxSyllables()) return;
        for (var i = 0; i < self.buzzWords().length; ++i) {
            if (ignoreIndex.indexOf(i) == -1 && (ignoreIndex.length > 0 || !self.buzzWords()[i].isNonStart())) {
                var buzzWord = self.buzzWords()[i].word;
                var word = w + buzzWord;
                if (getSyllableCount(word) <= self.maxSyllables()) {
                    self.prefixes().forEach(function (prefix) {
                        var w2 = prefix.word + word;
                        if (getSyllableCount(w2) <= self.maxSyllables()) {
                            if (!self.buzzWords()[i].isAdjective() && !self.buzzWords().any(function (b) { return b.word == w2; }))
                                self.matches.push({ word: w2, buzzWords: [] });
                            self.postfixes().forEach(function (postfix) {
                                var w3 = w2 + postfix.word;
                                if (getSyllableCount(w3) <= self.maxSyllables() && !self.buzzWords().any(function (b) { return b.word == w3; }))
                                    self.matches.push({ word: w3, buzzWords: [] });
                            });
                        }
                    });
                    self.postfixes().forEach(function (postfix) {
                        var w2 = word + postfix.word;
                        if (getSyllableCount(w2) <= self.maxSyllables() && !self.buzzWords().any(function (b) { return b.word == w2; }))
                            self.matches.push({ word: w2, buzzWords: [] });
                    });
                    if (!self.buzzWords()[i].isAdjective() && ignoreIndex.length > 0 && !self.buzzWords().any(function (b) { return b.word == word; }))
                        self.matches.push({ word: word, buzzWords: [] });
                    var t = ignoreIndex.slice(0);
                    t.push(i);
                    combineWords(word, t);
                }
            }
        }
    }
    self.findCombinedWords = function () {
        self.minSyllables(self.minSyllables() == '' ? 1 : self.minSyllables());
        self.maxSyllables(self.maxSyllables() == '' ? 1 : self.maxSyllables());
        combineWords('', []);
    };

    function binaryIndexOf(word) {
        var minIndex = 0;
        var maxIndex = self.wordList.length - 1;
        var currentIndex;
        var currentElement;
        while (minIndex <= maxIndex) {
            currentIndex = (minIndex + maxIndex) / 2 | 0;
            currentElement = self.wordList[currentIndex];

            if (currentElement < word) {
                minIndex = currentIndex + 1;
            }
            else if (currentElement > word) {
                maxIndex = currentIndex - 1;
            }
            else {
                return currentIndex;
            }
        }
    }
    function appendWord(w, ignoreIndex) {
        if (w.word.length == self.maxAcronymLength()) return;
        for (var i = 0; i < self.buzzWords().length; ++i) {
            if (ignoreIndex.indexOf(i) == -1) {
                var word = w.word + self.buzzWords()[i].word[0];
                var bs = w.buzzWords.slice(0);
                bs.push(self.buzzWords()[i].word);
                var w2 = { word: word, buzzWords: bs };
                if (binaryIndexOf(w2.word) > -1)
                    matches.push(w2);
                var t = ignoreIndex.slice(0);
                t.push(i);
                appendWord(w2, t);
            }
        }
    }
    self.findAcronyms = function () {
        self.maxAcronymLength(self.maxAcronymLength() == '' ? 1 : self.maxAcronymLength());
        appendWord({ word: '', buzzWords: [] }, []);
    }
    self.generateNames = function () {
        self.matches.removeAll();
        self.findCombinedWords();
        self.findAcronyms();
        var temp = self.matches().orderBy(function (m1, m2) {
            return m1.word.localeCompare(m2.word);
        });
        self.matches(temp);
        document.cookie = "variables=" + JSON.stringify({ buzzWords: self.buzzWords(), prefixes: self.prefixes(), postfixes: self.postfixes() });
    }
    function getCookie(cname) {
        var name = cname + "=";
        var ca = document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i].trim();
            if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
        }
        return "";
    }
    var cookieValue = getCookie('variables');
    if (cookieValue != '')
    {
        //var value = JSON.parse(cookieValue);
        //self.buzzWords(value.buzzWords);
        //self.prefixes(value.prefixes);
        //self.postfixes(value.postfixes);
    }
}