#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    let args: Vec<String> = std::env::args().collect();
    if let Some(index) = args.iter().position(|a| a == "--selftest") {
        let target = args
            .get(index + 1)
            .cloned()
            .unwrap_or_else(|| "selftest.html".to_string());
        let ok = livepage_studio_lib::selftest(&target);
        println!("selftest: {}", if ok { "ok" } else { "failed" });
        std::process::exit(if ok { 0 } else { 1 });
    }
    livepage_studio_lib::run()
}
