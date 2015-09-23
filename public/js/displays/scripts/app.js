var socket = io.connect('http://' + window.location.hostname + ':9100');



//holds ref to active display
var activeFrame = null;
var activeTab = null;

function setName(lbl){
  //alert(activeTab.find('.lbl').html());
  if(activeTab.find('.lbl').html() == 'display'){
    activeTab.find('.lbl').html(lbl);
    sizeBar();
  }
}

function guid(){
  return Math.floor(
                Math.random() * 0x1000000 /* 65536 */
            ).toString(16);
}

var displayCount = -2;



  socket.on('importMsg', function (data) {

    if(data.msg == 'IMPORT COMPLETE!'){

      parent.alertt('Import Complete', displayCount + ' displays were succesfully imported.');
      parent.$.fancybox.close();
    }

    //console.log(data.msg);
    $('#progress').append('<div>' + data.msg + '</div>');
    var textarea = document.getElementById('progress');
    textarea.scrollTop = textarea.scrollHeight;

    displayCount++;
    $('.dNum').html('Displays Parsed: ' + displayCount);



  });




var editMode = false;
var panMode = false;

function refreshFrame(ver){
  $('#' + activeFrame).attr('src',ver);
  $('.view-display').trigger('click');
  hideAlertt();
}

function alertt(subject, msg){
  html = '<div class="mask"><section class="alert"><h2>' +  subject + '</h2><div><p>' + msg + '</p><a onClick="return hideAlertt();" id="alertOk" href="#">OK</a></div></section></div>';

  $('body').append(html);

}

var go = function(){

};

var no = function(){

};

var later = function(){

};

$(document).keyup(function(e) {
e.preventDefault();
  });

$(document).keydown(function(e) {
e.preventDefault();
  });

function confirmm(conf){

  go = conf.action;
  later = conf.action
  no = conf.action;
  html = '<div class="mask"><section class="alert"><h2>' +  conf.title + '</h2><div><p>' + conf.body + '</p>';

  if(conf.latertxt){

    no = conf.noaction;
    later = conf.lateraction;

    html = html + '<div style="float:left;clear:both;"><a onClick="return later();" href="#">' + conf.latertxt + '</a>';
    html = html + '<a onClick="return go();" href="#">' + conf.txt + '</a></div>';

    html = html + '<div style="float:left;clear:both;"><a onClick="return hideAlertt();" id="alertOk" href="#">Cancel</a>';
    html = html + '<a onClick="return no();" href="#">' + conf.notxt + '</a></div>';

    html = html + '</div></section></div>';


  }else{

      html = html + '<a onClick="return hideAlertt();" id="alertOk" href="#">Cancel</a>';

  if(conf.notxt){
    no = conf.noaction;
    html = html + '<a onClick="return no();" href="#">' + conf.notxt + '</a>';
  }


  html = html + '<a onClick="return go();" href="#">' + conf.txt + '</a></div></section></div>';

  }





  $('body').append(html);

}

function hideAlertt(){
  $('.mask').remove();
  $("#" + activeFrame)[0].contentWindow.focus();
  return false;
}

function launchDisp(uPoint,lbl){

  if($('ul.displays li[data-upoint = "' + uPoint + '"]').length){
    $('ul.displays li[data-upoint = "' + uPoint + '"] .lbl').trigger('click');
      }else{


  gid = 'disp' + guid();

  $('ul.displays li').removeClass('activeDoc');

  //if($('.displays .pinned').length == 0){
    if(true){

          $('ul.displays').append('<li data-frameid = "' + gid + '" data-uPoint="' + uPoint + '" class="activeDoc tabBar"><span class="lbl">' + lbl + '</span><a class="pinTab" title="pin tab" href="#">↓</a> <a title="pop-out tab" class="popTab" href="#">↑</a> <a class="closeTab" href="#"> × </a></li>');

        }else{

          //alert($('.pinned').length);
          $('.displays li.pinned:nth-child(' + $('.displays .pinned').length + ')').after('<li data-frameid = "' + gid + '" data-uPoint="' + uPoint + '" class="activeDoc tabBar"><span class="lbl">' + lbl + '</span><a class="pinTab" title="pin tab" href="#">↓</a> <a title="pop-out tab" class="popTab" href="#">↑</a> <a class="closeTab" href="#"> × </a></li>');

        }



  activeTab = $('ul.displays li:last-child');

  $('#frameBox').append('<iframe id="' + gid + '" scrolling="no" src="/displays/display/' + uPoint + '" frameborder="0" class="display"></iframe>');

  $('.display').hide();
  $('#' + gid).show();

  $('#' + gid)[0].contentWindow.focus();

  activeFrame = gid;

  $.fancybox.close();
  $('.edit-display').show();

  sizeBar();

}

}

function exitEdit(){



  $("#" + activeFrame)[0].contentWindow.view();

/*
      $('.edit-display').show();
$('.view-display').hide();
$('.history').hide();
$('.displays').css('visibility','visible');
 $('.openDisplay').show();
 $('.import-button').show();
$('.add-button').show();
  $('.save-button').hide();


  $('.editTitle').hide();
  */
}

function sizeBar(){
  winWidth = $(window).width();
  maxWidth = winWidth - 200;
  tabWidth = 0;
  nChild = 0;
  hideChild = 0;

  moreMenu = '';

  $('.tabBar').each(function(){
    nChild++;
    tabWidth = tabWidth + $(this).outerWidth();

    if($(this).offset().top > 1){
      moreMenu = moreMenu + '<div><span data-upoint=' + $(this).attr('data-upoint') + ' class="popLink">' + $(this).find('.lbl').html() + '</span></div>';
    }

    if((tabWidth > maxWidth) && hideChild == 0){
      hideChild = (nChild-1);
    }

  });

     //console.log('winWidth:' + winWidth);
     //console.log('maxWidth' + maxWidth);
     //console.log('tabWidth' + tabWidth);

     if(hideChild){
      $('ul.displays').css('paddingRight','90px');
      $('ul.displays').css('width',maxWidth - 100);
      $('.more').show();

      $('.pop .bg').html(moreMenu);
     $('.pop').css('left',$('.more').offset().left - 45);

      //$('.more span').html($('.tabBar').length - hideChild);

     }else{
      $('ul.displays').css('paddingRight','0px');
      $('ul.displays').css('width','auto');
      $('.more').hide();
      $('.pop').hide();
     }





}


$(document).ready(function(){

    $(".popLink").live("click", function(){





      $('.displays li[data-upoint = "' + $(this).attr('data-upoint') + '"] .lbl').trigger('click');
      $('.pop').hide();



      if($('.displays .pinned').length == 0){

          $('.displays li:first-child').before($('.displays li[data-upoint = "' + $(this).attr('data-upoint') + '"]'));

        }else{

          //alert($('.pinned').length);
          $('.displays li.pinned:nth-child(' + $('.displays .pinned').length + ')').after($('.displays li[data-upoint = "' + $(this).attr('data-upoint') + '"]'));

        }


      sizeBar();

      return false;

  });

    $(".pinTab").live("click", function(){




      if($(this).parent().hasClass('pinned')){
        $(this).parent().removeClass('pinned');
        $(this).css('color','#909090');
      }else{

        if($('.displays .pinned').length == 0){

          $('.displays').prepend($(this).parent());

        }else{

          //alert($('.pinned').length);
          $('.displays li.pinned:nth-child(' + $('.displays .pinned').length + ')').after($(this).parent());

        }

        $(this).parent().addClass('pinned');
        $(this).css('color','blue');




      }

      return false;

  });


  $('.more').click(function(){

    $('.pop').toggle();
    return false;
  });



  sizeBar();

  $('.edit-display').click(function(){

    $('.edit-display').hide();
    $('.view-display').show();
    $('.history').show();
    $('.save-button').show();
    $('.displays').css('visibility','hidden');
    $('.openDisplay').hide();
    $('.import-button').hide();
    $('.add-button').hide();

    $("#" + activeFrame)[0].contentWindow.editStage();
    $("#" + activeFrame)[0].contentWindow.focus();

  });

   $('.history').click(function(){

    $("#" + activeFrame)[0].contentWindow.hist();
    $("#" + activeFrame)[0].contentWindow.focus();
    return false;
  });

     $('.save-button').click(function(){


    //$("#" + activeFrame)[0].contentWindow.focus();
    //$("#" + activeFrame)[0].contentWindow.saveClick();
    //return false;

    exitEdit();
  });

  $('.view-display').click(function(){

    exitEdit();

  });

  $(".lbl").live("click", function(){
    $('ul.displays li').removeClass('activeDoc');
    $('.display').hide();

    $(this).parent().addClass('activeDoc');
    $('#' + $(this).parent().attr('data-frameid')).show();


    $('#' + $(this).parent().attr('data-frameid'))[0].contentWindow.focus();



    activeFrame = $(this).parent().attr('data-frameid');

  });

  $(".popTab").live("click", function(){
    window.open('/displays/display/' + $(this).parent().attr('data-upoint'), '_blank');

    $('ul.displays li').removeClass('activeDoc');
    $('.display').hide();

    $(this).parent().remove();
    $('#' + $(this).parent().attr('data-frameid')).remove();

    if($('ul.displays li').length > 0){
      $('ul.displays li:last-child .lbl').trigger('click');
      activeFrame = $('ul.displays li:last-child').attr('data-frameid');
    }

    return false;
  });

  $(".closeTab").live("click", function(){
    $('ul.displays li').removeClass('activeDoc');
    $('.display').hide();

    $(this).parent().remove();
    $('#' + $(this).parent().attr('data-frameid')).remove();

    if($('ul.displays li').length > 0){
      $('ul.displays li:last-child .lbl').trigger('click');
      activeFrame = $('ul.displays li:last-child').attr('data-frameid');
    }

    sizeBar();

  });

  //alertt('dfgs','asdfasd');
  $('ul.displays').sortable({ items: "li" });

  $('.import-button').click(function(e){
    e.preventDefault();
    $.fancybox.open([
    {
        href : '/displays/import',
        type: 'iframe',
        title : 'Import Displays'
    }
    ]);

  });

  $('.openDisplay').click(function(e){

    e.preventDefault();

    /*
    $.fancybox.open([
    {
        href : '/displays/browse',
        type: 'iframe',
        title : 'Select Displays'
    }
    ]);
*/

  $('#popupBasic').popup('open');

    //$('ul.displays').append('<li>new display<a class="closeTab" href="#">×</a></li>')


  });

  //load our default display
  launchDisp(36797,'MASTER-MENU-DISP');

});

$(window).resize(function() {
  sizeBar();
});


function setPoint(val){
      if(typeof parent.launchDisp == 'function'){
        parent.launchDisp(val,'display')
        console.log('launchDisp available')
      }else{
        console.log('only open window available')
        window.open('/display/' + val);
      }
      $('#popupBasic').popup('close');
  }


