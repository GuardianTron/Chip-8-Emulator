class KeyboardInput{
    
    constructor(chip8){
        this.chip8 = chip8;
        this.physicalToChip8 = {};
        this.chip8toPhysical = {};
    }

    mapKey(keycode, chip8Key){
        //remove old key code
        if(this.chip8toPhysical.hasOwnKey(chip8Key)){
            let oldKeycode = this.chip8toPhysical[chip8Key];
            delete this.physicalToChip8[oldKeycode];
        }

        this.chip8toPhysical[chip8Key] = keycode;
        this.physicalToChip8[keycode] = chip8Key;
    }

    onkeydown = (event) => {
        if(this.physicalToChip8.hasOwnKey(event.keyCode)){
            let chip8Key = this.physicalToChip8[event.keyCode];
            this.chip8.setKey(chip8Key);
        }
        
    }

    onkeyup = (event) => {
        if(this.physicalToChip8.hasOwnKey(event.keyCode)){
            let chip8Key = this.physicalToChip8[event.keyCode];
            this.chip8.unsetKey(chip8Key);
        }
    }


}