new Vue({
  el: "#vueManage",
  data: {
    login: 1, //"logged-in" user ID
    view: 1, //current viewed user or group or event ID (if relevant)
    section: "discover",
    name : "",
    avatar: "/public/images/question-mark.jpg",
    somethingNew: false,
  },
  mounted: function() {
    $(".button-collapse").sideNav();
    this.parseUri();
    const newHref = this.getHref(this.section);
    if (!document.location.href.match(new RegExp(newHref + "$")))
      document.location.href = newHref;
    window.onpopstate = () => { this.navigate(); };
    this.getUserInfos();
    this.checkForNews();
  },
  methods: {
    parseUri: function() {
      const loginMatch = document.location.href.match(/\?login=([^#]+)/);
      if (!loginMatch)
        document.location.href = "/error/no/login";
      this.login = loginMatch[1];
      const sectionMatch = document.location.href.match(/#([^\/]+)/);
      this.section = !!sectionMatch ? sectionMatch[1] : "discover";
      if (this.section == "notifications")
        this.somethingNew = false;
      const idMatch = document.location.href.match(/#[^\/]+\/(.+)/);
      this.view = !!idMatch ? idMatch[1] : this.login;
    },
    navigate: function() {
      this.parseUri();
      this.getUserInfos();
      this.checkForNews();
    },
    getHref: function(section) {
      if (["notifications","discover"].includes(section))
        return "/?login=" + this.login + "#" + section;
      return "/?login=" + this.login + "#" + section + "/" + this.login; //(my) profile
    },
    getUserInfos: function() {
      $.ajax("/users/" + this.login, {
        method: "GET",
        success: res => {
          const user = JSON.parse(res);
          this.name = user.name;
          if (!!user.avatar)
            this.avatar = user.avatar;
        },
      });
    },
    checkForNews: function() {
      $.ajax("/something_new/" + this.login, {
        method: "GET",
        success: res => { this.somethingNew = JSON.parse(res).somethingNew; },
      });
    },
  },
});
