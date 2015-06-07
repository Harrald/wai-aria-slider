Slider.supportProviders.push(function _addClickSupport(){
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
});
