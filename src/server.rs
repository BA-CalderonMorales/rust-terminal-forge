use warp::Filter;
use serde::{Deserialize, Serialize};
use serde_json::json;
use log::{info, error, debug};
use std::convert::Infallible;

#[derive(Debug, Deserialize)]
struct ExecuteRequest {
    command: String,
}

#[derive(Debug, Serialize)]
struct ExecuteResponse {
    output: String,
    exit_code: i32,
    timestamp: String,
}

#[tokio::main]
async fn main() {
    env_logger::Builder::from_default_env()
        .filter_level(log::LevelFilter::Debug)
        .init();
    
    info!("🚀 Rick's Rust Backend Server Starting...");
    info!("🔧 Initializing MAXIMUM LOGGING for interdimensional debugging!");
    
    // CORS configuration with logging
    info!("🌐 Setting up CORS for interdimensional communication...");
    let cors = warp::cors()
        .allow_any_origin()
        .allow_headers(vec!["content-type"])
        .allow_methods(vec!["GET", "POST", "OPTIONS"]);

    // Serve static files from dist directory with logging
    info!("📁 Setting up static file serving from ./dist/");
    let static_files = warp::path::end()
        .and(warp::fs::file("dist/index.html"))
        .map(|reply| {
            info!("📄 Serving index.html to client");
            reply
        })
        .or(warp::fs::dir("dist")
            .map(|reply| {
                info!("📄 Serving static file from dist/");
                reply
            }));

    // API routes
    let api = warp::path("api");
    
    // Execute endpoint with request logging
    let execute = api
        .and(warp::path("execute"))
        .and(warp::post())
        .and(warp::body::json())
        .map(|req: ExecuteRequest| {
            info!("📨 Received execute request: {:?}", req);
            req
        })
        .and_then(handle_execute);

    // Health check with logging
    let health = api
        .and(warp::path("health"))
        .and(warp::get())
        .map(|| {
            info!("💊 Health check requested - Rick's backend is ALIVE!");
            warp::reply::json(&json!({
                "status": "ok",
                "message": "Rick's Rust backend is ALIVE! Wubba Lubba Dub Dub!",
                "timestamp": chrono::Utc::now().to_rfc3339()
            }))
        });

    // Add request logging filter
    let log_requests = warp::log::custom(|info| {
        info!("🌐 {} {} {:?} - Status: {} - Duration: {:?}", 
            info.method(), 
            info.path(), 
            info.version(), 
            info.status().as_u16(),
            info.elapsed()
        );
    });
    
    // Combine all routes with comprehensive logging
    let routes = static_files
        .or(execute)
        .or(health)
        .with(cors)
        .with(log_requests)
        .recover(handle_rejection);

    info!("🔥 Backend server running on port 3001");
    info!("📁 Serving static files from ./dist/");
    info!("🌐 API available at http://localhost:3001/api/");
    info!("💊 Health check at http://localhost:3001/api/health");
    info!("🐛 DEBUG MODE: All requests will be logged extensively");
    info!("🚀 Ready to receive interdimensional communications!");
    
    warp::serve(routes)
        .run(([0, 0, 0, 0], 3001))
        .await;
}

async fn handle_execute(req: ExecuteRequest) -> Result<impl warp::Reply, warp::Rejection> {
    info!("🧪 EXECUTE REQUEST START: {:?}", req);
    info!("📝 Command length: {} chars", req.command.len());
    info!("🔍 Command content: '{}'", req.command);
    
    // For now, just echo back the command with Rick's style
    let output = format!(
        "🧪 Rick's Rust Terminal Processed: {}\n\
        Wubba Lubba Dub Dub! Command executed in interdimensional Rust space!\n\
        (This is a simulation until we hook up the real command processor)\n\
        📊 Request processed at: {}",
        req.command,
        chrono::Utc::now().format("%Y-%m-%d %H:%M:%S UTC")
    );
    
    let response = ExecuteResponse {
        output: output.clone(),
        exit_code: 0,
        timestamp: chrono::Utc::now().to_rfc3339(),
    };
    
    info!("✅ EXECUTE RESPONSE: exit_code={}, output_length={}", response.exit_code, response.output.len());
    debug!("📤 Full response: {:?}", response);
    
    Ok(warp::reply::json(&response))
}

// Add error handling
async fn handle_rejection(err: warp::Rejection) -> Result<impl warp::Reply, Infallible> {
    error!("🚨 Request rejection: {:?}", err);
    
    let code;
    let message;
    
    if err.is_not_found() {
        code = warp::http::StatusCode::NOT_FOUND;
        message = "🔍 Rick says: Path not found in this dimension!";
    } else if let Some(_) = err.find::<warp::filters::body::BodyDeserializeError>() {
        code = warp::http::StatusCode::BAD_REQUEST;
        message = "🧪 Rick says: Invalid JSON, Morty!";
    } else if let Some(_) = err.find::<warp::reject::MethodNotAllowed>() {
        code = warp::http::StatusCode::METHOD_NOT_ALLOWED;
        message = "🚫 Rick says: Method not allowed in this universe!";
    } else {
        error!("🚨 Unhandled rejection: {:?}", err);
        code = warp::http::StatusCode::INTERNAL_SERVER_ERROR;
        message = "💥 Rick says: Something went wrong in the multiverse!";
    }
    
    let json = warp::reply::json(&json!({
        "error": message,
        "status": code.as_u16(),
        "timestamp": chrono::Utc::now().to_rfc3339()
    }));
    
    Ok(warp::reply::with_status(json, code))
}