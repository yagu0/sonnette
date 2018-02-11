Vue.component("my-profile", {
	props: ["login","view"],
	data: function() {
		return {
			circle: "friends",
		};
	},
	template: `
		<div>
			<my-basic-infos :login="login" :view="view"></my-basic-infos>
			<my-people :login="login" :view="view" :circle="circle"></my-people>
			<my-group-list :login="login" :view="view" :circle="circle"></my-group-list>
			<my-event-list :login="login" :view="view" :circle="circle"></my-event-list>
			<my-wall :login="login" :view="view"></my-wall>
		</div>
	`,
});
