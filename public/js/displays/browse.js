$(document).ready(function(){
    $('.file').each(function(){
        bg = $(this).find('.fname').html();
        fname = $(this).find('.fname').html();
        bg = bg.replace('.WMF','.png');
        bg = bg.replace('.wmf','.png');
        bg = bg.replace('.BMP','.png');
        bg = bg.replace('.bmp','.png');

        //console.log(bg);

        $(this).find('img').attr('src','/display_assets/assets/' + bg);

        $(this).click(function(){
            window.parent.setImage($(this).find('.fname').html());
            return false;
        });
    });
});