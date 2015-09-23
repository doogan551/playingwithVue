$(document).ready(function(){
    $('.file').each(function(){
        bg = $(this).find('.fname').html();
        fname = $(this).find('.fname').html();


        $(this).find('img').attr('src','/display_assets/assets/' + bg);

        $(this).click(function(){
            window.parent.setImg($(this).find('.fname').html());
            return false;
        });
    })
});