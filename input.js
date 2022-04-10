import { Chip8 } from "./chip8.js";
export class KeyboardInput{
    
    constructor(chip8){
        this.chip8 = chip8;
        this.physicalToChip8 = new Map();
        this.chip8toPhysical = new Map();
    }

    clearKeyMap(){
        this.physicalToChip8.clear();
        this.chip8toPhysical.clear();
    }

    mapKey(code, chip8Key){
        //remove old key code
        if(this.chip8toPhysical.has(chip8Key)){
            let oldCode = this.chip8toPhysical.get(chip8Key);
            this.physicalToChip8.delete(oldCode);
        }

        this.chip8toPhysical.set(chip8Key, code);
        this.physicalToChip8.set(code,chip8Key);
    }

    onkeydown = (event) => {
        if(this.physicalToChip8.has(event.code)){
            let chip8Key = this.physicalToChip8.get(event.code);
            this.chip8.setKey(chip8Key);
        }        console.log(e.target.id);
    }

    onkeyup = (event) => {
        if(this.physicalToChip8.has(event.code)){
            let chip8Key = this.physicalToChip8.get(event.code);
            this.chip8.unsetKey(chip8Key);
        }
        
    }


}