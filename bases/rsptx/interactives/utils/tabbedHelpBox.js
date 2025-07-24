 
 
import "./css/tabbedHelpBox.css"



//This is used to generate the help box.legend that you see on the circuit components
// Params: numTabs: the number of tabs in the help window; div: the div evrything will be appended/prependd into; labels: the labels of tabs in the window ["Name1", "Name2"]
// imgsrcs: an array of image sources ( ['/source/resources/x.png', '', ...]), prepend: will the element be apended or prepended into the div


//High level overview of the code:
// (1) Create the HTML through a series of nested javascript (I had a very elegant way of doing this using foreach in a template literal that I later had to delete :(     )
// (2) Grab all the tab and image html elements
// (3) Add necessary event handlers for functionallity


//For a simple use case, check out CircuitVis.js

export function  tabbedHelpBox(numTabs, div, labels, imgsrcs, prepend=false ){


    if(labels.length  != numTabs){
        console.error(`ERROR: Labels has the wrong length! Expected value with length ${numTabs} but read value ${labels}`)
    }
    if(imgsrcs.length  != numTabs){
        console.error(`ERROR: Imgsrcs has the wrong length! Expected value with length ${numTabs} but read value ${imgsrcs}`)
    }
    
    

    //keep track of whether or not the help window is open
    let helpOpen = false;


    //These are the messages that will show up on the <a> when the help is open/closed
    const OpenMessage = "Stuck? Click for a tutorial ▼";
    const CloseMessage = "Hide help ▲";


    //renders the <a> tag
    let instructionsButton = document.createElement("a")
    instructionsButton.innerText = OpenMessage
    instructionsButton.className = 'instructionsButton'



    // A lot of nested divs created for formating purposes:
    // I make a side pane with tabs and then a pane on the right side of the window that holds windows?


    let legend = document.createElement("div")
    legend.style.display = "none"
    legend.className = "instructionsLegend"


    let TabsDiv = document.createElement('div')
    TabsDiv.className = 'legendImage'
    TabsDiv.style.display = 'none'



    //In all honesty, I am certain there is a cleaner way to do this.
    const nums = []

    for(let i = 1; i <= numTabs; i++){
        nums.push(i)
    }


    let helpContainer = document.createElement('div')
    helpContainer.className = 'helpContainer'


    let flexSidebar = document.createElement("div")
    flexSidebar.className = 'flexSidebar'
    helpContainer.append(flexSidebar)

    let helpContentHolder = document.createElement('div')
    helpContentHolder.className = 'helpContentHolder'
    helpContainer.append(helpContentHolder)


    //storing for later reference in the click event handlers
    let flexSidebarDivs = []

    nums.forEach( num => {
        const fsd = document.createElement('div')
        fsd.id = `Panel${num}`
        fsd.className = 'flexItem'
        fsd.textContent = labels[num-1]


        //by default the first elem is selected
        if(num == 1){
            fsd.style.background = "lightblue"
        }

        flexSidebar.append(fsd)
        flexSidebarDivs.push(fsd)
    })


    let helpContentDivs = []
    nums.forEach( num => {
        const hcd = document.createElement('div')
        hcd.id = `Panel${num}-Content`
        hcd.className = 'helpContent'

        if(num == 1){
            hcd.style.display = 'inherit'
        }


        const img = document.createElement('img')
        img.className = 'helpContent-image'
        img.src = imgsrcs[num-1]

        hcd.append(img)

        helpContentHolder.append(hcd)


        helpContentDivs.push(hcd)
    })




    TabsDiv.getElementBy

    legend.appendChild(TabsDiv)










    //Handles the logic for opening/closing the help pane
    instructionsButton.addEventListener("click" , ()=> {
        
        legend.style.display = legend.style.display == "block" ? "none" : "block"

        helpOpen = !helpOpen
        if(helpOpen){
            instructionsButton.innerText = CloseMessage;
            TabsDiv.style.display = "inherit"

        }
        else{
            instructionsButton.innerText =  OpenMessage;
            TabsDiv.style.display = "none"
        }
        return false;
    })





    //Make all the images in the help window invisible, set the background color of the tabs to white (not selected)
    const setInvis = () => {
        helpContentDivs.forEach(  elem => elem.style.display = "none")
        flexSidebarDivs.forEach(  elem => elem.style.background = "")
    }

        

    //Add the event handler that allows for selectino of a tab to all the tabs
    for(let i = 0; i < numTabs; i++){
    flexSidebarDivs[i].addEventListener("click", ()=> {
        console.log("click")
        
        
        setInvis()

        helpContentDivs[i].style.display = "block"

        flexSidebarDivs[i].style.background = "lightblue"
        
    })
    }


    if(!prepend){
        div.append(instructionsButton)
        TabsDiv.append(helpContainer)
        div.appendChild(legend)
    }
    else{
        div.prepend(legend)        
        TabsDiv.prepend(helpContainer)
        div.prepend(instructionsButton)
    }



}
 
