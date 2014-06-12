(function(supported){
    if(supported) return;
    Array.from = function(arg){
        return Array.slice(arg, 0);
    }
})(typeof Array.from === "function");


(function(tablists){

    function matches(el, selector){
        return el === selector || (el.matches || el.matchesSelector || el.msMatchesSelector || el.mozMatchesSelector || el.webkitMatchesSelector || el.oMatchesSelector).call(el, selector);
    }

    function delegate(func, selector){
        return function(e){
            if(matches(e.target, selector)) func.call(e.target, e);
        }
    }

    Array.forEach(tablists, initTabs);

    function initTabs(tablist){
        var tabs = tablist.querySelectorAll('[role=tab]');
        var selectedTab = Array.filter(tabs, function(tab){ return tab.getAttribute('aria-selected') == 'true'})[0];
        var tab_panel_map = [];
        var panel_tab_map = [];

        // event handlers
        function switch_active_panel(){

            select.call(selectedTab, false);
            select.call(this, true);

            selectedTab = this;
        }
        function switch_active_tab(e){
            var key = e.key.toLowerCase();
            if( -1 === ['left', 'right'].indexOf(key)) return;
            var currentIndex = Array.indexOf(tabs, selectedTab);
            var newIndex = currentIndex + (key === 'left' ? -1:1);

            // make sure index is within bounds
            newIndex = Math.max(Math.min(newIndex, tabs.length - 1), 0);

            if(newIndex !== currentIndex){
                switch_active_panel.call(tabs[newIndex], e);
            }
        }

        // select or unselect
        function select(shouldSelect){
            var index = Array.indexOf(tabs, this);
            this.setAttribute('aria-selected', shouldSelect ? 'true':'false');
            tab_panel_map[index].classList[shouldSelect ? 'add':'remove']('tab-is-selected');
        }

        // couple the tabs with the panels
        Array.forEach(tabs, function(tab, i){
            var id = tab.getAttribute('aria-controls');
            tab_panel_map[i] = document.getElementById(id);
            panel_tab_map[i] = tab;
        });

        // add events
        tablist.addEventListener('click', delegate(switch_active_panel, '[role=tab]'), false);
        tablist.addEventListener('keydown', delegate(switch_active_tab, '[role=tab]'), false);

        // focus does not bubble, so we cant use event delegation
        Array.forEach(tabs, function(tab){
            tab.addEventListener('focus', switch_active_panel, false);
        });
    }


})(Array.from(document.querySelectorAll('[role=tablist]')));
