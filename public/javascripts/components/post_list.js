Vue.component("my-post-list", {
	props: ["login","view","type"], //type is wall (view=userID), group (view=groupID) or event (...)
	data: function() {
		return {
			posts: [ ],
		};
	},
	template: `
		<div>
			<my-post v-for="post in posts" v-bind:key="post.id" :login="login" :post="post"></my-post>
		</div>
	`,
	mounted: function() {
		this.resetPosts();
	},
	watch: {
		view: function(oldView, newView) {
			this.resetPosts();
		},
	},
	methods: {
		resetPosts: function() {
			$.ajax("/posts", {
				method: "GET",
				data: {
					view: this.view,
					type: this.type,
				},
				success: res => { this.posts = JSON.parse(res); }
			});
		},
	},
});
