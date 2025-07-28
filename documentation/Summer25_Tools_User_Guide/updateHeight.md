# Using updateHeight
updateHeight() is used to dynamically sized the questions for all components. The function should be imported from ./rs/bases/rsptx/utils/updateHeight.js and
called at the end of the class constructor for each component. An example from threading_race is illustrated below:

```html
constructor(opts) {
        super(opts);
        var orig = opts.orig; // entire <p> element
        this.useRunestoneServices = opts.useRunestoneServices;
        this.origElem = orig;
        this.divid = orig.id;
        this.setCustomizedParams();

        // Default configuration settings
        this.correct = null;
        // Fields for logging data
        this.componentId = "13.3.1";
        this.questionId = 1;
        this.userId = this.getUserId();
        
        this.createTRElement();

        // this.addCaption("runestone");
        // this.checkServer("nc", true);
        if (typeof Prism !== "undefined") {
            Prism.highlightAllUnder(this.containerDiv);
        }

        this.contWrong = 0;
        const obj = this;
        updateHeight(window, document, obj, true);
        this.sendData(0);
    }
```

## Function Prototype: updateHeight(window, document, obj, setChange=null, fixHeight=null)
### Parameters
1. window: pass in the object representing the browser window or a frame containing a DOM document. In almost all cases the call to updateHeight should just pass in window.
2. document: pass in the object representing the web page loaded in the browser. In most cases the call should just pass in document.
3. obj: the class the updateHeight is being called in. In most cases the call should pass in 'this'.
4. setChange: a boolean that determines whether an eventListener is added to the component that updates height every time an element is clicked. In most cases true should be passed in.
5. fixHeight: an integer used to manually set the height of the iframe. In most cases nothing needs to be passed in, but for components that have trouble with
sizing height on load, the user can specify the desired height (in px) of the frame.

