use axum::{
    body::Body,
    http::{Request, StatusCode},
};
use codora::{
    core::Workspace,
    server::{AppState, response_bytes, router},
};
use std::sync::{Arc, Mutex};
use tempfile::tempdir;
use tower::ServiceExt;
#[tokio::test]
async fn authentication_and_origin_checks_guard_filesystem() {
    let t = tempdir().unwrap();
    let state = AppState {
        workspace: Arc::new(Mutex::new(Workspace::open(t.path()).unwrap())),
        token: "test-secret".into(),
        origin: "http://127.0.0.1:4321".into(),
    };
    let app = router(state);
    let req = |path: &str| {
        Request::builder()
            .uri(path)
            .header("host", "127.0.0.1:4321")
    };
    assert_eq!(
        app.clone()
            .oneshot(req("/api/files").body(Body::empty()).unwrap())
            .await
            .unwrap()
            .status(),
        StatusCode::UNAUTHORIZED
    );
    assert_eq!(
        app.clone()
            .oneshot(
                req("/api/files")
                    .header("x-codora-token", "test-secret")
                    .header("origin", "https://other.invalid")
                    .body(Body::empty())
                    .unwrap()
            )
            .await
            .unwrap()
            .status(),
        StatusCode::FORBIDDEN
    );
    assert_eq!(
        app.clone()
            .oneshot(
                Request::builder()
                    .uri("/api/files")
                    .header("host", "rebinding.invalid:4321")
                    .header("x-codora-token", "test-secret")
                    .body(Body::empty())
                    .unwrap()
            )
            .await
            .unwrap()
            .status(),
        StatusCode::FORBIDDEN
    );
    let r = app
        .clone()
        .oneshot(
            req("/api/files")
                .header("x-codora-token", "test-secret")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(r.status(), StatusCode::OK);
    assert_eq!(r.headers()["x-content-type-options"], "nosniff");
    assert_eq!(response_bytes(r).await, b"[]");
    assert_eq!(
        app.oneshot(
            req("/api/files?token=test-secret")
                .body(Body::empty())
                .unwrap()
        )
        .await
        .unwrap()
        .status(),
        StatusCode::UNAUTHORIZED
    );
}
#[tokio::test]
async fn api_saves_raw_markdown_and_surfaces_conflict() {
    let t = tempdir().unwrap();
    let app = router(AppState {
        workspace: Arc::new(Mutex::new(Workspace::open(t.path()).unwrap())),
        token: "t".into(),
        origin: "http://127.0.0.1:1".into(),
    });
    let source = "---\ntitle: 原文\n---\n# Hello 🐱\n";
    let body =
        serde_json::json!({"path":"a.md","content":source,"expected_revision":null}).to_string();
    let request = || {
        Request::builder()
            .method("POST")
            .uri("/api/document")
            .header("host", "127.0.0.1:1")
            .header("x-codora-token", "t")
            .header("content-type", "application/json")
            .body(Body::from(body.clone()))
            .unwrap()
    };
    assert_eq!(
        app.clone().oneshot(request()).await.unwrap().status(),
        StatusCode::OK
    );
    assert_eq!(
        std::fs::read_to_string(t.path().join("a.md")).unwrap(),
        source
    );
    assert_eq!(
        app.oneshot(request()).await.unwrap().status(),
        StatusCode::CONFLICT
    );
}

#[tokio::test]
async fn stale_window_cannot_save_into_another_workspace() {
    let first = tempdir().unwrap();
    let second = tempdir().unwrap();
    let old_scope = codora::core::revision(first.path().to_string_lossy().as_bytes());
    let app = router(AppState {
        workspace: Arc::new(Mutex::new(Workspace::open(first.path()).unwrap())),
        token: "t".into(),
        origin: "http://127.0.0.1:1".into(),
    });
    let request = |route: &str, data: serde_json::Value| {
        Request::builder()
            .method("POST")
            .uri(route)
            .header("host", "127.0.0.1:1")
            .header("x-codora-token", "t")
            .header("x-codora-workspace", &old_scope)
            .header("content-type", "application/json")
            .body(Body::from(data.to_string()))
            .unwrap()
    };
    let changed = app
        .clone()
        .oneshot(request(
            "/api/workspace",
            serde_json::json!({"root":second.path()}),
        ))
        .await
        .unwrap();
    assert_eq!(changed.status(), StatusCode::OK);
    let save = app.oneshot(request("/api/document", serde_json::json!({"path":"a.md", "content":"from old window", "expected_revision":null}))).await.unwrap();
    assert_eq!(save.status(), StatusCode::CONFLICT);
    assert!(!first.path().join("a.md").exists());
    assert!(!second.path().join("a.md").exists());
}

#[tokio::test]
async fn preferences_survive_server_state_recreation() {
    let directory = tempdir().unwrap();
    let make_app = || {
        router(AppState {
            workspace: Arc::new(Mutex::new(Workspace::open(directory.path()).unwrap())),
            token: "t".into(),
            origin: "http://127.0.0.1:1".into(),
        })
    };
    let response = make_app()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/preferences")
                .header("host", "127.0.0.1:1")
                .header("x-codora-token", "t")
                .header("content-type", "application/json")
                .body(Body::from(r#"{"theme":"night","fontSize":20}"#))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(response.status(), StatusCode::OK);
    let response = make_app()
        .oneshot(
            Request::builder()
                .uri("/api/preferences")
                .header("host", "127.0.0.1:1")
                .header("x-codora-token", "t")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    let data: serde_json::Value = serde_json::from_slice(&response_bytes(response).await).unwrap();
    assert_eq!(data["theme"], "night");
    assert_eq!(data["fontSize"], 20);
}

#[tokio::test]
async fn python_execution_requires_authorization_scope_and_explicit_post() {
    let root = tempdir().unwrap();
    let other = tempdir().unwrap();
    std::fs::write(root.path().join("wait.py"), "print('ready')\ninput()\n").unwrap();
    let workspace = Workspace::open(root.path()).unwrap();
    let revision = workspace.read("wait.py").unwrap().revision;
    let app = router(AppState {
        workspace: Arc::new(Mutex::new(workspace)),
        token: "secret".into(),
        origin: "http://127.0.0.1:1".into(),
    });
    let request = |uri: &str, method: &str, body: serde_json::Value| {
        Request::builder()
            .uri(uri)
            .method(method)
            .header("host", "127.0.0.1:1")
            .header("content-type", "application/json")
            .body(Body::from(body.to_string()))
            .unwrap()
    };
    let payload = serde_json::json!({"path":"wait.py", "expected_revision": revision});
    assert_eq!(
        app.clone()
            .oneshot(request("/api/run", "POST", payload.clone()))
            .await
            .unwrap()
            .status(),
        StatusCode::UNAUTHORIZED
    );
    let mut cross_origin = request("/api/run", "POST", payload.clone());
    cross_origin
        .headers_mut()
        .insert("x-codora-token", "secret".parse().unwrap());
    cross_origin
        .headers_mut()
        .insert("origin", "https://other.invalid".parse().unwrap());
    assert_eq!(
        app.clone().oneshot(cross_origin).await.unwrap().status(),
        StatusCode::FORBIDDEN
    );
    let authorized = |uri: &str, body: serde_json::Value| {
        let mut req = request(uri, "POST", body);
        req.headers_mut()
            .insert("x-codora-token", "secret".parse().unwrap());
        req
    };
    let mut stale = authorized("/api/run", payload.clone());
    stale
        .headers_mut()
        .insert("x-codora-workspace", "stale".parse().unwrap());
    assert_eq!(
        app.clone().oneshot(stale).await.unwrap().status(),
        StatusCode::CONFLICT
    );
    let response = app
        .clone()
        .oneshot(authorized("/api/run", payload))
        .await
        .unwrap();
    assert_eq!(response.status(), StatusCode::OK);
    let run: serde_json::Value = serde_json::from_slice(&response_bytes(response).await).unwrap();
    let switch = app
        .clone()
        .oneshot(authorized(
            "/api/workspace",
            serde_json::json!({"root": other.path()}),
        ))
        .await
        .unwrap();
    assert_eq!(switch.status(), StatusCode::BAD_REQUEST);
    let stop = app
        .oneshot(authorized(
            "/api/run/control",
            serde_json::json!({"id": run["id"]}),
        ))
        .await
        .unwrap();
    assert_eq!(stop.status(), StatusCode::OK);
}

#[tokio::test]
async fn appearance_follows_folders_and_restarts_but_paths_do_not() {
    let profile = tempdir().unwrap();
    let first = tempdir().unwrap();
    let second = tempdir().unwrap();
    let session = profile.path().join("session.json");
    let make_app = |root: &std::path::Path| {
        router(AppState {
            workspace: Arc::new(Mutex::new(
                Workspace::open(root)
                    .unwrap()
                    .with_session(session.clone())
                    .unwrap(),
            )),
            token: "t".into(),
            origin: "http://127.0.0.1:1".into(),
        })
    };
    let req = |uri: &str, value: Option<serde_json::Value>| {
        Request::builder()
            .method(if value.is_some() { "POST" } else { "GET" })
            .uri(uri)
            .header("host", "127.0.0.1:1")
            .header("x-codora-token", "t")
            .header("content-type", "application/json")
            .body(Body::from(value.map(|v| v.to_string()).unwrap_or_default()))
            .unwrap()
    };
    let app = make_app(first.path());
    let response = app.clone().oneshot(req("/api/preferences", Some(serde_json::json!({
        "theme":"matrix", "primaryColor":"#123456", "backgroundOpacity":80,
        "language":"en", "recent":["private.md"], "pinned":["private.md"], "customCss":"p {}"
    })))).await.unwrap();
    assert_eq!(response.status(), StatusCode::OK);
    let response = app
        .clone()
        .oneshot(req(
            "/api/workspace",
            Some(serde_json::json!({"root":second.path()})),
        ))
        .await
        .unwrap();
    assert_eq!(response.status(), StatusCode::OK);
    for app in [app, make_app(second.path()), make_app(first.path())] {
        let response = app.oneshot(req("/api/preferences", None)).await.unwrap();
        assert_eq!(response.status(), StatusCode::OK);
        let value: serde_json::Value =
            serde_json::from_slice(&response_bytes(response).await).unwrap();
        assert_eq!(value["theme"], "matrix");
        assert_eq!(value["primaryColor"], "#123456");
        assert_eq!(value["backgroundOpacity"], 80);
        assert_eq!(value["language"], "en");
    }
    let saved: serde_json::Value =
        serde_json::from_slice(&std::fs::read(profile.path().join("appearance.json")).unwrap())
            .unwrap();
    for key in ["recent", "pinned", "customCss"] {
        assert!(saved.get(key).is_none());
    }
    let response = make_app(second.path())
        .oneshot(req("/api/preferences", None))
        .await
        .unwrap();
    let value: serde_json::Value = serde_json::from_slice(&response_bytes(response).await).unwrap();
    assert!(value.get("recent").is_none());
    assert!(value.get("customCss").is_none());
}
