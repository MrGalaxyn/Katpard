'use strict';

define([], function () {
    //datatable
    $('.datatable').dataTable({
            "sDom": "<'row-fluid'<'span6'l><'span6'f>r>t<'row-fluid'<'span12'i><'span12 center'p>>",
            "sPaginationType": "bootstrap",
            "oLanguage": {
            "sLengthMenu": "_MENU_ records per page"
            }
        } );
    $('.btn-close').live("click", function(e){
        $(this).parent().parent().parent().fadeOut();
    });
    $('.btn-minimize').live("click", function(e){
        var $target = $(this).parent().parent().next('.box-content');
        if($target.is(':visible')) $('i',$(this)).removeClass('icon-chevron-up').addClass('icon-chevron-down');
        else                       $('i',$(this)).removeClass('icon-chevron-down').addClass('icon-chevron-up');
        $target.slideToggle();
    });
    $('.btn-setting').live("click", function(e){
        $('#myModal').modal('show');
    });
});
