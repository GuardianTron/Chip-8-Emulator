import { Chip8 } from "./chip8.js"
import { CanvasDisplay } from "./display.js"
import {KeyboardInput} from "./input.js"
import {Beep} from "./sound.js";

export {Chip8Emulator as default}

export class Chip8Emulator{

    constructor(canvas){
        this.cpu = new Chip8();
        this.keyboardMapper = new KeyboardInput(this.cpu);
        this.display = new CanvasDisplay(canvas,this.cpu.vram);
        this.beep = new Beep();

        //resume sound when user presses a button for audio compliance

       
        window.addEventListener("keyup",this.beep.resume);
        window.addEventListener("keydown",this.beep.resume);

        //set up key mapper
        window.addEventListener("keydown",this.keyboardMapper.onkeydown);
        
        window.addEventListener("keyup",this.keyboardMapper.onkeyup);
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
        this.cpu.clockSpeed = 1000;

        this.cpu.sound = this.beep;

        //start the screen
        window.requestAnimationFrame(this.display.drawFrame);



    }

    loadRom(romURL){
        fetch(romURL).then((response) => {
            if(response.ok){
                console.log("Rom downloaded");
                return response.arrayBuffer();
            }
            throw new Error();
        }).then((buffer)=>{
            console.log("Converting to array");
            this.rom = new Uint8Array(buffer);
            console.log(this.rom);
            this.startRom();
        })/*.catch((reason)=>{
            console.log("The given rom could not be loaded.");
        })*/;
        
    }

    startRom(){
        this.cpu.loadRom(this.rom);
        this.cpu.execute();


    }

    addCallback(func){
        this.cpu.addCallback(func);
    }

    removeCallback(func){
        this.cpu.removeCallback(func);
    }
    
}
