use axum::{
    body::Body,
    http::{Request, StatusCode},
};
use std::sync::{Arc, Mutex};
use tempfile::tempdir;
use tower::ServiceExt;
use typoha::{
    core::Workspace,
    server::{AppState, response_bytes, router},
};
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
                    .header("x-typoha-token", "test-secret")
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
                    .header("x-typoha-token", "test-secret")
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
                .header("x-typoha-token", "test-secret")
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
            .header("x-typoha-token", "t")
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
