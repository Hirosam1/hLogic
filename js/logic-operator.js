const MAX_ITERATIONS=1000;
let runIterations = 0;

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
    constructor(type){
        this.type = type;
    }

    process(inputs){
        return inputs;
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

const logicFactory = {
    'switch' : ()=>{return new Switch();},
    'output': undefined,
    'or' : ()=>{return new Or();},
    'and' : ()=>{return new And();}
}