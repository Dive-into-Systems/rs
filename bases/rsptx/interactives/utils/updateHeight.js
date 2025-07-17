export function updateHeight(window, document, obj, setChange=null, fixHeight=null){
    let frame = window.frameElement;
    let height = document.getElementById(`${obj.divid}`).scrollHeight ;
    height =  height + 100;
    if(fixHeight){
        height = fixHeight;
    }
    frame.style.height = height+'px'

    if(setChange){
        document.body.addEventListener('click', function( event ){
            setTimeout(() => {updateHeight(window, document, obj)}, 20)
    });
    }
    
    
}