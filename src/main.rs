#[cfg(feature = "web")]
use codora::{
    core::Workspace,
    server::{AppState, router},
};
#[cfg(feature = "web")]
use std::{
    io::{Read, Write},
    path::PathBuf,
    sync::{Arc, Mutex},
};
#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args: Vec<String> = std::env::args().skip(1).collect();
    if args
        .first()
        .is_some_and(|a| a == "console" || a == "--console")
    {
        return codora::console::run(&args[1..]).await;
    }
    #[cfg(feature = "web")]
    return web_main().await;
    #[cfg(not(feature = "web"))]
    Err("This build supports: codora console [folder] [file ...]".into())
}
#[cfg(feature = "web")]
async fn web_main() -> Result<(), Box<dyn std::error::Error>> {
    let mut args = std::env::args().skip(1);
    let mut root = None;
    let mut session_file = codora::session::default_path();
    let mut fallback = None;
    let mut port = 0u16;
    let mut open = true;
    let mut desktop = false;
    while let Some(arg) = args.next() {
        match arg.as_str() {
            "--session-file" => {
                session_file = Some(PathBuf::from(
                    args.next().ok_or("--session-file требует путь")?,
                ))
            }
            "--fallback-workspace" => {
                fallback = Some(PathBuf::from(
                    args.next().ok_or("--fallback-workspace требует путь")?,
                ))
            }
            "--port" => port = args.next().ok_or("--port требует номер")?.parse()?,
            "--no-open" => open = false,
            "--desktop" => {
                desktop = true;
                open = false;
            }
            "--help" | "-h" => {
                println!(
                    "Codora {}\nТерминал: codora console [папка] [файл ...]\nИспользование: codora [папка] [--port 4321] [--no-open]\nСервер доступен только через 127.0.0.1, файлы остаются на компьютере.",
                    env!("CARGO_PKG_VERSION")
                );
                return Ok(());
            }
            _ if arg.starts_with('-') => return Err(format!("Неизвестный параметр {arg}").into()),
            _ => root = Some(PathBuf::from(arg)),
        }
    }
    let remembered = if root.is_none() {
        session_file
            .as_deref()
            .map(codora::session::restore)
            .transpose()
            .map_err(|e| e.1)?
            .flatten()
    } else {
        None
    };
    let restored = remembered.is_some();
    let root = root
        .or(remembered)
        .or(fallback)
        .unwrap_or(std::env::current_dir()?);
    let mut workspace = Workspace::open(&root).map_err(|e| e.1)?;
    if let Some(path) = session_file {
        workspace = workspace.with_session(path).map_err(|e| e.1)?;
    }
    workspace.restored = restored;
    let listener = tokio::net::TcpListener::bind((std::net::Ipv4Addr::LOCALHOST, port)).await?;
    let address = listener.local_addr()?;
    let origin = format!("http://{address}");
    let token = format!(
        "{}{}",
        uuid::Uuid::new_v4().simple(),
        uuid::Uuid::new_v4().simple()
    );
    let url = format!("{origin}/#{token}");
    if desktop {
        // Private pipe to the desktop parent; never persisted in a browser profile.
        println!("{}", serde_json::json!({ "url": url }));
        std::io::stdout().flush()?;
    } else {
        println!(
            "Codora {} — {}\nОткройте локально: {url}\nCtrl+C — остановить. Ссылка даёт доступ к открытой папке: не передавайте её другим.",
            env!("CARGO_PKG_VERSION"),
            workspace.root.display()
        );
    }
    if open {
        open_window(&url);
    }
    let state = AppState {
        workspace: Arc::new(Mutex::new(workspace)),
        token,
        origin,
    };
    let (parent_closed, parent_gone) = tokio::sync::oneshot::channel::<()>();
    if desktop {
        std::thread::spawn(move || {
            let mut byte = [0u8; 1];
            while matches!(std::io::stdin().read(&mut byte), Ok(n) if n > 0) {}
            let _ = parent_closed.send(());
        });
    }
    axum::serve(listener, router(state))
        .with_graceful_shutdown(async move {
            if desktop {
                tokio::select! {
                    _ = tokio::signal::ctrl_c() => {},
                    _ = parent_gone => {},
                }
            } else {
                let _ = tokio::signal::ctrl_c().await;
            }
        })
        .await?;
    Ok(())
}
#[cfg(feature = "web")]
fn open_window(url: &str) {
    // Existing browsers only. The application does not install or download a runtime.
    for browser in [
        "chromium",
        "chromium-browser",
        "google-chrome",
        "google-chrome-stable",
        "microsoft-edge",
    ] {
        if std::process::Command::new(browser)
            .arg(format!("--app={url}"))
            .spawn()
            .is_ok()
        {
            return;
        }
    }
    #[cfg(target_os = "linux")]
    let _ = std::process::Command::new("xdg-open").arg(url).spawn();
    #[cfg(target_os = "macos")]
    let _ = std::process::Command::new("open").arg(url).spawn();
    #[cfg(target_os = "windows")]
    let _ = std::process::Command::new("rundll32")
        .args(["url.dll,FileProtocolHandler", url])
        .spawn();
}
