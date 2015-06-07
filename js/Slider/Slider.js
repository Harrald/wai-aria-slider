(function _slider(undefined){

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

        function setOptions(defaultOptions, instanceOptions){

            for(var i in defaultOptions){
                if(instanceOptions[i] !== undefined){
                    defaultOptions[i] = instanceOptions[i];
                }
            }

            this.options = defaultOptions;
        }

        // public (shared across instances)
        var _slider = function(slider, options) {

            setOptions.call(this, {
                onMove: function(){}
            }, options || {});

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

                this.options.onMove.call(this, knob);
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

    Slider.supportProviders.push(function _addDragSupport(){
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
    });

    window.Slider = Slider;
})();
