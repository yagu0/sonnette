Vue.component("my-post", {
  props: ["login","post"],
  data: function() {
    return {
      comments: [ ],
      stage: "view",
      content_bak: "",
    };
  },
  template: `
    <div>
      <div v-show="stage=='view'">
        <button @click="likeAction()">Like</button>
        <button v-if="login==post.author" @click="editPost()">Edit</button>
        <button v-if="login==post.author" @click="deletePost()">Delete</button>
        <p>{{ post.created }}
        <p>{{ post.author }}
        <p>{{ post.content }}
        <div v-for="comment in sortedComments">
          <p>{{ comment.created }}</p>
          <p>{{ comment.author }}</p>
          <p>{{ comment.content }}</p>
        </div>
      </div>
      <div v-show="stage=='edit'">
        <form @submit.prevent>
          <p>
            <textarea id="post_content" v-model="post.content">
            <label for="post_content">Content</label>
          </div>
          <button class="btn" @click.prevent="updatePost()">Send</button>
          <button class="btn" @click.prevent="cancelChanges()">Cancel</button>
        </form>
      </div>
    </div>
  `,
  mounted: function() {
    $.ajax("/comments/" + this.post.id, {
      method: "GET",
      success: res => { this.comments = JSON.parse(res); }
    });
  },
  computed: {
    sortedComments: function() {
      return this.comments.sort( (a,b) => { return a.created - b.created; });
    },
  },
  methods: {
    editPost: function() {
      this.content_bak = this.post.content;
      this.stage = "edit";
    },
    deletePost: function() {
      $.ajax("/posts/" + this.post.id, {
        method: "DELETE",
        success: () => { document.location.href = "/?login=" + this.login + "#profile"; },
      });
    },
    updatePost: function() {
      $.ajax("/posts/" + this.post.id, {
        method: "PUT",
        data: {content: this.post.content},
        success: () => { this.stage = "view"; },
      });
    },
    cancelChanges: function() {
      this.post.content = this.content_bak;
      this.stage = "view";
    },
  },
});
