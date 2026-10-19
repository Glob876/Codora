#![cfg(feature = "web")]

use std::{
    io::{BufRead, BufReader},
    process::{Command, Stdio},
    time::{Duration, Instant},
};

#[test]
fn desktop_handshake_and_parent_disconnect() {
    let root = tempfile::tempdir().unwrap();
    let mut child = Command::new(env!("CARGO_BIN_EXE_codora"))
        .arg(root.path())
        .arg("--desktop")
        .arg("--session-file")
        .arg(root.path().join("session.json"))
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .spawn()
        .unwrap();
    let mut line = String::new();
    BufReader::new(child.stdout.take().unwrap())
        .read_line(&mut line)
        .unwrap();
    let handshake: serde_json::Value = serde_json::from_str(&line).unwrap();
    let url = handshake["url"].as_str().unwrap();
    assert!(url.starts_with("http://127.0.0.1:"));
    let token = url.split("/#").nth(1).unwrap();
    assert_eq!(token.len(), 64);
    assert!(token.bytes().all(|c| c.is_ascii_hexdigit()));
    // Desktop crash/close closes the pipe. The server must not remain orphaned.
    drop(child.stdin.take());
    let deadline = Instant::now() + Duration::from_secs(5);
    loop {
        if let Some(status) = child.try_wait().unwrap() {
            assert!(status.success());
            break;
        }
        if Instant::now() >= deadline {
            child.kill().unwrap();
            child.wait().unwrap();
            panic!("desktop server survived parent disconnect");
        }
        std::thread::sleep(Duration::from_millis(20));
    }
}

#[test]
fn restart_restores_folder_selected_through_api_and_explicit_root_wins() {
    use std::io::{Read, Write};
    let config = tempfile::tempdir().unwrap();
    let first = tempfile::tempdir().unwrap();
    let second = tempfile::tempdir().unwrap();
    let session = config.path().join("session.json");
    let start = |root: Option<&std::path::Path>| {
        let mut cmd = Command::new(env!("CARGO_BIN_EXE_codora"));
        cmd.args(["--desktop", "--session-file"])
            .arg(&session)
            .arg("--fallback-workspace")
            .arg(first.path());
        if let Some(root) = root {
            cmd.arg(root);
        }
        let mut child = cmd
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .spawn()
            .unwrap();
        let mut line = String::new();
        BufReader::new(child.stdout.take().unwrap())
            .read_line(&mut line)
            .unwrap();
        let value: serde_json::Value = serde_json::from_str(&line).unwrap();
        let url = value["url"].as_str().unwrap().to_owned();
        (child, url)
    };
    let request = |url: &str, root: Option<&std::path::Path>| {
        let (address, token) = url
            .strip_prefix("http://")
            .unwrap()
            .split_once("/#")
            .unwrap();
        let mut stream = std::net::TcpStream::connect(address).unwrap();
        stream
            .set_read_timeout(Some(Duration::from_secs(5)))
            .unwrap();
        let body = root
            .map(|root| serde_json::json!({"root":root}).to_string())
            .unwrap_or_default();
        let method = if root.is_some() { "POST" } else { "GET" };
        write!(stream, "{method} /api/workspace HTTP/1.1\r\nHost: {address}\r\nx-codora-token: {token}\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{body}", body.len()).unwrap();
        let mut response = String::new();
        stream.read_to_string(&mut response).unwrap();
        assert!(response.starts_with("HTTP/1.1 200"), "{response}");
        serde_json::from_str::<serde_json::Value>(response.split_once("\r\n\r\n").unwrap().1)
            .unwrap()
    };
    let (mut child, url) = start(Some(first.path()));
    request(&url, Some(second.path()));
    drop(child.stdin.take());
    assert!(child.wait().unwrap().success());
    let (mut child, url) = start(None);
    let restored = request(&url, None);
    assert_eq!(
        restored["root"],
        second.path().canonicalize().unwrap().to_str().unwrap()
    );
    assert_eq!(restored["restored"], true);
    drop(child.stdin.take());
    assert!(child.wait().unwrap().success());
    let (mut child, url) = start(Some(first.path()));
    assert_eq!(
        request(&url, None)["root"],
        first.path().canonicalize().unwrap().to_str().unwrap()
    );
    drop(child.stdin.take());
    assert!(child.wait().unwrap().success());
}
