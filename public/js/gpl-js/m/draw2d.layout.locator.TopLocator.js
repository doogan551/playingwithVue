/*****************************************
 *   Library is under MIT License (MIT)
 *   Copyright (c) 2012 Andreas Herz
 ****************************************/
/**
 * @class draw2d.layout.locator.TopLocator
 *
 * A TopLocator  is used to place figures at the top/center of a parent shape.
 *
 * @author Andreas Herz
 * @extend draw2d.layout.locator.Locator
 */
draw2d.layout.locator.TopLocator= draw2d.layout.locator.Locator.extend({
    NAME : "draw2d.layout.locator.TopLocator",
    init: function(parent)
    {
      this._super(parent);
    },
    relocate:function(index, target)
    {
       var parent = this.getParent();
       //console.log(parent);
       var boundingBox = parent.getBoundingBox();
       //console.log(boundingBox);
       var targetBoundingBox = target.getBoundingBox();
       //console.log(targetBoundingBox);
       target.setPosition(boundingBox.w/2-(targetBoundingBox.w/2),-(targetBoundingBox.h+2) + 5 );
    }
});

draw2d.layout.locator.LabelLocator= draw2d.layout.locator.Locator.extend({
    NAME : "draw2d.layout.locator.TopLocator",
    init: function(parent)
    {
        this._super(parent);
    },
    relocate:function(index, target)
    {
        var parent = this.getParent();
        var boundingBox = parent.getBoundingBox();

        var targetBoundingBox = target.getBoundingBox();
        target.setPosition(boundingBox.w/2-(targetBoundingBox.w/2) + 25,-(targetBoundingBox.h+2) + 5 );
    }
});


draw2d.layout.locator.CustomTopLocator= draw2d.layout.locator.Locator.extend({
    NAME:"draw2d.layout.locator.CustomTopLocator",
    init: function (parent) {
        this._super(parent);
    },
    relocate: function (index, target) {
        var parent = this.getParent();
        var boundingBox = parent.getBoundingBox();

        var targetBoundingBox = target.getBoundingBox();
        target.setPosition(boundingBox.w / 2 - (targetBoundingBox.w / 2), -(targetBoundingBox.h + 2) + 5);
    }

});
