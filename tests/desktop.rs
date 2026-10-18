use std::{
    io::{BufRead, BufReader},
    process::{Command, Stdio},
    time::{Duration, Instant},
};

#[test]
fn desktop_handshake_and_parent_disconnect() {
    let root = tempfile::tempdir().unwrap();
    let mut child = Command::new(env!("CARGO_BIN_EXE_typoha"))
        .arg(root.path())
        .arg("--desktop")
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
