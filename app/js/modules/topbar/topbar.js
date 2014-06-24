define([], function() {

    var current_theme = $.cookie('current_theme')==null ? 'classic' :$.cookie('current_theme');
    switch_theme(current_theme);
    
    $('#themes a[data-value="'+current_theme+'"]').find('i').addClass('icon-ok');
                 
    $('#themes a').click(function(e){
        current_theme=$(this).attr('data-value');
        $.cookie('current_theme',current_theme,{expires:365});
        switch_theme(current_theme);
        $('#themes i').removeClass('icon-ok');
        $(this).find('i').addClass('icon-ok');
    });
    
    
    function switch_theme(theme_name)
    {
        $('#bs-css').attr('href','./css/bootstrap-'+theme_name+'.css');
    }
});

