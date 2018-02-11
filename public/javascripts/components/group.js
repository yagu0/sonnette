Vue.component("my-group", {
	props: ["login","view"],
	data: function() {
		return {
			group: { },
			belong_to: false,
			creator: false,
			type: "group",
		};
	},
	template: `
		<div>
			<button v-if="creator" @click="deleteGroup()">Delete group</button>
			<button v-else-if="belong_to" @click="quitGroup()">Quit group</button>
			<button v-else @click="joinGroup()">Join group</button>
			<h4>{{ group.name }}</h4>
			<p>{{ group.description }}</p>
			<my-post-list :login="login" :view="view" :type="type"></my-post-list>
		</div>
	`,
	mounted: function() {
		$.ajax("/groups/" + this.view, {
			method: "GET",
			success: res => { this.group = JSON.parse(res); },
		});
		$.ajax("/belong_to", {
			method: "GET",
			data: {
				user: this.login,
				grp: this.view,
			},
			success: res => {
				const info = JSON.parse(res);
				this.belong_to = info.belong_to;
				this.creator = info.creator;
			},
		});
	},
	methods: {
		joinGroup: function() {
			$.ajax("/belong_to/", {
				method: "POST",
				data: {
					user: this.login,
					grp: this.view,
				},
				success: () => { this.belong_to = true; },
			});
		},
		quitGroup: function() {
			$.ajax("/belong_to/", {
				method: "DELETE",
				data: {
					user: this.login,
					grp: this.view,
				},
				success: () => { this.belong_to = false; },
			});
		},
		deleteGroup: function() {
			$.ajax("/groups/" + this.view, {
				method: "DELETE",
				success: () => { document.location.href = "/?login=" + this.login; },
			});
		},
	},
});
