Vue.component("my-event-list", {
  props: ["login","view","circle"],
  data: function() {
    return {
      events: [ ],
      display: true,
    };
  },
  template: `
    <div>
      <h4 @click="display=!display">Events</h4>
      <div v-if="display">
        <a v-for="event in events" :href="navigateTo(event.id)">
          <h5>{{ event.name }}</h5>
          <p>{{ event.description }}</p>
        </a>
      </div>
    </div>
  `,
  mounted: function() {
    this.resetEvents();
  },
  watch: {
    view: function(oldView, newView) {
      if (this.circle == "all")
        return;
      this.resetEvents();
    },
  },
  methods: {
    navigateTo: function(eid) {
      return "/?login=" + this.login + "#event/" + eid;
    },
    resetEvents: function() {
      $.ajax("/events" + (this.circle=="one"?("/"+this.view):""), {
        method: "GET",
        success: res => { this.events = JSON.parse(res); },
      });
    },
  },
});
