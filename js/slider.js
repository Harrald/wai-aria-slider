(function(supported){
    if(supported) return;
    Array.from = function _arrayFrom(arg){
        return Array.slice(arg, 0);
    }
})(typeof Array.from === "function");

// output elements
var min = document.querySelector('output[name=min]');
var max = document.querySelector('output[name=max]');
var vertical = document.querySelector('output[name=vertical]');

var events = (function(){
    var topics = {};

    return {
        subscribe: function(topic, listener) {
            // Create the topic's object if not yet created
            if(!topics[topic]) topics[topic] = { queue: [] };

            // Add the listener to queue
            var index = topics[topic].queue.push(listener) -1;

            // Provide handle back for removal of topic
            return (function(topic, index) {
                return {
                    remove: function() {
                        delete topics[topic].queue[index];
                    }
                }
            })(topic, index);
        },
        publish: function(topic, info) {
            // If the topic doesn't exist, or there's no listeners in queue, just leave
            if(!topics[topic] || !topics[topic].queue.length) return;

            // Cycle through topics queue, fire!
            var items = topics[topic].queue;
            items.forEach(function(item) {
                info = (info === 0) ? 0 : info||{};
                item(info);
            });
        }
    };
})();

events.subscribe('/move/vertical/', function(value){
    vertical.value = value;
});
events.subscribe('/move/min/', function(value){
    min.value = value;
});
events.subscribe('/move/max/', function(value){
    max.value = value;
});

(function _main(sliders){

    'use strict';

    function matches(el, selector){
        return el === selector || (el.matches || el.matchesSelector || el.msMatchesSelector || el.mozMatchesSelector || el.webkitMatchesSelector || el.oMatchesSelector).call(el, selector);
    }

    function delegate(selector, func){
        return function _delegate(e){
            if(matches(e.target, selector)) func.call(e.target, e);
        }
    }

    function throttle(callback, threshold){
        // ISSUE: when moving fast, func wont execute
        var suppress = false;
        var clear = function() {
            suppress = false;
        };
        return function _throttle() {
            if (!suppress) {
                callback.apply(this, arguments);
                window.setTimeout(clear, threshold);
                suppress = true;
            }
        }
    }

    Array.forEach(sliders, init);

    function init(slider){
        var knob1El = slider.querySelector('.slider-knob');
        var knob2El = slider.querySelector('.slider-knob2');
        var halfKnobWidth = knob1El.width/2;
        var halfKnobHeight = knob1El.height/2;
        var isRange = false;
        var knob1 = {
            el: knob1El,
            width: knob1El.width,
            height: knob1El.height,
            left: knob1El.x,
            top: knob1El.y
        };
        if(knob2El !== null){
            isRange = true;
            var knob2 = {
                el: knob2El,
                width: knob2El.width,
                height: knob2El.height,
                left: knob2El.x,
                top: knob2El.y
            };
        }
        var isVertical = slider.classList.contains('is-vertical');
        var knobBarEl = knob1El.offsetParent;
        var knobBarDimensions = {
            width: knobBarEl.clientWidth,
            height: knobBarEl.clientHeight
        };
        var maxValue = isVertical ? knobBarDimensions.height:knobBarDimensions.width;
        var keys = [
            "RIGHT",
            "LEFT",
            "UP",
            "DOWN",
            "PAGEUP",
            "PAGEDOWN",
            "HOME",
            "END"
        ];
        var keysValues = {
            "RIGHT": 1,
            "LEFT": -1,
            "UP": 1,
            "DOWN": -1,
            "PAGEUP": 10,
            "PAGEDOWN": -10
        };
        var offsetParent = {
            x: knobBarEl.offsetLeft,
            y: knobBarEl.offsetTop
        };
        var bounds = {
            l: 0,
            r: knobBarEl.offsetWidth,
            b: knobBarEl.offsetHeight,
            t: 0
        };

        var throttledMousemove = throttle(_mousemove, 16);

        var isKnob2 = false;

        var mouseup = function _mouseup(){
            detach();
        };
        var mousedown = function _mousedown(e){
            isKnob2 = (isRange && e.target === knob2.el);
            attach();
        };
        var dragstart = function _dragstart(e){
            e.preventDefault();
        };
        var click = function _click(e){
            if(e.target !== knobBarEl) return;
            var isFirstHalf = !(isRange && Math.abs(knob1.left-e.layerX) > Math.abs(knob2.left-e.layerX));

            move(isFirstHalf ? knob1:knob2, {
                x: e.layerX,
                y: e.layerY
            });
        };
        var keydown = function _keydown(e){
            var key = e.key.toUpperCase();

            if( !(e.target === knob1.el || isRange && e.target === knob2.el)) return;
            if(keys.indexOf(key) === -1) return;

            var isKnob1 = e.target === knob1.el;
            var knob = isKnob1 ? knob1 : knob2;
            var minX = isKnob1 ? 0 : knob1.left;
            var minY = isKnob1 ? 0 : knob1.top;
            var maxX = isRange && isKnob1 ? knob2.left : maxValue-1;
            var maxY = isRange && isKnob1 ? knob2.top  : maxValue-1;
            var pos = {};


            if(['HOME', 'END'].indexOf(key) === -1){
                pos.x = knob.left  + keysValues[key];
                pos.y = knob.top + keysValues[key];
            }
            else{
                console.log(maxX);
                pos.x = key === 'HOME' ? minX:maxX;
                pos.y = key === 'HOME' ? minY:maxY;
            }

            move(knob, pos);
        };

        function attach() {
            document.addEventListener('dragstart', dragstart, false);
            document.addEventListener('mousemove', throttledMousemove, false);
            document.addEventListener('mouseup', mouseup, false);
        }

        function detach(){
            document.removeEventListener('dragstart', dragstart, false);
            document.removeEventListener('mousemove', throttledMousemove, false);
            document.removeEventListener('mouseup', mouseup, false);
        }

        function isWithinBounds(pos, axis){
            var isInBounds;
            if(axis === 'x') isInBounds = pos >= bounds.l && pos <= bounds.r;
            if(axis === 'y') isInBounds = pos >= bounds.t && pos <= bounds.b;
            return isInBounds;
        }

        function newPositionExceedsSibling(pos, axis, knob){
            var property = axis === 'x' ? 'left':'top';
            var pos2 = (knob.el === knob1.el ? knob2:knob1)[property];
            var toCompare = [pos, pos2];

            if(knob.el === knob2.el) toCompare.reverse();

            return toCompare[0] > toCompare[1];
        }

        function _mousemove(e){
            move(isKnob2 ? knob2:knob1, {
                x: e.clientX - offsetParent.x,
                y: e.clientY - offsetParent.y
            });
        }



        function move(knob, pos){
            var axis = isVertical ? 'y':'x';
            if( ! isWithinBounds(pos[axis], axis)) return;
            if(isRange && newPositionExceedsSibling(pos[axis], axis, knob)) return;

            var property = isVertical ? 'top':'left';
            var knobDimension = isVertical ? halfKnobHeight:halfKnobWidth;

            if(isVertical){
                events.publish('/move/vertical/', pos[axis]);
            }
            else{
                events.publish('/move/'+ (knob.el === knob2.el ? 'max':'min') + '/', pos[axis]);
            }

            knob[property] = pos[axis];
            knob.el.style[property] = Math.round(pos[axis] - knobDimension) + 'px';
            knob.el.setAttribute('aria-valuenow', pos[axis]);
        }

        // dragging
        knob1El.addEventListener('mousedown', mousedown, false);
        if(isRange){
            knob2El.addEventListener('mousedown', mousedown, false);
        }

        // clicking
        knobBarEl.addEventListener('click', click, false);

        // keyboard
        knobBarEl.addEventListener('keydown', keydown, false);

        // default positions
        move(knob1, {
            x: 0,
            y: 0
        });
        if (isRange){
            move(knob2, {
                x: maxValue,
                y: maxValue
            });
        }
    }
})(Array.from(document.querySelectorAll('.slider')));
