use crate::core::{self, Draft, Error, Save, Search, Workspace};
use axum::{
    Json, Router,
    body::{Body, to_bytes},
    extract::{DefaultBodyLimit, Extension, Query, Request, State},
    http::{HeaderValue, StatusCode, header},
    middleware::{self, Next},
    response::{IntoResponse, Response},
    routing::{get, post},
};
use base64::Engine;
use rust_embed::Embed;
use serde::Deserialize;
use serde_json::{Value, json};
use std::{
    path::PathBuf,
    sync::{Arc, Mutex},
};

#[derive(Embed)]
#[folder = "web/dist/"]
struct Assets;
#[derive(Clone)]
pub struct AppState {
    pub workspace: Arc<Mutex<Workspace>>,
    pub token: String,
    pub origin: String,
}
impl IntoResponse for Error {
    fn into_response(self) -> Response {
        (
            StatusCode::from_u16(self.0).unwrap_or(StatusCode::INTERNAL_SERVER_ERROR),
            Json(json!({"error":self.1})),
        )
            .into_response()
    }
}
fn lock(s: &AppState) -> core::Result<std::sync::MutexGuard<'_, Workspace>> {
    s.workspace
        .lock()
        .map_err(|_| Error(500, "Не удалось получить доступ к рабочей папке".into()))
}
#[derive(Clone)]
struct WorkspaceScope(String);
fn scoped<'a>(
    s: &'a AppState,
    scope: &WorkspaceScope,
) -> core::Result<std::sync::MutexGuard<'a, Workspace>> {
    let workspace = lock(s)?;
    if core::revision(workspace.root.to_string_lossy().as_bytes()) != scope.0 {
        return Err(Error(
            409,
            "Рабочая папка изменена в другом окне. Сохранение остановлено; откройте папку заново."
                .into(),
        ));
    }
    Ok(workspace)
}
async fn guard(State(state): State<AppState>, mut req: Request, next: Next) -> Response {
    let h = req.headers();
    let expected_host = state.origin.trim_start_matches("http://");
    if h.get(header::HOST).and_then(|h| h.to_str().ok()) != Some(expected_host) {
        return Error(403, "Недопустимый адрес сервера".into()).into_response();
    }
    if let Some(origin) = h.get(header::ORIGIN)
        && origin.to_str().ok() != Some(&state.origin)
    {
        return Error(403, "Запрос с другого сайта отклонён".into()).into_response();
    }
    if h.get("sec-fetch-site").is_some_and(|v| v == "cross-site") {
        return Error(403, "Межсайтовый запрос отклонён".into()).into_response();
    }
    if req.uri().path().starts_with("/api/") {
        let supplied = h.get("x-typoha-token").and_then(|s| s.to_str().ok());
        // Images cannot set custom headers. Their capability remains local and referrers are disabled.
        let asset_token = if req.uri().path() == "/api/asset" {
            req.uri()
                .query()
                .and_then(|q| q.split('&').find_map(|part| part.strip_prefix("token=")))
        } else {
            None
        };
        if supplied.or(asset_token) != Some(&state.token) {
            return Error(401, "Откройте ссылку из запущенного Typoha".into()).into_response();
        }
    }
    if req.uri().path().starts_with("/api/") && req.uri().path() != "/api/workspace" {
        let current = match lock(&state) {
            Ok(w) => core::revision(w.root.to_string_lossy().as_bytes()),
            Err(e) => return e.into_response(),
        };
        let asset_scope = if req.uri().path() == "/api/asset" {
            req.uri().query().and_then(|q| {
                q.split('&')
                    .find_map(|part| part.strip_prefix("workspace="))
            })
        } else {
            None
        };
        let supplied = h
            .get("x-typoha-workspace")
            .and_then(|v| v.to_str().ok())
            .or(asset_scope)
            .unwrap_or(&current);
        if supplied != current {
            return Error(409, "Рабочая папка изменена в другом окне. Перезагрузите интерфейс; несохранённый текст доступен в аварийной копии браузера.".into()).into_response();
        }
        let scope = WorkspaceScope(supplied.to_string());
        req.extensions_mut().insert(scope);
    }
    let mut response = next.run(req).await;
    let headers = response.headers_mut();
    headers.insert(
        "x-content-type-options",
        HeaderValue::from_static("nosniff"),
    );
    headers.insert("referrer-policy", HeaderValue::from_static("no-referrer"));
    headers.insert(header::CACHE_CONTROL, HeaderValue::from_static("no-store"));
    headers.insert("content-security-policy",HeaderValue::from_static("default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data: blob:; connect-src 'self'; media-src 'self' blob:; object-src 'none'; frame-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"));
    response
}
pub fn router(state: AppState) -> Router {
    Router::new()
        .route("/api/workspace", get(workspace).post(change_workspace))
        .route("/api/preferences", get(preferences).post(save_preferences))
        .route("/api/files", get(files))
        .route("/api/document", get(document).post(save))
        .route("/api/folder", post(folder))
        .route("/api/rename", post(rename))
        .route("/api/trash", get(trash_list).post(trash))
        .route("/api/restore", post(restore))
        .route("/api/history", get(history))
        .route("/api/snapshot", get(snapshot))
        .route("/api/drafts", get(drafts).post(draft))
        .route("/api/drafts/clear", post(clear_draft))
        .route("/api/search", post(search))
        .route("/api/upload", post(upload))
        .route("/api/asset", get(asset))
        .route("/api/export", post(export))
        .route("/api/import", post(import))
        .fallback(static_asset)
        .layer(DefaultBodyLimit::max(30 * 1024 * 1024))
        .layer(middleware::from_fn_with_state(state.clone(), guard))
        .with_state(state)
}
async fn workspace(State(s): State<AppState>) -> core::Result<Json<Value>> {
    let w = lock(&s)?;
    Ok(Json(
        json!({"root":w.root,"name":w.root.file_name().unwrap_or_default().to_string_lossy(),"id":core::revision(w.root.to_string_lossy().as_bytes()),"version":env!("CARGO_PKG_VERSION")}),
    ))
}
#[derive(Deserialize)]
struct Root {
    root: String,
}
async fn change_workspace(
    State(s): State<AppState>,
    Json(q): Json<Root>,
) -> core::Result<Json<Value>> {
    let workspace = Workspace::open(&q.root)?;
    let root = workspace.root.clone();
    *lock(&s)? = workspace;
    Ok(Json(
        json!({"id":core::revision(root.to_string_lossy().as_bytes()),"root":root}),
    ))
}
async fn preferences(
    State(s): State<AppState>,
    Extension(scope): Extension<WorkspaceScope>,
) -> core::Result<Json<Value>> {
    let path = scoped(&s, &scope)?.metadata_file("config", "preferences.json")?;
    if !path.exists() {
        return Ok(Json(json!({})));
    }
    if std::fs::metadata(&path)?.len() > 256_000 {
        return Err(core::bad("Файл настроек слишком большой"));
    }
    Ok(Json(serde_json::from_slice(&std::fs::read(path)?)?))
}
async fn save_preferences(
    State(s): State<AppState>,
    Extension(scope): Extension<WorkspaceScope>,
    Json(q): Json<Value>,
) -> core::Result<Json<Value>> {
    let bytes = serde_json::to_vec_pretty(&q)?;
    if !q.is_object() || bytes.len() > 256_000 {
        return Err(core::bad("Некорректные настройки"));
    }
    core::atomic_write(
        &scoped(&s, &scope)?
            .internal("config")?
            .join("preferences.json"),
        &bytes,
    )?;
    Ok(Json(json!({"ok":true})))
}
#[derive(Deserialize)]
struct Listing {
    #[serde(default)]
    hidden: bool,
    #[serde(default)]
    all: bool,
}
async fn files(
    State(s): State<AppState>,
    Extension(scope): Extension<WorkspaceScope>,
    Query(q): Query<Listing>,
) -> core::Result<Json<Value>> {
    Ok(Json(json!(scoped(&s, &scope)?.list(q.hidden, q.all)?)))
}
#[derive(Deserialize)]
struct PathQuery {
    path: String,
}
async fn document(
    State(s): State<AppState>,
    Extension(scope): Extension<WorkspaceScope>,
    Query(q): Query<PathQuery>,
) -> core::Result<Json<Value>> {
    Ok(Json(json!(scoped(&s, &scope)?.read(&q.path)?)))
}
async fn save(
    State(s): State<AppState>,
    Extension(scope): Extension<WorkspaceScope>,
    Json(q): Json<Save>,
) -> core::Result<Json<Value>> {
    Ok(Json(json!(scoped(&s, &scope)?.save(q)?)))
}
async fn folder(
    State(s): State<AppState>,
    Extension(scope): Extension<WorkspaceScope>,
    Json(q): Json<PathQuery>,
) -> core::Result<Json<Value>> {
    scoped(&s, &scope)?.mkdir(&q.path)?;
    Ok(Json(json!({"ok":true})))
}
#[derive(Deserialize)]
struct Rename {
    from: String,
    to: String,
}
async fn rename(
    State(s): State<AppState>,
    Extension(scope): Extension<WorkspaceScope>,
    Json(q): Json<Rename>,
) -> core::Result<Json<Value>> {
    scoped(&s, &scope)?.rename(&q.from, &q.to)?;
    Ok(Json(json!({"ok":true})))
}
async fn trash(
    State(s): State<AppState>,
    Extension(scope): Extension<WorkspaceScope>,
    Json(q): Json<PathQuery>,
) -> core::Result<Json<Value>> {
    Ok(Json(json!({"id":scoped(&s, &scope)?.trash(&q.path)?})))
}
async fn trash_list(
    State(s): State<AppState>,
    Extension(scope): Extension<WorkspaceScope>,
) -> core::Result<Json<Value>> {
    Ok(Json(json!(scoped(&s, &scope)?.trash_list()?)))
}
#[derive(Deserialize)]
struct Id {
    id: String,
}
async fn restore(
    State(s): State<AppState>,
    Extension(scope): Extension<WorkspaceScope>,
    Json(q): Json<Id>,
) -> core::Result<Json<Value>> {
    Ok(Json(json!({"path":scoped(&s, &scope)?.restore(&q.id)?})))
}
async fn history(
    State(s): State<AppState>,
    Extension(scope): Extension<WorkspaceScope>,
    Query(q): Query<PathQuery>,
) -> core::Result<Json<Value>> {
    Ok(Json(json!(scoped(&s, &scope)?.history(&q.path)?)))
}
#[derive(Deserialize)]
struct SnapshotQuery {
    path: String,
    id: String,
}
async fn snapshot(
    State(s): State<AppState>,
    Extension(scope): Extension<WorkspaceScope>,
    Query(q): Query<SnapshotQuery>,
) -> core::Result<Json<Value>> {
    Ok(Json(
        json!({"content":scoped(&s, &scope)?.snapshot(&q.path,&q.id)?}),
    ))
}
async fn draft(
    State(s): State<AppState>,
    Extension(scope): Extension<WorkspaceScope>,
    Json(q): Json<Draft>,
) -> core::Result<Json<Value>> {
    scoped(&s, &scope)?.save_draft(&q)?;
    Ok(Json(json!({"ok":true})))
}
async fn drafts(
    State(s): State<AppState>,
    Extension(scope): Extension<WorkspaceScope>,
) -> core::Result<Json<Value>> {
    Ok(Json(json!(scoped(&s, &scope)?.drafts()?)))
}
async fn clear_draft(
    State(s): State<AppState>,
    Extension(scope): Extension<WorkspaceScope>,
    Json(q): Json<Id>,
) -> core::Result<Json<Value>> {
    scoped(&s, &scope)?.clear_draft(&q.id)?;
    Ok(Json(json!({"ok":true})))
}
async fn search(
    State(s): State<AppState>,
    Extension(scope): Extension<WorkspaceScope>,
    Json(q): Json<Search>,
) -> core::Result<Json<Value>> {
    let w = scoped(&s, &scope)?.clone();
    tokio::task::spawn_blocking(move || w.search(&q))
        .await
        .map_err(|e| Error(500, e.to_string()))?
        .map(|v| Json(json!(v)))
}
#[derive(Deserialize)]
struct Upload {
    name: String,
    data: String,
}
async fn upload(
    State(s): State<AppState>,
    Extension(scope): Extension<WorkspaceScope>,
    Json(q): Json<Upload>,
) -> core::Result<Json<Value>> {
    let bytes = base64::engine::general_purpose::STANDARD
        .decode(q.data)
        .map_err(|_| core::bad("Неверное изображение"))?;
    Ok(Json(
        json!({"path":scoped(&s, &scope)?.upload(&q.name,&bytes)?}),
    ))
}
async fn asset(
    State(s): State<AppState>,
    Extension(scope): Extension<WorkspaceScope>,
    Query(q): Query<PathQuery>,
) -> core::Result<Response> {
    let w = scoped(&s, &scope)?;
    let path = w.resolve(&q.path)?;
    let mime = mime_guess::from_path(&path).first_or_octet_stream();
    if ![
        "image/png",
        "image/jpeg",
        "image/gif",
        "image/webp",
        "image/avif",
    ]
    .contains(&mime.as_ref())
    {
        return Err(core::bad("Тип изображения не поддерживается"));
    }
    if std::fs::metadata(&path)?.len() > 20 * 1024 * 1024 {
        return Err(core::bad("Изображение больше 20 МБ"));
    }
    Ok((
        [(header::CONTENT_TYPE, mime.as_ref().to_string())],
        std::fs::read(path)?,
    )
        .into_response())
}
#[derive(Deserialize)]
struct Export {
    content: String,
    format: String,
}
async fn export(Json(q): Json<Export>) -> core::Result<Response> {
    let allowed = [
        "docx",
        "odt",
        "rtf",
        "epub",
        "latex",
        "mediawiki",
        "rst",
        "textile",
        "opml",
        "revealjs",
        "commonmark",
        "html",
    ];
    if !allowed.contains(&q.format.as_str()) {
        return Err(core::bad("Неизвестный формат"));
    }
    convert(q.content.into_bytes(), "markdown".into(), q.format.clone())
        .await
        .map(|data| {
            (
                [
                    (header::CONTENT_TYPE, "application/octet-stream"),
                    (header::CONTENT_DISPOSITION, "attachment"),
                ],
                data,
            )
                .into_response()
        })
}
#[derive(Deserialize)]
struct Import {
    data: String,
    format: String,
}
async fn import(Json(q): Json<Import>) -> core::Result<Json<Value>> {
    if ![
        "docx",
        "odt",
        "rtf",
        "epub",
        "html",
        "rst",
        "latex",
        "mediawiki",
    ]
    .contains(&q.format.as_str())
    {
        return Err(core::bad("Неизвестный формат импорта"));
    }
    let bytes = base64::engine::general_purpose::STANDARD
        .decode(q.data)
        .map_err(|_| core::bad("Неверные данные"))?;
    let data = convert(bytes, q.format, "markdown".into()).await?;
    Ok(Json(
        json!({"content":String::from_utf8(data).map_err(|_|core::bad("Не удалось прочитать результат"))?}),
    ))
}
async fn convert(bytes: Vec<u8>, from: String, to: String) -> core::Result<Vec<u8>> {
    use std::process::Stdio;
    use tokio::io::AsyncWriteExt;
    let mut child = tokio::process::Command::new("pandoc")
        .args(["--sandbox", "--from", &from, "--to", &to])
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .kill_on_drop(true)
        .spawn()
        .map_err(|_| {
            Error(
                503,
                "Этот формат требует установленного Pandoc в PATH".into(),
            )
        })?;
    let mut stdin = child
        .stdin
        .take()
        .ok_or_else(|| core::bad("Pandoc: нет потока ввода"))?;
    let writer = tokio::spawn(async move {
        let result = stdin.write_all(&bytes).await;
        drop(stdin);
        result
    });
    let output = tokio::time::timeout(std::time::Duration::from_secs(60), child.wait_with_output())
        .await
        .map_err(|_| Error(504, "Pandoc превысил время ожидания".into()))??;
    writer.await.map_err(|e| Error(500, e.to_string()))??;
    if !output.status.success() {
        return Err(Error(
            422,
            format!(
                "Pandoc: {}",
                String::from_utf8_lossy(&output.stderr)
                    .chars()
                    .take(1500)
                    .collect::<String>()
            ),
        ));
    }
    Ok(output.stdout)
}
async fn static_asset(req: Request) -> Response {
    if req.method() != axum::http::Method::GET {
        return StatusCode::METHOD_NOT_ALLOWED.into_response();
    }
    let path = req.uri().path().trim_start_matches('/');
    let path = if path.is_empty() { "index.html" } else { path };
    match Assets::get(path) {
        Some(file) => (
            [(
                header::CONTENT_TYPE,
                mime_guess::from_path(path)
                    .first_or_octet_stream()
                    .as_ref()
                    .to_string(),
            )],
            Body::from(file.data.into_owned()),
        )
            .into_response(),
        None => StatusCode::NOT_FOUND.into_response(),
    }
}
// A small direct HTTP client for smoke tests can use this helper without a network listener.
pub async fn response_bytes(response: Response) -> Vec<u8> {
    to_bytes(response.into_body(), 32 * 1024 * 1024)
        .await
        .unwrap_or_default()
        .to_vec()
}
pub fn initial_workspace(path: PathBuf) -> core::Result<Workspace> {
    Workspace::open(path)
}
