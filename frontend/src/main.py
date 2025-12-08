from datetime import timedelta
from functools import wraps
from flask import Flask, render_template, redirect, url_for, request, session
import requests
from config import API_BASE_URL
from typing import Any, Union

IS_DEV = "prod" not in API_BASE_URL

app = Flask(__name__)
app.secret_key = "1414e499f8eb806d6be668779f05ca31c41d4ca6298ffeb7d29cc993a32756ff"


def login_required(f: Any) -> Any:
    @wraps(f)
    def decorated_function(*args: Any, **kwargs: Any) -> Any:
        if "token" not in session or not session["token"]:
            return redirect(url_for("login_get"))
        return f(*args, **kwargs)

    return decorated_function


@app.route("/")
def home():
    return redirect(url_for("game"))


@app.route("/login", methods=["GET"])
def login_get():
    return render_template("login.html")


@app.route("/login", methods=["POST"])
def login_post():
    username = request.form.get("username")
    password = request.form.get("password")
    remember = request.form.get("remember")

    assert username is not None
    assert password is not None

    response = login(username, password)
    status_code: int = response[0]
    message: Union[dict[str, str], None] = response[1]

    if status_code == 200:
        remember = remember == "on"

        assert message is not None
        token = message.get("token")
        assert token is not None

        set_logged_in(username, token, remember)
        return redirect(url_for("game"))

    if status_code == 401:
        error = "Username or password incorrect"
    if message:
        error = message.get("message")
    else:
        error = "An unknown error occurred"

    return render_template("login.html", error=error)


@app.route("/register", methods=["GET"])
def register_get():
    return render_template("register.html")


@app.route("/register", methods=["POST"])
def register_post():
    username = request.form.get("username")
    password = request.form.get("password")

    assert username is not None
    assert password is not None

    response = register(username, password)
    status_code: int = response[0]
    message: Union[dict[str, str], None] = response[1]

    if status_code == 201:
        return redirect(url_for("login_get"))
    if message:
        error = message.get("message")
    else:
        error = "An unknown error occurred"

    return render_template("register.html", error=error)


@app.route("/game")
@login_required
def game():
    username = session.get("username")
    assert username is not None

    response = get_score(username)
    status_code: int = response[0]
    data = response[1]

    score: int

    if status_code == 200 and data is not None:
        best_score = data.get("bestScore")

        if type(best_score) is int:
            score = best_score
            return render_template("game.html", username=username, score=score)

    if data:
        error = data.get("message")
    else:
        error = "An unknown error occurred"

    return redirect(url_for("login_get", error=error))


@app.route("/scores", methods=["POST"])
@login_required
def post_score():
    data = request.get_json()

    username = session.get("username")
    score: int = data.get("score")

    assert username is not None
    assert score is not None

    response = set_score(username, score)
    status_code: int = response[0]
    data = response[1]

    if status_code == 201:
        return "", 201

    if data:
        error = data.get("message")
    else:
        error = "An unknown error occurred"

    return redirect(url_for("login_get", error=error))


@app.route("/leaderboard")
def leaderboard():
    scores = get_scores()
    username = session.get("username")
    place: int | None = None
    score: int | None = None

    if username and scores:
        place, score = get_place_and_score(username, scores)

    return render_template(
        "leaderboard.html", scores=scores, username=username, place=place, score=score
    )


@app.route("/forgot")
def forgot():
    return """
        <p>Dommage</p>
        <style>
            body {
                height: 100vh;
                display: flex;
                justify-content: center;
                align-items: center;
            }
        </style>
    """


@app.route("/logout")
@login_required
def logout_route():
    logout()
    return redirect(url_for("login_get"))


def get_place_and_score(
    username: str, scores: list[dict[str, Union[str, int]]]
) -> tuple[Union[int, None], Union[int, None]]:
    place: int | None = None
    score: int | None = None

    for index, score_entry in enumerate(scores):
        if score_entry.get("name") == username:
            place = index + 1
            data_score = score_entry.get("bestScore")
            if type(data_score) is int:
                score = data_score
            break

    return place, score


def login(username: str, password: str) -> tuple[int, Union[dict[str, str], None]]:
    data: dict[str, str] | None = None

    payload = {"name": username, "password": password}
    response = requests.post(f"{API_BASE_URL}/login", json=payload)

    try:
        data = response.json()
    except ValueError:
        data = None

    return response.status_code, data


def register(username: str, password: str) -> tuple[int, Union[dict[str, str], None]]:
    data: dict[str, str] | None = None

    payload = {"name": username, "password": password}
    response = requests.post(f"{API_BASE_URL}/users", json=payload)

    try:
        data = response.json()
    except ValueError:
        data = None

    return response.status_code, data


def set_logged_in(username: str, token: str, logged_in: bool) -> None:
    session["logged_in"] = logged_in
    session["token"] = token
    session["username"] = username

    if logged_in:
        session.permanent = True
        app.permanent_session_lifetime = timedelta(days=7)
    else:
        session.permanent = False


def get_score(
    username: str,
) -> tuple[int, dict[str, Union[str, list[int], int]] | None]:
    data: dict[str, Union[str, list[int], int]] | None = None
    response = requests.get(f"{API_BASE_URL}/scores/{username}")

    try:
        data = response.json()
    except ValueError:
        data = None

    return response.status_code, data


def get_scores() -> list[dict[str, Union[str, int]]] | None:
    data: list[dict[str, Union[str, int]]] | None = None
    response = requests.get(f"{API_BASE_URL}/scores")

    try:
        data = response.json()
    except ValueError:
        data = None

    return data


def set_score(
    username: str, score: int
) -> tuple[int, Union[dict[str, Union[str, int]], None]]:
    data: dict[str, Union[str, int]] | None = None

    payload: dict[str, Union[str, int]] = {"name": username, "score": score}
    response = requests.post(f"{API_BASE_URL}/scores", json=payload)

    try:
        data = response.json()
    except ValueError:
        data = None

    return response.status_code, data


def logout() -> None:
    session.pop("logged_in", None)
    session.pop("token", None)
    session.pop("username", None)


if __name__ == "__main__":
    print(f"Starting frontend with backend at {API_BASE_URL}")
    port = 5000 if IS_DEV else 5001
    app.run(host="0.0.0.0", debug=IS_DEV, port=port)
