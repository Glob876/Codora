fn main() {
    println!("cargo:rerun-if-changed=build.rs");
    if cfg!(feature = "web") {
        println!("cargo:rerun-if-changed=web/dist");
    }
}
