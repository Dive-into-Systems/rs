import "./css/MinSelectBox.css"

// minChecked: the minimum number of boxes that can be checked
// classNames: the name of the class to be applied to each checkbox
//valueNames: the value of each checkbox 
//defaultChecked: array that specifies whether the box should be checked by default
//placeHolder text: the placeholder text that shows up in the span
// Binds the output to this 
//returns an array of the checkbox elements that are created.
//div: the div into which this will be appended

const MinSelectBox = (div, minChecked, classNames, valueNames=classNames, defaultChecked=[], placeholderText="Select Operators") => {

    if(valueNames.length < classNames){
        valueNames = classNames;
    }

    //arrow function so that this is binded

    let numSelect = 0;
    if(defaultChecked.length < classNames.length){
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





    const boxCheckHandler = (box) => {
        if(!box.checked && (numSelect-1) < minChecked){
            box.checked = true;
        }
        else if(!box.checked){
            numSelect --;
        }
        else{
            numSelect++;
        }
        console.log(numSelect) 
    }

    let checkBoxes = []

    classNames.map((elem,i) => {

        const e = mainDiv.getElementsByClassName(elem)[0]
        e.addEventListener("change", () => boxCheckHandler(e))
        checkBoxes.push(e)
    })

    div.append(mainDiv)



    // Access the anchor for adding click event

    const anchor = mainDiv.getElementsByClassName('anchor')[0];
    anchor.onclick = function() {
        if (mainDiv.classList.contains('visible'))
            mainDiv.classList.remove('visible');
        else
            mainDiv.classList.add('visible');
    };

    // Event lister that shrinks the dropdown whenever clicking outside of it
    document.addEventListener('click', function (e) {
        if (!mainDiv.contains(e.target) && mainDiv.classList.contains('visible')) {
            mainDiv.classList.remove('visible');
        }
    }, false);



    return checkBoxes;
}

export {MinSelectBox}