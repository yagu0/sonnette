Vue.component("my-wall", {
  props: ["login","view"],
  data: function() {
    return {
      type: "post",
      display: true,
    };
  },
  template: `
    <div>
      <h4 @click="display=!display">Wall</h4>
      <my-post-list v-show="display" :login="login" :view="view" :type="type"></my-post-list>
    </div>
  `,
});
