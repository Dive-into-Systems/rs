import "./css/MinSelectBox.css"

//div: the div into which this will be appended
// minChecked: the minimum number of boxes that can be checked
// classNames: the name of the class to be applied to each checkbox
//valueNames: the value of each checkbox 
//defaultChecked: array that specifies whether the box should be checked by default
//placeHolder text: the placeholder text that shows up in the span
//getWindowOpen: I'm using this to keep track of whether or not the window is already open 
//setWindowOpen: self Explanatory
//generateButton => button to be used on value change (typically to regenerate the question)
// Binds the output to this 
//returns an array of the checkbox elements that are created.

const MinSelectBox = (div, minChecked, classNames, valueNames=classNames, defaultChecked=[], placeholderText="Select Operators", getWindowOpen=undefined, setWindowOpen=undefined, generateFunc=undefined) => {



    if(valueNames.length < classNames){
        valueNames = classNames;
    }

    //arrow function so that this is binded

    let numSelect = 0;
    if(defaultChecked.length < classNames.length){
        console.log("ERROR: DEFAULT CHECKED IS EITHER TOO SHORT OR UNDEF")
        defaultChecked = []
        classNames.forEach((elem) => defaultChecked.push(true))
    }
    console.log(defaultChecked)
    defaultChecked.forEach(element => {
        if(element == true){
            numSelect++;
        }
    });

    const mainDiv = document.createElement("div");
    mainDiv.className = 'dropdown-check-list';
    mainDiv.tabIndex = 100;  // Set tabindex to make the div focusable
    const randomIdent = `${Math.floor(Math.random()*1000)}${classNames[0]}`
    mainDiv.id = `list${randomIdent}`

    const span = document.createElement("span")
    span.className = "anchor"
    span.textContent = placeholderText;
    mainDiv.append(span)

    if(getWindowOpen && getWindowOpen()){
        mainDiv.classList.add('visible');
    }
    
    const ul = document.createElement("ul")
    ul.className = "items"
    mainDiv.append(ul)

    classNames.map((elem, i) => {
        const li = document.createElement("li")
        li.className = "itemLi"
        const input = document.createElement("input")
        input.className = elem
        input.setAttribute("type", "checkbox")
        input.value = valueNames[i]

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