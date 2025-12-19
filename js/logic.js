class Logic{
    constructor(inputN=2){
        this.inputN = inputN;
        this.inputsYPos = [];
        this.outputYPos = 0.0;
        this.calcNodesYPos();
    }

    calcInputsYPos(){
        this.calcInputsYPos[0.25,0.75];
        this.outputYPos = 0.25;
    }

    process(inputs){
        throw new Error('Method "process()" must be implemented');
    }
}

class Actuators {
    constructor(type="output"){
        this.type = type;
        this.actuatorXYPos = [1.0,0.5];
    }
    process(data){
        throw new Error('Method "process()" must be implemented');
    }
}


class Switch extends Actuators{
    constructor(){
        super();
        this.enabled = false;
    }
    process(data){
        this.enabled = !this.enabled;
        return this.enabled;
    }
}

class And extends Logic{
    constructor(inputN=2){
        super(inputN);
    }

    process(inputs){
        for(let i = 0; i < inputN; i++){
            if(inputs[i] === false){
                return false;
            }
        }
        return true;
    }
}

class Or extends Logic{
    constructor(inputN=2){
        super(inputN);
    }
    
    process(inputs){
        for(let i = 0; i < inputN; i++){
            if(inputs[i] === true){
                return true;
            }
        }
        return false;
    }
}