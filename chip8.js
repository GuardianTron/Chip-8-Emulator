export {Chip8,VRam}

//chip 8 8 bit system sprites
/** @todo -- consider refactoring into separate data file */
const sprites8Bit = new Unit8Array(60);
sprites8Bit.append = function(){
    let index = -1;
    return function(row){
       index++;
       this[index] = row; 
    }
}();

//zero
sprites8Bit.append(0xF0);
sprites8Bit.append(0x90);
sprites8Bit.append(0x90);
sprites8Bit.append(0x90);
sprites8Bit.append(0xF0);

//one
sprites8Bit.append(0x20);
sprites8Bit.append(0x60);
sprites8Bit.append(0x20);
sprites8Bit.append(0x20);
sprites8Bit.append(0x70);

//two
sprites8Bit.append(0xF0);
sprites8Bit.append(0x10);
sprites8Bit.append(0xF0);
sprites8Bit.append(0x80);
sprites8Bit.append(0xF0);

//three
sprites8Bit.append(0xF0);
sprites8Bit.append(0x10);
sprites8Bit.append(0xF0);
sprites8Bit.append(0x10);
sprites8Bit.append(0xF0);

//four
sprites8Bit.append(0x90);
sprites8Bit.append(0x90);
sprites8Bit.append(0xF0);
sprites8Bit.append(0x10);
sprites8Bit.append(0x10);

//five
sprites8Bit.append(0xF0);
sprites8Bit.append(0x80);
sprites8Bit.append(0xF0);
sprites8Bit.append(0x10);
sprites8Bit.append(0xF0);

//six
sprites8Bit.append(0xF0);
sprites8Bit.append(0x80);
sprites8Bit.append(0xF0);
sprites8Bit.append(0x90);
sprites8Bit.append(0xF0);

//seven
sprites8Bit.append(0xF0);
sprites8Bit.append(0x10);
sprites8Bit.append(0x20);
sprites8Bit.append(0x40);
sprites8Bit.append(0x40);

//eight
sprites8Bit.append(0xF0);
sprites8Bit.append(0x90);
sprites8Bit.append(0xF0);
sprites8Bit.append(0x90);
sprites8Bit.append(0xF0);

//nine
sprites8Bit.append(0xF0);
sprites8Bit.append(0x90);
sprites8Bit.append(0xF0);
sprites8Bit.append(0x10);
sprites8Bit.append(0xF0);

//A
sprites8Bit.append(0xF0);
sprites8Bit.append(0x90);
sprites8Bit.append(0xF0);
sprites8Bit.append(0x90);
sprites8Bit.append(0x90);

//B
sprites8Bit.append(0xE0);
sprites8Bit.append(0x90);
sprites8Bit.append(0xE0);
sprites8Bit.append(0x90);
sprites8Bit.append(0xE0);

//C
sprites8Bit.append(0xF0);
sprites8Bit.append(0x80);
sprites8Bit.append(0x80);
sprites8Bit.append(0x80);
sprites8Bit.append(0xF0);

//D
sprites8Bit.append(0xE0);
sprites8Bit.append(0x90);
sprites8Bit.append(0x90);
sprites8Bit.append(0x90);
sprites8Bit.append(0xE0);

//E
sprites8Bit.append(0xF0);
sprites8Bit.append(0x80);
sprites8Bit.append(0xF0);
sprites8Bit.append(0x80);
sprites8Bit.append(0xF0);

//F
sprites8Bit.append(0xF0);
sprites8Bit.append(0x80);
sprites8Bit.append(0xF0);
sprites8Bit.append(0x80);
sprites8Bit.append(0x80);

const programOffset = 0x200;
class Chip8{

    constructor(rom){
        if(typeof rom != Uint8Array){
            throw new Error("Roms must be an Uint8Array");
        }

        
        this.ram = new Uint8Array(4096);
        //copy 8 bit fonts into ram at start
        this.ram.set(sprites8Bit);    

        //copy rom into ram
        this.ram.set(rom.slice(0,4096),programOffset);
        
        /**
         * Chip 8 roms are stored in big endian order.  
         * DataView is used to avoid issues with 16 bit access on 
         * little endian systems.
         */

        this.vram = new VRam();

        //set up vital register
        this.vReg = new Unit8Array(16);
        this.callStack = new Array(16); //allow for changing size
        this._i = 0x200; //memory address register - most programs start at this memory location
        this.sp = 0; //stack pointer
        this._pc = 0; //program counter
        this._dt = 0; //delay timer
        this._st = 0; //sound timer
        this._incrementPC = true; //increment the program counter -- set to false by certain instructions such as skips

        this._currentInstruction; //holds the currently processed instruction
        //array of currently down keys - true if pressed 
        this._pressedKeys = new Array(16);
        this._pressedKeys.fill(false);
    }

    get _currentInstruction(){
        return this._currentInstruction;
    }

    get pressedKeys(){
        return this._pressedKeys;
    }

    setKey(key){
        this._pressedKeys[key] = true;
    }

    unsetKey(key){
        this._presedKeys[key] = false;
    }

    clearKeys(){
        this._pressedKeys.fill(false);
    }

    get i(){
        return this._i;
    }

    set i(addr){
        this._testRamAddress(addr);
        this._i = addr;
    }

    get pc(){
        return this._pc;
    }

    set pc(addr){
        if(addr >= 4096){
            addr = 0;
        }
        this._pc = addr;
    }

    get dt(){
        return this._dt;
    }

    set dt(value){
        //only set up new timer if not already an active timer
        let startNewTimer = this._dt == 0;
        this._dt = Math.clamp(value,0,255);
        if(startNewTimer){
            this._setUpTimer("dt");
        }

    }

    get st(){
        return this._st;
    }

    set st(value){
        //only set up new timer if now already an active timer
        let startNewTimer = this._st == 0;
        this._st = Math.clamp(value,0,255);
        if(startNewTimer){
            this._setUpTimer("st");
        }

    }

    executeCycle(){
        //Instructions are two bytes long
        //Start at offset where program is loaded and then double the program counter
        //to get hight byte
        let instructionStartAddress = programOffset + 2 * this.pc;
        //high byte
        this._currentInstruction = this.ram[instructionStartAddress] << 8;
        //append low byte
        this._currentInstruction += this.ram[instructionStartAddress + 1];
        let opcode = this.current
    }
    _setUpTimer(registerName){
        let timeId; //used for canceling the timer once register hits zero
        if(this[registerName] > 0){
            timerId = setInterval(()=>{
                this[registerName]--;
                if(this[registerName] == 0){
                    clearInterval(timerId);
                }
            },Math.floor(1000/60));
        }
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
        this.pc = addr;
        this._incrementPC = false;
    }

    /** CALL */
    call(addr){
        this.sp++;
        this.callStack[this.sp] = this.pc;
        this.pc = addr;
        this._incrementPC = false;
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
        this.vReg[0xF] = (this.vReg[registerX] > this.vReg[registerY])?1:0;
        this.vReg[registerX] = this.vReg[registerX] - this.vReg[registery];
    }

    /** SHR Vx {,Vy} -- Shift right by 1.  VF = lsb. Vx = Vx >> 1 (Note: Vy is ignored) */
    shiftRight(registerX){
        this.vReg[0xF] = this.vReg[registerX] & 1; //obtain lsb and save
        this.vReg[registerX] = this.vReg[registerX] >>> 1;
    }

    /** SUBN Vx,Vy -- Vx=Vy-Vx  , VF = (Vy > Vx */
    subNegative(registerX,registerY){
        this.vReg[0xF] = (this.vReg[registerY] > this.vReg[registerX])?1:0;
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
        this.i = addr;
    }

    /** JP V0, addr -- jump to location V0 + addr */
    jumpV0(addr){
        addr = addr + this.vReg[0];
        this.pc = addr;
        this._incrementPC = false;
    }

    /** RND Vx, byte -- Set register X to a random number char bitwise ANDed with byte */
    random(registerX,byte){
        this.vReg[registerX] = Math.round(Math.random() * 255) & byte;
    }

    /** DRW Vx,Vy, nibble -- for regular mode draw sprite stored at I stored at location Vx and Vy, nibble rows in regular mode. 16 with nibble == 0 in extended */
    draw(registerX,registerY,rows){
        //set VF to zero.  Change to one if a pixel is unset during rendering.
        this.vReg[0xF] = 0;
        //create start address
        let extendedMode = this.vRam.extendedMode && rows == 0; //determine whether or not to use
        if(extendedMode){
            rows = 16;  //all sprites are 16 x 16 for extended drawing mode    
        } 
        for(let row = 0; row < rows; row++){
            //set start address of sprite row -- extended sprite rows are 2 bytes vs 1 byte for regular
            let spriteRow;
            if(extendedMode){
                this.i += row * 2;
                spriteRow = this.ram[this.i] << 8;
                this.i++;
                spriteRow += this.ram[this.i];
            }
            else{
                this.i += row;
                spriteRow = this.ram[this.i];
            }

            if(this.vRam.drawRow(registerX,registerY+row,extendedMode)){
                this.vReg[0xF] = 1;
            }
        }
    }

    /** SkP Vx  -- Skip instruction if key value in Vx is pressed. */
    skipKeyPressed(registerX){
        if(this.pressedKeys[registerX]){
            this._skipInstruction();
        }
    }

    /** SKNP Vx - skip next instruction if key in Vx not pressed */
    skipKeyNotPressed(registerX){
        if(!this.pressedKeys[registerX]){
            this._skipInstruction();
        }
    }

    /** LD Vx, Dt -- Load value in delay timer into Vx */
    loadDelayTimerIntoRegister(registerX){
        this.vReg[registerX] = this.dt;
    }

    /** LD Vx, K -- pause until a key is pressed and store value in register Vx
     *  Current implementation simply spins the processor polling for a key press.
     *  Will detect lowest value first. May need to refactor to take key pressed order
     *  into account.
     */
    loadKeyIntoRegister(registerX){
        //go through keys until pressed one is found
        //don't increment program counter if none found
        this._incrementPC = false;
        for(let i = 0; i < this.pressedKeys.length; i++){
            if(this.pressedKeys[i]){
                this.vReg[registerX] = i;
                this._incrementPC = true;
                break;
            }
        }
    }

    /** LD DT, Vx.  Load value in register X into the delay timer */
    loadRegisterIntoDelayTimer(registerX){
        this.dt = this.vReg[registerX];
    }


    /** LD ST, Vx  -- load value in register x into sound timer */
    loadRegisterIntoSoundTimer(registerX){
        this.st = this.vReg[registerX];
    }

    /** LD F,Vx -- set I to the value of I and register X */
    addIandRegisterX(registerX){
        this.i += this.vReg[registerX];
    }

    /** LD F, Vx -- set I to location of sprite for digit Vx */
    loadSpriteLocation(registerX){
        //sprites are 5 bytes long and start at memory location 0
        this.i = this.vReg[registerX]*5;
    }

    /** LD B, Vx -- Store BCD representaion of Vx in memory locations I (hundreds), I + 1 (tens), I+2 (ones) */
    storeBCD(registerX){
        let num = this.vReg[registerX];
        let ones = num % 10;
        let tens = Math.floor( (num % 100 - ones)/10 );
        let hundreds = Math.floor(num / 100);
        this.ram[this.i] = hundreds;
        this.ram[this.i + 1] = tens;
        this.ram[this.i + 2] = ones;


    }

    /** LD [I], Vx -- Store registers V0 - Vx in memory starting at location I */
    loadRegisterIntoMemory(registerX){
        for(let reg = 0; reg <= registerX; reg++){
            this.ram[this.i + reg] = this.vReg[reg];
        }
    }

    /** LD Vx,[I] -- store memory starting at I into memory */
    loadMemoryIntoRegisters(registerX){
        for(let reg = 0; reg <= registerX; reg++){
            this.vReg[reg] = this.ram[this.i + reg];
        }
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
            let oldByte = this.ram[position];
            this.ram[position] = this.ram[position] ^ (byte >> byteOffset);
            //see if bit flipped from set to unset
            let bitUnset = this._testBitUnset(oldByte,this.ram[position]);
            
            if(byteOffest !==0 ){
                //wrap second byte back to start of screen if outside of it
                //otherwise, draw to next adjacent byte
                if(xByteColumn >= this._screenWidth/8){
                    position = y * RAM_WIDTH_BYTES;
                }
                else{ 
                    position++;
                }
                oldByte = this.ram[position];
                this.ram[position] = this.ram[position] ^ (byte << (8-byteOffset));
                //only test for unset bit if another bit had not been fliped off
                if(!bitUnset){
                    bitUnset = this._testBitUnset(oldByte,this.ram[position]);
                }
    
            }

            return bitUnset;

        }

    _testBitUnset(oldColumn,newColumn,bytesPerColumn=1){
        let bitUnset = false;
        for(let i = 0; i < 8 * bytesPerColumn; i++){
            let mask = 1 << i;
            let oldBit = oldColumn & mask;
            if(oldBit){
                let newBit = newColumn & mask;
                if(!newBit){
                    return true;
                }
            }
        }
        return false;
    }



    

}

