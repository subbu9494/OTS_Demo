/*
 *
 *	Licensed Materials - Property of IBM
 *
 *	IBM Rational Mobile Test
 *
 *	(C) Copyright IBM Corporation 2015, 2019. All Rights Reserved. 
 *  Copyright HCL Technologies Ltd. 2018, 2019.  All Rights Reserved.
 *
 *	Note to U.S. Government Users Restricted Rights:  
 *	Use, duplication or disclosure restricted by GSA ADP
 *	Schedule Contract with IBM Corp. 
 *
 */

WebGuiRecorderInterface = function(){
	this.webGuiRecorderObj = rmotRecorder;
	this.webGuiHierObj = rmotHierarchy;
	this.cachedScreenshotId = null;
};

WebGuiRecorderInterface.prototype ={
		
		captureScreenshot:function(){
			var actionId = null;
			if(jsUtil.isDesktop()){
				actionId = (new Date()).getTime();
				rmotRecorder.postXMLHttpRequest('/RTWWebGui/Snapshot', jsUtil.stringify ( { actionId: actionId, snapshotRect: jsUtil.getSnapShotRect(), tagName: 'BROWSER', snapshot : true } ), false);
			}
			return actionId;
		},
		
		recordEventWithExistingScreenshot:function(eventName, tagName, element, hierarchy, parameters, actionId){
			//To ignore the events to recorded on the running desktop browser instance
			// once the recorder is stopped and still the browser is not yet refreshed.
			if( (jsUtil.isDesktop()) && !webGuiStorage.exists('isDesktopRecorderActive') ) {
				event.recorded = true; 
				return;
			}
			// this will dump the event for existing repeatable actions, if any
			this.handleRepeatedAction(element, eventName);
			
			jsonString = this.webGuiRecorderObj.buildJsonString(eventName, tagName, element, hierarchy, parameters, actionId);
			this.webGuiRecorderObj.logEvent(jsonString);
		},
		
		recordEvent:function(event, eventName, tagName, element, parameters){
			//To ignore the events to recorded on the running desktop browser instance
			// once the recorder is stopped and still the browser is not yet refreshed.			
			if( (jsUtil.isDesktop()) && !webGuiStorage.exists('isDesktopRecorderActive') ) {
				event.recorded = true; 
				return;
			}
			
			if (jsUtil.isDragEvent(event, eventName, RMOT_TRIGGER_EVENT)) {	event.recorded = true; return; } // Do not log drag/scroll events
				
			if (eventName==RMOT_TRIGGER_EVENT || eventName==RMOT_DOWN_EVENT) { 
				if (event.button == 2) {
					eventName = "onrightclick"; 
				} else {
					eventName = "onclick"; 
				}
			} // 43747
			
			if (this.handleRepeatedAction(element, eventName)) return;
			if(jsUtil.isDesktop() && this.cachedScreenshotId === null){
				this.cachedScreenshotId = this.captureScreenshot();
			}
			
			var hierarchy = webGuiRecorderInterfaceObj.updateHierarchy();
			var proxy = domainManager.getProxy(element);
			if (proxy.getUID()!='undefined') {
				proxy.eventId = Math.floor(event.timeStamp);				
				var jsonString = rmotRecorder.buildJsonString(eventName, tagName, element, hierarchy, parameters, this.cachedScreenshotId);
				this.webGuiRecorderObj.logEvent(jsonString);

				domainManager.getProxy(element).ghostClick(event);
			}
			else {
				rmotRecorder.log(eventName+" occurs on an unknown element: "+tagName);
			}
		},
		
		handleRepeatedAction:function(element, eventName) {
			var proxy = domainManager.getProxy(element);
			var actionProxy = webGuiAction.proxy;
			var actionMap = (actionProxy) ? actionProxy.getRepeatedAction() : null;
			rmotHierarchy.setSavedProperties(actionProxy);

			if (!webGuiAction.isRepeated(proxy, eventName) && !webGuiAction.isEmpty()) { // End of repeated action
				webGuiAction.record(actionProxy, actionMap[webGuiAction.eventName]);
				webGuiAction.update(null, null);
				webGuiRecorderInterfaceObj.updateHierarchy(); // 54945: Update hierarchy to get the latest props values
			}
			
			if (webGuiAction.isRepeated(proxy, eventName)) {
				if (!webGuiAction.isEmpty()) {
					var isDifferentElement = (actionProxy.element != proxy.element);
					if (isDifferentElement || (webGuiAction.eventName!=eventName && actionMap[webGuiAction.eventName] != actionMap[eventName])) { // New repeated action and there is one in the pipe
						webGuiAction.record(actionProxy, actionMap[webGuiAction.eventName]);
						webGuiAction.update(proxy, eventName);
						webGuiRecorderInterfaceObj.updateHierarchy();
						webGuiAction.record(proxy, RMoTstartEvent);
					}
				}
				else { // New repeated action
					webGuiAction.update(proxy, eventName);
					webGuiRecorderInterfaceObj.updateHierarchy();
					webGuiAction.record(proxy, RMoTstartEvent);
				}
				
				return true;
			}
			
			return false;
		},
		
		updateHierarchy:function(){
			return this.webGuiHierObj.getHierarchy();
		},
		
		getRecorderInterfaceObj:function(){
			return webGuiRecorderInterfaceObj;
		},
		
		parseDocument:function(){
			this.webGuiRecorderObj.parseDocument();
		}
};

function GetWebGuiRecorderInterfaceObj(){
	return webGuiRecorderInterfaceObj;
}

WebGuiRecorder = function() {
	this.parseDocTimeOut = null;
};

WebGuiRecorder.prototype ={
		startRecording: function() { // 44949
			var _actualUrl = window.location.href;
			if (_actualUrl != 'about:blank') {
				setTimeout(function() {
					if ((_actualUrl.indexOf('com.ibm.rational.test.lt.core.moeb.services.webgui.IWebGuiService') == -1) &&
						(_actualUrl.indexOf('com.ibm.rational.test.rtw.webgui.recorder') == -1)) { // TP-74472
						if (browserDetails.name.indexOf('Microsoft Internet') == -1) {
							rmotRecorder.sendStartURL(); // TP-73011
						}
						rmotRecorder.init();
					}
				}, 500);
			}
		},
		
		sendStartURL: function() {
			try {
				rmotRecorder.postXMLHttpRequest('/RTWWebGui/Action',
						jsUtil.stringify({currentUrl : document.URL, protocol: window.top.location.protocol, timeStamp : new Date().getTime()}), true);
			}
			catch (error) {
				rmotRecorder.log("Error sending startURL: " + document.URL);
			}
			
		},

		init: function() {
		
			domainManager.init();
	
			this.addDocumentEventListener();
			this.addCreateElementListener();
			this.addAjaxListener();
			this.addSnapshotListener();
			this.addFrameOffsetMessageListener();
			
			try {
				rmotHierarchy.getHierarchy();
				rmotRecorder.log("PARSEDOCUMENT================RMoTStart");
				this.parseDocument();
			}
			catch (error) {
				rmotRecorder.log("Error visiting element: "+error);
			}
			
			rmotRecorder.log('RMoTRecorder '+RMOT_VERSION+' successfully installed for: '+window.location.href);
		},
		
		/**
		 * Add Ajax Listener Handler
		 */
		addAjaxListener:function() {//RMoTAddAjaxListener
			var xmlRequest = window.XMLHttpRequest.prototype;
			// ensure that AJAX listener is added only once
			if (typeof(xmlRequest.rmotOpen)==='undefined') {
				xmlRequest.rmotOpen = xmlRequest.open;
			
				var ajaxParse = function() {
					rmotRecorder.log("PARSEDOCUMENT================RMoTAddAjaxListener");
					rmotRecorder.parseDocument();
				};

				xmlRequest.open = function() {
					// this.addEventListener("load", ajaxParse, false); // Not useful
					this.addEventListener("error", ajaxParse, false);
					this.addEventListener("abort", ajaxParse, false);
					this.addEventListener("complete", ajaxParse, false);
					xmlRequest.rmotOpen.apply(this, [].slice.call(arguments));
			    };
			}
		},
		
		addEventListener:function () {//RMoTAddEventListener
			try {
				var DOMclassNames = [Element, HTMLDocument, window.constructor];
				for (var i = 0; i < DOMclassNames.length; i++) {
					var DOMclass = DOMclassNames[i];
					if (DOMclass.prototype.addEventListener.toString().indexOf("originalAddEventListener") < 0) {
						DOMclass.prototype.originalAddEventListener = DOMclass.prototype.addEventListener;
					
						DOMclass.prototype.addEventListener = function(type, listener, useCapture) {
							var eventName = RMoTeventPrefix + type;
							if (jsUtil.getClickEvents().indexOf(eventName) >=0) {
								this.RMoTisListened = true;
							}
							this.originalAddEventListener(type, listener, useCapture);
						};

						// This looks weird but react.js needs this also or else it misbehaves during recording, see 60162
						DOMclass.prototype.originalRemoveEventListener = DOMclass.prototype.removeEventListener;
					
						DOMclass.prototype.removeEventListener = function(type, listener, useCapture) {
							this.originalRemoveEventListener(type, listener, useCapture);
						};
					}
				}
			} catch(error) {
				rmotRecorder.log("Error RMoTAddEventListener: "+error);
			}
		},
		
		addDocumentEventListener:function () {//RMoTAddDocumentEventListener
			if(jsUtil.isDesktop()) {
				// highlight the control which is clicked in the document
				/*window.document.addEventListener('click', function (e) {
					
				  	var srcElement = e.target || e.srcElement || e.originalTarget;
				  	if (prevDOM != null) {
						prevDOM.style.backgroundColor = prevColor;
					}
			
					prevDOM = srcElement;
					prevColor = prevDOM.style.backgroundColor;
					srcElement.style.backgroundColor = "#bcd5eb";
				}, false);*/
				window.document.onreadystatechange = function () {
					  if(jsUtil.isDocReady()){
						  rmotRecorder.log("Send the Document Loading Complete request");
						  var startTime = (new Date()).getTime();
						  rmotRecorder.postXMLHttpRequest('/RTWWebGui/DocReady', jsUtil.stringify ( { eventName: 'DOCREADY',tagName: 'BROWSER',timestamp : startTime } ), false);
					  }
				};
				
				window.onbeforeunload=function(){
					if(window.unload == undefined) {
						rmotRecorder.log("Send the Document before Unload event request");
						rmotRecorder.postXMLHttpRequest('/RTWWebGui/DocUnload', jsUtil.stringify ( { eventName: 'UNLOAD',tagName: 'BROWSER' } ) , true);
					}
				};
				
				window.onunload=function(){
					rmotRecorder.log("Send the Document Unload event request");
					rmotRecorder.postXMLHttpRequest('/RTWWebGui/DocUnload', jsUtil.stringify ( { eventName: 'UNLOAD',tagName: 'BROWSER' } ) , true);			
				};
			}		
		},
		
		/*
		 * Install event wrappers on the newly and dynamically created element (45444)
		 */
		addCreateElementListener: function() {
			
			if (window.HTMLDocument==undefined) return;
			
			var doc = window.HTMLDocument.prototype;
			if (doc.createElement.toString().indexOf("rmotCreate") < 0) {
				doc.rmotCreate = doc.createElement;
				doc.createElement = function() {
					var elt = doc.rmotCreate.apply(this, arguments);
					if (!(arguments.length > 1 && arguments[1] === RMoTRectangleId)) {
						rmotRecorder.parseDocument();
					}
					return elt;
				};
			}
		},
		
		addFrameOffsetMessageListener:function() {
			window.addEventListener('message', jsUtil.onFrameOffsetMessage, true);
			window.addEventListener("scroll", function () {
				clearTimeout(window.webGuiScrollTimeOut);
				window.webGuiScrollTimeOut = setTimeout(function() {
					jsUtil.requestFrameOffset(window);
				}, 100);
			}, false);
			// Request frame offset for leaves only
			if (!jsUtil.containsFrames()) jsUtil.requestFrameOffset(window);
		},
		
		addDownEventListener:function () {
			var downEvent = RMOT_DOWN_EVENT.replace(RMoTeventPrefix, '')
			document.addEventListener(downEvent,
					function(e) {
						jsUtil.getMainDocument().rmotDownEvent = { x: e.clientX || e.changedTouches[0].clientX, 
								y: e.clientY || e.changedTouches[0].clientY};
					}
			);
		},
		
		cacheScreenshot:function() {
			if (!webGuiAction.isEmpty()) return; // Do not take screenshot during repeated actions
			
			clearTimeout(this.cacheSnapshotTimeOut); // Clear previous action if not yet performed
			this.cacheSnapshotTimeOut = window.setTimeout(function() {
				rmotRect.removeRectangle();
				// Postpone the action to make sure the rectangle has been removed
				window.setTimeout(function() { 
					webGuiRecorderInterfaceObj.cachedScreenshotId = webGuiRecorderInterfaceObj.captureScreenshot();
				}, 10);
			}, 200);
		},
		
		addSnapshotListener:function() {
			window.addEventListener("resize", function() { rmotRecorder.cacheScreenshot(); }, false);
			window.addEventListener("scroll", function() { rmotRecorder.cacheScreenshot(); }, false);
		},
		
		parseDocument:function () {//RMoTparseDocument
			clearTimeout(this.parseDocTimeOut); // Clear previous action if not yet performed
			this.parseDocTimeOut = setTimeout(function() {
				rmotRecorder.visit(jsUtil.getMainDocument(), rmotRecorder.installWrappers);
				rmotRecorder.cacheScreenshot();
			}, 20);
		},
		
		visit:function (node, func) {//RMoTvisit	
			
			if (node && (node.nodeType == window.Node.ELEMENT_NODE || node.nodeType == window.Node.DOCUMENT_NODE)) {

				if (isFrameElement(node)) { // 37668
					func(node);
					node = node.contentDocument || node.contentWindow.document;
				}

				if (func(node)) {
					if (node.hasChildNodes() || ((node.shadowRoot != null) && (node.shadowRoot.hasChildNodes()))) {
						var children = (node.shadowRoot != null) ? node.shadowRoot.childNodes : node.childNodes;
						for (var i = 0; i < children.length; i++) {
							var child = children[i];
							
							// Optimization: Some tags can be ignored
							if (!child.tagName || jsUtil.tagsIgnored.indexOf(child.tagName.toLowerCase()) >=0)
								continue;
							
							var proxy = domainManager.getProxy(child);
							if (!proxy)	continue;
							
							proxy.visible = proxy.isVisible();	
							if (!proxy.visible.visibility && proxy.visible.propagation || proxy.isWidgetChild)
								continue;
							
							if (!proxy.isContainer()) {
								func(child);
								continue;
							}
							
							this.visit(child, func);
						}
					}
				}
			}
		},
		
		installWrappers: function(node) {
			if (node.tagName && jsUtil.tagsIgnored.indexOf(node.tagName.toLowerCase()) < 0) {
				jsUtil.getMainDocument().rmotDownEventRecorded = false;
				domainManager.installMutationObserver(node);
				domainManager.installGhostClickWrapper(node); // required for Android
				return domainManager.installWrappers(node);
			}
			return true;
		},
		
		buildJsonString:function(eventName, tagName, element, hierarchy, parameters, actionId) {
			var jsonString = null;
			if(jsUtil.isDesktop()){
				jsonString = this.buildJsonStringDesktop(true, eventName, tagName, element, hierarchy, parameters, actionId);
			}
			else{ // Mobile
				jsonString = this.buildJsonStringMobile(eventName, tagName, element, hierarchy, parameters);
			}
			return jsonString;
		},
		
		buildJsonStringMobile:function(eventName, tagName, element, hierarchy, parameters) {//RMoTbuildJsonString
			var proxy = domainManager.getProxy(element);
			var takeSnapshot = (proxy.takeSnapshot==false) ? false : true;
			proxy.takeSnapshot = null;
			return jsUtil.stringify({ eventName: eventName, 
									tagName: proxy.getProxyName(),
									path: domainManager.getProxy(element).getUID(),
									scrollLeft: jsUtil.getScrollLeft(element),
									scrollTop: jsUtil.getScrollTop(),
									snapshotRect: jsUtil.getSnapShotRect(),
									attributes: jsUtil.cloneElement(element),
									hierarchy: hierarchy,
									parameters: parameters,
									currentUrl: window.top.location.href,
									protocol: window.top.location.protocol,
									takeSnapshot: takeSnapshot,
									webviewSettings: { 	width:jsUtil.getWindowWidth(element), 
														height:jsUtil.getWindowHeight(element) }	
									});
		},
		
		showUnsupportedText:function() {
				var left = jsUtil.getScrollLeft();
				var top = jsUtil.getScrollTop();
				var width = jsUtil.getWindowWidth();
				var height = 20;
				errorDiv = document.createElement('div');
				var rectStyle = 'background:lightyellow;position:absolute;overflow:visible;top:'+top+'px;left:'+left+'px;width:'+width+'px;height:'+height+'px;z-index:10000;pointer-events: none;';
				errorDiv.setAttribute( "style", rectStyle );
				
				var textNode = document.createTextNode(messageUnsupport);
				errorDiv.appendChild(textNode);
				document.body.insertBefore(errorDiv, document.body.firstChild);
				
				setTimeout(function() {
					if(errorDiv) {
						document.body.removeChild(errorDiv);
						errorDiv = null;
					}
				}, 3000);

		},
		
		hideUnsupportedText:function() { 
			if(errorDiv) {
				document.body.removeChild(errorDiv);
				errorDiv = null;
			}
		},
		
		highlight:function(element, color) {
			if(highlight == HIGHLIGHT_ENABLED) {
				var coords = rmotRect.getCoords(element);
				rmotRect.drawRectangle(element.ownerDocument, coords.top, coords.left, coords.right - coords.left, coords.bottom - coords.top, color);
			}
		},
		
		highlightUnsupportedControl : function(srcElement) {

			rmotRect.removeRectangle();
			this.hideUnsupportedText();

			// messageUnsupport variable has the text to display for not supported controls
			if (srcElement.wgcustom != undefined) {
				this.highlight(srcElement, "solid yellow");
				this.showUnsupportedText();
			}
			else {
				this.highlight(srcElement, "solid blue");
			}
		},

		buildJsonStringDesktop : function(highlightUnsupported, eventName, tagName, element, hierarchy, parameters, actionId, scrollLeft, scrollTop, snapshotRect,
				isDialog) {

			if (highlightUnsupported == true && element != null) {
				this.highlightUnsupportedControl(element);
			}

			var mainDoc = jsUtil.getMainDocument();
			var proxy = null;
			if(element != null){
				proxy = domainManager.getProxy(element);
			}
			if (isDialog == undefined || isDialog == null) {
				isDialog = false;
			}
			return jsUtil.stringify({
				eventName : eventName,
				tagName : ( isDialog || proxy == null ? tagName : proxy.getProxyName() ),
				path : (proxy != null ? proxy.getUID() : ""),
				coordinates : (proxy != null ? jsUtil.getCoordinatesArray(proxy) : ""),
				scrollLeft : (scrollLeft == undefined ? jsUtil.getScrollLeft(element) : scrollLeft),
				scrollTop : (scrollTop == undefined ? jsUtil.getScrollTop(element) : scrollTop),
				snapshotRect : (snapshotRect == undefined ? jsUtil.getSnapShotRect() : snapshotRect),
				attributes : (element != null ? jsUtil.cloneElement(element) : {}),
				hierarchy : hierarchy,
				parameters : parameters,
				currentUrl : mainDoc.location.href,
				currentTitle : mainDoc.title,
				protocol : mainDoc.location.protocol,
				actionId : actionId,
				eventId : (proxy != null ? proxy.eventId : actionId),
				windowId  : (typeof rtwwMainBrowserHandle == 'undefined' ? "" : rtwwMainBrowserHandle),
				timeStamp : new Date().getTime(),
				isDialog : isDialog
			});
		},
		
		//Defined some functions for Desktop browser support to send XHR request
		postXMLHttpRequestThroughCustomEvent :function(strURL, value, async)
		{
			jsUtil.getMainDocument().dispatchEvent(new CustomEvent('WebGUI_sendxhr', {
		    	detail: {
		    		strurl : strURL,
		    		value : value,
		    		async : async
		    	}
		    }));
		},

		postXMLHttpRequest : function(strURL, value, async)
		{
			if(postXHRThroughCustomEventFlag == true) {
				rmotRecorder.log("Sending action XHR through custom events : " + strURL);
				this.postXMLHttpRequestThroughCustomEvent(strURL, value, async);
			}
			else {
			
				rmotRecorder.log("Sending action XHR from document : " + strURL);
				this.postRequest(strURL, value, async);
			}  
		},
		//XMLHTTPRequest to send JSON object
		postRequest :function(strURL, value, async) {
			
			var xmlHttp = null;
		   if (window.XMLHttpRequest) { // Mozilla, Safari, ...
			   xmlHttp = new XMLHttpRequest();
			}else if (window.ActiveXObject) { // IE
				xmlHttp = new ActiveXObject("Microsoft.XMLHTTP");
			}
		   if(xmlHttp)
		   {
			   xmlHttp.open('POST', strURL, async);
			   xmlHttp.setRequestHeader('TestPacketType','WebGui');
			   xmlHttp.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
			   xmlHttp.send(value);
		   }
		},
		
		logEvent: function(json) {
			if (RMoTAndroid) {
				console.log("RMOTRECORDER" + json);
			}
			else if (RMoTIOS) {
				prompt("RMOTRECORDER" + json, "");
			}
			else {
				try {
					var objJSON = jsUtil.parse(json);
					if(jsUtil.isDesktop())
						this.postXMLHttpRequest('/RTWWebGui/Action', json, true);
					
					rmotRecorder.log("DEBUG: " + objJSON.eventName.toLowerCase() + "  "+objJSON.tagName+ " -- " + objJSON.path + " -- [" + objJSON.extractedTexts + "]");
				}
				catch (err) {
					rmotRecorder.log(err);
				}
			}
		},
		log: function(str) {
			if (RMoTAndroid) {
				prompt("RMOTLOG"+str, "");
			}
			else {
				if(browserDetails.tracemode === true)
					console.log("DEBUG: " + str);	
			}
			
		},
		
		openSoftKeyboard: function() {
			if (RMoTAndroid) { // Android only
				prompt("RMOTSOFTKEYBOARD");
			}
		}
};

WebGuiAction = function(){
	this.proxy = null;
	this.eventName = null;
	this.actionId = null;
};

WebGuiAction.prototype={
	update: function (proxy, eventName) {
		this.proxy = proxy;
		this.eventName = eventName;
		this.actionId = null;
	},
	
	isEmpty: function () {
		return (this.proxy == null);
	},
	
	isRepeated: function (proxy, eventName) {
		if (!proxy.getRepeatedAction()) return;
		
		return (proxy.getRepeatedAction()[eventName]!=null);
	},
	
	record: function (proxy, eventName) {
		var tagName = proxy.getProperty(WebGuiConstants.TAGNAME_PROP);
		var jsonString = null;
		
		if(jsUtil.isDesktop()) {
			if(eventName === RMoTstartEvent) {
				actionId = webGuiRecorderInterfaceObj.captureScreenshot();
				if (proxy.eventId) proxy.eventId++;
			}
			else {
				jsonString = webGuiRecorderInterfaceObj.webGuiRecorderObj.buildJsonStringDesktop(true, eventName, tagName, proxy.element, rmotHierarchy.currentHierarchy, proxy.getParameters(), actionId);
				webGuiRecorderInterfaceObj.cachedScreenshotId = webGuiRecorderInterfaceObj.captureScreenshot();
				setTimeout(function() {	rmotRect.removeRectangle();	}, 0);
			}
		}
		else { // Mobile
			proxy.takeSnapshot = takeSnapshot;
			jsonString = webGuiRecorderInterfaceObj.webGuiRecorderObj.buildJsonStringMobile(eventName, tagName, proxy.element, rmotHierarchy.currentHierarchy, proxy.getParameters());
		}
		
		if(jsonString != null) {
			webGuiRecorderInterfaceObj.webGuiRecorderObj.logEvent(jsonString);
		}
	}
};
var webGuiAction = new WebGuiAction();

/****************************/
/*							*/
/* 	Hierarchy generation 	*/
/*							*/
/****************************/

WebGuiHierarchy = function(){
	this.currentHierarchy = null;
	this.currentUID = 1;
};


WebGuiHierarchy.prototype ={

	/*
	 * Gets web elements hierarchy
	 */
	getHierarchy: function() {

		if (browserDetails.userAgent !== navigator.userAgent 
				|| (browserDetails.name === "Safari" && browserDetails.pixelRatio !== window.innerWidth / window.outerWidth)) {
			// Toggle normal/device modes for Chrome & Safari or zoom changed for Safari
			browserDetails = jsUtil.getBrowserCompatibilityDetails();
		}
		
		// Remove rectangle to exclude it from the captured hierarchy
		rmotRect.removeRectangle();

		this.currentHierarchy = this.buildHierarchy(jsUtil.getMainDocument());
		
		// rmotRecorder.log(jsUtil.stringify(this.currentHierarchy));
		
		return this.currentHierarchy;
	},
	

	/*
	 * Recursive function traversing DOM tree
	 */
	buildHierarchy: function(node) {

		if (node && (node.nodeType == window.Node.ELEMENT_NODE || node.nodeType == window.Node.DOCUMENT_NODE)) {

			if (isFrameElement(node)) { // 37668
				jsUtil.setOwnerDocumentCoordinates(node);
				node = node.contentDocument || node.contentWindow.document;
			}

			var childrenArray = new Array ();

			var children = new Array();
			if ((typeof node.shadowRoot !== "undefined") && (node.shadowRoot !== null) &&
					(typeof node.shadowRoot.childNodes != "undefined") && (node.shadowRoot.childNodes !== null)) {
				for (var i0 = 0; i0 < node.shadowRoot.childNodes.length; i0++) {
					children.push(node.shadowRoot.childNodes[i0]);
				}
			}
			if (node.hasChildNodes()) {
				for (var i1 = 0; i1 < node.childNodes.length; i1++) {
					children.push(node.childNodes[i1]);
				}
			}

			for (var i = 0; i < children.length; i++) {
				var child = children[i];

				// Optimization: Some tags can be ignored
				if (!child.tagName || jsUtil.tagsIgnored.indexOf(child.tagName.toLowerCase()) >=0)
					continue;


				var proxy = domainManager.getProxy(child);
				if (!proxy)
					continue;

				proxy.visible = proxy.isVisible();	
				if (!proxy.visible.visibility && proxy.visible.propagation || proxy.isWidgetChild)
					continue;

				child.RMoTChildren = (proxy.isContainer()) ? this.buildHierarchy(child) : null;

				childrenArray.push(this.cloneElementAndChildren(proxy));

				this.setSavedProperties(proxy);
			}		
		}

		return childrenArray;	
	},
	
	
	cloneElementAndChildren: function(proxy) {
		var clone = {};
		var element = proxy.element;
		var visible = proxy.visible.visibility;
		var reachable = proxy.visible.reachable;
		
		clone = jsUtil.cloneElement(element, visible);
		domainManager.applyDecoratedProps(element,clone);
		clone.content = proxy.getProperty(WebGuiConstants.CONTENT_PROP);
		this.getSavedProperties(proxy, clone);
		clone.visible = visible;
		clone.reachable = reachable;
		clone.xpath = proxy.getUID(this.currentUID++);
		if (visible) clone.xpathProp = proxy.getProperty(WebGuiConstants.XPATH_PROP);
		clone.domainName = element.domainName;//newly added
		clone.Coordinates$array$ = jsUtil.getCoordinatesArray(proxy);
		clone.proxyName = proxy.getProxyName();
		clone.proxyClass = proxy.proxyClass;
		
		if ( element.RMoTChildren && element.RMoTChildren.length != 0 ) {
			clone.children = element.RMoTChildren;
		}
		
		return clone;
	},
	
	setSavedProperties: function(proxy) {
		if (!proxy) return;
		
		var props = proxy.getPropertiesToSave();
		for (var j = 0; j < props.length; j++) {
			var prop = props[j];
			proxy[prop] = proxy.getProperty(prop);
		}
	},
	
	getSavedProperties: function(proxy, clone) {
		if (!proxy) return;
		
		var props = proxy.getPropertiesToSave();
		for (var j = 0; j < props.length; j++) {
			var prop = props[j];
			if (typeof(proxy[prop])!='undefined') clone[prop] = proxy[prop];
		}
	}
};


/****************************/
/*							*/
/* 	Main				 	*/
/*							*/
/****************************/
var RMoTInjected = 1;
//var prevDOM = null;
//var prevColor = null;
var errorDiv = null;
var rmotRect = new RMoTRectangle();
rmotRect.removeBodyRectangle();

var RMoTAndroid = false;
var RMoTIOS = false;
var RMoTBrowser = false;

var browserDetails = {userAgent: "", status: true, name: "RTWBrowser", version: 1, documentMode:"", tracemode: false, pixelRatio: 1};
var postXHRThroughCustomEventFlag = false;

var rmotRecorder = new WebGuiRecorder();
rmotRecorder.addDownEventListener();
rmotRecorder.addEventListener();
var rmotObserver = new MutationObserver(function() {
	rmotRecorder.cacheScreenshot();
});

var rmotHierarchy = new WebGuiHierarchy();
var webGuiRecorderInterfaceObj = new WebGuiRecorderInterface();

var HIGHLIGHT_DISABLED = 0;
var HIGHLIGHT_ENABLED = 1;

var highlight = HIGHLIGHT_ENABLED;

//Incase of IE, the zoomed browser dimensions were not reflected at the control dimensions
//This BROWSER_ZOOM_FACT will be used while finding dimensions in IE for  others it will be 1.
var BROWSER_ZOOM_FACT = 1;

var RMoTFrameOffsetLeft = 0;
var RMoTFrameOffsetTop = 0;
