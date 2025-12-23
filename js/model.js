class Icon{
    constructor(imgSrc, ratio, img=null, type='image'){
        this.imgSrc = imgSrc;
        this.ratio = ratio;
        this.img = img;
        this.type =type;
    }
}

class CanvasItem{
    constructor(x, y, width, height){
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = 'canvasItem';
    }
}

class Operator{
    constructor(name, logic, icon=null){
        this.name = name;
        this.logic = logic;
        this.icon = icon;
    }
};

class OperatorCanvasItem extends CanvasItem{
    constructor(operator, x, y, width, height){
        super(x, y, width, height);
        this.operator = operator;
        this.type='operator';
    }
}

class LineSegmentCanvasItem extends CanvasItem{
    constructor(startX, startY, endX, endY){
        super(Math.min(startX, endX), Math.min(startY, endY), 
              Math.abs(startX - endX), Math.abs(startY - endY));
        this.startPos = {x: startX, y: startY};
        this.endPos = {x: endX, y: endY};
        this.type = 'node';
    }
}