import { Chip8 } from "./chip8.js"
import { CanvasDisplay } from "./display.js"
import {KeyboardInput} from "./input.js"
import {Beep} from "./sound.js";

export {Chip8Emulator as default}

export class Chip8Emulator{

    constructor(canvas){
        this.chip8Font = null;
        this.chip8FontURL = 'fonts/chip8.cft';
        this.superFontURL = 'fonts/chip8super.sft';
        this.superFont = null;

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
        let keymap = {
            4:103,
            5:104,
            6:105
        };
        Object.keys(keymap).forEach((chip8Key) => {
            const keyCode = keymap[chip8Key]
            this.keyboardMapper.mapKey(keyCode,parseInt(chip8Key,16))
        });
  
        
        /* leaving example code for testing
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
        */
        this.cpu.clockSpeed = 1000;
        
        this.cpu.sound = this.beep;

        //start the screen
        window.requestAnimationFrame(this.display.drawFrame);



    }

    async _downloadFile(fileURL){
        const response = await fetch(fileURL);
        if(response.ok){
            const fileBuffer = await response.arrayBuffer();
            return new Uint8Array(fileBuffer);
        }
        else{
            throw new Error(`Unable to load file ${fileURL}.`);
        }
    }

    async downloaChip8Font(fontURL){
       const font = await this._downloadFile(fontURL);
       this.cpu.loadChip8Font(font);
       
    }

    async downloadSuperFont(fontURL){
        this.superFont = await this._downloadFile(fontURL);
        this.cpu.loadSuperFont(this.superFont);
    }
    async downloadRom(romURL){
        this.rom = await this._downloadFile(romURL);
        return this.rom;
    }
    loadRom(romURL){
        let promises = [];
        if(!this.chip8Font){
            promises.push(this.downloaChip8Font(this.chip8FontURL));
        }
        if(!this.superFont){
            promises.push(this.downloadSuperFont(this.superFontURL));
        }
        promises.push(this.downloadRom(romURL));
        Promise.all(promises).then(()=>{this.startRom()});
        
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
