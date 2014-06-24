define(function (){
    var loadingSrc = "../../../../css/images/loading51.gif";
    var maskHtml = '' +
        '<div class="modal-backdrop fade in maskLayer" id="loadingGif">' +
            '<div class="maskPicContainer">' +
                '<div class="maskPicDiv">' +
                    '<img src=' + loadingSrc + ' class="maskPic" style="width:50px;height:50px;" title="loading">';
                '</div>'
            '</div>' +
        '</div>';

    var show = function(){
        $(document.body).append(maskHtml);
    };
    
    var hide = function(name, flag){
        $('#loadingGif').remove();
    };

    return {
        showLoading: show,
        hideLoading: hide
    };
});
