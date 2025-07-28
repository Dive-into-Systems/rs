<h2>MinSelectBox</h2>
This compont is used for the select operator checkboxes. It's mainly intended for situations where there is a minimum number of boxes that need to be checked at any given time.
Here is a quick example

```javascript
const operatorBox = MinSelectBox(this.configDiv, 1, ["addBox", "subBox"], ["ADDITION", "SUBTRACTION"], [true, true], "Operators", this.getWindowOpen, this.setWindowOpen, this.genFunc)
```
Here, for example, you want at least 1 box to be checked at all times. Also, a change in the parameters should generate a new question without necessarily closing the box. At the same time, clicking off the box (onto the exercise) should close the box.

The result of this looks like

<img width="255" height="182" alt="image" src="https://github.com/user-attachments/assets/6976101d-0755-4349-ad29-af9e5285cc2e" />

const MinSelectBox = (div, minChecked, classNames, valueNames=[], defaultChecked=[], placeholderText="Select Operators", getWindowOpen=undefined, setWindowOpen=undefined, generateFunc=undefined) => {


<h4>Parameters</h4>

There are a lot of parameters for this (I'm sorry :(  ) 

<ol>
  <li>div: the div that the box gets appended into</li>
  <li>minChecked: the minimum number of boxes that can be selected</li>
  <li>classNames: an array of the classNames assigned each li in the box</li>
  <li>valueNames: the values of the items in the box (the text displayed and their values when you get them in code)</li>
  <li>defaultChecked: an array of bools. Set to true for each option you want to be checked at the start. Defaults to all values being true. </li>
  <li>placeholderText: the text that shows up in the box whe nothing is checked</li>
  <li>getWindowOpen: if generate function is non null/produces real changes, this should be specified. It should be a function that modifies a windowOpen bool that persists through generations</li>
  <li>setWindowOpen: like getWindowOpen, but a setter function</li>
  <li>generateFunc: function that generates a new exercise</li>
</ol>
