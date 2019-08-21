import Chip8 from "./chip8.js"
import CanvasDisplay from "./display.js"
import KeyboardInput from "./input.js"

class Chip8Emulator{

    constructor(canvas){
        this.cpu = new Chip8();
        this.keyboardMapper = new KeyboardInput(this.cpu);
        this.display = new CanvasDisplay(canvas,this.cpu.vram);

    
        //set up key mapper
        canvas.addEventListener("keydown",this.keyboardMapper.onkeydown);
        canvas.addEventListener("keyup",this.keyboardMapper.onkeyup);
        this.keyboardMapper.mapKey(144,1);
        this.keyboardMapper.mapKey(111,2);
        this.keyboardMapper.mapKey(106,3);
        this.keyboardMapper.mapKey(103,4);
        this.keyboardMapper.mapKey(104,5);
        this.keyboardMapper.mapKey(105,6);
        this.keyboardMapper.mapKey(100,7);
        this.keyboardMapper.mapKey(101,8);
        this.keyboardMapper.mapKey(102,9);
        this.keyboardMapper.mapKey(98,0);
        this.keyboardMapper.mapKey(97,0xA);
        this.keyboardMapper.mapKey(99,0xB);
        this.keyboardMapper.mapKey(109,0xC);
        this.keyboardMapper.mapKey(107,0xD);
        this.keyboardMapper.mapKey(13,0xE);
        this.keyboardMapper.mapKey(110,0xF);

        //start the screen
        window.requestAnimationFrame(this.display.drawFrame);



    }

    loadRom(romURL){
        fetch(romURL).then((response) => {
            if(response.ok){
                return response.blob();
            }
            throw new Error();
        }).then((blob)=>{
            return blob.arrayBuffer();
        }).then((buffer)=>{
            this.rom = Uint8Array(buffer);
            this.startRom();
        }).catch((reason)=>{
            console.log("The given rom could not be loaded.");
        });
        
    }

    startRom(){
        this.cpu.loadRom(this.rom);
        this.cpu.execute();


    }
    
}
