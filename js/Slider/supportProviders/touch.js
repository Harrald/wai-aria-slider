Slider.supportProviders.push(function _addTouchSupport(){
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
});
