var expect = require('expect.js');
var Beacon = require('../index');

describe('beacon', function () {

    it('success callback', function () {
        var be = new Beacon('../examples/1px.gif').on('all',function(event){
            console.log(event);
        });
        be.on('success',function(){
            console.log('success');
            expect(true).to.be(true);
        });
        be.log({
            hello: 'world'
        });
    });

    it('not existed image', function () {
        var be2 = new Beacon('./not_exist.gif', {
            retry: 2,
            concurrent: 3,
            defer: 2000
        }).on('all', function (event) {
                console.log(event);
            });

        console.log(be2);
        console.log(be2.options);
        be2.log({
            hello: 'world'
        }, {
            error: function (event) {
                console.log(event);
            }});
    });

});
