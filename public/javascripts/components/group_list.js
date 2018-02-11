Vue.component("my-group-list", {
	props: ["login","view","circle"],
	data: function() {
		return {
			groups: [ ],
			display: true,
		};
	},
	template: `
		<div>
			<h4 @click="display=!display">Groups</h4>
			<div v-if="display">
				<a v-for="group in groups" :href="navigateTo(group.id)">
					<h5>{{ group.name }}</h5>
					<p>{{ group.description }}</p>
				</a>
			</div>
		</div>
	`,
	mounted: function() {
		this.resetGroups();
	},
	watch: {
		view: function(oldView, newView) {
			if (this.circle == "all")
				return;
			this.resetGroups();
		},
	},
	methods: {
		navigateTo: function(gid) {
			return "/?login=" + this.login + "#group/" + gid;
		},
		resetGroups: function() {
			$.ajax("/groups" + (this.circle=="one"?("/"+this.view):""), {
				method: "GET",
				success: res => { this.groups = JSON.parse(res); },
			});
		},
	},
});
