/* See license.txt for terms of usage */

define([
    "lib/harViewer/domplate/domplate",
    "lib/harViewer/domplate/tabView",
    "lib/harViewer/core/lib",
    "lib/harViewer/syntax-highlighter/shCore",
    "lib/harViewer/core/trace"
],

function(Domplate, TabView, Lib, dp, Trace) { with (Domplate) {

//*************************************************************************************************
// Home Tab

function SchemaTab() {}
SchemaTab.prototype =
{
    id: "Schema",
    label: 'Schema',

    bodyTag:
        PRE({"class": "javascript:nocontrols:", name: "code"}),

    onUpdateBody: function(tabView, body)
    {
        $.ajax({
            url: "js/lib/harViewer/preview/harSchema.js",
            context: this,

            success: function(response)
            {
                var code = body.firstChild;
                code.innerHTML = response;
                dp.SyntaxHighlighter.HighlightAll(code);
            },

            error: function(response, ioArgs)
            {
                Trace.error("SchemaTab.onUpdateBody; ERROR ", response);
            }
        });
    }
};

return SchemaTab;

//*************************************************************************************************
}});


