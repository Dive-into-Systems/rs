export function updateHeight(window, document, obj){
    let frame = window.frameElement;
    let height = document.getElementById(`${obj.divid}`).scrollHeight ;
    height =  height + 100;
    frame.style.height = height+'px'

    document.body.addEventListener('click', function( event ){
            updateHeight(window, document, obj)
    });
}