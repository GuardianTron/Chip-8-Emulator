class Chip8{

    constructor(rom){
        if(typeof rom != Uint8Array){
            throw new Error("Roms must be an Uint8Array");
        }

        
        this.ram = new Uint8Array(4096);
        //copy rom into ram
        for(let i = 0; i < rom.length && i < this.ram.length; i++ ){
            this.ram[i] = rom[i];
        }
        this.vramSize = 64/8*32;
        this.vram = new Uint8Array(this.vramSize); //a 64x32 pixel display. 1 bit = 1 pixel. 1 byte = 8x1 block of pixels

        //set up vital register
        this.vReg = new Unit8Array(16);
        this.callStack = new Array(16); //allow for changing size
        this.i = 0x200; //memory address register - most programs start at this memory location
        this.sp = 0; //stack pointer
        this.pc = 0; //program counter
    }

    /** cls */
    clearScreen(){
        for(let i = 0; i < this.vram.length; i++){
            this.vram = 0;
        }
    }

    /** RET */
    returnFromSubroutine(){
        this.pc = this.callStack[this.sp];
        this.sp--;
    }

    /** JP */
    jump(addr){
        if(addr >= this.ram.length){
            throw new Exception("Instruction address is outside of the memory bounds");
        }
        this.pc = addr;
    }


}

export {Chip8}