
function logicAnd(){
    let inputSize = arguments.length;
    for(let i = 0; i < inputSize; i++){
        if(arguments[i] === false){
            return false;
        }
    }
    return true;
}

function logicOr(){
    let inputSize = arguments.length;
    for(let i = 0; i < inputSize; i++){
        if(arguments[i] === true){
            return true;
        }
    }
    return false;
}

let logicFunctions = [
    {"or": logicOr},
    {"and": logicAnd}
]