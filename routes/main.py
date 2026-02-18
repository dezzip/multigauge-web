from flask import Blueprint, render_template, Response
from flask_login import current_user
from models import db, Post, User
import os

main_bp = Blueprint('main', __name__)

# Home route - Landing page
@main_bp.route("/")
def home():
    # Serve static landing page
    index_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'index.html')
    if os.path.exists(index_path):
        with open(index_path, 'r') as f:
            return Response(f.read(), mimetype='text/html')
    
    # Fallback to posts if index.html doesn't exist
    query = Post.query

    query.order_by(Post.posted_at.desc())

    pagination = query.paginate(page=1, per_page=4, error_out=False)
    posts = pagination.items

    # For each post, add the like count
    for post in posts:
        user = User.query.get(int(post.posted_by))
        post.user_username = user.username
        post.liked = False
        post.favorited = False
        if current_user.is_authenticated:
            post.liked = current_user.liked_post(post)
            post.favorited = current_user.favorited_post(post)

    return render_template('index.html', posts=posts)

# Editor route
@main_bp.route("/editor")
def editor():
    return render_template('editor.html')