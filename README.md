# Accessible slider in vanilla js
That is it at the moment. Its a hobby project. It doesn't even has a name yet.

Feel free to do whatever you want with the code

##Demo
https://rawgit.com/Harrald/wai-aria-slider/master/index.html

##Todo
 - progressive enhancement
    - normal `input[type=number]` with min, max attributes
 - support for snap points
 - plugin style way of adding showing more on onMove. ie; a range indicator or tooltip
    - define this accross instances or per instance
 
 
##Issues
 - its hard to drag to the absolute end
 - <kbd>pageup</kbd> increment wont go further if next increment exceeds max even when knob is not at max. same for <kbd>pagedown</kbd> only the other way round
