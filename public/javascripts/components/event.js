Vue.component("my-event", {
  props: ["login","view"],
  data: function() {
    return {
      event: { },
      event_bak: { }, //in case of update
      involved: false,
      creator: false,
      type: "event",
      stage: "view", //or 'edit'
    };
  },
  template: `
    <div>
      <div v-if="creator">
        <button @click="startUpdate()">Update event</button>
        <button @click="deleteEvent()">Delete event</button>
      </div>
      <button v-else-if="involved" @click="quitEvent()">Quit event</button>
      <button v-else @click="joinEvent()">I will go!</button>
      <div v-show="stage=='view'">
        <h4>{{ event.name }}</h4>
        <p>{{ event.description }}</p>
        <p>{{ event.date }}</p>
      </div>
      <form v-show="stage=='edit'" @submit.prevent>
        <div class="input-field">
          <input id="event_name" type="text" v-model="event.name">
          <label for="event_name">Name</label>
        </div>
        <p>
          <label for="event_date">When</label>
          <input id="event_date" type="datetime" v-model="event.moment">
        </p>
        <p>
          <textarea id="event_description" v-model="event.description"></textarea>
          <label for="event_description">Description</label>
        </p>
        <button class="btn" @click.prevent="updateEvent()">Send</button>
        <button class="btn" @click.prevent="cancelChanges()">Cancel</button>
      </form>
      <my-post-list :login="login" :view="view" :type="type"></my-post-list>
    </div>
  `,
  mounted: function() {
    $.ajax("/events/" + this.view, {
      method: "GET",
      success: res => { this.event = JSON.parse(res); },
    });
    $.ajax("/involved", {
      method: "GET",
      data: {
        user: this.login,
        event: this.view,
      },
      success: res => {
        const info = JSON.parse(res);
        this.involved = info.involved;
        this.creator = info.creator;
      },
    });
  },
  methods: {
    startUpdate: function() {
      this.evant_bak = Object.assign({}, this.event);
      this.stage = "edit";
    },
    joinEvent: function() {
      $.ajax("/involved/", {
        method: "POST",
        data: {
          user: this.login,
          event: this.view,
        },
        success: () => { this.involved = true; },
      });
    },
    quitEvent: function() {
      $.ajax("/involved/", {
        method: "DELETE",
        data: {
          user: this.login,
          event: this.view,
        },
        success: () => { this.involved = false; },
      });
    },
    deleteEvent: function() {
      $.ajax("/events/" + this.view, {
        method: "DELETE",
        success: () => { document.location.href = "/?login=" + this.login; },
      });
    },
  },
});
