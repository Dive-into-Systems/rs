import "./css/MinSelectBox.css"

// List of Params (I apologize: there are a lot because I needed to make this backwards compatible)

//div: the div into which this will be appended
// minChecked: the minimum number of boxes that can be checked
// classNames: the name of the class to be applied to each checkbox
//valueNames: the value of each checkbox 
//defaultChecked: array that specifies whether the box should be checked by default
//placeHolder text: the placeholder text that shows up in the span
//getWindowOpen: I'm using this to keep track of whether or not the window is already open (There's more detail in the code, but basically, this is needed to allow the state of the question to persist independent of qestion generation. Tehcnically unnecessary if generateFunc is undef)
//setWindowOpen: self Explanatory
//generateFunc => function to be used on value change (typically to generate a new function on option change)
// Binds the output to this 
//returns an array of the checkbox elements that are created.

// This function requires a seperate getter and setter for a WindowOpen variable that is OUTSIDE this function. I'm doing it that way so that the value persists (It was getting deleted in some components)

//The best examples of this are probably in Binarith and Binops

const MinSelectBox = (div, minChecked, classNames, valueNames=[], defaultChecked=[], placeholderText="Select Operators", getWindowOpen=undefined, setWindowOpen=undefined, generateFunc=undefined) => {


    //Error checking with the params
    if(classNames == undefined || classNames.length == 0){
        console.error(`ERROR! Classnames is either undefined or has length 0. Reading in value ${classNames}`)
    }
    if(valueNames.length == 0){
        console.info("Valuenames has length zero and will by assigned to the same values as classNames")
    }
    if(defaultChecked.length == 0){
        console.info("Default checked is empty and all values will be defaulted to true")
        defaultChecked = []
        classNames.forEach((elem) => defaultChecked.push(true))
    }

    if(valueNames.length != classNames.length && valueNames.length > 0 ){
        console.error(`ERROR: Expected valueNames to have length ${classNames.length} but instead got read ${valueNames} with length ${valueNames.length}`)
    }
    if(defaultChecked.length != classNames.length && defaultChecked.length > 0){
        console.error(`ERROR: Expected defaultChecked to have length ${classNames.length} but instead got read ${defaultChecked} with length ${defaultChecked.length}`)
    }


    //This value keeps track of how many values are true at the start. I need this to keep an up to date account of how many values are checked
    let numSelect = 0;
    defaultChecked.forEach(element => {
        if(element == true){
            numSelect++;
        }
    });

    //Main div that stores everything
    const mainDiv = document.createElement("div");
    mainDiv.className = 'dropdown-check-list';
    mainDiv.tabIndex = 100;  // Set tabindex to make the div focusable

    //I don't see how this is necesary but I'm leaving it in because it's legacy code and I'm afraid of it
    const randomIdent = `${Math.floor(Math.random()*1000)}${classNames[0]}`
    mainDiv.id = `list${randomIdent}`

    //The thing that you click on to show the selection list
    const span = document.createElement("span")
    span.className = "anchor"
    span.textContent = placeholderText;
    mainDiv.append(span)

    // Rationale for this: If genFunc is specified, the minSelectBox will generate a new question everytime an option is checked/unchecked
    // It would be annoying if you're trying to change 5 options and have to reopen the box every time
    // This allows the box open/closed value to persist independent of the question 
    if(getWindowOpen && getWindowOpen()){
        mainDiv.classList.add('visible');
    }
    
    //list element that holods the options
    const ul = document.createElement("ul")
    ul.className = "items"
    mainDiv.append(ul)

    //Create a LI for every option specified in the checkbox list
    classNames.map((elem, i) => {
        const li = document.createElement("li")
        li.className = "itemLi"
        const input = document.createElement("input")
        input.className = elem
        input.setAttribute("type", "checkbox")
        input.value = valueNames[i]

        // The entire LI hovers on highlight, so i've made clicking it check the select box.#$
        // The only issue with this is that clicking the checkbox directly leads to two click events, 
        // Hence the if statement
        li.addEventListener("click", (e)=>{
            // input.checked = !input.checked
            if(e.target != input){
                input.click()
            }
            console.log("area clicked")
        })

        if(defaultChecked[i]){
            input.checked = true;
        }
        else{
            input.checked = false
        }
        const p = document.createElement("div")
        p.className = "itemText"
        p.textContent = valueNames[i]
        ul.append(li)
        li.append(input)
        li.append(p)
        
        console.log(input)
    })




    //Called whenever something gets checked
    const boxCheckHandler = (box, e) => {
        
        e.preventDefault()

        if(!box.checked && (numSelect-1) < minChecked){
            box.checked = true;
        }
        else if(!box.checked){
            numSelect --;
        }
        else{
            numSelect++;
        }

        if(generateFunc){
            generateFunc()
        }

    }

    let checkBoxes = []

    //Calls the logic to ensure a minimum number of items stay checked
    classNames.map((elem,i) => {
        
        const box = mainDiv.getElementsByClassName(elem)[0]
        box.addEventListener("change", (e) => boxCheckHandler(box, e))
        checkBoxes.push(box)
    })

    div.append(mainDiv)



    // Access the anchor for adding click event

    const anchor = mainDiv.getElementsByClassName('anchor')[0];

    anchor.onclick = function() {
        if (mainDiv.classList.contains('visible')){
            mainDiv.classList.remove('visible');
            if(setWindowOpen){
                setWindowOpen(false)
            }
        }
        else{
            mainDiv.classList.add('visible');
            if(setWindowOpen){
                setWindowOpen(true)         
            }
        }
    };

    // Event lister that shrinks the dropdown whenever clicking outside of it
    document.addEventListener('click', function (e) {
        if (!mainDiv.contains(e.target)  && mainDiv.classList.contains('visible')) {
            mainDiv.classList.remove('visible');
        }
    }, false);



    return checkBoxes;
}

export {MinSelectBox}