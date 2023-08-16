fn main() -> Result<()> {
    let window = "video capture";
    highgui::named_window(window, highgui::WINDOW_AUTOSIZE)?;
    let mut cam = videoio::VideoCapture::from_file("rtmp://127.0.0.1:1935/a/b", videoio::CAP_ANY)?;
    let opened = videoio::VideoCapture::is_opened(&cam)?;
    if !opened {
        panic!("Unable to open default camera!");
    }

    let mut first: Mat = Default::default();
    let mut second: Mat = Default::default();

    let mut loaded: bool = false;

    loop {
        if loaded == false {
            cam.read(&mut first)?;
            loaded = true;
        } else {
            second = first.clone();
            cam.read(&mut first)?;

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
            let _ = find_contours(
                &tmp,
                &mut contours,
                RETR_LIST,
                CHAIN_APPROX_SIMPLE,
                p,
            );

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
            dbg!(&x);
            dbg!(&y);
            let mut tcv: VectorOfPoint = Default::default();
            tcv.push(Point::new(x as i32, y as i32));

            let b: Rect = bounding_rect(&tcv).unwrap();
            let s: VecN<f64, 4> = Default::default();
            let _ = rectangle(&mut tmp, b, s, 30, 0, 0);

            highgui::imshow(window, &tmp)?;

            let key = highgui::wait_key(10)?;
            if key > 0 && key != 255 {
                break;
            }
        }
    }
    Ok(())
}