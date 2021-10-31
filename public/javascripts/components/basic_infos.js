Vue.component("my-basic-infos", {
  props: ["login","view"],
  data: function() {
    return {
      user: { },
      user_bak: { }, //backup when editing + cancel
      stage: "view", //or "edit"
      display: true,
      friendshipLvl: "none", //out of user object, easier for SQL requests
      follow: false,
    };
  },
  template: `
    <div>
      <h4 @click="display=!display">Basic infos</h4>
      <div class="row" v-show="display && stage=='view'">
        <div class="col s12 m10 offset-m-1">
          <div>
            <div class="half">
              <h3>
                {{ user.name }} [{{ user.id }}]
                <div class="smaller" v-if="login != view">
                  <button class="btn" @click="friendAction()">{{ friendActionText() }}</button>
                  <button class="btn" @click="messageAction()">Message {{ user.name }}</button>
                  <button class="btn" @click="followAction()">{{ followActionText() }}</button>
                </div>
              </h3>
              <p>Email: {{ user.email }}</p>
              <p>Location: {{ user.location }}</p>
              <p>Birthdate: {{ user.birthdate }}</p>
              <p>Gender: {{ user.gender }}</p>
            </div>
            <div class="half topspacing">
              <img class="avatar" :src="getAvatar()"/>
            </div>
          </div>
          <div class="clearfix">
            <button v-if="login==view" class="btn" @click="startUpdate()">Edit</button>
          </div>
        </div>
      </div>
      <div class="row" v-show="display && stage!='view'">
        <div class="col s12 m10 offset-m-1">
          <h3>Edit user</h3>
          <form @submit.prevent>
            <div class="input-field">
              <input id="profile_name" type="text" v-model="user.name" :disabled="stage=='edit'">
              <label for="profile_name">Name</label>
            </div>
            <div class="file-field input-field">
              <div class="btn">
                <span>Avatar</span>
                <input type="file" @change="setAvatar">
              </div>
              <div class="file-path-wrapper">
                <input class="file-path validate" placeholder="Choose a file" type="text">
              </div>
            </div>
            <div class="input-field">
              <input id="profile_email" type="email" v-model="user.email">
              <label for="profile_email">Email</label>
            </div>
            <div class="input-field">
              <input id="profile_location" type="text" v-model="user.location">
              <label for="profile_location">Location</label>
            </div>
            <p>
              <label for="profile_birthdate">Birthdate</label>
              <input id="profile_birthdate" type="date" v-model="user.birthdate">
            </p>
            <div class="input-field">
              <input id="profile_gender" type="text" v-model="user.gender">
              <label for="profile_gender">Gender</label>
            </div>
            <button class="btn" @click.prevent="updateUser()">Send</button>
            <button class="btn" @click.prevent="cancelChanges()">Cancel</button>
          </form>
        </div>
      </div>
    </div>
  `,
  mounted: function() {
    this.resetInfos();
  },
  watch: {
    view: function(newView, oldView) {
      this.resetInfos();
    },
  },
  methods: {
    resetInfos: function() {
      $.ajax("/users/" + this.view, {
        method: "GET",
        success: res => { this.user = JSON.parse(res); },
      });
      $.ajax("/friend_status", {
        method: "GET",
        data: {
          login: this.login,
          view: this.view,
        },
        success: res => { this.friendshipLvl = JSON.parse(res).status; },
      });
      $.ajax("/follow_status", {
        method: "GET",
        data: {
          login: this.login,
          view: this.view,
        },
        success: res => { this.follow = JSON.parse(res).status; },
      });
    },
    friendActionText: function() {
      switch (this.friendshipLvl)
      {
        case "confirmed":
          return "Unfriend ><";
        case "none":
          return "Be my friend!";
        case "requested":
          return "Cancel pending request";
        case "unanswered":
          return "Accept friend request?";
      }
    },
    followActionText: function() {
      return this.follow ? "Stop following" : "Follow";
    },
    friendAction: function() {
      switch (this.friendshipLvl)
      {
        case "none":
          $.ajax("/friends", {method:"POST",data:{source:this.login,target:this.view}});
          this.friendshipLvl = "requested";
          break;
        case "confirmed":
          $.ajax("/friends", {method:"DELETE",data:{source:this.login,target:this.view}});
          $.ajax("/friends", {method:"DELETE",data:{source:this.view,target:this.login}});
          this.friendshipLvl = "none";
          break;
        case "requested":
          $.ajax("/friends", {method:"DELETE",data:{source:this.login,target:this.view}});
          this.friendshipLvl = "none";
          break;
        case "unanswered":
          $.ajax("/friends", {method:"POST",data:{source:this.login,target:this.view}});
          this.friendshipLvl = "confirmed";
          break;
      }
    },
    followAction: function() {
      if (this.follow)
      {
        $.ajax("/follow", {method:"DELETE",data:{follower:this.login,target:this.view}});
        this.follow = false;
      }
      else
      {
        $.ajax("/follow", {method:"POST",data:{follower:this.login,target:this.view}});
        this.follow = true;
      }
    },
    startUpdate: function() {
      this.user_bak = Object.assign({}, this.user);
      this.stage = "edit";
      Vue.nextTick( () => { Materialize.updateTextFields(); });
    },
    updateUser: function() {
      const userWithoutId = Object.assign({}, this.user);
      delete userWithoutId["id"];
      $.ajax("/users/" + this.user.id, {
        method: "PUT",
        data: userWithoutId,
        success: () => { this.stage = "view"; },
      });
    },
    cancelChanges: function() {
      this.user = this.user_bak;
      this.stage = "view";
    },
    getAvatar: function() {
      if (!this.user.avatar)
        return "/public/images/question-mark.jpg";
      return this.user.avatar;
    },
    setAvatar: function(e) {
      var file = e.srcElement.files[0];
      var reader = new FileReader();
      reader.onloadend = () => { this.user.avatar = reader.result; }
      reader.readAsDataURL(file);
    },
  },
});
