
/*****************************************
 *   Library is under MIT License (MIT)
 *   Copyright (c) 2012 Andreas Herz
 ****************************************//**
 * @class
 * Util class to handle colors in the draw2d enviroment.
 *
 *      // Create a new Color with RGB values
 *      var color = new draw2d.util.Color(127,0,0);
 *
 *      // of from a hex string
 *      var color2 = new draw2d.util.Color("#f00000");
 *
 *      // Create a little bit darker color
 *      var darkerColor = color.darker(0.2); // 20% darker
 *
 *      // create a optimal text color if 'color' the background color
 *      // (best in meaning of contrast and readability)
 *      var fontColor = color.getIdealTextColor();
 *
 */
draw2d.util.Color = Class.extend({

    /**
     * @constructor
     * Create a new Color object
     * 
     * @param {Number|String|draw2d.util.Color} red 
     * @param {Number} green 
     * @param {Number} blue 
     */
    init: function( red, green, blue) {
    
      this.hashString = null;
      
      if(typeof red ==="undefined" || red===null){
          this.hashString = "none";
      }
      else if(red instanceof draw2d.util.Color){
          this.red = red.red;
          this.green = red.green;
          this.blue = red.blue;
      }
      else if(typeof green === "undefined")
      {
        var rgb = this.hex2rgb(red);
        this.red= rgb[0];
        this.green = rgb[1];
        this.blue = rgb[2];
      }
      else
      {
        this.red= red;
        this.green = green;
        this.blue = blue;
      }
    },
    

    /**
     * @method
     * Convert the color object into a HTML CSS representation
     * @return {String} the color in rgb(##,##,##) representation
     **/
    getHTMLStyle:function()
    {
      return "rgb("+this.red+","+this.green+","+this.blue+")";
    },
    
    /**
     * @method
     * The red part of the color.
     * 
     * @return {Number} the [red] part of the color.
     **/
    getRed:function()
    {
      return this.red;
    },
    
    
    /**
     * @method
     * The green part of the color.
     * 
     * @return {Number} the [green] part of the color.
     **/
    getGreen:function()
    {
      return this.green;
    },
    
    
    /**
     * @method
     * The blue part of the color
     * 
     * @return {Number} the [blue] part of the color.
     **/
    getBlue:function()
    {
      return this.blue;
    },
    
    /**
     * @method
     * Returns the ideal Text Color. Useful for font color selection by a given background color.
     *
     * @return {draw2d.util.Color} The <i>ideal</i> inverse color.
     **/
    getIdealTextColor:function()
    {
       var nThreshold = 105;
       var bgDelta = (this.red * 0.299) + (this.green * 0.587) + (this.blue * 0.114);
       return (255 - bgDelta < nThreshold) ? new  draw2d.util.Color(0,0,0) : new  draw2d.util.Color(255,255,255);
    },
    
    
    /**
     * @private
     */
    hex2rgb:function(/*:String */hexcolor)
    {
      hexcolor = hexcolor.replace("#","");
      return(
             {0:parseInt(hexcolor.substr(0,2),16),
              1:parseInt(hexcolor.substr(2,2),16),
              2:parseInt(hexcolor.substr(4,2),16)}
             );
    },
    /**
     * @private
     */
    rgb2hex: function(rgb) {
        rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
        function hex(x) {
            return ("0" + parseInt(x).toString(16)).slice(-2);
        }
        return "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
    },
    
    /**
     * @private
     **/
    hex:function()
    { 
      return(this.int2hex(this.red)+this.int2hex(this.green)+this.int2hex(this.blue)); 
    },
    
    
    /**
     * @method
     * Convert the color object into a HTML CSS representation
     * @return {String} the color in #RRGGBB representation
     **/
    hash:function()
    {
        if(this.hashString===null){
            this.hashString= "#"+this.hex();
        }
        return this.hashString;
    },
    
    /**
     * @private
     */
    int2hex:function(v) 
    {
      v=Math.round(Math.min(Math.max(0,v),255));
      return("0123456789ABCDEF".charAt((v-v%16)/16)+"0123456789ABCDEF".charAt(v%16));
    },
    
    /**
     * @method
     * Returns a darker color of the given one. The original color is unchanged.
     * 
     * @param {Number} fraction  Darkness fraction between [0..1].
     * @return{draw2d.util.Color}        Darker color.
     */
    darker:function(fraction)
    {
       // we can "darker" a undefined color. In this case we return the undefnied color itself
       //
       if(this.hashString==="none")
           return this;
        
       var red   = parseInt(Math.round (this.getRed()   * (1.0 - fraction)));
       var green = parseInt(Math.round (this.getGreen() * (1.0 - fraction)));
       var blue  = parseInt(Math.round (this.getBlue()  * (1.0 - fraction)));
    
       if (red   < 0) red   = 0; else if (red   > 255) red   = 255;
       if (green < 0) green = 0; else if (green > 255) green = 255;
       if (blue  < 0) blue  = 0; else if (blue  > 255) blue  = 255;
    
       return new draw2d.util.Color(red, green, blue);
    },
    
    
    /**
     * @method
     * Make a color lighter. The original color is unchanged.
     * 
     * @param {Number} fraction  Darkness fraction between [0..1].
     * @return {draw2d.util.Color} Lighter color.
     */
    lighter:function( fraction)
    {
        // we can "lighter" a undefined color. In this case we return the undefnied color itself
        //
        if(this.hashString==="none")
            return this;
        
        var red   = parseInt(Math.round (this.getRed()   * (1.0 + fraction)));
        var green = parseInt(Math.round (this.getGreen() * (1.0 + fraction)));
        var blue  = parseInt(Math.round (this.getBlue()  * (1.0 + fraction)));
    
        if (red   < 0) red   = 0; else if (red   > 255) red   = 255;
        if (green < 0) green = 0; else if (green > 255) green = 255;
        if (blue  < 0) blue  = 0; else if (blue  > 255) blue  = 255;
    
        return new draw2d.util.Color(red, green, blue);
    },
    
    /**
     * @method
     * Return a new color wich is faded to the given color.
     * @param {draw2d.util.Color} color
     * @param {Number} pc the fade percentage in [0..1]
     * @returns {draw2d.util.Color}
     * 
     * @since 2.1.0
     */
    fadeTo: function(color, pc){

        var r= Math.floor(this.red+(pc*(color.red-this.red)) + .5);
        var g= Math.floor(this.green+(pc*(color.green-this.green)) + .5);
        var b= Math.floor(this.blue+(pc*(color.blue-this.blue)) + .5);

        return new draw2d.util.Color(r,g,b);
    }
});

/**
 * /* @class draw2d.util.ArrayList
 * An ArrayList stores a variable number of objects. This is similar to making an array of
 * objects, but with an ArrayList, items can be easily added and removed from the ArrayList
 * and it is resized dynamically. This can be very convenient, but it's slower than making
 * an array of objects when using many elements.
 */
draw2d.util.ArrayList = Class.extend({

    /**
     * @constructor
     * Initializes a new instance of the ArrayList class that is empty and has
     * the default initial capacity.
     *
     */
    init: function( a) {
        this.increment = 10;

        this.size = 0;
        this.data = new Array(this.increment);
        if(typeof a !=="undefined"){
            $.each(a,$.proxy(function(i,e){this.add(e);},this));
        }
    },


    /**
     * @method
     * Reverses the order of the elements in the ArrayList. The array will be modified!
     *
     * @return {draw2d.util.ArrayList} self
     */
    reverse:function()
    {
        var newData = new Array(this.size);
        for (var i=0; i<this.size; i++)
        {
            newData[i] = this.data[this.size-i-1];
        }
        this.data = newData;

        return this;
    },

    /**
     * @method
     * Returns the allocated/reserved entries. Not all entries are filled with an valid element.
     *
     * @return {Number} the size of the allocated entries
     */
    getCapacity:function()
    {
        return this.data.length;
    },

    /**
     * @method
     * The size/count of the stored objects.
     *
     * @return {Number}
     */
    getSize:function()
    {
        return this.size;
    },

    /**
     * @method
     * checks to see if the Vector has any elements.
     *
     * @return {Boolean} true if the list is empty
     **/
    isEmpty:function()
    {
        return this.getSize() === 0;
    },

    /**
     * @method
     * return the last element.
     *
     * @return {Object}
     */
     last:function() 
    {
        if (this.data[this.getSize() - 1] !== null)
        {
            return this.data[this.getSize() - 1];
        }
        return null;
    },
     /* @deprecated */
     getLastElement:function(){return this.last();},

    /**
     * @method
     * Return a reference to the internal javascript native array.
     *
     * @return {Array}
     */
    asArray:function()
    {
        this.trimToSize();
        return this.data;
    },

    /**
     * @method
     * returns the first element
     *
     * @return {Object}
     */
     first:function() 
    {
        if (this.data[0] !== null && typeof this.data[0] !=="undefined")
        {
            return this.data[0];
        }
        return null;
    },
     /* @deprecated */
     getFirstElement: function(){return this.first();},

    /**
     * @method
     * returns an element at a specified index
     *
     * @param {Number} i
     * @return {Object}
     */
    get:function(i)
    {
        return this.data[i];
    },

    /**
     * @method
     * Adds a element at the end of the Vector.
     *
     * @param {Object} obj the object to add
     * @return {draw2d.util.ArrayList} self
     */
    add:function(obj)
    {
        if(this.getSize() == this.data.length)
        {
            this.resize();
        }
        this.data[this.size++] = obj;

        return this;
    },

    /**
     * @method
     *
     * The method removes items from an array as necessary so that all remaining items pass a
     * provided test. The test is a function that is passed an array item and the index of the
     * item within the array. Only if the test returns true will the item stay in the array.
     *
     * @param {Function} func the filter function
     * @since 2.0.0
     */
    grep: function(func){
         this.trimToSize();
        this.data = $.grep(this.data, func);
        this.data = $.grep(this.data, function(e){
            return (typeof e !=="undefined");
        });
        this.size = this.data.length;

        return this;
    },

    /**
     * @method
      * Translate all items in the array into new items. The array list is modified after this call. 
      * You must clone the array before if you want avoid this.
      * 
      *     var labels = this.commands.clone().map(function(e){
      *          return e.getLabel();
      *     });
      *
      * @param {Function} func The function to process each item against. The first argument to the function is the value; the second argument is the index or key of the array or object property.
      * @since 4.0.0
      */
     map: function(func){
         this.trimToSize();
         this.data = $.map(this.data, func);
         this.data = $.grep(this.data, function(e){
             return (typeof e !=="undefined");
         });
         this.size = this.data.length;
 
         return this;
     },
 
     /**
      * @method
      * Removes any duplicate elements from the array. The array is modified after this call. You
      * must clone the array before if you want avoid this
      * 
     * @since 4.0.0
      */
     unique: function(){
         this.trimToSize();
         this.data = $.unique(this.data);
         this.data = $.grep(this.data, function(e){
             return (typeof e !=="undefined");
         });
         this.size = this.data.length;
 
         return this;
     },

     
    /**
     * @method
     * Add all elements into this array.
     *
     * @param {draw2d.util.ArrayList} list
     * @param {boolean} [avoidDuplicates] checks whenever the new elements exists before insert if the parameter is to [true] 
     * 
     * @return {draw2d.util.ArrayList} self
     */
     addAll:function(list, avoidDuplicates)
    {
        if(!(list instanceof draw2d.util.ArrayList)){
            throw "Unable to handle unknown object type in ArrayList.addAll";
        }

        var _this=this; // just to avoid $.proxy;
        if(typeof avoidDuplicates==="undefined" || avoidDuplicates===false){
            list.each(function(i,e){
                _this.add(e); 
            });
        }
        else{
            list.each(function(i,e){
                if(!_this.contains(e)){
                    _this.add(e); 
                }
            });
        }
        return this;
    },

    /**
     * @method
     * You can use the Array list as Stack as well. this is the pop method to remove one element
     * at the top of the stack.
     *
     * @returns
     */
    pop:function() {
        return this.removeElementAt(this.getSize() - 1);
    },

    /**
     * @method
     * Push one element at the top of the stack/array
     *
     * @param path
     */
    push: function( path) {
        this.add(path);
    },

    /**
     * @method
     * Remove the element from the list
     *
     * @param {Object} obj the object to remove
     * @return {Object} the removed object or null
     */
    remove:function( obj)
    {
        var index = this.indexOf(obj);
        if(index>=0){
            return this.removeElementAt(index);
        }

        return null;
    },


    /**
     * @method
     * Inserts an element at a given position. Existing elements will be shifted
     * to the right.
     *
     * @param {Object} obj the object to insert.
     * @param {Number} index the insert position.
     *
     * @return {draw2d.util.ArrayList} self
     */
    insertElementAt:function(obj, index)
    {
        if (this.size == this.capacity)
        {
            this.resize();
        }

        for (var i=this.getSize(); i > index; i--)
        {
            this.data[i] = this.data[i-1];
        }
        this.data[index] = obj;
        this.size++;

        return this;
    },

    /**
     * @method
     * removes an element at a specific index.
     *
     * @param {Number} index the index of the element to remove
     * @return {Object} the removed object
     */
    removeElementAt:function(index)
    {
        var element = this.data[index];

        for(var i=index; i<(this.size-1); i++)
        {
            this.data[i] = this.data[i+1];
        }

        this.data[this.size-1] = null;
        this.size--;

        return element;
    },

    /**
     * @method
     * removes all given elements in the Vector
     *
     * @param {draw2d.util.ArrayList} elements The elements to remove
     * @return {draw2d.util.ArrayList} self
     */
    removeAll:function(elements)
    {
        $.each(elements, $.proxy(function(i,e){
            this.remove(e);
        },this));

        return this;
    },

    /**
     * @method
     * Return the zero based index of the given element or -1 if the element
     * not in the list.
     *
     * @param {Object} obj the element to check
     *
     * @return {Number} the index of the element or -1
     */
    indexOf:function(obj)
    {
        for (var i=0; i<this.getSize(); i++)
        {
            if (this.data[i] == obj)
            {
                return i;
            }
        }
        return -1;
    },

    /**
     * @method
     * returns true if the element is in the Vector, otherwise false.
     *
     * @param {Object} obj the object to check
     * @return {boolean}
     */
    contains:function(obj)
    {
        for (var i=0; i<this.getSize(); i++)
        {
            if (this.data[i] == obj)
            {
                return true;
            }
        }
        return false;
    },

    // resize() -- increases the size of the Vector
    resize:function()
    {
        newData = new Array(this.data.length + this.increment);

        for   (var i=0; i< this.data.length; i++)
        {
            newData[i] = this.data[i];
        }

        this.data = newData;

        return this;
    },


    // trimToSize() -- trims the vector down to it's size
    trimToSize:function()
    {
        // nothing to do
        if(this.data.length == this.size)
            return this;

        var temp = new Array(this.getSize());

        for (var i = 0; i < this.getSize(); i++)
        {
            temp[i] = this.data[i];
        }
        this.size = temp.length;
        this.data = temp;

        return this;
    },

    /**
     * @method
     * Sorts the collection based on a field name - f
     *
     * @param {String} the fieldname for the sorting
     *
     * @return {draw2d.util.ArrayList} self
     */
    sort:function(f)
    {
        var i, j;
        var currentValue;
        var currentObj;
        var compareObj;
        var compareValue;

        for(i=1; i<this.getSize();i++)
        {
            currentObj = this.data[i];
            currentValue = currentObj[f];

            j= i-1;
            compareObj = this.data[j];
            compareValue = compareObj[f];

            while(j >=0 && compareValue > currentValue)
            {
                this.data[j+1] = this.data[j];
                j--;
                if (j >=0) {
                    compareObj = this.data[j];
                    compareValue = compareObj[f];
                }
            }
            this.data[j+1] = currentObj;
        }

        return this;
    },

    /**
     * @method
      * Copies the contents of a Vector to another Vector returning the new Vector.
     *
      * @param {boolean} [deep] call "clone" of each elements and add the clone to the new ArrayList 
      * @returns {draw2d.util.ArrayList} the new ArrayList
     */
     clone:function(deep) 
    {
        var newVector = new draw2d.util.ArrayList();
    

        if (deep) {
            for ( var i = 0; i < this.size; i++) {
                newVector.add(this.data[i].clone());
            }
        }
        else {

        for (var i=0; i<this.size; i++) {
            newVector.add(this.data[i]);
        }
        }

        return newVector;
    },


    /**
     * @method
     * Iterate over the array and call the callback method with the given index and element
     *
      * @param {Function} func the callback function to call for each element
      * @param {boolean} reveser optional parameter. Iterate the collection if it set to <b>true</b>
     * @return {boolean}
     */
      each:function(func, reverse) 
    {

         if(typeof reverse !=="undefined" && reverse===true){
             for (var i=this.size-1; i>=0; i--) {
                 if(func(i, this.data[i])===false)
                     break;
         }
          }
         else{
             for (var i=0; i<this.size; i++) {
            if(func(i, this.data[i])===false)
                break;
        }
         }
    },

    // overwriteElementAt() - overwrites the element with an object at the specific index.
    overwriteElementAt:function(obj, index)
    {
        this.data[index] = obj;

        return this;
    },

    getPersistentAttributes:function()
    {
        return {
            data: this.data,
            increment: this.increment,
            size: this.getSize()
        };
    },

    /**
     * @method
     * Read all attributes from the serialized properties and transfer them into the shape.
     *
     * @param {Object} memento
     * @returns
     */
    setPersistentAttributes : function(memento)
    {
        this.data = memento.data;
        this.increment = memento.increment;
        this.size = memento.size;
    }


});

draw2d.util.ArrayList.EMPTY_LIST = new draw2d.util.ArrayList();


// extending raphael with a polygon function
Raphael.fn.polygon = function(pointString) {
    var poly  = ['M'],
        point = pointString.split(' ');

    for(var i=0; i < point.length; i++) {
        var c = point[i].split(',');
        for(var j=0; j < c.length; j++) {
            var d = parseFloat(c[j]);
            if (d)
                poly.push(d);
        };
        if (i == 0)
            poly.push('L');
    }
    poly.push('Z');

    return this.path(poly);
};


/*****************************************
 *   Library is under MIT License (MIT)
 *   Copyright (c) 2012 Andreas Herz
 ****************************************/
/**
 * @class draw2d.util.UUID
 * Generates a (pseudo) UUID's
 *
 *      // a UUID in the format
 *      // xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (8-4-4-4-12)
 *      var id = draw2d.util.UUID.create();
 *
 * @author Andreas Herz
 * @constructor
 * @private
 */
draw2d.util.UUID=function()
{
};


/**
 * @method
 * Generates a unique id.<br>
 * But just for the correctness: <strong>this is no Global Unique Identifier</strong>, it is just a random generator
 * with the output that looks like a GUID. <br>
 * But may be also useful.
 *
 * @returns {String} the  UUID in the format xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (8-4-4-4-12)
 **/
draw2d.util.UUID.create=function()
{
    var segment=function()
    {
        return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    };
    return (segment()+segment()+"-"+segment()+"-"+segment()+"-"+segment()+"-"+segment()+segment()+segment());
};
