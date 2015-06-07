Slider.supportProviders.push(function _addKeyboardSupport(){
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
});
