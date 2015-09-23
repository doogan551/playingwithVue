
$(window).load(function () {
//    var canvas = new dorsett.Canvas("canvas");
//    var reader = new dorsett.io.json.Reader();
//    reader.unmarshal(canvas, jsonDocument, true);
    //iddd = '#{locals.id}';
    //title1 = '#{locals.title1}';
    window.app = new example.Application();
    $(".headerTitle h1").html(pointname);
    this.view = new example.View("canvas");
    this.view.openFromDB();
//    if (window.localStorage.getItem('tempCanvas') != null) {
//        var canvas = new dorsett.Canvas("canvas");
//        var reader = new dorsett.io.json.Reader();
//        reader.unmarshal(canvas, JSON.parse(window.localStorage.getItem('tempCanvas')), true);
//
//    }

});

function setPoint(val){
    //console.log(val);

}
//function displayJSON(canvas){
//    var writer = new dorsett.io.json.Writer();
//    $("#json").text(JSON.stringify(writer.marshal(canvas),null,2));
//}