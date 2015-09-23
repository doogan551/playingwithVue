zoom = 100;
zDec = 1;
panMode = false;
var pointerX = null;
var pointerY = null;
var editItem = null;
var editMode = false;
var notText = true;
var shiftMode = false;
var ctrlMode = false;
var tmpEl = false;
var mx = 0;
var my = 0;
var noDrag = true;
var middleButton = false;
var startZoom = 1;
var startY = 0;
var pastex = 0;
var pastey = 0;
var boxstart = false;
var boxy = 0;
var boxx = 0;
var changes = false;
var zMode = false;
var innerX = 0;
var innerY = 0;
var deltaX = 0;
var deltaY = 0;
var zx = 0;
var zy = 0;
var dragMode = false;
var dragModeTxt = false;
var canDrop = false;
var newObj;
var scrollDisplay = true;
var dx = 0;
var dy = 0;
var editMode = false;
var dragModeDynTxt = false;
var bcolor = 0;
var sizeRight = false;
var expandRight = false;
var sizeDown = false;

var sizeSouth = false;
var expandSouth = false;

var sizeEast = false;
var expandEast = false;

var sizeNorth = false;
var expandNorth = false;

var sizeX = 0;
var sizeY = 0;
var originalW = 0;
var originalH = 0;

var originalX = 0;

var socket = io.connect('http://' + window.location.hostname + ':9100');

socket.on('clipIn', function (data) {
  $('.clipBoard').html(data.data.data);
  $('.paste').show();
});



socket.on('stopAnim', function (data) {
  alert(data);
});

socket.on('aState', function (data) {

  //alert(data.aid);

  if(data.data.state == 'hide'){
    $('#' + data.data.aid).hide();
  }

  if(data.data.state == 'show'){
    $('#' + data.data.aid).show();
  }


});

socket.on('randomize', function(data) {

  clock();

});

$(window).resize(function () {
  sizeIt();
});


$(document).ready(function () {


  if ( window.self === window.top ) {
   document.title = $('#display').attr('data-label');

 } else {

  parent.setName($('#display').attr('data-label'));

  //in a frame

}



  socket.on('connect', function () {

  sess = {};
  sess.socketid = socket.socket.sessionid;
  sess.displayid = $('#display').attr('data-did');
  sess.label = $('#display').attr('data-label');

  sess.animations = [];

  $('.object[data-animationfile!=""]').each(function(){

    sess.animations.push($(this).attr('id'));

  });

  //alert(sess.animations);

  socket.emit('displayOpen', {
          data:sess
  });

  //alert(sess.displayid);
});


  $('.selectPoint').click(function(){
    popSelector();
    return false;
  });

  $('.selectPoint2').click(function(){
    popSelector2();
    return false;
  });

  $('.highlight').live("mousedown", function (e) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  });

  sizeIt();


  $('#bsc').mousedown(function () {

    dragMode = true;
    $('#zoverlay').show();

  });

  $('#txt').mousedown(function () {

    dragModeTxt = true;
    $('#zoverlay').show();

  });

   $('#dyntxt').mousedown(function () {

    dragModeDynTxt = true;
    $('#zoverlay').show();

  });

  $('#txt').bind("dragstart", function () {
    return false;
  });

  $('#bsc').bind("dragstart", function () {
    return false;
  });

   $('#dyntxt').bind("dragstart", function () {
    return false;
  });

  if (window.location.hash) {
    var hash = window.location.hash.substring(1); //Puts hash in variable, and removes the # character
    if (hash == 'edit') {
      edit();
    }
  }

  $("#slider").slider({
    change: function (event, ui) {
      changes = true;

      $('#trans').val(ui.value);

      editItem.css('opacity', ui.value / 100);

      editItem.attr('data-opacity', ui.value / 100)

    },
    slide: function (event, ui) {
      changes = true;

      $('#trans').val(ui.value);

      editItem.css('opacity', ui.value / 100);

      editItem.attr('data-opacity', ui.value / 100)

    },
    value: 100
  });

  $('#trans').change(function () {
    $("#slider").slider("value", $(this).val());
  });

  $('#font').change(function () {

    editItem.css('fontFamily', $(this).val());

  });

  $('#fontsize').change(function () {

    editItem.css('fontSize', $(this).val());

  });


  $('.rightToolbar input').focus(function () {

    $(this).parent().css('backgroundColor', '#6d6d6d');

  });

  $('.rightToolbar textarea').focus(function () {

    $(this).parent().css('backgroundColor', '#6d6d6d');

  });

  $('.rightToolbar input').blur(function () {

    $(this).parent().css('backgroundColor', '#494949');

  });

  $('.rightToolbar textarea').blur(function () {

    $(this).parent().css('backgroundColor', '#494949');

  });

  $('.rightToolbar select').focus(function () {

    $(this).parent().css('backgroundColor', '#6d6d6d');

  });

  $('.rightToolbar select').blur(function () {

    $(this).parent().css('backgroundColor', '#494949');

  });

  if (window.opener) {
    if (window.opener.location != null) {
      $('body').append('<a style="text-decoration:none;padding:5px;position:absolute;top:0px;left:0px;color:white;background-color:#494949;font-size:12px;" onClick="popIn(' + $('#display').attr('data-upoint') + ');window.close();" href="#">← Pop-In</a>');
    }
  }


  $('.tg').change(function () {

    $('.grid1').hide();
    $('.grid2').hide();

    if ($('.tg').val() == 1) {
      $('.grid1').show();
    }

    if ($('.tg').val() == 2) {
      $('.grid2').show();
    }

  });

  $(document).bind("contextmenu", function (e) {
    return false;
  });


  $('.activeObjects').mouseenter(function () {
    scrollDisplay = false;
  });

  $('.activeObjects').mouseleave(function () {
    scrollDisplay = true;
  });

  $('#zoverlay').mouseleave(function () {
    canDrop = false;

    if (dragMode) {
      $('#bsc').css('visibility', 'visible ');
      newobj.remove();
      addLayers();
    }


    if (dragModeTxt) {
      $('#txt').css('visibility', 'visible ');
      newobj.remove();
      addLayers();
    }

    if (dragModeDynTxt) {
      $('#dyntxt').css('visibility', 'visible ');
      newobj.remove();
      addLayers();
    }

  });

  $('#zoverlay').mouseenter(function () {
    canDrop = true;

    if (dragMode) {
      $('#bsc').css('visibility', 'hidden');


      gid = guid();
      $('#objs').append('<div id="obj' + gid + '" style="position:absolute;left:' + (zx + 11) + 'px;top:' + (zy - 1) + 'px; color: rgb(0, 0, 0); font-size: 13px; font-family: \'Arial\'; width: 101px; height: 15px; line-height: 15px;" data-objecttype="151" data-screenobject="1" data-fontname="MS Sans Serif" data-left="' + zx + '" data-fontitalic="0" data-forecolor="0" data-backcolor="0" data-fontbold="0" data-width="235" data-height="15" data-upoint="0" data-animationfile="" data-fontsize="10" data-top="' + zy + '" class="object displayButton"></div>');
      newobj = $('#obj' + gid);
      addLayers();

    }

    if (dragModeTxt) {
      $('#txt').css('visibility', 'hidden');


      gid = guid();
      $('#objs').append('<div id="obj' + gid + '" style="position:absolute;left:' + (zx + 11) + 'px;top:' + (zy - 1) + 'px; color: #cccccc; font-size: 13px; font-family: \'Arial\'; width: 101px; height: 15px; " data-objecttype="0" data-screenobject="2" data-fontname="MS Sans Serif" data-left="' + zx + '" data-fontitalic="0" data-forecolor="12632256" data-backcolor="0" data-fontbold="0" data-width="235" data-height="15" data-upoint="0" data-animationfile="" data-fontsize="10" data-top="' + zy + '" class="object">Text Label</div>');
      newobj = $('#obj' + gid);
      addLayers();

    }

    if (dragModeDynTxt) {
      $('#dyntxt').css('visibility', 'hidden');


      gid = guid();
      $('#objs').append('<div id="obj' + gid + '" style="position:absolute;left:' + (zx + 11) + 'px;top:' + (zy - 1) + 'px; color: #cccccc; font-size: 13px; font-family: \'Arial\'; width: 101px; height: 15px; " data-objecttype="1" data-screenobject="1" data-fontname="MS Sans Serif" data-left="' + zx + '" data-fontitalic="0" data-forecolor="12632256" data-backcolor="0" data-fontbold="0" data-width="235" data-height="15" data-upoint="123" data-animationfile="" data-fontsize="10" data-top="' + zy + '" class="object">###</div>');
      newobj = $('#obj' + gid);
      addLayers();

    }

  });


  $('#zoverlay').bind('mousemove' /* etc.*/ , function (e) {

    if (dragMode || dragModeTxt || dragModeDynTxt) {
      zx = e.offsetX;
      zy = e.offsetY;
      newobj.css('left', zx);
      newobj.css('top', zy);

    }

    if (boxstart) {

      offleft = e.offsetX - innerX;
      offtop = e.offsetY - innerY;

      if (offleft > 0) {
        $('#selection').css('width', offleft);
      }

      if (offtop > 0) {
        $('#selection').css('height', offtop);
      }

      if (offtop < 0) {
        $('#selection').css('top', topbox + offtop);
        $('#selection').css('height', offtop * -1);
      }

      if (offleft < 0) {

        $('#selection').css('left', leftbox + offleft);
        $('#selection').css('width', offleft * -1);
      }

    }

  });



  $('#display').bind('mousedown' /* etc.*/ , function (e) {


    if (e.type == 'mousedown') {

      if (e.which == 1 &&
        e.target.className != 'object displayButton' &&
        e.target.className != 'object' &&
        e.target.className != 'object ui-draggable' && e.target.className != 'object displayButton ui-draggable' &&
        e.target.className != 'object displayButton ui-draggable glow' &&
        e.target.className != 'object ui-draggable glow' &&
        e.target.className != 'highlight' &&
        e.target.className != 'object ui-draggable displayButton' &&
        e.target.className != 'object displayButton glow ui-draggable') {

        blurEdit();
        $('#menu').hide();
        $('#menu2').hide();

        if (editMode) {

          boxstart = true;
          boxx = mx;
          boxy = my;
          $('#zoverlay').show();
          $('#selection').css('width', '0');
          $('#selection').css('height', '0');
          $('#selection').show();

          topbox = event.offsetY;
          innerY = topbox;

          leftbox = event.offsetX;
          innerX = leftbox;

          deltaX = mx;
          deltaY = my;

          $('#selection').css('top', topbox);
          $('#selection').css('left', leftbox);

        }

      }


    }
  });


  $(document).live('mousemove', function (e) {

    if(expandRight){
      $('#display').css('width',originalW - (sizeX - e.pageX));
    }

    if(expandSouth){
      $('#display').css('height',originalH - (sizeY - e.pageY));
    }

    if(expandEast){
      $('#display').css('width',originalW + (sizeX - e.pageX));
      $('#display').css('left',originalX - (sizeX - e.pageX));

      $('#display .object').each(function(){

        if($(this).attr('data-ox') == 'none'){
        $(this).attr('data-ox',$(this).css('left').replace(/[^-\d\.]/g, '') * 1);
        }

        $(this).css('left',($(this).attr('data-ox')*1) + ((sizeX - e.pageX)*1));
      });

      $('.bimg').each(function(){

        if($(this).attr('data-ox') == 'none'){
        $(this).attr('data-ox',$(this).css('left').replace(/[^-\d\.]/g, '') * 1);
        }

        $(this).css('left',($(this).attr('data-ox')*1) + ((sizeX - e.pageX)*1));
      });


    }

    if(expandNorth){
      $('#display').css('height',originalH + (sizeY - e.pageY));
      $('#display').css('top',originalY - (sizeY - e.pageY));

      $('#display .object').each(function(){

        if($(this).attr('data-oy') == 'none'){
        $(this).attr('data-oy',$(this).css('top').replace(/[^-\d\.]/g, '') * 1);
        }

        $(this).css('top',($(this).attr('data-oy')*1) + ((sizeY - e.pageY)*1));

      });

      $('.bimg').each(function(){

        if($(this).attr('data-oy') == 'none'){
        $(this).attr('data-oy',$(this).css('top').replace(/[^-\d\.]/g, '') * 1);
        }

        $(this).css('top',($(this).attr('data-oy')*1) + ((sizeY - e.pageY)*1));



      });

    }

    if(editMode){
      sizeIt = false;
      rightEdge = $('#display').offset().left + $('#display').outerWidth();
      bottomEdge = $('#display').offset().top + $('#display').outerHeight();

      if((e.pageX > rightEdge) && (e.pageX < (rightEdge + 10))){
        //console.log('SIZE RIGHT');
        $('body').css('cursor','ew-resize');
        sizeRight = true;
        sizeIt = true;
      }

      if((e.pageX < $('#display').offset().left) && (e.pageX > ($('#display').offset().left - 10))){
        //console.log('SIZE RIGHT');
        $('body').css('cursor','ew-resize');
        sizeIt = true;
        sizeEast = true;
      }

      if((e.pageY > bottomEdge) && (e.pageY < (bottomEdge + 10))){
        //console.log('SIZE DOWN');
        $('body').css('cursor','ns-resize');
        sizeIt = true;
        sizeSouth = true;
      }

      if((e.pageY < $('#display').offset().top) && (e.pageY > ($('#display').offset().top - 10))){
        //console.log('SIZE DOWN');
        $('body').css('cursor','ns-resize');
        sizeNorth = true;
        sizeIt = true;
      }


      if(sizeIt == false){
        $('body').css('cursor','default');
        sizeRight = false;
        sizeSouth = false;
        sizeEast = false;
        sizeNorth = false;
      }

    }

    mx = e.pageX;
    my = e.pageY;

    if (dragMode) {
      $("#bsc").css('position', 'relative');
      $("#bsc").css('left', mx - 5);
      $("#bsc").css('top', my - 85);
    }

    if (dragModeTxt) {
      $("#txt").css('position', 'relative');
      $("#txt").css('left', mx);
      $("#txt").css('top', my - 285);
    }

     if (dragModeDynTxt) {
      $("#dyntxt").css('position', 'relative');
      $("#dyntxt").css('left', mx);
      $("#dyntxt").css('top', my - 285);
    }



    if (middleButton) {

      delta = startY - my;
      delta = delta / 100;

      if ((zDec + delta) > .1) {

        zDec = zDec + delta;
      } else {
        zDec = .1;

      }

      zoomDisplay(zDec);
    }

    if (false) {

      offleft = (mx) - deltaX;
      offtop = (my) - deltaY;

      if (zDec > 1) {
        offleft = mx - $('#display').offset().left;
      }

      if (zDec < 1) {
        offleft = (mx * zDec) - (deltaX * zDec);
      }

      ol = $('#display').css('left');
      ow = $('#display').width();
      console.log(ol);


      $('#selection').css('width', offleft);
      $('#selection').css('height', offtop);
    }

  });

  $('#display').mousedown(function (event) {
    switch (event.which) {
      case 1:
        break;
      case 2:
        middleButton = true;
        break;
      case 3:
        console.log(event);
        tmpEl = $('#' + event.target.id);

        if(event.target.className == 'highlight'){
          tmpEl = $('#' + event.srcElement.attributes[0].nodeValue);
        }

        $('#zoverlay').show();
        noDrag = true;
        $('#container').draggable({
          start: function () {
            noDrag = false;
          }
        });
        var coords = {
          clientX: mx,
          clientY: my
        };

        // this actually triggers the drag start event
        $('#container').simulate("mousedown", coords);
        return false;
        break;
      default:
    }
  });



  $(document).mousedown(function (e) {

    if (e.which == 1) {
      if(sizeRight){
        sizeX = e.pageX;
        originalW = $('#display').outerWidth();
        expandRight = true;
      }

      if(sizeEast){
        sizeX = e.pageX;
        originalW = $('#display').outerWidth();
        originalX = $('#display').css('left').replace(/[^-\d\.]/g, '') * 1;
        expandEast = true;
        $('.object').attr('data-ox','none');
        $('.bimg').attr('data-ox','none');
      }

      if(sizeNorth){
        sizeY = e.pageY;
        originalH = $('#display').outerHeight();
        originalY = $('#display').css('top').replace(/[^-\d\.]/g, '') * 1;
        expandNorth = true;
        $('.object').attr('data-oy','none');
        $('.bimg').attr('data-oy','none');
      }

      if(sizeSouth){
        sizeY = e.pageY;
        originalH = $('#display').outerHeight();
        expandSouth = true;
      }
    }

    if (e.which == 2) {
      middleButton = true;
      $('#zoverlay').show();
      $('body').css('cursor', 'url(/images/pushpull.png) 0 0, auto');
      startY = my;
      startZoom = zDec;

    }
  });

  $(document).mouseup(function (e) {

    if (e.which == 1) {
        sizeRight = false;
        expandRight = false;
        sizeSouth = false;
        expandSouth = false;
        expandEast = false;
        expandNorth = false;

    }

    if (dragMode) {
      $('#zoverlay').hide();
      dragMode = false;
      $("#bsc").animate({
        left: 0,
        top: 0
      });
      $('#bsc').css('visibility', 'visible');

      if (canDrop) {
        canDrop = false;
        editItem = newobj;
        editThis(newobj);
        bindDrag();

      }

    }

    if (dragModeTxt) {
      $('#zoverlay').hide();
      dragModeTxt = false;
      $("#txt").animate({
        left: 0,
        top: 0
      });
      $('#txt').css('visibility', 'visible');

      if (canDrop) {
        canDrop = false;

        editItem = newobj;
        editThis(newobj);
        bindDrag();

      }

    }

    if (dragModeDynTxt) {


      popSelector();

      $('#zoverlay').hide();
      dragModeDynTxt = false;
      $("#dyntxt").animate({
        left: 0,
        top: 0
      });
      $('#dyntxt').css('visibility', 'visible');

      if (canDrop) {
        canDrop = false;

        editItem = newobj;
        editThis(newobj);
        bindDrag();

      }

    }

    if (boxstart) {
      boxstart = false;


      var intersectors = [];

    var $target = $('#selection');
    var tAxis = $target.position();
    var t_x = [tAxis.left, tAxis.left + $target.outerWidth()];
    var t_y = [tAxis.top, tAxis.top + $target.outerHeight()];

    $('.object').each(function() {
          var $this = $(this);
          var thisPos = $this.position();
          var i_x = [thisPos.left, thisPos.left + $this.outerWidth()]
          var i_y = [thisPos.top, thisPos.top + $this.outerHeight()];

          if ( t_x[0] < i_x[1] && t_x[1] > i_x[0] &&
               t_y[0] < i_y[1] && t_y[1] > i_y[0]) {
              //intersectors.push($this);


              addGlow($(this));
            $('.activeObjects li[data-id="' + $(this).attr('id') + '"]').css('backgroundColor', '#6d6d6d');

          }

    });

    $('#zoverlay').hide();
    $('#selection').hide();


    }

    if (e.which == 2) {
      middleButton = false;
      //console.log('middle button false');
      $('#zoverlay').hide();
      $('body').css('cursor', 'auto');
    }
  });

  $('#zoverlay').mouseup(function (e) {

    switch (event.which) {
      case 1:
        break;
      case 2:
        middleButton = false;
        break;
      case 3:

        var coords = {
          clientX: mx,
          clientY: my
        };
        $('#container').simulate("mouseup", coords);
        $('#container').draggable("destroy");
        $('#zoverlay').hide();

        if (editMode && (noDrag == true)) {

          if (tmpEl.hasClass('object')) {

            addGlow(tmpEl);
            if ($('.glow').length > 1) {

            }

            editItem = tmpEl;

            $('#menu').css({

              top: my + 'px',
              left: (tmpEl.offset().left - (115)) + (tmpEl.width() / 2) + 'px'
            }).show();
          } else {
            blurEdit();

            if ($('.clipBoard').html() != '') {

              pastex = mx;
              pastey = my;

              $('#menu2').css({
                top: (my - 10) + 'px',
                left: mx - 118 + 'px'
              }).show();
            }
          }

          return false;
        }

        break;
      default:
    }
  });


  $('.clear').click(function () {
    $('.clipBoard').html('');
    socket.emit('clipOut', {
      data: $('.clipBoard').html()
    });
    return false;
  });

  $('.copyObjects').click(function () {

    $('.glow').each(function () {
      addClip($(this));
    });

  });

  $('textarea').focus(function () {
    notText = false;
  });

  $('input[type="text"]').focus(function () {
    notText = false;
  });

  $('input[type="text"]').blur(function () {
    notText = true;
  });

  $('textarea').blur(function () {
    notText = true;
  });

  $('.paste').click(function () {
    paste();
    return false;
  });

  $('#menu').click(function () {
    $('#menu').hide();
  });

  $('#menu2').click(function () {
    $('#menu2').hide();
  });

  $(document).click(function () {
    $('#menu').hide();
    $('#men2').hide();
  });

  $('.version span').each(function () {
    $(this).html(timeConverter($(this).html()));
  });

  $('.version span').click(function () {

    /*
    if($(this).hasClass('production')){
      parent.confirmm({
        title: 'Are you sure?',
        body: 'You are about to overwrite the staging version with a copy of the current production version. Are you sure?',
        txt: 'Yes',
        action: function () {
          parent.hideAlertt();
          alert('boom');
        }
      });
    }else{
      */

      ver = $(this).parent().find('a').attr('href');
      parent.confirmm({
        title: 'Are you sure?',
        body: 'Are you sure you want to load this display as the staging version? Any current staging changes will be lost.',
        txt: 'Yes',
        action: function () {
          parent.hideAlertt();
          window.location = ver;
          return false;
        }
      });
    //}

  });

  $('#lbltxt').keyup(function () {
    newLbl = $(this).val().split("\n").join('<br>');
    editItem.html(newLbl + '<div data-parent="' + editItem.attr('id') + '" class="highlight"></div>');
    $('.activeObjects li[data-id="' + editItem.attr('id') + '"] .inlbl').html(newLbl);
  });

  $('#sizew').keyup(function () {
    editItem.css('width', $(this).val());
  });

  $('#sizeh').keyup(function () {
    editItem.css('height', $(this).val());
  });

  $(".object").live("click", function () {

    if (editMode == false) {
      if ($(this).hasClass('displayButton')) {
        if (typeof parent.launchDisp == 'function') {
          parent.launchDisp($(this).attr('data-upoint'), 'display')
        } else {
          window.open('/displays/display/' + $(this).attr('data-upoint'));
        }
      }

    } else {
      editItem = $(this);
      editThis();
    }

  });

  $('#container').click(function (e) {

    if ($('#' + e.target.id).hasClass('object')) {
    } else {
      blurEdit();
    }
  });

  window.addEventListener('keydown', function (e) {
    if (true) {
      e.stopPropagation();
      return false;
    }
  });

  $(document).keyup(function (e) {

    if (editMode) {
      if (e.keyCode == 8 || e.keyCode == 46) {
        if (notText) {
          e.preventDefault();
          removeItem();
        }
      }
    }

  });

  $(document).keydown(function (e) {

    console.log(e.keyCode);

    if (editMode) {

      if (e.keyCode == 27) {
        blurEdit();
      }

      if (e.keyCode == 8 || e.keyCode == 46) {
        if (notText) {
          e.preventDefault();
        }
      }
    }

    if (editMode) {
      if (e.keyCode >= 37 && e.keyCode <= 40) {
        changes = true;
        zd = zDec
        if (notText) {

          $('.glow').each(function () {
            eItem = $(this);

            if (e.keyCode == 38) {
              newtop = (eItem.css('top').replace(/[^-\d\.]/g, '') * 1) - (1);
              eItem.css('top', newtop);

            }

            if (e.keyCode == 40) {
              newtop = (eItem.css('top').replace(/[^-\d\.]/g, '') * 1) + (1);
              eItem.css('top', newtop);
            }

            if (e.keyCode == 37) {
              newtop = (eItem.css('left').replace(/[^-\d\.]/g, '') * 1) - (1);
              eItem.css('left', newtop);
            }

            if (e.keyCode == 39) {
              newtop = (eItem.css('left').replace(/[^-\d\.]/g, '') * 1) + (1);
              eItem.css('left', newtop);
            }

          });

        }

      }

    }

    if (e.keyCode == 68 && panMode == false) {
      $('#container').draggable({
        cursor: 'move'
      });

      $('#zoverlay').show();

      var coords = {
        clientX: mx,
        clientY: my
      };

      $('#container').simulate("mousedown", coords);
      panMode = true;
    }

    if (e.keyCode == 16 && shiftMode == false) {
      shiftMode = true;
    }

    if (e.keyCode == 90 && zMode == false) {
      zMode = true;
    }

    if (e.keyCode == 17 && ctrlMode == false) {
      ctrlMode = true;
    }

  });

  $(document).keyup(function (e) {

    if (e.keyCode == 16) {
      shiftMode = false;
    }

    if (e.keyCode == 90) {
      zMode = false;
    }

    if (e.keyCode == 17) {
      ctrlMode = false;
    }

    if (e.keyCode == 68) {
      var coords = {
        clientX: 1,
        clientY: 1
      };

      $('#container').simulate("mouseup", coords);
      $('#container').draggable("destroy");
      panMode = false;
      $('#zoverlay').hide();
      $
    }

  });


  $.fn.liveDroppable = function (opts) {
    this.live("mouseenter", function () {
      if (!$(this).data("init")) {
        $(this).data("init", true).droppable(opts);
      }
    });
  };

  $("#container").droppable({
  });

  $("#objs").droppable({
    drop: dropBind
  });

  $('.closeTab').click(function () {
    $('.minBar').show();
    $('.leftToolbar').animate({
      left: '-220px'
    }, 500);

    $('.zoomBar').animate({
      left: '0px'
    }, 500);

    return false;

  });

  $('.popMin').click(function () {
    slideBar();

    return false;
  })

  $('.popDisp').click(function () {
    $('.tabs .display').trigger('click');
    slideBar();
    return false;
  })

  $('.popLib').click(function () {
    $('.tabs .library').trigger('click');
    slideBar();
    return false;
  })

  $(document).mousewheel(function (event, delta, deltaX, deltaY) {

    if (middleButton == false) {
      if (shiftMode) {
        if (scrollDisplay) {
          nTop = $('#container').css('left').replace(/[^-\d\.]/g, '') * 1;
          nTop = (nTop * 1) + (delta * 2);
          $('#container').css('left', nTop);
        }
      } else if (zMode) {
        if (((zDec * 100 + delta) * .01) > .1) {
          zDec = (zDec * 100 + delta) * .01;
          zoomDisplay(zDec);
        }

      } else {
        if (scrollDisplay) {
          nTop = $('#container').css('top').replace(/[^-\d\.]/g, '') * 1;
          nTop = (nTop * 1) + (delta * 2);
          $('#container').css('top', nTop);
        }
      }
    }
  });

  formatObjects();
  addLayers();

  setInterval(function () {
    //clock()
  }, 1000);


  $('.controlButton').click(function () {
    parent.alertt('Not implemented yet', 'not implemeted yet');
  });

  $('.zoomin-tool').click(function () {
    zDec = zDec + .1;
    zoomDisplay(zDec);
    return false;
  });

  $('.zoom-tool').click(function () {
    zDec = 1;
    zoomDisplay(zDec);
    $('#container').css('transform', 'scale(' + zDec + ',' + zDec + ')');
    $('#container').css('top', '0px');
    $('#container').css('left', '0px');

    return false;
  });

  $('.zoomout-tool').click(function () {
    if ((zDec - .1) > .1) {
      zDec = zDec - .1;
      zoomDisplay(zDec);
    }
    return false;
  });

});

