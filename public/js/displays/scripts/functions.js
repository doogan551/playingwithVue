function dropBind(event, ui) {

  changes = true;
  if (event.srcElement.id == 'bsc') {
    gid = guid();
    var nx = ui.offset.left - $(this).offset().left;
    var ny = ui.offset.top - $(this).offset().top;
    ny = ny / zDec;
    nx = nx / zDec;
    nx = Math.floor(nx);
    ny = Math.floor(ny);
    nx = nx - 350;
    ny = ny - 15;
    gid = guid();
    $('#objs').append('<div id="obj' + gid + '" style="position:absolute;left:' + nx + 'px;top:' + ny + 'px; color: rgb(0, 0, 0); font-size: 13px; font-family: \'Arial\'; width: 101px; height: 15px; line-height: 15px;" data-objecttype="151" data-screenobject="1" data-fontname="MS Sans Serif" data-left="' + ny + '" data-fontitalic="0" data-forecolor="0" data-backcolor="0" data-fontbold="0" data-width="235" data-height="15" data-upoint="0" data-animationfile="" data-fontsize="10" data-top="' + ny + '" class="object displayButton glow"></div>');
    editItem = $('#obj' + gid);
    editThis($('#obj' + gid));
    bindDrag();
    $('#zoverlay').hide();
  }

}

function setPoint(point){
  //alert(pt);

  $('#pointLink').val(point);
  editItem.attr('data-upoint',point);
  $.fancybox.close();


}

function selectPoint(point){
  $('#pointLink').val(point);
  editItem.attr('data-upoint',point);
  $.fancybox.close();
}

function popSelector(){

  $.fancybox.open([
    {
        href : '/pointselector#&ui-state=dialog',
        type: 'iframe',
        title : 'Select Point',
        height: '500px'
    }
    ]);
}

function popSelector2(){

  $.fancybox.open([
    {
        href : '/pointselector#&ui-state=dialog',
        type: 'iframe',
        title : 'Select Point'
    }
    ]);
}

function editStage() {
  v = $('#stagingLink').attr('href');
  window.location = v;
}

function zoomDisplay(z) {
  $('#container').css('transform', 'scale(' + z + ',' + z + ')');
}

function bindDrag() {
  $('#display .object').draggable({
    grid: [1, 1],
    start: function () {
      dx = $(this).css('left').replace(/[^-\d\.]/g, '') * 1;
      dy = $(this).css('top').replace(/[^-\d\.]/g, '') * 1;
      $('.object').attr('data-origx', 'no');
      $('.object').attr('data-origy', 'no');
    },
    stop: function () {
      $('.object').attr('data-origx', 'no');
      $('.object').attr('data-origy', 'no');
    },
    drag: function (evt, ui) {
      changes = true;
      ui.position.top = Math.round(ui.position.top / (zDec));
      ui.position.left = Math.round(ui.position.left / (zDec));
      nx = Math.round(ui.position.left);
      ny = Math.round(ui.position.top);
      curr = $(this).attr('id');

      $('.glow').each(function () {
        if ($(this).attr('id') != curr) {
          if ($(this).attr('data-origx') != 'no') {
          }else {
            $(this).attr('data-origx', $(this).css('left').replace(/[^-\d\.]/g, ''));
            $(this).attr('data-origy', $(this).css('top').replace(/[^-\d\.]/g, ''));
          }
          $(this).css('left', $(this).attr('data-origx') * 1 - (dx - nx));
          $(this).css('top', $(this).attr('data-origy') * 1 - (dy - ny));
        }
      });
    }
  });
  addLayers();
}

function edit() {
    bcolor = $('body').css('backgroundColor');

    $('body').css('backgroundColor','none');
    $('body').css('backgroundImage','url(/images/linen.jpg)');

    $('#display').css('backgroundColor',bcolor);
    $('#display').css('boxShadow','0 0 15px #000000');

    $('.object').css('cursor','move');

  editMode = true;
  $('.leftToolbar').show();

  $('.leftToolbar').animate({
    left: '0px'
  }, 500, function () {
    $('.minBar').show();
  });

  $('.zoomBar').animate({
    left: '220px'
  }, 500);

  bindDrag();
  parent.$('.editTitle').html('EDITING DISPLAY: <span style="text-shadow:none;color:yellow;">' + $('#display').attr('data-label') + ' ' + timeConverter($('#display').attr('data-revdate')) + '</span>');
  parent.$('.editTitle').show();

}

function guid() {
  return Math.floor(
    Math.random() * 0x1000000 /* 65536 */ ).toString(16);
}

function saveClick(saveType) {

  backgroundImage = $('.bimg').attr('src').split('/').pop();
  dName = $('#display').attr('data-label');
  displayHeight = $('#display').height();
  displayWidth = $('#display').width();
  backgroundColor = $('#display').attr('data-backgroundcolor');
  uPoint = $('#display').attr('data-upoint');
  objects = [];

  $('.object').each(function () {

    $(this).find('.highlight').remove();
    txtlbl = $(this).html().replace(/(<br>)+/g, "\n");
    //txtlbl = txtlbl.replace('<div class="highlight"></div>', '')
    obj = {
      TOP: $(this).css('top').replace(/[^-\d\.]/g, ''),
      LEFT: $(this).css('left').replace(/[^-\d\.]/g, ''),
      OBJECTTYPE: $(this).attr('data-objecttype'),
      SCREENOBJECT: $(this).attr('data-screenobject'),
      FONTNAME: $(this).attr('data-fontname'),
      FONTITALIC: $(this).attr('data-fontitalic'),
      FORECOLOR: $(this).attr('data-forecolor'),
      BACKCOLOR: $(this).attr('data-backcolor'),
      FONTBOLD: $(this).attr('data-fontbold'),
      WIDTH: $(this).outerWidth(),
      HEIGHT: $(this).outerHeight(),
      UNIQUEPOINTID: $(this).attr('data-upoint'),
      ANIMATIONFILE: $(this).attr('data-animationfile'),
      FONTSIZE: $(this).attr('data-fontsize'),
      txt: txtlbl
    };

    if ($(this).attr('data-opacity')) {
      obj.OPACITY = $(this).attr('data-opacity');
    }

    objects.push(obj);

  });

  dataObject = {
    label: dName,
    versionDate: Math.round((new Date()).getTime() / 1000),
    backgroundImage: backgroundImage,
    displayHeight: displayHeight,
    displayWidth: displayWidth,
    backgroundColor: backgroundColor,
    uPoint: uPoint,
    objects: objects
  };

  if (saveType == 'production') {
    dataObject.isLive = 'live';
    dataObject.isStaging = 'no';

    if ($('#display').attr('data-upoint')) {
        //delete old version


            $.ajax({
  type: 'POST',
  url: '/displays/deletedisplay',
  data: {uPoint: $('#display').attr('data-upoint')},
  async:false
});


    }

  }

  if (saveType == 'staging') {
    dataObject.isLive = 'no';
    dataObject.isStaging = 'staging';
  }

  dataObject = JSON.stringify(dataObject);


  $.post("/displays/adddisplay", {
    dataObject: dataObject
  })
    .done(function (data) {
    //alert("Data Loaded: " + data);

    parent.refreshFrame('/displays/display/' + uPoint);
    parent.alertt('Display saved', 'Your display has been saved');

    parent.$('.edit-display').show();
    parent.$('.view-display').hide();
    parent.$('.history').hide();
    parent.$('.displays').css('visibility', 'visible');
    parent.$('.openDisplay').show();
    parent.$('.import-button').show();
    parent.$('.add-button').show();
    parent.$('.save-button').hide();
    parent.$('.editTitle').hide();

  });

  return false;

}

function hist() {
  $('.pop').toggle();
}


function view() {
    $('body').css('backgroundColor',bcolor);

    $('.object').css('cursor','hand');
  if (changes) {

    parent.confirmm({
      title: 'Save Changes?',
      body: 'Would you Like to save your changes?',
      txt: 'Save and Publish',
      action: function () {

        saveClick('production');
        parent.$("#" + activeFrame)[0].contentWindow.focus();
        return false;
      },

      latertxt: 'Save for Later',
      lateraction: function () {

        saveClick('staging');
        parent.$("#" + activeFrame)[0].contentWindow.focus();
        return false;

      },

      notxt: 'Discard Changes',
      noaction: function () {

        uPoint = $('#display').attr('data-upoint');
        parent.refreshFrame('/displays/display/' + uPoint);
        parent.$('.edit-display').show();
        parent.$('.view-display').hide();
        parent.$('.history').hide();
        parent.$('.displays').css('visibility', 'visible');
        parent.$('.openDisplay').show();
        parent.$('.import-button').show();
        parent.$('.add-button').show();
        parent.$('.save-button').hide();
        parent.$('.editTitle').hide();
        parent.$("#" + activeFrame)[0].contentWindow.focus();
        return false;

      }
    });

  } else {
    $('#display .object').draggable("destroy");

    parent.$('.edit-display').show();
    parent.$('.view-display').hide();
    parent.$('.history').hide();
    parent.$('.displays').css('visibility', 'visible');
    parent.$('.openDisplay').show();
    parent.$('.import-button').show();
    parent.$('.add-button').show();
    parent.$('.save-button').hide();


    changes = true;
    editMode = false;
    $('.pop').hide();

    $('.minBar').hide();
    blurEdit();

    $('.leftToolbar').animate({
      left: '-220px'
    }, 500, function () {
      $('.leftToolbar').hide();
    });

    $('.zoomBar').animate({
      left: '0px'
    }, 500);


    parent.$('.editTitle').hide();

  }

}

function addClipItem() {

  $('.clipBoard').html('');
  $('.glow').each(function () {
    addClip($(this));
  });

}

function addClip(eItem) {
  objHtml = $("<div />").append(eItem.clone()).html();
  objHtml = Base64.encode(objHtml);

  $('.clipBoard').append('<div data-element="' + objHtml + '">Object: ' + eItem.html() + '</div>');
  $('.paste').show();

  socket.emit('clipOut', {
    data: $('.clipBoard').html()
  });

  return false;
}

function clearClip() {
  $('.clipBoard').html('');
}

function addGlow(el) {
  el.addClass('glow');
  el.append('<div data-parent="' + el.attr('id') + '" class="highlight"></div>');
}

function removeGlow(el) {
  $('.glow .highlight').remove();
  el.removeClass('glow');
}

function editThis() {
  el = editItem;



  if (ctrlMode == false) {
    removeGlow($('.object'));
    $('.activeObjects li').css('backgroundColor', '#494949');
  }

  addGlow(el);

  $('.activeObjects li[data-id="' + el.attr('id') + '"]').css('backgroundColor', '#6d6d6d');
  $(".activeObjects").scrollTop(0);
  scrollTop = $('.activeObjects li[data-id="' + el.attr('id') + '"]').position().top;
  $(".activeObjects").scrollTop(scrollTop);
  $('.rightToolbar').animate({
    right: '0px'
  }, 500, function () {
    $('#lbltxt').focus();
    $('#lbltxt').select();
  });

  lblval = el.html().split('<br>').join("\n");
  $('#lbltxt').val(lblval.replace('<div data-parent="' + el.attr('id') + '" class="highlight"></div>', ''));
  $('#sizew').val(el.width());
  $('#sizeh').val(el.height());
  $('#padx').val(el.css('left'));
  $('#pady').val(el.css('top'));

  if (el.attr('data-opacity')) {
    $("#slider").slider("value", el.attr('data-opacity') * 100);
  } else {
    $("#slider").slider("value", 100);
  }

  if(el.attr('data-objecttype') == '0'){
    //alert('this is a dynamic point');
    $('.linkBox').hide();
  }else{
    $('.linkBox').show();

    $('#pointLink').val(el.attr('data-upoint'));
  }


}

function blurEdit() {
  //$('.object').removeClass('glow');
  removeGlow($('.object'));
  $('.activeObjects li').css('backgroundColor', '#494949');
  $('.rightToolbar').stop(true, true).animate({
    right: '-221px'
  }, 500);

}

function paste() {
  changes = true;
  $('.clipBoard div').each(function () {
    $('#objs').append(Base64.decode($(this).attr('data-element')));
  });
  bindDrag();
}

function pasteHere() {
  changes = true;
  miny = 2000;
  minx = 2000;

  $('#displayClip').html('');
  $('.clipBoard div').each(function () {
    $('#displayClip').append(Base64.decode($(this).attr('data-element')));
  });

  $('#displayClip .object').each(function () {
    thisLeft = $(this).css('left').replace(/[^-\d\.]/g, '') * 1;
    thisTop = $(this).css('top').replace(/[^-\d\.]/g, '') * 1;
    if (thisLeft < minx) {
      minx = thisLeft;
    }
    if (thisTop < miny) {
      miny = thisTop;
    }
  });

  $('#displayClip .object').each(function () {
    obj = $(this);
    obj.css('left', (obj.css('left').replace(/[^-\d\.]/g, '') - minx) + (pastex - $('#display').offset().left));
    obj.css('top', (obj.css('top').replace(/[^-\d\.]/g, '') - miny) + (pastey - $('#display').offset().top));
    $('#objs').append(obj);
  });

  bindDrag();

}

function toRgb(num) {
  blue = Math.round(num / 65536);
  green = Math.round((num % 65536) / 256);
  red = Math.round((num % 65536) % 256);

  bHex = 'rgb(' + red + ',' + green + ',' + blue + ')';

  return bHex;
}

function toPixels(points) {

  return (eval(points) * 96 / 72) + "px";
}

function slideBar() {
  $('.leftToolbar').css('left', '-187px');
  //$('.minBar').hide();
  $('.leftToolbar').animate({
    left: '0px'
  }, 500);

  //$('.zoomBar').css('left','33px');

  $('.zoomBar').animate({
    left: '220px'
  }, 500);
}

function timeConverter(UNIX_timestamp) {
  var a = new Date(UNIX_timestamp * 1000);
  var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var year = a.getFullYear();
  var month = months[a.getMonth()];
  var date = a.getDate();
  var hour = a.getHours();
  var min = a.getMinutes();
  var sec = a.getSeconds();
  var time = month + ', ' + date + ', ' + year + ' ' + hour + ':' + min + ':' + sec;
  return time;
}

function removeItem() {

  parent.confirmm({
    title: 'Confirm Delete.',
    body: 'Are you sure you want to delete?',
    txt: 'Yes',
    action: function () {

      $('.glow').each(function () {
        $(this).remove();
      });
      addLayers();
      blurEdit();
      changes = true;
      parent.hideAlertt();
      parent.$("#" + parent.activeFrame)[0].contentWindow.focus();
      return false;

    }
  });
  return false;
}

function popIn(upoint) {
  window.opener.launchDisp(upoint, 'display');
}

function sizeIt() {
  $('.activeObjects').css('height', $(window).height() - 77);
}

function addLayers() {

  $('.activeObjects').html('');
  $('#objs .object').each(function () {

    lbl = $(this).attr('data-objtype');
    if (!lbl) {
      lbl = 'text';
    }

    if (lbl == 'dynamic') {
      lbl = 'dynamic point #' + $(this).attr('data-upoint');
    } else {
      lbl = lbl + ': <span class="inlbl">' + $(this).html() + '</span>';
    }

    $('.activeObjects').append('<li class="sortable" data-id="' + $(this).attr('id') + '" style="cursor:move">' + lbl + '</li>');

  });

}

function formatObjects(){

    $('.object[data-screenobject=3]').html('#');

  $('.object').each(function () {
    $(this).attr('id', 'obj' + guid());
    $(this).css('color', toRgb($(this).attr('data-forecolor')));
    $(this).css('fontSize', toPixels($(this).attr('data-fontsize')));
    $(this).css('fontFamily', $(this).attr('data-fontname'));

    if ($(this).attr('data-opacity') == 'undefined') {
      $(this).attr('data-opacity', 1);
    }

    $(this).css('opacity', $(this).attr('data-opacity'));

    if ($(this).attr('data-width') != 0) {
      $(this).css('width', $(this).attr('data-width') + 'px');
    }

    if ($(this).attr('data-height') != 0) {
      $(this).css('height', $(this).attr('data-height') + 'px');
      $(this).css('lineHeight', $(this).attr('data-height') + 'px');
    }

    if ($(this).attr('data-fontbold') == '1') {
      $(this).css('fontWeight', 'bold');
    }
    if ($(this).attr('data-fontitalic') == '1') {
      $(this).css('fontStyle', 'italic');
    }

    if ($(this).attr('data-screenobject') == '3') {
      $(this).html('<img src="/display_assets/assets/' + $(this).attr('data-animationfile') + '" />');
      $(this).attr('data-objtype', 'animation');
    }

    if ($(this).attr('data-objecttype') == '151') {
      $(this).addClass('displayButton');
      $(this).attr('data-objtype', 'display btn');

      if ($(this).attr('data-backcolor') == '1') {
        $(this).addClass('trans')
      }
    }

    if ($(this).attr('data-objecttype') == '143' || $(this).attr('data-objecttype') == '130' || $(this).attr('data-objecttype') == '166' || $(this).attr('data-objecttype') == '16') {
      $(this).addClass('controlButton');
      $(this).attr('data-objtype', 'control btn');

      if ($(this).attr('data-backcolor') == '1') {
        $(this).addClass('trans')
      }
    }

    if ($(this).attr('data-objecttype') == '137' && $(this).attr('data-screenobject') == '0') {
      $(this).html('on');
    }

    if ($(this).attr('data-objecttype') == '138' && $(this).attr('data-screenobject') == '0') {
      $(this).html('on');
    }

    if ($(this).attr('data-objecttype') == '131' && $(this).attr('data-screenobject') == '0') {
      $(this).html('on');
    }

    if ($(this).attr('data-objecttype') == '3' && $(this).attr('data-screenobject') == '0') {
      $(this).html('on');
    }

    if ($(this).attr('data-objecttype') == '139' && $(this).attr('data-screenobject') == '0') {
      $(this).html('on');
    }

    if ($(this).attr('data-objecttype') == '144' && $(this).attr('data-screenobject') == '0') {
      $(this).html('on');
    }

    if ($(this).attr('data-objecttype') == '8' && $(this).attr('data-screenobject') == '0') {
      $(this).html('on');
    }

    if ($(this).attr('data-objecttype') == '130' && $(this).attr('data-screenobject') == '0') {
      $(this).removeClass('controlButton');
      $(this).html('on');
    }

    if ($(this).attr('data-objecttype') == '128' && $(this).attr('data-screenobject') == '0') {
      $(this).html('on');
    }

    if ($(this).attr('data-objecttype') == '167' && $(this).attr('data-screenobject') == '0') {
      $(this).html('on');
    }

    if ($(this).attr('data-objecttype') == '4' && $(this).attr('data-screenobject') == '0') {
      $(this).html('on');
    }

    if ($(this).attr('data-objecttype') == '5' && $(this).attr('data-screenobject') == '0') {
      $(this).html('on');
    }

    if ($(this).attr('data-screenobject') == '0') {
      $(this).html('on');
    }

    //dynamic objects
    if (
      $(this).attr('data-objecttype') == '1' || ($(this).attr('data-objecttype') == '0' && $(this).attr('data-screenobject') == '0') || ($(this).attr('data-objecttype') == '2' && $(this).attr('data-screenobject') == '0')

    ) {
      $(this).addClass('dyn');
      $(this).attr('data-objtype', 'dynamic');
      //$(this).html('img');
    }

    if ($(this).attr('data-top') == 'undefined') {
      $(this).remove();
    }

  });

}

function clock() {
    $('.dyn').each(function () {

      $(this).html((Math.random() * (100 - 1) + 1).toFixed(2));

    });
}

var Base64 = {

  _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",

  encode: function (input) {
    var output = "";
    var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
    var i = 0;

    input = Base64._utf8_encode(input);

    while (i < input.length) {

      chr1 = input.charCodeAt(i++);
      chr2 = input.charCodeAt(i++);
      chr3 = input.charCodeAt(i++);

      enc1 = chr1 >> 2;
      enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
      enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
      enc4 = chr3 & 63;

      if (isNaN(chr2)) {
        enc3 = enc4 = 64;
      } else if (isNaN(chr3)) {
        enc4 = 64;
      }

      output = output +
        this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
        this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);

    }

    return output;
  },

  // public method for decoding
  decode: function (input) {
    var output = "";
    var chr1, chr2, chr3;
    var enc1, enc2, enc3, enc4;
    var i = 0;

    input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

    while (i < input.length) {

      enc1 = this._keyStr.indexOf(input.charAt(i++));
      enc2 = this._keyStr.indexOf(input.charAt(i++));
      enc3 = this._keyStr.indexOf(input.charAt(i++));
      enc4 = this._keyStr.indexOf(input.charAt(i++));

      chr1 = (enc1 << 2) | (enc2 >> 4);
      chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
      chr3 = ((enc3 & 3) << 6) | enc4;

      output = output + String.fromCharCode(chr1);

      if (enc3 != 64) {
        output = output + String.fromCharCode(chr2);
      }
      if (enc4 != 64) {
        output = output + String.fromCharCode(chr3);
      }

    }

    output = Base64._utf8_decode(output);

    return output;

  },

  // private method for UTF-8 encoding
  _utf8_encode: function (string) {
    string = string.replace(/\r\n/g, "\n");
    var utftext = "";

    for (var n = 0; n < string.length; n++) {

      var c = string.charCodeAt(n);

      if (c < 128) {
        utftext += String.fromCharCode(c);
      } else if ((c > 127) && (c < 2048)) {
        utftext += String.fromCharCode((c >> 6) | 192);
        utftext += String.fromCharCode((c & 63) | 128);
      } else {
        utftext += String.fromCharCode((c >> 12) | 224);
        utftext += String.fromCharCode(((c >> 6) & 63) | 128);
        utftext += String.fromCharCode((c & 63) | 128);
      }

    }

    return utftext;
  },

  // private method for UTF-8 decoding
  _utf8_decode: function (utftext) {
    var string = "";
    var i = 0;
    var c = c1 = c2 = 0;

    while (i < utftext.length) {

      c = utftext.charCodeAt(i);

      if (c < 128) {
        string += String.fromCharCode(c);
        i++;
      } else if ((c > 191) && (c < 224)) {
        c2 = utftext.charCodeAt(i + 1);
        string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
        i += 2;
      } else {
        c2 = utftext.charCodeAt(i + 1);
        c3 = utftext.charCodeAt(i + 2);
        string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
        i += 3;
      }

    }

    return string;
  }

}