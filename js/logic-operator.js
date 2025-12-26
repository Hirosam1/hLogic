const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

class Logic{
    constructor(type){
        this.type = type;
    }

    process(inputs){
        throw new Error('Method "process()" must be implemented');
    }
}

class Switch extends Logic{
    constructor(){
        super(verticesTypes.source);
        this.enabled = false;
    }
    process(data){
        this.enabled = !this.enabled;
        return this.enabled;
    }
}

class OutputLed extends Logic{
    constructor(){
        super('outputLed');
    }

    process(inputs){
        return inputs;
    }
}

class Not extends Logic{
    constructor(){
        super('not');
    }
    process(inputs){
        return !inputs[0];
    }
}

class And extends Logic{
    constructor(){
        super('and');
    }

    process(inputs){
        for(let i = 0; i < inputs.length; i++){
            if(inputs[i] === false){
                return false;
            }
        }
        return true;
    }
}

class Or extends Logic{
    constructor(){
        super('or');
    }
    
    process(inputs){
        for(let i = 0; i < inputs.length; i++){
            if(inputs[i] === true){
                return true;
            }
        }
        return false;
    }
}

class Xor extends Logic{
    constructor(){
        super('xor');
    }

    process(inputs){
        let o = false;
        for(let i = 0; i < inputs.length; i++){
            if(inputs[i] === true){
                if(o){return false};
                o = true;
            }
        }
        return o;
    }
}

const logicFactory = {
    'switch' : ()=>{return new Switch();},
    'not': ()=>{return new Not();},
    'or' : ()=>{return new Or();},
    'xor': ()=>{return new Xor();},
    'and' : ()=>{return new And();}
}

function createLogic(logicName){
    if(logicFactory[logicName]){
        return logicFactory[logicName]();
    }else{
        return undefined;
    }
}