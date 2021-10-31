Vue.component("my-mail", {
  props: ["login","view"],
  data: function() {
    return {
      conversations: [ ], //array of user id + name + timestamp (of last message)
    };
  },
  template: `
    <div>
      <table>
        <tr>
          <th>Time</th>
          <th>User</th>
        </tr>
        <tr v-for="conv in conversations" @click="navigateTo(conv.user_id)">
          <td>{{ conv.timestamp }}</td>
          <td>{{ conv.user_name }}</td>
        </tr>
      </table>
    </div>
  `,
  mounted: function() {
    $.ajax("/conversations/" + this.login, {
      method: "GET",
      success: res => {
        this.conversations = JSON.parse(res)
          .sort( (a,b) => { return a.timestamp - b.timestamp; });
      },
    });
  },
  methods: {
    navigateTo: function(user_id) {
      document.location.href = "/?login=" + this.login + "#messages/" + user_id;
    },
  },
});
