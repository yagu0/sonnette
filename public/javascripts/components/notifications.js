Vue.component("my-notifications", {
  props: ["login","view"],
  data: function() {
    return {
      notifications: [ ],
    };
  },
  template: `
    <div>
      <table>
        <tr>
          <th>Time</th>
          <th>User</th>
          <th>Action</th>
        </tr>
        <tr v-for="notif in notifications" @click="navigateTo(notif.place)">
          <td>{{ notif.timestamp }}</td>
          <td>{{ notif.user_name }}</td>
          <td>{{ notif.action }}</td>
        </tr>
      </table>
    </div>
  `,
  mounted: function() {
    $.ajax("/notifications/" + this.login, {
      method: "GET",
      success: res => {
        this.notifications = JSON.parse(res)
          .sort( (a,b) => { return a.timestamp - b.timestamp; });
      },
    });
  },
  methods: {
    navigateTo: function(uri) {
      document.location.href = uri;
    },
  },
});
