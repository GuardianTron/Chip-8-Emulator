import VRam from "./chip8.js";

class CanvasDisplay{

    constructor(canvasElement,vram){
        this._vram = vram; 
        this._canvas = canvasElement;
        this._displayContext = this._canvas.getContext('2d');
        this._bgColor = 0x000000;
        this._pxColor = 0xFFFFFF;
        this._frameColor = 0x555555;


        /*
         *Create second canvas to draw actual 
         *game to and copy it to display canvas.
         *Blit canvas will match aspect ratio of the 
         *Vram.
         */
        let aspectRatio = this._vram.width/this._vram.height;
        let blitHeight = this._canvas.height;
        let blitWidth = this._canvas.width;
        //screen too wide
        if(blitWidth > blitHeight * aspectRatio){
            blitWidth = blitHeight * aspectRatio;
        } //tall
        else if(blitWidth < blitHeight * aspectRatio){
            blitHeight = blitWidth / aspectRatio;
        }

        this._blitCanvas = document.createElement("canvas");
        this._blitCanvas.width = blitWidth;
        this._blitCanvas.height = blitHeight;
        this._blitContext = this._blitCanvas.getContext('2d');

        //set up pixel drawing size
        this._pxSize = blitWidth /this._vram.width;

    }

    drawFrame = ()=>{
        //clear blit buffer
        this._blitContext.fillStyle = this._bgColor;
        this._blitContext.fillRect(0,0,this._blitCanvas.width, this._blitCanvas.height);

        //draw pixels
        this._blitContext.fillStyle = this._pxColor;
        for(let y = 0; y < this._vram.height; y++){
            //draw rows of contiguous pixels together for faster processing
            for(let x = 0; x < this._vram.width; x++){
                if(this._vram.getPixel(x,y)){
                    let blitX = x * this._pxSize;
                    let blitY = y * this._pxSize;
                    let rowWidthPx = 1;
                    for(x=x+1;x < this._vram.width; x++){
                        if(!this._vram.getPixel(x,y)){
                            break;
                        }
                        rowWidthPx++;
                    }
                    this._blitContext.fillRect(blitX,blitY,rowWidthPx * this._pxSize,this._pxSize);

                }
            }

        }


    }

    
}