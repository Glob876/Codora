//! Local Pandoc conversion shared by the desktop API and terminal UI.
use crate::core::{self, Error};

pub async fn convert(bytes: Vec<u8>, from: String, to: String) -> core::Result<Vec<u8>> {
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
