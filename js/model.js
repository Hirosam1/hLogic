class Icon{
    constructor(imgSrc, ratio, img=null, type='image'){
        this.imgSrc = imgSrc;
        this.ratio = ratio;
        this.img = img;
        this.type =type;
    }
}

class Operator{
    constructor(name, logic, icon=null){
        this.name = name;
        this.logic = logic;
        this.icon = icon;
    }
};

class OperatorCanvasItem extends Operator{
    constructor(operator, x, y, width, height,){
        super(operator.name, operator.logic, operator.icon);
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
}