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

        function getKnobObject(el){
            var id = el.getAttribute('aria-controls');
            var valueMax = +el.getAttribute('aria-valuemax');
            var valueMin = +el.getAttribute('aria-valuemin');
            var valueNow = +el.getAttribute('aria-valuenow');
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
                top: el.y
            };
        }

        function isWithinBounds(pos, axis){
            var isInBounds;
            if(axis === 'x') isInBounds = pos >= this.knobBar.bounds.left && pos <= this.knobBar.bounds.right;
            if(axis === 'y') isInBounds = pos >= this.knobBar.bounds.top && pos <= this.knobBar.bounds.bottom;
            return isInBounds;
        }

        function newPositionExceedsSibling(pos, axis, knob){
            var knobs = this.knobBar.knobs;
            var property = axis === 'x' ? 'left':'top';
            var pos2 = (knob.el === knobs[0].el ? knobs[1]:knobs[0])[property];
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

            this.move = function _move(knob, pos){

                var knobBar = this.knobBar;
                var axis = knobBar.isVertical ? 'y':'x';
                var property = knobBar.isVertical ? 'top':'left';

                if( ! isWithinBounds.call(this, pos[axis], axis)) return;
                if(knobBar.isRange && newPositionExceedsSibling.call(this, pos[axis], axis, knob)) return;

                var knobDimension = knob[knobBar.isVertical ? 'height':'width'] / 2;
                var value = pos[axis] / knobBar.maxValue;
                var valueNow = Math.round((knob.valueMax - knob.valueMin) * value);
                var amountPx = Math.round(pos[axis] - knobDimension) + 'px';

                if(hasCSSTransformSupport)
                {
                    var transformFunction = 'translate' + axis.toUpperCase();

                    knob.el.style.transform = transformFunction + '('+amountPx+')';
                }
                else
                {
                    knob.el.style[property] = amountPx;
                }

                knob[property] = pos[axis];
                knob.el.setAttribute('aria-valuenow', valueNow);
                knob.label.value = valueNow;

                options.onMove.call(this, knob);
            }.bind(this);

            // Setup
            Slider.supportProviders.forEach(function(provider){
                provider.call(this, this.knobBar);
            }.bind(this));

            // default position knob 1
            this.move(this.knobBar.knobs[0], {
                x: 0,
                y: 0
            });

            // default position knob 2
            if(this.knobBar.isRange){
                this.move(this.knobBar.knobs[1], {
                    x: this.knobBar.maxValue,
                    y: this.knobBar.maxValue
                });
            }
        };

        _slider.supportProviders = [];

        return _slider;
    })();

    var dragSupport = function _addDragSupport(){
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

            this.move(knob, {
                x: e.clientX - knobBar.offset.left,
                y: e.clientY - knobBar.offset.top
            });
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
        var knobBar = this.knobBar;
        var knobs = knobBar.knobs;
        var knobElements = knobs.map(function(knob){ return knob.el });

        var click = function _click(e){
            if(knobElements.lastIndexOf(e.target) !== -1) return;

            var x = e.clientX - knobBar.offset.left;

            var isFirstHalf = !(knobBar.isRange && Math.abs(knobs[0].left - x) > Math.abs(knobs[1].left - x));

            this.move(isFirstHalf ? knobs[0]:knobs[1], {
                x: x,
                y: e.clientY
            });
        }.bind(this);

        knobBar.el.addEventListener('click', click, false);
    };

    var keyboardSupport = function _addKeyboardSupport(){
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
            var minX = isKnob1 ? 0 : knobs[0].left;
            var minY = isKnob1 ? 0 : knobs[0].top;
            var maxX = knobBar.isRange && isKnob1 ? knobs[1].left : knobBar.maxValue-1;
            var maxY = knobBar.isRange && isKnob1 ? knobs[1].top  : knobBar.maxValue-1;
            var pos = {};

            if(['HOME', 'END'].indexOf(key) !== -1) {
                pos.x = key === 'HOME' ? minX:maxX;
                pos.y = key === 'HOME' ? minY:maxY;
            }
            else {
                pos.x = knob.left + keysValues[key];
                pos.y = knob.top  + keysValues[key];
            }

            this.move(knob, pos);
        }.bind(this), false);
    };

    var touchSupport = function _addTouchSupport(){
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

            this.move(knob, {
                x: e.pageX - knobBar.offset.left,
                y: e.pageY - knobBar.offset.top
            });
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

