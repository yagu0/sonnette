Vue.component("my-people", {
  props: ["login","view","circle"],
  data: function() {
    return {
      users: [ ],
      display: true,
    };
  },
  template: `
    <div>
      <h4 @click="display=!display">{{ getTitle() }}</h4>
      <div v-show="display">
        <div v-if="canDisplay(user)" v-for="user in users">
          <div @click="navigateTo(user.id)">
            <img :src="user.avatar"/>
            <span>{{ user.name }}</span>
          </div>
          <button v-if="!!user.friendship_lvl" @click="friendshipAction(user)">{{ getActionTitle(user) }}</button>
        </div>
      </div>
    </div>
  `,
  mounted: function() {
    if (this.circle == "all")
    {
      $.ajax("/users/", {
        method: "GET",
        success: res => { this.users = JSON.parse(res); }
      });
    }
    else if (this.circle == "friends")
      this.resetFriends();
  },
  watch: {
    view: function(newView, oldView) {
      if (this.circle == "friends")
        this.resetFriends();
    },
  },
  methods: {
    resetFriends: function() {
      $.ajax("/friends/" + this.view, {
        method: "GET",
        success: res => { this.users = JSON.parse(res); }
      });
    },
    canDisplay: function(user) {
      if (!user.friendship_lvl || (this.login==this.view && user.friendship_lvl != "none"))
        return true; //no friendship info, or friends of logged-in user: always show
      return user.friendship_lvl == "confirmed"; //hide pending friendhsips of others
    },
    navigateTo: function(id) {
      document.location.href = "/?login=" + this.login + "#profile/" + id;
    },
    getTitle: function() {
      switch (this.circle)
      {
        case "friends":
          return "Friends";
        case "all":
          return "All users";
      }
    },
    getActionTitle: function(user) {
      switch (user.friendship_lvl)
      {
        case "confirmed":
          return "Unfriend";
        case "requested":
          return "Cancel request";
        case "unanswered":
          return "Accept request";
      }
    },
    friendshipAction: function(user) {
      switch (user.friendship_lvl)
      {
        case "confirmed":
          return this.removeFriendship(user, "both");
        case "requested":
          return this.removeFriendship(user, "source");
        case "unanswered":
          return this.addFriendship(user, "target");
      }
    },
    removeFriendship: function(user, what) {
      if (["both","source"].includes(what))
      {
        $.ajax("/friends", {
          method: "DELETE",
          data: {
            source: this.login,
            target: user.id,
          },
        });
      }
      if (["both","target"].includes(what))
      {
        $.ajax("/friends", {
          method: "DELETE",
          data: {
            source: user.id,
            target: this.login,
          },
        });
      }
      user.friendship_lvl = "none"; //or just delete field
    },
    addFriendship: function(user) {
      $.ajax("/friends", {
        method: "POST",
        data: {
          source: this.login,
          target: id,
        },
      });
      user.friendship_lvl = "confirmed";
    },
  },
});
