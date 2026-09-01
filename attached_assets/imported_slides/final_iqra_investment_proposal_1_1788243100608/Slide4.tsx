import React, { useState, useEffect, useRef } from "react";
import img_1 from "./assets/images/image_9.png";
import img_2 from "./assets/images/image_10.png";
import img_3 from "./assets/images/image_11.png";
import img_4 from "./assets/images/image_12.png";
import img_5 from "./assets/images/image_13.png";
import img_6 from "./assets/images/image_14.png";
import img_7 from "./assets/images/image_15.png";
import img_8 from "./assets/images/image_8.png";
const Slide4: React.FC = () => {
  const outerRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState({
    s: 1,
    x: 0,
    y: 0
  });
  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      const s = Math.min(w / 1280, h / 720);
      setLayout({
        s,
        x: (w - 1280 * s) / 2,
        y: (h - 720 * s) / 2
      });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return <div id="slide-4" ref={outerRef} className="w-screen h-screen overflow-hidden relative" style={{
    backgroundColor: "#000"
  }}><div id="slide-inner-4" style={{
      position: "absolute",
      width: "1280px",
      height: "720px",
      overflow: "hidden",
      transformOrigin: "top left",
      color: "#FFFFFF",
      backgroundColor: "#022C22",
      transform: `scale(${layout.s})`,
      left: layout.x + "px",
      top: layout.y + "px"
    }}><img key={0} src={img_1} alt="image.png" style={{
        position: "absolute",
        left: "0px",
        top: "0px",
        width: "1280px",
        height: "720px",
        boxSizing: "border-box",
        objectFit: "fill"
      }} /><img key={1} src={img_2} alt="image.png" style={{
        position: "absolute",
        left: "60px",
        top: "662px",
        width: "512px",
        height: "33px",
        boxSizing: "border-box",
        objectFit: "fill"
      }} /><div key={2} style={{
        position: "absolute",
        left: "60px",
        top: "60px",
        width: "546px",
        height: "64px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        padding: "0px 0px 0px 0px",
        wordWrap: "break-word"
      }}><p style={{
          textAlign: "left",
          lineHeight: "1.2",
          fontSize: "calc(34.5pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(34.5pt * var(--pptx-font-scale, 1))",
            fontFamily: "'Playfair Display SemiBold', 'Playfair Display', sans-serif",
            fontWeight: "600",
            color: "#FBBF24"
          }}>{"PROBLEM"}</span></p></div><div key={3} style={{
        position: "absolute",
        left: "60px",
        top: "132px",
        width: "520px",
        height: "2px",
        boxSizing: "border-box",
        backgroundColor: "#FBBF24"
      }} /><div key={4} style={{
        position: "absolute",
        left: "60px",
        top: "157.48px",
        width: "636.77px",
        height: "113.42px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        padding: "0px 0px 0px 0px",
        wordWrap: "break-word"
      }}><p style={{
          textAlign: "left",
          lineHeight: "1.56",
          fontSize: "calc(27pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(27pt * var(--pptx-font-scale, 1))",
            fontFamily: "'Playfair Display SemiBold', 'Playfair Display', sans-serif",
            fontWeight: "600",
            color: "#FBBF24"
          }}>{"Generative AI is manufacturing religious rulings it cannot authenticate"}</span></p></div><div key={5} style={{
        position: "absolute",
        left: "60px",
        top: "781.08px",
        width: "520px",
        height: "0px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        padding: "0px 0px 0px 0px",
        wordWrap: "break-word"
      }}><p style={{
          textAlign: "left",
          lineHeight: "1.919",
          fontSize: "calc(10.5pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(10.5pt * var(--pptx-font-scale, 1))",
            fontFamily: "Lato, 'Helvetica Neue', Arial, sans-serif",
            color: "#D1FAE5"
          }}>{"Source: Pew Research Center, 2025."}</span></p></div><div key={6} style={{
        position: "absolute",
        left: "1176.69px",
        top: "672.74px",
        width: "120.29px",
        height: "16.96px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        padding: "0px 0px 0px 0px",
        wordWrap: "break-word"
      }}><p style={{
          textAlign: "left",
          lineHeight: "1.2",
          fontSize: "calc(10.5pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(10.5pt * var(--pptx-font-scale, 1))",
            fontFamily: "Lato, 'Helvetica Neue', Arial, sans-serif",
            fontWeight: "300",
            color: "#6EE7B7"
          }}>{"03 / 15"}</span></p></div><div key={7} style={{
        position: "absolute",
        left: "110px",
        top: "303.49px",
        width: "573.35px",
        height: "38.78px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        padding: "0px 0px 0px 0px",
        wordWrap: "break-word"
      }}><p style={{
          textAlign: "left",
          lineHeight: "1.92",
          fontSize: "calc(15pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(15pt * var(--pptx-font-scale, 1))",
            fontFamily: "Lato, 'Helvetica Neue', Arial, sans-serif",
            color: "#D1FAE5"
          }}>{"General LLMs predict plausible text, not verified rulings"}</span></p></div><div key={8} style={{
        position: "absolute",
        left: "110px",
        top: "379.25px",
        width: "573.35px",
        height: "48.47px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        padding: "0px 0px 0px 0px",
        wordWrap: "break-word"
      }}><p style={{
          textAlign: "left",
          lineHeight: "1.2",
          fontSize: "calc(15pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(15pt * var(--pptx-font-scale, 1))",
            fontFamily: "Lato, 'Helvetica Neue', Arial, sans-serif",
            color: "#D1FAE5"
          }}>{"The result is doctrinal drift: fabricated citations, blended traditions, confident errors at scale"}</span></p></div><div key={9} style={{
        position: "absolute",
        left: "110px",
        top: "477.72px",
        width: "573.35px",
        height: "48.47px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        padding: "0px 0px 0px 0px",
        wordWrap: "break-word"
      }}><p style={{
          textAlign: "left",
          lineHeight: "1.2",
          fontSize: "calc(15pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(15pt * var(--pptx-font-scale, 1))",
            fontFamily: "Lato, 'Helvetica Neue', Arial, sans-serif",
            color: "#D1FAE5"
          }}>{"2 billion Muslims are already asking these questions online; a wrong answer carries real spiritual weight"}</span></p></div><div key={10} style={{
        position: "absolute",
        left: "110px",
        top: "584.54px",
        width: "573.35px",
        height: "48.47px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        padding: "0px 0px 0px 0px",
        wordWrap: "break-word"
      }}><p style={{
          textAlign: "left",
          lineHeight: "1.2",
          fontSize: "calc(15pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(15pt * var(--pptx-font-scale, 1))",
            fontFamily: "Lato, 'Helvetica Neue', Arial, sans-serif",
            color: "#D1FAE5"
          }}>{"No mainstream assistant grounds guidance in an authenticated chain of transmission"}</span></p></div><img key={11} src={img_3} alt="image.png" style={{
        position: "absolute",
        left: "70px",
        top: "310.58px",
        width: "24px",
        height: "26px",
        boxSizing: "border-box",
        objectFit: "fill"
      }} /><img key={12} src={img_4} alt="image.png" style={{
        position: "absolute",
        left: "70px",
        top: "395.64px",
        width: "21px",
        height: "26px",
        boxSizing: "border-box",
        objectFit: "fill"
      }} /><img key={13} src={img_5} alt="image.png" style={{
        position: "absolute",
        left: "70px",
        top: "491.01px",
        width: "30px",
        height: "26px",
        boxSizing: "border-box",
        objectFit: "fill"
      }} /><img key={14} src={img_6} alt="image.png" style={{
        position: "absolute",
        left: "70px",
        top: "597.83px",
        width: "24px",
        height: "26px",
        boxSizing: "border-box",
        objectFit: "fill"
      }} /><img key={15} src={img_7} alt="Leading Trainers of Generative AI for Leadership Course| Expert ..." style={{
        position: "absolute",
        left: "750.93px",
        top: "129.25px",
        width: "461.5px",
        height: "461.5px",
        boxSizing: "border-box",
        objectFit: "fill"
      }} /><div key={16} style={{
        position: "absolute",
        left: "162.19px",
        top: "682px",
        width: "308.05px",
        height: "17px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        padding: "0px 0px 0px 0px",
        wordWrap: "break-word"
      }}><p style={{
          textAlign: "left",
          lineHeight: "1.2",
          fontSize: "calc(10.5pt * var(--pptx-font-scale, 1))",
          marginTop: "0",
          marginBottom: "0"
        }}><span style={{
            fontSize: "calc(10.5pt * var(--pptx-font-scale, 1))",
            fontFamily: "Lato, 'Helvetica Neue', Arial, sans-serif",
            fontWeight: "300",
            color: "#6EE7B7"
          }}>{" 2026 "}</span><span style={{
            fontSize: "calc(10.5pt * var(--pptx-font-scale, 1))",
            fontFamily: "Lato, 'Helvetica Neue', Arial, sans-serif",
            fontWeight: "300",
            color: "#6EE7B7"
          }}>{"Iqra.live"}</span><span style={{
            fontSize: "calc(10.5pt * var(--pptx-font-scale, 1))",
            fontFamily: "Lato, 'Helvetica Neue', Arial, sans-serif",
            fontWeight: "300",
            color: "#6EE7B7"
          }}>{" & "}</span><span style={{
            fontSize: "calc(10.5pt * var(--pptx-font-scale, 1))",
            fontFamily: "Lato, 'Helvetica Neue', Arial, sans-serif",
            fontWeight: "300",
            color: "#6EE7B7"
          }}>{"iqra.chat"}</span><span style={{
            fontSize: "calc(10.5pt * var(--pptx-font-scale, 1))",
            fontFamily: "Lato, 'Helvetica Neue', Arial, sans-serif",
            fontWeight: "300",
            color: "#6EE7B7"
          }}>{". All rights reserved"}</span></p></div><img key={17} src={img_8} alt="Picture 5" style={{
        position: "absolute",
        left: "54.71px",
        top: "680.06px",
        width: "104.39px",
        height: "20.88px",
        boxSizing: "border-box",
        objectFit: "fill"
      }} /></div></div>;
};
export default Slide4;
