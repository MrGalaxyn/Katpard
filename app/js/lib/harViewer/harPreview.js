'use strict';

define([
    "lib/harViewer/preview/requestList",
    "lib/harViewer/tabs/pageTimeline",
    "lib/harViewer/tabs/pageStats",
    "lib/harViewer/preview/pageList",
    "lib/harViewer/preview/harModel",
    "lib/harViewer/core/lib",
    "lib/harViewer/core/trace",
    "lib/harViewer/preview/validationError"
], function (RequestList, Timeline, Stats, PageList, HarModel, Lib, Trace, ValidationError) {

    function HarPreview()
    {
        this.id = "harPreview";

        this.model = new HarModel();
        this.timeline = new Timeline();
        this.stats = new Stats(this.model, this.timeline);
        this.pageList = null;
    }

    HarPreview.prototype = {
        initialize: function(content, callbackFn)
        {
            this.content = content;
            if (callbackFn) {
                callbackFn();
            }
        },

        appendPreview: function(jsonString)
        {
            try
            {
                var validate = true;
                var param = Lib.getURLParameter("validate");
                if (param == "false")
                    validate = false;

                var input = HarModel.parse(jsonString, validate);
                this.model.append(input);
                var statsNode = this.statsNode ? this.statsNode : this.content;
                this.stats.render(statsNode);
                this.stats.show();
                var pageList = new PageList(input);
                var pageNode = this.pageNode ? this.pageNode : this.content;
                pageList.render(pageNode);
                pageList.updateColumns();

                Lib.fireEvent(this.content, "onPreviewHARLoaded");
            }
            catch (err)
            {
                Trace.exception("HarPreview.appendPreview; EXCEPTION ", err);

                ValidationError.appendError(err, this.content);
            }
        },

        setRenderNode: function(opt) {
            if (opt.stats) {
                this.statsNode = opt.stats;
            }
            if (opt.waterfall) {
                this.pageNode = opt.waterfall;
            }
        },

        onError: function(response, ioArgs)
        {
            Trace.log("HarPreview; Load error ", response, ioArgs);
        },

        // * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * //
        // Loading HAR files

        /**
         * Load HAR file. See {@link HarView.loadHar} for documentation.
         */ 
        loadHar: function(url, settings)
        {
            settings = settings || {};
            return HarModel.Loader.load(this, url,
                settings.jsonp,
                settings.jsonpCallback,
                settings.success,
                settings.ajaxError);
        },

        setPreviewColumns: function(cols, avoidCookies)
        {
            RequestList.setVisibleColumns(cols, avoidCookies);
        }

    }

    return HarPreview;
});

