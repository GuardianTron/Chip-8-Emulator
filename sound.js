export {Beep as Beep};
export default class Beep{
    
    constructor(){
        this.context = new AudioContext();
        this.generator = this.context.createOscillator();
        this.generator.type = "triangle";
        this.gain = this.context.createGain();
        this.generator.connect(this.gain).connect(this.context.destination);
        this.playing = false;
        this.resumed = false;

    }

    play = () =>{
        if(!this.playing && this.resumed){
            this.playing = true;
            this.generator.start(0);
        }
    }

    stop = () =>{
        if(this.playing && this.resumed){
            this.playing = false;
            this.gain.setValueAtTime(0,this.context.currentTime + 0.015);
        }
    }

    //handle chrome's audio permission issues.
    resume = ()=>{
        if(!this.resumed){
            this.context.resume().then(()=>{
                this.resumed = true;
            });
        }
    }


}