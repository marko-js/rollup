import components from 'marko/components';

var component = {
  onMount() {
    console.log("mounted");
  },
};

components.register("Oaa9Rkvr", component);

components.init();
