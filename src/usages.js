/**
 * 用例对象数组
 */
cc.w.usage.usages = [
    {
        title: "EventDispatcher",
        resource: g_resources,
        scene: function () {
            return new cc.w.Scene(new cc.w.usage.UsageLayerEventDispatcher());
        }
    },
    {
        title: "DrawNode",
        resource: g_resources,
        scene: function () {
            return new cc.w.Scene(new cc.w.usage.UsageLayerDrawNode());
        }
    },
    {
        title: "Slots",
        resource: g_resources,
        scene: function () {
            return new cc.w.Scene(new cc.w.usage.UsageLayerSlots());
        }
    },
];
/**
 * 打开一个用例页面
 */
cc.w.usage.pushUsageScene = function (idx) {
    var usage = cc.w.usage.usages[idx];
    var res = usage.resource || [];
    cc.LoaderScene.preload(res, function () {
        var scene = usage.scene();
        if (scene) {
            cc.director.pushScene(
//					new cc.TransitionProgressRadialCCW(0.55,
                scene
//							)
            );
        }
    }, this);
};
/**
 * 用例列表页面
 */
cc.w.view.UsagesLayer = cc.Layer.extend({
    _className: "UsagesLayer",
    _nodeGrid: null,
    _bgImage: null,
    ctor: function () {
        this._super();
        var layer = new cc.LayerColor(cc.color(cc.random0To1() * 205, cc.random0To1() * 205, cc.random0To1() * 205, 255));
//        var layer = new cc.LayerColor(cc.color("#ff0000"));
        this.addChild(layer);
        this.setupView();
        var keyboardListener = cc.EventListener.create({
            event: cc.EventListener.KEYBOARD,
//			onKeyPressed:  function(keyCode, event){
            onKeyReleased: function (keyCode, event) {
                if (keyCode == cc.KEY.back) {
                    cc.director.end();
                } else if (keyCode == cc.KEY.home) {
                    //do something
                }
            }
        });
        cc.eventManager.addListener(keyboardListener, this);
    },
    onExit:function(){
    	this._super();
    	if(this._webSocket)this._webSocket.close();
        if(this._dataManager)this._dataManager.release();
        cc.log(new Date()-this._testStartTime);
    },
    onEnter: function () {
        this._super();
//        this.testWebSocket();
        this.testDataManager();

        new TestClass("abc").doSth();

//		this._nodeGrid.runAction(cc.flipX3D(5));
//		this._nodeGrid.runAction(cc.flipY3D(5));
//		this._nodeGrid.runAction(cc.pageTurn3D(3.0, cc.size(15, 10)));
//		this._bgImage.runAction(cc.rotateBy(5, 0, 720));
//		var a = cc.flipX(true);
//		this._bgImage.runAction(a);


        /*
         1、时间       ：与其他Action一样，第一个参数都是时间
         2、初始半径：OrbitCamera设定相机在以绑定的Sprite为球心的求面上运动的，所以有个初始半径
         3、半径差    ：半径差大于0的话，相机会跨越不同的球面，这样看起来，Sprite就会变大或变小
         4、起始  z角：Sprite处于三维坐标系的原点，相机位置与原点的连线与yz面的夹角称为z角，
         5、z角差     ：z角改变180度，相当于从Sprite的正前方，绕到它的正后方
         6、起始  x角：Sprite处于三维坐标系的原点，相机位置与原点的连线与xz面的夹角成为x角，z角表示你俯视Sprite的角度
         7、x角差     ：起始x角为0度的时候，x角差表示你的视角与水平线的夹角*/
//		var orbit = cc.orbITCAMERA(5, 1, 0, 0, -90, 90, 0);
//		VAR ORBIT1 = CC.ORbitCamera(5, 1, 0, 90, -180, -90-180, 0);

        var orbit = cc.orbitCamera(5, 1, 0, 0, 360, 0, 0);
        var a = cc.sequence(orbit);
        this._bgImage.runAction(a.repeatForever());
        //播放动画
//		var winSize = cc.visibleRect;
//		var ani = flax.assetsManager.createDisplay("res/w.plist", "asset3", {parent: this, x: winSize.width/2, y: winSize.height/2, fps:60});
//		ani.play();

        cc.director.getScheduler().schedule(function () {
//			 this._bgImage.getCamera().restore();
//			 this._bgImage.cleanup();
        }, this, 2, 0, 0, false, this.__instanceId + "");
        var retryTimer = cc.w.util.RetryTimer.create(this, 5, 2);
        retryTimer.start(function (leftTime) {
            this._bgImage.stopAllActions();
            cc.log("leftTime=" + leftTime);
        });
//        retryTimer.stop();

    },
    _testStartTime:null,
    setupView: function () {
        this._testStartTime = new Date();
        this._nodeGrid = new cc.NodeGrid();
//		this._nodeGrid.setContentSize(100,this.getContentSize().height);
//		this._nodeGrid.setAnchorPoint(cc.p(0.5, 0.5));
//		this._nodeGrid.setPosition(cc.winSize.width/2, cc.winSize.height/2);
        this.addChild(this._nodeGrid);
        this._bgImage = new cc.Sprite("res/HelloWorld.png");
        this._bgImage.setScale(0.6, 0.6);
//		sp.setAnchorPoint(0, 0);
//		cc.log(cc.winSize.height);
//		cc.log(cc.winSize.width);
        this._bgImage.setPosition(cc.winSize.width / 2, cc.winSize.height / 2);
//		sp.setPosition(20, cc.winSize.height-sp.getContentSize().height-20);
//		sp.setOpacity(50)
        this._nodeGrid.addChild(this._bgImage);


//		sp.setColor(cc.color(255, 255, 0, 255));
        var menuItems = [];
//		cc.MenuItemFont.setFontName("Times New Roman");  
//		cc.MenuItemFont.setFontSize(86); 
        for (var i = 0; i < cc.w.usage.usages.length; i++) {
            var item = new cc.MenuItemFont(cc.w.usage.usages[i].title, this.menuItemCallback, this);
            item.setFontSize(36);
            item.setFontName("Times New Roman");
            item.setTag(i);
            menuItems.push(item);
        }
        var menu = new cc.Menu(menuItems);
        menu.alignItemsVertically();
        this.addChild(menu);
        
        //cc.w.slots.doBigAnimation(51,this,this.getContentSize().width/2,this.getContentSize().height/2);
        //cc.w.slots.doBigAniGold(11,this,this.getContentSize().width/2*0,this.getContentSize().height*0);
        //cc.w.slots.doBloodAddAnimation(1,this,this.getContentSize().width/2,this.getContentSize().height/2);
//        cc.w.slots.doFreeTimesAnimation(1, this, this.getContentSize().width / 2, this.getContentSize().height / 2, function (view) {
//            cc.log(view);
//        }, this);
        cc.w.view.addLongPressListener(this);
    },
    menuItemCallback: function (sender) {
//		cc.director.end();
        cc.w.usage.pushUsageScene(sender.getTag())
    },
    _dataManager:null,
    testDataManager:function(){
        var self = this;
        var listener = new cc.w.net.WebSocketEventListener({
            onOpen: function () {
                cc.log("=====[testDataManager onOpen]=====");
                self.sendData1();
            },
            onMessage: function (data) {
                cc.log("=====[testDataManager onMessage]=====");
            },
            onError: function () {
                cc.log("=====[testDataManager onError]=====");
            },
            onClose: function () {
                cc.log("=====[testDataManager onClose]=====");
            }
        });
        this._dataManager = new cc.slots.DataManager(listener);
        this._dataManager.connect();

    },
    _webSocket:null,
    testWebSocket: function () {
        var map = new Map();
        map.put(111,function(){
            cc.log("sssssssssssssssssssssss");
        });
        var fun = map.get(111);
        map.remove(111);
        cc.log(map.get(111));

        var req = new cc.slots.net.Request(function(){},111,222,'{}');
        var self = this;
        req.startTimeoutTimer(function(){
            cc.log("你就是我的唯一两个世界都变形"+self._testStartTime);
        },this);
        req.stopTimeoutTimer();
        
//		var ws = new WebSocket("ws://192.168.1.199:3000");
//		ws.onopen = function(evt) {
//			cc.log("WS was opened.");
//		};
//		var l = cc.w.net.WebSocketEventListener.create({
//			onOpen:function(){
//				cc.log("=====www[ON OPEN]=====");
//			},
//		});
//		l.onOpen();
        var self = this;
        //alert("open");
        var listener = cc.w.net.WebSocketEventListener.create({
            onOpen: function (webSocket) {
                cc.log("=====[onOpen]=====");
                self.sendData(webSocket);
            },
            onMessage: function (webSocket, data) {
            	cc.log("=====[onMessage]=====" + data);
            	if((data instanceof ArrayBuffer)&&data.byteLength>8){
                	var preData = new Uint32Array(data.slice(0,8));
                	var len = preData[1];
                	var msgId = preData[0];
                	var content = new TextDecoder('utf-8').decode(data.slice(8,len));
                	cc.log("=====[onMessage]=====" +msgId);
                	cc.log("=====[onMessage]=====" +len);
                	cc.log("=====[onMessage]=====" +content);
                	cc.log("=====[onMessage]=====" +JSON.parse(content));
                }
//				webSocket.close();
            },
            onError: function (webSocket) {
                cc.log("=====[onError]=====");
            },
            onClose: function (webSocket) {
                cc.log("=====[onClose]=====");
            }
        });
        var ws = new cc.w.net.WebSocket(listener, "ws://192.168.1.199:3000");
        ws.enableReconnection(this, 5, 3);
        ws.connect();
        this._webSocket = ws;
    },
    sendData1:function(){
        var req = new cc.slots.net.Request(function(jsonData){
            if(jsonData){
                cc.log("=====[testDataManager onResponse]====="+jsonData);
            }else{
                cc.log("=====[testDataManager onResponse]=====ERROR OR TIMEOUT!!!!!");
            }
//        },1003,1004,'{"category":1}');
        },1003,1004,'{"roomID":1}');
        this._dataManager.request(req);
    },
    sendData: function (ws) {
//        var u32a = new Uint32Array(2);
//        u32a[0] = 1001;
//        u32a[1] = 1002;
//    	ws.send(u32a.buffer);
    	
    	
    	var preLen = 8;
    	var dataStr  = '{"roomID":1}';
//    	var dataStr  = '{"category":1}';
    	var charArr = utf8.toByteArray(dataStr);
    	var dataLen = charArr.length;
        cc.log("dataLen:"+dataLen);
        var buffer = new ArrayBuffer(preLen+dataLen);
        cc.log("bufferLen:"+buffer.byteLength);
    	var u32a = new Uint32Array(buffer,0,2);
    	u32a[0] = 1003;
    	u32a[1] = buffer.byteLength;
    	var dv = new DataView(buffer);
        for(var i= 0;i<charArr.length;i++){
            dv.setUint8(preLen+i,charArr[i]);
            cc.log("offset:"+(preLen+i)+"char="+charArr[i]);
        }
    	ws.send(buffer);
    	cc.log("on send:"+new TextDecoder('utf-8').decode(buffer.slice(8)));
//    	var x = new DataView(buffer);
////    	x.setUint32(0, 32);
////    	x.setUint32(4, 1002);
//    	console.log(x.getUint32(0)); 
//    	console.log(x.getUint32(4)); 
//    	ws.send(x.buffer);
    	
//    	var blob = new Blob(["abc"]);
//    	ws.send(blob);
    }
});
var TestClass = cc.Class.extend({
	_param:null,
    ctor:function(param){
    	this._param = param;
    },
    doSth:function(){
    	cc.log("ttttttttttttttttttttttttttttttttttt"+this._param);
    }
//    init:function(){
//        return true;
//    }
});