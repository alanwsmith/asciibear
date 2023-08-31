#![allow(warnings)]
use axum::extract::ws::Message;
use axum::extract::ws::WebSocket;
use axum::extract::ws::WebSocketUpgrade;
use axum::extract::State;
use axum::response::IntoResponse;
use axum::routing::get;
use axum::Router;
use cpal::traits::DeviceTrait;
use cpal::traits::HostTrait;
use cpal::traits::StreamTrait;
use device_query::{DeviceEvents, DeviceState};
use futures::sink::SinkExt;
use futures::stream::StreamExt;
use nom::branch::alt;
use nom::bytes::complete::is_not;
use nom::bytes::complete::tag;
use nom::bytes::complete::tag_no_case;
use nom::bytes::complete::take_until;
use nom::bytes::complete::take_while_m_n;
use nom::character::complete::hex_digit0;
use nom::character::complete::space0;
use nom::character::complete::space1;
use nom::combinator::eof;
use nom::combinator::map_res;
use nom::combinator::opt;
use nom::combinator::rest;
use nom::multi::many1;
use nom::multi::separated_list1;
use nom::sequence::pair;
use nom::sequence::preceded;
use nom::sequence::tuple;
use nom::sequence::Tuple;
use nom::IResult;
use nom::Parser;
use opencv::videostab::NullFrameSource;
use serde::Deserialize;
use serde::Serialize;
use std::net::SocketAddr;
use std::sync::Arc;
use tokio::sync::broadcast;
use tower_http::services::ServeDir;
// use tower_livereload::LiveReloadLayer;
// use asciibear::connection::Connection;
// use asciibear::screen_capture::screen_capture;
use axum::response::Html;
use twitch_irc::login::StaticLoginCredentials;
use twitch_irc::ClientConfig;
use twitch_irc::SecureTCPTransport;
use twitch_irc::TwitchIRCClient;
// use std::fmt::Display;
// use std::future::Future;
// use tokio::net::TcpListener;
// use tokio::sync::mpsc::UnboundedSender;
// use asciibear::helpers::spawn;
// use asciibear::stream_manager::start;
use axum::{
    body::{Bytes, Full},
    // response::Html,
    response::Response,
    // routing::get,
    // Router,
};
use std::collections::HashSet;
use std::fs;
use std::sync::Mutex;
extern crate color_name;
use color_name::Color;

struct AppState {
    tx: broadcast::Sender<String>,
}

#[tokio::main]
async fn main() {
    let (tx, _rx) = broadcast::channel(100);
    let _mic_listener_handle = tokio::spawn(mic_listener(tx.clone()));
    let _key_watcher_handle = tokio::spawn(key_watcher(tx.clone()));
    let _mouse_watcher_handle = tokio::spawn(mouse_watcher(tx.clone()));
    let _twitch_handle = tokio::spawn(twitch_listener(tx.clone()));
    // THESE WORK BUT ARE OFF RIGHT NOW UNTIL THE
    // WEB PAGE IS SETUP TO DEAL WITH THEM
    // let _rtmp_server = tokio::spawn(rtmp_server());
    // let _screen_capture = tokio::spawn(screen_capture(tx.clone()));
    let app_state = Arc::new(AppState { tx });
    let app = Router::new()
        .route("/ws", get(page_websocket_handler))
        .nest_service("/", ServeDir::new("html"))
        // .route("/", get(index))
        // .route("/script.js", get(scriptjs))
        // .route("/xstate.js", get(xstate))
        // .route("/lodash.js", get(lodash))
        // .route("/bears.json", get(bears))
        // .layer(LiveReloadLayer::new())
        .with_state(app_state);
    let addr = SocketAddr::from(([127, 0, 0, 1], 3302));
    let _ = axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await;
}

// async fn lodash() -> Response<Full<Bytes>> {
//     Response::builder()
//         .header("Content-Type", "text/javascript")
//         .body(Full::from(
//             fs::read_to_string("html/lodash_4_17_15.min.js").unwrap(),
//         ))
//         .unwrap()
// }

// async fn scriptjs() -> Response<Full<Bytes>> {
//     Response::builder()
//         .header("Content-Type", "text/javascript")
//         .body(Full::from(fs::read_to_string("html/script.js").unwrap()))
//         .unwrap()
// }

// async fn index() -> Html<&'static str> {
//     Html(std::include_str!("../html/index.html"))
// }

// async fn scriptjs() -> Html<&'static str> {
//     Html(std::include_str!("../html/script.js"))
// }

// async fn xstate() -> Html<&'static str> {
//     Html(std::include_str!("../html/xstate.js"))
// }

// async fn lodash() -> Html<&'static str> {
//     Html(std::include_str!("../html/lodash_4_17_15.min.js"))
// }

async fn bears() -> Html<&'static str> {
    Html(std::include_str!("../html/bears.json"))
}

async fn key_watcher(tx: tokio::sync::broadcast::Sender<String>) {
    dbg!("key_watcher connection");
    let device_state = DeviceState::new();
    let _guard = device_state.on_key_down(move |_| {
        let payload = r#"{"key": "key", "value": "HIDDEN_FOR_SECURITY"}"#.to_string();
        let _ = tx.send(payload);
    });
    std::thread::sleep(std::time::Duration::from_secs(32536000));
}

async fn mic_listener(tx: tokio::sync::broadcast::Sender<String>) {
    dbg!("mic_listener connection");
    let mut mic_throttle = Arc::new(Mutex::new(0_u32));
    let host = cpal::default_host();
    let device = host
        .default_input_device()
        .expect("no input device available");
    let config: cpal::StreamConfig = device.default_input_config().unwrap().into();
    let input_sender = move |data: &[f32], _cb: &cpal::InputCallbackInfo| {
        let check_throttle = mic_throttle.clone();
        let mut throttle_count = check_throttle.lock().unwrap();
        *throttle_count += 1;
        if throttle_count.rem_euclid(3) == 0 {
            let x: f32 = data[0];
            let mut payload = r#"{"key": "db", "value": "#.to_string();
            payload.push_str(x.to_string().as_str());
            payload.push_str(r#"}"#);
            let _ = tx.send(payload);
        }
    };
    let input_stream = device
        .build_input_stream(&config, input_sender, err_fn, None)
        .unwrap();
    let _ = input_stream.play();
    std::thread::sleep(std::time::Duration::from_secs(32536000));
}

async fn page_websocket_handler(
    ws: WebSocketUpgrade,
    State(state): State<Arc<AppState>>,
) -> impl IntoResponse {
    ws.on_upgrade(|socket| page_websocket(socket, state))
}

async fn page_websocket(stream: WebSocket, state: Arc<AppState>) {
    dbg!("page_websocket connection");
    let (mut sender, mut _receiver) = stream.split();
    let mut rx = state.tx.subscribe();
    let _send_task = tokio::spawn(async move {
        while let Ok(msg) = rx.recv().await {
            if sender.send(Message::Text(msg)).await.is_err() {
                break;
            }
        }
    });
}

#[derive(Debug, PartialEq, Serialize, Deserialize)]
#[serde(tag = "key", content = "value", rename_all = "lowercase")]
pub enum MouseSend {
    MouseMove(i32, i32),
}

async fn mouse_watcher(tx: tokio::sync::broadcast::Sender<String>) {
    dbg!("mouse_watcher connection");
    let mut counterrrr = Arc::new(Mutex::new(0_u32));
    let device_state = DeviceState::new();
    let _guard = device_state.on_mouse_move(move |x| {
        let internal_c = counterrrr.clone();
        let mut changer = internal_c.lock().unwrap();
        *changer += 1;
        if changer.rem_euclid(30) == 0 {
            let payload = MouseSend::MouseMove(x.0, x.1);
            let package = serde_json::to_string(&payload).unwrap();
            let _ = tx.send(package);
        }
    });
    std::thread::sleep(std::time::Duration::from_secs(32536000));
}

pub fn parse_incoming_twitch_message(source: &str) -> IResult<&str, Option<Vec<TwitchCommand>>> {
    let (source, cmd) = opt(many1(alt((bear_color, bear_color))))(source)?;
    dbg!(&cmd);
    Ok((source, cmd))
}

async fn twitch_listener(tx: tokio::sync::broadcast::Sender<String>) {
    let config = ClientConfig::default();
    let (mut incoming_messages, client) =
        TwitchIRCClient::<SecureTCPTransport, StaticLoginCredentials>::new(config);
    let join_handle = tokio::spawn(async move {
        let mut said_hello_to: HashSet<String> = HashSet::new();
        while let Some(message) = incoming_messages.recv().await {
            match message {
                twitch_irc::message::ServerMessage::Privmsg(payload) => {
                    if !said_hello_to.contains(&payload.sender.name) {
                        said_hello_to.insert(payload.clone().sender.name);
                        let tbs =
                            TwitchCommand::SayHi(format!("Hi {}!", payload.clone().sender.name));
                        let _ = tx.send(serde_json::to_string(&tbs).unwrap());
                    }
                    if let Some(twitch_commands) =
                        parse_incoming_twitch_message(payload.clone().message_text.as_str())
                            .unwrap()
                            .1
                    {
                        twitch_commands.into_iter().for_each(|tc| {
                            let _ = tx.send(serde_json::to_string(&tc).unwrap());
                        })
                    }
                }
                _ => {}
            }
        }
    });
    client.join("theidofalan".to_owned()).unwrap();
    join_handle.await.unwrap();
}

#[derive(Debug, PartialEq, Serialize, Deserialize)]
#[serde(tag = "key", content = "value", rename_all = "lowercase")]
pub enum TwitchCommand {
    BearColorHead([u8; 3]),
    BearColorKeys([u8; 3]),
    BearColorEyes([u8; 3]),
    BearColorBody([u8; 3]),
    SayHi(String),
}

// #[derive(Debug, PartialEq, Serialize, Deserialize)]
// #[serde(tag = "key", content = "value", rename_all = "lowercase")]
// pub enum TwitchCommand {
//     Body(Option<String>),
//     Eyes(Option<String>),
//     Head(Option<String>),
//     Keys(Option<String>),
//     None,
// }

// fn bear_colors(source: &str) -> IResult<&str, TwitchCommand> {
//     let (source, cmds) =
//         preceded(tag_no_case("!bear "), separated_list1(tag(","), bear_color))(source)?;
//     dbg!(&cmds);
//     Ok((source, TwitchCommand::TwitchCommands(cmds)))
// }

fn bear_color(source: &str) -> IResult<&str, TwitchCommand> {
    let (source, color) = alt((
        bear_color_head,
        bear_color_eyes,
        bear_color_keys,
        bear_color_body,
    ))(source)?;
    // let (source, cmd) = tuple((tag("!"), body_part, space1, get_color_by_name))(source)?;
    // match cmd.2 {
    //     Some(rgb_data) => Ok((source, BearCommand::Color((cmd.0, cmd.2.unwrap())))),
    //     None => Ok((source, BearCommand::None)),
    // }
    Ok((source, color))
}

// #[derive(Debug, PartialEq, Serialize, Deserialize)]
// #[serde(tag = "key", content = "value", rename_all = "lowercase")]
// pub enum TwitchCommand {
//     Head,
//     Body,
//     Keys,
//     Eyes,
//     None,
// }

// #[derive(Debug, PartialEq, Serialize, Deserialize)]
// #[serde(tag = "key", content = "value", rename_all = "lowercase")]
// pub enum BearCommand {
//     Color((TwitchCommand, [u8; 3])),
//     None,
// }

// fn bear_command_list(source: &str) -> IResult<&str, Vec<BearCommand>> {
//     let (source, cmds) = separated_list1(tag(", "), bear_command_prep)(source)?;
//     Ok((source, cmds))
// }

// fn colon_separator(source: &str) -> IResult<&str, &str> {
//     let (source, _) = opt(tag(":"))(source)?;
//     let (source, _) = space0(source)?;
//     Ok((source, ""))
// }

fn get_color_by_name(source: &str) -> IResult<&str, Option<[u8; 3]>> {
    let (source, check_color) = is_not(" ")(source)?;
    match Color::val().by_string(check_color.trim().to_string()) {
        Ok(rgb_data) => Ok((source, Some(rgb_data))),
        Err(_) => Ok((source, None)),
    }
}

// fn bear_command_prep(source: &str) -> IResult<&str, BearCommand> {
//     let (source, cmd) = tuple((body_part, colon_separator, get_color_by_name))(source)?;
//     match cmd.2 {
//         Some(rgb_data) => Ok((source, BearCommand::Color((cmd.0, cmd.2.unwrap())))),
//         None => Ok((source, BearCommand::None)),
//     }
// }

// fn body_part(source: &str) -> IResult<&str, TwitchCommand> {
//     let (source, part) = alt((part_head, part_body, part_keys, part_eyes))(source)?;
//     Ok((source, part))
// }

fn rgb_color(source: &str) -> IResult<&str, [u8; 3]> {
    let (source, color_string) = is_not(" ")(source)?;
    let rgb = Color::val()
        .by_string(color_string.trim().to_string())
        .unwrap();
    Ok((source, rgb))
}

fn bear_color_head(source: &str) -> IResult<&str, TwitchCommand> {
    let (source, rgb) = preceded(pair(tag("!head"), space1), rgb_color)(source)?;
    Ok((source, TwitchCommand::BearColorHead(rgb)))
}

fn bear_color_eyes(source: &str) -> IResult<&str, TwitchCommand> {
    let (source, rgb) = preceded(pair(tag("!eyes"), space1), rgb_color)(source)?;
    Ok((source, TwitchCommand::BearColorEyes(rgb)))
}

fn bear_color_keys(source: &str) -> IResult<&str, TwitchCommand> {
    let (source, rgb) = preceded(pair(tag("!keys"), space1), rgb_color)(source)?;
    Ok((source, TwitchCommand::BearColorKeys(rgb)))
}

fn bear_color_body(source: &str) -> IResult<&str, TwitchCommand> {
    let (source, rgb) = preceded(pair(tag("!body"), space1), rgb_color)(source)?;
    Ok((source, TwitchCommand::BearColorBody(rgb)))
}

fn err_fn(err: cpal::StreamError) {
    eprintln!("an error occurred on stream: {}", err);
}

// async fn rtmp_server() -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
//     let manager_sender = start();
//     println!("Listening for connections on port 1935");
//     let listener = TcpListener::bind("0.0.0.0:1935").await?;
//     let mut current_id = 0;
//     loop {
//         let (stream, connection_info) = listener.accept().await?;
//         let connection = Connection::new(current_id, manager_sender.clone());
//         println!(
//             "Connection {}: Connection received from {}",
//             current_id,
//             connection_info.ip()
//         );
//         spawn(connection.start_handshake(stream));
//         current_id = current_id + 1;
//     }
// }
