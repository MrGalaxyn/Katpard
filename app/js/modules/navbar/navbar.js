define([], function() {
    $('ul.main-menu li a').each(function(){
        if($($(this))[0].href==String(window.location))
            $(this).parent().addClass('active');
    });

    $('ul.main-menu li a').click(function(){
        $('ul.main-menu li a').each(function(){
            $(this).parent().removeClass('active');
        });
        $(this).parent().addClass('active');
        $(this).parent().css('margin-left','3px');
    });
    
    //animating menus on hover
    $('ul.main-menu li:not(.nav-header)').hover(function(){
        $(this).animate({'margin-left':'+=5'},300);
    },
    function(){
        $(this).animate({'margin-left':'-=5'},300);
    });
});

