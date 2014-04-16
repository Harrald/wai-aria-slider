(function(){
    Array.from = function(arg){
        return Array.slice(arg, 0);
    }

})();


(function(tablists){
    console.log('test', tablists);

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
        function switch_active_panel(e){
            e.preventDefault();
            selectedTab.setAttribute('aria-selected', false);
            var indexSelectedTab = Array.indexOf(tabs, selectedTab);
            tab_panel_map[indexSelectedTab].classList.remove('tab-is-selected');

            this.setAttribute('aria-selected', 'true');
            var index = Array.indexOf(tabs, this);
            tab_panel_map[index].classList.add('tab-is-selected');

            console.warn(selectedTab, this);
            selectedTab = this;
        }
        function switch_active_tab(e){
            var key = e.key.toLowerCase();
            if( -1 === ['left', 'right'].indexOf(key)) return;
            e.preventDefault();

            var currentIndex = Array.indexOf(tabs, this);
            var newIndex = currentIndex + (key === 'left'? -1:1);
            //console.log(currentIndex, key, newIndex, tabs.length -1);
            newIndex = Math.max(Math.min(newIndex, tabs.length -1), 0);
            console.log(this, currentIndex, tabs[newIndex], newIndex);
            if(newIndex !== currentIndex){
                //tabs[newIndex].focus();
                switch_active_panel.call(tabs[newIndex], e);
            }
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

        // focus does not bubble
        Array.forEach(tabs, function(tab){
            tab.addEventListener('focus', switch_active_panel, false);
        });
    }


})(Array.from(document.querySelectorAll('[role=tablist]')));
