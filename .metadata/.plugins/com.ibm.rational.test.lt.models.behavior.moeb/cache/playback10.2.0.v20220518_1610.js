/*
 *
 *	Licensed Materials - Property of IBM and/or HCL
 *
 *	IBM Rational Mobile Test
 *
 *	(C) Copyright IBM Corporation 2014, 2019. All Rights Reserved. 
 *  (C) Copyright HCL Technologies Ltd. 2017, 2021. All Rights Reserved. 
 *
 *	Note to U.S. Government Users Restricted Rights:  
 *	Use, duplication or disclosure restricted by GSA ADP
 *	Schedule Contract with IBM Corp. 
 *
 */

/**
 * Recorder/Player version number
 */
var RMOT_VERSION = "10.2.3";

/**
 * Touch events applied to all HTML5 elements.
 */
var RMoTtouchEvents = [		"ontouchstart",
							"ontouchend",
							"ontouchmove",
							"ontouchenter",
							"ontouchleave",
							"ontouchcancel"
							];


/**
 * List of style properties we record
 */
var RMoTstylesArray = ["background-color",
					"background-repeat",
					"color",
					"font-family",
					"font-size",
					"font-style",
					"font-weight",
					"line-height",
					"margin-bottom",
					"margin-left",
					"margin-right",
					"margin-top",
					"opacity",
					"padding-bottom",
					"padding-left",
					"padding-right",
					"padding-top",
					"text-align",
					"text-decoration",
					"visibility",
					"z-index"];

var RMoTIgnoredAttrs = ["data-changed",
						"awmousedown",
						"awmouseup",
						"data-proxy-id",
						"data-data-rendering-service-uid",
						"xlink:href",
						"d",
						"points"];
	
var RMoTeventPrefix = "on";

var RMoTclickEvent = "onclick";
var RMoTinputEvent = "oninput";
var RMoTchangeEvent = "onchange";
var RMoTstartEvent = "onstartevent";

var RMOT_SUCCESS = 1;
var RMOT_INCONCLUSIVE = 2;
var RMOT_FAILURE = 3;
var RMOT_ERROR = 4;
var RMOT_FATAL = 5;
var RMOT_RECOVERY = 6;

var RMOT_GuidedHealing = false;

var RMoTRectangleId = "RMoTRect";

/**
 * JSON implementation if none available
 */
if(!window.JSON){
	window.JSON = {
		stringify: function (object) {
			var t = typeof(object);
			if (t != "object" || object === null) {
				if (t == "string") {
					object = '"' + object + '"';
				}
				return String(object);
			} else {
				var n, v, json = [], isArray = (object && object.constructor == Array);
				for (n in object) {
					v = object[n];
					t = typeof(v);
					if (t == "string") {
						v = '"' + v + '"';
					} else if (t == "object" && v !== null) {
						v = jSUtil.stringify(v);
					}
					json.push((isArray ? "" : '"' + n + '":') + String(v));
				}
				return (isArray ? "[" : "{") + String(json) + (isArray ? "]" : "}");
			}
		}
	};
}

JSUtil = function(){
	this.tagsIgnored = ["option", "head", "script", "link", "noscript", "style", "meta", "br", "hr", "line"];
};

JSUtil.prototype={
		stringify:function(obj) {
			const types = [String.prototype, Array.prototype];
			for(let i = 0; i < types.length; i++) {
				let t = types[i];
				if (t.toJSON) {
			    	t.originaltoJSON = t.toJSON;
			    	delete t.toJSON;
			    }
			}
			
			const jsonString = window.JSON.stringify(obj);
			
			for(let i = 0; i < types.length; i++) {
				let t = types[i];
				if (t.originaltoJSON) {
					t.toJSON = t.originaltoJSON;
					delete t.originaltoJSON;
				}
			}
			
			return jsonString;
		},
		
		getClickEvents:function() {
			var clickEvents = ["onclick","onmousedown","onmouseup","onfocus","onmouseover","ontap"];
			if (this.isTouchEnabled()) { // Mobile only
				clickEvents.push("ontouchstart", "ontouchend");
			}
			return clickEvents;
		},
		
		getAlternateClickEvents:function() {
			var clickEvents = this.getClickEvents();
			for (var i = clickEvents.length - 1; i >= 0; i--) {
			    if(clickEvents[i] === RMOT_TRIGGER_EVENT || clickEvents[i] === RMOT_DOWN_EVENT) {
			    	clickEvents.splice(i, 1); // remove triggered events from the list
			    }
			}
			return clickEvents;
		},
		
		isDragEvent: function(event, eventName, triggeredEvent) {
			var rmotDownEvent = jsUtil.getMainDocument().rmotDownEvent;
			if (event && eventName == triggeredEvent && rmotDownEvent) {
				// Compare event's coordinates to the previous down event's ones
				var upEvent = { x: event.clientX || event.changedTouches[0].clientX, 
								y: event.clientY || event.changedTouches[0].clientY };
				var deviation = 5; // pixels
				if (Math.abs(rmotDownEvent.x - upEvent.x) > deviation
						|| Math.abs(rmotDownEvent.y - upEvent.y) > deviation) {
					// Drag/Scroll detected
					return true;
				}
			}
			return false;
		},
		
		isTrusted: function(event, eventName) {
			var trusted = true;
			if((eventName == RMOT_TRIGGER_EVENT)
					&& (event.pageX == undefined || event.pageY == undefined 
							|| event.clientX <= 0 || event.clientY <= 0) ) {
				trusted = false;
				
				if (!jsUtil.isDesktop()) { // Mobile only
					var touch = event.changedTouches[0];
					if (touch && touch.clientX > 0 && touch.clientY > 0) {
						trusted = true;
					}
				}
			}
			return trusted;
		},
		
		/**
		 * Get browser dimensions, compatible with all browsers
		 */
		getWindowWidth:function(element) {//RMoTgetWindowWidth
			try { return element.ownerDocument.defaultView.innerWidth; } catch(e) {
				try { return window.innerWidth; } catch(e) {
					try { return document.documentElement.clientWidth; } catch (e) {
						try { return document.body.clientWidth; } catch(e) {
							return 0;
						}
					}
				}
			}
		},
		
		getWindowHeight:function(element) {//RMoTgetWindowWidth
			try { return element.ownerDocument.defaultView.innerHeight; } catch(e) {
				try { return window.innerHeight; } catch(e) {
					try { return document.documentElement.clientHeight; } catch (e) {
						try { return document.body.clientHeight; } catch(e) {
							return 0;
						}
					}
				}
			}
		},
		
		getScrollLeft:function(element) {//RMoTgetScrollLeft
			try { return element.ownerDocument.documentElement.scrollLeft; } catch(e) {
				try { return window.pageXOffset; } catch(e) {
					try { return document.documentElement.scrollLeft; } catch (e) {
						try { return document.body.scrollLeft; } catch(e) {
							return 0;
						}
					}
				}
			}
		},

		getScrollTop:function(element) {//RMoTgetScrollTop
			try { return element.ownerDocument.documentElement.scrollTop; } catch(e) {
				try { return window.pageYOffset; } catch(e) {
					try { return document.documentElement.scrollTop; } catch (e) {
						try { return document.body.scrollTop; } catch(e) {
							return 0;
						}
					}
				}
			}
		},

		//Required functions for Web browser on Desktop
		/*getDocLeft:function() {//RMoTgetDocLeft
			return window.mozInnerScreenX || window.screenLeft || window.screenX || 0;
		},

		getDocTop:function () {//RMoTgetDocTop
			return window.mozInnerScreenY || window.screenTop || window.screenY || 0;
		},
		
		getDocRight:function() {//RMoTgetDocRight
			return this.getDocLeft() + this.getWindowWidth();
		},

		getDocBottom:function () {//RMoTgetDocBottom
			return this.getDocTop() + this.getWindowHeight();
		},*/
		
		getMainDocument:function(){
			var mainDocument = document;
			try {
				var frameElement = document.defaultView.frameElement;
				while(frameElement != null){
					mainDocument = frameElement.ownerDocument;
					frameElement = frameElement.ownerDocument.defaultView.frameElement;
				} 
			} catch(e) {}
			return mainDocument;
		},
		
		getMainWindow:function() {
			return this.getMainDocument().defaultView;
		},

		getSnapShotRect:function () {//RMoTgetSnapShotRect
			var mainDocument = this.getMainDocument();
			return "left:" + BROWSER_ZOOM_FACT*this.getMainDocLeft(mainDocument.defaultView)
					+ ";top:"  + BROWSER_ZOOM_FACT*this.getMainDocTop(mainDocument.defaultView)
					+";right:" + BROWSER_ZOOM_FACT*this.getMainDocRight(mainDocument)
					+ ";bottom:" + BROWSER_ZOOM_FACT*this.getMainDocBottom(mainDocument)
					+";";
		},
		
		//Required functions for Web browser on Desktop
		getMainDocLeft:function(mainWindow) {//RMoTgetDocLeft
			return mainWindow.mozInnerScreenX || mainWindow.screenLeft || mainWindow.screenX || 0;
		},

		getMainDocTop:function (mainWindow) {//RMoTgetDocTop
			return mainWindow.mozInnerScreenY || mainWindow.screenTop || mainWindow.screenY || 0;
		},
		
		getMainDocRight:function(mainDocument) {//RMoTgetDocRight
			return this.getMainDocLeft(mainDocument.defaultView) + this.getMainWindowWidth(mainDocument);
		},

		getMainDocBottom:function (mainDocument) {//RMoTgetDocBottom
			return this.getMainDocTop(mainDocument.defaultView) + this.getMainWindowHeight(mainDocument);
		},
		
		getMainWindowWidth:function(mainDocument) {//RMoTgetWindowWidth	
			return mainDocument.defaultView.innerWidth || mainDocument.documentElement.clientWidth || mainDocument.body.clientWidth || 0;
		},

		getMainWindowHeight:function(mainDocument) {//RMoTgetWindowHeight
			return mainDocument.defaultView.innerHeight || mainDocument.documentElement.clientHeight || mainDocument.body.clientHeight || 0;
		},

		//Trim the text for leading and trailing spaces
		getTrimText: function (element) {
			var textContent = element.textContent;
			
			if(!textContent){
				textContent = element.innerText;
			}
			else{
			
				// Remove ignored tags content
				try {
					const tags = element.querySelectorAll(jsUtil.tagsIgnored);
					for(let i = 0; i < tags.length; i++) {
						textContent = textContent.replace(tags[i].textContent, '');
					}
				} catch (e) {}
			}
			
			if(textContent){
				textContent = textContent.trim();
			}
			return (textContent) ;
		},
		
		getInnerText: function (element) {
			var textContent = element.innerText;
			if(textContent){
				textContent = textContent.trim();
			}
			return (textContent) ;
		},
		
		//Check if the nodes textcontent is all whitepsace or special chars
		is_all_ws: function ( nod )
		{
		  // Use ECMA-262 Edition 3 String and RegExp features
		  return !(/[^\t\n\r ]/.test(nod.textContent)) || !(/[a-z0-9]+/i.test(nod.textContent));
		},
		//Check if language is RTL( right to left)
		isRTLLanguage: function () {
			var lang = document.documentElement.lang;
			if( lang == undefined || lang =="")
			{
				var meta = document.querySelector("meta[http-equiv='content-language']");
				if (meta)
					lang = meta.content;
			}
			switch(lang){
			case "ar" :	//Arabic
			case "he" : //Hebrew
			case "iw" : //Hebrew
			case "ur" : //Urdu
				return true;
			default:
				return false;
			}
		},
		trim: function (str) {
			var val = (str && (typeof(str) == 'string')) ? str : "";
			if (val.length > 1) val = val.replace(/\s/g, ' ').replace(/ +/g, ' ').replace(/^ /g, '').replace(/ $/g, '').replace(/"/g, '\\"');
			return val;
		},

		trimRegExp: function (str) {
			var val = (str && (typeof(str) == 'string')) ? str : "";
			if (val.length > 1) val = val.replace(/\[/g, '\\[').replace(/\]/g, '\\]');
			return val;
		},
		
		trimAndFormat: function (type, property) {
			var val;
			switch (type) {
			case "TString":
			case "TLocalizedString":
				val = this.trim((property != null) ? (property + "") : "");
				break;

			case "TInteger": 
			case "TFloat": 
				// get rid of 'px' at the end of numeric values
				val = property;
				if (typeof(property.replace) == 'function') val = property.replace(/px$/, '');
				break;

			case "TBoolean":
				val = property.toString();
				break;

			case "TColor":
				val = this.getColor(property);
				break;

			default :
				val = (property != null) ? property : "";
				break;
			}
			return val;
		},

		// Convert java regular expression to JS format
		convertRegex: function(jRegex) {
			const jsModifiers = ['i', 'm']; // JS supported modifiers
			let modifiers = 'g';
			
			// Java modifiers?
			const jModifiersRegex = new RegExp('\\(\\?.*\\)', 'g');
			const match = jRegex.match(jModifiersRegex);
			if (match) {
				for (let i = 0; i < jsModifiers.length; i++) {
					const m = jsModifiers[i];
					if (match[0].indexOf(m) >= 0) {
						modifiers += m;
					}
				}
			}
			// TP-76025: replaceAll not supported on IE. replace is sufficient in that case since jModifiersRegex includes 'g'
			return new RegExp(jRegex.replace(jModifiersRegex, ''), modifiers);
		},
		
		applySimpleOperator: function (p1, p2, op) {
			var ret = null;
			switch (op) {
			case 'TEquals':
				ret = (p1 == p2);
				break;
			case 'TNotEquals':
				ret = (p1 != p2);
				break;
			case 'TGreater':
				ret = (p1 > p2);
				break;
			case 'TGreaterOrEquals':
				ret = (p1 >= p2);
				break;
			case 'TLess':
				ret = (p1 < p2);
				break;
			case 'TLessOrEquals':
				ret = (p1 <= p2);
				break;
			case 'TContains':
				var reg=new RegExp(".*" + this.trimRegExp(p2) + ".*", "g");
				ret = (reg.test(p1));
				break;
			case 'TDoNotContains':
				var reg=new RegExp(".*" + this.trimRegExp(p2) + ".*", "g");
				ret = ( ! reg.test(p1));
				break;
			case 'TEndWIth':
				var reg=new RegExp(".*" + this.trimRegExp(p2) + "$", "g");
				ret = (reg.test(p1));
				break;
			case 'TDoNotEndWith':
				var reg=new RegExp(".*" + this.trimRegExp(p2) + "$", "g");
				ret = ( ! reg.test(p1));
				break;
			case 'TStartWith':
				var reg=new RegExp("^" + this.trimRegExp(p2) + ".*", "g");
				ret = (reg.test(p1));
				break;
			case 'TDoNotStartWith':
				var reg=new RegExp("^" + this.trimRegExp(p2) + ".*", "g");
				ret = ( ! reg.test(p1));
				break;
			case 'TMatchRegEx':
				try {
					ret = this.convertRegex(p2).test(p1);
				} catch (e) {
					ret = false;
				}
				break;
			case 'TDoNotMatchRegEx':
				try {
					ret = !this.convertRegex(p2).test(p1);
				} catch (e) {
					ret = false;
				}
				break;
			default:
				break;
			}
			return ret;
		},
		
		/**
		 * 
		 * @param element
		 * @param rect
		 * @returns {Boolean} Element is inside the viewport or not
		 */
		isInViewPort:function (element, rect) {//RMoTisInViewPort

			if ( rect.right < 0  // element on the left
				|| rect.left > this.getWindowWidth(element)  // element on the right
				|| rect.bottom < 0  // element above
				|| rect.top > this.getWindowHeight(element) )  // element below
					{
			
				return false;
			}

			return true;
				
		},

		/**
		 * 
		 * @param element
		 * @param rect
		 * @returns {Boolean} Element is on top, and thus visible or not
		 */
		isOnTop:function (element) {//RMoTisOnTop

			/* Must take into account the case where the element is bigger than the viewport
			 * 		a---------------b
			 *		|				|
			 *		|				|
			 *		c---------------d
			 */
			
			var mainDoc = element.ownerDocument;
			var rect = element.getBoundingClientRect();
			
			var a = { 	relativeLeft: Math.max(rect.left, 0), 
						relativeTop: Math.max(rect.top, 0) };
						
			var b = {	relativeLeft: Math.min(rect.right - 1, this.getWindowWidth(element)  - 1), 
						relativeTop: a.relativeTop };

			var c = {	relativeLeft: a.relativeLeft, 
						relativeTop:  Math.min(rect.bottom - 1, this.getWindowHeight(element) - 1) };

			var d = {	relativeLeft: b.relativeLeft, 
						relativeTop:  c.relativeTop };

			if ( ! ( mainDoc.elementFromPoint( a.relativeLeft, a.relativeTop ) === element  // upper left
				|| mainDoc.elementFromPoint( b.relativeLeft, b.relativeTop ) === element  // upper right
				|| mainDoc.elementFromPoint( c.relativeLeft, c.relativeTop ) === element  // lower left
				|| mainDoc.elementFromPoint( d.relativeLeft, d.relativeTop ) === element ) )  // lower right
			{
				// weird behavior in Edge browser, elementFromPoint sometimes returns the nearby object
				// so we check 1 pixel inside
				if ( ! ( mainDoc.elementFromPoint( a.relativeLeft+1, a.relativeTop+1 ) === element
					|| mainDoc.elementFromPoint( b.relativeLeft-1, b.relativeTop+1 ) === element
					|| mainDoc.elementFromPoint( c.relativeLeft+1, c.relativeTop-1 ) === element
					|| mainDoc.elementFromPoint( d.relativeLeft-1, d.relativeTop+1 ) === element ) )
				{
					// Then check the center : Last chance
					var center = {	relativeLeft: (b.relativeLeft - a.relativeLeft)/2 + a.relativeLeft, 
									relativeTop: (c.relativeTop - a.relativeTop)/2 + a.relativeTop };
					
					var topElement = mainDoc.elementFromPoint(center.relativeLeft, center.relativeTop);
					if ( !(topElement === element) ) {
						return false;
					}
				}
			}
			
			return true;
					
		},

		getXPath:function (node) {//RMoTgetXPath (only used for debugging purposes)
			var fullPath = [];	
			var el = node;
			
			do {
				var index = 1;
				if (el.parentNode && !el.id) {
					var siblings = el.parentNode.childNodes;
					for (var i = 0; i < siblings.length; i++) {
						var sibling = siblings[i];
						if (sibling === el)
							break;
						if (sibling.nodeType === 1 && sibling.tagName === el.tagName)
							index++;
					}
				}

				if(el.nodeType != window.Node.DOCUMENT_NODE && el.nodeType != window.Node.DOCUMENT_FRAGMENT_NODE) {
					let name = el.nodeName.toLowerCase();
					
					if (name === 'svg') return null;
					const nsRegex = new RegExp('.*:.*', 'g'); // namespace
					if (name.match(nsRegex)) {
						name = '*[name()=\''+ name +'\']';
					}
					
					fullPath.unshift(name + (el.id ? '[@id=\'' + el.id + '\']' : '') + (index > 1 ? '[' + index + ']' : ''));
				}
				
			} while (!el.id && ((name != 'body') && el.parentNode && (el = el.parentNode)));
			
			return '//' + fullPath.join('/');
		},

		isEvent:function (attributeName) {//RMoTisEvent
			
			if (attributeName.indexOf(RMoTeventPrefix) == 0) {
				return true;
			}
			
			return false;
		},
		
		/*
		 * Attach the ownerDocument (potentially iframe element) coordinates to the contentDocument
		 */
		setOwnerDocumentCoordinates:function(element) {
			var ownerRect = this.getOwnerDocumentCoordinates(element);
			var rect = element.getBoundingClientRect();
			
			var borderTopWidth = 0;
			var borderLeftWidth = 0;
			try {
				borderTopWidth = parseInt(getComputedStyle(element).borderTopWidth.slice(0, -2));
				borderLeftWidth = parseInt(getComputedStyle(element).borderLeftWidth.slice(0, -2));
			}
			catch (err) {
			}
			
			var innerCoords = {};
			innerCoords.left = rect.left + ownerRect.left + borderLeftWidth;
			innerCoords.top = rect.top + ownerRect.top + borderTopWidth;
			innerCoords.right = rect.left + ownerRect.right + borderLeftWidth;
			innerCoords.bottom = rect.top + ownerRect.bottom + borderTopWidth;
			
			if (element.contentDocument) {
				element.contentDocument.innerCoords = innerCoords;				
			}
		},
		
		/*
		 * Read the attached coordinates of the ownerDocument
		 */
		getOwnerDocumentCoordinates:function(element) {
			var ownerDocument = element.ownerDocument;
			if (ownerDocument && ownerDocument.innerCoords) {
				return ownerDocument.innerCoords;
			}
			
			try {
				ownerDocument.defaultView.parent.document;
			}
			catch (e) {
				// Cross-origin exception: Frame offset can not be retrieved from its parent
				// Hence using the one computed by the message mechanism
				return {left: RMoTFrameOffsetLeft,
						top: RMoTFrameOffsetTop,
						right: RMoTFrameOffsetLeft,
						bottom: RMoTFrameOffsetTop};
			}
			return {left: 0,top: 0,right: 0,bottom: 0};
		},
		
		/*
		 * Keep this function for compatibility reasons
		 */
		getCoordinatesArray:function(proxy) {
			var rect = proxy.getCoordinates();
			var ratio = window.devicePixelRatio ? window.devicePixelRatio : 1;
			if(typeof(BROWSER_ZOOM_FACT)=='undefined') {
				ratio = BROWSER_ZOOM_FACT;
			}
			return "left:" + (rect.left * ratio)
				+ ";top:" + (rect.top * ratio)
				+ ";right:" + (rect.right * ratio)
				+ ";bottom:" + (rect.bottom * ratio)
				+ ";";
		},
		
		getFrames:function() {
			return document.documentElement.querySelectorAll(frameElements);
		},
		
		containsFrames:function() {
			return this.getFrames().length !== 0;
		},
		
		requestFrameOffset:function(win) {
			try {
				if (win !== top) {
					var message = this.stringify({ msg : 'requestFrameOffset' });
					win.parent.postMessage(message, '*');
				}
				else {
					// Waiting to be at the top window before sending the coordinates
					jsUtil.sendFrameOffset();
				}
			}
			catch (err) {
				rmotRecorder.log(err);
			}
		},
		
		sendFrameOffset:function() {
			// Send their own coordinates to the children frames
			var frames = this.getFrames();
			for (var i = 0; i < frames.length; i++) {
				var f = frames[i];
				var rect = f.getBoundingClientRect();
				var message = this.stringify({
					msg : 'sendFrameOffset',
					left: rect.left + f.clientLeft + RMoTFrameOffsetLeft,
					top: rect.top + f.clientTop + RMoTFrameOffsetTop
				});
				f.contentWindow.postMessage(message, '*');
			}
		},
		
		onFrameOffsetMessage:function(e) {
			try {
				var data = JSON.parse(e.data);
				if (data.msg == 'requestFrameOffset') {
					jsUtil.requestFrameOffset(e.source);
				}
				else if (data.msg == 'sendFrameOffset') {
					RMoTFrameOffsetLeft = data.left;
					RMoTFrameOffsetTop = data.top;
					jsUtil.sendFrameOffset();
				}
			} catch(e) { /* NOPE */ }
		},
		
		getColor:function(color) {
			var regexp = /\d+/g;
			var red = parseInt(regexp.exec(color)[0], 10).toString(16);
			var green = parseInt(regexp.exec(color)[0], 10).toString(16);
			var blue = parseInt(regexp.exec(color)[0], 10).toString(16);
			var alpha;
			try {
				alpha = parseInt(regexp.exec(color)[0], 10).toString(16);
			} catch(e) {
				alpha = parseInt('255', 10).toString(16);
			}
			var newColor = "00".substr(0, 2 - red.length) + red +
			"00".substr(0, 2 - green.length) + green + 
			"00".substr(0, 2 - blue.length) + blue + 
			"00".substr(0, 2 - alpha.length) + alpha;
			return newColor.toUpperCase();
		},
		
		getComputedStyle: function(element) {
			   
			var computedStyles = "";
			
			if (window.getComputedStyle) {
			
				for (var i = 0; i < RMoTstylesArray.length; i++) {
					var prop = RMoTstylesArray[i];
					
					var ret = jsUtil.getMainWindow().getComputedStyle(element);
					if (ret != null) {
						computedStyles += prop + ":" + ret.getPropertyValue(prop) + ";";
					}
				}
			
			}
			
			return computedStyles;
		},
		
		// DOM element cloner
		cloneElement: function(element, visible) {
			var clone = {};

			// Add attributes to the clone element
			if (element.attributes) {
				for ( var i=0; i < element.attributes.length; i++ ) {
					var attr = element.attributes[i];
					if (attr != null) {
						var attrValue = element.attributes.item(i).value;
						var attrName = element.attributes.item(i).name;

						if (RMoTIgnoredAttrs.indexOf(attrName) >= 0) continue;

						if (attrValue && !this.isEvent(attrName) && attrName!="style") {
							clone[attrName] = attrValue;
						}
					}
				}
			}

			const proxy = domainManager.getProxy(element);
			if (visible && element.nodeType && element.nodeType == window.Node.ELEMENT_NODE
					&& proxy && proxy.proxyClass !== 'HtmlSvgProxy') {
				clone.Style$array$ = this.getComputedStyle(element);
			}

			return clone;
		},
		
		// Attribute copier
		copyIfDefined: function(element, clone, attrNames) {
			for (var i in attrNames) {
				var attrName = attrNames[i];
				var attrValue = element.getAttribute && element.getAttribute(attrName);
				if (attrValue) {
					clone[attrName] = attrValue;
				} else if (element[attrName]) {
					clone[attrName] = element[attrName];
				}
			}
		},
		
		getAttributeValue:function(element, attrName){
			var attrValue = element.getAttribute && element.getAttribute(attrName);
			if (!attrValue) {
				if(element[attrName]) {
					attrValue = element[attrName];
				}
			}
			return attrValue;
		},
		
		parse:function (jsonString) {//RMoTparse
			// rmotJSInterface.log("JSONSTRING: "+jsonString);
			return eval("(function(){return " + jsonString + ";})()");
		},
		
		startsWith:function (str, prefix) {
		    return str.substring(0, prefix.length) === prefix;
		},
		
		endsWith:function (str, suffix) {
		    return str.indexOf(suffix, str.length - suffix.length) !== -1;
		},
		
		contains:function(str, key) {
			return str.indexOf && str.indexOf( key ) !== -1;
		},

		/**
		 * @returns The element whose attribute is equal to value
		 */
		getElementByAttribute:function(attr, values, root) {
			root = root || document.body;
			
			if (root.hasAttribute(attr) && values.indexOf(root.getAttribute(attr)) >=0) {
				return root;
			}

			for (var i = root.children.length; i--; ) {
				element = this.getElementByAttribute(attr, values, root.children[i]);
				if (element) return element;
			}

			return null;
		},
		
		findElementAll: function(tagName,attrName,attrValue){
			var results =[];
			if(attrValue){
				results = document.querySelectorAll(tagName+"["+attrName+"='"+attrValue+"']");
			}
			return results;
		},
		
		findElementsInOwnerDoc: function(element,tagName,attrName,attrValue){
			var results =[];
			if(attrValue){
				if(element.ownerDocument){
					results = element.ownerDocument.querySelectorAll(tagName+"["+attrName+"='"+attrValue+"']");
				}
			}
			return results;
		},
		
		isTouchEnabled:function() {
			return !this.isDesktop() && (('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch);
		},
		
		// Returns true when recording is enabled
		isRecordingMode:function() {
			return !(typeof(WebGuiRecorder)=='undefined');
		},
		
		isDesktop:function() {
			return (typeof(isDesktopRun) !== 'undefined' && isDesktopRun == true);
		},
		
		isDocReady:function() {
			return document.readyState === 'complete';
		},
		
		isRunningInsideIEBrowser:function(){
			var bRunningInsideIE = false;
			if(this.isDesktop()){
				var navAgent = navigator.userAgent;
				if ( (navAgent.indexOf("MSIE")!=-1) || (navAgent.indexOf("Trident")!=-1) ) {
					bRunningInsideIE = true;
				}
			}
			return bRunningInsideIE;
		},
		
		// Returns a string with Dojo and JQuery versions if one of the framework is loaded. Internal use only.
		getVersions:function() {
			var _version = '';

			for (var i = 0; i < domainManager.domains.length; i++) {
				var domainObj = domainManager.domains[i];
				var version = domainObj.getDomainVersion();
				if (version) {
					_version += ' ' + domainObj.getDomainName() + ': ' + version;
				}
			}
			
			return _version.substring(1, _version.length);
		},

		escapeCSS : function(str) {
			str = str || "";
			var len = str.length, i = 0, newStr = '', ch, newChar;
			while (i < len) {
				ch = str.charAt(i);
				newChar = ch;
				uCode = ch.charCodeAt();
				if (/[ !"#$%&'()*+,./:;<=>?@\[\\\]^`{|}~]/.test(ch)) {
					newChar = '\\' + ch;
				}
				else if (/[\t\n\v\f\r]/.test(ch)) {
					newChar = '\\' + uCode.toString(16).toUpperCase() + ' ';
				}
				newStr += newChar;
				i++;
			}
			var firstChar = str.charAt(0);
			if (/\d/.test(firstChar)) {
				newStr = '\\' + firstChar.charCodeAt().toString(16) + ' ' + newStr.slice(1);
			}
			return newStr;
		},
		
		getBrowserCompatibilityDetails: function() {
			var ret = {userAgent: "", status: true, name: "", version: 1, documentMode:"", compatMode: "Standards", tracemode: true, pixelRatio: 1};

			var navAgent = navigator.userAgent;
			ret.userAgent = navAgent;
			var Version;
			var platform = navigator.platform;
			if (!this.isDesktop()) {
				if ((Version = navAgent.indexOf("Android"))!=-1) {
					ret.name = "Android";
					ret.version = parseFloat(navAgent.substring(Version+8));
				}
				else {
					ret.name = "iOS";
					try {
						ret.version = /OS .[0-9]+_[0-9]+/.exec(navAgent)[0];
					} catch(e) {}
					ret.pixelRatio = window.devicePixelRatio;
				}
			}
			else if ((Version = navAgent.indexOf("MSIE"))!=-1) {
				ret.name = "Microsoft Internet Explorer";
				ret.documentMode = parseFloat(navAgent.substring(Version+5));
				ret.version = ret.documentMode;
				if ((Version = navAgent.indexOf("Trident"))!=-1) {
					ret.version = parseFloat(navAgent.substring(Version+8)) + 4;
					if(ret.version == 9)
					{
						ret.tracemode = false;
					}
				}
				if(ret.documentMode < 9) {
					ret.status = false;
					ret.tracemode = false;
				} else if (document.compatMode!=='CSS1Compat') {
					ret.status = false;
					ret.tracemode = false;
					ret.compatMode = "Quircks";
				}
				try {
					BROWSER_ZOOM_FACT = screen.deviceXDPI/screen.logicalXDPI;
				} catch (e) { 
					BROWSER_ZOOM_FACT = 1;
				}
			}
			else if ((Version = navAgent.indexOf("Trident"))!=-1) {
				ret.name = "Microsoft Internet explorer";
				if ((verOffset=navAgent.indexOf("rv:"))!=-1)  {
					ret.version = parseFloat(navAgent.substring(verOffset+3));
				} else if (document.compatMode!=='CSS1Compat') {
					ret.status = false
					ret.compatMode = "Quircks";
				}
				try {
					BROWSER_ZOOM_FACT = screen.deviceXDPI/screen.logicalXDPI;
				} catch (e) { 
					BROWSER_ZOOM_FACT = 1;
				}
			}
			// Do not rely on the user Agent as you can emulate an Apple device
			else if (typeof window.chrome !== "undefined") {
				postXHRThroughCustomEventFlag = true;
				ret.name = "Chrome";
				// In Chrome, the true version is after "Chrome" 
				ret.version = parseFloat(navAgent.substring(navAgent.indexOf("Chrome") + 7));
				BROWSER_ZOOM_FACT = window.devicePixelRatio;
				if (/Mobile/.test(navAgent) && platform === "Win32") { // Device mode on Windows
					ret.pixelRatio = window.devicePixelRatio * window.innerWidth / window.outerWidth;
				}
			}			
			else if (typeof window.safari !== "undefined") {
				postXHRThroughCustomEventFlag = true;
				ret.name = "Safari";
				// In Safari, the true version is after "Safari" or after "Version" 
				Version = navAgent.substring(navAgent.indexOf("Safari")+7);
				if ((verOffset=navAgent.indexOf("Version"))!=-1) 
					ret.version = parseFloat(navAgent.substring(verOffset+8));
				else
					ret.version = parseFloat(Version);
				
				// for retina displays its 2, otherwise it is 1
				BROWSER_ZOOM_FACT = window.devicePixelRatio;
				if (!/Mobile/.test(navAgent)) {
					ret.pixelRatio = window.innerWidth / window.outerWidth;
				}
			}
			else if (typeof InstallTrigger !== 'undefined') {
				postXHRThroughCustomEventFlag = true;
				ret.name = "Firefox";
				// In Firefox, the true version is after "Firefox" 
				ret.version = parseFloat(navAgent.substring(navAgent.indexOf("Firefox")+8));
				if (/Mobile/.test(navAgent)) { // Device mode
					ret.pixelRatio = Math.min(window.devicePixelRatio, 2);
				}
			}
			else {
				ret.status = false;
			}

			return ret;

		},
		
		/**
		 * Compute a weight according to the string comparison
		 * the more the strings look like the more the weight is close to 10
		 */
		computeStringSimilarity : function(st1, st2) {
			if ((st1 == null) || (st2 == null)) return 0;
			var str1 = this.trim(st1);
			var str2 = this.trim(st2);
			var lengthMax = Math.max(str1.length, str2.length);
			var lengthMin = Math.min(str1.length, str2.length);
			if (lengthMax > (lengthMin * 3)) return 0;

			var strMin = (str1.length < str2.length) ? str1 : str2;
			var strMax = (str1.length >= str2.length) ? str1 : str2;
			var cur = 0;
			var W = 0;
			for (var i = 0; i < lengthMin; i++) {
				for (var j = cur++; j < lengthMax; j++) {
					if (strMin[i] == strMax[j]) {
						W += 1;
						break;
					}
				}
			}
			W = Math.floor((W / lengthMax) * 10);
			if (W == 10) {
				W = (str1 === str2) && (st1 === st2.replace(/\s/g, ' ')) ? 10 : 9;
			}
			return W;
		},
		
		querySelector : function(doc, selector) {
			var elt = null;
			var frames = doc.querySelectorAll('iframe, frame');
			for (var i = 0; i < frames.length; i++) {
				if (isFrameElement(frames[i])) { // Cross origin?
					elt = this.querySelector(frames[i].contentWindow.document, selector);
					if (elt != null) return elt;
				}
			}
			return doc.querySelector(selector);
		},
		
		setDownEventRecorded: function(eventName) {
			if (eventName === RMOT_DOWN_EVENT) {
				this.getMainDocument().rmotDownEventRecorded = true;	
			}
		},
		
		isDownEventRecorded: function(eventName) {
			var mainDoc = this.getMainDocument();
			if (eventName === RMOT_TRIGGER_EVENT && mainDoc.rmotDownEventRecorded) {
				mainDoc.rmotDownEventRecorded = false;
				return true;
			}
			
			return false;
		},
		
		fnCompare: function(fn1, fn2) {
			try {
				if (!fn1 && !fn2) return true;
				
				if (!fn1 || !fn2) return false;
				
				return fn1.toString() === fn2.toString();
			}
			catch (e) {}
			return false;
		},
		
		isDijitControl: function(element) {
			return this.contains(element.className, "dijit")
				|| this.contains(element.className, "dojox");
		},
		
		isSapLS: function() {
			return window.sap && window.sap.ls;
		}
};

var jsUtil = new JSUtil();
var browserDetails = jsUtil.getBrowserCompatibilityDetails();


function RMoTdebug(element, xpath, msg) {
	if (jsUtil.getXPath(element)==xpath) {
//		rmotJSInterface.log("RMoTdebug " + arguments.callee.caller + " >> " + msg);
		rmotRecorder.log("RMoTdebug >> " + msg);
	}
}


/// Nitin Extension Framework Implementation/////

var WebGuiConstants ={
		TAGNAME_PROP:"tagName",
		CONTENT_PROP:"content",
		VALUE_PROP:"value",
		LABEL_PROP:"label",
		CLASS_PROP:"class",
		WGROLE_PROP:"wgrole",
		OPTIONS_PROP:"options",
		OPTIONSLENGTH_PROP:"length",
		CHECKED_PROP:"checked",
		TABHEADER_PROP: "tabheader",	
		TOOL_TIP: 	"tooltip",
		CHECKSUM_PROP:"checksum",
		ENABLED_PROP: "enabled",
		DEVICEPIXELRATIO_PROP: "devicePixelRatio",
		WIDTH_PROP: "width",
		HEIGHT_PROP: "height",
		SCROLLABLE_PROP: "scrollable",
		COLLAPSED_PROP: "collapsed",
		XPATH_PROP: "xpathProp",
		URL_PROP: "url",
		TITLE_PROP: "title"
		}; 

WebGuiUtil = function(){
	
};

WebGuiUtil.prototype={
		/**
		 * Call the jQuery function of the element's defaultView
		 */
		jQuery:function(element) { // 49062	
			var defaultView = (element.ownerDocument) ? element.ownerDocument.defaultView : window;
			
			return defaultView.jQuery(element);
		}
};

var webGuiUtil = new WebGuiUtil();

JSReflection = function(){
	
};

/**
 * creates the object of the proxy class
 * domainObj and element will be passed as the parameters to proxy constructor.
 */
JSReflection.prototype.createObject = function(domainObj, element, proxyClassName, proxyName) {
    var args = Array.prototype.slice.call(arguments);
    var proxyClass = eval(proxyClassName);
    if (!proxyClass) return null;
    function F() {
        return proxyClass.apply(this, args);
    }
    F.prototype = proxyClass.prototype;
    F.prototype.toJSON = function() {}
    return new F();
};

JSReflection.prototype.callMethod = function(proxyObject, methodName) {
	var args = Array.prototype.slice.call(arguments, 2);
	proxyObject[methodName](args);
};


JSReflection.prototype.getPropertyNames = function(htmlelement) {
	var properties = [];
	for(var key in obj) {
	    if(obj.hasOwnProperty(key) && typeof obj[key] !== 'function') {
	        properties.push(key);
	    }
	}
	return properties;
};


JSReflection.prototype.getPropertyValue = function(htmlelement, propertyName) {
	return this.callMethod(htmlelement, propertyName);
};

var jsReflect = new JSReflection(); 

var BASE_DOMAIN_NAME = "base";
BaseDomain = function() {
	domainManager.addDomain(this);
};

BaseDomain.prototype={
		
		/**
		 * Extension Writers need to implement this method
		 */
		getProxy:function(element){
			return null;
		},

		/**
		 * Returns the name of the domain
		 */
		getDomainName:function(){
			return BASE_DOMAIN_NAME;
		},
		
		/**
		 * Returns the version of the domain
		 */
		getDomainVersion:function() {
			return null;
		},
		
		getWidgets:function() {
			return [];
		},
		
		/**
		 * This function tries to determine if the given element belongs to the domain.
		 * 
		 * @param element the DOM node to test
		 * @returns name (grammar id object) of the identified widget, null otherwise.
		 */
		getEnclosingObject:function(element) {
			if(!element || !element.tagName
					|| jsUtil.tagsIgnored.indexOf(element.tagName.toLowerCase()) >=0) return null;
			
			var objName = null;
			var widgets = this.getWidgets();
			for (var i in widgets) {
				var keyValue = element.getAttribute(widgets[i].key);
				if (keyValue && typeof(keyValue) == "string") {
					var keyValueArray = keyValue.split(" ");
					for (var j in keyValueArray) {
						if (keyValueArray[j] === widgets[i].value) { // Strict comparison
							return widgets[i].name;
						}
						/*
						else { // Try regular expression
							var regexp = new RegExp(widgets[i].value);
							if (regexp.test(keyValueArray[j])) {
								objName = widgets[i].name;
							}
						}
						*/
					}
				}
			}
			return objName;
		},
		
		_parseDocument:function(){
			if(webGuiRecorderInterfaceObj){
				webGuiRecorderInterfaceObj.parseDocument();
			}
			
		},
		
		_updateHierarchy:function(){
			if(webGuiRecorderInterfaceObj){
				return webGuiRecorderInterfaceObj.updateHierarchy();
			}
			return null;
		},
		
		_recordEvent:function(event, eventName, tagName, element, parameters){
			if(webGuiRecorderInterfaceObj){
				webGuiRecorderInterfaceObj.recordEvent(event, eventName, tagName, element, parameters);
			}
		},
		
		_captureScreenshot:function(){
			var screenshotId = null;
			if(webGuiRecorderInterfaceObj){
				screenshotId = webGuiRecorderInterfaceObj.captureScreenshot();
			}
			return screenshotId;
		},
		
		_recordEventWithExistingScreenshot:function(eventName, tagName, element,hierarchy,parameters,screenshotId){
			if(webGuiRecorderInterfaceObj){
				webGuiRecorderInterfaceObj.recordEventWithExistingScreenshot(eventName, tagName, element,hierarchy,parameters,screenshotId);
			}
		}
};

IProxy = function(){
	
};

IProxy.prototype={
		installWrappers:function(){
			
		},
		
		applyDecoratedProps: function(targetElement){
			
		},
		
		isVisible: function(){
			
		},
		
		getProperty: function(propName){
			
		},
		
		getParent: function(){
			
		}
};

DomainManager = function(){
	this.registeredDomains = [];
	this.domainMap = {};
	this.domains = [];
//	this.proxyUID = 0;
};

DomainManager.prototype={
		
		init: function() {
			/*
			 * Reinitialize proxies on window hashchange event (53472)
			 */
			this.addProxyConstructorListener();
			
			// Initialize known domains
			if (!this.isRegistered(HTML_DOMAIN_NAME)) {
				for (var i = 0; i < this.domains.length; i++) {
					this.domains[i].init();
				}
			}
		},
		
		isRegistered: function(domainName) {
			return domainName in this.domainMap;
		},
		
		addDomain: function (domainObj){
			this.domains.push(domainObj);
		},
		
		registerDomain: function (domainObj){
			this.registeredDomains.push(domainObj);
			this.domainMap[domainObj.getDomainName()] = domainObj;
		},
		
		getDomainObj: function(domainName){
			return this.domainMap[domainName];
		},
		
		getProxy: function(element){
			// Determine proxy only if: not already done or className has changed
			if ((typeof element.registeredClassName === "undefined") || element.registeredClassName != element.className
					|| element.registeredDomain != this.registeredDomains.length) {
				for(var i=this.registeredDomains.length-1;i>=0;i--) {
					var domainObj = this.registeredDomains[i];
					var proxyObj = domainObj.getProxy(element);
					if (proxyObj!=null) {
						element.registeredDomain = this.registeredDomains.length;
						// Create the proxy or update it in case a new domain has been registered
						if (element.domainName != this.registeredDomains[i].getDomainName()) {
							element.domainName = domainObj.getDomainName();
							element.registeredClassName = element.className;
							element.proxy = proxyObj;
						}
						break;
					}
				}
			}
			return element.proxy;
		},
		
		installWrappers: function(element){
			var proxy = this.getProxy(element);
			if (proxy) {
				proxy.installWrappers();
			}
			return true;
		},
		
		installDownWrapper: function(element){
			var proxy = this.getProxy(element);
			if (proxy) {
				proxy.installDownEventWrapper(RMOT_DOWN_EVENT);
			}
			return true;
		},
		
		installMutationObserver: function(element){
			var proxy = this.getProxy(element);
			if (proxy) {
				proxy.installMutationObserver();
			}
			return true;
		},
		
		installGhostClickWrapper: function(element){
			var proxy = this.getProxy(element);
			if (proxy) {
				proxy.installGhostClickWrapper();
			}
			return true;
		},

		applyDecoratedProps: function(sourceElement, targetElement){
			this.getProxy(sourceElement).applyDecoratedProps(targetElement);
		},
		
		getProperty:function(element, propName){
			var propValue = this.getProxy(element).getProperty(propName);
			return propValue;
		},

		addProxyConstructorListener: function() {
			var win = window;
			if (!win.onhashchange || win.onhashchange.toString().indexOf("rmotHashChange") < 0) {
				win.rmotHashChange = win.onhashchange;
				win.onhashchange = function() {
					if (win.rmotHashChange) win.rmotHashChange.apply(this, arguments);
					var elts = jsUtil.getMainDocument().body.getElementsByTagName("*");
					for (var i = 0; i < elts.length; i++) {
						elts[i].registeredDomain = 0;
					}
				};
			}
		}
};

var domainManager = new DomainManager();

var WebGuiStorage = function(){};
WebGuiStorage.prototype={
		get: function(key) {
			let value = null;
			try {
				value = localStorage.getItem(key);
			}
			catch (e) {}
			
			return value;
		},
		
		exists: function(key) {
			let value = '';
			try {
				value = localStorage.getItem(key);
			}
			catch (e) {}
			
			return value !== null;
		},
		
		set: function(key, value) {
			try {
				localStorage.setItem(key, value);
			}
			catch (e) {}
		},
		
		remove: function(key) {
			try {
				localStorage.removeItem(key);
			}
			catch (e) {}
		}
};

var webGuiStorage = new WebGuiStorage();

/**
 *	Create and display a rectangle around an element
*/
RMoTRectangle = function(element) {
	this.RMoTRect = undefined;
	if (element) {
		var rect = element.getBoundingClientRect();
		if (rect) {
			var coords = this.getCoords(element);
			// cf WI 44766 --------------------------------------------------------------------
			if ((rect.top > coords.top) && (jsUtil.isInViewPort(element, rect))) {
				coords = rect;
			}
			// --------------------------------------------------------------------------------
			var top = Math.round(coords.top);
			var left = Math.round(coords.left);
			var right = coords.right - coords.left;
			var bottom = coords.bottom - coords.top;
			//
			this.drawRectangle(element.ownerDocument, top, left, right, bottom);
			// LoggerService.logMsg(RMoTDebug, "---> " + top + ", " + left + ", " + right + ", " + bottom);
			
			// handle rectangle area coordinates
			var proxy = domainManager.getProxy(element);
			if (proxy.getCoords) {
				rect = (proxy.isRectArea()) ? proxy.getCoords() : rect;
			}
			
			if (!jsUtil.isInViewPort(element, rect)) {			
				var scrollX = (coords.right > jsUtil.getWindowWidth(element)) ? coords.right - jsUtil.getWindowWidth(element) + 100 : 0;
				var scrollY = (coords.bottom > jsUtil.getWindowHeight(element)) ? coords.bottom - jsUtil.getWindowHeight(element) + 100 : 0;
				window.scrollTo(scrollX, scrollY) ;
			}
		}
	}
};

RMoTRectangle.prototype.computeAbsolute = function(element, absolute) {
	absolute.absoluteLeft += element.offsetLeft ? element.offsetLeft : 0;
	absolute.absoluteTop += element.offsetTop ? element.offsetTop : 0;

	if (element.offsetParent) {
		this.computeAbsolute(element.offsetParent, absolute);
	}
};

RMoTRectangle.prototype.getCoords = function(element) {
	var ret = {top : 0, left : 0, bottom : 0, right : 0 };
	if (element != null) {
		element.absolute = { absoluteLeft: 0, absoluteTop: 0 };
		this.computeAbsolute(element, element.absolute);

		ret.top = element.absolute.absoluteTop;
		ret.left = element.absolute.absoluteLeft; 
		ret.bottom = ret.top + element.offsetHeight;
		ret.right = ret.left + element.offsetWidth;

		// handle rectangle area coordinates
		var proxy = domainManager.getProxy(element);
		if (proxy.getCoords) {
			ret = (proxy.isRectArea()) ? proxy.getCoords() : ret;
		}
	}
	return ret;
	
};

/**
 * Draw a rectangle thanks to the element coordinates
*/
RMoTRectangle.prototype.drawRectangle = function(top, left, width, height, color) {
	this.drawRectangle(document, top, left, width, height, color);
};
/**
 * Draw a rectangle thanks to the element coordinates
*/
RMoTRectangle.prototype.drawRectangle = function(doc, top, left, width, height, color) {
	var RMoTBorderWidth = 2;
	if(color == undefined)
		color = 'solid red';
	width = width - 2 * RMoTBorderWidth;
	height = height - 2 * RMoTBorderWidth;
	this.RMoTRect = doc.createElement('div', RMoTRectangleId);
	var rectStyle = 'border:'+RMoTBorderWidth+'px '+ color +';position:absolute;background:none;top:'+top+'px;left:'+left+'px;width:'+width+'px;height:'+height+'px;z-index:1000000;pointer-events: none;';
	this.RMoTRect.setAttribute( "style", rectStyle );
//	document.body.insertBefore makes the page shift down in some websites
	doc.body.appendChild(this.RMoTRect);
	
	window.setTimeout(function() { 
		this.removeRectangle();
	}.bind(this), 1000);
};


/**
 * Remove the rectangle drawn by RMoTDrawRectangle
**/
RMoTRectangle.prototype.removeRectangle = function() {
	if (this.RMoTRect && this.RMoTRect.ownerDocument.body) {
		this.RMoTRect.ownerDocument.body.removeChild(this.RMoTRect);
		this.RMoTRect = null;
	}
};

/**
 * If any, remove the rectangle drawn by the browser extension
 * Useful when multiple extensions are running at the same time.
**/
RMoTRectangle.prototype.removeBodyRectangle = function() {
	setTimeout(function() {
		try {
			let bs = document.body.style;
			if (bs.border === '3px solid blue') {
				bs.border = 'none';	
			}
		}
		catch (e) { /* Nope */	}
	}, 3000);
};

/*
 *
 *	Licensed Materials - Property of IBM
 *
 *	IBM Rational Mobile Test
 *
 *	(C) Copyright IBM Corporation 2014, 2019. All Rights Reserved. 
 *  Copyright HCL Technologies Ltd. 2018, 2019.  All Rights Reserved.
 *
 *	Note to U.S. Government Users Restricted Rights:  
 *	Use, duplication or disclosure restricted by GSA ADP
 *	Schedule Contract with IBM Corp. 
 *
 */

/**
 * List of form elements type
 */
var inputTypes = ["button", "checkbox", "radio", "email", "file", "image",
                  "password", "reset", "submit", "text", "url"];

var inputTypesHTML5 =  ["color", "date", "datetime-local", "month", "time",
                        "week", "number"];

var inputAttrsHTML5 = ["list"];

/**
 * List of frame elements
 */
var frameElements =  ["frame", "iframe"];

/**
 * Click event that is listened
 */
var RMOT_TRIGGER_EVENT="onmouseup"; //Changed from "onclick" to take care of missing statements
var RMOT_DOWN_EVENT="onmousedown"; // 50088
if (jsUtil.isTouchEnabled()) { // Mobile only
	RMOT_TRIGGER_EVENT = "ontouchend";
	RMOT_DOWN_EVENT="ontouchstart";
}
var RMOT_DBLCLICK_EVENT = "ondblclick";


/**
 * Events applied to the body element. 
 */
var bodyEvents = [ 		"onafterprint",
							"onbeforeprint",
							"onbeforeonload",
							"onerror",
							"onhashchange",
							"onload",
							"onmessage",
							"onoffline",
							"ononline",
							"onpagehide",
							"onpageshow",
							"onpopstate",
							"onredo",
							"onresize",
							"onstorage",
							"onundo",
							"onunload" ];
				
/**
 * Events applied to all HTML5 elements, but is most common in form elements.
 */
var formEvents = [  		"onblur",
							"onchange",
							"oncontextmenu",
							"onfocus",
							"onformchange",
							"onforminput",
							"oninput",
							"oninvalid",
							"onreset", // HTML4 only
							"onselect",
							"onsubmit" ];

/**
 * Keyboard events applied to all HTML5 elements.
 */
var keyboardEvents = [		"onkeydown",
							"onkeypress",
							"onkeyup" ];

/**
 * Mouse events applied to all HTML5 elements.
 */
var mouseEvents = [			"onclick",
							"ondblclick",
							"ondrag",
							"ondragend",
							"ondragenter",
							"ondragleave",
							"ondragover",
							"ondragstart",
							"ondrop",
							"onmousedown",
							"onmousemove",
							"onmouseout",
							"onmouseover",
							"onmouseup",
							"onmousewheel",
							"onscroll" ];

/**
 * Media events applied to all HTML5 elements, but is most common 
 * in media elements.
 */
var mediaEvents = [			"onabort",
							"oncanplay",
							"oncanplaythrough",
							"ondurationchange",
							"onemptied",
							"onended",
							"onerror",
							"onloadeddata",
							"onloadedmetadata",
							"onloadstart",
							"onpause",
							"onplay",
							"onplaying",
							"onprogress",
							"onratechange",
							"onreadystatechange",
							"onseeked",
							"onseeking",
							"onstalled",
							"onsuspend",
							"ontimeupdate",
							"onvolumechange",
							"onwaiting"	];


/*
 * htmlProxyMap is the crux of HTML recording. Key=TagName / Value=Proxy
 * Proxies handle events to register, event handlers, specific properties, action parameters...
 * If the HTML element doesnt find an entry in this map, it will be handled in a generic (default) way.
 */
var htmlProxyMap = {
		"default":"HtmlElementProxy",
		"editable":"HtmlEditableProxy",
		"body":"HtmlBodyProxy",
	    "a":"HtmlAProxy",
	    "summary":"HtmlAProxy",
	    "area":"HtmlAreaProxy",	
		"button":"HtmlSubmitProxy",
		"custom":"HtmlCustomProxy",
		"audio":"HtmlMediaProxy",
		"video":"HtmlMediaProxy",
		"input":"HtmlTextInputProxy",
		"inputtext":"HtmlTextInputProxy",
		"inputpassword":"HtmlTextInputProxy",
		"inputsearch":"HtmlTextSearchInputProxy",
		"inputfile":"HtmlInputFileProxy",
		"textarea":"HtmlTextAreaProxy",
		"inputradio":"HtmlCheckBoxRadioProxy",
		"inputcheckbox":"HtmlCheckBoxRadioProxy",
		"inputHTML5color":"HtmlInput5ColorProxy",
		"inputHTML5date":"HtmlInput5DateProxy",
		"inputHTML5datetime-local":"HtmlInput5DateProxy",
		"inputHTML5month":"HtmlInput5DateProxy",
		"inputHTML5time":"HtmlInput5DateProxy",
		"inputHTML5week":"HtmlInput5DateProxy",
		"inputHTML5number":"HtmlInput5Proxy",
		"inputHTML5list":"HtmlInput5Proxy",
		"inputrange":"HtmlInput5Proxy",
		"inputsubmit":"HtmlSubmitProxy",
		"inputreset":"HtmlSubmitProxy",
		"select":"HtmlSelectProxy",
		"option":"HtmlOptionProxy",
		"canvas":"HtmlCanvasProxy",
		"iframe":"HtmlFrameProxy",
		"frame":"HtmlFrameProxy",
		"svg":"HtmlSvgProxy",
		"defs":"HtmlSvgProxy",
		"path":"HtmlSvgProxy",
		"rect":"HtmlSvgProxy",
		"circle":"HtmlSvgProxy",
		"ellipse":"HtmlSvgProxy",
		"line":"HtmlSvgProxy",
		"polygon":"HtmlSvgProxy",
		"polyline":"HtmlSvgProxy",
		"text":"HtmlSvgProxy",
		"g":"HtmlSvgProxy",
		"td":"HtmlTableCellProxy",
		"th":"HtmlTableHeaderProxy"
};

function isFrameElement(element) {
	if (element && element.tagName && 
			frameElements.indexOf(element.tagName.toLowerCase()) >= 0) {
		try {
			var access = element.contentDocument || element.contentWindow.document;
		}
		catch (e) {}
		finally {
			var accessed = (access != undefined);
			if (!accessed) {
				// Security issue: frame's document is not in the current domain.
				if(typeof(crossScriptIFrames) != 'undefined' && crossScriptIFrames != null) {
					crossScriptIFrames.push(jsUtil.getXPath(element)); //collecting the cross scripting frames/iframes
				}
			}
			return accessed;
		}
	}
	return false;
}

function HtmlRecordEvent(element, eventName, event, dontUseEventTarget) {
	if (typeof dontUseEventTarget === 'undefined' || dontUseEventTarget === false) {
		element = event.target; // 43579
	}
	var proxy = domainManager.getProxy(element);

	webGuiRecorderInterfaceObj.recordEvent(event, eventName,
			proxy.getProperty(WebGuiConstants.TAGNAME_PROP),
			element, 
			proxy.getParameters());
	event.recorded = true;
}
/*
 *
 *	Licensed Materials - Property of IBM
 *
 *	IBM Rational Mobile Test
 *
 *	(C) Copyright IBM Corporation 2014, 2019. All Rights Reserved. 
 *  Copyright HCL Technologies Ltd. 2018, 2019.  All Rights Reserved.
 *
 *	Note to U.S. Government Users Restricted Rights:  
 *	Use, duplication or disclosure restricted by GSA ADP
 *	Schedule Contract with IBM Corp. 
 *
 */

var HTML_DOMAIN_NAME = "html";

HTMLDomain = function() {
	BaseDomain.apply(this,arguments);
};

HTMLDomain.prototype = new BaseDomain();

HTMLDomain.prototype.init=function() {
	domainManager.registerDomain(this);
}

/*
 * Returns the proxy object for the element passed
 */
HTMLDomain.prototype.getProxy = function(element) {
	if (element == undefined || element == null) {
		return null;
	}
	var tagName = (element.tagName) ? element.tagName.toLowerCase() : "";
	var proxy = null, proxyClass = null;
	switch (tagName) {
		case "input" :
			if (inputTypesHTML5.indexOf(element.type) >= 0) { 
				tagName = "inputHTML5" + element.type.toLowerCase();
				break;
			}
			// check for supported HTML 5 attributes for input element
			if (inputAttrsHTML5 != null && inputAttrsHTML5.length > 0) {
				for (var i = 0; i < inputAttrsHTML5.length; i++) {
					if (element[inputAttrsHTML5[i]] != null) {
						tagName = "inputHTML5" + inputAttrsHTML5[i];
						break;
					}
				}
				if (jsUtil.startsWith(tagName, "inputHTML5")) {
					break;
				}
			}
			
			tagName += element.type;
			if (!htmlProxyMap[tagName]) {
				tagName = "input";
			}
			break;
	}
	
	if (jsUtil.applySimpleOperator(tagName, '-', 'TContains')) {
		tagName = 'custom';
	}
	if (htmlProxyMap[tagName]) {
		proxyClass = htmlProxyMap[tagName];
	} else {
		proxyClass = (element.isContentEditable) ? htmlProxyMap["editable"] : htmlProxyMap["default"];
	}
	
	if (proxyClass != null) {
		proxy = jsReflect.createObject(this, element, proxyClass, tagName);
	}
	return proxy;
};

/*
 * Returns the name of the domain ="html"
 */
HTMLDomain.prototype.getDomainName=function() {
	return HTML_DOMAIN_NAME;
};
/*
 *
 *	Licensed Materials - Property of IBM
 *
 *	IBM Rational Mobile Test
 *
 *	(C) Copyright IBM Corporation 2016, 2019. All Rights Reserved. 
 *  Copyright HCL Technologies Ltd. 2018, 2021.  All Rights Reserved.
 *
 *	Note to U.S. Government Users Restricted Rights:  
 *	Use, duplication or disclosure restricted by GSA ADP
 *	Schedule Contract with IBM Corp. 
 *
 */

var HTML_INPUT = "input";
var HTML_INPUTRADIO = "inputradio";
var HTML_TEXTAREA = "textarea";
var HTML_DEFAULT = "default";
var HTML_EVENT = "Event";
var HTML_MOUSE_EVENT = "MouseEvents";
var HTML_KEYBOARD_EVENT = "KeyboardEvent";
var HTML_TEXT_EVENT = "TextEvent";
var HTML_SELECT = "select";
var HTML_BUTTON = "button";
var HTML_ANCHOR ="a";
var HTML_IMAGE = "img";
var HTML_OBJECT = "object";
var HTML_EMBED = "embed";
var HTML_BODY = "body";
/* apparently the following constants are not useful since not used! */

var HTML_INPUTTEXT = "inputtext";
var HTML_INPUTSUBMIT = "inputsubmit";


var traversal = {
		LEFT : 0, /* search previous sibling*/
		RIGHT : 1, /* search next sibling*/
		TOP : 2,
		BOTTOM : 3
};

var PADDING = 14;
var TEXTNODE = 3;
var ELEMENTNODE = 1;
var labelNodes = [ELEMENTNODE ,TEXTNODE];
//the following tags act as label terminators
var labelTerminators = [HTML_BUTTON,
                        HTML_SELECT,
                        HTML_TEXTAREA,
                        HTML_INPUT,
                        HTML_IMAGE,
                        HTML_OBJECT,
                        HTML_ANCHOR,
                        HTML_EMBED,
                        HTML_BODY];

var labelSkippers = ["script"];

var HtmlElementProxy = function(domainObj, element, proxyClass, proxyName) {
	if (arguments.length == 0) {
		return; // don't do anything
	}

	this.element = element;
	this.target = null;
	this.domainObj = domainObj;
	this.proxyClass = proxyClass;
	this.proxyName = proxyName;
	this.curParent = null;
	this.stopTraversing = false;
	
	// 56670: Save original event handlers by attaching them to the element
	if (!this.element.rmotOriginalHandler) this.element.rmotOriginalHandler = new Array ();
};

HtmlElementProxy.prototype.applyDecoratedProps = function (targetElement) {

	targetElement.tagname = this.getProperty(WebGuiConstants.TAGNAME_PROP);

	targetElement.content = this.element.content;

	// TODO: could be replaced by targetElement.content = this.element.content
	// Let these lines as they may be used by Dojo/Jquery UI proxies.
	targetElement.content = (this.element.RMoTcontent!= undefined) ? 
			this.element.RMoTcontent : (this.element.content) ? 
					this.element.content : ""; 

	targetElement.enabled = this.getProperty(WebGuiConstants.ENABLED_PROP);
};

HtmlElementProxy.prototype.getLabel = function (trav,direction) {
	var label="";
	var results = jsUtil.findElementAll("*", "for", this.element.id);
	if(results == null || results.length <= 0){
		results = jsUtil.findElementsInOwnerDoc(this.element,"*", "for", this.element.id);
	}
	if(results!= null && results.length > 0){
		if( typeof(trav)!='undefined' && trav ){
			this.isValidLabel(results[0],direction);
			label =  this.bestComputedLabel();
		}
		else{
			label = results[0].textContent;
		}
		
	}
	return label;
};

HtmlElementProxy.prototype.computeLabel = function (direction) {

	var textContent = jsUtil.getTrimText(this.element);
	this.curParent = this.element;
	var maxParent = this.computeParent(textContent,this.element);
 var label = this.bestComputedLabel();
 while( maxParent && (typeof(label)=='undefined' || label == null || label == "") && !this.stopTraversing){
	 while(this.curParent != maxParent){
		 var curElement = this.curParent;

		 while(curElement ){
			 if(curElement.nodeType == ELEMENTNODE && (curElement != this.element) && (labelTerminators.indexOf(curElement.tagName.toLowerCase())>=0) ){
				 this.stopTraversing = true;
				 return ;
			 }
			 var sibText = jsUtil.getTrimText(curElement);
			 if (textContent != sibText && !jsUtil.is_all_ws(curElement)){
				 this.isValidLabel(curElement,direction);
			 }
			 var temp = null;
			 if(direction == traversal.LEFT){
				 temp = curElement.previousSibling;
			 }
			 else{
				 temp = curElement.nextSibling;
			 }
			 //WI 54448: PreviousElemntSibling and nextElemntSibling support for text nodes is unavailable in IE browser.
			 while(temp && labelNodes.indexOf(temp.nodeType)<0){
				 if(direction == traversal.LEFT){
					 temp = temp.previousSibling;
				 }
				 else{
					 temp = temp.nextSibling;
				 }
			 }
			 curElement = temp;
			 if(curElement && curElement.nodeType == ELEMENTNODE){
				 if(this.containsTerminator(curElement)){
					 this.stopTraversing = true;
					 return this.bestComputedLabel();
				 }	
			 }

		 }		
		 // go to parent until max parent
		 this.curParent = this.curParent.parentElement;
	 }
	 this.isValidLabel(maxParent,direction);
	 label = this.bestComputedLabel();
	 textContent = jsUtil.getTrimText(maxParent);
	 maxParent = this.computeParent(textContent,maxParent);
 }
 return label;
};

HtmlElementProxy.prototype.containsTerminator = function (curElement) {
	if(curElement.hidden){
		return true;
	}

	var inputs = curElement.querySelectorAll([tagName ="INPUT"]);
	if(inputs.length > 0 && inputs[0] != this.element){
		return true ;
	}
	return false;
}
//Find a parent whose text Content is diff than the input text
HtmlElementProxy.prototype.computeParent = function (textContent,current) {
	if(current)
	{
		var parent = current.parentElement;
		this.curParent = current;
		var parText = parent?jsUtil.getTrimText(parent):null;
		while (parent && (textContent == parText || jsUtil.is_all_ws(parent))) {
			parent = this.computeParent(textContent,parent);
			if(parent){
				parText = jsUtil.getTrimText(parent);
			}
		}
		return parent;
	}
	return null;
};

//Check if the label is alligned properly to the input text
HtmlElementProxy.prototype.isValidLabel = function (tentativeLabel,direction) {
	
	if(tentativeLabel.nodeType == TEXTNODE){
		if(!this.leftLabel)
			this.leftLabel = jsUtil.getTrimText(tentativeLabel);
	}
	else{
		
		// only for tentativeLabel object of type 'LABEL'
		// since its obvious that they contain some text node within
		// otherwise continue the search for label
		// the text content could have newline markers with lot of white spaces in between
		// so its trimmed for best visual representation
		var _label = (tentativeLabel.tagName == "LABEL" && tentativeLabel.textContent) ? tentativeLabel.textContent.trim().replace(/\n/g, ' ').replace(/\s\s+/g,' ') : "" ;

		if (_label && _label != "") {
			this.leftLabel = this.topLabel = this.bottomLabel = _label;
		}
		
		var elemCoords = this.getCoordinates();
		
		var labelCoords = domainManager.getProxy(tentativeLabel).getCoordinates();
		//WI 53982: Check if the label falls within the below category
		// a) Smaller than the control or
		// b) Not larger than the PADDING value
		if(this.isSmallerLabel(labelCoords,elemCoords) || this.isBiggerLabel(labelCoords,elemCoords))
		{
			if(direction == traversal.LEFT && elemCoords.left > labelCoords.left){
				if(!this.leftLabel){
					this.leftLabel = this.getLabelText(tentativeLabel,"",traversal.LEFT);
				}
			}
			else if(direction == traversal.RIGHT && elemCoords.left < labelCoords.left){
				if(!this.leftLabel){
					this.leftLabel = this.getLabelText(tentativeLabel,"",traversal.RIGHT);
				}
			}
		}
		else if( Math.abs(labelCoords.left - elemCoords.left)  <= PADDING )
		{
			if(direction == traversal.LEFT && elemCoords.top > labelCoords.top){
				if(!this.topLabel){
					this.topLabel =  this.getLabelText(tentativeLabel,"",traversal.TOP);
				}
			}
				else if(direction == traversal.RIGHT && elemCoords.top < labelCoords.top){
					if(!this.bottomLabel){
						this.bottomLabel = this.getLabelText(tentativeLabel,"",traversal.BOTTOM);
					}
				}
		}
	}
};
//Check for child element to get exact alligned text
//while start not == null start.prevSibling
	//if text node append to label else get previousElemntSibling make sure its not  a special char . trim it
	// if non label candidates stop loop and return
	//if hidden or labelSkipCandidates go to previous 
	//else check alignment and add to label accordingly
HtmlElementProxy.prototype.getLabelText = function (tentativeLabel,lbl,trav) {
	//single node so its a valid label
	if(tentativeLabel.hidden){
		return lbl;
	}
	if(tentativeLabel.childElementCount == 0){
		return	jsUtil.is_all_ws(tentativeLabel)?lbl:jsUtil.getTrimText(tentativeLabel) + lbl;
	}
	//traverse from end
	var start = tentativeLabel.lastChild;
	if(tentativeLabel.contains && tentativeLabel.contains(this.element)){
		var temp = this.element;
		if(trav == traversal.LEFT || trav == traversal.TOP){
			start = temp.previousSibling;
		}
		else{
			start = temp.nextSibling;
		}
		while(!start){
			temp = temp.parentElement;
			if(trav == traversal.LEFT || trav == traversal.TOP){
				start = temp.previousSibling;
			}
			else{
				start = temp.nextSibling;
			}
		}
	}
	while(start && !this.stopTraversing){
		if(start.nodeType == TEXTNODE){
			lbl = 	jsUtil.is_all_ws(start)?lbl:jsUtil.getTrimText(start) + lbl;
		}
		else if(start.nodeType == ELEMENTNODE && labelTerminators.indexOf(start.tagName.toLowerCase())>=0){
			this.stopTraversing = true;
			return lbl;
		}
		else if(start.nodeType == ELEMENTNODE && labelSkippers.indexOf(start.tagName.toLowerCase())< 0 && !this.isHidden(start,trav)){
			if(start.childElementCount >0){
				lbl = this.getLabelText(start,lbl,trav);
			}
			else{
				lbl = 	jsUtil.is_all_ws(start)?lbl:jsUtil.getTrimText(start) + lbl;
			}
		}
		if(trav == traversal.LEFT || trav == traversal.TOP){
			start = start.previousSibling;
		}
		else{
			start = start.nextSibling;
		}
		
	}
	return lbl;
}

HtmlElementProxy.prototype.isHidden = function (start,trav) {
	if(start.hidden){
		return true;
	}
	var elemCoords = this.getCoordinates();
	var labelCoords = domainManager.getProxy(start).getCoordinates();
	if(traversal.LEFT == trav || traversal.RIGHT == trav){
		if(this.isSmallerLabel(labelCoords,elemCoords) || this.isBiggerLabel(labelCoords,elemCoords))
		{
			if(traversal.LEFT == trav && elemCoords.left > labelCoords.left){
				return false;
			}
			else if(traversal.RIGHT == trav && elemCoords.left < labelCoords.left){
				return false;
			}
		}
	}
	else if(Math.abs(labelCoords.left - elemCoords.left)  <= PADDING ){
		return false;
	}
	return true;
}
HtmlElementProxy.prototype.isSmallerLabel = function (labelCoords,elemCoords) {
	if((labelCoords.top > elemCoords.top) && (labelCoords.bottom <elemCoords.bottom))
		return true;
	return false;
};

HtmlElementProxy.prototype.isBiggerLabel = function (labelCoords,elemCoords) {
	if (( Math.abs(labelCoords.top - elemCoords.top)  <= PADDING) && ( Math.abs(labelCoords.bottom - elemCoords.bottom)  <= PADDING) )
		return true;
	return false;
};
HtmlElementProxy.prototype.installWrappers = function () {
	if (this.element && this.element.nodeType == window.Node.ELEMENT_NODE) {
		var events = this.getEventsToRegister();
		// for all defined events install the HTML wrapper
		for (var i=0; i < events.length; i++) {
			this.installEventWrapper(events[i], this.handleEvent);
		}	
		return true;
	}
	return false;
};

HtmlElementProxy.prototype.installMutationObserver = function (eventName) {
	if (!this.element["$mutationObserverInstalled"]) {
		this.element["$mutationObserverInstalled"] = true;
		
		rmotObserver.observe(this.element, {
			attributes: true
		});
		
		this.element.addEventListener("scroll", function() { rmotRecorder.cacheScreenshot(); }, false);
	}		
};

HtmlElementProxy.prototype.shouldWrapEvent = function (eventName, element) {
	// Wrap RMOT_DOWN_EVENT (if needed) or RMOT_TRIGGER_EVENT, not both
	if (eventName === RMOT_DOWN_EVENT) {
		if (element[eventName] || jsUtil.isDijitControl(element) || jsUtil.isSapLS()) {
			// Flag the element and its descendants
			element.rmotMouseDownRequired = true;
			var descendants = element.querySelectorAll("*");
			for (var i = 0; i < descendants.length; i++) {
				descendants[i].rmotMouseDownRequired = true;
			}
		}
		else if (!element.rmotMouseDownRequired) return false;
	}
	
	if (eventName === RMOT_TRIGGER_EVENT && element.rmotMouseDownRequired) {
		// Do not wrap RMOT_TRIGGER_EVENT if RMOT_DOWN_EVENT is already wrapped
		return false;
	}
	
	return true;
};

HtmlElementProxy.prototype.removeCallPrototype = function (eventName, element) {
	if (eventName === RMOT_DOWN_EVENT
			&& element.rmotOriginalHandler[eventName] === null) {
		element[eventName].call = null; // TP-66936
	}
};

HtmlElementProxy.prototype.eventHandler = function(event) {
	
	var eventName = RMoTeventPrefix + event.type;
	event.recorded = event.recorded || jsUtil.isDownEventRecorded(eventName);

	// if already handled then ignore the event
	
	if (jsUtil.isTrusted(event, eventName) && !event.recorded && !event.corrected) {
		// Get proxy for both element and event.target then call the appropriate event handler
		var checkedElts = [this, event.target];
		for (var j = 0; j < checkedElts.length; j++) {
			var elt = checkedElts[j];
			var proxy = domainManager.getProxy(elt);
			// Only record events that are listed in htmlMap for the target element
			var targProxy = domainManager.getProxy(event.target);
			if ((targProxy && targProxy.getEventsToRegister().indexOf(eventName) >= 0) && !proxy.isWidgetChild) {
				proxy.handleEvent(this, eventName, event);
			}

			if (event.recorded) {
				jsUtil.setDownEventRecorded(eventName);
				break;
			}
		}
	}

	var ret = true;
	if (this.rmotOriginalHandler[eventName] != null) {
		ret = this.rmotOriginalHandler[eventName].apply(this, arguments);
	}
	this.proxy.domainObj._parseDocument();

	return ret;
};

HtmlElementProxy.prototype.installEventWrapper = function (eventName, handler) {
	
	if (!this.shouldWrapEvent(eventName, this.element)) return;
	
	if (!jsUtil.fnCompare(this.element[eventName], HtmlElementProxy.prototype.eventHandler)) {
		this.element.rmotOriginalHandler[eventName] = this.element[eventName];
		this.element[eventName] = HtmlElementProxy.prototype.eventHandler;
		this.removeCallPrototype(eventName, this.element); // TP-66936
	}		
};

HtmlElementProxy.prototype.getEventsToRegister = function() {
	return [RMOT_DOWN_EVENT, RMOT_TRIGGER_EVENT, RMOT_DBLCLICK_EVENT];
};

HtmlElementProxy.prototype.handleEvent = function(element, eventName, event) {
	if (eventName == RMOT_TRIGGER_EVENT) {
		this.clickRecorded = true;
	}
	else if (eventName == RMOT_DBLCLICK_EVENT) {
		if (this.clickRecorded) {
			return;
		}
	}
	HtmlRecordEvent(element, eventName, event, false);
};

HtmlElementProxy.prototype.getComputedStyle = function(propName) {
	var computedStyle = "";
	var mainWindow = jsUtil.getMainWindow();
	if (mainWindow && mainWindow.getComputedStyle) {
		var ret = mainWindow.getComputedStyle(this.element);
		if (ret != null) {
			computedStyle = ret.getPropertyValue(propName);
		}
	}
	return computedStyle;

};


HtmlElementProxy.prototype.getProperty = function(propName) {
	var propValue = "";
	if (propName == WebGuiConstants.TAGNAME_PROP) {
		propValue = this.getTagName();
	} 
	else if (propName == WebGuiConstants.CONTENT_PROP) {
		propValue = jsUtil.getInnerText(this.element);
	}
	else if (propName == WebGuiConstants.ENABLED_PROP) {
		var disabled = this.element.disabled;
		propValue = (disabled) ? !disabled : true;
	} 
	else if (propName == WebGuiConstants.XPATH_PROP) {
		propValue = jsUtil.getXPath(this.element);
	}  
	else if (propName == WebGuiConstants.LABEL_PROP) {
		propValue = this.getLabel();
	}  
	else if (RMoTstylesArray.indexOf(propName) >= 0) {
		propValue = this.getComputedStyle(propName);
	} 
	else if ((propName == "top") || (propName == "right") || 
			(propName == "bottom") || (propName == "left")) {
		var rect = this.element.getBoundingClientRect();
		if (rect) {
			if (propName == "left") propValue = "" + rect.left;
			if (propName == "right") propValue = "" + rect.right;
			if (propName == "bottom") propValue = "" + rect.bottom;
			if (propName == "top") propValue = "" + rect.top;
		}
	} 
	else if (propName == "visible") {
		propValue = "" + this.isVisible().visibility;
	} 
	else {
		if (this.element && this.element.attributes) {
			for (var i=0; i < this.element.attributes.length; i++) {
				var attr = this.element.attributes[i];
				if (attr != null) {
					if (attr.name == propName) {
						propValue = attr.value;
						break;
					}
				}
			}
		}
	}
	return propValue;
};

HtmlElementProxy.prototype.getTagName =  function() {
	var tagName = this.element.tagName;
	return (tagName) ? tagName.toLowerCase() : null;
}

HtmlElementProxy.prototype.getProxyName =  function() {
	if (this.proxyName)
		return this.proxyName;

	var elementTagName = this.getTagName();
	return (elementTagName) ? elementTagName : null;
};

HtmlElementProxy.prototype.getUID = function(id) {
	this.UID = (id) ? id : this.UID;
	return "" + this.UID;
};

HtmlElementProxy.prototype.getCoordinates =  function() {
	var element = this.element;
	if (element.nodeType == window.Node.ELEMENT_NODE) {
		var rect = element.getBoundingClientRect();
		if (rect && element.nodeType) {
			var ownerRect = jsUtil.getOwnerDocumentCoordinates(element);
			var ratio = browserDetails.pixelRatio;
			return {left:(ownerRect.left + rect.left) / ratio,
				top:(ownerRect.top + rect.top) / ratio,
				right:(ownerRect.right + rect.right) / ratio,
				bottom:(ownerRect.bottom + rect.bottom) / ratio};
		}	
	}

	return {left:0,top:0,right:0,bottom:0};
};

HtmlElementProxy.prototype.isVisible =  function() {
	var ret = { visibility: true, propagation: false, reachable: true };

	if (this.element != this.element.ownerDocument.body) {
		// Check whether the element is displayed
		if (this.getComputedStyle('display') == 'none') { 
			ret.visibility = false;
			ret.propagation = true;
			ret.reachable = false;
		}
		else {
			// Check whether the element is hidden
			if (this.getComputedStyle('visibility') == 'hidden') {
				ret.visibility = false;
				ret.reachable = false;
			}
			else {
				// Check whether the element has an area > 0 
				if (this.element.offsetWidth === 0 ||
						this.element.offsetHeight === 0) {
					ret.visibility = false;
					ret.reachable = false;
				}
				else {
					if (!jsUtil.isInViewPort(this.element, this.element.getBoundingClientRect())
							|| !jsUtil.isOnTop(this.element)) {
						// Check whether the element is in the viewport and underneath another element
						ret.visibility = false;
					}
				}
			}
		}
	}

	// Make the Drop-down options not reachable for desktop to 
	// bring the recorder output in sync with Mobile webgui drop down
	if (ret.reachable && this.element.tagName && 
			this.element.tagName.toLowerCase() == "option") {
		ret.reachable = false;
	}

	return ret;
};


HtmlElementProxy.prototype.isContainer =  function() {
	//TODO: create a proxy for the Dojo scrollbar and overload the isContainer method
	if (this.getProperty('class') == 'mblScrollBarWrapper')
		return false;
	else
		return true;
};

HtmlElementProxy.prototype.setWidgetChild = function(children){
	for (var i = 0; i < children.length; i++) {
		var child = children[i];
		var proxy = domainManager.getProxy(child);
		proxy.isWidgetChild=true;
	}
}

HtmlElementProxy.prototype.getParameters =  function() {
	var parameters = {};
	parameters.enableasyncaction = false;
	return parameters;
};

//List of properties that needs to be saved in case the listened event comes too late.
//e.g. : checked prop for checkboxes or content for selects
HtmlElementProxy.prototype.getPropertiesToSave =  function() {
	return [];
};

// Chromium Hack to override which and keyCode event properties
HtmlElementProxy.prototype.overrideKeyboardProps = function(event) {
	Object.defineProperty(event, 'keyCode', {
				get : function() {
					return this.keyCodeVal;
				}
	});     
	Object.defineProperty(event, 'which', {
				get : function() {
					return this.keyCodeVal;
				}
	});
};

HtmlElementProxy.prototype.dispatchEvent = function(event) {
	var e = this.target.ownerDocument.createEvent(event);
	if (event == HTML_KEYBOARD_EVENT) {
		if (e.initKeyboardEvent) {
			if (this.target.autocomplete != '')	this.overrideKeyboardProps(e);
			e.initKeyboardEvent.apply(e, Array.prototype.slice.call(arguments, 1));
		} else {
			e.initKeyEvent.apply(e, Array.prototype.slice.call(arguments, 1));
		}
	} else if(event == HTML_MOUSE_EVENT) {
		if (jsUtil.isRunningInsideIEBrowser()) {
			e.initEvent.apply(e, Array.prototype.slice.call(arguments, 1));
		} else {
			e.initMouseEvent.apply(e, Array.prototype.slice.call(arguments, 1));
		}
	} else if (event == HTML_TEXT_EVENT) {
		e.initTextEvent.apply(e, Array.prototype.slice.call(arguments, 1));
	} else {
		e.initEvent.apply(e, Array.prototype.slice.call(arguments, 1));
	}
	this.target.dispatchEvent(e);
};


HtmlElementProxy.prototype.setTarget = function(thisTarget) {
	this.target = thisTarget;
};

HtmlElementProxy.prototype.getTarget = function() {
	return (this.target != null) ? this.target : this.element;
};

HtmlElementProxy.prototype.click = function() {
	// 52634 it would seem that Android 5.1 tries to implment the "_blank" value of "target" html attribute
	// means that the target of the link must be opened in another window
	if ( ! jsUtil.isDesktop()) {
		var _target = this.target.getAttribute('target');
		if (typeof(_target) == "string") {
			if (_target == "_blank") {
				this.target.target = "_self";
			}
		}
	}

	this.hover();
	if (jsUtil.isTouchEnabled()) this.touch(); // 51146
	this.mouseClick();
	return RMOT_SUCCESS;
};

HtmlElementProxy.prototype.mouseClick = function() {
	var ownerDoc = this.target.ownerDocument;
	var ownerWin = ownerDoc.defaultView;
	this.dispatchEvent(HTML_MOUSE_EVENT, 'mousedown', true, true, ownerWin,
			0, 0, 0, 0, 0, false, false, false, false, 0, null);
	this.dispatchEvent(HTML_MOUSE_EVENT, 'mouseup', true, true, ownerWin,
			0, 0, 0, 0, 0, false, false, false, false, 0, null);
	this.dispatchEvent(HTML_MOUSE_EVENT, 'click', true, true, ownerWin,
			0, 0, 0, 0, 0, false, false, false, false, 0, null);
};

HtmlElementProxy.prototype.dblclick = function() {
	var ownerDoc = this.target.ownerDocument;
	var ownerWin = ownerDoc.defaultView;
	this.dispatchEvent(HTML_MOUSE_EVENT, 'dblclick', true, true, ownerWin, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
	return RMOT_SUCCESS;
};

HtmlElementProxy.prototype.rightclick = function() {
	var ownerDoc = this.target.ownerDocument;
	var ownerWin = ownerDoc.defaultView;
	var elmRect = this.getCoordinates();
	var ptX = elmRect.left + ((elmRect.right - elmRect.left)/2);
	var ptY = elmRect.top + ((elmRect.bottom - elmRect.top)/2);
	this.dispatchEvent(HTML_MOUSE_EVENT, 'contextmenu', true, true, ownerWin,
			1, 0, 0, ptX, ptY, false, false, false, false, 2, null);
	return RMOT_SUCCESS;
};

HtmlElementProxy.prototype.hover = function() {
	var ownerDoc = this.target.ownerDocument;
	var ownerWin = ownerDoc.defaultView;
	this.dispatchEvent(HTML_MOUSE_EVENT, 'mouseover', true, true, ownerWin,
			0, 0, 0, this.getCoordinates().left, this.getCoordinates().top, false, false, false, false, 0, null);
	return RMOT_SUCCESS;
};

HtmlElementProxy.prototype.tap = function() {
	LoggerService.logMsg(RMoTTrace, 'HtmlElementProxy.prototype.tap()');
	if (window.jQuery) {
		var jquery = jQuery(this.getTarget());
		if (jquery != undefined && jquery != null) {
			try {
				jquery.trigger('tap');
			}
			catch(e) {
				LoggerService.logMsg(RMoTTrace, 'HtmlElementProxy.prototype.tap() cannot be performed');
			}
		}
	}
	return RMOT_SUCCESS;
};

HtmlElementProxy.prototype.touch = function() {
	LoggerService.logMsg(RMoTTrace, 'HtmlElementProxy.prototype.touch()');
	try {
		if (!domainManager.getDomainObj('dojo')) {
			this.dispatchEvent(HTML_MOUSE_EVENT, 'touchstart', true, true);
			this.dispatchEvent(HTML_MOUSE_EVENT, 'touchend', true, true);
		}
	}
	catch(e) {
		LoggerService.logMsg(RMoTTrace, 'HtmlElementProxy.prototype.touch() cannot be performed');
	}
	return RMOT_SUCCESS;
};

HtmlElementProxy.prototype.addCharacterToContent = function(character) {
	this.target.value += character;
	this.dispatchInputEvent('input');
};

HtmlElementProxy.prototype.enterKey = function(character) {
	var char = character.charCodeAt(0);
	this.dispatchEvent(HTML_KEYBOARD_EVENT, 'keydown', true, true, null, 0, 0, 0, 0, 0, char);
	this.dispatchEvent(HTML_KEYBOARD_EVENT, 'keypress', true, true, null, 0, 0, 0, 0, 0, char);
	this.addCharacterToContent(character);
	this.dispatchEvent(HTML_KEYBOARD_EVENT, 'keyup', true, true, null, 0, 0, 0, 0, 0, char);
};

HtmlElementProxy.prototype.deleteProperty = function(property) {
    var propertyDescriptor = Object.getOwnPropertyDescriptor(this.target, property);
    if (propertyDescriptor && propertyDescriptor.configurable) {
      try{
    	  delete this.target[property];
      } catch(e) {}
    }
};

HtmlElementProxy.prototype.clearElementContent = function() {
	this.deleteProperty('value');
	this.target.value = '';
};

HtmlElementProxy.prototype.enterText = function(text) {
	this.clearElementContent();
	for (var i = 0; i < text.length; i++) {
		this.enterKey(text[i]);
	}
	this.hasChanged = true; // Will dispatch a change event when next action is executed
	return RMOT_SUCCESS;
};


HtmlElementProxy.prototype.pressEnter = function() {
	if (!this.target) return RMOT_FAILURE;

	try {
		var form = (window.jQuery) ? jQuery(this.target.form) : this.target.form;
		if (form && form.submit	&& !this.target.classList.contains('ds-input')) {
			form.submit();
		}
		else {
			// No form to submit, then simulate Enter key events
			this.dispatchPressEnterKeyEvent();
		}
	}
	catch (e) {
		LoggerService.logMsg(RMoTTrace, 'HtmlElementProxy.prototype.pressEnter() cannot be performed');
		return RMOT_FAILURE;
	}
	
	return RMOT_SUCCESS;
};

HtmlElementProxy.prototype.dispatchPressEnterKeyEvent = function() {
	var ev = this.element.ownerDocument.createEvent('Event');
	ev.which = 13;
	ev.keyCode = 13;
	ev.initEvent('keydown', true, true);
	this.target.dispatchEvent(ev);
	ev.initEvent('keypress', true, true);
	this.target.dispatchEvent(ev);
	ev.initEvent('keyup', true, true);
	this.target.dispatchEvent(ev);
};


HtmlElementProxy.prototype.check = function(value) {
	this.click();
	if (this.target.checked) {
		var isTrue = (value.toLowerCase() === "true");
		this.target.checked = isTrue;
		return RMOT_SUCCESS;
	}
	return RMOT_FAILURE;
};

/*
 * dispatch "input" event. An input event can be: focus, blur, change, input
 * this function must be called with the event to dispatch, for example: this.dispatchInputEvent('change');
 */
HtmlElementProxy.prototype.dispatchInputEvent = function(evt) {
	var ev = this.element.ownerDocument.createEvent('Event');
	ev.initEvent(evt, true, true);
	this.target.dispatchEvent(ev);
};

HtmlElementProxy.prototype.change = function(value) {
	var ret = RMOT_INCONCLUSIVE;
	var selectedOptions = value.split(",\u200B ");
	var _wMax = 0;
	var _jMax = -1;
	for (var i in selectedOptions) {
		var selected = false;
		var found = RMOT_INCONCLUSIVE;
		for (var j = 0; j < this.target.options.length; j++) {
			var text = this.target.options[j].text;
			var _w = jsUtil.computeStringSimilarity(selectedOptions[i], text);
			if (_w == 10) {
				selected = true;
				found = RMOT_SUCCESS;
				break;
			} else if ((RMOT_GuidedHealing == true) && (_w >= 5)) {
				if (_w > _wMax) {
					_wMax = _w;
					_jMax = j;
				}
			} else {
				found = RMOT_FAILURE;
			}
		}
		if ((found != RMOT_SUCCESS) && ((RMOT_GuidedHealing == true)) && (_wMax >= 5)) {
			j = _jMax;
			selected = true;
			found = RMOT_RECOVERY;
		}
		if ((found != RMOT_FAILURE) && (this.target.options[j].selected !== selected)) {
			this.target.options[j].selected = selected;
			this.dispatchInputEvent('change');
		}

		if (found == RMOT_FAILURE)
			ret = RMOT_FAILURE;
		else if ((found == RMOT_RECOVERY) && (ret != RMOT_FAILURE))
			ret = RMOT_RECOVERY;
		else if ((found == RMOT_SUCCESS) && (ret != RMOT_FAILURE) && (ret != RMOT_RECOVERY)){
			ret = RMOT_SUCCESS;
			break;
		}
	}
	LoggerService.logMsg(RMoTTrace, 'HtmlElementProxy.prototype.change() returns ' + ret);
	return ret;
};

HtmlElementProxy.prototype.dispatchChangeEventAfterEnterText = function() {
	LoggerService.logMsg(RMoTTrace, 'HtmlElementProxy.prototype.dispatchChangeEventAfterEnterText()');
	var ownerDoc = this.target.ownerDocument;
	if (ownerDoc.activeElement) {
		var proxy = domainManager.getProxy(ownerDoc.activeElement);
		if (proxy.hasChanged) {
			proxy.dispatchInputEvent('change');
			proxy.dispatchInputEvent('blur');
			proxy.hasChanged = false;
		}
	}
};

HtmlElementProxy.prototype.executeAction = function(action) {
	LoggerService.logMsg(RMoTTrace, 'HtmlElementProxy.prototype.executeAction('+ action.type +')');
	var retStatus = RMOT_FAILURE;
	var actionType = action.type;
	if (this.target == null) this.setTarget(this.element);
	this.dispatchChangeEventAfterEnterText();
	if (typeof(this.target.focus) == "function") {
		this.target.focus();
	}

	switch (actionType) {
	case "onclick" :
		retStatus = this.click(); // TODO: check if settimeout(.. 0) is always necessary on iOS
		break;
	case "ontap" :
		retStatus = this.tap();
		break;
	case "ondblclick" :
		retStatus = this.dblclick();
		break;
	case "oninput" :
		retStatus = this.enterText(action.parameters[0].value);
		break;
	case "onkeypress" :
	case "onkeydown" :
		retStatus = this.pressEnter();
		break;
	case "oncheck" :
		retStatus = this.check(action.parameters[0].value); //TODO: generate a test for this action
		break;
		// Even if "onchange" is available for drop down list only I make the choice to implement it at the low level 
	case "onchange" :
		retStatus = this.change(action.parameters[0].value);
		break;
	case "onmouseover" :
		retStatus = (jsUtil.isDesktop()) ? this.hover() : this.click();
		break;
	case "onrightclick" :
		retStatus = this.rightclick();
		break;
	default:
		break;
	}
	return retStatus;
};


HtmlElementProxy.prototype.getRepeatedAction = function () {
	return null;
};

/*
 * 53500 - Android specific
 * Do not perform ghost click if click event is received before.
 */
HtmlElementProxy.prototype.installGhostClickWrapper = function() {
	if (!RMoTAndroid) return;

	var eventName = "onclick";
	if (!this.element[eventName + "$alreadyInstalled"]) {
		this.element[eventName + "$alreadyInstalled"] = true;
		this.element.rmotOriginalHandler[eventName] = this.element[eventName];
		this.ghostClicktimer = null; // init

		this.element[eventName] = function(event) {
			var ret = true;
			if (this.rmotOriginalHandler[eventName] != null) {
				ret = this.rmotOriginalHandler[eventName].apply(this, arguments);
			}
			clearTimeout(this.proxy.ghostClicktimer);
			this.proxy.ghostClicktimer = null;
			return ret;
		};	
	}
};

/*
 * 53500 - Android specific
 * Send a ghost click after 300ms.
 */
HtmlElementProxy.prototype.ghostClick = function(event) {
	if (!RMoTAndroid) return;

	if (!(event && RMoTeventPrefix + event.type == RMOT_TRIGGER_EVENT)) return;

	if (this.ghostClicktimer == null) {
		var proxy = this;
		this.ghostClicktimer = setTimeout(function() {
			proxy.target = event.target;
			proxy.mouseClick();
			proxy.domainObj._parseDocument();
		}, 300);
	}
};
/*
 *
 *	Licensed Materials - Property of IBM and/or HCL
 *
 *	IBM Rational Mobile Test
 *
 *	(C) Copyright IBM Corporation 2019. 
 *  Copyright HCL Technologies Ltd. 2019.  All Rights Reserved.
 *
 *	Note to U.S. Government Users Restricted Rights:  
 *	Use, duplication or disclosure restricted by GSA ADP
 *	Schedule Contract with IBM Corp. 
 *
 */

HtmlCustomProxy = function(domainObj, element) {
	if (arguments.length == 0) return; // don't do anything
	HtmlElementProxy.apply(this, arguments);
};
HtmlCustomProxy.prototype = new HtmlElementProxy();

/*
 *
 *	Licensed Materials - Property of IBM and/or HCL
 *
 *	IBM Rational Mobile Test
 *
 *	(C) Copyright IBM Corporation 2014, 2016. All Rights Reserved. 
 *  (C) Copyright HCL Technologies Ltd. 2017. All Rights Reserved. 
 *
 *	Note to U.S. Government Users Restricted Rights:  
 *	Use, duplication or disclosure restricted by GSA ADP
 *	Schedule Contract with IBM Corp. 
 *
 */

HtmlEditableProxy = function(domainObj,element) {
	if (arguments.length == 0) return; // don't do anything
	HtmlElementProxy.apply(this,arguments);
};

HtmlEditableProxy.prototype = new HtmlElementProxy();

HtmlEditableProxy.prototype.getRepeatedAction = function () {
	// listened event: recorded event
	return {"onkeydown": "oninput"};
};

HtmlEditableProxy.prototype.getParameters = function () {
	var parameters = {};
	parameters.newtext = this.getProperty(WebGuiConstants.CONTENT_PROP);
	parameters.enableasyncaction = false;
	return parameters;
};

//HtmlEditableProxy.prototype.getPropertiesToSave = function() {
//	return [WebGuiConstants.CONTENT_PROP];
//};

HtmlEditableProxy.prototype.getEventsToRegister = function(){
	return [RMOT_DOWN_EVENT, RMOT_TRIGGER_EVENT, RMOT_DBLCLICK_EVENT, "onkeydown", "onkeyup"];
};

HtmlEditableProxy.prototype.handleEvent = function(element, eventName, event) {
	switch (eventName) {
	case RMOT_DBLCLICK_EVENT:
		break;
	case RMOT_TRIGGER_EVENT:
		if(event.clientX<=0 && event.clientY<=0) return;	// 44109
		if (!RMoTIOS) element.focus();
		break;
	case "onkeydown":
		if (event.keyCode == 13) { // need to capture enter key
			eventName="onkeypress";
		}
		else if(event.keyCode == 9){
			//Tab has been pressed and we would ignore the event
			return;
		}
		// else will be managed as a repeated action
		break;
	case "onkeyup":
		element.RMoTcontent = element.value;
		return;
	default:
		return;	// Do not record other events
	}
	HtmlRecordEvent(element, eventName, event);
};

HtmlEditableProxy.prototype.addCharacterToContent = function(character) {
	this.target.innerHTML += character;
	
	// known to work on Android and Desktop Firefox
	try {
		this.dispatchEvent(HTML_TEXT_EVENT, 'textInput', false, false, null, character);
	} catch (e) {
		LoggerService.logMsg(RMoTTrace, e + ' raised when simulating textInput event, stack: ' + (e.stack ? e.stack : 'not available'));
	}
	this.dispatchEvent(HTML_EVENT, 'input', false, false);
};

HtmlEditableProxy.prototype.clearElementContent = function() {
	this.target.innerHTML = '';
};
/*
 *
 *	Licensed Materials - Property of IBM
 *
 *	IBM Rational Mobile Test
 *
 *	(C) Copyright IBM Corporation 2014, 2019. All Rights Reserved. 
 *  Copyright HCL Technologies Ltd. 2018, 2019.  All Rights Reserved.
 *
 *	Note to U.S. Government Users Restricted Rights:  
 *	Use, duplication or disclosure restricted by GSA ADP
 *	Schedule Contract with IBM Corp. 
 *
 */

HtmlAProxy = function(domainObj,element) {
	if (arguments.length == 0) return; // don't do anything
	HtmlElementProxy.apply(this,arguments);
};

HtmlAProxy.prototype = new HtmlElementProxy();

HtmlAProxy.prototype.handleEvent = function(element, eventName, event) {	

	//Ignore the programmatic clicks on controls like link, audio, video which could appear as banners in the websites
	if (!jsUtil.isTrusted(event, eventName)) {
		event.recorded = true;
		return;
	}
	
	var proxy = domainManager.getProxy(element);
	
	if (proxy.isWidgetChild) {
		event.recorded = true;
		return;
	}
	
	// ensure that the event is recorded only if the element's proxy is same as current proxy
	// for e.g., in case of <body><a/></body> if click on <a> is not handled & its bubbled up
	// to <body> but the event target is still <a>, so if we haven't  installed wrappers on <a>
	// there is no reason to handle such an event.	
	if (proxy.proxyClass == this.proxyClass) {
		HtmlRecordEvent(element, eventName, event, /*dontUseEventTarget*/true);
	}
};
/*
 *
 *	Licensed Materials - Property of IBM
 *
 *	IBM Rational Mobile Test
 *
 *	(C) Copyright IBM Corporation 2014. All Rights Reserved. 
 *
 *	Note to U.S. Government Users Restricted Rights:  
 *	Use, duplication or disclosure restricted by GSA ADP
 *	Schedule Contract with IBM Corp. 
 *
 */

HtmlMediaProxy = function(domainObj, element) {
	if (arguments.length == 0) return; // don't do anything
	HtmlElementProxy.apply(this,arguments);
};

HtmlMediaProxy.prototype = new HtmlElementProxy();	

HtmlMediaProxy.prototype.installWrappers = function () {
	if (this.element && this.element.nodeType == window.Node.ELEMENT_NODE) {
		var events = this.getEventsToRegister();
		// for all defined events install the HTML wrapper
		for (var i=0; i < events.length; i++) {
			if (!this.element[events[i] + "$alreadyInstalled"]) {
				this.element[events[i] + "$alreadyInstalled"] = true;
				var proxy = this;
				this.element.addEventListener(events[i], function (e) {
					var eventName = RMoTeventPrefix + e.type;
					proxy.handleEvent(this, eventName, e);
				}, false);
			}
		}	
		return true;
	}
	return false;
};

HtmlMediaProxy.prototype.getEventsToRegister = function() {
	return ["pause", "playing"];
};

HtmlMediaProxy.prototype.handleEvent = function(element, eventName, event) {
	
	// Do not record pause if the end of the playback is reached
	if (element.ended == true) return;
	
	var proxy = domainManager.getProxy(element);
	if (proxy.isWidgetChild) {
		event.recorded = true;
		return;
	}
	HtmlRecordEvent(element, eventName, event);
};

HtmlMediaProxy.prototype._getProperty = HtmlMediaProxy.prototype.getProperty;
HtmlMediaProxy.prototype.getProperty = function(propName) {
	var propValue = "";
	if (propName == "content" || propName == "src") {
		propValue = this.element.currentSrc;
	} else {
		propValue = this._getProperty(propName);
	}
	return propValue; 
};

HtmlMediaProxy.prototype._applyDecoratedProps =
	HtmlMediaProxy.prototype.applyDecoratedProps;

HtmlMediaProxy.prototype.applyDecoratedProps = function( targetElement) {
		this._applyDecoratedProps(targetElement);		
		targetElement.src = this.getProperty("content");
};

HtmlMediaProxy.prototype.play = function() {
	this.element.play();
	return RMOT_SUCCESS;
};
		
HtmlMediaProxy.prototype.pause = function() {
	this.element.pause();
	return RMOT_SUCCESS;
};

HtmlMediaProxy.prototype._executeAction = HtmlMediaProxy.prototype.executeAction;
HtmlMediaProxy.prototype.executeAction = function(action) {
	
	var retStatus = RMOT_FAILURE;
	var actionType = action.type;

	switch (actionType) {
		case "onplaying" :
			retStatus = this.play();
			break;
		case "onpause" :
			retStatus = this.pause();
			break;	
		default:
			retStatus = this._executeAction(action);
	}
	return retStatus;
};
/*
 *
 *	Licensed Materials - Property of IBM
 *
 *	IBM Rational Mobile Test
 *
 *	(C) Copyright IBM Corporation 2014. All Rights Reserved. 
 *
 *	Note to U.S. Government Users Restricted Rights:  
 *	Use, duplication or disclosure restricted by GSA ADP
 *	Schedule Contract with IBM Corp. 
 *
 */

HtmlInput5Proxy = function(domainObj, element) {
	if (arguments.length == 0) return; // don't do anything
	HtmlElementProxy.apply(this,arguments);
	 leftLabel = null ;
	 topLabel = null ;
	 bottomLabel =null;
};

HtmlInput5Proxy.prototype = new HtmlElementProxy();

HtmlInput5Proxy.prototype._applyDecoratedProps = HtmlInput5Proxy.prototype.applyDecoratedProps;
HtmlInput5Proxy.prototype.applyDecoratedProps = function( targetElement) {
	targetElement.value = this.getProperty("value");
	targetElement.label = this.getProperty("label");
	this._applyDecoratedProps(targetElement);
};
	
HtmlInput5Proxy.prototype.getPropertiesToSave =  function() {
	return ["value"];
};

HtmlInput5Proxy.prototype._getProperty = HtmlInput5Proxy.prototype.getProperty;
HtmlInput5Proxy.prototype.getProperty = function(propName) {
	var propValue = "";
	if (propName == WebGuiConstants.CONTENT_PROP) {
		// intentionally blank, do not return anything
		// as we do not want to capture the content of the element
	}
	else if (propName == "value") {
		propValue = this.element.value;
	}
	else if (propName == "label"){
		propValue = this.getLabel();
	}
	else {
		propValue = this._getProperty(propName);
	}
	return propValue; 
};

HtmlInput5Proxy.prototype.getProxyName = function() {
	// all HTML 5 input elements are identified as inputtextfield per grammar
	return "inputtextfield";
};

HtmlInput5Proxy.prototype.getEventsToRegister = function() {
	return ["oninput"];
};

HtmlInput5Proxy.prototype._getLabel = HtmlInput5Proxy.prototype.getLabel;
HtmlInput5Proxy.prototype.getLabel = function () {
	var label="";
	//Compute label from the placeholder
	label = this.getProperty('placeholder');
	if( label == undefined || label == null || label == ""){
		//Compute Label from the For attribute defined
		label = this._getLabel();
		if (label == "") {
			if(this.leftLabel){
				label = this.leftLabel;
			}
			else{
				var direction = traversal.LEFT;
				if( jsUtil.isRTLLanguage() == true){
					direction = traversal.RIGHT;
				}
				label = this.computeLabel(direction);
			}
		}
	}

	return label;
};
//Priority index : Left > Top > Bottom
HtmlInput5Proxy.prototype.bestComputedLabel = function () {
	return this.leftLabel || this.topLabel || this.bottomLabel;
};

HtmlInput5Proxy.prototype.typeSupport = function() {
	// Replace entered value and check whether it is a valid one.
	var val = this.element.value;
	this.element.value = "#";
	var support = (this.element.value!="#");
	this.element.value = val;
	return support;
};

HtmlInput5Proxy.prototype.handleEvent = function(element, eventName, event) {
	var html5TypeSupport = this.typeSupport();
	if (eventName == "oninput") {
		HtmlRecordEvent(element, eventName, event);
		if (html5TypeSupport) {
			// Clear previous action if not yet performed in order to ignore intermediate values
			clearTimeout(this.handlerTimeOut); 
			this.handlerTimeOut = setTimeout(function() {
					var proxy = domainManager.getProxy(element);
					// 51155: Dump repeated action
					proxy.domainObj._recordEvent(event, RMoTstartEvent, null, element, null);
			}, 500);
		}
	}
};

HtmlInput5Proxy.prototype.getParameters = function () {
	var parameters = {};
	parameters.newtext = this.element.value;
	parameters.enableasyncaction = false;
	return parameters;
};

HtmlInput5Proxy.prototype._executeAction = HtmlInput5Proxy.prototype.executeAction;
HtmlInput5Proxy.prototype.executeAction = function(action) {
	var retStatus = RMOT_FAILURE;
	var actionType = action.type;

	if (actionType=='oninput') {
		var html5TypeSupport = this.typeSupport();
		if (html5TypeSupport && this.element.type != 'number') {
			this.element.value = action.parameters[0].value;
			this.setTarget(this.element);
			this.dispatchInputEvent('change');
			return RMOT_SUCCESS;
		}
	}
	return this._executeAction(action);
};

//Priority index : Left > Top > Bottom
HtmlInput5Proxy.prototype.bestComputedLabel = function () {
	return this.leftLabel || this.topLabel || this.bottomLabel;
};
/*
 *
 *	Licensed Materials - Property of IBM
 *
 *	IBM Rational Mobile Test
 *
 *	(C) Copyright IBM Corporation 2014. All Rights Reserved. 
 *
 *	Note to U.S. Government Users Restricted Rights:  
 *	Use, duplication or disclosure restricted by GSA ADP
 *	Schedule Contract with IBM Corp. 
 *
 */

HtmlInput5ColorProxy = function(domainObj, element) {
	if (arguments.length == 0) return; // don't do anything
	HtmlInput5Proxy.apply(this,arguments);
	 leftLabel = null ;
	 topLabel = null ;
	 bottomLabel =null;
};

HtmlInput5ColorProxy.prototype = new HtmlInput5Proxy();

HtmlInput5ColorProxy.prototype.getProxyName = function() {
	return "inputcolor";
};

HtmlInput5ColorProxy.prototype.getEventsToRegister = function() {
	return ["onchange"];
};

HtmlInput5ColorProxy.prototype.handleEvent = function(element, eventName, event) {
	HtmlRecordEvent(element, "oninput", event);
};

HtmlInput5ColorProxy.prototype._executeAction = HtmlInput5ColorProxy.prototype.executeAction;
HtmlInput5ColorProxy.prototype.executeAction = function(action) {
	var retStatus = RMOT_FAILURE;
	var actionType = action.type;

	if (actionType=='oninput') {
		var html5TypeSupport = this.typeSupport();
		if (html5TypeSupport && this.element.type != 'number') {
			this.element.value = action.parameters[0].value;
			
			if (browserDetails.name == "Safari") {
				this.element.style.background = action.parameters[0].value;	
			}
			
			this.setTarget(this.element);
			this.dispatchInputEvent('change');
			
			return RMOT_SUCCESS;
		}
	}
	return this._executeAction(action);
};
/*
 *
 *	Licensed Materials - Property of IBM
 *
 *	IBM Rational Mobile Test
 *
 *	(C) Copyright IBM Corporation 2014. All Rights Reserved. 
 *
 *	Note to U.S. Government Users Restricted Rights:  
 *	Use, duplication or disclosure restricted by GSA ADP
 *	Schedule Contract with IBM Corp. 
 *
 */

HtmlInput5DateProxy = function(domainObj, element) {
	if (arguments.length == 0) return; // don't do anything
	HtmlInput5Proxy.apply(this,arguments);
	 leftLabel = null ;
	 topLabel = null ;
	 bottomLabel =null;
};

HtmlInput5DateProxy.prototype = new HtmlInput5Proxy();

HtmlInput5DateProxy.prototype.getProxyName = function() {
	return "inputdate";
};
/*
 *
 *	Licensed Materials - Property of IBM
 *
 *	IBM Rational Mobile Test
 *
 *	(C) Copyright IBM Corporation 2014. All Rights Reserved. 
 *
 *	Note to U.S. Government Users Restricted Rights:  
 *	Use, duplication or disclosure restricted by GSA ADP
 *	Schedule Contract with IBM Corp. 
 *
 */

HtmlSelectProxy = function(domainObj,element) {
	if (arguments.length == 0) return; // don't do anything
	HtmlElementProxy.apply(this,arguments);
	leftLabel = null;
	topLabel = null;
	this.selectopenActionId = null;
};

HtmlSelectProxy.prototype = new HtmlElementProxy();

HtmlSelectProxy.prototype._applyDecoratedProps = HtmlSelectProxy.prototype.applyDecoratedProps;

HtmlSelectProxy.prototype.applyDecoratedProps = function( targetElement) {
	this._applyDecoratedProps(targetElement);
	targetElement.options = this.getProperty("options");
	targetElement.length = this.getProperty("length");
	targetElement.name = this.getProperty("name");
	if(this.element.type != "hidden"){
	targetElement.label = this.getProperty(WebGuiConstants.LABEL_PROP);
	}
};
	
HtmlSelectProxy.prototype.getPropertiesToSave = function() {
	return [WebGuiConstants.CONTENT_PROP];
};

HtmlSelectProxy.prototype.getEventsToRegister = function() {
	return [RMoTchangeEvent, RMOT_DOWN_EVENT];
};

HtmlSelectProxy.prototype.getRepeatedAction = function () {
	return jsUtil.isDesktop() ? {} : {"ontouchstart": RMoTchangeEvent};
};

HtmlSelectProxy.prototype._installWrappers = HtmlSelectProxy.prototype.installWrappers;
HtmlSelectProxy.prototype.installWrappers = function () {
	rmotHierarchy.setSavedProperties(this);
	return this._installWrappers();
};

HtmlSelectProxy.prototype.shouldWrapEvent = function (eventName, element) {
	return true;
}

HtmlSelectProxy.prototype.handleEvent = function(element, eventName, event) {
	// Capture hierarchy on click/touch event and use it when onchange is fired 
	if (eventName == RMoTchangeEvent && this.selectopenActionId) {
		// capture the hierarchy now since if there are previous repeated events 
		// the hierarchy will be incorrect
		if (jsUtil.isDesktop()) {
			this.domainObj._recordEventWithExistingScreenshot(eventName, this.getProperty(WebGuiConstants.TAGNAME_PROP), 
					element, rmotHierarchy.currentHierarchy, 
					this.getParameters(), this.selectopenActionId);
		}
		this.selectopenActionId = null;
	}
	else {
		this.selectopenActionId = this.domainObj._captureScreenshot();
		webGuiRecorderInterfaceObj.updateHierarchy();
		this.ghostClick(event);
	}
	webGuiRecorderInterfaceObj.handleRepeatedAction(element, eventName);
	event.recorded = true;
};

HtmlSelectProxy.prototype._getProperty = HtmlSelectProxy.prototype.getProperty;
HtmlSelectProxy.prototype.getProperty = function(propertyName) {
		var propertyValue = null;
		if (propertyName == undefined || propertyName == null) {
			return propertyValue;
		}
		switch (propertyName) {
			case WebGuiConstants.CONTENT_PROP :
				var text = '';
				for(var i = 0; i < this.element.options.length; i++) { 
					if(this.element.options[i].selected) { 
						text += ',\u200B '+this.element.options[i].text;
					} 
				} 
				propertyValue = text.substring(3,text.length);
				break;
			case "name" :
				propertyValue = this.element.name;
				break;
			case "length" :
				propertyValue = this.element.length;
				break;
			case "options" :
				propertyValue = "";
				
				for (var i = 0; i < this.element.options.length; i++) {
					propertyValue += this.element.options[i].text + ', ';
				}
				// remove trailing comma and space
				propertyValue = 
					propertyValue.substring(0, propertyValue.length-2);
				break;
			case WebGuiConstants.LABEL_PROP :
				propertyValue = this.getLabel();
				if(propertyValue)
				propertyValue = propertyValue.trim();
				break;
			default:
				propertyValue = this._getProperty(propertyName);
		}
		return propertyValue;
};

HtmlSelectProxy.prototype.getParameters = function () {
	var parameters = {};
	parameters.newtext = this.getProperty(WebGuiConstants.CONTENT_PROP);
	return parameters;
};
HtmlSelectProxy.prototype._getLabel = HtmlSelectProxy.prototype.getLabel;
HtmlSelectProxy.prototype.getLabel = function () {
	var label="";
		//Compute Label from the For attribute defined
		label = this._getLabel();
		if (typeof(label)=='undefined' || label == null || label == "") {
			if(this.bestComputedLabel()){
				label = this.bestComputedLabel();
			}
			else{
				var direction = traversal.LEFT;
				if( jsUtil.isRTLLanguage() == true){
					direction = traversal.RIGHT;
				}
				label = this.computeLabel(direction);
			}
		}

	return label;
};
//Priority index : Left > Top > Bottom
HtmlSelectProxy.prototype.bestComputedLabel = function () {
	return this.leftLabel || this.topLabel ;
};
/////////////////////////// HtmlOptionProxy begin////////////////////////////////

HtmlOptionProxy = function(domainObj,element) {
	if (arguments.length == 0) return; // don't do anything
	HtmlElementProxy.apply(this,arguments);
	//this.isWidgetChild=true;
};

HtmlOptionProxy.prototype = new HtmlElementProxy();


HtmlOptionProxy.prototype.installWrappers = function() {	
	return false; 
};

HtmlOptionProxy.prototype.getEventsToRegister = function() {	
	return [];
};

/////////////////////////// HtmlOptionProxy end////////////////////////////////

/*
 *
 *	Licensed Materials - Property of IBM
 *
 *	IBM Rational Mobile Test
 *
 *	(C) Copyright IBM Corporation 2014, 2016. All Rights Reserved. 
 *
 *	Note to U.S. Government Users Restricted Rights:  
 *	Use, duplication or disclosure restricted by GSA ADP
 *	Schedule Contract with IBM Corp. 
 *
 */

HtmlTextInputProxy = function(domainObj,element) {
	if (arguments.length == 0) return; // don't do anything
	HtmlEditableProxy.apply(this,arguments);
	 leftLabel = null ;
	 topLabel = null ;
	 bottomLabel =null;
};

HtmlTextInputProxy.prototype = new HtmlEditableProxy();

HtmlTextInputProxy.prototype._applyDecoratedProps = HtmlTextInputProxy.prototype.applyDecoratedProps;
HtmlTextInputProxy.prototype.applyDecoratedProps = function( targetElement) {
	this._applyDecoratedProps(targetElement);
	if(this.element.type != "hidden"){
		targetElement.label = this.getProperty(WebGuiConstants.LABEL_PROP);
	}
};	

HtmlTextInputProxy.prototype._getProperty = HtmlTextInputProxy.prototype.getProperty;
HtmlTextInputProxy.prototype.getProperty = function(propertyName) {
	var propertyValue = null;
	switch (propertyName) {
	case WebGuiConstants.CONTENT_PROP :
	case WebGuiConstants.VALUE_PROP :
		propertyValue = this.element.RMoTcontent || this.element.value; 
		break;
	case WebGuiConstants.LABEL_PROP :
		propertyValue = this.getLabel();
		if(propertyValue)
		propertyValue = propertyValue.trim();
		break;
	default:
		propertyValue = this._getProperty(propertyName);
	}
	return propertyValue;
};

HtmlTextInputProxy.prototype._getLabel = HtmlTextInputProxy.prototype.getLabel;
HtmlTextInputProxy.prototype.getLabel = function () {
	var direction = traversal.LEFT;
	if( jsUtil.isRTLLanguage() == true){
		direction = traversal.RIGHT;
	}
	//Compute Label from the For attribute defined
	label = this._getLabel(traversal.TOP,direction);
	if (typeof(label)=='undefined' || label == null || label == "") {
		if(this.bestComputedLabel()){
			label = this.bestComputedLabel();
		}	
		else{
			
			label = this.computeLabel(direction);
		}
	}

	return label;
};


//Priority index : Left > Top > Bottom
HtmlTextInputProxy.prototype.bestComputedLabel = function () {
	return this.leftLabel || this.topLabel || this.bottomLabel;
};


HtmlTextInputProxy.prototype.getProxyName =  function() {
	var elementTagName = (this.element.tagName) ? this.element.tagName : "";
	// Append type to the input elements
	if (elementTagName && this.element.type) {
		if (inputTypes.indexOf(this.element.type.toLowerCase()) >= 0) {
			//elementTagName += this.element.getAttribute("type");//Works in All browsers: Defect 44178
			// Above code breaking the search type input field in wikipedia in IE9
			// Require grammar entry for inputsearch which is missing.
			elementTagName += this.element.type;
		} else {
			elementTagName += "textfield";
		}
	}
	return (elementTagName) ? elementTagName.toLowerCase() : null;
}

HtmlTextInputProxy.prototype._addCharacterToContent = HtmlElementProxy.prototype.addCharacterToContent; // bypass HtmlEditableProxy implementation
HtmlTextInputProxy.prototype.addCharacterToContent = function(character) {
	this._addCharacterToContent(character);
};

HtmlTextInputProxy.prototype.clearElementContent = HtmlElementProxy.prototype.clearElementContent; // bypass HtmlEditableProxy implementation
/*
 *
 *	Licensed Materials - Property of IBM
 *
 *	IBM Rational Mobile Test
 *
 *	(C) Copyright IBM Corporation 2014, 2016. All Rights Reserved. 
 *
 *	Note to U.S. Government Users Restricted Rights:  
 *	Use, duplication or disclosure restricted by GSA ADP
 *	Schedule Contract with IBM Corp. 
 *
 */

HtmlTextSearchInputProxy = function(domainObj,element) {
	if (arguments.length == 0) return; // don't do anything
	HtmlTextInputProxy.apply(this,arguments);
	 leftLabel = null ;
	 topLabel = null ;
	 bottomLabel =null;
};

HtmlTextSearchInputProxy.prototype = new HtmlTextInputProxy();

HtmlTextSearchInputProxy.prototype.getProxyName = function() {
	return "inputsearch";
};

HtmlTextSearchInputProxy.prototype.getEventsToRegister = function(){
	return [RMOT_TRIGGER_EVENT, RMOT_DBLCLICK_EVENT, "onkeydown", "onsearch"];
};

HtmlTextSearchInputProxy.prototype._handleEvent = HtmlTextSearchInputProxy.prototype.handleEvent;
HtmlTextSearchInputProxy.prototype.handleEvent = function(element, eventName, event) {
	switch (eventName) {
		case RMOT_TRIGGER_EVENT:
			break;
		case "onsearch":
			if (element.value == "") {
				HtmlRecordEvent(element, "onclear", event);
				event.recorded = true;				
			}
			break;
		default:
			this._handleEvent(element, eventName, event);
	}
};

HtmlTextSearchInputProxy.prototype._executeAction = HtmlTextSearchInputProxy.prototype.executeAction;
HtmlTextSearchInputProxy.prototype.executeAction = function(action) {
	var retStatus = RMOT_SUCCESS;
	var actionType = action.type;

	if (actionType == "onclear") {
		this.element.value = "";
	}
	else {
		retStatus = this._executeAction(action);
	}
	return retStatus;
};
/*
 *
 *	Licensed Materials - Property of IBM
 *
 *	IBM Rational Mobile Test
 *
 *	(C) Copyright IBM Corporation 2014. All Rights Reserved. 
 *
 *	Note to U.S. Government Users Restricted Rights:  
 *	Use, duplication or disclosure restricted by GSA ADP
 *	Schedule Contract with IBM Corp. 
 *
 */

HtmlTextAreaProxy = function(domainObj,element) {
	if (arguments.length == 0) return; // don't do anything
	HtmlElementProxy.apply(this,arguments);
};

HtmlTextAreaProxy.prototype = new HtmlTextInputProxy();

HtmlTextAreaProxy.prototype.handleEvent = function(element, eventName, event) {
	switch (eventName) {
	case RMOT_TRIGGER_EVENT:
		if(event.clientX<=0 && event.clientY<=0) return;	// 44109
		if (!RMoTIOS) element.focus();
		break;
	case "onkeydown":
		if (event.keyCode == 13) { // need to capture enter key
			return;
		}
		else if(event.keyCode == 9){
			//Tab has been pressed and we would ignore the event
			return;
		}
		// else will be managed as a repeated action
		break;
	default:
		return;	// Do not record other events
	}
	HtmlRecordEvent(element, eventName, event);
};

HtmlTextAreaProxy.prototype.getProxyName =  function() {
	return (this.proxyName) ? this.proxyName : this.getTagName();
}
/*
 *
 *	Licensed Materials - Property of IBM
 *
 *	IBM Rational Mobile Test
 *
 *	(C) Copyright IBM Corporation 2014. All Rights Reserved. 
 *
 *	Note to U.S. Government Users Restricted Rights:  
 *	Use, duplication or disclosure restricted by GSA ADP
 *	Schedule Contract with IBM Corp. 
 *
 */

HtmlInputFileProxy = function(domainObj, element) {
	if (arguments.length == 0) return; // don't do anything
	HtmlTextInputProxy.apply(this,arguments);
	 leftLabel = null ;
	 topLabel = null ;
	 bottomLabel =null;
};

HtmlInputFileProxy.prototype = new HtmlTextInputProxy();

HtmlInputFileProxy.prototype._executeAction = HtmlInputFileProxy.prototype.executeAction;
HtmlInputFileProxy.prototype.executeAction = function(action) {
	if (action.type == 'onclick') {
		return RMOT_FAILURE; // Let Selenium handle the action
	}
	
	return this._executeAction(action);
};
/*
 *
 *	Licensed Materials - Property of IBM
 *
 *	IBM Rational Mobile Test
 *
 *	(C) Copyright IBM Corporation 2014. All Rights Reserved. 
 *
 *	Note to U.S. Government Users Restricted Rights:  
 *	Use, duplication or disclosure restricted by GSA ADP
 *	Schedule Contract with IBM Corp. 
 *
 */

/*
 * CheckBox/Radio Proxy
 * A common proxy for both checkbox and radio input elements
 */	
HtmlCheckBoxRadioProxy = function(domainObj,element) {
	if (arguments.length == 0) return; // don't do anything
	HtmlElementProxy.apply(this,arguments);
	rightLabel = null ;
};

HtmlCheckBoxRadioProxy.prototype = new HtmlElementProxy();

HtmlCheckBoxRadioProxy.prototype._applyDecoratedProps = HtmlCheckBoxRadioProxy.prototype.applyDecoratedProps;

HtmlCheckBoxRadioProxy.prototype.applyDecoratedProps = function( targetElement){
	this._applyDecoratedProps(targetElement);
	targetElement.checked = this.getProperty("checked");
	if(this.element.type != "hidden"){
	targetElement.label = this.getProperty("label");
	}
};
	
HtmlCheckBoxRadioProxy.prototype.getPropertiesToSave = function() {
	return [WebGuiConstants.CHECKED_PROP];
};

HtmlCheckBoxRadioProxy.prototype._getProperty = HtmlCheckBoxRadioProxy.prototype.getProperty;
HtmlCheckBoxRadioProxy.prototype.getProperty = function(propertyName) {
	var propertyValue = null;
	if (propertyName == undefined || propertyName == null) {
		return propertyValue;
	}
	switch (propertyName) {
		case "checked" :
			 propertyValue = this.element.checked; 
			break;
		case "label" :
			propertyValue = this.getLabel();
			break;
		default:
			propertyValue = this._getProperty(propertyName);
	}
	return propertyValue;
};

HtmlCheckBoxRadioProxy.prototype.getEventsToRegister = function(){
	if (jsUtil.isDijitControl(this.element)) return [RMOT_DOWN_EVENT];
	if (this.element[RMoTclickEvent]
		|| this.element.getAttribute('data-propertyuihint')) return [RMOT_TRIGGER_EVENT];
	
	return ["onchange"];
};

HtmlCheckBoxRadioProxy.prototype._installWrappers = HtmlCheckBoxRadioProxy.prototype.installWrappers;
HtmlCheckBoxRadioProxy.prototype.installWrappers = function () {
	rmotHierarchy.setSavedProperties(this);
	return this._installWrappers();
};


HtmlCheckBoxRadioProxy.prototype.handleEvent = function(element, eventName, event) {
	var proxy = domainManager.getProxy(element);
	if (proxy.isVisible().reachable) {	// 43032
		HtmlRecordEvent(element, "onclick", event);	
	}
};

HtmlCheckBoxRadioProxy.prototype._getLabel = HtmlCheckBoxRadioProxy.prototype.getLabel;
HtmlCheckBoxRadioProxy.prototype.getLabel = function () {
	var label="";
	//Compute Label from the For attribute defined
	label = this._getLabel();
	if (typeof(label)=='undefined' || label == null || label == "") {
		if(this.bestComputedLabel()){
			label = this.bestComputedLabel();
		}
		else{
			var direction = traversal.RIGHT;
			if( jsUtil.isRTLLanguage() == true){
				direction = traversal.LEFT;
			}
			label = this.computeLabel(direction);
		}
	}

	return label;
};

//Check if the label is alligned properly to the checkbox/radio button
HtmlCheckBoxRadioProxy.prototype.isValidLabel = function (tentativeLabel) {
	var elemCoords = this.getCoordinates();
	if(tentativeLabel.nodeType == 3){
		if(!this.rightLabel)
			this.rightLabel = jsUtil.getTrimText(tentativeLabel);
	}
	else{
		var labelCoords = domainManager.getProxy(tentativeLabel).getCoordinates();
		//WI 53982: Check if the label falls within the below category
		// a) Smaller than the control or
		// b) Not larger than the PADDING value
		if(this.isSmallerLabel(labelCoords,elemCoords) || this.isBiggerLabel(labelCoords,elemCoords))
		{
			if(elemCoords.left < labelCoords.left)
				if(!this.rightLabel)
					this.rightLabel = jsUtil.getTrimText(tentativeLabel);
		}
	}
};
//Priority index :right
HtmlCheckBoxRadioProxy.prototype.bestComputedLabel = function () {
	return this.rightLabel;
};
/*
 *
 *	Licensed Materials - Property of IBM
 *
 *	IBM Rational Mobile Test
 *
 *	(C) Copyright IBM Corporation 2014. All Rights Reserved. 
 *
 *	Note to U.S. Government Users Restricted Rights:  
 *	Use, duplication or disclosure restricted by GSA ADP
 *	Schedule Contract with IBM Corp. 
 *
 */

HtmlSubmitProxy = function(domainObj,element) {
	if (arguments.length == 0) return; // don't do anything
	HtmlElementProxy.apply(this,arguments);
};

HtmlSubmitProxy.prototype = new HtmlElementProxy();

HtmlSubmitProxy.prototype.getEventsToRegister = function() {
	return [RMOT_TRIGGER_EVENT, RMOT_DBLCLICK_EVENT, "onkeydown"];
};

HtmlSubmitProxy.prototype.handleEvent = function(element, eventName, event) {
	switch (eventName) {
	case RMOT_DBLCLICK_EVENT:
		break;
	case RMOT_TRIGGER_EVENT:
		if (!jsUtil.isTrusted(event, eventName)) return;	// ignore triggered events
		break;
	case "onkeydown":
		if (event.keyCode == 13 || event.keyCode == 32) { // capture enter and space keys
			eventName="onclick";
		}
		else {
			return; // do not handle any other keyboard events
		}
		break;
	default:
		return;	// Do not record other events
	}
	HtmlRecordEvent(element, eventName, event);
};

HtmlSubmitProxy.prototype._getProperty = HtmlSubmitProxy.prototype.getProperty;
HtmlSubmitProxy.prototype.getProperty = function(propertyName) {
	var propertyValue = null;
	switch (propertyName) {
		case WebGuiConstants.CONTENT_PROP :
			if(this.element.tagName.toLowerCase() == "input"){//Input submit/reset button
				propertyValue = this.element.value; 
			}else{ // button element
				propertyValue = this._getProperty(propertyName);
			}
			 
			break;
		default:
			propertyValue = this._getProperty(propertyName);
	}
	return propertyValue;
};
/*
 *
 *	Licensed Materials - Property of IBM
 *
 *	IBM Rational Mobile Test
 *
 *	(C) Copyright IBM Corporation 2014. All Rights Reserved. 
 *
 *	Note to U.S. Government Users Restricted Rights:  
 *	Use, duplication or disclosure restricted by GSA ADP
 *	Schedule Contract with IBM Corp. 
 *
 */

HtmlSvgProxy = function(domainObj, element) {
	if (arguments.length == 0) return; // don't do anything
	HtmlElementProxy.apply(this,arguments);
	
	// Only keep the svg controls bigger than 2px
	const sizeThreshold = 2;
	const rect = this.element.getBoundingClientRect();
	if (rect.width < sizeThreshold || rect.height < sizeThreshold) {
		this.isWidgetChild = true;
	}
};

HtmlSvgProxy.prototype = new HtmlElementProxy();

HtmlSvgProxy.prototype.isVisible =  function() {
	var ret = { visibility: true, propagation: false, reachable: true };

	// Make graphic element always visible and reachable
	return ret;
};

HtmlSvgProxy.prototype.handleEvent = function(element, eventName, event) {
	HtmlRecordEvent(element, eventName, event, true);
};
/*
 *
 *	Licensed Materials - Property of IBM
 *
 *	IBM Rational Mobile Test
 *
 *	(C) Copyright IBM Corporation 2014. All Rights Reserved. 
 *
 *	Note to U.S. Government Users Restricted Rights:  
 *	Use, duplication or disclosure restricted by GSA ADP
 *	Schedule Contract with IBM Corp. 
 *
 */

HtmlAreaProxy = function(domainObj,element) {
	if (arguments.length == 0) return; // don't do anything
	HtmlAProxy.apply(this,arguments);
};

HtmlAreaProxy.prototype = new HtmlAProxy();

HtmlAreaProxy.prototype.isVisible = function() {
	var ret = { visibility: true, propagation: false, reachable: true };
	return ret;
};

HtmlAreaProxy.prototype._getProperty = HtmlAreaProxy.prototype.getProperty;
HtmlAreaProxy.prototype.getProperty = function(propertyName) {
	var propertyValue = null;
	var element = this.element;
	
	switch (propertyName) {
	case "checksum":
		if (!this.isRectArea()) return '';

		var img = this.getMapImage(element);
		if (img!=null && img.src!=null && element.coords) {
			propertyValue = this.getChecksum(img, element.coords);
		}
		break;
	case "shape":
		propertyValue = this.element.shape;
		break;
	default:
		propertyValue = this._getProperty(propertyName);
	}
	
	return propertyValue;
};

HtmlAreaProxy.prototype._applyDecoratedProps = HtmlAreaProxy.prototype.applyDecoratedProps;
HtmlAreaProxy.prototype.applyDecoratedProps = function(targetElement) {
	this._applyDecoratedProps(targetElement);
	targetElement.checksum = (this.isRectArea()) ? this.getProperty("checksum") : '';
};

HtmlAreaProxy.prototype.getCoordinates = function() {
	var element = this.element;
	if (element.nodeType == window.Node.ELEMENT_NODE) {
		if (element.nodeType) {
			var rect = this.getImageRect(element);
			var ownerRect = jsUtil.getOwnerDocumentCoordinates(element);

			return {left:Math.round(ownerRect.left+rect.left),
					top:Math.round(ownerRect.top+rect.top),
					right:Math.round(ownerRect.right+rect.right),
					bottom:Math.round(ownerRect.bottom+rect.bottom)}
		}	
	}
	
	return {left:0,top:0,right:0,bottom:0};
};

/**
 * @returns true if the shape is a rectangle
 */
HtmlAreaProxy.prototype.isRectArea = function() {
	var shape = this.getProperty("shape");
	if (shape) {
		return shape.toLowerCase()=="rect";
	}
	return false;
};

/**
 * @returns element's linked image
 */
HtmlAreaProxy.prototype.getMapImage =  function() {
	var map = this.element.parentElement;
	if (!map.image) {
		map.image = jsUtil.getElementByAttribute('usemap', new Array("#"+map.name), map.parentElement);
	}
	
	return map.image;
};

/**
 * @returns Coordinates of the linked image
 */
HtmlAreaProxy.prototype.getImageRect =  function() {
	var img = this.getMapImage(this.element);
	if (!img)
		return {left:0,top:0,right:0,bottom:0};
	
	return img.getBoundingClientRect();
};

/**
 * @returns absolute coordinates of the given area
 */
HtmlAreaProxy.prototype.getCoords =  function() {
	var map = this.getImageRect(this.element);
	var position = this.element.coords.split(',');
	var rect = {left: Math.floor(position[0]) + Math.floor(map.left), 
				top: Math.floor(position[1]) + Math.floor(map.top), 
				right: Math.floor(position[2]) + Math.floor(map.left),
				bottom: Math.floor(position[3]) + Math.floor(map.top)};
	
	return rect;
};

/**
 * @returns checksum of the image contained in the area
 */
HtmlAreaProxy.prototype.getChecksum =  function(img, coords) {
	var canvas = document.createElement("canvas");
    
    var position = coords.split(',');
    canvas.width = Math.floor(position[2]) - Math.floor(position[0]);
    canvas.height = Math.floor(position[3]) - Math.floor(position[1]);

    var ctx = canvas.getContext("2d");
    ctx.drawImage(img, -Math.floor(position[0]), -Math.floor(position[1]));
    
    try {
    	var imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    	var key = 0x4A4A4A4A;
        for (var i = 0; i < imgData.data.length; i += 4) {
        	key ^= (imgData.data[i] << 24)
    	        | (imgData.data[i+1] << 16)
    	        | (imgData.data[i+2] << 8)
    	        | (imgData.data[i+3]);
        }
        return '' + key;
	}
	catch (e) {	// Security issue
	}

	return '';

};
/*
 *
 *	Licensed Materials - Property of IBM and/or HCL
 *
 *	IBM Rational Mobile Test
 *
 *	(C) Copyright IBM Corporation 2014, 2016. 
 *  Copyright HCL Technologies Ltd. 2017.  All Rights Reserved.
 *
 *	Note to U.S. Government Users Restricted Rights:  
 *	Use, duplication or disclosure restricted by GSA ADP
 *	Schedule Contract with IBM Corp. 
 *
 */

HtmlBodyProxy = function(domainObj,element) {
	if (arguments.length == 0) return; // don't do anything
	HtmlElementProxy.apply(this,arguments);
};

HtmlBodyProxy.prototype = new HtmlElementProxy();

HtmlBodyProxy.prototype._applyDecoratedProps = HtmlBodyProxy.prototype.applyDecoratedProps;
HtmlBodyProxy.prototype.applyDecoratedProps = function(targetElement) {
	this._applyDecoratedProps(targetElement);

	// Add some useful properties
	targetElement.url = window.location.href;
	targetElement.userAgent = navigator.userAgent;
	if (window.devicePixelRatio) targetElement.devicePixelRatio = this.getProperty(WebGuiConstants.DEVICEPIXELRATIO_PROP);
	targetElement.width = this.getProperty(WebGuiConstants.WIDTH_PROP);
	targetElement.height = this.getProperty(WebGuiConstants.HEIGHT_PROP);
	targetElement.scrollable = this.getProperty(WebGuiConstants.SCROLLABLE_PROP);
	targetElement.title = this.getProperty(WebGuiConstants.TITLE_PROP);
	targetElement.rtw = RMOT_VERSION;
	
	for (var i = 0; i < domainManager.registeredDomains.length; i++) {
		var domainObj = domainManager.registeredDomains[i];
		var version = domainObj.getDomainVersion();
		if (version) {
			targetElement[domainObj.getDomainName()] = version;	
		}
	}
};

HtmlBodyProxy.prototype._getProperty = HtmlBodyProxy.prototype.getProperty;
HtmlBodyProxy.prototype.getProperty = function(propertyName) {
	var propertyValue = null;
	switch (propertyName) {
	    case WebGuiConstants.URL_PROP:
		    propertyValue = window.location.href;
		    break;
		case WebGuiConstants.DEVICEPIXELRATIO_PROP:
			propertyValue = window.devicePixelRatio;  
			break;
		case WebGuiConstants.WIDTH_PROP:
			propertyValue = jsUtil.getWindowWidth(this.element);
			break;
		case WebGuiConstants.HEIGHT_PROP:
			propertyValue = jsUtil.getWindowHeight(this.element);
			break;
		case WebGuiConstants.SCROLLABLE_PROP:
			propertyValue = (document.body.scrollHeight > jsUtil.getWindowHeight(this.element)) ? true : false;
			break;
		case WebGuiConstants.TITLE_PROP:
			propertyValue = document.title || window.location.href;
			break;
		default:
			propertyValue = this._getProperty(propertyName);
	}
	return propertyValue;
};

/*
 *
 *	Licensed Materials - Property of IBM
 *
 *	IBM Rational Mobile Test
 *
 *	(C) Copyright IBM Corporation 2014. All Rights Reserved. 
 *
 *	Note to U.S. Government Users Restricted Rights:  
 *	Use, duplication or disclosure restricted by GSA ADP
 *	Schedule Contract with IBM Corp. 
 *
 */

HtmlCanvasProxy = function(domainObj, element) {
	if (arguments.length == 0) return; // don't do anything
	HtmlElementProxy.apply(this,arguments);
};

HtmlCanvasProxy.prototype = new HtmlElementProxy();

HtmlCanvasProxy.prototype.getEventsToRegister = function() {
	return ["onclick"];
};

HtmlCanvasProxy.prototype.handleEvent = function(element, eventName, event) {
	var proxy = domainManager.getProxy(element);
	proxy.setRelativeCoordinates(event);
	
	HtmlRecordEvent(element, "onclickAt", event);
};

HtmlCanvasProxy.prototype.setRelativeCoordinates = function(event) {
	var rect = this.element.getBoundingClientRect();
	
	this.relativeCoordinates = {
		x: parseInt(event.clientX - rect.left),
		y: parseInt(event.clientY - rect.top)
	};
};

HtmlCanvasProxy.prototype.getParameters = function () {
	var parameters = {};
	parameters.x = this.relativeCoordinates.x;
	parameters.y = this.relativeCoordinates.y;
	return parameters;
};

HtmlCanvasProxy.prototype.executeAction = function(action) {
	var retStatus = RMOT_FAILURE;
	var actionType = action.type;
	if (this.target == null) this.target = this.element;
	
	var rect = this.element.getBoundingClientRect();
	
	var x = Math.floor(action.parameters[1].value) + Math.floor(rect.left);
	var y = Math.floor(action.parameters[0].value) + Math.floor(rect.top);
	retStatus = this.click(x, y);

	return retStatus;
};

HtmlCanvasProxy.prototype.dispatchEvent = function(event) {
	var e = document.createEvent(event);
	e.initMouseEvent.apply(e, Array.prototype.slice.call(arguments, 1));
	this.target.dispatchEvent(e);
};

HtmlCanvasProxy.prototype._dispatchEvent = HtmlElementProxy.prototype.dispatchEvent;
HtmlCanvasProxy.prototype.click = function(x, y) {
	this.tap(); // 42036
	this._dispatchEvent(HTML_EVENT, 'focus', false, false);
	if (this.target.ontouchstart) this._dispatchEvent(HTML_MOUSE_EVENT, 'touchstart', true, true);
	if (this.target.ontouchend) this._dispatchEvent(HTML_MOUSE_EVENT, 'touchend', true, true);
	this.dispatchEvent(HTML_MOUSE_EVENT, 'mousedown', true, true, null, 1, 0, 0, x, y, 0, 0, 0, 0, 0, null);
	this.dispatchEvent(HTML_MOUSE_EVENT, 'click', true, true, null, 1, 0, 0, x, y, 0, 0, 0, 0, 0, null);
	this.dispatchEvent(HTML_MOUSE_EVENT, 'mouseup', true, true, null, 1, 0, 0, x, y, 0, 0, 0, 0, 0, null);
	return RMOT_SUCCESS;
};
/*
 *
 *	Licensed Materials - Property of IBM
 *
 *	IBM Rational Mobile Test
 *
 *	(C) Copyright IBM Corporation 2014. All Rights Reserved. 
 *
 *	Note to U.S. Government Users Restricted Rights:  
 *	Use, duplication or disclosure restricted by GSA ADP
 *	Schedule Contract with IBM Corp. 
 *
 */

HtmlFrameProxy = function(domainObj,element) {
	if (arguments.length == 0) return; // don't do anything
	HtmlElementProxy.apply(this,arguments);
};

HtmlFrameProxy.prototype = new HtmlElementProxy();

HtmlFrameProxy.prototype.getEventsToRegister = function() {
	return ["onload"];
};

HtmlFrameProxy.prototype.handleEvent = function(element, eventName, event) {
	rmotRecorder.parseDocument();
};

HtmlFrameProxy.prototype._isVisible = HtmlFrameProxy.prototype.isVisible;
HtmlFrameProxy.prototype.isVisible = function() {
	var ret = this._isVisible();
	ret.visibility = true;
	if (!ret.reachable || (jsUtil.isInViewPort(this.element, this.element.getBoundingClientRect()) && !jsUtil.isOnTop(this.element))) {
		ret.propagation = true;
	}
	return ret;
};

HtmlFrameProxy.prototype.getSecurityError =  function() {
	try {
		var access = this.element.contentDocument || this.element.contentWindow.document;
	}
	catch (e) {	// Security issue: frame's document is not in the current domain.
		return e;
	}
	return null;
};

HtmlFrameProxy.prototype.getProxyName =  function() {
	return this.getSecurityError() ? 'crossframe' : this.getTagName();
};

HtmlFrameProxy.prototype._applyDecoratedProps = HtmlFrameProxy.prototype.applyDecoratedProps;
HtmlFrameProxy.prototype.applyDecoratedProps = function(targetElement) {
	this._applyDecoratedProps(targetElement);
	if (this.getSecurityError()) targetElement.error = '' + this.getSecurityError();
};

/*
 *
 *	Licensed Materials - Property of IBM
 *
 *	IBM Rational Mobile Test
 *
 *	(C) Copyright IBM Corporation 2016. All Rights Reserved. 
 *
 *	Note to U.S. Government Users Restricted Rights:  
 *	Use, duplication or disclosure restricted by GSA ADP
 *	Schedule Contract with IBM Corp. 
 *
 */

/////////////////////////// HtmlTableHeaderProxy ///////////////////////////
HtmlTableHeaderProxy = function(domainObj,element) {
	if (arguments.length == 0) return; // don't do anything
	HtmlElementProxy.apply(this,arguments);
};

HtmlTableHeaderProxy.prototype = new HtmlElementProxy();

HtmlTableHeaderProxy.prototype._applyDecoratedProps = HtmlTableHeaderProxy.prototype.applyDecoratedProps;
HtmlTableHeaderProxy.prototype.applyDecoratedProps = function( targetElement) {
	this._applyDecoratedProps(targetElement);
	targetElement.column = this.getProperty("column");
};

HtmlTableHeaderProxy.prototype._getProperty = HtmlTableHeaderProxy.prototype.getProperty;
HtmlTableHeaderProxy.prototype.getProperty = function(propertyName) {
		var propertyValue = null;
		if (propertyName == undefined || propertyName == null) {
			return propertyValue;
		}
		switch (propertyName) {
			case "column" :
				var col = this.element.cellIndex + 1;
				propertyValue = col + '';
				break;
			default:
				propertyValue = this._getProperty(propertyName);
		}
		return propertyValue;
};

/////////////////////////// HtmlTableCellProxy ///////////////////////////
HtmlTableCellProxy = function(domainObj,element) {
	if (arguments.length == 0) return; // don't do anything
	HtmlElementProxy.apply(this,arguments);
};

HtmlTableCellProxy.prototype = new HtmlElementProxy();

HtmlTableCellProxy.prototype._applyDecoratedProps = HtmlTableCellProxy.prototype.applyDecoratedProps;
HtmlTableCellProxy.prototype.applyDecoratedProps = function( targetElement) {
	this._applyDecoratedProps(targetElement);
	targetElement.position = this.getProperty("position");
};

HtmlTableCellProxy.prototype._getProperty = HtmlTableCellProxy.prototype.getProperty;
HtmlTableCellProxy.prototype.getProperty = function(propertyName) {
		var propertyValue = null;
		if (propertyName == undefined || propertyName == null) {
			return propertyValue;
		}
		switch (propertyName) {
			case "position" :
				var row = this.element.parentElement.rowIndex;
				row = (this.isTableWithHeader()) ? row : row + 1;
				var col = this.element.cellIndex + 1;
				propertyValue = col + ' : ' + row;
				break;
			default:
				propertyValue = this._getProperty(propertyName);
		}
		return propertyValue;
};

HtmlTableCellProxy.prototype.isTableWithHeader = function() {
	var parent = this.element.parentElement;
	while (parent && parent.tagName.toLowerCase() != 'table') {
		parent = parent.parentElement;
	}
	
	var ret = false;
	try{
		ret = (parent.rows[0].cells[0].tagName.toLowerCase() == 'th');
	}
	catch(err){}
	
	return ret;
};
/*
 *
 *	Licensed Materials - Property of IBM
 *
 *	IBM Rational Mobile Test
 *
 *	(C) Copyright IBM Corporation 2014. All Rights Reserved. 
 *
 *	Note to U.S. Government Users Restricted Rights:  
 *	Use, duplication or disclosure restricted by GSA ADP
 *	Schedule Contract with IBM Corp. 
 *
 */

var dojoTriggeredEvent = RMOT_TRIGGER_EVENT.replace(RMoTeventPrefix, '');

var DOJO_DOMAIN_NAME = "dojo";

// kind of constants defining Dojo Mobile objects
var DOJO_UNIDENTIFIED	= "djmunidentified";
// views
var DJM_VIEW			= "djmview";
var DJM_SCROLLABLEVIEW	= "djmscrollableview";
var DJM_SWAPVIEW		= "djmswapview";
var DJM_TREEVIEW		= "djmtreeview";
var DJM_VIEWCONTROLLER	= "djmviewcontroller";
// heading
var DJM_HEADING			= "djmheading";
// lists
var DJM_ROUNDRECTCATEGORY	= "djmroundrectcategory";
var DJM_EDGETOEDGECATEGORY	= "djmedgetoedgecategory";
var DJM_ROUNDRECTLIST		= "djmroundrectlist";
var DJM_EDGETOEDGELIST		= "djmedgetoedgelist";
var DJM_ROUNDRECTDATALIST	= "djmroundrectdatalist";
var DJM_EDGETOEDGEDATALIST	= "djmedgetoedgedatalist";
var DJM_ROUNDRECTSTORELIST	= "djmroundrectstorelist";
var DJM_EDGETOEDGESTORELIST	= "djmedgetoedgestorelist";

var DJM_ICON			= "djmicon";
var DJM_ICONCONTAINER	= "djmiconcontainer";
var DJM_ICONMENU		= "djmiconmenu";
var DJM_ICONMENUITEM	= "djmiconmenuitem";
var DJM_ICONITEM		= "djmiconitem";
var DJM_ICONITEMPANE	= "djmiconitempane";
var DJM_TABBAR			= "djmtabbar";
var DJM_ROUNDRECT		= "djmroundrect";
var DJM_CONTENTPANE		= "djmcontentpane";
var DJM_CONTAINER		= "djmcontainer";
var DJM_PANE			= "djmpane";
var DJM_SCROLLABLEPANE	= "djmscrollablepane";
var DJM_OPENER			= "djmopener";
var DJM_OVERLAY			= "djmoverlay";
var	DJM_TOOLTIP			= "djmtooltip";	
var DJM_FIXEDSPLITTER		= "djmfixedsplitter";
var DJM_FIXEDSPLITTERPANE	= "djmfixedsplitterpane";
var DJM_GRIDLAYOUT			= "djmgridlayout";
var DJM_SCREENSIZEAWARE		= "djmscreensizeaware";
var DJM_SIMPLEDIALOG		= "djmsimpledialog";
var DJM_PROGRESSINDICATOR	= "djmprogressindicator";
var DJM_PROGRESSBAR			= "djmprogressbar";
var DJM_RATING				= "djmrating";

//basic widgets
var DJM_BUTTON 			= "djmbutton";
var DJM_TABBARBUTTON	= "djmtabbarbutton";
var DJM_TOOLBARBUTTON	= "djmtoolbarbutton";
var DJM_TOGGLEBUTTON	= "djmtogglebutton";
var DJM_CHECKBOX 		= "djmcheckbox";
var DJM_RADIOBUTTON		= "djmradiobutton";
var DJM_SWITCH			= "djmswitch";
var DJM_SLIDER			= "djmslider";
var DJM_SLIDER_TOUCHBOX = "djmslidertouchbox";
var DJM_LISTITEM		= "djmlistitem";
var DJM_ACCORDION		= "djmaccordion";
var DJM_ACCORDIONTITLE	="djmaccordiontitle";
var DJM_PAGEINDICATOR	= "djmpageindicator";
//text widgets
var DJM_TEXTBOX				= "djmtextbox";
var DJM_TEXTAREA			= "djmtextarea";
var DJM_EXPANDINGTEXTAREA	= "djmexpandingtextarea";
var DJM_SEARCHBOX			= "djmsearchbox";
var DJM_COMBOBOX			= "djmcombobox";
//valuepicker
var DJM_VALUEPICKER					= "djmvaluepicker";
var DJM_VALUEPICKERSLOT				= "djmvaluepickerslot";
//var DJM_VALUEPICKERSLOTPLUSBUTTON	= "djmvaluepickerslotplusbutton";
//var DJM_VALUEPICKERSLOTMINUSBUTTON	= "djmvaluepickerslotminusbutton";
var DJM_VALUEPICKERDATEPICKER		= "djmvaluepickerdatepicker";
var DJM_VALUEPICKERTIMEPICKER		= "djmvaluepickertimepicker";
//spinwheel
var DJM_SPINWHEEL				= "djmspinwheel";
var DJM_SPINWHEELSLOT			= "djmspinwheelslot";
var DJM_SPINWHEELDATEPICKER		= "djmspinwheeldatepicker";
var DJM_SPINWHEELTIMEPICKER		= "djmspinwheeltimepicker";
// audio/video
var DJM_AUDIO = "djmaudio";
var DJM_VIDEO = "djmvideo";
// gauges
//var DGAUGES_CIRCULARGAUGE 			= "djmcirculargauge";
//var DGAUGES_RECTANGULARGAUGE 		= "djmrectangulargauge";
//var DGAUGES_CIRCULARLINEARGAUGE 	= "djmcircularlineargauge";
//var DGAUGES_SEMICIRCULARLINEARGAUGE = "djmsemicircularlineargauge";
//var DGAUGES_HORIZONTALLINEARGAUGE 	= "djmhorizontallineargauge";
//var DGAUGES_VERTICALLINEARGAUGE 	= "djmverticallineargauge";
//var DJM_GLOSSYCIRCULARGAUGE		= "djmglossycirculargauge";
var DJM_GAUGEBASE		= "djmgaugebase";

// carousel
var DJM_CAROUSEL				= "djmcarousel";
var DJM_DATACAROUSEL			= "djmdatacarousel";
var DJM_STORECAROUSEL			= "djmstorecarousel";
var DJM_CAROUSELITEM			= "djmcarouselitem";
var DJM_CAROUSELBUTTON			= "djmcarouselbutton";
var DJM_CAROUSELBUTTONNEXT		= "djmcarouselbuttonnext";
var DJM_CAROUSELBUTTONPREVIOUS	= "djmcarouselbuttonprevious";
//chart
var DCHART_CHART	= "djmchart";
// map
var DGEO_MAP			= "djmmap";
var DGEO_OPENLAYERMAP	= "djmopenlayermap";
// dijit widget
var DIJIT_CONTAINED	= "djmcontained";

// Dojo TagNames
//var DJM_TEXTBOX				= "djmtextbox";
//var DJM_BUTTON 			= "djmbutton";
var DJ_CHECKBOX 		= "djcheckbox";
var DJ_RADIOBUTTON		= "djradiobutton";
//var DJM_TOGGLEBUTTON	= "djmtogglebutton";
// var DOJO_UNIDENTIFIED	= "djmUnidentified";
var DJ_WIDGETBASE		= "djmelement";
var DJ_SELECT			= "select";
// var DJM_ICONMENUITEM		= "djmIconMenuItem";//TODO: This is temporary


//List of widgets to be identified
//in the following array order matters! the widget identification is based on "instanceof", then class hierachy must be 
//respected in reverse order (from subclasses to superclass)
//0 : dojo class
//1 : identifier for later user in recorder
var djmClassesMap = {		//"dijit._WidgetBase":DJ_WIDGETBASE,
		
							// views
                       		"dojox.mobile.SwapView": DJM_SWAPVIEW,
                       		"dojox.mobile.TreeView": DJM_TREEVIEW,
                       		"dojox.mobile.ScrollableView": DJM_SCROLLABLEVIEW,
                       		"dojox.mobile.View": DJM_VIEW,
                       		
                       		// viewcontroller is a singleton
                       		"dojox.mobile.ViewController": DJM_VIEWCONTROLLER,
                       		
                       		// heading
                       		"dojox.mobile.Heading": DJM_HEADING,
                       		
                       		// list categories             
                       		"dojox.mobile.EdgeToEdgeCategory": DJM_EDGETOEDGECATEGORY,
                       		"dojox.mobile.RoundRectCategory": DJM_ROUNDRECTCATEGORY,
                       		
                       		// lists
                       		"dojox.mobile.EdgeToEdgeDataList": DJM_EDGETOEDGEDATALIST,
                       		"dojox.mobile.EdgeToEdgeStoreList": DJM_EDGETOEDGESTORELIST,   
                       		"dojox.mobile.RoundRectDataList": DJM_ROUNDRECTDATALIST,
                       		"dojox.mobile.RoundRectStoreList": DJM_ROUNDRECTSTORELIST,
                       		"dojox.mobile.EdgeToEdgeList": DJM_EDGETOEDGELIST,
                       		"dojox.mobile.RoundRectList": DJM_ROUNDRECTLIST,
                       		
                       		// list items
                            "dojox.mobile.ListItem": DJM_LISTITEM,

                            // dojox.mobile.Container family
                       		"dojox.mobile.RoundRect": DJM_ROUNDRECT,
                       		"dojox.mobile.ContentPane": DJM_CONTENTPANE,
                       		"dojox.mobile.FixedSplitterPane": DJM_FIXEDSPLITTERPANE,
                       		"dojox.mobile.Container": DJM_CONTAINER,

                       		// dojox.mobile.Pane family
                       		"dojox.mobile.ScrollablePane": DJM_SCROLLABLEPANE,
                       		"dojox.mobile.SimpleDialog": DJM_SIMPLEDIALOG,                    		                       		
                       		"dojox.mobile.Pane": DJM_PANE,

                       		// dojox.mobile.Tooltip family
                       		"dojox.mobile.Opener": DJM_OPENER,
                       		"dojox.mobile.Tooltip": DJM_TOOLTIP,	

                       		// dojox.mobile.IconMenu
                       		"dojox.mobile.GridLayout": DJM_GRIDLAYOUT,
                       		"dojox.mobile.IconMenu": DJM_ICONMENU,
                       		
                       		// Button family
    						"dojox.mobile.RadioButton": DJM_RADIOBUTTON,               
    						"dojox.mobile.CheckBox": DJM_CHECKBOX,                       		
                           	"dojox.mobile.ToggleButton": DJM_TOGGLEBUTTON,                       		
                       		"dojox.mobile.Button": DJM_BUTTON,
                       		
                       		// TextBox family                       		
                       		"dojox.mobile.ComboBox": DJM_COMBOBOX,
                            "dojox.mobile.ExpandingTextArea": DJM_EXPANDINGTEXTAREA,
                            "dojox.mobile.TextArea": DJM_TEXTAREA,
                            "dojox.mobile.SearchBox": DJM_SEARCHBOX,
                            "dojox.mobile.TextBox": DJM_TEXTBOX,
                            
                            // ValuePicker family
							"dojox.mobile.ValuePickerSlot": DJM_VALUEPICKERSLOT,
							"dojox.mobile.ValuePickerTimePicker": DJM_VALUEPICKERTIMEPICKER,
							"dojox.mobile.ValuePickerDatePicker": DJM_VALUEPICKERDATEPICKER,
							"dojox.mobile.ValuePicker": DJM_VALUEPICKER,
						
							// SpinWheel family
							"dojox.mobile.SpinWheelSlot": DJM_SPINWHEELSLOT,
							"dojox.mobile.SpinWheelTimePicker": DJM_SPINWHEELTIMEPICKER,
							"dojox.mobile.SpinWheelDatePicker": DJM_SPINWHEELDATEPICKER,
							"dojox.mobile.SpinWheel": DJM_SPINWHEEL,

							// Audio family 
							"dojox.mobile.Video": DJM_VIDEO,
							"dojox.mobile.Audio": DJM_AUDIO,				

							// Carousel family
							"dojox.mobile.CarouselItem": DJM_CAROUSELITEM,
							"dojox.mobile.DataCarousel": DJM_DATACAROUSEL,
							"dojox.mobile.StoreCarousel": DJM_STORECAROUSEL,
							"dojox.mobile.Carousel": DJM_CAROUSEL,
							                       		
                            // misc
                       		"dojox.mobile.TabBar": DJM_TABBAR,
                       		"dojox.mobile.Overlay": DJM_OVERLAY,
                       		"dojox.mobile.FixedSplitter": DJM_FIXEDSPLITTER,
                       		"dojox.mobile.IconMenuItem": DJM_ICONMENUITEM,
                       		"dojox.mobile.ScreenSizeAware": DJM_SCREENSIZEAWARE,
                       		"dojox.mobile.ProgressIndicator": DJM_PROGRESSINDICATOR,
                       		"dojox.mobile.ProgressBar": DJM_PROGRESSBAR,
                       		"dojox.mobile.Rating": DJM_RATING,                      		
                           	"dojox.mobile.TabBarButton": DJM_TABBARBUTTON,
                           	"dojox.mobile.ToolBarButton": DJM_TOOLBARBUTTON,
                            "dojox.mobile.Switch": DJM_SWITCH,
    						"dojox.mobile.Slider": DJM_SLIDER,                        
                       		"dojox.mobile.IconContainer": DJM_ICONCONTAINER,
                            "dojox.mobile.IconItem": DJM_ICONITEM,
                            "dojox.mobile.Icon": DJM_ICON,
                            "dojox.mobile._IconItemPane": DJM_ICONITEMPANE,
                            "dojox.mobile.Accordion": DJM_ACCORDION,                        
                            "dojox.mobile.PageIndicator": DJM_PAGEINDICATOR,                          

                            // Gauges family
							"dojox.dgauges.GaugeBase": DJM_GAUGEBASE,
														
							// charts
							"dojox.charting.widget.Chart": DCHART_CHART,
							
							// maps
							"dojox.geo.charting.widget.Map": DGEO_MAP,
							"dojox.geo.openlayers.widget.Map": DGEO_OPENLAYERMAP,
							
							// last one
							"dijit._Contained": DIJIT_CONTAINED,
};

// List of Dojo Widgets supported by RTW. This list is used to identify the custom/unsupported widgets
// Widgets that have declaredClass value not in this list will be considered as a custom/unsupported widgets
var dojoSupportedWidgetClassList =["dojox.mobile.*",
                                   "dojox.dgauges.*",
                                   "dojox.charting.widget.Chart",
                                   "dojox.geo.*",
                           ];

// List of containers that can have child elements from other domains 
var dojoContainerList = [
                     "dijit._Contained",
                     "dojox.mobile.Heading",
                     "dijit.layout.ContentPane",
                     "dijit.form.Form",
                     "dojox.mobile.Container",
                     "dojox.mobile.ScrollableView" ,
                     "dojox.mobile.View",
                     "dojox.mobile.TreeView",
                     "dojox.mobile.RoundRect",
                     "dojox.mobile.ContentPane",
                     "dojox.mobile.FixedSplitterPane",
                     "dojox.mobile.Container",
                     "dojox.mobile.IconContainer",
                     "dojox.mobile.IconMenu",
                     "dojox.mobile._IconItemPane",
                     "dojox.mobile.ScrollablePane",
                     "dojox.mobile.SimpleDialog",
                     "dojox.mobile.Pane",
					 "dojox.mobile.EdgeToEdgeCategory",
					 "dojox.mobile.EdgeToEdgeDataList",
					 "dojox.mobile.EdgeToEdgeStoreList",
					 "dojox.mobile.EdgeToEdgeList",
					 "dojox.mobile.FixedSplitter",
					 "dojox.mobile.FixedSplitterPane",
					 "dojox.mobile.RoundRectCategory",
					 "dojox.mobile.RoundRectDataList",
					 "dojox.mobile.RoundRectList",
					 "dojox.mobile.TabBar",
					 "dojox.mobile.GridLayout",
					 "dojox.mobile.SwapView",
					 "dojox.mobile.ListItem",
					 "dojox.mobile.Accordion",
					 "dojox.mobile.SpinWheel",
					 "dojox.mobile.SpinWheelTimePicker",
					 "dojox.mobile.SpinWheelDatePicker",
					 "dojox.mobile.ValuePicker",
					 "dojox.mobile.ValuePickerTimePicker",
					 "dojox.mobile.ValuePickerDatePicker",
					 "dojox.geo.charting.widget.Map",
					 "dojox.mobile.DataCarousel",
					 "dojox.mobile.StoreCarousel",
					 "dojox.mobile.Carousel",
					 ];

// This map defines the Dojo Class Name and Proxy that handles the Dojo Widget
var dojoProxyMap={
		"dojox.mobile.TextBox":"DojoMobileTextBoxProxy",
		"dojox.mobile.SearchBox":"DojoMobileSearchBoxProxy",
		"dojox.mobile.ExpandingTextArea":"DojoMobileTextAreaProxy",
        "dojox.mobile.TextArea":"DojoMobileTextAreaProxy",
		"dojox.mobile.CheckBox":"DojoMobileCheckBoxRadioProxy",
		"dojox.mobile.RadioButton":"DojoMobileCheckBoxRadioProxy",
		"dojox.mobile.ToggleButton":"DojoMobileToggleButtonProxy",
		"dojox.mobile.Switch":"DojoMobileSwitchProxy",
		"dojox.mobile.Slider":"DojoMobileSliderProxy",
		"dojox.mobile.SwapView":"DojoMobileSwapviewProxy",
		"dojox.mobile.ScrollableView": "DojoMobileScrollableviewProxy",
		"dojox.mobile.Audio":"DojoMobileMediaProxy",
		"dojox.mobile.Video":"DojoMobileMediaProxy",
		"dojox.mobile.SpinWheelSlot":"DojoMobileSpinWheelSlotProxy",
		"dojox.mobile.SpinWheel":"DojoMobileSpinWheelPickerProxy",
		"dojox.mobile.SpinWheelTimePicker":"DojoMobileSpinWheelPickerProxy",
		"dojox.mobile.SpinWheelDatePicker":"DojoMobileSpinWheelPickerProxy",
		"dojox.mobile.ValuePicker":"DojoMobileValuePickerProxy",
		"dojox.mobile.ValuePickerDatePicker":"DojoMobileValuePickerProxy",
		"dojox.mobile.ValuePickerTimePicker":"DojoMobileValuePickerProxy",
		"dojox.mobile.ValuePickerSlot":"DojoMobileValuePickerSlotProxy",
		"dojox.dgauges.GaugeBase":"DojoMobileGaugeProxy",
		"dojox.mobile.ListItem":"DojoMobileListItemProxy",
};

var ignoreEventsOnClassName=[];

var tagsIgnoredByDojo =["html","head","script","title","meta","style","body"];
/*
 *
 *	Licensed Materials - Property of IBM
 *
 *	IBM Rational Mobile Test
 *
 *	(C) Copyright IBM Corporation 2014. All Rights Reserved. 
 *
 *	Note to U.S. Government Users Restricted Rights:  
 *	Use, duplication or disclosure restricted by GSA ADP
 *	Schedule Contract with IBM Corp. 
 *
 */

/////////////// Dojo Widget Proxy Region Start ////////////////////////////
//this, element, proxyClassName, proxyName, widget
DojoWidgetProxy = function(domainObj,element,proxyClass,proxyName,widget){
	if (arguments.length == 0) return; // don't do anything
	HtmlElementProxy.apply(this,arguments);
	this.widget = widget;
	this.proxyName = proxyName;
	widget.noCover = true;
	
	if (document.documentMode >= 10) { // IE10+
		require(["dojo/on", "dojo/touch"], function(on, touch) {
			widget.on(touch.press, function(event) {
				if (!event.recorded) {
					event.recorded = true;
					on.emit(widget.domNode, "mouseup", { bubbles: false, 
														cancelable: true, 
														clientX: event.clientX, 
														clientY: event.clientY });
				}
			});
		});
	}
};

DojoWidgetProxy.prototype = new HtmlElementProxy();

DojoWidgetProxy.prototype._htmlgetProperty=DojoWidgetProxy.prototype.getProperty;
DojoWidgetProxy.prototype.getProperty = function(propName) {
	var propValue = null;

	switch (propName) {
	/*
	 * case WebGuiConstants.CONTENT_PROP: //Get implementation from html domain
	 * propValue = this.getContent(); break;
	 */
	case WebGuiConstants.LABEL_PROP:
		propValue = this.getLabel();
		break;
	default:
		propValue = this._htmlgetProperty(propName);
		break;
	}

	return propValue;
};


DojoWidgetProxy.prototype._htmlapplyDecoratedProps = DojoWidgetProxy.prototype.applyDecoratedProps;
DojoWidgetProxy.prototype.applyDecoratedProps=function(targetElement){
	this._htmlapplyDecoratedProps(targetElement);
	targetElement.content = this.getProperty(WebGuiConstants.CONTENT_PROP);
	targetElement.label = this.getProperty(WebGuiConstants.LABEL_PROP); 
	// add declaredClass property for dojo widgets i.e. when this.element== widget.domNode
};

DojoWidgetProxy.prototype.getLabel = function() {
	var label = "";

	if (this.widget.domNode.hasAttribute("aria-labelledby")) {
		var labelElementId = this.widget.domNode
		.getAttribute("aria-labelledby");
		
			// use dojo.query as it is faster
			if(dojo.query){
				var srchquery = "label#"+labelElementId; 
				var result = dojo.query(srchquery); 
				if(result && result.length == 1){ 
					label = result[0].textContent; 
				}				
			}
			else{
				try{
				label = this.widget.domNode.ownerDocument.getElementById(labelElementId).textContent;
				}catch(err){
					console.log("Info:Error getting label.May be because of PopupContainers where ownerDocument comes as null"+err);
				}
			}
	}else{
		if(dojo.query){
			var srchquery = "label[for=" + this.widget.id + "]";
			var result = dojo.query(srchquery);
			if (result && result.length == 1) {
				label = result[0].textContent;
			}			
		}else{
			var tagName = this.element.tagName;
			if (tagName && tagName.toLowerCase() == "input" && this.element.parentElement) {
				var labelElt = jsUtil.getElementByAttribute('for', new Array(this.element.id), this.element.parentElement);
				if (labelElt)
					label = labelElt.textContent;
			}
		}
	}

	/*
	else {// Try using widget id attribute
		require([ "dojo/query", "dojo/dom" ], function(query, dom) {
			var srchquery = "label[for=" + this.widget.id + "]";
			var result = dojo.query(srchquery);
			if (result.length == 1) {
				label = result[0].textContent;
			}
		});}
	*/
	return label;
};



//TODO: This is a generic way. Either use dojo connect or move this code to base class
DojoWidgetProxy.prototype.installDojoEventWrapper=function( widget, methodName, eventHandlerFunction) {
	if (!widget[methodName + "$alreadyInstalled"]) {
		widget[methodName + "$alreadyInstalled"] = true;
		var original = widget[methodName];
		widget[methodName] = function() {
			return function(event) {
				eventHandlerFunction(widget,methodName,event);
				var ret = original ? original.apply(this, arguments) : true;
				return ret;
			};
		}();
	}
};

DojoWidgetProxy.prototype.getEventsToRegister = function(){
	return ["onClick"];
};

DojoWidgetProxy.prototype.installWrappers = function(){
	if (this.element && this.element.nodeType == window.Node.ELEMENT_NODE) {
		if(ignoreEventsOnClassName.indexOf(this.widget.declaredClass) >=0)
			return;
		var events = this.getEventsToRegister();
		if(events != null){
			for(var i=0;i<events.length;i++){
				this.installDojoEventWrapper( this.widget, events[i], this.handleEvent);
			}
		}

		return true; // Continue with ELEMENT_NODE children
	}
	
	return false; // Don't visit knon ELEMENT_NODE childrenreturn true;
};

DojoWidgetProxy.prototype.handleEvent = function(widget,methodName,event){
	//TODO: Important info about dojo event
	// event.target - the element that generated the event
	// event.currentTarget - the current target
	// event.relatedTarget - For mouseover and mouseout, the object that the mouse pointer is moving to or out of
	// event.charCode - For keypress events, the character code of the key pressed
	// event.keyCode - for keypress events, handles special keys like ENTER and spacebar.
	//rmotRecorder.log("DojoWidgetProxy: Event="+methodName+" Widget ="+widget.id+" Event= "+event);
	
	var proxy = domainManager.getProxy(event.target);
	if (proxy.isWidgetChild) return; // If set, do not record actions on widget's children
	
	var parameters = {};
	var eventName = methodName.toLowerCase();
	widget = dijit.registry.getEnclosingWidget(event.target);
	var dojoproxy = domainManager.getProxy(widget.domNode);
	var tagName = dojoproxy.getProperty(WebGuiConstants.TAGNAME_PROP);
	dojoproxy.domainObj._recordEvent(event, eventName, tagName, widget.domNode, parameters);
};

DojoWidgetProxy.prototype.isContainer =  function() {
	var type = djmClassesMap[this.widget.declaredClass];
	if (!type) { // Don't know this type
		return true;
	}
	return dojoContainerList.indexOf(this.widget.declaredClass)>=0;
};

DojoWidgetProxy.prototype._htmlisVisible = DojoWidgetProxy.prototype.isVisible;
DojoWidgetProxy.prototype.isVisible =  function() {
	var ret = this._htmlisVisible();
	
	if (!this.isContainer()) {
		if (ret.reachable) ret.visibility = true; // make final Dojo widgets visible if they are reachable
		ret.reachable = true;
	}
	
	return ret;
};


DojoWidgetProxy.prototype.tap = function() {
	var _target = this.widget;
	require(["dojo/on"], function(on){
		on.emit(_target, "tap", {
			bubbles: true,
			cancelable: true
		});
	});
	return RMOT_SUCCESS;
};

DojoWidgetProxy.prototype._executeAction0 = HtmlElementProxy.prototype.executeAction;
DojoWidgetProxy.prototype.executeAction = function(action) {
	LoggerService.logMsg(RMoTTrace, 'DojoWidgetProxy.prototype.executeAction('+ action.type +')');
	var retStatus = RMOT_FAILURE;
	var actionType = action.type;

	switch (actionType) {
	case "onkeypress" :
	case "onkeydown" :
		retStatus = RMOT_SUCCESS;
		break;
	case "onclick": 
		// Workaround for Dojo lib reg 
		// See code of touch.js at https://bugs.dojotoolkit.org/changeset/30449/legacy
		lastTouch = (new Date()).getTime() - 2000;

		// send _onClick event for IE10+
		if (this.widget._onClick) {
			var e = this.widget.domNode.ownerDocument.createEvent('Event');
			e.initEvent('_onClick', true, true);
			this.widget._onClick(e);
		}
		// Then execute default action
	default :
		retStatus = this._executeAction0(action);
		break;
	}
	return retStatus;
};

/////////////// Dojo Widget Proxy Region End ////////////////////////////

/////////////// Dojo Element Proxy Region Start ////////////////////////////

DojoElementProxy = function(domainObj,element,proxyClass,proxyName,widget){
	if (arguments.length == 0) return; // don't do anything
	HtmlElementProxy.apply(this,arguments);
	this.widget = widget;
};

DojoElementProxy.prototype = new HtmlElementProxy();// make DojoElementProxy inherit from a HtmlElementProxy object
DojoElementProxy.prototype.constructor = DojoElementProxy; // fix constructor property

DojoElementProxy.prototype.installWrappers = function(){
	// Do not install any wrappers of sub elements of Dojo Widgets
	var node = this.element;
	if (node && node.nodeType == window.Node.ELEMENT_NODE) {
		return true; // Continue with ELEMENT_NODE children
	}
	return false; // Don't visit knon ELEMENT_NODE childrenreturn true;
};

/////////////// Dojo Element Proxy Region Start ////////////////////////////

/*
 *
 *	Licensed Materials - Property of IBM
 *
 *	IBM Rational Mobile Test
 *
 *	(C) Copyright IBM Corporation 2014. All Rights Reserved. 
 *
 *	Note to U.S. Government Users Restricted Rights:  
 *	Use, duplication or disclosure restricted by GSA ADP
 *	Schedule Contract with IBM Corp. 
 *
 */

var DOJO_DOMAIN_NAME = "dojo";

var DojoDomain = function(){
	HTMLDomain.apply(this,arguments);
};
DojoDomain.prototype = new HTMLDomain();

DojoDomain.prototype.getDomainName = function(){
	return DOJO_DOMAIN_NAME;
};

DojoDomain.prototype.init = function(){
	/**
	 * Register a function that will be run when the DOM is fully loaded
	 */
	var domain = this;
	if (window.require && window.require.on) {
		require(["dojo/ready"], function(ready) {
			ready(100000, function(){
				domainManager.registerDomain(domain);
				if (jsUtil.isRecordingMode()) { // Recording only
					rmotRecorder.log("PARSEDOCUMENT================RMoTregisterDojoReady");
					rmotRecorder.log(jsUtil.getVersions());
					rmotRecorder.parseDocument();
					webGuiRecorderInterfaceObj.updateHierarchy();
				}							
			})
		});
	}
}

/**
 * Returns the version of the domain
 */
DojoDomain.prototype.getDomainVersion = function() {
	if (window.dojox) {
		return dojo.version.toString();
	}
	return "";
};

DojoDomain.prototype.getElementTagsListToIgnore = function(){
	return tagsIgnoredByDojo;
};

/**
 * This function tries to determine if the given element is a Dojo widget, or part of a Dojo widget.
 * 
 * @param element the DOM node to test
 * @returns true if it is a Dojo Widget or part of Dojo Widget else returns false 
 */
DojoDomain.prototype.getProxy=function(element){
	var proxy = null;
	
	var widget = this.getEnclosingObject(element);
	if (widget == null) return null; // Not identified as a Dojo object
	
	if(element == widget.domNode){
		var bSupported = false;
		if(jsUtil.isRecordingMode()){
			var widgetClassName = widget.declaredClass;
			for(var i=0;i<dojoSupportedWidgetClassList.length;i++){
				var supportedWidgetClassName = dojoSupportedWidgetClassList[i];
				if(jsUtil.endsWith(supportedWidgetClassName, "*")){
					supportedWidgetClassName = supportedWidgetClassName.substr(0,supportedWidgetClassName.length-1);
				}
				if(jsUtil.startsWith(widgetClassName, supportedWidgetClassName)){
					bSupported = true;
					break;
				}
			}
			
			if(!bSupported){
				// Unsupported Dojo Widget
				element.wgcustom = true;
			}
		}
		var elemInfo = this.getDojoElementInfo(widget);
		if(elemInfo){
			var proxyClassName = elemInfo[0];
			var proxyName = elemInfo[1];
			
			var concreteProxy = this.getConcreteProxy(widget, proxyClassName, proxyName);
			
			proxy = jsReflect.createObject(this, element, concreteProxy.className, concreteProxy.name, widget);			
		}else{
			// Should never come here as all Widgets extend from dijit._WidgetBase class
			proxy = new DojoElementProxy(this, element, "DojoElementProxy", DJ_WIDGETBASE, widget);
		}
	}else{
		// Element is Html Element that is used to design DojoWidget
		if(widget.domNode.wgcustom == true)
			element.wgcustom=true;
		proxy = new DojoElementProxy(this, element, "DojoElementProxy", DJ_WIDGETBASE, widget);
	}
	return proxy;
};


/**
 * This method helps to know if there's a Dojo widget containing, or being, the given DOM node.
 * It returns an array containing object tagname, meaningful event, new value, dom node corresponding to the widget annd the DJM widget itself, 
 * or null if there is no widget corresponding to the given DOM node
 * 
 * @param domNode the DOM node to test
 * process to give a tagName to all elements on the page: in that case we only need to know if the domNode is the root node of a widget.
 * 
 * @returns dojo widget containing the element 
 */
DojoDomain.prototype.getEnclosingObject=function(elem) {	
	
	if(!elem){
		return null;
	}
	if(!elem.tagName){
		return null;
	}
	if(elem && elem.tagName && tagsIgnoredByDojo.indexOf(elem.tagName.toLowerCase()) >=0){
		return null;
	}
	if(!(window.dijit && window.dijit.registry))
		return null;
	// does the domNode correspond to a Dojo Widget ?
	var widget = null;
	var elemId = elem.id;
	if(elemId && dijit.registry.byId(elemId)){
		widget = dijit.registry.byId(elemId);
	}
	else if(elem && dijit.registry.getEnclosingWidget(elem)){
		widget = dijit.registry.getEnclosingWidget(elem);
	}
	if (widget == null) return null;
	// test if the domNome is the widget's root node itself and not a sub element
	var widgetDomNode = widget.domNode;
	if (widgetDomNode != elem) {
		if (dojoContainerList.indexOf(widget.declaredClass) >= 0) {
			// Exclude some classes from testing, mainly containers like views.
			// For example if there's a html button (the domNode param) inside a dojo view,
			// the returned enclosing widget will be the dojo view: in that case it's not good because user clicked on html button 
			// and this is the element that matters, not the view.
			return null;
		}
	}
	
	// 50422: Do not identify elements as Dojo widgets if the declaredClass is not known
	if (!djmClassesMap[widget.declaredClass]) return null;
	
	return widget;		
};


DojoDomain.prototype.getDojoElementInfo=function(widget) {
	var proxyInfo = null;
	var type = null;
	for(var i=0;i<widget.constructor._meta.bases.length;i++){
		var widgetClass = widget.constructor._meta.bases[i].prototype.declaredClass;
		
		if(!proxyInfo)
			proxyInfo = dojoProxyMap[widgetClass];
		if(!type) {
			type = djmClassesMap[widgetClass];
		}
		
		if(proxyInfo && type) break;
	}
	
	if(jsUtil.startsWith(widget.declaredClass, "dojox.mobile")){
		if(proxyInfo == "DojoWidgetProxy"){
			proxyInfo = "DojoMobileWidgetProxy"
		}
		/*if(type == "djwidget"){
			type="djmwidget";
		}*/
	}
	
	if (!proxyInfo) {
		proxyInfo = "DojoMobileWidgetProxy"; // Better than nothing
		type = (!type) ? DOJO_UNIDENTIFIED : type;
	}
	 
	return [proxyInfo,type];
};

DojoDomain.prototype.getConcreteProxy=function(widget, proxyClassName, proxyName){
	var concreteProxy = { className: proxyClassName, name: proxyName};
	switch(proxyName) {
		//in case of a subclass of dijit._Contained it could be a DJM object that could be identified by its baseClass (or other attribute)
		case DIJIT_CONTAINED :
			if( widget.baseClass=="mblAccordionTitle" ) {
				concreteProxy.className = "DojoMobileAccordionTitleProxy";
				concreteProxy.name = DJM_ACCORDIONTITLE;
			}							
		break;
	};
	
	return concreteProxy;
};
/*
 *
 *	Licensed Materials - Property of IBM
 *
 *	IBM Rational Mobile Test
 *
 *	(C) Copyright IBM Corporation 2014. All Rights Reserved. 
 *
 *	Note to U.S. Government Users Restricted Rights:  
 *	Use, duplication or disclosure restricted by GSA ADP
 *	Schedule Contract with IBM Corp. 
 *
 */

/////////////////////////// DojoMobileWidgetProxy ///////////////////////////
DojoMobileWidgetProxy = function(domainObj,element){
	if (arguments.length == 0) return; 
	DojoWidgetProxy.apply(this,arguments);
	if (!jsUtil.isRecordingMode()) {
		this.dojoClick(element); // connect onclick event to _onClick for IE10+
	}
};
DojoMobileWidgetProxy.prototype = new DojoWidgetProxy();

DojoMobileWidgetProxy.prototype.dojoClick = function (element) {
	var widget = this.widget;
	if (widget._onClick) {
		widget.connect(widget.domNode, "onclick", "_onClick");
	}
};

DojoMobileWidgetProxy.prototype.getEventsToRegister = function(){
	return [dojoTriggeredEvent];
};

DojoMobileWidgetProxy.prototype._installDownEventWrapper = DojoMobileWidgetProxy.prototype.installDownEventWrapper;
DojoMobileWidgetProxy.prototype.installDownEventWrapper = function (eventName) {
	if (!this.element[eventName + "$alreadyInstalled"]) {
		if (jsUtil.isDesktop()) {
			var elt = this.element;
			require(["dojo/touch"], function(touch) {
				  touch.press(elt, function(event){
					  // Save coordinates of the down event
					  rmotRecorder.downEvent = { x: event.clientX || event.changedTouches[0].clientX, 
												 y: event.clientY || event.changedTouches[0].clientY };
				  });
				});
		}
		else { // Mobile
			this._installDownEventWrapper(eventName);
		}
		
		this.element[eventName + "$alreadyInstalled"] = true;
	}		
};

DojoMobileWidgetProxy.prototype.installDojoEventWrapper=function( widget, methodName, eventHandlerFunction) {
	if (!widget[methodName + "$alreadyInstalled"]) {
		widget[methodName + "$alreadyInstalled"] = true;
		
		var elt = this.element;
		if (jsUtil.isDesktop() && methodName == dojoTriggeredEvent) {
			// Fix for mouseup events that is not fired anymore on desktop browsers
			require(["dojo/touch"], function(touch) {
				  touch.release(elt, function(event) {
					  if (!event.recorded && !jsUtil.isDragEvent(event, methodName, dojoTriggeredEvent)) {
						  eventHandlerFunction(elt, methodName, event);
					  }
					  event.recorded = true;
				  });
				});
			return;
		}
		
		require(["dojo/on"], function(on){
			on(elt, methodName, function(event) {
				var eventName = RMoTeventPrefix + methodName;
				if (!event.recorded && !jsUtil.isDragEvent(event, eventName, dojoTriggeredEvent)) {
					eventHandlerFunction(elt, methodName, event);

					if (RMoTAndroid) {
						// Give focus to input text widgets
						if (typeof(widget.focus)!='undefined') {
							widget.focus();
						}
					}
				}
				event.recorded = true;
			});
		});
	}
};

DojoMobileWidgetProxy.prototype._dojoHandleEvent=DojoMobileWidgetProxy.prototype.handleEvent;
DojoMobileWidgetProxy.prototype.handleEvent = function(element,eventName,event){
	if (eventName==dojoTriggeredEvent) eventName = "onclick";
	
	var proxy = domainManager.getProxy(element);
	proxy._dojoHandleEvent(element, eventName, event);
};

/**
 * To be used when a specific dojo method wrapper must be installed on a dojo widget class
 */
DojoMobileWidgetProxy.prototype.subscribeDojoTopic = function(topic, methodName, func) {
	if (!window[methodName]) {
		window[methodName] = func;
		require(["dojo/_base/connect"], function(connect) {
			connect.subscribe(topic, methodName);
		});
	}
};

DojoMobileWidgetProxy.prototype._dojoMobileWidgetGetProperty=DojoMobileWidgetProxy.prototype.getProperty;
DojoMobileWidgetProxy.prototype.getProperty = function(propName) {
	var propValue = null;

	switch (propName) {
	case WebGuiConstants.ENABLED_PROP:
		var disabled = this.widget.disabled;
		propValue = (disabled) ? !disabled : true;
		break;
	default:
		propValue = this._dojoMobileWidgetGetProperty(propName);
		break;
	}

	return propValue;
};

DojoMobileWidgetProxy.prototype._dojoMobileWidgetApplyDecoratedProps = DojoMobileWidgetProxy.prototype.applyDecoratedProps;
DojoMobileWidgetProxy.prototype.applyDecoratedProps = function(targetElement){
	this._dojoMobileWidgetApplyDecoratedProps(targetElement);
	targetElement.enabled = this.getProperty(WebGuiConstants.ENABLED_PROP);
};
/////////////////////////// DojoMobileWidgetProxy End ///////////////////////

/////////////////////////// DojoMobileTextBoxProxy //////////////////////////
DojoMobileTextBoxProxy = function(domainObj,element){
	if (arguments.length == 0) return; 
	DojoMobileWidgetProxy.apply(this,arguments);
};
DojoMobileTextBoxProxy.prototype = new DojoMobileWidgetProxy();

DojoMobileTextBoxProxy.prototype.handleEvent = function(element,eventName,event) {
	if (eventName == "keydown" || eventName == "onkeydown") {
		if (event.keyCode == 13) { // need to capture enter key
			eventName="onkeypress";
		}
		// else will be managed as a repeated action
	}
	else {
		eventName = "onclick";
		webGuiRecorderInterfaceObj.webGuiRecorderObj.openSoftKeyboard();
	}

	var proxy = domainManager.getProxy(element);
	var tagName = proxy.getProperty(WebGuiConstants.TAGNAME_PROP);
	proxy.domainObj._recordEvent(event, eventName, tagName, element, proxy.getParameters());
};

DojoMobileTextBoxProxy.prototype.getParameters = function () {
	var parameters = {};
	parameters.newtext = this.getProperty(WebGuiConstants.CONTENT_PROP);
	return parameters;
};

DojoMobileTextBoxProxy.prototype.getRepeatedAction = function () {
	return {"onkeydown": "oninput",
			"keydown": "oninput"};
};

DojoMobileTextBoxProxy.prototype.getEventsToRegister = function(){
	return [dojoTriggeredEvent,"onkeydown","keydown"];
};

DojoMobileTextBoxProxy.prototype._dojoGetProperty=DojoMobileTextBoxProxy.prototype.getProperty;
DojoMobileTextBoxProxy.prototype.getProperty = function(propName) {
	var propValue = null;

	switch (propName) {
	case WebGuiConstants.CONTENT_PROP:
		propValue = this.element.value;
		break;
	default:
		propValue = this._dojoGetProperty(propName);
		break;
	}

	return propValue;
};
/////////////////////////// DojoMobileTextBoxProxy End //////////////////////

/////////////////////////// DojoMobileSearchBoxProxy ////////////////////////
DojoMobileSearchBoxProxy = function(domainObj,element){
	if (arguments.length == 0) return; 
	DojoMobileTextBoxProxy.apply(this,arguments);
};
DojoMobileSearchBoxProxy.prototype = new DojoMobileTextBoxProxy();

DojoMobileSearchBoxProxy.prototype._executeAction9 = DojoMobileSearchBoxProxy.prototype.executeAction;
DojoMobileSearchBoxProxy.prototype.executeAction = function(action) {
	LoggerService.logMsg(RMoTTrace, 'DojoMobileSearchBoxProxy.prototype.executeAction('+ action.type +')');
	var retStatus = RMOT_FAILURE;
	var actionType = action.type;

	retStatus = this._executeAction9(action);
	
	if (actionType == "oninput") {
		this.widget.emit("search");
	}
	
	return retStatus;
};
///////////////////////// DojoMobileSearchBoxProxy End //////////////////////

/////////////////////////// DojoMobileTextAreaProxy /////////////////////////
DojoMobileTextAreaProxy = function(domainObj,element){
	if (arguments.length == 0) return; 
	DojoMobileTextBoxProxy.apply(this,arguments);
};
DojoMobileTextAreaProxy.prototype = new DojoMobileTextBoxProxy();

DojoMobileTextAreaProxy.prototype.handleEvent = function(element,eventName,event){
	eventName = (eventName==dojoTriggeredEvent) ? "onclick" : eventName;
	
	var proxy = domainManager.getProxy(element);
	var tagName = proxy.getProperty(WebGuiConstants.TAGNAME_PROP);
	proxy.domainObj._recordEvent(event, eventName, tagName, element, proxy.getParameters());
};
/////////////////////////// DojoMobileTextAreaProxy End /////////////////////

/////////////////////////// DojoMobileCheckBoxRadioProxy ////////////////////
DojoMobileCheckBoxRadioProxy = function(domainObj,element){
	if (arguments.length == 0) return; 
	DojoMobileWidgetProxy.apply(this,arguments);
};
DojoMobileCheckBoxRadioProxy.prototype = new DojoMobileWidgetProxy();

DojoMobileCheckBoxRadioProxy.prototype._dojoMobileWidgetHandleEvent=DojoMobileCheckBoxRadioProxy.prototype.handleEvent;
DojoMobileCheckBoxRadioProxy.prototype.handleEvent = function(element,methodName,event){
	var proxy = domainManager.getProxy(element);
	proxy._dojoMobileWidgetHandleEvent(element, methodName, event);
};

DojoMobileCheckBoxRadioProxy.prototype._dojoGetProperty=DojoMobileCheckBoxRadioProxy.prototype.getProperty;
DojoMobileCheckBoxRadioProxy.prototype.getProperty = function(propName) {
	var propValue = null;

	switch (propName) {
	case WebGuiConstants.CHECKED_PROP:
		propValue = (this.widget.get("value")) ? true : false;
		break;
	case WebGuiConstants.LABEL_PROP:
		propValue = this.widget.label;
		break;
	default:
		propValue = this._dojoGetProperty(propName);
		break;
	}

	return propValue;
}; 

DojoMobileCheckBoxRadioProxy.prototype._dojoApplyDecoratedProps = DojoMobileCheckBoxRadioProxy.prototype.applyDecoratedProps;
DojoMobileCheckBoxRadioProxy.prototype.applyDecoratedProps = function(targetElement){
	this._dojoApplyDecoratedProps(targetElement);
	targetElement.checked = this.getProperty(WebGuiConstants.CHECKED_PROP);
	targetElement.label = this.getProperty(WebGuiConstants.LABEL_PROP);
};
/////////////////////////// DojoMobileCheckBoxRadioProxy End ////////////////

/////////////////////////// DojoMobileToggleButtonProxy ////////////////////
DojoMobileToggleButtonProxy = function(domainObj,element){
	if (arguments.length == 0) return; 
	DojoMobileCheckBoxRadioProxy.apply(this,arguments);
};
DojoMobileToggleButtonProxy.prototype = new DojoMobileCheckBoxRadioProxy();

DojoMobileToggleButtonProxy.prototype._dojoMobileCheckBoxRadioGetProperty=DojoMobileCheckBoxRadioProxy.prototype.getProperty;
DojoMobileToggleButtonProxy.prototype.getProperty = function(propName) {
	var propValue = null;

	switch (propName) {
	case WebGuiConstants.CHECKED_PROP:
		// This is what is different with the toggle button compared to check box and radio: its property name is not "value" but "checked"
		propValue = (this.widget.get("checked")) ? true : false;
		break;
	default:
		propValue = this._dojoMobileCheckBoxRadioGetProperty(propName);
		break;
	}

	return propValue;
}; 

/////////////////////////// DojoMobileToggleButtonProxy End ////////////////

/////////////////////////// DojoMobileSwitchProxy ///////////////////////////
DojoMobileSwitchProxy = function(domainObj,element){
	if (arguments.length == 0) return; 
	DojoMobileWidgetProxy.apply(this,arguments);
}
DojoMobileSwitchProxy.prototype = new DojoMobileWidgetProxy();

DojoMobileSwitchProxy.prototype._dojoGetProperty=DojoMobileSwitchProxy.prototype.getProperty;
DojoMobileSwitchProxy.prototype.getProperty = function(propName) {
	var propValue = null;

	switch (propName) {
	case WebGuiConstants.CONTENT_PROP:
		propValue = this.widget.value;
		break;
	default:
		propValue = this._dojoGetProperty(propName);
		break;
	}

	return propValue;
};

DojoMobileSwitchProxy.prototype.installDojoEventWrapper=function( widget, methodName, eventHandlerFunction) {
	if (!widget[methodName + "$alreadyInstalled"]) {
		widget[methodName + "$alreadyInstalled"] = true;

		var elt = this.element;
		var proxy = domainManager.getProxy(elt);
		require(["dojo/on"], function(on){
			on(elt, dojoTriggeredEvent, function(event){
				if (!event.recorded) {
					eventHandlerFunction(elt, methodName, event);
				}
				event.recorded = true;
			});
		});
	}
};
/////////////////////////// DojoMobileSwitchProxy End ///////////////////////

/////////////////////////// DojoMobileSliderProxy ///////////////////////////
DojoMobileSliderProxy = function(domainObj,element){
	if (arguments.length == 0) return; 
	DojoMobileWidgetProxy.apply(this,arguments);
};
DojoMobileSliderProxy.prototype = new DojoMobileWidgetProxy();

DojoMobileSliderProxy.prototype.getRepeatedAction = function () {
	var map = {};
	map[dojoTriggeredEvent] = "onchange";
	return map;
};

DojoMobileSliderProxy.prototype.installDojoEventWrapper=function( widget, methodName, eventHandlerFunction) {
	if (!widget[methodName + "$alreadyInstalled"]) {
		widget[methodName + "$alreadyInstalled"] = true;

		var elt = this.element;
		var proxy = domainManager.getProxy(elt);
		require(["dojo/on"], function(on){
			on(elt, methodName, function(event){
				if (!event.recorded) {
					eventHandlerFunction(elt, methodName, event);
				}
				event.recorded = true;
			});
		});
		
		rmotHierarchy.setSavedProperties(this); // 52821
	}
};

DojoMobileSliderProxy.prototype.handleEvent = function(element,eventName,event) {
	var proxy = domainManager.getProxy(element);
	var tagName = proxy.getProperty(WebGuiConstants.TAGNAME_PROP);
	proxy.domainObj._recordEvent(event, eventName, tagName, element, proxy.getParameters());
};

DojoMobileSliderProxy.prototype.getParameters = function () {
	var parameters = {};
	parameters.newtext = this.getValue();
	return parameters;
};

DojoMobileSliderProxy.prototype.getValue = function() {
	return '' + this.widget.value;
};

DojoMobileSliderProxy.prototype.getPropertiesToSave = function() {
	return [WebGuiConstants.CONTENT_PROP, "value"];
};

DojoMobileSliderProxy.prototype._dojoMobileWidgetProxy=DojoMobileSliderProxy.prototype.getProperty;
DojoMobileSliderProxy.prototype.getProperty = function(propName) {
	var propValue = null;

	switch (propName) {
	case WebGuiConstants.CONTENT_PROP:
	case "value":
		propValue = '' + this.getValue();
		break;
	case "max":
	case "min":
	case "step":
		propValue = this.widget[propName];
		break;
	default:
		propValue = this._dojoMobileWidgetProxy(propName);
		break;
	}
	return propValue;
};

DojoMobileSliderProxy.prototype._dojoApplyDecoratedProps = DojoMobileSliderProxy.prototype.applyDecoratedProps;
DojoMobileSliderProxy.prototype.applyDecoratedProps = function(targetElement){
	this._dojoApplyDecoratedProps(targetElement);
	targetElement.max=this.getProperty("max");
	targetElement.value=this.getProperty(WebGuiConstants.CONTENT_PROP);
	targetElement.min=this.getProperty("min");
	targetElement.step=this.getProperty("step");
};

DojoMobileSliderProxy.prototype._executeAction3 = DojoMobileSliderProxy.prototype.executeAction;
DojoMobileSliderProxy.prototype.executeAction = function(action) {
	LoggerService.logMsg(RMoTTrace, 'DojoMobileSliderProxy.prototype.executeAction('+ action.type +')');
	var retStatus = RMOT_FAILURE;
	var actionType = action.type;

	switch (actionType) {
	case "onchange" :
		this.widget.set("value", action.parameters[0].value);
		retStatus = RMOT_SUCCESS;
		break;
	default :
		retStatus = this._executeAction3(action);
		break;
	}
	return retStatus;
};
/////////////////////////// DojoMobileSliderProxy End ///////////////////////

/////////////////////////// DojoMobileSwapviewProxy /////////////////////////
DojoMobileSwapviewProxy = function(domainObj,element){
	if (arguments.length == 0) return; 
	DojoMobileWidgetProxy.apply(this,arguments);
};
DojoMobileSwapviewProxy.prototype = new DojoMobileWidgetProxy();

DojoMobileSwapviewProxy.prototype.isVisible =  function() {
	// make the swapview visible
	return { visibility: true, propagation: false, reachable: true };
};

DojoMobileSwapviewProxy.prototype.installDojoEventWrapper=function(element, methodName, eventHandlerFunction) {
	
	if (!element[methodName + "$alreadyInstalled"]) {
		element[methodName + "$alreadyInstalled"] = true;
		
		var proxy = domainManager.getProxy(element.domNode);
		
		// Updating hierarchy and taking snapshot when the swapview is created
		this.subscribeDojoTopic("/dojox/mobile/afterTransitionIn", "dojoViewCreated",  function() {
			proxy.startSwipe(element);
		});
		
		// Compute direction and log event swipe. Then take snapshot
		this.subscribeDojoTopic("/dojox/mobile/viewChanged", "dojoViewChanged",  function(view) {
			var startSwapView = window.startSwapView;
			if (startSwapView != null) {
				var previousWidget = view.previousView(view.domNode);
				if (startSwapView !== view.domNode) {
					
					var direction = (previousWidget && startSwapView === previousWidget.domNode) ? 0 : 1; // left : right
					
					var proxy = domainManager.getProxy(startSwapView);
					var tagName = proxy.getProperty(WebGuiConstants.TAGNAME_PROP);
					
					if(jsUtil.isDesktop()){
						proxy.domainObj._recordEventWithExistingScreenshot("onswipe", tagName, startSwapView, rmotHierarchy.currentHierarchy, {direction:direction}, proxy.screenshotid);	
					}
					else {
						proxy.takeSnapshot = false;
						var jsonString = rmotRecorder.buildJsonStringMobile("onswipe", tagName, startSwapView, rmotHierarchy.currentHierarchy, {direction:direction});
						rmotRecorder.logEvent(jsonString);
					}
					
					// Take a new snapshot after onswipe to hack the Java recording
					proxy.domainObj._recordEvent(null, RMoTstartEvent, tagName, startSwapView, null);
					
					webGuiRecorderInterfaceObj.updateHierarchy();
				}
			}
		});
		
		// Save current swapview to determine swap direction
		require(["dojo/on"], function(on){
			on(element, "touchstart", function(event){
				window.startSwapView = element.domNode;
				
				var proxy = domainManager.getProxy(window.startSwapView);
				if(jsUtil.isDesktop()){
					proxy.screenshotid = proxy.domainObj._captureScreenshot();	
				}
				
				if (!window.swapViewCreated) {
					// 48727: Update hierarchy and take snapshot if the swapview has not yet been created
					proxy.startSwipe(element);
				}
			});
		});
	}
	
};

DojoMobileSwapviewProxy.prototype.startSwipe = function(element) {
	// Update hierarchy and take snapshot
	var tagName = this.getProperty(WebGuiConstants.TAGNAME_PROP);
	this.domainObj._recordEvent(null, RMoTstartEvent, tagName, element.domNode, null);
	window.swapViewCreated = true;
};

DojoMobileSwapviewProxy.prototype._executeAction1 = DojoMobileSwapviewProxy.prototype.executeAction;
DojoMobileSwapviewProxy.prototype.executeAction = function(action) {
	LoggerService.logMsg(RMoTTrace, 'DojoMobileSwapviewProxy.prototype.executeAction('+ action.type +')');
	var retStatus = RMOT_FAILURE;
	var actionType = action.type;

	switch (actionType) {
	case "onswipe" :
		// if (_direction == 1) it means 'right' else if (_direction == 0) it means 'left'
		// and the direction defined in RTW Editor is the opposite of the dojo swap direction
		var _direction = (action.parameters[0].value == 0) ? 1 : 0;
		this.widget.goTo(_direction);
		retStatus = RMOT_SUCCESS;
		break;
	default :
		retStatus = this._executeAction1(action);
		break;
	}
	return retStatus;
};
/////////////////////////// DojoMobileSwapviewProxy End /////////////////////

///////////////////////// DojoMobileAccordionTitleProxy /////////////////////
DojoMobileAccordionTitleProxy = function(domainObj,element){
	if (arguments.length == 0) return; 
	DojoMobileWidgetProxy.apply(this,arguments);
};
DojoMobileAccordionTitleProxy.prototype = new DojoMobileWidgetProxy();

DojoMobileAccordionTitleProxy.prototype._dojoMobileHandleEvent=DojoMobileAccordionTitleProxy.prototype.handleEvent;
DojoMobileAccordionTitleProxy.prototype.handleEvent = function(widget,eventName,event) {

	var proxy = domainManager.getProxy(widget);
	proxy._dojoMobileHandleEvent(widget,eventName,event);
};

DojoMobileAccordionTitleProxy.prototype.getInnerProperty = function(elem, prop) {
	for (var j=0; j < elem.attributes.length; j++)
		if (elem.attributes[j].name == prop)
			return elem.attributes[j].value;

	for (var i=0; i < elem.childNodes.length; i++) {
		var ret = this.getInnerProperty(elem.childNodes[i], prop);
		if (ret != undefined)
			return ret;
	}
	return undefined;
};

DojoMobileAccordionTitleProxy.prototype._dojoGetProperty=DojoMobileAccordionTitleProxy.prototype.getProperty;
DojoMobileAccordionTitleProxy.prototype.getProperty = function(propName) {
	var propValue = null;

	switch (propName) {
	case WebGuiConstants.TAGNAME_PROP:
		propValue = DJM_ACCORDIONTITLE;
		break;
	case WebGuiConstants.COLLAPSED_PROP:
		var collapsed = this.getInnerProperty(document.getElementById(this.getInnerProperty(this.element, "aria-controls")), "aria-expanded");
		propValue = (collapsed=='true') ? false : true;
		break;
	default:
		propValue = this._dojoGetProperty(propName);
		break;
	}

	return propValue;
};

DojoMobileAccordionTitleProxy.prototype._dojoApplyDecoratedProps = DojoMobileAccordionTitleProxy.prototype.applyDecoratedProps;
DojoMobileAccordionTitleProxy.prototype.applyDecoratedProps = function(targetElement){
	this._dojoApplyDecoratedProps(targetElement);
	targetElement.collapsed = this.getProperty(WebGuiConstants.COLLAPSED_PROP);
};

DojoMobileAccordionTitleProxy.prototype.isContainer = function() {
	return false;
};

DojoMobileAccordionTitleProxy.prototype._executeAction2 = DojoMobileAccordionTitleProxy.prototype.executeAction;
DojoMobileAccordionTitleProxy.prototype.executeAction = function(action) {
	LoggerService.logMsg(RMoTTrace, 'DojoMobileAccordionTitleProxy.prototype.executeAction('+ action.type +')');
	var retStatus = RMOT_FAILURE;
	var actionType = action.type;
	this.setTarget(this.element);

	switch (actionType) {
	case "oncollapse" :
	case "onexpand" :
		var _expd = this.getProperty(WebGuiConstants.COLLAPSED_PROP);
		if ((_expd && (actionType == "onexpand")) || (!_expd && (actionType == "oncollapse"))) {			
			this.click();
			retStatus = RMOT_SUCCESS;			
		}
		break;
	default :
		retStatus = this._executeAction2(action);
		break;
	}
	return retStatus;
};
/////////////////////////// DojoMobileAccordionTitleProxy End /////////////////

///////////////////////// DojoMobileMediaProxy ////////////////////////////////
DojoMobileMediaProxy = function(domainObj,element){
	if (arguments.length == 0) return; 
	DojoMobileWidgetProxy.apply(this,arguments);
};
DojoMobileMediaProxy.prototype = new DojoMobileWidgetProxy();

DojoMobileMediaProxy.prototype.getEventsToRegister = function(){
	return [dojoTriggeredEvent,"pause","playing"];
};

DojoMobileMediaProxy.prototype.handleEvent = function(element,eventName,event){
	var proxy = domainManager.getProxy(element);
	if (eventName==dojoTriggeredEvent) {
		proxy.touched = true;	// media paused by user or at the end of the track
		return;
	}
	
	if (proxy.touched) {
		proxy._dojoHandleEvent(element, RMoTeventPrefix+eventName, event);
		proxy.touched = false;
	}
	
};
DojoMobileMediaProxy.prototype._executeAction6 = DojoMobileMediaProxy.prototype.executeAction;
DojoMobileMediaProxy.prototype.executeAction = function(action) {
	LoggerService.logMsg(RMoTTrace, 'DojoMobileMediaProxy.prototype.executeAction('+ action.type +')');
	var retStatus = RMOT_FAILURE;
	var actionType = action.type;
	this.setTarget(this.element);

	switch (actionType) {
	case "onplaying" :
		// call the html5 play method
		this.element.play();
		retStatus = RMOT_SUCCESS;
		break;
	case "onpause" :
		// call the html5 pause method
		this.element.pause();
		retStatus = RMOT_SUCCESS;
		break;
	default :
		retStatus = this._executeAction6(action);
		break;
	}
	return retStatus;
};
/////////////////////////// DojoMobileMediaProxy End //////////////////////////

///////////////////////// DojoMobileSpinWheelSlotProxy ////////////////////////
DojoMobileSpinWheelSlotProxy = function(domainObj,element){
	if (arguments.length == 0) return; 
	DojoMobileWidgetProxy.apply(this,arguments);
};
DojoMobileSpinWheelSlotProxy.prototype = new DojoMobileWidgetProxy();

DojoMobileSpinWheelSlotProxy.prototype.installDojoEventWrapper=function( widget, methodName, eventHandlerFunction) {
	if (!widget[methodName + "$alreadyInstalled"]) {
		widget[methodName + "$alreadyInstalled"] = true;
		var original = widget[methodName];
		widget[methodName] = function() {
			return function(event) {
				
				eventHandlerFunction(widget,methodName,event);
				
				var ret = original ? original.apply(this, arguments) : true;
				return ret;
			};
		}();
	}
};

DojoMobileSpinWheelSlotProxy.prototype.handleEvent = function(widget,eventName,event){
	if (widget.domNode) {
		var proxy = domainManager.getProxy(widget.domNode);
		var tagName = proxy.getProperty(WebGuiConstants.TAGNAME_PROP);
		proxy.domainObj._recordEvent(event, eventName, tagName, widget.domNode, proxy.getParameters());
	}
	event.recorded = true;
	
};

DojoMobileSpinWheelSlotProxy.prototype.getEventsToRegister = function(){
	return ["onTouchStart"/*,"slideTo"*/];
};

DojoMobileSpinWheelSlotProxy.prototype.getRepeatedAction = function () {
	return {"onTouchStart": "onchange"};
};

DojoMobileSpinWheelSlotProxy.prototype.getParameters = function () {
	var parameters = {};
	parameters.newtext = this.getProperty(WebGuiConstants.CONTENT_PROP);
	return parameters;
};

DojoMobileSpinWheelSlotProxy.prototype.getValue = function () {
	return this.widget.get("value");
};

DojoMobileSpinWheelSlotProxy.prototype._dojoGetProperty=DojoMobileSpinWheelSlotProxy.prototype.getProperty;
DojoMobileSpinWheelSlotProxy.prototype.getProperty = function(propName) {
	var propValue = null;
	switch (propName) {
	case WebGuiConstants.CONTENT_PROP:
		propValue = this.getValue();
		break;
	default:
		propValue = this._dojoGetProperty(propName);
		break;
	}
	return propValue;
};

DojoMobileSpinWheelSlotProxy.prototype._executeAction5 = DojoMobileSpinWheelSlotProxy.prototype.executeAction;
DojoMobileSpinWheelSlotProxy.prototype.executeAction = function(action) {
	LoggerService.logMsg(RMoTTrace, 'DojoMobileSpinWheelSlotProxy.prototype.executeAction('+ action.type +')');
	var retStatus = RMOT_FAILURE;
	var actionType = action.type;

	switch (actionType) {
	case "onchange" :
		this.widget.set("value", action.parameters[0].value);
		retStatus = RMOT_SUCCESS;
		break;
	default :
		retStatus = this._executeAction5(action);
		break;
	}
	return retStatus;
};
///////////////////////// DojoMobileSpinWheelSlotProxy End ////////////////////

///////////////////////// DojoMobileSpinWheelPickerProxy //////////////////////
DojoMobileSpinWheelPickerProxy = function(domainObj,element){
	if (arguments.length == 0) return; 
	DojoMobileSpinWheelSlotProxy.apply(this,arguments);
};
DojoMobileSpinWheelPickerProxy.prototype = new DojoMobileSpinWheelSlotProxy();

DojoMobileSpinWheelPickerProxy.prototype.installDojoEventWrapper=function( widget, methodName, eventHandlerFunction) {
	var slots = this.widget.slots;
	for(var i=0;i<slots.length;i++) {
		var slot = slots[i];
		
		if (!slot[methodName + "$alreadyInstalled"]) {
			slot[methodName + "$alreadyInstalled"] = true;
			var original = slot[methodName];
			slot[methodName] = function() {
				return function(event) {
					
					eventHandlerFunction(widget,methodName,event);
					
					var ret = original ? original.apply(this, arguments) : true;
					return ret;
				};
			}();
		}
	}
};

var _SLOTVALUE = 'value';
var _SLOTSEPARATOR = ' ';

DojoMobileSpinWheelPickerProxy.prototype.getValue = function () {
	var value = "";
	var slots = this.widget.slots;
	for(var i=0;i<slots.length;i++) {
		var slot = slots[i];
		value = value + (slot.get(_SLOTVALUE) + _SLOTSEPARATOR);
	}
	return value.substring(0, value.length-1);;
};

DojoMobileSpinWheelPickerProxy.prototype._executeAction4 = DojoMobileSpinWheelPickerProxy.prototype.executeAction;
DojoMobileSpinWheelPickerProxy.prototype.executeAction = function(action) {
	LoggerService.logMsg(RMoTTrace, 'DojoMobileSpinWheelPickerProxy.prototype.executeAction('+ action.type +')');
	var retStatus = RMOT_FAILURE;
	var actionType = action.type;

	switch (actionType) {
	case "onchange" :
		var arrayOfVars = action.parameters[0].value.split(_SLOTSEPARATOR);
		var slots = this.widget.slots;
		for (var i=0; i<slots.length; i++) {
			slots[i].set(_SLOTVALUE, arrayOfVars[i]);
		}
		retStatus = RMOT_SUCCESS;
		break;
	default :
		retStatus = this._executeAction4(action);
		break;
	}
	return retStatus;
};

/////////////////////////// DojoMobileSpinWheelPickerProxy End ////////////////

///////////////////////// DojoMobileValuePickerProxy //////////////////////////
DojoMobileValuePickerProxy = function(domainObj,element){
	if (arguments.length == 0) return; 
	DojoMobileSpinWheelPickerProxy.apply(this,arguments);
};
DojoMobileValuePickerProxy.prototype = new DojoMobileSpinWheelPickerProxy();

DojoMobileValuePickerProxy.prototype.getEventsToRegister = function() {
	return ["onClick"];
};

DojoMobileValuePickerProxy.prototype.getRepeatedAction = function () {
	return {"onClick": "onchange"};
};

//////////////////// DojoMobileValuePickerProxy End ///////////////////////////

///////////////////////// DojoMobileValuePickerSlotProxy //////////////////////
DojoMobileValuePickerSlotProxy = function(domainObj,element){
	if (arguments.length == 0) return; 
	DojoMobileWidgetProxy.apply(this,arguments);
};
DojoMobileValuePickerSlotProxy.prototype = new DojoMobileWidgetProxy();

DojoMobileValuePickerSlotProxy.prototype.handleEvent = function(element,eventName,event){
	// Do nothing
};
/////////////////////////// DojoMobileValuePickerSlotProxy End ////////////////

///////////////////////// DojoMobileGaugeProxy ////////////////////////////////
DojoMobileGaugeProxy = function(domainObj,element){
	if (arguments.length == 0) return; 
	DojoWidgetProxy.apply(this,arguments);
	
	this.setWidgetChild(this.element.getElementsByTagName("*"));
};
DojoMobileGaugeProxy.prototype = new DojoWidgetProxy();

DojoMobileGaugeProxy.prototype.getEventsToRegister = function(){
	return ["onStartEditing"];
};

DojoMobileGaugeProxy.prototype.getRepeatedAction = function () {
	return {"onStartEditing": "onchange"};
};

DojoMobileGaugeProxy.prototype.handleEvent = function(widget,eventName,event){
	var element = widget.domNode;
	var proxy = domainManager.getProxy(element);
	var tagName = proxy.getProperty(WebGuiConstants.TAGNAME_PROP);
	proxy.domainObj._recordEvent(event, eventName, tagName, element, proxy.getParameters());
};

DojoMobileGaugeProxy.prototype.getParameters = function () {
	var parameters = {};
	parameters.newtext = this.getProperty(WebGuiConstants.CONTENT_PROP);
	return parameters;
};

DojoMobileGaugeProxy.prototype._dojoGetProperty=DojoMobileGaugeProxy.prototype.getProperty;
DojoMobileGaugeProxy.prototype.getProperty = function(propName) {
	var propValue = null;

	switch (propName) {
	case WebGuiConstants.CONTENT_PROP:
		propValue = this.getValue();
		break;
	default:
		propValue = this._dojoGetProperty(propName);
		break;
	}

	return propValue;
};

DojoMobileGaugeProxy.prototype.getValue = function () {
	return ""+this.widget.get("value");
};

DojoMobileGaugeProxy.prototype.isContainer =  function() {
	return false;
};

DojoMobileGaugeProxy.prototype._executeAction7 = DojoMobileGaugeProxy.prototype.executeAction;
DojoMobileGaugeProxy.prototype.executeAction = function(action) {
	LoggerService.logMsg(RMoTTrace, 'DojoMobileGaugeProxy.prototype.executeAction('+ action.type +')');
	var retStatus = RMOT_FAILURE;
	var actionType = action.type;

	switch (actionType) {
	case "onchange" :
		this.widget.set("value", action.parameters[0].value);
		retStatus = RMOT_SUCCESS;
		break;
	default :
		retStatus = this._executeAction7(action);
		break;
	}
	return retStatus;
};
/////////////////////////// DojoMobileGaugeProxy End //////////////////////////

///////////////////////// DojoMobileListItemProxy /////////////////////////////
DojoMobileListItemProxy = function(domainObj,element){
	if (arguments.length == 0) return; 
	DojoMobileWidgetProxy.apply(this,arguments);
//	if (!jsUtil.isRecordingMode()) {
//		this.dojoClick(element);
//	}
};
DojoMobileListItemProxy.prototype = new DojoMobileWidgetProxy();

DojoMobileListItemProxy.prototype.isContainer = function() {
//	var nl = this.element.getElementsByTagName("a"); 
//	return (nl.length != 0);
	return true;
};

DojoMobileListItemProxy.prototype.getEventsToRegister = function(){ // 44930
	return [dojoTriggeredEvent,"onkeydown","keydown"];
};

//DojoMobileListItemProxy.prototype.dojoClick = function (element) {
//	var widget = this.widget;
//	require(["dojo/on"], function(on){
//		on(element, 'click', function(event) {
//			widget.onClick(event);
//		});
//	});
//};

/////////////////////////// DojoMobileListItemProxy End ///////////////////////

/////////////////////////// DojoMobileScrollableviewProxy /////////////////////
DojoMobileScrollableviewProxy = function(domainObj,element){
	if (arguments.length == 0) return; 
	DojoMobileWidgetProxy.apply(this,arguments);
};
DojoMobileScrollableviewProxy.prototype = new DojoMobileWidgetProxy();

DojoMobileScrollableviewProxy.prototype.getEventsToRegister = function(){ // 44930
	return ["onAfterScroll"];
};

DojoMobileScrollableviewProxy.prototype.getRepeatedAction = function () {
	return {"onAfterScroll": "onscroll"};
};

DojoMobileScrollableviewProxy.prototype.installDojoEventWrapper=function(widget, methodName, eventHandlerFunction) {
	if (!widget[methodName + "$alreadyInstalled"]) {
		widget[methodName + "$alreadyInstalled"] = true;
		
		var elt = this.element;
		widget[methodName] = function(event) {
			//console.log("SCROLL TO: "+event.x+' // '+event.y+' // '+element.scrollDir);
			var proxy = domainManager.getProxy(elt);	
			proxy.scrollCoords = { x: event.x, y: event.y };
			eventHandlerFunction(elt,methodName,event);
		};
		
	}
	
};

DojoMobileScrollableviewProxy.prototype.handleEvent = function(element,eventName,event){
	var proxy = domainManager.getProxy(element);
	var tagName = proxy.getProperty(WebGuiConstants.TAGNAME_PROP);
	proxy.domainObj._recordEvent(event, eventName, tagName, element, proxy.getParameters());
};

DojoMobileScrollableviewProxy.prototype.getParameters = function () {
	var parameters = {};
	var x = this.scrollCoords.x;
	parameters.x = isNaN(x) ? 0 : parseInt(x);
	var y = this.scrollCoords.y;
	parameters.y = isNaN(y) ? 0 : parseInt(y);
	return parameters;
};

DojoMobileScrollableviewProxy.prototype._executeAction8 = DojoMobileScrollableviewProxy.prototype.executeAction;
DojoMobileScrollableviewProxy.prototype.executeAction = function(action) {
	LoggerService.logMsg(RMoTTrace, 'DojoMobileScrollableviewProxy.prototype.executeAction('+ action.type +')');
	var retStatus = RMOT_FAILURE;
	var actionType = action.type;
	switch (actionType) {
	case "onscroll" :
		var coords = {x: parseInt(action.parameters[1].value), y: parseInt(action.parameters[0].value)};
		this.widget.scrollTo(coords);
		retStatus = RMOT_SUCCESS;
		break;
	default :
		retStatus = this._executeAction8(action);
		break;
	}
	return retStatus;
};
///////////////////////// DojoMobileScrollableviewProxy End /////////////////
/*
 *
 *	Licensed Materials - Property of IBM and/or HCL
 *
 *	IBM Rational Mobile Test
 *
 *	(C) Copyright IBM Corporation 2014, 2016. 
 *  Copyright HCL Technologies Ltd. 2017.  All Rights Reserved.
 *
 *	Note to U.S. Government Users Restricted Rights:  
 *	Use, duplication or disclosure restricted by GSA ADP
 *	Schedule Contract with IBM Corp. 
 *
 */


// kind of constants defining JQuery Mobile objects
var JQM_UNIDENTIFIED		= "jqmunidentified";
var JQM_BUTTON 				= "jqmbutton";
var JQM_SLIDER 				= "jqmslider";
var JQM_RANGESLIDER			= "jqmrangeslider";
var JQM_CHECKBOX 			= "jqmcheckbox";
var JQM_RADIO				= "jqmradio";
var JQM_COLLAPSIBLE			= "jqmcollapsible";
var JQM_COLLAPSIBLE_CONTENT	= "jqmcollapsiblecontent";
var JQM_COLLAPSIBLE_HEADER	= "jqmcollapsibleheader";
var JQM_LISTVIEW			= "jqmlistview";
var JQM_LISTVIEW_ITEM		= "jqmlistviewitem";
var JQM_SELECT				= "jqmselect";
var JQM_COLUMNTOGGLE_BUTTON	= "jqmcolumntogglebutton";
var JQM_TEXTINPUT			= "jqmtextinput";
var JQM_SEARCHINPUT			= "jqmsearchinput";
var JQM_SEARCHINPUT_CLEAR	= "jqmsearchinputclearbutton";
var JQM_FLIP_TOGGLE_SWITCH	= "jqmfliptoggleswitch";
var JQM_AUTOCOMPLETE		= "jqmautocomplete";
var JQM_CONTROL_GROUP		= "jqmcontrolgroup";
var JQM_CONTROLS			= "jqmcontrols";
var JQM_GRID				= "jqmgrid";
var JQM_BAR					= "jqmbar";
var JQM_NAVBAR				= "jqmnavbar";
var JQM_PANEL				= "jqmpanel";
var JQM_POPUP				= "jqmpopup";
var JQM_TABLE				= "jqmtable";
var JQM_TEXTAREA			= "jqmtextarea";
var JQM_TOOLBAR				= "jqmtoolbar";


var JQUI_WIDGET				=	"jqmelement";
var JQUI_ACCORDION			=	JQM_COLLAPSIBLE_HEADER;
var JQUI_ACCORDIONCONTENT   =   JQM_COLLAPSIBLE;
var JQUI_TABPANNEL			=  	"jquitabpanel";
var JQUI_TAB				=  	"jquitab";
var JQUI_TABSNAV			=  	"jquitabsnav";
var JQUI_TABS				=  	"jquitabs";
var JQUI_AUTOCOMPLETE       =  	JQM_SEARCHINPUT;
var JQUI_MENU				=  	"jquimenu";
var JQUI_MENUITEM			=  	"jquimenuitem";
var JQUI_PROGRESSBAR        =   "jquiprogressbar";
var JQUI_DATETEXTINPUT      =   "jquidateinput";
var JQUI_DATEPICKER         =   "jquidatepicker";
var JQM_DIALOG				=	"jqmdialog";
var JQUI_CLOSEICON          =   "jquicloseicon";
var JQUI_SPINNER			=	"jquispinner";

var JqDefaultWidget =		"ui-widget";

var JQUERYUI_DEFAULT_PROXY = "JQueryUIElementProxy";

var jQueryWidgets = [{key: 'class', value:'ui-accordion-header', name:JQUI_ACCORDION},
                        {key: 'class', value:'ui-accordion', name:JQUI_WIDGET},
                        {key: 'class', value:'ui-accordion-header-icon', name:JQUI_WIDGET},
                        {key: 'class', value:'ui-accordion-content', name:JQUI_ACCORDIONCONTENT},
                        {key: 'class', value:'ui-collapsible', name:JQM_COLLAPSIBLE},
                        {key: 'class', value:'ui-collapsible-heading-toggle', name:JQM_COLLAPSIBLE_HEADER},
                        {key: 'class', value:'ui-collapsible-content', name:JQM_COLLAPSIBLE_CONTENT},
                        {key: 'class', value:'ui-tabs', name:JQUI_TABS},
                        {key: 'class', value:'ui-tabs-nav', name:JQUI_TABSNAV},
                        {key: 'class', value:'ui-icon-close', name:JQUI_CLOSEICON},
                        {key: 'class', value:'ui-tabs-anchor', name:JQUI_TAB},
                        {key: 'class', value:'ui-tabs-panel', name:JQUI_TABPANNEL},
                        {key: 'class', value:'ui-autocomplete-input', name:JQUI_AUTOCOMPLETE},
                        {key: 'class', value:'ui-input-text', name:JQM_TEXTINPUT},
                        {key: 'class', value:'ui-checkbox', name:JQM_CHECKBOX},
                        {key: 'class', value:'ui-radio', name:JQM_RADIO},
                        {key: 'class', value:'ui-selectmenu-button', name:JQM_SELECT},                        
                        {key: 'class', value:'ui-helper-hidden-accessible', name:JQUI_WIDGET},                        
                        {key: 'class', value:'hasDatepicker', name:JQUI_DATETEXTINPUT},
                        {key: 'class', value:'ui-datepicker', name:JQUI_DATEPICKER},
                        {key: 'class', value:'ui-menu', name:JQUI_MENU},                        
                        {key: 'class', value:'ui-menu-item', name:JQUI_MENUITEM},
                        {key: 'class', value:'ui-progressbar', name:JQUI_PROGRESSBAR},
                        {key: 'class', value:'ui-slider-handle', name:JQUI_WIDGET},
                        {key: 'class', value:'ui-slider', name:JQM_SLIDER},
                        {key: 'class', value:'ui-spinner', name:JQUI_SPINNER},
                        {key: 'class', value:'ui-spinner-input', name:JQUI_WIDGET},
                        {key: 'class', value:'ui-spinner-button', name:JQUI_WIDGET},
                        {key: 'class', value:'ui-dialog', name:JQM_DIALOG},
                        {key: 'class', value:'ui-dialog-titlebar-close', name:JQM_BUTTON},
                        {key: 'class', value:'ui-controlgroup', name:JQM_CONTROL_GROUP},
                        {key: 'class', value:'ui-flipswitch', name:JQM_FLIP_TOGGLE_SWITCH},
                        {key: 'class', value:'ui-slider-switch', name:JQM_FLIP_TOGGLE_SWITCH},
                        {key: 'class', value:'ui-grid-a', name:JQM_GRID},
                        {key: 'class', value:'ui-grid-b', name:JQM_GRID},
                        {key: 'class', value:'ui-grid-c', name:JQM_GRID},
                        {key: 'class', value:'ui-grid-d', name:JQM_GRID},
                        {key: 'class', value:'ui-bar', name:JQM_BAR},
                        {key: 'class', value:'ui-listview', name:JQM_LISTVIEW},
                        {key: 'class', value:'ui-li-static', name:JQM_LISTVIEW_ITEM},
                        {key: 'class', value:'ui-li', name:JQM_LISTVIEW_ITEM},
                        {key: 'class', value:'ui-input-search', name:JQM_SEARCHINPUT},
                        {key: 'class', value:'ui-input-clear', name:JQM_SEARCHINPUT_CLEAR},
                        {key: 'class', value:'ui-navbar', name:JQM_NAVBAR},
                        {key: 'class', value:'ui-panel', name:JQM_PANEL},
                        {key: 'class', value:'ui-popup', name:JQM_POPUP},
                        {key: 'class', value:'ui-rangeslider', name:JQM_RANGESLIDER},
                        {key: 'class', value:'ui-select', name:JQM_SELECT},
                        {key: 'class', value:'ui-table', name:JQM_TABLE},
                        {key: 'class', value:'ui-header', name:JQM_TOOLBAR},
                        {key: 'class', value:'ui-footer', name:JQM_TOOLBAR},
                        {key: 'class', value:'ui-controlgroup-controls', name:JQM_CONTROLS},
                        {key: 'data-role', value:'controlgroup-controls', name:JQM_CONTROLS},
                        {key: 'class', value:'ui-button', name:JQM_BUTTON},
                        {key: 'class', value:'ui-btn', name:JQM_BUTTON},
                        {key: 'class', value:'ui-buttonset', name:JQUI_WIDGET},
                        {key: 'class', value:'ui-button-text', name:JQUI_WIDGET},
                        {key: 'class', value:'ui-btn-text', name:JQUI_WIDGET}
                        ];

// List of containers having child elements
var JqContainerList = [JQM_COLLAPSIBLE,
                       JQM_CONTROL_GROUP,
                       JQM_CONTROLS,
                       JQM_GRID,
                       JQM_BAR,
                       JQM_LISTVIEW,
                       JQM_LISTVIEW_ITEM,
                       JQM_NAVBAR,
                       JQM_PANEL,
                       JQM_POPUP,
                       JQUI_TAB,
                       JQUI_TABS,
                       JQUI_TABPANNEL,
                       JQUI_MENU,
                       JQUI_MENUITEM,
                       JQUI_WIDGET,
                       JQM_TABLE,
                       JQM_TOOLBAR,
                       JQM_DIALOG,
                       JQM_SLIDER,
                       JQM_RANGESLIDER,
                       JQM_SEARCHINPUT,
                       JQUI_DATETEXTINPUT,
                       JQUI_DATEPICKER,
                       JQM_TEXTINPUT,
                       JQUI_ACCORDIONCONTENT,
					   JQUI_ACCORDION,
					   JQM_COLLAPSIBLE_HEADER,
					   JQM_COLLAPSIBLE_CONTENT
					   ];
				   
// Can not find a better way to initialize a map with keys declared as variables
var jqueryMobileProxyMap={};
jqueryMobileProxyMap[JQM_BUTTON]				= "JQueryMobileButtonProxy";
jqueryMobileProxyMap[JQM_CHECKBOX]				= "JQueryCheckBoxRadioProxy";
jqueryMobileProxyMap[JQM_RADIO]					= "JQueryCheckBoxRadioProxy";
jqueryMobileProxyMap[JQM_COLLAPSIBLE]			= "JQueryMobileElementProxy";
jqueryMobileProxyMap[JQM_COLLAPSIBLE_CONTENT]	= "JQueryMobileCollapsibleContentProxy";
jqueryMobileProxyMap[JQM_COLLAPSIBLE_HEADER]	= "JQueryMobileCollapsibleProxy";
jqueryMobileProxyMap[JQM_CONTROL_GROUP]			= "JQueryMobileControlGroupProxy";
jqueryMobileProxyMap[JQM_CONTROLS]				= "JQueryMobileControlGroupProxy";
jqueryMobileProxyMap[JQM_FLIP_TOGGLE_SWITCH]	= "JQueryMobileFlipSwitchProxy";
jqueryMobileProxyMap[JQM_GRID]					= "JQueryMobileElementProxy";
jqueryMobileProxyMap[JQM_BAR]					= "JQueryMobileElementProxy";
jqueryMobileProxyMap[JQM_LISTVIEW]				= "JQueryMobileElementProxy";
jqueryMobileProxyMap[JQM_LISTVIEW_ITEM]			= "JQueryMobileElementProxy";
jqueryMobileProxyMap[JQM_SEARCHINPUT]			= "JQueryMobileTextInputProxy";
jqueryMobileProxyMap[JQM_SEARCHINPUT_CLEAR]		= "JQueryMobileWidgetProxy";
jqueryMobileProxyMap[JQM_TEXTINPUT]				= "JQueryMobileTextInputProxy";
jqueryMobileProxyMap[JQUI_AUTOCOMPLETE]			= "JQueryMobileTextInputProxy";
jqueryMobileProxyMap[JQM_NAVBAR]				= "JQueryMobileElementProxy";
jqueryMobileProxyMap[JQM_PANEL]					= "JQueryMobileElementProxy";
jqueryMobileProxyMap[JQM_POPUP]					= "JQueryMobileElementProxy";
jqueryMobileProxyMap[JQM_SLIDER]				= "JQueryMobileSliderProxy";
jqueryMobileProxyMap[JQM_RANGESLIDER]			= "JQueryMobileRangeSliderProxy";
jqueryMobileProxyMap[JQM_SELECT]				= "JQueryMobileSelectProxy";
jqueryMobileProxyMap[JQM_TABLE]					= "JQueryMobileElementProxy";
jqueryMobileProxyMap[JQM_TOOLBAR]				= "JQueryMobileElementProxy";
jqueryMobileProxyMap[JQUI_DATEPICKER]			= "JQueryMobileDatePickerProxy";

var jqueryUIProxyMap={};
jqueryUIProxyMap[JQM_DIALOG]					= "JQueryUIDialogProxy";
jqueryUIProxyMap[JQUI_SPINNER]					= "JQueryUISpinnerProxy";
jqueryUIProxyMap[JQM_SLIDER]					= "JQueryUISliderProxy";
jqueryUIProxyMap[JQUI_ACCORDION]				= "JQueryUIaccordionHeaderProxy";
jqueryUIProxyMap[JQUI_ACCORDIONCONTENT]			= "JQueryUIWidgetProxy";
jqueryUIProxyMap[JQM_BUTTON]					= "JQueryUIButtonProxy";
jqueryUIProxyMap[JQUI_TABPANNEL]				= "JQueryUITabProxy";
jqueryUIProxyMap[JQUI_TAB]						= "JQueryUITabProxy";
jqueryUIProxyMap[JQUI_AUTOCOMPLETE]				= "JQueryUITextInputProxy";
jqueryUIProxyMap[JQM_TEXTINPUT]					= "JQueryUITextInputProxy";
jqueryUIProxyMap[JQUI_MENUITEM]					= "JQueryUIMenuItemProxy";
jqueryUIProxyMap[JQM_SELECT]					= "JQueryUISelectmenuProxy";
jqueryUIProxyMap[JQUI_MENU]						= "JQueryUIMenuProxy";
jqueryUIProxyMap[JQUI_PROGRESSBAR]				= "JQueryProgressBarProxy";
jqueryUIProxyMap[JQUI_DATETEXTINPUT]			= "JQueryUIDateInputProxy";
jqueryUIProxyMap[JQUI_DATEPICKER]				= "JQueryUIDateProxy";
jqueryUIProxyMap[JQUI_CLOSEICON]				= "JQueryUIWidgetProxy";
jqueryUIProxyMap[JQUI_TABS]						= "JQueryUIElementProxy";
jqueryUIProxyMap[JQUI_TABSNAV]					= "JQueryUIElementProxy";
jqueryUIProxyMap[JQUI_WIDGET]					= "JQueryUIElementProxy";
jqueryUIProxyMap[JQM_CONTROL_GROUP]				= "JQueryMobileControlGroupProxy";
jqueryUIProxyMap[JQM_CONTROLS]					= "JQueryMobileControlGroupProxy";

var jqueryUtil = {
		
		/**
		 * Utility function to test a value in a element's class list
		 */
		classListContains:function(element,value){
			if( element.classList==null ){
				return false;
			}
			return element.classList.contains(value);
		},
		
		/**
		 * Returns true if a click handler is attached to the element 
		 */
		isClickEventHandler: function(element) {
			if (jQuery._data && jQuery._data(element, 'events')) {
				var ret = false;
				jQuery.each(jsUtil.getClickEvents(), function( i, eventName ) {
					eventName = eventName.replace(RMoTeventPrefix, '');
					if (jQuery._data(element, 'events')[eventName]) {
						ret = true;
						return false; // Exit jQuery each loop
					}
					
				})
				return ret;
			}
			return false;
		}
		
	
};


/*
 *
 *	Licensed Materials - Property of IBM
 *
 *	IBM Rational Mobile Test
 *
 *	(C) Copyright IBM Corporation 2014. All Rights Reserved. 
 *
 *	Note to U.S. Government Users Restricted Rights:  
 *	Use, duplication or disclosure restricted by GSA ADP
 *	Schedule Contract with IBM Corp. 
 *
 */

var tagsIgnoredByJQuery =["html","head","script","title","meta","style","body"];
var JQUERY_DOMAIN_NAME = "jquery";

var JQueryDomain = function() {
	HTMLDomain.apply(this,arguments);
};
JQueryDomain.prototype = new HTMLDomain();

JQueryDomain.prototype.init = function() {
	/**
	 * Register a function that will be run when the DOM is fully loaded
	 */
	var domain = this;
	// jQuery.fn.on is supported only in v1.7 and above
	// We do not want to register for jQuery domain unless its available
	if (window.jQuery && jQuery.fn && jQuery.fn.on) {	
		webGuiUtil.jQuery(document).ready(function() {
			domainManager.registerDomain(domain);
			if (jsUtil.isRecordingMode()) { // Recording only
				rmotRecorder.log("PARSEDOCUMENT================registerJQueryReady");
				rmotRecorder.log(jsUtil.getVersions());
				rmotRecorder.parseDocument();
				webGuiRecorderInterfaceObj.updateHierarchy();
			}					
		});
	}
}

JQueryDomain.prototype.getWidgets=function(){
	return jQueryWidgets;
}

/**
 * Returns the name of the domain ="jquery"
 */
JQueryDomain.prototype.getDomainName=function(){
	return JQUERY_DOMAIN_NAME;
};

/**
 * Returns the version of the domain
 */
JQueryDomain.prototype.getDomainVersion=function() {
	var v = ' / ';
	if (window.jQuery && jQuery.fn) {
		v += jQuery.fn.jquery + ' (UI)';	
	}
	
	if (window.jQuery && jQuery.mobile) {
		v += ' / ' + jQuery.mobile.version + ' (Mobile)';	
	}
	
	return v.substring(3, v.length);;
};

JQueryDomain.prototype.getProxy=function(element) {
	var proxy = null;
	if(jQuery.mobile){
		this.jqueryMap = jqueryMobileProxyMap;
	}else{//jQuery.ui
		this.jqueryMap = jqueryUIProxyMap;
	}
	
	var jqObject = this.getEnclosingObject(element);
	if (jqObject == null) return null; // Not identified as a jQuery object
	
	var proxyClassName = this.jqueryMap[jqObject];
	
	if (jqObject==JQUI_WIDGET) {jqObject = null;} // JQUI_WIDGET can not be instantiated
	
	var concreteProxy = this.getConcreteProxy(element, proxyClassName, jqObject); // 43835
	if (concreteProxy != null) {
		proxy = jsReflect.createObject(this, element, concreteProxy.className, concreteProxy.name);
	}
	
	return proxy;
};

JQueryDomain.prototype.getConcreteProxy=function(element, proxyClassName, proxyName){
	var concreteProxy = { className: proxyClassName, name: proxyName};
	var tagName = element.tagName.toLowerCase();
	switch(proxyClassName) {
		case "JQueryMobileTextInputProxy":
		if (tagName=="textarea") {
			concreteProxy.className = "JQueryMobileTextAreaProxy";
			concreteProxy.name = JQM_TEXTAREA;
		}
		if (element.hasChildNodes() && inputTypesHTML5.indexOf(element.childNodes[0].type) >= 0) {
			// Do not identify elements having HTML5 input types as jQuery widgets
			return null;
		}
		break;
		case "JQueryMobileButtonProxy":
		if (tagName=="li" || (element.parentNode && element.parentNode.tagName.toLowerCase()=="li")) {
			concreteProxy.className = "JQueryMobileListviewItemProxy";
			concreteProxy.name = JQM_LISTVIEW_ITEM;
		}
		break;
		case "JQueryMobileSliderProxy":
		if (jqueryUtil.classListContains(element,"ui-slider-switch")) {
			concreteProxy.className = "JQueryMobile_13x_FlipSwitchProxy";
			concreteProxy.name = JQM_FLIP_TOGGLE_SWITCH;
		}
		break;
		case "JQueryUIMenuItemProxy":
		if (parseInt(jsUtil.getMainWindow().jQuery().jquery) >= 3) {
			concreteProxy.className = "HtmlElementProxy";
		}
		break;
		case "JQueryUISelectmenuProxy":
		if (jqueryUtil.classListContains(element,"ui-select")) {
			 return null;
		}
		break;
	};
	
	if(jQuery.mobile && tagName=="label") { // Don't want to identify label as a JQuery object on mobile
		return null
	}
	
	return concreteProxy;
};
/*
 *
 *	Licensed Materials - Property of IBM
 *
 *	IBM Rational Mobile Test
 *
 *	(C) Copyright IBM Corporation 2014 - 2015. All Rights Reserved. 
 *
 *	Note to U.S. Government Users Restricted Rights:  
 *	Use, duplication or disclosure restricted by GSA ADP
 *	Schedule Contract with IBM Corp. 
 *
 */


//////////////////////////////JQueryUIElementProxy ///////////////////////////
JQueryUIElementProxy = function(domainObj,element){
	if (arguments.length == 0) return;
	HtmlElementProxy.apply(this,arguments);
};

JQueryUIElementProxy.prototype = new HtmlElementProxy();

JQueryUIElementProxy.prototype.installWrappers = function(){
	if (this.element && this.element.nodeType == window.Node.ELEMENT_NODE) {
		return true; // Continue with ELEMENT_NODE children
	}
	return false; // Don't visit known ELEMENT_NODE children return true;
};
////////////////////////////////// JQueryUIElementProxy //////////////////

///////////////////////////// JQueryUIWidgetProxy Start /////////////////////////

JQueryUIWidgetProxy = function(domainObj,element){
	if (arguments.length == 0) return; // don't do anything
	JQueryUIElementProxy.apply(this,arguments);
};

JQueryUIWidgetProxy.prototype = new JQueryUIElementProxy();

JQueryUIWidgetProxy.prototype.getEventsToRegister = function(){
	return [RMOT_TRIGGER_EVENT /*,"ontap"*/];
};

JQueryUIWidgetProxy.prototype.installWrappers = function(){
	if (this.element && this.element.nodeType == window.Node.ELEMENT_NODE) {
		var events = this.getEventsToRegister();
		if(events != null){
			for(var i=0;i<events.length;i++){
				// this.installJQueryEventWrapper( this.element, events[i], this.handleEvent);
				this.installEventWrapper( events[i], this.handleEvent);
			}
		}
		return true; // Continue with ELEMENT_NODE children
	}
	
	return false; // Don't visit knon ELEMENT_NODE childrenreturn true;
};

JQueryUIWidgetProxy.prototype.installEventWrapper = function (eventName, handler) {

	if (!this.element[eventName + "$alreadyInstalled"]) {

		this.element[eventName + "$alreadyInstalled"] = true;
		this.element.rmotOriginalHandler[eventName] = this.element[eventName];

		this.element[eventName] = function(event) {
			// if already handled then ignore the event
			// if isWidgetChild is defined by the event.target proxy then ignore the event
			var targetProxy = domainManager.getProxy(event.target);
			if (!event.recorded && !targetProxy.isWidgetChild) {
				handler(this, eventName, event);
			}

			var ret = this.rmotOriginalHandler[eventName] ? 
					this.rmotOriginalHandler[eventName].apply(this, arguments) : true;
			this.proxy.domainObj._parseDocument();
			return ret;
		};		
	}		
};

JQueryUIWidgetProxy.prototype.interceptEvent=function( widget, methodName, eventHandlerFunction) {
	if (!widget[methodName + "$alreadyInstalled"]) {
		widget[methodName + "$alreadyInstalled"] = true;
		this.element.rmotOriginalHandler[methodName] = widget[methodName];
		widget[methodName] = function() {
			return function(event) {
				if (!event.recorded)
					eventHandlerFunction(widget,methodName,event);
				var ret = this.rmotOriginalHandler[methodName] ? 
						this.rmotOriginalHandler[methodName].apply(this, arguments) : true;
				return ret;
			};
		}();
	}
};

JQueryUIWidgetProxy.prototype._htmlgetProperty=JQueryUIWidgetProxy.prototype.getProperty;
JQueryUIWidgetProxy.prototype.getProperty = function(propName) {
	var propValue = null;

	switch (propName) {
	case WebGuiConstants.TOOL_TIP:
		propValue = this.element.title;
		break;
	case WebGuiConstants.LABEL_PROP:
		var label = webGuiUtil.jQuery(this.element).find('label');
		if (!label.length) label = webGuiUtil.jQuery(this.element).prev('label');
		propValue = (label.length) ? webGuiUtil.jQuery(label[0]).text() : "";
		propValue = jsUtil.trim(propValue);
		break;
	default:
		propValue = this._htmlgetProperty(propName);
		break;
	}

	return propValue;
};


JQueryUIWidgetProxy.prototype._htmlapplyDecoratedProps = JQueryUIWidgetProxy.prototype.applyDecoratedProps;
JQueryUIWidgetProxy.prototype.applyDecoratedProps=function(targetElement){
	this._htmlapplyDecoratedProps(targetElement);
	 if(this.element.title)
		 targetElement.tooltip = targetElement.title;
};

JQueryUIWidgetProxy.prototype.handleEvent = function(element,methodName,event){
		rmotRecorder.log("RMoTJSI: JQueryUIWidgetProxy: Event="+methodName+" Element ="+element.className+" Event= "+event);
		var parameters = {};
		parameters.enableasyncaction = false;
		var eventName = methodName.toLowerCase();
		var jqueryproxy = domainManager.getProxy(element);
		var tagName = jqueryproxy.getProperty(WebGuiConstants.TAGNAME_PROP);
		// var updatedHier = jqueryproxy.domainObj._updateHierarchy();// Updating current hierarchy before recording the event
		jqueryproxy.domainObj._recordEvent(event, eventName, tagName, element, parameters);
		event.recorded = true;
	};

JQueryUIWidgetProxy.prototype.isContainer =  function() {
	return JqContainerList.indexOf(this.proxyName)>=0;
};

JQueryUIWidgetProxy.prototype._htmlisVisible = JQueryUIWidgetProxy.prototype.isVisible;
JQueryUIWidgetProxy.prototype.isVisible =  function() {
	var ret = this._htmlisVisible();
	
	if (!this.isContainer()) {	// make final JQuery widgets visible
		ret.visibility = true;
	}
	
	return ret;
};


//------------------------------------------------------------
//               P  L  A  Y  B  A  C  K
//------------------------------------------------------------

JQueryUIWidgetProxy.prototype._htmlexecuteAction = JQueryUIWidgetProxy.prototype.executeAction;
JQueryUIWidgetProxy.prototype.executeAction = function(action) {
	LoggerService.logMsg(RMoTTrace, 'JQueryUIWidgetProxy.prototype.executeAction('+ action.type +')');
	var retStatus = RMOT_FAILURE;
	var actionType = action.type;

	var target = this.getTarget();
	var proxyName = this.getProxyName();
	if ((proxyName == JQM_LISTVIEW_ITEM) || (proxyName == JQM_COLLAPSIBLE)) {
		target = webGuiUtil.jQuery(this.element).find('a')[0];
	} else if ((proxyName == JQM_CHECKBOX) || (proxyName == JQM_RADIO)) {
		target = webGuiUtil.jQuery(this.element).find('input')[0];
	}
	if (target != undefined) {
		this.setTarget(target);
	}

	switch (actionType) {
	case "onclick" :
	case "onmouseover" :
	case "oninput" :
	case "onkeypress" :
	case "onkeydown" :
	case "onchange" :
		retStatus = this._htmlexecuteAction(action);
		break;
	case "ontap" :
		retStatus = this.tap();
		break;
	case "onselect" :
		break;
	case "onexpand" :
		webGuiUtil.jQuery(this.getTarget()).trigger('expand');	
		retStatus = RMOT_SUCCESS;
		break;
	case "oncollapse" :
		webGuiUtil.jQuery(this.getTarget()).trigger('collapse');	
		retStatus = RMOT_SUCCESS;
		break;
	default:
		retStatus = this._htmlexecuteAction(action);
		break;
	}
	return retStatus;
};
/*
 *
 *	Licensed Materials - Property of IBM and/or HCL
 *
 *	IBM Rational Mobile Test
 *
 *	(C) Copyright IBM Corporation 2014 - 2016.
 *  Copyright HCL Technologies Ltd. 2017.  All Rights Reserved.
 *
 *	Note to U.S. Government Users Restricted Rights:  
 *	Use, duplication or disclosure restricted by GSA ADP
 *	Schedule Contract with IBM Corp. 
 *
 */

///////////////////////////// JQueryMobileElementProxy ///////////////////////////
JQueryMobileElementProxy = function(domainObj,element){
	if (arguments.length == 0) return; // don't do anything
	JQueryUIWidgetProxy.apply(this,arguments);
};
JQueryMobileElementProxy.prototype = new JQueryUIWidgetProxy();

JQueryMobileElementProxy.prototype.handleEvent = function(element, eventName, event) {
	var proxy = domainManager.getProxy(element);
	var tagName = proxy.getProperty(WebGuiConstants.TAGNAME_PROP);
	proxy.domainObj._recordEvent(event, eventName, tagName, element, null);
	event.recorded = true;
};
///////////////////////////// JQueryMobileElementProxy End ///////////////////////

///////////////////////////// JQueryMobileWidgetProxy ////////////////////////////
JQueryMobileWidgetProxy = function(domainObj,element){
	if (arguments.length == 0) return; // don't do anything
	JQueryUIWidgetProxy.apply(this,arguments);
};
JQueryMobileWidgetProxy.prototype = new JQueryUIWidgetProxy();

//Identify elements that belong to this widget
JQueryMobileWidgetProxy.prototype.setWidgetChild = function(children){
	for (var i = 0; i < children.length; i++) {
		var child = children[i];
		var proxy = domainManager.getProxy(child);
		proxy.isWidgetChild=true;
	}
};
///////////////////////////// JQueryMobileWidgetProxy End ///////////////////////

///////////////////////////// JQueryMobileButtonProxy ////////////////////////////
JQueryMobileButtonProxy = function(domainObj,element){
	if (arguments.length == 0) return; // don't do anything
	JQueryMobileWidgetProxy.apply(this,arguments);
};
JQueryMobileButtonProxy.prototype = new JQueryMobileWidgetProxy();


JQueryMobileButtonProxy.prototype._jqui5executeAction = JQueryMobileWidgetProxy.prototype.executeAction;
JQueryMobileButtonProxy.prototype.executeAction = function(action) {
	LoggerService.logMsg(RMoTTrace, 'JQueryMobileButtonProxy.prototype.executeAction('+ action.type +')');
	var retStatus = RMOT_FAILURE;
	var actionType = action.type;

	switch (actionType) {
	case 'onclick' :
		var target = webGuiUtil.jQuery(this.element).find('input')[0];
		if (typeof(target) != 'undefined') this.setTarget(target);
		break;
	default:
		break;
	}
	
	retStatus = this._jqui5executeAction(action);
	return retStatus;
};

///////////////////////////// JQueryMobileButtonProxy End ////////////////////////

///////////////////////////// JQueryMobileListviewItemProxy //////////////////////
JQueryMobileListviewItemProxy = function(domainObj,element){
	if (arguments.length == 0) return; // don't do anything
	JQueryMobileButtonProxy.apply(this,arguments);
	
	this.setWidgetChild(webGuiUtil.jQuery(this.element).find("*"));
};
JQueryMobileListviewItemProxy.prototype = new JQueryMobileWidgetProxy();

JQueryMobileListviewItemProxy.prototype.installEventWrapper = function (eventName, handler) {
	if (!this.element[eventName + "$alreadyInstalled"]) {
		this.element[eventName + "$alreadyInstalled"] = true;
		this.element.rmotOriginalHandler[eventName] = this.element[eventName];

		this.element[eventName] = function(event) {
			// if already handled then ignore the event
			if (!event.recorded) handler(this, eventName, event);

			var ret = this.rmotOriginalHandler[eventName] ? 
					this.rmotOriginalHandler[eventName].apply(this, arguments) : true;
			this.proxy.domainObj._parseDocument();
			return ret;
		};		
	}		
};

JQueryMobileListviewItemProxy.prototype.isContainer = function(){
	return false;
};
///////////////////////////// JQueryMobileListviewItemProxy End //////////////////

///////////////////////////// JQueryMobileTextInputProxy ////////////////////////
JQueryMobileTextInputProxy = function(domainObj,element){
	if (arguments.length == 0) return; // don't do anything
	JQueryMobileWidgetProxy.apply(this,arguments);
	
	this.setWidgetChild(webGuiUtil.jQuery(this.element).find(":not(a,span)"));	// 45857
};
JQueryMobileTextInputProxy.prototype = new JQueryMobileWidgetProxy();

JQueryMobileTextInputProxy.prototype.installEventWrapper = function (eventName, handler) {
	if (!this.element[eventName + "$alreadyInstalled"]) {
		this.element[eventName + "$alreadyInstalled"] = true;
		this.element.rmotOriginalHandler[eventName] = this.element[eventName];

		this.element[eventName] = function(event) {
			// if already handled then ignore the event
			if (!event.recorded) {
				var textInput = (this.proxy.isWidgetChild) ? this.parentElement : this; // 45857
				handler(textInput, eventName, event);
			}

			var ret = this.rmotOriginalHandler[eventName] ? 
					this.rmotOriginalHandler[eventName].apply(this, arguments) : true;
			this.proxy.domainObj._parseDocument();
			return ret;
		};		
	}		
};

JQueryMobileTextInputProxy.prototype.handleEvent = function(element, eventName, event) {
	var proxy = domainManager.getProxy(element);

	if (eventName == "onkeydown") {
		if (event.keyCode == 13) { // need to capture enter key
			eventName="onkeypress";
		}
		// else will be managed as a repeated action
	}
	if (!RMoTIOS) webGuiUtil.jQuery(proxy.getNativeElement()).focus();

	var tagName = proxy.getProperty(WebGuiConstants.TAGNAME_PROP);
	proxy.domainObj._recordEvent(event, eventName, tagName, element, proxy.getParameters());
	event.recorded = true;
};

JQueryMobileTextInputProxy.prototype._jquerygetProperty=JQueryMobileTextInputProxy.prototype.getProperty;
JQueryMobileTextInputProxy.prototype.getProperty = function(propName) {
	var propValue = null;
	var nativeElt = this.getNativeElement();
	
	switch (propName) {
	case WebGuiConstants.CONTENT_PROP:
		propValue=webGuiUtil.jQuery(nativeElt).val();
		break;
	default:
		var isProp = webGuiUtil.jQuery(nativeElt).is('['+propName+']');
		propValue = (isProp) ? webGuiUtil.jQuery(nativeElt).attr(propName) : this._jquerygetProperty(propName);
		break;
	}

	return propValue;
};

JQueryMobileTextInputProxy.prototype.isVisible =  function() {
	var ret = this._htmlisVisible();
	if (ret.reachable) ret.visibility = true; // make final JQuery widgets visible if they are reachable
	return ret;
};

JQueryMobileTextInputProxy.prototype._jqueryapplyDecoratedProps = JQueryMobileTextInputProxy.prototype.applyDecoratedProps;
JQueryMobileTextInputProxy.prototype.applyDecoratedProps=function(targetElement){
	this._jqueryapplyDecoratedProps(targetElement);
	targetElement.label = this.getProperty(WebGuiConstants.LABEL_PROP);
	// Copy some native element's properties
	targetElement.placeholder = this.getProperty('placeholder');
	targetElement.type = this.getProperty('type');
	targetElement.value = this.getProperty('value');
	targetElement.id = this.getProperty('id');
	
};

JQueryMobileTextInputProxy.prototype.getNativeElement = function() {
	var nativeElement = webGuiUtil.jQuery(this.element).find('input'); 
	if (!nativeElement.length) { // JQM 1.2.x
		nativeElement = webGuiUtil.jQuery(this.element);
	}
	return nativeElement[0];
};

JQueryMobileTextInputProxy.prototype.getParameters = function () {
	var parameters = {};
	parameters.newtext = this.getProperty(WebGuiConstants.CONTENT_PROP);
	return parameters;
};

JQueryMobileTextInputProxy.prototype.getRepeatedAction = function () {
	return {"onkeydown": "oninput"};
};

JQueryMobileTextInputProxy.prototype.getEventsToRegister = function(){
	return [RMOT_TRIGGER_EVENT,"onkeydown"];
};

JQueryMobileTextInputProxy.prototype.pressEnter = function() {
	LoggerService.logMsg(RMoTTrace, 'JQueryMobileTextInputProxy.prototype.pressEnter()');
	webGuiUtil.jQuery(this.element).trigger("submit");
	return RMOT_SUCCESS;
};

JQueryMobileTextInputProxy.prototype._jqui0executeAction = JQueryMobileTextInputProxy.prototype.executeAction;
JQueryMobileTextInputProxy.prototype.executeAction = function(action) {
	LoggerService.logMsg(RMoTTrace, 'JQueryMobileTextInputProxy.prototype.executeAction('+ action.type +')');
	var retStatus = RMOT_FAILURE;
	var actionType = action.type;
	var tt = this.getNativeElement();
	if (tt != null) this.setTarget(tt);

	switch (actionType) {
	case "onkeypress" :
	case "onkeydown" :
		retStatus = this.pressEnter();
		break;
	default:
		retStatus = this._jqui0executeAction(action);
		break;
	}
	return retStatus;
};
///////////////////////////// JQueryMobileTextInputProxy End ////////////////////

///////////////////////////// JQueryMobileTextAreaProxy /////////////////////////
JQueryMobileTextAreaProxy = function(domainObj,element){
	if (arguments.length == 0) return; // don't do anything
	JQueryMobileTextInputProxy.apply(this,arguments);
};
JQueryMobileTextAreaProxy.prototype = new JQueryMobileTextInputProxy();

JQueryMobileTextAreaProxy.prototype.handleEvent = function(element, eventName, event) {
	// onkeydown will be managed as a repeated action
	var proxy = domainManager.getProxy(element);
	if (!RMoTIOS) webGuiUtil.jQuery(proxy.getNativeElement()).focus();
	var tagName = proxy.getProperty(WebGuiConstants.TAGNAME_PROP);
	proxy.domainObj._recordEvent(event, eventName, tagName, element, null);
	event.recorded = true;
};

JQueryMobileTextAreaProxy.prototype._jqueryTextInputgetProperty=JQueryMobileTextAreaProxy.prototype.getProperty;
JQueryMobileTextAreaProxy.prototype.getProperty = function(propName) {
	var propValue = null;

	switch (propName) {
	case WebGuiConstants.CONTENT_PROP:
		propValue=webGuiUtil.jQuery(this.element).val();
		break;
	default:
		propValue = this._jqueryTextInputgetProperty(propName);
		break;
	}

	return propValue;
};
///////////////////////////// JQueryMobileTextAreaProxy End /////////////////////

///////////////////////////// JQueryMobileSliderProxy ////////////////////////
JQueryMobileSliderProxy = function(domainObj,element){
	if (arguments.length == 0) return; // don't do anything
	JQueryMobileWidgetProxy.apply(this,arguments);
	
	this.setWidgetChild(webGuiUtil.jQuery(this.element).find(":not(input)"));	
};
JQueryMobileSliderProxy.prototype = new JQueryMobileWidgetProxy();

JQueryMobileSliderProxy.prototype.installWrappers = function(){
	var eventName = this.getEventsToRegister()[0];
	if (!this.element[eventName + "$alreadyInstalled"]) {
		this.element[eventName + "$alreadyInstalled"] = true;
		
		webGuiUtil.jQuery(this.element).on( eventName, function( event, ui ) {
			var proxy = domainManager.getProxy(this);
			proxy.handleEvent(this,eventName,event);
		} );
		
		this.element[RMOT_TRIGGER_EVENT] = function(event) {
			// 49316: prevent this event from breaking the repeated action 
			event.recorded = true;
			return true;
		};	
	
		rmotHierarchy.setSavedProperties(this); // 50794
		
		return true;
	}
};

JQueryMobileSliderProxy.prototype._jqueryhandleEvent=JQueryMobileSliderProxy.prototype.handleEvent;
JQueryMobileSliderProxy.prototype.handleEvent = function(element, eventName, event) {
	var proxy = domainManager.getProxy(element);
	
	// Update edit text widgets content prop
	var inputs = webGuiUtil.jQuery(this.element).find("input");
	for (var i = 0; i < inputs.length; i++) {
		var proxyInput = domainManager.getProxy(inputs[i]);
		proxyInput[WebGuiConstants.CONTENT_PROP]=webGuiUtil.jQuery(inputs[i]).val();
	}
	
	proxy._jqueryhandleEvent(element, eventName, event);
};

JQueryMobileSliderProxy.prototype.getParameters = function () {
	var parameters = {};
	parameters.newtext = this.getValue();
	return parameters;
};

JQueryMobileSliderProxy.prototype.getRepeatedAction = function () {
	return {"slidestart": "onchange"};
};

JQueryMobileSliderProxy.prototype.getPropertiesToSave = function() {
	return [WebGuiConstants.CONTENT_PROP, "value"];
};

JQueryMobileSliderProxy.prototype._jquerygetProperty=JQueryMobileSliderProxy.prototype.getProperty;
JQueryMobileSliderProxy.prototype.getProperty = function(propName) {
	var propValue = null;

	switch (propName) {
	case WebGuiConstants.CONTENT_PROP:
	case "value":
		propValue = this.getValue();
		break;
	case "max":
	case "min":
	case "step":
		propValue = webGuiUtil.jQuery(this.getNativeElement()).attr(propName);
		break;
	default:
		propValue = this._jquerygetProperty(propName);
		break;
	}

	return propValue;
};

JQueryMobileSliderProxy.prototype._jqueryapplyDecoratedProps = JQueryMobileSliderProxy.prototype.applyDecoratedProps;
JQueryMobileSliderProxy.prototype.applyDecoratedProps=function(targetElement){
	this._jqueryapplyDecoratedProps(targetElement);
	targetElement.label = this.getProperty(WebGuiConstants.LABEL_PROP);
	targetElement.max=this.getProperty("max");
	targetElement.value=this.getProperty(WebGuiConstants.CONTENT_PROP);
	targetElement.min=this.getProperty("min");
	targetElement.step=this.getProperty("step");
};

JQueryMobileSliderProxy.prototype.getNativeElement = function(pos) {
	pos = (!pos) ? 0 : pos; // default 0
	var slider = webGuiUtil.jQuery(this.element).children('input')[pos];
	return slider;
};

JQueryMobileSliderProxy.prototype.getValue = function(pos) {
	return webGuiUtil.jQuery(this.getNativeElement(pos)).val();
};

JQueryMobileSliderProxy.prototype.getEventsToRegister = function(){
	return ["slidestart"];
};

JQueryMobileSliderProxy.prototype._jqui1executeAction = JQueryMobileSliderProxy.prototype.executeAction;
JQueryMobileSliderProxy.prototype.executeAction = function(action) {
	LoggerService.logMsg(RMoTTrace, 'JQueryMobileSliderProxy.prototype.executeAction('+ action.type +')');
	var retStatus = RMOT_FAILURE;
	var actionType = action.type;

	switch (actionType) {
	case "onchange" :
		var tab = webGuiUtil.jQuery(this.element).find("input");
		if (tab) {
			var jobj = webGuiUtil.jQuery(tab);
			if (jobj.val && jobj.slider) {
				jobj.val(action.parameters[0].value);
				jobj.slider("refresh");
			}
		}
		retStatus = RMOT_SUCCESS;

		break;
	default:
		retStatus = this._jqui1executeAction(action);
		break;
	}
	return retStatus;
};
///////////////////////////// JQueryMobileSliderProxy End ////////////////////

///////////////////////////// JQueryMobileRangeSliderProxy ///////////////////
JQueryMobileRangeSliderProxy = function(domainObj,element){
	if (arguments.length == 0) return; // don't do anything
	JQueryMobileSliderProxy.apply(this,arguments);
};
JQueryMobileRangeSliderProxy.prototype = new JQueryMobileSliderProxy();

JQueryMobileRangeSliderProxy.prototype._jqueryslidergetValue=JQueryMobileRangeSliderProxy.prototype.getValue;
JQueryMobileRangeSliderProxy.prototype.getValue = function() {
	return this._jqueryslidergetValue(0) + " - " + this._jqueryslidergetValue(1);
};

JQueryMobileRangeSliderProxy.prototype.getParameters = function () {
	var parameters = {};
	parameters.rangeMin = this._jqueryslidergetValue(0);
	parameters.rangeMax = this._jqueryslidergetValue(1);
	return parameters;
};

JQueryMobileRangeSliderProxy.prototype._jqui2executeAction = JQueryMobileRangeSliderProxy.prototype.executeAction;
JQueryMobileRangeSliderProxy.prototype.executeAction = function(action) {
	LoggerService.logMsg(RMoTTrace, 'JQueryMobileRangeSliderProxy.prototype.executeAction('+ action.type +')');
	var retStatus = RMOT_FAILURE;
	var actionType = action.type;

	switch (actionType) {
	case "onchange" :
		var rangeMin = webGuiUtil.jQuery(this.element).find("input")[0];
		var rangeMax = webGuiUtil.jQuery(this.element).find("input")[1];
		if (rangeMin && rangeMax) {
			var jobjMin = webGuiUtil.jQuery(rangeMin);
			var jobjMax = webGuiUtil.jQuery(rangeMax);
			if (jobjMin.val && jobjMax.val && jobjMin.slider && jobjMax.slider) {
				var valMin = null;
				var valMax = null;
				if (action.parameters[0].name == "rangeMin") {
					valMin = action.parameters[0].value;
					valMax = action.parameters[1].value;
				} else {
					valMin = action.parameters[1].value;
					valMax = action.parameters[0].value;
				}
				jobjMin.val(valMin);
				jobjMin.slider("refresh");
				jobjMax.val(valMax);
				jobjMax.slider("refresh");
			}
		}
		retStatus = RMOT_SUCCESS;

		break;
	default:
		retStatus = this._jqui2executeAction(action);
		break;
	}
	return retStatus;
};
///////////////////////////// JQueryMobileRangeSliderProxy End ////////////////

///////////////////////////// JQueryMobileSelectProxy /////////////////////////
JQueryMobileSelectProxy = function(domainObj,element){
	if (arguments.length == 0) return; // don't do anything
	JQueryMobileWidgetProxy.apply(this,arguments);
	
	this.setWidgetChild(webGuiUtil.jQuery(this.element).find("select")); // 50857
};
JQueryMobileSelectProxy.prototype = new JQueryMobileWidgetProxy();

JQueryMobileSelectProxy.prototype.installEventWrapper = function (eventName, handler) {
	if (!this.element[eventName + "$alreadyInstalled"]) {
		this.element[eventName + "$alreadyInstalled"] = true;
		this.element.rmotOriginalHandler[eventName] = this.element[eventName];

		this.element[eventName] = function(event) {
			// if already handled then ignore the event
			if (!event.recorded) handler(this, eventName, event);

			var ret = this.rmotOriginalHandler[eventName] ? 
					this.rmotOriginalHandler[eventName].apply(this, arguments) : true;
			this.proxy.domainObj._parseDocument();
			return ret;
		};
		
		rmotHierarchy.setSavedProperties(this); // 51980
	}		
};

JQueryMobileSelectProxy.prototype.handleEvent = function(element, eventName, event) {
	var proxy = domainManager.getProxy(element);
	
	// 41256: data-native-menu="false"
	// Record click instead of change event when native select menu is disabled
	var nativeMenu = proxy.getNativeMenu();

	if (eventName == RMOT_TRIGGER_EVENT) {
		if (!nativeMenu) {
			var tagName = proxy.getProperty(WebGuiConstants.TAGNAME_PROP);
			proxy.domainObj._recordEvent(event, eventName, tagName, element, proxy.getParameters());
		}
		event.recorded = true;
	}
	else if (eventName == "onchange" && nativeMenu) {
		var tagName = proxy.getProperty(WebGuiConstants.TAGNAME_PROP);
		proxy.domainObj._recordEvent(event, eventName, tagName, element, proxy.getParameters());
	}
};

JQueryMobileSelectProxy.prototype.getPropertiesToSave = function() {
	return [WebGuiConstants.CONTENT_PROP];
};

JQueryMobileSelectProxy.prototype._jquerygetProperty=JQueryMobileSelectProxy.prototype.getProperty;
JQueryMobileSelectProxy.prototype.getProperty = function(propName) {
	var propValue = null;

	switch (propName) {
	case WebGuiConstants.CONTENT_PROP:
		propValue = this.getValue();
		break;
	case "length":
		propValue = this.getNativeElement().options.length;
		break;
	case "options":
		var select = this.getNativeElement();
		propValue = "";
		for (var i = 0; i < select.options.length; i++) {
			propValue += select.options[i].text + ', ';
		}
		propValue = propValue.substring(0, propValue.length-2);
		break;
	default:
		propValue = this._jquerygetProperty(propName);
		break;
	}

	return propValue;
};

JQueryMobileSelectProxy.prototype._jqueryapplyDecoratedProps = JQueryMobileSelectProxy.prototype.applyDecoratedProps;
JQueryMobileSelectProxy.prototype.applyDecoratedProps=function(targetElement){
	this._jqueryapplyDecoratedProps(targetElement);
	targetElement.options = this.getProperty(WebGuiConstants.OPTIONS_PROP);
	targetElement.length = this.getProperty(WebGuiConstants.OPTIONSLENGTH_PROP);
	targetElement.label = this.getProperty(WebGuiConstants.LABEL_PROP);
};

JQueryMobileSelectProxy.prototype.getNativeElement = function() {
	return webGuiUtil.jQuery(this.element).find('select')[0];
};

JQueryMobileSelectProxy.prototype.getNativeMenu = function() {
	return webGuiUtil.jQuery(this.getNativeElement()).selectmenu( "option", "nativeMenu" );
};

JQueryMobileSelectProxy.prototype.getValue = function() {
	var selection = '';
	var select = this.getNativeElement();
	webGuiUtil.jQuery(select).find(':selected').each(function () {
		var option = webGuiUtil.jQuery(this);
		if (option.length) {
			selection += ', '+option.text();
		}
	});
	return selection.substring(2, selection.length);
};

JQueryMobileSelectProxy.prototype.getParameters = function () {
	var parameters = {};
	parameters.newtext = this.getValue();
	return parameters;
};

JQueryMobileSelectProxy.prototype.getEventsToRegister = function(){
	return [RMOT_TRIGGER_EVENT, "onchange"];
};


JQueryMobileSelectProxy.prototype._jqui3executeAction = JQueryMobileSelectProxy.prototype.executeAction;
JQueryMobileSelectProxy.prototype.executeAction = function(action) {
	LoggerService.logMsg(RMoTTrace, 'JQueryMobileSelectProxy.prototype.executeAction('+ action.type +')');
	var retStatus = RMOT_FAILURE;
	var actionType = action.type;

	switch (actionType) {
	case "onclick" :
		webGuiUtil.jQuery(this.getNativeElement()).selectmenu('open');
		return RMOT_SUCCESS;
		break;

	case "onchange" :
		this.setTarget(this.getNativeElement());
		var RMoTselectedOptions = action.parameters[0].value.split(", ");
		for(var i=0; i<RMoTselectedOptions.length; i++) {
			var RMoTtext = RMoTselectedOptions[i];
			var RMoToptions = webGuiUtil.jQuery(this.getTarget()).find('option:contains('+RMoTtext+')');
			if (RMoToptions.length == 0) {
				action.message = '"' + RMoTtext + '" not found in [' + this.getProperty('options') + ']';
				return RMOT_FAILURE;
			}
			for (var j=0; j<RMoToptions.length; j++) {
				if (webGuiUtil.jQuery(RMoToptions[j]).text() == RMoTtext) {
					webGuiUtil.jQuery(RMoToptions[j]).prop('selected', true);
				}
			}
		}
		this.dispatchEvent(HTML_EVENT, 'change', false, false);
		webGuiUtil.jQuery(this.getTarget()).selectmenu('refresh');
		return RMOT_SUCCESS;
	default:
		break;
	}
	
	retStatus = this._jqui3executeAction(action);
	return retStatus;
};

///////////////////////////// JQueryMobileSelectProxy End /////////////////////

///////////////////////////// JQueryCheckBoxRadioProxy //////////////////////////
JQueryCheckBoxRadioProxy = function(domainObj,element) {
	if (arguments.length == 0) return;
	JQueryMobileWidgetProxy.apply(this, arguments);
};
JQueryCheckBoxRadioProxy.prototype = new JQueryMobileWidgetProxy();

JQueryCheckBoxRadioProxy.prototype._applyDecoratedProps = JQueryCheckBoxRadioProxy.prototype.applyDecoratedProps;
JQueryCheckBoxRadioProxy.prototype.applyDecoratedProps = function(targetElement){
	this._applyDecoratedProps(targetElement);
	targetElement.checked = this.getProperty(WebGuiConstants.CHECKED_PROP);
	targetElement.label = this.getProperty(WebGuiConstants.LABEL_PROP);
};

JQueryCheckBoxRadioProxy.prototype.getPropertiesToSave = function() {
	return [WebGuiConstants.CHECKED_PROP];
};

JQueryCheckBoxRadioProxy.prototype._jquerygetProperty=JQueryCheckBoxRadioProxy.prototype.getProperty;
JQueryCheckBoxRadioProxy.prototype.getProperty = function(propName) {
	var propValue = null;

	switch (propName) {
	case WebGuiConstants.CHECKED_PROP:
		propValue = this.getNativeElement().checked;
		break;
	default:
		propValue = this._jquerygetProperty(propName);
		break;
	}

	return propValue;
};

JQueryCheckBoxRadioProxy.prototype.getNativeElement = function() {
	return webGuiUtil.jQuery(this.element).find('input')[0];
};

JQueryCheckBoxRadioProxy.prototype.getEventsToRegister = function(){
	return [RMOT_TRIGGER_EVENT, "onchange"];
};

JQueryCheckBoxRadioProxy.prototype.handleEvent = function(element,methodName,event) {
	if (methodName != RMOT_TRIGGER_EVENT) {
		JQueryMobileWidgetProxy.prototype.handleEvent(element, "onclick", event);
	}
	event.recorded = true;
};
///////////////////////////// JQueryCheckBoxRadioProxy End //////////////////////

///////////////////////////// JQueryMobileFlipSwitchProxy ///////////////////////
JQueryMobileFlipSwitchProxy = function(domainObj,element){
	if (arguments.length == 0) return; // don't do anything
	JQueryMobileWidgetProxy.apply(this,arguments);
};
JQueryMobileFlipSwitchProxy.prototype = new JQueryMobileWidgetProxy();

JQueryMobileFlipSwitchProxy.prototype.getEventsToRegister = function(){
	return ["onswipe", "onchange"];
};

JQueryMobileFlipSwitchProxy.prototype.getPropertiesToSave = function() {
	return [WebGuiConstants.CONTENT_PROP, WebGuiConstants.CHECKED_PROP];
};

JQueryMobileFlipSwitchProxy.prototype._jqueryapplyDecoratedProps = JQueryMobileFlipSwitchProxy.prototype.applyDecoratedProps;
JQueryMobileFlipSwitchProxy.prototype.applyDecoratedProps=function(targetElement){
	this._jqueryapplyDecoratedProps(targetElement);
	targetElement.checked = this.getProperty(WebGuiConstants.CHECKED_PROP);
	targetElement.label = this.getProperty(WebGuiConstants.LABEL_PROP);
};

JQueryMobileFlipSwitchProxy.prototype.getChecked = function() {
	// Flip switch may contain input or select element
	var input = webGuiUtil.jQuery(this.element).children('input')[0];
	if (input) return input.checked;
	
	var select = webGuiUtil.jQuery(this.element).children('select')[0];
	if (select) {
		for(var i = 0; i < select.options.length; i++) { 
			if(select.options[i].selected) {
				return (i == 0) ? false : true;
			} 
		}
	}
	
	return '';
};

JQueryMobileFlipSwitchProxy.prototype.getValue = function() {
	var className = this.getChecked() ? ".ui-flipswitch-on" : ".ui-flipswitch-off";
	
	var elt = webGuiUtil.jQuery(this.element).children(className)[0];
	if (elt) return elt.textContent;
	
	return '';
};

JQueryMobileFlipSwitchProxy.prototype._jquerygetProperty=JQueryMobileFlipSwitchProxy.prototype.getProperty;
JQueryMobileFlipSwitchProxy.prototype.getProperty = function(propName) {
	var propValue = null;

	switch (propName) {
	case WebGuiConstants.CONTENT_PROP:
		propValue = this.getValue();
		break;
	case WebGuiConstants.CHECKED_PROP:
		propValue = this.getChecked();
		break;
	default:
		propValue = this._jquerygetProperty(propName);
		break;
	}

	return propValue;
};

JQueryMobileFlipSwitchProxy.prototype._jqueryhandleEvent=JQueryMobileFlipSwitchProxy.prototype.handleEvent;
JQueryMobileFlipSwitchProxy.prototype.handleEvent = function(element, eventName, event) {
	var proxy = domainManager.getProxy(element);
	if (eventName=='onswipe') {
		var start = event.swipestart;
		var stop = event.swipestop;
		if (start && stop) {
			proxy.swipeDirection = (stop.coords[0] - start.coords[0] > 0) ? 1 : 0; // right : left
		}
	}
	else {
		eventName = 'onclick';
		var parameters = {}
		var tagName = proxy.getProperty(WebGuiConstants.TAGNAME_PROP);
		
		if (proxy.swipeDirection != null) {
			eventName = 'onswipe';
			parameters = proxy.getParameters();
			proxy.swipeDirection = null;
		}

		proxy.domainObj._recordEvent(event, eventName, tagName, element, parameters);
	}
};

JQueryMobileFlipSwitchProxy.prototype.getParameters = function () {
	var parameters = {};
	parameters.direction = this.swipeDirection;
	return parameters;
};

JQueryMobileFlipSwitchProxy.prototype._jqui6executeAction = JQueryMobileFlipSwitchProxy.prototype.executeAction;
JQueryMobileFlipSwitchProxy.prototype.executeAction = function(action) {
	LoggerService.logMsg(RMoTTrace, 'JQueryMobileFlipSwitchProxy.prototype.executeAction('+ action.type +')');
	var retStatus = RMOT_FAILURE;
	var actionType = action.type;

	switch (actionType) {
	case "onswipe" :
		// Trigger events in the order they are fired during recording phase
		webGuiUtil.jQuery(this.element).trigger('swipe');
		webGuiUtil.jQuery(this.element).trigger('change');
		
		var eventDirName = (action.parameters[0].value == 1) ? 'swiperight' : 'swipeleft' ;
		webGuiUtil.jQuery(this.element).trigger(eventDirName);
		
		retStatus = RMOT_SUCCESS;
		break;
	default:
		retStatus = this._jqui6executeAction(action);
	break;
	}
	return retStatus;
};
///////////////////////////// JQueryMobileFlipSwitchProxy End ///////////////////

///////////////////////////// JQueryMobile_13x_FlipSwitchProxy //////////////////
JQueryMobile_13x_FlipSwitchProxy = function(domainObj,element){
	if (arguments.length == 0) return; // don't do anything
	JQueryMobileFlipSwitchProxy.apply(this,arguments);
	
	this.setWidgetChild(webGuiUtil.jQuery(this.element.parentElement).children("select"));
};
JQueryMobile_13x_FlipSwitchProxy.prototype = new JQueryMobileWidgetProxy();

JQueryMobile_13x_FlipSwitchProxy.prototype._jqueryapplyDecoratedProps = JQueryMobile_13x_FlipSwitchProxy.prototype.applyDecoratedProps;
JQueryMobile_13x_FlipSwitchProxy.prototype.applyDecoratedProps=function(targetElement){
	this._jqueryapplyDecoratedProps(targetElement);
	targetElement.checked = this.checked;
	targetElement.content = this.content;
	targetElement.label = this.getProperty(WebGuiConstants.LABEL_PROP);
};

JQueryMobile_13x_FlipSwitchProxy.prototype.getFlipButton = function(active) {
	var selector = (active) ? '.ui-btn-active' : ':not(.ui-btn-active)';
	return webGuiUtil.jQuery(this.element).find(selector);
};

JQueryMobile_13x_FlipSwitchProxy.prototype.getContent = function() {
	return this.getFlipButton(this.getChecked())[0].textContent;
};

JQueryMobile_13x_FlipSwitchProxy.prototype.getChecked = function() {
	var btn = this.getFlipButton(true);
	if (btn.length) {
		var btnWidth = btn[0].style.width;
		return (btnWidth == "0%") ? false : true;
	}
	return '';
};

JQueryMobile_13x_FlipSwitchProxy.prototype._jquerygetProperty=JQueryMobile_13x_FlipSwitchProxy.prototype.getProperty;
JQueryMobile_13x_FlipSwitchProxy.prototype.getProperty = function(propName) {
	var propValue = null;

	switch (propName) {
	case WebGuiConstants.CONTENT_PROP:
		propValue = this.getContent();
		break;
	case WebGuiConstants.LABEL_PROP:
		var label = webGuiUtil.jQuery(this.element.parentElement).find('label');
		propValue = (label.length) ? webGuiUtil.jQuery(label[0]).text() : "";
		propValue = jsUtil.trim(propValue);
		break;
	case WebGuiConstants.CHECKED_PROP:
		propValue = this.getChecked();
		break;
	default:
		propValue = this._jquerygetProperty(propName);
		break;
	}

	return propValue;
};

JQueryMobile_13x_FlipSwitchProxy.prototype.installWrappers = function() {
	var eventName = this.getEventsToRegister()[0];
	if (!this.element[eventName + "$alreadyInstalled"]) {
		this.element[eventName + "$alreadyInstalled"] = true;
		
		var select = webGuiUtil.jQuery(this.element.parentElement).find('select')[0];
		webGuiUtil.jQuery(select).on( eventName, function( event, ui ) {
			var flip = webGuiUtil.jQuery(this.parentElement).find('div')[0];
			var proxy = domainManager.getProxy(flip);
			proxy.handleEvent(flip,"onclick",event);	
		} );
		
		// 51376: props init
		this.checked = this.getProperty(WebGuiConstants.CHECKED_PROP);
		this.content = this.getProperty(WebGuiConstants.CONTENT_PROP);
		
		return true;
	}
};

JQueryMobile_13x_FlipSwitchProxy.prototype._jqueryhandleEvent=JQueryMobile_13x_FlipSwitchProxy.prototype.handleEvent;
JQueryMobile_13x_FlipSwitchProxy.prototype.handleEvent = function(element, eventName, event) {
	var proxy = domainManager.getProxy(element);
	proxy._jqueryhandleEvent(element, eventName, event);
	
	// 51376: props update
	proxy.checked = proxy.getProperty(WebGuiConstants.CHECKED_PROP);
	proxy.content = proxy.getProperty(WebGuiConstants.CONTENT_PROP);
};

JQueryMobile_13x_FlipSwitchProxy.prototype.getEventsToRegister = function(){
	return ["slidestop"];
};

JQueryMobile_13x_FlipSwitchProxy.prototype.isContainer = function(){
	return false;
};
///////////////////////////// JQueryMobile_13x_FlipSwitchProxy End //////////////


///////////////////////////// JQueryMobileCollapsibleProxy ////////////////////
JQueryMobileCollapsibleProxy = function(domainObj,element){
	if (arguments.length == 0) return; // don't do anything
	JQueryMobileWidgetProxy.apply(this,arguments);
};
JQueryMobileCollapsibleProxy.prototype = new JQueryMobileWidgetProxy();

JQueryMobileCollapsibleProxy.prototype.getInnerProperty = function(elem, prop) {
	if (elem.attributes) {
		for (var j=0; j < elem.attributes.length; j++)
			if (elem.attributes[j].name == prop)
				return elem.attributes[j].value;
	}

	if (elem.hasChildNodes()) {
		for (var i=0; i < elem.childNodes.length; i++) {
			var ret = this.getInnerProperty(elem.childNodes[i], prop);
			if (ret != undefined)
				return ret;
		}
	}
	
	return undefined;
};

JQueryMobileCollapsibleProxy.prototype._jquerygetProperty=JQueryMobileCollapsibleProxy.prototype.getProperty;
JQueryMobileCollapsibleProxy.prototype.getProperty = function(propName) {
	var propValue = null;
	
	switch (propName) {
	case WebGuiConstants.CONTENT_PROP:
		// 55942: Get the content of the first text node.
		// Might appear complicated but works for jQuery Mobile 1.3.x and 1.4.x
		var textNodes = webGuiUtil.jQuery(this.element).find('*').addBack().contents().filter(function() { return this.nodeType == 3; });
		propValue = (textNodes.length > 0) ? textNodes[0].textContent : this.element.textContent;
		break;
	case WebGuiConstants.COLLAPSED_PROP:
		propValue=this.getInnerProperty(this.element.parentElement.nextSibling, "aria-hidden");
		break;
	default:
		propValue = this._jquerygetProperty(propName);
		break;
	}

	return propValue;
};

JQueryMobileCollapsibleProxy.prototype._jqueryapplyDecoratedProps = JQueryMobileCollapsibleProxy.prototype.applyDecoratedProps;
JQueryMobileCollapsibleProxy.prototype.applyDecoratedProps=function(targetElement){
	this._jqueryapplyDecoratedProps(targetElement);
	var hidden = this.getProperty(WebGuiConstants.COLLAPSED_PROP);
	targetElement.collapsed = hidden;
};

JQueryMobileCollapsibleProxy.prototype._jqui4executeAction = JQueryMobileCollapsibleProxy.prototype.executeAction;
JQueryMobileCollapsibleProxy.prototype.executeAction = function(action) {
	LoggerService.logMsg(RMoTTrace, 'JQueryMobileCollapsibleProxy.prototype.executeAction('+ action.type +')');
	var retStatus = RMOT_FAILURE;
	var actionType = action.type;

	switch (actionType) {
	case "onexpand" :
	case "oncollapse" :
		var hidden = this.getProperty(WebGuiConstants.COLLAPSED_PROP);
		if (((hidden == "true") && (actionType == "onexpand")) || ((hidden == "false") && (actionType == "oncollapse"))) {			
			action.type = "onclick";
			retStatus = this._jqui4executeAction(action);	
		}
		break;
	default:
		retStatus = this._jqui4executeAction(action);
	break;
	}
	return retStatus;
};
///////////////////////////// JQueryMobileCollapsibleProxy End ////////////////////

///////////////////////////// JQueryMobileCollapsibleContentProxy /////////////////
JQueryMobileCollapsibleContentProxy = function(domainObj,element){
	if (arguments.length == 0) return; // don't do anything
	JQueryMobileWidgetProxy.apply(this,arguments);
};
JQueryMobileCollapsibleContentProxy.prototype = new JQueryMobileWidgetProxy();

JQueryMobileCollapsibleContentProxy.prototype.isVisible = function() {
	var ret = this._htmlisVisible();
	ret.propagation = false;
	return ret;
};
/////////////////////////// JQueryMobileCollapsibleContentProxy End ///////////////

///////////////////////////// JQueryMobileDatePickerProxy /////////////////////////
JQueryMobileDatePickerProxy = function(domainObj,element){
	if (arguments.length == 0) return; // don't do anything
	JQueryMobileWidgetProxy.apply(this,arguments);
};
JQueryMobileDatePickerProxy.prototype = new JQueryMobileWidgetProxy();

JQueryMobileDatePickerProxy.prototype._jqueryinstallEventWrapper=JQueryMobileDatePickerProxy.prototype.installEventWrapper;
JQueryMobileDatePickerProxy.prototype.installEventWrapper = function (eventName, handler) {
	this._jqueryinstallEventWrapper(eventName, handler);
	var hls = webGuiUtil.jQuery('.ui-datepicker').find("a");
	for (var i = 0; i < hls.length; i++) {
		hls[i].registeredDomain = 0;
	}
};

JQueryMobileDatePickerProxy.prototype.isContainer = function(){
	return true;
};
///////////////////////////// JQueryMobileDatePickerProxy End /////////////////////////

///////////////////////////// JQueryMobileControlGroupProxy //////////////////////////
JQueryMobileControlGroupProxy = function(domainObj,element){
	if (arguments.length == 0) return; // don't do anything
	JQueryMobileWidgetProxy.apply(this,arguments);
};
JQueryMobileControlGroupProxy.prototype = new JQueryMobileWidgetProxy();

JQueryMobileControlGroupProxy.prototype.handleEvent = function(element, eventName, event) {
	// Do not log any events for this widget
	event.recorded = true;
};
///////////////////////////// JQueryMobileControlGroupProxy End //////////////////////////
/*
 *
 *	Licensed Materials - Property of IBM and/or HCL
 *
 *	IBM Rational Mobile Test
 *
 *	(C) Copyright IBM Corporation 2014, 2018. All Rights Reserved. 
 *  (C) Copyright HCL Technologies Ltd. 2017, 2018. All Rights Reserved. 
 *
 *	Note to U.S. Government Users Restricted Rights:  
 *	Use, duplication or disclosure restricted by GSA ADP
 *	Schedule Contract with IBM Corp. 
 *
 */

///////////////////////////// JQueryUIButtonProxy ////////////////////////////////


JQueryUIButtonProxy = function(domainObj, element) {
	if (arguments.length == 0)
		return;
	JQueryUIWidgetProxy.apply(this, arguments);
};

JQueryUIButtonProxy.prototype = new JQueryUIWidgetProxy();


JQueryUIButtonProxy.prototype._JQWidgetgetProperty = JQueryUIButtonProxy.prototype.getProperty;
JQueryUIButtonProxy.prototype.getProperty = function(propName) {
	var propValue = null;

	switch (propName) {
	case WebGuiConstants.CONTENT_PROP:
	case WebGuiConstants.LABEL_PROP:
		propValue = this.getLabelProperty();
		break;
	case WebGuiConstants.CHECKED_PROP:
		// get the native radio or checkbox input element 
		var nativeElement = this.getNativeInputElement();
		if(nativeElement != null){
			propValue = nativeElement.checked;
		}
		break;
	default:
		propValue = this._JQWidgetgetProperty(propName);
		break;
	}

	return propValue;
};

JQueryUIButtonProxy.prototype._JQWidgetapplyDecoratedProps = JQueryUIButtonProxy.prototype.applyDecoratedProps;
JQueryUIButtonProxy.prototype.applyDecoratedProps=function(targetElement){
	this._JQWidgetapplyDecoratedProps(targetElement);
	var proxyName = this.getProxyName();
	if(proxyName == JQM_CHECKBOX || proxyName == JQM_RADIO){
		targetElement.label = this.getProperty(WebGuiConstants.LABEL_PROP); 
		targetElement.checked = this.getProperty(WebGuiConstants.CHECKED_PROP);
	}
};

JQueryUIButtonProxy.prototype.getProxyName = function() {
	if(this.btnTagName)
		return this.btnTagName;
	
	var tagName = this.element.tagName;
	this.btnTagName = JQM_BUTTON;
	// For CheckBox or Radio buttons
	if(tagName.toLowerCase() == "label"){
		var nativeElement = this.getNativeInputElement();
		if(nativeElement != null){
			var elementType = nativeElement.type
			if(elementType == "checkbox"){
				this.btnTagName = JQM_CHECKBOX;
			}else if(elementType == "radio"){
				this.btnTagName = JQM_RADIO;
			}else{
				// TODO: Have a new Logger Class
				//console.log("RTW_WEBGUI_ERR:Unsupported button type "+elementType);
			}
		}
	}
	
	return this.btnTagName;
};

JQueryUIButtonProxy.prototype.getNativeInputElement = function(){
	var nativeElement = null;
	//generally defined for checkbox and radio buttons
	if(this.element.control){
		nativeElement = this.element.control;
	}else{// go for label way
		var ownerDoc = this.element.ownerDocument;
		var results = webGuiUtil.jQuery(ownerDoc).find("#"+this.element.getAttribute("for"));
		if(results && results.length > 0){
			nativeElement = results[0];
		}
	}
	if(nativeElement == null){
		// TODO: Create a Logger Class
		//console.log("RTW_WEBGUI_ERR:Unable to find native input element for ", this.element);
	}
	return nativeElement;
};

JQueryUIButtonProxy.prototype.getLabelProperty = function() {
	var label = "";
	if(this.element.tagName.toLowerCase() == "input"){//JQuery submit button
		label = this.element.value;
	}else{
		if (window.jQuery) {
			label = this.element.textContent;
		}
	}

	return label;
};

JQueryUIButtonProxy.prototype._JQWidgetexecuteAction = JQueryUIButtonProxy.prototype.executeAction;
JQueryUIButtonProxy.prototype.executeAction = function(action) {
	LoggerService.logMsg(RMoTTrace, 'JQueryUIButtonProxy.prototype.executeAction('+ action.type +')');

	var webGuiTagName = this.getProperty(WebGuiConstants.TAGNAME_PROP); 
	if(webGuiTagName == JQM_CHECKBOX || webGuiTagName == JQM_RADIO){
		var htmlinputObject = this.getNativeInputElement();
		this.setTarget(htmlinputObject);
	}
	
	return this._JQWidgetexecuteAction(action);
};

JQueryUIButtonProxy.prototype.getEventsToRegister = function(){
	return [RMOT_TRIGGER_EVENT];
};

JQueryUIButtonProxy.prototype.handleEvent = function(element,methodName,event){
	rmotRecorder.log("RMoTJSI: JQueryUIButtonProxy:handleEvent Method="+methodName+", Element ="+element.className+", DomainName= "+element.domainName+", Event= "+event);
	if(element.domainName != JQUERY_DOMAIN_NAME){//49392
		return;
	}
	var parameters = {};
	parameters.enableasyncaction = false;
	var eventName = "onclick";
	var jqueryproxy = domainManager.getProxy(element);
	var tagName = jqueryproxy.getProperty(WebGuiConstants.TAGNAME_PROP);
	jqueryproxy.domainObj._recordEvent(event, eventName, tagName, element, parameters);
	event.recorded = true;
};


///////////////////////////////JQueryUIButtonProxy ends ///////////////////////////

///////////////////////////// JQueryUITabProxy ////////////////////////////////
JQueryUITabProxy = function(domainObj, element) {
	if (arguments.length == 0)
		return;
	JQueryUIWidgetProxy.apply(this, arguments);
};

JQueryUITabProxy.prototype = new JQueryUIWidgetProxy();


JQueryUITabProxy.prototype._JQWidgetgetProperty = JQueryUITabProxy.prototype.getProperty;
JQueryUITabProxy.prototype.getProperty = function(propName) {
	var propValue = null;

	switch (propName) {
	case WebGuiConstants.TABHEADER_PROP:
		propValue = this.getLabel();
		break;
	default:
		propValue = this._JQWidgetgetProperty(propName);
		break;
	}

	return propValue;
};

JQueryUITabProxy.prototype._JQWidgetapplyDecoratedProps = JQueryUITabProxy.prototype.applyDecoratedProps;
JQueryUITabProxy.prototype.applyDecoratedProps=function(targetElement){
	this._JQWidgetapplyDecoratedProps(targetElement);
	var elementTag = this.proxyName;
	if(elementTag==JQUI_TABPANNEL)
	{
		targetElement.tabheader = this.getLabel(); 
	}
};

JQueryUITabProxy.prototype.getLabel = function() {
	var label = "";
	if (window.jQuery) {
		var elementTag = this.proxyName;
		if(elementTag==JQUI_TABPANNEL)
			{
			var labelElementId = this.element.getAttribute("aria-labelledby");
			var	tabelement=	webGuiUtil.jQuery(this.element).parent();
			if(tabelement)
				{
					var tabs = webGuiUtil.jQuery(tabelement).find("LI");
					for (var i =0; i<tabs.length;i++)
						{
							var currTab = tabs[i];
							var currTabLable =currTab.getAttribute("aria-labelledby");
						    if(labelElementId==currTabLable)
						    	{
						    		var mylabel= currTab.textContent;
						    		return mylabel;
						    	}
						}
				}
		
			
			}
		else if(elementTag==JQUI_TAB)
			{
				label=this.element.content;
			}
		}
		return label;

	};
	

JQueryUITabProxy.prototype.getEventsToRegister = function(){
	return [RMOT_TRIGGER_EVENT];
};
///////////////////////////////JQueryUITabProxy ends ///////////////////////////

///////////////////////////// JQueryUIDateInputProxy Starts ////////////////////////////////


JQueryUIDateInputProxy = function(domainObj, element) {
	if (arguments.length == 0)
		return;
	JQueryUIWidgetProxy.apply(this, arguments);
	leftLabel = null ;
	topLabel = null ;
	bottomLabel =null;
};

JQueryUIDateInputProxy.prototype = new JQueryUIWidgetProxy();

JQueryUIDateInputProxy.prototype._installEventWrapper = JQueryUIDateInputProxy.prototype.installEventWrapper;
JQueryUIDateInputProxy.prototype.installEventWrapper = function(eventName, handler) {
	try {
		// https://github.com/primefaces/primefaces/issues/3054
		const proto = PrimeFaces.widget.Calendar.prototype;
		if (!proto.$alreadyInstalled) {
			proto.$alreadyInstalled = true;
			proto.fireDateSelectEvent = function() {
				const elt = this.jqEl || this.input;
				if (elt) elt.trigger('change');
			};
		}
	}
	catch(e) {}
	
	this._installEventWrapper(eventName, handler);
};

JQueryUIDateInputProxy.prototype._JQWidgetgetProperty = JQueryUIDateInputProxy.prototype.getProperty;
JQueryUIDateInputProxy.prototype.getProperty = function(propName) {
	var propValue = null;

	switch (propName) {
	case WebGuiConstants.CONTENT_PROP:
		propValue = (this.element.RMoTcontent!= undefined) ? this.element.RMoTcontent : this.element.value;
		break;
	case WebGuiConstants.LABEL_PROP :
		propValue = this.getLabel();
		if(propValue)
			propValue = propValue.trim();
		break;
	default:
		propValue = this._JQWidgetgetProperty(propName);
		break;
	}

	return propValue;
};

JQueryUIDateInputProxy.prototype._getLabel = JQueryUIDateInputProxy.prototype.getLabel;
JQueryUIDateInputProxy.prototype.getLabel = function () {
	var label = this._JQWidgetgetProperty(WebGuiConstants.LABEL_PROP );
		if (typeof(label)=='undefined' || label == null || label == "") {
			label = this._getLabel();
			if (typeof(label)=='undefined' || label == null || label == "") {
				if(this.bestComputedLabel()){
					label = this.bestComputedLabel();
				}
				else{
					var direction = traversal.LEFT;
					if( jsUtil.isRTLLanguage() == true){
						direction = traversal.RIGHT;
					}
					label = this.computeLabel(direction);
				}
			}
		}

	return label;
};
//Priority index : Left > Top
JQueryUIDateInputProxy.prototype.bestComputedLabel = function () {
	return this.leftLabel || this.topLabel || this.botttomLabel;
};

JQueryUIDateInputProxy.prototype.handleEvent = function(element, eventName, event){
	
	if (eventName == "onchange") {
		eventName="oninput";
		if (element.RMoTcontent == undefined) {
			element.RMoTcontent = "";
		}

		var proxy = domainManager.getProxy(element);
		
		var tagName = proxy.getProperty(WebGuiConstants.TAGNAME_PROP);
		proxy.domainObj._recordEvent(event, eventName, tagName, element,proxy.getParameters());
		event.recorded = true;
		element.RMoTcontent = element.value; // update value
	}
};

JQueryUIDateInputProxy.prototype._jqueryapplyDecoratedProps = JQueryUIDateInputProxy.prototype.applyDecoratedProps;
JQueryUIDateInputProxy.prototype.applyDecoratedProps=function(targetElement){
	this._jqueryapplyDecoratedProps(targetElement);
	targetElement.label = this.getProperty(WebGuiConstants.LABEL_PROP);
};

JQueryUIDateInputProxy.prototype.getParameters = function () {
	var parameters = {};
	parameters.newtext = this.element.value;//this.getProperty(WebGuiConstants.CONTENT_PROP);
	parameters.enableasyncaction = false;
	return parameters;
};

JQueryUIDateInputProxy.prototype.getEventsToRegister = function(){
	return ["onchange"];
};

///////////////////////////// JQueryProgressBarProxy Starts ////////////////////////////////
JQueryProgressBarProxy = function(domainObj,element){
	if (arguments.length == 0) return;
	JQueryUIElementProxy.apply(this,arguments);
};

JQueryProgressBarProxy.prototype = new JQueryUIElementProxy();


JQueryProgressBarProxy.prototype._JQElementapplyDecoratedProps = JQueryProgressBarProxy.prototype.applyDecoratedProps;
JQueryProgressBarProxy.prototype.applyDecoratedProps=function(targetElement){
	this._JQElementapplyDecoratedProps(targetElement);
	try {
		targetElement.max = webGuiUtil.jQuery(this.element).progressbar("option","max").toString();
		targetElement.progressvalue = webGuiUtil.jQuery(this.element).progressbar("option","value").toString();
	}
	catch(e) {
		//console.log("JQueryProgressBarProxy.applyDecoratedProps", e);
	}
};


JQueryProgressBarProxy.prototype._JQElementgetProperty = JQueryProgressBarProxy.prototype.getProperty;
JQueryProgressBarProxy.prototype.getProperty = function(propName){
	
	try {
		var propValue = "";
		switch (propName) {
			case "progressvalue":
				propValue = webGuiUtil.jQuery(this.element).progressbar("option","value").toString();
			break;
			case "max":
				propValue = webGuiUtil.jQuery(this.element).progressbar("option", propName).toString();
			break;
			default:
				propValue = this._JQElementgetProperty(propName);
				break;
		}
	} catch (e) {
		LoggerService.logMsg(RMoTTrace, 'JQueryProgressBarProxy.getProperty caught exception');
		LoggerService.logMsg(RMoTTrace, e);
	}
	return propValue;
};

///////////////////////////// JQueryProgressBarProxy Ends ////////////////////////////////

///////////////////////////// JQueryUIDateInputProxy Ends ////////////////////////////////

JQueryUIDateProxy = function(domainObj,element){
	if (arguments.length == 0) return;
	JQueryUIWidgetProxy.apply(this,arguments);
};

JQueryUIDateProxy.prototype = new JQueryUIWidgetProxy();

JQueryUIDateProxy.prototype.isContainer =  function() {
  return false;
};

JQueryUIDateProxy.prototype.handleEvent = function(element, eventName, event) {
	// Do not log any events for this widget
	event.recorded = true;
};

///////////////////////////////JQueryUITextInputProxy starts ///////////////////////////

JQueryUITextInputProxy = function(domainObj,element){
	if (arguments.length == 0) return; // don't do anything
	JQueryMobileTextInputProxy.apply(this,arguments);
	leftLabel = null ;
	topLabel = null ;
	bottomLabel =null;
};
JQueryUITextInputProxy.prototype = new JQueryMobileTextInputProxy();

JQueryUITextInputProxy.prototype.getParameters = function () {
	var params = {};
 	params.newtext = this.RMoTcontent;
 	params.enableasyncaction = false;
 	return params;
};
//JQueryUITextInputProxy.prototype._jquerygetProperty=JQueryUITextInputProxy.prototype.getProperty;
JQueryUITextInputProxy.prototype.getProperty = function(propName) {
	var propValue = null;

	switch (propName) {
	case WebGuiConstants.CONTENT_PROP:
		propValue=webGuiUtil.jQuery(this.getNativeElement()).val();
		break;
	case WebGuiConstants.LABEL_PROP:
		var results = webGuiUtil.jQuery(this.element).parents("*[class~=ui-widget]");
		if(results.length > 0){
			var parent = results[0];//jQuery(results[0]).parent();
			var elem =webGuiUtil.jQuery(parent).find("label");//var elem = jsUtil.getElementByAttribute('for', new Array(this.element.id), parent);
			if (elem && elem.length > 0) {
				propValue = elem[0].textContent;
			}
		}
		if(!propValue){
			propValue = this.getLabel();
			if(propValue)
				propValue = propValue.trim();
		}
		break;
	default:
		propValue = this._jquerygetProperty(propName);
		break;
	}

	return propValue;
};
JQueryUITextInputProxy.prototype._getLabel = JQueryUITextInputProxy.prototype.getLabel;
JQueryUITextInputProxy.prototype.getLabel = function () {
	var label = this._getLabel();
	if (typeof(label)=='undefined' || label == null || label == "") {
		if(this.bestComputedLabel()){
			label = this.bestComputedLabel();
		}
		else{
			var direction = traversal.LEFT;
			if( jsUtil.isRTLLanguage() == true){
				direction = traversal.RIGHT;
			}
			label = this.computeLabel(direction);
		}
	}

	return label;
};
//Priority index : Left > Top
JQueryUITextInputProxy.prototype.bestComputedLabel = function () {
	return this.leftLabel || this.topLabel || this.botttomLabel;
};

JQueryUITextInputProxy.prototype.getRepeatedAction = function () {
	return {"onkeyup": "oninput",
			"onkeydown": "oninput"};
};

JQueryUITextInputProxy.prototype.getEventsToRegister = function(){
	return [RMOT_TRIGGER_EVENT,"onkeyup", "onkeydown"];
};

JQueryUITextInputProxy.prototype.handleEvent = function(element, eventName, event) {
	var proxy = domainManager.getProxy(element);

	if (eventName == "onkeydown") {
		if (event.keyCode == 13) { // need to capture enter key
			eventName="onkeypress";
		}
		// else will be managed as a repeated action
	} else if (eventName == "onkeyup") {
		proxy.RMoTcontent = proxy.getProperty(WebGuiConstants.CONTENT_PROP);
	}


	var tagName = proxy.getProperty(WebGuiConstants.TAGNAME_PROP);
	proxy.domainObj._recordEvent(event, eventName, tagName, element, proxy.getParameters());
	event.recorded = true;
};

///////////////////////////// JQueryUIaccordionHeaderProxy begin////////////////////////////////


JQueryUIaccordionHeaderProxy = function(domainObj, element) {
	if (arguments.length == 0)
		return;
	JQueryUIWidgetProxy.apply(this, arguments);
};

JQueryUIaccordionHeaderProxy.prototype = new JQueryUIWidgetProxy();

JQueryUIaccordionHeaderProxy.prototype._installWrappers = JQueryUIaccordionHeaderProxy.prototype.installWrappers;
JQueryUIaccordionHeaderProxy.prototype.installWrappers = function () {
	var accordion = webGuiUtil.jQuery(this.element).closest('.ui-accordion');
	if (!accordion["$alreadyInstalled"]) {
		accordion["$alreadyInstalled"] = true;
		
		accordion.on('accordionactivate', function( event, ui ) {
			// Take a snapshot when the animation is complete
			rmotRecorder.cacheScreenshot();
		});
		
	}
	return this._installWrappers();
};

JQueryUIaccordionHeaderProxy.prototype._JQWidgetgetProperty = JQueryUIaccordionHeaderProxy.prototype.getProperty;
JQueryUIaccordionHeaderProxy.prototype.getProperty = function(propName) {
	var propValue = null;

	switch (propName) {
	case WebGuiConstants.COLLAPSED_PROP:
		var collapsed = this.element.getAttribute('aria-expanded');
		propValue = (collapsed=='true') ? false : true;
		break;
	default:
		propValue = this._JQWidgetgetProperty(propName);
		break;
	}

	return propValue;
};

JQueryUIaccordionHeaderProxy.prototype._JQWidgetapplyDecoratedProps = JQueryUIaccordionHeaderProxy.prototype.applyDecoratedProps;
JQueryUIaccordionHeaderProxy.prototype.applyDecoratedProps=function(targetElement){
	this._JQWidgetapplyDecoratedProps(targetElement);
	targetElement.collapsed = this.getProperty(WebGuiConstants.COLLAPSED_PROP);
};

JQueryUIaccordionHeaderProxy.prototype._JQWidgetexecuteAction = JQueryUIaccordionHeaderProxy.prototype.executeAction;
JQueryUIaccordionHeaderProxy.prototype.executeAction = function(action) {
	
	var retStatus = RMOT_FAILURE;
	var actionType = action.type;

	switch (actionType) {
	case "onexpand" :
		var expanded = this.element.getAttribute("aria-expanded");
		if(expanded=="false"){
			action.type="onclick";
		retStatus = this._JQWidgetexecuteAction(action);
		}
		break;
	case "oncollapse" :
		var collapse = this.element.getAttribute("aria-expanded");
		if(collapse=="true"){
			action.type="onclick";
		retStatus = this._JQWidgetexecuteAction(action);
		}
	break;	
	default:
		retStatus = this._JQWidgetexecuteAction(action);
		break;
	}
	return retStatus;
};

///////////////////////////// JQueryUIaccordionHeaderProxy begin////////////////////////////////

///////////////////////////// JQueryUISliderProxy begin////////////////////////////////


JQueryUISliderProxy = function(domainObj, element) {
	if (arguments.length == 0)
		return;
	JQueryUIWidgetProxy.apply(this, arguments);
	
	this.setWidgetChild(webGuiUtil.jQuery(this.element).find("*"));
};

JQueryUISliderProxy.prototype = new JQueryUIWidgetProxy();

JQueryUISliderProxy.prototype.getEventsToRegister = function(){
	return ["slidestart","slidestop"];//"slidechange",
};

JQueryUISliderProxy.prototype.installWrappers = function(){
	if (this.element && this.element.nodeType == window.Node.ELEMENT_NODE) {
		var events = this.getEventsToRegister();
		if(events != null){
			for(var i=0;i<events.length;i++){
//				rmotRecorder.log("JQueryUISliderProxy installWrappers: "+events[i]);
				webGuiUtil.jQuery(this.element).on( events[i], this.handleEvent );
			}
		}
		return true; // Continue with ELEMENT_NODE children
	}
	
	return false; // Don't visit knon ELEMENT_NODE childrenreturn true;
};

JQueryUISliderProxy.prototype._JQWidgetgetProperty=JQueryUISliderProxy.prototype.getProperty;
JQueryUISliderProxy.prototype.getProperty=function(propName){
	var propValue = null;
	switch (propName) {
	case "max":
	case "min":
	case "step":
		propValue = webGuiUtil.jQuery(this.element).slider("option",propName)+"";
		break;
	case WebGuiConstants.CONTENT_PROP:
	case "value":
		var tagName = this.getProxyName();
		if(tagName == JQM_RANGESLIDER ){
			// Add Range Slider specific properties
			var values = webGuiUtil.jQuery(this.element).slider("option","values");
			propValue = values[0]+" - "+values[1];
		}else{
			propValue = webGuiUtil.jQuery(this.element).slider("option","value")+"";
		}
		break;
	default:
		propValue = this._JQWidgetgetProperty(propName);
		break;
	}
	
	return propValue;
}; 

JQueryUISliderProxy.prototype.getProxyName = function() {
	if(this.sliderTagName)
		return this.sliderTagName;
	this.sliderTagName = JQM_SLIDER;
	var isRangeSlider = webGuiUtil.jQuery(this.element).slider( "option", "range" );
	var type = typeof(isRangeSlider);
	if(type == "boolean"){
		if(isRangeSlider){
			// Must be Range Slider
			this.sliderTagName = JQM_RANGESLIDER;
		}
	}
	// No special treatment required for Multiple Slider Type.It is a range slider type but visually
	// it is just a simple Slider so record it as Normal Slider only
/*	else if(type == "string"){
		// Must be multiple Slider type min or max
		this.sliderTagName = JQM_RANGESLIDER;
		if(isRangeSlider == "min"){
			
		}else if(isRangeSlider == "max"){
			
		}
	}*/
	return this.sliderTagName;
};

JQueryUISliderProxy.prototype._JQWidgetapplyDecoratedProps = JQueryUISliderProxy.prototype.applyDecoratedProps;
JQueryUISliderProxy.prototype.applyDecoratedProps=function(targetElement){
	this._JQWidgetapplyDecoratedProps(targetElement);
	targetElement.max=this.getProperty("max");
	targetElement.value=this.getProperty("value");
	targetElement.min=this.getProperty("min");
	targetElement.step=this.getProperty("step");
	if(this.sliderTagName == JQM_RANGESLIDER ){
		// Add Range Slider specific properties
	}
};


JQueryUISliderProxy.prototype.handleEvent = function( event, ui ){
	// event.originalEvent comes null when slider is changed programmatically 
	if(event.originalEvent == null || event.recorded == true) return;
	rmotRecorder.log("RMoTJSI: JQueryUISliderProxy: Event="+event.type+" Element ="+event.target);

	switch(event.type){
	case "slidestart":
		// Send request for snapshot here and store hierarchy in proxy
		var jqueryproxy = domainManager.getProxy(event.target);
		
		if(!jqueryproxy.started){
			jqueryproxy.started = 0;
    	}
    	if(jqueryproxy.started == 0){
    		//console.log("Take screenshot and build hierarchy"+ui.value);
    		//jqueryproxy.RMoTContent = ui.value;
    		jqueryproxy.screenshotid = jqueryproxy.domainObj._captureScreenshot();
    		jqueryproxy.hierarchy = jqueryproxy.domainObj._updateHierarchy();
    		jqueryproxy.started = 1;
    		event.target.UID = jqueryproxy.getUID();
    	}
		// Take snapshot here and set RMoTContent property here
		//event.target.RMoTContent = ui.value ;//$(event.target).slider("option","value");

		break;
	case "slidestop":
	
		// record statement here
		var parameters = {};
		var eventName = "onchange";
		var jqueryproxy = domainManager.getProxy(event.target);
		if(jqueryproxy.sliderTagName==JQM_RANGESLIDER){
			var ranges = webGuiUtil.jQuery(event.target).slider("option","values");
			if(ranges.length == 2){
				parameters.rangeMin = ranges[0];
				parameters.rangeMax = ranges[1];
			}else{
				rmotRecorder.log("RMoTJSI: JQueryUISliderProxy:Error in recording action on RangeSlider"+event.target);
			}
		}else{
			parameters.newtext = ui.value + "";	
		}
		var tagName = jqueryproxy.getProperty(WebGuiConstants.TAGNAME_PROP);
		jqueryproxy.UID = event.target.UID;
		// use hierarchy saved in proxy here
		jqueryproxy.domainObj._recordEventWithExistingScreenshot(eventName, tagName, this,jqueryproxy.hierarchy,parameters,jqueryproxy.screenshotid);
		jqueryproxy.hierarchy = null;
		event.recorded = true;
		jqueryproxy.screenshotid = null;
		jqueryproxy.started = 0;
		break;
	}
};

JQueryUISliderProxy.prototype._JQWidgetexecuteAction = JQueryUISliderProxy.prototype.executeAction;
JQueryUISliderProxy.prototype.executeAction = function(action) {
	LoggerService.logMsg(RMoTTrace, 'JQueryUISliderProxy.prototype.executeAction('+ action.type +')');
	var retStatus = RMOT_FAILURE;
	var actionType = action.type;

	switch (actionType) {
	case "onchange" :
		// Normal Slider
		var ranges = webGuiUtil.jQuery(this.element).slider("option","values");
		if(ranges !=null && ranges.length == 2){
			// RangeSlider
			var valMin = null;
			var valMax = null;
			if (action.parameters[0].name == "rangeMin") {
				valMin = action.parameters[0].value;
				valMax = action.parameters[1].value;
			} else {
				valMin = action.parameters[1].value;
				valMax = action.parameters[0].value;
			}
			webGuiUtil.jQuery(this.element).slider( "values", [ valMin, valMax ] );
		}else{
			// Normal Slider
			webGuiUtil.jQuery(this.element).slider( "value", action.parameters[0].value );
		}
		retStatus = RMOT_SUCCESS;
		break;
	default:
		retStatus = this._JQWidgetexecuteAction(action);
		break;
	}
	return retStatus;
};


JQueryUISliderProxy.prototype.isContainer =  function() {
	return false;
};

///////////////////////////////JQueryUISliderProxy ends ///////////////////////////

///////////////////////////// JQueryUISpinnerProxy begin////////////////////////////////


JQueryUISpinnerProxy = function(domainObj, element) {
	if (arguments.length == 0)
		return;
	JQueryUIWidgetProxy.apply(this, arguments);
	leftLabel = null ;
	topLabel = null ;
	bottomLabel =null;
};

JQueryUISpinnerProxy.prototype = new JQueryUIWidgetProxy();

JQueryUISpinnerProxy.prototype.getRepeatedAction = function () {
	return {"spinstart": "oninput"};
};

JQueryUISpinnerProxy.prototype.getEventsToRegister = function(){
	return ["spinstart","timespinnerstart"];
};

JQueryUISpinnerProxy.prototype.installWrappers = function(){
	if (this.element && this.element.nodeType == window.Node.ELEMENT_NODE) {
		var events = this.getEventsToRegister();
		if(events != null){
			for(var i=0;i<events.length;i++){
				webGuiUtil.jQuery(this.element).on( events[i], this.handleEvent );
			}
		}
		return true; // Continue with ELEMENT_NODE children
	}
	
	return false; // Don't visit knon ELEMENT_NODE childrenreturn true;
};

JQueryUISpinnerProxy.prototype._JQWidgetgetProperty=JQueryUISpinnerProxy.prototype.getProperty;
JQueryUISpinnerProxy.prototype.getProperty=function(propName){
	var propValue = null;
	try{
		switch (propName) {
		case WebGuiConstants.CONTENT_PROP:
			var nativeElement = this.getNativeInputElement();
			if(nativeElement != null){
				propValue = nativeElement.value;
			}
			break;
		case WebGuiConstants.LABEL_PROP :
			propValue = this.getLabel();
			if(propValue)
				propValue = propValue.trim();
			break;
		case "value":
			var nativeElement = this.getNativeInputElement();
			if(nativeElement != null){
				propValue = webGuiUtil.jQuery(nativeElement).spinner("value")+"";
			}
			break;
		case "max":
		case "min":
		case "culture":
		case "numberFormat":
		case "step":
			var nativeElement = this.getNativeInputElement();
			if(nativeElement != null){
				propValue = webGuiUtil.jQuery(nativeElement).spinner("option",propName)+"";
			}
			break;
		case "disabled":
			var nativeElement = this.getNativeInputElement();
			if(nativeElement != null){
				propValue = webGuiUtil.jQuery(nativeElement).spinner("option",propName);
			}
			break;
		case "page":
			propValue = 10;
			break;
		default:
			propValue = this._JQWidgetgetProperty(propName);
		break;
		}
	}catch(getPropErr){
		if (typeof(rmotRecorder) != 'undefined') {
			rmotRecorder.log("JQueryUISpinnerProxy.getProperty: Error fetching value for property: "+propName+" -- "+getPropErr);
		}
		else if (typeof(LoggerService) != 'undefined') {
			LoggerService.logMsg(RMoTTrace, "JQueryUISpinnerProxy.getProperty: Error fetching value for property: "+propName+" -- "+getPropErr);
		}
	}

	
	return propValue;
};
JQueryUISpinnerProxy.prototype._getLabel = JQueryUISpinnerProxy.prototype.getLabel;
JQueryUISpinnerProxy.prototype.getLabel = function () {
	var label = this.getLabelProperty();
		if (typeof(label)=='undefined' || label == null || label == "") {
			label = this._getLabel();
			if (typeof(label)=='undefined' || label == null || label == "") {
				if(this.bestComputedLabel()){
					label = this.bestComputedLabel();
				}
				else{
					var direction = traversal.LEFT;
					if( jsUtil.isRTLLanguage() == true){
						direction = traversal.RIGHT;
					}
					label = this.computeLabel(direction);
				}
			}
		}

	return label;
};
//Priority index : Left > Top
JQueryUISpinnerProxy.prototype.bestComputedLabel = function () {
	return this.leftLabel || this.topLabel || this.bottomLabel ;
};
JQueryUISpinnerProxy.prototype.getLabelProperty=function(){
	var label = "";
	var nativeElement = this.getNativeInputElement();
	if(nativeElement != null){
		var name = nativeElement.name;
		if(name != null){
			var results = webGuiUtil.jQuery("label[for="+name+"]");
			if(results && results.length > 0){
				label = results[0].textContent;
			}
		}
	}
	return label;
};

JQueryUISpinnerProxy.prototype.getNativeInputElement=function(){
	var nativeElement =null;
	if (window.jQuery) {
		var jqWidget = webGuiUtil.jQuery(this.element);
		var spinnerinputs = jqWidget.find("input.ui-spinner-input");
		if (spinnerinputs.length > 0) {
			nativeElement = spinnerinputs[0];
		}
	}
	if(nativeElement == null){
		//console.log("RTW_WEBGUI_ERR:Unable to find native input element for ", this.element);
	}
	return nativeElement;
};

JQueryUISpinnerProxy.prototype._JQWidgetapplyDecoratedProps = JQueryUISpinnerProxy.prototype.applyDecoratedProps;
JQueryUISpinnerProxy.prototype.applyDecoratedProps=function(targetElement){
	this._JQWidgetapplyDecoratedProps(targetElement);
	targetElement.label = this.getProperty(WebGuiConstants.LABEL_PROP); 
	targetElement.max=this.getProperty("max");
	targetElement.value=this.getProperty("value");
	targetElement.min=this.getProperty("min");
	targetElement.step=this.getProperty("step");
	targetElement.culture=this.getProperty("culture");
	targetElement.numberFormat=this.getProperty("numberFormat");
	targetElement.disabled=this.getProperty("disabled");
	targetElement.page=this.getProperty("page");
};

JQueryUISpinnerProxy.prototype.getParameters = function () {
	var parameters = {};
	parameters.newtext = this.getProperty("value");
	return parameters;
};

JQueryUISpinnerProxy.prototype.handleEvent = function( event, ui ){
	// ui is empty
	// event.originalEvent comes null when spinner is changed programmatically 
	if(event.originalEvent == null || event.recorded == true) return;
	rmotRecorder.log("RMoTJSI: JQueryUISpinnerProxy: Event="+event.type+" Element ="+event.target+" Event= "+ui.value);

	switch(event.type) {
		case "timespinnerstart": 
		case "spinstart":	
			var parameters = {};
			var eventName = "spinstart";
			var jqueryproxy = domainManager.getProxy(this);
			var tagName = jqueryproxy.getProperty(WebGuiConstants.TAGNAME_PROP);
			jqueryproxy.domainObj._recordEvent(event, eventName, tagName, this, parameters);
			event.recorded = true;
			break;
	}
};

JQueryUISpinnerProxy.prototype._JQWidgetexecuteAction = JQueryUISpinnerProxy.prototype.executeAction;
JQueryUISpinnerProxy.prototype.executeAction = function(action) {
	LoggerService.logMsg(RMoTTrace, 'JQueryUISpinnerProxy.prototype.executeAction('+ action.type +')');
	var htmlinputObject = this.getNativeInputElement();
	this.setTarget(htmlinputObject);
	//jQuery(this.element).spinner( "value", action.parameters[0].value );	
	return this._JQWidgetexecuteAction(action);
};

///////////////////////////// JQueryUIDialogProxy begin////////////////////////////////


JQueryUIDialogProxy = function(domainObj, element) {
	if (arguments.length == 0)
		return;
	JQueryUIWidgetProxy.apply(this, arguments);
	
	this.setWidgetChild(webGuiUtil.jQuery(this.element).find(".ui-dialog-titlebar-close"));
};

JQueryUIDialogProxy.prototype = new JQueryUIWidgetProxy();

JQueryUIDialogProxy.prototype.getEventsToRegister = function(){
	return ["dialogbeforeclose","dialogclose"];
};

JQueryUIDialogProxy.prototype.installWrappers = function(){
	if (this.element && this.element.nodeType == window.Node.ELEMENT_NODE) {
		var events = this.getEventsToRegister();
		if(events != null){
			for(var i=0;i<events.length;i++){
				webGuiUtil.jQuery(this.element).on( events[i], this.handleJQEvent );
			}
		}
		return true; // Continue with ELEMENT_NODE children
	}
	
	return false; // Don't visit knon ELEMENT_NODE childrenreturn true;
};

JQueryUIDialogProxy.prototype.handleJQEvent = function( event, ui ){
	// The ui object is empty but included for consistency with other events.
	// event.originalEvent comes null when dialog is closed programmatically 
	if(event.originalEvent == null || event.recorded == true) return;
	rmotRecorder.log("RMoTJSI: JQueryUIDialogProxy: Event="+event.type+" Element ="+event.target);


	switch(event.type){
	case "dialogbeforeclose":
		// Take snapshot and hierarchy here
		var parameters = {};
		var eventName = "onclose";
		var jqueryproxy = domainManager.getProxy(this);
		var tagName = jqueryproxy.getProperty(WebGuiConstants.TAGNAME_PROP);
		jqueryproxy.domainObj._recordEvent(event, eventName, tagName, this, parameters);
		event.recorded = true;
		break;
	case "dialogclose":

		break;
	}
};

JQueryUIDialogProxy.prototype._JQWidgetapplyDecoratedProps = JQueryUIDialogProxy.prototype.applyDecoratedProps;
JQueryUIDialogProxy.prototype.applyDecoratedProps=function(targetElement){
	this._JQWidgetapplyDecoratedProps(targetElement);
	targetElement.title = this.getProperty("title"); 
};

JQueryUIDialogProxy.prototype._JQWidgetgetProperty=JQueryUIDialogProxy.prototype.getProperty;
JQueryUIDialogProxy.prototype.getProperty=function(propName){
	var propValue = null;
	try{
		switch (propName) {
		case "title":
			propValue = "";
			var results = webGuiUtil.jQuery(this.element).find("*[class~=ui-dialog-title]");//.find("span.ui-dialog-title");
			if (results && results.length > 0) {
				propValue = results[0].textContent;
			}
			break;
		case WebGuiConstants.CONTENT_PROP:
			propValue="";
			break;
		default:
			propValue = this._JQWidgetgetProperty(propName);
			break;
		}
	}catch(getPropErr){
		LoggerService.logMsg(RMoTTrace, 'JQueryUIDialogProxy getPropertyError:'+propName);
	}
	return propValue;
};

JQueryUIDialogProxy.prototype._JQWidgetexecuteAction = JQueryUIDialogProxy.prototype.executeAction;
JQueryUIDialogProxy.prototype.executeAction = function(action) {
	LoggerService.logMsg(RMoTTrace, 'JQueryUIDialogProxy.prototype.executeAction('+ action.type +')');
	var retStatus = RMOT_FAILURE;
	var actionType = action.type;

	switch (actionType) {
	case "onclose" :
		webGuiUtil.jQuery(this.element).find('.ui-dialog-content').dialog('close');
		retStatus = RMOT_SUCCESS;
		break;
	default:
		retStatus = this._JQWidgetexecuteAction(action);
		break;
	}
	return retStatus;
};

///////////////////////////// JQueryUIDialogProxy end////////////////////////////////

/////////////////////////// JQueryUIMenuItemProxy begin////////////////////////////////

JQueryUIMenuItemProxy = function(domainObj, element) {
	if (arguments.length == 0)
		return;
	JQueryUIWidgetProxy.apply(this, arguments);
	
	this.setWidgetChild(webGuiUtil.jQuery(this.element).children(":first"));
};

JQueryUIMenuItemProxy.prototype = new JQueryUIWidgetProxy();

JQueryUIMenuItemProxy.prototype._JQWidgetgetProperty = JQueryUIMenuItemProxy.prototype.getProperty;
JQueryUIMenuItemProxy.prototype.getProperty = function(propName) {
	var propValue = null;

	switch (propName) {
	case WebGuiConstants.CONTENT_PROP:
		propValue = jQueryMenuItemGetText(this.element);
		break;
	default:
		propValue = this._JQWidgetgetProperty(propName);
		break;
	}

	return propValue;
};

JQueryUIMenuItemProxy.prototype.isVisible = function() {
	// override default behaviour because the menu item is always reachable
	return { visibility: true, propagation: false, reachable: true };
};

JQueryUIMenuItemProxy.prototype.executeAction = function(action) {
	var retStatus = RMOT_FAILURE;
	var actionType = action.type;

	switch (actionType) {
		case "onclick" :
			// 1. find parent 'ui-menu' of given 'ui-menu-item'
			// 2. invoke "focus" on 'ui-menu-item' for result of 1
			// 3. invoke "expand" on result of 2
			// 4. invoke "select" on result of 3 (after looping)
			// $($(".ui-menu-item#id).parent('.ui-menu')[0]).menu("focus", null $(".ui-menu-item#id)).menu("expand")
			try {
				var dollar = webGuiUtil.jQuery;
				
				var elem = dollar(this.element);
		        var ancestors = dollar(elem).parents('.ui-menu-item');
	
		        var submenu_depth = (ancestors && ancestors.length) || 0;

				// the menu item is located in sub-menu, expand all of them
		        if (submenu_depth > 0) {
		            var menuObject = dollar(ancestors[submenu_depth-1]).parents('.ui-menu')[0];
		            var curr_item = dollar(menuObject).menu("focus", null, dollar(ancestors[submenu_depth-1])).menu("expand");
		                                                
		            for (var i = submenu_depth - 2 ; i >= 0 ; i--) {
		                curr_item = curr_item.menu("focus", null, dollar(ancestors[i])).menu("expand");
		            }

		            // finished expanding all the sub-menus, first focus the menu-item and execute the 'select' event
		            var _proxyObj = this;

		            setTimeout(function() {
		            	 _proxyObj.drawRectangle("solid red");
		            	dollar(menuObject).menu("focus", null, dollar(menuObject).menu().find(elem));
		            	}, 200);
		            setTimeout(function(){
		            	_proxyObj.removeRectangle();
		            	// if the click is not on a menu-item
		            	// but on a sub-menu, it should be expanded explicitly as 
		            	// the 'select' action doesn't expand the sub-menu
		            	dollar(menuObject).menu("focus", null, dollar(menuObject).menu().find(elem)).menu("select").menu("expand");
		            	}, 700);
		        } 
		        else { // menu item directly visible
		        	// find the parent 'menu' to focus the 'menu item'
		        	var _parent = dollar(elem).parents('.ui-menu')[0];
		        	// now execute 'focus' on the menu item through parent 'menu'
		        	dollar(_parent).menu("focus", null, dollar(_parent).menu().find(elem));
		        	// and then deliver the click
		        	// this can be done directly
		        	dollar(elem).click();
		        }
		        retStatus = RMOT_SUCCESS;
			}
			catch(e) {
				LoggerService.logMsg(RMoTError, 'JQueryUIMenuItem: Unknown exception: ' + e);
			}	       	   
			
			break;		
		default:
			retStatus = this._JQWidgetexecuteAction(action);
			break;
	}
	return retStatus;
};

JQueryUIMenuItemProxy.prototype.drawRectangle = function(_color) {
	var rect = this.element.getBoundingClientRect();
	var _doc = this.element.ownerDocument;
	var _top = rect.top;
	var _left = rect.left;
	var _right = rect.right;
	var _bottom = rect.bottom;
	var _width = rect.width;
	var _height = rect.height;
	this.RMoTRect = _doc.createElement('div');
	var rectStyle = 'border:'+2+'px '+ _color+';position:absolute;background:none;top:'+_top+'px;left:'+_left+'px;width:'+_width+'px;height:'+_height+'px;z-index:1000000;pointer-events: none;';
	
	this.RMoTRect.setAttribute( "style", rectStyle );
	_doc.body.appendChild(this.RMoTRect);

};

JQueryUIMenuItemProxy.prototype.removeRectangle = function() {
	if (this.RMoTRect && this.RMoTRect.ownerDocument.body) {
		this.RMoTRect.ownerDocument.body.removeChild(this.RMoTRect);
		this.RMoTRect = null;
	}
};

JQueryUIMenuItemProxy.prototype.installWrappers = function() {	
	// <a> element contained in ui-menu-item should not handle
	// clicks in this context
//	this.setWidgetChild(jQuery(this.element).children(":first"));
	return false; 
};

JQueryUIMenuItemProxy.prototype.getEventsToRegister = function() {	
	return [];
};

/////////////////////////// JQueryUIMenuItemProxy end////////////////////////////////

jQueryMenuItemGetText = function (elem) {
	var retVal = jQueryExtractTextForMenuItem(elem);
    var labels = [];

    // get current menu item
    labels.push(retVal);
    var ancestors = webGuiUtil.jQuery(elem).parents('.ui-menu-item');
    
    // get its ancestors, begin with imm. parent and goes up
    // all the way till topmost menu item
    for (var i = 0; i < ancestors.length; i++) {
        labels.push(jQueryExtractTextForMenuItem(ancestors[i]));
    }
    
    // the labels are in reverse order as we fetched them bottom up
    // for display it should be in top down order
    if (labels.length > 1) {
        labels.reverse();
        retVal = labels.join("->");
    }
    return retVal;
  };

  jQueryExtractTextForMenuItem = function (elem) {
	// assume the menu item node has <a> which
	// contains the text for prior to v1.10 and 
	// later with text node incase of submenus or text of menu item
	  if(webGuiUtil.jQuery(elem).children().length > 0) {
		  var childAnchors = webGuiUtil.jQuery(elem).find("a,div");
		if(childAnchors.length > 0) {
			return childAnchors.first().text();
		} else {
			return webGuiUtil.jQuery(elem).contents().filter(function() {
				    return this.nodeType === 3; //Node.TEXT_NODE
				  }).first().text().trim();
		}
	  }
	  return webGuiUtil.jQuery(elem).text();
  };
	
/////////////////////////// JQueryUIMenuProxy begin////////////////////////////////

JQueryUIMenuProxy = function(domainObj, element) {
	if (arguments.length == 0)
		return;
	JQueryUIWidgetProxy.apply(this, arguments);
};

JQueryUIMenuProxy.prototype = new JQueryUIWidgetProxy();

JQueryUIMenuProxy.prototype.getEventsToRegister = function(){
	return ["menuselect", "mouseenter"];
};

JQueryUIMenuProxy.prototype.installWrappers = function() {
	if (this.element && this.element.nodeType == window.Node.ELEMENT_NODE) {
		var events = this.getEventsToRegister();
		var handler = this.handleJQMenuEvent;
		var elem = this.element;
		if(events != null){
			for(var i=0;i<events.length;i++){
				webGuiUtil.jQuery(this.element).on( events[i], function(event, ui) {
					handler(event, ui, elem);
				});
			}
		}
		return false; // Don't continue with children
	}	
	return false; 
};

JQueryUIMenuProxy.prototype._handleJQMenuEvent = JQueryUIMenuProxy.prototype.handleEvent;
JQueryUIMenuProxy.prototype.handleJQMenuEvent = function( event, ui, element ) {
	if(event.originalEvent == null || event.recorded == true) return;
	var menuRole = webGuiUtil.jQuery(element).attr("role");
	if(menuRole && menuRole =="listbox") return;
	
	if (event.type === 'mouseenter') {
		webGuiRecorderInterfaceObj.cachedScreenshotId = webGuiRecorderInterfaceObj.captureScreenshot();
		return;
	}
	
	element.clickedElement = ui.item;
	var parameters = {};
	parameters.enableasyncaction = false;
	var eventName = "onclick";
	var jqueryproxy = domainManager.getProxy(element);
	var tagName = "jquimenuitem";
	// tagName is not used for identifying the click, hence the changing the 'element '
	// to reflect the actual element (menu item) that was clicked
	jqueryproxy.domainObj._recordEvent(event, eventName, tagName, ui.item[0], parameters);
	event.recorded = true;
};

JQueryUIMenuProxy.prototype._JQWidgetgetProperty = JQueryUIMenuProxy.prototype.getProperty;
JQueryUIMenuProxy.prototype.getProperty = function(propName) {
	var propValue = null;

	switch (propName) {
	case WebGuiConstants.CONTENT_PROP:
		var item = this.element.clickedElement;
		//this.element.clickedElement = null; //reset
		propValue = (item != null) ? jQueryMenuItemGetText(item) : "";
		break;
	default:
		propValue = this._JQWidgetgetProperty(propName);
		break;
	}

	return propValue;
};

JQueryUIMenuProxy.prototype.isVisible =  function() {
	var ret = { visibility: true, propagation: false, reachable: true };

	return ret;
};

/////////////////////////// JQueryUIMenuProxy end////////////////////////////////

/////////////////////////// JQueryUISelectmenuProxy begin////////////////////////////////

JQueryUISelectmenuProxy = function(domainObj, element) {
	if (arguments.length == 0)
		return;
	JQueryUIWidgetProxy.apply(this, arguments);
	leftLabel = null ;
	topLabel = null ;
	
	this.setWidgetChild(webGuiUtil.jQuery(this.element).find("span"));
};

JQueryUISelectmenuProxy.prototype = new JQueryUIWidgetProxy();

JQueryUISelectmenuProxy.prototype.getEventsToRegister = function(){	
	return ["selectmenuopen", "selectmenuchange"];
};


JQueryUISelectmenuProxy.prototype.installWrappers = function() {
	if (this.element && this.element.nodeType == window.Node.ELEMENT_NODE) {
		var events = this.getEventsToRegister();
		var handler = this.handleJQSelectmenuEvent;
		var elem = this.element;
		var selelem = this.getNativeSelectElement();
		if(selelem && (events != null) ){
			for(var i=0;i<events.length;i++){
				webGuiUtil.jQuery(selelem).on( events[i], function(event, ui) {
					handler(event, ui, elem);
				});
			}
		}
		return false; // Don't continue with children
	}	
	return false; 
};

JQueryUISelectmenuProxy.prototype.handleJQSelectmenuEvent = function( event, ui, element ) {
	if(event.originalEvent == null || event.recorded == true) return;
	switch(event.type) {
	case "selectmenuopen":
		// Send request for snapshot here and store hierarchy in proxy
		var jqueryproxy = domainManager.getProxy(element);
		
		if(!jqueryproxy.started){
			jqueryproxy.started = 0;
    	}
    	if(jqueryproxy.started == 0){
    		jqueryproxy.screenshotid = webGuiRecorderInterfaceObj.cachedScreenshotId;
    		jqueryproxy.hierarchy = jqueryproxy.domainObj._updateHierarchy();
    		jqueryproxy.started = 1;
    	}
    	element.UID = jqueryproxy.getUID();
		break;
	case "selectmenuchange":
		var parameters = {};
		parameters.newtext = ui.item.label;
		var eventName = "onchange";
		var jqueryproxy = domainManager.getProxy(element);
		var tagName = "jqmselect";
		
		jqueryproxy.UID = element.UID;
		jqueryproxy.domainObj._recordEventWithExistingScreenshot(eventName, tagName, element, jqueryproxy.hierarchy, parameters, jqueryproxy.screenshotid);
		jqueryproxy.hierarchy = null;
		event.recorded = true;
		jqueryproxy.screenshotid = null;
		jqueryproxy.started = 0;
		break;
	}
	
};

JQueryUISelectmenuProxy.prototype.isVisible =  function() {
	var ret = { visibility: true, propagation: false, reachable: true };

	return ret;
};

JQueryUISelectmenuProxy.prototype.getNativeSelectElement=function(){
	var nativeElement =null;
	if (window.jQuery) {
		var idstr = webGuiUtil.jQuery(this.element).attr("id");
		if (idstr == null || idstr == "") {
			return nativeElement;
		}
		idstr = jsUtil.escapeCSS(idstr);
		var selmenuid = idstr.substr(0, idstr.lastIndexOf("-button"));
		var ownerDoc = this.element.ownerDocument;
		var results = webGuiUtil.jQuery(ownerDoc).find("#"+ selmenuid);
		if(results && results.length > 0){
			nativeElement = results[0];
		}
	}
	//if(nativeElement == null)
	//	rmotRecorder.log("RTW_WEBGUI_ERR:Unable to find native select element for ", this.element);
		
	return nativeElement;
};


JQueryUISelectmenuProxy.prototype.getNativeMenuElement=function(){
	var nativeElement =null;
	if (window.jQuery) {
		var idstr=webGuiUtil.jQuery(this.element).attr("id");
		idstr = jsUtil.escapeCSS(idstr);
		var selmenuid = idstr.substr(0, idstr.lastIndexOf("-button")).concat("-menu");
		var ownerDoc = this.element.ownerDocument;
		var results = webGuiUtil.jQuery(ownerDoc).find("#"+ selmenuid);
		if(results && results.length > 0){
			nativeElement = results[0];
		}
	}
	//if(nativeElement == null)
	//	rmotRecorder.log("RTW_WEBGUI_ERR:Unable to find native menu element for ", this.element);
		
	return nativeElement;
};

JQueryUISelectmenuProxy.prototype._JQWidgetgetProperty=JQueryUISelectmenuProxy.prototype.getProperty;
JQueryUISelectmenuProxy.prototype.getProperty=function(propName){
	var propValue = null;
	try{
		switch (propName) {
		case WebGuiConstants.CONTENT_PROP:
			var select = this.getNativeSelectElement();
			if(select != null){
				selValue = select.value;
				propValue = "";
				for (var i = 0; i < select.options.length; i++) {
					if(selValue == select.options[i].value) {
						propValue = select.options[i].text;
						break;
					}
				}
			}
			break;
		case "length":
			propValue = this.getNativeSelectElement().options.length;
			break;
		case "options":
			var select = this.getNativeSelectElement();
			propValue = "";
			for (var i = 0; i < select.options.length; i++) {
				propValue += select.options[i].text + ', ';
			}
			propValue = propValue.substring(0, propValue.length-2);
			break;
		case WebGuiConstants.LABEL_PROP :
			propValue = this.getLabel();
			if(propValue)
				propValue = propValue.trim();
			break;
		default:
			propValue = this._JQWidgetgetProperty(propName);
			break;
		}
	}catch(getPropErr){
		//rmotRecorder.log("Error fetching value for property: "+propName+" -- "+getPropErr);
	}

	
	return propValue;
};
JQueryUISelectmenuProxy.prototype._getLabel = JQueryUISelectmenuProxy.prototype.getLabel;
JQueryUISelectmenuProxy.prototype.getLabel = function () {
	var label = this._JQWidgetgetProperty(WebGuiConstants.LABEL_PROP );
		if (typeof(label)=='undefined' || label == null || label == "") {
			label = this._getLabel();
			if (typeof(label)=='undefined' || label == null || label == "") {
				if(this.bestComputedLabel()){
					label = this.bestComputedLabel();
				}
				else{
					var direction = traversal.LEFT;
					if( jsUtil.isRTLLanguage() == true){
						direction = traversal.RIGHT;
					}
					label = this.computeLabel(direction);
				}
			}
		}

	return label;
};
//Priority index : Left > Top
JQueryUISelectmenuProxy.prototype.bestComputedLabel = function () {
	return this.leftLabel || this.topLabel ;
};
JQueryUISelectmenuProxy.prototype._jqueryapplyDecoratedProps = JQueryUISelectmenuProxy.prototype.applyDecoratedProps;
JQueryUISelectmenuProxy.prototype.applyDecoratedProps=function(targetElement){
	this._jqueryapplyDecoratedProps(targetElement);
	targetElement.options = this.getProperty(WebGuiConstants.OPTIONS_PROP);
	targetElement.length = this.getProperty(WebGuiConstants.OPTIONSLENGTH_PROP);
	targetElement.label = this.getProperty(WebGuiConstants.LABEL_PROP);
};

JQueryUISelectmenuProxy.prototype._JQWidgetexecuteAction = JQueryUISelectmenuProxy.prototype.executeAction;
JQueryUISelectmenuProxy.prototype.executeAction = function(action) {
	LoggerService.logMsg(RMoTTrace, 'JQueryUISelectmenuProxy.prototype.executeAction('+ action.type +')');
	var retStatus = RMOT_INCONCLUSIVE;
	var actionType = action.type;
	var option = action.parameters[0].value;
	switch (actionType) {
	case "onchange" :
		try {
			var selectElement = this.getNativeSelectElement();
			var dropdownMenuElement = this.getNativeMenuElement();
			if (selectElement && dropdownMenuElement) {
				webGuiUtil.jQuery(selectElement).selectmenu().selectmenu('open');
				var optionElement = null;
				var _max = 0;
				for (var i = 0; i < webGuiUtil.jQuery(dropdownMenuElement).children().length; i++) {
					var _child = webGuiUtil.jQuery(dropdownMenuElement).children()[i];
					var _w = jsUtil.computeStringSimilarity(webGuiUtil.jQuery(_child).text(), option);
					if (_w == 10) {
						optionElement = webGuiUtil.jQuery(dropdownMenuElement).children()[i];
						retStatus = RMOT_SUCCESS;
						break;
					} else if (RMOT_GuidedHealing == true) {
						if (_w > _max) {
							_max = _w;
							optionElement = webGuiUtil.jQuery(dropdownMenuElement).children()[i];
							retStatus = RMOT_RECOVERY;
						}
					}
				}

				if (optionElement) {
					webGuiUtil.jQuery(dropdownMenuElement).menu("focus", null, webGuiUtil.jQuery(dropdownMenuElement).find(optionElement)).menu("select");
				} else {
					LoggerService.logMsg(RMoTTrace, 'JQueryUISelectmenu: Tried with Invalid option :' + option);
				}
			}
		} catch (Err) {
			LoggerService.logMsg(RMoTTrace, 'Error in JQueryUISelectmenuProxy.prototype.executeAction('+ action.type +')');
		}
		
		break;
	default:
		retStatus = this._JQWidgetexecuteAction(action);
		break;
	}
	return retStatus;
};

/////////////////////////// JQueryUISelectmenuProxy end////////////////////////////////

///////////////////////////// JQueryUIControlGroupProxy //////////////////////////
JQueryUIControlGroupProxy = function(domainObj,element){
	if (arguments.length == 0) return; // don't do anything
	JQueryMobileWidgetProxy.apply(this,arguments);
};
JQueryUIControlGroupProxy.prototype = new JQueryMobileWidgetProxy();

JQueryUIControlGroupProxy.prototype.handleEvent = function(element, eventName, event) {
	// Do not log any events for this widget
	event.recorded = true;
};
///////////////////////////// JQueryUIControlGroupProxy End //////////////////////////
/*
 *
 *	Licensed Materials - Property of IBM and/or HCL
 *
 *	IBM Rational Mobile Test
 *
 *	(C) Copyright IBM Corporation 2014, 2019. All Rights Reserved. 
 *  (C) Copyright HCL Technologies Ltd. 2017, 2019. All Rights Reserved. 
 *
 *	Note to U.S. Government Users Restricted Rights:  
 *	Use, duplication or disclosure restricted by GSA ADP
 *	Schedule Contract with IBM Corp. 
 *
 */

/* cf com.ibm.rational.test.mobile.android.runtime.dynamicfinding.DynamicFinder */


/*
 * Inserts the specified element at the specified position in this list.
 * Shifts the element currently at that position (if any) and any subsequent 
 * elements to the right (adds one to their indices).
 */
function RMoTaddElemAtToArray(index, elem, tab) {
	var copy = new Array();
	var i=0;
	var ll=tab.length;
	// duplicate the tab and reset it
	for (i=0; i<ll; i++) {
		copy.push(tab.shift());
	}
	// recreate the tab with the elem to insert
	for (i=0; i<=ll; i++) {
		if (index == i) {
			tab.push(elem);
		} else {
			tab.push(copy.shift());
		}
	}
	return tab;
}

RMoTArea = function() {
};

RMoTArea.prototype = {
	RMoTInit: function(x1, y1, x2, y2) {
		this.x1 = x1;
		this.y1 = y1;
		this.x2 = x2;
		this.y2 = y2;
	},

	RMoTcreateAreaFromView: function(obj) {
		this.x1 = RMoTgetX(obj);
		this.y1 = RMoTgetY(obj);
		this.x2 = RMoTgetX(obj) + RMoTgetWidth(obj);
		this.y2 = RMoTgetY(obj) + RMoTgetHeight(obj);
	},

	RMoTintersects: function (area) {
		return ((this.x1 < area.x2) && (area.x1 < this.x2) && (this.y1 < area.y2) && (area.y1 < this.y2));
	},
};

/*
 * this function returns the distance from the point ref to the point o1
 * direction is TypeLocator: left, right, above, ...
 */
function RMoTDistanceComparator(direction, ref, o1) {
	var d1;
	switch (direction) {
	case 'LLeft':
	case 'LRight':
		var cx  = RMoTgetX(ref) + RMoTgetWidth(ref)/2;
		d1 = Math.abs(RMoTgetX(o1) + RMoTgetWidth(o1)/2 - cx);
		break;
	case 'LAbove':
	case 'LUnder':
		var cy = RMoTgetY(ref) + RMoTgetHeight(ref)/2;
		d1 = Math.abs(RMoTgetY(o1) + RMoTgetHeight(o1)/2 - cy);
		break;
	case 'LNear':
		var cx  = RMoTgetX(ref) + RMoTgetWidth(ref)/2;
		var d1x = Math.abs(RMoTgetX(o1) + RMoTgetWidth(o1)/2 - cx);
		var cy = RMoTgetY(ref) + RMoTgetHeight(ref)/2;
		var d1y = Math.abs(RMoTgetY(o1) + RMoTgetHeight(o1)/2 - cy);
		d1 = Math.sqrt(d1x*d1x + d1y*d1y);
		break;
	default:
		return 0;
	}
	return d1;
}

/*
 * Add "elem" or its descendants to "views" if "elem" is compatible with "typename" and "identifyby"
 */
function RMoTfindMachingObjectElementWithIdOnly(views, elem, typename, identifyby) {
	var proxy = domainManager.getProxy(elem);

	if (elem.nodeType == window.Node.ELEMENT_NODE) {
		var visible = proxy.isVisible();

		if (!visible.visibility && visible.propagation || proxy.isWidgetChild) return;

		if (visible.reachable) {
			if (typename != null && RMoTisCompatibleWith(elem, typename)) { 
				if (identifyby == null) {
					views.push(elem);
				} else {
					if (RMoTisElemOKWithId(elem, identifyby)) {
						views.push(elem);
					}
				}
			}
		}
	}

	if (proxy.isContainer()) {
		if (isFrameElement(elem) && elem.contentDocument) { // 37668
			jsUtil.setOwnerDocumentCoordinates(elem);				
			elem = elem.contentDocument || elem.contentWindow.document;
		}

		// loop on children
		var children = new Array();
		if ((elem.shadowRoot != null) && (elem.shadowRoot.hasChildNodes())) {
			for (var i0 = 0; i0 < elem.shadowRoot.childNodes.length; i0++) {
				children.push(elem.shadowRoot.childNodes[i0]);
			}
		}
		if (elem.hasChildNodes()) {
			for (var i1 = 0; i1 < elem.childNodes.length; i1++) {
				children.push(elem.childNodes[i1]);
			}
		}
		for (var i = 0; i < children.length; i++) {
			RMoTfindMachingObjectElementWithIdOnly(views, children[i], typename, identifyby);
		}
	}
}

function RMoTisElemOKWithId(/*Object*/ elem, /*DeviceId*/ id) {
	var idTrim = jsUtil.trimAndFormat("TString", id.parameter.value);
	var valTrim = jsUtil.trimAndFormat(id.parameter.type, RMoTgetIdentifiedByValue(elem, id));

//LoggerService.logMsg(RMoTTrace, 'RMoTisElemOKWithId(' + idTrim + ' ,' + valTrim + ')');
	
	var ret = null;
	if (id.operator == undefined)
		ret = idTrim == valTrim;
	else
		ret = jsUtil.applySimpleOperator(valTrim, idTrim, id.operator);
	
	if (!ret) {
		ret = RMoTisElemOKWithDeprecatedId(elem, id, idTrim);
	}
	
	return ret;
}

/*
 * go through views and returns the object pointed at "loc"
 */
function RMoTselect(loc, views, candidatesAfterMainLocation) {
	var type = loc.type;

	var ll = (views == null) ? 0 : views.length;

	switch (type) {
	case 'LFirst':
		// deprecated
		return RMoTselectFirst(views);
	case 'LLast':
		// deprecated
		return RMoTselectLast(views);
	case 'LPosition':
		// no secondary locator
		var r = loc.parameter.value;
		return RMoTselectPosition(views,r);
	case 'LLeft':
	case 'LRight':
	case 'LAbove':
	case 'LUnder':
	case 'LNear':
		if (loc.parameter.type == 'TUIObject') {
			var uiobject = loc.parameter.object;
			var elems = RMoTfindElement(uiobject); 
			if (elems && elems.length == 1) {
				return RMoTselectByLocation(elems[0], views, type, candidatesAfterMainLocation);
			}
		}
		break;
	case 'LCover':
	case 'LCovered':
	case 'LContain':
	case 'LContained':
		if (loc.parameter.type == 'TUIObject') {
			var uiobject = loc.parameter.object;
			var elems = RMoTfindElement(uiobject); 
			if (elems && elems.length == 1) {
				switch (type) {
				case 'LCover':
				case 'LCovered':
					return RMoTselectCover(type, elems[0], views, candidatesAfterMainLocation);
					break;
				case 'LContain':
				case 'LContained':
					return RMoTselectContain(type, elems[0], views, candidatesAfterMainLocation);
					break;
				}
			}
		}
		break;
	default:
		break;
	}
	return null;
}


function RMoTselectFirst(views) {
	var res;
	if (views.length > 0) {
		res = views[0];
		/*int*/var X = RMoTgetX(res);
		/*int*/var Y = RMoTgetY(res);
		for (var i = 1; i < views.length; i++) {
			var X2 = RMoTgetX(views[i]);
			var Y2 = RMoTgetY(views[i]);
			if ((Y2 < Y) || ((Y2 == Y) && (X2 < X))) {
				Y = Y2;
				X = X2;
				res = views[i];
			}
		}
	}		
	return res;
}

function RMoTselectLast(views) {
	var res;
	if (views.length > 0) {
		res = views[0];
		/*int*/var X = RMoTgetX(res);
		/*int*/var Y = RMoTgetY(res);
		for (var i = 1; i < views.length; i++) {
			var X2 = RMoTgetX(views[i]);
			var Y2 = RMoTgetY(views[i]);
			if ((Y2 > Y) || ((Y2 == Y) && (X2 > X))) {
				Y = Y2;
				X = X2;
				res = views[i];
			}
		}
	}
	return res;
}


function RMoTaddSorttingView(views,	// original list
		l,							// index of object to be sorted
		sortedList,					// list of sorted index
		v							// object to be sorted
)
{
	var X = RMoTgetX(v);
	var Y = RMoTgetY(v);
	var i = 0;
	for (; (i < l); i++) {
		var X2 = RMoTgetX(views[sortedList[i]]);
		var Y2 = RMoTgetY(views[sortedList[i]]);
		if ((Y2 < Y) || ((Y2 == Y) && (X2 < X))) {
			continue;
		}
		break;
	}
	return i;
}


function RMoTselectPosition(views, position) {
	var res;
	if (views.length >= position) {
		var sortedList = new Array();
		for (var j = 0; j < views.length; j++) sortedList.push(-1);

		for (var i = 0; i < views.length; i++) {
			var visible = domainManager.getProxy(views[i]).isVisible();
			if (visible.reachable == true) {
				var pos = RMoTaddSorttingView(views, i, sortedList, views[i]);
				// insertion
				if (pos < i) {
					for (var k = i; k > pos; k--)
						sortedList[k] = sortedList[k-1];
				}
				sortedList[pos] = i;
			}
		}
		res = views[sortedList[position-1]]; // position starts at 1, not 0
	}
	return res;
}

/* Select the best widget depending on the location type (left, right, .....) */
function /*Object*/ RMoTselectByLocation(/*Object*/ view, /*List<Object>*/ candidates, /*TypeLocator*/ location, /*ArrayList<Object>*/ candidatesAfterMainLocation) {
	// set to null candidates that are not in the search area 
	RMoTfilterCandidates(view, candidates, location);

	//- right now all candidates have at least a part inside the search area
	//- returns the closest candidate
	if (candidatesAfterMainLocation != null) {
		for (var i1=0; i1<candidates.length; i1++) {
			if (candidates[i1] != null) {
				candidatesAfterMainLocation.push(candidates[i1]);
			}
		}
	}
	//
	var ret = -1;
	var mini = Number.MAX_VALUE;
	for (var i=0; i<candidates.length; i++) {
		if (candidates[i] != null) {
			var dist = RMoTDistanceComparator(location, view, candidates[i]);
			if (dist < mini) {
				mini = dist;
				ret = i;
			}
		}
	}
	return (ret >= 0) ? candidates[ret] : null;
}

/*
 * return the filiation level of view according to v
 * -1 view is not a descendant of v
 * 0 view is v
 * 1 view is the child of v
 * 2 view is the grandchild of v
 * ...
 */
function RMoTisFiliationOf(view, v) {
	var ret = -1;
	var node = view;
	var i = 0;
	while (node != null) {
		if (node == v) {
			ret = i;
			break;
		}
		i = i + 1;
		node = node.parentNode;
	}
	return ret;
}

/* Select the closest container widget of the view */
function RMoTselectCover(op, view, views, candidatesAfterMainLocation) {
	var res = null;
	for (var i = 0; i < views.length; i++) {
		var v = views[i];
		var cond;
		if (op == 'LCover')
			cond = RMoTisIncludedIn(view, v);
		else if (op == 'LCovered')
			cond = RMoTisIncludedIn(v, view);
		//
		if (cond) {
			if (res == null) {
				res = v;
			} else {
				res = RMoTgetSmallest(v, res);
			}
			if (candidatesAfterMainLocation != null) {
				RMoTaddCoveringCandidate(v, candidatesAfterMainLocation, false);
			}
		}
	}
	return res;
}


/* seek among views the closest item of view */
function RMoTselectContain(op, view, views, candidatesAfterMainLocation) {
	var itemsTab = new Array();
	// first loop on views to compute filiation
	for (var i = 0; i < views.length; i++) {
		var v = views[i];
		if (op == 'LContain')
			itemsTab.push(RMoTisFiliationOf(view, v));
		else if (op == 'LContained')
			itemsTab.push(RMoTisFiliationOf(v, view));
	}
	// get the closest item
	var index = -1;
	for (var i = 0; i < views.length; i++) {
		if (itemsTab[i] > 0) {
			if ((index < 0) || (itemsTab[i] < itemsTab[index])) index = i;
			if (candidatesAfterMainLocation != null)
				RMoTaddContainmentCandidate(views[i], candidatesAfterMainLocation, false);
		}
	}
	return (index < 0) ? null : views[index];
}

function RMoTaddCoveringCandidate(view, candidatesAfterMainLocation, smallestFirst) {
	var index = 0;
	for (index = 0; index < candidatesAfterMainLocation.length; index++) {
		var current = candidatesAfterMainLocation[index];
		if (smallestFirst) {
			if (RMoTisSmaller(view, current)) {
				break;
			}
		} else {
			if (RMoTisSmaller(current, view)) {
				break;
			}
		}
	}
	candidatesAfterMainLocation = RMoTaddElemAtToArray(index, view, candidatesAfterMainLocation);
}

function RMoTaddContainmentCandidate(view, candidatesAfterMainLocation, deepestFirst) {
	var index = 0;
	for (index = 0; index < candidatesAfterMainLocation.length; index++) {
		var current = candidatesAfterMainLocation[index];
		if (deepestFirst) {
			if (RMoTisIncludedIn(view, current)) {
				break;
			}
		} else {
			if (RMoTisIncludedIn(current, view)) {
				break;
			}
		}
	}
	candidatesAfterMainLocation = RMoTaddElemAtToArray(index, view, candidatesAfterMainLocation);
}


function /*Object*/ RMoTgetSmallest(/*Object*/ v1, /*Object*/ v2) {
	return RMoTisSmaller(v1, v2) ? v1 : v2;
}

function RMoTisSmaller(v1, v2) {
	/*int*/var w1 = RMoTgetWidth(v1);
	/*int*/var h1 = RMoTgetHeight(v1);
	/*int*/var w2 = RMoTgetWidth(v2);
	/*int*/var h2 = RMoTgetHeight(v2);
	if (w1*h1 <= w2*h2) return true;
	return false;
}

function /*boolean*/ RMoTisIncludedIn(/*Object*/ view, /*Object*/ v) {
	/*int*/var x1 = RMoTgetX(view);
	/*int*/var y1 = RMoTgetY(view);
	/*int*/var w1 = RMoTgetWidth(view);
	/*int*/var h1 = RMoTgetHeight(view);
	/*int*/var x2 = RMoTgetX(v);
	/*int*/var y2 = RMoTgetY(v);
	/*int*/var w2 = RMoTgetWidth(v);
	/*int*/var h2 = RMoTgetHeight(v);
	return (x2<=x1) && (y2<=y1) && (x2+w2>=x1+w1) && (y2+h2>=y1+h1) ;
}

/* Filters the given candidates list by removing candidates that are not in the search area 
 * (relatively to the given reference element and the search direction)
 * @param view reference element
 * @param candidates list of candidates to filter
 * @param location the direction of the search
 */
function RMoTfilterCandidates(/*Object*/ view, /*List<Object>*/ candidates,	/*TypeLocator*/ location) {
	// For near locator, no filter
	if (location == 'LNear') return;
	var searchArea = RMoTgetSearchableArea(view, location);
	var oppositeArea = null;
	switch (location) {
	case 'LLeft':
		oppositeArea = RMoTgetSearchableArea(view, 'LRight');
		break;
	case 'LRight':
		oppositeArea = RMoTgetSearchableArea(view, 'LLeft');
		break;
	case 'LAbove':
		oppositeArea = RMoTgetSearchableArea(view, 'LUnder');
		break;
	case 'LUnder':
		oppositeArea = RMoTgetSearchableArea(view, 'LAbove');
		break;
	default:
		break;
	}

	for (var i = 0; i < candidates.length; i++) {
		/*Area*/var candidate = new RMoTArea();
		candidate.RMoTcreateAreaFromView(candidates[i]);
		//- if a candidate area does not intersect the search area we can drop it
		if ( ! candidate.RMoTintersects(searchArea)) {
			candidates[i] = null;
		} else if (oppositeArea != null && candidate.RMoTintersects(oppositeArea)) {
			// If a candidate intersects both on the left and right areas of the view, then let's no longer consider it
			// Same for up and down
			candidates[i] = null;
		}
	}
}

/*
 * According to the given location, returns the area in which the searched element could be relatively to the given ref element.
 * @param v reference element
 * @param location direction relatively to the reference element 
 * @return an area where the searched element could be
 */
function /*Area*/ RMoTgetSearchableArea(/*Object*/ v, /*TypeLocator*/ location) {
	/*Area*/var ref = new RMoTArea();
	ref.RMoTcreateAreaFromView(v);

	var ret = new RMoTArea();

	switch(location) {
	case 'LLeft':
		ret.RMoTInit(Number.MIN_VALUE, ref.y1, ref.x1, ref.y2);
		break;
	case 'LRight':
		ret.RMoTInit(ref.x2, ref.y1, Number.MAX_VALUE, ref.y2);
		break;
	case 'LAbove':
		ret.RMoTInit(ref.x1, Number.MIN_VALUE, ref.x2, ref.y1);
		break;
	case 'LUnder':
		ret.RMoTInit(ref.x1, ref.y2, ref.x2, Number.MAX_VALUE);
		break;
	default:
		break;
	}

	return ret;
}

function /*Object*/ RMoTfindMatchingXpath(mainDoc, value) {
	if (typeof(document.evaluate)=='undefined') return null; // No support for IE
	
	var elt = null;
    var frames = mainDoc.querySelectorAll('iframe, frame');

    for (var i = 0; i < frames.length; i++) {
    	if (isFrameElement(frames[i])) {
    		elt = RMoTfindMatchingXpath(frames[i].contentWindow.document, value);
            if (elt != null) return elt;	
    	}
    }
	
	return mainDoc.evaluate(value, 
							mainDoc,
							null,
							XPathResult.FIRST_ORDERED_NODE_TYPE,
							null)
							.singleNodeValue;
}

function /*List<Object>*/ RMoTfindElement(uiobject) {
	if ( ! uiobject) return null;
	RMOT_GuidedHealing = false;
	var mainDoc = document;
	if(jsUtil.isDesktop()){
		mainDoc = jsUtil.getMainDocument();
	}
	
	// Select reachable objects
	var children = new Array();
	if ((mainDoc.shadowRoot != null) && (mainDoc.shadowRoot.hasChildNodes())) {
		for (var i0 = 0; i0 < mainDoc.shadowRoot.childNodes.length; i0++) {
			children.push(mainDoc.shadowRoot.childNodes[i0]);
		}
	}
	if (mainDoc.hasChildNodes()) {
		for (var i1 = 0; i1 < mainDoc.childNodes.length; i1++) {
			children.push(mainDoc.childNodes[i1]);
		}
	}
	var/*List<Object>*/ views = new Array();
	for (var i = 0; i < children.length; i++) {
		RMoTfindMachingObjectElementWithIdOnly(views, children[i], uiobject.type, (uiobject.identifier) ? uiobject.identifier : null);
	}
	
	// Custom Xpath, try to find a matching element
	if (views.length == 0 && uiobject.identifier && uiobject.identifier.name == WebGuiConstants.XPATH_PROP) {
		var elt = RMoTfindMatchingXpath(mainDoc, uiobject.identifier.parameter.value);
		if (elt != null) views.push(elt);
	}
	
	if (views.length > 0) {
		if (uiobject.locator != null && !RMoTisImageType(uiobject.identifier)) {
			var candidatesAfterFirstLocation = uiobject.secondaryLocator != null ? new Array() : null;
			var view = RMoTselect(uiobject.locator, views, candidatesAfterFirstLocation);
			if (view == null) {
				views = new Array();
			} else {
				if (uiobject.secondaryLocator != null && candidatesAfterFirstLocation.length > 0) {
					LoggerService.logMsg(RMoTTrace, '  --> appel RMoTselect(' + uiobject.secondaryLocator + ' ,' + candidatesAfterFirstLocation.length +')');
					view = RMoTselect(uiobject.secondaryLocator, candidatesAfterFirstLocation, null);
					if (view == null) {
						views = new Array();
					} else {
						views = new Array();
						views.push(view);
					}
				} else {
					views = new Array();
					views.push(view);
				}
			}
		}
	}
	return views;
}


/*
 * cf com.ibm.rational.test.lt.ui.moeb.views.elements.MoebElementInformationProvider
 */

function /*int*/ RMoTgetX(/*Object*/ elem) {
	var left = 0;
	if (elem != undefined && elem != null) {
		var proxy = domainManager.getProxy(elem);

		if (proxy != undefined && proxy != null) {
			left = parseInt(proxy.getProperty("left"));
		} else {
			var e = elem;
			while (e.offsetParent != undefined && e.offsetParent != null) {
				left += e.offsetLeft + (e.clientLeft != null ? e.clientLeft : 0);
				e = e.offsetParent;
			}
		}
		// Add the ownerDocument (potentially iframe element) left coordinate
		left += jsUtil.getOwnerDocumentCoordinates(elem).left;
	}
	return left;
}

function /*int*/ RMoTgetY(/*Object*/ elem) {
	var top = 0;
	if (elem != undefined && elem != null) {
		var proxy = domainManager.getProxy(elem);

		if (proxy != undefined && proxy != null) {
			top = parseInt(proxy.getProperty("top"));
		} else {
			var e = elem;
			while (e.offsetParent != undefined && e.offsetParent != null)	{
				top += e.offsetTop + (e.clientTop != null ? e.clientTop : 0);
				e = e.offsetParent;
			}
		}
		// Add the ownerDocument (potentially iframe element) top coordinate
		top += jsUtil.getOwnerDocumentCoordinates(elem).top;
	}
	return top;
}

function /*int*/ RMoTgetWidth(/*Object*/ elem) {
	var width = 0;
	if (elem != undefined && elem != null) {
		var proxy = domainManager.getProxy(elem);

		if (proxy != undefined && proxy != null) {
			width = parseInt(proxy.getProperty("right")) - parseInt(proxy.getProperty("left"));
		} else {
			width = (elem.offsetWidth) ? elem.offsetWidth : 0;
		}
	}
	return width;
}

function /*int*/ RMoTgetHeight(/*Object*/ elem) {
	var height = 0;
	if (elem != undefined && elem != null) {
		var proxy = domainManager.getProxy(elem);

		if (proxy != undefined && proxy != null) {
			height = parseInt(proxy.getProperty("bottom")) - parseInt(proxy.getProperty("top"));
		} else {
			height = (elem.offsetHeight) ? elem.offsetHeight : 0;
		}
	}
	return height;
}


function RMoTgetComputedStyle(element, prop) {
	var computedStyle = "";

	if (window.getComputedStyle) {
		var ret = jsUtil.getMainWindow().getComputedStyle(element);
		if (ret != null) {
			computedStyle = ret.getPropertyValue(prop);
		}
	}
	return computedStyle;
}

/* Returns the value of the property given by id of the given element */
function /*Object*/ RMoTgetIdentifiedByValue(/*Object*/ elem, /*DeviceId*/ id) {
	var ret = null;
	if (id && id.name) {
		ret = domainManager.getProxy(elem).getProperty(id.name);
	}
	return ret;
}

/* Returns whether the given type is compatible with the type of the given element */ 
function /*boolean*/ RMoTisCompatibleWith(/*Object*/ elem, /*String*/ type) {
	var proxyName = "html." + domainManager.getProxy(elem).getProxyName();
	if (proxyName == type) {
		return true;
	}
	return false;
}

function /*boolean*/ RMoTisImageType(identifyby) {
	return (identifyby !== undefined && identifyby.parameter.type === 'TImage');
}

/*
 The extraction of 'content' and 'label' have been modified in version 10.1.2 and then in version 10.2.
 The purpose of this method is to calculate the 'content' / 'label' as it was done at recording.
 This ensures that scripts recorded in a version <= 10.1.2 can be played back by the current version.
 NB: if the getProperty() method is redefined by a proxy this means that the content extraction has not changed
 and therefore the proxy is not concerned.
*/
function RMoTisElemOKWithDeprecatedId(elem, id, idTrim) {
	const getContentPropertyisRedefined = ['HtmlInput5Proxy', 'HtmlSelectProxy', 'HtmlMediaProxy', 'HtmlSubmitProxy', 'HtmlTextInputProxy'];
	const getLabelPropertyisRedefined = ['HtmlCheckBoxRadioProxy', 'HtmlInput5Proxy', 'HtmlSelectProxy', 'HtmlTextInputProxy'];
	const proxy = domainManager.getProxy(elem);

	const p = id.parameter;
	const op = id.operator;
	if (p.name === WebGuiConstants.CONTENT_PROP) {
		if (getContentPropertyisRedefined.indexOf(proxy.proxyClass) != -1) return false;

		if (jsUtil.applySimpleOperator(jsUtil.trimAndFormat(p.type, RMoTgetContent_1012(elem, id)), idTrim, op)
				|| jsUtil.applySimpleOperator(jsUtil.trimAndFormat(p.type, RMoTgetContent_102(elem, id)), idTrim, op))
			return true;
	}
	if (p.name === WebGuiConstants.LABEL_PROP) {
		if (getLabelPropertyisRedefined.indexOf(proxy.proxyClass) != -1) return false;

		if (jsUtil.applySimpleOperator(jsUtil.trimAndFormat(p.type, elem.placeholder), idTrim, op))
			return true;
	}
	return false;
}

/* Content property compatibility until 1012 */
function RMoTgetContent_1012(elem, id) {
	var textContent = elem.textContent;
	return jsUtil.trimAndFormat(id.parameter.type, (textContent) ? textContent.trim() : '');
}

/* Content property compatibility until 102 */
function RMoTgetContent_102(elem, id) {
	return jsUtil.getTrimText(elem);
}

// trace constants
if (typeof(RMoTFatal)=='undefined') {
	var RMoTFatal=0;
	var RMoTError=1;
	var RMoTWarning=2;
	var RMoTInfo=3;
	var RMoTDebug=4;
	var RMoTTrace=5;
}

// result of the dynamic finding is stored in this global variable
var foundObject;
var endOfResearch;
var nbAttempts;
var rmotRectangle;
var rmotTimeout;

function RMoTRepeatedfindElement(uiobject, reveal, period) {
	foundObject = null;
	rmotRectangle = null;
	nbAttempts++;
	var status = -1;

	var views = RMoTfindElement(uiobject);

	// if one and only one object found - means that everything is allright
	if (views && (views.length >= 1)) {
		foundObject = views[0];
		if (views.length == 1) {
			status = RMOT_SUCCESS;
			LoggerService.logMsg(RMoTDebug, "---> object " + domainManager.getProxy(foundObject).getProperty(WebGuiConstants.TAGNAME_PROP) + " found after " + nbAttempts + " attempt(s)");
		} else {
			status = RMOT_SUCCESS;
			LoggerService.logMsg(RMoTDebug, "---> " + views.length + " objects found after " + nbAttempts + " attempt(s)");
		}
		if (reveal == true) {
			rmotRectangle = new RMoTRectangle(foundObject);
		}
		LoggerService.logFinderStatus(status, nbAttempts, views.length);

		// if run out of the time
	} else if (((new Date()).getTime() > endOfResearch)) {
		status = RMOT_FAILURE;

		LoggerService.logMsg(RMoTDebug, "---> object NOT found after " + nbAttempts + " attempt(s)");
		LoggerService.logFinderStatus(status, nbAttempts, 0);
	} else {
		rmotTimeout = setTimeout(function(){ RMoTRepeatedfindElement(uiobject, reveal, period); }, period);
	}
}


function RMoTdynamicFinding(strObj, timeout, period, reveal) {
	LoggerService.logMsg(RMoTTrace, 'RMoTdynamicFinding ' + RMOT_VERSION + ' reveal=' + reveal + ' with ' + jsUtil.getVersions() + ' json string: '+ strObj);
	try {
		domainManager.init();
		endOfResearch = (new Date()).getTime() + timeout;
		var arg=eval('(' + strObj + ')');
		nbAttempts = 0;
		if (rmotTimeout != null) {
			// In case we have two concurrent dynamic findings, because we were looking for some web element while a native dialog was open
			// If a native dialog is open, the mobile web view is no longer running the javascript; the native code will timeout and go on with
			// further steps but this lost dynamic finding will actually start when the webview is focused again; hence the concurrency
			clearTimeout(rmotTimeout);
			rmotTimeout = null;
		}
		
		RMoTRepeatedfindElement(arg, reveal, period);

	} catch (e) {
		LoggerService.logStatus(RMOT_ERROR, e.message);
	}
}

/*
 *
 *	Licensed Materials - Property of IBM and/or HCL
 *
 *	IBM Rational Mobile Test
 *
 *	(C) Copyright IBM Corporation 2018, 2019. All Rights Reserved. 
 *  (C) Copyright HCL Technologies Ltd. 2018, 2019. All Rights Reserved. 
 *
 *	Note to U.S. Government Users Restricted Rights:  
 *	Use, duplication or disclosure restricted by GSA ADP
 *	Schedule Contract with IBM Corp. 
 *
 */

/**
 * select objects with a property compliant with the reference
 */
function RMoTselectCandidateswithSimilarIdentifier(candidates, identifier) {
	if (identifier != null) {
		for (var i = 0; i < candidates.length; i++) {
			var idTrim = jsUtil.trimAndFormat("TString", identifier.parameter.value);
			var valTrim = jsUtil.trimAndFormat(identifier.parameter.type, RMoTgetIdentifiedByValue(candidates[i].candidate, identifier));

			var score = 0;
			if (identifier.parameter.type == "TString") {
				score = jsUtil.computeStringSimilarity(idTrim, valTrim);
			} else if (identifier.operator == undefined) {
				score = ((idTrim != "") && (idTrim == valTrim)) ? 10 : 0;
			} else {
				score = jsUtil.applySimpleOperator(valTrim, idTrim, identifier.operator) ? 10 : 0;
			}

			candidates[i].score += score;
		}
	}
}


/**
 * select objects with a classname compliant with the reference
 */
function RMoTcomputeClassWeigth(candidates, className, minScore) {
	if (className != null) {
		for (var i = 0; i < candidates.length; i++) {
			var idTrim = jsUtil.trimAndFormat("TString", className);
			var valTrim = jsUtil.trimAndFormat("TString", domainManager.getProxy(candidates[i].candidate).getProperty("class"));
			if (candidates[i].score >= minScore)
				candidates[i].score += jsUtil.computeStringSimilarity(idTrim, valTrim);
		}
	}
}


/**
 * select objects with a xPath compliant with the reference
 */
function RMoTcomputeClassXPath(candidates, xpath, minScore) {
	if (xpath != null) {
		for (var i = 0; i < candidates.length; i++) {
			var idTrim = jsUtil.trimAndFormat("TString", xpath);
			var valTrim = jsUtil.trimAndFormat("TString", jsUtil.getXPath(candidates[i].candidate));
			if (candidates[i].score >= minScore)
				candidates[i].score += jsUtil.computeStringSimilarity(idTrim, valTrim);
		}
	}
}



/**
 * select objects with a type compliant with the reference
 */
function RMoTselectCandidateswithSimilarType(candidates, typename) {
	for (var i = 0; i < candidates.length; i++) {
		if (RMoTisCompatibleWith(candidates[i].candidate, typename)) {
			candidates[i].score += 10;
		}
	}
}


/**
 * compute the "position weight" of first candidates
 * the more an object is close to (x,y) the more the weight is high
 */
function RMoTcomputeLocationWeigth(candidates, x, y) {
	var MaxX = 500;
	var MaxY = 300;
	var MaxH = Math.sqrt((MaxX * MaxX) + (MaxY * MaxY));

	var refScore = candidates[0].score;
	for (var i = 0; refScore == candidates[i].score; i++) {
		var DeltaX = Math.abs(RMoTgetX(candidates[i].candidate) - x);
		var DeltaY = Math.abs(RMoTgetY(candidates[i].candidate) - y);

		var W = Math.sqrt((DeltaX * DeltaX) + (DeltaY * DeltaY));
		W = (W < MaxH) ? (10 - ((10 * W) / MaxH)) : 0;

		candidates[i].score += Math.round(W);
	}
}


/**
 * Select reachable objects not too far from the reference
 */
function RMoTselectReachableCandidates(candidates, elem, x, y) {
	var proxy = domainManager.getProxy(elem);

	if (elem.nodeType == window.Node.ELEMENT_NODE) {
		var visible = proxy.isVisible();
		if (!visible.visibility && visible.propagation || proxy.isWidgetChild) return;
		if (visible.reachable) {
			var record = {candidate: elem, score: 0};
			candidates.push(record);
		}
	}
	if (proxy.isContainer()) {
		if (isFrameElement(elem) && elem.contentDocument) { // 37668
			jsUtil.setOwnerDocumentCoordinates(elem);				
			elem = elem.contentDocument || elem.contentWindow.document;
		}

		// loop on children
		var children = new Array();
		if ((elem.shadowRoot != null) && (elem.shadowRoot.hasChildNodes())) {
			for (var i0 = 0; i0 < elem.shadowRoot.childNodes.length; i0++) {
				children.push(elem.shadowRoot.childNodes[i0]);
			}
		}
		if (elem.hasChildNodes()) {
			for (var i1 = 0; i1 < elem.childNodes.length; i1++) {
				children.push(elem.childNodes[i1]);
			}
		}
		for (var i = 0; i < children.length; i++) {
			RMoTselectReachableCandidates(candidates, children[i], x, y);
		}
	}
}


/**
 * DEBUG
 */
function RMoTTraceTab(candidates) {
	LoggerService.logMsg("--> RMoTTraceTab");
	candidates.sort(function (a, b) { return b.score - a.score; });
	var _CINQ = 6;
	var _rtwMAX = (candidates.length < _CINQ) ? candidates.length : _CINQ;
	for (var i = 0; i < _rtwMAX; i++) {
		var DeltaX = Math.abs(RMoTgetX(candidates[i].candidate));
		var DeltaY = Math.abs(RMoTgetY(candidates[i].candidate));
		LoggerService.logMsg("    " + i + " tagname = html." + domainManager.getProxy(candidates[i].candidate).getProxyName() + " x = " + DeltaX + ", y = " + DeltaY + ", score = " + candidates[i].score);
	}
}

/**
 * Seek for an object similar to an "uiobject" with the properties "elemProps"
 */
function RMoTfindSimilarElement(uiobject, elemProps) {
	RMOT_GuidedHealing = true;
	var ret = new Array();
	var candidates = new Array();

	if (typeof uiobject !== 'undefined') {

		try {
			var mainDoc = (jsUtil.isDesktop()) ? jsUtil.getMainDocument() : document;

			// Select reachable objects
			var children = new Array();
			if ((mainDoc.shadowRoot != null) && (mainDoc.shadowRoot.hasChildNodes())) {
				for (var i0 = 0; i0 < mainDoc.shadowRoot.childNodes.length; i0++) {
					children.push(mainDoc.shadowRoot.childNodes[i0]);
				}
			}
			if (mainDoc.hasChildNodes()) {
				for (var i1 = 0; i1 < mainDoc.childNodes.length; i1++) {
					children.push(mainDoc.childNodes[i1]);
				}
			}
			for (var i = 0; i < children.length; i++) {
				RMoTselectReachableCandidates(candidates, children[i]);
			}

			// compute score according tag, class, xpath and identifyBy
			RMoTselectCandidateswithSimilarType(candidates, uiobject.type);
			RMoTselectCandidateswithSimilarIdentifier(candidates, uiobject.identifier);

			// at least MANDATORY_SCORE is required
			var MANDATORY_SCORE = 9;

			if (typeof elemProps != 'undefined') {
				RMoTcomputeClassWeigth(candidates, elemProps.class, MANDATORY_SCORE);
				RMoTcomputeClassXPath(candidates, elemProps.xpathProp, MANDATORY_SCORE);
			}

			// sort candidates depending on the score
			candidates.sort(function (a, b) { return b.score - a.score; });

			// compute a weight depending on the position only if there are several candidates with the same weight
			if ((typeof elemProps != 'undefined') && (candidates.length > 1) && (candidates[0].score > MANDATORY_SCORE) && (candidates[0].score == candidates[1].score)) {
				RMoTcomputeLocationWeigth(candidates, elemProps.Geometry.x, elemProps.Geometry.y);
				// sort again
				candidates.sort(function (a, b) { return b.score - a.score; });
			}

			// push best candidates into the result tab
			if ((candidates.length > 0) && (candidates[0].score > MANDATORY_SCORE)) {
				var winner = candidates[0].score;
				for (var i = 0; i < candidates.length; i++) {
					if (candidates[i].score == winner) {
						ret.push(candidates[i].candidate);
					}
				}
			}

		} catch(err) {
			LoggerService.logMsg("RMoTfindSimilarElement() raised " + err);			
		}
	}

	if (candidates.length > 0)
		LoggerService.logMsg("RMoTfindSimilarElement() found " + ret.length + " candidate with a score of " + candidates[0].score);
	else
		LoggerService.logMsg("RMoTfindSimilarElement() found 0 candidate");

	return ret;
}
/*
 *
 *	Licensed Materials - Property of IBM
 *
 *	IBM Rational Mobile Test
 *
 *	(C) Copyright IBM Corporation 2014. All Rights Reserved. 
 *
 *	Note to U.S. Government Users Restricted Rights:  
 *	Use, duplication or disclosure restricted by GSA ADP
 *	Schedule Contract with IBM Corp. 
 *
 */

/* ------------------------------------ */
/*  V E R I F I C A T I O N   P O I N T */
/* ------------------------------------ */

var LoggerService = {

		logFinderStatus: function(status, nbAttempts, nbObjs) {
			var jsonObj = new Object();
			jsonObj.action = "RMoTexecuteWebAction";
			jsonObj.status = status;
			jsonObj.nbAttempts = nbAttempts;
			jsonObj.nbObjs = nbObjs;
			prompt("RMOTPLAYBACK " + jsUtil.stringify(jsonObj), "");
		},

		logStatus: function(status, msg) {
			var jsonObj = new Object();
			jsonObj.action = "RMoTlogStatus";
			jsonObj.status = status;
			jsonObj.msg = msg;
			prompt("RMOTPLAYBACK " + jsUtil.stringify(jsonObj), "");
		},

		/* level in { Fatal=0, Error=1, Warning=2, Info=3, Debug=4, Trace=5 } */
		logMsg: function(level, str) {
			var jsonObj = new Object();
			jsonObj.action = "RMoTlog";
			jsonObj.level = level;
			jsonObj.msg = str;
			prompt("RMOTPLAYBACK " + jsUtil.stringify(jsonObj), "");
		},		
		logE2EMsg: function(url , startTimeStamp, endTimeStamp){
			var jsonObj = new Object();
			jsonObj.action = "RMoTE2ELog";
			jsonObj.url = url;
			jsonObj.starttimestamp = startTimeStamp;
			jsonObj.stoptimestamp = endTimeStamp;
			prompt("RMOTPLAYBACK " + jsUtil.stringify(jsonObj), "");
		}
}

function RMoTexecuteSimpleVP(vp) {
	var ret = { status: false, msg: "" };

	var vpVal = jsUtil.trimAndFormat("TString", vp.parameter.value);
	var foundVal = RMoTgetIdentifiedByValue(foundObject, vp.parameter);
	var val = jsUtil.trimAndFormat(vp.parameter.type, foundVal);
	ret.status = jsUtil.applySimpleOperator(val, vpVal, vp.operator);

	// if the property belongs to an array we could have to remove a "px" suffix
	if ((ret.status == false) && (vp.parameter.type == 'TString')) {
		val = jsUtil.trimAndFormat('TFloat', foundVal);
		if (jsUtil.applySimpleOperator(val, vpVal, vp.operator)) {
			ret.status = true;
		}
		
		// Custom Xpath, try to find a matching element
		if (vp.parameter.name == WebGuiConstants.XPATH_PROP) {
			var mainDoc = (jsUtil.isDesktop()) ? jsUtil.getMainDocument() : document;
			if (RMoTfindMatchingXpath(mainDoc, vp.parameter.value) != null) {
				ret.status = true;
			}
		}
	}

	if (!ret.status) {
		ret.status = RMoTisElemOKWithDeprecatedId(foundObject, vp, vpVal);
	}
	
	var name = (vp.parameter.name == WebGuiConstants.XPATH_PROP) ? vp.parameter.name.replace("Prop", "" ) : vp.parameter.name;
	ret.msg = "[" + name + ": " + val + "]";
	
	return ret;
}


function RMoTexecuteLogicalVP(vp) {
	var ret = { status: true, msg: "" };

	var sz = vp.operands.length;
	var res = new Array;
	for (var i = 0; i < sz; i++) {
		var vpRes = RMoTexecuteVPOnce(vp.operands[i]);
		res.push(vpRes.status);
		ret.msg += vpRes.msg + " ";
	}

	var op = vp.operator;

	switch (op) {
	case 'TAnd':
		ret.status = res[0];
		for (var i = 1; i < res.length; i++) {
			ret.status = ret.status && res[i];
		}
		break;
	case 'TOr':
		ret.status = res[0];
		for (var i = 1; i < res.length; i++) {
			ret.status = ret.status || res[i];
		}
		break;
	case 'TNot':
		ret.status = ( ! res[0]);
		break;
	case 'TNone':
		// TODO: Should be removed: this one cannot be selected from the test editor
		ret.status = true;
		for (var i = 0; i < res.length; i++) {
			if (res[i] == true) {
				ret.status = false;
			}
		}
		break;
	case 'TXor':  // exactly one
		ret.status = false;
		nbFailure = 0;
		for (var i = 0; i < res.length; i++) {
			if (res[i] == false) {
				nbFailure++;
			}
		}
		if (nbFailure == res.length-1) {
			ret.status = true;
		}
		break;
	default:
		break;
	}

	return ret;
}

var rmotVPTimeout;
function RMoTexecuteVP(expression, timeout, period) {
	LoggerService.logMsg(RMoTTrace, 'RMoTexecuteVP('+ expression +')');
	if (typeof(timeout) == 'undefined') timeout = 5000;
	if (typeof(period) == 'undefined') period = 500;
	try {
		if (rmotRectangle != null)
			rmotRectangle.removeRectangle();
		var vpStatus;
		if (foundObject != null) {

			var endOfVerification = (new Date()).getTime() + timeout - period;
			
			if (rmotVPTimeout != null) {
				clearTimeout(rmotVPTimeout);
				rmotVPTimeout = null;
			}
			
			RMoTRetryExecuteVP(expression, endOfVerification, period);
		}

	} catch (e) {
		LoggerService.logStatus(RMOT_ERROR, e.message);
	}
}

function RMoTRetryExecuteVP (expression, endOfVerification, period) {
	var devExpr = eval('(' + expression + ')'); /* expression contains a JSON of a DeviceExpression */
	var vpStatus = RMoTexecuteVPOnce(devExpr);
	if (vpStatus) {
		if (vpStatus.status) {
			LoggerService.logStatus(RMOT_SUCCESS, vpStatus.msg);
		}
		else if (((new Date()).getTime() > endOfVerification)) {
			LoggerService.logStatus(RMOT_FAILURE, vpStatus.msg);
		} else {
			rmotVPTimeout = setTimeout(function(){ RMoTRetryExecuteVP(expression, endOfVerification, period); }, period);
		}
	}
}

function RMoTexecuteVPOnce(devExpr) {
	var vpStatus;
	try {
		if (devExpr.declaredClass == "com.ibm.rational.test.lt.core.moeb.model.transfer.testscript.DeviceSimpleExpression") {
			vpStatus = RMoTexecuteSimpleVP(devExpr);
		} else if (devExpr.declaredClass == "com.ibm.rational.test.lt.core.moeb.model.transfer.testscript.DeviceLogicalExpression") {
			vpStatus = RMoTexecuteLogicalVP(devExpr);
		}
	} catch (e) {
		LoggerService.logStatus(RMOT_ERROR, e.message);
	}
	return vpStatus;
}

/* --------------------------------------- */
/*  V A R I A B L E    A S S I G N M E N T */
/* --------------------------------------- */

function RMoTexecuteVarAssignment(property) {
	LoggerService.logMsg(RMoTTrace, 'RMoTexecuteVarAssignment('+ property +')');
	try {
		if (rmotRectangle != null)
			rmotRectangle.removeRectangle();
		var retStatus = RMOT_FAILURE;
		var val;
		if (foundObject && property) {
			val = domainManager.getProxy(foundObject).getProperty(property);
			if (val != null)
				retStatus = RMOT_SUCCESS;
		}

		LoggerService.logStatus(retStatus, val);

	} catch (e) {
		LoggerService.logStatus(RMOT_ERROR, e.message);
	}
}

/* ---------------------------------- */
/* E2E Listeners                      */
/* -----------------------------------*/

function collectPageLoadTiming(){
	if(window){
        if(window.performance){
             var perfData = window.performance.timing;
             var pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
             LoggerService.logE2EMsg("E2E Page Load" , perfData.navigationStart, perfData.loadEventEnd);
             // Resource Timing - looks like it is not yet supported on 4.x, tried on 4.3, could be added later
            /* var resEntries = window.performance.getEntriesByType("resource");
             var i=0;
             for(i=0;i<resEntries.length;i++){
            	 var r0 = resEntries[i];
            	 //var resLoadtime = r0.duration;
                 var resTime = r0.responseEnd - r0.requestStart;
                 var resName = r0.name;
                 LoggerService.logMsg(RMoTTrace, 'Resource name : ' + resName + ' :::: load time is  : ' + resTime);
             }*/             
        } else{
             LoggerService.logMsg(RMoTTrace, 'window.performance not supported : ' + window.performance);
        }
     } else{
           LoggerService.logMsg(RMoTTrace, 'In RMoTexecuteAction : window = null');
     }
}

// Temp fix for 54305 until mPerf E2E is fully implemented on iOS
var RMoTIOS = navigator.userAgent.indexOf('iPhone; ') >= 0 || navigator.userAgent.indexOf('iPad; ') >= 0;
if (!RMoTIOS && typeof e2eAjaxListener === 'undefined' && !jsUtil.isDesktop()) {
    e2eAjaxListener = new Object();
    if((e2eAjaxListener.tempOpen == null) || (e2eAjaxListener.tempOpen.toString().indexOf("e2eAjaxListener") < 0)){
           e2eAjaxListener.tempOpen = window.XMLHttpRequest.prototype.open;
           window.XMLHttpRequest.prototype.open = function(a,b) {
                    if (!a) var a='';
                    if (!b) var b='';
                    LoggerService.logMsg(RMoTTrace, 'XMLHttpRequest.prototype.open ('+ a + ',' + b +')');                  
                    e2eAjaxListener.method = a ; 
                    e2eAjaxListener.url = b; 
                    var startTime = (new Date()).getTime();
                    //fill the send information for E2E log in the xmlhttprequest to be used for logging when response is received
                    this.e2eReqURL = b;
                    this.e2eStartTime = startTime;
                    if(e2eAjaxListener.tempOpen){
                          e2eAjaxListener.tempOpen.apply(this, arguments);
                    }
           }
    }
    if((e2eAjaxListener.tempSend == null) || (e2eAjaxListener.tempSend.toString().indexOf("e2eAjaxListener") < 0)){
           e2eAjaxListener.tempSend = window.XMLHttpRequest.prototype.send;
           window.XMLHttpRequest.prototype.send = function() {
               // Wrap onreadystaechange callback
               var callback = this.onreadystatechange;
               this.onreadystatechange = function() {            
                    if (this.readyState == 4) {
                           var endTime = (new Date()).getTime();
                           LoggerService.logE2EMsg(this.e2eReqURL , this.e2eStartTime, endTime);
                    }
                    if (callback) callback.apply(this, arguments);
               }
               if(e2eAjaxListener.tempSend){
                  e2eAjaxListener.tempSend.apply(this, arguments);
               }
           }
    }      
    // e2eAjaxListener.callback = function () {
      // this.method :the ajax method used
      // this.url    :the url of the requested script (including query string, if any) (urlencoded)
      // this.data   :the data sent, if any ex: foo=bar&a=b (urlencoded)  
    //}     
}

window.print = function() {}; // 59114

/* ------------------------------------ */
/*   P E R F O R M      A C T I O N S   */
/* ------------------------------------ */

function __RMoTexecuteAction(strAction) {
	LoggerService.logMsg(RMoTTrace, 'RMoTexecuteAction('+ strAction +')');
	try {
		var retStatus;
		var action = eval('(' + strAction + ')');
		if (foundObject == null) {
			LoggerService.logMsg(RMoTTrace, 'RMoTexecuteAction() with foundObject == null');
			retStatus = RMOT_FAILURE;
		} else {
			retStatus = domainManager.getProxy(foundObject).executeAction(action);
		}
		var retMsg = (action && action.type) ? action.type : "";
		if (typeof action.message !== 'undefined') retMsg = action.message;
		LoggerService.logStatus(retStatus, retMsg);
	} catch (e) {
		LoggerService.logMsg(RMoTTrace, 'RMoTexecuteAction() caught ' + e.message);
		LoggerService.logStatus(RMOT_ERROR, e.message);
	}
}

function RMoTexecuteAction(strAction) {
	if((typeof populateE2ELogData !== 'undefined') && populateE2ELogData){
		collectPageLoadTiming();
	}
	if (rmotRectangle != null) rmotRectangle.removeRectangle();
	setTimeout(__RMoTexecuteAction(strAction), 0);  // Could appear strange, please see defect 43908
}
var BROWSER_ZOOM_FACT = 1;
var RMoTFrameOffsetLeft = 0;
var RMoTFrameOffsetTop = 0;