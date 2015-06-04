(function _slider(){

    if( ! Function.prototype.bind)
    {
        console.warn('Slider wont work without Function.prototype.bind. consider using a polyfill.');
    }

    'use strict';

    var Slider = (function(){

        // private
        function getKnobBarObject(el){
            var dimensions = {
                width: el.clientWidth,
                height: el.clientHeight
            };

            var knobs = [].slice.call(el.querySelectorAll('[role=slider]'));
            var knobsObjects = knobs.map(getKnobObject);

            var isVertical = dimensions.height > dimensions.width;
            var isRange = knobs.length === 2;

            return {
                el: el,
                isRange: isRange,
                isVertical: isVertical,
                isDragging: false,
                maxValue: dimensions[isVertical ? 'height':'width'],
                offset: {
                    left: el.offsetLeft,
                    top: el.offsetTop
                },
                bounds: {
                    top: 0,
                    left: 0,
                    bottom: el.offsetHeight,
                    right: el.offsetWidth
                },
                knobs: knobsObjects
            };
        }

        function getPosMapping(isVertical){
            return {
                left: isVertical ? 'top':'left',
                right: isVertical ? 'bottom':'right',
                clientX: isVertical ? 'clientY':'clientX',
                pageX: isVertical ? 'pageY':'pageX',
                width: isVertical ? 'height':'width',
                translateX: isVertical ? 'translateY':'translateX',
                x: isVertical ? 'y':'x'
            }
        }

        function getKnobObject(el){
            var id = el.getAttribute('aria-controls');
            var valueMax = +el.getAttribute('aria-valuemax');
            var valueMin = +el.getAttribute('aria-valuemin');
            var valueNow = +el.getAttribute('aria-valuenow');
            var isVertical = el.getAttribute('aria-orientation') === 'vertical';
            var label = document.getElementById(id);

            return {
                el: el,
                label: label,
                valueMax: valueMax,
                valueMin: valueMin,
                valueNow: valueNow,
                width: el.width,
                height: el.height,
                left: el.x,
                top: el.y,
                pos: isVertical ? el.y : el.x
            };
        }

        function isWithinBounds(pos){
            var map = this.posMapping;
            var notPastLeftSide  = (pos >= this.knobBar.bounds[map.left]);
            var notPastRightSide = (pos <= this.knobBar.bounds[map.right]);

            return notPastLeftSide && notPastRightSide;
        }

        function newPositionExceedsSibling(pos, knob){
            var map = this.posMapping;
            var knobs = this.knobBar.knobs;
            var pos2 = (knob.el === knobs[0].el ? knobs[1]:knobs[0])[map.left];
            var toCompare = [pos, pos2];

            if(knob.el === knobs[1].el) toCompare.reverse();

            return toCompare[0] > toCompare[1];
        }

        // public (shared across instances)
        var _slider = function(slider, options) {

            options = options || {
                onMove: function(){}
            };

            // private
            var hasCSSTransformSupport = typeof document.createElement('div').style.transform === 'string';

            // public (per instance)
            this.knobBar = getKnobBarObject(slider);
            this.posMapping = getPosMapping(this.knobBar.isVertical);

            this.move = function _move(knob, pos){
                var knobBar = this.knobBar;

                if( ! isWithinBounds.call(this, pos)) return;
                if(knobBar.isRange && newPositionExceedsSibling.call(this, pos, knob)) return;

                var map = this.posMapping;
                var valueNow = Math.round((knob.valueMax - knob.valueMin) * (pos / knobBar.maxValue));
                var amountPx = Math.round(pos - (knob[map.width] / 2)) + 'px';

                if(hasCSSTransformSupport)
                {
                    knob.el.style.transform = map.translateX + '('+amountPx+')';
                }
                else
                {
                    knob.el.style[map.left] = amountPx;
                }

                knob[map.left] = pos;
                knob.pos = pos;
                knob.el.setAttribute('aria-valuenow', valueNow);
                knob.label.value = valueNow;

                options.onMove.call(this, knob);
            }.bind(this);

            // Setup
            Slider.supportProviders.forEach(function(provider){
                provider.call(this, this.knobBar);
            }.bind(this));

            // default position knob 1
            this.move(this.knobBar.knobs[0], 0);

            // default position knob 2
            if(this.knobBar.isRange){
                this.move(this.knobBar.knobs[1], this.knobBar.maxValue);
            }
        };

        _slider.supportProviders = [];

        return _slider;
    })();

    var dragSupport = function _addDragSupport(){
        var map = this.posMapping;
        var knobBar = this.knobBar;

        var dragstart = function _dragstart(e){
            e.preventDefault();
        };

        var mouseup = function _mouseup(){
            knobBar.isDragging = false;
            knobBar.currentDragEl = null;

            eventListener('remove');
        };

        var mousemove = function _mousemove(e){
            var knobs = knobBar.knobs;
            var knob = knobBar.isRange && knobs[1].el === knobBar.currentDragEl ? knobs[1]:knobs[0];

            this.move(knob, e[map.clientX] - knobBar.offset[map.left]);
        }.bind(this);

        function eventListener(action) {
            document[action + 'EventListener']('dragstart', dragstart, false);
            document[action + 'EventListener']('mousemove', mousemove, false);
            document[action + 'EventListener']('mouseup', mouseup, false);
        }

        knobBar.el.addEventListener('mousedown', function _mousedown(e){
            if(e.target.getAttribute('role') != 'slider') return;

            knobBar.isDragging = true;
            knobBar.currentDragEl = e.target;

            eventListener('add');
        }, false);
    };

    var clickSupport = function _addClickSupport(){
        var map = this.posMapping;
        var knobBar = this.knobBar;
        var knobs = knobBar.knobs;
        var knobElements = knobs.map(function(knob){ return knob.el });

        var click = function _click(e){
            if(knobElements.lastIndexOf(e.target) !== -1) return;

            var pos = e[map.clientX] - knobBar.offset[map.left];
            var isFirstHalf = !(knobBar.isRange && Math.abs(knobs[0].pos - pos) > Math.abs(knobs[1].pos - pos));

            this.move(isFirstHalf ? knobs[0]:knobs[1], pos);
        }.bind(this);

        knobBar.el.addEventListener('click', click, false);
    };

    var keyboardSupport = function _addKeyboardSupport(){
        var map = this.posMapping;
        var knobBar = this.knobBar;
        var knobs = knobBar.knobs;
        var keysValues = {
            RIGHT: 1,
            LEFT: -1,
            UP: 1,
            DOWN: -1,
            ARROWUP: 1,
            ARROWDOWN: -1,
            ARROWRIGHT: 1,
            ARROWLEFT: -1,
            PAGEUP: 10,
            PAGEDOWN: -10,
            HOME: 0,
            END: 0
        };

        knobBar.el.addEventListener('keydown', function _keydown(e){
            var key = e.key.toUpperCase();
            if( !(e.target === knobs[0].el || knobBar.isRange && e.target === knobs[1].el)) return;
            if(keysValues[key] === undefined) return;

            var isKnob1 = e.target === knobs[0].el;
            var knob = isKnob1 ? knobs[0] : knobs[1];
            var pos;

            if(['HOME', 'END'].indexOf(key) !== -1) {
                var min = isKnob1 ? 0 : knobs[0][map.top];
                var max = knobBar.isRange && isKnob1 ? knobs[1][map.top] : knobBar.maxValue-1;

                pos = key === 'HOME' ? min:max;
            }
            else {
                pos = knob[map.left] + keysValues[key];
            }

            this.move(knob, pos);
        }.bind(this), false);
    };

    var touchSupport = function _addTouchSupport(){
        var map = this.posMapping;
        var knobBar = this.knobBar;

        var touchend = function _mouseup(){
            knobBar.isDragging = false;
            knobBar.currentDragEl = null;

            eventListener('remove');
        };

        var touchmove = function _mousemove(e){
            e.preventDefault();

            var knobs = knobBar.knobs;
            var knob = knobBar.isRange && knobs[1].el === knobBar.currentDragEl ? knobs[1]:knobs[0];

            this.move(knob, e[map.pageX] - knobBar.offset[map.left]);
        }.bind(this);

        function eventListener(action) {
            document[action + 'EventListener']('touchmove', touchmove, false);
            document[action + 'EventListener']('touchend', touchend, false);
        }

        knobBar.el.addEventListener('touchstart', function _touchstart(e){
            if(e.target.getAttribute('role') != 'slider') return;

            knobBar.isDragging = true;
            knobBar.currentDragEl = e.target;

            eventListener('add');
        }, false);
    };

    Slider.supportProviders.push(dragSupport);
    Slider.supportProviders.push(clickSupport);
    Slider.supportProviders.push(keyboardSupport);
    Slider.supportProviders.push(touchSupport);

    window.Slider = Slider;
})();
