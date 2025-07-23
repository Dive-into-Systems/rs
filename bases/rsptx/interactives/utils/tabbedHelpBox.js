 
 
import "./css/tabbedHelpBox.css"



//This is used to generate the help box.legend that you see on the circuit components
// Params: numTabs: the number of tabs in the help window; div: the div evrything will be appended/prependd into; labels: the labels of tabs in the window ["Name1", "Name2"]
// imgsrcs: an array of image sources ( ['/source/resources/x.png', '', ...]), prepend: will the element be apended or prepended into the div

export function  tabbedHelpBox(numTabs, div, labels, imgsrcs, prepend=false ){


    let helpOpen = false;

    let instructionsButton = document.createElement("a")
    instructionsButton.innerText = "Stuck? Click for a tutorial ▼"
    instructionsButton.className = 'instructionsButton'



    let legend = document.createElement("div")
    legend.style.display = "none"
    legend.className = "instructionsLegend"


    let TabsDiv = document.createElement('div')
    // legendImage.src = 'https://encrypted-tbn3.gstatic.com/images?q=tbn:ANd9GcRlJ4ZwNR5h_VyPNDygNN7JhWkqdoiL3I-QJ6c6k-xo7PiAKo5u'
    TabsDiv.className = 'legendImage'
    TabsDiv.style.display = 'none'


    const nums = []

    for(let i = 1; i <= numTabs; i++){
        nums.push(i)
    }


    //I didn't have the heart to fully delete this :(

    // const IHTML = `
    //     <div class = "helpContainer">
        
    //     <div class="flexSidebar">
    //         ${nums.map(i =>`<div id="Panel${i}" class="flexItem">${labels[i=1]}</div>`)}
    //     </div>
    //     <div class = "helpContentHolder">
    //             ${nums.map(i => 
    //                 `
    //                 <div id="Panel${i}-Content" style="display:inherit" class="helpContent">  
    //                     <img class="helpContent-image" src="${imgsrcs[i-1]}"> </img>
    //                  </div>
    //                 `
    //             )}
    //     </div>
        
    //     </div>
            
    // `

    let helpContainer = document.createElement('div')
    helpContainer.className = 'helpContainer'


    let flexSidebar = document.createElement("div")
    flexSidebar.className = 'flexSidebar'
    helpContainer.append(flexSidebar)

    let helpContentHolder = document.createElement('div')
    helpContentHolder.className = 'helpContentHolder'
    helpContainer.append(helpContentHolder)


    let flexSidebarDivs = []

    nums.forEach( num => {
        const fsd = document.createElement('div')
        fsd.id = `Panel${num}`
        fsd.className = 'flexItem'
        fsd.textContent = labels[num-1]

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










    instructionsButton.addEventListener("click" , ()=> {
        
        legend.style.display = legend.style.display == "block" ? "none" : "block"

        helpOpen = !helpOpen
        if(helpOpen){
            instructionsButton.innerText = "Hide help ▲"
            TabsDiv.style.display = "inherit"

        }
        else{
            instructionsButton.innerText = "Stuck? Click for a tutorial ▼"
            TabsDiv.style.display = "none"
        }
        return false;
    })





    const setInvis = () => {
        helpContentDivs.forEach(  elem => elem.style.display = "none")
        flexSidebarDivs.forEach(  elem => elem.style.background = "")
    }

        

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
 
