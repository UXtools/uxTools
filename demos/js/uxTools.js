// Create closure.
(function( $ ) {
	
    // Plugin Definition.
    $.fn.uxTools = function( options ) {
		
		var opts = $.extend( {}, $.fn.uxTools.defaults, options );
		
		var uxTools = this;
		
		// Public Function Definition Strart
		uxTools.clear = $.fn.uxTools.clear;
		uxTools.play = $.fn.uxTools.play;
		uxTools.start = $.fn.uxTools.start;
		uxTools.stop = $.fn.uxTools.stop;
		uxTools.pause = $.fn.uxTools.pause;
		uxTools.reset = $.fn.uxTools.reset;
		uxTools.getStatus = $.fn.uxTools.getStatus;
		uxTools.output = $.fn.uxTools.output;
		uxTools.input = $.fn.uxTools.input;
		// Public Function Definition End
		
		
		// Set the Recrod Area Div Start
		// Consider the Selector is "DIV"
		if ( this.selector.search("#") === -1 ) {
			$.fn.uxTools.$div = $(this).not($("div").find("div"));
		// Consider the Selector is "#ID"
		} else {
			$.fn.uxTools.$div = $(this);
		}
		
		$.fn.uxTools.$div = $.fn.uxTools.$div.filter("div");
		
		if ( $.fn.uxTools.$div.length === 0 ) {
			throw "$.fn.uxTools.$div.length === 0";
		}
		// Set the Recrod Area Div End
		
		// Iterate Each Matched Element
		return this.each(function() {
			if ( this.tagName != "DIV" ) {
				return;
			}
			var div = this;
			var $div = $( this );

			if ( $.fn.uxTools.defaults.enableMouseRecord ) {
				assignDivId();
				$div.mousemove(function( event ) {
					if ( $.fn.uxTools.state === $.fn.uxTools.stateEnum.start ) {
						mouseRecord( event );
					}
				});
			}
			
			var formElementTagName = $.fn.uxTools.defaults.formElementTagName;
			
			if ( $.fn.uxTools.defaults.enableFormRecord ) {
				assignFormElementId();
				var elemList = $.fn.uxTools.initElemList;
				var $formTag = $div.find( formElementTagName );
				$formTag.each(function(){
					var _elem = this;
					if ( elemList.length === 0 ) {
						elemList[ 0 ] = wrapFormElement(_elem);
					} else {
						elemList[ elemList.length ] = wrapFormElement(_elem);
					}
				});
				
				$formTag.change(function( event ) {
					if ( $.fn.uxTools.state === $.fn.uxTools.stateEnum.start ) {
						formRecord( event );
					}
				});
				
				$formTag.keydown(function( event ) {
					if ( $.fn.uxTools.state === $.fn.uxTools.stateEnum.start ) {
						formRecord( event );
					}
					// print ( JSON.stringify( $.fn.uxTools.mouseDataList ) );
					print( JSON.stringify( $.fn.uxTools.formDataList ) );
				});				
			}
			
		});
    };
    
	// Plugin Defaults
	$.fn.uxTools.defaults = {
		period: 50,
		rSquareThreshold: 100,
		debug: false,
		enableMouseRecord: true,
		enableFormRecord: true,
		formElementTagName: " input , select , textarea "
	};
	
	$.fn.uxTools.$div;
	
	// Mouse Data Setting Start
	$.fn.uxTools.mouseDataList = [];
	$.fn.uxTools.drawMap = {};
	// Mouse Data Setting End
	
	// Form Data Setting Start
	$.fn.uxTools.formDataList = [];
	$.fn.uxTools.initElemList = [];
	// Form Data Setting End
	
	// Time Setting Start
	$.fn.uxTools.startTime = NaN;
	$.fn.uxTools.pauseTime = NaN;
	$.fn.uxTools.pausePeriodTime = 0;
	// Time Setting End
	
	// Status Setting Start
	$.fn.uxTools.stateEnum = {
		pause 	: 0,
		start 	: 1,
		stop 	: 2,
		play 	: 3
	};
	$.fn.uxTools.state = $.fn.uxTools.stateEnum.pause;
	$.fn.uxTools.timeoutAction = [];
	// Status Setting End
	
	// Public Function Definition Start
	$.fn.uxTools.start = function() {
		if ( $.fn.uxTools.state === $.fn.uxTools.stateEnum.start ) {
			return;
		}
		if ( isNaN( $.fn.uxTools.startTime ) ) {
			$.fn.uxTools.startTime = getAbsoluteTime();
		}
		if ( $.fn.uxTools.state === $.fn.uxTools.stateEnum.pause && !isNaN( $.fn.uxTools.pauseTime ) ) {
			$.fn.uxTools.pausePeriodTime += getAbsoluteTime() - $.fn.uxTools.pauseTime;
		}
		$.fn.uxTools.hideMouseSvg();
		$.fn.uxTools.state = $.fn.uxTools.stateEnum.start;
	};
	
	$.fn.uxTools.stop = function() {
		if ( $.fn.uxTools.state === $.fn.uxTools.stateEnum.stop ) {
			return;
		}
		clearTimeoutAction();
		$.fn.uxTools.clear();
		$.fn.uxTools.hideMouseSvg();
		$.fn.uxTools.state = $.fn.uxTools.stateEnum.stop;
	};

	$.fn.uxTools.pause = function() {
		if ( $.fn.uxTools.state === $.fn.uxTools.stateEnum.pause ) {
			return;
		}
		$.fn.uxTools.hideMouseSvg();
		$.fn.uxTools.state = $.fn.uxTools.stateEnum.pause;
		$.fn.uxTools.pauseTime = getAbsoluteTime();
	};
	
	$.fn.uxTools.reset = function() {
		$.fn.uxTools.clear();
		resetTimeSetting();
		resetDataSetting();
		resetInitForm();
		$.fn.uxTools.hideMouseSvg();
		$.fn.uxTools.state = $.fn.uxTools.stateEnum.pause;
	};
	
	$.fn.uxTools.clear = function() {
		var drawMap = $.fn.uxTools.drawMap;
		for ( var key in drawMap ) { 
			var draw = drawMap[key];
			draw.clear();
		}
	};
	
	$.fn.uxTools.getStatus = function() {
		return $.fn.uxTools.state;
	};
	
	$.fn.uxTools.play = function() {
		$.fn.uxTools.state = $.fn.uxTools.stateEnum.play;
		$.fn.uxTools.showMouseSvg();
		clearTimeoutAction();
		$.fn.uxTools.display();
	};
	
	$.fn.uxTools.display = function() {
		if ( $.fn.uxTools.defaults.enableMouseRecord ) {
			$.fn.uxTools.clear();
			setSvg ( $.fn.uxTools.$div );
			var drawMap = $.fn.uxTools.drawMap;
			var dataList = $.fn.uxTools.mouseDataList;
			for ( var i = 0 ; i < dataList.length - 1 ; i++ ) {
				var data1 = dataList[i];
				var data2 = dataList[i+1];
				if ( data1.currentTarget.id !== data2.currentTarget.id ) {
					continue;
				}
				var draw = drawMap[data1.currentTarget.id];
				draw.path()
					.M(data1.relationX, data1.relationY)
					.L(data2.relationX, data2.relationY)
					.Z()
					.drawAnimated({
						duration: data2.time - data1.time, 
						easing: '=',
						delay: data1.time
					});
					
				if ( dataList.length - 1 === i ) {
					var timeoutAction = $.fn.uxTools.timeoutAction;
					timeoutAction[timeoutAction.length] = setTimeout(function(){
						$.fn.uxTools.pause();
					}, data1.time);
				}
			}
		}
		
		if ( $.fn.uxTools.defaults.enableFormRecord ) {
			resetInitForm();
			var dataList = $.fn.uxTools.formDataList;
			for ( var i = 0 ; i < dataList.length ; i++ ) {
				var data = dataList[i];
				var formElementList = data.formElementList;
				formAction(formElementList, data.time);
			}
		}
	};
	
	$.fn.uxTools.showMouseSvg = function() {
		$.fn.uxTools.$div.find( "svg" ).show();
	};
	
	$.fn.uxTools.hideMouseSvg = function() {
		$.fn.uxTools.$div.find( "svg" ).hide();
	};
	
	$.fn.uxTools.getAlreadyRecordTime = function() {
		return getRelativeTime();
	};
	
	$.fn.uxTools.isStart = function() {
		return $.fn.uxTools.state === $.fn.uxTools.stateEnum.start;
	};
	
	$.fn.uxTools.isPause = function() {
		return $.fn.uxTools.state === $.fn.uxTools.stateEnum.pause;
	};
	
	$.fn.uxTools.isStop = function() {
		return $.fn.uxTools.state === $.fn.uxTools.stateEnum.stop;
	};
	
	$.fn.uxTools.output = function() {
		var obj = {};
		obj.mouseDataList = $.fn.uxTools.mouseDataList;
		obj.formDataList = $.fn.uxTools.formDataList;
		return JSON.stringify( obj );
	};
	
	$.fn.uxTools.input = function() {
		return $.fn.uxTools.state === $.fn.uxTools.stateEnum.stop;
	};
	// Public Function Definition End
	
	function formAction(formElementList, delay){
		var timeoutAction = $.fn.uxTools.timeoutAction;
		timeoutAction[timeoutAction.length] = setTimeout(function(){
			for ( var j = 0 ; j < formElementList.length ; j++ ) {
				var formElement = formElementList[j];
				var elem = document.getElementById(formElement.id);
				elem.innerHTML = formElement.html;
				elem.value = formElement.val;
				elem.display = formElement.display;
				if ( "CHECKBOX" === elem.type.toUpperCase() || "RADIO" === elem.type.toUpperCase() ) {
					elem.checked = formElement.checked;
					$( elem ).prop( "checked", elem.checked ).checkboxradio( "refresh" );
				}
			}
		}, delay);
	}
	
	function clearTimeoutAction(){
		var timeoutAction = $.fn.uxTools.timeoutAction;
		for ( var i = 0 ; i < timeoutAction.length ; i++ ) {
			clearTimeout(timeoutAction[i]);
		}
	}
	
	function resetInitForm(){
		formAction($.fn.uxTools.initElemList, 0);
	}
	
	function resetTimeSetting(){
		$.fn.uxTools.startTime = NaN;
		$.fn.uxTools.pauseTime = NaN;
		$.fn.uxTools.pausePeriodTime = 0;
	}
	
	function resetDataSetting(){
		$.fn.uxTools.mouseDataList = [];
		$.fn.uxTools.formDataList = [];
	}
	
	function assignDivId(){
		$.fn.uxTools.$div.each(function(index, elem){
			if ( this.id == "" ) {
				this.id = "UXToolsDiv" + ( 1000 + index );
				print(this.id);
			}
		});
	}
	
	function assignFormElementId(){
		var formElementTagName = $.fn.uxTools.defaults.formElementTagName;
		var $div = $.fn.uxTools.$div;
		var $formTag = $div.find( formElementTagName );
		
		$formTag.each(function(index, elem){
			if ( this.id == "" ) {
				this.id = "UXToolsFormElement" + ( 1000 + index );
				print(this.id);
			}
		});
	}
	
	function setSvg ( $div ){
		$div.each(function(index, ele){
			if ( this.id == "" ) {
				this.id = "UXToolsDiv" + ( 1000 + index );
			}
			console(this);
			var drawMap = $.fn.uxTools.drawMap;
			if ( !( this.id in $.fn.uxTools.drawMap ) ) {
				drawMap[ this.id ] = SVG( this.id ).size( "100%" , "100%" );
			}
			var $this = $( this );
			setSvgLayout(this, 9999);
		});
	}
	
	function setSvgLayout(div, zIndex){
		$(div).find( "svg" )
			.css( "position" , "absolute" )
			.css( "top" , $(div).offset().top )
			.css( "left" , $(div).offset().left )
			.css( "height", $(div).css("height") )
			.css( "width", $(div).css("width") )
			.css( "z-index", zIndex );
	}
	
	function print(str) {
		str = ( str + $("#debugInfo").val() ).substr(0, 1000);
		$("#debugInfo").val( str );
	}
	
	function printClear(){
		$("#debugInfo").val("");
	}
	
    function console( text ) {
        if ( window.console && window.console.log ) {
            window.console.log( text );
        }
    };
	
	function plotDot ( data ) {
		var draw = $.fn.uxTools.drawMap[data.currentTarget.id];
		var r = Math.log( data.momentum ) * 2;
		var circle = draw.circle( r );
		var x = data.relationX - r / 2;
		var y = data.relationY - r / 2;
		circle.move( x , y );
		data.svgTimeDot = circle;
	}

	function MouseData(){
		this.x;
		this.y;
		this.time;
		this.relationX;
		this.relationY;
		this.currentTarget;
	}
	
	function FormData(){
		this.formElementList = [];
		this.time;
	}
	
	function FormElement(){
		this.id;
		this.html;
		this.val;
		this.display;
		this.checked;
	}
	
	function wrapFormElement(elem){
		var formElement = new FormElement();
		formElement.id = elem.id;
		formElement.html = elem.innerHTML;
		formElement.val = elem.value;
		formElement.display = elem.display;
		formElement.checked = elem.checked;
		return formElement;
	}
	
	function getMouseLastRecordTime(){
		var dataList = $.fn.uxTools.mouseDataList;
		return dataList[dataList.length-1].time;
	}
	
	function isMouseReady2Record( event ){
		var period = $.fn.uxTools.defaults.period;
		var rSquareThreshold = $.fn.uxTools.defaults.rSquareThreshold;
		return ( getRelativeTime() - getMouseLastRecordTime() > period ) || ( getMouseRSquare( event ) > rSquareThreshold );
	}
	
	function isMouseTouchDivBoundary( event ){
		var dataList = $.fn.uxTools.mouseDataList;
		var data = dataList[ dataList.length - 1 ];
		return event.currentTarget !== data.currentTarget;
	}

	function getRelativeTime(){
		return getAbsoluteTime() - $.fn.uxTools.startTime - $.fn.uxTools.pausePeriodTime;
	}
	
	function getAbsoluteTime(){
		var now = new Date();
		return now.getMilliseconds() + now.getSeconds() * 1000 + now.getMinutes() * 60 * 1000 + now.getHours() * 60 * 60 * 1000;
	}
	
	function getMouseRSquare(){
		var args = arguments;
		var data1;
		var data2;
		if ( args.length === 0 ) {
			var dataList = $.fn.uxTools.mouseDataList;
			data1 = dataList[ dataList.length - 1 ];
			data2 = dataList[ dataList.length - 2 ];
		} else if ( args.length === 2 ) {
			data1 = args[0];
			data2 = args[1];
		} else if ( args.length === 1 ) {
			var event = args[0];
			var dataList = $.fn.uxTools.mouseDataList;
			data1 = dataList[ dataList.length - 1 ];
			data2 = event2MouseData(event);
		}
		var x1 = data1.x;
		var x2 = data2.x;
		var y1 = data1.y;
		var y2 = data2.y;
		return Math.pow( ( x1 - x2 ) , 2 ) + Math.pow( ( y1 - y2 ) , 2 );
	}
	
	function event2MouseData( event ){
		var data = new MouseData();
		data.x = Math.round( event.pageX );
		data.y = Math.round( event.pageY );
		data.time = getRelativeTime();
		if ( data.time < 0 ) {
			console(data);
			throw "data.time < 0";
		}
		data.currentTarget = event.currentTarget;
		data.relationX = data.x - data.currentTarget.offsetLeft;
		data.relationY = data.y- data.currentTarget.offsetTop;
		return data;
	}
	
	function event2FormData( event ){
		var data = new FormData();
		data.time = getRelativeTime();
		data.formElementList = [];
		var initElemList = $.fn.uxTools.initElemList;
		for ( var i = 0 ; i < initElemList.length ; i++ ) {
			var elem = document.getElementById( initElemList[i].id );
			data.formElementList[ i ] = wrapFormElement(elem);
		}
		return data;
	}
	
	function getMouseR(){
		var args = arguments;
		var data1;
		var data2;
		if ( args.length === 0 ) {
			var dataList = $.fn.uxTools.mouseDataList;
			data1 = dataList[ dataList.length - 1 ];
			data2 = dataList[ dataList.length - 2 ];
		} else if ( args.length === 2 ) {
			data1 = args[ 0 ];
			data2 = args[ 1 ];
		}
		return Math.pow( getMouseRSquare( data1 , data2 ) , 0.5 );
	}
	
	function getMouseTimePeriod(){
		var args = arguments;
		var data1;
		var data2;
		if ( args.length === 0 ) {
			var dataList = $.fn.uxTools.mouseDataList;
			data1 = dataList[ dataList.length - 1 ];
			data2 = dataList[ dataList.length - 2 ];
		} else if ( args.length === 2 ) {
			data1 = args[ 0 ];
			data2 = args[ 1 ];
		}
		var time1 = data1.time;
		var time2 = data2.time;
		return Math.abs( time1 - time2 );
	}
	
	function getMouseMomentum(){
		var args = arguments;
		var data1;
		var data2;
		if ( args.length === 0 ) {
			var dataList = $.fn.uxTools.mouseDataList;
			data1 = dataList[ dataList.length - 1 ];
			data2 = dataList[ dataList.length - 2 ];
		} else if ( args.length === 2 ) {
			data1 = args[ 0 ];
			data2 = args[ 1 ];
		}
		return getMouseRSquare( data1 , data2 ) / getMouseTimePeriod( data1, data2 );
	}
	
	function getMouseSpeed(){
		var args = arguments;
		var data1;
		var data2;
		if ( args.length === 0 ) {
			var dataList = $.fn.uxTools.mouseDataList;
			data1 = dataList[ dataList.length - 1 ];
			data2 = dataList[ dataList.length - 2 ];
		} else if ( args.length === 2 ) {
			data1 = args[ 0 ];
			data2 = args[ 1 ];
		}
		return getMouseR( data1 , data2 ) / getMouseTimePeriod( data1 , data2 );
	}
	
	function mouseRecord( event ){
		var period = $.fn.uxTools.defaults.period;
		var dataList = $.fn.uxTools.mouseDataList;
		if ( dataList.length === 0 || isMouseReady2Record( event ) || isMouseTouchDivBoundary( event ) ) {
			dataList[ dataList.length ] = event2MouseData( event );
		}
		if ( dataList.length >= 2 ) {
			dataList[ dataList.length-1 ].speed = getMouseSpeed();
			dataList[ dataList.length-1 ].momentum = getMouseMomentum();
		}
	}
	
	function formRecord( event ){
		var dataList = $.fn.uxTools.formDataList;
		dataList[ dataList.length ] = event2FormData( event );
	}

})( jQuery );