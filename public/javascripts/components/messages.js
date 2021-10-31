Vue.component("my-messages", {
  props: ["login","view"],
  data: function() {
    return {
      messages: [ ],
    };
  },
  template: `
    <div>
      <button @click="deleteConversation()">Delete conversation</button>
      <div v-for="m in messages">
        <button @click="deleteMessage(m.id)">Delete</button>
        <h4>{{ m.sender }}</h4>
        <p>{{ m.receiver }}</p>
        <p>{{ m.created }}</p>
        <p>{{ m.content }}</p>
      </div>
    </div>
  `,
  mounted: function() {
    $.ajax("/messages", {
      method: "GET",
      data: {user1:this.login, user2:this.view},
      success: res => { this.messages = JSON.parse(res); },
    });
  },
  methods: {
    deleteConversation: function() {
      $.ajax("/messages", {
        method: "DELETE",
        data: {
          user1: this.login,
          user2: this.view,
        },
        success: () => { document.location.href = "/?login=" + this.login; },
      });
    },
    deleteMessage: function(mid) {
      $.ajax("/messages/" + mid, {
        method: "DELETE",
        success: () => {
          const midx = this.messages.findIndex( item => { return item.id == mid; });
          this.messages.splice(midx, 1);
        },
      });
    },
  },
});
