use std::{
    path::PathBuf,
    sync::{Arc, Mutex},
};
use typoha::{
    core::Workspace,
    server::{AppState, router},
};
#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let mut args = std::env::args().skip(1);
    let mut root = None;
    let mut port = 0u16;
    let mut open = true;
    while let Some(arg) = args.next() {
        match arg.as_str() {
            "--port" => port = args.next().ok_or("--port требует номер")?.parse()?,
            "--no-open" => open = false,
            "--help" | "-h" => {
                println!(
                    "Typoha {}\nИспользование: typoha [папка] [--port 4321] [--no-open]\nСервер доступен только через 127.0.0.1, файлы остаются на компьютере.",
                    env!("CARGO_PKG_VERSION")
                );
                return Ok(());
            }
            _ if arg.starts_with('-') => return Err(format!("Неизвестный параметр {arg}").into()),
            _ => root = Some(PathBuf::from(arg)),
        }
    }
    let root = root.unwrap_or(std::env::current_dir()?);
    let workspace = Workspace::open(&root).map_err(|e| e.1)?;
    let listener = tokio::net::TcpListener::bind((std::net::Ipv4Addr::LOCALHOST, port)).await?;
    let address = listener.local_addr()?;
    let origin = format!("http://{address}");
    let token = format!(
        "{}{}",
        uuid::Uuid::new_v4().simple(),
        uuid::Uuid::new_v4().simple()
    );
    let url = format!("{origin}/#{token}");
    println!(
        "Typoha {} — {}\nОткройте локально: {url}\nCtrl+C — остановить. Ссылка даёт доступ к открытой папке: не передавайте её другим.",
        env!("CARGO_PKG_VERSION"),
        workspace.root.display()
    );
    if open {
        open_window(&url);
    }
    let state = AppState {
        workspace: Arc::new(Mutex::new(workspace)),
        token,
        origin,
    };
    axum::serve(listener, router(state))
        .with_graceful_shutdown(async {
            let _ = tokio::signal::ctrl_c().await;
        })
        .await?;
    Ok(())
}
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
