## TabbedHelpBox:

This component renders the help box that you see on all the circuit components.

To use it, just import and call tabbedHelpBox();

Here is an example:

```javascript
tabbedHelpBox(4, this.wrapperDiv, ["Adding Gates", "Making Connections", "Deleting Gates", "Toggling Inputs"], ["/source/resources/GIFs/AddingGIF.gif", "/source/resources/GIFs/ConnectionGIF.gif", "/source/resources/GIFs/DeletePicture.png", "/source/resources/GIFs/TogglingGIF.gif"])
```



## Parameters:

1. numTabs: the number of tabs in the box
2. div: the div that the tabbedHelpBox will be appended/prepended into
3. labels: an array of the labels of each tab (in order)
4. imgsrcs: an array of links to each image
5. prepend (default value false) : If set to true, the component will be prepended instead of appended to ths div. This is useful when you need to put the box at the top of a div.