(function (scope) {

    /**
     *
     * @constructor
     */
    function AnalyzerElementReference () {
        this.uniqueID = null;
        this.type = null;
    }

    /**
     * @returns {string}
     */
    AnalyzerElementReference.prototype.getUniqueId = function () {
        return this.uniqueID;
    };

    /**
     * @returns {string}
     */
    AnalyzerElementReference.prototype.getType = function () {
        return this.type;
    };

    // Export
    scope.AnalyzerElementReference = AnalyzerElementReference;
})(MyScript);