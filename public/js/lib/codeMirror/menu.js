	$(function() {
		$("td:has(.menubar)").clone().appendTo("tbody tr:not(:first)");
		
		$("#bar1, .menubar").menubar({
			select: function(event, ui) {
				$("<div/>").text("Selected: " + ui.item.text()).appendTo("#log");
			}
		});
		
		
		
		
		$(".menubar-icons").menubar({
			menuIcon: true,
			buttons: true,
			select: function(event, ui) {
				$("<div/>").text("Selected: " + ui.item.text()).appendTo("#log");
			}
		});
	});
	function XmlMenu(Menu)
	{
	mmm="";
	$("Menu>Item",Menu).each(function(){mmm+=MenuList(this,"None",false,"None","","")+"<ul>";$(this).children().each(function()
	{
	TheIcon="Empty";
	disabledItem=false;
	ShortCut="None";
    Click="";
Class="";
	if($(this).attr('checked')=="true"){TheIcon="Check"};
	if($(this).attr('disabled')=="true"){disabledItem=true};
	if($(this).attr('ShortCut')){ShortCut=$(this).attr('ShortCut')};
	if($(this).attr('Click')){Click='onclick="'+$(this).attr('Click')+'"'};
	if($(this).attr('class')){Class=$(this).attr('class')};

		if($(this).attr('Title')){mmm +=MenuList(this,TheIcon,disabledItem,ShortCut,Click,Class)+EndMenuList()}
	if(this.tagName=="separator"){mmm +="<hr/>"}
	})
	
	;mmm+="</ul>"+EndMenuList();
})
	
	$("ul#menu").html(mmm).menubar();

console.log($("#ui-menu-0 #ui-menu-0-1"));

$("#ui-menu-0 #ui-menu-0-1").wrapInner('<label  for="openFile" ></label>');
	
	}
	
	function MenuList(XXX,Icon,disabledItem,ShortCut,Click,Class)
	{
	if(ShortCut=="None"){ShortCut=""};

		if(Icon=="Empty"){IconTag="<span class='ui-icon ui-icon-empty '></span>"};
		if(Icon=="Check"){IconTag="<span class='ui-icon ui-icon-check '></span>"};
		if(Icon=="None"){return "<li><a class='"+Class+"' href=#"+$(XXX).attr('Title')+">"+$(XXX).attr('Title')+Click+"</a>"};
		if(Icon!="None" && disabledItem==false){return "<li><a class='"+Class+"' href=#"+$(XXX).attr('Title')+'" '+Click+">"+IconTag+$(XXX).attr('Title')+"<div class='shortcut'>"+ShortCut+"</div></a>"};
		if(Icon!="None" && disabledItem==true){return "<li class='ui-state-disabled'>"+IconTag+"<span style='position:relative;left:18px;'>"+$(XXX).attr('Title')+"</span><div class='shortcut'>"+ShortCut+"</div>"};	
	}
	
		
	function EndMenuList()
	{
	return "</li>"
	}
	
	
	$(document).ready(function(){
$.ajax({
    type: "GET",
	url: "Menu.xml",
	dataType: "xml",
	success: function(xml) {XmlMenu(xml)}
 
	
});
 
});
	
	