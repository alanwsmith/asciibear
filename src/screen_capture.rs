#![allow(unused_imports)]
use opencv::core::absdiff;
use opencv::core::in_range;
use opencv::core::Point;
use opencv::core::Rect;
use opencv::core::VecN;
use opencv::core::Vector;
use opencv::imgcodecs::imread;
use opencv::imgcodecs::imwrite;
use opencv::imgproc::bounding_rect;
use opencv::imgproc::cvt_color;
use opencv::imgproc::find_contours;
use opencv::imgproc::find_contours_with_hierarchy;
use opencv::imgproc::rectangle;
use opencv::imgproc::threshold;
use opencv::imgproc::CHAIN_APPROX_NONE;
use opencv::imgproc::CHAIN_APPROX_SIMPLE;
use opencv::imgproc::COLOR_BGR2GRAY;
use opencv::imgproc::COLOR_GRAY2BGR;
use opencv::imgproc::RETR_EXTERNAL;
use opencv::imgproc::RETR_LIST;
use opencv::imgproc::RETR_TREE;
use opencv::imgproc::THRESH_BINARY_INV;
use opencv::imgproc::THRESH_OTSU;
use opencv::types::VectorOfPoint;
use opencv::types::VectorOfVec4i;
use opencv::types::VectorOfVectorOfPoint;
use opencv::viz::Color;
use opencv::{highgui, videoio};
use opencv::{prelude::*, Result};
use tokio::time::Duration;
use serde_json::json;

pub async fn screen_capture(tx: tokio::sync::broadcast::Sender<String>) {

    let window = "video capture";
    // //highgui::named_window(window, highgui::WINDOW_AUTOSIZE)?;
    let mut cam = videoio::VideoCapture::from_file("rtmp://127.0.0.1:1935/a/b", videoio::CAP_ANY).unwrap();
    // // let mut cam = videoio::VideoCapture::from_file("rtmp://127.0.0.1:1935/a/b", videoio::CAP_ANY)?;
    let opened = videoio::VideoCapture::is_opened(&cam).unwrap();
    if !opened {
        panic!("Unable to open default camera!");
    }
    

    // - loop, send, works
    // -  y  ,  y  -  n
    // -  n  ,  y  -  y
    // -  y  ,  n  -  y
    // -  n  ,  n  -  y





    let mut first: Mat = Default::default();
    let mut second: Mat = Default::default();

    let mut loaded: bool = false;

    // let _ = tx.send("{}".to_string());
    
    // let payload = r#"{"key": "screen_position", "x": "x"}"#.to_string();
    // let _ = tx.send("{}".to_string());
    // std::thread::sleep(std::time::Duration::from_secs(32536000));

    loop {

        



        
        // let payload = r#"{"key": "screen_position", "x": "x"}"#.to_string();
        // let _ = tx.send(payload);

        if loaded == false {
            //cam.read(&mut first)?;
            cam.read(&mut first).unwrap();
            loaded = true;
        } else {
            second = first.clone();
            cam.read(&mut first).unwrap();
            // cam.read(&mut first)?;

            let mut tmp: Mat = Default::default();

            let mut lower: Vector<i32> = Default::default();
            let mut upper: Vector<i32> = Default::default();
            lower.push(254);
            lower.push(254);
            lower.push(254);
            upper.push(255);
            upper.push(255);
            upper.push(255);

            let _ = in_range(&second, &lower, &upper, &mut tmp);

            let mut thresh = Mat::default();

            let mut contours: VectorOfVectorOfPoint = Default::default();

            let p: Point = Default::default();
            let _ = find_contours(&tmp, &mut contours, RETR_LIST, CHAIN_APPROX_SIMPLE, p);

            let mut cont_counter = 0.0;
            let mut x: f32 = 0.0;
            let mut y: f32 = 0.0;

            contours.iter().for_each(|cont| {
                cont.clone().into_iter().for_each(|c| {
                    cont_counter += 1.0;
                    x += c.x as f32;
                    y += c.y as f32;
                });
            });

            x = x / cont_counter as f32;
            y = y / cont_counter as f32;

            
            let xi = x as u32;
            let yi = y as u32;
            // let x2 = xi.to_string();
            // let y2 = yi.to_string();
            // let mut payload = r#"
            //     {
            //     "key": "screen_position", 
            //     "x": ""#.to_string();
            //     payload.push_str(x2.as_str());
            // payload.push_str(r#", "y": ""#);
            // payload.push_str(y2.as_str());
            // payload.push_str(r#"}"#);


            let payload = json!({
                "key": "screen_position",
                "x": xi,
                "y": yi});



           // let payload = r#"{"key": "screen_position", "x": "x"}"#.to_string();

            let _ = tx.send(payload.to_string());
            tokio::time::sleep(Duration::from_secs(1)).await;


            // let _ = tx.send(payload);

    //         dbg!(&x);
    //         dbg!(&y);
    //         let mut tcv: VectorOfPoint = Default::default();
    //         tcv.push(Point::new(x as i32, y as i32));

    //         let b: Rect = bounding_rect(&tcv).unwrap();
    //         let s: VecN<f64, 4> = Default::default();
    //         let _ = rectangle(&mut tmp, b, s, 30, 0, 0);

    //         //highgui::imshow(window, &tmp)?;

    //         // let key = highgui::wait_key(10)?;
    //         // if key > 0 && key != 255 {
    //         //     break;
    //         // }
       


        }
     }

     //std::thread::sleep(std::time::Duration::from_secs(32536000));

    // Ok(())
}
