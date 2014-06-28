# Demo

---

## Normal usage

````javascript
seajs.use('index', function(Beacon) {
  var be = new Beacon('./1px.gif');
  be.log({
    hello:'world'
  });

  var be2 = new Beacon('./not_exist.gif',{
    retry:2,
    concurrent:3,
    defer:2000
  });
  console.log(be2.options);
    be2.log({
      hello:'world'
    },{
    error:function(event){
        console.log(event);;
    }});
});
````
