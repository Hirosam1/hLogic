class Operator{
    constructor(name, logic, imgSrc, ratio, img=undefined){
        this.name = name;
        this.logic = logic;
        this.imgSrc = imgSrc;
        this.ratio =  ratio;
        this.img = img;
        this.type ='image';
    }
};

class OperatorCanvasItem extends Operator{
    constructor(operator, x, y, width, height,){
        super(operator.name, operator.logic, operator.imgSrc, operator.ratio, operator.img);
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
}