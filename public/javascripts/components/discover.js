Vue.component("my-discover", {
	props: ["login","view"],
	data: function() {
		return {
			circle: "all",
			thingName: "",
			currentThing: "",
		};
	},
	template: `
		<div>
			<div id="newThing" class="modal">
				<div class="modal-content">
				  <h4>New {{ currentThing }}</h4>
				  <form @submit.prevent>
						<input type="text" placeholder="Name" v-model="thingName"/>
						<button class="btn" @click="createThing()">Send</button>
					</form>
				</div>
	    </div>
			<button class="btn" @click="openModal('user')">New user</button>
			<my-people :login="login" :view="view" :circle="circle"></my-people>
			<button class="btn" @click="openModal('group')">New group</button>
			<my-group-list :login="login" :view="view" :circle="circle"></my-group-list>
			<button class="btn" @click="openModal('event')">New event</button>
			<my-event-list :login="login" :view="view" :circle="circle"></my-event-list>
		</div>
	`,
	mounted: function() {
		$('.modal').modal();
	},
	methods: {
		openModal: function(thing) {
			this.currentThing = thing;
			$('#newThing').modal('open');
		},
		createThing: function() {
			$.ajax("/" + this.currentThing + "s", {
				method: "POST",
				data: {name: this.thingName},
				success: res => {
					$('#newThing').modal('close');
					const newThing_id = JSON.parse(res).id;
					const type = this.currentThing != "user" ? this.currentThing : "profile";
					document.location.href = "/?login=" + this.login + "#" + type + "/" + newThing_id;
				},
			});
		},
	},
});
