(function(supported){
    if(supported) return;
    Array.from = function _arrayFrom(arg){
        return Array.slice(arg, 0);
    }
})(typeof Array.from === "function");

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
                item(info||{});
            });
        }
    };
})();

(function(sliders){

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
        // add events
        var knobEl = slider.querySelector('.slider-knob');
        var halfKnobWidth = knobEl.width/2;
        var halfKnobHeight = knobEl.height/2;
        var isRange = false;
        var knob2El = slider.querySelector('.slider-knob2');
        if(knob2El !== null){
            isRange = true;
            var knob2Width = knob2El.width;
            var knob2Height = knob2El.height;
        }
        var knobBar = knobEl.offsetParent;
        var offsetParent = {
            x: knobBar.offsetLeft,
            y: knobBar.offsetTop
        };
        var bounds = {
            l: 0,
            r: knobBar.offsetWidth,
            b: knobBar.offsetHeight,
            t: 0
        };
        var isVertical = slider.classList.contains('is-vertical');
        var mousemove = throttle(move, 16);

        var isKnob2 = false;

        var mouseup = function _mouseup(){
            detach();
        };
        var mousedown = function _mousedown(e){
            isKnob2 = (e.target.classList.contains('slider-knob2'))
            attach();
        };
        var dragstart = function _dragstart(e){
            e.preventDefault();
        };

        function attach() {
            document.addEventListener('dragstart', dragstart, false);
            document.addEventListener('mousemove', mousemove, false);
            document.addEventListener('mouseup', mouseup, false);
        }

        function detach(){
            document.removeEventListener('dragstart', dragstart, false);
            document.removeEventListener('mousemove', mousemove, false);
            document.removeEventListener('mouseup', mouseup, false);
        }

        function isWithinBounds(pos, plane){
            var isInBounds;
            if(plane === 'x') isInBounds = pos > bounds.l && pos < bounds.r;
            if(plane === 'y') isInBounds = pos > bounds.t && pos < bounds.b;
            return isInBounds;
        }

        function move(e){
            var knob = isKnob2 ? knob2El:knobEl;

            if(isVertical){
                var top  = (e.clientY - offsetParent.y) - halfKnobHeight;
                if(isWithinBounds(top+halfKnobHeight, 'y')){
                    knob.style.top  = top  + 'px';

                    events.publish('/move/vertical/', top);
                }
            }
            else{
                var left = (e.clientX - offsetParent.x) - halfKnobWidth;
                if(isWithinBounds(left+halfKnobWidth, 'x')){
                    knob.style.left = Math.round(left) + 'px';
                    events.publish('/move/'+ (isKnob2?'max':'min') + '/', left);
                }
            }
        }

        knobEl.addEventListener('mousedown', mousedown, false);
        if(isRange){
            knob2El.addEventListener('mousedown', mousedown, false);
        }
    }

var min = document.querySelector('output[name=min]');
var max = document.querySelector('output[name=max]');
var vertical = document.querySelector('output[name=vertical]');

events.subscribe('/move/vertical/', function(value){
    vertical.value = value;
});
    events.subscribe('/move/min/', function(value){
    min.value = value;
});
events.subscribe('/move/max/', function(value){
    max.value = value;
});

})(Array.from(document.querySelectorAll('.slider')));
