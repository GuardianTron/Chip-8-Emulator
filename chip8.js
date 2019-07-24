class Chip8{

    constructor(rom){
        if(typeof rom != Uint8Array){
            throw new Error("Roms must be an Uint8Array");
        }

        
        this.ram = new Uint8Array(4096);
        //copy rom into ram
        this.ram.set(rom.slice(0,4096),0x200);
        
        /**
         * Chip 8 roms are stored in big endian order.  
         * DataView is used to avoid issues with 16 bit access on 
         * little endian systems.
         */

        this.vram = new VRam();

        //set up vital register
        this.vReg = new Unit8Array(16);
        this.callStack = new Array(16); //allow for changing size
        this.i = 0x200; //memory address register - most programs start at this memory location
        this.sp = 0; //stack pointer
        this.pc = 0; //program counter
        this._incrementPC = true; //increment the program counter -- set to false by certain instructions such as skips
    }

    _testRamAddress(addr){
        if(addr >= this.ram.length){
            throw new Error("Instruction address is outside of the memory bounds");
        }
    }

    //increment the program counter by 2
    _skipInstruction(){
        this.pc +=2;
        this._incrementPC = false;
    }

    /** cls */
    clearScreen(){
       this.vram.clearScreen()
    }

    /** RET */
    returnFromSubroutine(){
        this.pc = this.callStack[this.sp];
        this.sp--;
    }

    /** JP */
    jump(addr){
        this._testRamAddress(addr);
        this.pc = addr;
        this._incrementPC = false;
    }

    /** CALL */
    call(addr){
        this._testRamAddress(addr);
        this.sp++;
        this.callStack[this.sp] = this.pc;
        this.pc = addr;
    }

    //** SE Vx, byte -- skip instruction if register Vx content equals supplied value */
    skipEqualValue(registerX, value){
        if(this.vReg[registerX] === value){
            this._skipInstruction();

        }
    }

    /**SNE Vx,byte -- skip instruction if register Vx content not equal to supplied value */
    skipNotEqualValue(registerX,value){
        if(this.vReg[registerX] !== value){
            this._skipInstruction();
        }
    }

    /**SE Vx,Vy -- skip instruction if contents of register Vx are equal to contents of register Vx */
    skipEqualRegisters(registerX,registerY){
        if(this.vReg[registerX] === this.vReg[registerY]){
            this._skipInstruction();
        }
    }

    /** LD Vx, byte --load byte into register x */
    loadRegisterByte(registerX,byte){
        this.vReg[registerX] = byte;
    }

    /** ADD Vx, byte -- add context of register X to byte and store in Vx */
    addRegisterToByte(registerX,byte){
        this.vReg[registerX] += byte;
    }

    /** LD Vx,Vy -- load the contents of register Y into register X */
    loadRegisterYIntoRegisterX(registerX,registerY){
        this.vReg[registerX] = this.vReg[registerY];
    }

    /** OR Vx,Vy - bit-wise OR of registers X and Y. Result is stored in register X */
    orRegisterXRegisterY(registerX,registerY){
        let regX = this.vReg[registerX];
        let regY = this.vReg[registerY];
        this.vReg[registerX] = regX | regY;
    }

    /** AND Vx,Vy -- bitwse and of registers X and Y.  Resuslts is stored in register X */
    andRegisterXRegisterY(registerX,registerY){
        let regX = this.vReg[registerX];
        let regY = this.vReg[registerY];
        this.vReg[registerX] = regX & regY;
    }

    /** XOR Vx,Vy -- bitwise exclusive or of registers X and Y. Result stored in register X*/
    xorRegisterXRegisterY(registerX,registerY){
        let regX = this.vReg[registerX];
        let regY = this.vReg[registerY];
        this.vReg[registerX] = regX ^ regY;

    }

    /** SUB Vx,Vy -- Register X = Register X - Register Y -- Vf = Vx>Vy*/
    sub(registerX,registerY){
        this.vReg[0xF] = (registerX > registerY)?1:0;
        this.vReg[registerX] = this.vReg[registerX] - this.vReg[registery];
    }

    /** SHR Vx {,Vy} -- Shift right by 1.  VF = lsb. Vx = Vx >> 1 (Note: Vy is ignored) */
    shiftRight(registerX){
        this.vReg[0xF] = this.vReg[registerX] & 1; //obtain lsb and save
        this.vReg[registerX] = this.vReg[registerX] >> 1;
    }

    /** SUBN Vx,Vy -- Vx=Vy-Vx  , VF = (Vy > Vx */
    subNegative(registerX,registerY){
        this.vReg[0xF] = (registerY > registerX)?1:0;
        this.vReg[registerX] = this.vReg[registerY] - this.vReg[registerX];
    }
    
    /** SHL Vx {, Vy} -- shift left Vx by one bit. Save MSB into VF */
    shiftLeft(registerX){
        this.vReg[0xF] = this.vReg[registerX] & (1 << 8);
        this.vReg[registerX] = this.vReg[registerX] << 1;
    }

    /** SNE Vx, Vy -- Increment the program counter by two if Vx != Vy  */
    skipNotEqualRegisters(registerX,registerY){
        if(this.vReg[registerX] != this.vReg[registerY]){
            this._skipInstruction()
        }
    }

    /** LD I, addr -- load a 12 bit memory address into adress register I*/
    loadIAddress(addr){
       this._testRamAddress();
        this.i = addr;
    }

    /** JP V0, addr -- jump to location V0 + addr */
    jumpV0(addr){
        addr = addr + this.vReg[0];
        this._testRamAddress(addr);
        this.pc = addr;
        this._incrementPC = false;
    }

    /** RND Vx, byte -- Set register X to a random number char bitwise ANDed with byte */
    random(registerX,byte){
        this.vReg[registerX] = Math.round(Math.random() * 255) & byte;
    }


}

const REG_WIDTH = 64;
const REG_HEIGHT = 32;
const SUPER_WIDTH = 128;
const SUPER_HEIGHT = 64;
const RAM_WIDTH_BYTES = 16 ;
const RAM_HEIGHT = 64;

class VRam{

    constructor(){
        /**
         * The Chip 8 display has two modes, a default mode of 64*32 pixel and 
         * an extended mode of 128*64.  Each pixel is represented by a single bit in memory.
         * VRam will allocate enough memory for extended mode, but will use a flag to determine 
         * which portion of the ram should be accessed. 
         */
       
        this.disableExtendedMode();
        this.ram = new Unit8Array(RAM_WIDTH_BYTES * RAM_HEIGHT);


    }
    enableExtendedMode(){
        this._extendedMode = true;
        this._screenHeight = SUPER_HEIGHT;
        this._screenWidth = SUPER_WIDTH;
    }

    disableExtendedMode(){
        this._extendedMode = false;
        this._screenHeight = REG_HEIGHT;
        this._screenWidth = REG_WIDTH;
    }
    get extendedMode(){
        return this._extendedMode;
    }


    clearScreen(){
        for(let i = 0; i < this.ram.length; i++){
            this.ram[i] = 0;
        }
    }

    /**
     * Draws a row to the screen memory starting at coordinates  x, and y.
     * Rows are presented by either a single byte in normal mode and two bytes
     * in extended mode
     * @param {*} x - X coordinate to start drawing row
     * @param {*} y - Y coordiante to start drawing row
     * @param {*} rowData - one or two bytes of pixel data dependent upon extended mode
     * @param {*} useExtended - Even in extended mode, standard sprites can be used. If true and in extended mode, assume 16 bit row
     */

    drawRow(x,y,rowData, useExtended = false){
        //regular chip8 mode
        if(!useExtended || !this._extendedMode){
            //Wrap coordinates if they go outside of screen
            x %= this._screenWidth;
            y %= this._screenHeight;
            //get start of first byte
            let xByteColumn = Math.floor(x/8); 
            let position = y * RAM_WIDTH_BYTES + xByteColumn;
            //determine if portion of screen to write to crosses byte boundaries
            let byteOffset = x%8;
         
            /*
             * Screen section falls in between two bytes.  Right shift byte to be drawn by the 
             * offset above to handle the left most section, and then left shift the byte again
             * by 8 - offset for the right most section.
             */
            this.ram[position] = this.ram[position] ^ (byte >> byteOffset);
            if(byteOffest !==0 ){
                //wrap second byte back to start of screen if outside of it
                //otherwise, draw to next adjacent byte
                if(xByteColumn >= this._screenWidth/8){
                    position = y * RAM_WIDTH_BYTES;
                }
                else{
                    position++;
                }
                this.ram[position] = this.ram[position] ^ (byte << (8-byteOffset));
    
            }

        }

    }



    

}

export {Chip8,VRam}