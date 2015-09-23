var activeDisplay = '';
var activeObject = '';
var displayId = '';
var changes = false;

function getDisp(did){
  displayId = did;
  $('#' + activeObject).attr("onClick","return launchDisp('" + did + "');");
  $.fancybox.close();
}

function updateBg(color){
  //console.log(color);
  activeDisplay.css('backgroundColor',color);
}

function rgb2hex(rgb) {
    rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    function hex(x) {
        return ("0" + parseInt(x).toString(16)).slice(-2);
    }
    return "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
}

  function bindEdit(){


        $('.activeObjects').html('');

    activeDisplay.find('.dragOb').each(function(){
      inner = $(this).html();

      if($(this).hasClass('btn')){
        inner = '<strong style="font-weight:bold;">button: </strong>' + inner;
      }

      if($(this).hasClass('txt')){
        inner = '<strong style="font-weight:bold;">text: </strong>' + inner;
      }

      $('.activeObjects').prepend('<li data-id="' + $(this).attr('id') + '" style="overflow:hidden;" class="oblayer sortable"><div style="float:left;width:150px">' + inner + '</div><div class="handle"></div></li>');

    });

    $('.oblayer .edit').click(function(){
      changes = true;
      activeObject = $(this).parent().attr('data-id');

      //alert(activeObject);

      $('.ToolbarSet2 .selectionTitle').html($('#' + activeObject).html());
      $('.ToolbarSet2 #text').val($('#' + activeObject).html());

      $('.ToolbarSet2').slideDown('fast');
      //$('.editButton').slideDown('fast');

      return false;
    });

    $('.oblayer').hover(
      function(){
        $('.dragOb').removeClass('glow');
        oid = $(this).attr('data-id');
        $('#' + oid).addClass('glow');
        //$('' + ).hide();
    },
    function(){

    });

  }

$(document).ready(function() {

$('#text').keydown(function(){

  $('#' + activeObject).html($(this).val());

});

$('#text').keyup(function(){

  $('#' + activeObject).html($(this).val());

});
  // View Modes

  //$('.view-display').addClass('hidden');
  //$('.leftToolbar').addClass('hidden');
  //$('.rightToolbar').addClass('hidden');

  $('.view-display').click(function(){

    ex = true;

    if(changes){

      if(confirm('Are you sure you want to exit edit mode? You will lose your unsaved changes.')){
        //delete display and



                   $('.dragOb').removeClass('glow');
    editMode = false;
    $(this).addClass('hidden');
    $('.leftToolbar').addClass('hidden');
    $('.rightToolbar').addClass('hidden');
    $('.zoomBar').removeClass('hidden');
    $('.edit-display').removeClass('hidden');
    //$('.edit-display').show();

    activeDisplay.find('.dragOb').draggable( "destroy" );
    activeDisplay.find('.dragOb').css('cursor','pointer');
    //activeDisplay.find('.dragOb').attr('contenteditable','false');

    $('.displays').css('visibility','visible');
    $('.openDisplay').css('visibility','visible');

    $('.save-button').hide();
    $('.add-button').show();
    $('.import-button').show();

    sizeCanvas();


    //console.log(activeDisplay);






    up = activeDisplay.attr('data-upoint');

    $('li[data-uid="' + activeDisplay.attr('id') + '"] .closeTab').trigger('click');


    launchDisp(up);
    $('.edit-display').show();

      }else{





      }

    }else{



                 $('.dragOb').removeClass('glow');
    editMode = false;
    $(this).addClass('hidden');
    $('.leftToolbar').addClass('hidden');
    $('.rightToolbar').addClass('hidden');
    $('.zoomBar').removeClass('hidden');
    $('.edit-display').removeClass('hidden');
    //$('.edit-display').show();

    activeDisplay.find('.dragOb').draggable( "destroy" );
    activeDisplay.find('.dragOb').css('cursor','pointer');
    //activeDisplay.find('.dragOb').attr('contenteditable','false');

    $('.displays').css('visibility','visible');
    $('.openDisplay').css('visibility','visible');

    $('.save-button').hide();
    $('.add-button').show();
    $('.import-button').show();

    sizeCanvas();


    //console.log(activeDisplay);




    //$('li[data-uid="' + activeDisplay.attr('id') + '"] .closeTab').trigger('click');

    //up = activeDisplay.attr('data-upoint');
    //launchDisp(up);



    }



  });

  function saveDisplay(){
    alert('Display Saved.');
    changes = false;
  }





  $('.save-button').click(function(){
    saveDisplay();
    //return false;
  });

  $('.edit-display').click(function(){

    changes = false;

    $('.displays').css('visibility','hidden');
    $('.openDisplay').css('visibility','hidden');

    editMode = true;
    $(this).addClass('hidden');
    $('.leftToolbar').removeClass('hidden');
    $('.rightToolbar').removeClass('hidden');
    $('.zoomBar').addClass('hidden');
    $('.view-display').removeClass('hidden');
    $('.edit-display').addClass('hidden');

    $('.save-button').show();
    $('.add-button').hide();
    $('.import-button').hide();

    bPath = activeDisplay.find('.bg img').attr('src');

    bPath = bPath.split('/');

    $('#bImg').html(bPath[3]);


    //alert(activeDisplay);

    activeDisplay.find('.dragOb').draggable({containment: "parent",  grid: [ 1,1 ]});
    activeDisplay.find('.dragOb').css('cursor','move');
    activeDisplay.css('zoom','100%');
    activeDisplay.css('left','0px');
    activeDisplay.css('top','0px');
    //activeDisplay

    $(".dragOb").bind("contextmenu", function(e) {

      $('div.menu').css({
        top: e.pageY+'px',
        left: e.pageX+'px'
    }).show();


      $('.menu .eLink').attr('data-activeObject',e.currentTarget.id);
      $('.menu .dLink').attr('data-activeObject',e.currentTarget.id);


    return false;
    });

    $('.menu').click(function() {
        $('.menu').hide();
    });
    $(document).click(function() {
        $('.menu').hide();
    });

    //activeDisplay.find('.dragOb').attr('contenteditable','true');


    //alert(activeDisplay.css('backgroundColor'));
    $('#bgColor').val(rgb2hex(activeDisplay.css('backgroundColor')));

    bindEdit();
    sizeCanvas();

  });



  // Document Tabs

  $('.displays > li').click(function(){
    $(this).siblings().removeClass('activeDoc');
    $(this).addClass('activeDoc');
  });

  // Accordion

  $(function(){
    $('.accordion').css({'max-height':(($(window).height())-121)+'px'});
    $(window).resize(function(){
    $('.accordion').css({'max-height':(($(window).height())-121)+'px'});
    });
  });

  //$('.accordion-content').hide();

  $('.objectTypes > li > .accordion-heading').click(function(){
    //$('.objectTypes > li > .accordion-content').slideUp();
    $(this).next().not(':animated').slideToggle();
    $(this).toggleClass('open');
    //$(this).closest('li').siblings().children().removeClass('open');
  });

  $('.rightToolbar > div > ul > li > .accordion-heading').click(function(){
    //$('.rightToolbar > div > ul > li > .accordion-content').slideUp();
    $(this).next().not(':animated').slideToggle();
    $(this).toggleClass('open');
    //$(this).closest('li').siblings().children().removeClass('open');
  });

  // Font Settings

  $('ul.fontstyles > li').click(function(){
    $(this).toggleClass('styleOn');
  });

  // Tabs

  $('.tabs > .library').click(function(){
    $('.tabs > li').removeClass('active');
    $(this).addClass('active');
    $('.objectTypes').removeClass('hidden');
    $('.activeObjects').addClass('hidden');
  });
  $('.tabs > .display').click(function(){
    $('.tabs > li').removeClass('active');
    $(this).addClass('active');
    $('.objectTypes').addClass('hidden');
    $('.activeObjects').removeClass('hidden');
  });

  // MoveTools

  $('.viewControls > ul > li').click(function(){
    $(this).siblings().removeClass('active');
    $(this).addClass('active');
  });

  // Lock

  $('.lock').click(function(){
    $(this).toggleClass('locked');
  });

  // Layers
  $('ul.activeObjects').sortable({  items: ">li.sortable", update: function(){
    console.log('done!');
    maxZ = ($('ul.activeObjects li').length);
    maxZ = maxZ*1;
    $('ul.activeObjects li').each(function(){
      $('#' + $(this).attr('data-id')).css('zIndex',maxZ);
      maxZ = maxZ -1;
    });

  } });

  // Modals
  $('.miniExplorer').draggable();

  // Example Buttons
  $('.exampleButtons > a').draggable();


  // Document Tabs
  $('ul.displays').sortable({ items: "li" });


});     // End Document Ready