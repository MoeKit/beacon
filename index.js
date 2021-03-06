var queryString = require('query-string'),
    Eventor = require('eventor');
Eventor.mixTo(BGIF);

/**
 * @param {String} beacon The fully qualified HTTP resource to handle
 *                 requests.
 * @param {Object} options Optional object literal of optional config
 *                                  params..
 * @param {Boolean} enabled Defaults to true, disable/enable HTTP requests.
 * @param {Number} defer Defaults to 0, the total ms to wait before making a request.
 * @param {Number} concurrent Defaults to -1 (no limit), the maximum number of concurrent connections.
 * @param {Number} timeout Defaults to 250, how long to wait for a request before timing out.
 * @param {Number} retry Defaults to 0, the number of times to retry a failed request.
 */
function BGIF(path, options) {
    this.path = path;
    this.options = options || {};
    this.enabled = this.options.enabled || true;
    this.defer = this.options.defer || 0;
    this.concurrent = this.options.concurrent || -1;
    this.timeout = this.options.timeout || 250
    this.retry = this.options.retry || 0;
    this.connections = [];
    this.tzoffset = (new Date()).getTimezoneOffset();
}

/**
 * LOG DAT!
 *
 * @param {Object} kv A one-level deep object literal of key/value pairs.
 *                    Don't worry about escaping BGIF do it!
 * @param {Object} options Optional object literal of optional config params...
 * @param {Function} error Callback for when a log request could not be fullfilled.
 * @param {Function} success Callback for when a log request is fullfilled.
 * @param {Number} retry READONLY. The current attempt; used as comparison against retry constructor argument.
 */
BGIF.prototype.log = function (kv, options) {
    if (!this.enabled) {
        return;
    }
    var _this = this;
    var options = options || {},
        errorCallback = options.error,
        successCallback = options.success,
        retry = options.retry || 0;
    // concurrent limit
    if (this.concurrent >= 0 && this.connections.length >= this.concurrent) {
        if (errorCallback && retry >= this.retry) {
            errorCallback('max', kv, options);
            this.trigger('error', kv, options);
        } else {
            options.retry = ++retry;
            _this.trigger('retry', kv, options);
            this.log(kv, options);
        }
        return;
    }


    var time = (new Date()).getTime(), that = this, v;
    var connection = setTimeout(function () {
        var src, timeout, params = queryString.stringify(kv),
            img = new Image();
        // kv.client_time = time;
        // kv.client_tzoffset = that.tzoffset;
        src = that.path + '?' + params;
        timeout = setTimeout(function () {
            img = null;
            that._removeConnection(connection);
            if (errorCallback && retry >= _this.retry) {
                errorCallback('timeout', kv, options);
                _this.trigger('error', kv, options);
            } else {
                options.retry = ++retry;
                _this.trigger('retry', kv, options);
                _this.log(kv, options);
            }
        }, that.timeout);
        img.onload = img.onerror = function (event) {
            var etype = event.type;
            clearTimeout(timeout);
            that._removeConnection(connection);
            if (errorCallback && etype === 'error') {
                if (retry >= _this.retry) {
                    errorCallback('load', kv, options);
                    _this.trigger('error', kv, options);
                } else {
                    retry++;
                    options.retry = retry;
                    _this.trigger('retry', kv, options);
                    _this.log(kv, options);
                }
            }
            if (successCallback && etype === 'load') {
                successCallback('load', kv, options);
                _this.trigger('success', kv, options);
            }
        };
        img.src = src;
    }, _this.defer);
    _this.connections.push(connection);
    return _this;
};
BGIF.prototype._removeConnection = function (connection) {
    for (var i = 0, l = this.connections.length; i < l; i++) {
        if (this.connections[i] == connection) {
            this.connections.splice(i, 1);
            break;
        }
    }
};


module.exports = BGIF;