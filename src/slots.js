cc.w.slots = {};
//老虎机属性
cc.w.slots.COLUMN_COUNT = 5;//一共多少列
cc.w.slots.ROW_COUNT = 3;//一共多少行
cc.w.slots.CELL_KIND_COUNT = 13;//图标种类数量
cc.w.slots.CYCLE_COUNT_MIN = 2;//最少要完成循滚动的次数,要求为偶数
cc.w.slots.CELL_IMAGES = [//图标所有种类的图片，目前有13种
                          "res/icon_1.png",
                          "res/icon_2.png",
                          "res/icon_3.png",
                          "res/icon_4.png",
                          "res/icon_5.png",
                          "res/icon_6.png",
                          "res/icon_7.png",
                          "res/icon_8.png",
                          "res/icon_9.png",
                          "res/icon_10.png",
                          "res/icon_a1.png",
                          "res/icon_a2.png",
                          "res/icon_a3.png",
                          ];
//全局变量
cc.w.slots.SLOTS_CELL_NODES = [];//存放所有SlotsCellNode
cc.w.slots.GROUP_NODE_HEIGHT = 0;
cc.w.slots.LINE_POINTS = null;//存放所有画线的点。在初始化老虎机是初始化
//老虎机状态
cc.w.slots.STATE_STOPED = 0;//表示静止
cc.w.slots.STATE_RUNNING = 1;//表示运行
cc.w.slots.STATE = cc.w.slots.STATE_STOPED;
//测试模式
cc.w.slots.MODE_DEBUG = false;//
cc.w.slots.MODE_DEBUG_SPEED = false;//
cc.w.slots.MODE_DEBUG_SlotsCellGroupNode = false;//
cc.w.slots.MODE_DEBUG_SlotsColumnNode = false;//
//老虎机结果
cc.w.slots.RESULT = null;//用于保存游戏结果数据，每次运行前会清除
cc.w.slots.CYCLE_COUNT = 0;//当前（第一列）循环滚动的次数（后面的列也要完成同样次数才能停止）
//监听的事件
cc.w.slots.EVENT_START = "cc.w.slots.EVENT_START";//老虎机执行运行事件
cc.w.slots.EVENT_SHOW_LINE = "cc.w.slots.EVENT_SHOW_LINE";//老虎机执行显示线事件
cc.w.slots.EVENT_RESULT = "cc.w.slots.EVENT_RESULT";//通知老虎机已经有结果，这时机器会自动判断并停止
//发出的事件
cc.w.slots.EVENT_CYCLED = "cc.w.slots.EVENT_CYCLED";//老虎机运行一个循环事件
cc.w.slots.EVENT_STOPED = "cc.w.slots.EVENT_STOPED";//老虎机停止事件(所有列表都停止后调用)
cc.w.slots.EVENT_LINE_SHOWN = "cc.w.slots.EVENT_LINE_SHOWN";//老虎机画一条线并播放线动画结束事件
//动画
/**开始运动动画*/
cc.w.slots.actionStart = function(){
//	var bounceDistance = 50;
//	var bounceAction = cc.moveBy(2, cc.p(0, bounceDistance)).easing(cc.easeBackIn());
	var duration = cc.w.slots.MODE_DEBUG_SPEED?0.5+5:0.5;
	var bounceAction2 = cc.moveBy(duration, cc.p(0, -cc.w.slots.GROUP_NODE_HEIGHT)).easing(cc.easeBackIn());
//	var seq = cc.sequence(bounceAction2)
//	return seq;
	return bounceAction2;
};
/**停止运动动画*/
cc.w.slots.actionStop = function(){
	var duration = cc.w.slots.MODE_DEBUG_SPEED?0.5+5:0.5;
	return cc.moveBy(duration, cc.p(0, -cc.w.slots.GROUP_NODE_HEIGHT)).easing(cc.easeBackOut());
};
/**匀速运动动画*/
cc.w.slots.actionConstant = function(){
	var duration = cc.w.slots.MODE_DEBUG_SPEED?0.2+1:0.2;
	return cc.moveBy(duration, cc.p(0, -cc.w.slots.GROUP_NODE_HEIGHT));
};
cc.w.slots.actionCellNode = function(){
	var duration = 0.5; 
	var a1 = cc.scaleTo(duration, 1.1);
	var a2 = cc.scaleTo(duration, 1.0);;
	return cc.repeatForever(cc.sequence(a1,a2));
};
/////////////////////////////////////////////////////////////////////////////////////
/**
 * 老虎机一个CELL中的数据对象
 */
cc.w.slots.SlotCell = cc.Class.extend({
	_imageId:null,
});
/**
 * 通过图片ID来得到本地图片保存的路径
 * 图片ID为整数 1-13
 */
cc.w.slots.getCellImageById = function(imageId){
	if (imageId<=0||imageId>cc.w.slots.CELL_KIND_COUNT) {
		imageId = 1;
	}
	var index = imageId-1;
	return cc.w.slots.CELL_IMAGES[index];
};
cc.w.slots.getRandomImageId = function(){
	return cc.w.slots.getCellImageById(Math.ceil(cc.random0To1()*cc.w.slots.CELL_KIND_COUNT));
};
/**
 * 计算SlotsCellNode的索引
 * colIndex SlotsCellNode所有列索引
 * groupCellIndex SlotsCellNode所在SlotsCellGroupNode的索引（top=0,center=1,bottom=2）
 */
cc.w.slots.computeCellNodeIndex = function(colIndex,groupCellIndex){
	var index = groupCellIndex*cc.w.slots.COLUMN_COUNT+colIndex;
//	cc.log("CELL_INDEX = "+index + "(colIndex="+colIndex+" groupCellIndex="+groupCellIndex+")");
	return index;
};
/////////////////////////////////////////////////////////////////////////////////////
/**
 * 线对象
 */
cc.w.slots.Line = cc.Class.extend({
	len:2,//连了几个，最少两个
	_linePints:null,//组成线的所有点
	color:null,//线的颜色
	_bigAnimation:0,//大动画，根据当前得分倍数来处理，分6个阶段0为无动画1-5有不同的动画
	specialEffect:0,//0表示没有，1表示免费次数，2表示加血
	toString:function(){
		return "\n(Line){len="+this.len
//		+";linePints=\n"+this._linePints
		+";specialEffect=\n"+this.specialEffect
		+"}"
	},
	getPoints:function(){
		return this._linePints;
	},
	addPoint:function(linePoint){
		if (this._linePints==null) {
			this._linePints = new Array();
		}
		this._linePints.push(linePoint);
	}
});
/**
 * 组成线的点对象
 */
cc.w.slots.LinePoint = cc.Class.extend({
	_rect:null,
	_lines:null,//这个连线的点所关联的线们，一或多个
	index:0,//点在所有SlotsCellNode中的位置0-14，也就是SlotsCellNode的索引
	preOne:null,//当前点的前一个点
	nextOne:null,//当前点的后一个点
	setRect:function(rect){
		this._rect = rect;
	},
	getRect:function(){
		return this._rect;
	},
	reset:function(){
		this._rect = null;
		this._lines = null;
		this.preOne = null;
		this.nextOne = null;
	},
	toString:function(){
		return "\n(LinePoint)" +
				"{index="+this.index+";rect="+this._rect
				+";lines:"+(this._lines==null?0:this._lines.length)
				+"}"
	},
	relateToLine:function(line){
		if (this._lines==null) {
			this._lines = new Array();
		}else if(this._lines.indexOf(line)!=-1){
			return;
		}
		this._lines.push(line);
	},
	/**
	 * 根据当前传入的线和矩形来计算点的坐标
	 */
	computePointOfLine:function(line){
		if (this._lines==null||this._lines.length==0||this._rect==null) {
			cc.w.log.e("cc.w.slots.LinePoint", "this._lines==null||this.rect==null");
			return cc.p(0, 0);
		}
		var posX = this._rect.x + this._rect.width/2;
		var posY = this._rect.y - this._rect.height/2;
		
		var points = new Array();
		var centerPoint = cc.p(posX,posY);
		
		
		if (this.preOne==null&&this.nextOne!=null) {
			posX = this._rect.x;
			points.push(cc.p(posX, posY));
		}
		
		points.push(centerPoint);
		
		if (this.preOne!=null&&this.nextOne==null) {
			posX = this._rect.x + this._rect.width;
			points.push(cc.p(posX, posY));
		}
		
//		var linesCount = this._lines.length;
//		var index = this._lines.indexOf(line);
//		
//		if (index!=-1) {
//			var top = this._rect.y;//+this._rect.height;
//			poxY = top - (index)*( this._rect.height/(linesCount+1) );
//		}
		
		
		return points;
	},
});
/**
 * 老虎机结果对象
 */
cc.w.slots.Result = cc.Class.extend({
	_images:null,//结果图标集合，目前一共15个位置，共13种图片，ID为1-13
	_lines:null,//线动画+特效的数据组合在一起就是"x,x,x,x,x:y:z",x表线的位置，y表示连了几个图标,z为特效ID
	/**
	 * 因为要计算点与线的关联，所以点被定义为全局变量，用完后要还原
	 */
	reset:function(){
		if (this._lines==null){
			return;
		}
		for (var i = 0; i < this._lines.length; i++){
			var line = this._lines[i];
			var lps = line.getPoints();
			if (lps!=null) {
				for (var j = 0; j < lps.length; j++){
					var lp = lps[j];
					lp.reset();
				}
			}
		}
	},
	setImages:function(images){
		this._images = images;
	},
	setImagesData:function(data){
		var resultArray = data.split(",");
		this.setImages(resultArray);
	},
	getImages:function(){
		return this._images;
	},
	setLinesData:function(data){
		if (data==null||data.length==0) {
			return;
		}
		
		this._lines = new Array();
		
		for (var lineIndex = 0; lineIndex < data.length; lineIndex++) {
			var lineData = data[lineIndex];
			var lineDataArray = lineData.split(":");
			if (lineDataArray.length==3) {
				var line = new cc.w.slots.Line();
				var linePointIndexs = lineDataArray[0].split(",");
				var lineLen = lineDataArray[1];
				var specialEffect = lineDataArray[2];
				line.len = lineLen;
				line.specialEffect = specialEffect;
				var prePoint = null
				for (var i = 0; i < linePointIndexs.length; i++) {
					var idx = linePointIndexs[i];
					var point = cc.w.slots.LINE_POINTS[idx];
					line.addPoint(point);
					point.relateToLine(line);
					point.preOne = prePoint;
					if (prePoint!=null) {
						prePoint.nextOne = point;
					}
					prePoint = point;
				}
				this._lines.push(line);
			}else{
				cc.w.log.e("cc.w.slots.Result", "老虎机结果数据解析错误")
			}
//			cc.log("cc.w.slots.Result.getLines"+this.getLines());
//			cc.log("cc.w.slots.LINE_POINTS"+cc.w.slots.LINE_POINTS);
		}
	},
	getLines:function(){
		return this._lines;
	}
});
/////////////////////////////////////////////////////////////////////////////////////
//cc.w.view.LineCellNode = cc.Node.extend({
//});
/**
 * 显示线的组件
 */
cc.w.slots.LinesNode = cc.Node.extend({//TODO
	_cellRectWidth:0,//每个格子的宽
	_cellRectHeight:0,//每个格子的高
	_clippingNode:null,
	_drawNode:null,
	ctor:function(size,height){
		this._super();
		this.setContentSize(size,height);
//		this.setAnchorPoint(0.5, 0.5);
		
//		var layer = new cc.LayerColor(cc.color(cc.random0To1()*205,cc.random0To1()*205, cc.random0To1()*205, 255));
//		layer.setContentSize(this.getContentSize());
//		this.addChild(layer);
//		layer.setOpacity(150);
		
		this._clippingNode = new cc.ClippingNode(this.createRectStencil(size, height));
		this._clippingNode.setInverted(false);
		this.addChild(this._clippingNode);
		
		this.setupView();
//		this.updateView();
	},
	setupView:function(){
		
		this._drawNode = new cc.DrawNode();
		this._clippingNode.addChild(this._drawNode, 1);
		if (cc.w.slots.LINE_POINTS==null) {
			cc.w.slots.LINE_POINTS = new Array();
			for (var i = 0; i < cc.w.slots.COLUMN_COUNT*cc.w.slots.ROW_COUNT; i++) {
				var linePoint = new cc.w.slots.LinePoint();
				linePoint.index = i;
				cc.w.slots.LINE_POINTS[i] = linePoint;
			}
		}
//		cc.log("cc.w.slots.LINE_POINTS = "+cc.w.slots.LINE_POINTS);
	},
	updateView:function(){
//		this.removeAllChildren();
		if (cc.w.slots.RESULT==null||cc.w.slots.RESULT.getLines()==null) {
			return;
		}
		var width = this.getContentSize().width;
		var height = this.getContentSize().height;
		this._cellRectWidth = width/cc.w.slots.COLUMN_COUNT;
		this._cellRectHeight = height/cc.w.slots.ROW_COUNT;
		var totalCount = cc.w.slots.LINE_POINTS.length;
		for (var i = 0; i < totalCount; i++) {
			var linePoint = cc.w.slots.LINE_POINTS[i];
			var col = i%cc.w.slots.COLUMN_COUNT;
			var row = Math.floor(i/5);
			var x = col*this._cellRectWidth;
			var y = height-row*this._cellRectHeight;
			var rect = cc.rect(x, y, this._cellRectWidth, this._cellRectHeight);
			linePoint.setRect(rect);
//			cc.log("######@@@@###### "+rect.x+"  "+rect.y);
//			cc.log("######@@@@###### "+row+"  "+col);
//			cc.log("######@@@@###### "+(row*cc.w.slots.COLUMN_COUNT+col));
		}
	},
	reset:function(){
		this._drawNode.clear();
	},
	drawLine:function(lineIndex){
		this._drawNode.clear();
		if (cc.w.slots.RESULT==null||cc.w.slots.RESULT.getLines()==null||cc.w.slots.RESULT.getLines().length<lineIndex) {
			return;
		}
		var line = cc.w.slots.RESULT.getLines()[lineIndex];
		if (line.getPoints()==null||line.getPoints().length==0) {
			return;
		}
		var positions = new Array();
		var lineSize = 16;
		for (var i = 0; i < line.getPoints().length; i++) {
			var point = line.getPoints()[i];
			//TEST
			var pos = 
//				cc.p(point.getRect().x,point.getRect().y);
				point.computePointOfLine(line);
			for (var posIndex = 0; posIndex < pos.length; posIndex++) {
				positions.push(pos[posIndex]);
			}
//			this._drawNode.drawDot(pos, 5, cc.color(0, 0, 255, 128));
			//END TEST
			//TODO 转化linePoint to cc.p()数组，并画线
		}
//		this._drawNode.drawCardinalSpline(positions, 1, 100, lineSize, cc.color(255, 255, 255, 255));
		this._drawNode.drawCardinalSpline(positions, 1, 100, lineSize*0.5, cc.color(255, 0, 255, 255*0.7));
		
		var action1 = cc.blink(1, 3);
		var callback = cc.callFunc(this.onLineShown, this);
		var seq = cc.sequence(action1,callback);
		this._drawNode.runAction(seq);
//		var action = cc.fadeOut(0.5);
//		this._drawNode.runAction(cc.repeat(cc.sequence(action,action.reverse()),-1));
	},
	onLineShown:function(){
		this._drawNode.setVisible(true);
		cc.eventManager.dispatchCustomEvent(cc.w.slots.EVENT_LINE_SHOWN);
	},
	createRectStencil:function(size,height){
		var stencil = new cc.DrawNode();
		var color = cc.color(255,255,255,0);
		//宽度传0好像还是会有宽度？
		stencil.drawRect(cc.p(0, 0), cc.p(size,height), color, 0.00001, color);
		return stencil;
	},
	onEnter:function(){
		this._super();
	},
	onExit:function(){
		this._super();
	}
});
/////////////////////////////////////////////////////////////////////////////////////
/**
 * 老虎机的格子，一个格子显示一个图案，有一定的分数
 */
cc.w.view.SlotsCellNode = cc.Node.extend({
	_index:0,
	_imageSprite:null,
	_clippingNode:null,
	ctor:function(size,height){
		this._super();
		this.setContentSize(size,height);
//		this.setAnchorPoint(0.5, 0.5);0
//		var layer = new cc.LayerColor(cc.color(cc.random0To1()*205,cc.random0To1()*205, cc.random0To1()*205, 255));
//		layer.setContentSize(this.getContentSize());
//		this.addChild(layer);
		this.setupView(size, height);
	},
	setupView:function(size, height){
		this._clippingNode = new cc.ClippingNode(this.createRectStencil(size, height));
		this._clippingNode.setInverted(false);
		this.addChild(this._clippingNode);
		
		this._imageSprite = new cc.MenuItemSprite();
		this._imageSprite.setAnchorPoint(0, 0);
		this._imageSprite.setContentSize(this.getContentSize());
		this._clippingNode.addChild(this._imageSprite);
		this.setImage(cc.w.slots.getRandomImageId());
	},
	setImage:function(path){
		var sp = new cc.Sprite(path);
		if (this.getContentSize().width<sp.getContentSize().width) {
			var scaleValue = this.getContentSize().width/sp.getContentSize().width;
			sp.setScale(scaleValue, scaleValue);
		}else{
			sp.setPosition(this.getContentSize().width/2-sp.getContentSize().width/2, this.getContentSize().height/2-sp.getContentSize().height/2);
		}
		this._imageSprite.setNormalImage(sp);
	},
	createRectStencil:function(size,height){
		var stencil = new cc.DrawNode();
		var color = cc.color(255,255,255,0);
		//宽度传0好像还是会有宽度？
		stencil.drawRect(cc.p(0, 0), cc.p(size,height), color, 0.00001, color);
		return stencil;
	},
	getIndex:function(){
		return this._index;
	},
	setIndex:function(index){
		this._index = index;
	},
	doCellAnimation:function(){
//		this.runAction(cc.w.slots.actionCellNode());
	},
	reset:function(){
//		this.stopAllActions();
	}
});
/**
 *格子组， 实现老虎机动画时的辅助组件，一个格子组里面有三个格子（SlotsCell）
 */
cc.w.view.SlotsCellGroupNode = cc.Node.extend({
	_cellNodeTop:null,
	_cellNodeCenter:null,
	_cellNodeBottom:null,
	_colIndex:0,//列索引，主要用于计算当前group中的cell对应和图片ID
//	_isLeader:false,//是否是头
	ctor:function(colIndex,size,height){
		this._super();
		this.setContentSize(size,height);
		this._colIndex = colIndex;
		cc.w.slots.GROUP_NODE_HEIGHT = height;
//		this.setAnchorPoint(0.5, 0.5);0
//		var layer = new cc.LayerColor(cc.color(cc.random0To1()*205,cc.random0To1()*205, cc.random0To1()*205, 255));
//		layer.setOpacity(30);
//		layer.setContentSize(this.getContentSize());
//		this.addChild(layer);
		
		this.setupView();
	},
//	setLeader:function(isLeader){
//		this._isLeader = isLeader;
//	},
//	isLeader:function(){
//		return this._isLeader;
//	},
	setColIndex:function(colIndex){
		this._colIndex = colIndex;
	},
	getColIndex:function(){
		return this._colIndex;
	},
//	setOpacity:function(newValue){
//		this._super(newValue);
//		for ( var c in this.getChildren()) {
//			c.setOpacity(newValue);
//		}
//	},
	setupView:function(){
		var cellCount = cc.w.slots.ROW_COUNT;
		var cellWidth = this.getContentSize().width;
		var cellHeight = this.getContentSize().height/cellCount;
		var fs = 10;
		for (var i = 0; i < cellCount; i++) {
			var cellNode = new cc.w.view.SlotsCellNode(cellWidth,cellHeight);
			cellNode.setPosition(0, cellHeight*i)
			if (i==2) {
				this._cellNodeTop = cellNode;
				var index = cc.w.slots.computeCellNodeIndex(this._colIndex, 0);
				this._cellNodeTop.setIndex(index);
//				cc.w.slots.SLOTS_CELL_NODES[index] = this._cellNodeTop;
				if (cc.w.slots.MODE_DEBUG_SlotsCellGroupNode) {
					var label = new cc.LabelTTF("TOP","Arial",fs);
					label.setTag(1001);
					label.setColor(cc.color(255, 255, 0, 255));
					label.setPosition(cellWidth/2, cellHeight/2);
					cellNode.addChild(label);
				}
			}
			if (i==1) {
				this._cellNodeCenter = cellNode;
				var index = cc.w.slots.computeCellNodeIndex(this._colIndex, 1);
				this._cellNodeCenter.setIndex(index)
//				cc.w.slots.SLOTS_CELL_NODES[index] = this._cellNodeCenter;
				if (cc.w.slots.MODE_DEBUG_SlotsCellGroupNode) {
					var label = new cc.LabelTTF("CENTER","Arial",fs);
					label.setTag(1002);
					label.setColor(cc.color(255, 255, 0, 255));
					label.setPosition(cellWidth/2, cellHeight/2);
					cellNode.addChild(label);
				}
			}
			if (i==0) {
				this._cellNodeBottom = cellNode;
				var index = cc.w.slots.computeCellNodeIndex(this._colIndex, 2);
				this._cellNodeBottom.setIndex(index)
//				cc.w.slots.SLOTS_CELL_NODES[index] = this._cellNodeBottom;
				if (cc.w.slots.MODE_DEBUG_SlotsCellGroupNode) {
					var label = new cc.LabelTTF("BOTTOM","Arial",fs);
					label.setTag(1003);
					label.setColor(cc.color(255, 255, 0, 255));
					label.setPosition(cellWidth/2, cellHeight/2);
					cellNode.addChild(label);
				}
			}
			this.addChild(cellNode);
		}
	},
	updateView:function(){
		if (cc.w.slots.RESULT==null) {
			return;
		}
		this._cellNodeTop.setImage(cc.w.slots.getCellImageById(cc.w.slots.RESULT.getImages()[this._cellNodeTop.getIndex()]));
		this._cellNodeCenter.setImage(cc.w.slots.getCellImageById(cc.w.slots.RESULT.getImages()[this._cellNodeCenter.getIndex()]));
		this._cellNodeBottom.setImage(cc.w.slots.getCellImageById(cc.w.slots.RESULT.getImages()[this._cellNodeBottom.getIndex()]));
		cc.w.slots.SLOTS_CELL_NODES[this._cellNodeTop.getIndex()] = this._cellNodeTop;
		cc.w.slots.SLOTS_CELL_NODES[this._cellNodeCenter.getIndex()] = this._cellNodeCenter;
		cc.w.slots.SLOTS_CELL_NODES[this._cellNodeBottom.getIndex()] = this._cellNodeBottom;
		cc.log("=====update cell====="+this._colIndex);
	},
	reset:function(){
		//TODO STH
		this._cellNodeTop.reset();
		this._cellNodeCenter.reset();
		this._cellNodeBottom.reset();
	}
});

/**
 * 老虎机的五个竖列中的一个，里面存放四个CELL组（SlotsCellGroupNode）
 */
cc.w.view.SlotsColumnNode = cc.Node.extend({
	_groups:null,
	_headGroup:null,
	_commonGroups:null,
	_clippingNode:null,
	_groupHeight:0,
	_state:0,
	_result:null,
	_isFirstCol:false,
	_index:0,
	ctor:function(index,size,height){
		this._super();
		this.setContentSize(size,height);
		this._index = index;
		this._clippingNode = new cc.ClippingNode(this.createRectStencil(size, height));
//		this.setStencil();
		this._clippingNode.setInverted(false);
		this.addChild(this._clippingNode);
//		this.setAnchorPoint(0.5, 0.5);
//		var layer = new cc.LayerColor(cc.color(cc.random0To1()*205,cc.random0To1()*205, cc.random0To1()*205, 255));
//		layer.setContentSize(this.getContentSize());
//		this.addClipedChild(layer);
		this.setupView();
	},
	setupView:function(){
		this.reset();
		this._groups = new Array();
		this._commonGroups = new Array();
		//每一列有四个组。
		var groupCount = 4;
		var groupWidth = this.getContentSize().width;
		var groupHeight = this.getContentSize().height;
		this._groupHeight = groupHeight;
		for (var i = 0; i < groupCount; i++) {
			Array.prototype.map;
			var group = new cc.w.view.SlotsCellGroupNode(this._index,groupWidth,groupHeight);
//			group.setColIndex(this._index);
			if (i==0) {
//				group.setLeader(true);
				this._headGroup = group;
			}else{
//				group.setLeader(false);
				this._commonGroups.push(group);
			}
			
//			group.setOpacity(5);
			group.setPosition(0, this.getContentSize().height*2-i*groupHeight);
			this.addClipedChild(group);
			if (cc.w.slots.MODE_DEBUG_SlotsColumnNode) {
				var label = new cc.LabelTTF("Group"+i,"Arial",30);
				label.setTag(1003);
				label.setColor(cc.color(0, 255, 0, 255));
				label.setPosition(groupWidth/2, groupHeight/2);
				group.addChild(label);
			}
			this._groups.push(group);
		}
	},
	updateView:function(){
		this._commonGroups[0].updateView();
	},
	addClipedChild:function(child){
		if (cc.w.slots.MODE_DEBUG) {
			this.addChild(child);
		}else{
			this._clippingNode.addChild(child);
		}
	},
	createRectStencil:function(size,height){
		var stencil = new cc.DrawNode();
		var color = cc.color(255,255,255,0);
		//宽度传0好像还是会有宽度？
		stencil.drawRect(cc.p(0, 0), cc.p(size,height), color, 0.00001, color);
		//以四个点确定的形状作为模版。至少要三个点才能确定形状
//		var rectangle = [
//		cc.p(0, 0),
//		cc.p(this.getContentSize().width, 0),
//		cc.p(this.getContentSize().width, this.getContentSize().height),
//		cc.p(0, this.getContentSize().height)
//		];
//		stencil.drawPoly(rectangle, color, 0, color);
//		var center = cc.p(this.getContentSize().width/2, this.getContentSize().height/2);
//		var radius = this.getContentSize().width/2;
//		stencil.drawDot(center, radius, color) 
//		stencil.drawCircle(center, radius, 360, 360, false, 0, color);
		return stencil;
	},
	reset:function(){
		//设置数据为初始状态
		this._cycleCount = 0;
		this._result = null;
		this._state = cc.w.slots.STATE_STOPED;
		this.ajust();
	},
	resetCells:function(){
		if(this._commonGroups!=null)this._commonGroups[1].reset();
	},
	start:function(){
		//TODO 根据当前状态和是否有结果来判断是否执行动画
		if (this._state == cc.w.slots.STATE_RUNNING&&this._result!=null) {
			if (this.getIndex()==cc.w.slots.COLUMN_COUNT-1) {//
				cc.log("=====EVENT_STOPED=====");
				cc.eventManager.dispatchCustomEvent(cc.w.slots.EVENT_STOPED);
			}
			return;
		}
		if (cc.w.slots.CYCLE_COUNT!=0&&this._cycleCount>=cc.w.slots.CYCLE_COUNT) {
			this._result = cc.w.slots.RESULT;
		}
		if (cc.w.slots.CYCLE_COUNT==0&&cc.w.slots.RESULT!=null&&this.isFirstCol()&&this._cycleCount>=cc.w.slots.CYCLE_COUNT_MIN) {
			cc.w.slots.CYCLE_COUNT = this._cycleCount;
			this._result = cc.w.slots.RESULT;
		}
		
//		cc.log("wwwwwwwwwwwwwwwwwwwwwwwwwwwwwww"+cc.w.slots.STATE);
		this.ajust();
		for (var i = 0; i < this._groups.length; i++) {
			var group = this._groups[i];
			var action ;
			if(this._state == cc.w.slots.STATE_STOPED){//如果当前状态是停止，做开始动画
				action = cc.w.slots.actionStart();
			}else{//当前状态不是停止状态（也就是运行状态）时，如果有结果，执行停止动画，否则执行匀速动画
				if (this._result==null) {
					action = cc.w.slots.actionConstant();
				}else{
					action = cc.w.slots.actionStop();
					if(i==0)this.updateView();
				}
			}
			if (group === this._headGroup) {
//				cc.log("group isLeader");
				var callback = cc.callFunc(this.onCycled, this);
				var seq = cc.sequence(action,callback);
				group.runAction(seq);
			}else{ 
//				cc.log("group is not Leader");
				group.runAction(action);
			}
		}
	},
	stop:function(){
		//强制停止动画，恢复到初始状态
		this.reset();
	},
	/**
	 * 因为动画使用的是moveBy,所以第一个循环做一次位置校正 TO-DO:考虑使用moveTo,计算具体坐标，并传参数给动画方法
	 */
	ajust:function(){
		if (this._commonGroups==null) {
			return;
		}
		for (var i = 0; i < this._commonGroups.length; i++) {
			var group = this._commonGroups[i];
			group.setPosition(0, this.getContentSize().height-i*this._groupHeight);
		}
	},
	_cycleCount:0,
	onCycled:function(){
		this._cycleCount+=1;
		if(this.isFirstCol())cc.log("=========onCycled========="+this._cycleCount);
		if (this._state == cc.w.slots.STATE_STOPED) {
			this._state = cc.w.slots.STATE_RUNNING;
		}
		cc.w.slots.STATE = this._state;
		cc.eventManager.dispatchCustomEvent(cc.w.slots.EVENT_CYCLED);
		var oldHeaderGroup = this._headGroup;
//		oldHeaderGroup.setLeader(false);
		this._headGroup = this._commonGroups.pop();
//		this._headGroup.setLeader(false);
		this._commonGroups.reverse();
		this._commonGroups.push(oldHeaderGroup);
		this._commonGroups.reverse();
		this._headGroup.setPosition(0, this.getContentSize().height*2-0*this._groupHeight);
		this.start();
	},
	setFirstCol:function(isFirstCol){
		this._isFirstCol = isFirstCol;
	},
	isFirstCol:function(){
		return this._isFirstCol;
	},
	getIndex:function(){
		return this._index;
	},
	setIndex:function(index){
		this._index = index;
	}
});

/**
 * 老虎机,由五个SlotsColumnNode组成
 */
//如果要做从左到右延时运行的效果，可以考虑是初始化SlotsColumnNode时加延时ACTION
cc.w.view.SlotsNode = cc.Node.extend({//TODO change cc.w.view to cc.w.slots
	_columnNodes:null,
	_linesNode:null,
	ctor:function(size,height){
		this._super();
		this.setContentSize(size,height);
		this.setAnchorPoint(0.5, 0.5);
		this.setupView();
		this.setupLinesNode(size, height);
	},
	setupLinesNode:function(width,height){
		this._linesNode = new cc.w.slots.LinesNode(width,height);
		this.addChild(this._linesNode);
		this._linesNode.setLocalZOrder(10);
	},
	updateView:function(){
		if(this._linesNode!=null)this._linesNode.updateView();
	},
	drawLine:function(lineIndex){
		if(this._linesNode!=null)this._linesNode.drawLine(lineIndex);
	},
	setupView:function(){
		//init the actions //cc.delayTime(5);
//		this.ignoreAnchorPointForPosition(false);
//		var layer = new cc.LayerColor(cc.color(cc.random0To1()*205,cc.random0To1()*205, cc.random0To1()*205, 255));
//		layer.setContentSize(this.getContentSize());
//		this.addChild(layer);
//		var sp = new cc.Sprite("res/CloseNormal.png");
//		sp.setPosition(this.getContentSize().width/2, this.getContentSize().height/2);
//		this.addChild(sp);
		this._columnNodes = new Array();
		var columnNodeWidth = this.getContentSize().width/cc.w.slots.COLUMN_COUNT;
		var columnNodeHeight = this.getContentSize().height;
		for (var i = 0; i < cc.w.slots.COLUMN_COUNT; i++) {
			var columnNode = new cc.w.view.SlotsColumnNode(i,columnNodeWidth,columnNodeHeight);
			if (i==0) {
				columnNode.setFirstCol(true);
			}
			columnNode.setIndex(i);
			columnNode.setPosition(columnNodeWidth*i, 0);
			this.addChild(columnNode);
			this._columnNodes.push(columnNode);
			if (cc.w.slots.MODE_DEBUG) {
				var label = new cc.LabelTTF(""+i,"Arial",50);
				label.setColor(cc.color(255, 0, 0, 255));
				label.setPosition(columnNodeWidth/2, columnNodeHeight/2);
				columnNode.addChild(label);
			}
		}
//		cc.eventManager.addCustomListener(cc.w.slots.EVENT_CYCLED, function(event){ 
//			if(event!=null){
//				cc.log("cc.w.slots.EVENT_CYCLED!");
//			}
//		});
		cc.eventManager.addCustomListener(cc.w.slots.EVENT_RESULT, function(event){ 
			if(event!=null){
				cc.log("=====EVENT_RESULT====="+cc.w.slots.RESULT
						.getImages().length
						);
			}
		});
//		cc.eventManager.addCustomListener(cc.w.slots.EVENT_STOPED, this.reset);
//		cc.eventManager.addCustomListener(cc.w.slots.EVENT_STOPED, function(event){ 
//			if(event!=null){
//				cc.log(this);
//			}
//		});
		var event_stoped = cc.EventListener.create({
			event: cc.EventListener.CUSTOM,
			eventName: cc.w.slots.EVENT_STOPED,
			callback: function(event){
				if (event!=null) {
					var target = event.getCurrentTarget();
					cc.w.slots.STATE = cc.w.slots.STATE_STOPED;
					target.updateView();
				}
			}
		});    
		cc.eventManager.addListener(event_stoped, this);
		//--------------
		var event_start = cc.EventListener.create({
			event: cc.EventListener.CUSTOM,
			eventName: cc.w.slots.EVENT_START,
			callback: function(event){
				if (event!=null) {
					var target = event.getCurrentTarget();
					target.reset();
					target.start();
				}
			}
		});    
		cc.eventManager.addListener(event_start, this);
		//-----------------
		var event_show_line = cc.EventListener.create({
			event: cc.EventListener.CUSTOM,
			eventName: cc.w.slots.EVENT_SHOW_LINE,
			callback: function(event){
				if (event!=null) {
					var target = event.getCurrentTarget();
					var lineIndex = event.getUserData();
					target.drawLine(lineIndex);
				}
			}
		});    
		cc.eventManager.addListener(event_show_line, this);
		//-----------------
		this.reset();
	},
	reset:function(){
		cc.w.slots.STATE = cc.w.slots.STATE_STOPED;
		if(cc.w.slots.RESULT!=null){
			cc.w.slots.RESULT.reset();
			cc.w.slots.RESULT = null;
		}
		for (var i = 0; i < this._columnNodes.length; i++) {
			var columnNode = this._columnNodes[i];
			columnNode.reset();
		}
		if (this._linesNode!=null) {
			this._linesNode.reset();
		}
	},
	resetCells:function(){
		for (var i = 0; i < this._columnNodes.length; i++) {
			var columnNode = this._columnNodes[i];
			columnNode.resetCells();
		}
	},
	start:function(){
//		this.reset();
		this.resetCells();
		cc.w.slots.CYCLE_COUNT = 0;
		cc.w.slots.STATE = cc.w.slots.STATE_RUNNING;
		var delay = -0.5;
		for (var i = 0; i < this._columnNodes.length; i++) {
//			delay += 0.5;
			delay = i*0.2;
			var delayTime = cc.delayTime(delay);
			var callFunc = cc.callFunc(function(sender,data){
				this._columnNodes[data].start();
			},this,i);
			var seq = cc.sequence(delayTime,callFunc)
			this.runAction(seq);
		}
//			this._columnNodes[4].start(); 
//		this.scheduleOnce(function() {
//			cc.eventManager.dispatchCustomEvent(cc.w.slots.EVENT_RESULT);
//		}, 3);
	},
	stop:function(){
		for ( var colNode in this._columnNodes) {
			colNode.stop();
		}
	},
	onEnter:function(){
		this._super();
//		this.start();
//		this.scheduleOnce(function() {
//			this.start();
//		}, 3+1+2);
	},
	onExit:function(){
		this._super();
		cc.eventManager.removeCustomListeners(cc.w.slots.EVENT_CYCLED);
		cc.eventManager.removeCustomListeners(cc.w.slots.EVENT_START);
		cc.eventManager.removeCustomListeners(cc.w.slots.EVENT_STOPED);
		cc.eventManager.removeCustomListeners(cc.w.slots.EVENT_SHOW_LINE);
	}
});
