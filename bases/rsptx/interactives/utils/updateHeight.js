export function updateHeight(window, document, obj, setChange=null){
    let frame = window.frameElement;
    let height = document.getElementById(`${obj.divid}`).scrollHeight ;
    height =  height + 100;
    frame.style.height = height+'px'

    if(setChange){
        document.body.addEventListener('click', function( event ){
            setTimeout(() => {updateHeight(window, document, obj)}, 10)
    });
    }
    
}