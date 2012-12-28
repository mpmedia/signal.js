var Signal = {
    __version__: '0.0.1',
    __ver__: [0, 0, 1],
    __author__: 'Ye Liu',
    __contact__: 'yeliu@instast.com',
    __license__: 'BSD',
    __copyright__: 'Copyright (c) 2012 Ye Liu'
};

(function() {
    /* ----- User Configurable Properties ----- */

    Signal.allowDuplicateSlots = false;

    Signal.isSenderCompatible = function(x, y) {
        return x === y;
    };


    /* ----- General Helper Functions ----- */

    var toString = Object.prototype.toString;

    /*
     * The following `isX` functions are copied from ExtJS 4.1, see
     * http://docs.sencha.com/ext-js/4-1/source/Ext.html for details.
     */
    var isObject = (toString.call(null) === '[object Object]') ?
    function(o) {
        return o !== null && o !== undefined && toString.call(o) === '[object Object]';
    } :
    function(o) {
        return toString.call(o) === '[object Object]';
    };

    var isFunction = (document !== undefined && typeof document.getElementsByTagName('body') === 'function') ?
    function(o) {
        return toString.call(o) === '[object Function]';
    } :
    function(o) {
        return typeof o === 'function';
    };

    function emptyFn() {}


    /* ----- Helper Functions ----- */

    var objIdSeq = 1;

    function markObj(o) {
        if (isObject(o) && !o._signalObjId) {
            o._signalObjId = objIdSeq++;
        }
        return o;
    }

    function unmarkObj(o) {
        if (isObject(o)) {
            delete o._signalObjId;
        }
        return o;
    }

    function compareObj(x, y) {
        if (isObject(x) && isObject(y)) {
            if (x._signalObjId && y._signalObjId) {
                return x._signalObjId === y._signalObjId;
            }
        }
        return x === y;
    }


    /* ----- Slot ----- */

    var slotIdSeq = 0;

    function Slot(fn, receiver, sender) {
        this.id = slotIdSeq++;
        this._fn = fn || emptyFn;
        this._receiver = receiver || null;
        this._sender = sender || null;
    }

    Slot.prototype.call = function() {
        return this._fn.apply(this._receiver, arguments);
    };

    Slot.prototype.isEqual = function(o) {
        return this.compare(o, compareObj, compareObj);
    };

    Slot.prototype.isCompatible = function(o) {
        return this.compare(o, compareObj, Signal.isSenderCompatible);
    };

    Slot.prototype.isSenderCompatible = function(sender) {
        var isSenderCompatible = Signal.isSenderCompatible;

        if (isFunction(isSenderCompatible)) {
            return isSenderCompatible(this._sender, sender);
        }
        return this._sender === sender;
    };

    Slot.prototype.compare = function(o, compareReceiver, compareSender) {
        if (!(o instanceof Slot)) {
            return false;
        }

        if (this === o || this.id === o.id) {
            return true;
        }

        if (this._fn !== o._fn) {
            return false;
        }

        if (isFunction(compareReceiver) && !compareReceiver(this._receiver, o._receiver)) {
            return false;
        }

        if (isFunction(compareSender) && !compareSender(this._sender, o._sender)) {
            return false;
        }

        return true;
    };


    /* ----- BaseSignal ----- */

    function BaseSignal() {
        this.slots = [];
    }

    BaseSignal.prototype.connect = function(slotFn, receiver, sender) {
        var newSlot;

        markObj(receiver);
        markObj(sender);

        newSlot = new Slot(slotFn, receiver, sender);

        if (!Signal.allowDuplicateSlots) {
            for (var i = this.slots.length - 1; i >= 0; i--) {
                if (this.slots[i].isEqual(newSlot)) {
                    return this.slots[i];
                }
            }
        }

        this.slots.push(newSlot);
        return newSlot;
    };

    BaseSignal.prototype.emit = function(sender) {
        var slot;

        for (var i = 0; i < this.slots.length; i++) {
            slot = this.slots[i];
            if (slot.isSenderCompatible(sender)) {
                slot.call.apply(slot, arguments);
            }
        }
    };

    BaseSignal.prototype.emitAsync = function(sender) {
        var self = this;
        var args = arguments;

        setTimeout(function() {
            self.emit.apply(self, args);
        }, 1);
    };

    BaseSignal.prototype.disconnect = function(slotFn, receiver, sender) {
        return this.disconnectBySlot(new Slot(slotFn, receiver, sender));
    };

    BaseSignal.prototype.disconnectBySlot = function(slot) {
        var i = 0;
        var ret = null;

        while (i < this.slots.length) {
            if (this.slots[i].isEqual(slot)) {
                ret = this.slots.splice(i, 1);
            }
            else {
                i++;
            }
        }

        return ret ? ret[0] : null;
    };

    Signal.markObj = markObj;
    Signal.unmarkObj = unmarkObj;
    Signal.Slot = Slot;
    Signal.BaseSignal = BaseSignal;
})();