# Boxes

Boxes are containers of graphics on a page. Any non-empty page will contain an entry of `boxes` and in it one or more `boxes` object. 
Each box object has a definition of `left` and `bottom` entries that define its lower left position. This serves as base to posit the contents of the box.

Following is an example of a document with a box object:     

```javascript
{
	"pages": [
		{
			"width": 595,
			"height": 842,
			"boxes": [
				{
					"bottom":10,
					"left":10,
					"shape" : {
						"method":"rectangle",
						"width":400,
						"height":300,
						"options": {
							"type":"fill",
							"color":"red"
						}

					}
				}
			]
		}
	]
}
```

The box is defined to be placed at 10X10, and it is to have a content that is a shape of  rectangle. The types of contents that you can put in a box, and therefore what entries can be there are:    
* <a ui-sref="documentation.jobticket.text">Text</a> - text
* <a ui-sref="documentation.jobticket.images">Images</a> - images
* <a ui-sref="documentation.jobticket.shapes">Shapes</a> - shapes (rectangle, square, circle, paths), either as fill or stroke (background or border...in other terms)
* <a ui-sref="documentation.jobticket.streams">Streams</a> - flow of content with automatic line wrapping, using the boxes as its limits. Probably your 100% goto when placing multiline text.

Where makes sense (mostly in case where images or streams are placed) provide also `width` and `height` properties in the box, defining its width and height measures.

## Coordinates system

The placement coordinates are using a cartesian system by default where an increased horizontal coordination describes an element closer to the page top. This is true to all coordinates in the service - always cartesian.   
There is a single exception when it comes to the top level boxes positions. `bottom` or `top` position can be defined refering to the distance from the page top coordinae. To do this add `origin` entry to the box object with the value `pageTop`. In
most cases it would make sense to use `top` instead of `bottom`, to designate the top of the box instead of its bottom. (more on using `top` see below). 

## Defining multiple items in the same box

At times it will makes sense to define more than one content elements to a box. For example, if you would like to render a box with text and background color and a border, it may make sense to be able to define a single box and multiple items - one for the background fill shape, one for the text, and one for the border.

In this case don't place one of the 'image', 'text', 'stream' or 'shape' entries. Rather place an 'items' array entry.     
Consider the following example:

```javascript
{
	"bottom":200,
	"left":10,
	"items" : [
		{
			"type":"shape",
			"method":"rectangle",
			"width":200,
			"height":30,
			"options": {
				"type":"stroke",
				"color":"gray"
			}

		},
		{
			"type":"text",
			"text":"text in box",
			"options": {
                "fontSource": {
                    "name": "arial",
                    "origin": "local"
                },
                "size":40,
				"color":"yellow"
			}

		}

	]
}
```

The items array contains a shape item, drawing a gray rectangular border, and a text item with "text in box" in yellow.

Note that when defining multiple items using the `items` array, the type of the item is defined by a `type` property matching its object name. For example, for a `text` item, state `text` as type. Following the content types that are available you can choose between `text`, `shape`, `image` and `stream`.

## Alignment

provide an `alignment` property with either `left`, `right` or `center`, to determine the horizontal alignment of the contents inside the box. 

When using <a ui-sref="documentation.jobticket.streams">Streams</a> , each line in the box will be aligned on its own.

By default the alignment is `left`, unless you are using a stream in the box, in which case the stream alignment default will be per its direction definition. If left-to-right, then it will be `left`. If right-to-left, it will be `right`.

## <a name="top"></a> Using `top` instead of `bottom` 

You can use `top` instead of `bottom` when defining a box vertical positioning. `top` will have the top of the content, and it's bottom will be determined by the box `height` property or, if absent, its content (items).

A special ability that exists is to define `top` not as a number, but rather as a reference to another box bottom. consider the following two boxes definition:

```javascript
{
	"bottom":400,
	"left":10,
    "id":"topBox"
	"shape":
	        {
                "method":"rectangle",
                "width":200,
                "height":300,
                "options": {
                    "type":"stroke",
                    "color":"gray"
                }
    		}
},
{
	"top":{"box":"topBox","offset":-20},
	"left":10,
	"shape":
	        {
                "method":"rectangle",
                "width":200,
                "height":300,
                "options": {
                    "type":"stroke",
                    "color":"red"
                }

		}
}
```

The above definition defines a first box at 10,400 and draws a rectangular shape in gray.
Note that this first box has a new "id" property, providing it an ID that other boxes can refer to.

The 2nd box defines a box to have its top using an object which has two properties:

1. `box` - defining an ID for another box. in order case *topBox*. This means that the top of this box should be relative to 400, which is the bottom of *topBox*
2. `offset` - from that 400, take another 20 below that - 380. The `offset` property defines the offset from the top defined by the other box. negative values go lower, higher values go higher.

Using this method is quite comfortable as it allows relative placement, which simplifies document construction.

Additionally it helps when you want to place content below a box that has dynamic height. For example, it is possible to use items of type "stream" which height is determined by how their content is placed, and place content below them.

It is OK (and sometimes makes a lot of sense), to use a single ID with multiple items, where the intention is that the object that is designated by the ID is changing as the document production progresses. This is particularly useful when defining lists with items one below the other.